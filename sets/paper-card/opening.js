// The opening bookend as one function of the global frame (S01 frames 0-154, S02 155-298), so the
// two shots agree exactly at their cut. Everything is keyed to the vocal-chop notes of intro A.
//   S01: dark card; the first chop lights the square; the next chops swing the ray flaps back in a
//        clockwise sweep (done by bar 2). The card starts to turn while the rays open, spins through
//        bar 2 and comes to rest half a turn later; on the chop notes its cut edges catch a key light
//        and glint, the glint riding along the rays as they turn.
//   S02: as the card settles, the rays fold shut in a sweep (their light draws back into the hub) while
//        Clawd's cells flip open one by one in a ripple out from the square, a pixel at a time; his legs
//        land on the bar-4 downbeat. Bar 4 lets the light pour (a last few glints on his edges); its
//        last beat flies the camera through the hole into the lit tissue, ending on a warm wash.
// Revision 1 (Claire): the opening felt static; the spin, the glints and the cell ripple answer that.
// Revision 5 (Claire: the human element from the first frame): the humans' indigo paper cursor (the
// one from S08, S10 and S11) comes in from off frame to the lit square and unfolds it. Each fan of
// rays opens under one of its pulls, on a chop note (30, 44, 84, 106): hooked on the fold at the
// square's edge, it drags the fan's long ray outward, the fold's free edge riding its tip (the light
// runs out under it), the fan's other rays following three frames apart; after the release the paper
// springs the rest of the way open. It withdraws as the burst turns and glints, and is gone by frame
// 146: from 147 on, and through S02's bar 3, every frame is as before.
// The pretraining command (after Claire): in S02's bar 4 the humans' cursor returns to Clawd's shape
// and types `train(corpus)` (the rhyme is S13's `agent = clawd` / `train()`) in the humans' code
// panel, S13's (sets/valley/papercursor.js panel, drawn by shots/S02.js from st.panel), one keystroke
// per character with the caret. On the last beat it clicks: the panel flashes as S13's clicks do,
// the light surges through Clawd's shape, the camera flies through as before and the cursor
// withdraws. The last frame (the warm wash) is unchanged.
import { smoothstep, clamp, hash } from '../../lib/util.js';
import { GLYPH } from '../../lib/clawd.js';
import { SPARK, CARD_GEOM } from '../../lib/spark.js';

const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const smoother = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
// a flap swing that starts on the note: quick first, settling like paper (no overshoot)
const swing = (f, f0, dur) => (f < f0 ? 0 : easeOut((f - f0) / dur));

// S01: the fans of rays, in the order the cursor opens them (a clockwise sweep from the top)
const OPEN_ORDER = [[0, 1, 2], [3, 4, 5], [6, 7], [8, 9, 10]];
const STAGGER_OPEN = 3;
// the cursor's pulls, one per fan: the chop (index into intro A's chops), the ray it drags (the fan's
// first, long one), how far it drags it (fraction of the ray) and for how long (frames)
const PULLS = [
  { ci: 1, ray: 0, p1: 0.40, drag: 7 },     // chop 30: the fan at the top, pulled up
  { ci: 3, ray: 3, p1: 0.46, drag: 8 },     // chop 44: the fan on the right
  { ci: 4, ray: 6, p1: 0.56, drag: 10 },    // chop 84: the fan below (the card has begun to turn)
  { ci: 6, ray: 8, p1: 0.56, drag: 10 },    // chop 106: the fan on the left
];
const SPRING = 12;                          // after the release the paper springs open over this
const LRAY = (j) => CARD_GEOM.Lmax * SPARK[j].len;
// where a fold's free edge starts on its ray's axis: its region is its capsule minus the square and
// minus the capsules cut before it (card.js regionSD, in JS); with opening o the edge is at
// start + o (L - start), and the cursor's tip rides it
const FOLD_START = (() => {
  const G = CARD_GEOM, rank = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const ray = SPARK.map((r) => { const a = r.a * Math.PI / 180; return { d: [Math.cos(a), Math.sin(a)], L: G.Lmax * r.len, r1: G.base * r.w, r2: G.base * r.w * G.tip }; });
  const cap = (w, i) => {                          // sdUnevenCapsule along the ray's axis
    const R = ray[i], x = Math.abs(-R.d[1] * w[0] + R.d[0] * w[1]), y = R.d[0] * w[0] + R.d[1] * w[1];
    const b = (R.r1 - R.r2) / R.L, a = Math.sqrt(1 - b * b), k = -b * x + a * y;
    if (k < 0) return Math.hypot(x, y) - R.r1;
    if (k > a * R.L) return Math.hypot(x, y - R.L) - R.r2;
    return a * x + b * y - R.r1;
  };
  const sq = (w) => { const dx = Math.abs(w[0]) - G.cell, dy = Math.abs(w[1]) - G.cell; return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0); };
  return ray.map((R, j) => {
    for (let s = 0; s < R.L; s += 0.25) {
      const w = [R.d[0] * s, R.d[1] * s];
      let d = Math.max(cap(w, j), -sq(w));
      for (let i = 0; i < 11; i++) if (rank[i] < rank[j]) d = Math.max(d, -cap(w, i));
      if (d < 0) return s;
    }
    return 0;
  });
})();
// a fold's opening, t frames after its pull began: it follows the drag, then springs open
function pullOpen(t, g) {
  if (t < 0) return 0;
  if (t < g.drag) { const u = t / g.drag; return g.p1 * (1 - (1 - u) * (1 - u)); }
  if (t >= g.drag + SPRING) return 1;
  return g.p1 + (1 - g.p1) * easeOut((t - g.drag) / SPRING);
}
// cut order = flap precedence where capsules overlap near the hub (earlier flaps own the overlap)
export const RANK = (() => { const r = new Array(11).fill(0); OPEN_ORDER.flat().forEach((j, k) => { r[j] = k; }); return r; })();

// the spin: half a turn clockwise, easing in while the rays open and out as Clawd is cut
export const SPIN0 = 40, SPIN1 = 205, SPIN = Math.PI;
export const spinAt = (f) => SPIN * smoother((f - SPIN0) / (SPIN1 - SPIN0));

// S02: the rays close in a clockwise sweep from the one on top at rest (ray 6, turned half round)
const CLOSE_ORDER = [6, 7, 8, 9, 10, 0, 1, 2, 3, 4, 5];
const F_CLOSE = 188, STAGGER_CLOSE = 2, DUR_CLOSE = 12;
// Clawd's cells: a ripple out from the square (1.9 frames per cell width), legs on the bar-4 downbeat
const F_RIPPLE = 190, RIPPLE_RATE = 1.9, DUR_CELL = 10, F_LEGS = 228, DUR_LEG = 8;
const CELL_T = (() => {       // start frame for each glyph cell (-1: not a cell or the square)
  const t = new Array(90).fill(-1);
  let leg = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 18; c++) {
    if (GLYPH[r][c] !== '#' || (r === 2 && (c === 8 || c === 9))) continue;
    if (r === 4) { t[r * 18 + c] = F_LEGS + 2 * leg++; continue; }
    const dx = Math.max(Math.abs(c + 0.5 - 9) - 1, 0), dy = Math.max(Math.abs(r + 0.5 - 2.5) * 2 - 1, 0);
    t[r * 18 + c] = F_RIPPLE + RIPPLE_RATE * Math.hypot(dx, dy);
  }
  return t;
})();
// glints: which chops make the key light flash on the cut edges, and how strongly
const GLINT_FROM = 84, GLINT_TO = 280;
const glintGain = (c) => (c < 200 ? 1.0 : 0.55);
const KEY = Math.atan2(-0.8, -0.6);          // the key light sits up and to the left

export const F_S02 = 155, F_FLY = 281, F_END = 298;

// ---- the cursor's path (S01). Positions are the arrow's tip in 1920-frame px.
const HUB = [960, 540];
const CUR_IN = [1330, 1125], CUR_OUT = [1560, 1215];     // off frame, bottom right: where the hand is
const ENTER = [12, 28], EXIT = [118, 146];
const easeIn = (x) => Math.pow(clamp(x), 3);
const lerp2 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
const mcAt = (f, fLight) => 1 + 0.035 * smoothstep(fLight, 227, f);          // the card's magnification
function cardPoint(j, r, f, fLight) {                                          // ray j at radius r, on screen
  const a = SPARK[j].a * Math.PI / 180 + spinAt(f), m = mcAt(f, fLight) * r;
  return [HUB[0] + m * Math.cos(a), HUB[1] + m * Math.sin(a)];
}
function cursorAt(f, C, fLight) {
  const edge = (j, o) => FOLD_START[j] + o * (LRAY(j) - FOLD_START[j]) + 1.5;  // the free edge, just past it
  const hook = (k, ff) => cardPoint(PULLS[k].ray, edge(PULLS[k].ray, 0), ff, fLight);
  const tip = (k, ff) => { const g = PULLS[k]; return cardPoint(g.ray, edge(g.ray, pullOpen(ff - C[k], g)), ff, fLight); };
  const rel = (k) => tip(k, C[k] + PULLS[k].drag);                            // where it lets go
  const pressIn = (ff, c) => clamp((ff - (c - 2)) / 2), pressOut = (t) => 1 - clamp(t / 3);
  if (f < ENTER[0]) return { p: CUR_IN, press: 0 };
  if (f < C[0] - 2) {                                                          // in from off frame, settling
    const u = 1 - Math.pow(1 - clamp((f - ENTER[0]) / (C[0] - 2 - ENTER[0])), 2.4);
    return { p: lerp2(CUR_IN, hook(0, f), u), press: 0 };
  }
  for (let k = 0; k < PULLS.length; k++) {
    const g = PULLS[k], c = C[k];
    if (f < c) return { p: hook(k, f), press: pressIn(f, c) };                // hooked on the fold
    if (f < c + g.drag) return { p: tip(k, f), press: 1 };                    // the pull
    if (k + 1 < PULLS.length && f < C[k + 1] - 2) {                           // across to the next fold
      const u = easeInOut((f - c - g.drag) / (C[k + 1] - 2 - c - g.drag));
      return { p: lerp2(rel(k), hook(k + 1, f), u), press: pressOut(f - c - g.drag) };
    }
  }
  const k = PULLS.length - 1, t = f - C[k] - PULLS[k].drag;
  if (f < EXIT[0]) return { p: rel(k), press: pressOut(t) };                  // a beat's rest, then away
  return { p: lerp2(rel(k), CUR_OUT, easeIn((f - EXIT[0]) / (EXIT[1] - EXIT[0]))), press: 0 };
}
// five moments across a half-open shutter (motion blur), or null when it is off frame
const SHUTTER = [-0.25, -0.125, 0, 0.125, 0.25], CUR_SCALE = 1.5;
function cursorState(f, c1, fLight) {
  if (f < ENTER[0] || f > EXIT[1]) return null;
  const C = PULLS.map((g) => c1[g.ci]);
  return { samples: SHUTTER.map((d) => { const s = cursorAt(f + d, C, fLight); return [s.p[0], s.p[1], CUR_SCALE * mcAt(f + d, fLight) * (1 - 0.05 * s.press), s.press]; }) };
}

// ---- S02 bar 4: the command. One keystroke per character (a quick run for `train`, a pause, then
// `(corpus)`, landing on the chops at 235, 253 and 271 and the snare at 276); the click on 281.
export const CMD = 'train(corpus)';
const KEYS = [235, 238, 241, 244, 247, 253, 256, 259, 262, 265, 268, 271, 276];
const F_CLICK = 281, CMD_IN = [227, 234], CMD_OUT = [283, 293];
const surgeAt = (f) => (f < F_CLICK ? 0 : 0.55 * Math.exp(-(f - F_CLICK) / 5) * (1 - smoothstep(287, 295, f)));
// the cursor's tip rests on Clawd's shape, low on his right side (card px, Clawd's frame), and
// presses there on the click
const TIP = [200, 88];
const cmdPress = (f) => Math.exp(-Math.pow((f - F_CLICK) / 1.3, 2));
// It lies on the card, so it rides the card's magnification (mcOf), the fly-through included: after
// the click it lifts away toward the hand as the card rushes past, and is gone before the card plane.
function cmdAt(ff, mcOf) {
  const mc = mcOf(ff), w = easeIn((ff - CMD_OUT[0]) / (CMD_OUT[1] - CMD_OUT[0]));
  const tp = ff >= CMD_OUT[0] ? [TIP[0] + 160 * w, TIP[1] + 220 * w] : TIP;
  const onCard = [960 + mc * tp[0], 540 + mc * tp[1]];
  if (ff < CMD_IN[1]) return { p: lerp2(CUR_IN, onCard, 1 - Math.pow(1 - clamp((ff - CMD_IN[0]) / (CMD_IN[1] - CMD_IN[0])), 2.4)), press: 0, mc };
  return { p: onCard, press: ff >= CMD_OUT[0] ? 0 : cmdPress(ff), mc };
}
function cmdCursor(f, mcOf) {
  if (f < CMD_IN[0] || f > CMD_OUT[1]) return null;
  const S = SHUTTER.map((d) => cmdAt(f + d, mcOf));
  if (S.every((s) => s.p[0] > 2040 || s.p[1] > 1180)) return null;     // off frame
  return { samples: S.map((s) => [s.p[0], s.p[1], CUR_SCALE * s.mc * (1 - 0.05 * s.press), s.press]), rimD: 3.0, cool: 0.22 };
}
// the code panel (S13's recipe): beside the cursor's tip, opening as the typing starts, one character
// per keystroke with the caret, flashing on the click, then folding away
function cmdPanel(f, mcOf) {
  const t0 = KEYS[0] - 1;
  const open = easeOut(clamp((f - t0 + 2) / 3)) * (1 - easeInOut(clamp((f - F_CLICK - 1) / 4)));
  if (f < t0 - 2 || open <= 0.001) return null;
  const tip = cmdAt(f, mcOf).p, n = KEYS.filter((k) => f >= k).length;
  return { x: tip[0] + 60, y: tip[1] + 34, text: CMD, open, typed: n / CMD.length, caret: f < F_CLICK,
    flash: Math.exp(-Math.pow((f - F_CLICK) / 4, 2)) * (f >= F_CLICK - 2 ? 1 : 0) };
}

export function openingState(T, f) {
  const chops = T.events('chops');
  const c1 = chops.filter((x) => x < 155);          // 11, 30, 35, 44, 84, 102, 106, 116, 147
  const fLight = c1[0];
  // the lamp behind the tissue warms up on the first note, then breathes a little with the voice
  const on = f < fLight ? 0 : 1 - Math.exp(-(f - fLight) / 5.5);
  const warm = f < fLight ? 0 : 0.34 + 0.66 * smoothstep(0, 130, f - fLight);
  const breath = 0.95 + 0.07 * T.envSmooth('vocals', f, 3);
  let light = on * warm * breath;
  // ray flaps: open in S01, close in S02
  const rays = new Array(11).fill(0);
  OPEN_ORDER.forEach((ids, k) => { const g = PULLS[k]; ids.forEach((j, m) => { rays[j] = pullOpen(f - c1[g.ci] - STAGGER_OPEN * m, g); }); });
  CLOSE_ORDER.forEach((j, k) => { rays[j] = Math.min(rays[j], 1 - swing(f, F_CLOSE + STAGGER_CLOSE * k, DUR_CLOSE)); });
  // Clawd's cells
  const cells = CELL_T.map((t0, i) => (t0 < 0 ? 0 : swing(f, t0, i >= 72 ? DUR_LEG : DUR_CELL)));
  // the spin and its motion blur (half-open shutter)
  const rot = spinAt(f), rotSpan = 0.5 * (spinAt(f + 0.5) - spinAt(f - 0.5));
  // glints: the latest chop's flash (each from a slightly different key direction) over a faint
  // shimmer while the card turns
  let gI = 0.35 * clamp(Math.abs(rotSpan) / 0.012), gDir = KEY;
  for (const c of chops) {
    if (c < GLINT_FROM || c > GLINT_TO || c > f) continue;
    const d = f - c, p = (1 - Math.exp(-d / 1.0)) * Math.exp(-d / 8);
    if (p > 0.02) { gI = Math.max(gI, 1.6 * glintGain(c) * p + 0.35 * clamp(Math.abs(rotSpan) / 0.012)); gDir = KEY + (hash(c, 7) - 0.5) * 1.5; }
  }
  // camera: locked, with a slow push through S01-S02 bar 3, a firmer one in bar 4, then the fly-through
  const D0 = 1, gap = 0.3;
  const dAt = (ff) => {
    if (ff < F_FLY) return D0 / (1 + 0.035 * smoothstep(fLight, 227, ff) + 0.10 * easeInOut((ff - 227) / (F_FLY - 227)));
    const u = (ff - F_FLY) / (F_END - F_FLY), Dfly = D0 / 1.135, travel = Dfly + 0.93 * gap;
    return Dfly - travel * (1 - Math.pow(1 - u, 1.6));
  };
  let D = D0 / (1 + 0.035 * smoothstep(fLight, 227, f) + 0.10 * easeInOut((f - 227) / (F_FLY - 227)));
  let cardOn = 1, exposure = 1, haze = 0.045, god = 0.12;
  // bar 4: the light pours through the glyph (and surges on the command's click)
  const pour = smoothstep(222, 250, f);
  light *= 1 + 0.12 * pour + surgeAt(f);
  haze += 0.03 * pour; god += 0.10 * pour;
  if (f >= F_FLY) {
    // the last beat: fly through the Clawd hole (card plane at u ~ 0.62), then into the tissue's light
    const u = (f - F_FLY) / (F_END - F_FLY);
    const Dfly = D0 / 1.135, travel = Dfly + 0.93 * gap;
    D = Dfly - travel * (1 - Math.pow(1 - u, 1.6));      // crosses the card plane at u ~ 0.6
    if (D <= 0.004) cardOn = 0;
    exposure = 1 + 0.12 * smoothstep(0.5, 1, u);
  }
  const mc = cardOn ? D0 / Math.max(D, 0.004) : 1;
  const mt = (D0 + gap) / (D + gap);
  // the lamp: a hot small core for the spark, broadening to an even Claude-orange for the glyph
  const lb = smoothstep(174, 232, f);
  const lamp = [1.9 + (0.55 - 1.9) * lb, 95 + (170 - 95) * lb, 1.05 + (0.82 - 1.05) * lb, 380 + (720 - 380) * lb];
  // the command's cursor rides the card (its magnification, the push and the fly-through); its panel
  // is drawn over the card render by S02
  const mcOf = (ff) => D0 / Math.max(dAt(ff), 0.004);
  const cursor = f < 155 ? cursorState(f, c1, fLight) : (cardOn ? cmdCursor(f, mcOf) : null);
  const panel = f < 155 || !cardOn ? null : cmdPanel(f, mcOf);
  return { light, lamp, rays, rank: RANK, cells, rot, rotSpan, glint: [gI, gDir, 5], mc, mt,
    cc: [960, 540], tc: [960, 540], cardOn, exposure, haze, god, seed: f % 97, cursor, panel };
}
