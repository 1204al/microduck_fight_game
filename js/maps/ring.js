// Map: Main Event. A boxing ring under the arena lights. The ropes bounce you back, so there are
// no ring-outs: only a knockout wins. The bell rings each round and the crowd's cameras flash.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.ICON_MAKERS.ropes = () => {
  const g = new THREE.Group(), M = MD.mat;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 14), M(0xd8dde3, 0.3, 0.8)); post.position.y = 1.1; g.add(post);
  const pad = new THREE.Mesh(MD.rbox(0.42, 1.8, 0.42, 0.12), M(0xd8322c, 0.5)); pad.position.y = 1.15; g.add(pad);
  [0.6, 1.15, 1.7].forEach((y, i) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), M([0xd8322c, 0xf3eee4, 0x3f7fb3][i], 0.4)); r.rotation.z = Math.PI / 2; r.position.set(1.2, y, 0); g.add(r); });
  return g;
};
MD.MAPS.ring = {
  key: 'ring', name: 'Main Event', swatch: 'linear-gradient(135deg,#d8322c 0 33%,#f3eee4 33% 66%,#3f7fb3 66%)',
  blurb: 'A real boxing ring. The ropes bounce you back, so there are no ring-outs: knock them out to win. Ding ding ding.',
  shape: 'rect', hw: 5.6, hd: 5.0, spawn: [3.6, 3.0], floorY: -1.2, music: 'fight', ropes: true,
  env: { bg: 0x0b0a10, fog: [0x0b0a10, 22, 55], hemi: [0x8a8ab0, 0x141018, 0.4], key: [0xfff4e0, 1.5], rim: [0x4f8cff, 0.8], warm: [0xff4f6a, 0.7], exposure: 1.1 },
  ringout: ['{b} went through the ropes. The referee allows it, somehow.'],
  build(K, b) {
    const g = b.group, M = MD.mat, HW = 5.6, HD = 5.0;
    const canvas = K.canvasTex(1536, 1380, (c, w, h) => {
      c.fillStyle = '#ece6da'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(120,110,95,0.25)'; c.lineWidth = 2; for (let i = 0; i < w; i += 24) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); }
      c.fillStyle = '#d8322c'; c.beginPath(); c.arc(w / 2, h / 2, 330, 0, 7); c.fill();
      c.fillStyle = '#ece6da'; c.beginPath(); c.arc(w / 2, h / 2, 300, 0, 7); c.fill();
      c.fillStyle = '#1d1b22'; c.textAlign = 'center'; c.font = '900 130px "Lilita One", sans-serif'; c.fillText('MICRODUCK', w / 2, h / 2 - 10);
      c.font = '800 58px "Chivo", sans-serif'; c.fillText('FIGHT NIGHT', w / 2, h / 2 + 70);
      c.fillStyle = '#d8322c'; c.fillRect(0, 0, 120, 120); c.fillStyle = '#3f7fb3'; c.fillRect(w - 120, h - 120, 120, 120);
    }).tex;
    b.surfaceMat = M(0xffffff, 0.9, 0, { map: canvas });
    K.box(HW * 2 + 1.6, 1.2, HD * 2 + 1.6, M(0x1d2a5a, 0.7), 0, -0.62, 0, g);
    K.mesh(new THREE.BoxGeometry(HW * 2 + 1.4, 0.02, HD * 2 + 1.4), b.surfaceMat, g, 0, 0.0, 0, false);
    const apron = K.canvasTex(1024, 128, (c, w, h) => { c.fillStyle = '#1d2a5a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f5c518'; c.font = '900 70px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CHAMPIONSHIP · 25 CM DIVISION', w / 2, h / 2); }).tex;
    K.mesh(new THREE.PlaneGeometry(HW * 2 + 1.6, 1.15), new THREE.MeshBasicMaterial({ map: apron }), g, 0, -0.6, HD + 0.81, false);
    K.mesh(new THREE.PlaneGeometry(90, 90), M(0x14121a, 0.9), g, 0, -1.22, 0, false).rotation.x = -Math.PI / 2;
    // Corner posts with red, blue and white pads, and three ropes per side.
    const steel = M(0xd8dde3, 0.3, 0.8);
    const corners = [[HW, HD, 0x3f7fb3], [-HW, HD, 0xf3eee4], [-HW, -HD, 0xd8322c], [HW, -HD, 0xf3eee4]];
    corners.forEach(([x, z, c]) => { K.mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.3, 14), steel, g, x, 1.15, z); K.mesh(MD.rbox(0.42, 1.8, 0.42, 0.12), M(c, 0.5), g, x, 1.2, z); });
    const ropeCols = [0xd8322c, 0xf3eee4, 0x3f7fb3], ropes = {};
    const sides = { n: [[-HW, -HD], [HW, -HD]], s: [[-HW, HD], [HW, HD]], w: [[-HW, -HD], [-HW, HD]], e: [[HW, -HD], [HW, HD]] };
    Object.entries(sides).forEach(([k, [[x1, z1], [x2, z2]]]) => {
      ropes[k] = { amp: 0, segs: [] };
      [0.65, 1.2, 1.75].forEach((y, i) => {
        const len = Math.hypot(x2 - x1, z2 - z1);
        const r = K.mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 8), M(ropeCols[i], 0.4), g, (x1 + x2) / 2, y, (z1 + z2) / 2, false);
        if (z1 === z2) r.rotation.z = Math.PI / 2; else r.rotation.x = Math.PI / 2;
        ropes[k].segs.push({ r, base: r.position.clone(), nx: k === 'e' ? 1 : k === 'w' ? -1 : 0, nz: k === 's' ? 1 : k === 'n' ? -1 : 0 });
      });
    });
    b.onRope = (side) => { if (ropes[side]) ropes[side].amp = 0.35; };
    // Stools and buckets in the corners, outside the ropes.
    [[HW + 0.9, HD + 0.9, 0x3f7fb3], [-HW - 0.9, -HD - 0.9, 0xd8322c]].forEach(([x, z, c]) => { K.mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.15, 16), M(c, 0.5), g, x, -0.4, z); K.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), steel, g, x, -0.8, z); });
    // Stands full of rubber ducks, camera flashes, a jumbotron, and big spotlights.
    const tiers = [];
    for (let row = 0; row < 3; row++) {
      K.box(30, 0.9, 1.6, M(0x24212e, 0.8), 0, -0.8 + row * 0.9, -9 - row * 1.6, g, false);
      for (let i = 0; i < 13; i++) tiers.push({ color: [0xffd21f, 0xf6b6c8, 0x8cc4ea, 0xb8a5dd, 0xf3eee4][(i + row) % 5], x: -12 + i * 2 + (row % 2), y: -0.35 + row * 0.9, z: -9 - row * 1.6, scale: 0.7 });
    }
    [-1, 1].forEach(s => { for (let row = 0; row < 2; row++) { K.box(1.6, 0.9, 14, M(0x24212e, 0.8), s * (10 + row * 1.6), -0.8 + row * 0.9, 0, g, false); for (let i = 0; i < 5; i++) tiers.push({ color: [0xffd21f, 0x8cc4ea, 0xf6b6c8][(i + row) % 3], x: s * (10 + row * 1.6), y: -0.35 + row * 0.9, z: -5 + i * 2.5, scale: 0.7, rotY: -s * Math.PI / 2 }); } });
    K.crowd(g, tiers, b.crowd);
    const flashM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0.95 });
    const flashes = Array.from({ length: 10 }, () => { const m = K.mesh(new THREE.CircleGeometry(0.18, 10), flashM, g, 0, 0, 0, false); m.visible = false; return { m, t: 0 }; });
    const jumbo = new THREE.Group(); jumbo.position.set(0, 9.5, -6); g.add(jumbo);
    K.box(8.4, 4.8, 0.4, M(0x111114, 0.4), 0, 0, -0.2, jumbo); K.screen(jumbo, 8, 4.5);
    [[-4, 0xfff0d0], [4, 0xfff0d0], [0, 0xb0c8ff]].forEach(([x, c]) => { const s = new THREE.SpotLight(c, 1.4, 34, 0.42, 0.45, 1.1); s.position.set(x, 13, 5); s.target.position.set(0, 0, 0); g.add(s); g.add(s.target); });

    b.onRound = () => { [0, 0.28, 0.56].forEach(d => MD.Audio.tone(1568, 0.5, 'sine', 0.22, null, d)); };
    b.update = function (dt, t, G) {
      Object.values(ropes).forEach(R => {
        if (R.amp <= 0.001) return;
        R.amp *= Math.pow(0.02, dt);
        const off = Math.sin(t * 28) * R.amp;
        R.segs.forEach((s, i) => s.r.position.set(s.base.x + s.nx * off * (1 - i * 0.2), s.base.y, s.base.z + s.nz * off * (1 - i * 0.2)));
      });
      flashes.forEach(f => {
        if (f.t > 0) { f.t -= dt; if (f.t <= 0) f.m.visible = false; return; }
        if (Math.random() < dt * (G.phase === 'roundEnd' ? 4 : 0.5)) { const c = b.crowd[Math.floor(Math.random() * b.crowd.length)]; f.m.position.set(c.g.position.x, c.g.position.y + 0.9, c.g.position.z + 0.4); f.m.visible = true; f.t = 0.07; }
      });
    };
  },
};
