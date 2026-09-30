// Offline renderer: headless Chrome renders shots frame by frame, ffmpeg encodes them.
//
//   node render/render.mjs S19                 render shot S19 -> out/shots/S19.mp4
//   node render/render.mjs S19 S20 S21         several shots, one after another
//   node render/render.mjs all                 every shot in shots.json that has shots/<id>.js
//   node render/render.mjs S19 --still 3800    one frame -> out/stills/S19_f3800.png
//   node render/render.mjs S19 --from 3760 --to 3800 [--scale 0.5]   a partial or preview clip
//
// The page (render/player.html) POSTs raw RGBA frames to this process over HTTP. If Chrome
// crashes, hangs or loses its WebGL context, the job relaunches Chrome at the next frame it
// still needs, keeping the same ffmpeg pipe, so shot code must render each frame from scratch
// (no state carried between frames).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { shotFrames, testShot, W as FW, H as FH, FPS } from './core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css',
  '.glsl': 'text/plain', '.txt': 'text/plain', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };

// ---- args ----------------------------------------------------------------------------
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const flagArgs = new Set(['--from', '--to', '--still', '--scale', '--crf', '--tries']);
const ids = argv.filter((a, i) => !a.startsWith('--') && !flagArgs.has(argv[i - 1]));
const scale = parseFloat(opt('--scale', '1'));
const crf = opt('--crf', '12');
const maxTries = parseInt(opt('--tries', '4'));
const W = Math.round(FW * scale), H = Math.round(FH * scale);

const shotsDoc = JSON.parse(fs.readFileSync(path.join(ROOT, 'shots.json'), 'utf8'));
const allShots = shotsDoc.shots.map((s) => ({ ...s, ...shotFrames(s) }));
const hasCode = (id) => fs.existsSync(path.join(ROOT, 'shots', `${id}.js`));
const wanted = ids.length === 1 && ids[0] === 'all' ? allShots.filter((s) => hasCode(s.id)).map((s) => s.id) : ids;
if (!wanted.length) { console.error('usage: node render/render.mjs <shot...|all> [--still F | --from F --to F] [--scale s]'); process.exit(2); }

fs.mkdirSync(path.join(ROOT, 'out', 'shots'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'out', 'stills'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'out', 'logs'), { recursive: true });

const jobs = wanted.map((id, k) => {
  const s = allShots.find((x) => x.id === id) || (id.startsWith('_') ? testShot(id) : undefined);
  if (!s) throw new Error(`unknown shot ${id}`);
  if (!hasCode(id)) throw new Error(`no shots/${id}.js`);
  const still = opt('--still');
  const from = still !== undefined ? parseInt(still) : parseInt(opt('--from', s.f0));
  const to = still !== undefined ? parseInt(still) : parseInt(opt('--to', s.f1 - 1));
  const partial = from !== s.f0 || to !== s.f1 - 1;
  const tag = (partial ? `_${from}-${to}` : '') + (scale !== 1 ? `_s${scale}` : '');
  const out = still !== undefined ? path.join(ROOT, 'out', 'stills', `${id}_f${from}${scale !== 1 ? `_s${scale}` : ''}.png`)
    : path.join(ROOT, 'out', 'shots', `${id}${tag}.mp4`);
  return { key: `j${k}_${id}`, id, from, to, next: from, still: still !== undefined, out, tries: 0, ms: [],
    logFile: path.join(ROOT, 'out', 'logs', `${id}${tag}.log`) };
});

// ---- helpers ----------------------------------------------------------------------------
const say = (job, msg) => {
  const line = `[${new Date().toTimeString().slice(0, 8)}] ${job ? job.id : '-'}: ${msg}`;
  console.log(line);
  if (job) fs.appendFileSync(job.logFile, line + '\n');
};

function startFfmpeg(job) {
  const input = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba',
    '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'];
  const args = job.still ? [...input, '-frames:v', '1', '-update', '1', job.out]
    : [...input, '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-profile:v', 'high', '-g', '60',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
      '-movflags', '+faststart', job.out];
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'inherit', 'pipe'] });
  ff.stderr.on('data', (d) => say(job, `ffmpeg: ${String(d).trim()}`));
  ff.done = new Promise((res) => ff.on('close', res));
  return ff;
}

function killTree(proc) {
  if (!proc || proc.exitCode !== null) return;
  spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
}

let port = 0;
function launchChrome(job) {
  const profile = path.join(os.tmpdir(), `shelter-chrome-${process.pid}-${job.key}`);
  const url = `http://127.0.0.1:${port}/render/player.html?shot=${job.id}&from=${job.next}&to=${job.to}` +
    `&job=${job.key}&scale=${scale}`;
  const args = ['--headless=new', '--use-angle=vulkan', '--ignore-gpu-blocklist', '--disable-gpu-watchdog',
    '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`, '--mute-audio',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', `--user-data-dir=${profile}`, url];
  job.chrome = spawn(CHROME, args, { stdio: 'ignore' });
  job.lastProgress = Date.now();
  job.firstFrame = true;
  say(job, `chrome launched at frame ${job.next} (try ${job.tries + 1})`);
}

// ---- server -----------------------------------------------------------------------------
const byKey = new Map(jobs.map((j) => [j.key, j]));
const readBody = (req) => new Promise((res, rej) => {
  const chunks = []; req.on('data', (c) => chunks.push(c)); req.on('end', () => res(Buffer.concat(chunks))); req.on('error', rej);
});

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET') {
      const p = path.normalize(path.join(ROOT, decodeURIComponent(u.pathname)));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      return fs.createReadStream(p).pipe(res);
    }
    const job = byKey.get(u.searchParams.get('job'));
    const body = await readBody(req);
    if (!job) { res.writeHead(404); return res.end(); }
    if (u.pathname === '/log') {
      say(job, `${u.searchParams.get('level') === 'error' ? 'PAGE ERROR ' : 'page: '}${body.toString()}`);
    } else if (u.pathname === '/frame') {
      const f = parseInt(u.searchParams.get('f'));
      if (f !== job.next) { say(job, `unexpected frame ${f} (want ${job.next}), ignored`); res.writeHead(409); return res.end(); }
      if (body.length !== W * H * 4) throw new Error(`frame ${f}: ${body.length} bytes, want ${W * H * 4}`);
      await new Promise((ok) => (job.ff.stdin.write(body) ? ok() : job.ff.stdin.once('drain', ok)));
      job.ms.push(parseFloat(u.searchParams.get('ms')));
      job.next = f + 1; job.lastProgress = Date.now(); job.firstFrame = false;
      const n = job.next - job.from, total = job.to - job.from + 1;
      if (n % 60 === 0 || job.next > job.to) say(job, `${n}/${total} frames`);
    } else if (u.pathname === '/done') {
      job.finish && job.finish(true);
    } else if (u.pathname === '/fail') {
      say(job, `page reported failure: ${body.toString().slice(0, 500)}`);
      job.retry && job.retry();
    }
    res.writeHead(200); res.end();
  } catch (e) {
    say(null, `server error: ${e.stack || e}`);
    res.writeHead(500); res.end();
  }
});

async function runJob(job) {
  fs.writeFileSync(job.logFile, '');
  job.ff = startFfmpeg(job);
  const t0 = Date.now();
  const ok = await new Promise((resolve) => {
    job.finish = (good) => { clearInterval(job.watch); killTree(job.chrome); resolve(good); };
    job.retry = () => {
      killTree(job.chrome);
      job.tries += 1;
      if (job.tries >= maxTries) { say(job, 'giving up'); job.finish(false); return; }
      setTimeout(() => launchChrome(job), 2000);
    };
    job.watch = setInterval(() => {
      const limit = job.firstFrame ? 420e3 : 120e3;  // first frame includes shader compiles
      if (Date.now() - job.lastProgress > limit) { say(job, `no progress for ${limit / 1e3} s`); job.lastProgress = Date.now(); job.retry(); }
    }, 5000);
    launchChrome(job);
  });
  job.ff.stdin.end();
  await job.ff.done;
  const ms = job.ms.length ? job.ms.reduce((a, b) => a + b, 0) / job.ms.length : 0;
  say(job, `${ok ? 'done' : 'FAILED'}: ${job.next - job.from} frames in ${((Date.now() - t0) / 1e3).toFixed(1)} s ` +
    `(page ${ms.toFixed(0)} ms/frame avg) -> ${path.relative(ROOT, job.out)}`);
  return ok;
}

server.listen(0, '127.0.0.1', async () => {
  port = server.address().port;
  let failed = 0;
  for (const job of jobs) if (!(await runJob(job))) failed++;
  server.close();
  process.exit(failed ? 1 : 0);
});
process.on('SIGINT', () => { for (const j of jobs) killTree(j.chrome); process.exit(130); });
