// The S32 seam (brief H): the picture S32's sim bubble shows, built from sets/hill's real shelter
// so that S32's first frame continues S31's last frame pixel for pixel (Revision 4: S31 ends on its
// bar-85 hold at 6130 and S32 starts at 6131; both frames come from shots.json).
//
//   import { buildShelterSeam } from '../sets/inside-montage/seam.js';
//   const simSource = await buildShelterSeam(ctx);      // a 2048^2 2D canvas
//   createSwarm(canvas, log, { simSource });
//
// Three steps, all in setup (about 2-3 s), each on a throwaway GL context that is released after:
//   1. exact: S31's own last frame, rendered by shots/S31.js itself at 1920x1080, so later changes
//      to S31 carry through to the seam;
//   2. wide:  the shelter at S31's last view through a wider lens on a 2048^2 canvas (shelter.js
//      S31_LAST_SQUARE, S31's frame = its centre 80% x 45%), for the sky and land beyond S31's frame;
//   3. remap: every texel of the output is looked up through the INVERSE of the swarm's bubble lens
//      (swarm.js simWorld: w = u (1 + 0.1 |u|^4)) at S32's first-frame scale (bubble radius
//      20 x 62 = 1240 px, centred), so frame 6203 maps 1:1 onto S31's pixels. The exact frame is
//      used inside S31's frame, feathered over its outer FEATHER px into the wide render.
// The bubble therefore shows a rectilinear view (the lens is undone, not doubled); its rim film,
// highlight and cradle are unchanged.
import { createShelter, squareCam, craneCam } from '../hill/shelter.js';
import S31, { s31Params } from '../../shots/S31.js';

export const SEAM = {
  N: 2048,            // output texture size (swarm opts.simSource)
  f: null,            // S31's last frame: read from shots.json at build time (Revision 4: 6130)
  R1: 20 * 62,        // bubble radius on screen at S32's first frame (GEOM.br x Z0), px
  lens: 0.10,         // swarm.js simWorld: w = u (1 + lens |u|^4)
  frac: 0.8,          // S31's frame spans this fraction of the wide render's width
  FEATHER: 24,        // px (S31 frame) over which the exact frame hands over to the wide render
};

const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

function release(gl) { const x = gl && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
function pixels(canvas) {
  const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(canvas, 0, 0);
  return g.getImageData(0, 0, c.width, c.height);
}

// S31's last frame through S31.js (its setup + render on a private 1920x1080 canvas)
async function exactFrame(ctx) {
  SEAM.f = ctx.T.shot('S31').f1 - 1;
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
  const c2 = { W: 1920, H: 1080, scale: 1, T: ctx.T, log: ctx.log, shot: ctx.T.shot('S31'), canvas: cv };
  await S31.setup(c2);
  await S31.render(c2, ctx.T.frameInfo(ctx.T.shot('S31'), SEAM.f));
  const img = pixels(cv);
  release(cv.getContext('webgl2'));
  return img;
}

// the wide view, with S31.js's per-frame extras at its last frame (kick pulse, Clawd's breathing)
function wideFrame(ctx) {
  const { T } = ctx, s = T.shot('S31');
  SEAM.f = s.f1 - 1;
  const cv = document.createElement('canvas'); cv.width = cv.height = SEAM.N;
  const sh = createShelter(cv, { log: ctx.log });
  // exactly S31's own state at its last frame (shots/S31.js s31Params), through the wider lens
  const p = s31Params(T, SEAM.f, s.f0, s.f1 - s.f0);
  sh.render(Object.assign(p, { cam: squareCam(craneCam(p.crane)) }));
  const img = pixels(cv);
  release(sh.hill.gl);
  return img;
}

function bilerp(img, x, y, out) {   // x, y in pixel-centre coordinates; clamps at the border
  const w = img.width, h = img.height, d = img.data;
  x = Math.min(Math.max(x, 0), w - 1.001); y = Math.min(Math.max(y, 0), h - 1.001);
  const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
  const i00 = (y0 * w + x0) * 4, i10 = i00 + 4, i01 = i00 + w * 4, i11 = i01 + 4;
  for (let c = 0; c < 3; c++) {
    const a = d[i00 + c] + (d[i10 + c] - d[i00 + c]) * fx, b = d[i01 + c] + (d[i11 + c] - d[i01 + c]) * fx;
    out[c] = a + (b - a) * fy;
  }
}

export function composeSeam(exact, wide) {
  const { N, R1, lens, frac, FEATHER } = SEAM;
  // radial inverse of the lens: |w| = r (1 + lens r^4)  ->  r(|w|), tabulated
  const LN = 8192, RMAX = 1.6, lut = new Float32Array(LN + 2);
  for (let i = 0; i <= LN + 1; i++) {
    const rw = i / LN * RMAX; let r = rw;
    for (let k = 0; k < 30; k++) r -= (r * (1 + lens * r ** 4) - rw) / (1 + 5 * lens * r ** 4);
    lut[i] = r;
  }
  const kw = frac * N / 1920;                     // wide-render texels per S31 px
  const out = new ImageData(N, N), o = out.data;
  const ce = [0, 0, 0], cw = [0, 0, 0];
  for (let Y = 0; Y < N; Y++) {
    const wy = (Y + 0.5) / (N / 2) - 1;
    for (let X = 0; X < N; X++) {
      const wx = (X + 0.5) / (N / 2) - 1;
      const rw = Math.hypot(wx, wy);
      const t = rw / RMAX * LN, i = t | 0, ru = lut[i] + (lut[i + 1] - lut[i]) * (t - i);
      const s = rw > 1e-6 ? ru / rw : 1;
      const px = 960 + R1 * wx * s, py = 540 + R1 * wy * s;        // S31 frame coordinates (continuous)
      const dE = Math.min(px, 1920 - px, py, 1080 - py);
      const a = dE <= 0 ? 0 : smooth(0, FEATHER, dE);
      bilerp(wide, 1024 + kw * (px - 960) - 0.5, 1024 + kw * (py - 540) - 0.5, cw);
      if (a > 0) bilerp(exact, px - 0.5, py - 0.5, ce);
      const j = (Y * N + X) * 4;
      for (let c = 0; c < 3; c++) o[j + c] = a > 0 ? cw[c] + (ce[c] - cw[c]) * a : cw[c];
      o[j + 3] = 255;
    }
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  cv.getContext('2d').putImageData(out, 0, 0);
  return cv;
}

export async function buildShelterSeam(ctx) {
  const t0 = performance.now();
  const wide = wideFrame(ctx);
  const t1 = performance.now();
  const exact = await exactFrame(ctx);
  const t2 = performance.now();
  const cv = composeSeam(exact, wide);
  ctx.log(`seam: wide ${(t1 - t0).toFixed(0)} ms, exact ${(t2 - t1).toFixed(0)} ms, remap ${(performance.now() - t2).toFixed(0)} ms`);
  return cv;
}
