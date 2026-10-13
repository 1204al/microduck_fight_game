// Pickups, projectiles and random desk events, most of them lifted from the real Microduck launch:
// it picks up socks, follows a laser dot, has optional roller-skate wheels, about an hour of battery,
// a meme coin that pumped 370% in a day, and a "Butter Robot vibe".
window.MD = window.MD || {};
MD.Items = (function () {
  const I = { makers: {}, list: [], shots: [], laser: { active: false, t: 0, x: 0, z: 0, tx: 0, tz: 0, retarget: 0 }, butterT: 0, ball: null, lastEvent: null };
  const M = (c, r, m) => MD.mat(c, r, m);
  const scene = () => MD.Arena.scene;

  function shadowAll(g) { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }

  MD.makeSock = function (color) {
    const g = new THREE.Group();
    const base = M(color || 0xf3eee4, 0.9), stripe = M(0xf0631f, 0.9);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.36, 12), base); leg.position.y = 0.18; g.add(leg);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 12), stripe); cuff.position.y = 0.33; g.add(cuff);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.04, 12), stripe); band.position.y = 0.22; g.add(band);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 12), base); foot.rotation.x = Math.PI / 2; foot.position.set(0, 0.02, 0.1); g.add(foot);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), stripe); toe.position.set(0, 0.02, 0.23); g.add(toe);
    return shadowAll(g);
  };
  function batteryMesh() {
    const g = new THREE.Group();
    const b = new THREE.Mesh(MD.rbox(0.5, 0.28, 0.3, 0.06), M(0x6fd0e6, 0.4)); b.position.y = 0.14; g.add(b);
    const c = new THREE.Mesh(MD.rbox(0.1, 0.14, 0.16, 0.03), M(0xf3eee4, 0.4)); c.position.set(0.29, 0.14, 0); g.add(c);
    const s = new THREE.Mesh(MD.rbox(0.36, 0.06, 0.31, 0.02), M(0x1d1b22, 0.5)); s.position.y = 0.14; g.add(s);
    return shadowAll(g);
  }
  function skatesMesh() {
    const g = new THREE.Group(), pm = M(0xf5c518, 0.5), wm = M(0x222222, 0.8);
    [-0.2, 0.2].forEach(x => {
      const p = new THREE.Mesh(MD.rbox(0.24, 0.06, 0.46, 0.03), pm); p.position.set(x, 0.12, 0); g.add(p);
      [-0.14, 0.14].forEach(z => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 14), wm); w.rotation.z = Math.PI / 2; w.position.set(x, 0.07, z); g.add(w); });
    });
    return shadowAll(g);
  }
  let coinTex = null;
  function coinMesh() {
    if (!coinTex) {
      const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
      x.fillStyle = '#f5c518'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#b8860b'; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.stroke();
      x.fillStyle = '#7a5a00'; x.font = '800 54px "Chivo", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$M', 64, 68);
      coinTex = new THREE.CanvasTexture(c); coinTex.encoding = THREE.sRGBEncoding;
    }
    const face = new THREE.MeshStandardMaterial({ map: coinTex, metalness: 0.6, roughness: 0.3 }), edge = M(0xd4a017, 0.3, 0.7);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 28), [edge, face, face]);
    m.rotation.x = Math.PI / 2; const g = new THREE.Group(); m.position.y = 0.45; g.add(m); g.userData.spin = m;
    return shadowAll(g);
  }
  function butterMesh() {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.34, 0.04, 24), M(0xf3eee4, 0.3)); plate.position.y = 0.02; g.add(plate);
    const b = new THREE.Mesh(MD.rbox(0.46, 0.2, 0.3, 0.04), M(0xfbe38a, 0.35)); b.position.y = 0.14; g.add(b);
    return shadowAll(g);
  }
  function ballMesh() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#f3eee4'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#1d1b22';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { x.beginPath(); x.arc(i * 46 + (j % 2) * 23 + 10, j * 44 + 20, 12, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
    m.castShadow = true; return m;
  }

  function freeSpot(fighters) {
    for (let tries = 0; tries < 30; tries++) {
      const p = MD.Arena.randomSpot();
      if (fighters.every(f => Math.hypot(f.x - p.x, f.z - p.z) > 1.4)) return p;
    }
    return { x: 0, z: 0 };
  }

  I.spawn = function (type, x, z, opts) {
    const mk = I.makers[type] || { sock: () => MD.makeSock([0xf3eee4, 0xf6b6c8, 0x8cc4ea][Math.floor(Math.random() * 3)]), battery: batteryMesh, skates: skatesMesh, coin: coinMesh, butter: butterMesh }[type];
    const mesh = mk(); mesh.position.set(x, (opts && opts.y != null) ? opts.y : 7, z); mesh.rotation.y = Math.random() * 6;
    scene().add(mesh);
    const it = { type, mesh, x, z, y: mesh.position.y, vy: 0, landed: false, t: 0, life: 22 };
    I.list.push(it); return it;
  };
  // A fresh mesh for any item type (used by the field-guide icon renderer).
  I.meshFor = function (type) {
    const b = { sock: () => MD.makeSock(0xf3eee4), battery: batteryMesh, skates: skatesMesh, coin: coinMesh, butter: butterMesh, ball: ballMesh };
    const f = I.makers[type] || b[type];
    return f ? f() : null;
  };
  I.removeItem = function (it) { scene().remove(it.mesh); I.list.splice(I.list.indexOf(it), 1); };

  I.spawnBall = function (fighters) {
    if (I.ball) scene().remove(I.ball.mesh);
    const p = freeSpot(fighters), mesh = ballMesh(); mesh.position.set(p.x, 6, p.z); scene().add(mesh);
    I.ball = { mesh, x: p.x, z: p.z, y: 6, vx: 0, vz: 0, vy: 0, life: 18, kicker: null, cool: 0 };
  };

  I.throwSock = function (f, sockMesh, kind) {
    const dir = { x: Math.sin(f.face), z: Math.cos(f.face) };
    const wp = new THREE.Vector3(); sockMesh.getWorldPosition(wp);
    sockMesh.parent && sockMesh.parent.remove(sockMesh);
    sockMesh.position.copy(wp); scene().add(sockMesh);
    I.shots.push({ mesh: sockMesh, x: wp.x, y: Math.max(1.2, wp.y), z: wp.z, vx: dir.x * 10, vz: dir.z * 10, vy: 2.2, owner: f, life: 1.6, kind: kind || 'sock' });
  };

  // Events: weight, announce text, start function.
  I.EVENTS = {
    laser: { w: 3, h: 'Laser pointer detected', p: 'Must... follow... the dot. Catch it for battery.', go(G) { const L = I.laser; L.active = true; L.t = 6; const s = freeSpot(G.fighters); L.x = s.x; L.z = s.z; L.tx = s.x; L.tz = s.z; L.retarget = 0; MD.Arena.laserDot.visible = true; } },
    socks: { w: 3, h: 'Laundry day', p: 'Walk over a sock to grab it, then peck to throw it. A hit covers their camera.', go(G) { for (let i = 0; i < 3; i++) { const s = freeSpot(G.fighters); setTimeout(() => G.running() && I.spawn('sock', s.x, s.z, { y: 7 + i }), i * 350); } } },
    skates: { w: 2, h: 'Optional wheels', p: 'Grab the skates: double-speed dash, absolutely no brakes.', go(G) { const s = freeSpot(G.fighters); I.spawn('skates', s.x, s.z); } },
    coin: { w: 2, h: '$MICRODUCK is pumping', p: 'Grab the meme coin for +370% beak power. A rug pull is likely.', go(G) { const s = freeSpot(G.fighters); I.spawn('coin', s.x, s.z); } },
    butter: { w: 2, h: 'What is my purpose?', p: 'You pass butter. Whoever grabs it greases the whole desk.', go(G) { const s = freeSpot(G.fighters); I.spawn('butter', s.x, s.z); } },
    battery: { w: 2, h: 'Spare battery', p: 'Real battery life is about one hour. Here it is about ninety seconds.', go(G) { const s = freeSpot(G.fighters); I.spawn('battery', s.x, s.z); } },
    ball: { w: 2, h: 'Football mode', p: 'A ball for multi-robot experiments. Kick it into the other duck.', go(G) { I.spawnBall(G.fighters); } },
    update: { w: 1, h: 'Firmware update', p: 'Installing v0.0.7 on both ducks. Please do not unplug your duck.', go(G) { G.fighters.forEach(f => { if (G.canAct(f)) { f.stunT = 1.4; } }); setTimeout(() => G.running() && MD.UI.feed('Changelog: fixed a bug where ducks were too friendly to each other.'), 1700); } },
  };
  I.randomEvent = function (G) {
    const keys = Object.keys(I.EVENTS).filter(k => k !== I.lastEvent && !(k === 'laser' && I.laser.active) && (!I.EVENTS[k].can || I.EVENTS[k].can(G)));
    const mw = (MD.Arena.map && MD.Arena.map.eventWeights) || {}, w = k => (mw[k] != null ? mw[k] : I.EVENTS[k].w);
    let total = keys.reduce((a, k) => a + w(k), 0), r = Math.random() * total;
    if (!keys.length) return;
    let pick = keys[0];
    for (const k of keys) { r -= w(k); if (r <= 0) { pick = k; break; } }
    I.lastEvent = pick;
    const e = I.EVENTS[pick];
    MD.UI.banner(e.h, e.p);
    MD.Audio.boot();
    e.go(G);
  };

  I.update = function (dt, G) {
    const fs = G.fighters, t = G.time;
    // Falling and idle bobbing items, pickups.
    for (let i = I.list.length - 1; i >= 0; i--) {
      const it = I.list[i]; it.t += dt; it.life -= dt;
      if (!it.landed) {
        it.vy -= 18 * dt; it.y += it.vy * dt;
        const gy = MD.Arena.groundAt(it.x, it.z) + 0.02;
        if (it.y <= gy) { it.y = gy; if (Math.abs(it.vy) > 3) { it.vy = -it.vy * 0.3; MD.Audio.land(); } else { it.vy = 0; it.landed = true; } }
      }
      it.mesh.position.set(it.x, it.y + (it.landed && it.type !== 'sock' ? Math.sin(t * 4 + i) * 0.05 + 0.05 : 0), it.z);
      if (it.type !== 'sock') it.mesh.rotation.y += dt * 1.6;
      if (it.mesh.userData.spin) it.mesh.userData.spin.rotation.z += dt * 5;
      if (it.life < 3) it.mesh.visible = Math.floor(it.life * 8) % 2 === 0;
      if (it.life <= 0) { I.removeItem(it); continue; }
      if (!it.landed && it.y > 1) continue;
      for (const f of fs) {
        if (!G.canAct(f) || f.y > 0.6) continue;
        if (Math.hypot(f.x - it.x, f.z - it.z) > 0.72) continue;
        if ((it.type === 'sock' || it.type === 'snowball') && f.holding) continue;
        G.pickup(f, it);
        I.removeItem(it);
        break;
      }
    }
    // Thrown socks.
    for (let i = I.shots.length - 1; i >= 0; i--) {
      const s = I.shots[i]; s.life -= dt;
      s.vy -= 6 * dt; s.x += s.vx * dt; s.z += s.vz * dt; s.y += s.vy * dt;
      s.mesh.position.set(s.x, s.y, s.z); s.mesh.rotation.x += dt * 14;
      let done = s.life <= 0 || s.y < 0.05;
      for (const f of fs) {
        if (f === s.owner || done) continue;
        if (Math.hypot(f.x - s.x, f.z - s.z) < 0.62 && s.y < f.y + 2.7 && G.canBeHit(f)) {
          G.sockHit(s.owner, f, s.mesh, s.kind); done = 'hit';
        }
      }
      if (done) {
        I.shots.splice(i, 1);
        if (done !== 'hit') { scene().remove(s.mesh); if (s.kind === 'snowball') MD.Arena.sparks(new THREE.Vector3(s.x, Math.max(0.1, s.y), s.z), 0xe8f6ff, 10); else if (MD.Arena.inside(s.x, s.z, 0.3)) I.spawn('sock', s.x, s.z, { y: Math.max(0.1, s.y) }); }
      }
    }
    // Laser dot.
    const L = I.laser;
    if (L.active) {
      L.t -= dt; L.retarget -= dt;
      if (L.retarget <= 0) { L.retarget = 0.7 + Math.random() * 0.8; const p = MD.Arena.randomSpot(); L.tx = p.x; L.tz = p.z; }
      const dx = L.tx - L.x, dz = L.tz - L.z, d = Math.hypot(dx, dz);
      if (d > 0.01) { const sp = Math.min(d, 4.2 * dt); L.x += (dx / d) * sp; L.z += (dz / d) * sp; }
      L.x += (Math.random() - 0.5) * 0.03; L.z += (Math.random() - 0.5) * 0.03;
      MD.Arena.laserDot.position.set(L.x, MD.Arena.groundAt(L.x, L.z) + 0.012, L.z);
      MD.Arena.laserDot.scale.setScalar(1 + Math.sin(t * 30) * 0.1);
      if (Math.random() < dt * 3) MD.Audio.zap();
      for (const f of fs) {
        if (!G.canAct(f) || (f.laserCd || 0) > 0) continue;
        if (Math.hypot(f.x - L.x, f.z - L.z) < 0.5) { f.laserCd = 1.2; G.caughtLaser(f); L.retarget = 0; }
      }
      if (L.t <= 0) { L.active = false; MD.Arena.laserDot.visible = false; }
    }
    // Butter.
    if (I.butterT > 0) {
      I.butterT -= dt;
      const k = Math.min(1, I.butterT) * 0.55;
      MD.Arena.matMat.color.setRGB(1, 1 - k * 0.05, 1 - k * 0.6);
      MD.Arena.matMat.roughness = 0.85 - k;
    }
    // Ball.
    const B = I.ball;
    if (B) {
      B.life -= dt; B.cool -= dt;
      B.vy -= 18 * dt; B.y += B.vy * dt;
      const onDesk = MD.Arena.inside(B.x, B.z);
      const bg = MD.Arena.groundAt(B.x, B.z) + 0.3;
      if (B.y < bg && onDesk) { B.y = bg; if (B.vy < -2) { B.vy = -B.vy * 0.45; } else B.vy = 0; }
      const fr = Math.pow(I.butterT > 0 || (MD.Arena.map && MD.Arena.map.slippery) ? 0.9 : 0.55, dt);
      if (MD.Arena.map && MD.Arena.map.ropes) { const A = MD.Arena, m = 0.4; if (Math.abs(B.x) > A.hw - m) { B.x = Math.sign(B.x) * (A.hw - m); B.vx = -B.vx * 0.9; } if (Math.abs(B.z) > A.hd - m) { B.z = Math.sign(B.z) * (A.hd - m); B.vz = -B.vz * 0.9; } }
      B.vx *= fr; B.vz *= fr; B.x += B.vx * dt; B.z += B.vz * dt;
      B.mesh.position.set(B.x, B.y, B.z);
      B.mesh.rotation.x += B.vz * dt / 0.3; B.mesh.rotation.z -= B.vx * dt / 0.3;
      const bs = Math.hypot(B.vx, B.vz);
      for (const f of fs) {
        if (f.state === 'fall' || f.y > 1.2) continue;
        const dx = B.x - f.x, dz = B.z - f.z, d = Math.hypot(dx, dz);
        if (d < 0.78 && d > 0.001) {
          if (bs > 5 && B.kicker && B.kicker !== f && G.canBeHit(f)) { G.ballHit(B.kicker, f, B); B.vx *= -0.3; B.vz *= -0.3; B.kicker = null; continue; }
          if (B.cool > 0) continue;
          const fv = Math.hypot(f.vx, f.vz), kick = Math.max(5.5, fv * 1.8) * (f.state === 'headbutt' || f.state === 'dash' ? 1.8 : 1);
          B.vx = (dx / d) * kick; B.vz = (dz / d) * kick; B.vy = 3; B.kicker = f; B.cool = 0.15;
          B.x = f.x + (dx / d) * 0.8; B.z = f.z + (dz / d) * 0.8;
          MD.Audio.thump();
        }
      }
      if (B.life <= 0 || B.y < -8) { scene().remove(B.mesh); I.ball = null; }
    }
  };

  I.clear = function () {
    I.list.slice().forEach(I.removeItem);
    I.shots.forEach(s => scene().remove(s.mesh)); I.shots = [];
    I.laser.active = false; MD.Arena.laserDot.visible = false;
    I.butterT = 0; MD.Arena.matMat.color.setRGB(1, 1, 1); MD.Arena.matMat.roughness = 0.85;
    if (I.ball) { scene().remove(I.ball.mesh); I.ball = null; }
  };
  return I;
})();
