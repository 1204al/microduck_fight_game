// Map: Duck Pond. A wooden raft on a sunny pond. Real ducks paddle around and watch the robot ducks,
// a frog hops across the raft, fish jump, and falling off means a splash.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.makeFrog = function () {
  const frog = new THREE.Group(), M = MD.mat;
  const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; frog.add(o); return o; };
  add(new THREE.SphereGeometry(0.32, 14, 10), M(0x5bd66f, 0.5), 0, 0.22, 0).scale.set(1, 0.7, 1.2);
  [-0.15, 0.15].forEach(x => { add(new THREE.SphereGeometry(0.1, 8, 6), M(0xf3eee4, 0.3), x, 0.42, 0.18); add(new THREE.SphereGeometry(0.05, 6, 4), M(0x111111, 0.2), x, 0.44, 0.26); });
  return frog;
};
MD.ICON_MAKERS.frog = () => MD.makeFrog();
MD.MAPS.pond = {
  key: 'pond', name: 'Duck Pond', swatch: 'linear-gradient(135deg,#b07a48 0 40%,#4aa3c8 40% 80%,#5bd66f 80%)',
  blurb: 'A wooden raft on a pond. The real ducks are watching and they are not impressed. Mind the frog, it has right of way.',
  shape: 'rect', hw: 5.8, hd: 3.6, spawn: [3.8, 2.2], floorY: -2.4, fallMode: 'sink', music: 'fight',
  sinkColors: [0xffffff, 0x6ec3e0],
  env: { bg: 0x9fd4f2, fog: [0x9fd4f2, 30, 75], hemi: [0xf4fbff, 0x4a6a3a, 0.9], key: [0xfff2d6, 1.35], rim: [0xbfe6ff, 0.5], warm: [0xffe2a4, 0.4], exposure: 1.0 },
  ringout: ['{b} fell in the pond. The real ducks are laughing.', '{b} is sleeping with the fishes. Briefly.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const planks = K.canvasTex(1024, 640, (c, w, h) => {
      for (let i = 0; i < 8; i++) {
        c.fillStyle = ['#b07a48', '#a8703f', '#bb8452', '#a46a3a'][i % 4]; c.fillRect(0, i * 80, w, 78);
        for (let k = 0; k < 18; k++) { c.strokeStyle = `rgba(70,40,15,${0.05 + Math.random() * 0.1})`; c.lineWidth = 1 + Math.random() * 2; const y = i * 80 + Math.random() * 78; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 4, w * 0.7, y - 4, w, y); c.stroke(); }
        c.fillStyle = 'rgba(40,20,5,0.6)'; c.fillRect(0, i * 80 + 76, w, 4);
        [60, w - 60].forEach(x => { c.fillStyle = '#3a3a3a'; c.beginPath(); c.arc(x, i * 80 + 40, 6, 0, 7); c.fill(); });
      }
    }).tex;
    b.surfaceMat = M(0xffffff, 0.85, 0, { map: planks });
    K.box(11.6, 0.5, 7.2, b.surfaceMat, 0, -0.25, 0, g);
    const rope = M(0xd9c08a, 0.9);
    [-4.2, 0, 4.2].forEach(x => K.box(0.18, 0.54, 7.3, rope, x, -0.25, 0, g, false));
    [[-5.4, -3.2], [5.4, -3.2], [-5.4, 3.2], [5.4, 3.2]].forEach(([x, z]) => K.mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.9, 14), M(0x3f7fb3, 0.4), g, x, -0.55, z, false));

    // Pond water, lily pads, reeds, rocks, a dock, trees.
    const ripple = K.canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#3f97bd'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 2;
      for (let i = 0; i < 50; i++) { const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * 40; c.beginPath(); c.ellipse(x, y, r, r * 0.4, 0, 0, 7); c.stroke(); }
    }).tex;
    ripple.wrapS = ripple.wrapT = THREE.RepeatWrapping; ripple.repeat.set(8, 8);
    K.mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: ripple, roughness: 0.2, metalness: 0.1 }), g, 0, -0.42, 0, false).rotation.x = -Math.PI / 2;
    const padGeo = new THREE.CircleGeometry(0.8, 20, 0.3, Math.PI * 2 - 0.6);
    const pads = [];
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 7;
      const p = K.mesh(padGeo, M(0x4f9a3a, 0.7, 0, { side: THREE.DoubleSide }), g, Math.cos(a) * r, -0.4, Math.sin(a) * r * 0.7, false);
      p.rotation.set(-Math.PI / 2, 0, Math.random() * 6); p.scale.setScalar(0.7 + Math.random() * 0.7);
      if (i % 4 === 0) K.mesh(new THREE.SphereGeometry(0.25, 10, 8), M(0xf6b6c8, 0.5), p, 0.1, 0.1, 0.12, false);
      pads.push({ p, ph: Math.random() * 6 });
    }
    const reedM = M(0x6a8a3a, 0.8), tail = M(0x6a3e1e, 0.9);
    for (let i = 0; i < 40; i++) {
      const x = -16 + Math.random() * 32, z = -11 - Math.random() * 3, h = 2 + Math.random() * 2.5;
      const r = K.mesh(new THREE.CylinderGeometry(0.04, 0.06, h, 5), reedM, g, x, -0.4 + h / 2, z, false); r.rotation.z = (Math.random() - 0.5) * 0.3;
      if (i % 3 === 0) K.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), tail, r, 0, h / 2 - 0.2, 0, false);
    }
    K.mesh(new THREE.PlaneGeometry(140, 40), M(0x5aa64a, 0.95), g, 0, -0.38, -34, false).rotation.x = -Math.PI / 2;
    [[-14, -18, 3.2], [-6, -22, 4], [4, -20, 3.5], [13, -17, 3], [20, -24, 4.5], [-22, -24, 4.2]].forEach(([x, z, s]) => {
      K.mesh(new THREE.CylinderGeometry(0.4, 0.5, s * 1.4, 8), M(0x6a3e1e, 0.9), g, x, s * 0.7 - 0.4, z, false);
      K.mesh(new THREE.SphereGeometry(s, 14, 10), M(0x3f8a3a, 0.9), g, x, s * 1.8, z, false);
    });
    const dock = new THREE.Group(); dock.position.set(-11, 0, -8); dock.rotation.y = 0.3; g.add(dock);
    K.box(3, 0.25, 7, M(0x8a5a2b, 0.9), 0, 0.1, 0, dock); [-1.3, 1.3].forEach(x => [-3, 0, 3].forEach(z => K.mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 8), M(0x6a3e1e, 0.9), dock, x, -0.8, z, false)));
    const sign = new THREE.Group(); sign.position.set(-10.5, 1.4, -10.5); sign.rotation.y = 0.3; g.add(sign);
    K.mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), M(0x6a3e1e, 0.9), sign, 0, -0.6, 0);
    K.box(4.6, 2.6, 0.12, M(0x1d1b22, 0.4), 0, 1.4, 0, sign); const scr = K.screen(sign, 4.4, 2.45); scr.position.set(0, 1.4, 0.07);

    // Real ducks (mallards and ducklings) are the crowd.
    const mallard = (male) => {
      const d = new THREE.Group();
      K.mesh(new THREE.SphereGeometry(0.5, 16, 12), M(male ? 0x8a8a84 : 0x8a6a48, 0.8), d, 0, 0.25, 0).scale.set(0.8, 0.6, 1.3);
      K.mesh(new THREE.SphereGeometry(0.28, 14, 10), M(male ? 0x1f6a3a : 0x7a5a38, 0.5), d, 0, 0.62, 0.45);
      K.mesh(new THREE.BoxGeometry(0.14, 0.06, 0.3), M(0xf5c518, 0.5), d, 0, 0.58, 0.75);
      K.mesh(new THREE.ConeGeometry(0.15, 0.3, 8), M(0x3a2a20, 0.7), d, 0, 0.35, -0.65).rotation.x = -1.9;
      return d;
    };
    const ducks = [];
    [[-7, -5.5, true], [-3, -6.5, false], [2, -6.2, true], [6.5, -5.4, false], [8.5, 1, true], [-8.5, 2, false]].forEach(([x, z, m]) => {
      const d = mallard(m); d.position.set(x, -0.5, z); d.rotation.y = Math.atan2(-x, -z); g.add(d);
      b.crowd.push({ g: d, baseY: -0.5, t: Math.random() * 6, jump: 0, lean: 0, freq: 1.5 }); ducks.push({ d, x, z, ph: Math.random() * 6 });
    });
    const babies = [0, 1, 2, 3].map(i => { const d = mallard(false); d.scale.setScalar(0.45); g.add(d); return d; });

    // A frog hops across the raft now and then.
    const frog = MD.makeFrog(); frog.visible = false; g.add(frog);
    const fr = { on: false, t: 7, x: 0, z: 0, dir: 1, hop: 0, hit: new Set() };
    const fish = new THREE.Group(); fish.visible = false; g.add(fish);
    K.mesh(new THREE.SphereGeometry(0.3, 12, 8), M(0xff8a3d, 0.4), fish, 0, 0, 0).scale.set(0.5, 0.8, 1.4);
    K.mesh(new THREE.ConeGeometry(0.22, 0.4, 6), M(0xff8a3d, 0.4), fish, 0, 0, -0.5).rotation.x = -Math.PI / 2;
    const fs = { t: 3, p: 0, x: 0, z: 0, dir: 1 };

    b.onRound = () => { fr.on = false; frog.visible = false; fr.t = 6 + Math.random() * 4; };
    b.update = function (dt, t, G) {
      ripple.offset.x = t * 0.01; ripple.offset.y = t * 0.006;
      pads.forEach(p => { p.p.position.y = -0.4 + Math.sin(t + p.ph) * 0.015; });
      ducks.forEach((q, i) => { q.d.position.x = q.x + Math.sin(t * 0.25 + q.ph) * 0.8; q.d.position.z = q.z + Math.cos(t * 0.2 + q.ph) * 0.4; });
      babies.forEach((d, i) => { const a = t * 0.18 - i * 0.12; d.position.set(Math.cos(a) * 10.5, -0.48, Math.sin(a) * 7.5); d.rotation.y = -a; });
      fs.t -= dt;
      if (fs.t <= 0 && fs.p <= 0) { fs.p = 1; const a = Math.random() * Math.PI * 2; fs.x = Math.cos(a) * 9; fs.z = Math.sin(a) * 6; fs.dir = Math.random() < 0.5 ? 1 : -1; fish.visible = true; }
      if (fs.p > 0) { fs.p -= dt * 1.2; const k = 1 - fs.p; fish.position.set(fs.x + fs.dir * k * 2, -0.4 + Math.sin(k * Math.PI) * 1.6, fs.z); fish.rotation.x = (k - 0.5) * 2.4 * fs.dir; fish.rotation.y = fs.dir > 0 ? Math.PI / 2 : -Math.PI / 2; if (fs.p <= 0) { fish.visible = false; fs.t = 4 + Math.random() * 6; MD.Arena.sparks(new THREE.Vector3(fish.position.x, -0.35, fs.z), 0xffffff, 6); } }
      if (G.phase === 'fight' && !fr.on) { fr.t -= dt; if (fr.t <= 0) { fr.on = true; fr.dir = Math.random() < 0.5 ? 1 : -1; fr.x = -fr.dir * 7; fr.z = (Math.random() - 0.5) * 4.5; fr.hop = 0; fr.hit.clear(); frog.visible = true; frog.rotation.y = fr.dir > 0 ? Math.PI / 2 : -Math.PI / 2; if (Math.random() < 0.6) G.sayRaw('A frog is crossing the raft. It has right of way.'); } }
      if (fr.on) {
        fr.hop += dt * 1.6; const ph = fr.hop % 1;
        fr.x += fr.dir * dt * 3.2;
        const gy = MD.Arena.inside(fr.x, fr.z) ? 0 : -0.4;
        frog.position.set(fr.x, gy + Math.sin(ph * Math.PI) * 0.9, fr.z);
        if (ph < dt * 1.6 && Math.random() < 0.5) MD.Audio.tone(180, 0.12, 'square', 0.06, 120);
        for (const f of G.fighters) {
          if (fr.hit.has(f) || f.state === 'fall' || f.y > 0.6) continue;
          if (Math.hypot(f.x - fr.x, f.z - fr.z) < 0.75) { fr.hit.add(f); G.envHit(f, 3, fr.dir, f.z - fr.z, 4, 3); G.bub(f, 'frog', 1, true); }
        }
        if (Math.abs(fr.x) > 7.5) { fr.on = false; frog.visible = false; fr.t = 9 + Math.random() * 5; }
      }
    };
  },
};
