// The data centre (S35, revision 13): one powers-of-ten pull-out in cut paper, in two paper sets.
//
// A, the aisle: S16's hall of racks (rack.js hallScene, its bay layers reused exactly: same paper,
//   same LEDs, same edges), seen down its aisle. At its far end, where S16 had a door, a row of racks
//   faces us, and in the middle of it an open frame holds one card, the card Clawd designed in S34
//   (hall.js drawCard). The card sits on the aisle's vanishing point, so the whole hall converges
//   on it. S35 opens close on its die and pulls straight back down the aisle: the bays are a tunnel
//   book, and each one enters from the edges of frame as the camera passes it.
//   A close-up this deep (the die goes from 560 px to 5.6 px) needs the far end drawn at several
//   resolutions: the card at 83 local px per world px, then levels of the end row at 16, 6.4, 2.5
//   and 1. Levels at one depth are cross-faded by scale (levelOps): only the level in use and the
//   next one are ever visible, so a cut in one level never shows another level's copy.
// B, the campus: the same hall's roof from above, then the site, a campus of long, low data halls
//   whose plan is the die's floorplan (hall.js BLOCKS): the logic band's eight strips are eight
//   halls, the arrays are rows of long halls, the caches four squat halls, the narrow blocks chiller
//   yards, the core frame a ring road, the pad ring the generators round the fence. At rest the
//   campus sits exactly where the die sat on S35's first frame (x 680-1240, y 260-820). Roofs are
//   card; lit, they glow through their paper, their seams and fans brighter (step codes by distance
//   from the hero hall, so they light in a wave). Levels at 27, 9, 3 and 1 local px per world px.
//
// Nothing here changes rack.js or hall.js scenes; S16 and the rest are untouched (opt-in module).
import { S2, lin, lerp, clamp, smooth, mulberry32, PAPER } from './kit.js';
import { hallScene as rackHall, HALL } from './rack.js';
import { drawCard, CARD, BLOCKS, CORE, DIE_LINES } from './hall.js';

// ---------------------------------------------------------------- levels
// A level draws world geometry at k local px per world px about the world point Cw (local centre Cl):
// world = Cw + (local - Cl) / k. levelRec wraps a recorder so draw code stays in world px.
export const levelXF = (k, Cw, Cl) => ({ s: 1 / k, piv: Cl, dx: Cw[0] - Cl[0], dy: Cw[1] - Cl[1] });
function levelRec(m, k, Cw, Cl, o = {}) {
  const f = (pts) => pts.map(([x, y]) => [Cl[0] + (x - Cw[0]) * k, Cl[1] + (y - Cw[1]) * k]);
  const ampK = o.ampK ?? 1, minPx = o.minPx ?? 0;
  const tiny = (pts) => {
    if (!minPx) return false;
    let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    for (const [x, y] of pts) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; }
    return Math.min(c - a, d - b) * k < minPx;
  };
  const A = (amp, d) => (amp === undefined ? d : amp) * ampK;
  const r = {
    k,
    card: (p, amp) => { if (!tiny(p)) m.card(f(p), A(amp, 0.6)); },
    cut: (p, amp) => { if (!tiny(p)) m.cut(f(p), A(amp, 0.6)); },
    step2: (p, t, v = 1, amp) => { if (!tiny(p)) m.step2(f(p), t, v, A(amp, 0)); },
    chase: (p, c, v = 1, amp) => { if (!tiny(p)) m.chase(f(p), c, v, A(amp, 0)); },
    emit: (p, v = 1, amp) => { if (!tiny(p)) m.emit(f(p), v, A(amp, 0)); },
    vel: (p, v = 1, amp) => { if (!tiny(p)) m.vel(f(p), v, A(amp, 0.6)); },
  };
  // on a timed level, tissue and plain pinholes become coded pinholes (lit from code `lit`)
  if (o.timedAs) { r.vel = (p, v = 1, amp) => r.step2(p, o.timedAs, v * 0.9, amp); r.emit = (p, v = 1, amp) => r.step2(p, o.timedAs, v, amp); }
  return r;
}
// Levels at one depth, finest first, each with its hand-off scale h (it fades out as the camera's
// scale on that plane falls from 1.3 h to h, while the next one, already up, takes over).
export function levelOps(s, levels) {
  const op = {};
  levels.forEach((L, i) => {
    const down = i === levels.length - 1 ? 1 : smooth(L.h, 1.3 * L.h, s);
    const up = i === 0 ? 1 : 1 - smooth(1.3 * levels[i - 1].h, 1.6 * levels[i - 1].h, s);
    op[L.name] = down * up;
  });
  return op;
}

// ================================================================ A: the aisle
export const DIE_PX0 = 560;                       // the die's side on S35's first frame (MATCH.md)
export const A_DW = 5.6;                          // the die's side at the far end of the aisle, at rest
export const A_S0 = DIE_PX0 / A_DW;               // the camera's scale on the far end at the first frame
export const A_DC = [HALL.vp[0], HALL.vp[1]];     // the die's centre: the aisle's vanishing point
export const Z_END = -470;                        // S16's end wall depth
const CARD_DC = [(CARD.die[0] + CARD.die[2]) / 2, (CARD.die[1] + CARD.die[3]) / 2];
const A_KC = (CARD.die[2] - CARD.die[0]) / A_DW;  // card-local px per world px (82.9)
export const cardA = ([x, y]) => [A_DC[0] + (x - CARD_DC[0]) / A_KC, A_DC[1] + (y - CARD_DC[1]) / A_KC];
const A_CARD_XF = { s: 1 / A_KC, piv: CARD_DC, dx: A_DC[0] - CARD_DC[0], dy: A_DC[1] - CARD_DC[1] };
export const DIE_LINES_A = () => DIE_LINES().map((l) => ({ part: l.part, pts: l.pts.map(cardA) }));

// the far end (world px of S16's rest view): 34 m away, 700/34 px per metre
const PXM = HALL.f / 34;
const EY = (Y) => HALL.vp[1] + Y * PXM;
const E_FLOOR = EY(HALL.eye), E_TOP = EY(HALL.eye - 2.2), E_CEIL = EY(HALL.eye - 3.1);
const CARD_BOX = (() => { const a = cardA([CARD.bracket[0], CARD.board[1]]), b = cardA([CARD.board[2], CARD.tab[3]]); return [a[0], a[1], b[0], b[1]]; })();
const OF = [CARD_BOX[0] - 3.2, CARD_BOX[2] + 3.4];            // the open frame's posts (x)
const SLOT_Y = CARD_BOX[3] + 0.5;                              // the slot rail under the card
const RW = 0.6 * PXM, RG = 0.045 * PXM;                        // rack width, gap
function endRacks() {
  const out = [];
  for (let x1 = OF[0] - RG; x1 > HALL.vp[0] - 175; x1 -= RW + RG) out.push([x1 - RW, x1]);
  for (let x0 = OF[1] + RG; x0 < HALL.vp[0] + 175; x0 += RW + RG) out.push([x0, x0 + RW]);
  return out;
}
const FROM_CARD = (x) => Math.abs(x - (OF[0] + OF[1]) / 2);
export const A_END_C = [HALL.vp[0], HALL.vp[1] + 6];          // the end levels' world centre
const A_LC = [960, 540];                                       // the world rect's centre (local centre)
export const END_LEVELS = [
  { name: 'end16', k: 16, h: 14.3 }, { name: 'end6', k: 6.4, h: 5.7 }, { name: 'end2', k: 2.5, h: 2.2 }, { name: 'end1', k: 1 },
];
export const CARD_H = 21.4;                                    // the card layer hands off below this scale
export const BAY_K = [1, 1, 1.6, 2.4, 3.4, 5, 7];              // the bays' resolution, near to far
const BAY_CW = [HALL.vp[0], HALL.vp[1]];                        // their levels' world centre

// a server unit's face, face on: seams, cool LEDs (plain pinholes), a warm activity LED (coded)
function unitFace(m, x0, x1, y0, y1, rnd, code) {
  const k = m.k, pitch = Math.max(0.089 * PXM, 2.4 / k), sh = Math.max(0.018 * PXM, 0.7 / k);
  for (let y = y0 + 0.08 * PXM; y < y1 - 0.05 * PXM; y += pitch) {
    m.cut(S2.rect(x0 + 0.05 * PXM, y, (x1 - x0) - 0.16 * PXM, sh), 0);
    if (rnd() < 0.22) { const r = Math.max(0.02 * PXM, 0.6 / k), c = S2.ellipse(x1 - 0.07 * PXM, y + sh / 2, r, r, 0, 10); m.cut(c, 0); m.emit(c, 0.4 + 0.5 * rnd()); }
  }
  const nL = Math.min(6, Math.floor((y1 - y0 - 0.12 * PXM) / (0.13 * PXM)));
  if (code !== undefined) for (let j = 0; j < nL; j++) {
    const r = Math.max(0.028 * PXM, 0.7 / k), c = S2.ellipse(x0 + 0.08 * PXM, y0 + (0.1 + 0.13 * j) * PXM, r, r, 0, 10);
    m.cut(c, 0); m.step2(c, Math.min(0.99, code + 0.012 * j), 1.0);
  }
}
// the end row at the level's scale: racks across the hall's end, the open frame, the card in it
function drawEnd(m, rnd, lev) {
  const k = m.k;
  // the floor's far end below the row, the ceiling's above it (covered by the bays once they are in)
  m.card(S2.rect(HALL.vp[0] - 200, E_FLOOR - 0.2, 400, 70), 0.3);
  m.card(S2.rect(HALL.vp[0] - 200, E_CEIL - 70, 400, 70.2), 0.3);
  for (let x = HALL.vp[0] - 198; x < HALL.vp[0] + 200; x += 0.6 * PXM) m.cut(S2.rect(x, E_FLOOR + 0.6, Math.max(0.05, 0.6 / k), 69), 0);
  for (const [x0, x1] of endRacks()) {
    m.card(S2.rect(x0, E_TOP, x1 - x0, E_FLOOR - E_TOP), 0.3);
    m.card(S2.rect(x0 - 0.02 * PXM, E_TOP - 0.06 * PXM, x1 - x0 + 0.04 * PXM, 0.07 * PXM), 0.2);
    unitFace(m, x0, x1, E_TOP + 0.05 * PXM, E_FLOOR - 0.12 * PXM, rnd, 0.06 + 0.5 * FROM_CARD((x0 + x1) / 2) / 175);
  }
  // the open frame: posts, rails, braces; installed units above and below the card; a back panel
  // (so the card reads against something dark), with a hairline gap round the card
  const [p0, p1] = OF, pw = 0.05 * PXM;
  m.card(S2.rect(p0 + pw, E_TOP, p1 - p0 - 2 * pw, E_FLOOR - E_TOP), 0.2);
  const g = Math.max(0.012 * PXM, 0.5 / k);
  m.cut(S2.rect(CARD_BOX[0] - g, CARD_BOX[1] - g, CARD_BOX[2] - CARD_BOX[0] + 2 * g, CARD_BOX[3] - CARD_BOX[1] + 2 * g), 0);
  for (const x of [p0, p1 - pw]) m.card(S2.rect(x, E_TOP - 0.08 * PXM, pw, E_FLOOR - E_TOP + 0.08 * PXM), 0.2);
  m.card(S2.rect(p0 - 0.02 * PXM, E_TOP - 0.1 * PXM, p1 - p0 + 0.04 * PXM, 0.08 * PXM), 0.2);
  m.card(S2.rect(p0, SLOT_Y, p1 - p0, 0.05 * PXM), 0.1);
  m.card(S2.rect(p0 - 0.03 * PXM, E_FLOOR - 0.1 * PXM, p1 - p0 + 0.06 * PXM, 0.1 * PXM), 0.2);
  unitFace(m, p0 + pw, p1 - pw, E_TOP + 0.03 * PXM, CARD_BOX[1] - 0.12 * PXM, rnd, 0.03);
  for (let q = 0; q < 3; q++) {
    const y0 = SLOT_Y + 0.12 * PXM + q * 0.36 * PXM;
    m.cut(S2.rect(p0 + pw, y0 - 0.02 * PXM, p1 - p0 - 2 * pw, 0.015 * PXM), 0);
    unitFace(m, p0 + pw, p1 - pw, y0, y0 + 0.32 * PXM, rnd, 0.04 + 0.01 * q);
  }
  // the card itself (under the fine card layer until it hands off): drawCard, its tissue and
  // pinholes as coded pinholes, lit from the first code
  const mc = cardRec(m, lev);
  drawCard(mc, mulberry32(240));
}
// drawCard's card-local geometry into a level: card-local -> world (cardA) -> the level
function cardRec(m, lev) {
  const k = m.k, f = (pts) => pts.map(cardA), q = k / A_KC, tiny = (pts) => {
    let a = 1e9, c = -1e9, b = 1e9, d = -1e9;
    for (const [x, y] of pts) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; }
    return Math.min(c - a, d - b) * q < 0.55;
  };
  const L = 1 / 127;
  return {
    card: (p, amp) => { if (!tiny(p)) { const q2 = f(p); m.cut(q2, 0); m.card(q2, 0); m.step2(q2, L, 0); } },   // card over a glow: dark, still coded
    cut: (p, amp) => { if (!tiny(p)) m.cut(f(p), 0); },
    vel: (p, v = 1) => { if (!tiny(p)) m.step2(f(p), L, v * 0.8); },
    velU: (p, v = 1) => { if (!tiny(p)) m.step2(f(p), L, v * 0.8); },
    emit: (p, v = 1) => { if (!tiny(p)) m.step2(f(p), L, v); },
  };
}

// The aisle scene: rack.js's hall with its end wall replaced by the end row, the levels and the
// card. The bays keep S16's exact paper: their draw RNG and edge RNG are re-seeded for their
// new place in the layer order (the kit seeds both from the layer's index).
export function aisleScene() {
  const S = rackHall();
  const bays = S.layers.filter((l) => l.name !== 'end');
  const s16Index = {};
  [...S.layers].sort((a, b) => a.z - b.z).forEach((l, i) => { s16Index[l.name] = i; });
  const L = [];
  // the end wall behind the row (the row's gaps and seams show it), then the levels, coarsest first
  L.push({ name: 'endWall', z: Z_END - 2, col: PAPER.dusk, alb: 0.7, ao: 0, draw: (m) => {
    m.card(S2.rect(-140, -140, 2200, 1400), 0);
    for (const y of [E_TOP - 4, E_TOP - 11]) m.card(S2.rect(HALL.vp[0] - 180, y, 360, 0.8), 0);
  } });
  [...END_LEVELS].reverse().forEach((lev, j) => {
    L.push({ name: lev.name, z: Z_END, col: PAPER.deep, alb: 0.6, ao: 0, rimk: 0.8, bound: 1, lpx: 1,
      timed: 0.03, cw: 0.045, cg: 0, ew: 2.4, ef: 0.3, em: lin('#9FB3D9').map((v) => v * 0.9), seed: 70 + j,
      draw: (m, rnd) => drawEnd(levelRec(m, lev.k, A_END_C, A_LC, { ampK: Math.min(1, lev.k / 4) }), mulberry32(500 + j), lev) });
  });
  // the fine card (hall.js's card layer, scaled to the far end), on top of the levels
  L.push({ name: 'card', z: Z_END, col: PAPER.ink, alb: 0.45, ao: 0, cast: 1, rimk: 1.5, thin: 0.1, bound: 1, lpx: 1,
    vel: lin('#3A4270'), vw: 0, vl: 1.0, em: lin('#9FB3D9').map((v) => v * 0.5), ew: 0, ef: 0.3,
    draw: (m) => drawCard(m, mulberry32(240)) });
  // S16's bays, re-seeded (index i in the new order; the kit seeds edges with 1000 + i*7919 + seed
  // and the draw RNG with 77 + i + seed*31). R14: a far bay is drawn at BAY_K local px per world px
  // (it is huge on screen when the camera passes it), and each bay carries the two nearer bays'
  // paper (card and cuts only) beyond its own: the tunnel's rings overlap as they come in, so no gap
  // opens between them. At rest the copies sit exactly behind the bays they copy.
  const nBefore = L.length, byName = {};
  bays.forEach((b) => { byName[b.name] = b; });
  const drawRnd = (b) => mulberry32(77 + s16Index[b.name] + (b.seed || 0) * 31);
  bays.sort((a, b) => a.z - b.z).forEach((b, j) => {
    const iNew = nBefore + j, iOld = s16Index[b.name], seed0 = b.seed || 0, draw0 = b.draw;
    const bi = +b.name.slice(3), k = BAY_K[bi];
    L.push(Object.assign({}, b, {
      seed: seed0 + (iOld - iNew) * 7919, bound: k > 1 ? 1 : 0,
      draw: (m, rnd, pose) => {
        const mk = k === 1 ? m : levelRec(m, k, BAY_CW, A_LC);          // hand-cut edges at the level's own px
        draw0(mk, drawRnd(b), pose);
        for (const q of [bi - 1, bi - 2]) if (q >= 0) byName['bay' + q].draw(geomOnly(mk), drawRnd(byName['bay' + q]), pose);
      },
    }));
  });
  // the card layer keeps hall.js's edge seed: index 8, seed 5 in the old hall
  const iCard = L.findIndex((l) => l.name === 'card');
  L[iCard].seed = 5 + (8 - iCard) * 7919;
  S.layers = L;
  S.name = 'aisle';
  S.cam = { Zc: 2400, zref: 0, c: A_DC.slice() };
  return S;
}

// a recorder that keeps only paper (card and cuts): no pinholes, no codes
function geomOnly(m) { const no = () => {}; return { k: m.k, card: m.card, cut: m.cut, emit: no, step2: no, chase: no, timed: no, vel: no, velU: no, soft: (r, fn) => fn() }; }

// per-frame: sc = the camera's scale on the far end (A_S0 at the first frame, 1 at rest), f = the
// shot's local frame, card = the card's own light (0..1+), on = [bay online 0..1] near to far,
// endOn = the end row's clock, wave = the chase clock, lamp, fills
const BAY_Z = (() => { const o = {}; rackHall().layers.forEach((l) => { o[l.name] = l.z; }); return o; })();
const BAY_EM = lin('#9FB3D9').map((v) => v * 0.9);                 // rack.js's bays' cool LEDs
export function aisleCam(sc, panY = 0) {
  const d = 2400 - Z_END;
  return { Zc: 2400, zref: 0, c: A_DC.slice(), t: [0, 0], tz: d - d / sc, pan: [0, panY], near: 0.5 };
}
export function aisleState(o) {
  const layers = {};
  const sc = o.sc;
  const lops = levelOps(sc, END_LEVELS);
  const c = clamp(o.card || 0, 0, 2);
  const cardOp = smooth(CARD_H, 1.3 * CARD_H, sc);
  layers.card = Object.assign({ vw: 1.3 * c, ew: 2.0 * c, vl: 1.0, op: cardOp }, A_CARD_XF);
  END_LEVELS.forEach((lev) => {
    layers[lev.name] = Object.assign({ op: lops[lev.name], t: o.endOn || 0, ew: 2.2 * Math.min(1, c) }, levelXF(lev.k, A_END_C, A_LC));
  });
  const cam = aisleCam(sc, o.panY || 0), onAt = [];
  for (let i = 0; i < HALL.n; i++) {
    const d = 2400 - BAY_Z['bay' + i], si = d / Math.max(d - cam.tz, 1e-3);
    // a bay comes online as the camera passes it, far to near; what is too magnified to hold its
    // shape (tex: screen px per texel) waits: rows and cool LEDs, then the square chase dashes
    const k = BAY_K[i], tex = si / k;
    const on = o.on ? clamp(o.on[i], 0, 1) : 1 - smooth(3.5, 6, tex);
    layers['bay' + i] = Object.assign({ t: on, cc: o.wave ? o.wave.cc : 0, cg: (o.wave ? o.wave.cg : 0) * (1 - smooth(2.2, 4.5, tex)), em: BAY_EM.map((v) => v * (1 - smooth(4, 7, tex))),
      xs: clamp(1 / si, 1 / k, 1) }, k > 1 ? levelXF(k, BAY_CW, A_LC) : {});
    onAt[i] = on;
  }
  const st = { layers, cam, on: onAt };
  // the card's lamp (hall.js's, at the same place relative to the die, scaled with the card)
  const q = 1 / (A_KC / 4);
  st.light = { x: A_DC[0] + 132 * q, y: A_DC[1] - 186 * q, z: Z_END - 44 * q, r: 14 * q, I: 3.8e4 * q * q * (o.lamp || 0), a: 120 * q, f: 900 * q };
  st.fills = o.fills || [];
  return st;
}

// ================================================================ B: the campus
// campus coordinates: (u, v) over the die, 0..1 -> world px of the final frame
export const CAMPUS = { x0: 680, y0: 260, side: 560 };
export const CU = (u, v) => [CAMPUS.x0 + CAMPUS.side * u, CAMPUS.y0 + CAMPUS.side * v];
const LOGIC = BLOCKS.find((b) => b.k === 'logic');
const ROAD = 0.012;                                          // a road between halls, in die units
// the halls: rect in world px, orientation ('v' long axis vertical), kind
export const HALLS = (() => {
  const H = [];
  const push = (u0, v0, u1, v1, kind, dir) => { const a = CU(u0, v0), b = CU(u1, v1); H.push({ r: [a[0], a[1], b[0], b[1]], kind, dir }); };
  const r = LOGIC.r, n = LOGIC.div + 1;
  for (let k = 0; k < n; k++) { const ua = lerp(r[0], r[2], k / n), ub = lerp(r[0], r[2], (k + 1) / n); push(ua + ROAD / 2, r[1] + ROAD, ub - ROAD / 2, r[3] - ROAD, 'logic', 'v'); }
  for (const b of BLOCKS) {
    const [u0, v0, u1, v1] = b.r;
    if (b.k === 'array') { const m = 3; for (let q = 0; q < m; q++) { const va = lerp(v0, v1, q / m), vb = lerp(v0, v1, (q + 1) / m); push(u0, va + (q ? ROAD / 2 : 0), u1, vb - (q < m - 1 ? ROAD / 2 : 0), 'array', 'h'); } }
    if (b.k === 'cache') push(u0, v0, u1, v1, 'cache', 'h');
    if (b.k === 'narrow') push(u0, v0, u1, v1, 'narrow', 'v');
  }
  return H;
})();
export const HERO = HALLS[5];                                // the logic band's sixth strip: the centre
export const HERO_C = [(HERO.r[0] + HERO.r[2]) / 2, (HERO.r[1] + HERO.r[3]) / 2];
export const Z_ROOF = 3, Z_SITE = 0, Z_LAND = -3;
const B_LC = [960, 540];
export const B_WORLD = { x0: -240, y0: -460, w: 2400, h: 2000 };
export const ROOF_LEVELS = [
  { name: 'roof27', k: 27, h: 22 }, { name: 'roof9', k: 9, h: 7.3 }, { name: 'roof3', k: 3, h: 2.45 }, { name: 'roof1', k: 1 },
];
export const SITE_LEVELS = [{ name: 'site9', k: 9, h: 7.3 }, { name: 'site3', k: 3, h: 2.45 }, { name: 'site1', k: 1 }];
const levelC = (k) => (k === 1 ? B_LC : HERO_C);
const levelBox = (k, pad = 0) => { const C = levelC(k), hw = 1200 / k + pad, hh = 1000 / k + pad; return [C[0] - hw, C[1] - hh, C[0] + hw, C[1] + hh]; };
const meets = (r, b) => r[0] < b[2] && r[2] > b[0] && r[1] < b[3] && r[3] > b[1];

// the wave: every roof, seam, fan and pad lights when the front reaches it. Its code is its distance
// from the hero hall's centre through `waveCode` (set by the shot from its own schedule).
let WAVE = (d) => clamp(d / 600, 0, 1);
export function setWave(fn) { WAVE = fn; }
const dist = ([x, y]) => Math.hypot(x - HERO_C[0], y - HERO_C[1]);
const codeAt = (p) => clamp(WAVE(dist(p)), 1 / 127, 0.995);

// a fan seen from above: a lit round opening, a dark hub, blades and rim over it (card over the
// glow stays coded, so its edges never show the cool pinhole colour)
function cardOver(m, p, code) { m.cut(p, 0); m.card(p, 0); m.step2(p, code, 0); }
function fan(m, x, y, R, code, rnd, glow) {
  const k = m.k, c = S2.ellipse(x, y, R, R, 0, Math.max(10, Math.min(40, Math.round(R * k))));
  m.cut(c, 0); m.step2(c, code, glow);
  if (R * k < 2.5) return;
  cardOver(m, S2.ellipse(x, y, R * 0.24, R * 0.24, 0, 14), code);
  if (R * k < 7) return;
  const a0 = rnd() * 6.28, nb = 5;
  for (let b = 0; b < nb; b++) {
    const a = a0 + (b * 2 * Math.PI) / nb, w = 0.2 * R, pts = [];
    for (let t = 0; t <= 6; t++) { const rr = lerp(0.2, 0.93, t / 6) * R, aa = a + 0.55 * (t / 6); pts.push([x + rr * Math.cos(aa), y + rr * Math.sin(aa)]); }
    cardOver(m, S2.ribbon(pts, (u) => w * (1 - 0.4 * u), [true, true]), code);
  }
  cardOver(m, S2.ribbon(Array.from({ length: 41 }, (_, i) => [x + R * Math.cos(i * Math.PI / 20), y + R * Math.sin(i * Math.PI / 20)]), () => Math.max(0.07 * R, 0.5 / k), [false, false]), code);
}
// rooftop plant by hall kind (world px): dry coolers, boxes with a row of fans along them, in
// columns across the roof; the chiller yards (the die's narrow blocks) are packed tight
const PLANT = {
  logic: { cw: 4.6, cl: 11.5, nf: 3, pitch: 14.5, cols: 2 },
  array: { cw: 4.6, cl: 11.5, nf: 3, pitch: 14.5, cols: 2 },
  cache: { cw: 4.6, cl: 11.5, nf: 3, pitch: 14.5, cols: 5 },
  narrow: { cw: 4.4, cl: 6.6, nf: 2, pitch: 7.6, cols: 3 },
};
// one hall's roof: dark card, a faint glow through its paper when the hall is on, fine seams and a
// parapet slit that light brighter, and the coolers' fans brightest
function roof(m, H, rnd, box) {
  const [x0, y0, x1, y1] = H.r, k = m.k, v = H.dir === 'v';
  const W = v ? x1 - x0 : y1 - y0, Lh = v ? y1 - y0 : x1 - x0;         // width across, length along
  const P = (a, b) => (v ? [x0 + a, y0 + b] : [x0 + b, y0 + a]);         // a across, b along
  const R = (a0, b0, a1, b1) => { const p = P(a0, b0), q = P(a1, b1); return S2.rect(Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])); };
  const near = (p, r) => !box || (p[0] + r > box[0] && p[0] - r < box[2] && p[1] + r > box[1] && p[1] - r < box[3]);
  const cc = codeAt([(x0 + x1) / 2, (y0 + y1) / 2]);
  m.card(S2.rect(x0, y0, x1 - x0, y1 - y0), 0.4);
  const e = 1.1, sw = Math.max(0.28, 0.5 / k);
  m.step2(R(e, e, W - e, Lh - e), cc, 0.06);                            // the roof's own glow
  for (const r of [R(e, e, W - e, e + sw), R(e, Lh - e - sw, W - e, Lh - e), R(e, e, e + sw, Lh - e), R(W - e - sw, e, W - e, Lh - e)]) { m.cut(r, 0); m.step2(r, cc, 0.3); }
  const pitch = 3.6, sh = Math.max(0.16, 0.45 / k);
  if (pitch * k >= 2.4) for (let b = e + pitch; b < Lh - e - 1; b += pitch) {
    const mid = P(W / 2, b); if (!near(mid, W)) continue;
    const r = R(e + sw, b, W - e - sw, b + sh); m.cut(r, 0); m.step2(r, codeAt(mid), 0.26);
  }
  if (H.kind !== 'narrow' && 0.3 * k > 1) { const r = R(W / 2 - 0.15, e + 2, W / 2 + 0.15, Lh - e - 2); m.cut(r, 0); m.step2(r, cc, 0.18); }
  const pl = PLANT[H.kind], cols = pl.cols, span = W - 2 * e - 2, nAlong = Math.floor((Lh - 2 * e - 2) / pl.pitch);
  const b0 = (Lh - nAlong * pl.pitch) / 2;
  for (let j = 0; j < cols; j++) {
    const a = e + 1 + span * (j + 0.5) / cols;
    for (let q = 0; q < nAlong; q++) {
      const b = b0 + q * pl.pitch + (pl.pitch - pl.cl) / 2, mid = P(a, b + pl.cl / 2);
      if (!near(mid, pl.cl)) continue;
      const sh0 = Math.max(0.5, 0.45 / k);
      m.cut(R(a + pl.cw / 2, b + 0.5, a + pl.cw / 2 + sh0, b + pl.cl + 0.5), 0);
      m.cut(R(a - pl.cw / 2 + 0.5, b + pl.cl, a + pl.cw / 2 + sh0, b + pl.cl + sh0), 0);
      cardOver(m, R(a - pl.cw / 2, b, a + pl.cw / 2, b + pl.cl), cc);
      if (H.kind !== 'narrow' && q < nAlong - 1 && 1.2 * k > 3) {
        const vb = b + pl.cl + (pl.pitch - pl.cl) / 2, vv = P(a, vb);
        if (near(vv, 2)) { cardOver(m, R(a - 0.7, vb - 0.7, a + 0.7, vb + 0.7), cc); const sl = R(a - 0.45, vb - 0.08, a + 0.45, vb + 0.08); m.cut(sl, 0); m.step2(sl, cc, 0.35); }
      }
      const fr = Math.min(pl.cw, pl.cl / pl.nf) * 0.4;
      for (let f = 0; f < pl.nf; f++) { const p = P(a, b + pl.cl * (f + 0.5) / pl.nf); fan(m, p[0], p[1], fr, codeAt(p), rnd, 0.62); }
    }
  }
}
function drawRoofs(m, rnd, k) {
  const box = k === 1 ? null : levelBox(k, 4);
  for (const H of HALLS) if (!box || meets(H.r, box)) roof(m, H, rnd, box);
}
// the site: its gravel plot, the fence (a fine slit), the ring road (the core's frame) with lamp
// posts, the generators (the die's pad ring: boxes with a warm vent, the wave's last ring)
function drawSite(m, rnd, k) {
  const box = k === 1 ? null : levelBox(k, 4);
  const inBox = (r) => !box || meets(r, box);
  const [a, b] = [CU(-0.02, -0.02), CU(1.02, 1.02)];
  m.card(S2.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]), 0.5);
  const f0 = CU(0, 0), f1 = CU(1, 1), fw = Math.max(0.5, 0.5 / k);
  for (const r of [[f0[0], f0[1], f1[0], f0[1] + fw], [f0[0], f1[1] - fw, f1[0], f1[1]], [f0[0], f0[1], f0[0] + fw, f1[1]], [f1[0] - fw, f0[1], f1[0], f1[1]]]) if (inBox(r)) m.cut(S2.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]), 0);
  const c0 = CU(CORE[0], CORE[1]), c1 = CU(CORE[2], CORE[3]), rw = 5 / 464 * CAMPUS.side;
  for (const r of [[c0[0], c0[1], c1[0], c0[1] + rw], [c0[0], c1[1] - rw, c1[0], c1[1]], [c0[0], c0[1], c0[0] + rw, c1[1]], [c1[0] - rw, c0[1], c1[0], c1[1]]]) if (inBox(r)) m.cut(S2.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]), 0);
  for (let t = 0.1; t < 0.95; t += 0.05) for (const [u, v] of [[t, CORE[1]], [t, CORE[3]], [CORE[0], t], [CORE[2], t]]) {
    const p = CU(u, v); if (box && !meets([p[0] - 1, p[1] - 1, p[0] + 1, p[1] + 1], box)) continue;
    const c = S2.ellipse(p[0], p[1], Math.max(0.45, 0.6 / k), Math.max(0.45, 0.6 / k), 0, 8); m.cut(c, 0); m.emit(c, 0.45);
  }
  for (let t = 0.05; t < 0.96; t += 0.036) for (const [u, v] of [[t, 0.03], [t, 0.97], [0.03, t], [0.97, t]]) {
    const p = CU(u, v), s = 9 / 464 * CAMPUS.side, r = [p[0] - s / 2, p[1] - s / 2, p[0] + s / 2, p[1] + s / 2];
    if (!inBox(r)) continue;
    m.cut(S2.rect(r[0] - 0.6, r[1] - 0.6, s + 1.2, s + 1.2), 0);
    m.card(S2.rect(r[0], r[1], s, s), 0.2);
    const q = S2.ellipse(p[0], p[1], s * 0.2, s * 0.2, 0, 12); m.cut(q, 0); m.step2(q, codeAt(p), 0.7);
  }
  // the power lines coming in (the card's traces, outside): power running in along them as short
  // warm pulses (chase codes, three to a line); their wires and pylons are on the land
  if (k !== 1) return;
  POWER_LINES.forEach((pts, li) => {
    for (let i = 0; i < pts.length - 1; i++) { const r = S2.bar(pts[i], pts[i + 1], 1.1); m.chase(r, ((1 - i / pts.length) * 3 + 0.37 * li) % 1, 0.8); }
  });
}
const POWER_LINES = (() => {
  const L = [];
  for (let q = 0; q < 5; q++) { const p = CU(0.15 + 0.16 * q, 1.0); L.push([[p[0], p[1] + 8], [p[0] + (q - 2) * 40, 1100], [p[0] + (q - 2) * 90, 1540]]); }
  for (let q = 0; q < 3; q++) { const p = CU(1.0, 0.25 + 0.25 * q); L.push([[p[0] + 8, p[1]], [1500, p[1] + (q - 1) * 50], [2160, p[1] + (q - 1) * 120]]); }
  return L.map((pl) => S2.cat(pl, false, 30));
})();
// the land: a dark base with the highway cut through it, and a patchwork of fields in a second,
// slightly lighter paper laid over it (hedgerows are the gaps between them)
const RIVER = [[2160, -120], [1760, 60], [1520, 20], [1330, 170], [1400, 420], [1600, 610], [1520, 900], [1700, 1200], [1640, 1540]];
const RIVER_PTS = S2.cat(RIVER, false, 16);
const nearRiver = (x, y, r) => RIVER_PTS.some((p) => Math.hypot(p[0] - x, p[1] - y) < r);
function drawLand(m) {
  m.card(S2.rect(-240, -460, 2400, 2000), 0.2);
  m.cut(S2.ribbon([[-240, 1180], [300, 990], [640, 905], [1500, 1330], [1700, 1540]], () => 6, [false, false]), 0.3);
  const river = S2.ribbon(S2.cat(RIVER, false, 16), (u) => 26 + 12 * Math.sin(u * 9), [false, false]);
  m.cut(river, 0.8); m.vel(river, 0.55, 0.8);
  // the power lines' wires (faint cool pinhole lines) and pylons (a cross with a cool light)
  POWER_LINES.forEach((pts) => {
    for (let i = 0; i < pts.length - 1; i++) { const r = S2.bar(pts[i], pts[i + 1], 0.55); m.cut(r, 0); m.emit(r, 0.15); }
    for (let i = 2; i < pts.length; i += 5) { const p = pts[i]; m.card(S2.rect(p[0] - 2.4, p[1] - 0.5, 4.8, 1), 0); m.card(S2.rect(p[0] - 0.5, p[1] - 1.7, 1, 3.4), 0); const c = S2.ellipse(p[0], p[1] - 1.7, 0.7, 0.7, 0, 8); m.cut(c, 0); m.emit(c, 0.8); }
  });
}
function drawFields(m) {
  const R2 = mulberry32(57), plot = [CU(-0.08, -0.08), CU(1.08, 1.08)];
  const inPlot = (x, y) => x > plot[0][0] && x < plot[1][0] && y > plot[0][1] && y < plot[1][1];
  // strips of fields following a gently curving grain, each field a skewed quad
  for (let row = 0; row < 26; row++) {
    const y0 = -460 + row * 78 + 20 * R2(), tilt = 0.18 * (R2() - 0.5);
    for (let x = -240; x < 2160;) {
      const w = 60 + 150 * R2(), h = 50 + 40 * R2(), sk = 18 * (R2() - 0.5);
      const cx = x + w / 2, cy = y0 + (x - 960) * tilt + h / 2;
      if (!inPlot(cx, cy) && R2() < 0.58 && !nearRiver(cx, cy, 30 + w / 2)) {
        const q = [[x + 2 + sk, y0 + (x - 960) * tilt + 2], [x + w - 2 + sk, y0 + (x + w - 960) * tilt + 2], [x + w - 2, y0 + (x + w - 960) * tilt + h - 2], [x + 2, y0 + (x - 960) * tilt + h - 2]];
        m.card(q, 0.9);
      }
      x += w;
    }
  }
}
export function campusScene() {
  const S = { name: 'campus' };
  S.world = B_WORLD;
  S.light = { x: HERO_C[0], y: HERO_C[1], z: 40, r: 6, I: 0, a: 40, f: 400 };
  S.hazeW = 4e-5;
  S.params = { arim: 0.12, hm: 1.0e-5, rim: 1.3 };
  S.cam = { Zc: 2400, zref: 0, c: HERO_C.slice() };
  S.hazeBack = 40; S.hazeFront = 60;
  S.moon = { dir: [-0.3, 0.45, 1], I: 0.25, disc: [0, 0, 0] };
  const COOL = lin('#9FB3D9');
  const L = S.layers = [];
  L.push({ name: 'land', z: Z_LAND, col: '#0A0D15', alb: 0.6, ao: 0.2, seed: 3, vel: lin('#2A3358'), vw: 0, vl: 0, em: COOL.map((v) => v * 0.8), draw: (m) => drawLand(m) });
  L.push({ name: 'fields', z: Z_LAND + 0.8, col: '#10141F', alb: 0.6, ao: 0.15, rimk: 0.5, seed: 4, draw: (m) => drawFields(m) });
  [...SITE_LEVELS].reverse().forEach((lev, j) => L.push({ name: lev.name, z: Z_SITE, col: PAPER.ink, alb: 0.7, ao: 0.35, rimk: 1.1, bound: 1, lpx: 1,
    timed: 0.02, cw: 0.045, cg: 0, ew: 2.4, ef: 0.35, em: COOL.map((v) => v * 0.7), seed: 10 + j,
    draw: (m, rnd) => drawSite(levelRec(m, lev.k, levelC(lev.k), B_LC, { ampK: Math.min(1, lev.k / 3) }), mulberry32(600 + j), lev.k) }));
  [...ROOF_LEVELS].reverse().forEach((lev, j) => L.push({ name: lev.name, z: Z_ROOF, col: PAPER.slate, alb: 0.8, ao: 0.4, cast: 1, rimk: 1.0, bound: 1, lpx: 1,
    timed: 0.02, cw: 0.045, cg: 0, ew: 2.4, ef: 0.5, em: COOL.map((v) => v * 0.7), seed: 20 + j,
    draw: (m, rnd) => drawRoofs(levelRec(m, lev.k, levelC(lev.k), B_LC, { ampK: Math.min(1, lev.k / 3) }), mulberry32(700 + j), lev.k) }));
  return S;
}
// per-frame: s = the camera's scale on the roofs (1 at rest), panK (1 at the start: the hero at the
// frame's centre .. 0 at rest), t = the wave's clock, lines = the power lines' chase
export function campusCam(s, panK) {
  const d = 2400 - Z_ROOF;
  return { Zc: 2400, zref: 0, c: HERO_C.slice(), t: [0, 0], tz: d - d / s, pan: [(960 - HERO_C[0]) * panK, (540 - HERO_C[1]) * panK], near: 0.5 };
}
export function campusState(o) {
  const layers = {};
  const rops = levelOps(o.s, ROOF_LEVELS), sops = levelOps(o.s, SITE_LEVELS);
  const fade = o.fade !== undefined ? { timed: o.fade } : {};           // the wave's fade width (clock units)
  ROOF_LEVELS.forEach((lev) => { layers[lev.name] = Object.assign({ op: rops[lev.name], t: o.t, ew: 2.4 * (o.glow || 1) }, fade, levelXF(lev.k, levelC(lev.k), B_LC)); });
  SITE_LEVELS.forEach((lev) => { layers[lev.name] = Object.assign({ op: sops[lev.name], t: o.t, cc: o.lines ? o.lines.cc : 0, cg: o.lines ? o.lines.cg : 0 }, fade, levelXF(lev.k, levelC(lev.k), B_LC)); });
  return { layers, cam: campusCam(o.s, o.panK), light: o.light || { I: 0 }, fills: o.fills || [], post: o.post };
}
