// Map: Space Station. A round magnetic floor plate in orbit with Earth in the window. Gravity is low,
// astronaut rubber ducks float around, and sometimes the airlock opens and blows everyone sideways.
// Step off the plate and you drift away into space.
MD.MAPS.space = {
  key: 'space', name: 'Space Station', swatch: 'radial-gradient(circle at 35% 40%,#3f97bd 0 30%,#1d2a44 32%,#05060c 70%)',
  blurb: 'Low gravity on a round floor plate in orbit. Big floaty jumps, astronaut ducks, and an airlock that likes to open mid-fight.',
  shape: 'circle', radius: 5.2, floorY: -60, fallMode: 'float', music: 'fight', gravity: 0.45,
  env: { bg: 0x03040a, fog: [0x03040a, 40, 120], hemi: [0xbfd0ff, 0x1a1a2a, 0.55], key: [0xffffff, 1.3], rim: [0x4fd8ff, 0.9], warm: [0x8a6fd6, 0.6], exposure: 1.1 },
  ringout: ['{b} drifted into space. Houston, we have a duck.', '{b} is now a satellite. It will pass overhead every 90 minutes.'],
  build(K, b) {
    const g = b.group, M = MD.mat;
    const plate = K.canvasTex(1024, 1024, (c, w) => {
      c.fillStyle = '#9aa3b2'; c.fillRect(0, 0, w, w);
      c.strokeStyle = 'rgba(40,46,60,0.35)'; c.lineWidth = 3;
      for (let i = 0; i <= 16; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, w); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); }
      c.fillStyle = 'rgba(40,46,60,0.5)'; for (let y = 32; y < w; y += 64) for (let x = 32; x < w; x += 64) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
      c.strokeStyle = '#f5c518'; c.lineWidth = 18; c.setLineDash([60, 40]); c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 30, 0, 7); c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(29,27,34,0.6)'; c.font = '900 64px "Lilita One", sans-serif'; c.textAlign = 'center'; c.fillText('MAG-FLOOR · DO NOT STEP OFF', w / 2, w / 2 + 20);
    }).tex;
    b.surfaceMat = M(0xffffff, 0.5, 0.4, { map: plate });
    K.mesh(new THREE.CylinderGeometry(5.2, 5.0, 0.4, 64), b.surfaceMat, g, 0, -0.2, 0, false);
    const ringM = new THREE.MeshBasicMaterial({ color: 0x4fd8ff, toneMapped: false });
    const ring = K.mesh(new THREE.TorusGeometry(5.22, 0.06, 8, 96), ringM, g, 0, 0.0, 0, false); ring.rotation.x = Math.PI / 2;
    K.mesh(new THREE.CylinderGeometry(1.2, 2.4, 3, 24), M(0x5d6066, 0.5, 0.6), g, 0, -1.9, 0, false);
    // Stars, Earth, the station module around the window.
    const starGeo = new THREE.BufferGeometry(), sp = [];
    for (let i = 0; i < 900; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI - Math.PI / 2, r = 70 + Math.random() * 20; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r * 0.8 + 10, Math.sin(a) * Math.cos(e) * r); }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    g.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35, sizeAttenuation: true })));
    const earthTex = K.canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#2a6fb0'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#4f9a3a'; for (let i = 0; i < 22; i++) { c.beginPath(); c.ellipse(Math.random() * w, h * 0.2 + Math.random() * h * 0.6, 40 + Math.random() * 110, 20 + Math.random() * 60, Math.random() * 3, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 80, 6 + Math.random() * 14, Math.random(), 0, 7); c.fill(); }
      c.fillStyle = '#f3f6fa'; c.fillRect(0, 0, w, 30); c.fillRect(0, h - 30, w, 30);
    }).tex;
    const earth = K.mesh(new THREE.SphereGeometry(16, 48, 32), new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.8, emissive: 0x0a1a30, emissiveIntensity: 0.4 }), g, 10, -6, -42, false);
    const atmo = K.mesh(new THREE.SphereGeometry(16.6, 40, 28), new THREE.MeshBasicMaterial({ color: 0x6fd0ff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false }), g, 10, -6, -42, false);
    const hull = M(0xe4e8ee, 0.5, 0.2);
    [[-17, 4, -9, 14, 30], [17, 4, -9, 14, 30]].forEach(([x, y, z, w, h]) => K.box(w, h, 1, hull, x, y, z, g, false));
    K.box(48, 8, 1, hull, 0, 17, -9, g, false);
    const trim = new THREE.MeshBasicMaterial({ color: 0x4fd8ff, toneMapped: false });
    [[-10, 4, -8.4, 0.15, 26], [10, 4, -8.4, 0.15, 26]].forEach(([x, y, z, w, h]) => K.box(w, h, 0.1, trim, x, y, z, g, false));
    const panel = new THREE.Group(); panel.position.set(-14, 6, -8.3); g.add(panel);
    K.box(6, 3.6, 0.2, M(0x1d1b22, 0.4), 0, 0, -0.1, panel); K.screen(panel, 5.7, 3.3);
    // Astronaut rubber ducks floating around, in glass helmets.
    const helm = new THREE.MeshStandardMaterial({ color: 0xcfefff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.2, depthWrite: false });
    const floaters = [[-7.5, 3.5, -4], [-3, 5.2, -6], [3.5, 4.6, -6.5], [7.8, 3.2, -3.5], [-8.5, 2.2, 2], [8.6, 2.6, 2.5]];
    K.crowd(g, floaters.map(([x, y, z], i) => ({ color: [0xffd21f, 0xf6b6c8, 0x8cc4ea, 0xffd21f, 0xb8a5dd, 0xffffff][i], x, y, z, scale: 0.7, freq: 0.8 })), b.crowd);
    b.crowd.forEach(c => K.mesh(new THREE.SphereGeometry(0.45, 18, 12), helm, c.g, 0, 0.8, 0.2, false));
    // Floating space junk: a wrench and a sandwich.
    const junk = [];
    const wrench = new THREE.Group(); K.mesh(new THREE.BoxGeometry(1.4, 0.14, 0.1), M(0xb9bec6, 0.3, 0.8), wrench); K.mesh(new THREE.TorusGeometry(0.2, 0.07, 6, 14, Math.PI * 1.6), M(0xb9bec6, 0.3, 0.8), wrench, 0.8, 0, 0); g.add(wrench); junk.push({ o: wrench, p: [-5, 6, 3], s: 0.7 });
    const sand = new THREE.Group(); [[0xd9a35b, 0], [0x5bd66f, 0.1], [0xd8322c, 0.18], [0xd9a35b, 0.28]].forEach(([c, y]) => K.mesh(MD.rbox(0.9, 0.1, 0.9, 0.04), M(c, 0.7), sand, 0, y, 0)); g.add(sand); junk.push({ o: sand, p: [6, 7, 2], s: 0.5 });

    // Airlock gusts push everyone sideways for a few seconds.
    const air = { t: 9, on: 0, dir: 1, warned: false };
    const streaks = Array.from({ length: 24 }, () => { const m = K.mesh(new THREE.BoxGeometry(1.2, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.6, toneMapped: false }), g, 0, 0, 0, false); m.visible = false; return { m, x: 0, y: 0, z: 0 }; });
    b.onRound = () => { air.t = 9 + Math.random() * 4; air.on = 0; streaks.forEach(s => { s.m.visible = false; }); };
    b.update = function (dt, t, G) {
      earth.rotation.y = t * 0.02; atmo.rotation.y = t * 0.02;
      ringM.color.setHSL(0.53, 1, 0.55 + Math.sin(t * 2) * 0.1);
      b.crowd.forEach((c, i) => { c.g.rotation.y += dt * (0.2 + i * 0.05); c.g.position.x = floaters[i][0] + Math.sin(t * 0.3 + i) * 0.5; });
      junk.forEach((j, i) => { j.o.position.set(j.p[0] + Math.sin(t * 0.2 + i) * 1.5, j.p[1] + Math.sin(t * 0.5 + i) * 0.6, j.p[2]); j.o.rotation.x += dt * j.s; j.o.rotation.z += dt * j.s * 0.6; });
      if (G.phase === 'fight' && air.on <= 0) {
        air.t -= dt;
        if (air.t < 1.2 && !air.warned) { air.warned = true; air.dir = Math.random() < 0.5 ? 1 : -1; MD.UI.banner('Airlock opening', air.dir > 0 ? 'Hold on! The wind blows to the right.' : 'Hold on! The wind blows to the left.', 2.4); MD.Audio.tone(880, 0.15, 'square', 0.1); MD.Audio.tone(660, 0.15, 'square', 0.1, null, 0.2); }
        if (air.t <= 0) { air.on = 3; air.warned = false; MD.Audio.noise(3, 0.25, 600, 0.4, 0, 'lowpass'); streaks.forEach(s => { s.x = (Math.random() - 0.5) * 16; s.y = 0.3 + Math.random() * 3; s.z = (Math.random() - 0.5) * 9; s.m.visible = true; }); }
      }
      if (air.on > 0) {
        air.on -= dt;
        for (const f of G.fighters) {
          if (f.state === 'fall') continue;
          const hold = f.state === 'block' ? 0.35 : 1;
          f.vx += air.dir * 5.5 * hold * dt / f.cw.stats.weight;
          if (Math.random() < dt * 0.6) G.bub(f, 'wind', 0.8);
        }
        streaks.forEach(s => { s.x += air.dir * 20 * dt; if (Math.abs(s.x) > 9) s.x = -air.dir * 9; s.m.position.set(s.x, s.y, s.z); });
        if (air.on <= 0) { streaks.forEach(s => { s.m.visible = false; }); air.t = 11 + Math.random() * 5; }
      }
    };
  },
};
