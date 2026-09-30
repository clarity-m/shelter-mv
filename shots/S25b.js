// S25b, bar 57 (frames 4043-4114; revision 8): the first landing, on the bar-57 kick. A tray of paper
// vials under a lab hood (sets/paper-kit/biolab.js). On the kick the knot Clawd folded in S20 arrives
// as light over the open vial: its chain (sets/inside-montage/protein.js, the FOLD conformation) is
// drawn as a band of white-hot light, and it pours into the vial point by point down a thin stream,
// burning to Claude's orange as it goes. No outline lands: people made the medicine. The vial
// blazes, throwing its neighbours' shadows up the hood's back panel, and then the vials beside it
// light one after another (people making it at scale), outward from the first.
import { createPaper, smooth, clamp, easeInOut, toScreen, lerp } from '../sets/paper-kit/kit.js';
import { biolabScene, biolabState, LAB, XS, TOPS } from '../sets/paper-kit/biolab.js';
import { FOLD, chainPoints } from '../sets/inside-montage/protein.js';

const N = 72;
export const CAM0 = { Zc: 2000, zref: 10, c: [LAB.glowX, 600], tz: 460, t: [0, 0], pan: [-62, -10] };
const HERO = XS.indexOf(LAB.glowX);
// the doses: the other vials light one after another, outward from the first (local frames)
const ORDER = [HERO + 1, HERO - 1, HERO + 2, HERO - 2, HERO - 3, HERO - 4, HERO - 5].filter((i) => i >= 0 && i < XS.length);
const DOSE_AT = XS.map((x, i) => (i === HERO ? 0 : 20 + 6 * ORDER.indexOf(i)));
const camAt = (fl) => Object.assign({}, CAM0, { tz: CAM0.tz + 70 * easeInOut(fl / (N - 1)) });

export function s25bState(T, fr) {
  const fl = fr.fl, f = fr.f;
  // the vial blazes as the light pours in, then settles to a strong glow that breathes on the beats
  const blaze = smooth(2, 13, fl) * (1 + 0.35 * Math.exp(-Math.max(fl - 13, 0) / 9));
  const g = 0.04 + 1.15 * blaze + 0.05 * T.pulse('beats', f, 6) * smooth(0, 20, fl);
  const st = biolabState({ glow: g, breath: 1 + 0.05 * (T.envSmooth('vocals', f, 4) - 0.5) });
  st.layers.doses = { t: fl / N };
  // the hood warms on each side as its vials light
  const lit = (side) => ORDER.filter((i) => Math.sign(i - HERO) === side).reduce((a, i) => a + smooth(DOSE_AT[i], DOSE_AT[i] + 4, fl), 0);
  st.fills = [
    { x: XS[Math.max(0, HERO - 3)], y: 640, z: 30, I: 5200 * lit(-1), a: 110, f: 900, h: 0.4 },
    { x: XS[Math.min(XS.length - 1, HERO + 1)] + 30, y: 640, z: 30, I: 6500 * lit(1), a: 110, f: 800, h: 0.4 },
  ];
  st.cam = camAt(fl);
  return st;
}

// ---------------------------------------------------------------- the knot of light
const KNOT = (() => {
  const a = 0.62, tilt = 0.18, S = 0.1;                       // turn and tilt of the knot, metres per knot unit
  const rot = ([x, y, z]) => { const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a); return [x1, y * Math.cos(tilt) - z1 * Math.sin(tilt), y * Math.sin(tilt) + z1 * Math.cos(tilt)]; };
  const c = chainPoints(FOLD, (p) => rot(p), (d) => rot(d));
  return { P: c.P, S: c.S, W: c.W, n: c.P.length, S0: S };
})();
const PX = 104;                                             // px per knot-frame metre at the landing
function drawKnot(g, s, k, mouth, liquid, centre) {
  const n = KNOT.n;
  g.lineCap = 'round'; g.lineJoin = 'round';
  let alive = 0;
  for (let i = 0; i + 1 < n; i++) {
    const f = i / (n - 1), start = 1.5 + 9 * f, u = clamp((k - start) / 6, 0, 1);
    if (u >= 1) continue;
    const at = (j, uu) => {
      const p = KNOT.P[j], home = [centre[0] + p[0] * PX, centre[1] - p[1] * PX];
      if (uu <= 0) return home;
      // the pour: to the mouth, then down into the liquid
      const a = Math.min(uu / 0.6, 1), b = clamp((uu - 0.6) / 0.4, 0, 1);
      const q = [lerp(home[0], mouth[0], a * a), lerp(home[1], mouth[1], a)];
      return b > 0 ? [lerp(q[0], liquid[0], b), lerp(q[1], liquid[1], b)] : q;
    };
    const A = at(i, u), B = at(i + 1, clamp((k - (1.5 + 9 * (i + 1) / (n - 1))) / 6, 0, 1));
    const w = Math.max(1.3, 0.8 * KNOT.W[i] * PX * (1 - 0.7 * u));             // a thin band: the fold must read
    const heat = clamp(k / 10 + u * 0.6, 0, 1), I = (1 - u * u) * (1 + 0.6 * Math.exp(-k / 2.5));
    g.strokeStyle = `rgba(255,${Math.round(244 - 90 * heat)},${Math.round(226 - 150 * heat)},${Math.min(1, 0.62 * I).toFixed(3)})`;
    g.lineWidth = w * s;
    g.beginPath(); g.moveTo(A[0] * s, A[1] * s); g.lineTo(B[0] * s, B[1] * s); g.stroke();
    alive++;
  }
  return alive;
}

let E, glc, g2, lc, lg;
export default {
  async setup(ctx) {
    glc = document.createElement('canvas'); glc.width = ctx.W; glc.height = ctx.H;
    lc = document.createElement('canvas'); lc.width = ctx.W; lc.height = ctx.H; lg = lc.getContext('2d');
    g2 = ctx.canvas.getContext('2d');
    const doses = XS.map((x, i) => (i === HERO ? 1 : clamp(DOSE_AT[i] / N, 1 / 255, 1)));
    E = createPaper(glc, biolabScene({ open: true, doses }), { k: ctx.scale, log: ctx.log });
    ctx.log(`S25b: knot ${KNOT.n} points; doses at ${DOSE_AT.join(', ')}`);
  },
  render(ctx, fr) {
    E.frame(s25bState(ctx.T, fr));
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.filter = 'none';
    g2.drawImage(glc, 0, 0, ctx.W, ctx.H);
    const k = fr.fl;
    if (k > 20) return;
    const cam = camAt(k), s = ctx.W / 1920;
    const mouth = toScreen(cam, [LAB.glowX, TOPS[HERO] + 4], 10), liquid = toScreen(cam, [LAB.glowX, TOPS[HERO] + 150], 10);
    const centre = [mouth[0] + 8, mouth[1] - 118];
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.clearRect(0, 0, lc.width, lc.height);
    lg.globalCompositeOperation = 'lighter';
    if (!drawKnot(lg, s, k, mouth, liquid, centre)) return;
    g2.save(); g2.globalCompositeOperation = 'lighter';
    g2.filter = `blur(${(7 * s).toFixed(2)}px)`; g2.globalAlpha = 0.8; g2.drawImage(lc, 0, 0);
    g2.filter = `blur(${(2.2 * s).toFixed(2)}px)`; g2.globalAlpha = 0.7; g2.drawImage(lc, 0, 0);
    g2.filter = 'none'; g2.globalAlpha = 1; g2.drawImage(lc, 0, 0);
    g2.restore();
  },
};
