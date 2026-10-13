// Map: Keyboard Warrior. A giant mechanical keyboard on a gaming desk. Keys click and press down under
// the ducks, the monitor shows what they "type", and the spacebar launches you into the air.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.ICON_MAKERS.spacebar = () => {
  const g = new THREE.Group();
  const k = new THREE.Mesh(MD.rbox(2.4, 0.35, 0.8, 0.12), MD.mat(0xf5c518, 0.45)); k.position.y = 0.2; g.add(k);
  const base = new THREE.Mesh(MD.rbox(2.6, 0.2, 1.0, 0.08), MD.mat(0x1d1b22, 0.5)); base.position.y = 0.05; g.add(base);
  return g;
};
MD.MAPS.keyboard = {
  key: 'keyboard', name: 'Keyboard Warrior', swatch: 'linear-gradient(135deg,#2b2a33 0 60%,#ff4fd8 60% 75%,#4fd8ff 75%)',
  blurb: 'A giant mechanical keyboard with RGB lighting. Every key clicks under your feet, the monitor shows what you typed, and the spacebar launches you.',
  shape: 'rect', hw: 6.0, hd: 2.5, spawn: [4.0, 1.6], floorY: -0.9, music: 'fight',
  env: { bg: 0x0d0c14, fog: [0x0d0c14, 22, 52], hemi: [0x9a8cff, 0x14101e, 0.5], key: [0xf0eaff, 1.15], rim: [0xff4fd8, 0.9], warm: [0x4fd8ff, 0.8], exposure: 1.1 },
  ringout: ['{b} fell off the keyboard. Alt+F4.', '{b} slipped between the keys. Somebody vacuum the crumbs.'],
  build(K, b) {
    const g = b.group, M = MD.mat, U = 1.0, GAP = 0.08;
    // Base with RGB underglow.
    K.box(12.6, 0.6, 5.6, M(0x1a1922, 0.4, 0.3), 0, -0.62, 0, g);
    const glowM = new THREE.MeshBasicMaterial({ color: 0xff4fd8, toneMapped: false });
    K.box(12.7, 0.08, 5.7, glowM, 0, -0.9, 0, g, false);
    K.box(40, 0.6, 18, M(0x24222e, 0.7), 0, -1.2, 0, g, false);
    // Keycaps, QWERTY rows and a spacebar. Each key knows its rectangle so it can press down.
    b.surfaceMat = M(0x2b2a33, 0.55);
    const legend = {}, keys = [];
    const capTex = (L, dark) => legend[L] || (legend[L] = K.canvasTex(128, 128, (c) => { c.fillStyle = dark ? '#2b2a33' : '#f5c518'; c.fillRect(0, 0, 128, 128); c.fillStyle = dark ? '#e8e4f2' : '#1d1b22'; c.font = '800 54px "Chivo", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(L, 16, 12); }).tex);
    const addKey = (L, x, z, w) => {
      const gamer = ('WASD'.includes(L) && L.length === 1) || L === 'SPACE', esc = L === 'ESC';
      const top = esc ? M(0xff8a3d, 0.5) : L === 'SPACE' ? M(0xf5c518, 0.45) : new THREE.MeshStandardMaterial({ map: capTex(L, !gamer), roughness: 0.5 });
      const side = M(gamer ? 0xc99a10 : 0x1f1e26, 0.5);
      const cap = K.mesh(MD.rbox(w - GAP, 0.5, U - GAP, 0.1), side, g, x, -0.25, z);
      // The legend sits on a thin plate on top of the cap so it moves with it when pressed.
      const face = K.mesh(new THREE.PlaneGeometry(w - GAP - 0.14, U - GAP - 0.14), top, cap, 0, 0.251, 0, false);
      face.rotation.x = -Math.PI / 2; face.receiveShadow = true;
      keys.push({ L, cap, x, z, w, down: 0, by: -0.25, pressed: false });
    };
    const rows = [['ESC', ...'1234567890'.split(''), '-'], 'QWERTYUIOP['.split(''), "ASDFGHJKL;'".split(''), 'ZXCVBNM,./'.split('')];
    rows.forEach((row, r) => { const off = [0, 0.3, 0.55, 0.85][r]; row.forEach((L, i) => addKey(L, -6 + 0.5 + off + i * U, -2 + r * U, U)); });
    addKey('SPACE', 0, 2.0, 6); const spaceKey = keys[keys.length - 1];
    // Desk clutter: mouse, mousepad, monitor (shows the chart and your typing), a duck figurine audience.
    const pad = K.mesh(new THREE.BoxGeometry(6, 0.04, 5), M(0x14131a, 0.9), g, 10, -0.88, 0.5, false);
    const mouse = K.mesh(MD.rbox(1.2, 0.7, 2.0, 0.5), M(0x1d1b22, 0.3, 0.3), g, 10, -0.55, 0.5);
    K.box(0.12, 0.05, 0.8, new THREE.MeshBasicMaterial({ color: 0x4fd8ff, toneMapped: false }), 10, -0.18, 0.1, g, false);
    const mon = new THREE.Group(); mon.position.set(-1.5, 5.4, -7.5); g.add(mon);
    K.box(12, 6.8, 0.4, M(0x111114, 0.4), 0, 0, -0.2, mon);
    const typed = K.canvasTex(1024, 128, () => {}); const typedM = new THREE.MeshBasicMaterial({ map: typed.tex, toneMapped: false });
    K.mesh(new THREE.PlaneGeometry(11.6, 1.4), typedM, mon, 0, -2.5, 0.01, false);
    const chart = K.screen(mon, 11.6, 4.9); chart.position.y = 0.6;
    K.box(0.8, 4, 0.5, M(0x111114, 0.4), 0, -5, -0.3, mon);
    K.crowd(g, [0xffd21f, 0xff4fd8, 0x4fd8ff, 0xffd21f, 0xb38cff].map((c, i) => ({ color: c, x: -7 + i * 2.6, y: -0.9, z: -4.6, scale: 0.75 })), b.crowd);

    let text = '', lastT = 0;
    const draw = () => { const c = typed.ctx; c.fillStyle = '#0e1116'; c.fillRect(0, 0, 1024, 128); c.fillStyle = '#7cff6b'; c.font = '600 54px "Chivo Mono", monospace'; c.fillText('> ' + text.slice(-28) + (Math.floor(lastT * 2) % 2 ? '_' : ' '), 24, 84); typed.tex.needsUpdate = true; };
    draw();
    const keyAt = (x, z) => keys.find(k => Math.abs(x - k.x) < k.w / 2 && Math.abs(z - k.z) < 0.5);
    // Standing on a key: its top (minus how far it is pressed). Between keys you drop into the gap.
    MD.MAPS.keyboard.ground = (x, z) => { const k = keyAt(x, z); return k ? -k.down : -0.32; };
    b.onRound = () => { text = ''; draw(); };
    b.update = function (dt, t, G) {
      glowM.color.setHSL((t * 0.08) % 1, 1, 0.55);
      lastT = t;
      keys.forEach(k => { k.pressed = false; });
      for (const f of G.fighters) {
        if (f.y > 0.15 || f.state === 'fall') continue;
        const k = keyAt(f.x, f.z); if (!k) continue;
        k.pressed = true;
        if (f.lastKey !== k) {
          f.lastKey = k;
          MD.Audio.noise(0.03, 0.35, 3500, 2); MD.Audio.tone(1800, 0.02, 'square', 0.04);
          if (k === spaceKey) {
            // Spacebar: big launch.
            if (G.phase === 'fight' && f.onGround && (f.state === 'idle' || f.state === 'chase' || f.state === 'teeter')) { f.vy = 9.5; f.onGround = false; f.state = 'air'; f.stateT = 0; G.bub(f, 'jump', 0.8); MD.Audio.tone(300, 0.25, 'square', 0.12, 900); }
            text += ' ';
          } else if (k.L.length === 1 && /[a-z0-9]/i.test(k.L)) text += k.L.toLowerCase();
          if (/quack/.test(text.slice(-5))) { G.sayRaw('Someone typed QUACK on the keyboard. The crowd goes wild.'); MD.Arena.cheer(1); text += '!'; }
          if (text.length > 60) text = text.slice(-40);
          draw();
        }
      }
      G.fighters.forEach(f => { if (f.y > 0.15) f.lastKey = null; });
      keys.forEach(k => { k.down += ((k.pressed ? 0.06 : 0) - k.down) * Math.min(1, dt * 25); k.cap.position.y = k.by - k.down; });
      if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) draw();
    };
  },
};
