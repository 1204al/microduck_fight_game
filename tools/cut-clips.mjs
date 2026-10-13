// Cuts short clips out of recorded fights using the highlight log each recording writes next to its video.
//
//   node tools/cut-clips.mjs [--in footage,footage/showcase] [--out footage/clips] [--par 6] [--dry]
//
// Every falling item / random event, ring out, KO, sock to the face and arena hazard becomes its own
// file, sorted into folders by kind (clips/events/laundry-day/, clips/ringouts/, clips/hazards/lego/ ...),
// plus clips/index.json listing every clip with its source and timing for the montage step.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const INS = opt('in', 'footage,footage/showcase').split(',').map(d => path.resolve(ROOT, d));
const OUT = path.resolve(ROOT, opt('out', 'footage/clips'));
const PAR = Number(opt('par', 6));

const slug = s => s.toLowerCase().replace(/\$/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Arena hazards and drops only show up as commentary lines; these patterns name them.
const HAZARDS = [
  [/LEGO/, 'lego'], [/lab cat|booped/, 'cat-swat'], [/package|pre-order/, 'package'],
  [/vacuum bumps/, 'vacuum-bump'], [/vacuum ate/, 'vacuum-eats'], [/vacuum fell/, 'vacuum-falls'],
  [/RC car/, 'rc-car'], [/frog/, 'frog'], [/penguin/, 'penguin'], [/knight/i, 'knight'], [/soap/, 'soap'],
  [/stove|burner/i, 'stove'], [/Toast is up/, 'toast'], [/pizza|energy drink drops/, 'hackathon-drop'],
  [/wasabi/i, 'wasabi'], [/gift drops/, 'gift'], [/lump of coal|cookies/, 'gift-opened'],
  [/rubber duck\. The bug/, 'rubber-duck'], [/QUACK on the keyboard/, 'keyboard-quack'], [/snowball/, 'snowball'],
  [/energy drink\. Servo/, 'energy-drink'], [/stop to sing/, 'dance'],
];
// Window around each moment, in seconds before and after it.
const KINDS = {
  event: { dir: e => path.join('events', slug(e.text)), pre: 1.0, post: 7.0 },
  ringout: { dir: () => 'ringouts', pre: 2.5, post: 3.5 },
  ko: { dir: () => 'kos', pre: 2.5, post: 4.0 },
  sock: { dir: () => 'socks', pre: 2.0, post: 2.5 },
  feed: { dir: e => { const h = HAZARDS.find(([re]) => re.test(e.text)); return h && path.join('hazards', h[1]); }, pre: 2.0, post: 3.0 },
};

function run(cmd, a) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', d => { err += d; });
    p.on('close', c => (c === 0 ? res() : rej(new Error(`${cmd} exit ${c}: ${err.slice(-400)}`))));
  });
}
const mmss = t => `${Math.floor(t / 60)}m${String(Math.floor(t % 60)).padStart(2, '0')}s`;

const clips = [];
for (const dir of INS) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => /^fight_.*\.json$/.test(f)).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const src = path.join(dir, f.replace(/\.json$/, '.mp4'));
    if (!fs.existsSync(src)) continue;
    const lastEnd = {};
    for (const e of d.events) {
      const k = KINDS[e.type]; if (!k) continue;
      const sub = k.dir(e); if (!sub) continue;
      const start = Math.max(0, e.t - k.pre), end = Math.min(d.seconds, e.t + k.post);
      // Two moments of the same kind close together become one clip.
      if (lastEnd[sub] != null && start < lastEnd[sub] - 1) continue;
      lastEnd[sub] = end;
      const name = `${slug(d.map)}_f${String(d.n).padStart(2, '0')}_${mmss(e.t)}.mp4`;
      clips.push({
        file: path.relative(ROOT, path.join(OUT, sub, name)), kind: sub.split(path.sep)[0], tag: sub.split(path.sep)[1] || sub,
        src: path.relative(ROOT, src), map: d.map, fight: d.n, t: e.t, start: +start.toFixed(2), end: +end.toFixed(2),
        text: e.text || undefined, who: e.who || undefined,
      });
    }
  }
}

const by = {}; clips.forEach(c => { const k = c.kind === 'events' || c.kind === 'hazards' ? `${c.kind}/${c.tag}` : c.kind; by[k] = (by[k] || 0) + 1; });
const summary = () => Object.entries(by).sort().forEach(([k, n]) => console.log(`  ${String(n).padStart(3)}  ${k}`));
if (args.includes('--dry')) { summary(); console.log(`${clips.length} clips planned (dry run, nothing cut)`); process.exit(0); }
console.log(`Cutting ${clips.length} clips into ${path.relative(ROOT, OUT)}/ (${PAR} at a time)`);
const queue = clips.slice(); let done = 0;
async function worker() {
  while (queue.length) {
    const c = queue.shift(), out = path.join(ROOT, c.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (!fs.existsSync(out)) {
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(c.start), '-i', path.join(ROOT, c.src), '-t', (c.end - c.start).toFixed(2),
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]);
    }
    if (++done % 25 === 0) console.log(`  ${done}/${clips.length}`);
  }
}
await Promise.all(Array.from({ length: PAR }, worker));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(clips, null, 1));
summary();
console.log('All done.');
