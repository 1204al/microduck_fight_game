// Renders the menu images from the real game models:
//   img/items/<key>.png  field-guide icons (transparent, 192 px)
//   img/maps/<key>.jpg   arena thumbnails (480 x 270)
//
//   node tools/render-assets.mjs            both
//   node tools/render-assets.mjs icons      icons only
//   node tools/render-assets.mjs maps       thumbnails only (or: maps ring,chess for just those)
//
// Uses headless Chrome and ffmpeg, like tools/record-fights.mjs. No npm packages needed.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const what = process.argv[2] || 'all';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const ICONS = ['sock', 'battery', 'skates', 'coin', 'butter', 'rubber', 'ball', 'toast', 'pizza', 'energy', 'gift', 'snowball', 'sushi', 'wasabi', 'box', 'vacuum', 'paw', 'laser', 'lego', 'rc', 'soap', 'frog', 'burner', 'ropes', 'knight', 'penguin', 'spacebar', 'belt'];

function serve() {
  const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>\n'
    + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + '\n</body></html>';
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/' || u.pathname === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page); }
    const f = path.join(ROOT, path.normalize(u.pathname).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(ROOT)) { res.writeHead(404); return res.end(); }
    fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream' }); res.end(data); });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

async function chrome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'duckassets-'));
  const port = 9600 + Math.floor(Math.random() * 300);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--window-size=960,540', '--hide-scrollbars', '--mute-audio', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let ver;
  for (let i = 0; i < 100 && !ver; i++) { await new Promise(r => setTimeout(r, 150)); try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (e) {} }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } });
  const send = (method, params = {}, sessionId) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params, sessionId })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
  return { proc, dir, ws, send };
}

async function page(C, url, w, h) {
  const { targetId } = await C.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: sid } = await C.send('Target.attachToTarget', { targetId, flatten: true });
  await C.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false }, sid);
  await C.send('Page.navigate', { url }, sid);
  const ev = async e => { const r = await C.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, sid); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception.description); return r.result.value; };
  for (let i = 0; i < 300; i++) { if (await ev(`!!window.MDREC && document.fonts.status === 'loaded'`)) break; await new Promise(r => setTimeout(r, 100)); }
  return { ev, sid, close: () => C.send('Target.closeTarget', { targetId }) };
}

// Runs inside the page: renders each model alone on a transparent background.
const ICON_FN = `async (keys) => {
  MD.MAP_KEYS.forEach(k => MD.Arena.loadMap(k));
  const S = 192, V = THREE.Vector3;
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(S, S); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x555566, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8cc4ea, 0.6); rim.position.set(-4, 3, -4); scene.add(rim);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 200);
  const laser = () => { const g = new THREE.Group(); const d = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: 0xff2222, toneMapped: false })); d.rotation.x = -Math.PI / 2; g.add(d); const h = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.3, toneMapped: false })); h.rotation.x = -Math.PI / 2; h.position.y = -0.001; g.add(h); return g; };
  const get = k => (MD.ICON_MAKERS && MD.ICON_MAKERS[k] && MD.ICON_MAKERS[k]()) || (MD.Hazards.meshes[k] && MD.Hazards.meshes[k]()) || (k === 'laser' && laser()) || MD.Items.meshFor(k);
  const out = {};
  for (const k of keys) {
    const m = get(k); if (!m) continue;
    const holder = new THREE.Group(); holder.add(m); scene.add(holder);
    holder.rotation.y = k === 'paw' ? 0.9 : k === 'coin' ? 0.45 : -0.55;
    if (k === 'paw') holder.rotation.x = Math.PI * 0.75;
    holder.updateMatrixWorld(true);
    let center, radius;
    if (k === 'paw') { center = new V(0, 0, 0); radius = 1.05; }
    else { const box = new THREE.Box3().setFromObject(holder); center = box.getCenter(new V()); radius = box.getSize(new V()).length() / 2; }
    const dist = radius / Math.sin(cam.fov * Math.PI / 360) * 0.98;
    const dir = new V(0.5, 0.62, 0.6).normalize();
    cam.position.copy(center).addScaledVector(dir, dist); cam.lookAt(center); cam.near = dist / 50; cam.far = dist * 4; cam.updateProjectionMatrix();
    r.render(scene, cam);
    out[k] = r.domElement.toDataURL('image/png');
    scene.remove(holder);
  }
  return out;
}`;

const THUMB_SETUP = `document.querySelectorAll('#hud,#feed,#bubbles,#banner,#big,#controls,#ticker').forEach(e => { e.style.display = 'none'; });
  MD.Items.EVENTS = {}; const G = MD.Game, A = MD.Arena;
  G.fighters.forEach(f => { f.isCPU = false; f.input.mx = f.input.mz = 0; });
  G.fighters[0].x = -1.6; G.fighters[1].x = 1.6; G.fighters[0].z = G.fighters[1].z = 0.3;
  A.updateCamera = function () { A.camera.position.set(4.6, 6.6, 10.5); A.camera.lookAt(0, 0.9, -0.4); };
  MDREC.step(75); G.fighters[0].face = Math.PI / 2; G.fighters[1].face = -Math.PI / 2; MDREC.step(8); true`;

async function main() {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const C = await chrome();
  try {
    if (what === 'all' || what === 'icons') {
      fs.mkdirSync(path.join(ROOT, 'img/items'), { recursive: true });
      const p = await page(C, `${base}/?rec=1&map=lab&seed=1`, 640, 360);
      const icons = await p.ev(`(${ICON_FN})(${JSON.stringify(ICONS)})`);
      for (const [k, url] of Object.entries(icons)) fs.writeFileSync(path.join(ROOT, 'img/items', k + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log('icons:', Object.keys(icons).join(', '));
      await p.close();
    }
    if (what === 'all' || what === 'maps') {
      fs.mkdirSync(path.join(ROOT, 'img/maps'), { recursive: true });
      const only = process.argv[3] ? process.argv[3].split(',') : null;
      const keys = (only || ['lab', 'kitchen', 'disco', 'bath', 'playroom', 'pond', 'xmas', 'hackathon', 'space', 'ring', 'chess', 'ice', 'keyboard', 'sushi']);
      for (const k of keys) {
        const p = await page(C, `${base}/?rec=1&map=${k}&seed=4`, 960, 540);
        await p.ev(THUMB_SETUP);
        const { data } = await C.send('Page.captureScreenshot', { format: 'png' }, p.sid);
        const png = path.join(os.tmpdir(), `duckthumb-${k}.png`);
        fs.writeFileSync(png, Buffer.from(data, 'base64'));
        await new Promise((res, rej) => spawn('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-vf', 'scale=480:270', '-q:v', '4', path.join(ROOT, 'img/maps', k + '.jpg')]).on('close', c => (c ? rej(new Error('ffmpeg')) : res())));
        fs.rmSync(png);
        await p.close();
        console.log('map:', k);
      }
    }
  } finally {
    C.ws.close(); server.close();
    await new Promise(r => { C.proc.once('exit', r); C.proc.kill(); setTimeout(r, 3000); });
    try { fs.rmSync(C.dir, { recursive: true, force: true }); } catch (e) {}
  }
}
main().catch(e => { console.error(e); process.exit(1); });
