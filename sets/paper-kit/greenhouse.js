// The greenhouse set (S35, revision 8): a paper glasshouse at night, looking down its central aisle.
// Nested arched ribs of card recede to the end wall; between them the roof and walls are vellum
// panels (moonlit tissue, cool) with glazing bars; beds of paper plants run along both sides of the
// aisle, a hanging grow-light bar over each bay. In the foreground on the right bed stands one big
// paper plant: stem, five leaves and a drooping grain head. S34's plant of light lands on it
// (PLANT_LINES, MATCH.md), and then the grow lights come on bay by bay: each bay is its own layer,
// so its lamp (ew), its tissue (vw) and its plants light together, with no mask redraw.
// World coordinates are screen px at S35's first frame (the camera starts at the rest view).
import { S2, lin, lerp, clamp, mulberry32, PAPER } from './kit.js';

export const GH = { vx: 960, vy: 560, floor: 1004 };
// bays near to far: depth, half-width, rib top, floor line at that depth
export const BAYS = [
  { z: 150, W: 1010, top: -60, base: 1070 },
  { z: -60, W: 700, top: 118, base: 952 },
  { z: -260, W: 490, top: 250, base: 870 },
  { z: -460, W: 345, top: 338, base: 810 },
  { z: -660, W: 245, top: 398, base: 768 },
  { z: -860, W: 175, top: 440, base: 739 },
];
export const END = { z: -1020, W: 128, top: 468, base: 720 };

// ---------------------------------------------------------------- the plant
// Control lines (world px): the stem, five leaf blades and the grain head. The paper plant is these
// shapes filled; its outline (PLANT_LINES) is what S34's drawing puts on it.
export const PLANT = {
  stem: [[1296, 1004], [1290, 900], [1280, 790], [1270, 680], [1263, 580], [1259, 480]],
  leaves: [
    { c: [[1291, 908], [1330, 880], [1382, 866], [1430, 876], [1468, 908]], w: 13 },
    { c: [[1284, 832], [1246, 796], [1196, 783], [1150, 794], [1118, 826]], w: 12 },
    { c: [[1275, 740], [1312, 706], [1356, 690], [1396, 697], [1424, 722]], w: 11 },
    { c: [[1269, 664], [1236, 628], [1198, 612], [1166, 618]], w: 9 },
    { c: [[1263, 590], [1288, 556], [1318, 541]], w: 7 },
  ],
  head: { c: [[1259, 480], [1257, 446], [1263, 418], [1278, 398], [1300, 386], [1324, 383]], w: 17 },
};
const smoothLine = (ctrl, seg = 10) => S2.cat(ctrl, false, seg);
// a blade round a centreline: width w at its widest, tapering to both ends
function blade(ctrl, w, root = 0.25) {
  const cl = smoothLine(ctrl);
  return S2.ribbon(cl, (t) => w * Math.pow(Math.sin(Math.PI * clamp(root + (1 - root) * t, 0, 1)), 0.7) + 0.6, [false, false]);
}
export function plantShapes(p = PLANT, s = 1, at = null) {
  // at: [x, y] moves the plant (its stem's foot) there, scaled by s (the rows use this)
  const f0 = p.stem[0], tr = at ? (q) => [at[0] + (q[0] - f0[0]) * s, at[1] + (q[1] - f0[1]) * s] : (q) => q;
  const T = (pts) => pts.map(tr);
  const stem = T(S2.ribbon(smoothLine(p.stem), (t) => lerp(8.5, 4.5, t), [false, false]));
  const leaves = p.leaves.map((L) => T(blade(L.c, L.w)));
  const head = T(blade(p.head.c, p.head.w, 0.1));
  // the grains: small ovals along the head, alternating sides
  const hc = smoothLine(p.head.c), grains = [];
  for (let i = 3; i < hc.length - 2; i += 3) {
    const a = hc[i - 1], b = hc[i + 1], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, side = (i / 3) % 2 ? 1 : -1;
    const q = [hc[i][0] - ty / l * side * 5.5, hc[i][1] + tx / l * side * 5.5];
    grains.push(T(S2.ellipse(q[0], q[1], 5.2, 3.2, Math.atan2(ty, tx), 12)));
  }
  return { stem, leaves, head, grains };
}
// the outline of the foreground plant in screen px at S35's first frame: [{ part, pts }]
export function PLANT_LINES() {
  const out = [{ part: 'stem', pts: smoothLine(PLANT.stem) }];
  PLANT.leaves.forEach((L, i) => out.push({ part: 'leaf' + i, pts: blade(L.c, L.w).concat([blade(L.c, L.w)[0]]) }));
  const h = blade(PLANT.head.c, PLANT.head.w, 0.1);
  out.push({ part: 'head', pts: h.concat([h[0]]) });
  return out;
}

// ---------------------------------------------------------------- the arches
export function archPts(b, inset = 0, n = 40) {
  // the arch's outline at its rib's centre: posts up to the spring line, a round arch above
  const W = b.W - inset, spring = b.base - (b.base - b.top) * 0.46, ry = spring - b.top - inset;
  const pts = [[GH.vx - W, b.base + 40]];
  for (let i = 0; i <= n; i++) { const a = Math.PI + Math.PI * i / n; pts.push([GH.vx + W * Math.cos(a), spring + ry * Math.sin(a)]); }
  pts.push([GH.vx + W, b.base + 40]);
  return pts;
}
const sc = (b) => b.W / 700;

export function greenhouseScene(o = {}) {
  const S = { name: 'greenhouse' };
  S.world = { x0: -140, y0: -120, w: 2200, h: 1340 };
  S.light = { x: 1300, y: 330, z: 200, r: 14, I: 0, a: 120, f: 900 };
  S.hazeW = 8e-5;
  S.params = { arim: 0.14, hm: 1.4e-5, rim: 1.4 };
  S.cam = { Zc: 2400, zref: 0, c: [GH.vx, GH.vy] };
  S.hazeBack = 120; S.hazeFront = 300;
  S.moon = { dir: [-0.25, 0.55, 1], I: 0.3, disc: [0, 0, 0] };
  const COOL = lin('#9FB3D9'), TISSUE = lin('#2A3358').map((v) => v * 1.25);
  const L = S.layers = [];
  const add = (l) => L.push(l);
  // the end wall: a vellum panel in its arch, a door frame
  add({ name: 'end', z: END.z, col: PAPER.slate, alb: 0.6, ao: 0.2, vel: TISSUE, vw: 0, vl: 0.6, draw: (m) => {
    const inner = archPts(END, 0);
    m.card(S2.rect(-140, -120, 2200, 1340), 0);
    m.cut(inner, 0.2); m.vel(inner, 0.8, 0.2);
    for (const dx of [-60, 0, 60]) m.card(S2.rect(GH.vx + dx - 1.5, END.top - 10, 3, END.base - END.top + 10), 0);
    m.card(S2.rect(GH.vx - 26, END.base - 58, 52, 60), 0.2);
  } });
  // the bays, far to near
  [...BAYS].reverse().forEach((b, ri) => {
    const i = BAYS.length - 1 - ri, k = sc(b), nb = BAYS[i + 1] || END, R = mulberry32(900 + i);
    add({ name: 'bay' + i, z: b.z, col: PAPER.deep, alb: 0.55, ao: 0.35, cast: 1, rimk: 1.2, vel: TISSUE, vw: 0, vl: 0.8,
      em: COOL.map((v) => v * 0.4), ew: 0, ef: 0.2, seed: i, draw: (m, rnd) => {
      // the floor from this bay's floor line down, then the rib, then the tissue panel inside it
      m.card([[-140, b.base], [2060, b.base], [2060, 1300], [-140, 1300]], 0.4);
      const outer = archPts(b, -6 * k), inner = archPts(b, 6 * k);
      m.card(outer.concat(inner.slice().reverse()), 0.3);
      // the panel: tissue between this rib and the next arch in, with glazing bars toward the aisle's end
      const pin = archPts(nb, -6 * sc(nb));
      m.vel(inner.concat(pin.slice().reverse()), 0.75, 0.2);
      for (let j = 1; j < 12; j++) {
        const t = j / 12, a = inner[Math.round(t * (inner.length - 1))], c = pin[Math.round(t * (pin.length - 1))];
        m.card(S2.bar(a, c, 2.2 * k), 0);
      }
      // the beds and their plants, both sides of the aisle
      for (const side of [-1, 1]) {
        const x0 = GH.vx + side * 90 * k, x1 = GH.vx + side * b.W * 0.93;
        m.card(S2.rect(Math.min(x0, x1), b.base - 26 * k, Math.abs(x1 - x0), 30 * k), 0.3);
        const n = Math.max(3, Math.round(Math.abs(x1 - x0) / (70 * k)));
        for (let q = 0; q < n; q++) {
          const x = lerp(x0, x1, (q + 0.5) / n) + (R() - 0.5) * 20 * k, s = k * (0.42 + 0.12 * R());
          if (i === 0 && side > 0 && x > 1080 && x < 1520) continue;             // the hero plant's place
          const P = plantShapes(PLANT, s * (R() < 0.5 ? 1 : 0.9), [x, b.base - 24 * k]);
          m.card(P.stem, 0.2); P.leaves.forEach((l) => m.card(l, 0.2));
          m.card(P.head, 0.2); P.grains.forEach((g) => m.vel(g, 0.9, 0));
        }
        // the grow light over this bed: a bar on two hangers, its lamp a slit of light
        const ly = b.base - (b.base - b.top) * 0.6, lx0 = GH.vx + side * 120 * k, lx1 = GH.vx + side * b.W * 0.8;
        m.card(S2.rect(Math.min(lx0, lx1), ly - 5 * k, Math.abs(lx1 - lx0), 9 * k), 0.2);
        for (const hx of [lerp(lx0, lx1, 0.2), lerp(lx0, lx1, 0.8)]) m.card(S2.rect(hx - 1, ly - 60 * k, 2, 56 * k), 0);
        const slit = S2.rect(Math.min(lx0, lx1) + 6 * k, ly + 1 * k, Math.abs(lx1 - lx0) - 12 * k, 3 * k);
        m.cut(slit, 0); m.emit(slit, 1.0, 0);
      }
    } });
  });
  // the hero plant, in front of the nearest bed (paper plant, vellum grains)
  add({ name: 'hero', z: 240, col: PAPER.ink, alb: 0.45, ao: 0.4, cast: 1, rimk: 1.5, thin: 0.12, vel: lin('#3A4270'), vw: 0, vl: 1.0, draw: (m) => {
    const P = plantShapes();
    m.card(P.stem, 0.2); P.leaves.forEach((l) => m.card(l, 0.25));
    m.vel(P.head, 0.55, 0.2); P.grains.forEach((g) => m.vel(g, 1.0, 0));
    m.card(S2.rect(1060, 1000, 900, 90), 0.4);                                   // the bed's front edge
  } });
  return S;
}

// per-frame state. on: [0..1] per bay (grow lights), hero: the hero plant's light, near: the lamp
// over it (the main light).
export function greenhouseState(o) {
  const layers = {};
  BAYS.forEach((b, i) => {
    const on = clamp(o.on ? o.on[i] : 0, 0, 1);
    layers['bay' + i] = { ew: 2.6 * on, vw: 0.16 * on, vl: 0.8 + 0.3 * on };     // the lamps lead; the tissue only warms
  });
  const endOn = clamp(o.endOn || 0, 0, 1);
  layers.end = { vw: 0.16 * endOn };
  layers.hero = { vw: 1.4 * (o.hero || 0), vl: 1.0 };
  return {
    layers,
    light: { I: 4.2e4 * (o.near || 0) },
    fills: [{ x: GH.vx, y: 480, z: -400, I: 2.6e4 * (o.fill || 0), a: 300, f: 900, h: 0.6 }],
  };
}
