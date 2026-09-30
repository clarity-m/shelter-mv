// The hall of compute (S35): the greenhouse's arched ribs and vellum vault (greenhouse.js) over rows
// of paper server racks down the aisle, a supercomputer in a chapel: people's hall, grown from S06's
// rack and S16's hall. In the foreground on the right an open rack holds one card, the card Clawd
// designed in S34: board, bracket, a die in its package, traces, a finned heatsink, and the gold edge
// connector seated in the rack's slot.
// Revision 10: S35 opens close on the die (seen face-on, as a chip on the ground is seen from
// straight above) and pulls out to the whole hall in one bar. So the card is authored at CARD_K
// (4x) in its own layer's coordinates and scaled into place by the layer transform, and the rack at
// 2x, so the close-up stays crisp. The die is a cut-paper floorplan after a die shot: blocks of
// tissue of different densities (arrays ruled with fine card rows, caches, a band of logic strips)
// in a dark die, a ring of pads round it; it glows block by block in warm tones when lit.
// World coordinates are screen px of the rest view (the hall's own layers are authored in them).
import { S2, lin, lerp, clamp, mulberry32, PAPER } from './kit.js';
import { GH, BAYS, END, archPts } from './greenhouse.js';

// ---------------------------------------------------------------- the card (authored at 4x)
export const CARD_K = 4, Z_CARD = 244, Z_RACK = 240;
const CARD_LC = [960, 560], CARD_WC = [1280, 705];                     // local centre <-> world centre
export const cardToWorld = ([x, y]) => [CARD_WC[0] + (x - CARD_LC[0]) / CARD_K, CARD_WC[1] + (y - CARD_LC[1]) / CARD_K];
export const CARD_XF = { s: 1 / CARD_K, piv: CARD_LC, dx: CARD_WC[0] - CARD_LC[0], dy: CARD_WC[1] - CARD_LC[1] };
const RACK_K = 2, RACK_LC = [960, 560], RACK_WC = [1272, 730];
export const RACK_XF = { s: 1 / RACK_K, piv: RACK_LC, dx: RACK_WC[0] - RACK_LC[0], dy: RACK_WC[1] - RACK_LC[1] };
const rackL = ([x, y]) => [RACK_LC[0] + (x - RACK_WC[0]) * RACK_K, RACK_LC[1] + (y - RACK_WC[1]) * RACK_K];

// card-local geometry (the R9 card, times 4)
export const CARD = {
  board: [80, 180, 1840, 940], bracket: [-16, 92, 80, 1052],
  pkg: [212, 304, 732, 824], die: [240, 332, 704, 796],
  fins: { x0: 872, x1: 1752, y0: 244, y1: 876, n: 20 },
  tab: [280, 940, 1560, 1036], pads: { x0: 304, pitch: 48, n: 26, w: 28, y0: 956, y1: 1024, key: 1040 },
};
// the die's floorplan, in die units (0..1): after a die shot (arrays, caches, a logic band)
export const BLOCKS = [
  { k: 'array', r: [0.10, 0.10, 0.36, 0.33] }, { k: 'array', r: [0.38, 0.10, 0.60, 0.33] }, { k: 'narrow', r: [0.62, 0.10, 0.68, 0.33] },
  { k: 'cache', r: [0.71, 0.10, 0.90, 0.285] }, { k: 'cache', r: [0.71, 0.305, 0.90, 0.49] },
  { k: 'cache', r: [0.71, 0.51, 0.90, 0.695] }, { k: 'cache', r: [0.71, 0.715, 0.90, 0.90] },
  { k: 'logic', r: [0.10, 0.36, 0.68, 0.57], div: 7 },
  { k: 'array', r: [0.10, 0.60, 0.36, 0.90] }, { k: 'array', r: [0.38, 0.60, 0.60, 0.90] }, { k: 'narrow', r: [0.62, 0.60, 0.68, 0.90] },
];
export const CORE = [0.07, 0.07, 0.93, 0.93];
const DU = (u, v) => [CARD.die[0] + (CARD.die[2] - CARD.die[0]) * u, CARD.die[1] + (CARD.die[3] - CARD.die[1]) * v];
const rectU = ([u0, v0, u1, v1]) => { const a = DU(u0, v0), b = DU(u1, v1); return [a[0], a[1], b[0], b[1]]; };
const R = ([x0, y0, x1, y1]) => S2.rect(x0, y0, x1 - x0, y1 - y0);
const closed = ([x0, y0, x1, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
// the traces: from the die's bottom edge to the connector, from its right edge to the heatsink
const TRACES = (() => {
  const T = [];
  for (let k = 0; k < 5; k++) { const x = DU(0.15 + 0.16 * k, 1)[0], xe = 330 + 112 * k; T.push([[x, 796], [x, 830 + 6 * k], [xe, 872 + 6 * k], [xe, 940]]); }
  for (let k = 0; k < 3; k++) { const y = DU(1, 0.25 + 0.25 * k)[1]; T.push([[704, y], [760, y], [800, y - 30], [CARD.fins.x0 - 12, y - 30]]); }
  return T;
})();

// the chip's outline, only the chip (the landing): the die, its core, every block, the logic
// strips' dividers. In card-local px; DIE_LINES_W() gives them in world px.
export function DIE_LINES() {
  const out = [{ part: 'die', pts: closed(CARD.die) }, { part: 'core', pts: closed(rectU(CORE)) }];
  for (const b of BLOCKS) {
    const r = rectU(b.r);
    out.push({ part: b.k, pts: closed(r) });
    if (b.div) for (let k = 1; k <= b.div; k++) { const x = lerp(r[0], r[2], k / (b.div + 1)); out.push({ part: 'strip', pts: [[x, r[1]], [x, r[3]]] }); }
  }
  return out;
}
export const DIE_LINES_W = () => DIE_LINES().map((l) => ({ part: l.part, pts: l.pts.map(cardToWorld) }));
export const DIE_CENTRE_W = cardToWorld([(CARD.die[0] + CARD.die[2]) / 2, (CARD.die[1] + CARD.die[3]) / 2]);
export const DIE_SIDE_W = (CARD.die[2] - CARD.die[0]) / CARD_K;

export function drawCard(m, rnd) {
  m.card(S2.rrect(CARD.board[0], CARD.board[1], CARD.board[2] - CARD.board[0], CARD.board[3] - CARD.board[1], 20), 0.6);
  m.card(R(CARD.bracket), 0.5);
  for (let k = 0; k < 4; k++) m.cut(S2.rrect(CARD.bracket[0] + 24, CARD.bracket[1] + 96 + k * 200, 48, 120, 12), 0.4);
  // the package's seam round the die, a fine lit slit
  const p = CARD.pkg, sl = 3;
  for (const r of [[p[0], p[1], p[2], p[1] + sl], [p[0], p[3] - sl, p[2], p[3]], [p[0], p[1], p[0] + sl, p[3]], [p[2] - sl, p[1], p[2], p[3]]]) { m.cut(R(r), 0); m.emit(R(r), 0.35, 0); }
  // the die: a window of dim tissue, its blocks denser tissue (they glow brighter), card between
  const d = CARD.die;
  m.cut(R(d), 0.2); m.vel(R(d), 0.22, 0.2);
  const dens = { array: 0.5, cache: 0.62, logic: 0.4, narrow: 0.55 };
  for (const b of BLOCKS) {
    const r = rectU(b.r);
    m.vel(R(r), dens[b.k], 0.3);
    if (b.k === 'array') for (let y = r[1] + 6; y < r[3] - 3; y += 7) m.card(S2.rect(r[0] + 2, y, r[2] - r[0] - 4, 1.8), 0);
    if (b.k === 'cache') { for (let y = r[1] + 8; y < r[3] - 4; y += 11) m.card(S2.rect(r[0] + 3, y, r[2] - r[0] - 6, 2.2), 0); m.card(S2.rect((r[0] + r[2]) / 2 - 1.5, r[1] + 3, 3, r[3] - r[1] - 6), 0); }
    if (b.k === 'narrow') for (let y = r[1] + 5; y < r[3] - 3; y += 5) m.card(S2.rect(r[0] + 2, y, r[2] - r[0] - 4, 1.4), 0);
    if (b.k === 'logic') {
      for (let k = 1; k <= b.div; k++) { const x = lerp(r[0], r[2], k / (b.div + 1)); m.card(S2.rect(x - 2.5, r[1], 5, r[3] - r[1]), 0); }
      for (let i = 0; i < 260; i++) { const x = lerp(r[0] + 4, r[2] - 8, rnd()), y = lerp(r[1] + 4, r[3] - 6, rnd()); m.card(S2.rect(x, y, 2 + 5 * rnd(), 1.6 + 3 * rnd()), 0); }
    }
  }
  // the core's frame and the pad ring
  const c = rectU(CORE);
  for (const r of [[c[0], c[1], c[2], c[1] + 5], [c[0], c[3] - 5, c[2], c[3]], [c[0], c[1], c[0] + 5, c[3]], [c[2] - 5, c[1], c[2], c[3]]]) m.card(R(r), 0);
  for (let t = 0.05; t < 0.96; t += 0.036) {
    for (const [u, v] of [[t, 0.03], [t, 0.97], [0.03, t], [0.97, t]]) { const q = DU(u, v); const r = S2.rect(q[0] - 4.5, q[1] - 4.5, 9, 9); m.card(r, 0); m.emit(r, 0.8, 0); }
  }
  // the heatsink: tissue behind card slats
  const f = CARD.fins, pitch = (f.x1 - f.x0) / f.n;
  m.cut(S2.rect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0), 0.3);
  m.vel(S2.rect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0), 0.45, 0.3);
  for (let k = 0; k < f.n; k++) m.card(S2.rect(f.x0 + k * pitch + pitch * 0.2, f.y0 - 16, pitch * 0.6, f.y1 - f.y0 + 32), 0.3);
  m.card(S2.rect(f.x0 - 24, f.y1 + 8, f.x1 - f.x0 + 48, 24), 0.3);
  // the traces (lit slits) and the connector's gold pads (warm pinholes)
  TRACES.forEach((t) => { const rib = S2.ribbon(t, () => 6, [true, true]); m.cut(rib, 0); m.emit(rib, 0.55, 0); });
  m.card(R(CARD.tab), 0.3);
  const q = CARD.pads;
  for (let k = 0; k < q.n; k++) { const x = q.x0 + k * q.pitch; if (Math.abs(x + q.w / 2 - q.key) < 28) continue; const r = S2.rect(x, q.y0, q.w, q.y1 - q.y0); m.cut(r, 0); m.emit(r, 0.8, 0); }
}

// ---------------------------------------------------------------- a rack front (for the bays)
// the racks of bay i: geometry and LED choices, drawing the bay's own RNG in the original order
// (height, then per server row: an LED or not, and its brightness), so the hall is unchanged; S16
// reads the same records to put its timed LEDs on the same racks. outer01: 0 at the wall, 1 at the aisle.
export function bayRacks(i) {
  const b = BAYS[i], k = b.W / 700, R2 = mulberry32(900 + i), out = [];
  for (const side of [-1, 1]) {
    const x0 = GH.vx + side * 96 * k, x1 = GH.vx + side * b.W * 0.93, n = Math.max(2, Math.round(Math.abs(x1 - x0) / (88 * k)));
    const w = Math.abs(x1 - x0) / n - 6 * k;
    for (let q = 0; q < n; q++) {
      const xl = Math.min(x0, x1) + q * (w + 6 * k);
      if (i === 0 && side > 0 && xl + w > 1000 && xl < 1560) continue;          // the open rack's place
      const h = (300 + 30 * R2()) * k, u = 13 * k, rows = [];
      for (let y = b.base - h + 10 * k; y < b.base - 12 * k; y += u) rows.push({ y, led: R2() < 0.8 ? 0.6 + 0.4 * R2() : 0 });
      const outer01 = (x) => clamp((x - x1) / (x0 - x1), 0, 1);
      out.push({ side, xl, w, h, k, base: b.base, rows, outer01 });
    }
  }
  return out;
}
function rackFront(m, r) {
  const { xl: x, base, w, h, k } = r;
  m.card(S2.rect(x, base - h, w, h), 0.3);
  m.card(S2.rect(x - 2 * k, base - h - 6 * k, w + 4 * k, 7 * k), 0.2);
  for (const { y, led } of r.rows) {
    const s = S2.rect(x + 7 * k, y, w * 0.62, 2.2 * k);
    m.cut(s, 0); m.vel(s, 0.7, 0);
    if (led) { const c = S2.ellipse(x + w - 8 * k, y + 1.2 * k, 1.7 * k + 0.4, 1.7 * k + 0.4, 0, 10); m.cut(c, 0); m.emit(c, led, 0); }
  }
}

export function hallScene(o = {}) {
  const S = { name: 'hall' };
  S.world = { x0: -140, y0: -120, w: 2200, h: 1340 };
  S.light = { x: 1290, y: 520, z: 200, r: 14, I: 0, a: 120, f: 900 };
  S.hazeW = 8e-5;
  S.params = { arim: 0.14, hm: 1.4e-5, rim: 1.4 };
  S.cam = { Zc: 2400, zref: 0, c: [GH.vx, GH.vy] };
  S.hazeBack = 120; S.hazeFront = 300;
  S.moon = { dir: [-0.25, 0.55, 1], I: 0.3, disc: [0, 0, 0] };
  const COOL = lin('#9FB3D9'), TISSUE = lin('#2A3358').map((v) => v * 1.25);
  const L = S.layers = [];
  const add = (l) => L.push(l);
  add({ name: 'end', z: END.z, col: PAPER.slate, alb: 0.6, ao: 0.2, vel: TISSUE, vw: 0, vl: 0.6, draw: (m) => {
    const inner = archPts(END, 0);
    m.card(S2.rect(-140, -120, 2200, 1340), 0);
    m.cut(inner, 0.2); m.vel(inner, 0.8, 0.2);
    for (const dx of [-60, 0, 60]) m.card(S2.rect(GH.vx + dx - 1.5, END.top - 10, 3, END.base - END.top + 10), 0);
    m.card(S2.rect(GH.vx - 26, END.base - 58, 52, 60), 0.2);
  } });
  [...BAYS].reverse().forEach((b, ri) => {
    const i = BAYS.length - 1 - ri, k = b.W / 700, nb = BAYS[i + 1] || END, racks = bayRacks(i);
    add({ name: 'bay' + i, z: b.z, col: PAPER.deep, alb: 0.55, ao: 0.35, cast: 1, rimk: 1.2, vel: TISSUE, vw: 0, vl: 0.8,
      em: COOL.map((v) => v * 0.4), ew: 0, ef: 0.2, seed: i, draw: (m) => {
      m.card([[-140, b.base], [2060, b.base], [2060, 1300], [-140, 1300]], 0.4);
      const outer = archPts(b, -6 * k), inner = archPts(b, 6 * k);
      m.card(outer.concat(inner.slice().reverse()), 0.3);
      const pin = archPts(nb, -6 * (nb.W / 700));
      m.vel(inner.concat(pin.slice().reverse()), 0.75, 0.2);
      for (let j = 1; j < 12; j++) {
        const t = j / 12, a = inner[Math.round(t * (inner.length - 1))], c = pin[Math.round(t * (pin.length - 1))];
        m.card(S2.bar(a, c, 2.2 * k), 0);
      }
      for (const side of [-1, 1]) {
        racks.filter((r) => r.side === side).forEach((r) => rackFront(m, r));
        const ly = b.base - (b.base - b.top) * 0.6, lx0 = GH.vx + side * 120 * k, lx1 = GH.vx + side * b.W * 0.8;
        m.card(S2.rect(Math.min(lx0, lx1), ly - 5 * k, Math.abs(lx1 - lx0), 9 * k), 0.2);
        for (const hx of [lerp(lx0, lx1, 0.2), lerp(lx0, lx1, 0.8)]) m.card(S2.rect(hx - 1, ly - 60 * k, 2, 56 * k), 0);
        const slit = S2.rect(Math.min(lx0, lx1) + 6 * k, ly + 1 * k, Math.abs(lx1 - lx0) - 12 * k, 3 * k);
        m.cut(slit, 0); if (o.lamps !== false) m.emit(slit, 1.0, 0);                 // (S16: the lamps are not in yet)
      }
    } });
  });
  // the open rack in the foreground (authored at 2x), and the card in it (at 4x)
  add({ name: 'rack', z: Z_RACK, col: PAPER.ink, alb: 0.45, ao: 0.4, cast: 1, rimk: 1.5, bound: 1, draw: (m) => {
    const RR = (x0, y0, x1, y1, a = 0.3) => { const p = rackL([x0, y0]), q = rackL([x1, y1]); m.card(S2.rect(p[0], p[1], q[0] - p[0], q[1] - p[1]), a); };
    RR(997, 430, 1011, 1030); RR(1533, 430, 1547, 1030);                                   // the posts
    RR(996, 552, 1548, 564); RR(1000, 824, 1544, 840); RR(986, 1000, 1558, 1030, 0.4);     // top rail, slot rail, base
    for (const y of [470, 900, 960]) RR(1004, y, 1540, y + 5, 0.1);                         // cross braces
  } });
  if (o.card !== false) add({ name: 'card', z: Z_CARD, col: PAPER.ink, alb: 0.45, ao: 0.4, cast: 1, rimk: 1.5, thin: 0.1, bound: 1,
    vel: lin('#3A4270'), vw: 0, vl: 1.0, em: lin('#9FB3D9').map((v) => v * 0.5), ew: 0, ef: 0.3, seed: 5, draw: (m, rnd) => drawCard(m, rnd) } );
  // S16 (opt-in, `leds`): the same hall, early and dark, filling with GPUs. Each bay gets a timed layer
  // just in front of it holding warm LEDs on the same racks (bayRacks): a row per side that lights on
  // that side's stop, chasing from the nearest rack to the farthest (leds.stops: local frames, leds.run:
  // the chase's length in frames, codes = frames / leds.N), and the LED columns' top six LEDs, which
  // a beat wave lights as it runs down the hall (chase codes by depth). Nothing here glows before
  // its code; the racks' own cool LEDs stay as they are.
  if (o.leds) {
    const LD = o.leds, NN = LD.N || 144, code = (f) => clamp(f / NN, 1 / 127, 0.999);
    const depth = (i, o01) => (i + 0.9 * o01) / 6;
    BAYS.forEach((b, i) => add({ name: 'leds' + i, z: b.z + 2, col: PAPER.deep, alb: 0, ao: 0, timed: 0.02, cw: 0.045, cg: 0, ew: 2.6, ef: 0.3, seed: 60 + i, draw: (m) => {
      for (const r of bayRacks(i)) {
        const k = r.k, si = r.side < 0 ? 0 : 1, y = r.base - LD.rowY[si] * k, rad = Math.max(0.9, 2.2 * k);
        for (let j = 0; j < 5; j++) {
          const x = r.xl + r.w * (0.1 + 0.15 * j);
          m.step2(S2.ellipse(x, y, rad, rad, 0, 10), code(LD.stops[si] + LD.run * depth(i, r.outer01(x))), 1.0);
        }
        let n = 0;
        for (const row of r.rows) {
          if (!row.led || n >= 6) continue;
          const x = r.xl + r.w - 8 * k, c = S2.ellipse(x, row.y + 1.2 * k, 1.7 * k + 0.4, 1.7 * k + 0.4, 0, 10);
          m.chase(c, 0.04 + 0.52 * depth(i, r.outer01(x)) + 0.006 * n, 0.9); n++;
        }
      }
    } }));
  }
  return S;
}

// per-frame state. on: [0..1] per bay; card: the card's own light; near: the lamp over it;
// vault: how much the arches' tissue has warmed
export function hallState(o) {
  const layers = {};
  const vault = clamp(o.vault === undefined ? 1 : o.vault, 0, 1);
  BAYS.forEach((b, i) => {
    const on = clamp(o.on ? o.on[i] : 0, 0, 1);
    layers['bay' + i] = { ew: 2.4 * on, vw: 0.16 * on * vault, vl: 0.8 + 0.3 * on };
  });
  layers.end = { vw: 0.16 * clamp(o.endOn || 0, 0, 1) };
  const c = clamp(o.card || 0, 0, 2);
  layers.card = Object.assign({ vw: 1.3 * c, ew: 2.0 * c, vl: 1.0 }, CARD_XF);
  layers.rack = Object.assign({}, RACK_XF);
  return {
    layers,
    light: { I: 3.8e4 * (o.near || 0) },
    fills: [{ x: GH.vx, y: 480, z: -400, I: 1.8e4 * (o.fill || 0), a: 300, f: 900, h: 0.6 }],
  };
}
