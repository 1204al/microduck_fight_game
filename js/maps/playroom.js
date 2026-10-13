// Map: Playroom. A kids' table with a "Duck Town" road mat, LEGO bricks that hurt to step on,
// an RC car that races across, letter-block towers, a toy train on the floor, and teddy bears watching.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.makeLego = function (c) {
  const m = new THREE.Group(), bm = MD.mat(c, 0.35);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.26), bm); body.position.y = 0.1; body.castShadow = true; m.add(body);
  [-0.125, 0.125].forEach(x => { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), bm); s.position.set(x, 0.23, 0); m.add(s); });
  return m;
};
MD.makeRcCar = function () {
  const rc = new THREE.Group(), M = MD.mat;
  const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; rc.add(o); return o; };
  add(MD.rbox(1.0, 0.35, 0.6, 0.12), M(0xd8322c, 0.3), 0, 0.32, 0);
  add(MD.rbox(0.5, 0.25, 0.5, 0.1), M(0x1d1b22, 0.2), -0.1, 0.55, 0);
  [[0.35, 0.3], [0.35, -0.3], [-0.35, 0.3], [-0.35, -0.3]].forEach(([x, z]) => { add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14), M(0x111111, 0.8), x, 0.16, z).rotation.x = Math.PI / 2; });
  add(new THREE.CylinderGeometry(0.01, 0.01, 0.7, 4), M(0x111111, 0.5), -0.35, 0.8, 0.2);
  return rc;
};
MD.ICON_MAKERS.lego = () => MD.makeLego(0xd8322c);
MD.ICON_MAKERS.rc = () => MD.makeRcCar();
MD.MAPS.playroom = {
  key: 'playroom', name: 'Playroom', swatch: 'linear-gradient(135deg,#5bd66f 0 35%,#f5c518 35% 65%,#3f7fb3 65%)',
  blurb: 'A kids’ table in the toy room. Watch out for LEGO bricks and the RC car that cuts through the fight. Teddy bears are judging.',
  shape: 'rect', hw: 6.4, hd: 4.0, spawn: [4.0, 2.5], floorY: -5.0, music: 'fight',
  ground: (x, z) => (Math.abs(x) < 6 && Math.abs(z) < 3.6 ? 0.02 : 0),
  env: { bg: 0xcfe8ff, fog: [0xcfe8ff, 26, 60], hemi: [0xffffff, 0x8a8aa0, 0.85], key: [0xfff6e4, 1.25], rim: [0xffd6f0, 0.5], warm: [0xfff0c0, 0.5], exposure: 1.0 },
  ringout: ['{b} fell off the kids’ table. No robots on the table, that is the rule.', '{b} is on the floor with the other toys now.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    // Road play mat.
    const mat = K.canvasTex(2048, 1228, (c, w, h) => {
      c.fillStyle = '#7ccf6a'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#5a5f6a';
      [[0, 330, w, 150], [0, 820, w, 150], [560, 0, 150, h], [1380, 0, 150, h]].forEach(r => c.fillRect(...r));
      c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.setLineDash([50, 40]);
      [[0, 405, w, 405], [0, 895, w, 895]].forEach(([a, b2, cc, d]) => { c.beginPath(); c.moveTo(a, b2); c.lineTo(cc, d); c.stroke(); });
      [[635, 0, 635, h], [1455, 0, 1455, h]].forEach(([a, b2, cc, d]) => { c.beginPath(); c.moveTo(a, b2); c.lineTo(cc, d); c.stroke(); });
      c.setLineDash([]);
      const house = (x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 120, 100); c.fillStyle = '#d8322c'; c.beginPath(); c.moveTo(x - 15, y); c.lineTo(x + 60, y - 70); c.lineTo(x + 135, y); c.fill(); c.fillStyle = '#ffe48a'; c.fillRect(x + 20, y + 25, 30, 30); c.fillRect(x + 72, y + 25, 30, 30); };
      house(140, 120, '#f6efe2'); house(900, 140, '#8cc4ea'); house(1700, 110, '#f6b6c8'); house(180, 1030, '#f5c518'); house(1700, 1040, '#b8a5dd');
      c.fillStyle = '#5ab4e6'; c.beginPath(); c.ellipse(1000, 620, 170, 90, 0, 0, 7); c.fill();
      c.fillStyle = '#ffd21f'; c.beginPath(); c.ellipse(990, 610, 22, 16, 0, 0, 7); c.fill(); c.beginPath(); c.arc(1006, 594, 12, 0, 7); c.fill();
      c.font = '900 110px "Lilita One", sans-serif'; c.fillStyle = '#ffffff'; c.strokeStyle = '#2b2b33'; c.lineWidth = 10; c.textAlign = 'center';
      c.strokeText('DUCK TOWN', w / 2, 1180); c.fillText('DUCK TOWN', w / 2, 1180);
    }).tex;
    K.mesh(MD.rbox(13.2, 0.5, 8.4, 0.25), M(0xf5c518, 0.45), g, 0, -0.25, 0);
    b.surfaceMat = M(0xffffff, 0.9, 0, { map: mat });
    K.mesh(new THREE.BoxGeometry(12, 0.02, 7.2), b.surfaceMat, g, 0, 0.01, 0, false);
    [[-5.8, -3.4, 0xd8322c], [5.8, -3.4, 0x3f7fb3], [-5.8, 3.4, 0x3f7fb3], [5.8, 3.4, 0xd8322c]].forEach(([x, z, c]) => K.mesh(new THREE.CylinderGeometry(0.4, 0.45, 4.6, 16), M(c, 0.45), g, x, -2.8, z));
    // Foam puzzle-tile floor.
    const foam = K.canvasTex(256, 256, (c) => { const cols = ['#ff8a3d', '#5bd66f', '#8cc4ea', '#f5c518']; for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { c.fillStyle = cols[(x + y * 2) % 4]; c.fillRect(x * 128, y * 128, 128, 128); c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(x * 128 + 52, y * 128, 24, 12); } }).tex;
    foam.wrapS = foam.wrapT = THREE.RepeatWrapping; foam.repeat.set(20, 20);
    K.mesh(new THREE.PlaneGeometry(90, 90), M(0xffffff, 0.95, 0, { map: foam }), g, 0, -5.02, 0, false).rotation.x = -Math.PI / 2;
    // Wall with crayon drawings.
    const wallTex = K.canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#d6ecff'; c.fillRect(0, 0, w, h);
      c.lineWidth = 8; c.lineCap = 'round';
      c.strokeStyle = '#f5c518'; c.beginPath(); c.arc(140, 120, 50, 0, 7); c.stroke();
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; c.beginPath(); c.moveTo(140 + Math.cos(a) * 65, 120 + Math.sin(a) * 65); c.lineTo(140 + Math.cos(a) * 95, 120 + Math.sin(a) * 95); c.stroke(); }
      c.strokeStyle = '#3f7fb3'; c.beginPath(); c.moveTo(320, 380); c.lineTo(420, 300); c.lineTo(520, 380); c.closePath(); c.stroke(); c.strokeRect(340, 380, 160, 110);
      c.strokeStyle = '#ff8a3d'; c.beginPath(); c.ellipse(760, 330, 90, 60, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(830, 250, 40, 0, 7); c.stroke(); c.beginPath(); c.moveTo(868, 248); c.lineTo(910, 258); c.stroke();
      c.font = '900 56px "Chivo", sans-serif'; c.fillStyle = '#d94fa0'; c.fillText('I ♥ ROBOTS', 600, 120);
    }).tex;
    K.mesh(new THREE.PlaneGeometry(40, 20), M(0xffffff, 0.95, 0, { map: wallTex }), g, 0, 5, -12, false);
    // TV on the wall shows the training chart (it is a very smart playroom).
    const tv = new THREE.Group(); tv.position.set(8.5, 6.5, -11.8); g.add(tv);
    K.box(5.4, 3.2, 0.25, M(0x1d1b22, 0.4), 0, 0, -0.1, tv); K.screen(tv, 5.1, 2.9);
    // Letter-block towers on the back corners (solid).
    const letters = ['A', 'B', 'C', 'D', 'U', 'K'];
    const blockTex = letters.map((L, i) => K.canvasTex(128, 128, (c) => { c.fillStyle = ['#d8322c', '#3f7fb3', '#5bd66f', '#f5c518', '#b8a5dd', '#ff8a3d'][i]; c.fillRect(0, 0, 128, 128); c.fillStyle = '#ffffff'; c.font = '900 90px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L, 64, 70); }).tex);
    [[-5.4, -3.2], [5.4, -3.2]].forEach(([x, z], t) => {
      for (let k = 0; k < 3; k++) { const m = K.mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ map: blockTex[(t * 3 + k) % 6], roughness: 0.6 }), g, x + (Math.random() - 0.5) * 0.12, 0.4 + k * 0.8, z); m.rotation.y = (Math.random() - 0.5) * 0.5; }
      b.obstacles.push({ x, z, r: 0.6 });
    });
    // Teddy bears and rubber ducks on a toy bench behind the table.
    K.box(12, 0.5, 1.6, M(0xb98a5e, 0.6), 0, -1.6, -6.4, g);
    const furA = M(0xa8743e, 0.95), furB = M(0xd9b48a, 0.95), eye = M(0x1d1b22, 0.3);
    [-4.5, -1.5, 1.5, 4.5].forEach((x, i) => {
      const bear = new THREE.Group(); bear.position.set(x, -1.35, -6.4); g.add(bear);
      const fur = i % 2 ? furB : furA;
      K.mesh(new THREE.SphereGeometry(0.6, 16, 12), fur, bear, 0, 0.55, 0);
      const head = K.mesh(new THREE.SphereGeometry(0.45, 16, 12), fur, bear, 0, 1.35, 0.05);
      [-0.32, 0.32].forEach(ex => K.mesh(new THREE.SphereGeometry(0.16, 10, 8), fur, head, ex, 0.32, 0));
      K.mesh(new THREE.SphereGeometry(0.17, 10, 8), furB, head, 0, -0.08, 0.38);
      [-0.15, 0.15].forEach(ex => K.mesh(new THREE.SphereGeometry(0.05, 8, 6), eye, head, ex, 0.1, 0.4, false));
      b.crowd.push({ g: bear, baseY: -1.35, t: Math.random() * 6, jump: 0, lean: 0, freq: 2.0 });
    });
    K.crowd(g, [{ color: 0xffd21f, x: -3, y: -1.35, z: -6.3, scale: 0.7 }, { color: 0x8cc4ea, x: 0, y: -1.35, z: -6.3, scale: 0.7 }, { color: 0xf6b6c8, x: 3, y: -1.35, z: -6.3, scale: 0.7 }], b.crowd);
    // Toy train circling on the floor.
    const train = new THREE.Group(); g.add(train);
    [0xd8322c, 0x3f7fb3, 0x5bd66f].forEach((c, i) => { const car = K.mesh(MD.rbox(1.2, 0.8, 0.8, 0.12), M(c, 0.4), train, -i * 1.4, 0.4, 0); if (!i) K.mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 10), M(0x1d1b22, 0.4), car, 0.3, 0.6, 0); });
    const track = K.mesh(new THREE.TorusGeometry(9.5, 0.08, 6, 80), M(0x8a5a2b, 0.6), g, 0, -4.98, 0, false); track.rotation.x = Math.PI / 2;

    // LEGO bricks: stepping on one hurts.
    const bricks = [0xd8322c, 0x3f7fb3, 0xf5c518, 0x5bd66f, 0xf3eee4].map(c => {
      const m = MD.makeLego(c); g.add(m); return { m, x: 0, z: 0, vx: 0, vz: 0, y: 0, vy: 0, cd: 0, gone: false };
    });
    const place = () => bricks.forEach(k => {
      let p; for (let i = 0; i < 20; i++) { p = MD.Arena.randomSpot(); if (Math.abs(Math.abs(p.x) - 2.6) > 1 || Math.abs(p.z) > 1) break; }
      Object.assign(k, { x: p.x, z: p.z, vx: 0, vz: 0, y: 0.02, vy: 0, cd: 0, gone: false }); k.m.visible = true; k.m.rotation.y = Math.random() * 3;
    });
    place();
    // RC car racing across the table.
    const rc = MD.makeRcCar(); rc.visible = false; g.add(rc);
    const car = { on: false, t: 8, x: 0, z: 0, dir: 1, hit: new Set() };

    b.onRound = () => { place(); car.on = false; rc.visible = false; car.t = 6 + Math.random() * 4; };
    b.update = function (dt, t, G) {
      const a = t * 0.25; train.position.set(Math.cos(a) * 9.5, -5, Math.sin(a) * 9.5); train.rotation.y = -a;
      if (G.phase === 'fight' && !car.on) { car.t -= dt; if (car.t <= 0) { car.on = true; car.dir = Math.random() < 0.5 ? 1 : -1; car.z = (Math.random() - 0.5) * 5; car.x = -car.dir * 7.5; car.hit.clear(); rc.visible = true; rc.rotation.y = car.dir > 0 ? 0 : Math.PI; MD.Audio.tone(220, 0.6, 'sawtooth', 0.08, 480); if (Math.random() < 0.5) G.sayRaw('An RC car cuts through the fight. No license, no insurance.'); } }
      if (car.on) {
        car.x += car.dir * 8 * dt;
        rc.position.set(car.x, Math.abs(car.x) < 6.4 ? 0.02 : -0.1, car.z);
        for (const f of G.fighters) {
          if (car.hit.has(f) || f.y > 0.6 || f.state === 'fall') continue;
          if (Math.abs(f.z - car.z) < 0.75 && Math.abs(f.x - car.x) < 0.8) { car.hit.add(f); G.envHit(f, 5, car.dir, (f.z - car.z) * 0.4, 7, 3.5); G.bub(f, 'vac', 1, true); }
        }
        if (Math.abs(car.x) > 8) { car.on = false; rc.visible = false; car.t = 9 + Math.random() * 5; }
      }
      for (const k of bricks) {
        if (k.gone) continue;
        k.cd -= dt;
        k.x += k.vx * dt; k.z += k.vz * dt; k.vx *= Math.pow(0.08, dt); k.vz *= Math.pow(0.08, dt);
        if (!MD.Arena.inside(k.x, k.z)) { k.vy -= 14 * dt; k.y += k.vy * dt; if (k.y < -5) { k.gone = true; k.m.visible = false; } }
        k.m.position.set(k.x, k.y, k.z); k.m.rotation.y += Math.hypot(k.vx, k.vz) * dt;
        if (G.phase !== 'fight' || k.y < 0 || k.cd > 0) continue;
        for (const f of G.fighters) {
          if (f.y > 0.2 || !G.canBeHit(f)) continue;
          const dx = k.x - f.x, dz = k.z - f.z, d = Math.hypot(dx, dz);
          if (d < 0.45) {
            k.cd = 1.2; k.vx = (dx / (d || 1)) * 5; k.vz = (dz / (d || 1)) * 5;
            G.envHit(f, 4, -dx || 0.1, -dz, 1.2, 4.5); G.bub(f, 'lego', 1, true);
            if (Math.random() < 0.5) G.sayRaw(f.cw.name + ' stepped on a LEGO. The most painful thing known to robotics.');
          }
        }
      }
    };
  },
};
