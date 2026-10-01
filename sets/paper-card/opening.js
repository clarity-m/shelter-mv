// The opening bookend as one function of the global frame (S01 frames 0-154, S02 155-316), so the
// two shots agree exactly at their cut. Everything is keyed to the vocal-chop notes of intro A.
//   S01 (R22; Claire: "ideally, the cursor draws the outline, the paper folds in after"): dark card; the
//        first chop lights the square. The humans' indigo paper cursor is the maker. It swoops in from the
//        bottom right and draws the starburst's outline with its tip in one continuous stroke, clockwise from
//        the top: a thin line of light cut into the card only where the tip has passed. Its pace breathes like
//        a hand's (R23): quick along the straight edges, easing into the tips and corners, surging on the
//        beats. Behind the pen the paper folds in ray by ray (R24; Claire: fold ray by ray, as the closing
//        scene closes): each ray's flap swings in about its crease just after the pen finishes its outline,
//        the light arriving as it lands; the last ray of each of cut 18's fans lands on a chop (44, 84, 116,
//        147) with the full flash, so the hits are still folds. Then the cursor lifts out between the top
//        rays. The card does not turn; the chops glint.
//   S02: the rays fold shut in a sweep from the top (their light draws back into the hub) while Clawd's
//        cells flip open one by one in a ripple out from the square, a pixel at a time; his legs land on
//        the bar-4 downbeat. Bar 4 lets the light pour. The humans' cursor comes back, hovers over his shape
//        and settles, types `train(corpus)` in its code panel, lifts a moment, and clicks on the bar-5 kick
//        (299, R20: S02 is a beat longer): a burst of warm light from its tip floods the frame as the camera
//        flies through the hole into the lit tissue, ending on the warm wash (316) that S03 dissolves from.
// Earlier revisions: 1 (the opening felt static: glints and the cell ripple; the spin, now gone), 5 (the
// humans' cursor from the first frame), the pretraining command (the rhyme is S13's `agent = clawd` /
// `train()`), R19 (the click is a burst of light; card.js st.burst), R20 (no spin; S01 briefly had the
// cursor draw the whole outline before a fill wave), R21 (cut 18's pulls again, each outline leading its fill),
// R22-R23 (the folds went fan by fan, a fan's flaps landing together on its chop).
import { smoothstep, clamp, hash } from '../../lib/util.js';
import { GLYPH } from '../../lib/clawd.js';
import { SPARK, CARD_GEOM } from '../../lib/spark.js';

const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeIn = (x) => Math.pow(clamp(x), 3);
const lerp2 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
// a flap swing that starts on the note: quick first, settling like paper (no overshoot)
const swing = (f, f0, dur) => (f < f0 ? 0 : easeOut((f - f0) / dur));

// flap precedence where the rays' capsules overlap near the hub (earlier flaps own the overlap). S33
// imports it; it is the identity it has always been.
export const RANK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ---- S01's outlines. Per ray (card px, the spark's frame): its axis, length and radii; where its two sides
// come free of its neighbours (u0a on its counter-clockwise side, u0b on its clockwise side, fractions of its
// length); and its free outline, out along the ccw side, round the tip, back along the cw side, as a
// parameter s 0..1 (the tip spans sa..sb). card.js draws the kerf from the same numbers (st.kerf.geom).
const G = CARD_GEOM;
const RG = SPARK.map((r) => { const a = r.a * Math.PI / 180; return { d: [Math.cos(a), Math.sin(a)], p: [-Math.sin(a), Math.cos(a)], L: G.Lmax * r.len, r1: G.base * r.w, r2: G.base * r.w * G.tip }; });
function capSD(w, i) {                             // card.js's sdUnevenCapsule along ray i's axis
  const Q = RG[i], x = Math.abs(-Q.d[1] * w[0] + Q.d[0] * w[1]), y = Q.d[0] * w[0] + Q.d[1] * w[1];
  const b = (Q.r1 - Q.r2) / Q.L, a = Math.sqrt(1 - b * b), k = -b * x + a * y;
  if (k < 0) return Math.hypot(x, y) - Q.r1;
  if (k > a * Q.L) return Math.hypot(x, y - Q.L) - Q.r2;
  return a * x + b * y - Q.r1;
}
const sqSD = (w) => { const dx = Math.abs(w[0]) - G.cell, dy = Math.abs(w[1]) - G.cell; return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0); };
const sidePt = (j, u, sg) => { const Q = RG[j], x = u * Q.L, r = Q.r1 + (Q.r2 - Q.r1) * u; return [Q.d[0] * x + sg * r * Q.p[0], Q.d[1] * x + sg * r * Q.p[1]]; };
const OUT = RG.map((Q, j) => {
  const free = (w) => sqSD(w) > 0.3 && RG.every((_, i) => i === j || capSD(w, i) > 0.3);
  const u0 = [-1, 1].map((sg) => {
    for (let u = 0; u <= 1; u += 0.002) { let ok = true; for (let v = u; v <= Math.min(1, u + 0.05); v += 0.01) if (!free(sidePt(j, v, sg))) { ok = false; break; } if (ok) return u; }
    return 1;
  });
  const Aa = (1 - u0[0]) * Q.L, Ac = Math.PI * Q.r2, Ab = (1 - u0[1]) * Q.L, A = Aa + Ac + Ab;
  return { u0a: u0[0], u0b: u0[1], sa: Aa / A, sb: (Aa + Ac) / A, Aa, Ac, Ab };
});
const KERF_GEOM = new Float32Array(OUT.flatMap((o) => [o.u0a, o.u0b, o.sa, o.sb]));
// the pen's point on ray j's outline at s (card px)
function penPt(j, s) {
  const o = OUT[j], Q = RG[j];
  if (s <= o.sa) return sidePt(j, o.u0a + (1 - o.u0a) * s / o.sa, -1);
  if (s >= o.sb) return sidePt(j, 1 - (1 - o.u0b) * (s - o.sb) / (1 - o.sb), 1);
  const th = -Math.PI / 2 + Math.PI * (s - o.sa) / (o.sb - o.sa);          // ccw side, the far end, cw side
  return [Q.d[0] * Q.L + Q.r2 * (Math.cos(th) * Q.d[0] + Math.sin(th) * Q.p[0]), Q.d[1] * Q.L + Q.r2 * (Math.cos(th) * Q.d[1] + Math.sin(th) * Q.p[1])];
}
// ---- S01 (R22): the pen draws round the star clockwise from the top in one stroke. Its pace is set per fan, cut
// 18's fans re-cut to the pen: the top ray, then four, three and three rays, each fan's last corner landing
// LEADIN frames before its chop (intro A's chops 3, 4, 7 and 8: 44, 84 on the bar-2 downbeat, 116 and 147).
// (R24) The folds go ray by ray: each ray's flap folds in over FOLD frames, swinging faster as it goes, and lands
// LEADIN frames after the pen finishes its outline, so each fan's last ray lands on the fan's chop. The light
// arrives with a flash as it lands: full on the chops, softer between (FLASH_I).
const SEGS = [{ rays: [0], ci: 3 }, { rays: [1, 2, 3, 4], ci: 4 }, { rays: [5, 6, 7], ci: 7 }, { rays: [8, 9, 10], ci: 8 }];
const SEG_OF = RG.map((_, j) => SEGS.findIndex((g) => g.rays.includes(j)));
const DRAW = [20, 140], FOLD = 6, FLASH = 7, LEADIN = 7;   // the stroke; a ray's fold lands LEADIN after its last corner
const FLASH_I = { chop: 0.9, between: 0.4 };               // the landing flash's strength
const ON_CHOP = RG.map((_, j) => { const g = SEGS[SEG_OF[j]]; return j === g.rays[g.rays.length - 1]; });   // 0, 4, 7, 10
const DRAW_K = new Float32Array(RG.map((_, j) => j));    // the stroke visits the rays in order
// (R23; Claire: "speed up/slow down the rate of the cursor drawing to match beat and unfolding shape") the pen's
// pace breathes. Along the stroke, a hand's speed: quick on the long straight edges, braking into the tips and
// the V corners between rays (speed as the square root of the distance to the corner: a steady deceleration)
// and away again. In time, a surge rising just before each beat, sized to how much of that fan there is to
// draw. Each fan's pace is solved (bisection) so its last corner lands exactly LEADIN frames before its chop.
// The table is built once from the timeline's own beats and chops, so a frame stays a pure function of f.
let acc = 0;
const PATH = OUT.map((o) => { const r = { s0: acc, Aa: o.Aa, Ac: o.Ac, Ab: o.Ab, A: o.Aa + o.Ac + o.Ab }; acc += r.A; return r; });
const SIG_END = acc;
const HAND = { D: 110, v0: 8, t0: 24 }, SURGE = { a0: 0.15, a1: 0.35, tau: 4.5, lead: 2 }, PACE_DT = 1 / 16;
const rayAtSig = (sig) => { for (let j = 10; j > 0; j--) if (sig >= PATH[j].s0) return j; return 0; };
function handAt(sig) {                             // 0..1: the hand's speed here, from the nearest corner
  const R = PATH[rayAtSig(sig)], l = sig - R.s0;
  const dV = Math.min(l, R.A - l), dT = l < R.Aa ? R.Aa - l : l > R.Aa + R.Ac ? l - R.Aa - R.Ac : 0;
  return Math.min(1, Math.sqrt((dV + HAND.v0) / HAND.D), Math.sqrt((dT + HAND.t0) / HAND.D));
}
let PACE = null;
function paceTable(c1, beats) {
  const lens = SEGS.map((g) => g.rays.reduce((a, j) => a + PATH[j].A, 0)), lmax = Math.max(...lens);
  const alpha = (x) => (x > 0 ? x * Math.exp(1 - x) : 0);
  const ease = (t) => smoothstep(DRAW[0], DRAW[0] + 3, t) * (1 - smoothstep(DRAW[1] - 6, DRAW[1], t));
  const table = [0];
  SEGS.forEach((g, k) => {
    const t0 = k ? c1[SEGS[k - 1].ci] - LEADIN : DRAW[0], t1 = c1[g.ci] - LEADIN;
    const s0 = PATH[g.rays[0]].s0, last = PATH[g.rays[g.rays.length - 1]], s1 = last.s0 + last.A;
    const amp = SURGE.a0 + SURGE.a1 * lens[k] / lmax, n = Math.round((t1 - t0) / PACE_DT);
    const surge = (t) => 1 + amp * beats.reduce((s, b) => s + alpha((t - b + SURGE.lead) / SURGE.tau), 0);
    const run = (S, rec) => {
      let s = s0;
      for (let i = 0; i < n; i++) { const t = t0 + (i + 0.5) * PACE_DT; s += S * handAt(Math.min(s, SIG_END - 1e-6)) * surge(t) * ease(t) * PACE_DT; if (rec) rec.push(s); }
      return s;
    };
    let lo = 0.1, hi = 400;
    for (let it = 0; it < 60; it++) { const mid = (lo + hi) / 2; if (run(mid) < s1) lo = mid; else hi = mid; }
    const rec = []; run((lo + hi) / 2, rec);
    for (const s of rec) table.push(Math.min(s, s1));
  });
  return table;
}
// the pen at frame f: its ray j and the outline parameter s there (card.js's kerf parameter)
function drawAt(f) {
  const x = (f - DRAW[0]) / PACE_DT, tb = PACE, i = Math.floor(x);
  const sig = x <= 0 ? 0 : x >= tb.length - 1 ? SIG_END : tb[i] + (tb[i + 1] - tb[i]) * (x - i);
  const j = rayAtSig(sig), R = PATH[j], o = OUT[j], l = Math.min(Math.max(sig - R.s0, 0), R.A);
  const s = l < R.Aa ? o.sa * l / R.Aa : l < R.Aa + R.Ac ? o.sa + (o.sb - o.sa) * (l - R.Aa) / R.Ac : o.sb + (1 - o.sb) * (l - R.Aa - R.Ac) / R.Ab;
  return { j, s, draw: j + s };
}
// (R24) each ray's landing: LEADIN frames after the pen closes its outline (the pace table inverted); a fan's last ray
// lands exactly on the fan's chop. Built once, with the pace.
let LAND = null;
function landTable(c1) {
  const tb = PACE;
  return RG.map((_, j) => {
    if (ON_CHOP[j]) return c1[SEGS[SEG_OF[j]].ci];
    const end = PATH[j].s0 + PATH[j].A;
    let i = 0;
    while (i < tb.length - 2 && tb[i + 1] < end) i++;
    return DRAW[0] + (i + clamp((end - tb[i]) / Math.max(tb[i + 1] - tb[i], 1e-9))) * PACE_DT + LEADIN;
  });
}
// a flap's fold: it swings in about its crease at the tip (card.js's opening o), slow and then faster, landing at land
const foldAt = (f, land) => Math.pow(clamp((f - (land - FOLD)) / FOLD), 1.8);
// the light arriving as it lands
const flashAt = (f, land) => (f < land || f > land + FLASH ? 0 : Math.pow(1 - (f - land) / FLASH, 2));

// S02: the rays close in a clockwise sweep from the top
const CLOSE_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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
const GLINT_FROM = 44, GLINT_TO = 298;
const glintGain = (c) => (c < 200 ? 1.0 : 0.55);
const KEY = Math.atan2(-0.8, -0.6);          // the key light sits up and to the left

export const F_S02 = 155, F_FLY = 299, F_END = 316;

// ---- the cursor (S01, R22). Positions are the arrow's tip in 1920-frame px. Its angle never changes.
const HUB = [960, 540];
const CUR_IN = [1330, 1125];                              // off frame, bottom right: where the hand is
const ENTER = [12, 19], PRESS = [17, 20], PEN_UP = [DRAW[1], DRAW[1] + 3], EXIT = [DRAW[1], 153];
const mcAt = (f, fLight) => 1 + 0.035 * smoothstep(fLight, 227, f);          // the card's magnification
const onScreen = (w, f, fLight) => { const m = mcAt(f, fLight); return [HUB[0] + m * w[0], HUB[1] + m * w[1]]; };
const PEN0 = penPt(0, 0), PEN1 = penPt(10, 1);            // the stroke starts and ends in the valley of rays 10 and 0
const OUT_DIR = (() => { const a = (SPARK[10].a - 360 + SPARK[0].a) / 2 * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; })();
function cursorAt(f, fLight) {
  if (f < ENTER[0]) return { p: CUR_IN, press: 0 };
  if (f < ENTER[1]) {                                                         // swoops in from the hand, slowing
    const u = 1 - Math.pow(1 - clamp((f - ENTER[0]) / (ENTER[1] - ENTER[0])), 2.4);
    return { p: lerp2(CUR_IN, onScreen(PEN0, f, fLight), u), press: smoothstep(PRESS[0], PRESS[1], f) };
  }
  if (f < DRAW[0]) return { p: onScreen(PEN0, f, fLight), press: smoothstep(PRESS[0], PRESS[1], f) };
  if (f < EXIT[0]) { const d = drawAt(f); return { p: onScreen(penPt(d.j, d.s), f, fLight), press: 1 }; }   // draws
  const e = PEN1, k = 720 * Math.pow(clamp((f - EXIT[0]) / (EXIT[1] - EXIT[0])), 2);                      // lifts, out between the top rays
  return { p: onScreen([e[0] + OUT_DIR[0] * k, e[1] + OUT_DIR[1] * k], f, fLight), press: 1 - smoothstep(PEN_UP[0], PEN_UP[1], f) };
}
// five moments across a half-open shutter (motion blur), or null when it is off frame
const SHUTTER = [-0.25, -0.125, 0, 0.125, 0.25], CUR_SCALE = 1.5;
// (R20) over the dark card the paper cursor is the lighter dusk slate with a cool edge, so it reads
const DUSK = [0x2D, 0x36, 0x56].map((v) => Math.pow(v / 255, 2.2));
function cursorState(f, fLight) {
  if (f < ENTER[0] || f > EXIT[1]) return null;
  return { samples: SHUTTER.map((d) => { const s = cursorAt(f + d, fLight); return [s.p[0], s.p[1], CUR_SCALE * mcAt(f + d, fLight) * (1 - 0.05 * s.press), s.press]; }),
    col: DUSK, cool: 0.32, rimD: 3.0 };
}
// the outline for card.js (st.kerf): drawn where the pen has passed, each ray's line fading as its flap folds;
// the pen's spark while it draws (a flare on the chops); each ray's landing light. Nothing is left by 154.
function kerfState(T, f) {
  if (f < DRAW[0] - 1 || f >= 154) return null;
  const d = f < DRAW[0] ? { j: 0, s: 0, draw: 0 } : drawAt(f);
  const drawing = smoothstep(DRAW[0] - 1, DRAW[0] + 1, f) * (1 - smoothstep(DRAW[1], PEN_UP[1], f));
  return { draw: d.draw, drawK: DRAW_K, geom: KERF_GEOM, line: 1.6, width: 0.9, fill: new Array(11).fill(0), fillI: 0,
    pen: penPt(d.j, d.s), penI: drawing * (0.55 + 0.6 * T.pulse('chops', f, 5)), penR: 8,
    flash: RG.map((_, j) => (ON_CHOP[j] ? FLASH_I.chop : FLASH_I.between) * flashAt(f, LAND[j])) };
}

// ---- S02 bar 4 (R20: a beat longer). The cursor comes back to Clawd's shape, drifting in a small loop
// over it as it slows and settling on its spot (227-253); it types `train(corpus)`, one key per character
// (`train` from the chop at 253, `(` on the chop at 271, `)` on the chop at 289); it lifts a little and
// waits (290-297), and clicks on the bar-5 kick (299), so the flash lands on the drop.
export const CMD = 'train(corpus)';
const KEYS = [253, 256, 259, 262, 265, 271, 274, 276, 279, 282, 285, 287, 289];
const F_CLICK = 299, CMD_IN = [227, 246], HOVER = [233, 253], LIFT = [290, 294, 296.5, 299], CMD_END = 311;
const surgeAt = (f) => (f < F_CLICK ? 0 : 0.55 * Math.exp(-(f - F_CLICK) / 5) * (1 - smoothstep(F_CLICK + 6, F_CLICK + 14, f)));
// the cursor's tip rests on Clawd's shape, low on his right side (card px, Clawd's frame), and
// presses there on the click
const TIP = [200, 88];
const cmdPress = (f) => Math.exp(-Math.pow((f - F_CLICK) / 1.3, 2));
const liftAt = (f) => smoothstep(LIFT[0], LIFT[1], f) * (1 - smoothstep(LIFT[2], LIFT[3], f));
// It lies on the card, so it rides the card's magnification (mcOf), the fly-through included: (R19) after
// the click it stays on his shape, dissolving in the burst, and the rushing card carries it off frame.
function cmdAt(ff, mcOf) {
  const mc = mcOf(ff), on = (t) => [960 + mc * t[0], 540 + mc * t[1]];
  // in from the hand (slowing to rest by 246), with a small loop over his shape as it arrives
  const u = clamp((ff - CMD_IN[0]) / (CMD_IN[1] - CMD_IN[0])), g = Math.pow(1 - u, 2.4);
  const x = clamp((ff - HOVER[0]) / (HOVER[1] - HOVER[0])), A = 16 * Math.pow(Math.sin(Math.PI * x), 2), ph = 2.2 + 1.6 * Math.PI * x;
  const lift = liftAt(ff);
  const t = [TIP[0] + A * Math.cos(ph) - 3 * lift, TIP[1] + A * Math.sin(ph) - 6 * lift];
  const p = lerp2(on(t), CUR_IN, g);
  return { p, press: cmdPress(ff) - 0.5 * lift, mc };
}
// (R19) the burst: the front's radius (card px) runs out from the tip; the glow behind it is brightest at
// the tip (falling toward the front, evening out once the front has left the frame), comes up in two frames,
// holds through the fly-through and gives way to the wash by 316; the front's rim and the tip's white-hot
// core flash and fade
const BURST = { R: 820, dur: 7, soft: 170, glow: 2.3, fall: 0.6, hold: [7, 15], rim: 0.35, core: 5, vig: 0.7 };
function burstAt(f) {
  if (f < F_CLICK || f >= F_END) return null;
  const t = f - F_CLICK;
  return { c: TIP, r: 12 + BURST.R * (1 - Math.pow(1 - clamp(t / BURST.dur), 2)), soft: BURST.soft,
    glow: BURST.glow * smoothstep(-1, 2, t) * (1 - smoothstep(BURST.hold[0], BURST.hold[1], t)),
    fall: BURST.fall * (1 - smoothstep(4, 8, t)),
    rim: BURST.rim * Math.exp(-t / 4), core: BURST.core * Math.exp(-t / 2.2), coreR: 16 + 10 * t,
    // the vignette lifts while the frame is flooded (white to the corners), back to the card's 0.2 by 315
    vig: 0.2 * (1 - BURST.vig * smoothstep(1, 5, t) * (1 - smoothstep(BURST.hold[0], BURST.hold[1] + 1, t))) };
}
function cmdCursor(f, mcOf) {
  if (f < CMD_IN[0] || f > CMD_END) return null;
  const S = SHUTTER.map((d) => cmdAt(f + d, mcOf));
  if (S.every((s) => s.p[0] > 2040 || s.p[1] > 1180)) return null;     // off frame
  return { samples: S.map((s) => [s.p[0], s.p[1], CUR_SCALE * s.mc * (1 - 0.05 * s.press), s.press]), rimD: 3.0, cool: 0.22 };
}
// the code panel (S13's recipe): beside the cursor's spot, opening as the typing starts, one character
// per keystroke with the caret, flashing on the click; (R19) then it dissolves into the burst (alpha a)
function cmdPanel(f, mcOf) {
  const t0 = KEYS[0] - 1;
  const open = easeOut(clamp((f - t0 + 2) / 3)), a = 1 - smoothstep(F_CLICK + 0.5, F_CLICK + 5, f);
  if (f < t0 - 2 || open <= 0.001 || a <= 0.001) return null;
  const mc = mcOf(f), tip = [960 + mc * TIP[0], 540 + mc * TIP[1]], n = KEYS.filter((k) => f >= k).length;
  return { x: tip[0] + 60, y: tip[1] + 34, text: CMD, open, a, lit: smoothstep(F_CLICK, F_CLICK + 1.5, f), typed: n / CMD.length, caret: f < F_CLICK,
    flash: Math.exp(-Math.pow((f - F_CLICK) / 4, 2)) * (f >= F_CLICK - 2 ? 1 : 0) };
}

export function openingState(T, f) {
  const chops = T.events('chops');
  const c1 = chops.filter((x) => x < 155);          // 11, 30, 35, 44, 84, 102, 106, 116, 147
  const fLight = c1[0];                             // 11: the square lights
  if (!PACE) { PACE = paceTable(c1, T.events('beats')); LAND = landTable(c1); }   // (R23) the pen's pace, (R24) the landings, once
  // the lamp behind the tissue warms up on the first note, then breathes a little with the voice
  const on = f < fLight ? 0 : 1 - Math.exp(-(f - fLight) / 5.5);
  const warm = f < fLight ? 0 : 0.34 + 0.66 * smoothstep(0, 130, f - fLight);
  const breath = 0.95 + 0.07 * T.envSmooth('vocals', f, 3);
  let light = on * warm * breath;
  // ray flaps: fold in (open) in S01, ray by ray behind the pen (R24); close in S02
  const rays = RG.map((_, j) => foldAt(f, LAND[j]));
  CLOSE_ORDER.forEach((j, k) => { rays[j] = Math.min(rays[j], 1 - swing(f, F_CLOSE + STAGGER_CLOSE * k, DUR_CLOSE)); });
  // Clawd's cells
  const cells = CELL_T.map((t0, i) => (t0 < 0 ? 0 : swing(f, t0, i >= 72 ? DUR_LEG : DUR_CELL)));
  // glints: the latest chop's flash, each from a slightly different key direction
  let gI = 0, gDir = KEY;
  for (const c of chops) {
    if (c < GLINT_FROM || c > GLINT_TO || c > f) continue;
    const d = f - c, p = (1 - Math.exp(-d / 1.0)) * Math.exp(-d / 8);
    if (p > 0.02) { gI = Math.max(gI, 1.6 * glintGain(c) * p); gDir = KEY + (hash(c, 7) - 0.5) * 1.5; }
  }
  // camera: locked, with a slow push through S01-S02 bar 3, a firmer one in bar 4, then the fly-through
  const D0 = 1, gap = 0.3;
  const dAt = (ff) => {
    if (ff < F_FLY) return D0 / (1 + 0.035 * smoothstep(fLight, 227, ff) + 0.10 * easeInOut((ff - 227) / (F_FLY - 227)));
    const u = (ff - F_FLY) / (F_END - F_FLY), Dfly = D0 / 1.135, travel = Dfly + 0.93 * gap;
    return Dfly - travel * (1 - Math.pow(1 - u, 1.6));
  };
  let D = dAt(f);
  let cardOn = 1, exposure = 1, haze = 0.045, god = 0.12;
  // bar 4: the light pours through the glyph (and surges on the command's click)
  const pour = smoothstep(222, 250, f);
  light *= 1 + 0.12 * pour + surgeAt(f);
  haze += 0.03 * pour; god += 0.10 * pour;
  if (f >= F_FLY) {
    // the last beat: fly through the Clawd hole (card plane at u ~ 0.62), then into the tissue's light
    const u = (f - F_FLY) / (F_END - F_FLY);
    if (D <= 0.004) cardOn = 0;
    exposure = 1 + 0.12 * smoothstep(0.5, 1, u);
  }
  const mc = cardOn ? D0 / Math.max(D, 0.004) : 1;
  const mt = (D0 + gap) / (D + gap);
  // the lamp: a hot small core for the spark, broadening to an even Claude-orange for the glyph
  const lb = smoothstep(174, 232, f);
  const lamp = [1.9 + (0.55 - 1.9) * lb, 95 + (170 - 95) * lb, 1.05 + (0.82 - 1.05) * lb, 380 + (720 - 380) * lb];
  // the cursors: S01's draws the outline; S02's rides the card (its magnification, the push and the
  // fly-through), and its panel is drawn over the card render by S02
  const mcOf = (ff) => D0 / Math.max(dAt(ff), 0.004);
  const cursor = f < 155 ? cursorState(f, fLight) : (cardOn ? cmdCursor(f, mcOf) : null);
  const panel = f < 155 || !cardOn ? null : cmdPanel(f, mcOf);
  const burst = burstAt(f);
  return { light, lamp, rays, rank: RANK, cells, rot: 0, rotC: 0, rotSpan: 0, glint: [gI, gDir, 5], mc, mt,
    cc: [960, 540], tc: [960, 540], cardOn, exposure, haze, god, seed: f % 97, cursor, panel, burst,
    vig: burst ? burst.vig : undefined, kerf: kerfState(T, f) };
}
