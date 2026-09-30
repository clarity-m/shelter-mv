// S25, build 2 (bars 65-66, frames 4619-4762), rung 4 -> 5 begins: the crowd folds proteins by the
// dozen (revision 6: the payoff of S20's opening, where Clawd folded one alone; told as scale).
// Hard cut on the bar-65 downbeat.
//   bar 65  close on Clawd on the hill's face: on the snare roll the crowd multiplies around him
//           (3 to about 50, each newcomer popping in with a hop, looking to him, none bigger than him
//           on screen) while the camera cranes back to take them all in.
//   bar 66  on the downbeat's chop the groups paint their chains across the sky at once, a ripple
//           out from Clawd's: long ribbons of luminous paint (the fork's `ribbons`,
//           sets/inside-montage/protein.js), coils like helices, broad flat arrows like sheets, thin
//           loops between, every Clawd holding its group's chain with a beam from its glyph (S20's
//           light). Then they all fold in three clear, eased steps: collapse (the snare at 4710),
//           gather (the chop at 4724) and pack (the snare at 4737), into dozens of glowing knots,
//           while the camera pushes in to the nearest and largest, Clawd's own. On the last beat the
//           world dims toward night, the beams let go, the far knots dim and his knot glows alone
//           where S25b's vial glows (sets/paper-kit/MATCH.md): a hard cut on the match.
// The strokes begin to shrink into motes (strokeLift, rung 4 -> 5). (Revision 7: the old S24 towers are
// gone: S24 is now the river town, which stands in front of the hill in this view.)
import { createHill } from '../sets/inside-montage/hillx.js';
import { look, lerpCam, clawdOnScreen, clearFade } from '../sets/inside-montage/crowd.js';
import { EXT, LOOSE, NEAR, FOLD, blendConf, chainPoints, chainColour, NRES, extended } from '../sets/inside-montage/protein.js';
import { HOT, beam } from '../sets/inside-montage/draw.js';
import { HILL, hillH, camBasis, project, rayDir } from '../sets/hill/scene.js';
import { clamp, lerp, smoothstep, hash } from '../lib/util.js';

const F0 = 4619, N = 144, FL = F0 + N - 1, BAR2 = 4691;
const MAIN = { x: 0.9, z: 6.6 }, TREE = { x: -4.1, z: 9.2 };
// the match (sets/paper-kit/MATCH.md, S25b): in the last frame the knot's glow is a compact upright
// shape centred near (960, 640), 50-120 px wide and 150-270 px tall, on the vial's vellum liquid
// (x 934-986, y 520-788). The knot turns side-on to the camera as it packs, so it stands narrow.
const TARGET = { x: 960, y: 646 };
const KNOT_C = [0.9, 6.2, 10.4], KS = 2.7;               // Clawd's knot: centre (world), scale (m per knot unit)
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeIO = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

// ---------------------------------------------------------------- the camera
// bar 65 cranes back from close on Clawd and the crowd (CAM_A) to a wide view of the hill and the
// sky (CAM0), arriving just after the painting starts; bar 66 pushes in to Clawd's knot (CAM1). CAM0
// and CAM1 look at its centre, away from the sun (out of frame on the right), so the paint has the
// cool upper sky behind it. At the end the principal point is set so the folded knot's own
// silhouette is centred on the target.
const CAM_A = look([2.3, 1.7, 1.2], [0.7, 1.3, 8.2], 1250, [960, 640]);   // Clawd about 220 px wide
const CAM0 = look([16.5, 2.6, -16.5], KNOT_C, 1250, [960, 580]), WIDE = 4697;
const END_POS = [13.0, 3.0, -12.0], END_F = 1500;   // (revision 4: from further right, so S24's towers stand clear of the knot)
let CAM1 = look(END_POS, KNOT_C, END_F, [TARGET.x, TARGET.y]);
const camAt = (f) => (f < WIDE ? lerpCam(CAM_A, CAM0, easeIO((f - F0) / (WIDE - F0))) : lerpCam(CAM0, CAM1, easeIO((f - WIDE) / (FL - WIDE))));

// ---------------------------------------------------------------- the fold
// steps: [start frame, length, from, to]; a chain may run a few frames late (its stagger)
const STEPS = [[4710, 12, LOOSE], [4724, 11, NEAR], [4737, 10, FOLD]];   // collapse, gather, pack: snare, chop, snare
function confAt(f, ext, lag = 0) {
  let c = ext, prev = ext;
  for (const [t0, dur, B] of STEPS) {
    const s = t0 + lag;
    if (f >= s) c = f >= s + dur ? B : blendConf(prev, B, easeIO((f - s) / dur));
    prev = B;
  }
  return c;
}
// a chain's frame: turned about the vertical (relative to the camera's heading) and tilted
function chainFrame(C, ks, yaw, tilt) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
  const rot = (p) => { const x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy; return [x, p[1] * ct - z * st, p[1] * st + z * ct]; };
  return { toWorld: (p) => { const r = rot(p); return [C[0] + r[0] * ks, C[1] + r[1] * ks, C[2] + r[2] * ks]; }, dirWorld: rot };
}
// Clawd's knot turns as it folds (mostly while it packs), ending side-on: narrow and upright
const knotFrame = (f) => chainFrame(KNOT_C, KS, camAt(f).yaw + lerp(-0.35, 1.3, smoothstep(4717, 4758, f)), lerp(0.14, 0.05, clamp((f - BAR2) / (FL - BAR2))));
// the folded knot's silhouette on screen at the last frame (band edges included)
function knotBox(cam) {
  const Bc = camBasis(cam), kf = knotFrame(FL), ch = chainPoints(FOLD, kf.toWorld, kf.dirWorld);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  ch.P.forEach((p, i) => {
    const s = ch.S[i], w = ch.W[i] * KS;
    for (const k of [-1, 1]) { const q = project(Bc, [p[0] + s[0] * w * k, p[1] + s[1] * w * k, p[2] + s[2] * w * k]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  });
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
{
  const b = knotBox(CAM1);
  CAM1 = look(END_POS, KNOT_C, END_F, [TARGET.x + (TARGET.x - b.cx), TARGET.y + (TARGET.y - b.cy)]);
}
const PAINT0 = 4692, PAINT_LEN = 15;                          // painted N to C, starting on bar 66's chop

// ---------------------------------------------------------------- the other chains (revision 6)
// Dozens of smaller chains across the sky, all farther from the camera than Clawd's (so his is the
// nearest and largest): laid out on a jittered grid of the end camera's view, clear of his knot and
// above the land, each at 34-56 m and a third to a half his knot's size on screen. They paint in a
// ripple out from his, fold on the same steps a frame or two behind, and turn a little on their own.
const EXT_S = extended(5.0, 0.6, 0.7);
const HERO = (() => {
  const B = camBasis(CAM1), p = project(B, KNOT_C);
  return { sx: p[0], sy: p[1], d: Math.hypot(KNOT_C[0] - B.pos[0], KNOT_C[1] - B.pos[1], KNOT_C[2] - B.pos[2]), box: knotBox(CAM1) };
})();
const CHAINS = (() => {
  const B = camBasis(CAM1), out = [];
  const cols = 8, rows = 4;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const h = (k) => hash(i + 17, j + 5, k);
    const sx = 90 + (i + 0.5 + 0.7 * (h(1) - 0.5)) * (1740 / cols), sy = 90 + (j + 0.5 + 0.6 * (h(2) - 0.5)) * (640 / rows);
    const bx = HERO.box;
    if (sx > bx.x0 - 170 && sx < bx.x1 + 170 && sy > bx.y0 - 150 && sy < bx.y1 + 60) continue;
    const d = 34 + 22 * h(3), r = rayDir(B, sx, sy);
    const C = [B.pos[0] + r[0] * d, B.pos[1] + r[1] * d, B.pos[2] + r[2] * d];
    if (C[1] < hillH(HILL, C[0], C[2]) + 2.5) continue;
    const size = 0.3 + 0.22 * h(4);                          // on screen, relative to his knot
    const lag = Math.round(7 * Math.min(1, Math.hypot(sx - HERO.sx, sy - HERO.sy) / 1100));
    out.push({ C, ks: KS * size * d / HERO.d, yaw0: (h(5) - 0.5) * 0.9, spin: 0.5 + 0.9 * h(6), tilt: (h(7) - 0.5) * 0.35,
      I: 0.82 + 0.26 * h(8), seed: 0.1 + 0.8 * h(9), lag, sx, sy });
  }
  return out;
})();
// a chain's ribbon at frame f (hero: Clawd's knot); glow brightens it, dimK takes a far knot down
function ribbonAt(f, c, glow, dimK) {
  const hero = !c;
  const paint0 = PAINT0 + (hero ? 0 : c.lag);
  const drawn = NRES * easeOut((f - paint0) / PAINT_LEN);
  if (drawn <= 0.01) return null;
  const kf = hero ? knotFrame(f) : chainFrame(c.C, c.ks, camAt(f).yaw + c.yaw0 + c.spin * lerp(-0.3, 1.0, smoothstep(4717 + c.lag, 4758, f)), c.tilt);
  const conf = hero ? confAt(f, EXT) : confAt(f, EXT_S, Math.round(c.lag * 0.4));
  const ch = chainPoints(conf, kf.toWorld, kf.dirWorld);
  // (a far knot goes down to about a quarter with the night, so his knot glows alone, like S25b's one vial)
  const ks = hero ? KS : c.ks, In = hero ? 1 : c.I * lerp(1, 0.26, dimK);
  const n = ch.P.length, col = [], a = [];
  for (let i = 0; i < n; i++) {
    const r = ch.R[i], fr = r / NRES;
    const tip = Math.exp(-Math.max(0, drawn - r) / 3) * (drawn < NRES ? 1 : 0);
    const cc = chainColour(fr), I = (1.35 + 0.8 * glow + 1.4 * tip) * In;
    const hot = clamp(0.18 * glow + tip);
    col.push([lerp(cc[0], 1.0, hot * 0.6) * I, lerp(cc[1], 0.93, hot * 0.6) * I, lerp(cc[2], 0.8, hot * 0.6) * I]);
    a.push(clamp((drawn - r) / 1.5 + 0.5));
  }
  // (the brush texture runs along the chain by residue, so it stays on the paint while loops stretch)
  return { rb: { P: ch.P, S: ch.S, w: ch.W.map((w) => w * ks), bb: ch.BB, col, a, u: ch.R.map((r) => r * 0.2 * ks), seed: hero ? 0.41 : c.seed }, ch, drawn };
}

// ---------------------------------------------------------------- the crowd
let SNARES, CHOPS, CROWD;
const COUNT = [3, 5, 9, 15, 24, 36, 52];                  // after each snare of bar 65
function buildCrowd() {
  // candidates on the hill's face behind and beside Clawd (a jittered lattice), nearest to him first
  const cand = [];
  for (let i = 0; i < 18; i++) for (let j = 0; j < 12; j++) {
    const x = MAIN.x - 5.6 + i * 0.64 + 0.4 * (hash(i, j, 3) - 0.5), z = MAIN.z + 0.35 + j * 0.4 + 0.3 * (hash(i, j, 4) - 0.5);
    if (Math.hypot(x - TREE.x, z - TREE.z) < 1.4) continue;
    cand.push({ x, z, d: Math.hypot((x - MAIN.x) * 0.8, z - MAIN.z) + 0.35 * hash(i, j, 5) });
  }
  cand.sort((a, b) => a.d - b.d);
  const out = [];
  const main = (f) => clawdOnScreen(camAt(f), HILL, MAIN.x, MAIN.z)[2];
  for (const c of cand) {
    if (out.length >= COUNT[COUNT.length - 1] - 1) break;
    let born = Infinity;
    for (let j = 0; j < SNARES.length; j++) if (COUNT[Math.min(j, COUNT.length - 1)] - 1 > out.length) { born = SNARES[j]; break; }
    if (born === Infinity) break;
    // never bigger than Clawd on screen, clear of the others, in frame and in sight when it arrives and at the end
    let ok = !out.some((o) => Math.hypot((o.x - c.x) * 0.9, o.z - c.z) < 0.6);
    for (const f of [born, born + 8, FL]) {
      const [sx, sy, w] = clawdOnScreen(camAt(f), HILL, c.x, c.z);
      if (w > 0.98 * main(f) || sx < 50 || sx > 1870 || sy < 80 || sy > 1050 || clearFade(HILL, camAt(f), c.x, c.z) < 0.95) ok = false;
    }
    if (!ok) continue;
    out.push({ x: c.x, z: c.z, d: Math.hypot(c.x - MAIN.x, c.z - MAIN.z), born, hold: hash(Math.round(c.x * 10), Math.round(c.z * 10), 11) });
  }
  // groups: Clawd and his nearest neighbours hold his chain; the others are dealt out to the other
  // chains in screen order (left to right at the end camera), so each group reaches up to a chain
  // above or beside it
  const B = camBasis(CAM1);
  const sxOf = (o) => project(B, [o.x, hillH(HILL, o.x, o.z) + 0.3, o.z])[0];
  const byDist = out.slice().sort((a, b) => a.d - b.d);
  const heroN = Math.min(6, byDist.length);
  byDist.slice(0, heroN).forEach((o) => { o.chain = -1; });
  const rest = out.filter((o) => o.chain === undefined).sort((a, b) => sxOf(a) - sxOf(b));
  const order = CHAINS.map((c, k) => k).sort((a, b) => CHAINS[a].sx - CHAINS[b].sx);
  rest.forEach((o, i) => { o.chain = order[Math.min(order.length - 1, Math.floor(i * order.length / rest.length))]; });
  return out;
}

// ---------------------------------------------------------------- render
let hill;
export default {
  async setup(ctx) {
    const T = ctx.T, s = T.shot('S25');
    SNARES = T.events('snares').filter((x) => x >= s.f0 && x < s.f1);
    CHOPS = T.events('chops').filter((x) => x >= s.f0 && x < s.f1);
    CROWD = buildCrowd();
    const kb = knotBox(CAM1);
    ctx.log(`S25: crowd ${CROWD.length + 1}, chains ${CHAINS.length + 1}, snares ${SNARES.join(' ')}, chops ${CHOPS.join(' ')}; knot x ${kb.x0.toFixed(0)}-${kb.x1.toFixed(0)} y ${kb.y0.toFixed(0)}-${kb.y1.toFixed(0)}`);
    // strokes laid round the end camera (5 m ahead of it), sized for its lens
    hill = createHill(ctx.canvas, { log: ctx.log, seeding: { origin: [10.6, -7.6], yaw: -0.5, halfAngle: 1.0, d0: 1.0, d1: 140, nearTree: 20, nearTower: 95, fref: 1400 } });
    hill.warm([4]);
  },
  render(ctx, fr) {
    const { T } = ctx, f = fr.f;
    const cam = camAt(f), B = camBasis(cam);
    const sn = T.since('snares', f), chop = T.pulse('chops', f, 6), vox = T.envSmooth('other', f, 3);
    const endK = smoothstep(4746, FL - 2, f);                // the last beat: night falls round the knot
    const glow = 0.25 * chop * (f >= PAINT0 ? 1 : 0) + 0.9 * endK + 0.35 * Math.exp(-Math.max(0, f - 4747) / 5) * (f >= 4747 ? 1 : 0);
    // Clawd's chain, then the others (a far knot glows less, and dims with the night)
    const hero = ribbonAt(f, null, glow, 0);
    const others = CHAINS.map((c) => ribbonAt(f, c, 0.6 * (0.25 * chop * (f >= PAINT0 ? 1 : 0)) + 0.3 * Math.exp(-Math.max(0, f - 4747 - c.lag) / 5) * (f >= 4747 + c.lag ? 1 : 0), endK));
    // beams: each Clawd holds one point of its group's chain, letting go at the end
    const lines = [];
    const beamK = (1 - smoothstep(4748, FL - 4, f));
    const holdPt = (R, h) => { const r = h * (NRES - 1), RR = R.ch.R; let j = 0; while (j < RR.length - 1 && RR[j] < r) j++; return R.ch.P[j]; };
    const mainX = project(B, [MAIN.x, hillH(HILL, MAIN.x, MAIN.z) + 0.28, MAIN.z])[0];
    const crowd = [];
    for (const c of CROWD) {
      if (c.born > f) continue;
      const age = f - c.born;
      const beatHop = 0.05 * Math.max(0, Math.sin(Math.PI * clamp((sn - c.d * 0.35) / 6)));
      const alpha = clamp(age / 3) * clearFade(HILL, cam, c.x, c.z);
      if (alpha <= 0.002) continue;
      const hop = age < 9 ? 0.16 * Math.sin(Math.PI * age / 9) : beatHop;
      const y = hillH(HILL, c.x, c.z);
      const mid = [c.x, y + hop + 0.28, c.z];
      const R = c.chain < 0 ? hero : others[c.chain];
      const holding = R && beamK > 0.01 && c.hold * NRES < R.drawn && age > 2;
      const tgt = R ? holdPt(R, c.hold) : null;
      const bk = R ? beamK * clamp((R.drawn - 2) / 10) : 0;
      if (holding) beam(lines, mid, tgt, 3, 0.75, (0.42 + 0.3 * chop + 0.25 * Math.exp(-sn / 5)) * bk * alpha, HOT, 2.3);
      // (in bar 65 they look to Clawd as they arrive; in bar 66 to the part of the chain they hold)
      const dx = f < PAINT0 || !tgt ? mainX - project(B, mid)[0] : project(B, tgt)[0] - project(B, mid)[0];
      crowd.push({
        x: c.x, z: c.z, form: 'luminous', alpha, hop, look: dx > 60 ? 1 : dx < -60 ? -1 : 0,
        armL: bk > 0.3 ? -2 : 0, armR: bk > 0.3 ? -2 : 0,
        glow: 1.0 + 0.4 * chop + 0.25 * Math.exp(-age / 5), eyeLight: 0.4 + 0.5 * chop,
      });
    }
    // Clawd himself holds his chain's start
    const my = hillH(HILL, MAIN.x, MAIN.z), mHop = 0.06 * Math.max(0, Math.sin(Math.PI * clamp(sn / 6)));
    const mMid = [MAIN.x, my + mHop + 0.28, MAIN.z];
    const mBK = hero ? beamK * clamp((hero.drawn - 2) / 10) : 0;
    if (mBK > 0.01) beam(lines, mMid, holdPt(hero, 0.02), 3, 0.9, (0.6 + 0.4 * chop) * mBK, HOT, 2.8);
    // his knot's own light at the end: an upright glow behind the paint
    if (glow > 0.05) {
      const kc = KNOT_C, h = 0.55 * KS * endK;
      lines.push([kc[0], kc[1] - h, kc[2] + 0.3, kc[0], kc[1] + h, kc[2] + 0.3, 3, 0.22 * glow, 1.0, 0.8, 0.55, 26]);
    }
    // (a touch dimmed throughout, so the paint in the air carries the light; night on the last beat)
    const k = endK, dim = [lerp(0.88, 0.2, k), lerp(0.88, 0.23, k), lerp(0.9, 0.4, k)];
    const ribbons = others.filter(Boolean).map((r) => r.rb);
    if (hero) ribbons.push(hero.rb);
    hill.render({
      // revision 4: the painted-valley look, most of the way to the shelter's palette (S31)
      rung: 4, drift: 0.7, time: 96 + fr.tl, cam, hill: HILL, tree: { x: TREE.x, z: TREE.z, grow: 1 },
      strokeLift: 0.42 * smoothstep(F0 + 6, FL, f),
      clawd: { x: MAIN.x, z: MAIN.z, form: 'luminous', hop: mHop, glow: 1.05 + 0.1 * vox + 0.3 * chop, eyeLight: 0.6 + 0.4 * chop, light: 1.2,
        armL: mBK > 0.3 ? -2 : 0, armR: mBK > 0.3 ? -2 : 0,
        // in bar 65 he glances left and right at the newcomers, snare by snare
        look: f < PAINT0 ? (SNARES.filter((x) => x <= f).length % 2 ? -1 : 1) : 0 },
      crowd, ribbons, lines, dim, ribbonCore: 0.45,
    });
  },
};
