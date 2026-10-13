// Map: Grandmaster. A giant chessboard in a library. The pieces stand around as obstacles, and every
// few seconds one of them makes a move. The knight jumps in an L and lands on whoever is there.
MD.ICON_MAKERS = MD.ICON_MAKERS || {};
MD.makeChessPiece = function (kind, white) {
  const M = MD.mat, mat = M(white ? 0xf1e6d0 : 0x2b2420, 0.35, 0.05);
  const prof = {
    pawn: [[0, 0], [0.42, 0], [0.42, 0.1], [0.3, 0.2], [0.18, 0.6], [0.25, 0.68], [0.15, 0.75], [0.22, 0.9], [0.18, 1.05], [0, 1.1]],
    rook: [[0, 0], [0.45, 0], [0.45, 0.12], [0.32, 0.25], [0.28, 0.95], [0.38, 1.0], [0.38, 1.25], [0, 1.25]],
    bishop: [[0, 0], [0.44, 0], [0.44, 0.12], [0.3, 0.24], [0.2, 0.9], [0.3, 0.98], [0.2, 1.05], [0.26, 1.3], [0.12, 1.55], [0, 1.62]],
    queen: [[0, 0], [0.48, 0], [0.48, 0.14], [0.33, 0.26], [0.22, 1.1], [0.36, 1.2], [0.24, 1.3], [0.36, 1.62], [0.1, 1.7], [0, 1.72]],
    king: [[0, 0], [0.5, 0], [0.5, 0.14], [0.35, 0.26], [0.24, 1.2], [0.38, 1.3], [0.26, 1.42], [0.34, 1.75], [0, 1.8]],
    knight: [[0, 0], [0.46, 0], [0.46, 0.14], [0.32, 0.26], [0.3, 0.55], [0, 0.6]],
  }[kind];
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 28), mat); body.castShadow = true; g.add(body);
  if (kind === 'knight') {
    const head = new THREE.Mesh(MD.rbox(0.42, 0.9, 0.7, 0.14), mat); head.position.set(0, 0.95, 0.05); head.rotation.x = -0.35; head.castShadow = true; g.add(head);
    const snout = new THREE.Mesh(MD.rbox(0.36, 0.34, 0.5, 0.12), mat); snout.position.set(0, 1.15, 0.38); snout.rotation.x = 0.4; g.add(snout);
    [-0.12, 0.12].forEach(x => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 6), mat); e.position.set(x, 1.48, -0.05); g.add(e); });
  }
  if (kind === 'king') { const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.08), mat); c1.position.y = 1.98; g.add(c1); const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.08), mat); c2.position.y = 2.02; g.add(c2); }
  if (kind === 'queen') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat); b.position.y = 1.8; g.add(b); }
  if (kind === 'bishop') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat); b.position.y = 1.68; g.add(b); }
  return g;
};
MD.ICON_MAKERS.knight = () => MD.makeChessPiece('knight', false);
MD.MAPS.chess = {
  key: 'chess', name: 'Grandmaster', swatch: 'repeating-conic-gradient(#f1e6d0 0 25%,#6b4a2e 0 50%) 0 0/50% 50%',
  blurb: 'A giant chessboard in an old library. Pieces block the way and keep making moves. Watch the knight, it jumps.',
  shape: 'rect', hw: 5.05, hd: 5.05, spawn: [3.2, 3.2], floorY: -0.5, music: 'fight',
  env: { bg: 0x1c1410, fog: [0x1c1410, 24, 52], hemi: [0xffe6c8, 0x2a1a10, 0.55], key: [0xffe9c9, 1.25], rim: [0xffc07a, 0.5], warm: [0xff9a4a, 0.8], exposure: 1.05 },
  ringout: ['{b} fell off the board. Checkmate.', '{b} has been captured en passant.'],
  build(K, b) {
    const g = b.group, M = MD.mat, SQ = 1.15;
    const board = K.canvasTex(1024, 1024, (c, w) => {
      const s = w / 8;
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#6b4a2e' : '#f1e6d0'; c.fillRect(x * s, y * s, s, s); }
      c.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 300; i++) c.fillRect(Math.random() * w, Math.random() * w, 40 + Math.random() * 80, 1.5);
    }).tex;
    b.surfaceMat = M(0xffffff, 0.35, 0.05, { map: board });
    K.box(SQ * 8 + 0.9, 0.5, SQ * 8 + 0.9, M(0x3a2414, 0.5), 0, -0.25, 0, g);
    K.mesh(new THREE.BoxGeometry(SQ * 8, 0.02, SQ * 8), b.surfaceMat, g, 0, 0.0, 0, false);
    const coords = K.canvasTex(1024, 64, (c, w, h) => { c.fillStyle = '#e8d6b0'; c.font = '700 40px "Chivo", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; 'abcdefgh'.split('').forEach((l, i) => c.fillText(l, (i + 0.5) * w / 8, h / 2)); }).tex;
    const strip = K.mesh(new THREE.PlaneGeometry(SQ * 8, 0.42), new THREE.MeshBasicMaterial({ map: coords, transparent: true }), g, 0, 0.005, SQ * 4 + 0.22, false); strip.rotation.x = -Math.PI / 2;
    // Library: table, bookshelves, a lamp, a chess clock, an armchair.
    K.box(30, 0.6, 18, M(0x6b4a2e, 0.6), 0, -0.8, 0, g, false);
    const books = K.canvasTex(512, 256, (c, w, h) => {
      c.fillStyle = '#3a2414'; c.fillRect(0, 0, w, h);
      for (let row = 0; row < 3; row++) { let x = 6; while (x < w - 10) { const bw = 10 + Math.random() * 14, bh = 60 + Math.random() * 20; c.fillStyle = ['#8a2a2a', '#2a5a3a', '#2a3a6a', '#c9a35a', '#6a2a5a', '#d9c8a0'][Math.floor(Math.random() * 6)]; c.fillRect(x, row * 85 + 82 - bh, bw, bh); x += bw + 2; } c.fillStyle = '#2a1a10'; c.fillRect(0, row * 85 + 80, w, 6); }
    }).tex;
    books.wrapS = THREE.RepeatWrapping; books.repeat.set(4, 1);
    K.mesh(new THREE.PlaneGeometry(56, 14), M(0xffffff, 0.9, 0, { map: books }), g, 0, 6.2, -11, false);
    const clock = new THREE.Group(); clock.position.set(6.6, -0.5, -2.2); clock.rotation.y = -0.4; g.add(clock);
    K.mesh(MD.rbox(2.2, 1.0, 0.9, 0.12), M(0x2a1a10, 0.4), clock, 0, 0.5, 0);
    const face = K.canvasTex(256, 96, () => {});
    const faceM = new THREE.MeshBasicMaterial({ map: face.tex }); K.mesh(new THREE.PlaneGeometry(1.9, 0.62), faceM, clock, 0, 0.55, 0.46, false);
    const btns = [-0.5, 0.5].map(x => K.mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), M(0xd8dde3, 0.3, 0.8), clock, x, 1.08, 0));
    const lamp = new THREE.PointLight(0xffc27a, 1.0, 20); lamp.position.set(-7, 5, -4); g.add(lamp);
    const lampG = new THREE.Group(); lampG.position.set(-7.6, -0.5, -4); g.add(lampG);
    K.mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.6, 8), M(0xc9a35a, 0.3, 0.8), lampG, 0, 2.3, 0);
    K.mesh(new THREE.ConeGeometry(0.9, 0.8, 18, 1, true), M(0x2f6a3a, 0.6, 0, { side: THREE.DoubleSide, emissive: 0x2f6a3a, emissiveIntensity: 0.4 }), lampG, 0, 4.8, 0, false);
    const tv = new THREE.Group(); tv.position.set(5.2, 6.2, -10.8); g.add(tv);
    K.box(5.4, 3.2, 0.2, M(0x2a1a10, 0.5), 0, 0, -0.1, tv); K.screen(tv, 5.1, 2.9);
    K.crowd(g, [0xffd21f, 0xf3eee4, 0xf6b6c8, 0x8cc4ea, 0xffd21f].map((c, i) => ({ color: c, x: -6 + i * 3, y: -0.5, z: -6.3, scale: 0.75 })), b.crowd);

    // Pieces on the board. Each round they start on fixed squares and then wander.
    const set = [['rook', true], ['knight', false], ['bishop', true], ['queen', false], ['king', true], ['pawn', false], ['pawn', true], ['knight', true]];
    const sq = (i, j) => ({ x: (i - 3.5) * SQ, z: (j - 3.5) * SQ });
    const pieces = set.map(([kind, white]) => { const m = MD.makeChessPiece(kind, white); g.add(m); return { m, kind, i: 0, j: 0, ob: { x: 0, z: 0, r: 0.5 }, mv: null }; });
    const start = [[0, 0], [7, 0], [0, 7], [7, 7], [3, 0], [4, 7], [0, 3], [7, 4]];
    const occupied = (i, j, except) => pieces.some(p => p !== except && p.i === i && p.j === j);
    const place = () => pieces.forEach((p, k) => { [p.i, p.j] = start[k]; const s = sq(p.i, p.j); p.m.position.set(s.x, 0, s.z); p.m.rotation.y = p.m.position.z > 0 ? Math.PI : 0; p.ob.x = s.x; p.ob.z = s.z; p.mv = null; });
    place();
    const st = { t: 6, clock: [300, 300], turn: 0, faceT: 0 };
    b.onRound = () => { place(); st.t = 5 + Math.random() * 3; MD.Arena.obstacles = MD.Arena.obstacles.filter(o => !pieces.some(p => p.ob === o)).concat(pieces.map(p => p.ob)); };
    b.obstacles.push(...pieces.map(p => p.ob));
    b.update = function (dt, t, G) {
      st.faceT -= dt;
      if (st.faceT <= 0) {
        st.faceT = 0.25; if (G.phase === 'fight') st.clock[st.turn] = Math.max(0, st.clock[st.turn] - 0.25);
        const c = face.ctx; c.fillStyle = '#f3eee4'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#1d1b22'; c.font = '700 44px "Chivo Mono", monospace'; c.textAlign = 'center';
        st.clock.forEach((v, i) => c.fillText(`${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`, 64 + i * 128, 62)); face.tex.needsUpdate = true;
      }
      if (G.phase === 'fight' && !pieces.some(p => p.mv)) {
        st.t -= dt;
        if (st.t <= 0) {
          st.t = 6 + Math.random() * 4; st.turn = 1 - st.turn; btns.forEach((bt, i) => { bt.position.y = i === st.turn ? 1.02 : 1.08; });
          const p = pieces[Math.floor(Math.random() * pieces.length)];
          const opts = [];
          for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
            if (occupied(i, j, p)) continue;
            const di = Math.abs(i - p.i), dj = Math.abs(j - p.j);
            const ok = p.kind === 'knight' ? (di === 1 && dj === 2) || (di === 2 && dj === 1) : p.kind === 'rook' ? (di === 0) !== (dj === 0) : p.kind === 'bishop' ? di === dj && di > 0 : p.kind === 'pawn' ? di === 0 && dj === 1 : (di <= 2 && dj <= 2 && di + dj > 0);
            if (ok) opts.push([i, j]);
          }
          if (opts.length) {
            const [i, j] = opts[Math.floor(Math.random() * opts.length)], from = sq(p.i, p.j), to = sq(i, j);
            p.mv = { from, to, t: 0, dur: p.kind === 'knight' ? 0.9 : 0.7 }; p.i = i; p.j = j;
            MD.Audio.tone(220, 0.08, 'triangle', 0.15); MD.Audio.tone(330, 0.06, 'triangle', 0.12, null, 0.08);
            if (p.kind === 'knight' && Math.random() < 0.6) G.sayRaw('The knight moves in an L. Nobody saw it coming.');
          }
        }
      }
      for (const p of pieces) {
        if (!p.mv) continue;
        const mv = p.mv; mv.t += dt / mv.dur; const k = Math.min(1, mv.t), e = k * k * (3 - 2 * k);
        const x = mv.from.x + (mv.to.x - mv.from.x) * e, z = mv.from.z + (mv.to.z - mv.from.z) * e;
        p.m.position.set(x, Math.sin(k * Math.PI) * (p.kind === 'knight' ? 2.2 : 0.35), z); p.ob.x = x; p.ob.z = z;
        if (k >= 1) {
          p.mv = null; MD.Audio.thump(); MD.Arena.dust(x, z, 6, 0xd9c8a0);
          for (const f of G.fighters) {
            const dx = f.x - x, dz = f.z - z;
            if (Math.hypot(dx, dz) < 0.95 && f.state !== 'fall') { G.envHit(f, p.kind === 'knight' ? 8 : 5, dx || 0.1, dz, 6, 3.5); G.bub(f, 'check', 1, true); }
          }
        }
      }
    };
  },
};
