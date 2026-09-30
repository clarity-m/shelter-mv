// The GPU rack (S06) and the hall of racks (S16), in cut card.
// S06: one rack, front on, with two empty 4U bays. On each bass stop a GPU sled slides in
//      (it approaches from the camera: its layer scales down onto the bay while its soft shadow
//      on the rack tightens), seats, and its LEDs and vent holes light as warm timed pinholes.
// S16: a tunnel book of racks down an aisle (each layer is a pair of rack fronts around a
//      shrinking opening); on each stop a row of LEDs lights, chasing from near to far.
import { S2, lin, lerp, PAPER } from './kit.js';

const COOL = lin('#9FB3D9');
export const RACK = { x0: 740, x1: 1180, top: 70, bot: 1000, u: 22, bayA: 294, bayB: 564 };

// a server face: vents (cut or timed), drive slots, LEDs. mode 'cut' (installed, dark) or
// 'timed' (a new sled: its vents and LEDs are warm pinholes lighting in sequence)
function serverFace(m, x0, y0, w, h, rnd, mode, t0 = 0.2) {
  m.card(S2.rect(x0, y0 + 1, w, h - 2), 0.3);
  m.card(S2.rect(x0 - 12, y0 + 3, 12, h - 6), 0.2); m.card(S2.rect(x0 + w, y0 + 3, 12, h - 6), 0.2);   // ears
  for (const hx of [x0 - 8, x0 + w + 4]) m.cut(S2.rect(hx, y0 + h / 2 - 9, 4, 18), 0.2);            // ear slots
  const gx0 = x0 + 70, gx1 = x0 + w - 70, rows = Math.max(1, Math.floor((h - 16) / 11));
  let n = 0;
  const vents = [];
  for (let r = 0; r < rows; r++) for (let x = gx0 + (r % 2) * 6; x < gx1; x += 12) vents.push([x, y0 + 10 + r * 11]);
  vents.forEach(([x, y]) => {
    const c = S2.ellipse(x, y, 3.2, 3.2, 0, 10);
    m.cut(c, 0);
    if (mode === 'timed') m.timed(c, Math.min(0.99, t0 + 0.3 + 0.45 * rnd()), 0.28 + 0.1 * rnd());
  });
  for (let k = 0; k < 3; k++) m.cut(S2.rect(x0 + 10, y0 + 8 + k * (h - 16) / 3, 44, (h - 16) / 3 - 4), 0.2);  // drive slots
  const leds = [];
  for (let k = 0; k < (h > 50 ? 6 : 3); k++) leds.push([x0 + w - 48 + (k % 3) * 13, y0 + 12 + Math.floor(k / 3) * 14]);
  leds.forEach(([x, y], k) => {
    const c = S2.ellipse(x, y, 2.6, 2.6, 0, 12);
    m.cut(c, 0);
    if (mode === 'timed') m.timed(c, t0 + 0.05 * k, 1.0);
    else if (rnd() < 0.7) m.emit(c, 0.35 + 0.5 * rnd());
    n++;
  });
}

export function rackScene(o = {}) {
  const S = { name: 'rack' };
  S.world = { x0: -120, y0: -100, w: 2160, h: 1280 };
  S.moon = { dir: [0.25, 0.55, 1], I: 0.18, disc: [0, 0, 0] };
  S.light = { x: 960, y: RACK.bayA + 44, z: 40, r: 8, I: 0, a: 70, f: 420 };
  S.hazeW = 6e-5;
  S.params = { arim: 0.1, hm: 2.2e-5, rim: 1.4 };
  S.cam = { Zc: 2400, zref: 0, c: [960, 540] };
  S.hazeBack = 80; S.hazeFront = 200;
  const L = S.layers = [];
  const add = l => L.push(l);
  const { x0, x1, top, bot } = RACK;
  // ---- the room: a dark back wall, then a far row of racks with cool LEDs and an overhead tray
  add({ name: 'room', z: -620, col: '#131728', alb: 0.4, ao: 0, draw: (m, rnd) => {
    m.card(S2.rect(-140, -140, 2200, 1400), 0);
  } });
  add({ name: 'farRacks', z: -460, col: '#1B2034', alb: 0.5, ao: 0.3, em: COOL.map(v => v * 0.6), draw: (m, rnd) => {
    for (let x = -100; x < 2040; x += 142) {
      if (x > 330 && x < 1500) continue;
      m.card(S2.rect(x, 240, 132, 700), 0.4);
      for (let y = 262; y < 920; y += 22) m.cut(S2.rect(x + 10, y, 112, 1.4), 0);
      for (let k = 0; k < 18; k++) if (rnd() < 0.55) { const c = S2.ellipse(x + 100 + rnd() * 24, 256 + k * 36, 1.7, 1.7); m.cut(c, 0); m.emit(c, 0.3 + 0.7 * rnd()); }
    }
    m.card(S2.rect(-140, 160, 2200, 12), 0.3);
    for (const [a, b, w] of [[176, 250, 3], [176, 226, 2.2]]) m.card(S2.ribbon(S2.cat([[-100, a], [300, b], [700, a + 6], [1150, b], [1600, a + 6], [2040, b - 10]], false, 18), () => w, [false, false]), 0);
  } });
  add({ name: 'floor', z: -300, col: PAPER.slate, kind: 1, alb: 0.9, ao: 0.3, draw: (m, rnd) => {
    m.card(S2.rect(-140, 900, 2200, 400), 0.3);
    for (let x = -120; x < 2060; x += 120) m.cut(S2.rect(x, 900, 1.5, 400), 0);
  } });
  // ---- the rack cavity: dark, with rails and cable loops (seen through vents and empty bays)
  add({ name: 'cavity', z: -90, col: PAPER.ink, alb: 0.55, ao: 0.3, draw: (m, rnd) => {
    m.card(S2.rect(x0 + 10, top + 30, x1 - x0 - 20, bot - top - 60), 0.3);
    for (const bay of [RACK.bayA, RACK.bayB]) {
      m.cut(S2.rect(x0 + 40, bay + 20, x1 - x0 - 80, 3), 0);
      m.card(S2.ribbon(S2.cat([[x0 + 60, bay + 10], [x0 + 150, bay + 70], [x0 + 260, bay + 30], [x1 - 60, bay + 60]], false, 14), () => 5, [true, true]), 0);
    }
  } });
  // ---- installed servers (dark faces with cool LEDs), leaving the two bays empty
  const units = [[110, 1], [134, 1], [158, 2], [204, 4], [384, 4], [474, 4], [654, 4], [744, 2], [790, 2], [836, 4]];
  // (revision 2) the servers layer also carries the feeds: cable bundles down both sides of the
  // rack with branches into every unit; data pulses run down them as chase codes (cc, cg per frame).
  // They are appended after the servers, so the servers' seeded details are unchanged.
  add({ name: 'servers', z: -6, col: PAPER.deep, alb: 0.7, ao: 0.45, cast: 1, rimk: 1.3, em: COOL.map(v => v * 1.1), timed: 0.02, cw: 0.05, cg: 0, ew: 3.4, ef: 0.35, draw: (m, rnd) => {
    for (const [y, n] of units) serverFace(m, x0 + 28, y, x1 - x0 - 56, n * RACK.u * 1.0 + (n - 1) * 0, rnd, 'cut');
    const L = bot + 140, NP = 4, wig = (y, ci, side) => 3 * Math.sin(y / 170 + ci + side);
    for (const side of [-1, 1]) {
      const bx = side < 0 ? x0 - 40 : x1 + 40;
      [-9, 0, 9].forEach((dx, ci) => {
        const x = bx + dx * side, off = ci * 0.29 + (side > 0 ? 0.13 : 0), pts = [];
        for (let y = -140; y <= bot + 10; y += 20) pts.push([x + wig(y, ci, side), y]);
        m.card(S2.ribbon(pts, () => 5.2, [false, false]), 0.2);
        for (let y = -130; y < bot; y += 7) { const c = S2.rect(x + wig(y, ci, side) - 1.5, y, 3.0, 4.4); m.cut(c, 0); m.chase(c, NP * (y + 140) / L + off, 1.0); }
      });
      // branches into each unit and each bay, at the middle of its face
      for (const [yy, hh] of units.map(([y, k]) => [y, k * RACK.u]).concat([[RACK.bayA, 88], [RACK.bayB, 88]])) {
        const y = yy + hh / 2, xs = bx, xe = side < 0 ? x0 + 22 : x1 - 22, dir = side < 0 ? 1 : -1, len = Math.abs(xe - xs);
        m.card(S2.bar([xs, y], [xe, y], 3.6), 0);
        for (let q = 5; q < len - 2; q += 7) { const c = S2.rect(xs + dir * q - 2.0, y - 1.3, 4.0, 2.6); m.cut(c, 0); m.chase(c, NP * (y + 140 + q) / L + 0.29 + (side > 0 ? 0.13 : 0), 0.9); }
      }
    }
  } });
  // ---- the rack frame: posts, cap, plinth, mounting rails
  // (revision 2) the frame layer also carries a row of activity LEDs along the foot of every
  // installed unit; a cascade runs along them on each beat (chase codes; appended, as above)
  add({ name: 'frame', z: -4, col: PAPER.slate, alb: 0.8, ao: 0.4, cast: 1, rimk: 1.2, timed: 0.02, cw: 0.05, cg: 0, ew: 3.0, ef: 0.3, draw: (m, rnd) => {
    m.card(S2.rect(x0 - 14, top, 30, bot - top), 0.4); m.card(S2.rect(x1 - 16, top, 30, bot - top), 0.4);
    m.card(S2.rect(x0 - 14, top, x1 - x0 + 28, 36), 0.4); m.card(S2.rect(x0 - 24, bot - 50, x1 - x0 + 48, 50), 0.4);
    for (let y = top + 60; y < bot - 60; y += 44) { m.cut(S2.rect(x0 - 2, y, 4, 4), 0); m.cut(S2.rect(x1 - 2, y, 4, 4), 0); }
    m.card(S2.rect(x0 + 80, top + 10, x1 - x0 - 160, 8), 0.2);
    units.forEach(([uy, k], ri) => {
      const y = uy + k * RACK.u - 6;
      for (let x = x0 + 98; x < x1 - 98; x += 12) {
        const c = S2.rect(x - 1.6, y - 1.6, 3.2, 3.2);
        m.chase(c, 0.02 + 0.3 * (x - x0 - 98) / (x1 - x0 - 196) + 0.028 * ri, 1.0);
      }
    });
  } });
  // ---- the two new sleds (animated by transform; their pinholes are timed)
  const sled = (name, bay, seed) => add({ name, z: -3, col: PAPER.deep, alb: 0.7, ao: 0.6, cast: 1, rimk: 1.5, timed: 0.12, ew: 2.6, ef: 0.4, bound: 1, seed, draw: (m, rnd) => {
    serverFace(m, x0 + 28, bay, x1 - x0 - 56, 88, rnd, 'timed', 0.08);
    m.card(S2.rect(x0 + 28 + (x1 - x0 - 56) / 2 - 40, bay + 76, 80, 8), 0.2);                    // pull handle
  } });
  sled('sledA', RACK.bayA, 21); sled('sledB', RACK.bayB, 22);
  // ---- foreground: a near rack's edge (left) and a drooping cable bundle, soft
  add({ name: 'fg', z: 560, col: PAPER.ink, alb: 0.4, ao: 0.4, def: 0.9, em: COOL.map(v => v * 1.0), draw: (m, rnd) => {
    m.card(S2.rect(-160, -140, 330, 1400), 0.5);
    for (let k = 0; k < 16; k++) if (rnd() < 0.5) { const c = S2.ellipse(120, 100 + k * 58, 2.4, 2.4); m.cut(c, 0); m.emit(c, 0.4 + 0.6 * rnd()); }
    for (const [yA, yB, w] of [[-20, 120, 9], [-30, 150, 6], [-10, 95, 5]]) m.card(S2.ribbon(S2.cat([[140, yA], [700, yB], [1300, yB * 0.6], [2060, yA]], false, 20), () => w, [false, false]), 0.3);
  } });
  return S;
}

// the sled's approach: a = 0 seated .. 1 far out toward the camera (scale about the principal point)
export function sledXf(a) {
  return { s: 1 + 0.95 * a, piv: [960, 540], z: -3 + 515 * a };
}

// ================================================================ S16: the hall
// A one-point-perspective aisle: every rack is a trapezoid on the side walls, and the aisle is cut
// into depth layers (d = distance in metres) so the paper layers part as the camera dollies in.
export const HALL = { vp: [960, 520], f: 700, eye: 1.6, half: 1.1, n: 7, rack: 0.6 };
const DEPTHS = [0.55, 2.1, 3.6, 5.6, 8.4, 12.6, 19, 34];
const ZS = [470, 280, 120, -10, -130, -240, -340];
// the beat wave: chase code by depth (near 0.04 .. far 0.56), so a pulse runs away down the hall
const waveCode = d => 0.04 + 0.52 * Math.log(Math.max(d, 0.55) / 0.55) / Math.log(34 / 0.55);
export function hallScene(o = {}) {
  const S = { name: 'hall' };
  S.world = { x0: -120, y0: -100, w: 2160, h: 1280 };
  S.light = { x: 960, y: 560, z: -500, r: 20, I: 0, a: 200, f: 900 };
  S.hazeW = 8e-5;
  S.params = { arim: 0.1, hm: 2.4e-5, rim: 1.3 };
  S.cam = { Zc: 2400, zref: -200, c: [960, 520] };
  S.hazeBack = 140; S.hazeFront = 300;
  const L = S.layers = [];
  const [vx, vy] = HALL.vp, F = HALL.f;
  const P = (X, Y, d) => [vx + X * F / d, vy + Y * F / d];          // X right, Y down (metres from the eye)
  const floorY = HALL.eye, topY = HALL.eye - 2.2, ceilY = HALL.eye - 3.1;
  // the end wall: a door with a cool glass panel
  L.push({ name: 'end', z: -470, col: PAPER.far, alb: 0.7, ao: 0, em: COOL.map(v => v * 0.8), draw: (m) => {
    m.card(S2.rect(-140, -140, 2200, 1400), 0);
    const d = DEPTHS[DEPTHS.length - 1], a = P(-0.45, floorY, d), b = P(0.45, floorY - 2.1, d);
    m.card(S2.rect(a[0], b[1], b[0] - a[0], a[1] - b[1]), 0.2);
    const g = P(-0.25, floorY - 1.9, d), h = P(0.25, floorY - 1.3, d);
    m.cut(S2.rect(g[0], g[1], h[0] - g[0], h[1] - g[1]), 0); m.emit(S2.rect(g[0], g[1], h[0] - g[0], h[1] - g[1]), 0.6);
  } });
  for (let li = 0; li < HALL.n; li++) {
    const d0 = DEPTHS[li], d1 = DEPTHS[li + 1];
    const col = [PAPER.ink, PAPER.deep, PAPER.deep, PAPER.slate, PAPER.slate, PAPER.dusk, PAPER.dusk][li];
    L.push({ name: 'bay' + li, z: ZS[li], col, alb: 0.8, ao: 0.4, cast: 1, rimk: 1.2, timed: 0.03, cw: 0.045, cg: 0, ew: 2.4, ef: 0.3, em: COOL.map(v => v * 0.9), def: li === 0 ? 0.7 : 0, seed: 40 + li,
      draw: (m, rnd) => {
        // floor and ceiling segments of this depth range
        m.card([P(-3, floorY, d0), P(3, floorY, d0), P(3, floorY, d1), P(-3, floorY, d1)].map(p => [p[0], p[1] + 0.5]), 0.3);
        m.card([P(-3, ceilY, d0), P(3, ceilY, d0), P(3, ceilY, d1), P(-3, ceilY, d1)], 0.3);
        for (let d = Math.ceil(d0 / 0.6) * 0.6; d < d1; d += 0.6) { const a = P(-1.1, floorY, d), b = P(1.1, floorY, d); m.cut(S2.rect(a[0], a[1] - 0.5, b[0] - a[0], Math.max(0.8, 1.6 / d)), 0); }
        for (const X of [-0.55, 0, 0.55]) m.cut([P(X - 0.004 * d0, floorY, d0), P(X + 0.004 * d0, floorY, d0), P(X, floorY, d1), P(X, floorY, d1)], 0);
        // cable trays and cool light fixtures on the ceiling
        for (const X of [-0.6, 0.6]) m.card([P(X - 0.12, ceilY + 0.25, d0), P(X + 0.12, ceilY + 0.25, d0), P(X + 0.12, ceilY + 0.25, d1), P(X - 0.12, ceilY + 0.25, d1)], 0.2);
        for (let d = Math.ceil(d0 / 3) * 3; d < d1; d += 3) { const a = P(-0.3, ceilY + 0.02, d), b = P(0.3, ceilY + 0.02, d + 0.5); m.cut([a, [b[0], a[1]], b, [a[0], b[1]]], 0); m.emit([a, [b[0], a[1]], b, [a[0], b[1]]], 0.35); }
        // the racks on both walls
        for (const side of [-1, 1]) {
          const X = side * HALL.half;
          for (let d = d0; d < d1 - 0.01; d += HALL.rack) {
            const e = Math.min(d + HALL.rack, d1), g = 0.02;
            const q = [P(X, topY, d + g), P(X, floorY, d + g), P(X, floorY, e - g), P(X, topY, e - g)];
            m.card(q, 0.3);
            // unit seams (near racks only)
            if (d < 9) for (let y = topY + 0.1; y < floorY - 0.05; y += 0.089) { const a = P(X, y, d + 0.05), b = P(X, y, e - 0.05); m.cut([a, b, [b[0], b[1] + Math.max(0.6, 1.2 / d)], [a[0], a[1] + Math.max(0.6, 1.2 / d)]], 0); }
            // cool LEDs on the installed kit
            for (let y = topY + 0.15; y < floorY - 0.1; y += 0.089) if (rnd() < 0.18) { const c = P(X, y, e - 0.1), r = Math.max(0.8, 2.2 / Math.sqrt(d)); m.cut(S2.ellipse(c[0], c[1], r, r, 0, 10), 0); m.emit(S2.ellipse(c[0], c[1], r, r, 0, 10), 0.4 + 0.5 * rnd()); }
            // the rows that light on the stops (left on the first, right on the second), near to far
            const yRow = side < 0 ? topY + 0.62 : topY + 0.98, t0 = side < 0 ? 0.413 : 0.916;
            for (let k = 0; k < 4; k++) {
              const dd = d + 0.12 + k * 0.1, c = P(X, yRow, dd), r = Math.max(0.9, 3.2 / Math.sqrt(dd));
              const code = t0 + 0.055 * Math.log(Math.max(dd, 0.9) / 0.9) / Math.log(34 / 0.9);
              m.cut(S2.ellipse(c[0], c[1], r, r, 0, 10), 0); m.step2(S2.ellipse(c[0], c[1], r, r, 0, 10), Math.min(code, 0.995), 1.0);
            }
            // (revision 2) an activity column at the rack's near edge: the beat wave lights it
            // as it passes down the hall
            for (let k = 0; k < 6; k++) {
              const dd = d + 0.07, c = P(X, topY + 0.3 + 0.19 * k, dd), r = Math.max(1.0, 4.2 / Math.sqrt(dd));
              m.cut(S2.ellipse(c[0], c[1], r, r, 0, 10), 0); m.chase(S2.ellipse(c[0], c[1], r, r, 0, 10), waveCode(dd) + 0.006 * k, 0.9);
            }
          }
        }
        // (revision 2) data pulses along the ceiling trays: dashes cut into the tray, lit by the wave
        for (const X of [-0.6, 0.6]) for (let d = Math.max(d0, 0.62); d < d1 - 0.05; d += 0.2) {
          const a = P(X - 0.035, ceilY + 0.26, d), b = P(X + 0.035, ceilY + 0.26, d), c2 = P(X + 0.035, ceilY + 0.26, d + 0.09), e2 = P(X - 0.035, ceilY + 0.26, d + 0.09);
          m.cut([a, b, c2, e2], 0); m.chase([a, b, c2, e2], waveCode(d), 0.8);
        }
      } });
  }
  return S;
}
