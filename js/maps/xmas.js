// Map: Christmas Morning. Fight on top of a giant present under the tree. Surprise gifts drop in
// (maybe a battery, maybe a lump of coal), the fireplace crackles, lights twinkle, Jingle Bells plays.
MD.MAPS.xmas = {
  key: 'xmas', name: 'Christmas Morning', swatch: 'linear-gradient(135deg,#d8322c 0 45%,#f2b705 45% 55%,#2f7a3a 55%)',
  blurb: 'First deliveries arrive before Christmas, as promised. Fight on a giant present, open surprise gifts (some are coal), and mind the edge.',
  shape: 'rect', hw: 5.8, hd: 3.9, spawn: [3.8, 2.4], floorY: -4.2, music: 'xmas',
  env: { bg: 0x1b1420, fog: [0x1b1420, 22, 50], hemi: [0xffe6c8, 0x3a1a1a, 0.6], key: [0xffe7c9, 1.05], rim: [0x8cc4ea, 0.5], warm: [0xff8a3d, 1.1], exposure: 1.08 },
  ringout: ['{b} fell off the present. Returned to sender.', '{b} rolled under the tree. It will be found in January.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    // Wrapping paper with a gold ribbon cross.
    const paper = K.canvasTex(1536, 1024, (c, w, h) => {
      c.fillStyle = '#c62a2a'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (let y = 40; y < h; y += 110) for (let x = 40 + (y / 110 % 2) * 55; x < w; x += 110) {
        c.save(); c.translate(x, y); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4;
        for (let k = 0; k < 6; k++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 18); c.stroke(); }
        c.restore();
      }
      c.fillStyle = '#f2b705'; c.fillRect(w / 2 - 50, 0, 100, h); c.fillRect(0, h / 2 - 50, w, 100);
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(w / 2 - 50, 0, 20, h); c.fillRect(0, h / 2 - 50, w, 20);
    }).tex;
    b.surfaceMat = M(0xffffff, 0.7, 0, { map: paper });
    K.box(11.6, 4.2, 7.8, b.surfaceMat, 0, -2.1, 0, g);
    const gold = M(0xf2b705, 0.3, 0.4);
    K.box(1.1, 4.22, 7.82, gold, 0, -2.1, 0, g, false); K.box(11.62, 4.22, 1.1, gold, 0, -2.1, 0, g, false);
    // Bow on the back left corner (solid).
    const bow = new THREE.Group(); bow.position.set(-4.7, 0, -3.0); g.add(bow);
    [-0.5, 0.5].forEach(s => { const l = K.mesh(new THREE.TorusGeometry(0.45, 0.16, 10, 24), gold, bow, s * 0.55, 0.5, 0); l.rotation.y = s * 0.6; });
    K.mesh(new THREE.SphereGeometry(0.28, 14, 10), gold, bow, 0, 0.3, 0);
    b.obstacles.push({ x: -4.7, z: -3.0, r: 0.8 });
    // Room: rug, wall with string lights, window with snow, fireplace with stockings, the tree.
    K.mesh(new THREE.PlaneGeometry(90, 90), M(0x7a2a2a, 0.95), g, 0, -4.21, 0, false).rotation.x = -Math.PI / 2;
    K.mesh(new THREE.PlaneGeometry(70, 26), M(0x3a5a48, 0.9), g, 0, 8, -12.5, false);
    const bulbs = [];
    const bulbGeo = new THREE.SphereGeometry(0.12, 8, 6);
    for (let i = 0; i < 46; i++) {
      const x = -22 + i, y = 14.2 - Math.abs(Math.sin(i * 0.45)) * 0.8;
      const m = new THREE.MeshBasicMaterial({ color: [0xff4040, 0x40ff70, 0xffd040, 0x40a0ff][i % 4], toneMapped: false });
      K.mesh(bulbGeo, m, g, x, y, -12.3, false); bulbs.push(m);
    }
    const win = new THREE.Group(); win.position.set(-9.5, 7.5, -12.4); g.add(win);
    K.mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: 0x1a2a50 }), win, 0, 0, 0.01, false);
    [[0, 2.6, 5.4, 0.3], [0, -2.6, 5.4, 0.3], [-2.6, 0, 0.3, 5.5], [2.6, 0, 0.3, 5.5], [0, 0, 0.15, 5]].forEach(([x, y, w, h]) => K.box(w, h, 0.2, M(0xf3eee4, 0.5), x, y, 0.1, win, false));
    const flakes = Array.from({ length: 40 }, () => { const m = K.mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), win, (Math.random() - 0.5) * 4.8, (Math.random() - 0.5) * 4.8, 0.05, false); return { m, s: 0.4 + Math.random() * 0.6 }; });
    const fire = new THREE.Group(); fire.position.set(8.5, -4.2, -10.5); g.add(fire);
    K.box(6, 5, 1.6, M(0x8a3a2a, 0.9), 0, 2.5, 0, fire); K.box(6.6, 0.4, 2.0, M(0xf3eee4, 0.6), 0, 5.1, 0.1, fire);
    K.box(3.4, 2.6, 0.2, M(0x1a0f0a, 0.9), 0, 1.4, 0.75, fire, false);
    const flames = [0, 1, 2].map(i => K.mesh(new THREE.ConeGeometry(0.45 - i * 0.1, 1.3 - i * 0.2, 10), new THREE.MeshBasicMaterial({ color: [0xff6a1a, 0xffa02a, 0xffe08a][i], toneMapped: false }), fire, (i - 1) * 0.5, 0.75, 0.8, false));
    const fireL = new THREE.PointLight(0xff7a2a, 1.6, 16); fireL.position.set(8.5, -2.6, -9); g.add(fireL);
    [-1.8, 0, 1.8].forEach((x, i) => { const s = new THREE.Group(); s.position.set(x, 4.3, 0.95); fire.add(s); K.mesh(MD.rbox(0.6, 1.0, 0.25, 0.1), M([0xd8322c, 0x2f7a3a, 0xd8322c][i], 0.8), s, 0, 0, 0); K.mesh(MD.rbox(0.7, 0.25, 0.3, 0.1), M(0xf7f5f0, 0.9), s, 0, 0.55, 0); K.mesh(MD.rbox(0.5, 0.3, 0.25, 0.1), M([0xd8322c, 0x2f7a3a, 0xd8322c][i], 0.8), s, 0.25, -0.55, 0); });
    K.crowd(g, [0xffd21f, 0xf6b6c8, 0x8cc4ea, 0xffd21f].map((c, i) => ({ color: c, x: 6.3 + i * 1.5, y: 1.2, z: -10.3, scale: 0.6 })), b.crowd);
    b.crowd.forEach(c => { const hat = K.mesh(new THREE.ConeGeometry(0.22, 0.45, 12), M(0xd8322c, 0.7), c.g, 0, 1.1, 0.15); hat.rotation.z = -0.3; K.mesh(new THREE.SphereGeometry(0.07, 8, 6), M(0xffffff, 0.9), hat, 0, 0.24, 0); });
    const tree = new THREE.Group(); tree.position.set(-9, -4.2, -7.5); g.add(tree);
    K.mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.6, 10), M(0x6a3e1e, 0.8), tree, 0, 0.8, 0);
    [[4.2, 4.5, 3.2], [3.4, 4.0, 5.8], [2.4, 3.4, 8.2]].forEach(([r, h, y]) => K.mesh(new THREE.ConeGeometry(r, h, 18), M(0x2f7a3a, 0.8), tree, 0, y, 0));
    const lights = [];
    for (let i = 0; i < 60; i++) {
      const y = 1.6 + Math.random() * 8.2, r = Math.max(0.4, (10 - y) * 0.42), a = Math.random() * Math.PI * 2;
      const isLight = i % 3 === 0;
      const m = isLight ? new THREE.MeshBasicMaterial({ color: 0xffe08a, toneMapped: false }) : M([0xd8322c, 0xf2b705, 0x8cc4ea, 0xd94fa0][i % 4], 0.2, 0.5);
      K.mesh(new THREE.SphereGeometry(isLight ? 0.1 : 0.22, 10, 8), m, tree, Math.cos(a) * r, y, Math.sin(a) * r, !isLight);
      if (isLight) lights.push({ m, p: Math.random() * 6 });
    }
    const star = K.mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshBasicMaterial({ color: 0xffd040, toneMapped: false }), tree, 0, 10.2, 0, false);
    [[-6.5, 4.5, 1.6, 0x3f7fb3], [7.2, 4.0, 1.2, 0xd94fa0], [6.6, 1.2, 1.0, 0x2f7a3a], [-7.4, 1.8, 1.3, 0xf2b705]].forEach(([x, z, s, c]) => { K.box(s, s, s, M(c, 0.6), x, -4.2 + s / 2, z, g); K.box(s * 0.2, s + 0.02, s + 0.02, gold, x, -4.2 + s / 2, z, g, false); });
    const tv = new THREE.Group(); tv.position.set(1.5, 7.2, -12.3); g.add(tv);
    K.box(5.2, 3.1, 0.2, M(0x1d1b22, 0.4), 0, 0, -0.1, tv); K.screen(tv, 5, 2.85);

    // Surprise gifts that drop onto the present.
    MD.Items.makers.gift = function () {
      const t = new THREE.Group(), col = [0x3f7fb3, 0x2f7a3a, 0xd94fa0, 0xf2b705][Math.floor(Math.random() * 4)];
      const bx = new THREE.Mesh(MD.rbox(0.55, 0.5, 0.55, 0.05), M(col, 0.5)); bx.position.y = 0.25; bx.castShadow = true; t.add(bx);
      const rb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.57), M(0xffffff, 0.4)); rb.position.y = 0.25; t.add(rb);
      const rb2 = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.52, 0.12), M(0xffffff, 0.4)); rb2.position.y = 0.25; t.add(rb2);
      return t;
    };
    let giftT = 6;
    b.onRound = () => { giftT = 5 + Math.random() * 3; };
    b.update = function (dt, t, G) {
      lights.forEach(l => { const k = 0.5 + 0.5 * Math.sin(t * 3 + l.p); l.m.color.setRGB(1, 0.75 + k * 0.2, 0.3 + k * 0.4); });
      bulbs.forEach((m, i) => { const on = Math.floor(t * 2 + i) % 3 !== 0; m.color.setHex(on ? [0xff4040, 0x40ff70, 0xffd040, 0x40a0ff][i % 4] : 0x332222); });
      star.rotation.y = t * 0.8; star.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
      flames.forEach((f, i) => { f.scale.set(1, 0.8 + Math.abs(Math.sin(t * (7 + i * 3) + i)) * 0.5, 1); });
      fireL.intensity = 1.4 + Math.sin(t * 13) * 0.25 + Math.sin(t * 7) * 0.15;
      flakes.forEach(s => { s.m.position.y -= s.s * dt; s.m.position.x += Math.sin(t + s.s * 9) * 0.003; if (s.m.position.y < -2.4) s.m.position.y = 2.4; });
      if (G.phase === 'fight') {
        giftT -= dt;
        if (giftT <= 0) { giftT = 9 + Math.random() * 4; const p = MD.Arena.randomSpot(); MD.Items.spawn('gift', p.x, p.z); MD.Audio.tone(1568, 0.08, 'sine', 0.1); MD.Audio.tone(2093, 0.12, 'sine', 0.1, null, 0.08); if (Math.random() < 0.5) G.sayRaw('A surprise gift drops in. Could be a battery. Could be coal.'); }
      }
    };
  },
};
