// Where the fusion core drawn in light lands on the paper reactor (revision 8; lead-owned).
// S21's camera is the fusion set's (sets/paper-fusion/fusion.js), whose numbers reactor.js shares as
// SC. The core is the plasma ring (its circle and meridians) and the twelve coils round it: the
// reactor's core shape and nothing more. The column, cap, base and ports are the humans' build and
// are never drawn in light. S36's last frame puts its light on coreLines(); S21 flashes the same
// lines on the kick and burns them off.
//
//   coreEdges()   the core's edges from reactorEdges(0), in the fusion set's model coordinates
//   coreLines()   [{ kind, dim, a: [x, y], b: [x, y] }] screen px (1920x1080) at S21's first frame
//   proj(X)       model -> screen through S21's camera (push 0)
import { reactorEdges, SC } from '../inside-montage/reactor.js';

export const CORE_KINDS = ['torus', 'merid', 'coil'];   // plus 'helix' (helixEdges, below)
const EL = SC.ELEV, DIST = SC.D, FPX = SC.S * SC.D;
export const CAM = {
  pos: [0, -DIST * Math.cos(EL), DIST * Math.sin(EL)],
  fwd: [0, Math.cos(EL), -Math.sin(EL)],
  up: [0, Math.sin(EL), Math.cos(EL)],
};
export function proj(X) {
  const dx = X[0] - CAM.pos[0], dy = X[1] - CAM.pos[1], dz = X[2] - CAM.pos[2];
  const zc = dx * CAM.fwd[0] + dy * CAM.fwd[1] + dz * CAM.fwd[2];
  const yc = dx * CAM.up[0] + dy * CAM.up[1] + dz * CAM.up[2];
  return [SC.PPX + FPX * dx / zc, SC.PPY - FPX * yc / zc];
}
// S21's push zooms the paper layers about the plasma ring's screen centre (fusion.js RING.c, uFocus)
export const FOCUS = (() => {
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (let i = 0; i < 720; i++) {
    const t = i * Math.PI / 360, s = proj([SC.R0 * Math.cos(t), SC.R0 * Math.sin(t), 0]);
    a = Math.min(a, s[0]); b = Math.max(b, s[0]); c = Math.min(c, s[1]); d = Math.max(d, s[1]);
  }
  return [(a + b) / 2, (c + d) / 2];
})();
export const LD = 1.6;   // the reactor body's paper-layer depth (fusion.js LDEPTH), for the push's zoom

// The plasma's magnetic field (revision 12). The D-coils are the magnets; their field runs the long way
// round the ring, and with the plasma current's own field the lines twist round the torus in helices on
// its surface: the twisted field that holds the plasma. Safety factor Q: a line goes round the ring Q
// times per turn round its cross-section. N lines, evenly spaced round the cross-section.
export const HELIX = { Q: 2, N: 6, SEG: 120, S: 1.0 };
export function helixEdges() {
  const { R0, A, KAPPA } = SC, E = [];
  for (let j = 0; j < HELIX.N; j++) {
    const a0 = 2 * Math.PI * j / HELIX.N, n = HELIX.SEG * HELIX.Q;
    const P = (i) => {
      const phi = 2 * Math.PI * i / HELIX.SEG, a = a0 + phi / HELIX.Q, r = R0 + HELIX.S * A * Math.cos(a);
      return [r * Math.cos(phi), r * Math.sin(phi), HELIX.S * KAPPA * A * Math.sin(a)];
    };
    for (let i = 0; i < n; i++) E.push({ a: P(i), b: P(i + 1), kind: 'helix', dim: 0.85, line: j });
  }
  return E;
}
export const coreEdges = () => [...reactorEdges(0).filter((e) => CORE_KINDS.includes(e.kind)), ...helixEdges()];
export const coreLines = () => coreEdges().map((e) => ({ kind: e.kind, dim: e.dim ?? 1, a: proj(e.a), b: proj(e.b) }));
