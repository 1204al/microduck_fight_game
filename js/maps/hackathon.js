// Map: Hackathon, 3 AM. Fight on a giant pizza box on a messy table. Laptops show code, cans of
// energy drink stand around, pizza slices and caffeine drop in, and rubber ducks help with debugging.
MD.MAPS.hackathon = {
  key: 'hackathon', name: 'Hackathon 3 AM', swatch: 'linear-gradient(135deg,#d9b07a 0 50%,#14161f 50% 80%,#5bd66f 80%)',
  blurb: 'A giant pizza box at a 3 AM hackathon. Eat pizza for integrity, drink energy drinks for speed, and do not deploy on a Friday.',
  shape: 'rect', hw: 6.0, hd: 4.0, spawn: [3.9, 2.5], floorY: -7.4, music: 'fight',
  env: { bg: 0x14161f, fog: [0x14161f, 20, 46], hemi: [0x9fb4ff, 0x2a2018, 0.5], key: [0xfff1dc, 1.0], rim: [0x4fd8ff, 0.9], warm: [0xffb36b, 0.7], exposure: 1.1 },
  ringout: ['{b} fell off the pizza box. Merge conflict.', '{b} has been deprecated.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const lid = K.canvasTex(1536, 1024, (c, w, h) => {
      c.fillStyle = '#d9b07a'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) { c.fillStyle = `rgba(150,100,40,${0.06 + Math.random() * 0.08})`; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 40 + Math.random() * 90, 30 + Math.random() * 60, Math.random() * 3, 0, 7); c.fill(); }
      c.fillStyle = '#d8322c'; c.beginPath(); c.arc(w / 2, h / 2 - 40, 210, 0, 7); c.fill();
      c.fillStyle = '#f7f1e6'; c.font = '900 120px "Lilita One", sans-serif'; c.textAlign = 'center'; c.fillText('PIZZA', w / 2, h / 2);
      c.font = '800 44px "Chivo", sans-serif'; c.fillText('HOT · FRESH · 3 AM', w / 2, h / 2 + 60);
      c.fillStyle = '#7a4a1a'; c.font = '800 40px "Chivo", sans-serif'; c.fillText('THANK YOU · THANK YOU · THANK YOU', w / 2, h - 70);
      c.strokeStyle = 'rgba(110,70,30,0.5)'; c.lineWidth = 6; c.strokeRect(30, 30, w - 60, h - 60);
    }).tex;
    b.surfaceMat = M(0xffffff, 0.9, 0, { map: lid });
    K.box(12, 0.8, 8, M(0xc79a62, 0.9), 0, -0.4, 0, g);
    K.mesh(new THREE.BoxGeometry(12, 0.02, 8), b.surfaceMat, g, 0, 0.01, 0, false);
    // Messy table and floor.
    K.box(26, 0.6, 14, M(0x3a3542, 0.6), 0, -1.1, 0, g, false);
    [[-12, -6], [12, -6], [-12, 6], [12, 6]].forEach(([x, z]) => K.box(0.5, 6.6, 0.5, M(0x2a2830, 0.5, 0.5), x, -4.7, z, g, false));
    K.mesh(new THREE.PlaneGeometry(90, 90), M(0x22202a, 0.95), g, 0, -8, 0, false).rotation.x = -Math.PI / 2;
    const banner = K.canvasTex(1024, 256, (c, w, h) => { c.fillStyle = '#7c4dff'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffffff'; c.font = '900 110px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HACK THE DUCK', w / 2, h / 2 - 18); c.font = '700 40px "Chivo Mono", monospace'; c.fillText('48 HOURS · 0 HOURS OF SLEEP', w / 2, h / 2 + 70); }).tex;
    K.mesh(new THREE.PlaneGeometry(16, 4), new THREE.MeshBasicMaterial({ map: banner }), g, 0, 10.5, -12.5, false);
    K.mesh(new THREE.PlaneGeometry(70, 28), M(0x262433, 0.95), g, 0, 6, -13, false);
    // Laptops with code (one shows the training chart).
    const code = K.canvasTex(512, 320, (c, w, h) => {
      c.fillStyle = '#0e1116'; c.fillRect(0, 0, w, h); c.font = '18px "Chivo Mono", monospace';
      const lines = ['def train_duck(policy):', '  for ep in range(10**9):', '    obs = duck.camera()', '    if duck.fell_over():', '      duck.get_up()  # again', '    reward += sock_found', '# TODO: fix before demo', 'git push --force  # yolo', 'while True: quack()'];
      lines.forEach((l, i) => { c.fillStyle = ['#7cff6b', '#f5c518', '#8cc4ea', '#f3eee4', '#ff8a3d'][i % 5]; c.fillText(l, 16, 34 + i * 30); });
    }).tex;
    const laptop = (x, z, ry, chart) => {
      const lg = new THREE.Group(); lg.position.set(x, -0.8, z); lg.rotation.y = ry; g.add(lg);
      K.box(3.2, 0.12, 2.2, M(0xb9bec6, 0.3, 0.7), 0, 0.06, 0, lg);
      const lidG = new THREE.Group(); lidG.position.set(0, 0.12, -1.1); lidG.rotation.x = -0.3; lg.add(lidG);
      K.box(3.2, 2.1, 0.08, M(0xb9bec6, 0.3, 0.7), 0, 1.05, -0.04, lidG);
      const scr = chart ? K.screen(lidG, 3.0, 1.9) : K.mesh(new THREE.PlaneGeometry(3.0, 1.9), new THREE.MeshBasicMaterial({ map: code, toneMapped: false }), lidG, 0, 0, 0, false);
      scr.position.set(0, 1.05, 0.01);
      return lg;
    };
    laptop(-9.5, -3.5, 0.4, false); laptop(9.4, -3.6, -0.4, true); laptop(-9.8, 3.4, 2.6, false);
    const glow = new THREE.PointLight(0x4fd8ff, 0.9, 12); glow.position.set(0, 3, -5); g.add(glow);
    // Energy drink cans and coffee cups (solid, on the box corners).
    const can = (x, z, c) => { const m = K.mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.1, 18), M(c, 0.25, 0.6), g, x, 0.55, z); K.mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.06, 18), M(0xd8dde3, 0.25, 0.9), m, 0, 0.57, 0); b.obstacles.push({ x, z, r: 0.45 }); };
    can(-5.3, -3.3, 0x7cff6b); can(5.3, -3.3, 0x1a1a1a); can(5.4, 3.3, 0x3f7fb3);
    const sticky = ['#f5c518', '#f6b6c8', '#8cc4ea', '#7cff6b'];
    for (let i = 0; i < 9; i++) { const n = K.mesh(new THREE.PlaneGeometry(0.9, 0.9), M(sticky[i % 4], 0.9, 0, { side: THREE.DoubleSide }), g, -11 + i * 2.7 + Math.random(), 5 + Math.random() * 2, -12.9, false); n.rotation.z = (Math.random() - 0.5) * 0.4; }
    // Rubber-duck debugging crowd on the table edge.
    K.crowd(g, [0xffd21f, 0x8cc4ea, 0xffd21f, 0xf6b6c8, 0xffd21f, 0xb8a5dd].map((c, i) => ({ color: c, x: -6.5 + i * 2.6, y: -0.8, z: -5.4, scale: 0.8 })), b.crowd);

    // Pizza slices (heal) and energy drinks (speed) drop in.
    MD.Items.makers.pizza = function () {
      const t = new THREE.Group(), s = new THREE.Shape();
      s.moveTo(0, 0.45); s.lineTo(-0.36, -0.3); s.quadraticCurveTo(0, -0.42, 0.36, -0.3); s.lineTo(0, 0.45);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }), M(0xf5c518, 0.6)); m.rotation.x = -Math.PI / 2; m.position.y = 0.08; m.castShadow = true; t.add(m);
      const crust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.72, 8), M(0xc98f5a, 0.7)); crust.rotation.z = Math.PI / 2; crust.position.set(0, 0.1, 0.32); t.add(crust);
      [[0.05, 0.1], [-0.1, -0.12], [0.12, -0.15]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10), M(0xd8322c, 0.5)); p.position.set(x, 0.15, -z); t.add(p); });
      return t;
    };
    MD.Items.makers.energy = function () {
      const t = new THREE.Group();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 14), M(0x7cff6b, 0.25, 0.6)); m.position.y = 0.26; m.castShadow = true; t.add(m);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.04, 14), M(0xd8dde3, 0.25, 0.9)); top.position.y = 0.52; t.add(top);
      return t;
    };
    let dropT = 6;
    b.onRound = () => { dropT = 5 + Math.random() * 3; };
    b.update = function (dt, t, G) {
      glow.intensity = 0.8 + Math.sin(t * 2.3) * 0.1;
      if (G.phase !== 'fight') return;
      dropT -= dt;
      if (dropT <= 0) {
        dropT = 8 + Math.random() * 4;
        const p = MD.Arena.randomSpot(), kind = Math.random() < 0.55 ? 'pizza' : 'energy';
        MD.Items.spawn(kind, p.x, p.z);
        if (Math.random() < 0.5) G.sayRaw(kind === 'pizza' ? 'Free pizza has arrived. Hackathon rules: grab it first.' : 'An energy drink drops in. Side effects include going fast.');
      }
    };
  },
};
