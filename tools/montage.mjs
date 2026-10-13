// Cuts a beat-synced highlight montage out of the recorded fights: full-screen shots, 2x2 and 3x3 grids that
// switch on the bars of the game's own fight song, with each fight's sound effects mixed on top.
//
//   node tools/montage.mjs [--plan] [--out footage/montage]
//
//   --plan only picks the moments: writes plan.json and a storyboard.jpg (one frame per cell) to check first.
//   --stills renders one composited frame per segment (overlays and all) into stills.jpg instead of the video.
//   --preview <fight.json> mocks a few layouts from one recording into preview.jpg, to check a new look quickly.
//
// Needs the fights from record-fights.mjs (footage/ and footage/showcase/, video + highlight log), their sound
// effects without music (footage/sfx/<name>.sfx.wav, from --redo --audio-only --music off) and the music bed
// (footage/audio/fight.wav, from --music-only fight). Overlays (frames, labels, captions) are HTML rendered to
// transparent PNGs in headless Chrome, so they use the game's fonts; ffmpeg does the rest.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const OUT = path.resolve(ROOT, opt('out', 'footage/montage'));
const PLAN_ONLY = args.includes('--plan');
const STILLS = args.includes('--stills');
const PREVIEW = opt('preview', null);
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const BPM = 128, BEAT = 60 / BPM, BAR = 4 * BEAT, FPS = 30, W = 1920, H = 1080;
const MUSIC = path.join(ROOT, 'footage/audio/fight.wav');
const MUSIC_START = 0.08 - 1 / FPS; // first downbeat in the rendered song (setMode schedules it 80 ms in; the render skips one frame)

// ---------- Fights and their moments ----------
const EVENT_KEY = {
  'Laser pointer detected': 'laser', 'Laundry day': 'socks', 'Optional wheels': 'skates', '$MICRODUCK is pumping': 'coin',
  'What is my purpose?': 'butter', 'Spare battery': 'battery', 'Football mode': 'ball', 'Firmware update': 'update',
  'Delivery day': 'delivery', 'Night shift': 'vacuum', 'Cat detected': 'cat', 'Sim2Real gap': 'moon', 'Running in Firefox': 'firefox',
  'AZERTY mode': 'azerty', 'Mandatory dance break': 'dance', 'Rubber duck debugging': 'rubber', 'Airlock opening': 'airlock',
};
const HAZARD = [
  [/LEGO/, 'lego'], [/lab cat|booped/, 'catswat'], [/package|pre-order/, 'package'], [/vacuum fell/, 'vacuumfall'],
  [/vacuum bumps/, 'vacuumbump'], [/RC car/, 'rccar'], [/frog/, 'frog'], [/penguin/, 'penguin'], [/knight/i, 'knight'],
  [/soap/, 'soap'], [/stove|burner/i, 'stove'], [/Toast is up/, 'toast'], [/gift drops/, 'gift'], [/lump of coal|cookies/, 'giftopen'],
  [/wasabi/i, 'wasabi'], [/QUACK on the keyboard/, 'keyquack'], [/pizza|energy drink drops/, 'pizza'],
];
function loadFights() {
  const fights = [];
  for (const dir of ['footage', 'footage/showcase']) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter(f => /^fight_\d+_[a-z]+_.*\.json$/.test(f)).sort()) {
      const d = JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8'));
      const base = f.replace(/\.json$/, ''), video = path.join(abs, base + '.mp4');
      if (!fs.existsSync(video)) continue;
      const sfx = path.join(ROOT, 'footage/sfx', base + '.sfx.wav');
      const ev = d.events.map(e => {
        let tag = e.type;
        if (e.type === 'event') tag = e.key || EVENT_KEY[e.text] || 'event';
        else if (e.type === 'feed') { const h = HAZARD.find(([re]) => re.test(e.text)); tag = h ? h[1] : 'feed'; }
        else if (e.type === 'roundEnd' && /wins the match/.test(e.sub || '')) tag = 'matchEnd';
        return { ...e, tag };
      });
      fights.push({ ...d, base, video, sfx: fs.existsSync(sfx) ? sfx : null, events: ev });
    }
  }
  return fights;
}
const fights = loadFights();
const momentsOf = tag => fights.flatMap(f => f.events.filter(e => e.tag === tag).map(e => ({ f, t: e.t, e })));
// How much happens in [a, b] of a fight: the montage prefers busy windows.
const busy = (f, a, b) => f.events.reduce((s, e) => s + (e.t >= a && e.t <= b ? e.score : 0), 0);

// Footage already on screen, so no moment is shown twice.
const used = new Map();
const free = (f, a, b) => !(used.get(f.base) || []).some(([x, y]) => a < y - 0.3 && b > x + 0.3);
const take = (f, a, b) => { if (!used.has(f.base)) used.set(f.base, []); used.get(f.base).push([a, b]); recent.push(f.map); };
const recent = []; // arenas of the last few picks, so back-to-back shots change scenery

// Picks n moments with the given tags. Each cell starts `lead` seconds before its moment (a number, or a
// function of the cell index to stagger moments onto beats) and runs for the segment. Prefers different
// arenas and busy windows.
function pick(tags, n, dur, lead, opts = {}) {
  const leadOf = i => (typeof lead === 'function' ? lead(i) : lead);
  const cands = [].concat(...[].concat(tags).map(momentsOf));
  const out = [], maps = new Set();
  for (let i = 0; i < n; i++) {
    const L = leadOf(i);
    const ok = cands.filter(c => {
      const a = c.t - L, b = a + dur;
      return a >= 0.2 && b <= c.f.seconds + 0.5 && free(c.f, a, b) && !out.some(o => o.f === c.f && Math.abs(o.t - c.t) < dur);
    });
    if (!ok.length) break;
    // Windows that open on a "Round N / Fight!" intro are less interesting.
    const intro = c => c.f.events.some(e => e.type === 'roundStart' && e.t > c.t - L - 1.7 && e.t < c.t - L + dur * 0.4);
    const rank = c => busy(c.f, c.t - L, c.t - L + dur) + (intro(c) ? -10 : 0) + (maps.has(c.f.map) ? -20 : 0) + (recent.slice(-3).includes(c.f.map) ? -8 : 0) + (opts.prefer ? opts.prefer(c) : 0);
    ok.sort((x, y) => rank(y) - rank(x) || x.f.n - y.f.n || x.t - y.t);
    const c = ok[0], a = c.t - L;
    out.push({ f: c.f, t: c.t, tag: c.e.tag, start: +a.toFixed(3), label: opts.label ? opts.label(c) : undefined });
    maps.add(c.f.map); take(c.f, a, a + dur);
  }
  if (out.length < n) console.warn(`  only found ${out.length}/${n} for ${[].concat(tags).join(',')}`);
  return out;
}

// ---------- The edit ----------
// Every segment is a whole number of bars; layout 1, 2 or 3 is cells per side. Captions are shown for the
// given bars at the start of the segment. Gains are each cell's sound-effect level.
const LABEL = {
  socks: 'Laundry day', coin: 'Meme coin', butter: 'Butter', skates: 'Skates', rubber: 'Rubber duck', battery: 'Battery',
  ball: 'Football', moon: 'Moon gravity', firefox: 'Firefox mode', azerty: 'AZERTY mode', update: 'Firmware update',
  cat: 'Lab cat', vacuum: 'Robot vacuum', delivery: 'Delivery day', laser: 'Laser pointer', airlock: 'Airlock',
  lego: 'LEGO', catswat: 'Cat swat', package: 'Package', stove: 'Hot stove', toast: 'Toast', soap: 'Soap', rccar: 'RC car',
  frog: 'Frog', penguin: 'Penguin', knight: 'Knight', gift: 'Gift', giftopen: 'Gift', wasabi: 'Wasabi', keyquack: 'QUACK',
  pizza: 'Pizza', vacuumfall: 'Vacuum', vacuumbump: 'Vacuum', hat: 'Hat off', stomp: 'Stomp', flipHit: 'Flip kick',
  knockdown: 'Down', bigHit: 'Big hit', sock: 'Sock!', dance: 'Dance break', ringout: 'Ring out', ko: 'K.O.',
};
const lab = c => LABEL[c.e.tag] || c.f.map;
const arena = c => c.f.map;
function buildPlan() {
  const S = [];
  const seg = (bars, layout, cells, more = {}) => S.push({ bars, layout, cells, ...more });
  const D = b => b * BAR;

  // 1. Cold open: the best K.O. with its slow-motion replay, title on top.
  seg(4, 1, pick('ko', 1, D(4), D(2.4)), { caption: { title: 'MICRODUCK FIGHT', sub: 'Robot ducks. No humans. CPU vs CPU.', big: true, from: 0, bars: 2.25 } });
  // 2. Stuff falls from the sky: one item per two bars, full screen, from the moment its banner pops.
  for (const [i, k] of ['socks', 'coin', 'butter', 'skates', 'rubber', 'battery'].entries())
    seg(2, 1, pick(k, 1, D(2), 0.35), i === 0 ? { caption: { title: 'Stuff falls from the sky', from: 0.25, bars: 1.5 } } : {});
  // 3. 2x2: the simulator glitches, then uninvited guests.
  seg(4, 2, pickEach(['moon', 'firefox', 'azerty', 'update'], D(4), 0.35), { caption: { title: 'The simulator has bugs', from: 0, bars: 1.5 }, flash: true });
  seg(4, 2, pickEach(['cat', 'vacuum', 'delivery', 'laser'], D(4), 0.35), { caption: { title: 'Uninvited guests', from: 0, bars: 1.5 }, flash: true });
  // 4. 3x3 ring-out wall: nine ducks fall off nine desks, one per beat.
  seg(4, 3, pick('ringout', 9, D(4), i => (2 + i) * BEAT, { label: arena }), { caption: { title: 'Ring out', from: 0, bars: 1 }, gain: 0.45, flash: true });
  // 5. 2x2: the arena fights back.
  seg(4, 2, pickEach(['lego', 'stove', 'toast', 'soap'], D(4), 1.5), { caption: { title: 'The arena fights back', from: 0, bars: 1.5 }, flash: true });
  seg(4, 2, pickEach(['rccar', 'airlock', 'gift', ['knight', 'penguin', 'frog', 'keyquack', 'catswat', 'package', 'wasabi', 'pizza', 'giftopen', 'vacuumbump']], D(4), 1.5), {});
  // 6. Jumps: the layout changes every two bars.
  seg(2, 1, pick('dance', 1, D(2), 0.3), { flash: true });
  seg(2, 2, pick('hat', 4, D(2), 1.0, { label: () => 'Hat off' }), { flash: true });
  seg(2, 1, pick('sock', 1, D(2), 1.6), { flash: true });
  seg(2, 3, pick(['bigHit', 'knockdown'], 9, D(2), i => 0.9 + (i % 3) * BEAT / 2, { label: arena }), { gain: 0.4, flash: true });
  seg(2, 1, pick(['vacuumfall', 'catswat', 'package'], 1, D(2), 1.6), { flash: true });
  seg(2, 2, pick(['stomp', 'flipHit'], 4, D(2), 1.0, { label: lab }), { flash: true });
  seg(2, 1, pick(['ball'], 1, D(2), 1.8), { flash: true });
  seg(2, 3, pick('ringout', 9, D(2), i => 1.2 + (i % 5) * BEAT / 2, { label: arena }), { gain: 0.4, flash: true });
  // 7. Finale: K.O.s in slow motion, then the winners' wall with the end card.
  for (let i = 0; i < 3; i++) seg(2, 1, pick('ko', 1, D(2), D(1.2)), { flash: i === 0 });
  seg(4, 1, pick('ko', 1, D(4), D(1.4)), {});
  seg(4, 3, pick('matchEnd', 9, D(4), -0.4, { label: c => c.f.winner + ' wins' }), { gain: 0.3, flash: true, end: true });
  return S;
}
// One moment of each tag (an inner array means "any of these").
function pickEach(tags, dur, lead) {
  return tags.map(t => pick(t, 1, dur, lead, { label: lab })[0]).filter(Boolean);
}

// ---------- Geometry ----------
function cellRects(n) {
  if (n === 1) return [{ x: 0, y: 0, w: W, h: H }];
  const m = n === 2 ? 36 : 28, g = n === 2 ? 24 : 16;
  const ch = Math.floor((H - 2 * m - (n - 1) * g) / n / 2) * 2, cw = Math.round(ch * 16 / 9 / 2) * 2;
  const x0 = Math.round((W - (n * cw + (n - 1) * g)) / 2), y0 = Math.round((H - (n * ch + (n - 1) * g)) / 2);
  const r = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) r.push({ x: x0 + i * (cw + g), y: y0 + j * (ch + g), w: cw, h: ch });
  return r;
}

// ---------- Overlays: HTML -> transparent PNG ----------
const FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chivo:wght@600;800&family=Lilita+One&display=swap">';
const CSS = `
:root { --ink: #1d1b22; --paper: #f3eee4; --duck: #f5c518; --orange: #f0631f; }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: transparent; }
.abs { position: absolute; box-sizing: border-box; }
.frame { border: 7px solid var(--ink); border-radius: 18px; box-shadow: 10px 10px 0 var(--ink); background: var(--ink); }
.bg { inset: 0; background: var(--duck); background-image: repeating-linear-gradient(-45deg, rgba(29,27,34,.06) 0 22px, transparent 22px 44px); }
.tag { font: 30px/1 "Lilita One", sans-serif; color: var(--ink); background: var(--paper); border: 4px solid var(--ink); border-radius: 12px; box-shadow: 4px 4px 0 var(--ink); padding: 6px 12px 8px; white-space: nowrap; }
.tag.s { font-size: 22px; padding: 4px 9px 6px; border-width: 3px; border-radius: 10px; box-shadow: 3px 3px 0 var(--ink); }
/* Captions sit in the lower third, clear of the ducks in the middle, the game's event banners in the HUD strip at
   the top, and the commentary feed in the bottom-left corner. */
.cap { left: 50%; bottom: 150px; transform: translateX(-50%) rotate(-2deg); background: var(--ink); color: var(--duck); border: 6px solid var(--paper);
  border-radius: 24px; box-shadow: 10px 10px 0 rgba(29,27,34,.45); padding: 14px 40px 20px; font: 84px/1 "Lilita One", sans-serif; white-space: nowrap; text-transform: uppercase; letter-spacing: 1px; }
.title { left: 0; right: 0; bottom: 130px; transform: rotate(-2deg); text-align: center; }
.title.center { bottom: auto; top: 50%; transform: translateY(-50%) rotate(-2deg); }
.title b { display: block; font: 160px/.9 "Lilita One", sans-serif; color: var(--duck); -webkit-text-stroke: 10px var(--ink); paint-order: stroke fill; text-shadow: 12px 12px 0 var(--ink); }
.title i { display: inline-block; margin-top: 22px; font: 800 40px/1 Chivo, sans-serif; font-style: normal; color: var(--ink); background: var(--paper); border: 5px solid var(--ink); border-radius: 16px; box-shadow: 7px 7px 0 var(--ink); padding: 10px 26px 14px; }
.dim { inset: 0; background: rgba(29,27,34,.55); }
`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const page = body => `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${CSS}</style></head><body>${body}</body></html>`;
function bgHtml(n) {
  return page(`<div class="abs bg"></div>` + cellRects(n).map(r => `<div class="abs frame" style="left:${r.x - 7}px;top:${r.y - 7}px;width:${r.w + 14}px;height:${r.h + 14}px"></div>`).join(''));
}
// Cell labels go bottom-right: the game's commentary feed has the bottom-left corner.
function labelsHtml(s) {
  const rects = cellRects(s.layout);
  return page(s.cells.map((c, i) => (c.label && s.layout > 1
    ? `<div class="abs tag${s.layout === 3 ? ' s' : ''}" style="right:${W - rects[i].x - rects[i].w + (s.layout === 3 ? 10 : 14)}px;bottom:${H - rects[i].y - rects[i].h + (s.layout === 3 ? 10 : 14)}px">${esc(c.label)}</div>` : '')).join(''));
}
function captionHtml(cap) {
  if (cap.end) return page(`<div class="abs dim"></div><div class="abs title center"><b>MICRODUCK FIGHT</b><i>${esc(cap.sub)}</i></div>`);
  if (cap.big) return page(`<div class="abs title"><b>${esc(cap.title)}</b><i>${esc(cap.sub)}</i></div>`);
  return page(`<div class="abs cap">${esc(cap.title)}</div>`);
}

async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  let id = 0; const pend = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
  return { send(method, params = {}, sessionId) { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pend.set(i, { res, rej })); }, close() { ws.close(); } };
}
async function pngRenderer() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'duckmontage-'));
  const port = 9800 + Math.floor(Math.random() * 150);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${W},${H}`, '--hide-scrollbars', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let ver = null;
  for (let t = 0; t < 100 && !ver; t++) { await new Promise(r => setTimeout(r, 150)); try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (e) {} }
  if (!ver) throw new Error('Chrome did not start');
  const client = await cdp(ver.webSocketDebuggerUrl);
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: sid } = await client.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p) => client.send(m, p, sid);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await send('Page.enable');
  return {
    async render(html, file) {
      const loaded = new Promise(r => { const h = setInterval(async () => { try { const v = (await send('Runtime.evaluate', { expression: `document.readyState === 'complete' && document.fonts.status === 'loaded' && document.fonts.check('40px "Lilita One"')`, returnByValue: true })).result.value; if (v) { clearInterval(h); r(); } } catch (e) {} }, 100); });
      await send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') });
      await Promise.race([loaded, new Promise(r => setTimeout(r, 8000))]);
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
    },
    async close() { client.close(); proc.kill(); await new Promise(r => setTimeout(r, 500)); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} },
  };
}

// ---------- Rendering ----------
const TO709 = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', TO709A = 'scale=out_color_matrix=bt709:out_range=tv,format=yuva420p';
const BT709 = ['-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];
function run(cmd, a) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', d => { err += d; });
    p.on('close', c => (c === 0 ? res(err) : rej(new Error(`${cmd} exit ${c}: ${err.slice(-800)}`))));
  });
}
async function pool(items, n, fn) { const q = items.slice(); await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); }

// Renders segment i to seg_NN.mp4, or with `still` (seconds into the segment) just that one frame to a JPEG.
async function renderSegment(s, i, dir, still) {
  const dur = s.frames / FPS, rects = cellRects(s.layout), inputs = [], f = [];
  const png = file => inputs.push(...(still == null ? ['-loop', '1', '-framerate', String(FPS), '-t', dur.toFixed(3)] : []), '-i', file);
  let base;
  if (s.layout > 1) { png(path.join(dir, `bg${s.layout}.png`)); base = `[0:v]${TO709}[b0]`; }
  const off = inputs.length ? 1 : 0;
  s.cells.forEach(c => inputs.push('-ss', (c.start + (still || 0)).toFixed(3), ...(still == null ? ['-t', (dur + 0.2).toFixed(3)] : []), '-i', c.f.video));
  const lab = inputs.filter(x => x === '-i').length; png(path.join(dir, `labels_${i}.png`));
  const cap = s.caption ? inputs.filter(x => x === '-i').length : -1;
  if (s.caption) png(path.join(dir, `caption_${i}.png`));
  let cur;
  if (base) { f.push(base); cur = 'b0'; }
  s.cells.forEach((c, k) => {
    const r = rects[k];
    // Sources carry their own colour tags (early recordings are full-range BT.601); the montage is standard BT.709.
    f.push(`[${off + k}:v]scale=${r.w}:${r.h}:force_original_aspect_ratio=increase:out_range=tv:out_color_matrix=bt709,crop=${r.w}:${r.h},setsar=1,setpts=PTS-STARTPTS[c${k}]`);
    if (!cur) { cur = `c${k}`; return; }
    f.push(`[${cur}][c${k}]overlay=${r.x}:${r.y}:eof_action=repeat[o${k}]`); cur = `o${k}`;
  });
  f.push(`[${lab}:v]format=rgba,${TO709A}[lab]`, `[${cur}][lab]overlay=0:0[l]`); cur = 'l';
  if (s.caption) {
    const a = s.caption.from * BAR, b = Math.min(dur - 0.05, a + s.caption.bars * BAR);
    const fade = still != null ? 'null' : s.caption.end ? `fade=t=in:st=${a.toFixed(3)}:d=0.4:alpha=1` : `fade=t=in:st=${a.toFixed(3)}:d=0.12:alpha=1,fade=t=out:st=${(b - 0.25).toFixed(3)}:d=0.25:alpha=1`;
    f.push(`[${cap}:v]format=rgba,${fade},${TO709A}[cap]`, `[${cur}][cap]overlay=0:0[cp]`); cur = 'cp';
  }
  if (s.flash && still == null) { f.push(`color=c=white:s=${W}x${H}:r=${FPS}:d=0.3,format=rgba,colorchannelmixer=aa=0.8,fade=t=out:st=0:d=0.3:alpha=1,${TO709A}[fl]`, `[${cur}][fl]overlay=0:0:eof_action=pass[fx]`); cur = 'fx'; }
  if (s.end && still == null) { f.push(`[${cur}]fade=t=out:st=${(dur - 0.6).toFixed(3)}:d=0.6[fo]`); cur = 'fo'; }
  f.push(`[${cur}]format=yuv420p[v]`);
  if (still != null) return run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', f.join(';'), '-map', '[v]', '-frames:v', '1', '-q:v', '3', path.join(dir, `still_${String(i).padStart(2, '0')}.jpg`)]);
  await run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', f.join(';'), '-map', '[v]', '-frames:v', String(s.frames), '-r', String(FPS), '-an',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', ...BT709, path.join(dir, `seg_${String(i).padStart(2, '0')}.mp4`)]);
}

// Music bed plus every cell's sound effects at its place on the timeline, loudness-normalized for social video.
async function renderAudio(segs, total, file) {
  const ins = ['-i', MUSIC], uses = new Map(), parts = [];
  for (const s of segs) for (const c of s.cells) {
    const src = c.f.sfx || c.f.video;
    if (!uses.has(src)) uses.set(src, []);
    uses.get(src).push({ start: c.start, dur: s.frames / FPS, at: s.at, gain: s.layout === 1 ? 1 : (s.gain || 0.6) });
  }
  const f = [`[0:a]atrim=start=${MUSIC_START.toFixed(4)},asetpts=PTS-STARTPTS,atrim=end=${total.toFixed(3)},volume=0.6,afade=t=out:st=${(total - 2 * BAR).toFixed(3)}:d=${(2 * BAR).toFixed(3)}[m]`];
  let k = 1;
  for (const [src, list] of uses) {
    ins.push('-i', src);
    const lbl = list.map((_, j) => `s${k}_${j}`);
    f.push(`[${k}:a]${list.length > 1 ? `asplit=${list.length}${lbl.map(l => `[${l}]`).join('')}` : `anull[${lbl[0]}]`}`);
    list.forEach((u, j) => {
      const ms = Math.round(u.at * 1000);
      f.push(`[${lbl[j]}]atrim=start=${u.start.toFixed(3)}:end=${(u.start + u.dur).toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(u.dur - 0.05).toFixed(3)}:d=0.05,volume=${u.gain},adelay=${ms}|${ms}[p${parts.length}]`);
      parts.push(`[p${parts.length}]`);
    });
    k++;
  }
  // Two-pass loudness normalization to -14 LUFS: measure first, then apply linearly.
  const mix = `[m]${parts.join('')}amix=inputs=${parts.length + 1}:normalize=0:duration=first,alimiter=limit=0.95`;
  const LN = 'I=-14:TP=-1.5:LRA=11';
  const err = await run('ffmpeg', ['-y', '-loglevel', 'info', '-hide_banner', ...ins, '-filter_complex', [...f, `${mix},loudnorm=${LN}:print_format=json[a]`].join(';'), '-map', '[a]', '-f', 'null', '-']);
  const m = JSON.parse(err.slice(err.lastIndexOf('{'), err.lastIndexOf('}') + 1));
  const second = `loudnorm=${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  await run('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', [...f, `${mix},${second},aresample=48000[a]`].join(';'), '-map', '[a]', '-c:a', 'pcm_s16le', file]);
}

async function storyboard(segs, dir) {
  const frames = [];
  for (const [i, s] of segs.entries()) for (const [k, c] of s.cells.entries()) {
    const file = path.join(dir, `sb_${String(i).padStart(2, '0')}_${k}.jpg`);
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', (Math.max(c.t, c.start) + 0.6).toFixed(2), '-i', c.f.video, '-frames:v', '1', '-vf', 'scale=320:180', file]);
    frames.push(file);
  }
  const cols = 10, list = path.join(dir, 'sb_list.txt');
  fs.writeFileSync(list, frames.map(f => `file '${f}'`).join('\n'));
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `tile=${cols}x${Math.ceil(frames.length / cols)}:padding=4:color=0x1d1b22`, '-frames:v', '1', path.join(OUT, 'storyboard.jpg')]);
  frames.forEach(f => fs.rmSync(f)); fs.rmSync(list);
}

async function renderOverlays(segs, dir) {
  console.log('Rendering overlays...');
  const r = await pngRenderer();
  try {
    await r.render(bgHtml(2), path.join(dir, 'bg2.png'));
    await r.render(bgHtml(3), path.join(dir, 'bg3.png'));
    for (const [i, s] of segs.entries()) {
      if (s.end) s.caption = { end: true, sub: `${fights.length} fights. 0 humans. Who wins next?`, from: 0.5, bars: 3.5 };
      await r.render(labelsHtml(s), path.join(dir, `labels_${i}.png`));
      if (s.caption) await r.render(captionHtml(s.caption), path.join(dir, `caption_${i}.png`));
    }
  } finally { await r.close(); }
}

// One frame per segment (mid-caption, or mid-segment), tiled into a contact sheet: a quick look at the edit.
async function stills(segs, dir, out) {
  const files = [];
  await pool(segs.map((s, i) => [s, i]), 6, async ([s, i]) => {
    const x = s.caption && !s.caption.end ? (s.caption.from + Math.min(s.caption.bars, 1)) * BAR * 0.6 : s.frames / FPS / 2;
    await renderSegment(s, i, dir, x);
  });
  segs.forEach((_, i) => files.push(path.join(dir, `still_${String(i).padStart(2, '0')}.jpg`)));
  const list = path.join(dir, 'stills.txt');
  fs.writeFileSync(list, files.map(f => `file '${f}'`).join('\n'));
  const cols = Math.min(3, segs.length);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=960:540,tile=${cols}x${Math.ceil(segs.length / cols)}:padding=8:color=0x1d1b22`, '-frames:v', '1', out]);
  console.log(`done ${path.relative(ROOT, out)}`);
}

// --preview <fight.json>: mock 1x1 / 2x2 / 3x3 frames with captions from a single recording, to check the look
// of new overlays or a new recording before re-rendering everything.
function previewPlan(file) {
  const d = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));
  const f = { ...d, video: path.resolve(ROOT, file).replace(/\.json$/, '.mp4') };
  const ev = d.events.filter(e => e.type === 'event').map(e => e.t);
  const at = k => Math.max(0, (ev[k % ev.length] || 2) - 0.2);
  const cell = (k, label) => ({ f, t: at(k), start: at(k), tag: 'event', label });
  const frames = Math.round(4 * BAR * FPS);
  return [
    { layout: 1, frames, cells: [cell(0)], caption: { title: 'MICRODUCK FIGHT', sub: 'Robot ducks. No humans. CPU vs CPU.', big: true, from: 0, bars: 2 } },
    { layout: 1, frames, cells: [cell(1)], caption: { title: 'Stuff falls from the sky', from: 0, bars: 1.5 } },
    { layout: 2, frames, cells: [0, 1, 2, 3].map(k => cell(k, ['Laundry day', 'Meme coin', 'Butter', 'Skates'][k])), caption: { title: 'The simulator has bugs', from: 0, bars: 1.5 } },
    { layout: 3, frames, cells: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => cell(k, d.map)), caption: { title: 'Ring out', from: 0, bars: 1 } },
  ];
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const dir = path.join(OUT, 'work'); fs.mkdirSync(dir, { recursive: true });
  if (PREVIEW) {
    const segs = previewPlan(PREVIEW);
    await renderOverlays(segs, dir);
    await stills(segs, dir, path.join(OUT, 'preview.jpg'));
    return;
  }
  const segs = buildPlan();
  // Cut points on the beat grid, rounded to whole frames without drift.
  let bars = 0;
  for (const s of segs) { const a = Math.round(bars * BAR * FPS); bars += s.bars; s.frames = Math.round(bars * BAR * FPS) - a; s.at = a / FPS; }
  const total = segs.reduce((n, s) => n + s.frames, 0) / FPS;
  const plan = segs.map(s => ({ at: +s.at.toFixed(3), bars: s.bars, layout: `${s.layout}x${s.layout}`, caption: s.caption && s.caption.title,
    cells: s.cells.map(c => ({ fight: c.f.n, map: c.f.map, tag: c.tag, t: c.t, start: c.start, label: c.label })) }));
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify(plan, null, 1));
  console.log(`${segs.length} segments, ${bars} bars, ${total.toFixed(1)} s`);
  segs.forEach(s => console.log(`  ${s.at.toFixed(2).padStart(6)}s  ${s.layout}x${s.layout}  ${s.bars} bars  ${s.caption ? '"' + s.caption.title + '" ' : ''}${s.cells.map(c => `${c.tag}#${c.f.n}@${c.t}`).join(' ')}`));
  const missing = fights.filter(f => !f.sfx).length;
  if (missing) console.warn(`  ${missing} fights have no sfx stem yet; their clips use the recording's own mix`);
  await storyboard(segs, dir);
  if (PLAN_ONLY) return;
  if (!fs.existsSync(MUSIC)) throw new Error('missing music bed ' + path.relative(ROOT, MUSIC));

  await renderOverlays(segs, dir);
  if (STILLS) { await stills(segs, dir, path.join(OUT, 'stills.jpg')); return; }

  console.log('Rendering segments...');
  let done = 0;
  await pool(segs.map((s, i) => [s, i]), 4, async ([s, i]) => { await renderSegment(s, i, dir); console.log(`  segment ${++done}/${segs.length}`); });
  console.log('Mixing audio...');
  await renderAudio(segs, total, path.join(dir, 'audio.wav'));
  const list = path.join(dir, 'segments.txt');
  fs.writeFileSync(list, segs.map((_, i) => `file 'seg_${String(i).padStart(2, '0')}.mp4'`).join('\n'));
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(dir, 'video.mp4')]);
  // X/Twitter: H.264 High, yuv420p, AAC, 1080p30, under 2:20 and 512 MB.
  const out = path.join(OUT, 'microduck-montage.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(dir, 'video.mp4'), '-i', path.join(dir, 'audio.wav'), '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '18', '-maxrate', '16M', '-bufsize', '32M', '-pix_fmt', 'yuv420p', ...BT709, '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  console.log(`done ${path.relative(ROOT, out)}  ${total.toFixed(1)} s`);
}
main().catch(e => { console.error(e); process.exit(1); });
