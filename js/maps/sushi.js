// Map: Sushi Bar. Two conveyor belts run across the counter in opposite directions and carry ducks
// (sometimes right off the end). Sushi plates ride the belts and heal you, wasabi makes you fast,
// lanterns glow and lucky cats wave.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.makeSushiPlate = function (col) {
  const g = new THREE.Group(), M = MD.mat;
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.08, 24), M(col || 0x3f7fb3, 0.3)); plate.position.y = 0.04; plate.castShadow = true; g.add(plate);
  const rice = new THREE.Mesh(MD.rbox(0.42, 0.16, 0.22, 0.07), M(0xf7f5f0, 0.8)); rice.position.y = 0.16; g.add(rice);
  const fish = new THREE.Mesh(MD.rbox(0.48, 0.07, 0.26, 0.04), M(0xff8a5c, 0.4)); fish.position.y = 0.27; g.add(fish);
  return g;
};
MD.Items.makers.sushi = () => MD.makeSushiPlate(0xd8322c);
MD.Items.makers.wasabi = () => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), MD.mat(0x7cc84a, 0.7)); m.scale.y = 0.7; m.position.y = 0.14; m.castShadow = true; g.add(m); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 10), MD.mat(0x7cc84a, 0.7)); tip.position.y = 0.32; g.add(tip); return g; };
MD.ICON_MAKERS.belt = () => {
  const g = new THREE.Group();
  const b = new THREE.Mesh(MD.rbox(2.4, 0.18, 0.9, 0.06), MD.mat(0x2b2b33, 0.6)); b.position.y = 0.09; g.add(b);
  [-0.7, 0, 0.7].forEach(x => { const a = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 3), new THREE.MeshBasicMaterial({ color: 0xf5c518, toneMapped: false })); a.rotation.z = -Math.PI / 2; a.position.set(x, 0.22, 0); g.add(a); });
  return g;
};
const BELT_Z = 1.45, BELT_W = 1.5, BELT_V = 2.3;
MD.MAPS.sushi = {
  key: 'sushi', name: 'Sushi Bar', swatch: 'linear-gradient(135deg,#c98f5a 0 40%,#2b2b33 40% 60%,#d8322c 60%)',
  blurb: 'Two conveyor belts run across the sushi counter in opposite directions. They carry you along, sometimes right off the end. Grab the sushi as it rides by.',
  shape: 'rect', hw: 6.4, hd: 3.4, spawn: [4.2, 2.6], floorY: -7.4, music: 'fight', backWall: true,
  // Standing on a belt moves you: the back belt runs right, the front belt runs left.
  conveyor: (x, z) => (Math.abs(z + BELT_Z) < BELT_W / 2 ? [BELT_V, 0] : Math.abs(z - BELT_Z) < BELT_W / 2 ? [-BELT_V, 0] : null),
  env: { bg: 0x2a1a14, fog: [0x2a1a14, 24, 56], hemi: [0xffe6c8, 0x3a2414, 0.6], key: [0xfff0d8, 1.25], rim: [0xffb36b, 0.6], warm: [0xff7a4a, 0.9], exposure: 1.05 },
  ringout: ['{b} fell off the sushi counter. The chef is not happy.', '{b} took the express lane off the conveyor belt.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const hinoki = K.canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#e2c08a'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 120; i++) { c.strokeStyle = `rgba(150,100,50,${0.05 + Math.random() * 0.08})`; c.lineWidth = 1 + Math.random() * 2; const y = Math.random() * h; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 5, w * 0.7, y - 5, w, y); c.stroke(); }
    }).tex;
    b.surfaceMat = M(0xffffff, 0.6, 0, { map: hinoki });
    K.box(12.8, 0.6, 6.8, b.surfaceMat, 0, -0.3, 0, g);
    K.box(13, 7.4, 6.6, M(0x5a2a1a, 0.7), 0, -4.3, 0, g, false);
    K.mesh(new THREE.PlaneGeometry(90, 90), M(0x3a2a20, 0.9), g, 0, -8, 0, false).rotation.x = -Math.PI / 2;
    // Belts: dark slats with a scrolling texture and chrome rails.
    const slats = K.canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#2b2b33'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d1b22'; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 4, h); c.fillStyle = 'rgba(245,197,24,0.8)'; for (let x = 12; x < w; x += 64) { c.beginPath(); c.moveTo(x, 20); c.lineTo(x + 14, 32); c.lineTo(x, 44); c.fill(); } }).tex;
    slats.wrapS = THREE.RepeatWrapping; slats.repeat.set(8, 1);
    const belts = [-1, 1].map(s => {
      const tex = slats.clone(); tex.needsUpdate = true; tex.repeat.set(8, 1); if (s > 0) { tex.center.set(0.5, 0.5); tex.rotation = Math.PI; }
      const m = K.mesh(new THREE.BoxGeometry(12.8, 0.04, BELT_W), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), g, 0, 0.02, s * BELT_Z, false);
      [-1, 1].forEach(e => K.box(12.8, 0.1, 0.08, M(0xd8dde3, 0.25, 0.9), 0, 0.05, s * BELT_Z + e * (BELT_W / 2 + 0.04), g, false));
      return { tex, s };
    });
    // Restaurant: a back wall with a noren curtain, lanterns, a menu board, and lucky cats waving.
    K.mesh(new THREE.PlaneGeometry(60, 26), M(0xe8d8b8, 0.9), g, 0, 8, -3.6, false);
    const noren = K.canvasTex(1024, 256, (c, w, h) => { c.fillStyle = '#1f3a6a'; c.fillRect(0, 0, w, h); c.fillStyle = '#f3eee4'; c.font = '900 120px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SUSHI', w / 2, h / 2); for (let x = w / 5; x < w; x += w / 5) { c.fillStyle = '#e8d8b8'; c.fillRect(x - 3, 0, 6, h); } }).tex;
    K.mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshStandardMaterial({ map: noren, side: THREE.DoubleSide, roughness: 0.9 }), g, 0, 9.5, -3.5, false);
    const lanterns = [-8, -4, 4, 8].map((x, i) => {
      const l = K.mesh(new THREE.SphereGeometry(0.9, 18, 12), new THREE.MeshStandardMaterial({ color: 0xd8322c, emissive: 0xff5a3a, emissiveIntensity: 0.7, roughness: 0.6 }), g, x, 7.5 + (i % 2) * 0.6, -2.4, false);
      l.scale.y = 1.25; const pl = new THREE.PointLight(0xff7a4a, 0.5, 9); pl.position.copy(l.position); g.add(pl); return l;
    });
    const menu = new THREE.Group(); menu.position.set(-6.5, 4.4, -3.5); g.add(menu);
    K.box(5.4, 3.2, 0.2, M(0x2a1a10, 0.5), 0, 0, -0.1, menu); K.screen(menu, 5.1, 2.9);
    const cats = [];
    [3.6, 6.2, 8.8].forEach((x, i) => {
      const cat = new THREE.Group(); cat.position.set(x, 3.0, -3.1); g.add(cat);
      const white = M(0xf7f5f0, 0.4), gold = M(0xf2b705, 0.3, 0.6);
      K.mesh(MD.rbox(1.0, 1.1, 0.8, 0.35), white, cat, 0, 0.55, 0);
      const head = K.mesh(new THREE.SphereGeometry(0.5, 16, 12), white, cat, 0, 1.4, 0.05);
      [-0.28, 0.28].forEach(ex => K.mesh(new THREE.ConeGeometry(0.15, 0.3, 4), white, head, ex, 0.42, 0));
      [-0.16, 0.16].forEach(ex => K.mesh(new THREE.SphereGeometry(0.05, 8, 6), M(0x1d1b22, 0.3), head, ex, 0.05, 0.45, false));
      K.mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), gold, cat, 0, 0.6, 0.42, false).rotation.x = Math.PI / 2;
      const arm = new THREE.Group(); arm.position.set(0.45, 1.0, 0.2); cat.add(arm);
      K.mesh(MD.rbox(0.25, 0.6, 0.25, 0.1), white, arm, 0, 0.3, 0);
      cats.push({ arm, ph: i * 1.1 });
      K.box(1.4, 0.2, 1.2, M(0x5a2a1a, 0.6), x, 2.9, -3.1, g, false);
    });
    K.crowd(g, [0xffd21f, 0xf6b6c8, 0x8cc4ea].map((c, i) => ({ color: c, x: -9 + i * 1.5, y: 1.0, z: -3.2, scale: 0.65 })), b.crowd);
    K.box(5, 0.2, 1.2, M(0x5a2a1a, 0.6), -7.5, 0.9, -3.2, g, false);

    // Sushi plates riding the belts (pickups), refilled as they are eaten.
    const plateCols = [0x3f7fb3, 0xd8322c, 0xf2b705, 0x5bd66f];
    const plates = [];
    const addPlate = (lane, x) => { const m = MD.makeSushiPlate(plateCols[Math.floor(Math.random() * 4)]); g.add(m); plates.push({ m, lane, x }); };
    const fill = () => { plates.forEach(p => g.remove(p.m)); plates.length = 0; for (let i = 0; i < 3; i++) { addPlate(-1, -5 + i * 4.5); addPlate(1, -3 + i * 4.5); } };
    fill();
    let wasabiT = 8;
    b.onRound = () => { fill(); wasabiT = 6 + Math.random() * 4; };
    b.update = function (dt, t, G) {
      belts.forEach(bl => { bl.tex.offset.x -= dt * BELT_V / 1.6; });
      cats.forEach(c => { c.arm.rotation.z = Math.sin(t * 3 + c.ph) * 0.6 - 0.3; });
      lanterns.forEach((l, i) => { l.rotation.z = Math.sin(t * 0.9 + i) * 0.06; });
      for (let i = plates.length - 1; i >= 0; i--) {
        // Back belt (lane -1) runs right, front belt (lane +1) runs left, matching the conveyor push.
        const p = plates[i]; p.x += (p.lane < 0 ? BELT_V : -BELT_V) * dt;
        if (p.x > 6.6) p.x = -6.6; if (p.x < -6.6) p.x = 6.6;
        p.m.position.set(p.x, 0.04, p.lane * BELT_Z); p.m.rotation.y += dt * 0.5;
        if (G.phase !== 'fight') continue;
        for (const f of G.fighters) {
          if (f.y > 0.5 || !G.canAct(f)) continue;
          if (Math.hypot(f.x - p.x, f.z - p.lane * BELT_Z) < 0.65) { G.pickup(f, { type: 'sushi', x: p.x, z: p.lane * BELT_Z }); g.remove(p.m); plates.splice(i, 1); setTimeout(() => MD.Game.running() && addPlate(p.lane, p.lane < 0 ? -6.5 : 6.5), 4000); break; }
        }
      }
      if (G.phase === 'fight') { wasabiT -= dt; if (wasabiT <= 0) { wasabiT = 10 + Math.random() * 5; const sp = MD.Arena.randomSpot(); MD.Items.spawn('wasabi', sp.x, 0); if (Math.random() < 0.5) G.sayRaw('A blob of wasabi lands on the counter. Proceed with caution.'); } }
    };
  },
};
