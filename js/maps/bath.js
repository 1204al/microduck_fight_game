// Map: Bubble Bath. A wooden bath tray floating in a full bathtub. Fall off and you splash in.
// Rubber ducks float around as the audience, soap bars make you slide, and big bubbles drift by.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.ICON_MAKERS.soap = () => { const m = new THREE.Mesh(MD.rbox(0.48, 0.16, 0.3, 0.08), MD.mat(0xf6b6c8, 0.15)); m.position.y = 0.08; const g = new THREE.Group(); g.add(m); return g; };
MD.MAPS.bath = {
  key: 'bath', name: 'Bubble Bath', swatch: 'linear-gradient(135deg,#c98f5a 0 40%,#7fc6e8 40% 80%,#ffffff 80%)',
  blurb: 'Fight on a wooden tray floating in a bubble bath. Soap bars make you slide, rubber ducks watch from the water, and falling off means a splash.',
  shape: 'rect', hw: 6.2, hd: 3.0, spawn: [4.0, 1.8], floorY: -2.4, fallMode: 'sink', music: 'fight',
  sinkColors: [0xffffff, 0x8fd3f4],
  env: { bg: 0xd6eef5, fog: [0xd6eef5, 26, 60], hemi: [0xf4fbff, 0x6a8a9a, 0.85], key: [0xffffff, 1.2], rim: [0xbfe6ff, 0.6], warm: [0xffe2c4, 0.4], exposure: 1.0 },
  ringout: ['{b} fell into the bath. Water resistance: zero.', '{b} went for a swim. Not waterproof. Not even a little.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const wood = K.canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#c98f5a'; c.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 128) { c.fillStyle = 'rgba(80,45,20,0.35)'; c.fillRect(x, 0, 4, h); }
      for (let i = 0; i < 140; i++) { c.strokeStyle = `rgba(110,60,25,${0.05 + Math.random() * 0.08})`; c.lineWidth = 1 + Math.random() * 2; const x = Math.random() * w; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 10, h * 0.3, x - 10, h * 0.6, x + 4, h); c.stroke(); }
    }).tex;
    b.surfaceMat = M(0xffffff, 0.7, 0, { map: wood });
    K.box(12.4, 0.36, 6.0, b.surfaceMat, 0, -0.18, 0, g);
    [-6.5, 6.5].forEach(x => K.mesh(MD.rbox(0.6, 0.5, 4.2, 0.2), M(0xb07a48, 0.6), g, x, -0.05, 0));

    // Bathtub: white walls, water with a scrolling shimmer, foam along the edges.
    const white = M(0xf7f7f4, 0.25);
    K.mesh(MD.rbox(20.4, 3.6, 1.2, 0.5), white, g, 0, -1.4, -6.3);
    K.mesh(MD.rbox(20.4, 3.6, 1.2, 0.5), white, g, 0, -1.4, 6.6);
    [-10.2, 10.2].forEach(x => K.mesh(MD.rbox(1.2, 3.6, 14, 0.5), white, g, x, -1.4, 0.15));
    const shimmer = K.canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#6fbfe4'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3;
      for (let i = 0; i < 40; i++) { c.beginPath(); const y = Math.random() * h; c.moveTo(0, y); for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x * 0.05 + i) * 10); c.stroke(); }
    }).tex;
    shimmer.wrapS = shimmer.wrapT = THREE.RepeatWrapping; shimmer.repeat.set(4, 3);
    const water = K.mesh(new THREE.PlaneGeometry(20, 12.4), new THREE.MeshStandardMaterial({ map: shimmer, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }), g, 0, -0.4, 0.15, false);
    water.rotation.x = -Math.PI / 2;
    const foamM = M(0xffffff, 0.9);
    const foam = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 10, 8), foamM, 120);
    const dm = new THREE.Object3D();
    for (let i = 0; i < 120; i++) {
      const side = i % 4, t = Math.random();
      const x = side < 2 ? -9.3 + t * 18.6 : (side === 2 ? -9.3 : 9.3) + (Math.random() - 0.5) * 0.8;
      const z = side === 0 ? -5.4 + Math.random() * 0.8 : side === 1 ? 5.6 + Math.random() * 0.6 : -5.2 + t * 10.8;
      dm.position.set(x, -0.38, z); dm.scale.setScalar(0.5 + Math.random() * 1.1); dm.updateMatrix(); foam.setMatrixAt(i, dm.matrix);
    }
    g.add(foam);

    // Bathroom: tiles, a duck-print shower curtain, a shelf of bottles, a little TV.
    const tiles = K.canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#c9dcd6'; c.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 3 === 0 ? '#f6c9d2' : '#eaf6f2'; c.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); } }).tex;
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(12, 6);
    K.mesh(new THREE.PlaneGeometry(60, 30), M(0xffffff, 0.4, 0, { map: tiles }), g, 0, 8, -7.0, false);
    const curtainTex = K.canvasTex(512, 512, (c, w, h) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      for (let y = 30; y < h; y += 90) for (let x = 30 + (y / 90 % 2) * 45; x < w; x += 90) {
        c.fillStyle = '#ffd21f'; c.beginPath(); c.ellipse(x, y, 20, 14, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + 14, y - 14, 10, 0, 7); c.fill();
        c.fillStyle = '#ff8a3d'; c.beginPath(); c.moveTo(x + 22, y - 15); c.lineTo(x + 32, y - 12); c.lineTo(x + 22, y - 9); c.fill();
      }
    }).tex;
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(6, 12, 24, 1), new THREE.MeshStandardMaterial({ map: curtainTex, side: THREE.DoubleSide, roughness: 0.8 }));
    const cp = curtain.geometry.attributes.position;
    for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 3) * 0.25);
    curtain.geometry.computeVertexNormals(); curtain.position.set(12.2, 5.4, -1.5); curtain.rotation.y = -Math.PI / 2.4; g.add(curtain);
    K.mesh(new THREE.CylinderGeometry(0.06, 0.06, 14, 8), M(0xd8dde3, 0.25, 0.9), g, 11.6, 11.4, -1.2, false).rotation.x = Math.PI / 2;
    K.box(9, 0.2, 1.0, white, -3, 3.6, -6.5, g);
    [[-6.6, 0xff8a3d, 1.1], [-5.6, 0x8cc4ea, 1.4], [-4.6, 0xb8a5dd, 0.9], [-1.6, 0x5bd66f, 1.2], [-0.6, 0xf6b6c8, 1.0]].forEach(([x, c, h]) => {
      const bt = K.mesh(new THREE.CylinderGeometry(0.3, 0.32, h, 16), M(c, 0.3), g, x, 3.7 + h / 2, -6.5);
      K.mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.3, 10), M(0xf3eee4, 0.4), bt, 0, h / 2 + 0.15, 0);
    });
    const tv = new THREE.Group(); tv.position.set(4.6, 5.6, -6.85); g.add(tv);
    K.box(5.0, 2.9, 0.2, M(0x1d1b22, 0.4), 0, 0, -0.1, tv); K.screen(tv, 4.8, 2.7);

    // Rubber ducks floating in the bath are the crowd.
    const spots = [[-7.6, -4.1], [-3.8, -4.7], [0.2, -4.9], [4.0, -4.7], [7.8, -4.1], [-8.4, 1.6], [8.5, 1.2]];
    K.crowd(g, spots.map(([x, z], i) => ({ color: [0xffd21f, 0xf6b6c8, 0x8cc4ea, 0xffd21f, 0xb8a5dd, 0xffd21f, 0x7cff6b][i], x, y: -0.62, z, scale: 0.75, rotY: Math.atan2(-x, -z) })), b.crowd);

    // Soap bars on the tray: step on one and you slide.
    const soaps = [0xf6b6c8, 0xf3eee4, 0x8cc4ea].map(c => {
      const m = K.mesh(MD.rbox(0.48, 0.16, 0.3, 0.08), M(c, 0.15), g, 0, 0.08, 0);
      return { m, x: 0, z: 0, vx: 0, vz: 0, y: 0, vy: 0, cd: 0, gone: false };
    });
    const place = () => soaps.forEach(s => {
      let p; for (let i = 0; i < 20; i++) { p = MD.Arena.randomSpot(); if (Math.abs(Math.abs(p.x) - 2.6) > 1 || Math.abs(p.z) > 1) break; }
      Object.assign(s, { x: p.x, z: p.z, vx: 0, vz: 0, y: 0, vy: 0, cd: 0, gone: false }); s.m.visible = true; s.m.rotation.y = Math.random() * 3;
    });
    place();
    // Big soap bubbles drifting across; touching one pops it.
    const bubM = new THREE.MeshStandardMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.3, depthWrite: false });
    const bubbles = [];
    let bubT = 2;
    b.onRound = place;
    b.onClear = () => { bubbles.forEach(q => g.remove(q.m)); bubbles.length = 0; };
    b.update = function (dt, t, G) {
      shimmer.offset.x = t * 0.02; shimmer.offset.y = Math.sin(t * 0.3) * 0.05;
      b.crowd.forEach((c, i) => { c.g.position.x = spots[i][0] + Math.sin(t * 0.4 + i) * 0.4; c.g.position.z = spots[i][1] + Math.cos(t * 0.3 + i) * 0.3; });
      bubT -= dt;
      if (bubT <= 0) {
        bubT = 1.2 + Math.random() * 2.2;
        const r = 0.25 + Math.random() * 0.35, m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), bubM);
        const z = (Math.random() - 0.5) * 5, dir = Math.random() < 0.5 ? 1 : -1;
        m.position.set(-dir * 8.5, 0.6 + Math.random() * 1.6, z); g.add(m);
        bubbles.push({ m, r, vx: dir * (0.8 + Math.random() * 0.8), ph: Math.random() * 6 });
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const q = bubbles[i]; q.m.position.x += q.vx * dt; q.m.position.y += Math.sin(t * 2 + q.ph) * 0.004;
        let pop = Math.abs(q.m.position.x) > 9.5;
        for (const f of G.fighters) if (Math.hypot(f.x - q.m.position.x, f.z - q.m.position.z) < 0.6 + q.r && q.m.position.y < f.y + 2.6) { pop = true; if (Math.random() < 0.3) G.bub(f, 'bubble', 0.6); }
        if (pop) {
          if (Math.abs(q.m.position.x) < 9.5) { MD.Arena.sparks(q.m.position.clone(), 0xe8f6ff, 6); MD.Audio.tone(1400 + Math.random() * 600, 0.05, 'sine', 0.12, 2400); }
          g.remove(q.m); bubbles.splice(i, 1);
        }
      }
      for (const s of soaps) {
        if (s.gone) continue;
        s.cd -= dt;
        s.x += s.vx * dt; s.z += s.vz * dt; s.vx *= Math.pow(0.35, dt); s.vz *= Math.pow(0.35, dt);
        if (!MD.Arena.inside(s.x, s.z)) { s.vy -= 8 * dt; s.y += s.vy * dt; if (s.y < -0.5) { s.gone = true; s.m.visible = false; MD.Arena.sparks(new THREE.Vector3(s.x, -0.35, s.z), 0xffffff, 8); } }
        s.m.position.set(s.x, s.y + 0.08, s.z); s.m.rotation.y += Math.hypot(s.vx, s.vz) * dt * 2;
        if (G.phase !== 'fight' || s.y < 0 || s.cd > 0) continue;
        for (const f of G.fighters) {
          if (f.y > 0.15 || f.state === 'fall') continue;
          const dx = s.x - f.x, dz = s.z - f.z, d = Math.hypot(dx, dz);
          if (d < 0.45) {
            s.cd = 1.0;
            const fx = Math.sin(f.face), fz = Math.cos(f.face);
            f.vx += fx * 7; f.vz += fz * 7; s.vx = -fx * 4; s.vz = -fz * 4;
            MD.Audio.whoosh(); MD.Arena.sparks(new THREE.Vector3(f.x, 0.1, f.z), 0xffffff, 8);
            G.bub(f, 'soap', 1, true);
            if (Math.random() < 0.4) G.sayRaw(f.cw.name + ' stepped on the soap. Classic.');
          }
        }
      }
    };
  },
};
