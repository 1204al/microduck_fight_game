// Fighters, the seven trained moves, physics, hits, falls and pickups.
window.MD = window.MD || {};
MD.Game = (function () {
  const PI = Math.PI;
  const G = { phase: 'boot', fighters: [], time: 0, gravMul: 1, timeScale: 1, mirrorT: 0, round: 1, best: 3, level: 1, episode: 4800 + Math.floor(Math.random() * 400), quiet: true, hitstop: 0 };
  const FREE = ['idle', 'block', 'chase', 'teeter'];
  const NOHIT = ['down', 'getup', 'ko', 'fall', 'win', 'lose'];
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const angDiff = (a, b) => { let d = a - b; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; return d; };

  const LINES = {
    peck: ['{a} pecks {b}. The NFC antenna in the beak skims 2% battery.', 'Peck! {b}\'s IMU reports an unscheduled rotation.', '{a} uses the articulated beak. Very articulate.', '{a} pecks like it is picking up a sock. The sock is {b}.'],
    hb: ['{a} headbutts with the camera. That clip is going in the launch video.', 'Camera head to the face. {b} sees 8×8 stars.', '{a} lands a headbutt. All 15 of {b}\'s motors file a complaint.'],
    dash: ['{a} deploys the optional wheels. They were not optional.', 'Skate ram! {b} gets a free ride.', '{a} rolls in at 50 Hz of pure confidence.'],
    stomp: ['{a} lands on {b}\'s head. 25 cm of vertical advantage.', 'Stomp! {b}\'s neck servos recompute everything.'],
    flipHit: ['{a} did a flip for no reason. The reason was {b}\'s face.'],
    sock: ['Sock to the camera! {b} is blind and smells like a gym bag.', '{a} has found its purpose: throwing laundry.'],
    block: ['{b} holds its balance when pushed, just like the demo video.', '{b} crouches. Very effective at not falling over.'],
    down: ['{b} falls over. Recovering from a common fall...', '{b} is down. Running get-up policy, episode {ep}.'],
    getup: ['{b} gets back up. Reinforcement learning works!', '{b} is up. It learned nothing, but it is up.'],
    ko: ['That was an uncommon fall.', '{b} has fallen and the policy cannot recover.'],
    ringout: ['{b} fell off the desk. Not covered by warranty.', '{b} discovered the desk has edges. Sim2real gap: 75 cm.'],
    flip: ['{a} does a flip for no reason.', '{a} flips. No judges, no points, no regrets.'],
    sleep: ['{a} ran out of battery and fell asleep mid-fight. Relatable.'],
    wake: ['{a} found a spare electron. 12% battery.'],
    laser: ['{a} caught the laser dot! +12% battery and a deep sense of achievement.'],
    skates: ['{a} puts on the wheels. Brakes not included.'],
    coin: ['{a} bought $MICRODUCK at the top. +370% beak power!'],
    rug: ['Rug pull. {a}\'s $MICRODUCK is worth nothing. It moves at half speed out of sadness.'],
    butter: ['{a} passes butter. The whole desk is slippery now.'],
    battery: ['{a} swaps batteries. Back to one hour of runtime, which here means ninety seconds.'],
    sockPick: ['{a} picks up a sock with its beak, exactly as advertised.'],
    lowbatt: ['{a} is at 20% battery. Its voice is getting deeper and sadder.'],
    ball: ['{a} scores a ball to {b}\'s face. Multi-robot experiment: success.'],
  };
  const BUBBLES = {
    hurt: ['Ow, my servos!', 'Not the camera!', 'My warranty!', 'IMU says ouch', 'That was not in sim', 'Rude.', 'Quack?!', 'I felt that in Rust'],
    brag: ['Quack.', 'Peck-ular!', 'Trained for this', 'Sim2Real, baby', 'Get pecked', 'Reward +1', 'Seven moves. One goal.'],
    block: ['Holding my balance', 'Nice try', 'Crouch mode: on'],
    down: ['I can recover!', 'Common fall, relax', 'Gravity 1, me 0', 'Loading get_up.rs'],
    getup: ['Nailed it', 'Totally meant that', 'Back online'],
    ko: ['Uncommon fall...', 'Rebooting... never', 'bye.exe'],
    ringout: ['Tell my LiDAR I loved it', 'Not covered by warranty!', 'Wheeeee', 'Is this the floor?'],
    win: ['GG', 'Ship it!', 'Pre-order me!', 'Works on my desk'],
    sock: ['Finally, a purpose', 'Sock acquired', 'Smells like victory'],
    blind: ['Who turned off the lights?', 'It smells in here', 'Camera: sock'],
    skates: ['Brakes are optional', 'Zoom zoom'],
    coin: ['To the moon!', 'Diamond beak', 'HODL'],
    rug: ['...it is gone', 'I need a hug', 'Rug pulled'],
    battery: ['Ahh, electrons', 'Charged and angry'],
    rubber: ['So, my bug is...', 'Thanks, rubber duck'],
    butter: ['What is my purpose?'],
    butterReply: ['You grease the desk.'],
    laser: ['DOT!', 'MINE!', 'Got the dot!'],
    sleep: ['Zzz... five more minutes', 'Low power mode'],
    wake: ['I am up! I am up!', 'Spare electron!'],
    flip: ['For no reason!', 'Style points', 'Did you see that?'],
    moon: ['I can fly!', 'Small step for duck'],
    slow: ['Whyyy so slooow', 'Fiiirefoooox'],
    azerty: ['Qui? Quoi?', 'Where is W?'],
    vac: ['Rude!', 'Excuse me?!', 'Watch the wheels'],
    cat: ['CAT!!!', 'Not the paw!'],
    box: ['Signed for it', 'Wrong address!'],
    hat: ['My hat!', 'That was a gift!', 'Not the hat!'],
    hot: ['HOT HOT HOT', 'Not the grill setting!', 'My feet!'],
    lego: ['OW! LEGO!', 'Who left LEGO here?!', 'MY FOOT SERVO!'],
    toast: ['Carbs!', 'Balanced breakfast', 'Toast acquired'],
    soap: ['Whoa!', 'SOAP!', 'Wheee', 'Who left the soap here?'],
    bubble: ['Pop!', 'Bubbles!', 'So shiny'],
    frog: ['Ribbit?!', 'Sorry, frog', 'Right of way, sure'],
    wind: ['Holding on!', 'Close the door!', 'Not the airlock!'],
    coal: ['Coal?! Me?!', 'Naughty list...', 'I was good!'],
    gift: ['A present!', 'For me?', 'Unboxing time'],
    pizza: ['Free pizza!', 'Mmm, carbs', 'One more slice'],
    caffeine: ['ZOOOM', 'I can hear colors', 'Sleep is for humans'],
    ropes: ['Off the ropes!', 'Boing!', 'Slingshot!'],
    frozen: ['Brrr!', 'Frozen solid', 'Cold servos!'],
    snowball: ['Snowball!', 'Cold one', 'Packing ice'],
    sushi: ['Sushi!', 'Itadakimasu', 'Fresh salmon'],
    wasabi: ['SPICY!', 'Wasabi!!', 'My sensors!'],
    check: ['Check!', 'Knight to my face', 'Illegal move!'],
    penguin: ['Penguin!', 'Belly slide?!', 'Noot noot'],
    jump: ['Space!', 'Launching', 'To the moon'],
  };
  G.bub = function (f, key, prob, force) {
    if (G.quiet || !f || Math.random() > (prob == null ? 1 : prob)) return;
    MD.UI.bubble(f, rnd(BUBBLES[key]), force);
  };
  G.say = function (key, a, b) {
    if (G.quiet) return;
    const pool = key === 'ringout' && MD.Arena.map && MD.Arena.map.ringout ? MD.Arena.map.ringout : LINES[key];
    const s = rnd(pool).replace(/\{a\}/g, a ? a.cw.name : '').replace(/\{b\}/g, b ? b.cw.name : '').replace('{ep}', G.episode.toLocaleString());
    MD.UI.feed(s);
  };

  G.makeFighter = function (id, cwKey, isCPU) {
    const d = MD.buildDuck(cwKey);
    MD.Arena.scene.add(d.root);
    const f = { id, d, cw: d.cw, cwKey, isCPU, wins: 0, input: { mx: 0, mz: 0, block: false, press: {} }, buf: null };
    G.resetFighter(f); MD.initAnim(f);
    return f;
  };
  G.resetFighter = function (f) {
    const s = f.cw.stats;
    Object.assign(f, {
      x: f.id ? 2.6 : -2.6, z: 0, y: 0, vx: 0, vz: 0, vy: 0, face: f.id ? -PI / 2 : PI / 2,
      maxHp: Math.round(100 * s.hp), hp: Math.round(100 * s.hp), battery: 100, state: 'idle', stateT: 0, actionDur: 0,
      cd: { dash: 0, hb: 0 }, skatesT: 0, pumpT: 0, rugT: 0, blindT: 0, stunT: 0, flashT: 0, invulnT: 0, laserCd: 0,
      stagger: 0, fallDir: { x: 0, z: 0 }, onGround: true, hitDone: false, singing: false, lowWarned: false, buf: null, landedFloor: false, vacCd: 0, caffT: 0, splashed: false,
    });
    if (f.holding) { f.holding.parent && f.holding.parent.remove(f.holding); f.holding = null; }
    if (f.hatKey && !f.d.hat) MD.putHat(f.d, f.hatKey);
    if (f.sockOnHead) { f.sockOnHead.parent && f.sockOnHead.parent.remove(f.sockOnHead); f.sockOnHead = null; }
    f.input.press = {};
    f.d.root.position.set(f.x, 0, f.z); f.d.root.rotation.y = f.face;
    if (f.anim) { f.anim.tiltX = f.anim.tiltZ = f.anim.tvx = f.anim.tvz = 0; }
  };
  G.removeFighter = f => MD.Arena.scene.remove(f.d.root);

  G.canAct = f => FREE.includes(f.state) || ['peck', 'headbutt', 'throw', 'air', 'dash', 'flip'].includes(f.state) ? f.stunT <= 0 && !NOHIT.includes(f.state) && f.state !== 'sleep' : false;
  G.canBeHit = f => !NOHIT.includes(f.state) && f.invulnT <= 0;
  G.running = () => G.phase === 'fight' || G.phase === 'demo';
  const other = f => G.fighters[1 - f.id];
  const fwd = f => ({ x: Math.sin(f.face), z: Math.cos(f.face) });
  const speedMul = f => f.cw.stats.speed * (f.skatesT > 0 ? 1.3 : 1) * (f.caffT > 0 ? 1.35 : 1) * (f.rugT > 0 ? 0.5 : 1) * (f.battery < 20 ? 0.75 : 1);
  const powMul = f => f.cw.stats.power * (f.pumpT > 0 ? 2 : 1);
  function setState(f, s, dur) { f.state = s; f.stateT = 0; f.actionDur = dur || 0; f.hitDone = false; }
  function headPos(f) { const v = new THREE.Vector3(); f.d.head.getWorldPosition(v); return v; }

  G.press = function (i, a) { const f = G.fighters[i]; if (f && !f.isCPU) f.buf = { a, t: 0.2 }; };

  function startAction(f, a) {
    const o = other(f);
    // Soft lock-on: attacks turn toward a nearby opponent so aiming stays easy.
    if (a !== 'hop' && a !== 'flip' && o) {
      const dx = o.x - f.x, dz = o.z - f.z, d = Math.hypot(dx, dz), want = Math.atan2(dx, dz);
      if (d < (a === 'dash' || (a === 'peck' && f.holding) ? 9 : 3.2) && Math.abs(angDiff(want, f.face)) < 2.2) f.face = want;
    }
    switch (a) {
      case 'peck':
        if (f.holding) { setState(f, 'throw', 0.4); MD.Audio.whoosh(); }
        else { setState(f, 'peck', 0.42); MD.Audio.servo(); }
        return true;
      case 'hb': if (f.cd.hb > 0) return false; setState(f, 'headbutt', 0.78); f.cd.hb = 0.25; f.battery -= 1.5; MD.Audio.servo(); return true;
      case 'dash': {
        if (f.cd.dash > 0) return false;
        setState(f, 'dash', 0.5); f.cd.dash = 2.6 * (f.cw.stats.dashCd || 1) * (f.skatesT > 0 ? 0.5 : 1); f.battery -= 3;
        const v = fwd(f), sp = (f.skatesT > 0 ? 15 : 11) * Math.min(1.15, speedMul(f));
        f.vx = v.x * sp; f.vz = v.z * sp; MD.Audio.skate(); return true;
      }
      case 'hop': if (!f.onGround) return false; setState(f, 'air'); f.vy = 6.8; f.onGround = false; MD.Audio.hop(); return true;
      case 'flip':
        if (!f.onGround) return false;
        setState(f, 'flip', 0.82); f.vy = 7.6; f.onGround = false; f.stats.flips++; MD.Audio.hop(); MD.Audio.quack(f.cw.voice * 1.2, 0.2, 0.1);
        G.say('flip', f); G.bub(f, 'flip', 0.4); return true;
    }
    return false;
  }

  G.hit = function (att, def, dmg, kb, kind, vy) {
    if (!G.canBeHit(def)) return false;
    let dx = def.x - att.x, dz = def.z - att.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const facingAtt = Math.abs(angDiff(Math.atan2(-dx, -dz), def.face)) < 1.7;
    let blocked = false;
    if (def.state === 'block' && facingAtt) {
      blocked = true; const crush = kind === 'hb' || kind === 'dash';
      dmg *= crush ? 0.4 : 0.15; kb *= crush ? 0.6 : 0.3; vy = 0;
      MD.Audio.block(); MD.Arena.sparks(headPos(def), 0xf3eee4, 6);
      if (Math.random() < 0.35) G.say('block', att, def);
      G.bub(def, 'block', 0.35);
    }
    if (def.state === 'sleep') dmg *= 1.5;
    dmg = Math.round(dmg);
    def.hp -= dmg; att.stats.dmg += dmg; G.episode++;
    def.flashT = 0.12; def.stagger += dmg;
    const w = def.cw.stats.weight;
    def.vx += (dx * kb) / w; def.vz += (dz * kb) / w;
    if (vy) { def.vy = Math.max(def.vy, vy / w); def.onGround = false; }
    G.hitstop = blocked ? 0.03 : Math.min(0.12, 0.03 + dmg * 0.006);
    MD.Arena.shake(blocked ? 0.05 : Math.min(0.35, 0.05 + kb * 0.03), 0.2);
    if (!blocked) {
      MD.Arena.sparks(headPos(def), def.pumpT > 0 ? 0xff5a4d : 0xf5c518, 8 + dmg);
      if (dmg >= 10) MD.Arena.screws(headPos(def), 2);
      MD.Audio.quack(def.cw.voice * (def.battery < 20 ? 0.8 : 1), 0.14, 0.03, 0.4);
      kind === 'peck' ? MD.Audio.peckHit() : MD.Audio.thump();
      if (dmg >= 10) MD.Arena.cheer(0.5);
      if (Math.random() < 0.5) G.bub(def, 'hurt', 0.5); else if (att.d) G.bub(att, 'brag', 0.3);
    }
    if (def.hp <= 0) {
      def.hp = 0; knock(def, dx, dz, 'ko');
      G.onKO && G.onKO(att.real || att, def);
    } else if (!blocked && (kb >= 7 || def.stagger > 24)) {
      knock(def, dx, dz, 'down'); def.stagger = 0; def.stats.falls++;
      MD.Audio.clatter(); G.say('down', att, def); G.bub(def, 'down', 0.7, true); MD.Arena.cheer(0.7);
    } else if (!blocked && def.state !== 'sleep') {
      if (def.holding && Math.random() < 0.5) dropHeld(def);
      setState(def, 'hit', 0.3);
    }
    return !blocked;
  };
  function knock(f, dx, dz, st) {
    if (f.d.hat) {
      MD.Arena.flingHat(f.d.hat, { x: dx, z: dz }); f.d.hat = null; f.stats.hats++;
      if (st !== 'fall' && st !== 'ko') setTimeout(() => G.bub(f, 'hat', 0.5), 900);
    }
    const v = fwd(f), lf = dx * v.x + dz * v.z, lr = dx * v.z - dz * v.x;
    const n = Math.hypot(lf, lr) || 1;
    f.fallDir = { x: 1.45 * lf / n, z: -1.45 * lr / n };
    setState(f, st, st === 'ko' ? 99 : 1.0);
    if (f.holding) dropHeld(f);
  }
  function dropHeld(f) {
    const s = f.holding; if (!s) return; f.holding = null;
    const kind = f.holdKind || 'sock'; f.holdKind = null;
    s.parent && s.parent.remove(s);
    MD.Items.spawn(kind, f.x + (Math.random() - 0.5), f.z + (Math.random() - 0.5), { y: 1.2 });
  }

  // Item and event hooks used by MD.Items.
  G.pickup = function (f, it) {
    MD.Audio.pickup();
    switch (it.type) {
      case 'snowball': { const s = MD.Items.meshFor('snowball'); s.position.set(0, -0.12, 0.05); f.d.beakTip.add(s); f.holding = s; f.holdKind = 'snowball'; G.bub(f, 'snowball', 0.8); break; }
      case 'sushi': f.hp = Math.min(f.maxHp, f.hp + 8); G.bub(f, 'sushi', 1, true); MD.Audio.power(); break;
      case 'wasabi': f.caffT = 6; f.pumpT = Math.max(f.pumpT, 0); G.bub(f, 'wasabi', 1, true); MD.Audio.tone(900, 0.3, 'sawtooth', 0.1, 300); MD.Arena.sparks(headPos(f), 0x5bd66f, 12); break;
      case 'sock': {
        const s = MD.makeSock(0xf3eee4); s.scale.setScalar(0.9); s.rotation.set(0.3, PI / 2, 0); f.d.beakTip.add(s); f.holding = s; f.holdKind = 'sock';
        G.say('sockPick', f); G.bub(f, 'sock', 0.6); break;
      }
      case 'battery': f.battery = Math.min(100, f.battery + 35); f.lowWarned = false; G.say('battery', f); G.bub(f, 'battery', 0.7); MD.Audio.power(); break;
      case 'skates': f.skatesT = 9; f.cd.dash = 0; G.say('skates', f); G.bub(f, 'skates', 0.8); MD.Audio.skate(); break;
      case 'coin': f.pumpT = 6; f.rugT = 0; G.say('coin', f); G.bub(f, 'coin', 1, true); MD.Audio.coin(); break;
      case 'pizza': f.hp = Math.min(f.maxHp, f.hp + 12); G.bub(f, 'pizza', 1, true); MD.Audio.power(); break;
      case 'energy': f.caffT = 7; G.bub(f, 'caffeine', 1, true); MD.Audio.power(); G.sayRaw(f.cw.name + ' chugs an energy drink. Servo loop now running at 70 Hz.'); break;
      case 'gift': {
        // Surprise! Most gifts are nice. One in six is coal.
        const r = Math.random();
        if (r < 1 / 6) { f.hp = Math.max(1, f.hp - 8); G.bub(f, 'coal', 1, true); MD.Audio.rug(); G.sayRaw(f.cw.name + ' opens a gift: a lump of coal. Someone was on the naughty list.'); }
        else if (r < 2 / 6) { f.battery = Math.min(100, f.battery + 35); G.bub(f, 'gift', 1, true); G.sayRaw(f.cw.name + ' unwraps a spare battery. Batteries included, for once.'); }
        else if (r < 3 / 6) { f.skatesT = 9; f.cd.dash = 0; G.bub(f, 'skates', 1, true); G.sayRaw(f.cw.name + ' unwraps roller skates. Best present ever.'); }
        else if (r < 4 / 6) { f.hp = Math.min(f.maxHp, f.hp + 15); G.bub(f, 'gift', 1, true); G.sayRaw(f.cw.name + ' finds cookies meant for Santa. +15 integrity.'); }
        else if (r < 5 / 6) { if (!f.holding) { const s = MD.makeSock(0xd8322c); s.scale.setScalar(0.9); s.rotation.set(0.3, PI / 2, 0); f.d.beakTip.add(s); f.holding = s; } G.bub(f, 'sock', 1, true); G.sayRaw(f.cw.name + ' unwraps socks. Again. At least they are throwable.'); }
        else { f.pumpT = 6; f.rugT = 0; G.bub(f, 'coin', 1, true); G.sayRaw(f.cw.name + ' unwraps $MICRODUCK coins. +370% beak power, until the rug pull.'); }
        MD.Audio.coin(); break;
      }
      case 'toast': f.hp = Math.min(f.maxHp, f.hp + 10); G.bub(f, 'toast', 1, true); MD.Audio.power(); break;
      case 'rubber': f.hp = Math.min(f.maxHp, f.hp + 15); MD.Audio.squeak(); G.bub(f, 'rubber', 1, true); G.sayRaw(f.cw.name + ' explains its bug to the rubber duck. The bug fixes itself. +15 integrity.'); break;
      case 'butter': MD.Items.butterT = 7.5; G.say('butter', f); G.bub(f, 'butter', 1, true); setTimeout(() => G.bub(other(f), 'butterReply', 1, true), 1300); MD.Audio.quack(f.cw.voice, 0.3); break;
    }
    MD.Arena.sparks(new THREE.Vector3(it.x, 0.5, it.z), 0x6fd0e6, 10);
  };
  G.sockHit = function (att, def, mesh, kind) {
    att.stats.socks++;
    if (kind === 'snowball') {
      MD.Arena.scene.remove(mesh); mesh.parent && mesh.parent.remove(mesh);
      MD.Arena.sparks(headPos(def), 0xe8f6ff, 16); MD.Arena.sparks(headPos(def), 0x8fd3f4, 8);
      if (G.hit(att, def, 6 * powMul(att), 3, 'sock')) { def.stunT = Math.max(def.stunT, 1.3); G.bub(def, 'frozen', 1, true); if (Math.random() < 0.5) G.sayRaw(att.cw.name + ' lands a snowball. ' + def.cw.name + ' is frozen for a moment.'); }
      return;
    }
    if (G.hit(att, def, 7 * powMul(att), 3, 'sock')) {
      def.blindT = 2.0; G.say('sock', att, def); G.bub(def, 'blind', 0.8, true);
      if (def.sockOnHead) def.sockOnHead.parent && def.sockOnHead.parent.remove(def.sockOnHead);
      mesh.parent && mesh.parent.remove(mesh);
      mesh.position.set(-0.03, 0.3, 0.42); mesh.rotation.set(-1.2, 0, 0.4); mesh.scale.setScalar(1.15);
      def.d.head.add(mesh); def.sockOnHead = mesh;
    } else { MD.Arena.scene.remove(mesh); MD.Items.spawn('sock', def.x + 0.8, def.z, { y: 1 }); }
  };
  G.sayRaw = function (text) { if (!G.quiet) MD.UI.feed(text); };
  // Damage from the environment (boxes, vacuum, cat). A KO still counts as a win for the other duck.
  G.envHit = function (f, dmg, dx, dz, kb, vy) {
    const l = Math.hypot(dx, dz) || 1, o = other(f);
    const fake = { x: f.x - dx / l, z: f.z - dz / l, stats: { dmg: 0 }, cw: o.cw, pumpT: 0, real: o };
    return G.hit(fake, f, dmg, kb, 'env', vy);
  };
  G.caughtLaser = function (f) { f.battery = Math.min(100, f.battery + 12); G.say('laser', f); G.bub(f, 'laser', 1, true); MD.Audio.power(); MD.Arena.sparks(new THREE.Vector3(f.x, 0.3, f.z), 0xff3333, 12); };
  G.ballHit = function (att, def) { if (G.hit(att, def, 6 * powMul(att), 5, 'ball', 2)) G.say('ball', att, def); };

  // ---------- Per-fighter simulation ----------
  G.updateFighter = function (f, dt) {
    const o = other(f), inp = f.input, L = MD.Items.laser;
    f.stateT += dt;
    for (const k in f.cd) f.cd[k] -= dt;
    f.flashT -= dt; f.invulnT -= dt; f.laserCd -= dt; f.stunT -= dt; if (f.stompCd > 0) f.stompCd -= dt;
    f.stagger = Math.max(0, f.stagger - dt * 10);
    if (f.skatesT > 0) f.skatesT -= dt;
    if (f.caffT > 0) { f.caffT -= dt; if (Math.random() < dt * 4) MD.Arena.sparks(headPos(f), 0x7cff6b, 1); }
    if (f.rugT > 0) f.rugT -= dt;
    if (f.pumpT > 0) { f.pumpT -= dt; if (f.pumpT <= 0) { f.rugT = 2.5; G.say('rug', f); G.bub(f, 'rug', 1, true); MD.Audio.rug(); } }
    if (f.blindT > 0) { f.blindT -= dt; if (f.blindT <= 0 && f.sockOnHead) { f.sockOnHead.parent.remove(f.sockOnHead); f.sockOnHead = null; MD.Items.spawn('sock', f.x + 0.6, f.z + 0.3, { y: 1.8 }); } }

    // Battery: an hour of real runtime, squeezed into about ninety seconds.
    if (G.phase === 'fight' && !NOHIT.includes(f.state) && f.state !== 'sleep') {
      f.battery -= dt * 1.1;
      if (f.battery < 20 && !f.lowWarned) { f.lowWarned = true; G.say('lowbatt', f); }
      if (f.battery <= 0) { f.battery = 0; setState(f, 'sleep', 3.5); MD.Audio.sleep(); G.say('sleep', f); G.bub(f, 'sleep', 1, true); if (f.holding) dropHeld(f); }
    }

    // State transitions.
    const st = f.state;
    if (st === 'sleep') {
      if (Math.random() < dt * 1.5) MD.Arena.glyph(headPos(f).add(new THREE.Vector3(0.3, 0.4, 0)), 'z', '#8cc4ea', { size: 0.45, vy: 0.8, life: 1.6 });
      if (f.stateT >= f.actionDur) { f.battery = 12; f.lowWarned = true; setState(f, 'idle'); G.say('wake', f); G.bub(f, 'wake', 1, true); MD.Audio.boot(); }
    }
    if (st === 'hit' && f.stateT >= f.actionDur) setState(f, 'idle');
    if (st === 'down' && f.stateT >= f.actionDur) { setState(f, 'getup', 0.75); f.invulnT = 1.3; MD.Audio.servo(); MD.Audio.servo(); }
    if (st === 'getup' && f.stateT >= f.actionDur) { setState(f, 'idle'); if (Math.random() < 0.6) G.say('getup', o, f); else G.bub(f, 'getup', 0.8); }
    if (['peck', 'headbutt', 'throw', 'dash'].includes(st) && f.stateT >= f.actionDur) setState(f, 'idle');

    // Input.
    if (f.buf) { f.buf.t -= dt; if (f.buf.t <= 0) f.buf = null; }
    for (const a in inp.press) if (inp.press[a]) { f.buf = { a, t: 0.2 }; inp.press[a] = false; }
    const free = FREE.includes(f.state) && f.stunT <= 0;
    if (free && f.buf && f.onGround) { if (startAction(f, f.buf.a)) f.buf = null; }
    if (FREE.includes(f.state)) {
      const nearEdge = MD.Arena.edgeDist(f.x, f.z) < 0.45;
      f.state = inp.block && f.stunT <= 0 ? 'block' : (L.active ? 'chase' : (nearEdge && Math.hypot(f.vx, f.vz) < 1 ? 'teeter' : 'idle'));
    }

    // Movement intent.
    let mx = 0, mz = 0;
    const canMove = (FREE.includes(f.state) || f.state === 'air' || f.state === 'flip') && f.stunT <= 0;
    if (canMove) {
      mx = inp.mx; mz = inp.mz;
      if (L.active && f.state === 'chase') {
        const lx = L.x - f.x, lz = L.z - f.z, ll = Math.hypot(lx, lz) || 1;
        const pull = f.isCPU ? 1 : 0.75;
        mx = mx * (1 - pull * 0.6) + (lx / ll) * pull; mz = mz * (1 - pull * 0.6) + (lz / ll) * pull;
      }
      if (f.blindT > 0) { const a = Math.sin(G.time * 2.3 + f.id) * 1.3, c = Math.cos(a), s = Math.sin(a); const nx = mx * c - mz * s; mz = mx * s + mz * c; mx = nx; }
      if (G.mirrorT > 0) { mx = -mx; mz = -mz; }
      const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    }
    let sp = 3.3 * speedMul(f);
    if (f.state === 'block') sp *= 0.25;
    if (['peck', 'throw'].includes(f.state)) sp *= 0.3;
    const butter = MD.Items.butterT > 0, slip = (MD.Arena.map && MD.Arena.map.slippery) || 0;
    let accel = f.onGround ? (butter ? 1.6 : slip ? slip : f.skatesT > 0 ? 4 : 13) : 2.5;
    if (['hit', 'down', 'ko', 'getup', 'sleep', 'win', 'lose'].includes(f.state)) { mx = mz = 0; accel = butter ? 0.8 : slip ? 1.2 : 5; }
    if (f.state === 'dash') { accel = butter ? 0.3 : 1.2; mx = mz = 0; }
    if (f.state === 'headbutt') {
      const p = f.stateT / f.actionDur;
      if (p > 0.38 && p < 0.55) { const v = fwd(f); f.vx = v.x * 7.5; f.vz = v.z * 7.5; }
      accel = 6; mx = mz = 0;
    }
    if (f.state === 'fall') accel = 0;
    const k = 1 - Math.exp(-accel * dt);
    if (f.state !== 'fall' && !(f.state === 'headbutt' && f.stateT / f.actionDur > 0.38 && f.stateT / f.actionDur < 0.55)) {
      f.vx += (mx * sp - f.vx) * k; f.vz += (mz * sp - f.vz) * k;
    }

    // Facing.
    const v2 = Math.hypot(f.vx, f.vz);
    if (canMove && Math.hypot(mx, mz) > 0.2) {
      const want = Math.atan2(mx, mz);
      f.face += angDiff(want, f.face) * Math.min(1, dt * 11);
    } else if (FREE.includes(f.state) && o && Math.hypot(o.x - f.x, o.z - f.z) < 3.5 && v2 < 0.5) {
      f.face += angDiff(Math.atan2(o.x - f.x, o.z - f.z), f.face) * Math.min(1, dt * 4);
    }

    // Integrate.
    f.x += f.vx * dt; f.z += f.vz * dt;
    // Conveyor belts carry standing ducks along.
    const map = MD.Arena.map;
    if (map && map.conveyor && f.onGround && f.state !== 'fall') { const c = map.conveyor(f.x, f.z); if (c) { f.x += c[0] * dt; f.z += c[1] * dt; } }
    // Boxing ring: the ropes bounce you back instead of letting you fall out.
    if (map && map.ropes && f.state !== 'fall') {
      const A = MD.Arena, m = 0.55; let side = null;
      if (f.x > A.hw - m) { f.x = A.hw - m; if (f.vx > 0) { f.vx = -Math.max(f.vx * 1.15, 4.5); side = 'e'; } }
      if (f.x < -A.hw + m) { f.x = -A.hw + m; if (f.vx < 0) { f.vx = Math.max(-f.vx * 1.15, 4.5); side = 'w'; } }
      if (f.z > A.hd - m) { f.z = A.hd - m; if (f.vz > 0) { f.vz = -Math.max(f.vz * 1.15, 4.5); side = 's'; } }
      if (f.z < -A.hd + m) { f.z = -A.hd + m; if (f.vz < 0) { f.vz = Math.max(-f.vz * 1.15, 4.5); side = 'n'; } }
      if (side && (f.ropeCd || 0) <= 0) { f.ropeCd = 0.4; MD.Audio.tone(150, 0.25, 'sine', 0.35, 80); if (A.mapBuilt.onRope) A.mapBuilt.onRope(side, f); G.bub(f, 'ropes', 0.5); }
    }
    if (f.ropeCd > 0) f.ropeCd -= dt;
    // The kitchen counter has a backsplash: no falling off the back.
    if (MD.Arena.map && MD.Arena.map.backWall && f.state !== 'fall' && f.z < -MD.Arena.hd + 0.5) { f.z = -MD.Arena.hd + 0.5; if (f.vz < 0) f.vz = 0; }
    const onDesk = MD.Arena.inside(f.x, f.z);
    if (!f.onGround || f.state === 'fall') {
      const mapG = (MD.Arena.map && MD.Arena.map.gravity) || 1;
      f.vy -= 20 * (f.state === 'fall' ? 1 : G.gravMul) * mapG * dt;
      // Water: splash once, then sink slowly with droplets.
      const sc = (MD.Arena.map && MD.Arena.map.sinkColors) || [0xffffff, 0x8fd3f4];
      if (f.state === 'fall' && MD.Arena.fallMode === 'sink' && f.y < -0.2) {
        if (!f.splashed) { f.splashed = true; MD.Arena.sparks(new THREE.Vector3(f.x, -0.3, f.z), sc[0], 26); MD.Arena.sparks(new THREE.Vector3(f.x, -0.3, f.z), sc[1], 20); MD.Audio.noise(0.6, 0.55, 700, 0.6, 0, 'lowpass'); MD.Audio.noise(0.3, 0.3, 2500, 1, 0.05); }
        f.vy = Math.max(f.vy, -1.1); f.vx *= Math.pow(0.05, dt); f.vz *= Math.pow(0.05, dt);
        if (Math.random() < dt * 10) MD.Arena.sparks(new THREE.Vector3(f.x + (Math.random() - 0.5), -0.3, f.z + (Math.random() - 0.5)), Math.random() < 0.5 ? sc[0] : sc[1], 2);
      }
      // Space: drift away slowly, up and out.
      if (f.state === 'fall' && MD.Arena.fallMode === 'float') { f.vy = 0.9; const l = Math.hypot(f.vx, f.vz) || 1; f.vx = (f.vx / l) * Math.max(l, 1.5); f.vz = (f.vz / l) * Math.max(l, 1.5); }
      f.y += f.vy * dt;
      const gy = MD.Arena.groundAt(f.x, f.z);
      if (f.y <= gy && onDesk && f.state !== 'fall') {
        const hard = f.vy < -5;
        f.y = gy; f.vy = 0; f.onGround = true; MD.Audio.land();
        if (hard) MD.Arena.dust(f.x, f.z, 7);
        if (f.state === 'air' || f.state === 'flip') { stompCheck(f, o); if (f.state === 'air' || f.state === 'flip') setState(f, 'idle'); }
      }
      if ((f.state === 'air' || f.state === 'flip') && f.vy < 0 && f.y > 0.2 && o && (f.stompCd || 0) <= 0 && Math.hypot(o.x - f.x, o.z - f.z) < 1.05 && f.y > o.y + 0.2) stompCheck(f, o);
      const FY = MD.Arena.floorY;
      if (f.state === 'fall' && f.y < FY && !f.landedFloor) { f.landedFloor = true; f.y = FY; f.vy = 0; f.vx *= 0.2; f.vz *= 0.2; if (MD.Arena.fallMode !== 'sink') MD.Audio.clatter(); }
      if (f.landedFloor) { f.y = FY; f.vy = 0; f.vx = f.vz = 0; }
    }
    // Standing ducks follow the surface height (stepping onto the mat or the cutting board).
    if (f.onGround && f.state !== 'fall' && onDesk) f.y = MD.Arena.groundAt(f.x, f.z);
    if (!onDesk && f.state !== 'fall' && f.y < 0.4) {
      if (f.holding) dropHeld(f);
      setState(f, 'fall', 9); f.onGround = false; f.landedFloor = false;
      const n = Math.hypot(f.vx, f.vz) || 1; knock(f, f.vx / n, f.vz / n, 'fall'); f.state = 'fall';
      MD.Audio.fallOff(); MD.Audio.wilhelm(f.cw.voice); MD.Arena.gasp(); G.bub(f, 'ringout', 1, true);
      if (Math.random() < 0.35) G.sayRaw('A Wilhelm quack echoes across the lab.');
      G.onRingOut && G.onRingOut(f);
    }

    // Obstacles (mug).
    if (f.state !== 'fall') for (const ob of MD.Arena.obstacles) {
      const dx = f.x - ob.x, dz = f.z - ob.z, d = Math.hypot(dx, dz), r = ob.r + 0.42;
      if (d < r && d > 0.001) { f.x = ob.x + dx / d * r; f.z = ob.z + dz / d * r; }
    }

    // Attacks.
    if (o && !f.hitDone) {
      const dx = o.x - f.x, dz = o.z - f.z, d = Math.hypot(dx, dz), ang = Math.abs(angDiff(Math.atan2(dx, dz), f.face));
      const p = f.actionDur ? f.stateT / f.actionDur : 0, low = Math.abs(o.y - f.y) < 1.1;
      if (f.state === 'peck' && p > 0.38 && p < 0.62 && d < 2.0 && ang < 0.95 && low) {
        f.hitDone = true;
        if (G.hit(f, o, 5 * powMul(f), 2.8, 'peck')) { f.stats.pecks++; f.battery = Math.min(100, f.battery + 2); o.battery -= 2; if (Math.random() < 0.3) G.say('peck', f, o); }
        MD.Audio.clack();
      } else if (f.state === 'headbutt' && p > 0.4 && p < 0.74 && d < 2.05 && ang < 0.95 && low) {
        f.hitDone = true;
        if (G.hit(f, o, 12 * powMul(f), 7.5, 'hb', 3.2)) { f.stats.hbs++; if (Math.random() < 0.5) G.say('hb', f, o); }
      } else if (f.state === 'dash' && d < 1.8 && low) {
        f.hitDone = true;
        if (G.hit(f, o, (f.skatesT > 0 ? 11 : 8) * powMul(f), 8, 'dash', 2.6)) { if (Math.random() < 0.5) G.say('dash', f, o); }
        f.vx *= 0.3; f.vz *= 0.3;
      } else if (f.state === 'throw' && p > 0.45 && f.holding) {
        f.hitDone = true; const s = f.holding; f.holding = null; MD.Items.throwSock(f, s, f.holdKind || 'sock'); f.holdKind = null;
      }
    }

    // Visuals.
    f.d.root.position.set(f.x, f.y, f.z);
    f.d.root.rotation.y = f.face;
  };

  function stompCheck(f, o) {
    if (!o || (f.stompCd || 0) > 0) return;
    const d = Math.hypot(o.x - f.x, o.z - f.z);
    if (d < 1.05 && G.canBeHit(o)) {
      f.stompCd = 0.7;
      const ux = (f.x - o.x) / (d || 1), uz = (f.z - o.z) / (d || 1);
      f.vx += ux * 3; f.vz += uz * 3;
      const flip = f.state === 'flip';
      if (G.hit(f, o, (flip ? 14 : 8) * powMul(f), flip ? 6 : 3, 'stomp', flip ? 3 : 0)) G.say(flip ? 'flipHit' : 'stomp', f, o);
      f.vy = 5; f.onGround = false; setState(f, 'air');
    }
  }

  // Keep the two ducks from overlapping. Each duck is five spheres that follow its real pose
  // (feet, torso, head, beak, back of head), so heads, bodies and ducks lying on the mat all collide.
  // Overlaps are resolved by sliding the ducks apart horizontally; heavier or crouching ducks move less.
  const SPH = [
    { part: 'root', off: [0, 0.35, 0], r: 0.4 },
    { part: 'torso', off: [0, 0, 0], r: 0.34 },
    { part: 'head', off: [0, 0.2, 0.02], r: 0.32 },
    { part: 'head', off: [0, 0.12, 0.38], r: 0.22 },
    { part: 'head', off: [0, 0.22, -0.28], r: 0.22 },
  ];
  const mkS = () => SPH.map(() => ({ p: new THREE.Vector3(), r: 0 }));
  const SA = mkS(), SB = mkS();
  function spheres(f, out) {
    f.d.head.updateWorldMatrix(true, false); f.d.torso.updateWorldMatrix(true, false);
    const headScale = f.d.head.scale.x;
    SPH.forEach((s, i) => {
      const o = out[i];
      if (s.part === 'root') { o.p.set(f.x, f.y + s.off[1], f.z); o.r = s.r; return; }
      o.p.set(s.off[0], s.off[1], s.off[2]);
      f.d[s.part].localToWorld(o.p);
      o.r = s.part === 'head' ? s.r * headScale : s.r;
    });
  }
  const pushWeight = f => f.cw.stats.weight * (f.state === 'block' ? 3 : 1) * (f.state === 'down' || f.state === 'ko' || f.state === 'sleep' ? 0.7 : 1);
  G.separate = function () {
    const [a, b] = G.fighters; if (!a || !b) return;
    if (a.state === 'fall' || b.state === 'fall') return;
    spheres(a, SA); spheres(b, SB);
    const wa = pushWeight(a), wb = pushWeight(b), ta = wb / (wa + wb);
    for (let iter = 0; iter < 3; iter++) {
      let best = 0, nx = 0, nz = 0;
      for (const sa of SA) for (const sb of SB) {
        const dx = sb.p.x - sa.p.x, dy = sb.p.y - sa.p.y, dz = sb.p.z - sa.p.z, R = sa.r + sb.r;
        if (Math.abs(dy) >= R) continue;
        const hl = Math.hypot(dx, dz), need = Math.sqrt(R * R - dy * dy) - hl;
        if (need > best) {
          best = need;
          if (hl > 1e-4) { nx = dx / hl; nz = dz / hl; }
          else { const rl = Math.hypot(b.x - a.x, b.z - a.z) || 1; nx = (b.x - a.x) / rl || 1; nz = (b.z - a.z) / rl; }
        }
      }
      if (best <= 0.0005) break;
      const ax = -nx * best * ta, az = -nz * best * ta, bx = nx * best * (1 - ta), bz = nz * best * (1 - ta);
      a.x += ax; a.z += az; b.x += bx; b.z += bz;
      SA.forEach(s => { s.p.x += ax; s.p.z += az; }); SB.forEach(s => { s.p.x += bx; s.p.z += bz; });
    }
    a.d.root.position.set(a.x, a.y, a.z); b.d.root.position.set(b.x, b.y, b.z);
  };
  return G;
})();
