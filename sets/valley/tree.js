// S19 (revision 5): the tree that grows on the new hill's left shoulder, in the valley's own look:
// a low-poly trunk that forks into three limbs under a broad canopy of seven faceted clumps (the
// silhouette of the final scene's tree, sets/hill). Each part grows about its own pivot, riding
// on its parent: the trunk rises, the limbs reach out, the clumps bloom. Drawn through the valley
// renderer's hooks (P.extra for the scene, P.extraShadow for the shadow map), lit, shadowed,
// painted and fogged with the valley's own shader code. Pure function of the state it is given.
import { HDR, COMMON, LIGHT, SHADOW_FS } from './glsl.js';
import { rng } from '../../lib/util.js';

export const TREE_VS = `
layout(location=0) in vec3 aP;    // local position (m)
layout(location=1) in vec3 aN;    // face normal (local)
layout(location=2) in vec3 aPiv;  // the part's pivot (local)
layout(location=3) in vec4 aC;    // colour (sRGB), part index
uniform vec4 uTreeBase;           // x, y, z, yaw
uniform vec4 uPart[12];           // the pivot after growth (local), scale
uniform float uPartGlow[12];
out vec3 vWP; flat out vec3 vN; flat out vec4 vC; flat out float vGlow;
vec3 yawRot(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c*v.x + s*v.z, v.y, -s*v.x + c*v.z); }
void main(){
  int i = int(aC.w + 0.5);
  vec4 T = uPart[i];
  vec3 p = uTreeBase.xyz + yawRot(T.xyz + (aP - aPiv)*T.w, uTreeBase.w);
  vWP = p; vN = yawRot(aN, uTreeBase.w); vC = aC; vGlow = uPartGlow[i];
#ifdef SHADOW
  gl_Position = T.w > 1e-4 ? projectL(p) : vec4(2.0, 2.0, 2.0, 1.0);
#else
  gl_Position = T.w > 1e-4 ? projectP(p) : vec4(2.0, 2.0, 2.0, 1.0);
#endif
}`;
export const TREE_FS = `
in vec3 vWP; flat in vec3 vN; flat in vec4 vC; flat in float vGlow;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
void main(){
  vec3 p = vWP; vec3 n = normalize(vN);
  vec3 rd = normalize(p - uCam); float tF = length(p - uCam);
  vec3 alb = lin(vC.rgb);
  float sh = shadowAt(p, n) * cloudShade(p);
  vec3 col = lightSurf(p, n, alb, 1.0, sh);
  col += pow(1.0 - max(dot(-rd, n), 0.0), 3.0) * vec3(1.0, 0.85, 0.7) * 0.30 * alb;
  col = paintSurf(col, p, n, fract(vC.w*0.37 + 0.13), 0.8*uPaint, tF, 0.0);
  col += vGlow*(alb*1.5 + vec3(0.12, 0.06, 0.02))*vec3(1.0, 0.72, 0.45);   // his light in fresh growth
  col = fogIt(col, p, rd, tF, 1.0);
  oCol = finishCol(col);
  oAux = vec4(1.0, tF/(tF + 60.0), 1.0, 0.0);
}`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
// the shape (local metres; x across the view, y up, z away from the lens)
const FORK = [0.12, 2.05, 0.05];
const LIMBS = [   // end, base radius, tip radius
  { end: [-1.55, 3.35, 0.25], r0: 0.15, r1: 0.08 },
  { end: [1.35, 3.45, -0.15], r0: 0.15, r1: 0.08 },
  { end: [0.15, 3.75, -0.35], r0: 0.14, r1: 0.08 },
];
const CLUMPS = [  // centre, radius, limb, colour
  { c: [-1.95, 3.95, 0.30], r: 1.25, limb: 0, col: '#3A8A58' },
  { c: [-0.65, 4.45, 0.05], r: 1.35, limb: 2, col: '#2F7A50' },
  { c: [0.90, 4.40, -0.30], r: 1.30, limb: 2, col: '#3F9058' },
  { c: [1.95, 3.95, 0.00], r: 1.15, limb: 1, col: '#347E52' },
  { c: [-1.05, 3.60, 1.00], r: 1.00, limb: 0, col: '#2C7049' },
  { c: [0.85, 3.70, 1.05], r: 1.05, limb: 1, col: '#378456' },
  { c: [0.05, 4.85, -0.85], r: 1.10, limb: 2, col: '#44965E' },
];
export const TREE_PARTS = 1 + LIMBS.length + CLUMPS.length;   // 11
export const TREE_HEIGHT = 5.9;

function buildMesh() {
  const P = [], N = [], V = [], C = [];
  let part = 0, piv = [0, 0, 0], col = [1, 1, 1];
  const tri = (a, b, c) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1; n = n.map((x) => x / l);
    for (const p of [a, b, c]) { P.push(...p); N.push(...n); V.push(...piv); C.push(...col, part); }
  };
  // a tapered hexagonal limb from a to b
  const limb = (a, b, r0, r1, R) => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d), w = d.map((x) => x / L);
    const t = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let e1 = [w[1] * t[2] - w[2] * t[1], w[2] * t[0] - w[0] * t[2], w[0] * t[1] - w[1] * t[0]];
    const l1 = Math.hypot(...e1); e1 = e1.map((x) => x / l1);
    const e2 = [w[1] * e1[2] - w[2] * e1[1], w[2] * e1[0] - w[0] * e1[2], w[0] * e1[1] - w[1] * e1[0]];
    const n = 6, ring = (c, r, tw) => Array.from({ length: n }, (_, i) => { const g = (i + tw) / n * 2 * Math.PI; return [0, 1, 2].map((k) => c[k] + (e1[k] * Math.cos(g) + e2[k] * Math.sin(g)) * r * (0.92 + 0.16 * R())); });
    const A = ring(a, r0, 0), B = ring(b, r1, 0.2);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(A[i], A[j], B[j]); tri(A[i], B[j], B[i]); }
    for (let i = 0; i < n; i++) tri(B[i], B[(i + 1) % n], b.map((x, k) => x + w[k] * r1 * 0.6));
  };
  // a faceted clump: an icosahedron split once, jittered, flattened a little
  const clump = (c, r, R) => {
    const t = (1 + Math.sqrt(5)) / 2;
    let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((p) => { const l = Math.hypot(...p); return p.map((x) => x / l); });
    let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const mid = new Map(), m = (a, b) => { const k = a < b ? a * 64 + b : b * 64 + a; if (!mid.has(k)) { const p = v[a].map((x, i) => (x + v[b][i]) / 2), l = Math.hypot(...p); v.push(p.map((x) => x / l)); mid.set(k, v.length - 1); } return mid.get(k); };
    const f2 = []; for (const [a, b, cc] of f) { const ab = m(a, b), bc = m(b, cc), ca = m(cc, a); f2.push([a, ab, ca], [b, bc, ab], [cc, ca, bc], [ab, bc, ca]); }
    const J = v.map(() => 0.9 + 0.2 * R());
    const q = v.map((p, i) => [c[0] + p[0] * r * J[i], c[1] + p[1] * r * 0.8 * J[i], c[2] + p[2] * r * J[i]]);
    for (const [a, b, cc] of f2) tri(q[a], q[b], q[cc]);
  };
  const R = rng(5903);
  part = 0; piv = [0, 0, 0]; col = hex('#5A3E3C');
  limb([0, 0, 0], [0.05, 1.05, 0.02], 0.27, 0.22, R); limb([0.05, 1.05, 0.02], FORK, 0.22, 0.18, R);
  LIMBS.forEach((L, i) => { part = 1 + i; piv = FORK; col = hex('#5A3E3C'); limb(FORK, L.end, L.r0, L.r1, R); });
  CLUMPS.forEach((K, i) => { part = 1 + LIMBS.length + i; piv = K.c; col = hex(K.col); clump(K.c, K.r, R); });
  return { P: new Float32Array(P), N: new Float32Array(N), V: new Float32Array(V), C: new Float32Array(C), n: P.length / 3 };
}

// growth { trunk, limbs: [3], clumps: [7] } (0..1, clumps may overshoot) -> uPart
export function treeParts(grow) {
  const out = new Float32Array(12 * 4), gT = grow.trunk;
  const F = FORK.map((x) => x * gT);
  out.set([0, 0, 0, gT], 0);
  LIMBS.forEach((L, i) => out.set([F[0], F[1], F[2], grow.limbs[i]], (1 + i) * 4));
  CLUMPS.forEach((K, i) => {
    const gl = grow.limbs[K.limb];
    out.set([F[0] + (K.c[0] - FORK[0]) * gl, F[1] + (K.c[1] - FORK[1]) * gl, F[2] + (K.c[2] - FORK[2]) * gl, grow.clumps[i]], (1 + LIMBS.length + i) * 4);
  });
  return out;
}

export function createTree(V) {
  const gl = V.gl, M = buildMesh();
  const prog = V.program(HDR + COMMON + TREE_VS, HDR + COMMON + LIGHT + TREE_FS, 'tree');
  const progSh = V.program(HDR + '#define SHADOW\n' + COMMON + TREE_VS, HDR + SHADOW_FS, 'treeSh');
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  [[M.P, 3], [M.N, 3], [M.V, 3], [M.C, 4]].forEach(([d, n], i) => {
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 0, 0);
  });
  gl.bindVertexArray(null);
  // st: { base: [x, y, z], yaw, parts: treeParts(), glow: Float32Array(12) }
  const drawWith = (p, ctx, P, st) => {
    ctx.setShared(p, ctx.B, P, ctx.S);
    gl.uniform4f(gl.getUniformLocation(p, 'uTreeBase'), st.base[0], st.base[1], st.base[2], st.yaw);
    gl.uniform4fv(gl.getUniformLocation(p, 'uPart[0]'), st.parts);
    const lg = gl.getUniformLocation(p, 'uPartGlow[0]'); if (lg) gl.uniform1fv(lg, st.glow);
    gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, M.n); gl.bindVertexArray(null);
  };
  return {
    n: M.n,
    draw: (glc, ctx, P, st) => drawWith(prog, ctx, P, st),
    drawShadow: (glc, ctx, P, st) => drawWith(progSh, ctx, P, st),
  };
}
