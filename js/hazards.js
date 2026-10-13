// More desk chaos: shipping boxes, a robot vacuum, the lab cat, moon gravity, Firefox slow-mo,
// AZERTY controls, a dance break and rubber duck debugging. Registers itself into MD.Items.EVENTS.
window.MD = window.MD || {};
MD.Hazards = (function () {
  const H = { boxes: [], vac: null, paw: null, moonT: 0, slowT: 0 };
  const scene = () => MD.Arena.scene;
  const M = (c, r, m, x) => MD.mat(c, r, m, x);
  const shadowAll = g => { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; };
  const remove = o => o && o.parent && o.parent.remove(o);

  function freeSpot(fs, minD) {
    for (let i = 0; i < 40; i++) {
      const p = MD.Arena.randomSpot();
      if (H.boxes.every(b => Math.hypot(b.x - p.x, b.z - p.z) > 1.1) && fs.every(f => Math.hypot(f.x - p.x, f.z - p.z) > (minD || 0))) return p;
    }
    return MD.Arena.randomSpot();
  }
  const dropOb = ob => { const i = MD.Arena.obstacles.indexOf(ob); if (i >= 0) MD.Arena.obstacles.splice(i, 1); };
  function warnRing(x, z, r) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.72, r, 32), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, MD.Arena.groundAt(x, z) + 0.015, z); scene().add(m); return m;
  }

  // ---------- Delivery boxes ----------
  let labelTex = null;
  function boxMesh() {
    if (!labelTex) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
      g.fillStyle = '#c8995e'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#e9d8b4'; g.fillRect(104, 0, 48, 256);
      g.fillStyle = '#3b2a1a'; g.font = '800 30px "Chivo", sans-serif'; g.textAlign = 'center';
      g.fillText('FRAGILE', 128, 92); g.font = '600 20px "Chivo Mono", monospace'; g.fillText('DUCK INSIDE', 128, 128); g.fillText('THIS WAY UP ↑', 128, 166);
      labelTex = new THREE.CanvasTexture(c); labelTex.encoding = THREE.sRGBEncoding;
    }
    const plain = M(0xc8995e, 0.85), label = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.85 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), [label, label, plain, plain, label, label]);
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.82), M(0xe9d8b4, 0.5)); tape.position.y = 0.405;
    const g = new THREE.Group(); g.add(m); g.add(tape); return shadowAll(g);
  }
  function spawnBoxes(G) {
    const n = 4;
    for (let i = 0; i < n; i++) {
      const fsTarget = i < 2 ? G.fighters[i] : null;
      const p = fsTarget && Math.random() < 0.7 ? { x: fsTarget.x + (Math.random() - 0.5) * 0.6, z: fsTarget.z + (Math.random() - 0.5) * 0.6 } : freeSpot(G.fighters, 1.2);
      MD.Arena.clampInside(p, 0.7);
      const mesh = boxMesh(); mesh.visible = false; scene().add(mesh);
      H.boxes.push({ x: p.x, z: p.z, y: 10, vy: 0, wait: 1.0 + i * 0.35, landed: false, life: 11, mesh, ring: warnRing(p.x, p.z, 0.6), ob: null, spin: (Math.random() - 0.5) * 3 });
    }
  }
  function updateBoxes(dt, G) {
    for (let i = H.boxes.length - 1; i >= 0; i--) {
      const b = H.boxes[i];
      if (b.wait > 0) { b.wait -= dt; b.ring.material.opacity = 0.35 + Math.abs(Math.sin(G.time * 10)) * 0.5; if (b.wait <= 0) b.mesh.visible = true; continue; }
      if (!b.landed) {
        b.vy -= 26 * dt; b.y += b.vy * dt; b.mesh.rotation.y += b.spin * dt;
        const by = MD.Arena.groundAt(b.x, b.z) + 0.4;
        if (b.y <= by) {
          b.y = by; b.landed = true; remove(b.ring); MD.Arena.dust(b.x, b.z, 10, 0xc8a878);
          MD.Audio.thump(); MD.Audio.clatter(); MD.Arena.shake(0.25, 0.25);
          MD.Arena.sparks(new THREE.Vector3(b.x, 0.1, b.z), 0xc8995e, 14);
          for (const f of G.fighters) {
            const dx = f.x - b.x, dz = f.z - b.z, d = Math.hypot(dx, dz);
            if (d < 0.95 && f.state !== 'fall') { G.envHit(f, 8, dx || 0.1, dz, 6, 4); G.bub(f, 'box', 1); G.sayRaw(rnd(['Your pre-order has been delivered. To ' + f.cw.name + '\'s face.', f.cw.name + ' signed for a package with its head.'])); }
          }
          b.ob = { x: b.x, z: b.z, r: 0.55 }; MD.Arena.obstacles.push(b.ob);
        }
      } else {
        b.life -= dt;
        if (b.life < 0.5) b.mesh.scale.setScalar(Math.max(0.01, b.life * 2));
        if (b.life <= 0) { remove(b.mesh); dropOb(b.ob); H.boxes.splice(i, 1); continue; }
      }
      b.mesh.position.set(b.x, b.y - 0.4, b.z);
    }
  }

  // ---------- Robot vacuum ----------
  function vacMesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.74, 0.24, 40), M(0x2a2a30, 0.45, 0.2)); body.position.y = 0.14; g.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.02, 40), M(0xe9e4da, 0.35)); top.position.y = 0.27; g.add(top);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 40), new THREE.MeshBasicMaterial({ color: 0x6fd0e6, toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.27; g.add(ring);
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), M(0x1d1b22, 0.3)); btn.position.set(0, 0.29, 0.3); g.add(btn);
    const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.745, 0.745, 0.12, 40, 1, true, -1.1, 2.2), M(0x18171c, 0.6)); bump.position.y = 0.12; g.add(bump);
    const brush = new THREE.Group(); brush.position.set(0.5, 0.03, 0.45); g.add(brush);
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.01, 0.025), M(0xf5c518, 0.6)); s.rotation.y = i * Math.PI / 3; brush.add(s); }
    g.userData.brush = brush;
    return shadowAll(g);
  }
  function spawnVacuum(G) {
    if (H.vac) return;
    const dir = Math.random() < 0.5 ? 1 : -1, lane = (Math.random() - 0.5) * 4;
    const mesh = vacMesh(); scene().add(mesh);
    const reach = MD.Arena.shape === 'circle' ? Math.sqrt(Math.max(1, MD.Arena.radius * MD.Arena.radius - lane * lane)) : MD.Arena.hw;
    H.vac = { x: -dir * (reach - 0.8), z: lane, lane, y: 0, vy: 0, dir, t: 0, mesh, ate: 0 };
    mesh.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  function updateVac(dt, G) {
    const v = H.vac; if (!v) return;
    v.t += dt;
    v.x += v.dir * 2.1 * dt;
    const nz = v.lane + Math.sin(v.t * 1.3) * 0.9, dz = nz - v.z; v.z = nz;
    v.mesh.rotation.y = Math.atan2(v.dir * 2.1, dz / dt || 0.0001);
    v.mesh.userData.brush.rotation.y += dt * 18;
    if (Math.random() < dt * 4) MD.Audio.noise(0.2, 0.05, 200, 0.5, 0, 'lowpass');
    const onDesk = MD.Arena.inside(v.x, v.z);
    if (!onDesk) { v.vy -= 20 * dt; v.y += v.vy * dt; v.mesh.rotation.z += v.dir * dt * 2; }
    v.mesh.position.set(v.x, v.y, v.z);
    if (v.y < -7.5) { remove(v.mesh); H.vac = null; MD.Audio.clatter(); G.sayRaw('The vacuum fell off the desk. Even it could not handle this fight.'); return; }
    if (v.y < -0.2) return;
    for (const f of G.fighters) {
      if (f.state === 'fall' || f.y > 0.5) continue;
      const dx = f.x - v.x, dz2 = f.z - v.z, d = Math.hypot(dx, dz2), r = 0.72 + 0.4;
      if (d < r && d > 0.001) {
        f.x = v.x + dx / d * r; f.z = v.z + dz2 / d * r;
        if ((f.vacCd || 0) <= 0) { f.vacCd = 1.2; G.envHit(f, 4, dx, dz2, 5.5, 2.5); G.bub(f, 'vac', 0.8); if (Math.random() < 0.5) G.sayRaw('The vacuum bumps ' + f.cw.name + '. It does not even slow down.'); }
      }
    }
    for (const b of H.boxes) {
      if (!b.landed) continue;
      const bx = b.x - v.x, bz = b.z - v.z, bd = Math.hypot(bx, bz), br = 0.72 + 0.5;
      if (bd < br && bd > 0.001) {
        const q = MD.Arena.clampInside({ x: v.x + bx / bd * br, z: v.z + bz / bd * br }, 0.45);
        b.x = q.x; b.z = q.z; b.ob.x = b.x; b.ob.z = b.z;
      }
    }
    for (const it of MD.Items.list.slice()) {
      if (it.landed && Math.hypot(it.x - v.x, it.z - v.z) < 0.75) { MD.Items.removeItem(it); MD.Audio.slurp(); v.ate++; G.sayRaw('The vacuum ate a ' + (it.type === 'sock' ? 'sock' : it.type === 'coin' ? 'meme coin. Diamond hands' : it.type) + '.'); }
    }
  }

  // ---------- The lab cat ----------
  function pawMesh() {
    const g = new THREE.Group(), fur = M(0xe39b4f, 0.9), dark = M(0xb86a2c, 0.9), pink = M(0xf4a3b4, 0.6);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 6, 20), fur); arm.rotation.z = Math.PI / 2; arm.position.x = -3.3; g.add(arm);
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 8, 20), dark); s.rotation.y = Math.PI / 2; s.position.x = -1.2 - i * 1.0; g.add(s); }
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), fur); paw.scale.set(1.15, 0.62, 1.0); g.add(paw);
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10), pink); pad.scale.set(1, 0.4, 1.1); pad.position.set(0.15, -0.3, 0); g.add(pad);
    [[0.55, 0.32], [0.62, 0.1], [0.62, -0.12], [0.55, -0.34]].forEach(([x, z]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), pink); b.scale.y = 0.5; b.position.set(x, -0.28, z); g.add(b); });
    return shadowAll(g);
  }
  function spawnPaw(G) {
    if (H.paw) return;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const target = G.fighters[Math.floor(Math.random() * 2)];
    const lane = Math.max(-3.5, Math.min(3.5, target.z + (Math.random() - 0.5)));
    const warn = new THREE.Mesh(new THREE.PlaneGeometry(MD.Arena.hw * 2, 1.7), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }));
    warn.rotation.x = -Math.PI / 2; warn.position.set(0, 0.045, lane); scene().add(warn);
    const mesh = pawMesh(); mesh.visible = false; scene().add(mesh);
    mesh.rotation.y = dir > 0 ? 0 : Math.PI;
    H.paw = { dir, lane, x: -dir * (MD.Arena.hw + 2.5), wait: 1.3, mesh, warn, hit: new Set() };
    MD.Audio.meow();
  }
  function updatePaw(dt, G) {
    const p = H.paw; if (!p) return;
    if (p.wait > 0) { p.wait -= dt; p.warn.material.opacity = 0.18 + Math.abs(Math.sin(G.time * 9)) * 0.3; if (p.wait <= 0) { p.mesh.visible = true; MD.Audio.whoosh(); } return; }
    p.x += p.dir * 11 * dt;
    const arc = 1 - Math.min(1, Math.abs(p.x) / (MD.Arena.hw + 2.5));
    p.mesh.position.set(p.x, 0.45 + (1 - arc) * 0.8, p.lane);
    for (const f of G.fighters) {
      if (p.hit.has(f) || f.state === 'fall') continue;
      if (Math.abs(f.z - p.lane) < 1.0 && Math.abs(f.x - p.x) < 0.85 && f.y < 1.5) {
        p.hit.add(f); G.envHit(f, 7, p.dir, (f.z - p.lane) * 0.3, 12, 5); G.bub(f, 'cat', 1);
        G.sayRaw(rnd([f.cw.name + ' got swatted by the lab cat. The cat feels nothing.', 'The cat booped ' + f.cw.name + ' at roughly Mach 0.03.']));
      }
    }
    const B = MD.Items.ball;
    if (B && Math.abs(B.z - p.lane) < 1 && Math.abs(B.x - p.x) < 0.8) { B.vx = p.dir * 14; B.vy = 4; }
    if (Math.abs(p.x) > MD.Arena.hw + 3) { remove(p.mesh); remove(p.warn); H.paw = null; }
  }

  // ---------- Rubber duck ----------
  MD.Items.makers.rubber = function (color) {
    const g = new THREE.Group(), y = M(color || 0xffd21f, 0.25), o = M(0xff7a1a, 0.35), k = M(0x111111, 0.1);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), y); body.scale.set(1, 0.75, 1.25); body.position.y = 0.32; g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 12), y); tail.rotation.x = -2.2; tail.position.set(0, 0.5, -0.5); g.add(tail);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), y); head.position.set(0, 0.78, 0.22); g.add(head);
    const bill = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), o); bill.scale.set(1.3, 0.45, 1.2); bill.position.set(0, 0.74, 0.48); g.add(bill);
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), k); e.position.set(0.13 * s, 0.86, 0.43); g.add(e); });
    return shadowAll(g);
  };

  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const NEW = {
    delivery: { w: 2, h: 'Delivery day', p: 'First deliveries arrive before Christmas. Dodge the red circles.', go: spawnBoxes },
    vacuum: { can: () => !H.vac, w: 2, h: 'Night shift', p: 'A robot vacuum is cleaning the desk. It does not care about your fight.', go: spawnVacuum },
    cat: { can: () => !H.paw, w: 2, h: 'Cat detected', p: 'The lab cat saw the laser pointer earlier. Stay out of the red stripe.', go: spawnPaw },
    moon: { can: G => G.gravMul === 1, w: 2, h: 'Sim2Real gap', p: 'Someone forgot to set gravity in the simulator config. Moon physics for 8 seconds.', go(G) { H.moonT = 8; G.gravMul = 0.3; G.fighters.forEach(f => G.bub(f, 'moon', 0.7)); } },
    firefox: { can: G => G.timeScale === 1, w: 1, h: 'Running in Firefox', p: 'The simulator has probably never heard of Firefox. Everything at half speed.', go(G) { H.slowT = 2.2; G.timeScale = 0.5; MD.Music.setRate(0.5); G.fighters.forEach(f => G.bub(f, 'slow', 0.7)); } },
    azerty: { w: 1, h: 'AZERTY mode', p: 'Controls were mapped for a French keyboard. Everything is backwards for 6 seconds.', go(G) { G.mirrorT = 6; G.fighters.forEach(f => G.bub(f, 'azerty', 0.7)); } },
    dance: { can: G => G.fighters.every(f => G.canAct(f) && f.onGround), w: 2, h: 'Mandatory dance break', p: 'Microducks sang together in the launch video, so it is in the contract.', go(G) { G.startDance && G.startDance(); } },
    rubber: { w: 2, h: 'Rubber duck debugging', p: 'Explain your bugs to the rubber duck. Grab it to repair 15 integrity.', go(G) { const s = freeSpot(G.fighters, 1.4); MD.Items.spawn('rubber', s.x, s.z); } },
  };
  Object.assign(MD.Items.EVENTS, NEW);

  H.meshes = { box: boxMesh, vacuum: vacMesh, paw: pawMesh };
  H.update = function (dt, G) {
    updateBoxes(dt, G); updateVac(dt, G); updatePaw(dt, G);
    for (const f of G.fighters) if (f.vacCd > 0) f.vacCd -= dt;
    if (H.moonT > 0) { H.moonT -= dt; if (H.moonT <= 0) G.gravMul = 1; }
    if (H.slowT > 0) { H.slowT -= dt; if (H.slowT <= 0) { G.timeScale = 1; MD.Music.setRate(1); } }
    if (G.mirrorT > 0) G.mirrorT -= dt;
  };
  H.clear = function (G) {
    H.boxes.forEach(b => { remove(b.mesh); remove(b.ring); if (b.ob) dropOb(b.ob); });
    H.boxes = [];
    if (H.vac) { remove(H.vac.mesh); H.vac = null; }
    if (H.paw) { remove(H.paw.mesh); remove(H.paw.warn); H.paw = null; }
    H.moonT = H.slowT = 0; G.gravMul = 1; G.timeScale = 1; G.mirrorT = 0; MD.Music.setRate(1);
  };
  return H;
})();
