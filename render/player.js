// Self-driving render page. Loaded by render.mjs in headless Chrome as
//   player.html?shot=S19&from=F&to=F&job=ID[&scale=0.5]
// It renders frames from..to (inclusive, global frame numbers) of one shot and POSTs
// each frame's RGBA pixels to the driver, which pipes them into ffmpeg.
// Without a job param it just renders frame `from` on screen (for looking in a browser).
import * as T from './timeline.js';

const q = new URLSearchParams(location.search);
const shotId = q.get('shot');
const job = q.get('job');
const scale = parseFloat(q.get('scale') || '1');
const W = Math.round(T.W * scale), H = Math.round(T.H * scale);

const post = (path, body) => fetch(path, { method: 'POST', body }).then((r) => {
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r;
});
const log = (msg, level = 'info') => {
  console.log(msg);
  if (job) return post(`/log?job=${job}&level=${level}`, String(msg)).catch(() => {});
};
const fail = async (why) => {
  await log(why, 'error');
  if (job) await post(`/fail?job=${job}`, String(why)).catch(() => {});
};
addEventListener('error', (e) => fail(`page error: ${e.message} @ ${e.filename}:${e.lineno}`));
addEventListener('unhandledrejection', (e) => fail(`unhandled: ${e.reason && (e.reason.stack || e.reason)}`));

function readPixels(canvas) {
  const c2 = canvas.getContext('2d');
  if (c2) return c2.getImageData(0, 0, W, H).data;
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  const px = new Uint8Array(W * H * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const row = W * 4, tmp = new Uint8Array(row);  // WebGL rows are bottom-up
  for (let y = 0; y < H >> 1; y++) {
    const a = y * row, b = (H - 1 - y) * row;
    tmp.set(px.subarray(a, a + row)); px.copyWithin(a, b, b + row); px.set(tmp, b);
  }
  return px;
}

function gpuName() {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2');
  if (!gl) return 'no webgl2';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
}

async function main() {
  await T.loadTimeline('..');
  const s = T.shot(shotId);
  if (!s) throw new Error(`no shot ${shotId} in shots.json`);
  const from = q.has('from') ? parseInt(q.get('from')) : s.f0;
  const to = q.has('to') ? parseInt(q.get('to')) : s.f1 - 1;
  const mod = await import(`../shots/${s.id}.js`);
  const S = mod.default;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  if (!job) document.body.appendChild(canvas);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail('webgl context lost'); });
  const ctx = { W, H, scale, shot: s, T, canvas, log };
  await log(`${s.id} frames ${from}-${to} at ${W}x${H} on ${gpuName()}`);
  const t0 = performance.now();
  await S.setup(ctx);
  await log(`setup ${(performance.now() - t0).toFixed(0)} ms`);
  // Optional dissolve-in (shots.json "xin": N frames): blend out of the previous shot's
  // last frame, rendered once here by the previous shot's own module.
  let prevPx = null;
  if (s.xin && from < s.f0 + s.xin) {
    const all = T.shots(), i = all.findIndex((x) => x.id === s.id), p = all[i - 1];
    const pm = (await import(`../shots/${p.id}.js`)).default;
    const pc = document.createElement('canvas'); pc.width = W; pc.height = H;
    const pctx = { W, H, scale, shot: p, T, canvas: pc, log };
    await pm.setup(pctx);
    await pm.render(pctx, T.frameInfo(p, p.f1 - 1));
    prevPx = new Uint8Array(readPixels(pc));
    await log(`dissolve-in from ${p.id} frame ${p.f1 - 1} over ${s.xin} frames`);
  }
  for (let f = from; f <= to; f++) {
    const a = performance.now();
    await S.render(ctx, T.frameInfo(s, f));
    const px = readPixels(canvas);
    if (prevPx && f - s.f0 < s.xin) {
      const x = (f - s.f0 + 1) / (s.xin + 1), k = x * x * (3 - 2 * x);  // smoothstep weight of the new shot
      for (let j = 0; j < px.length; j++) px[j] = px[j] * k + prevPx[j] * (1 - k);
    }
    const ms = performance.now() - a;
    if (!job) break;
    await post(`/frame?job=${job}&f=${f}&ms=${ms.toFixed(0)}`, px);
  }
  if (job) await post(`/done?job=${job}`, '');
}

main().catch((e) => fail(`main: ${e && (e.stack || e)}`));
