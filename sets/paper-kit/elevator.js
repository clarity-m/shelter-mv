// The space elevator (S29, revision 9), in cut paper: two scenes.
//   groundScene(): at sea at night. The anchor platform (pontoons, legs, decks), its tapered lattice
//     tower, the stays, the vellum ribbon rising from the tower's top out of the frame, and the
//     climber on it carrying the folded sails; the far coast holds the lit city, the reactor and the
//     hall. The geometry is elevatorlines.js's EL, so the drawing lands exactly on it.
//   orbitScene(): in space. The lit Earth below (a paper disc, its coasts pricked with warm cities,
//     a tissue rim of air), the ribbon rising from it, the ring of satellites (S23's, geostationary)
//     crossing the frame with the station where the tether ends, the climber, and the hero sail
//     (sail.js's layers).
import { S2, lin, lerp, clamp, mulberry32, PAPER } from './kit.js';
import { EL, towerAt, climberParts } from './elevatorlines.js';
import { sailLayers } from './sail.js';

const COOL = lin('#9FB3D9');
const rect = ([x0, y0, x1, y1]) => S2.rect(x0, y0, x1 - x0, y1 - y0);
// the climber (and in space its pods) authored at 2x about a centre c: a layer transform of scale
// 1/2 about c puts it back in place (`layerXF(c, dx, dy, zoom)`)
const X2 = (c) => ([x, y]) => [c[0] + 2 * (x - c[0]), c[1] + 2 * (y - c[1])];
function drawClimber2x(m, C, c, packs) {
  const T = X2(c), R2 = (r) => { const a = T([r[0], r[1]]), b = T([r[2], r[3]]); return [a[0], a[1], b[0], b[1]]; };
  const b = R2(C.body); m.card(S2.rrect(b[0], b[1], b[2] - b[0], b[3] - b[1], 16), 0.3);
  const w = R2(C.windows); m.cut(rect(w), 0); m.vel(rect(w), 0.9, 0);
  C.clamps.forEach((cl) => { const q = R2(cl); m.card(S2.rrect(q[0], q[1], q[2] - q[0], q[3] - q[1], 6), 0.2); });
  if (packs) C.packs.forEach((zz) => m.vel(S2.ribbon(zz.map(T), () => 6.4, [false, false]), 0.8, 0));
}
export const layerXF = (c, dx = 0, dy = 0, zoom = 1) => ({ s: zoom / 2, piv: c, dx, dy });

export function groundScene() {
  const S = { name: 'elevator-ground' };
  S.world = { x0: -140, y0: -760, w: 2200, h: 2000 };
  S.sky = { top: '#141A2E', hor: '#2E3A62', horY: EL.horizon };
  S.moon = { dir: [0.3, 0.5, 1], I: 0.4, disc: [0, 0, 0] };
  S.light = { x: EL.climber.x, y: EL.climber.y, z: 30, r: 10, I: 0, a: 90, f: 900 };
  S.hazeW = 7e-5;
  S.params = { arim: 0.14, hm: 1.6e-5, rim: 1.4 };
  S.cam = { Zc: 2400, zref: 0, c: [960, 540] };
  S.hazeBack = 200; S.hazeFront = 300;
  const L = S.layers = [];
  const add = (l) => L.push(l);
  // the far coast: low hills on the horizon, the lit city (warm pinpricks), the reactor and the hall
  add({ name: 'coast', z: -640, col: PAPER.far, ao: 0.2, ew: 0, ef: 0.3, em: COOL.map((v) => v * 0.5), draw: (m, rnd) => {
    const R = mulberry32(3131), hy = (x) => EL.horizon - 10 - 16 * Math.sin(x / 210 + 0.6) - 10 * Math.sin(x / 83 + 1.9) - (x < 700 ? 22 * Math.sin(Math.PI * clamp((x + 100) / 800, 0, 1)) : 0);
    const pts = [[-140, 1300]]; for (let x = -140; x <= 2060; x += 20) pts.push([x, hy(x)]); pts.push([2060, 1300]);
    m.card(pts, 0.4);
    for (let i = 0; i < 150; i++) {
      const x = -60 + R() * (i < 110 ? 760 : 2000), top = hy(x), y = top + 4 + R() * (EL.horizon - top + 2);
      const h = S2.rect(x, y, 1.8, 2.2); m.cut(h, 0); m.emit(h, 0.35 + 0.65 * R(), 0);
    }
    for (const [x, r] of [[210, 26], [560, 18]]) { const y = hy(x) + 2; m.soft(14, () => m.emit(S2.ellipse(x, y - 6, r * 1.8, r * 0.6), 0.22)); m.emit(S2.ellipse(x, y - 2, r * 0.3, 2.2), 0.9, 0); }
  } });
  // the sea: dark water with ripple slits of tissue
  add({ name: 'sea', z: -60, col: PAPER.deep, alb: 0.15, ao: 0.3, vel: lin('#2D3656').map((v) => v * 0.6), vw: 0, vl: 1.0, draw: (m, rnd) => {
    m.card(S2.rect(-140, EL.horizon, 2200, 800), 0.2);
    for (let y = EL.horizon + 6; y < 1200; y += 4 + (y - EL.horizon) * 0.05) {
      const d = (y - EL.horizon) / 300;
      for (let x = -120 + rnd() * 80; x < 2040; x += 50 + rnd() * 130 + 40 * d) {
        const r = S2.rect(x, y + rnd() * 3, 12 + rnd() * (36 + 60 * d), 1.1 + 1.4 * d); m.cut(r, 0); m.vel(r, 0.5 + 0.5 * rnd(), 0);
      }
    }
  } });
  // the anchor platform and its tower
  add({ name: 'anchor', z: 0, col: PAPER.slate, alb: 0.7, ao: 0.4, cast: 1, rimk: 1.3, em: COOL.map((v) => v * 0.9), ew: 0, ef: 0.3, draw: (m) => {
    EL.pontoons.forEach((p) => m.card(S2.rrect(p[0], p[1], p[2] - p[0], p[3] - p[1], 6), 0.3));
    EL.legs.forEach((x) => m.card(S2.rect(x - EL.legW / 2, EL.deck2[3] - 2, EL.legW, EL.legBot - EL.deck2[3] + 2), 0.2));
    m.card(rect(EL.deck2), 0.3); m.card(rect(EL.deck), 0.3);
    const T = EL.tower, x = EL.ribbon.x;
    const pts = [[x - T.wb / 2, T.base], [x - T.wt / 2, T.top], [x + T.wt / 2, T.top], [x + T.wb / 2, T.base]];
    m.card(pts, 0.3);
    for (let i = 0; i < T.levels; i++) {                          // windows in the lattice: four triangles a stage
      const ya = lerp(T.base, T.top, i / T.levels), yb = lerp(T.base, T.top, (i + 1) / T.levels), a = towerAt(ya) - 5, b = towerAt(yb) - 5, ym = (ya + yb) / 2, am = towerAt(ym) - 5;
      m.cut([[x - a + 3, ya - 4], [x + a - 3, ya - 4], [x, ym + 2]], 0.2); m.cut([[x - b + 3, yb + 4], [x + b - 3, yb + 4], [x, ym - 2]], 0.2);
      m.cut([[x - a + 2, ya - 7], [x - b + 2, yb + 7], [x - 4, ym]], 0.2); m.cut([[x + a - 2, ya - 7], [x + b - 2, yb + 7], [x + 4, ym]], 0.2);
      void am;
    }
    for (const [ex, ey] of [[EL.deck[0] + 8, EL.deck[1]], [EL.deck[2] - 8, EL.deck[1]], [EL.deck[0] + 90, EL.deck[1]], [EL.deck[2] - 90, EL.deck[1]]]) {
      const top = [x + Math.sign(ex - x) * (T.wt / 2), T.top + 22];
      m.card(S2.bar(top, [ex, ey], 1.6), 0);
    }
    for (let k = 0; k < 9; k++) { const c = S2.ellipse(EL.deck[0] + 20 + k * 40, EL.deck[1] + 9, 1.8, 1.8, 0, 10); m.cut(c, 0); m.emit(c, 0.9, 0); }
  } });
  // the ribbon: tissue, rising from the tower's top past the frame (with fine card ties)
  add({ name: 'ribbon', z: 4, col: PAPER.deep, vel: lin('#3A4270'), vw: 0, vl: 1.2, ao: 0.1, draw: (m) => {
    const R = EL.ribbon, hw = R.w / 2;
    m.vel(S2.rect(R.x - hw, -760, R.w, R.y0 + 760 + 4), 0.8, 0.2);
    for (let y = R.y0 - R.tie; y > -760; y -= R.tie) m.card(S2.rect(R.x - hw - 1, y - 0.8, R.w + 2, 1.6), 0);
  } });
  // the climber (it rises: the shot moves this layer)
  // (revision 11: authored at 2x about its centre, CLIMBER_XF scales it into place, so the zoom-in
  //  on the launch stays crisp; the world geometry is unchanged, so the landing still sits)
  add({ name: 'climber', z: 8, col: PAPER.ink, alb: 0.5, ao: 0.3, cast: 1, rimk: 1.5, vel: lin('#3A4270'), vw: 0, vl: 1.0, bound: 1, draw: (m) => {
    drawClimber2x(m, climberParts(), [EL.climber.x, EL.climber.y], true);
  } });
  return S;
}

// ---------------------------------------------------------------- orbit
export const ORBIT = { earth: { cx: 960, cy: 3300, r: 2500 }, ringY: 300, station: [960, 300] };
export function orbitScene() {
  const S = { name: 'elevator-orbit' };
  S.world = { x0: -560, y0: -400, w: 3040, h: 2200 };
  S.sky = { top: '#05060C', hor: '#0B0E1A', horY: 1080 };
  S.light = { x: 960, y: 300, z: 60, r: 10, I: 0, a: 100, f: 1200 };
  S.hazeW = 2e-5;
  S.params = { arim: 0.1, hm: 0, rim: 1.4 };
  S.cam = { Zc: 2400, zref: 0, c: [960, 540] };
  S.moon = { dir: [0.4, 0.3, 1], I: 0.25, disc: [0, 0, 0] };
  const L = S.layers = [];
  const add = (l) => L.push(l);
  const E = ORBIT.earth;
  // the Earth: a dark disc, its coasts pricked with warm cities, the reactor's glow, a rim of air
  add({ name: 'earth', z: -900, col: '#1A2240', alb: 0.35, ao: 0, vel: lin('#7A8CD0'), vw: 0, vl: 0, ew: 0, ef: 0.35, em: COOL.map((v) => v * 0.4), draw: (m) => {
    m.soft(10, () => m.vel(S2.ellipse(E.cx, E.cy, E.r + 16, E.r + 16, 0, 360), 0.5));
    m.card(S2.ellipse(E.cx, E.cy, E.r, E.r, 0, 360), 0.3);
    const R = mulberry32(8181);
    // coastlines as bands of city light: two long arcs across the visible cap
    for (let i = 0; i < 900; i++) {
      const band = i % 3, a = -Math.PI / 2 + (R() - 0.5) * (band === 2 ? 0.9 : 0.62), d = E.r - (band === 0 ? 40 + R() * 120 : band === 1 ? 180 + R() * 220 : 60 + R() * 420);
      const x = E.cx + Math.cos(a) * d, y = E.cy + Math.sin(a) * d, w = 1.2 + 1.3 * R();
      const h = S2.rect(x, y, w, w * 0.8); m.cut(h, 0); m.emit(h, 0.3 + 0.7 * R(), 0);
    }
    m.soft(22, () => m.emit(S2.ellipse(E.cx - 70, E.cy - E.r + 90, 60, 14), 0.3));       // the reactor's glow near the anchor
  } });
  // the ring of satellites (seen from near its plane: a flat ellipse across the frame) and the station
  add({ name: 'ring', z: -300, col: PAPER.deep, alb: 0.4, ao: 0, ew: 0, ef: 0.2, draw: (m) => {
    const R = mulberry32(8282), cy = ORBIT.ringY, rx = 1500, ry = 70;
    for (let k = 0; k < 420; k++) {
      const a = 2 * Math.PI * k / 420, x = 960 + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      const s = 0.7 + 0.5 * R(), p = S2.rect(x - 5 * s, y - 1.4 * s, 10 * s, 2.8 * s);
      m.emit(p, (Math.sin(a) > 0 ? 0.95 : 0.55) * (0.6 + 0.4 * R()), 0);
    }
    for (let k = 0; k < 240; k++) { const a0 = 2 * Math.PI * k / 240, a1 = 2 * Math.PI * (k + 1) / 240; m.emit(S2.bar([960 + rx * Math.cos(a0), cy + ry * Math.sin(a0)], [960 + rx * Math.cos(a1), cy + ry * Math.sin(a1)], 1.2), 0.3, 0); }
  } });
  // the ribbon from the Earth up to the station, and the station on the ring
  add({ name: 'oribbon', z: -60, col: PAPER.deep, vel: lin('#3A4270'), vw: 0, vl: 1.2, ao: 0, draw: (m) => {
    m.vel(S2.rect(960 - 7, ORBIT.station[1], 14, E.cy - E.r - ORBIT.station[1] + 20), 0.8, 0.1);
    for (let y = ORBIT.station[1] + 30; y < E.cy - E.r; y += 30) m.card(S2.rect(952, y - 0.7, 16, 1.4), 0);
  } });
  add({ name: 'station', z: -40, col: PAPER.slate, alb: 0.6, ao: 0.3, cast: 1, rimk: 1.4, vel: lin('#3A4270'), vw: 0, vl: 1.0, em: COOL.map((v) => v * 0.8), ew: 0, draw: (m) => {
    const [sx, sy] = ORBIT.station;
    m.card(S2.ellipse(sx, sy, 150, 26, 0, 72).concat(S2.ellipse(sx, sy, 124, 16, 0, 72).reverse()), 0.2);   // its ring
    m.card(S2.rrect(sx - 34, sy - 30, 68, 60, 10), 0.2);                                                       // the hub
    for (const a of [0, Math.PI / 2, Math.PI, 1.5 * Math.PI]) m.card(S2.bar([sx, sy], [sx + 137 * Math.cos(a), sy + 21 * Math.sin(a)], 3), 0);
    m.cut(S2.rect(sx - 22, sy - 8, 44, 12), 0); m.vel(S2.rect(sx - 22, sy - 8, 44, 12), 0.9, 0);
    for (let k = 0; k < 16; k++) { const a = 2 * Math.PI * k / 16, c = S2.ellipse(sx + 137 * Math.cos(a), sy + 21 * Math.sin(a), 2, 2, 0, 8); m.cut(c, 0); m.emit(c, 1, 0); }
  } });
  add({ name: 'oclimber', z: -30, col: PAPER.ink, alb: 0.5, ao: 0.3, rimk: 1.5, vel: lin('#3A4270'), vw: 0, vl: 1.0, draw: (m) => {
    const C = climberParts(960, 0);
    m.card(S2.rrect(C.body[0], C.body[1], C.body[2] - C.body[0], C.body[3] - C.body[1], 8), 0.2);
    m.cut(rect(C.windows), 0); m.vel(rect(C.windows), 0.9, 0);
    C.clamps.forEach((c) => m.card(S2.rrect(c[0], c[1], c[2] - c[0], c[3] - c[1], 3), 0.1));
    C.packs.forEach((zz) => m.vel(S2.ribbon(zz, () => 3.2, [false, false]), 0.8, 0));
  } });
  // the hero sail (sail.js): its beam, the sail and the probe
  sailLayers({ z0: 60 }).forEach((l) => add(l));
  return S;
}

// ---------------------------------------------------------------- space (revision 10)
// Black space and stars, the tether through the frame, the climber (its packs of folded sails are
// the payload: two stacks joined by a yoke, one layer each side, so they can be flung together and
// then burst apart), and the hero sail (sail.js). No Earth, ring or station. Everything is placed
// in screen px (the camera stays at rest; the shot moves the layers).
export function spaceScene() {
  const S = { name: 'elevator-space' };
  S.world = { x0: -560, y0: -400, w: 3040, h: 2200 };
  S.sky = { top: '#040509', hor: '#080A14', horY: 1080 };
  S.light = { x: 960, y: 300, z: 60, r: 10, I: 0, a: 100, f: 1200 };
  S.hazeW = 1.5e-5;
  S.params = { arim: 0.1, hm: 0, rim: 1.4 };
  S.cam = { Zc: 2400, zref: 0, c: [960, 540] };
  S.moon = { dir: [0.4, 0.3, 1], I: 0.2, disc: [0, 0, 0] };
  const L = S.layers = [];
  const add = (l) => L.push(l);
  add({ name: 'tether', z: -60, col: PAPER.deep, vel: lin('#3A4270'), vw: 0, vl: 1.2, ao: 0, draw: (m) => {
    m.vel(S2.rect(960 - 7, -400, 14, 2200), 0.8, 0.1);
    for (let y = -400; y < 1800; y += 30) m.card(S2.rect(952, y - 0.7, 16, 1.4), 0);
  } });
  // the climber and its pods, authored at 2x about (960, 0) (layerXF places and zooms them)
  add({ name: 'climber', z: -30, col: PAPER.ink, alb: 0.5, ao: 0.3, rimk: 1.5, vel: lin('#3A4270'), vw: 0, vl: 1.0, bound: 1, draw: (m) => {
    drawClimber2x(m, climberParts(960, 0), [960, 0], false);
  } });
  const packs = climberParts(960, 0).packs, T2 = X2([960, 0]);
  for (const [name, side] of [['podL', -1], ['podR', 1]]) add({ name, z: -20, col: PAPER.ink, alb: 0.5, ao: 0.2, rimk: 1.4, vel: lin('#3A4270'), vw: 0, vl: 1.0, bound: 1, draw: (m) => {
    packs.filter((zz) => Math.sign(zz[0][0] - 960) === side).forEach((zz) => m.vel(S2.ribbon(zz.map(T2), () => 6.4, [false, false]), 0.8, 0));
    const x0 = side < 0 ? 896 : 960, x1 = side < 0 ? 960 : 1024, a = T2([x0, -54]), b = T2([x1, -48]);
    m.card(S2.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]), 0.1);                              // its half of the yoke
    const q = T2([side < 0 ? 904 : 1012, -50]); m.card(S2.rect(q[0], q[1], 8, 44), 0);         // the strut to its stack
  } });
  sailLayers({ z0: 60 }).forEach((l) => add(l));
  return S;
}

