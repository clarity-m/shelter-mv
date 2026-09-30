// The opening bookend as one function of the global frame (S01 frames 0-154, S02 155-316), so the
// two shots agree exactly at their cut. Everything is keyed to the vocal-chop notes of intro A.
//   S01 (R20; Claire: the spin is "unnecessary" with the cursor, and "make it clear the cursor draws the
//        outline, and it's later filled in"): dark card; the first chop lights the square. The humans'
//        indigo paper cursor comes in from the bottom right and draws the starburst's outline, ray by ray,
//        clockwise from the valley where it arrives: a thin line of light cut into the card (the lamp
//        showing through the kerf), with a spark at its tip that flares on the chops. It lets go where it
//        began and leaves. Then, from the chop at 116, the rays fill with light in a clockwise wave from the
//        top (the paper glowing through, the light running out from the hub) and open (the flaps swing
//        back); the last chops glint. The card no longer turns.
//   S02: the rays fold shut in a sweep from the top (their light draws back into the hub) while Clawd's
//        cells flip open one by one in a ripple out from the square, a pixel at a time; his legs land on
//        the bar-4 downbeat. Bar 4 lets the light pour. The humans' cursor comes back, hovers over his shape
//        and settles, types `train(corpus)` in its code panel, lifts a moment, and clicks on the bar-5 kick
//        (299, R20: S02 is a beat longer): a burst of warm light from its tip floods the frame as the camera
//        flies through the hole into the lit tissue, ending on the warm wash (316) that S03 dissolves from.
// Earlier revisions: 1 (the opening felt static: glints and the cell ripple; the spin, now gone), 5 (the
// humans' cursor from the first frame), the pretraining command (the rhyme is S13's `agent = clawd` /
// `train()`), R19 (the click is a burst of light; card.js st.burst).
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

// ---- S01's outline (R20). Per ray (card px, the spark's frame): its axis, length and radii; where its two
// sides come free of its neighbours (u0a on its counter-clockwise side, u0b on its clockwise side, fractions
// of its length); and its free outline, out along the ccw side, round the tip, back along the cw side, as a
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
const TIP_SLOW = 2.5;                              // the pen slows round the tips
const OUT = RG.map((Q, j) => {
  const free = (w) => sqSD(w) > 0.3 && RG.every((_, i) => i === j || capSD(w, i) > 0.3);
  const u0 = [-1, 1].map((sg) => {
    for (let u = 0; u <= 1; u += 0.002) { let ok = true; for (let v = u; v <= Math.min(1, u + 0.05); v += 0.01) if (!free(sidePt(j, v, sg))) { ok = false; break; } if (ok) return u; }
    return 1;
  });
  const Aa = (1 - u0[0]) * Q.L, Ac = Math.PI * Q.r2, Ab = (1 - u0[1]) * Q.L, A = Aa + Ac + Ab;
  return { u0a: u0[0], u0b: u0[1], sa: Aa / A, sb: (Aa + Ac) / A, Aa, Ac, Ab, T: Aa + TIP_SLOW * Ac + Ab };
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
// the drawing: clockwise from the valley between rays 4 and 5 (nearest the hand, bottom right), so the
// cursor arrives, draws round and leaves without crossing the star
const ORDER = [5, 6, 7, 8, 9, 10, 0, 1, 2, 3, 4];
const DRAW_K = new Float32Array(11); ORDER.forEach((j, k) => { DRAW_K[j] = k; });
const T_TOT = ORDER.reduce((a, j) => a + OUT[j].T, 0);
const DRAW = [30, 108];                            // from the chop at 30; the outline is closed by 108
// the pen's progress: a gentle start and stop, and a hand that finds its pace (slower on the first rays)
function drawAt(f) {
  const x = clamp((f - DRAW[0]) / (DRAW[1] - DRAW[0])), e = 0.05, v = 1 / (1 - e);
  const tr = x < e ? v * x * x / (2 * e) : x > 1 - e ? 1 - v * (1 - x) * (1 - x) / (2 * e) : v * (x - e / 2);
  let tau = T_TOT * (0.7 * tr + 0.3 * tr * tr);
  for (let k = 0; k < 11; k++) {
    const o = OUT[ORDER[k]];
    if (tau <= o.T || k === 10) {
      const t = Math.min(tau, o.T), tc = TIP_SLOW * o.Ac;
      const s = t < o.Aa ? o.sa * t / o.Aa : t < o.Aa + tc ? o.sa + (o.sb - o.sa) * (t - o.Aa) / tc : o.sb + (1 - o.sb) * (t - o.Aa - tc) / o.Ab;
      return { k, j: ORDER[k], s, draw: k + s };
    }
    tau -= o.T;
  }
}
// then the fill and the opening, a clockwise wave from the top on the chop at 116
const FILL = { at: 116, stag: 1.6, dur: 9 }, OPEN = { at: 123, stag: 1.6, dur: 12 };
const fillAt = (f, j) => 1.2 * smoothstep(FILL.at + FILL.stag * j, FILL.at + FILL.stag * j + FILL.dur, f);
const openAt = (f, j) => swing(f, OPEN.at + OPEN.stag * j, OPEN.dur);

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
// glints: which chops make the key light flash on the cut edges, and how strongly (from the fill on)
const GLINT_FROM = 116, GLINT_TO = 298;
const glintGain = (c) => (c < 200 ? 1.0 : 0.55);
const KEY = Math.atan2(-0.8, -0.6);          // the key light sits up and to the left

export const F_S02 = 155, F_FLY = 299, F_END = 316;

// ---- the cursor (S01). Positions are the arrow's tip in 1920-frame px.
const HUB = [960, 540];
const CUR_IN = [1330, 1125], CUR_OUT = [1560, 1215];     // off frame, bottom right: where the hand is
const ENTER = [12, 27], PRESS = [27, 30], RELEASE = [108, 112], EXIT = [116, 144];
const mcAt = (f, fLight) => 1 + 0.035 * smoothstep(fLight, 227, f);          // the card's magnification
const onScreen = (w, f, fLight) => { const m = mcAt(f, fLight); return [HUB[0] + m * w[0], HUB[1] + m * w[1]]; };
const PEN0 = penPt(ORDER[0], 0);                                            // where it arrives and draws from
function cursorAt(f, fLight) {
  if (f < ENTER[0]) return { p: CUR_IN, press: 0 };
  if (f < ENTER[1]) {                                                         // in from the hand, slowing
    const u = 1 - Math.pow(1 - clamp((f - ENTER[0]) / (ENTER[1] - ENTER[0])), 2.4);
    return { p: lerp2(CUR_IN, onScreen(PEN0, f, fLight), u), press: 0 };
  }
  if (f < DRAW[0]) return { p: onScreen(PEN0, f, fLight), press: smoothstep(PRESS[0], PRESS[1], f) };
  const d = drawAt(f), pen = onScreen(penPt(d.j, d.s), f, fLight);
  if (f < EXIT[0]) return { p: pen, press: 1 - smoothstep(RELEASE[0], RELEASE[1], f) };   // draws, lets go
  return { p: lerp2(pen, CUR_OUT, easeIn((f - EXIT[0]) / (EXIT[1] - EXIT[0]))), press: 0 };
}
// five moments across a half-open shutter (motion blur), or null when it is off frame
const SHUTTER = [-0.25, -0.125, 0, 0.125, 0.25], CUR_SCALE = 1.5;
// (R20) over the dark card, before the light fills, the paper cursor is the lighter dusk slate with a cool
// edge, so the hand that draws the outline reads
const DUSK = [0x2D, 0x36, 0x56].map((v) => Math.pow(v / 255, 2.2));
function cursorState(f, fLight) {
  if (f < ENTER[0] || f > EXIT[1]) return null;
  return { samples: SHUTTER.map((d) => { const s = cursorAt(f + d, fLight); return [s.p[0], s.p[1], CUR_SCALE * mcAt(f + d, fLight) * (1 - 0.05 * s.press), s.press]; }),
    col: DUSK, cool: 0.32, rimD: 3.0 };
}
// the kerf, the fill and the pen for card.js (S01 and S02's first frames, until every ray is open)
function kerfState(T, f) {
  if (f < DRAW[0] - 1 || f > OPEN.at + OPEN.stag * 10 + OPEN.dur + 2) return null;
  const d = f < DRAW[0] ? { j: ORDER[0], s: 0, draw: 0 } : drawAt(f);
  const drawing = smoothstep(DRAW[0] - 1, DRAW[0] + 1, f) * (1 - smoothstep(DRAW[1], RELEASE[1], f));
  return { draw: d.draw, drawK: DRAW_K, geom: KERF_GEOM, line: 1.6, width: 0.9,
    fill: RG.map((_, j) => fillAt(f, j)), fillI: 0.42,
    pen: penPt(d.j, d.s), penI: drawing * (0.8 + 1.0 * T.pulse('chops', f, 5)), penR: 8 };
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
  const fLight = chops[0];                          // 11: the square lights
  // the lamp behind the tissue warms up on the first note, then breathes a little with the voice
  const on = f < fLight ? 0 : 1 - Math.exp(-(f - fLight) / 5.5);
  const warm = f < fLight ? 0 : 0.34 + 0.66 * smoothstep(0, 130, f - fLight);
  const breath = 0.95 + 0.07 * T.envSmooth('vocals', f, 3);
  let light = on * warm * breath;
  // ray flaps: open in S01 (after the fill), close in S02
  const rays = RG.map((_, j) => openAt(f, j));
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
