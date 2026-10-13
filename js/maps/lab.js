// Map: Lab Desk. A workbench with a self-healing cutting mat, the training monitor on a pegboard wall,
// a SIM2REAL mug, the gamepad, a Rust crab, and rubber ducks watching from the back counter.
MD.MAPS.lab = {
  key: 'lab', name: 'Lab Desk', swatch: 'linear-gradient(135deg,#2f6b4f 0 55%,#b98a5e 55%)',
  blurb: 'The original. A workbench with a cutting mat, a training monitor and a mug that says SIM2REAL. Fall off and it is 75 cm to the floor.',
  shape: 'rect', hw: 7, hd: 4.4, spawn: [4.2, 2.7], floorY: -7.4, music: 'fight',
  ground: (x, z) => (Math.abs(x) < 5 && Math.abs(z) < 3.3 ? 0.03 : 0),
  env: { bg: 0x221f29, fog: [0x221f29, 22, 48], hemi: [0xcfd8ff, 0x3b2c22, 0.6], key: [0xfff1dc, 1.35], rim: [0x8cc4ea, 0.55], warm: [0xffb36b, 0.6], exposure: 1.05 },
  ringout: ['{b} fell off the desk. Not covered by warranty.', '{b} discovered the desk has edges. Sim2real gap: 75 cm.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const wood = K.canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#b98a5e'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 220; i++) {
        const y = Math.random() * h, a = 0.04 + Math.random() * 0.08;
        c.strokeStyle = Math.random() > 0.5 ? `rgba(90,52,25,${a})` : `rgba(230,190,140,${a})`;
        c.lineWidth = 1 + Math.random() * 3; c.beginPath(); c.moveTo(0, y);
        for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x * 0.01 + i) * 6);
        c.stroke();
      }
    }).tex;
    // Green cutting mat, 100 x 66 cm, 1 cm grid, 5 cm major lines, 45 and 60 degree guides.
    const matTex = K.canvasTex(2048, 1352, (c, w, h) => {
      c.fillStyle = '#2f6b4f'; c.fillRect(0, 0, w, h);
      const cm = w / 100;
      c.strokeStyle = 'rgba(220,240,225,0.18)'; c.lineWidth = 1;
      for (let i = 0; i <= 100; i++) { c.beginPath(); c.moveTo(i * cm, 0); c.lineTo(i * cm, h); c.stroke(); }
      for (let i = 0; i <= 66; i++) { c.beginPath(); c.moveTo(0, i * cm); c.lineTo(w, i * cm); c.stroke(); }
      c.strokeStyle = 'rgba(230,248,235,0.42)'; c.lineWidth = 2;
      for (let i = 0; i <= 100; i += 5) { c.beginPath(); c.moveTo(i * cm, 0); c.lineTo(i * cm, h); c.stroke(); }
      for (let i = 0; i <= 66; i += 5) { c.beginPath(); c.moveTo(0, i * cm); c.lineTo(w, i * cm); c.stroke(); }
      c.strokeStyle = 'rgba(245,197,24,0.35)'; c.lineWidth = 3;
      [[0, 0, w, h], [w, 0, 0, h], [w * 0.5, 0, w * 0.5 + h * 0.577, h], [w * 0.5, 0, w * 0.5 - h * 0.577, h]].forEach(([a, b2, cc, d]) => { c.beginPath(); c.moveTo(a, b2); c.lineTo(cc, d); c.stroke(); });
      c.fillStyle = 'rgba(230,248,235,0.7)'; c.font = '600 22px "Chivo Mono", monospace';
      for (let i = 5; i < 100; i += 5) { c.fillText(String(i), i * cm + 4, 24); c.fillText(String(i), i * cm + 4, h - 8); }
      for (let i = 5; i < 66; i += 5) { c.fillText(String(i), 6, i * cm - 4); }
      c.font = '800 30px "Chivo", sans-serif'; c.fillStyle = 'rgba(230,248,235,0.55)';
      c.fillText('SELF-HEALING MAT  ·  100 × 66 cm  ·  UNLIKE YOUR DUCK', 40, h - 44);
      c.save(); c.translate(w / 2, h / 2); c.strokeStyle = 'rgba(245,197,24,0.5)'; c.lineWidth = 4;
      c.beginPath(); c.arc(0, 0, 12 * cm, 0, Math.PI * 2); c.stroke();
      c.setLineDash([14, 12]); c.beginPath(); c.arc(0, 0, 4 * cm, 0, Math.PI * 2); c.stroke(); c.restore();
    }).tex;
    const peg = K.canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#3a3542'; c.fillRect(0, 0, w, h); c.fillStyle = '#25222b';
      for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) { c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); }
    }).tex;

    K.box(14, 0.36, 8.8, M(0xffffff, 0.62, 0, { map: wood }), 0, -0.18, 0, g, false);
    const legM = M(0x2a2830, 0.5, 0.4);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => K.box(0.4, 7.4, 0.4, legM, sx * 6.5, -4.06, sz * 3.9, g, false));
    b.surfaceMat = M(0xffffff, 0.85, 0, { map: matTex });
    const mat = K.mesh(new THREE.BoxGeometry(10, 0.03, 6.6), b.surfaceMat, g, 0, 0.015, 0, false);
    mat.receiveShadow = true;
    const floor = K.mesh(new THREE.PlaneGeometry(80, 80), M(0x2b2630, 0.95), g, 0, -7.8, 0, false); floor.rotation.x = -Math.PI / 2;
    peg.wrapS = peg.wrapT = THREE.RepeatWrapping; peg.repeat.set(10, 4);
    K.mesh(new THREE.PlaneGeometry(60, 26), M(0xffffff, 0.9, 0, { map: peg }), g, 0, 4, -12.5, false);

    // Coffee mug (solid obstacle).
    const mug = new THREE.Group(); mug.position.set(-6.1, 0, -3.5); g.add(mug);
    const mm = M(0xf3eee4, 0.35);
    K.mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.95, 28, 1, true), mm, mug, 0, 0.475, 0);
    K.mesh(new THREE.CircleGeometry(0.4, 28), M(0x3b2416, 0.2), mug, 0, 0.82, 0, false).rotation.x = -Math.PI / 2;
    K.mesh(new THREE.TorusGeometry(0.22, 0.06, 10, 20), mm, mug, 0.45, 0.5, 0);
    const label = K.canvasTex(256, 128, (c) => { c.fillStyle = '#f3eee4'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#1d1b22'; c.font = '800 30px "Chivo", sans-serif'; c.fillText('SIM2REAL', 30, 60); c.font = '22px "Chivo Mono", monospace'; c.fillText('gap: yes', 60, 98); });
    K.mesh(new THREE.CylinderGeometry(0.425, 0.405, 0.4, 28, 1, true, -0.9, 1.8), new THREE.MeshStandardMaterial({ map: label.tex, roughness: 0.4 }), mug, 0, 0.45, 0, false);
    b.obstacles.push({ x: -6.1, z: -3.5, r: 0.55 });

    // Gamepad (the real duck ships with one).
    const pad = new THREE.Group(); pad.position.set(5.9, 0, -3.7); pad.rotation.y = -0.4; g.add(pad);
    const pm = M(0x2a2830, 0.55);
    K.mesh(MD.rbox(1.2, 0.16, 0.6, 0.08), pm, pad, 0, 0.08, 0);
    [-0.45, 0.45].forEach(x => K.mesh(MD.rbox(0.4, 0.16, 0.5, 0.08), pm, pad, x, 0.08, 0.2));
    [[0.32, 0.05, 0xf5c518], [0.42, -0.05, 0x8a6fd6], [0.22, -0.05, 0x6fd0e6], [0.32, -0.15, 0xf0631f]].forEach(([x, z, c]) => K.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12), M(c, 0.4), pad, x, 0.18, z));

    // Orange crab figurine, because the firmware is written in Rust.
    const crab = new THREE.Group(); crab.position.set(6.3, 0, 3.6); crab.rotation.y = -2.3; g.add(crab);
    const cm = M(0xf0631f, 0.5);
    K.mesh(new THREE.SphereGeometry(0.28, 20, 12), cm, crab, 0, 0.2, 0).scale.set(1.3, 0.55, 1);
    [-1, 1].forEach(s => {
      K.mesh(new THREE.SphereGeometry(0.11, 12, 8), cm, crab, 0.42 * s, 0.25, 0.22);
      K.mesh(new THREE.SphereGeometry(0.05, 10, 8), M(0x111111, 0.2), crab, 0.1 * s, 0.38, 0.2);
      for (let i = 0; i < 3; i++) { const l = K.mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.3, 6), cm, crab, 0.32 * s, 0.1, -0.12 + i * 0.1); l.rotation.z = 0.9 * s; }
    });

    // Training monitor on the wall.
    const mon = new THREE.Group(); mon.position.set(0, 4.4, -11.5); g.add(mon);
    K.box(10.6, 6.2, 0.35, M(0x141318, 0.5), 0, 0, -0.2, mon);
    K.screen(mon, 10.1, 5.7);
    K.box(0.5, 4, 0.3, M(0x1d1b22, 0.5), 0, -4.6, -0.4, mon);
    const glow = new THREE.PointLight(0x6fd0e6, 0.5, 18); glow.position.set(0, 4, -9.5); g.add(glow);

    // Back counter with the rubber-duck audience.
    K.box(13, 8.4, 1.1, M(0x7a5a40, 0.7), 0, -3.65, -5.75, g, false);
    K.box(13.2, 0.12, 1.3, M(0x5e4430, 0.6), 0, 0.6, -5.75, g, false);
    K.crowd(g, [0xffd21f, 0xf6b6c8, 0x8cc4ea, 0xffd21f, 0xf3eee4, 0xb8a5dd, 0xffd21f].map((c, i) => ({ color: c, x: -4.5 + i * 1.5, y: 0.66, z: -5.7 })), b.crowd);
  },
};
