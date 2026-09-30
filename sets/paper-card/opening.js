// The opening bookend as one function of the global frame (S01 frames 0-154, S02 155-316), so the
// two shots agree exactly at their cut. Everything is keyed to the vocal-chop notes of intro A.
//   S01 (cut 18's unfold, R21): dark card; the first chop lights the square. The humans' indigo paper cursor
//        comes in from the bottom right and unfolds the starburst fan by fan on the chops (30, 44, 84, 106):
//        hooked on the fold at the square's edge, it drags the fan's long ray outward, the fold's free edge
//        riding its tip (the light runs out under it), the fan's other rays following three frames apart;
//        after the release the paper springs the rest of the way open. Each ray's outline is cut first, a
//        thin line of light traced round it, and stands alone for seven frames before its fill pours in
//        (Claire: "just slightly delay the fill in"). The card no longer turns (R20); the late chops glint.
//   S02: the rays fold shut in a sweep from the top (their light draws back into the hub) while Clawd's
//        cells flip open one by one in a ripple out from the square, a pixel at a time; his legs land on
//        the bar-4 downbeat. Bar 4 lets the light pour. The humans' cursor comes back, hovers over his shape
//        and settles, types `train(corpus)` in its code panel, lifts a moment, and clicks on the bar-5 kick
//        (299, R20: S02 is a beat longer): a burst of warm light from its tip floods the frame as the camera
//        flies through the hole into the lit tissue, ending on the warm wash (316) that S03 dissolves from.
// Earlier revisions: 1 (the opening felt static: glints and the cell ripple; the spin, now gone), 5 (the
// humans' cursor from the first frame), the pretraining command (the rhyme is S13's `agent = clawd` /
// `train()`), R19 (the click is a burst of light; card.js st.burst), R20 (no spin; S01 briefly had the
// cursor draw the whole outline before a fill wave, which Claire's note did not mean).
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
  return { u0a: u0[0], u0b: u0[1], sa: Aa / A, sb: (Aa + Ac) / A };
});
const KERF_GEOM = new Float32Array(OUT.flatMap((o) => [o.u0a, o.u0b, o.sa, o.sb]));
// ---- S01's unfold (cut 18): the fans of rays, in the order the cursor opens them (a clockwise sweep from the top)
const OPEN_ORDER = [[0, 1, 2], [3, 4, 5], [6, 7], [8, 9, 10]];
const STAGGER_OPEN = 3;
// the cursor's pulls, one per fan: the chop (index into intro A's chops), the ray it drags (the fan's
// first, long one), how far it drags it (fraction of the ray) and for how long (frames)
const PULLS = [
  { ci: 1, ray: 0, p1: 0.40, drag: 7 },     // chop 30: the fan at the top, pulled up
  { ci: 3, ray: 3, p1: 0.46, drag: 8 },     // chop 44: the fan on the right
  { ci: 4, ray: 6, p1: 0.56, drag: 10 },    // chop 84: the fan below
  { ci: 6, ray: 8, p1: 0.56, drag: 10 },    // chop 106: the fan on the left
];
const SPRING = 12;                          // after the release the paper springs open over this
const LRAY = (j) => CARD_GEOM.Lmax * SPARK[j].len;
// where a fold's free edge starts on its ray's axis: its region is its capsule minus the square and
// minus the capsules cut before it (card.js regionSD, in JS); with opening o the edge is at
// start + o (L - start), and the cursor's tip rides it
const FOLD_START = RG.map((R, j) => {
  for (let s = 0; s < R.L; s += 0.25) {
    const w = [R.d[0] * s, R.d[1] * s];
    let d = Math.max(capSD(w, j), -sqSD(w));
    for (let i = 0; i < 11; i++) if (RANK[i] < RANK[j]) d = Math.max(d, -capSD(w, i));
    if (d < 0) return s;
  }
  return 0;
});
// a fold's opening, t frames after its pull began: it follows the drag, then springs open
function pullOpen(t, g) {
  if (t < 0) return 0;
  if (t < g.drag) { const u = t / g.drag; return g.p1 * (1 - (1 - u) * (1 - u)); }
  if (t >= g.drag + SPRING) return 1;
  return g.p1 + (1 - g.p1) * easeOut((t - g.drag) / SPRING);
}
// (R21) each ray's outline is cut first: traced round it in three frames, it stands alone as a line of
// light for seven before the pull pours its fill in (the pulls and the fills keep cut 18's timing)
const LEAD = { trace: 3, stand: 7 };
const FAN = RG.map((_, j) => { const k = OPEN_ORDER.findIndex((ids) => ids.includes(j)); return [k, OPEN_ORDER[k].indexOf(j)]; });
const pullAt = (c1, j) => c1[PULLS[FAN[j][0]].ci] + STAGGER_OPEN * FAN[j][1];
const outlineAt = (f, t0) => (f < t0 ? -1 : 1.05 * clamp((f - t0) / LEAD.trace));

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
const GLINT_FROM = 84, GLINT_TO = 298;
const glintGain = (c) => (c < 200 ? 1.0 : 0.55);
const KEY = Math.atan2(-0.8, -0.6);          // the key light sits up and to the left

export const F_S02 = 155, F_FLY = 299, F_END = 316;

// ---- the cursor's path (S01, cut 18's). Positions are the arrow's tip in 1920-frame px.
const HUB = [960, 540];
const CUR_IN = [1330, 1125], CUR_OUT = [1560, 1215];     // off frame, bottom right: where the hand is
const ENTER = [12, 28], EXIT = [118, 146];
const mcAt = (f, fLight) => 1 + 0.035 * smoothstep(fLight, 227, f);          // the card's magnification
function cardPoint(j, r, f, fLight) {                                          // ray j at radius r, on screen
  const a = SPARK[j].a * Math.PI / 180, m = mcAt(f, fLight) * r;               // (R20: the card no longer turns)
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
// (R20) over the dark card the paper cursor is the lighter dusk slate with a cool edge, so it reads
const DUSK = [0x2D, 0x36, 0x56].map((v) => Math.pow(v / 255, 2.2));
function cursorState(f, c1, fLight) {
  if (f < ENTER[0] || f > EXIT[1]) return null;
  const C = PULLS.map((g) => c1[g.ci]);
  return { samples: SHUTTER.map((d) => { const s = cursorAt(f + d, C, fLight); return [s.p[0], s.p[1], CUR_SCALE * mcAt(f + d, fLight) * (1 - 0.05 * s.press), s.press]; }),
    col: DUSK, cool: 0.32, rimD: 3.0 };
}
// (R21) the outlines for card.js (st.kerf): each ray's trace as its own draw index (draw 0, drawK = -progress;
// -1 before it starts); no fill glow and no pen. Every ray is open by 134, and a kerf fades as its flap opens.
function kerfState(c1, f) {
  const t0 = RG.map((_, j) => pullAt(c1, j) - LEAD.trace - LEAD.stand);
  if (f < Math.min(...t0) || f > 136) return null;
  return { draw: 0, drawK: new Float32Array(t0.map((t) => -outlineAt(f, t))), geom: KERF_GEOM, line: 1.6, width: 0.9,
    fill: new Array(11).fill(0), fillI: 0, pen: [0, 0], penI: 0, penR: 8 };
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
  // the lamp behind the tissue warms up on the first note, then breathes a little with the voice
  const on = f < fLight ? 0 : 1 - Math.exp(-(f - fLight) / 5.5);
  const warm = f < fLight ? 0 : 0.34 + 0.66 * smoothstep(0, 130, f - fLight);
  const breath = 0.95 + 0.07 * T.envSmooth('vocals', f, 3);
  let light = on * warm * breath;
  // ray flaps: open in S01 (the cursor's pulls), close in S02
  const rays = new Array(11).fill(0);
  OPEN_ORDER.forEach((ids, k) => { const g = PULLS[k]; ids.forEach((j, m) => { rays[j] = pullOpen(f - c1[g.ci] - STAGGER_OPEN * m, g); }); });
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
  // the cursors: S01's pulls the fans open; S02's rides the card (its magnification, the push and the
  // fly-through), and its panel is drawn over the card render by S02
  const mcOf = (ff) => D0 / Math.max(dAt(ff), 0.004);
  const cursor = f < 155 ? cursorState(f, c1, fLight) : (cardOn ? cmdCursor(f, mcOf) : null);
  const panel = f < 155 || !cardOn ? null : cmdPanel(f, mcOf);
  const burst = burstAt(f);
  return { light, lamp, rays, rank: RANK, cells, rot: 0, rotC: 0, rotSpan: 0, glint: [gI, gDir, 5], mc, mt,
    cc: [960, 540], tc: [960, 540], cardOn, exposure, haze, god, seed: f % 97, cursor, panel, burst,
    vig: burst ? burst.vig : undefined, kerf: kerfState(c1, f) };
}
