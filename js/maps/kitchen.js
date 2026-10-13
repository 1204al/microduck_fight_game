// Map: Kitchen Counter. Marble counter against a tiled wall (no falling off the back), a toaster that
// fires toast, a stove burner that heats up, and an egg carton audience on the shelf.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.ICON_MAKERS.burner = () => {
  const b = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.04, 40), MD.mat(0x111114, 0.15, 0.3)); b.add(glass);
  [0.75, 0.42].forEach(r => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 8, 40), new THREE.MeshBasicMaterial({ color: 0xff3a1a, toneMapped: false })); t.rotation.x = Math.PI / 2; t.position.y = 0.04; b.add(t); });
  return b;
};
MD.MAPS.kitchen = {
  key: 'kitchen', name: 'Kitchen Counter', swatch: 'linear-gradient(135deg,#f4f1ec 0 50%,#7fc8b4 50% 75%,#e8443a 75%)',
  blurb: 'Breakfast is served. The toaster fires toast (eat it for integrity), the stove burner heats up, and the backsplash keeps you from falling off the back.',
  shape: 'rect', hw: 7.2, hd: 3.8, spawn: [4.6, 2.2], floorY: -8.6, music: 'fight', backWall: true,
  ground: (x, z) => (Math.hypot(x - 3.6, z - 1.4) < 1.1 ? 0.075 : Math.abs(x) < 4.5 && z > -2.4 && z < 2.8 ? 0.06 : 0),
  env: { bg: 0xa9d6ea, fog: [0xa9d6ea, 26, 60], hemi: [0xfff6e8, 0x8a7a6a, 0.85], key: [0xfff4e0, 1.25], rim: [0xbfe6ff, 0.5], warm: [0xffd29a, 0.5], exposure: 1.0 },
  ringout: ['{b} fell off the counter. The five-second rule does not apply to robots.', '{b} hit the kitchen floor. Somebody grab the mop.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const marble = K.canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#f4f1ec'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        c.strokeStyle = `rgba(110,105,120,${0.12 + Math.random() * 0.2})`; c.lineWidth = 1 + Math.random() * 3;
        c.beginPath(); let x = Math.random() * w, y = Math.random() * h; c.moveTo(x, y);
        for (let k = 0; k < 14; k++) { x += 30 + Math.random() * 50; y += (Math.random() - 0.5) * 60; c.lineTo(x, y); }
        c.stroke();
      }
    }).tex;
    const board = K.canvasTex(1024, 600, (c, w, h) => {
      c.fillStyle = '#d9a66b'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { c.strokeStyle = `rgba(120,70,30,${0.04 + Math.random() * 0.08})`; c.lineWidth = 1 + Math.random() * 3; const y = Math.random() * h; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 8, w * 0.6, y - 8, w, y + 4); c.stroke(); }
      c.strokeStyle = 'rgba(110,62,25,0.35)'; c.lineWidth = 10; c.strokeRect(34, 34, w - 68, h - 68);
      c.fillStyle = 'rgba(110,62,25,0.55)'; c.font = '800 34px "Chivo", sans-serif'; c.fillText('NO DUCKS ON THE CUTTING BOARD', 70, h - 60);
    }).tex;
    const tiles = K.canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#c9c4bb'; c.fillRect(0, 0, w, h);
      for (let r = 0; r < 8; r++) for (let k = -1; k < 5; k++) { c.fillStyle = r % 3 === 1 && k === 2 ? '#7fc8b4' : '#f7f6f2'; c.fillRect(k * 128 + (r % 2) * 64 + 3, r * 64 + 3, 122, 58); }
    }).tex;
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(5, 2.5);
    const checker = K.canvasTex(256, 256, (c) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? '#2b2b33' : '#e9e4da'; c.fillRect(x * 64, y * 64, 64, 64); } }).tex;
    checker.wrapS = checker.wrapT = THREE.RepeatWrapping; checker.repeat.set(16, 16);

    // Counter, cabinets, floor, backsplash, upper cabinets, window.
    K.box(14.4, 0.5, 7.6, M(0xffffff, 0.3, 0, { map: marble }), 0, -0.25, 0, g, false);
    b.surfaceMat = M(0xffffff, 0.7, 0, { map: board });
    K.mesh(new THREE.BoxGeometry(9, 0.06, 5.2), b.surfaceMat, g, 0, 0.03, 0.2, false);
    const mint = M(0x7fc8b4, 0.55), chrome = M(0xd8dde3, 0.25, 0.9);
    K.box(14, 8.1, 7, mint, 0, -4.55, -0.2, g, false);
    for (let i = 0; i < 4; i++) { K.box(3.2, 7.4, 0.06, M(0x8fd3c0, 0.5), -5.1 + i * 3.4, -4.6, 3.32, g, false); K.box(0.12, 1.4, 0.12, chrome, -3.9 + i * 3.4, -1.6, 3.42, g, false); }
    K.mesh(new THREE.PlaneGeometry(90, 90), M(0xffffff, 0.8, 0, { map: checker }), g, 0, -8.62, 0, false).rotation.x = -Math.PI / 2;
    K.mesh(new THREE.PlaneGeometry(30, 12), M(0xffffff, 0.6, 0, { map: tiles }), g, 0, 5.5, -3.86, false);
    [-7.2, 7.2].forEach(x => { K.box(5.4, 3.4, 2, mint, x, 9, -3, g, false); K.box(0.1, 1.2, 0.1, chrome, x + (x < 0 ? 2.2 : -2.2), 8.2, -1.95, g, false); });
    const sky = K.canvasTex(256, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7cc4f2'); gr.addColorStop(1, '#d9f0fb'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#ffe48a'; c.beginPath(); c.arc(190, 70, 30, 0, 7); c.fill(); c.fillStyle = '#ffffff'; [[60, 120], [100, 110], [80, 100]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill(); }); }).tex;
    const win = new THREE.Group(); win.position.set(0, 7.2, -3.84); g.add(win);
    K.mesh(new THREE.PlaneGeometry(6, 3.6), new THREE.MeshBasicMaterial({ map: sky }), win, 0, 0, 0.01, false);
    [[0, 1.85, 6.4, 0.2], [0, -1.85, 6.4, 0.2], [-3.1, 0, 0.2, 3.9], [3.1, 0, 0.2, 3.9], [0, 0, 0.12, 3.6]].forEach(([x, y, w, h]) => K.box(w, h, 0.16, M(0xffffff, 0.5), x, y, 0.08, win, false));
    // Shelf with the egg carton audience and a tablet showing the training chart.
    K.box(9, 0.15, 0.8, M(0xb98a5e, 0.6), 0, 1.75, -3.45, g);
    const tab = new THREE.Group(); tab.position.set(-5.4, 1.15, -3.55); tab.rotation.x = -0.18; g.add(tab);
    K.box(2.7, 1.6, 0.08, M(0x1d1b22, 0.4), 0, 0, -0.05, tab); K.screen(tab, 2.5, 1.4);
    b.obstacles.push({ x: -5.4, z: -3.3, r: 0.45 });
    const eggM = M(0xf6efe2, 0.6), brown = M(0xd9a877, 0.6), eye = M(0x1d1b22, 0.3);
    for (let i = 0; i < 6; i++) {
      const egg = new THREE.Group(), x = -2.6 + i * 1.05; egg.position.set(x, 2.17, -3.45); g.add(egg);
      K.mesh(new THREE.SphereGeometry(0.3, 16, 12), i % 3 === 1 ? brown : eggM, egg, 0, 0, 0).scale.set(0.85, 1.15, 0.85);
      [-0.09, 0.09].forEach(ex => K.mesh(new THREE.SphereGeometry(0.035, 8, 6), eye, egg, ex, 0.08, 0.24, false));
      b.crowd.push({ g: egg, baseY: 2.17, t: Math.random() * 6, jump: 0, lean: 0, freq: 2.4 });
    }
    K.crowd(g, [{ color: 0xffd21f, x: 3.6, y: 1.83, z: -3.45, scale: 0.5 }, { color: 0xf6b6c8, x: 4.4, y: 1.83, z: -3.45, scale: 0.5 }], b.crowd);

    // Toaster (back left) and fruit bowl (back right) are solid.
    const toaster = new THREE.Group(); toaster.position.set(-3.2, 0, -3.1); g.add(toaster);
    K.mesh(MD.rbox(1.6, 1.1, 0.95, 0.22), chrome, toaster, 0, 0.55, 0);
    [-0.35, 0.35].forEach(x => K.box(0.22, 0.04, 0.6, M(0x1d1b22, 0.5), x, 1.1, 0, toaster, false));
    K.box(0.12, 0.3, 0.12, M(0x1d1b22, 0.5), 0.86, 0.6, 0, toaster);
    b.obstacles.push({ x: -3.2, z: -3.1, r: 0.85 });
    const bowl = new THREE.Group(); bowl.position.set(4.6, 0, -3.0); g.add(bowl);
    K.mesh(new THREE.SphereGeometry(0.8, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0x3f7fb3, 0.4, 0, { side: THREE.DoubleSide }), bowl, 0, 0.8, 0);
    [[0, 0.75, 0, 0xd8322c], [0.35, 0.7, 0.2, 0x5bd66f], [-0.3, 0.7, -0.2, 0xf39a1e], [0.1, 1.0, -0.1, 0xd8322c]].forEach(([x, y, z, c]) => K.mesh(new THREE.SphereGeometry(0.26, 14, 10), M(c, 0.35), bowl, x, y, z));
    const banana = K.mesh(new THREE.TorusGeometry(0.4, 0.09, 8, 16, Math.PI * 0.8), M(0xf5d33a, 0.5), bowl, -0.1, 1.05, 0.15); banana.rotation.set(0.4, 0.3, 0.2);
    b.obstacles.push({ x: 4.6, z: -3.0, r: 0.85 });
    const shaker = (x, c) => { const s = K.mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.6, 16), M(c, 0.4), g, x, 0.3, 3.1); K.mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, 7, 0, 1.6), chrome, s, 0, 0.3, 0); };
    shaker(6.3, 0xf7f6f2); shaker(6.75, 0x2b2b33);

    // Stove burner: a glass ring that warms up, glows red and burns duck feet.
    const burner = new THREE.Group(); burner.position.set(3.6, 0.065, 1.4); g.add(burner);
    K.mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 40), M(0x111114, 0.15, 0.3), burner, 0, 0, 0, false);
    const glowM = new THREE.MeshBasicMaterial({ color: 0x331010, toneMapped: false });
    const ring = K.mesh(new THREE.TorusGeometry(0.75, 0.07, 8, 40), glowM, burner, 0, 0.02, 0, false); ring.rotation.x = Math.PI / 2;
    const ring2 = K.mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 30), glowM, burner, 0, 0.02, 0, false); ring2.rotation.x = Math.PI / 2;
    const heat = new THREE.PointLight(0xff4a2a, 0, 4); heat.position.set(3.6, 0.6, 1.4); g.add(heat);

    const toastM = M(0xd9a35b, 0.8), crust = M(0x8a5a2b, 0.8);
    MD.Items.makers.toast = function () {
      const t = new THREE.Group();
      const m = new THREE.Mesh(MD.rbox(0.55, 0.08, 0.5, 0.06), toastM); m.position.y = 0.06; m.castShadow = true; t.add(m);
      const c = new THREE.Mesh(MD.rbox(0.6, 0.06, 0.55, 0.06), crust); c.position.y = 0.04; t.add(c);
      return t;
    };

    const st = { burnT: 7, phase: 'off', tick: 0, toastT: 6, flying: [], warned: false };
    b.onRound = () => { st.burnT = 7; st.phase = 'off'; st.toastT = 5 + Math.random() * 3; };
    b.onClear = () => { st.flying.forEach(f => g.remove(f.mesh)); st.flying = []; };
    b.update = function (dt, t, G) {
      const live = G.phase === 'fight';
      // Burner cycle: off, warming, hot.
      if (live) st.burnT -= dt;
      if (st.burnT <= 0) {
        if (st.phase === 'off') { st.phase = 'warm'; st.burnT = 1.5; }
        else if (st.phase === 'warm') { st.phase = 'hot'; st.burnT = 4; G.sayRaw(Math.random() < 0.5 ? 'Who left the stove on?' : 'The burner is on. Do not stand on the burner.'); }
        else { st.phase = 'off'; st.burnT = 8 + Math.random() * 4; }
      }
      const k = st.phase === 'hot' ? 1 : st.phase === 'warm' ? 0.35 : 0;
      glowM.color.setRGB(0.2 + k * 0.8 + Math.sin(t * 8) * 0.05 * k, 0.06 + k * 0.18, 0.05);
      heat.intensity = k * (1.6 + Math.sin(t * 10) * 0.2);
      if (st.phase === 'hot' && live) {
        st.tick -= dt;
        if (Math.random() < dt * 6) MD.Arena.sparks(new THREE.Vector3(3.6 + (Math.random() - 0.5) * 1.2, 0.15, 1.4 + (Math.random() - 0.5) * 1.2), 0xff6a2a, 1);
        if (st.tick <= 0) {
          st.tick = 0.5;
          for (const f of G.fighters) {
            const dx = f.x - 3.6, dz = f.z - 1.4;
            if (f.y < 0.2 && Math.hypot(dx, dz) < 1.05 && G.canBeHit(f)) { G.envHit(f, 3, dx || 0.1, dz, 2.5, 4); G.bub(f, 'hot', 0.8); }
          }
        }
      }
      // Toaster fires toast onto the counter every so often.
      if (live) st.toastT -= dt;
      if (st.toastT <= 0) {
        st.toastT = 9 + Math.random() * 5;
        const to = MD.Arena.randomSpot(), mesh = MD.Items.makers.toast(); g.add(mesh);
        st.flying.push({ mesh, t: 0, from: { x: -3.2, z: -3.1 }, to });
        MD.Audio.tone(320, 0.12, 'square', 0.12, 900); MD.Audio.tone(700, 0.08, 'triangle', 0.1, null, 0.1);
        if (Math.random() < 0.5) G.sayRaw('Toast is up. Grab it for integrity, it is a balanced breakfast.');
      }
      for (let i = st.flying.length - 1; i >= 0; i--) {
        const f = st.flying[i]; f.t += dt / 1.1;
        const p = Math.min(1, f.t);
        f.mesh.position.set(f.from.x + (f.to.x - f.from.x) * p, 1.2 + Math.sin(p * Math.PI) * 4.5 - p * 1.2, f.from.z + (f.to.z - f.from.z) * p);
        f.mesh.rotation.x += dt * 9; f.mesh.rotation.z += dt * 5;
        if (p >= 1) { g.remove(f.mesh); st.flying.splice(i, 1); MD.Items.spawn('toast', f.to.x, f.to.z, { y: 0.05 }); MD.Audio.land(); }
      }
    };
  },
};
