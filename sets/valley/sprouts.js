// S18 (revision 13): the small things Clawd makes with the cursor in his first edits: a pebble, a
// puddle and a sapling. One low-poly mesh of six parts, drawn with the tree's shader (tree.js) through
// the valley's P.extra / P.extraShadow hooks, so they are lit, shadowed, painted and fogged like the
// valley. Each part is placed by its pivot in world metres and scaled about it (0 = not there yet).
import { HDR, COMMON, LIGHT, SHADOW_FS } from './glsl.js';
import { TREE_VS, TREE_FS } from './tree.js';
import { rng } from '../../lib/util.js';

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
// parts: 0 pebble, 1 puddle, 2 the sapling's trunk, 3-5 its clumps (local metres about the base)
export const SAPLING = { top: [0.03, 1.02, 0.0], clumps: [[-0.21, 1.12, 0.05, 0.31], [0.22, 1.17, -0.04, 0.29], [0.0, 1.4, 0.03, 0.3]] };

function buildMesh() {
  const P = [], N = [], V = [], C = [];
  let part = 0, piv = [0, 0, 0], col = [1, 1, 1];
  const tri = (a, b, c) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...n) || 1; n = n.map((x) => x / l);
    if (n[1] < -0.2 && part === 1) n = n.map((x) => -x);
    for (const p of [a, b, c]) { P.push(...p); N.push(...n); V.push(...piv); C.push(...col, part); }
  };
  const limb = (a, b, r0, r1, R) => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d), w = d.map((x) => x / L);
    const t = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let e1 = [w[1] * t[2] - w[2] * t[1], w[2] * t[0] - w[0] * t[2], w[0] * t[1] - w[1] * t[0]];
    const l1 = Math.hypot(...e1); e1 = e1.map((x) => x / l1);
    const e2 = [w[1] * e1[2] - w[2] * e1[1], w[2] * e1[0] - w[0] * e1[2], w[0] * e1[1] - w[1] * e1[0]];
    const n = 5, ring = (c, r, tw) => Array.from({ length: n }, (_, i) => { const g = (i + tw) / n * 2 * Math.PI; return [0, 1, 2].map((k) => c[k] + (e1[k] * Math.cos(g) + e2[k] * Math.sin(g)) * r * (0.92 + 0.16 * R())); });
    const A = ring(a, r0, 0), B = ring(b, r1, 0.2);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(A[i], A[j], B[j]); tri(A[i], B[j], B[i]); }
    for (let i = 0; i < n; i++) tri(B[i], B[(i + 1) % n], b.map((x, k) => x + w[k] * r1 * 0.6));
  };
  // an icosahedron split sub times, jittered, squashed in y
  const blob = (c, r, sy, sub, jit, R) => {
    const t = (1 + Math.sqrt(5)) / 2;
    let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((p) => { const l = Math.hypot(...p); return p.map((x) => x / l); });
    let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < sub; s++) {
      const mid = new Map(), m = (a, b) => { const k = a < b ? a * 4096 + b : b * 4096 + a; if (!mid.has(k)) { const p = v[a].map((x, i) => (x + v[b][i]) / 2), l = Math.hypot(...p); v.push(p.map((x) => x / l)); mid.set(k, v.length - 1); } return mid.get(k); };
      const f2 = []; for (const [a, b, cc] of f) { const ab = m(a, b), bc = m(b, cc), ca = m(cc, a); f2.push([a, ab, ca], [b, bc, ab], [cc, ca, bc], [ab, bc, ca]); }
      f = f2;
    }
    const J = v.map(() => 1 - jit / 2 + jit * R());
    const q = v.map((p, i) => [c[0] + p[0] * r * J[i], c[1] + p[1] * r * sy * J[i], c[2] + p[2] * r * J[i]]);
    for (const [a, b, cc] of f) tri(q[a], q[b], q[cc]);
  };
  const R = rng(4417);
  // the pebble: a grey faceted stone, a little buried
  part = 0; piv = [0, 0, 0]; col = hex('#8E8A86'); blob([0, 0.09, 0], 0.34, 0.62, 0, 0.35, R);
  // the puddle: a flat disc of still water, lighter at the rim (a flattened blob, its underside hidden)
  part = 1; piv = [0, 0, 0]; col = hex('#4F7F9E');
  { const n = 9, rim = Array.from({ length: n }, (_, i) => { const g = i / n * 2 * Math.PI, r = 0.8 * (0.85 + 0.3 * R()); return [Math.cos(g) * r * 1.25, 0.03, Math.sin(g) * r]; });
    for (let i = 0; i < n; i++) tri([0, 0.035, 0], rim[(i + 1) % n], rim[i]); }
  // the sapling: a thin trunk and three small clumps
  part = 2; piv = [0, 0, 0]; col = hex('#6A4A3E'); limb([0, -0.05, 0], SAPLING.top, 0.07, 0.04, R);
  SAPLING.clumps.forEach((K, i) => { part = 3 + i; piv = [K[0], K[1], K[2]]; col = hex(['#4E9A5C', '#5FAa62', '#44905A'][i]); blob([K[0], K[1], K[2]], K[3], 0.85, 1, 0.25, R); });
  return { P: new Float32Array(P), N: new Float32Array(N), V: new Float32Array(V), C: new Float32Array(C), n: P.length / 3 };
}

export function createSprouts(V) {
  const gl = V.gl, M = buildMesh();
  const prog = V.program(HDR + COMMON + TREE_VS, HDR + COMMON + LIGHT + TREE_FS, 'sprouts');
  const progSh = V.program(HDR + '#define SHADOW\n' + COMMON + TREE_VS, HDR + SHADOW_FS, 'sproutsSh');
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  [[M.P, 3], [M.N, 3], [M.V, 3], [M.C, 4]].forEach(([d, n], i) => {
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 0, 0);
  });
  gl.bindVertexArray(null);
  // st: { parts: Float32Array(48) (pivot xyz in world metres, scale), glow: Float32Array(12) }
  const drawWith = (p, ctx, P, st) => {
    ctx.setShared(p, ctx.B, P, ctx.S);
    gl.uniform4f(gl.getUniformLocation(p, 'uTreeBase'), 0, 0, 0, 0);
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
