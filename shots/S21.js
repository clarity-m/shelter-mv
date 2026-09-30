// S21, build 2, bar 65 only (frames 4619-4690): the kick that starts build 2 ignites a fusion reactor
// (outside, backlit paper). Hard cut from S36's ring of light on the kick.
// Revision 8 (Claire: the reactor need not be an exact blueprint, only its core; the rocket's exact
// blueprint is the progression): only the core lands. On the kick the ring and coils that S36's
// Clawds made in light (sets/paper-fusion/landing.js: the plasma ring, its meridians and the twelve
// coils) flash onto the paper reactor, exactly on it, through this shot's own camera; the column,
// cap, base and ports stay plain paper, the humans' build. Over the first beat the lines burn off
// into the ignition as the plasma blooms: the coils first, the plasma ring last, its light going into
// the plasma itself. Then the plasma pulses on the beats and breathes with the voice while the camera
// pushes in and the layers part (the lines follow that zoom while they last). The fusion set renders
// into a private WebGL canvas; the lines are drawn over it in 2D.
// Revision 20 (Claire: the moment the burning lines light up the plasma is brilliant, keep a few
// highlights spinning if it's physically accurate; the plasma looks static): as the lines burn off,
// a dozen bright filaments stay behind and travel along the plasma's helical field lines (landing.js
// HELIX), round the ring. That is what a tokamak's plasma does: it rotates toroidally, and its bright
// edge filaments stay aligned with the twisted field. Nearer filaments are brighter; they pulse on the beats.
// Revision 21 (Claire: the highlights passed through the reactor's skeleton): the filaments are masked by
// the plasma's own light in the rendered frame, so the coils and column in front hide them.
import { createFusion } from '../sets/paper-fusion/fusion.js';
import { coreEdges, proj, FOCUS, LD, HELIX } from '../sets/paper-fusion/landing.js';
import { SC } from '../sets/inside-montage/reactor.js';
import { smoothstep, clamp, hash } from '../lib/util.js';

const KICK = 0;   // local frame of the bar-65 kick (the shot's first frame)

// when each part burns off (frames after the kick): the coils first, the plasma ring last
const BURN = { coil: [2, 8], merid: [6, 4], helix: [7, 6], torus: [9, 9] };   // the field lines just before the ring
const EDGES = coreEdges().map((e, i) => {
  const [t0, span] = BURN[e.kind] || [4, 6];
  return { a: proj(e.a), b: proj(e.b), port: false, ring: e.kind === 'torus' || e.kind === 'helix', dim: e.dim ?? 1,
    burn: t0 + span * hash(i, 71) };
});
const BURN_LEN = 7;    // frames a line takes to burn away

let F, glCanvas, g2, lc, lg, fc, fg, mc, mg, mo, mog, mImg;
const MW = 480, MH = 270;             // the visibility mask's resolution
function drawLines(k, push, scale) {
  // intensity and colour per line: the flash on the kick, then each burns warm and goes
  const z = LD / (LD - push), s = scale;
  const X = (p) => (FOCUS[0] + (p[0] - FOCUS[0]) * z) * s, Y = (p) => (FOCUS[1] + (p[1] - FOCUS[1]) * z) * s;
  lg.globalCompositeOperation = 'lighter';
  lg.lineCap = 'round';
  const flash = 1 + 0.6 * Math.exp(-k / 2.5);
  let n = 0;
  for (const e of EDGES) {
    const b = clamp((k - e.burn) / BURN_LEN);
    if (b >= 1) continue;
    const I = e.dim * flash * (1 - b * b) * (e.ring ? 1.2 : 1);
    // white-hot, turning to Claude's orange as it burns
    const r = 255, g = Math.round(244 - 90 * b), bl = Math.round(226 - 150 * b);
    lg.strokeStyle = lg.fillStyle = `rgba(${r},${g},${bl},${Math.min(1, 0.85 * I).toFixed(3)})`;
    if (e.port) { lg.beginPath(); lg.arc(X(e.a), Y(e.a), 3.2 * s, 0, 2 * Math.PI); lg.fill(); n++; continue; }
    lg.lineWidth = (2.2 + 1.2 * b) * s;
    lg.beginPath(); lg.moveTo(X(e.a), Y(e.a)); lg.lineTo(X(e.b), Y(e.b)); lg.stroke(); n++;
  }
  return n;
}

// ---------------------------------------------------------------- the plasma's filaments (revision 20)
// a point on helix line j at continuous index i (landing.js helixEdges: SEG segments per toroidal turn)
function helixPoint(j, i) {
  const { R0, A, KAPPA } = SC, a0 = 2 * Math.PI * j / HELIX.N;
  const phi = 2 * Math.PI * i / HELIX.SEG, a = a0 + phi / HELIX.Q, r = R0 + HELIX.S * A * Math.cos(a);
  return [r * Math.cos(phi), r * Math.sin(phi), HELIX.S * KAPPA * A * Math.sin(a)];
}
const FIL = [];                                 // two filaments per field line, staggered round the ring
for (let j = 0; j < HELIX.N; j++) for (let m = 0; m < 2; m++) {
  const q = j * 2 + m;
  FIL.push({ j, i0: HELIX.SEG * HELIX.Q * (m / 2 + 0.37 * hash(q, 13)), len: 13 + 6 * hash(q, 29), w: 0.8 + 0.4 * hash(q, 41) });
}
const FIL_V = 2.4;                              // segments per frame: about a toroidal turn every 50 frames
function drawFilaments(k, f, T, push, scale) {
  const z = LD / (LD - push), s = scale;
  const X = (p) => (FOCUS[0] + (p[0] - FOCUS[0]) * z) * s, Y = (p) => (FOCUS[1] + (p[1] - FOCUS[1]) * z) * s;
  const on = smoothstep(7, 16, k), beat = T.pulse('beats', f, 6);
  const I0 = on * (1.35 + 0.5 * beat);
  if (I0 <= 0.001) return 0;
  fg.globalCompositeOperation = 'lighter'; fg.lineCap = 'round';
  const Rmax = SC.R0 + SC.A, STEPS = 12;
  let n = 0;
  for (const fl of FIL) {
    const head = fl.i0 + FIL_V * k * (1 + 0.1 * fl.w);
    for (let t = 0; t < STEPS; t++) {
      const ia = head - fl.len * (t + 1) / STEPS, ib = head - fl.len * t / STEPS;
      const A = helixPoint(fl.j, ia), B = helixPoint(fl.j, ib), pa = proj(A), pb = proj(B);
      const front = clamp(0.5 - 0.5 * (0.5 * (A[1] + B[1])) / Rmax);      // model y points away from the camera
      const tail = 1 - t / STEPS;                                           // bright at the head, fading behind
      const I = I0 * fl.w * tail * tail * (0.3 + 0.7 * front);
      if (I < 0.02) continue;
      const g = Math.round(236 - 70 * (1 - tail)), bl = Math.round(210 - 120 * (1 - tail));
      fg.strokeStyle = `rgba(255,${g},${bl},${Math.min(1, 0.9 * I).toFixed(3)})`;
      fg.lineWidth = (2.2 + 2.6 * tail) * s * (0.8 + 0.4 * front);
      fg.beginPath(); fg.moveTo(X(pa), Y(pa)); fg.lineTo(X(pb), Y(pb)); fg.stroke(); n++;
    }
  }
  return n;
}

// the plasma's visibility: bright where the plasma shows, dark where the coils, column and cap stand in
// front of it (their card is dark against the glow). The filament layer keeps only the bright parts.
function maskFilaments(W, H) {
  mg.drawImage(glCanvas, 0, 0, MW, MH);
  const src = mg.getImageData(0, 0, MW, MH).data, dst = mImg.data;
  for (let i = 0; i < src.length; i += 4) {
    const lum = (0.2126 * src[i] + 0.7152 * src[i + 1] + 0.0722 * src[i + 2]) / 255;
    const t = Math.min(Math.max((lum - 0.40) / 0.18, 0), 1);
    dst[i] = dst[i + 1] = dst[i + 2] = 255; dst[i + 3] = Math.round(255 * t * t * (3 - 2 * t));
  }
  mog.putImageData(mImg, 0, 0);
  fg.globalCompositeOperation = 'destination-in';
  fg.imageSmoothingEnabled = true;
  fg.drawImage(mo, 0, 0, W, H);
  fg.globalCompositeOperation = 'source-over';
}

export default {
  async setup(ctx) {
    // the set is authored at 1920x1080 and renders privately; the frame is composited in 2D
    glCanvas = document.createElement('canvas'); glCanvas.width = 1920; glCanvas.height = 1080;
    g2 = ctx.canvas.getContext('2d');
    lc = document.createElement('canvas'); lc.width = ctx.W; lc.height = ctx.H;
    lg = lc.getContext('2d');
    fc = document.createElement('canvas'); fc.width = ctx.W; fc.height = ctx.H; fg = fc.getContext('2d');
    mc = document.createElement('canvas'); mc.width = MW; mc.height = MH; mg = mc.getContext('2d', { willReadFrequently: true });
    mo = document.createElement('canvas'); mo.width = MW; mo.height = MH; mog = mo.getContext('2d'); mImg = mog.createImageData(MW, MH);
    F = createFusion(glCanvas, (s) => ctx.log(s));
    ctx.log(`S21: ${EDGES.length} drawing edges, focus ${FOCUS.map((v) => v.toFixed(0)).join(', ')}`);
  },
  render(ctx, fr) {
    const T = ctx.T, k = fr.fl - KICK, s = ctx.W / 1920;
    // After the ignition flash the plasma stays alive: a pulse on every beat, a slow
    // two-bar breath, and a little of the voice; the whole thing runs a bit brighter.
    let ign = 0;
    if (k >= 0) {
      const on = smoothstep(6, 24, k);
      const beat = T.pulse('beats', fr.f, 5);
      const breath = Math.sin(2 * Math.PI * k / 144);
      const voice = T.envSmooth('vocals', fr.f, 4) - 0.5;
      // (revision 21) the steady glow settles a little lower after the flash, so the filaments carry the brilliance
      const settle = 1 - 0.14 * smoothstep(10, 22, k);
      ign = settle * (1 + 0.55 * Math.exp(-k / 5)) * (1.1 + on * (0.3 * beat + 0.08 * breath + 0.1 * voice));
    }
    const reach = k < 0 ? 0.3 : 0.35 + 7.5 * (1 - Math.exp(-k / 11));
    const u = fr.fl / (fr.n - 1);
    const push = 0.13 * smoothstep(0, 1, u) + 0.02 * u;
    F.renderFrame({ ign, reach, push });
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.globalCompositeOperation = 'source-over'; g2.filter = 'none';
    g2.drawImage(glCanvas, 0, 0, ctx.W, ctx.H);
    // the drawing, landing on it and burning off over the first beat; then the plasma's filaments
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, lc.width, lc.height);
    let drawn = 0;
    if (k >= 0 && k < 24) drawn += drawLines(k, push, s);
    if (k >= 0) {
      fg.setTransform(1, 0, 0, 1, 0, 0); fg.globalCompositeOperation = 'source-over'; fg.clearRect(0, 0, fc.width, fc.height);
      const nf = drawFilaments(k, fr.f, T, push, s);
      if (nf > 0) {
        maskFilaments(ctx.W, ctx.H);
        lg.globalCompositeOperation = 'lighter'; lg.drawImage(fc, 0, 0); lg.globalCompositeOperation = 'source-over';
        drawn += nf;
      }
    }
    if (drawn > 0) {
      g2.globalCompositeOperation = 'lighter';
      g2.filter = `blur(${(7 * s).toFixed(2)}px)`; g2.globalAlpha = 0.9; g2.drawImage(lc, 0, 0);
      g2.filter = `blur(${(2.2 * s).toFixed(2)}px)`; g2.globalAlpha = 0.8; g2.drawImage(lc, 0, 0);
      g2.filter = 'none'; g2.globalAlpha = 1; g2.drawImage(lc, 0, 0);
      g2.globalCompositeOperation = 'source-over';
    }
  },
};
