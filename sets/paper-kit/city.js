// The city set (S23): a paper skyline at night by a river; one district comes online.
// Revision 3: the district comes online because a grid reaches it. A slit runs along the far
// bank's embankment (the paper twin of S22's line of light along the river); warm light runs
// along it from the left, and where it passes the district it climbs four risers, the lit seams
// between buildings. Then the windows light, shuffled by building and within each building.
// Everything that lights is a timed warm pinhole on the district layer (one clock, codes in
// frames / 144): the run along the bank, the risers climbing, the windows. The slit and the
// risers' lower stubs also hold a steady low glow (the quay layer's own emission), so they are
// visible from the first frame at the MATCH positions (sets/paper-kit/MATCH.md).
// A soft warm light rises behind the district as it fills, so its silhouette becomes a lantern.
import { S2, lin, lerp, clamp, mulberry32, PAPER } from './kit.js';

export const CITY = { base: 736, dx0: 1010, dx1: 1560, glow: [1290, 660] };
// the grid, in world px (the quay layer is at z -176, the district at -180):
//   the bank line's slit is y 721-724; the risers run up the district's seams from the bank
//   (the stubs, lit from the start, reach STUB); `at` = local frame the light reaches them
export const GRID = {
  y0: 721, h: 3, wall: 710, x0: -140, x1: 2060,
  lineX0: 474,                                       // revision 7: the bank line starts at the reactor
  run: { x: 474, f: 4, v: 26 },                      // the front leaves the reactor (x 474) at local frame 4, 26 px/frame
  risers: [{ x: 1071, top: 522 }, { x: 1209, top: 562 }, { x: 1377, top: 472 }, { x: 1511, top: 582 }],
  climb: 12,                                         // px per frame up a riser
  stub: 622,
  cross: { y: 662, x0: 1071, x1: 1511 },             // a cross line joining the risers (S22 draws one)
};
// the near bank (revision 3): a nearly straight embankment, so the water band is S22's (733-980),
// with a warm line along its lip (on the river card, just above the embankment's edge)
export const nearEdge = (x) => 983 + 2 * Math.sin(x / 170) + Math.sin(x / 53);
export const NEAR_LINE = { y: 977, h: 3 };
// revision 5: S23 is three bars. Bar 60 the grid, bar 61 the district, bar 62 the rest of the
// skyline (the mid layer's buildings warm one by one, outward from the district, shuffled)
export const SHOT_N = 288;                          // revision 9: S23 is four bars (66-69)
// the reactor's lantern on the far bank (world px; it sits on the embankment's top at y 710)
export const REACTOR = { x: 440, y: 704 };
// revision 8: the greenhouse, small on the far bank right of the district (world px, on the wall)
export const GREENHOUSE = { x: 1622, y: 709, w: 66, h: 30 };
// the district's buildings (world px)
export const B = [
  { x: 1010, w: 62, top: 520, roof: 0.35 }, { x: 1070, w: 88, top: 430, roof: 0.15 }, { x: 1156, w: 54, top: 560, roof: 0.45 },
  { x: 1208, w: 76, top: 330, roof: 0.25 }, { x: 1282, w: 96, top: 470, roof: 0.52 }, { x: 1376, w: 58, top: 400, roof: 0.62 },
  { x: 1432, w: 80, top: 520, roof: 0.1 }, { x: 1510, w: 60, top: 580, roof: 0.42 },
];
// when each building comes online (local frames): on the snare roll, once the light along the
// bank has reached it; the district in a shuffled order, then the mid skyline on the later snares.
// setOnline(snares) is called by the shot before the scene is built.
export const ONLINE = { district: B.map((_, i) => 40 + 8 * i), mid: [] };
const D_ORDER = [0, 3, 1, 6, 4, 2, 7, 5];
export function setOnline(snares, until = 1e9) {
  // revision 9: faster, two buildings to a snare, all within bars 66-67 (snares before `until`)
  const sn = snares.slice().sort((a, b) => a - b).filter((f) => f < until);
  let j = 0, used = 0;
  D_ORDER.forEach((bi) => {
    const reach = runFrame(B[bi].x + B[bi].w / 2) + 2;
    while (j < sn.length && sn[j] < reach) { j++; used = 0; }
    ONLINE.district[bi] = j < sn.length ? sn[j] + 2 * used : reach + 6;
    if (++used === 2) { j++; used = 0; }
  });
  if (used) j++;
  ONLINE.mid = sn.slice(j);
  return ONLINE;
}
// ---------------------------------------------------------------- revision 9: the satellites
// A ring of 96 paper satellites across the sky, an arch from horizon to horizon (world px of the
// `sats` layer, z -900). In bar 68 they light one by one, the rate doubling each beat (1, 2, 4, 8);
// on the bar-69 kick the rest close in from both ends and the ring's own line lights: the first ring
// of a swarm. `setSats(first, kick)` is called by the shot (local frames) before the scene is built.
export const RING = { cx: 960, cy: 700, R: 1250, r: 560, n: 96, a0: 0.1, a1: Math.PI - 0.1 };
export const ringAt = (t) => { const a = RING.a0 + (RING.a1 - RING.a0) * t; return [RING.cx - RING.R * Math.cos(a), RING.cy - RING.r * Math.sin(a)]; };
export const SATS = { at: [], line: (t) => 1e9 };
export function setSats(beat0, kick) {
  // the first fifteen: 1, 2, 4 and 8 in the four beats of bar 68, spread over the arch
  const order = [48, 30, 66, 14, 40, 57, 82, 22, 36, 52, 61, 8, 74, 88, 44];
  const at = new Array(RING.n).fill(null);
  let n = 0;
  for (let b = 0; b < 4; b++) { const c = 1 << b; for (let q = 0; q < c; q++) at[order[n++]] = beat0 + 18 * b + (18 / c) * q; }
  // the rest close in from both ends on the kick, meeting in the middle
  for (let i = 0; i < RING.n; i++) if (at[i] === null) { const d = Math.min(i, RING.n - 1 - i) / (RING.n / 2); at[i] = kick + 11 * d; }
  SATS.at = at;
  SATS.line = (t) => kick + 6 + 8 * Math.min(t, 1 - t) * 2;           // the ring's line, closing a little later
  return SATS;
}
export const MID = { f0: 138, step: 5.5, span: 14 };
export const runFrame = (x) => GRID.run.f + (x - GRID.run.x) / GRID.run.v;
export const riserFrame = (r, y) => runFrame(r.x) + (GRID.y0 + GRID.h - y) / GRID.climb;
// the cross line lights along its length as the risers reach it (a front 4 frames behind the bank's)
export const crossFrame = (x) => runFrame(x) + (GRID.y0 + GRID.h - GRID.cross.y) / GRID.climb;
const code = (f) => clamp(f / SHOT_N, 1 / 255, 1);

// buildings of a skyline strip: [{x, w, top, roof}]
function skyline(rnd, x0, x1, hMin, hMax, gapP = 0.3) {
  const out = []; let x = x0;
  while (x < x1) {
    const w = 38 + rnd() * 70, h = lerp(hMin, hMax, Math.pow(rnd(), 1.3));
    out.push({ x, w, top: CITY.base - h, roof: rnd() });
    x += w + (rnd() < gapP ? 3 + rnd() * 10 : -rnd() * 4);
  }
  return out;
}
function drawBuilding(m, b, rnd, detail = 1) {
  const { x, w, top, roof } = b;
  m.card(S2.rect(x, top, w, CITY.base + 400 - top), 0.45);
  if (roof < 0.2) m.card(S2.rect(x + w * 0.2, top - 16 - rnd() * 18, w * 0.6, 20), 0.4);                         // setback
  else if (roof < 0.3) m.card([[x + w * 0.5 - 2, top + 2], [x + w * 0.5, top - 40 - rnd() * 40], [x + w * 0.5 + 2, top + 2]], 0.2);   // spire
  else if (roof < 0.4 && detail) { const cx = x + w * (0.25 + 0.5 * rnd()); m.card(S2.rrect(cx - 9, top - 20, 18, 14, 4), 0.3); m.card(S2.rect(cx - 7, top - 7, 2, 8), 0); m.card(S2.rect(cx + 5, top - 7, 2, 8), 0); }  // water tank
  else if (roof < 0.5) { for (let k = 0; k < 3; k++) m.card([[x + k * w / 3, top + 1], [x + (k + 1) * w / 3, top + 1], [x + (k + 1) * w / 3, top - 10]], 0.2); }   // sawtooth
  else if (roof < 0.58) m.card(S2.ellipse(x + w / 2, top, w * 0.32, 18), 0.3);                                      // dome
  else if (roof < 0.7 && detail) m.card(S2.rect(x + w * 0.7, top - 34, 2, 35), 0);                                   // antenna
}
// a grid of windows on a building: calls fn(rect, i, j, cx, y) for each window slot
function windows(b, pitchX, pitchY, ww, wh, fn) {
  const nx = Math.max(1, Math.floor((b.w - 8) / pitchX)), ox = b.x + (b.w - (nx - 1) * pitchX - ww) / 2;
  for (let y = b.top + 12, j = 0; y < CITY.base - 18; y += pitchY, j++) for (let i = 0; i < nx; i++) fn(S2.rect(ox + i * pitchX, y, ww, wh), i, j, ox + i * pitchX + ww / 2, y + wh / 2);
}

export function cityScene(o = {}) {
  const S = { name: 'city' };
  S.world = { x0: -120, y0: -80, w: 2160, h: 1240 };
  S.sky = { top: '#1B2138', hor: '#34406A', horY: 740 };
  S.moon = { dir: [0.3, 0.5, 1], I: 0.5, disc: [0, 0, 0] };
  S.light = { x: CITY.glow[0], y: CITY.glow[1], z: -250, r: 30, I: 0, a: 170, f: 900 };
  S.hazeW = 9e-5;
  S.params = { arim: 0.16, hm: 1.5e-5, rim: 1.4 };
  S.cam = { Zc: 2400, zref: -180 };
  S.hazeFront = 300;
  const L = S.layers = [];
  const add = l => L.push(l);
  const COOL = lin('#9FB3D9');

  // revision 9: the ring of satellites (a timed layer: each appears, lit, at its code)
  // R19 (Claire: highlight the satellites): larger and brighter, and the ring's line bolder
  if (SATS.at.length) add({ name: 'sats', z: -900, col: PAPER.deep, alb: 0.4, ao: 0, timed: 0.012, ew: 4.6, ef: 0.2, draw: (m) => {
    for (let i = 0; i < RING.n; i++) {
      const t = i / (RING.n - 1), [x, y] = ringAt(t), [x2, y2] = ringAt(Math.min(1, t + 0.002)), ang = Math.atan2(y2 - y, x2 - x);
      const s = 2.3 * (0.8 + 0.35 * ((i * 7) % 5) / 4), rot = (pts) => pts.map(([px, py]) => [x + (px * Math.cos(ang) - py * Math.sin(ang)) * s, y + (px * Math.sin(ang) + py * Math.cos(ang)) * s]);
      // (no card: unlit, a satellite is invisible against the night; it appears as it lights)
      const pan = [rot(S2.rect(-10.5, -2.4, 7, 4.8)), rot(S2.rect(3.5, -2.4, 7, 4.8))];
      pan.forEach((p) => m.timed(p, code(SATS.at[i]), 1.0));
      m.timed(rot(S2.ellipse(0, 0, 2.2, 2.2, 0, 10)), code(SATS.at[i] + 1), 1.0);
    }
    // the ring's own line: fine segments along the arch, lighting as it closes
    for (let k = 0; k < 240; k++) {
      const t0 = k / 240, t1 = (k + 1) / 240, a = ringAt(t0), b = ringAt(t1);
      m.timed(S2.bar(a, b, 2.6), code(SATS.line((t0 + t1) / 2)), 0.8);
    }
  } });
  add({ name: 'far', z: -620, col: PAPER.far, ao: 0.2, em: COOL.map(v => v * 0.45), draw: (m, rnd) => {
    for (const b of skyline(rnd, -120, 2040, 60, 190, 0.2)) { drawBuilding(m, b, rnd, 0); windows(b, 9, 12, 3, 4, (r) => { if (rnd() < 0.05) m.emit(r, 0.4 + 0.6 * rnd()); }); }
  } });
  // the mid skyline: its cool windows as before (same rnd sequence, so the same skyline); in bar 62
  // half its other window slots light warm, building by building (a separate rng picks them)
  add({ name: 'mid', z: -400, col: PAPER.dusk, ao: 0.3, em: COOL.map(v => v * 0.6), timed: 0.02, ew: 1.9, ef: 0.35, draw: (m, rnd) => {
    const R = mulberry32(6060), bs = [];
    for (const b of skyline(rnd, -100, 2020, 120, 330, 0.25)) {
      if (b.x > 1040 && b.x < 1480) b.top += 60;
      drawBuilding(m, b, rnd);
      const warm = [];
      windows(b, 11, 14, 4, 5, (r) => { if (rnd() < 0.05) m.emit(r, 0.4 + 0.6 * rnd()); else if (R() < 0.5) warm.push(r); });
      const c = b.x + b.w / 2;
      if (c < 1000 || c > 1580) bs.push({ c, warm, k: Math.abs(c - CITY.glow[0]) + 300 * R() });   // (those behind the district stay dark)
    }
    // revision 8: on the later snares of the roll, one or two buildings each
    const sn = ONLINE.mid, per = Math.max(1, Math.ceil(bs.length / Math.max(sn.length, 1)));
    bs.sort((a, b) => a.k - b.k).forEach((o, rank) => {
      const f0 = sn.length ? sn[Math.min(sn.length - 1, Math.floor(rank / per))] + 3 * (rank % per) : MID.f0 + rank * MID.step;
      o.warm.forEach((r) => m.timed(r, code(f0 + 8 * Math.pow(R(), 0.8)), 0.65 + 0.35 * R()));
    });
  } });
  // ---- the district: its buildings, the reactor's light running behind the bank's slit, and the
  //      windows. Revision 8: no grid (S22's twin is gone). Each building comes online on a snare
  //      of the roll once the light along the bank has reached it, all its windows in a few frames
  //      in random order; the mid skyline follows on the later snares (see the mid layer).
  add({ name: 'district', z: -180, col: PAPER.slate, alb: 0.75, ao: 0.4, cast: 1, rimk: 1.3, timed: 0.014, ew: 2.6, ef: 0.35,
    em: COOL.map(v => v * 0.7), draw: (m, rnd) => {
    const R = mulberry32(2323);
    B.forEach(b => drawBuilding(m, b, R));
    // reflections: behind the water (the river's tissue ripples pass a third of the light behind
    // them), a band under the bank's line, timed with the run, so its light is doubled in the water
    for (let x = GRID.lineX0; x < GRID.x1; x += 8) {
      for (const [y0, y1, v] of [[742, 760, 0.55], [760, 784, 0.32], [784, 812, 0.16]]) m.timed(S2.rect(x, y0, 8, y1 - y0), code(runFrame(x + 4) + 1), v);
    }
    // the run along the bank (seen only through the quay's slit, in front)
    for (let x = GRID.x0; x < GRID.x1; x += 8) m.timed(S2.rect(x, GRID.y0 - 2.5, 8, GRID.h + 5), code(runFrame(x + 4)), 1.0);
    // windows (none behind the embankment wall, which would show through the bank's slit)
    const slots = [];
    B.forEach((b, bi) => windows(b, 12, 15, 5, 7, (r, i, j, cx, cy) => { const k = R(); if (k < 0.8 && cy + 3.5 < GRID.wall - 2) slots.push({ r, bi, k: R(), cx, cy }); }));
    B.forEach((b, bi) => {
      const t0 = ONLINE.district[bi];
      slots.filter(s => s.bi === bi).forEach((s) => { s.code = code(t0 + 7 * Math.pow(R(), 0.7)); });
    });
    for (const s of slots) {
      if (R() < 0.06) { m.emit(s.r, 0.5); continue; }                      // a few windows keep their own cool light
      m.timed(s.r, s.code, 0.75 + 0.25 * R());
    }
  } });
  // ---- the far bank's embankment wall, just in front of the district: the grid line is a slit
  //      cut along it; its own low warm glow (ew) is the line as S22 drew it, and the district's
  //      run shows through it when the light arrives. The risers' stubs glow the same way.
  add({ name: 'quay', z: -176, col: PAPER.deep, alb: 0.55, ao: 0.35, cast: 1, rimk: 1.2, ew: 0, ef: 0.25, draw: (m, rnd) => {
    m.card(S2.rect(GRID.x0, GRID.wall, GRID.x1 - GRID.x0, CITY.base + 4 - GRID.wall), 0.5);
    // the reactor's paper lantern on the embankment (its light is the `reactor` layer behind)
    { const { x, y } = REACTOR;
      m.card(S2.rect(x - 34, y, 68, GRID.wall - y + 2), 0.3);                           // plinth
      m.card(S2.ellipse(x, y - 7, 31, 9.5, 0, 48).concat(S2.ellipse(x, y - 7, 17, 4.2, 0, 48).reverse()), 0.2);   // torus
      for (const k of [-2, -1, 0, 1, 2]) {                                              // the cage's ribs
        const rx = x + k * 11.5, top = y - 7 - 27 * Math.sqrt(Math.max(0, 1 - (k / 2.6) ** 2));
        m.card(S2.rect(rx - 1, top, 2, y - 7 - top), 0);
      }
      m.card(S2.ribbon(S2.arc(x, y - 7, 30, 27, Math.PI, 2 * Math.PI, 24), () => 2.2, [false, false]), 0);
      m.card(S2.rect(x - 2.5, y - 40, 5, 7), 0); }
    // the slit along the bank: dark until the reactor's light runs along it (the district behind)
    m.cut(S2.rect(GRID.lineX0, GRID.y0, GRID.x1 - GRID.lineX0, GRID.h), 0.2);
    // revision 8: the greenhouse (S35), small on the far bank: a glasshouse's arched ribs (its warm
    // panels are the `reactor` layer's light behind)
    { const { x, y, w, h } = GREENHOUSE;
      m.card(S2.rect(x - w / 2 - 2, y - 3, w + 4, GRID.wall - y + 5), 0.2);             // its footing
      for (let k = 0; k <= 6; k++) {
        const rx = x - w / 2 + w * k / 6, top = y - 3 - h * Math.sqrt(Math.max(0, 1 - ((rx - x) / (w / 2 + 0.01)) ** 2));
        m.card(S2.rect(rx - 0.9, top, 1.8, y - 3 - top), 0);
      }
      m.card(S2.ribbon(S2.arc(x, y - 3, w / 2, h, Math.PI, 2 * Math.PI, 24), () => 2.0, [false, false]), 0);
      m.card(S2.rect(x - w / 2, y - 3 - h * 0.45, w, 1.6), 0); }
  } });
  // ---- revision 7: the fusion reactor (S21) far off on the bank, where the grid line begins. Its
  //      light is this layer (behind the embankment wall): a soft glow on the haze, the lantern's
  //      inner light, the ring of fire, and its reflection under the river's ripples. The paper
  //      lantern itself (plinth, torus, cage) is dark card on the `quay` layer in front, so it
  //      reads as a silhouette against its own glow. Its warmth is this layer's ew (always on).
  add({ name: 'reactor', z: -178, col: PAPER.deep, ew: 0, ef: 0.2, draw: (m, rnd) => {
    const { x, y } = REACTOR;
    m.soft(28, () => m.emit(S2.ellipse(x, y - 14, 74, 40), 0.2));
    m.soft(8, () => m.emit(S2.ellipse(x, y - 14, 32, 20), 0.5));
    m.soft(2, () => m.emit(S2.ellipse(x, y - 7, 17, 4), 1.0));                   // the ring of fire in the torus's hole
    for (const [y0, y1, v] of [[742, 760, 0.5], [760, 786, 0.28], [786, 820, 0.12]]) m.emit(S2.rect(x - 24, y0, 48, y1 - y0), v, 0);
    // the greenhouse's grow-lit panels, a small glow round them and their reflection
    { const g = GREENHOUSE, arch = S2.arc(g.x, g.y - 3, g.w / 2, g.h, Math.PI, 2 * Math.PI, 24);
      m.emit(arch.concat([[g.x + g.w / 2, g.y - 3], [g.x - g.w / 2, g.y - 3]]), 0.42, 0);
      m.soft(16, () => m.emit(S2.ellipse(g.x, g.y - 12, g.w * 0.8, 22), 0.12));
      for (const [y0, y1, v] of [[742, 764, 0.3], [764, 792, 0.14]]) m.emit(S2.rect(g.x - g.w / 2 + 6, y0, g.w - 12, y1 - y0), v, 0); }
  } });
  // ---- near blocks framing the frame (the humans' cool windows)
  add({ name: 'near', z: 30, col: PAPER.deep, alb: 0.55, ao: 0.45, cast: 1, rimk: 1.1, em: COOL.map(v => v * 0.75), draw: (m, rnd) => {
    for (const b of [{ x: -130, w: 190, top: 250, roof: 0.35 }, { x: 60, w: 150, top: 380, roof: 0.62 }, { x: 205, w: 120, top: 470, roof: 0.45 },
                     { x: 1690, w: 130, top: 430, roof: 0.15 }, { x: 1815, w: 230, top: 300, roof: 0.35 }]) {
      drawBuilding(m, b, rnd); windows(b, 16, 20, 6, 9, (r) => { if (rnd() < 0.07) m.emit(r, 0.35 + 0.5 * rnd()); });
    }
  } });
  // ---- the river: dark water card with ripple slits of tissue; under the district they catch
  //      its light, so the lanterns are doubled in the water
  add({ name: 'river', z: 110, col: PAPER.deep, alb: 0.15, ao: 0.3, vel: lin('#2D3656').map(v => v * 0.55), vw: 0.0, vl: 1.0, draw: (m, rnd) => {
    m.card(S2.rect(-140, CITY.base - 3, 2200, 600), 0.3);
    m.card(S2.rect(-140, CITY.base - 8, 2200, 7), 0.2);
    for (let y = CITY.base + 8; y < 980; y += 5 + (y - CITY.base) * 0.06) {
      const d = (y - CITY.base) / 240;
      for (let x = -120 + rnd() * 80; x < 2040; x += 60 + rnd() * 140 + 50 * d) {
        const w = 14 + rnd() * (40 + 60 * d), h = 1.2 + 1.4 * d;
        const r = S2.rect(x, y + rnd() * 3, w, h);
        m.cut(r, 0); m.vel(r, 0.5 + 0.5 * rnd(), 0);
      }
    }
  } });
  // ---- foreground: an embankment with trees, a lamp, and a pylon whose wires run to the district
  add({ name: 'fg', z: 260, col: PAPER.ink, alb: 0.35, ao: 0.4, def: 0.85, rimk: 0.9, em: COOL.map(v => v * 1.1), draw: (m, rnd) => {
    const g = [[-160, 1300]];
    for (let x = -160; x <= 2100; x += 15) g.push([x, nearEdge(x)]);
    g.push([2100, 1300]); m.card(g, 0.6);
    // (revision 3: the right-hand trees are smaller and further right, below the bank's grid line)
    for (const [tx, s] of [[520, 1.0], [640, 0.8], [1575, 0.72], [1735, 0.95], [1870, 1.2]]) {
      const ty = nearEdge(tx) + 2;
      m.card(S2.rect(tx - 4 * s, ty - 90 * s, 8 * s, 100 * s), 0.3);
      for (let k = 0; k < 7; k++) m.cardU(S2.ellipse(tx + (rnd() - 0.5) * 70 * s, ty - 110 * s - rnd() * 70 * s, (30 + rnd() * 26) * s, (26 + rnd() * 20) * s), 0.7);
    }
    // the lamp
    const lb = nearEdge(1182) + 2;
    m.card(S2.rect(1180, lb - 110, 4, 110), 0.2); m.card(S2.rrect(1170, lb - 118, 24, 10, 3), 0.2); m.emit(S2.ellipse(1182, lb - 106, 4, 2.5), 0.9);
    // the pylon (left) and its wires
    const px = 170, pb = 990, pt = 540;
    m.card([[px - 36, pb], [px - 8, pt], [px + 8, pt], [px + 36, pb], [px + 26, pb], [px + 2, pt + 30], [px - 2, pt + 30], [px - 26, pb]], 0.3);
    for (const [y, hw] of [[pt + 40, 60], [pt + 110, 74], [pt + 180, 88]]) m.card(S2.rect(px - hw, y, hw * 2, 5), 0.2);
    for (let y = pt + 60; y < pb - 30; y += 60) { m.card(S2.bar([px - 20, y], [px + 20, y + 50], 2.4), 0); m.card(S2.bar([px + 20, y], [px - 20, y + 50], 2.4), 0); }
    for (const [dy, hw] of [[40, 60], [110, 74], [180, 88]]) for (const s of [-1, 1]) {
      const a = [px + s * hw, pt + dy + 4];
      m.card(S2.ribbon(S2.cat([a, [a[0] + 500, a[1] + 60 + 20 * s], [a[0] + 1100, a[1] + 40], [a[0] + 1800, a[1] - 10]], false, 16), () => 1.6, [false, false]), 0);
    }
  } });
  return S;
}

// per-frame state. lit: the district clock (local frame / 144, so codes are frames); fill: the
// glow behind the district; pre: the grid line's own low glow (the drawing, before the light).
export function cityState(o) {
  const lit = clamp(o.lit, 0, 1), fill = o.fill === undefined ? lit : o.fill;
  return {
    layers: { district: { t: lit }, mid: { t: lit }, sats: { t: lit }, quay: { ew: o.pre === undefined ? 1.2 : o.pre }, river: { ew: o.near === undefined ? 0.8 : o.near },
              reactor: { ew: o.reactor === undefined ? 2.4 : o.reactor } },
    light: { I: 5.2e4 * Math.pow(fill, 1.3) * (o.breath || 1) },
    fills: [{ x: CITY.glow[0], y: 790, z: 70, I: 3.4e4 * fill, a: 150, f: 420, h: 0.25 }, { x: CITY.glow[0], y: 560, z: -120, I: 1.0e4 * fill, a: 240, f: 650, h: 0.6 }],
  };
}
