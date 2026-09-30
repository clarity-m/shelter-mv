// Layout and timing of the wall of worlds, shared by S15 (the grid) and S17 (the harness).
import { hash } from '../../lib/util.js';
import { TILE_C, TILE_HALF, tileUVtoWorld, SPAWN_UV } from './wall.js';
import { PATH_S } from './terrain.js';

export const PITCH = 2 * TILE_HALF + 16;          // tile spacing (m)
export const COLS = 35, ROWS = 35;                 // 1225 worlds, the hero valley at the centre
const PLEN = PATH_S[PATH_S.length - 1];

// every tile's identity: grid index, variant, tint, when it appears and when it is solved
export function makeTiles(appearFrame) {
  const T = [];
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const gi = i - (COLS >> 1), gj = j - (ROWS >> 1);
    const h1 = hash(i, j, 1), h2 = hash(i, j, 2), h3 = hash(i, j, 3), h4 = hash(i, j, 4);
    const ring = Math.max(Math.abs(gi), Math.abs(gj));
    const hero = gi === 0 && gj === 0;
    // revision 11: many kinds of world (the valley, funnel craters, icy shores, salt flats, grid
    // plains), the kind in the variant's bits 3+. His own valley and S17's dive tile stay valleys.
    const h5 = hash(i, j, 5), own = hero || (gi === 0 && gj === 1);
    const kind = own ? 0 : h5 < 0.30 ? 0 : h5 < 0.48 ? 1 : h5 < 0.66 ? 2 : h5 < 0.83 ? 3 : 4;
    T.push({ gi, gj, ring, hero, kind, variant: (hero ? 0 : Math.floor(h1 * 8)) + 8 * kind, tint: h2, h3, h4,
      appearF: appearFrame(ring, h3), period: 64 + Math.floor(h4 * 60), seed: Math.floor(h1 * 997) });
  }
  return T;
}
// solve time: tiles near the centre are solved first, with a wide random spread
export const solveFrame = (t, f0, span) => f0 + (0.15 + 0.85 * Math.pow(t.h3 * 0.55 + t.ring / 12 * 0.45, 1.1)) * span;

// ---------------------------------------------------------------- revision 14: the replicated grid
// S15: the learned valley and the three worlds the humans' cursor drops beside it (a funnel crater,
// an icy shore, a salt flat) form one 2 x 2 block, gi in {0, 1}, gj in {-1, 0} (revision 20: on the
// far side of S15's lens, which now looks at his face the way he spawns). Then
// `envs.replicate(4096)` stamps the block outward in rings of blocks, a wave per beat, to 32 x 32
// blocks (64 x 64 tiles). Every copy keeps its original's kind and orientation; the kind follows the
// tile's parity (valleys at even gi and gj, craters odd/even, ice even/odd, salt odd/odd). Frames
// are S15-local; S17 rebuilds the same tiles from S15's first frame.
export const REP = {
  DROPS: [[1, 0, 55], [0, -1, 91], [1, -1, 127]],      // [gi, gj, the click that drops it] (41.4, 42.2, 42.4)
  CLICK: 145,                                          // the 43.1 downbeat: the command runs
  // [first frame, first ring, last ring]: 43.1, 43.2, 43.3, 43.4, 44.1, 44.2, 44.3
  WAVES: [[145, 1, 1], [163, 2, 2], [181, 3, 4], [199, 5, 6], [217, 7, 9], [235, 10, 12], [253, 13, 16]],
  B0: -16, B1: 15,                                     // the block range (32 x 32 blocks)
  DIVE: [0, 2],                                        // S17's grey valley copy, never solved
};
export const blockOf = (gi, gj) => [Math.floor(gi / 2), Math.floor((gj + 1) / 2)];
export const kindOf = (gi, gj) => ((gi & 1) ? ((gj & 1) ? 3 : 1) : ((gj & 1) ? 2 : 0));
export function replicaTiles(f0) {
  const T = [];
  for (let gj = 2 * REP.B0 - 1; gj <= 2 * REP.B1; gj++) for (let gi = 2 * REP.B0; gi <= 2 * REP.B1 + 1; gi++) {
    const [bi, bj] = blockOf(gi, gj), ring = Math.max(Math.abs(bi), Math.abs(bj));
    const h1 = hash(gi + 99, gj + 99, 21), h2 = hash(gi + 99, gj + 99, 22), h3 = hash(gi + 99, gj + 99, 23), h4 = hash(gi + 99, gj + 99, 24);
    const hero = gi === 0 && gj === 0, dive = gi === REP.DIVE[0] && gj === REP.DIVE[1], kind = kindOf(gi, gj);
    let appearF = -1e9, drop = null;
    if (ring === 0) { if (!hero) { drop = f0 + REP.DROPS.find((d) => d[0] === gi && d[1] === gj)[2]; appearF = drop; } }
    else { const w = REP.WAVES.find((x) => ring >= x[1] && ring <= x[2]); appearF = f0 + w[0] + (ring - w[1]) * 4 + Math.floor(h3 * 4); }
    const born = ring === 0 ? f0 + REP.CLICK : appearF;          // its own Clawd arrives with it (the first four: at the click)
    const solveF = dive ? 1e9 : hero ? -1e9 : born + 20 + Math.floor(h3 * 40 + h4 * 70);    // his own: learned in S14
    T.push({ gi, gj, bi, bj, ring, hero, dive, kind, variant: 8 * kind, tint: h2, h3, h4, appearF, drop, born, solveF,
      period: 64 + Math.floor(h4 * 60), seed: Math.floor(h1 * 997) });
  }
  return T;
}

// the tile's own Clawd: episodes that get further once the tile is solved
export function tileClawd(t, f, solvedF) {
  const ph = (f + t.seed * 13) % t.period, u = ph / t.period;
  const learned = Math.min(1, Math.max(0, (f - solvedF) / 60));
  const reach = PLEN * (0.18 + 0.3 * t.h4 + (0.82 - 0.3 * t.h4) * learned);
  const d = Math.min(reach, PLEN * 1.3 * u);
  return d;
}
export { TILE_C, TILE_HALF, tileUVtoWorld, SPAWN_UV };
