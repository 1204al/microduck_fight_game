// Match flow, attract mode, the frame loop, and the training monitor feed.
(function () {
  const G = MD.Game, UI = MD.UI, A = MD.Arena, I = MD.Items;

  // Recording mode (?rec=1): a CPU vs CPU match that advances exactly one frame per MDREC.step(),
  // so a capture script can grab every frame. Randomness is seeded, and timers and the clock
  // follow game time instead of wall time, so slow capture never changes what happens on screen.
  const QS = new URLSearchParams(location.search);
  const REC = QS.get('rec') === '1';
  MD.REC = REC;
  let recAdvance = null;
  if (REC) {
    let seed = (Number(QS.get('seed')) || 1) >>> 0;
    Math.random = function () {
      seed = (seed + 0x6D2B79F5) >>> 0;
      let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    let clock = performance.now();
    performance.now = () => clock;
    const timers = []; let tid = 1;
    window.setTimeout = (fn, ms) => { const id = tid++; timers.push({ id, at: clock + (ms || 0), fn, every: 0 }); return id; };
    window.setInterval = (fn, ms) => { const id = tid++; timers.push({ id, at: clock + ms, fn, every: ms }); return id; };
    window.clearTimeout = window.clearInterval = id => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); };
    recAdvance = ms => {
      clock += ms;
      for (let guard = 0; guard < 200; guard++) {
        timers.sort((a, b) => a.at - b.at);
        const t = timers[0];
        if (!t || t.at > clock) break;
        if (t.every) t.at += t.every; else timers.shift();
        try { t.fn(); } catch (e) { console.error(e); }
      }
    };
    document.body.classList.add('rec');
  }
  const newStats = () => ({ dmg: 0, pecks: 0, hbs: 0, socks: 0, falls: 0, flips: 0, hats: 0 });
  const other = f => G.fighters[1 - f.id];
  let last = performance.now(), introT = 0, endT = 0, eventT = 6, monT = 0, histT = 0, orbit = 0;
  let winner = null, matchOver = false, paused = false, demoResetT = 0, songs = [], overShown = false;
  const hist = [[], []], log = ['Policy loaded: microduck_fight_v1.safetensors', 'Two ducks found on the desk. Neither has read the safety manual.', 'Waiting for a human to press Boot up and fight.'];

  function setupFighters(p1, p2, cpu1, cpu2) {
    G.fighters.forEach(G.removeFighter);
    G.fighters = [G.makeFighter(0, p1, cpu1), G.makeFighter(1, p2, cpu2)];
    G.fighters.forEach(f => { f.stats = newStats(); });
    UI.clearBubbles();
  }
  // Hats: a rookie CPU gets the propeller beanie, an overfit one gets the graduation cap.
  function giveHats() {
    const used = [];
    G.fighters.forEach(f => {
      let k = null;
      if (UI.opts.hats !== 'off') {
        if (f.isCPU && f.level === 0) k = 'propeller';
        else if (f.isCPU && f.level === 2) k = 'grad';
        else { const pool = MD.HAT_KEYS.filter(h => !used.includes(h)); k = pool[Math.floor(Math.random() * pool.length)]; }
      }
      used.push(k); f.hatKey = k; MD.putHat(f.d, k);
    });
  }

  function startDemo() {
    paused = false; G.phase = 'demo'; G.quiet = true; G.level = 1; G.watch = false; G.watchSpeed = 1;
    MD.Audio.setLevel(0.3);
    clearAll();
    if (UI.opts.map !== 'random') A.loadMap(UI.opts.map);
    setupFighters(UI.opts.p1, UI.opts.p2, true, true);
    giveHats();
    A.mapRound(G); eventT = 4;
    UI.screen('menu'); UI.hideBig(); MD.Music.setMode('menu'); MD.Music.duck(1);
  }

  function startMatch() {
    paused = false; G.quiet = false; MD.Audio.setLevel(1);
    G.best = UI.opts.best; G.level = UI.opts.level;
    G.watch = UI.opts.mode === 'watch'; G.watchSpeed = 1;
    clearAll(); pickMap();
    setupFighters(UI.opts.p1, UI.opts.p2, G.watch, UI.opts.mode !== '2p');
    if (G.watch) { G.fighters[0].level = UI.opts.level; G.fighters[1].level = UI.opts.level2; }
    else G.fighters[1].level = UI.opts.level;
    giveHats();
    UI.renderControls(G);
    G.round = 1; UI.clearFeed(); UI.screen(null);
    log.length = 0; log.push('New match on ' + A.map.name + ': ' + G.fighters[0].cw.name + ' vs ' + G.fighters[1].cw.name);
    MD.Music.setMode(A.map.music || 'fight'); MD.Music.duck(1);
    startRound();
    if (/Firefox/.test(navigator.userAgent)) setTimeout(() => UI.feed('Firefox detected. Good news: this duck has heard of Firefox.'), 2500);
  }

  function startRound() {
    G.fighters.forEach(f => G.resetFighter(f));
    clearAll(); A.mapRound(G); hist[0] = []; hist[1] = [];
    G.phase = 'intro'; introT = 0; eventT = G.eventEvery ? Math.min(7, G.eventEvery * 0.6) : 7; overShown = false; matchOver = false; winner = null;
    UI.setupHUD(G); UI.updateHUD(G);
    UI.big('Round ' + G.round, G.round === 1 ? A.map.name : rnd(['Booting... calibrating IMUs...', 'Loading 7 trained moves...', 'Checking for socks...', 'Servo loop at 50 Hz...']), 1.25);
    MD.Audio.boot();
  }
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  // Random arena: never the same one twice in a row.
  let lastMap = null;
  function pickMap() {
    let k = UI.opts.map;
    if (k === 'random' || !MD.MAPS[k]) { const pool = MD.MAP_KEYS.filter(m => m !== lastMap); k = pool[Math.floor(Math.random() * pool.length)]; }
    lastMap = k; A.loadMap(k);
  }
  function clearAll() { I.clear(); MD.Hazards.clear(G); A.mapClear(); songs = []; G.danceT = 0; G.finishT = 0; UI.clearBubbles(); G.fighters.forEach(f => { f.singing = false; }); }

  function endRound(w, title, key) {
    if (G.phase !== 'fight') return;
    G.phase = 'roundEnd'; endT = 0; winner = w;
    const l = other(w);
    w.wins++;
    G.say(key, w, l);
    matchOver = w.wins >= Math.ceil(G.best / 2);
    // Slow-motion replay of the finishing blow.
    G.finishT = 1.3; G.finishFocus = l;
    MD.Arena.cheer(1);
    if (Math.random() < 0.3) setTimeout(() => G.sayRaw('Slow-motion replay powered by the 50 Hz servo loop.'), 500);
    UI.big(title, matchOver ? `${w.cw.name} wins the match` : `${w.cw.name} takes round ${G.round}`, 2.4);
    UI.setupHUD(G);
  }
  G.onKO = (att, def) => {
    if (G.phase === 'demo') { demoResetT = 2.5; return; }
    endRound(att, 'K.O.', 'ko'); MD.Audio.clatter(); A.screws(new THREE.Vector3(def.x, 1.5, def.z), 5);
  };
  G.onRingOut = (f) => {
    if (G.phase === 'demo') { demoResetT = 2.5; return; }
    endRound(other(f), 'Ring out', 'ringout');
  };

  function sing(f, count, pitch) {
    f.state = 'win'; f.stateT = 0;
    songs.push({ f, tl: MD.Audio.song(f.cw.voice * (pitch || 1), count), t: 0, noteT: 0 });
  }
  function updateSong(dt) {
    for (let i = songs.length - 1; i >= 0; i--) {
      const sg = songs[i], f = sg.f;
      sg.t += dt; sg.noteT -= dt;
      f.singing = sg.tl.some(([s, d]) => sg.t >= s && sg.t < s + d * 0.75);
      if (f.singing && sg.noteT <= 0) { sg.noteT = 0.32; const p = new THREE.Vector3(); f.d.head.getWorldPosition(p); p.y += 0.6; A.glyph(p, rnd(['♪', '♫']), rnd(['#f5c518', '#f3eee4', f.cw.css]), { size: 0.55 }); }
      const last = sg.tl[sg.tl.length - 1], endAt = last ? last[0] + last[1] : 0;
      if (sg.t > endAt + 0.3) { f.singing = false; songs.splice(i, 1); }
    }
    MD.Music.duck(paused ? 0.3 : songs.length ? 0.35 : 1);
  }
  // Dance break: both ducks stop fighting and sing a few bars together, in harmony-ish.
  G.startDance = function () {
    if (G.phase !== 'fight' && G.phase !== 'demo') return;
    const ok = G.fighters.filter(f => G.canAct(f) && f.onGround);
    if (ok.length < 2) return;
    G.danceT = 2.6;
    ok.forEach((f, i) => { f.vx = f.vz = 0; sing(f, 6, i ? 1.26 : 1); MD.UI.bubble(f, i ? '♪ quack quack ♪' : '♪ Alle meine Entchen ♪', true); });
    G.sayRaw('Both ducks stop to sing. Nobody knows who started it.');
  };

  function updatePhases(dt) {
    if (G.phase === 'intro') {
      introT += dt;
      if (introT >= 1.3 && introT - dt < 1.3) { UI.big('Fight!', null, 0.8); G.fighters.forEach((f, i) => MD.Audio.quack(f.cw.voice, 0.18, i * 0.12)); }
      if (introT >= 1.6) G.phase = 'fight';
    } else if (G.phase === 'roundEnd') {
      endT += dt;
      if (endT >= 0.9 && endT - dt < 0.9) {
        const l = other(winner);
        songs = []; G.fighters.forEach(f => { f.singing = false; });
        if (winner.state !== 'fall' && winner.state !== 'ko') { sing(winner, matchOver ? 0 : 6); G.bub(winner, 'win', 1, true); }
        if (!['ko', 'fall'].includes(l.state)) { l.state = 'lose'; l.stateT = 0; }
        if (matchOver) { A.confetti({ x: winner.x, z: winner.z }); }
      }
      if (!matchOver && endT >= 3.2) { G.round++; startRound(); }
      if (matchOver && endT >= 3.4 && !overShown) { overShown = true; G.phase = 'matchEnd'; if (!REC) UI.over(G, winner); MD.Music.setMode('menu'); }
    } else if (G.phase === 'fight' && G.danceT > 0) {
      G.danceT -= dt;
      if (G.danceT <= 0) G.fighters.forEach(f => { if (f.state === 'win') { f.state = 'idle'; f.stateT = 0; f.singing = false; } });
    } else if (G.phase === 'demo' && demoResetT > 0) {
      demoResetT -= dt;
      if (demoResetT <= 0) { G.fighters.forEach(f => G.resetFighter(f)); clearAll(); }
    }
    if (G.phase === 'demo' && G.danceT > 0) {
      G.danceT -= dt;
      if (G.danceT <= 0) G.fighters.forEach(f => { if (f.state === 'win') { f.state = 'idle'; f.singing = false; } });
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000) || 0); last = now;
    advance(dt);
  }

  function advance(dt) {
    const realDt = dt;
    if (paused) { A.render(); return; }
    if (G.hitstop > 0) { G.hitstop -= dt; dt *= 0.1; }
    dt *= G.timeScale * (G.watch && G.phase !== 'matchEnd' ? G.watchSpeed : 1);
    if (G.finishT > 0) { G.finishT -= realDt; dt *= 0.3; }
    G.time += dt;
    const live = G.phase === 'fight' || G.phase === 'demo';
    if (G.phase === 'fight') UI.pollInput(G);
    G.fighters.forEach(f => {
      if (live && f.isCPU) MD.AI.think(f, other(f), G, dt);
      if (!live) { f.input.mx = f.input.mz = 0; f.input.block = false; f.input.press = {}; f.buf = null; }
    });
    if (live) { eventT -= dt; if (eventT <= 0) { eventT = G.eventEvery ? G.eventEvery * (0.85 + Math.random() * 0.3) : 8 + Math.random() * 4; I.randomEvent(G); } }
    G.fighters.forEach(f => G.updateFighter(f, dt));
    G.separate();
    I.update(dt, G);
    MD.Hazards.update(dt, G);
    updatePhases(dt);
    MD.Music.setIntensity(G.phase === 'fight' && G.fighters.some(f => f.hp / f.maxHp < 0.3) ? 1 : 0);
    updateSong(dt);
    G.fighters.forEach(f => MD.animateDuck(f.d, f, dt, G.time));
    A.updateFx(dt);

    // Camera.
    const on = G.fighters.filter(f => f.state !== 'fall');
    const pts = on.length ? on : [{ x: 0, z: 0 }];
    const focus = { x: pts.reduce((s, f) => s + f.x, 0) / pts.length, z: pts.reduce((s, f) => s + f.z, 0) / pts.length };
    const spread = on.length === 2 ? Math.hypot(on[0].x - on[1].x, on[0].z - on[1].z) : 2;
    if (G.phase === 'demo') { orbit += dt * 0.15; const off = window.innerWidth >= 1100 ? 4.2 : 0; A.updateCamera(dt, { x: focus.x - off, z: focus.z }, spread + 2, Math.sin(orbit) * 0.5); }
    else if (G.phase === 'matchEnd' && winner) { orbit += dt * 0.25; A.updateCamera(dt, { x: winner.x, z: winner.z }, 0, Math.sin(orbit) * 0.9); }
    else if (G.finishT > 0 && G.finishFocus) A.updateCamera(realDt, { x: G.finishFocus.x, z: G.finishFocus.z }, 0, null, 6.5);
    else A.updateCamera(dt, focus, spread, null);
    UI.updateBubbles(A.camera);

    if (G.phase !== 'demo' && G.phase !== 'boot') UI.updateHUD(G);
    histT -= dt;
    if (histT <= 0) { histT = 0.5; G.fighters.forEach((f, i) => { hist[i].push(f.hp / f.maxHp * 100); if (hist[i].length > 120) hist[i].shift(); }); }
    monT -= dt;
    if (monT <= 0) {
      monT = 0.25;
      A.drawMonitor({ run: 42, episode: G.episode, hz: 50, maxLen: 120, log, series: G.fighters.map((f, i) => ({ color: '#' + f.cw.eye.toString(16).padStart(6, '0'), data: hist[i] })) });
    }
    A.render();
  }

  function start() {
    // Only offer maps whose scripts actually loaded.
    MD.MAP_KEYS = MD.MAP_KEYS.filter(k => MD.MAPS[k]);
    A.init(document.getElementById('stage'));
    UI.onLog = t => { log.push(t); if (log.length > 30) log.shift(); };
    UI.onMapPreview = (k) => {
      if (G.phase !== 'demo') return;
      clearAll(); A.loadMap(k === 'random' ? MD.MAP_KEYS[Math.floor(Math.random() * MD.MAP_KEYS.length)] : k);
      G.fighters.forEach(f => G.resetFighter(f)); A.mapRound(G);
    };
    UI.onPreview = () => {
      if (G.phase !== 'demo') return;
      G.fighters.forEach((f, i) => {
        const k = i ? UI.opts.p2 : UI.opts.p1;
        if (f.cwKey !== k) { MD.setDuckColorway(f.d, k); f.cwKey = k; f.cw = MD.COLORWAYS[k]; f.state = 'flip'; f.stateT = 0; f.actionDur = 0.82; f.vy = 7.6; f.onGround = false; }
      });
    };
    UI.init({
      start: startMatch,
      quit: startDemo,
      speed: () => {
        if (!G.watch) return;
        G.watchSpeed = G.watchSpeed === 1 ? 2 : 1;
        UI.renderControls(G);
        UI.feed(G.watchSpeed === 2 ? 'Double speed. The servo loop is pretending to run at 100 Hz.' : 'Back to normal speed.');
      },
      inMatch: () => ['intro', 'fight', 'roundEnd'].includes(G.phase),
      press: (i, a) => { if (!paused && G.phase === 'fight') G.press(i, a); },
      pause: (v) => {
        if (!['intro', 'fight', 'roundEnd'].includes(G.phase)) return;
        paused = v === undefined ? !paused : v;
        UI.screen(paused ? 'pause' : null);
        MD.Music.duck(paused ? 0.3 : 1);
      },
    });
    if (REC) { startRecording(); return; }
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.phase === 'fight' && !paused) { paused = true; UI.screen('pause'); } });
    startDemo();
    requestAnimationFrame(t => { last = t; frame(t); });
  }

  function startRecording() {
    const num = (k, d) => (QS.get(k) == null ? d : Number(QS.get(k)));
    Object.assign(UI.opts, {
      mode: 'watch', bet: 'none', hats: QS.get('hats') || 'off', map: MD.MAPS[QS.get('map')] ? QS.get('map') : 'random',
      p1: MD.COLORWAYS[QS.get('p1')] ? QS.get('p1') : 'graphite', p2: MD.COLORWAYS[QS.get('p2')] ? QS.get('p2') : 'lavender',
      level: num('l1', 1), level2: num('l2', 1), best: num('best', 3),
    });
    const fps = num('fps', 30), tail = num('tail', 4), maxSec = num('max', 480);
    if (QS.get('musiconly')) return startMusicOnly(QS.get('musiconly'), fps, maxSec, num('hype', 0));
    const audio = QS.get('audio') === '1' ? offlineAudio(maxSec + 2, fps) : null;
    // music=0: sound effects only. The song still plays silently, so the seeded randomness (and the fight) stays the same.
    if (audio && QS.get('music') === '0' && MD.Music.on) MD.Music.toggle();
    let frames = 0, endSec = 0;

    // Highlight log: timestamped moments (in video seconds) with a rough "how fun is this" score,
    // so an editor can find the KOs, ring outs, dance breaks and flying hats without watching everything.
    const events = [];
    const mark = (type, score, o) => events.push(Object.assign({ t: +(frames / fps).toFixed(2), type, score }, o));
    const name = f => (f && f.cw ? f.cw.name : undefined);
    const after = (obj, k, fn) => { const orig = obj[k]; obj[k] = function (...a) { const r = orig.apply(this, a); fn(...a); return r; }; };
    const SAY = { sock: 4, ball: 3, stomp: 3, flipHit: 3, rug: 3, sleep: 3, butter: 2.5, dash: 2, laser: 2, skates: 2, coin: 2, hb: 1.5, wake: 1, battery: 1, lowbatt: 1 };
    after(G, 'say', (key, a, b) => { if (SAY[key]) mark(key, SAY[key], { who: name(a), vs: name(b) }); });
    after(G, 'sayRaw', text => mark('feed', 2, { text }));
    after(G, 'startDance', () => { if (G.danceT > 2.5) mark('dance', 5); });
    after(UI, 'banner', h => mark('event', 2.5, { text: h }));
    after(UI, 'big', (text, sub) => mark(/^Round/.test(text) ? 'roundStart' : text === 'Fight!' ? 'fight' : 'roundEnd', 0, { text, sub: sub || undefined }));
    after(UI, 'bubble', (f, text) => mark('bubble', 0.5, { who: name(f), text }));

    // Showcase (?events=socks,coin,...&every=6): random events come in this order, cycling, every ~N seconds,
    // so a short recording can show every falling item and stunt.
    G.eventEvery = num('every', 0) || null;
    const forced = (QS.get('events') || '').split(',').filter(k => I.EVENTS[k]);
    if (forced.length) {
      let fi = 0;
      I.randomEvent = function (G) {
        for (let k = 0; k < forced.length; k++) {
          const key = forced[fi++ % forced.length], e = I.EVENTS[key];
          if ((e.can && !e.can(G)) || (key === 'laser' && I.laser.active)) continue;
          I.lastEvent = key; UI.banner(e.h, e.p); MD.Audio.boot(); e.go(G);
          return;
        }
      };
    }
    after(I, 'randomEvent', () => { for (let k = events.length - 1; k >= 0; k--) if (events[k].type === 'event') { events[k].key = I.lastEvent; break; } });
    const prev = [];
    function poll() {
      G.fighters.forEach((f, i) => {
        const p = prev[i] || (prev[i] = { state: f.state, hp: f.hp, flips: f.stats.flips, hats: f.stats.hats });
        if (f.state !== p.state) {
          if (f.state === 'down') mark('knockdown', 3, { who: name(f) });
          else if (f.state === 'ko') mark('ko', 5, { who: name(f) });
          else if (f.state === 'fall') mark('ringout', 5, { who: name(f) });
        }
        const dmg = p.hp - f.hp;
        if (dmg >= 10) mark('bigHit', +(2 + Math.min(2, (dmg - 10) / 10)).toFixed(1), { who: name(f), dmg: Math.round(dmg) });
        if (f.stats.flips > p.flips) mark('flip', 1.5, { who: name(f) });
        if (f.stats.hats > p.hats) mark('hat', 3, { who: name(f) });
        Object.assign(p, { state: f.state, hp: f.hp, flips: f.stats.flips, hats: f.stats.hats });
      });
    }

    startMatch();
    window.MDREC = {
      fps,
      async step(n) {
        for (let i = 0; i < (n || 1); i++) {
          if (audio) await audio.renderTo((frames + 1) / fps);
          recAdvance(1000 / fps); advance(1 / fps); poll(); frames++;
          if (G.phase === 'matchEnd') endSec += 1 / fps;
        }
        return this.done;
      },
      get done() { return (G.phase === 'matchEnd' && endSec >= tail) || frames >= fps * maxSec; },
      info() {
        return {
          map: A.map.name, p1: G.fighters[0].cw.name, p2: G.fighters[1].cw.name,
          levels: G.fighters.map(f => ['Episode 0', 'Pretrained', 'Overfit'][f.level]),
          hats: G.fighters.map(f => f.hatKey || null),
          winner: winner ? winner.cw.name : null, wins: G.fighters.map(f => f.wins), rounds: G.round,
          seconds: +(frames / fps).toFixed(2), stats: G.fighters.map(f => f.stats), events,
        };
      },
      // Renders the match audio and keeps it as 16-bit stereo PCM; returns its size in bytes.
      async renderAudio() { return audio ? audio.render(frames) : 0; },
      audioChunk(from, len) { return audio ? audio.chunk(from, len) : ''; },
      get sampleRate() { return audio ? audio.sampleRate : 0; },
    };
  }

  // Music only (?musiconly=fight&max=140): one of the songs on its own, e.g. a bed for a montage.
  // hype: seconds until the busier fight hats come in.
  function startMusicOnly(song, fps, maxSec, hype) {
    const audio = offlineAudio(maxSec + 2, fps);
    MD.Audio.setLevel(1); MD.Music.setMode(song); MD.Music.duck(1);
    let frames = 0;
    window.MDREC = {
      fps,
      async step(n) {
        for (let i = 0; i < (n || 1); i++) {
          await audio.renderTo((frames + 1) / fps);
          recAdvance(1000 / fps); frames++;
          if (hype && frames / fps >= hype) MD.Music.setIntensity(1);
        }
        return this.done;
      },
      get done() { return frames >= fps * maxSec; },
      async renderAudio() { return audio.render(frames); },
      audioChunk(from, len) { return audio.chunk(from, len); },
      get sampleRate() { return audio.sampleRate; },
    };
  }

  // Offline audio (?audio=1): the game's synthesized sound goes into an OfflineAudioContext that renders
  // in lockstep with the recording (suspended at every frame), so each quack and music step lands on the
  // exact video frame it belongs to, and finished sound nodes are freed as the match goes on.
  function offlineAudio(seconds, fps) {
    const SR = 44100, Q = 128;
    let ctx = null, pcm = null, rendering = null, until = 0;
    window.AudioContext = function () {
      ctx = new OfflineAudioContext(2, Math.ceil(SR * seconds), SR);
      Object.defineProperty(ctx, 'state', { get: () => 'running' });
      return ctx;
    };
    MD.Audio.init();
    return {
      sampleRate: SR,
      // Render up to `sec` (rounded up to the 128-sample render quantum) and pause there.
      async renderTo(sec) {
        const at = Math.ceil(sec * SR / Q) * Q / SR;
        if (at <= until || at * SR >= ctx.length) return;
        until = at;
        const paused = ctx.suspend(at);
        if (rendering) ctx.resume(); else rendering = ctx.startRendering();
        await paused;
      },
      async render(frames) {
        if (!rendering) rendering = ctx.startRendering(); else ctx.resume();
        const buf = await rendering;
        // Frame 0 is captured after the first 1/fps step, so the video starts one frame into the audio.
        const a = Math.round(SR / fps), n = Math.max(0, Math.min(buf.length - a, Math.round(frames / fps * SR)));
        const L = buf.getChannelData(0), R = buf.getChannelData(1), out = new Int16Array(n * 2);
        for (let i = 0; i < n; i++) {
          out[2 * i] = Math.max(-1, Math.min(1, L[a + i])) * 32767;
          out[2 * i + 1] = Math.max(-1, Math.min(1, R[a + i])) * 32767;
        }
        pcm = new Uint8Array(out.buffer);
        return pcm.byteLength;
      },
      chunk(from, len) {
        return new Promise(res => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).slice(String(r.result).indexOf(',') + 1));
          r.readAsDataURL(new Blob([pcm.subarray(from, from + len)]));
        });
      },
    };
  }
  window.claude && window.claude.hot && window.claude.hot.ready ? window.claude.hot.ready(start) : start();
})();
