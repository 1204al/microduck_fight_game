// Map: Quack Club (disco). A light-up dance floor stage, a mirror ball throwing light spots, sweeping
// spotlights, neon signs, a DJ duck with turntables, pulsing speakers, and a crowd that bobs on the beat.
MD.MAPS.disco = {
  key: 'disco', name: 'Quack Club', swatch: 'conic-gradient(#ff4fd8,#4fd8ff,#f5c518,#7c4dff,#ff4fd8)',
  blurb: 'A dark disco with a light-up dance floor and a mirror ball. The DJ is a duck. Dance breaks happen a lot more often here.',
  shape: 'rect', hw: 6.6, hd: 4.0, spawn: [4.2, 2.5], floorY: -1.25, music: 'disco', eventWeights: { dance: 6 },
  ground: () => 0.02,
  env: { bg: 0x07040c, fog: [0x0d0618, 16, 42], hemi: [0x7a5cb0, 0x120a1c, 0.45], key: [0xd6c8ff, 0.55], rim: [0xff4fd8, 1.0], warm: [0x4fd8ff, 0.9], exposure: 1.15 },
  ringout: ['{b} fell off the stage. Stage diving is not in the training data.', '{b} left the dance floor. Security escorts it out.'],
  build(K, b) {
    const g = b.group, M = MD.mat, BEAT = 60 / 124;
    // Stage and light-up tiles.
    K.box(13.4, 1.25, 8.2, M(0x15101d, 0.5, 0.3), 0, -0.625, 0, g, false);
    const trim = new THREE.MeshBasicMaterial({ color: 0xff4fd8, toneMapped: false });
    [[0, -0.06, 4.12, 13.4, 0.08, 0.06], [0, -0.06, -4.12, 13.4, 0.08, 0.06], [6.72, -0.06, 0, 0.06, 0.08, 8.2], [-6.72, -0.06, 0, 0.06, 0.08, 8.2]].forEach(([x, y, z, w, h, d]) => K.box(w, h, d, trim, x, y, z, g, false));
    const NX = 13, NZ = 8;
    b.surfaceMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.96, 0.04, 0.96), b.surfaceMat, NX * NZ);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { dummy.position.set(-6 + i, 0.0, -3.5 + j); dummy.updateMatrix(); tiles.setMatrixAt(i * NZ + j, dummy.matrix); tiles.setColorAt(i * NZ + j, new THREE.Color(0x222222)); }
    tiles.receiveShadow = true; g.add(tiles);
    K.mesh(new THREE.PlaneGeometry(90, 90), M(0x0c0912, 0.9), g, 0, -1.26, 0, false).rotation.x = -Math.PI / 2;
    // Walls with neon signs.
    K.mesh(new THREE.PlaneGeometry(70, 26), M(0x120d1a, 0.95), g, 0, 8, -13, false);
    const neon = (text, color, w, h, font) => K.canvasTex(1024, 256, (c, cw, ch) => {
      c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = color; c.shadowBlur = 40; c.fillStyle = color; c.fillText(text, cw / 2, ch / 2);
      c.shadowBlur = 12; c.fillStyle = '#ffffff'; c.globalAlpha = 0.85; c.fillText(text, cw / 2, ch / 2);
    }).tex;
    const sign = (text, color, x, y, z, w, h, font) => { const s = K.mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: neon(text, color, w, h, font), transparent: true, toneMapped: false, depthWrite: false }), g, x, y, z, false); return s; };
    const quack = sign('QUACK CLUB', '#ff4fd8', -7.5, 10.5, -12.8, 12, 3, '900 150px "Lilita One", sans-serif');
    sign('50 Hz', '#4fd8ff', 9.5, 11, -12.8, 7, 1.75, '900 160px "Lilita One", sans-serif');
    sign('NO FALLING ON THE DANCE FLOOR', '#f5c518', 9.5, 8.8, -12.8, 9, 2.25, '800 70px "Chivo", sans-serif');
    // DJ booth with a duck DJ, turntables, and the chart on an LED wall.
    const booth = new THREE.Group(); booth.position.set(0, -1.25, -7.8); g.add(booth);
    K.box(6, 2.6, 1.8, M(0x1d1b22, 0.4, 0.4), 0, 1.3, 0, booth);
    K.box(6.1, 0.12, 1.9, trim, 0, 2.62, 0, booth, false);
    const decks = [-1.5, 1.5].map(x => { const d = K.mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 28), M(0x111111, 0.3), booth, x, 2.72, 0.1); K.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.07, 12), M(0xf5c518, 0.4), d, 0.25, 0.01, 0); return d; });
    const dj = MD.Items.makers.rubber(0xffd21f); dj.scale.setScalar(1.6); dj.position.set(0, 2.6, -0.9); booth.add(dj);
    const phones = K.mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 20, Math.PI), M(0x1d1b22, 0.4), dj, 0, 0.82, 0.22, false); phones.rotation.y = Math.PI / 2;
    [-1, 1].forEach(s => K.mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14), M(0xff4fd8, 0.4), dj, 0.3 * s, 0.8, 0.22, false).rotation.z = Math.PI / 2);
    const led = new THREE.Group(); led.position.set(0, 6.6, -11.8); g.add(led);
    K.box(10.4, 5.9, 0.3, M(0x0a0a0e, 0.4), 0, 0, -0.16, led); K.screen(led, 10, 5.6);
    // Speakers that pump on the beat.
    const woofers = [];
    [-9.6, 9.6].forEach(x => {
      const sp = new THREE.Group(); sp.position.set(x, -1.25, -6.5); g.add(sp);
      K.box(2.6, 6.4, 2.2, M(0x16131c, 0.5), 0, 3.2, 0, sp);
      [1.6, 4.4].forEach(y => { const w = K.mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.12, 28), M(0x2a2532, 0.4, 0.3), sp, 0, y, 1.12, false); w.rotation.x = Math.PI / 2; woofers.push(w); });
    });
    // Crowd on risers either side of the booth, in neon colors.
    K.box(4.6, 1.3, 2.4, M(0x1d1b22, 0.5), -6.2, -0.6, -7.6, g, false); K.box(4.6, 1.3, 2.4, M(0x1d1b22, 0.5), 6.2, -0.6, -7.6, g, false);
    const neonDucks = [0xff4fd8, 0x4fd8ff, 0xf5c518, 0x7cff6b, 0xff8a3d, 0xb38cff];
    K.crowd(g, neonDucks.map((c, i) => ({ color: c, x: (i < 3 ? -7.6 : 4.8) + (i % 3) * 1.4, y: 0.05, z: -7.4, scale: 0.75, freq: Math.PI / BEAT, rotY: i < 3 ? 0.35 : -0.35 })), b.crowd);
    // Mirror ball, light spots and sweeping spotlights.
    const ball = K.mesh(new THREE.IcosahedronGeometry(1.0, 2), new THREE.MeshStandardMaterial({ color: 0xd8dde8, metalness: 0.85, roughness: 0.18, flatShading: true, emissive: 0x2a2a35 }), g, 0, 8.2, -1.5, false);
    K.mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 6), M(0x888888, 0.4, 0.8), g, 0, 10.6, -1.5, false);
    const ballLight = new THREE.PointLight(0xffffff, 0.6, 12); ballLight.position.set(0, 6.8, -1.5); g.add(ballLight);
    const spotGeo = new THREE.CircleGeometry(0.22, 14);
    const spots = Array.from({ length: 30 }, (_, i) => {
      const m = new THREE.MeshBasicMaterial({ color: [0xffffff, 0xff4fd8, 0x4fd8ff, 0xf5c518][i % 4], transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
      const s = new THREE.Mesh(spotGeo, m); s.rotation.x = -Math.PI / 2; g.add(s);
      return { s, r: 1 + Math.random() * 6, a: Math.random() * Math.PI * 2, y: 0.04 + Math.random() * 0.02 };
    });
    const spotsL = [0xff4fd8, 0x4fd8ff, 0xf5c518].map((c, i) => {
      const s = new THREE.SpotLight(c, 1.6, 30, 0.32, 0.5, 1.2); s.position.set(-8 + i * 8, 11, 4); g.add(s); g.add(s.target);
      return { s, p: i * 2.1 };
    });

    const PAL = [[0xff4fd8, 0x4fd8ff], [0xf5c518, 0x7c4dff], [0x7cff6b, 0xff4fd8], [0x4fd8ff, 0xf5c518]].map(p => p.map(c => new THREE.Color(c)));
    const col = new THREE.Color(), dark = new THREE.Color(0x1a1622);
    let lastBeat = -1;
    b.update = function (dt, t) {
      const beat = t / BEAT, bi = Math.floor(beat), ph = beat - bi, bar = Math.floor(bi / 4), pal = PAL[bar % PAL.length], mode = Math.floor(bar / 2) % 4;
      for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
        let on;
        if (mode === 0) on = (i + j + bi) % 2 === 0;
        else if (mode === 1) on = Math.abs(((i - bi) % NX + NX) % NX - 6) < 2;
        else if (mode === 2) on = Math.abs(Math.hypot(i - 6, (j - 3.5) * 1.5) - (bi % 8)) < 1.1;
        else on = ((i * 7 + j * 13 + bi * 5) % 5) === 0;
        const c = on ? pal[(i + j) % 2] : dark;
        col.copy(c).multiplyScalar(on ? 1 - ph * 0.45 : 1);
        tiles.setColorAt(i * NZ + j, col);
      }
      tiles.instanceColor.needsUpdate = true;
      ball.rotation.y = t * 0.6;
      spots.forEach((sp, k) => { const a = sp.a + t * 0.6; sp.s.position.set(Math.cos(a) * sp.r, sp.y, -1.5 + Math.sin(a) * sp.r * 0.7); sp.s.material.opacity = 0.35 + 0.25 * Math.sin(t * 3 + k); });
      spotsL.forEach(s => { s.s.target.position.set(Math.sin(t * 0.7 + s.p) * 5, 0, Math.cos(t * 0.5 + s.p) * 3); });
      const pump = 1 + Math.max(0, 1 - ph * 4) * 0.12;
      woofers.forEach(w => w.scale.set(pump, 1, pump));
      decks.forEach((d, k) => { d.rotation.y += dt * (k ? -5 : 5); });
      dj.rotation.x = Math.sin(beat * Math.PI) * 0.12; dj.rotation.y = Math.sin(t * 0.8) * 0.4;
      trim.color.setHSL((t * 0.1) % 1, 1, 0.6);
      quack.material.opacity = ph < 0.08 && bi % 8 === 7 ? 0.3 : 1;
      if (bi !== lastBeat) lastBeat = bi;
    };
  },
};
