// S34 (revision 10): the landing on S35's paper chip. chipFromMatch() reads O's chip (MATCH.md:
// its outline in screen px at S35's first frame); solveCamera() finds the camera (40-degree fovy,
// centred principal point) that sees the hero die's four world corners at the chip's four screen
// corners; toDieLocal() then unprojects every line of O's chip through that camera onto the die's
// plane, so the last frame lands them exactly (any residual goes into the layout, not the screen).
const FOVY = 40, F = 540 / Math.tan(FOVY * Math.PI / 360);

// the four corners of the chip's square (screen px): TL, TR, BR, BL
function cornersOf(pts) {
  const by = (f, mx) => pts.reduce((b, p) => ((mx ? f(p) > f(b) : f(p) < f(b)) ? p : b), pts[0]);
  return [by((p) => p[0] + p[1], false), by((p) => p[0] - p[1], true), by((p) => p[0] + p[1], true), by((p) => p[0] - p[1], false)];
}
export async function chipFromMatch() {
  for (const f of ['/out/stills/match_S35_chip.json', '/out/stills/match_S35_die.json']) {
    try {
      const r = await fetch(f, { cache: 'no-store' });
      if (!r.ok) continue;
      const j = await r.json(), lines = j.lines || [];
      const sq = lines.filter((L) => /^(chip|die)$/i.test(L.part)).concat(lines.filter((L) => /chip|die/i.test(L.part)));
      const box = sq.length ? sq[0].pts : lines.flatMap((L) => L.pts);
      return { src: f.split('/').pop(), quad: cornersOf(box), screenLines: lines };
    } catch (e) { /* not yet published */ }
  }
  // a placeholder until O publishes: a square chip seen from above, 600 px, a little right of centre
  return { src: 'placeholder', quad: [[700, 260], [1300, 260], [1300, 860], [700, 860]], screenLines: null };
}

// ---------------------------------------------------------------- small linear algebra
function solve8(A, b) {           // Gaussian elimination, 8 x 8
  const n = 8, M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
function homography(src, dst) {   // src (u, v) -> dst (x, y), 4 points
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i], [x, y] = dst[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]); b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]); b.push(y);
  }
  const h = solve8(A, b);
  return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
}
const sub = (a, b) => a.map((v, i) => v - b[i]), add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, s) => a.map((v) => v * s);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), len = (a) => Math.hypot(...a), nrm = (a) => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// die: its four world corners [x, y, z] (TL, TR, BR, BL, coplanar); quad: their screen px
// returns { pos, fwd, up, fovy } for camBasis (right = cross(up, fwd))
export function solveCamera(quad, die) {
  const O = die[0], eu = sub(die[1], die[0]), ev = sub(die[3], die[0]);
  const H = homography([[0, 0], [1, 0], [1, 1], [0, 1]], quad);
  // K^-1 H: camera-space columns (x right, y down, z forward)
  const Ki = (c) => [(c[0] - 960 * c[2]) / F, (c[1] - 540 * c[2]) / F, c[2]];
  const col = (j) => Ki([H[0][j], H[1][j], H[2][j]]);
  let c1 = col(0), c2 = col(1), c3 = col(2);
  let mu = 0.5 * (len(c1) / len(eu) + len(c2) / len(ev));
  if (c3[2] < 0) { c1 = mul(c1, -1); c2 = mul(c2, -1); c3 = mul(c3, -1); }
  // orthonormal camera-space images of the die's axes (symmetric Gram-Schmidt)
  let a = nrm(c1), b = nrm(c2);
  const bis = nrm(add(a, b)), perp = nrm(sub(a, b));
  a = nrm(add(bis, perp)); b = nrm(sub(bis, perp));
  // world frame of the die, and the camera's axes in world: this renderer's camera frame (right,
  // down, forward) is mirror-handed in world coordinates, so the normals flip sign
  const ua = nrm(eu), vb = nrm(ev), nw = cross(ua, vb), nc = mul(cross(a, b), -1);
  // camera -> world: R_c = M N^T with M = [ua vb nw], N = [a b nc]
  const toW = (c) => add(add(mul(ua, dot(a, c)), mul(vb, dot(b, c))), mul(nw, dot(nc, c)));
  const down = toW([0, 1, 0]), fwd = toW([0, 0, 1]);
  const pos = sub(O, toW(mul(c3, 1 / mu)));
  return { pos, fwd: nrm(fwd), up: nrm(mul(down, -1)), fovy: FOVY };
}

// screen px (at the last camera) -> world point on the plane y = y0
export function unproject(cam, q, y0) {
  const fwd = nrm(cam.fwd), up0 = nrm(cam.up), right = nrm(cross(up0, fwd)), up = cross(fwd, right);
  const d = add(add(fwd, mul(right, (q[0] - 960) / F)), mul(up, -(q[1] - 540) / F));
  const t = (y0 - cam.pos[1]) / d[1];
  return add(cam.pos, mul(d, t));
}
