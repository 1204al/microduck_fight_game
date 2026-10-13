// DOM side: menus, HUD tags, banners, the commentary feed, the ticker, and all input
// (keyboard, gamepad like the one the real duck ships with, and touch).
window.MD = window.MD || {};
MD.UI = (function () {
  const $ = id => document.getElementById(id);
  const U = { opts: { mode: 'cpu', level: 1, level2: 1, bet: 'none', best: 3, p1: 'graphite', p2: 'lavender', hats: 'off', map: 'random' } };
  // Touch pads only for touch-first devices, or once someone actually touches the screen.
  U.isTouch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  const LEVEL_NAMES = ['EPISODE 0', 'PRETRAINED', 'OVERFIT'];
  const t0 = performance.now();
  let banT = null, bigT = null;

  // v2: hats default to off; older saved settings had them on by default.
  try { const s = JSON.parse(localStorage.getItem('md-opts') || 'null'); if (s) { if (s.v !== 2) s.hats = 'off'; Object.assign(U.opts, s); } } catch (e) {}
  U.opts.v = 2;
  const save = () => { try { localStorage.setItem('md-opts', JSON.stringify(U.opts)); } catch (e) {} };

  function seg(id, key, cast, after) {
    const el = $(id);
    const sync = () => el.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(cast(b.dataset.v) === U.opts[key])));
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; U.opts[key] = cast(b.dataset.v); sync(); save(); MD.Audio.init(); MD.Audio.beep(660, 0.05); after && after(); });
    sync();
  }
  function statRows(cwKey) {
    const s = MD.COLORWAYS[cwKey].stats;
    const rows = [['Integrity', s.hp], ['Waddle speed', s.speed], ['Beak power', s.power], ['Heft', s.weight]];
    return rows.map(([n, v]) => `<span>${n}</span><i style="width:${Math.round(Math.min(1, v / 1.3) * 100)}%"></i>`).join('');
  }
  function picks(side) {
    const el = $('picks' + side), key = 'p' + side;
    el.innerHTML = MD.COLORWAY_KEYS.map(k => { const c = MD.COLORWAYS[k]; return `<button class="pick" data-k="${k}" aria-pressed="false"><span class="sw" style="background:${c.css};--eye:${c.cssEye}"></span>${c.name}</button>`; }).join('');
    const sync = () => {
      el.querySelectorAll('.pick').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === U.opts[key])));
      const c = MD.COLORWAYS[U.opts[key]];
      $('bio' + side).innerHTML = `<b>${c.title}.</b> ${c.bio}`;
      $('stats' + side).innerHTML = statRows(U.opts[key]);
    };
    el.addEventListener('click', e => { const b = e.target.closest('.pick'); if (!b) return; U.opts[key] = b.dataset.k; sync(); save(); betLabels(); MD.Audio.init(); MD.Audio.quack(MD.COLORWAYS[b.dataset.k].voice); U.onPreview && U.onPreview(); });
    sync();
  }
  function betLabels() {
    const b = $('betSeg').querySelectorAll('button');
    b[0].textContent = 'Bet on ' + MD.COLORWAYS[U.opts.p1].name + ' (left)';
    b[1].textContent = 'Bet on ' + MD.COLORWAYS[U.opts.p2].name + ' (right)';
  }
  // Field guide: every pickup, hazard and random event, with icons rendered from the game models.
  const GUIDE_PICK = [
    ['sock', 'Sock', null, 'Walk over it to grab it with your beak, then peck to throw. A hit covers their camera for 2 seconds.'],
    ['battery', 'Spare battery', null, '+35% battery.'],
    ['skates', 'Optional wheels', null, 'Faster waddle and a much stronger skate dash for 9 seconds. No brakes.'],
    ['coin', '$MICRODUCK coin', null, 'Double beak power for 6 seconds, then a rug pull slows you down.'],
    ['rubber', 'Rubber duck', null, 'Repairs 15 integrity. Explaining your bug to it helps.'],
    ['butter', 'Butter', null, 'Greases the whole floor for 7 seconds. Everybody slides.'],
    ['ball', 'Football', null, 'Kick it into the other duck for 6 damage.'],
    ['toast', 'Toast', 'Kitchen', 'Fired by the toaster. +10 integrity.'],
    ['pizza', 'Pizza slice', 'Hackathon', '+12 integrity.'],
    ['energy', 'Energy drink', 'Hackathon', '35% faster for 7 seconds.'],
    ['gift', 'Surprise gift', 'Christmas', 'Battery, skates, cookies, socks or coins. One in six is coal: −8 integrity.'],
    ['snowball', 'Snowball', 'Ice Floe', 'Grab it, then peck to throw. A hit freezes the other duck for a moment.'],
    ['sushi', 'Sushi plate', 'Sushi Bar', 'Rides the conveyor belts. +8 integrity.'],
    ['wasabi', 'Wasabi', 'Sushi Bar', 'Very spicy. 35% faster for 6 seconds.'],
  ];
  const GUIDE_HAZ = [
    ['box', 'Delivery box', null, 'Lands on a red circle and hurts whoever is under it. Then it blocks the way.'],
    ['vacuum', 'Robot vacuum', null, 'Drives across, bumps ducks and eats the items in its path.'],
    ['paw', 'Cat paw', null, 'Swipes along the red stripe. Big knockback, easy ring-out.'],
    ['laser', 'Laser dot', null, 'You can’t help chasing it. Catch it for +12% battery.'],
    ['lego', 'LEGO brick', 'Playroom', 'Stepping on one hurts and makes you jump.'],
    ['rc', 'RC car', 'Playroom', 'Races across the table and rams any duck in its lane.'],
    ['soap', 'Soap bar', 'Bubble Bath', 'Step on it and you slide forward fast.'],
    ['frog', 'Frog', 'Duck Pond', 'Hops across the raft and bumps you out of its way.'],
    ['burner', 'Stove burner', 'Kitchen', 'Burns your feet while it glows red.'],
    ['ropes', 'Ring ropes', 'Main Event', 'Bounce you back like a slingshot. No ring-outs here: only a knockout wins.'],
    ['knight', 'Chess pieces', 'Grandmaster', 'Block the way and move every few seconds. A piece landing on you hurts, the knight most of all.'],
    ['penguin', 'Sliding penguin', 'Ice Floe', 'Belly-slides across the ice and knocks ducks aside. The ice itself is slippery too.'],
    ['spacebar', 'Spacebar', 'Keyboard', 'Step on it to launch high into the air. Every other key just clicks.'],
    ['belt', 'Conveyor belt', 'Sushi Bar', 'Carries you along, sometimes right off the end of the counter.'],
  ];
  const GUIDE_EV = [
    ['Firmware update', 'both ducks freeze for a moment'], ['Sim2Real gap', 'moon gravity for 8 seconds'],
    ['Running in Firefox', 'everything at half speed'], ['AZERTY mode', 'controls reversed for 6 seconds'],
    ['Dance break', 'both ducks stop and sing'], ['Airlock', 'Space only: wind pushes everyone sideways, crouch to hold on'],
  ];
  function guide() {
    const tile = ([k, n, where, txt], bad) => `<div class="gi${bad ? ' bad' : ''}"><img src="img/items/${k}.png" alt="" loading="lazy" width="58" height="58"><div><b>${n}${where ? `<em>${where}</em>` : ''}</b><span>${txt}</span></div></div>`;
    $('guidePick').innerHTML = GUIDE_PICK.map(t => tile(t, false)).join('');
    $('guideHaz').innerHTML = GUIDE_HAZ.map(t => tile(t, true)).join('');
    $('guideEv').innerHTML = GUIDE_EV.map(([n, t]) => `<span class="ev"><b>${n}</b> ${t}</span>`).join('');
  }

  // Arena picker: four maps plus Random. Picking one shows it live behind the menu.
  function mapPicks() {
    const el = $('mapPicks');
    // Each arena shows a rendered preview; the color swatch underneath shows if the image cannot load.
    const thumb = k => `<span class="thumb" style="background-image:url(img/maps/${k}.jpg),${MD.MAPS[k].swatch}"></span>`;
    const quad = ['lab', 'disco', 'pond', 'space'].filter(k => MD.MAPS[k]);
    const randomThumb = `<span class="thumb quad" style="background-image:${quad.map(k => `url(img/maps/${k}.jpg)`).join(',')}"><span class="q">?</span></span>`;
    el.innerHTML = MD.MAP_KEYS.map(k => `<button class="pick mp" data-k="${k}" aria-pressed="false">${thumb(k)}${MD.MAPS[k].name}</button>`).join('')
      + `<button class="pick mp" data-k="random" aria-pressed="false">${randomThumb}Random</button>`;
    const sync = () => {
      el.querySelectorAll('.pick').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === U.opts.map)));
      $('mapBio').textContent = U.opts.map === 'random' ? 'A different arena every match.' : MD.MAPS[U.opts.map].blurb;
    };
    el.addEventListener('click', e => { const b = e.target.closest('.pick'); if (!b) return; U.opts.map = b.dataset.k; sync(); save(); MD.Audio.init(); MD.Audio.beep(660, 0.05); U.onMapPreview && U.onMapPreview(b.dataset.k); });
    sync();
  }
  function modeSync() {
    const m = U.opts.mode, two = m === '2p', watch = m === 'watch';
    $('diffSeg').hidden = two; $('diffLbl').hidden = two;
    $('diffLbl').textContent = watch ? 'Left CPU training level' : 'CPU training level';
    $('diffSeg2').hidden = !watch; $('diffLbl2').hidden = !watch;
    $('betSeg').hidden = !watch; $('betLbl').hidden = !watch;
    $('keysP1').hidden = m !== 'cpu' || U.isTouch; $('keysTouch').hidden = m !== 'cpu' || !U.isTouch; $('keys2p').hidden = !two; $('keysWatch').hidden = !watch; $('padNote').hidden = watch || U.isTouch;
    $('pickH1').textContent = watch ? 'Left CPU colorway' : 'Player 1 colorway';
    $('pickH2').textContent = two ? 'Player 2 colorway' : watch ? 'Right CPU colorway' : 'CPU colorway';
    $('startBtn').textContent = watch ? 'Boot them up and watch' : 'Boot up and fight';
    betLabels();
  }

  U.init = function (h) {
    U.h = h;
    seg('modeSeg', 'mode', v => v, modeSync);
    seg('diffSeg', 'level', Number);
    seg('diffSeg2', 'level2', Number);
    seg('betSeg', 'bet', v => (v === 'none' ? 'none' : Number(v)));
    seg('bestSeg', 'best', Number);
    picks(1); picks(2); modeSync(); mapPicks(); guide();
    seg('hatSeg', 'hats', v => v);
    ['musicSeg', 'musicSeg2'].forEach(id => $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; MD.Audio.init(); if ((b.dataset.v === 'on') !== MD.Music.on) MD.Music.toggle(); syncMusic(); }));
    ['soundSeg', 'soundSeg2'].forEach(id => $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; MD.Audio.init(); if ((b.dataset.v === 'off') !== MD.Audio.muted) MD.Audio.toggleMute(); syncSound(); }));
    $('soundBtn').addEventListener('click', () => { MD.Audio.init(); MD.Audio.toggleMute(); syncSound(); });
    $('pauseBtn').addEventListener('click', () => h.pause());
    syncMusic(); syncSound();
    $('startBtn').addEventListener('click', () => { MD.Audio.init(); h.start(); });
    $('resumeBtn').addEventListener('click', () => h.pause(false));
    $('quitBtn').addEventListener('click', () => h.quit());
    $('againBtn').addEventListener('click', () => { MD.Audio.init(); h.start(); });
    $('menuBtn').addEventListener('click', () => h.quit());
    document.addEventListener('pointerdown', () => MD.Audio.init(), { once: true });
    U.ticker();
    setInterval(() => {
      const n = Math.floor((performance.now() - t0) / 4000).toLocaleString();
      $('soldN').textContent = n;
      document.querySelectorAll('.soldT').forEach(e => { e.textContent = n; });
    }, 1000);
    $('controls').addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      MD.Audio.init();
      const a = b.dataset.act;
      if (a === 'speed') h.speed();
      if (a === 'pause') h.pause();
      if (a === 'mute') { MD.Audio.toggleMute(); syncSound(); }
      if (a === 'music') { MD.Music.toggle(); syncMusic(); }
    });
    setupKeys(); setupTouch();
  };

  // Rendered once; two identical groups scroll as a seamless loop, and only the counter text updates.
  U.ticker = function () {
    const html = `<span>SERVO LOOP <b>50 HZ</b></span><span>IMU ×2 <b>OK</b></span><span>LIDAR <b>8×8</b></span><span>RK3566 · 1 GB RAM</span><span>MICRODUCKS SOLD SINCE YOU OPENED THIS PAGE <b class="soldT">0</b></span><span>PRE-ORDERS, FIRST 24 H <b>$2.6M</b></span><span>BATTERY LIFE <b>~1 H</b> (HERE: 90 S)</span><span>DO NOT CALL IT OPEN-SOURCE HARDWARE</span><span>FIRST DELIVERIES <b>BEFORE CHRISTMAS</b></span>`;
    $('tick1').innerHTML = html; $('tick2').innerHTML = html;
  };

  const K = (keys, label) => `<span class="k">${keys.map(k => `<kbd>${k}</kbd>`).join(' ')} ${label}</span>`;
  // Controls bar: one row per player (columns line up across rows), general buttons on the right.
  const ROW_ORDER = ['Move', 'Peck', 'Head', 'Skate', 'Hop', 'Crouch', 'Flip'];
  const row = (who, keys) => `<span class="who">${who}</span>` + keys.map((k, i) => K([].concat(k), ROW_ORDER[i])).join('');
  U.renderControls = function (G) {
    U.lastG = G;
    const m = U.opts.mode;
    let pad = false;
    try { pad = navigator.getGamepads && Array.from(navigator.getGamepads()).some(Boolean); } catch (e) {}
    let left;
    if (m === 'watch') {
      const [a, b] = G.fighters;
      left = `<div class="ctl-watch"><span class="who">WATCHING</span><span>${a.cw.name} (${LEVEL_NAMES[a.level].toLowerCase()}) vs ${b.cw.name} (${LEVEL_NAMES[b.level].toLowerCase()})</span><button data-act="speed">Speed ×${G.watchSpeed}</button>${K(['X'], 'Toggle speed')}</div>`;
    } else {
      const rows = m === '2p'
        ? [row('P1', ['WASD', 'F', 'G', 'H', 'R', 'Q', 'E']), row('P2', ['←↑↓→', ',', '.', '/', ';', "'", 'L'])]
        : [row('KEYS', [['WASD', '←↑↓→'], 'J', 'K', 'L', 'Space', 'Shift', 'T'])];
      if (pad && m !== '2p') rows.push(row('PAD', ['Stick', 'A', 'X', 'RB', 'B', 'LB', 'Y']));
      left = `<div class="ctl-players">${rows.join('')}</div>`;
    }
    const sys = `<div class="ctl-sys"><button data-act="pause"><kbd>P</kbd> Pause</button><button data-act="mute"><kbd>M</kbd> ${MD.Audio.muted ? 'Unmute' : 'Mute'}</button><button data-act="music"><kbd>N</kbd> Music ${MD.Music.on ? 'off' : 'on'}</button></div>`;
    $('controls').innerHTML = left + sys;
    syncCtlHeight();
  };
  function syncCtlHeight() {
    const c = $('controls');
    document.documentElement.style.setProperty('--ctl-h', c.hidden ? '0px' : c.offsetHeight + 'px');
  }
  window.addEventListener('resize', syncCtlHeight);

  U.screen = function (name) {
    U.cur = name;
    ['menu', 'pause', 'over'].forEach(s => { $(s).hidden = s !== name; });
    $('hud').hidden = name === 'menu' || name === 'over';
    const watch = U.opts.mode === 'watch', inGame = !name || name === 'pause';
    $('touch').hidden = !(U.isTouch && !name && !watch);
    document.body.classList.toggle('touch-ui', !$('touch').hidden);
    $('controls').hidden = !inGame || (U.isTouch && !watch);
    syncCtlHeight(); syncHudH();
  };

  U.setupHUD = function (G) {
    G.fighters.forEach((f, i) => {
      const n = i + 1;
      $('n' + n).textContent = f.cw.name.toUpperCase();
      $('sw' + n).style.background = f.cw.css;
      $('who' + n).textContent = f.isCPU ? 'CPU · ' + LEVEL_NAMES[f.level != null ? f.level : G.level] : 'P' + n;
      const need = Math.ceil(G.best / 2);
      $('pips' + n).innerHTML = Array.from({ length: need }, (_, k) => `<span class="pip${k < f.wins ? ' on' : ''}"></span>`).join('');
    });
    $('roundLbl').textContent = 'ROUND ' + G.round;
    syncHudH();
  };
  // Messages sit just below the HUD tags, so measure where the tags end.
  function syncHudH() {
    if ($('hud').hidden) return;
    const b = Math.round(document.querySelector('#hud .tags').getBoundingClientRect().bottom);
    if (b > 0 && b !== U.hudBottom) { U.hudBottom = b; document.documentElement.style.setProperty('--hud-h', b + 'px'); }
  }
  window.addEventListener('resize', () => syncHudH());

  const chipCache = ['', ''];
  U.updateHUD = function (G) {
    G.fighters.forEach((f, i) => {
      const n = i + 1, hp = Math.max(0, f.hp / f.maxHp * 100);
      $('h' + n).style.width = hp + '%';
      $('h' + n).style.background = hp < 30 ? 'var(--hp-low)' : 'var(--hp)';
      $('hl' + n).style.width = hp + '%';
      $('b' + n).style.width = Math.max(0, f.battery) + '%';
      $('bt' + n).textContent = 'BATT ' + Math.max(0, Math.ceil(f.battery)) + '%' + (f.battery < 20 ? ' LOW' : '');
      const chips = [];
      if (f.holding) chips.push(['SOCK', '']);
      if (f.skatesT > 0) chips.push(['WHEELS ' + Math.ceil(f.skatesT), 'y']);
      if (f.caffT > 0) chips.push(['CAFFEINATED', 'y']);
      if (f.pumpT > 0) chips.push(['+370%', 'y']);
      if (f.rugT > 0) chips.push(['RUG PULLED', 'r']);
      if (f.blindT > 0) chips.push(['CAMERA COVERED', 'r']);
      if (f.state === 'sleep') chips.push(['ASLEEP', 'b']);
      if (f.stunT > 0) chips.push(['UPDATING', 'b']);
      if (MD.Items.butterT > 0) chips.push(['BUTTERED', 'y']);
      if (G.gravMul < 1) chips.push(['MOON GRAVITY', 'b']);
      if (G.timeScale < 1) chips.push(['FIREFOX MODE', 'b']);
      if (G.mirrorT > 0) chips.push(['AZERTY', 'r']);
      const html = chips.map(([t, c]) => `<span class="chip ${c}">${t}</span>`).join('');
      if (html !== chipCache[i]) { $('c' + n).innerHTML = html; chipCache[i] = html; syncHudH(); }
    });
    $('clock').textContent = 'EPISODE ' + G.episode.toLocaleString() + ' · 50 HZ';
  };

  U.banner = function (h, p, dur) {
    if (MD.Game && MD.Game.quiet) return;
    $('banH').textContent = h; $('banP').textContent = p || '';
    $('banner').classList.remove('hide'); document.body.classList.add('banner-on');
    clearTimeout(banT); banT = setTimeout(() => { $('banner').classList.add('hide'); document.body.classList.remove('banner-on'); }, (dur || 3.2) * 1000);
  };
  U.big = function (text, sub, dur) {
    $('bigT').innerHTML = text + (sub ? `<small>${sub}</small>` : '');
    $('big').classList.remove('hide');
    clearTimeout(bigT); if (dur !== 0) bigT = setTimeout(() => $('big').classList.add('hide'), (dur || 1.2) * 1000);
  };
  U.hideBig = () => $('big').classList.add('hide');
  U.feed = function (text) {
    if (MD.Game && MD.Game.quiet) return;
    const f = $('feed'), d = document.createElement('div');
    d.textContent = text; f.appendChild(d);
    while (f.children.length > 2) f.removeChild(f.firstChild);
    setTimeout(() => d.classList.add('out'), 3800);
    setTimeout(() => d.remove(), 4400);
    if (U.onLog) U.onLog(text);
  };
  U.clearFeed = () => { $('feed').innerHTML = ''; };

  // Speech bubbles that follow a duck's head on screen.
  const bubbles = new Map(), bubbleCd = {};
  U.bubble = function (f, text, force) {
    if (MD.Game && MD.Game.quiet) return;
    const now = performance.now();
    if (!force && now < (bubbleCd[f.id] || 0)) return;
    bubbleCd[f.id] = now + 1700;
    let b = bubbles.get(f.id);
    if (!b) { const el = document.createElement('div'); el.className = 'bubble'; $('bubbles').appendChild(el); b = { el }; bubbles.set(f.id, b); }
    b.el.innerHTML = '<i></i>'; b.el.firstChild.textContent = text;
    b.el.classList.remove('out'); b.f = f; b.until = now + 1900;
  };
  const BV = new THREE.Vector3();
  U.updateBubbles = function (camera) {
    const now = performance.now();
    bubbles.forEach((b, id) => {
      if (now > b.until) {
        b.el.classList.add('out');
        if (now > b.until + 300) { b.el.remove(); bubbles.delete(id); }
        return;
      }
      b.f.d.head.getWorldPosition(BV); BV.y += 0.8; BV.project(camera);
      const sx = (BV.x * 0.5 + 0.5) * innerWidth, sy = (-BV.y * 0.5 + 0.5) * innerHeight;
      const x = Math.max(80, Math.min(innerWidth - 80, sx)), y = Math.max((U.hudBottom || 110) + 45, sy);
      b.el.style.visibility = BV.z > 1 || sx < 0 || sx > innerWidth || sy > innerHeight ? 'hidden' : '';
      b.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    });
  };
  U.clearBubbles = () => { bubbles.forEach(b => b.el.remove()); bubbles.clear(); };

  U.over = function (G, winner) {
    $('overT').textContent = winner.cw.name + ' wins';
    const [a, b] = G.fighters;
    const rows = [['Damage dealt', a.stats.dmg, b.stats.dmg], ['Pecks landed', a.stats.pecks, b.stats.pecks], ['Headbutts landed', a.stats.hbs, b.stats.hbs], ['Socks thrown', a.stats.socks, b.stats.socks], ['Falls recovered from', a.stats.falls, b.stats.falls], ['Flips for no reason', a.stats.flips, b.stats.flips], ['Hats lost', a.stats.hats, b.stats.hats]];
    $('overStats').innerHTML = `<b></b><b>${a.cw.name}</b><b>${b.cw.name}</b>` + rows.map(r => `<span>${r[0]}</span><span>${Math.round(r[1])}</span><span>${Math.round(r[2])}</span>`).join('');
    const quips = [
      'The losing duck has filed a bug report: "Works in simulation."',
      'Both ducks are being returned to the box. Neither box closes.',
      'Reward function updated. New objective: pick up socks, not fights.',
      'Winner celebrates by singing. Nobody asked it to. It is going to keep singing.',
      'Post-match analysis: sim2real gap measured at one entire desk height.',
      'Fun fact: the real one costs $399 and would mostly fall over politely.',
    ];
    let q = quips[Math.floor(Math.random() * quips.length)];
    if (U.opts.mode === 'watch' && U.opts.bet !== 'none') {
      q = U.opts.bet === winner.id
        ? `You bet on ${winner.cw.name} and won 399 imaginary $MICRODUCK. It is already worth 370% less. ` + q
        : `You bet on ${G.fighters[U.opts.bet].cw.name}. The bet has been rug pulled. ` + q;
    }
    $('overQuip').textContent = q;
    U.screen('over');
  };

  // ---------- Input ----------
  const keys = new Set();
  U.keys = keys;
  const MAP1 = { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], peck: ['KeyJ'], hb: ['KeyK'], dash: ['KeyL'], hop: ['Space'], block: ['ShiftLeft', 'ShiftRight'], flip: ['KeyT'] };
  const MAP2P = [
    { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], peck: ['KeyF'], hb: ['KeyG'], dash: ['KeyH'], hop: ['KeyR'], block: ['KeyQ'], flip: ['KeyE'] },
    { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], peck: ['Comma', 'Numpad1'], hb: ['Period', 'Numpad2'], dash: ['Slash', 'Numpad3'], hop: ['Semicolon', 'Numpad0'], block: ['Quote', 'Numpad5'], flip: ['KeyL', 'Numpad6'] },
  ];
  const PRESS = ['peck', 'hb', 'dash', 'hop', 'flip'];
  function maps() { return U.opts.mode === '2p' && U.h && U.h.inMatch() ? MAP2P : [MAP1]; }
  function setupKeys() {
    window.addEventListener('keydown', e => {
      if (e.repeat) { if (U.h && U.h.inMatch()) e.preventDefault(); return; }
      MD.Audio.init();
      if (e.code === 'KeyN') { const on = MD.Music.toggle(); syncMusic(); U.feed(on ? 'Music on.' : 'Music off. The ducks will hum it themselves.'); return; }
      if (e.code === 'KeyM') { MD.Audio.toggleMute(); syncSound(); U.feed(MD.Audio.muted ? 'Sound off. The ducks are now quacking silently.' : 'Sound on.'); return; }
      if ((e.code === 'KeyP' || e.code === 'Escape') && U.h && U.h.inMatch()) { U.h.pause(); return; }
      if (e.code === 'KeyX' && U.opts.mode === 'watch' && U.h && U.h.inMatch()) { U.h.speed(); return; }
      keys.add(e.code);
      if (U.h && U.h.inMatch()) {
        if (e.code.startsWith('Arrow') || e.code === 'Space' || e.code === 'Slash' || e.code === 'Quote') e.preventDefault();
        maps().forEach((m, i) => PRESS.forEach(a => { if (m[a].includes(e.code)) U.h.press(i, a); }));
      }
    });
    window.addEventListener('keyup', e => keys.delete(e.code));
    window.addEventListener('blur', () => keys.clear());
  }
  function syncMusic() {
    ['musicSeg', 'musicSeg2'].forEach(id => $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.v === 'on') === MD.Music.on))));
    if (U.lastG && !$('controls').hidden) U.renderControls(U.lastG);
  }
  function syncSound() {
    const m = MD.Audio.muted;
    ['soundSeg', 'soundSeg2'].forEach(id => $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.v === 'off') === m))));
    const btn = $('soundBtn');
    btn.setAttribute('aria-pressed', String(m)); btn.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
    btn.querySelector('.on').toggleAttribute('hidden', m); btn.querySelector('.off').toggleAttribute('hidden', !m);
    if (U.lastG && !$('controls').hidden) U.renderControls(U.lastG);
  }
  U.syncSound = syncSound;
  const held = (codes) => codes.some(c => keys.has(c));

  // Touch: a joystick and six pads, for player 1.
  const touch = { mx: 0, mz: 0, block: false, id: null };
  function setupTouch() {
    window.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !U.isTouch) { U.isTouch = true; modeSync(); U.screen(U.cur); } });
    const stick = $('stick'), knob = $('knob');
    const move = (e) => {
      const r = stick.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy), max = r.width / 2 - 10;
      if (l > max) { dx *= max / l; dy *= max / l; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      touch.mx = dx / max; touch.mz = dy / max;
    };
    stick.addEventListener('pointerdown', e => { touch.id = e.pointerId; stick.setPointerCapture(e.pointerId); move(e); });
    stick.addEventListener('pointermove', e => { if (e.pointerId === touch.id) move(e); });
    const end = e => { if (e.pointerId !== touch.id) return; touch.id = null; touch.mx = touch.mz = 0; knob.style.transform = ''; };
    stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
    $('pads').querySelectorAll('button').forEach(b => {
      const k = b.dataset.k;
      b.addEventListener('pointerdown', e => { e.preventDefault(); MD.Audio.init(); b.classList.add('down'); if (k === 'block') touch.block = true; else U.h && U.h.press(0, k); });
      const up = () => { b.classList.remove('down'); if (k === 'block') touch.block = false; };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    });
  }

  const padPrev = [{}, {}];
  // Fill movement and held inputs for each human fighter. Presses arrive via U.h.press().
  U.pollInput = function (G) {
    const ms = maps();
    let pads = [];
    try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []; } catch (e) { pads = []; }
    G.fighters.forEach((f, i) => {
      if (f.isCPU) return;
      const m = ms[i] || ms[0], inp = f.input;
      let mx = (held(m.right) ? 1 : 0) - (held(m.left) ? 1 : 0);
      let mz = (held(m.down) ? 1 : 0) - (held(m.up) ? 1 : 0);
      let block = held(m.block);
      if (i === 0) { if (Math.hypot(touch.mx, touch.mz) > 0.15) { mx = touch.mx; mz = touch.mz; } block = block || touch.block; }
      const gp = pads[i];
      if (gp) {
        const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        if (Math.hypot(ax, ay) > 0.2) { mx = ax; mz = ay; }
        const bt = n => gp.buttons[n] && gp.buttons[n].pressed;
        if (bt(14)) mx = -1; if (bt(15)) mx = 1; if (bt(12)) mz = -1; if (bt(13)) mz = 1;
        block = block || bt(4) || bt(6);
        const P = padPrev[i];
        [['peck', 0], ['hop', 1], ['hb', 2], ['flip', 3], ['dash', 5], ['dash', 7]].forEach(([a, n]) => { if (bt(n) && !P[n]) U.h.press(i, a); P[n] = bt(n); });
        if (bt(9) && !P[9]) U.h.pause(); P[9] = bt(9);
      }
      const l = Math.hypot(mx, mz); if (l > 1) { mx /= l; mz /= l; }
      inp.mx = mx; inp.mz = mz; inp.block = block;
    });
  };
  return U;
})();
