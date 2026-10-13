// Arena engine: renderer, camera, lights, particles and the map loader. Each map (js/maps/*.js)
// builds its own surface, props, crowd and gimmicks; the engine switches between them and
// answers geometry questions (is this point on the arena, how far to the edge) for the game.
window.MD = window.MD || {};
MD.MAPS = MD.MAPS || {};
MD.MAP_KEYS = ['lab', 'kitchen', 'disco', 'bath', 'playroom', 'pond', 'xmas', 'hackathon', 'space', 'ring', 'chess', 'ice', 'keyboard', 'sushi'];
MD.Arena = (function () {
  const A = { hw: 7, hd: 4.4, shape: 'rect', radius: 0, floorY: -7.4, fallMode: 'drop', obstacles: [], fx: [], crowd: [] };
  let renderer, scene, camera, shakeT = 0, shakeAmp = 0, screenCtx = null, mapTime = 0;
  const built = {}, lights = {};

  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    return { tex: t, ctx: g, canvas: c };
  }

  // ---------- Toolkit handed to map builders ----------
  const K = {
    canvasTex,
    box(w, h, d, m, x, y, z, parent, shadow) {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z); o.receiveShadow = true; o.castShadow = shadow !== false;
      parent.add(o); return o;
    },
    mesh(geo, m, parent, x, y, z, shadow) {
      const o = new THREE.Mesh(geo, m);
      o.position.set(x || 0, y || 0, z || 0); o.receiveShadow = true; o.castShadow = shadow !== false;
      parent.add(o); return o;
    },
    // The live "training monitor" texture, shown on whatever screen the map has.
    screen(parent, w, h) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: A.screenTex, toneMapped: false }));
      parent.add(s); return s;
    },
    // A row of rubber-duck spectators. They bob, cheer on big hits and gasp at ring-outs.
    crowd(parent, spots, out) {
      const make = MD.Items && MD.Items.makers.rubber;
      if (!make) return;
      spots.forEach(s => {
        const g = make(s.color); g.scale.setScalar(s.scale || 0.62);
        g.position.set(s.x, s.y, s.z); g.rotation.y = s.rotY != null ? s.rotY : -s.x * 0.05;
        parent.add(g); out.push({ g, baseY: s.y, t: Math.random() * 6, jump: 0, lean: 0, freq: s.freq || 2.2 });
      });
    },
  };
  A.kit = K;

  // ---------- Geometry queries used by the game ----------
  A.inside = function (x, z, m) {
    m = m || 0;
    return A.shape === 'circle' ? Math.hypot(x, z) < A.radius - m : Math.abs(x) < A.hw - m && Math.abs(z) < A.hd - m;
  };
  A.edgeDist = function (x, z) {
    return A.shape === 'circle' ? A.radius - Math.hypot(x, z) : Math.min(A.hw - Math.abs(x), A.hd - Math.abs(z));
  };
  // Height of the surface a duck stands on (cutting mat, cutting board, stove glass, dance tiles).
  A.groundAt = function (x, z) { return A.map && A.map.ground ? A.map.ground(x, z) : 0; };
  // A small puff of dust where something lands.
  const puffGeo = new THREE.SphereGeometry(0.09, 8, 6);
  A.dust = function (x, z, n, color) {
    const m = new THREE.MeshBasicMaterial({ color: color || 0xd9d2c4, transparent: true, opacity: 0.55, depthWrite: false });
    const y = A.groundAt(x, z) + 0.05;
    for (let i = 0; i < (n || 6); i++) {
      const o = new THREE.Mesh(puffGeo, m.clone()); const a = Math.random() * Math.PI * 2;
      o.position.set(x + Math.cos(a) * 0.2, y, z + Math.sin(a) * 0.2);
      addFx(o, Math.cos(a) * 1.4, 0.4 + Math.random() * 0.4, Math.sin(a) * 1.4, 0.45, { g: -0.5, fade: true, grow: true });
    }
  };
  A.clampInside = function (p, m) {
    if (A.shape === 'circle') {
      const l = Math.hypot(p.x, p.z), r = A.radius - m;
      if (l > r) { p.x *= r / l; p.z *= r / l; }
    } else {
      p.x = Math.max(-A.hw + m, Math.min(A.hw - m, p.x));
      p.z = Math.max(-A.hd + m, Math.min(A.hd - m, p.z));
    }
    return p;
  };
  // A random point in the area where items and hazards may appear.
  A.randomSpot = function () {
    if (A.shape === 'circle') {
      const r = (A.radius - 1.4) * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r };
    }
    const sw = A.map && A.map.spawn ? A.map.spawn[0] : A.hw - 2.6, sd = A.map && A.map.spawn ? A.map.spawn[1] : A.hd - 1.6;
    return { x: (Math.random() - 0.5) * 2 * sw, z: (Math.random() - 0.5) * 2 * sd };
  };

  // ---------- Map loading ----------
  A.loadMap = function (key) {
    const def = MD.MAPS[key] || MD.MAPS.lab;
    key = def.key;
    if (!built[key]) {
      const b = { group: new THREE.Group(), crowd: [], obstacles: [] };
      Object.assign(b, def.build(K, b) || {});
      scene.add(b.group); built[key] = b;
    }
    Object.keys(built).forEach(k => { built[k].group.visible = k === key; });
    const b = built[key];
    A.map = def; A.mapKey = key; A.mapBuilt = b;
    A.shape = def.shape || 'rect'; A.radius = def.radius || 0;
    A.hw = A.shape === 'circle' ? A.radius : def.hw; A.hd = A.shape === 'circle' ? A.radius : def.hd;
    A.floorY = def.floorY != null ? def.floorY : -7.4; A.fallMode = def.fallMode || 'drop';
    A.matMat = b.surfaceMat; A.obstacles = b.obstacles.slice(); A.crowd = b.crowd;
    const e = def.env;
    scene.background.setHex(e.bg); scene.fog.color.setHex(e.fog[0]); scene.fog.near = e.fog[1]; scene.fog.far = e.fog[2];
    lights.hemi.color.setHex(e.hemi[0]).convertSRGBToLinear(); lights.hemi.groundColor.setHex(e.hemi[1]).convertSRGBToLinear(); lights.hemi.intensity = e.hemi[2];
    lights.key.color.setHex(e.key[0]).convertSRGBToLinear(); lights.key.intensity = e.key[1];
    lights.rim.color.setHex(e.rim[0]).convertSRGBToLinear(); lights.rim.intensity = e.rim[1];
    lights.warm.color.setHex(e.warm[0]).convertSRGBToLinear(); lights.warm.intensity = e.warm[1];
    renderer.toneMappingExposure = e.exposure || 1.05;
    return def;
  };
  A.mapRound = function (G) { if (A.mapBuilt && A.mapBuilt.onRound) A.mapBuilt.onRound(G); };
  A.mapClear = function () { if (A.mapBuilt && A.mapBuilt.onClear) A.mapBuilt.onClear(); };

  // ---------- Training monitor texture (drawn every few frames, shown on a map's screen) ----------
  A.drawMonitor = function (d) {
    if (!screenCtx) return;
    const g = screenCtx, w = 1024, h = 576;
    g.fillStyle = '#0e1116'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b2029'; g.fillRect(0, 0, w, 54);
    g.fillStyle = '#f5c518'; g.font = '800 26px "Chivo", sans-serif'; g.fillText('microduck_fight', 24, 36);
    g.fillStyle = '#8d98a8'; g.font = '20px "Chivo Mono", monospace';
    g.fillText(`PPO · run ${d.run} · episode ${d.episode.toLocaleString()} · ${d.hz} Hz · ${A.map ? A.map.name : ''}`, 270, 35);
    const x0 = 60, y0 = 90, cw = 600, ch = 380;
    g.strokeStyle = '#232a35'; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = y0 + (ch * i) / 4; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + cw, y); g.stroke(); }
    g.fillStyle = '#5d6878'; g.font = '16px "Chivo Mono", monospace';
    ['100', '75', '50', '25', '0'].forEach((s, i) => g.fillText(s, 18, y0 + (ch * i) / 4 + 5));
    g.fillText('integrity % over the round', x0, y0 + ch + 30);
    d.series.forEach((s) => {
      if (s.data.length < 2) return;
      g.strokeStyle = s.color; g.lineWidth = 4; g.beginPath();
      s.data.forEach((v, i) => { const x = x0 + (i / (d.maxLen - 1)) * cw, y = y0 + ch * (1 - v / 100); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
      const lv = s.data[s.data.length - 1], lx = x0 + ((s.data.length - 1) / (d.maxLen - 1)) * cw;
      g.fillStyle = s.color; g.beginPath(); g.arc(lx, y0 + ch * (1 - lv / 100), 7, 0, Math.PI * 2); g.fill();
    });
    const px = 700;
    g.fillStyle = '#8d98a8'; g.font = '18px "Chivo Mono", monospace'; g.fillText('LIVE LOG', px, 100);
    g.font = '19px "Chivo", sans-serif';
    const lines = d.log.slice(-9);
    lines.forEach((line, i) => { g.fillStyle = i === lines.length - 1 ? '#f3eee4' : '#7f8a99'; wrapText(g, line, px, 136 + i * 46, 300); });
    A.screenTex.needsUpdate = true;
  };
  function wrapText(g, text, x, y, maxW) {
    const words = text.split(' '); let line = '', yy = y;
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = wd; yy += 21; if (yy > y + 21) break; } else line = t; }
    g.fillText(line, x, yy);
  }

  // ---------- Particles ----------
  const spriteTex = {};
  function glyphTex(ch, color) {
    const k = ch + color; if (spriteTex[k]) return spriteTex[k];
    return (spriteTex[k] = canvasTex(128, 128, (g) => { g.font = '800 96px "Chivo", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#1d1b22'; g.strokeText(ch, 64, 70); g.fillStyle = color; g.fillText(ch, 64, 70); }).tex);
  }
  const sparkGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
  const screwGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6);
  function addFx(o, vx, vy, vz, life, opts) {
    scene.add(o);
    A.fx.push(Object.assign({ o, vx, vy, vz, life, max: life, g: -14, spin: 0 }, opts || {}));
  }
  A.addFx = addFx;
  A.sparks = function (p, color, n) {
    const m = new THREE.MeshBasicMaterial({ color: color || 0xf5c518 });
    for (let i = 0; i < (n || 10); i++) {
      const o = new THREE.Mesh(sparkGeo, m); o.position.copy(p);
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      addFx(o, Math.cos(a) * s, 1.5 + Math.random() * 4, Math.sin(a) * s, 0.35 + Math.random() * 0.3, { shrink: true });
    }
  };
  A.screws = function (p, n) {
    const m = MD.mat(0x9aa0a8, 0.3, 0.8);
    for (let i = 0; i < (n || 2); i++) {
      const o = new THREE.Mesh(screwGeo, m); o.position.copy(p); o.castShadow = true;
      const a = Math.random() * Math.PI * 2;
      addFx(o, Math.cos(a) * 3, 4 + Math.random() * 3, Math.sin(a) * 3, 2.2, { spin: 14, floor: 0.03, bounce: true });
    }
  };
  A.glyph = function (p, ch, color, opts) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glyphTex(ch, color || '#f5c518'), transparent: true, depthWrite: false }));
    s.position.copy(p); const sc = (opts && opts.size) || 0.5; s.scale.set(sc, sc, sc);
    addFx(s, (Math.random() - 0.5) * 0.6, (opts && opts.vy) || 1.4, (Math.random() - 0.5) * 0.3, (opts && opts.life) || 1.4, { g: 0, fade: true, sway: true });
  };
  A.confetti = function (center) {
    const cols = [0xf5c518, 0xf0631f, 0xb8a5dd, 0x8cc4ea, 0xf3eee4, 0x5bd66f];
    for (let i = 0; i < 140; i++) {
      const o = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
      o.position.set(center.x + (Math.random() - 0.5) * 6, 5 + Math.random() * 3, center.z + (Math.random() - 0.5) * 4);
      addFx(o, (Math.random() - 0.5) * 2, -Math.random(), (Math.random() - 0.5) * 2, 4 + Math.random() * 2, { g: -1.2, spin: 6, flutter: true });
    }
  };
  // Hat flies off with the world transform it had on the head.
  A.flingHat = function (hat, dir) {
    if (!hat) return;
    scene.attach(hat);
    addFx(hat, (dir ? dir.x : 0) * 2.5 + (Math.random() - 0.5) * 2, 5 + Math.random() * 2, (dir ? dir.z : 0) * 2.5 + (Math.random() - 0.5) * 2, 3.2, { spin: 9, floor: 0.05, bounce: true, g: -16 });
  };

  A.cheer = function (amount) {
    let n = 0;
    A.crowd.forEach(c => { if (Math.random() < amount) { c.jump = 0.55; n++; } });
    if (n && MD.Audio.squeak) MD.Audio.squeak();
  };
  A.gasp = function () { A.crowd.forEach(c => { c.lean = 1; }); };
  function updateCrowd(dt) {
    A.crowd.forEach(c => {
      c.t += dt;
      if (c.jump > 0) c.jump -= dt;
      c.lean = Math.max(0, c.lean - dt * 0.8);
      const j = c.jump > 0 ? Math.sin((0.55 - c.jump) / 0.55 * Math.PI) * 0.6 : 0;
      c.g.position.y = c.baseY + Math.abs(Math.sin(c.t * c.freq)) * 0.04 + j;
      c.g.rotation.x = -c.lean * 0.5 + Math.sin(c.t * 1.7) * 0.04;
      c.g.rotation.z = Math.sin(c.t * c.freq) * 0.06;
    });
  }

  A.shake = function (amp, t) { shakeAmp = Math.max(shakeAmp, amp); shakeT = Math.max(shakeT, t || 0.25); };

  A.updateFx = function (dt) {
    mapTime += dt;
    updateCrowd(dt);
    if (A.mapBuilt && A.mapBuilt.update) A.mapBuilt.update(dt, mapTime, MD.Game);
    for (let i = A.fx.length - 1; i >= 0; i--) {
      const f = A.fx[i]; f.life -= dt;
      if (f.life <= 0) { scene.remove(f.o); A.fx.splice(i, 1); continue; }
      f.vy += f.g * dt;
      if (f.flutter) { f.vx += (Math.random() - 0.5) * 4 * dt; f.vz += (Math.random() - 0.5) * 4 * dt; f.vy = Math.max(f.vy, -1.6); }
      f.o.position.x += f.vx * dt; f.o.position.y += f.vy * dt; f.o.position.z += f.vz * dt;
      if (f.sway) f.o.position.x += Math.sin(f.life * 6) * 0.01;
      if (f.spin) { f.o.rotation.x += f.spin * dt; f.o.rotation.y += f.spin * 0.7 * dt; }
      if (f.floor != null && f.o.position.y < f.floor && A.inside(f.o.position.x, f.o.position.z)) {
        f.o.position.y = f.floor; f.vy = Math.abs(f.vy) * 0.35; f.vx *= 0.6; f.vz *= 0.6; f.spin *= 0.6;
      }
      if (f.shrink) f.o.scale.setScalar(Math.max(0.01, f.life / f.max));
      if (f.grow) f.o.scale.setScalar(1 + (1 - f.life / f.max) * 2.5);
      if (f.fade) f.o.material.opacity = Math.min(1, f.life / (f.max * 0.4));
    }
  };

  A.init = function (container) {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!MD.REC });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x221f29);
    scene.fog = new THREE.Fog(0x221f29, 22, 48);
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 140);
    camera.position.set(0, 9, 13);
    A.scene = scene; A.camera = camera; A.renderer = renderer;

    lights.hemi = new THREE.HemisphereLight(0xcfd8ff, 0x3b2c22, 0.6); scene.add(lights.hemi);
    const key = lights.key = new THREE.DirectionalLight(0xfff1dc, 1.35);
    key.position.set(-6, 14, 8); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -10, right: 10, top: 8, bottom: -8, near: 1, far: 44 });
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
    scene.add(key);
    lights.rim = new THREE.DirectionalLight(0x8cc4ea, 0.55); lights.rim.position.set(5, 6, -10); scene.add(lights.rim);
    lights.warm = new THREE.PointLight(0xffb36b, 0.6, 30); lights.warm.position.set(8, 6, 4); scene.add(lights.warm);

    const mon = canvasTex(1024, 576, () => {});
    A.screenTex = mon.tex; screenCtx = mon.ctx;

    // Laser pointer dot.
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.95, toneMapped: false }));
    dot.rotation.x = -Math.PI / 2; dot.position.y = 0.05; dot.visible = false; scene.add(dot);
    const halo = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.25, toneMapped: false, depthWrite: false }));
    halo.position.z = -0.001; dot.add(halo);
    A.laserDot = dot;

    A.loadMap('lab');
    window.addEventListener('resize', A.resize); A.resize();
  };
  A.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h); camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 55 : 38;
    camera.updateProjectionMatrix();
  };
  // Camera follows the midpoint of the fighters, zooming with their separation.
  A.camState = { x: 0, z: 0, dist: 12, lookY: 1 };
  A.updateCamera = function (dt, focus, spread, orbit, zoom) {
    const C = A.camState, k = 1 - Math.exp(-dt * (zoom ? 5 : 3));
    if (!isFinite(C.x + C.z + C.dist)) { C.x = 0; C.z = 0; C.dist = 12; }
    // Keep both ducks in frame horizontally, which matters most on tall phone screens.
    const hf = Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect);
    const fit = (spread / 2 + 1.8) / Math.tan(hf) * 0.95;
    const want = zoom || Math.max(8.5, Math.min(camera.aspect < 0.8 ? 24 : 15, Math.max(7.5 + spread * 0.9, fit)));
    C.x += (focus.x * 0.75 - C.x) * k; C.z += (focus.z * 0.6 - C.z) * k; C.dist += (want - C.dist) * k;
    let ox = 0, oz = C.dist;
    if (orbit != null) { ox = Math.sin(orbit) * C.dist; oz = Math.cos(orbit) * C.dist; }
    camera.position.set(C.x + ox, C.dist * 0.62, C.z + oz);
    if (shakeT > 0) { shakeT -= dt; camera.position.x += (Math.random() - 0.5) * shakeAmp; camera.position.y += (Math.random() - 0.5) * shakeAmp; } else shakeAmp = 0;
    // Aim slightly in front of the action so the arena sits higher and the bottom strip stays free for messages.
    camera.lookAt(C.x, C.lookY, C.z + (zoom ? 0 : 0.9));
  };
  A.render = function () { renderer.render(scene, camera); };
  return A;
})();
