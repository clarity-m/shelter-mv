// A small monospace stroke font for lettering cut into the bookend card (S02's `train(corpus)`).
// Each glyph is a set of polylines in em units (y up, baseline 0, x-height 0.52, advance 0.62).
// Letters are cut as strokes: the kerf follows the polyline, so the light shows through the stroke
// and the card stays whole round it. Closed forms keep stencil bridges (the o, the p's bowl, the a),
// so no card is left floating. layoutText() places a string on the card (card px, y down) and
// returns its segments in cutting order, each with its letter's index and its span of the letter's
// stroke length (a knife cuts a letter along its strokes in that order).
const ARC = (cx, cy, rx, ry, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
});
export const GLYPHS = {
  t: [[[0.28, 0.72], ...ARC(0.42, 0.14, 0.14, 0.14, 180, 270, 5), [0.53, 0.01]], [[0.10, 0.52], [0.50, 0.52]]],
  r: [[[0.14, 0.52], [0.14, 0.0]], [[0.14, 0.30], ...ARC(0.38, 0.26, 0.24, 0.24, 170, 50, 6)]],
  a: [ARC(0.27, 0.26, 0.19, 0.26, 52, 308, 12), [[0.50, 0.52], [0.50, 0.0]]],
  i: [[[0.16, 0.52], [0.30, 0.52], [0.30, 0.0]], [[0.12, 0.0], [0.48, 0.0]], [[0.30, 0.69], [0.30, 0.73]]],
  n: [[[0.12, 0.52], [0.12, 0.0]], [[0.12, 0.34], ...ARC(0.30, 0.34, 0.18, 0.18, 180, 0, 8), [0.48, 0.0]]],
  '(': [ARC(0.62, 0.26, 0.36, 0.50, 122, 238, 9)],
  ')': [ARC(0.0, 0.26, 0.36, 0.50, 58, -58, 9)],
  c: [ARC(0.32, 0.26, 0.20, 0.26, 45, 315, 12)],
  o: [ARC(0.30, 0.26, 0.20, 0.26, 108, 252, 7), ARC(0.30, 0.26, 0.20, 0.26, 288, 432, 7)],
  p: [[[0.12, 0.52], [0.12, -0.24]], ARC(0.32, 0.26, 0.19, 0.26, 162, 18, 7), ARC(0.32, 0.26, 0.19, 0.26, -18, -162, 7)],
  u: [[[0.12, 0.52], [0.12, 0.18], ...ARC(0.30, 0.18, 0.18, 0.18, 180, 360, 8)], [[0.48, 0.52], [0.48, 0.0]]],
  s: [[...ARC(0.30, 0.39, 0.17, 0.13, 35, 270, 8), ...ARC(0.30, 0.13, 0.18, 0.13, 90, -145, 9).slice(1)]],
};
export const ADVANCE = 0.62, HALF_W = 0.042;
// string -> { segs: [[ax, ay, bx, by]], info: [[letter, f0, f1, 0]], letters: [{ ch, x0, x1 }], width, halfW }
// em: px per em; cx: the line's centre x; baseline: its baseline y (card px, y down)
export function layoutText(str, { em = 100, cx = 0, baseline = 0 } = {}) {
  const width = str.length * ADVANCE * em, x00 = cx - width / 2;
  const segs = [], info = [], letters = [];
  [...str].forEach((ch, k) => {
    const g = GLYPHS[ch] || [];
    const ox = x00 + k * ADVANCE * em;
    const P = (p) => [ox + p[0] * em, baseline - p[1] * em];
    const lens = [];
    let total = 0;
    for (const pl of g) for (let i = 1; i < pl.length; i++) { const l = Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]); lens.push(l); total += l; }
    let acc = 0, j = 0;
    for (const pl of g) for (let i = 1; i < pl.length; i++) {
      const a = P(pl[i - 1]), b = P(pl[i]), l = lens[j++];
      segs.push([a[0], a[1], b[0], b[1]]); info.push([k, acc / total, (acc + l) / total, 0]); acc += l;
    }
    letters.push({ ch, x0: ox, x1: ox + ADVANCE * em });
  });
  return { segs, info, letters, width, halfW: HALF_W * em, em, cx, baseline };
}
