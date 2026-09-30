// Clawd as a solid: any sprite grid ('#' body, 'o' eye pocket) extruded D pixel-widths deep.
// Cells are 1 wide x 2 tall; eye cells are 1.0-deep pockets with an ink floor (clawd-3d.js
// canon, so the eyes stay dark from 3/4 views). Hard edges, no bevels. Each wall quad carries
// per-vertex AO (under the arms, above the legs, inside the pockets), as in frame-v2.
// Local frame: x across the glyph (left to right seen from the front), y up from the feet,
// z toward the front (the direction he faces). Units: pixel-widths.

// the canonical glyph with its eyes marked
export const NEUTRAL = [
  '...############...',
  '...##o######o##...',
  '.################.',
  '...############...',
  '....#.#....#.#....',
];
// run cycle from the walk sheet (05-clawd-sprites), eyes kept front-facing for 3D
export const RUN = [
  ['...############...', '...##o######o##...', '.################.', '...############...', '....#.#....#.#....'],
  ['...############...', '.#.##o######o##...', '..##############..', '...############.#.', '.....##.....##....'],
  ['...############...', '...##o######o##...', '.################.', '...############...', '....#.#....#.#....'],
  ['...############...', '...##o######o##.#.', '..##############..', '.#.############...', '.....##.....##....'],
];
// crouch: the "sit" frame (legs folded under, arms on the ground)
export const SIT = [
  '...############...',
  '...##o######o##...',
  '...############...',
  '.################.',
];
// hop squash (a tap before a leap)
export const SQUASH = [
  '..##############..',
  '..###o######o###..',
  '.################.',
  '...#.#......#.#...',
];

export function buildClawd(grid, D, opts = {}) {
  const rows = grid.length, cols = grid[0].length;
  const rec = Math.min(1.0, D * 0.25);
  const kind = (c, r) => (c < 0 || r < 0 || c >= cols || r >= rows ? '.' : grid[r][c]);
  const z1 = (k) => (k === '#' ? D / 2 : k === 'o' ? D / 2 - rec : -1e9);
  const z0 = -D / 2;
  const P = [], N = [], AO = [], M = [];
  const push = (p, n, ao, m) => { P.push(p[0], p[1], p[2]); N.push(Math.round(n[0] * 127), Math.round(n[1] * 127), Math.round(n[2] * 127), 0); AO.push(ao); M.push(m); };
  const quad = (a, b, c, d, n, ao, m) => { push(a, n, ao[0], m); push(b, n, ao[1], m); push(c, n, ao[2], m); push(a, n, ao[0], m); push(c, n, ao[2], m); push(d, n, ao[3], m); };
  const K = 0.42;
  const filled = (c, r) => kind(c, r) !== '.';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = kind(c, r); if (k === '.') continue;
    const X0 = c - cols / 2, X1 = X0 + 1, Y0 = (rows - 1 - r) * 2, Y1 = Y0 + 2;
    const zt = z1(k);
    // front (pocket floor is ink) and back
    quad([X0, Y0, zt], [X1, Y0, zt], [X1, Y1, zt], [X0, Y1, zt], [0, 0, 1], k === 'o' ? [0.7, 0.7, 0.7, 0.7] : [1, 1, 1, 1], k === 'o' ? 1 : 0);
    quad([X0, Y0, z0], [X0, Y1, z0], [X1, Y1, z0], [X1, Y0, z0], [0, 0, -1], [1, 1, 1, 1], 0);
    // side walls: exposed where the neighbour is lower (pocket walls) or empty
    const side = (nc, nr, face) => {
      const nk = kind(nc, nr), top = Math.max(z0, z1(nk));
      if (top >= zt - 1e-6) return;
      const lo = nk === '.' ? z0 : top;
      const pocket = nk === 'o';
      const aoL = pocket ? 0.5 : 1, aoH = pocket ? 1 : 1;
      if (face === 'R') { const t = !pocket && filled(c + 1, r - 1) ? K : 1, b = !pocket && filled(c + 1, r + 1) ? K : 1; quad([X1, Y0, zt], [X1, Y0, lo], [X1, Y1, lo], [X1, Y1, zt], [1, 0, 0], pocket ? [aoH, aoL, aoL, aoH] : [b, b, t, t], 0); }
      if (face === 'L') { const t = !pocket && filled(c - 1, r - 1) ? K : 1, b = !pocket && filled(c - 1, r + 1) ? K : 1; quad([X0, Y0, lo], [X0, Y0, zt], [X0, Y1, zt], [X0, Y1, lo], [-1, 0, 0], pocket ? [aoL, aoH, aoH, aoL] : [b, b, t, t], 0); }
      if (face === 'U') { const l = !pocket && filled(c - 1, r - 1) ? K : 1, rr = !pocket && filled(c + 1, r - 1) ? K : 1; quad([X0, Y1, zt], [X1, Y1, zt], [X1, Y1, lo], [X0, Y1, lo], [0, 1, 0], pocket ? [aoH, aoH, aoL, aoL] : [l, rr, rr, l], 0); }
      if (face === 'D') { const l = !pocket && filled(c - 1, r + 1) ? K : 1, rr = !pocket && filled(c + 1, r + 1) ? K : 1; quad([X0, Y0, lo], [X1, Y0, lo], [X1, Y0, zt], [X0, Y0, zt], [0, -1, 0], pocket ? [aoL, aoL, aoH, aoH] : [l, rr, rr, l], 0); }
    };
    side(c + 1, r, 'R'); side(c - 1, r, 'L'); side(c, r - 1, 'U'); side(c, r + 1, 'D');
  }
  return { P: new Float32Array(P), N: new Int8Array(N), AO: new Float32Array(AO), M: new Float32Array(M), n: P.length / 3, rows, cols };
}

// The sprite sheet's poses (sets/hill/clawd-pose.js GRIDS, 22 x 8 frames on the same centre line
// and ground row as NEUTRAL) as solids: accent lights dropped, eye holes become eye pockets.
export const solidGrid = (g) => g.map((r) => r.replace(/[wy]/g, '.'));
