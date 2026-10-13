// Records CPU vs CPU Microduck fights to MP4, one file per match.
//
//   node tools/record-fights.mjs [count=20] [--out recordings] [--par 3] [--start 1] [--best 3] [--map <arena key>] [--size 1280x720]
//                                [--scale 1] [--hats off|random] [--seed 1009] [--max 480] [--no-audio]
//                                [--events socks,coin,... --every 6]
//   node tools/record-fights.mjs --redo footage --audio-only --music off [same --seed/--start/--events/--every/--hats/--max]
//   node tools/record-fights.mjs --music-only fight --seconds 140 [--hype 30] --out footage/audio
//   Without --map, fights rotate through all the arenas (or the list in --maps a,b,c).
//   --scale renders at a higher pixel density with the same layout: --size 1280x720 --scale 1.5 gives 1920x1080 video.
//   --events forces the random events into that order (rotated per fight so each one starts elsewhere),
//   one every ~N seconds with --every: a showcase where every falling item and stunt shows up.
//   Each fight also gets <name>.json with the match info and a timestamped highlight log (KOs, ring outs, hats...).
//   --redo replays the fights already in a folder (same seeds, so the same fights frame for frame) and with
//   --audio-only --music off writes just their sound effects as <name>.sfx.wav, for mixing under a music bed.
//   --music-only renders one of the game's songs on its own as <song>.wav (--hype: seconds until the busier hats).
//   e.g. node tools/record-fights.mjs 5 --start 21   records fights 21-25 and adds them to recordings/manifest.json
//
// Serves the game locally, drives headless Chrome over the DevTools protocol, steps the game
// exactly one frame at a time (?rec=1 mode), screenshots each frame and pipes it into ffmpeg.
// Sound is rendered offline in the page on the same clock (?audio=1) and muxed in afterwards.
// Because the game only advances when a frame is captured, videos are smooth at any capture speed.
// No npm packages needed: uses Node's built-in http, fetch and WebSocket, plus Chrome and ffmpeg.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const COUNT = Number(args.find(a => /^\d+$/.test(a)) || 20);
const OUT = path.resolve(ROOT, opt('out', 'recordings'));
const PAR = Number(opt('par', 3));
const START = Number(opt('start', 1));
const BEST = opt('best', null);
const MAP = opt('map', null);
const MAPS = (opt('maps', null) || 'lab,kitchen,disco,bath,playroom,pond,xmas,hackathon,space,ring,chess,ice,keyboard,sushi').split(',');
const [W, H] = opt('size', '1280x720').split('x').map(Number);
const SCALE = Number(opt('scale', 1));
const HATS = opt('hats', 'off');
const SEED = Number(opt('seed', 1009));
const MAX = Number(opt('max', 480));
const AUDIO = !args.includes('--no-audio');
const EVENTS = opt('events', '') ? opt('events', '').split(',') : [];
const EVERY = Number(opt('every', 0));
const REDO = opt('redo', null);
const AUDIO_ONLY = args.includes('--audio-only');
const MUSIC = opt('music', 'on') !== 'off';
const MUSIC_ONLY = opt('music-only', null);
const FPS = 30;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ---------- Jobs: vary colorways, CPU levels, match length and seed ----------
const CW = ['graphite', 'cream', 'lavender', 'sky'];
const PAIRS = [];
for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (a !== b) PAIRS.push([CW[a], CW[b]]);
const LEVELS = [[1, 1], [2, 1], [1, 2], [2, 2], [0, 2], [2, 0], [1, 0], [0, 1]];
function job(n) {
  const i = n - 1;
  const [p1, p2] = PAIRS[(i * 5) % PAIRS.length];
  const [l1, l2] = LEVELS[(i * 3) % LEVELS.length];
  const best = BEST ? Number(BEST) : 3;
  const map = MAP || MAPS[(n - START) % MAPS.length];
  const k = EVENTS.length ? (i * 3) % EVENTS.length : 0;
  const events = EVENTS.slice(k).concat(EVENTS.slice(0, k)).join(',');
  return { n, p1, p2, l1, l2, best, map, seed: SEED + i * 7919, ...(events ? { forced: events } : {}) };
}
// Rebuild the jobs behind recordings already in a folder; the arena comes from the file name.
function redoJobs(dir) {
  return fs.readdirSync(dir).filter(f => /^fight_\d+_[a-z]+_.*\.json$/.test(f)).sort().map(f => {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const j = { ...job(d.n), map: f.match(/^fight_\d+_([a-z]+)_/)[1], orig: d.events };
    for (const k of ['p1', 'p2', 'l1', 'l2', 'seed']) if (String(j[k]).toLowerCase() !== String(d[k]).toLowerCase()) throw new Error(`${f}: ${k} is ${d[k]} but these options give ${j[k]}; pass the same --seed/--start as the original run`);
    return j;
  });
}

// ---------- Static server: the page gets the same skeleton the artifact host adds ----------
function serve() {
  const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>[hidden]{display:none!important}</style></head><body>\n'
    + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + '\n</body></html>';
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/' || u.pathname === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page); }
    const f = path.join(ROOT, path.normalize(u.pathname).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(path.join(ROOT, 'js'))) { res.writeHead(404); return res.end(); }
    fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(data); });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

// ---------- Minimal DevTools protocol client ----------
async function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });
  let id = 0; const pend = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  });
  return {
    send(method, params = {}, sessionId) {
      const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId }));
      return new Promise((res, rej) => pend.set(i, { res, rej }));
    },
    close() { ws.close(); },
  };
}

async function launchChrome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'duckrec-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${W},${H}`, `--force-device-scale-factor=${SCALE}`,
    '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--enable-gpu', '--ignore-gpu-blocklist', 'about:blank',
  ], { stdio: 'ignore' });
  let ver = null;
  for (let t = 0; t < 100 && !ver; t++) {
    await new Promise(r => setTimeout(r, 150));
    try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (e) {}
  }
  if (!ver) throw new Error('Chrome did not start');
  return { proc, client: await cdp(ver.webSocketDebuggerUrl), dir };
}

function fmtTime(s) { const m = Math.floor(s / 60); return `${m}:${String(Math.round(s % 60)).padStart(2, '0')}`; }

async function record(client, base, j) {
  const name = `fight_${String(j.n).padStart(2, '0')}_${j.map}_${j.p1}-vs-${j.p2}`;
  const file = path.join(OUT, name + '.mp4'), silent = AUDIO ? path.join(OUT, name + '.video.mp4') : file;
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: sid } = await client.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p) => client.send(m, p, sid);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: SCALE, mobile: false });
  await send('Page.enable');
  const url = `${base}/?rec=1&p1=${j.p1}&p2=${j.p2}&l1=${j.l1}&l2=${j.l2}&best=${j.best}&map=${j.map}&seed=${j.seed}&fps=${FPS}&hats=${HATS}&max=${MAX}${AUDIO ? '&audio=1' : ''}${j.forced ? '&events=' + j.forced : ''}${EVERY ? '&every=' + EVERY : ''}${MUSIC ? '' : '&music=0'}`;
  await send('Page.navigate', { url });
  const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  for (let t = 0; t < 200; t++) {
    if (await evalv(`!!window.MDREC && document.fonts.status === 'loaded'`)) break;
    await new Promise(r => setTimeout(r, 100));
  }
  if (!(await evalv('!!window.MDREC'))) throw new Error('game did not enter recording mode');
  await evalv('document.fonts.ready.then(() => true)');

  if (AUDIO_ONLY) return recordAudioOnly(evalv, send, client, targetId, j, name);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', silent], { stdio: ['pipe', 'ignore', 'inherit'] });
  const ffDone = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  const t0 = Date.now();
  let frames = 0, done = false;
  while (!done) {
    done = await evalv('MDREC.step()');
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92, captureBeyondViewport: false, optimizeForSpeed: true });
    if (!ff.stdin.write(Buffer.from(data, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    frames++;
    if (frames % (FPS * 15) === 0) process.stdout.write(`  ${name}: ${fmtTime(frames / FPS)} recorded (${((frames / FPS) / ((Date.now() - t0) / 1000)).toFixed(2)}x real time)\n`);
  }
  ff.stdin.end();
  await ffDone;
  if (AUDIO) await muxAudio(evalv, silent, file, name);
  const { events, ...info } = await evalv('MDREC.info()');
  await client.send('Target.closeTarget', { targetId });
  const r = { file: path.relative(ROOT, file), ...j, ...info, frames, fps: FPS, size: `${Math.round(W * SCALE)}x${Math.round(H * SCALE)}`, audio: AUDIO, captureSeconds: Math.round((Date.now() - t0) / 1000) };
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify({ ...r, events }, null, 1));
  return { ...r, events: path.relative(ROOT, path.join(OUT, name + '.json')), highlights: events.filter(e => e.score >= 3).length };
}

// Pull the offline-rendered PCM out of the page in 1 MB chunks (bigger DevTools messages stall).
// With wav set, writes a WAV header first so the file plays on its own.
async function pullAudio(evalv, file, wav) {
  const bytes = await evalv('MDREC.renderAudio()');
  const sr = await evalv('MDREC.sampleRate');
  const fd = fs.openSync(file, 'w');
  if (wav) {
    const h = Buffer.alloc(44);
    h.write('RIFF', 0); h.writeUInt32LE(36 + bytes, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
    h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(bytes, 40);
    fs.writeSync(fd, h);
  }
  const CH = 1 << 20;
  for (let at = 0; at < bytes; at += CH) fs.writeSync(fd, Buffer.from(await evalv(`MDREC.audioChunk(${at}, ${CH})`), 'base64'));
  fs.closeSync(fd);
  return sr;
}

// Steps the match without screenshots (much faster) and keeps only the sound. On a --redo it checks the
// replay hit the same moments at the same times as the original recording.
async function recordAudioOnly(evalv, send, client, targetId, j, name) {
  const t0 = Date.now();
  while (!(await evalv('MDREC.step(30)')));
  const file = path.join(OUT, `${name}.${MUSIC ? 'audio' : 'sfx'}.wav`);
  await pullAudio(evalv, file, true);
  const info = await evalv('MDREC.info()');
  await client.send('Target.closeTarget', { targetId });
  let same = null;
  if (j.orig) {
    const key = e => `${e.type}@${e.t}`;
    same = j.orig.length === info.events.length && j.orig.every((e, i) => key(e) === key(info.events[i]));
    if (!same) { console.error(`  WARNING ${name}: replay diverged from the original recording`); fs.writeFileSync(path.join(OUT, name + '.replay.json'), JSON.stringify(info.events, null, 1)); }
  }
  return { file: path.relative(ROOT, file), n: j.n, map: info.map, seconds: info.seconds, matchesVideo: same, captureSeconds: Math.round((Date.now() - t0) / 1000) };
}

// Renders one of the game's songs on its own (no fight), e.g. a music bed for a montage.
async function recordMusic(client, base, song, seconds) {
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: sid } = await client.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (m, p) => client.send(m, p, sid);
  await send('Page.enable');
  await send('Page.navigate', { url: `${base}/?rec=1&audio=1&musiconly=${song}&max=${seconds}&hype=${opt('hype', 0)}&fps=${FPS}` });
  const evalv = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  for (let t = 0; t < 200 && !(await evalv('!!window.MDREC')); t++) await new Promise(r => setTimeout(r, 100));
  while (!(await evalv('MDREC.step(30)')));
  const file = path.join(OUT, `${song}.wav`);
  await pullAudio(evalv, file, true);
  await client.send('Target.closeTarget', { targetId });
  return file;
}

// Mux the offline-rendered sound with the silent video.
async function muxAudio(evalv, silent, file, name) {
  const raw = path.join(OUT, name + '.pcm');
  const sr = await pullAudio(evalv, raw, false);
  await new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-f', 's16le', '-ar', String(sr), '-ac', '2', '-i', raw,
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file], { stdio: ['ignore', 'ignore', 'inherit'] });
    p.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg mux exit ' + c))));
  });
  fs.rmSync(raw); fs.rmSync(silent);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const { proc, client, dir } = await launchChrome();
  if (MUSIC_ONLY) {
    const file = await recordMusic(client, base, MUSIC_ONLY, Number(opt('seconds', 140)));
    console.log(`done ${path.relative(ROOT, file)}`);
    client.close(); server.close(); proc.kill();
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    return;
  }
  const manifestPath = path.join(OUT, AUDIO_ONLY ? 'audio-manifest.json' : 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
  const queue = REDO ? redoJobs(path.resolve(ROOT, REDO)) : Array.from({ length: COUNT }, (_, k) => job(START + k));
  console.log(`Recording ${queue.length} fights to ${path.relative(ROOT, OUT)}/ at ${Math.round(W * SCALE)}x${Math.round(H * SCALE)}, ${FPS} fps, ${PAR} at a time${AUDIO ? ', with sound' : ''}`);
  const worker = async () => {
    while (queue.length) {
      const j = queue.shift();
      try {
        const r = await record(client, base, j);
        const i = manifest.findIndex(m => m.n === r.n); if (i >= 0) manifest.splice(i, 1);
        manifest.push(r); manifest.sort((a, b) => a.n - b.n);
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        if (AUDIO_ONLY) console.log(`done ${r.file}  ${fmtTime(r.seconds)}  [${r.map}]${r.matchesVideo === false ? '  DIVERGED' : r.matchesVideo ? '  matches video' : ''}`);
        else console.log(`done ${r.file}  ${fmtTime(r.seconds)}  [${r.map}]  ${r.p1} (${r.levels[0]}) vs ${r.p2} (${r.levels[1]})  winner: ${r.winner} ${r.wins.join('-')}  highlights: ${r.highlights}`);
      } catch (e) { console.error(`FAILED fight ${j.n}: ${e.message}`); }
    }
  };
  await Promise.all(Array.from({ length: PAR }, worker));
  client.close(); server.close();
  await new Promise(r => { proc.once('exit', r); proc.kill(); setTimeout(r, 3000); });
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  console.log('All done.');
}
main().catch(e => { console.error(e); process.exit(1); });
