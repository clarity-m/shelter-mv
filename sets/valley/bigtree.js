// Revision 15: Clawd's first original creation, the tree of the final scene, in the valley engine.
// The shape is S31's own tree (sets/hill/scene.js TREE_TRUNK, TREE_CANOPY and treeGrow: the trunk
// rises, three limbs reach out, eleven clumps bloom), at the valley's scale (1.5 m per hill unit), so
// it is the same tree the figure sits under in S31. It is smooth, not low-poly: round tapered limbs and
// round clumps, a deep teal-green canopy that glitters with gold specks (world-anchored, so they
// don't boil), lit, shadowed and fogged by the valley's own shader code.
// It is drawn in light first (treeLines: its outline as lines of light, for sets/fields/lightlines.js),
// then filled: the solid paints in stipple by stipple (fill 0..1), a warm edge at the paint front.
// Drawn through P.extra / P.extraShadow; a pure function of the state it is given.
import { HDR, COMMON, LIGHT, SHADOW_FS } from './glsl.js';
import { TREE_TRUNK, TREE_CANOPY, treeGrow } from '../hill/scene.js';

export const TREE_M = 1.5;                         // valley metres per hill unit (Clawd is 0.9 units wide)

const VS = `
layout(location=0) in vec3 aP;    // world position
layout(location=1) in vec3 aN;    // world normal
layout(location=2) in vec4 aL;    // tree-local position (hill units), part (0 wood, 1 canopy)
out vec3 vWP; out vec3 vN; out vec4 vL;
void main(){
  vWP = aP; vN = aN; vL = aL;
#ifdef SHADOW
  gl_Position = projectL(aP);
#else
  gl_Position = projectP(aP);
#endif
}`;
const FS = `
in vec3 vWP; in vec3 vN; in vec4 vL;
uniform vec4 uBT;                 // fill 0..1, his light in it, time, 0
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
float h31(vec3 p){ p = fract(p*0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y)*p.z); }
void main(){
  vec3 p = vWP, n = normalize(vN);
  // the fill: stipples of paint (a few centimetres each) arrive in a random order, a warm rim at the front
  float st = h31(floor(vL.xyz*26.0) + 17.0);
  if (st > uBT.x) discard;
  float front = (1.0 - smoothstep(0.0, 0.12, uBT.x - st))*(1.0 - smoothstep(1.02, 1.15, uBT.x));
  vec3 rd = normalize(p - uCam); float tF = length(p - uCam);
  bool leaf = vL.w > 0.5;
  vec3 alb = leaf ? lin(vec3(0.22, 0.42, 0.38)) : lin(vec3(0.36, 0.27, 0.25));
  float sh = shadowAt(p, n)*cloudShade(p);
  vec3 col = lightSurf(p, n, alb, 1.0, sh);
  // the dusk sky's fill (the tree is backlit here): a soft violet-teal light from above and the lens side
  col += alb*mix(vec3(0.30, 0.34, 0.40), vec3(0.52, 0.46, 0.62), 0.5 + 0.5*n.y)*(0.75 + 0.35*max(dot(n, -rd), 0.0));
  col += pow(1.0 - max(dot(-rd, n), 0.0), 3.0)*vec3(1.0, 0.86, 0.70)*0.42*alb;       // a soft rim
  if (leaf) {
    // gold glitter: sparse specks in cells of the tree's own space, each twinkling at its own pace
    vec3 q = vL.xyz*15.0, c = floor(q), f = fract(q);
    float hc = h31(c);
    if (hc > 0.64) {
      vec3 at = 0.2 + 0.6*vec3(h31(c + 1.7), h31(c + 3.1), h31(c + 5.3));
      float s = 1.0 - smoothstep(0.0, 0.22, length(f - at));
      float tw = 0.35 + 0.65*pow(0.5 + 0.5*sin(uBT.z*4.0 + hc*61.0), 3.0);
      col += s*tw*vec3(1.0, 0.86, 0.55)*(3.2 + 1.6*max(dot(n, uSun), 0.0));
    }
  }
  col += uBT.y*(alb*1.4 + vec3(0.10, 0.05, 0.02))*vec3(1.0, 0.72, 0.45);             // his light in it
  col += front*vec3(1.0, 0.72, 0.42)*0.9;                                          // the paint's front
  col = fogIt(col, p, rd, tF, 1.0);
  oCol = finishCol(col);
  oAux = vec4(1.0, tF/(tF + 60.0), 1.0, 0.0);
}`;

// ---------------------------------------------------------------- the mesh (rebuilt per state)
const RING = 14, SPH = [18, 12];
function build(G, base, yaw) {
  const P = [], N = [], L = [];
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const W = (v) => [base[0] + TREE_M * (cy * v[0] + sy * v[2]), base[1] + TREE_M * v[1], base[2] + TREE_M * (-sy * v[0] + cy * v[2])];
  const Wn = (v) => [cy * v[0] + sy * v[2], v[1], -sy * v[0] + cy * v[2]];
  const push = (p, n, part) => { const w = W(p), m = Wn(n); P.push(...w); N.push(...m); L.push(p[0], p[1], p[2], part); };
  const tri = (a, b, c, part) => { push(a[0], a[1], part); push(b[0], b[1], part); push(c[0], c[1], part); };
  // a tapered limb from a (radius r1) to b (r2), with a round joint at b
  const limb = (a, b, r1, r2) => {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...d) || 1, w = d.map((x) => x / l);
    const t = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let e1 = [w[1] * t[2] - w[2] * t[1], w[2] * t[0] - w[0] * t[2], w[0] * t[1] - w[1] * t[0]];
    const l1 = Math.hypot(...e1); e1 = e1.map((x) => x / l1);
    const e2 = [w[1] * e1[2] - w[2] * e1[1], w[2] * e1[0] - w[0] * e1[2], w[0] * e1[1] - w[1] * e1[0]];
    const ring = (c, r, k) => { const g = k / RING * 2 * Math.PI, n = [0, 1, 2].map((j) => e1[j] * Math.cos(g) + e2[j] * Math.sin(g)); return [[0, 1, 2].map((j) => c[j] + n[j] * r), n]; };
    for (let k = 0; k < RING; k++) {
      const A0 = ring(a, r1, k), A1 = ring(a, r1, k + 1), B0 = ring(b, r2, k), B1 = ring(b, r2, k + 1);
      tri(A0, A1, B1, 0); tri(A0, B1, B0, 0);
    }
    sphere(b, r2, 0, 8, 6);
  };
  const sphere = (c, r, part, nu = SPH[0], nv = SPH[1]) => {
    const pt = (i, j) => { const u = i / nu * 2 * Math.PI, v = j / nv * Math.PI; const n = [Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)]; return [[c[0] + n[0] * r, c[1] + n[1] * r * 0.9, c[2] + n[2] * r], n]; };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = pt(i, j), b = pt(i + 1, j), cc = pt(i + 1, j + 1), d = pt(i, j + 1);
      tri(a, b, cc, part); tri(a, cc, d, part);
    }
  };
  for (let i = 0; i < 4; i++) {
    const r1 = G.trA[i * 4 + 3], r2 = G.trB[i * 4 + 3];
    if (r1 <= 1e-4) continue;
    limb([G.trA[i * 4], G.trA[i * 4 + 1], G.trA[i * 4 + 2]], [G.trB[i * 4], G.trB[i * 4 + 1], G.trB[i * 4 + 2]], r1, r2);
  }
  for (let i = 0; i < TREE_CANOPY.length; i++) {
    const r = G.can[i * 4 + 3];
    if (r <= 0.005) continue;
    sphere([G.can[i * 4], G.can[i * 4 + 1], G.can[i * 4 + 2]], r, 1);
  }
  return { P: new Float32Array(P), N: new Float32Array(N), L: new Float32Array(L), n: P.length / 3 };
}

// The tree drawn in light: the limbs' two edges (as the lens sees them) and each clump's outline
// circle facing the lens, at growth g. Appends [ax, ay, az, bx, by, bz, width, heat, alpha] segments.
export function treeLines(out, n, g, base, yaw, cam, width, alpha) {
  const G = treeGrow(g), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const W = (v) => [base[0] + TREE_M * (cy * v[0] + sy * v[2]), base[1] + TREE_M * v[1], base[2] + TREE_M * (-sy * v[0] + cy * v[2])];
  const seg = (a, b, heat) => { if (n * 9 + 9 > out.length) return; out.set([a[0], a[1], a[2], b[0], b[1], b[2], width, heat, alpha], n * 9); n++; };
  for (let i = 0; i < 4; i++) {
    const r1 = G.trA[i * 4 + 3] * TREE_M, r2 = G.trB[i * 4 + 3] * TREE_M;
    if (r1 <= 1e-4) continue;
    const a = W([G.trA[i * 4], G.trA[i * 4 + 1], G.trA[i * 4 + 2]]), b = W([G.trB[i * 4], G.trB[i * 4 + 1], G.trB[i * 4 + 2]]);
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [a[0] - cam[0], a[1] - cam[1], a[2] - cam[2]];
    let s = [d[1] * v[2] - d[2] * v[1], d[2] * v[0] - d[0] * v[2], d[0] * v[1] - d[1] * v[0]];
    const ls = Math.hypot(...s) || 1; s = s.map((x) => x / ls);
    for (const sg of [-1, 1]) seg(a.map((x, j) => x + sg * s[j] * r1), b.map((x, j) => x + sg * s[j] * r2), 0.9);
  }
  for (let i = 0; i < TREE_CANOPY.length; i++) {
    const r = G.can[i * 4 + 3] * TREE_M;
    if (r <= 0.01) continue;
    const c = W([G.can[i * 4], G.can[i * 4 + 1], G.can[i * 4 + 2]]);
    const v = [c[0] - cam[0], c[1] - cam[1], c[2] - cam[2]], lv = Math.hypot(...v) || 1, f = v.map((x) => x / lv);
    const t = Math.abs(f[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let e1 = [f[1] * t[2] - f[2] * t[1], f[2] * t[0] - f[0] * t[2], f[0] * t[1] - f[1] * t[0]];
    const l1 = Math.hypot(...e1); e1 = e1.map((x) => x / l1);
    const e2 = [f[1] * e1[2] - f[2] * e1[1], f[2] * e1[0] - f[0] * e1[2], f[0] * e1[1] - f[1] * e1[0]];
    const K = 20, pt = (k) => { const u = k / K * 2 * Math.PI; return [0, 1, 2].map((j) => c[j] + (e1[j] * Math.cos(u) + e2[j] * Math.sin(u) * 0.9) * r); };
    for (let k = 0; k < K; k++) seg(pt(k), pt(k + 1), 0.7);
  }
  return n;
}

export function createBigTree(V) {
  const gl = V.gl;
  const prog = V.program(HDR + COMMON + VS, HDR + COMMON + LIGHT + FS, 'bigtree');
  const progSh = V.program(HDR + '#define SHADOW\n' + COMMON + VS, HDR + SHADOW_FS, 'bigtreeSh');
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const bufs = [3, 3, 4].map((sz, i) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, sz, gl.FLOAT, false, 0, 0); return b; });
  gl.bindVertexArray(null);
  let key = null, M = null;
  // st: { base: [x, y, z], yaw, g (growth 0..1), fill (0..1), glow, time }
  const mesh = (st) => {
    const k = `${st.g.toFixed(4)}|${st.base.map((v) => v.toFixed(3)).join(',')}|${st.yaw.toFixed(4)}`;
    if (k !== key) {
      M = build(treeGrow(st.g), st.base, st.yaw); key = k;
      [M.P, M.N, M.L].forEach((d, i) => { gl.bindBuffer(gl.ARRAY_BUFFER, bufs[i]); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW); });
    }
    return M;
  };
  const drawWith = (p, ctx, P, st) => {
    if (!(st.g > 0) || !(st.fill > 0)) return;
    const m = mesh(st);
    if (!m.n) return;
    ctx.setShared(p, ctx.B, P, ctx.S);
    const lu = gl.getUniformLocation(p, 'uBT'); if (lu) gl.uniform4f(lu, 1.15 * st.fill, st.glow || 0, st.time || 0, 0);
    gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, m.n); gl.bindVertexArray(null);
  };
  return {
    draw: (glc, ctx, P, st) => drawWith(prog, ctx, P, st),
    drawShadow: (glc, ctx, P, st) => drawWith(progSh, ctx, P, st),
  };
}
