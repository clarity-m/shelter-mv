// The space elevator's blueprint, every line of it, in the elevator set's paper coordinates
// (revision 9: it replaces the rocket). S27 (agent I) draws these in light and on 72.4 only they
// remain; S29's first frame (the drop, 5195) lands them on the paper elevator and burns them off
// (sets/paper-kit/MATCH.md). The same geometry (EL) builds the paper set (elevator.js).
//
//   STROKES          [{ part, pts: [[X, Y], ...], z, t0, t1, w, I }] in world px. part is anchor |
//                    tower | stay | ribbon | tie | climber | sails. z is the set layer's depth.
//                    t0..t1 is the suggested draw window (0..1 over the whole drawing: the anchor,
//                    the tower, the stays, the ribbon rising, its ties, the climber, then the folded
//                    sails it carries). w is the stroke weight, I the relative brightness.
//   screenStrokes(cam)   the strokes in screen px through a kit camera
//   S29_CAM0         S29's camera at its first frame: the rest view, so screen = paper coordinates.
//   heat(part)       the landing's burn order: the anchor first, the folded sails last.
import { toScreen, lerp } from './kit.js';

export const S29_CAM0 = { Zc: 2400, zref: 0, c: [960, 540], t: [0, 0], tz: 0, pan: [0, 0] };
// the elevator's geometry (world px at the rest view)
export const EL = {
  horizon: 690, water: 862,
  deck: [780, 772, 1140, 790], deck2: [810, 790, 1110, 800],
  legs: [800, 870, 1050, 1120], legW: 16, legBot: 880,
  pontoons: [[780, 856, 900, 874], [1020, 856, 1140, 874]],
  tower: { base: 772, top: 600, wb: 110, wt: 34, levels: 5 },
  ribbon: { x: 960, w: 18, y0: 600, y1: -60, tie: 36 },
  climber: { x: 960, y: 438, w: 76, h: 76 },
  packs: 6,
};
const Z = { anchor: 0, ribbon: 4, climber: 8 };
const rectPts = ([x0, y0, x1, y1]) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
export const towerAt = (y) => { const t = (EL.tower.base - y) / (EL.tower.base - EL.tower.top); return lerp(EL.tower.wb, EL.tower.wt, t) / 2; };
// the climber's parts relative to its centre (the shot moves it up the ribbon)
export function climberParts(cx = EL.climber.x, cy = EL.climber.y) {
  const { w, h } = EL.climber, x0 = cx - w / 2, y0 = cy - h / 2;
  const packs = [];
  for (const side of [-1, 1]) for (let k = 0; k < EL.packs; k++) {
    const px0 = side < 0 ? x0 - 26 : x0 + w + 2, py = y0 + 8 + k * 10, zz = [];
    for (let i = 0; i <= 6; i++) zz.push([px0 + 24 * i / 6, py + (i % 2 ? -3 : 3)]);
    packs.push(zz);
  }
  return {
    body: [x0, y0, x0 + w, y0 + h],
    windows: [x0 + 8, y0 + 26, x0 + w - 8, y0 + 44],
    clamps: [[cx - 16, y0 - 10, cx + 16, y0], [cx - 16, y0 + h, cx + 16, y0 + h + 10]],
    packs,
  };
}

export const STROKES = (() => {
  const S = [];
  const add = (part, pts, z, t0, t1, w = 1, I = 1) => S.push({ part, pts, z, t0, t1, w, I });
  // the anchor platform: pontoons, legs, the decks
  EL.pontoons.forEach((p, i) => add('anchor', rectPts(p), Z.anchor, 0.0 + 0.02 * i, 0.06 + 0.02 * i, 1));
  EL.legs.forEach((x, i) => add('anchor', rectPts([x - EL.legW / 2, EL.deck2[3], x + EL.legW / 2, EL.legBot]), Z.anchor, 0.03 + 0.01 * i, 0.08 + 0.01 * i, 1));
  add('anchor', rectPts(EL.deck2), Z.anchor, 0.08, 0.13, 1);
  add('anchor', rectPts(EL.deck), Z.anchor, 0.1, 0.16, 1.2);
  // the base tower: its two edges rising, a level ring at each stage, an X in each stage
  const T = EL.tower, lv = (i) => lerp(T.base, T.top, i / T.levels);
  add('tower', [...Array(11)].map((_, k) => { const y = lerp(T.base, T.top, k / 10); return [EL.ribbon.x - towerAt(y), y]; }), Z.anchor, 0.14, 0.3, 1.1);
  add('tower', [...Array(11)].map((_, k) => { const y = lerp(T.base, T.top, k / 10); return [EL.ribbon.x + towerAt(y), y]; }), Z.anchor, 0.14, 0.3, 1.1);
  for (let i = 0; i <= T.levels; i++) { const y = lv(i), hw = towerAt(y), t = lerp(0.15, 0.3, i / T.levels); add('tower', [[EL.ribbon.x - hw, y], [EL.ribbon.x + hw, y]], Z.anchor, t, t + 0.02, 0.8, 0.85); }
  for (let i = 0; i < T.levels; i++) {
    const ya = lv(i), yb = lv(i + 1), a = towerAt(ya), b = towerAt(yb), t = lerp(0.17, 0.31, i / T.levels);
    add('tower', [[EL.ribbon.x - a, ya], [EL.ribbon.x + b, yb]], Z.anchor, t, t + 0.03, 0.6, 0.6);
    add('tower', [[EL.ribbon.x + a, ya], [EL.ribbon.x - b, yb]], Z.anchor, t, t + 0.03, 0.6, 0.6);
  }
  // the stays: from high on the tower to the deck's corners
  for (const [x, y] of [[EL.deck[0] + 8, EL.deck[1]], [EL.deck[2] - 8, EL.deck[1]], [EL.deck[0] + 90, EL.deck[1]], [EL.deck[2] - 90, EL.deck[1]]]) {
    const top = [EL.ribbon.x + Math.sign(x - EL.ribbon.x) * (EL.tower.wt / 2), EL.tower.top + 22];
    add('stay', [top, [x, y]], Z.anchor, 0.3, 0.36, 0.7, 0.75);
  }
  // the ribbon: its two edges rising from the tower's top out of the frame, then its ties
  const R = EL.ribbon, hw = R.w / 2;
  add('ribbon', [...Array(23)].map((_, k) => [R.x - hw, lerp(R.y0, R.y1, k / 22)]), Z.ribbon, 0.34, 0.56, 1.2);
  add('ribbon', [...Array(23)].map((_, k) => [R.x + hw, lerp(R.y0, R.y1, k / 22)]), Z.ribbon, 0.34, 0.56, 1.2);
  for (let y = R.y0 - R.tie; y > R.y1; y -= R.tie) { const t = lerp(0.36, 0.58, (R.y0 - y) / (R.y0 - R.y1)); add('tie', [[R.x - hw, y], [R.x + hw, y]], Z.ribbon, t, t + 0.02, 0.6, 0.6); }
  // the climber: body, windows, the clamps on the ribbon, and the folded sails it carries
  const C = climberParts();
  add('climber', rectPts(C.body), Z.climber, 0.6, 0.68, 1.2);
  add('climber', rectPts(C.windows), Z.climber, 0.64, 0.7, 0.8, 0.85);
  C.clamps.forEach((c, i) => add('climber', rectPts(c), Z.climber, 0.66 + 0.02 * i, 0.72 + 0.02 * i, 0.9));
  C.packs.forEach((zz, i) => add('sails', zz, Z.climber, 0.76 + 0.018 * (i % EL.packs), 0.82 + 0.018 * (i % EL.packs), 1.0, 1.2));
  return S;
})();

const HEAT = { anchor: 1, stay: 2, tower: 3, tie: 4, ribbon: 5, climber: 7, sails: 10 };
export const heat = (part) => HEAT[part] ?? 4;
export function screenStrokes(cam) {
  return STROKES.map((s) => Object.assign({}, s, { pts: s.pts.map((p) => toScreen(cam, p, s.z)) }));
}
