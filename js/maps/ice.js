// Map: Ice Floe. A slippery ice floe on the Arctic Ocean under the northern lights. Snowballs freeze
// whoever they hit, a penguin belly-slides across now and then, and more penguins watch from an iceberg.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.makePenguin = function () {
  const p = new THREE.Group(), M = MD.mat;
  const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
  add(new THREE.SphereGeometry(0.42, 16, 12), M(0x1d1b22, 0.5), 0, 0.5, 0).scale.set(0.9, 1.25, 0.85);
  add(new THREE.SphereGeometry(0.34, 16, 12), M(0xf7f5f0, 0.6), 0, 0.45, 0.12).scale.set(0.8, 1.15, 0.7);
  add(new THREE.SphereGeometry(0.28, 14, 10), M(0x1d1b22, 0.5), 0, 1.02, 0);
  add(new THREE.ConeGeometry(0.08, 0.22, 8), M(0xff8a3d, 0.4), 0, 0.98, 0.3).rotation.x = Math.PI / 2;
  [-0.11, 0.11].forEach(x => add(new THREE.SphereGeometry(0.04, 8, 6), M(0xffffff, 0.2), x, 1.08, 0.24));
  [-1, 1].forEach(s => { const w = add(new THREE.SphereGeometry(0.16, 10, 8), M(0x1d1b22, 0.5), 0.38 * s, 0.55, 0); w.scale.set(0.35, 1.3, 0.7); w.rotation.z = 0.3 * s; });
  [-0.12, 0.12].forEach(x => add(MD.rbox(0.16, 0.06, 0.24, 0.03), M(0xff8a3d, 0.5), x, 0.03, 0.1));
  return p;
};
MD.ICON_MAKERS.penguin = () => MD.makePenguin();
MD.Items.makers.snowball = function () {
  const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), MD.mat(0xf4fbff, 0.8)); m.position.y = 0.22; m.castShadow = true; g.add(m); return g;
};
MD.MAPS.ice = {
  key: 'ice', name: 'Ice Floe', swatch: 'linear-gradient(135deg,#e8f6ff 0 45%,#1f4a7a 45% 80%,#5bffb0 80%)',
  blurb: 'A slippery ice floe in the Arctic under the northern lights. Throw snowballs to freeze the other duck, and watch out for sliding penguins.',
  shape: 'circle', radius: 5.0, floorY: -2.4, fallMode: 'sink', music: 'fight', slippery: 2.2,
  sinkColors: [0xffffff, 0x8fd3f4],
  env: { bg: 0x081428, fog: [0x081428, 26, 70], hemi: [0xcfe6ff, 0x1a2a40, 0.75], key: [0xe8f2ff, 1.25], rim: [0x5bffb0, 0.7], warm: [0x7c9cff, 0.5], exposure: 1.1 },
  ringout: ['{b} fell into the Arctic Ocean. Brrr.', '{b} is now an ice cube.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const iceTex = K.canvasTex(1024, 1024, (c, w) => {
      const gr = c.createRadialGradient(w / 2, w / 2, 40, w / 2, w / 2, w / 2); gr.addColorStop(0, '#f4fbff'); gr.addColorStop(1, '#cfe8f6'); c.fillStyle = gr; c.fillRect(0, 0, w, w);
      c.strokeStyle = 'rgba(120,170,210,0.45)'; c.lineWidth = 2;
      for (let i = 0; i < 26; i++) { c.beginPath(); let x = w / 2 + (Math.random() - 0.5) * w * 0.7, y = w / 2 + (Math.random() - 0.5) * w * 0.7; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 120; y += (Math.random() - 0.5) * 120; c.lineTo(x, y); } c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.ellipse(Math.random() * w, Math.random() * w, 20 + Math.random() * 60, 8 + Math.random() * 20, Math.random() * 3, 0, 7); c.fill(); }
    }).tex;
    b.surfaceMat = M(0xffffff, 0.15, 0.05, { map: iceTex });
    const floe = new THREE.CylinderGeometry(5.0, 4.6, 1.0, 40, 1);
    const fp = floe.attributes.position;
    for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), z = fp.getZ(i), r = Math.hypot(x, z); if (r > 3) { const k = 1 + Math.sin(Math.atan2(z, x) * 7) * 0.03 + Math.sin(Math.atan2(z, x) * 13) * 0.02; fp.setX(i, x * k); fp.setZ(i, z * k); } }
    floe.computeVertexNormals();
    K.mesh(floe, [M(0xbfe0f2, 0.3), b.surfaceMat, M(0xbfe0f2, 0.3)], g, 0, -0.5, 0, false);
    // Cold dark water, drifting ice chunks, icebergs, an igloo, stars and a moon.
    const sea = K.canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#123a62'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(160,210,255,0.18)'; c.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = Math.random() * h; c.beginPath(); c.ellipse(x, y, 20 + Math.random() * 50, 4, 0, 0, 7); c.stroke(); } }).tex;
    sea.wrapS = sea.wrapT = THREE.RepeatWrapping; sea.repeat.set(10, 10);
    K.mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: sea, roughness: 0.2, metalness: 0.3 }), g, 0, -0.42, 0, false).rotation.x = -Math.PI / 2;
    const chunks = [];
    for (let i = 0; i < 14; i++) { const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 8; const m = K.mesh(MD.rbox(0.6 + Math.random() * 1.4, 0.4, 0.6 + Math.random() * 1.2, 0.15), M(0xe8f6ff, 0.3), g, Math.cos(a) * r, -0.35, Math.sin(a) * r * 0.75, false); m.rotation.y = Math.random() * 3; chunks.push({ m, p: Math.random() * 6 }); }
    const berg = new THREE.Group(); berg.position.set(-9, -0.4, -10); g.add(berg);
    K.mesh(new THREE.ConeGeometry(5, 9, 7), M(0xe8f6ff, 0.35), berg, 0, 4.3, 0, false); K.mesh(new THREE.ConeGeometry(3, 6, 6), M(0xd6ecfa, 0.35), berg, 4, 2.8, 1, false);
    K.mesh(new THREE.CylinderGeometry(4.6, 5.2, 1.4, 12), M(0xe8f6ff, 0.35), berg, 0.5, 0.3, 4, false);
    const ig = new THREE.Group(); ig.position.set(9.5, -0.4, -8.5); g.add(ig);
    K.mesh(new THREE.CylinderGeometry(4, 4.4, 0.8, 16), M(0xe8f6ff, 0.35), ig, 0, 0.1, 0, false);
    K.mesh(new THREE.SphereGeometry(2.4, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(0xf4fbff, 0.6), ig, 0, 0.5, 0);
    K.mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 14, 1, false, 0, Math.PI), M(0xf4fbff, 0.6), ig, 0, 0.9, 2.1).rotation.z = Math.PI / 2;
    const tv = new THREE.Group(); tv.position.set(9.5, 4.8, -8.3); g.add(tv); K.box(4.6, 2.7, 0.2, M(0x1d1b22, 0.4), 0, 0, -0.1, tv); K.screen(tv, 4.4, 2.5);
    const starGeo = new THREE.BufferGeometry(), sp = [];
    for (let i = 0; i < 500; i++) sp.push((Math.random() - 0.5) * 140, 8 + Math.random() * 40, -30 - Math.random() * 30);
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    g.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 })));
    K.mesh(new THREE.SphereGeometry(2.2, 20, 14), new THREE.MeshBasicMaterial({ color: 0xf4f0d8 }), g, 16, 22, -50, false);
    // Northern lights: wavy ribbons that drift and change color.
    const aurora = [0x5bffb0, 0x7c9cff, 0xd94fff].map((c, i) => {
      const geo = new THREE.PlaneGeometry(70, 9, 60, 1);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      m.position.set(0, 18 + i * 3, -38 - i * 4); g.add(m);
      return { m, base: Float32Array.from(geo.attributes.position.array), ph: i * 1.7 };
    });
    // Penguin audience on the iceberg shelf.
    for (let i = 0; i < 6; i++) { const p = MD.makePenguin(); p.scale.setScalar(1.1); p.position.set(-11 + i * 1.3, 0.3, -6.2); p.rotation.y = 0.5; g.add(p); b.crowd.push({ g: p, baseY: 0.3, t: Math.random() * 6, jump: 0, lean: 0, freq: 3.0 }); }
    // Snowfall.
    const snowGeo = new THREE.BufferGeometry(), sn = [];
    for (let i = 0; i < 400; i++) sn.push((Math.random() - 0.5) * 40, Math.random() * 16, (Math.random() - 0.5) * 30);
    snowGeo.setAttribute('position', new THREE.Float32BufferAttribute(sn, 3));
    const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9 })); g.add(snow);

    // A penguin belly-slides across the floe, knocking ducks aside.
    const slider = MD.makePenguin(); slider.visible = false; g.add(slider);
    const pg = { on: false, t: 9, x: 0, z: 0, dir: 1, hit: new Set() };
    const dropSnow = () => { for (let i = 0; i < 3; i++) { const p = MD.Arena.randomSpot(); MD.Items.spawn('snowball', p.x, p.z, { y: 4 + i }); } };
    b.onRound = () => { pg.on = false; slider.visible = false; pg.t = 7 + Math.random() * 4; setTimeout(() => MD.Game.running() && dropSnow(), 2500); };
    b.update = function (dt, t, G) {
      sea.offset.x = t * 0.006;
      chunks.forEach(c => { c.m.position.y = -0.36 + Math.sin(t * 0.8 + c.p) * 0.05; c.m.rotation.z = Math.sin(t * 0.6 + c.p) * 0.04; });
      aurora.forEach(a => {
        const pos = a.m.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) { const x = a.base[i * 3]; pos.setY(i, a.base[i * 3 + 1] + Math.sin(x * 0.12 + t * 0.4 + a.ph) * 2.2); pos.setZ(i, Math.sin(x * 0.08 + t * 0.25 + a.ph) * 3); }
        pos.needsUpdate = true; a.m.material.opacity = 0.16 + Math.sin(t * 0.5 + a.ph) * 0.07;
      });
      const sp2 = snow.geometry.attributes.position;
      for (let i = 0; i < sp2.count; i++) { let y = sp2.getY(i) - dt * 1.2; if (y < -0.4) y = 16; sp2.setY(i, y); sp2.setX(i, sp2.getX(i) + Math.sin(t + i) * 0.003); }
      sp2.needsUpdate = true;
      if (G.phase === 'fight' && !pg.on) {
        pg.t -= dt;
        if (pg.t <= 0) { pg.on = true; pg.dir = Math.random() < 0.5 ? 1 : -1; pg.z = (Math.random() - 0.5) * 6; pg.x = -pg.dir * 7; pg.hit.clear(); slider.visible = true; slider.rotation.set(Math.PI / 2 * 0.95, pg.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0, 'YXZ'); if (Math.random() < 0.6) G.sayRaw('A penguin belly-slides across the ice. It does not brake for robots.'); MD.Audio.noise(1.2, 0.15, 1800, 0.6, 0, 'highpass'); }
      }
      if (pg.on) {
        pg.x += pg.dir * 7.5 * dt;
        const onIce = MD.Arena.inside(pg.x, pg.z);
        slider.position.set(pg.x, onIce ? 0.3 : -0.25, pg.z);
        for (const f of G.fighters) {
          if (pg.hit.has(f) || f.state === 'fall' || f.y > 0.6) continue;
          if (Math.abs(f.z - pg.z) < 0.85 && Math.abs(f.x - pg.x) < 0.9) { pg.hit.add(f); G.envHit(f, 5, pg.dir, (f.z - pg.z) * 0.4, 7, 2.5); G.bub(f, 'penguin', 1, true); }
        }
        if (Math.abs(pg.x) > 7.5) { pg.on = false; slider.visible = false; pg.t = 9 + Math.random() * 5; if (Math.random() < 0.5) dropSnow(); }
      }
    };
  },
};
