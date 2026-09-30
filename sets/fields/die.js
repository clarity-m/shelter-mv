// S34 (revision 10): the die. The land is a wafer of dies painted in the die-shot palette
// (glsl.js dieColor, uStrokePal 2), and the chips Clawd draws in light are the same layout, so
// every light outline sits on its painted blocks. Die-local coordinates: x across (0..1, screen
// right), y down the die (0..1, toward the lens at the end = world -z).
// Colours: 0 orange arrays, 1 teal caches, 2 rose logic, 3 gold, 4 violet.

// The layout, after Claire's die shot (claire_S34_color_die.png): two orange arrays top-left, a
// column of teal caches on the right, a rose logic band across the middle, two orange arrays below,
// small teal blocks down the left, a rose-and-teal strip between, gold buses along the edges.
export const DIE_TEMPLATE = [
  { r: [0.13, 0.07, 0.36, 0.29], c: 0, sd: 1, sn: 14 },   // orange arrays, top
  { r: [0.38, 0.07, 0.61, 0.29], c: 0, sd: 1, sn: 14 },
  { r: [0.13, 0.32, 0.61, 0.60], c: 2, sd: 2, sn: 9 },    // rose logic band
  { r: [0.13, 0.63, 0.36, 0.93], c: 0, sd: 1, sn: 16 },   // orange arrays, bottom
  { r: [0.38, 0.63, 0.61, 0.93], c: 0, sd: 1, sn: 16 },
  { r: [0.70, 0.07, 0.83, 0.28], c: 1, sd: 1, sn: 8 },    // teal caches, right column (2 x 4)
  { r: [0.84, 0.07, 0.95, 0.28], c: 1, sd: 1, sn: 8 },
  { r: [0.70, 0.30, 0.83, 0.50], c: 1, sd: 1, sn: 8 },
  { r: [0.84, 0.30, 0.95, 0.50], c: 1, sd: 1, sn: 8 },
  { r: [0.70, 0.52, 0.83, 0.72], c: 1, sd: 1, sn: 8 },
  { r: [0.84, 0.52, 0.95, 0.72], c: 1, sd: 1, sn: 8 },
  { r: [0.70, 0.74, 0.83, 0.93], c: 1, sd: 1, sn: 8 },
  { r: [0.84, 0.74, 0.95, 0.93], c: 1, sd: 1, sn: 8 },
  { r: [0.04, 0.07, 0.10, 0.27], c: 1, sd: 1, sn: 6 },    // small teal blocks, left column
  { r: [0.04, 0.29, 0.10, 0.50], c: 1, sd: 1, sn: 6 },
  { r: [0.04, 0.52, 0.10, 0.72], c: 1, sd: 1, sn: 6 },
  { r: [0.04, 0.74, 0.10, 0.93], c: 1, sd: 1, sn: 6 },
  { r: [0.63, 0.07, 0.68, 0.46], c: 2, sd: 0, sn: 0 },    // the strip between: rose, then teal
  { r: [0.63, 0.48, 0.68, 0.93], c: 1, sd: 1, sn: 10 },
  { r: [0.13, 0.300, 0.61, 0.312], c: 3, sd: 0, sn: 0 },  // gold buses
  { r: [0.13, 0.608, 0.61, 0.620], c: 3, sd: 0, sn: 0 },
  { r: [0.614, 0.07, 0.624, 0.93], c: 3, sd: 0, sn: 0 },
  { r: [0.11, 0.07, 0.118, 0.93], c: 3, sd: 0, sn: 0 },
];

// the wafer: die pitch and scribe gap (m), with die (0, 0) (the hero's) at origin x0, z0 (its
// top-left corner in world: die-local y runs toward -z)
export function wafer(x0, z0, pitch, scribe, rects = DIE_TEMPLATE) {
  return { x0, z0, pitch, scribe, rects };
}
// die-local (u, v) of die (i, j) -> world (x, z)
export function dieToWorld(W, i, j, u, v) {
  const sc = W.scribe / W.pitch, a = 0.5 * sc + u * (1 - sc), b = 0.5 * sc + v * (1 - sc);
  return [W.x0 + (i + a) * W.pitch, W.z0 - (j + b) * W.pitch];
}
// world (x, z) -> die-local (u, v) of die (i, j)
export function worldToDie(W, i, j, x, z) {
  const sc = W.scribe / W.pitch, a = (x - W.x0) / W.pitch - i, b = (W.z0 - z) / W.pitch - j;
  return [(a - 0.5 * sc) / (1 - sc), (b - 0.5 * sc) / (1 - sc)];
}
// the painted layout from a floorplan's lines (die-local, e.g. S35's paper chip unprojected): each
// closed rectangle becomes a block by its part name; dividers inside a block become its stripes; gold
// buses are painted along the widest gaps
export function templateFromLines(lines) {
  const R = [], rects = [], divs = [];
  const box = (pts) => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  for (const L of lines) {
    const closed = L.pts.length >= 5 && Math.hypot(L.pts[0][0] - L.pts[L.pts.length - 1][0], L.pts[0][1] - L.pts[L.pts.length - 1][1]) < 1e-3;
    if (closed) rects.push({ part: L.part.toLowerCase(), r: box(L.pts) });
    else divs.push(box(L.pts));
  }
  const colour = (p) => (/cache|sram|mem/.test(p) ? 1 : /logic|alu|ctrl/.test(p) ? 2 : /array|core_?block|tensor/.test(p) ? 0 : /narrow|strip|io/.test(p) ? 2 : /gold|bus/.test(p) ? 3 : 4);
  const core = rects.find((q) => q.part === 'core');
  if (core) R.push({ r: core.r, c: 4, sd: 0, sn: 0 });
  for (const q of rects) {
    if (q.part === 'die' || q.part === 'core') continue;
    const c = colour(q.part), w = q.r[2] - q.r[0], h = q.r[3] - q.r[1];
    const inside = divs.filter((d) => d[0] > q.r[0] && d[2] < q.r[2] && d[1] >= q.r[1] - 1e-3 && d[3] <= q.r[3] + 1e-3).length;
    R.push({ r: q.r, c, sd: inside ? 2 : c === 1 ? 1 : c === 0 ? (w > h ? 1 : 2) : 0, sn: inside ? inside + 1 : c === 1 ? 7 : c === 0 ? 14 : 0 });
  }
  // gold buses in the clear lanes (the die shot's gold lines): across the block rows of the left
  // group, and one lane between the left group and the right column
  const blocks = rects.filter((q) => !/die|core/.test(q.part));
  if (blocks.length) {
    const xsplit = Math.max(...blocks.map((q) => q.r[2])) - 0.25;
    const left = blocks.filter((q) => q.r[2] <= xsplit + 0.05), right = blocks.filter((q) => q.r[0] > xsplit + 0.05);
    const covered = (set, y) => set.some((q) => q.r[1] < y && q.r[3] > y);
    if (left.length) {
      const lx0 = Math.min(...left.map((q) => q.r[0])), lx1 = Math.max(...left.map((q) => q.r[2]));
      const ys = [...new Set(left.flatMap((q) => [q.r[1], q.r[3]]))].sort((a, b) => a - b);
      for (let i = 1; i < ys.length; i++) {
        const y = (ys[i] + ys[i - 1]) / 2;
        if (ys[i] - ys[i - 1] > 0.012 && !covered(left, y)) R.push({ r: [lx0, y - 0.004, lx1, y + 0.004], c: 3, sd: 0, sn: 0 });
      }
      if (right.length) {
        const gx0 = lx1, gx1 = Math.min(...right.map((q) => q.r[0]));
        if (gx1 - gx0 > 0.012) R.push({ r: [(gx0 + gx1) / 2 - 0.004, Math.min(...blocks.map((q) => q.r[1])), (gx0 + gx1) / 2 + 0.004, Math.max(...blocks.map((q) => q.r[3]))], c: 3, sd: 0, sn: 0 });
      }
    }
  }
  return R;
}
// the die's lines of light: each block's outline (closed), the gold buses as lines, the die edge
export function dieLines(rects = DIE_TEMPLATE) {
  const L = [{ part: 'edge', pts: [[0, 1], [1, 1], [1, 0], [0, 0], [0, 1]] }];
  for (const R of rects) {
    const [x0, y0, x1, y1] = R.r;
    if (R.c === 3) L.push({ part: 'trace', pts: x1 - x0 > y1 - y0 ? [[x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]] : [[(x0 + x1) / 2, y1], [(x0 + x1) / 2, y0]] });
    else L.push({ part: R.c === 1 ? 'cache' : R.c === 0 ? 'array' : 'logic', pts: [[x0, y1], [x1, y1], [x1, y0], [x0, y0], [x0, y1]] });
  }
  return L;
}
