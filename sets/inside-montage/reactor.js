// The fusion reactor as a blueprint in lines of light (S20). The geometry is S21's paper tokamak
// (sets/paper-fusion/fusion.js, its SC constants and camera, copied here because that set keeps
// them inside createFusion): drawn through the same camera it lands exactly on S21's reactor, so
// S20's last frame can dissolve into S21's first. Model coordinates are the fusion set's: x right,
// y away from its camera, z up; `toWorld` places the model in the hill world (y up, z away).
//
//   const R = reactorEdges();                // [{ a, b, t0, dt, kind, w, dim }] (a, b in model coords)
//   const place = reactorPlacement(C, s);    // model -> world at centre C, scale s (metres per unit)
//   place.cam(dist, orbit)                   // the fusion camera at `dist` model units (12 = S21's)
export const SC = {
  R0: 1.0, A: 0.12, KAPPA: 1.35,
  NCOIL: 12, COIL_T: 0.16, PHI0: (-90 + 15 + 6) * Math.PI / 180,
  RIN: 0.5, ROUT: 1.58, HC: 0.82, BAND: 0.10,
  SOL_R: 0.2, RCUT: 0.72,
  BASE_R: 2.0, DECK_Z: -0.7, FLOOR_Z: -1.25,
  D: 12.0, ELEV: 19 * Math.PI / 180, S: 300, PPX: 960, PPY: 470,
};

// D-shaped coil outline in (r, z): flat inner leg, full outer curve (as fusion.js dLoop)
function dLoop(rin, rout, h, nc) {
  const p = [];
  for (let i = 0; i <= nc; i++) {
    const t = -Math.PI / 2 + Math.PI * i / nc;
    p.push([rin + (rout - rin) * Math.pow(Math.max(Math.cos(t), 0), 0.75), h * Math.sin(t)]);
  }
  return p;
}
// the part of a polyline (r, z) inside r >= rMin and z >= zMin, split into runs
function clipRuns(pts, rMin, zMin) {
  const runs = []; let cur = [];
  const inside = (q) => q[0] >= rMin && q[1] >= zMin;
  for (let i = 0; i < pts.length; i++) {
    const q = pts[i];
    if (inside(q)) { cur.push(q); continue; }
    if (cur.length > 1) runs.push(cur);
    cur = [];
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
}

// Every edge with its drafting slot in local frames of S20 (t0, dt). kind: torus, merid, coil,
// column, cap, base, port. Order: the plasma ring first (the idea), then the coils one by one
// round it, then the column and cap, then the base and its row of ports.
export function reactorEdges(T0 = 0) {
  const E = [];
  const ring = (r, z, n, t0, span, kind, extra = {}, front = false) => {
    for (let k = 0; k < n; k++) {
      const a0 = -Math.PI / 2 + 2 * Math.PI * k / n, a1 = -Math.PI / 2 + 2 * Math.PI * (k + 1) / n;
      if (front && Math.sin(0.5 * (a0 + a1)) > 0) continue;       // only the half facing S21's camera
      E.push(Object.assign({ a: [r * Math.cos(a0), r * Math.sin(a0), z], b: [r * Math.cos(a1), r * Math.sin(a1), z], t0: T0 + t0 + span * k / n, dt: span / n + 0.5, kind }, extra));
    }
  };
  // the plasma torus: four rings swept round like a compass, then its cross-sections
  const { R0, A, KAPPA } = SC;
  ring(R0 + A, 0, 72, 2, 24, 'torus');
  ring(R0 - A, 0, 64, 5, 24, 'torus');
  ring(R0, KAPPA * A, 72, 8, 24, 'torus', { dim: 0.8 });
  ring(R0, -KAPPA * A, 72, 11, 24, 'torus', { dim: 0.8 });
  for (let k = 0; k < SC.NCOIL; k++) {
    const phi = SC.PHI0 + (k + 0.5) * 2 * Math.PI / SC.NCOIL, c = Math.cos(phi), s = Math.sin(phi);
    for (let i = 0; i < 16; i++) {
      const a0 = 2 * Math.PI * i / 16, a1 = 2 * Math.PI * (i + 1) / 16;
      const p = (a) => { const r = R0 + A * Math.cos(a); return [r * c, r * s, KAPPA * A * Math.sin(a)]; };
      E.push({ a: p(a0), b: p(a1), t0: T0 + 26 + 0.9 * k + 0.25 * i, dt: 1, kind: 'merid', dim: 0.55 });
    }
  }
  // the twelve D-coils, round the ring from the back: outer and inner edge of each band
  const DOUT = dLoop(SC.RIN, SC.ROUT, SC.HC, 72), DIN = dLoop(SC.RIN + SC.BAND, SC.ROUT - SC.BAND, SC.HC - SC.BAND, 72);
  const order = [...Array(SC.NCOIL).keys()].map((k) => SC.PHI0 + k * 2 * Math.PI / SC.NCOIL)
    .sort((p, q) => Math.sin(q) - Math.sin(p));                     // far side first, the front last
  order.forEach((phi, j) => {
    const c = Math.cos(phi), s = Math.sin(phi), t0 = T0 + 36 + 4.5 * j;
    for (const [loop, dim] of [[DOUT, 1], [DIN, 0.7]]) {
      for (const run of clipRuns(loop, SC.RCUT, SC.DECK_Z)) {
        for (let i = 0; i + 1 < run.length; i++) {
          const p = run[i], q = run[i + 1];
          E.push({ a: [p[0] * c, p[0] * s, p[1]], b: [q[0] * c, q[0] * s, q[1]], t0: t0 + 10 * i / run.length, dt: 10 / run.length + 0.5, kind: 'coil', dim });
        }
      }
    }
  });
  // the central column and the lantern cap where the coils gather
  ring(SC.SOL_R, SC.DECK_Z, 24, 88, 6, 'column', { dim: 0.7 });
  ring(SC.SOL_R, 0.8, 24, 90, 6, 'column', { dim: 0.7 });
  for (const x of [-SC.SOL_R, SC.SOL_R]) E.push({ a: [x, 0, SC.DECK_Z], b: [x, 0, 0.8], t0: T0 + 90, dt: 6, kind: 'column', dim: 0.7 });
  ring(0.72, 0.77, 48, 90, 8, 'cap');
  ring(0.72, 0.86, 48, 92, 8, 'cap');
  // the cryostat base: the deck and floor circles, its two silhouette edges, the row of ports
  ring(SC.BASE_R, SC.DECK_Z, 96, 94, 12, 'base');
  ring(SC.BASE_R, SC.FLOOR_Z, 96, 97, 12, 'base', { dim: 0.8 }, true);   // its back half is behind the drum
  for (const x of [-SC.BASE_R, SC.BASE_R]) E.push({ a: [x, 0, SC.DECK_Z], b: [x, 0, SC.FLOOR_Z], t0: T0 + 100, dt: 5, kind: 'base' });
  for (let k = 0; k < 30; k++) {
    const phi = -Math.PI + Math.PI * (k + 0.5) / 30, P = [SC.BASE_R * Math.cos(phi), SC.BASE_R * Math.sin(phi), -0.9];
    E.push({ a: P, b: P, t0: T0 + 100 + 0.25 * k, dt: 1, kind: 'port' });
  }
  return E;
}

// model -> world: centre C (world), scale s (metres per model unit), turned by `yaw` about the
// vertical. cam(dist, orbit, elev, F) looks at the centre from `dist` model units, swung `orbit`
// radians round it, `elev` radians above it, focal F; the defaults (elevation 19 deg, F 3600, pp 960,
// 470) with dist 12, orbit 0 are S21's camera.
export function reactorPlacement(C, s) {
  const toWorld = (m) => [C[0] + s * m[0], C[1] + s * m[2], C[2] + s * m[1]];
  const cam = (dist, orbit = 0, elev = SC.ELEV, F = SC.S * SC.D) => {
    const e = elev, d = dist * s;
    const fw = [Math.sin(orbit) * Math.cos(e), -Math.sin(e), Math.cos(orbit) * Math.cos(e)];
    return { pos: [C[0] - d * fw[0], C[1] - d * fw[1], C[2] - d * fw[2]], yaw: orbit, pitch: -e, F, pp: [SC.PPX, SC.PPY] };
  };
  return { toWorld, cam };
}
