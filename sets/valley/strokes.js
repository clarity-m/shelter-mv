// Brush strokes painted into the valley (S18, revision 3). A stroke is a world-space ribbon along
// a smooth path on the ground; each frame the ribbons are drawn on the GPU into two world-space
// maps (near: fine, around Clawd; far: coarse, the whole world), which the terrain, prop and water
// shaders sample (glsl.js: strokeA / strokeB). Pure function of the frame: every stroke's tip,
// the time the brush passed each point, and so the paint's age, follow from the frame number.
//
// Map A: (tint, cos 2θ, sin 2θ, coverage), premultiplied. θ is the stroke direction in xz.
// Map B: (relax, fresh, log width, coverage), premultiplied. relax: the facets under the paint have
//        melted into smooth forms (0..1, a few frames behind the brush); fresh: wet paint glow.
// Coverage is a soft ramp across the band edge; the terrain shader thresholds it with
// world-anchored bristle streaks, so edges stay crisp at any distance.

const MAXS = 64;

// ---------------------------------------------------------------- geometry of one stroke
// Catmull-Rom (centripetal) through the control points, resampled by arc length.
function spline(pts, perSeg = 24) {
  const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-4, 0.5);
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    for (let k = 0; k < perSeg; k++) {
      const t = t1 + (t2 - t1) * k / perSeg;
      const L = (a, b, ta, tb) => [0, 1].map((j) => (tb - t) / (tb - ta) * a[j] + (t - ta) / (tb - ta) * b[j]);
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}
function resampleArc(poly, ds) {
  const S = [0];
  for (let i = 1; i < poly.length; i++) S.push(S[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const L = S[S.length - 1], n = Math.max(2, Math.ceil(L / ds) + 1), out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = L * k / (n - 1);
    while (j < poly.length - 2 && S[j + 1] < s) j++;
    const a = (s - S[j]) / Math.max(S[j + 1] - S[j], 1e-9);
    out.push({ x: poly[j][0] + (poly[j + 1][0] - poly[j][0]) * a, z: poly[j][1] + (poly[j + 1][1] - poly[j][1]) * a, s });
  }
  return { pts: out, L };
}
// a stroke's path, sampled: { pts: [{x, z, s, tx, tz}], L }
export function strokePath(st) {
  if (st._path) return st._path;
  const poly = spline(st.pts);
  let L0 = 0; for (let i = 1; i < poly.length; i++) L0 += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
  const r = resampleArc(poly, Math.max(0.25, Math.min(st.w * 0.35, L0 / 160)));
  const P = r.pts;
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    P[i].tx = (b.x - a.x) / l; P[i].tz = (b.z - a.z) / l;
  }
  st._path = r;
  return r;
}
// position and tangent at arc length s (clamped)
export function pathAt(st, s) {
  const { pts, L } = strokePath(st);
  const x = Math.max(0, Math.min(L, s)) / L * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(x)), a = x - i, p = pts[i], q = pts[i + 1];
  return { x: p.x + (q.x - p.x) * a, z: p.z + (q.z - p.z) * a, tx: p.tx + (q.tx - p.tx) * a, tz: p.tz + (q.tz - p.tz) * a };
}
// the brush's easing along the stroke, and its inverse (the GLSL uses the same pair)
export const strokeEase = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : 0.5 - 0.5 * Math.cos(Math.PI * u));
// tip arc length at frame t (local frames)
export function tipAt(st, t) {
  const { L } = strokePath(st);
  return L * strokeEase((t - st.t0) / st.dur);
}
// half width along the stroke: a loaded start, a slow wobble, a dry tapering tail
function widthAt(st, s, L) {
  const u = s / L;
  const seed = st.seed || 0;
  const wob = 1 + 0.07 * Math.sin(u * 7.3 + seed * 3.1) + 0.04 * Math.sin(u * 17.1 + seed * 1.7);
  const load = 1 + 0.08 * Math.exp(-Math.pow((u - 0.06) / 0.08, 2));
  const tail = 1 - (st.taper === undefined ? 0.42 : st.taper) * Math.pow(Math.max(0, (u - 0.62) / 0.38), 1.6);
  return st.w * wob * load * tail;
}

// ---------------------------------------------------------------- GL
const VS = `#version 300 es
layout(location=0) in vec4 aA;   // x, z, s (m along), t (m across, signed)
layout(location=1) in vec4 aB;   // w (nominal half width), stroke index, tangent x, z
uniform vec4 uMap;               // centre x, z, half size
uniform vec4 uProg[${MAXS}];     // tip (m), length (m), t0, dur (frames)
uniform vec4 uInfo[${MAXS}];     // tint, seed, dryness, alpha
out vec2 vST; out float vW; out vec2 vDir;
flat out vec4 vP; flat out vec4 vI;
void main(){
  int i = int(aB.y + 0.5);
  vST = aA.zw; vW = aB.x; vDir = aB.zw; vP = uProg[i]; vI = uInfo[i];
  vec2 q = (aA.xy - uMap.xy)/uMap.z;
  gl_Position = vP.x > 0.0 ? vec4(q, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
}`;
const FS = `#version 300 es
precision highp float;
in vec2 vST; in float vW; in vec2 vDir;
flat in vec4 vP; flat in vec4 vI;
uniform float uNow;
layout(location=0) out vec4 oA;
layout(location=1) out vec4 oB;
uint hashu(uint x){ x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }
float hash21(ivec2 p){ return float(hashu(uint(p.x)*0x8da6b343u ^ hashu(uint(p.y)*0xd8163841u + 0x9e3779b9u)) >> 8u) * (1.0/16777216.0); }
float vnoise(vec2 p){ vec2 i = floor(p), f = p - i; ivec2 ii = ivec2(i); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash21(ii),hash21(ii+ivec2(1,0)),u.x), mix(hash21(ii+ivec2(0,1)),hash21(ii+ivec2(1,1)),u.x), u.y); }
void main(){
  float s = vST.x, t = vST.y, w = max(vW, 1e-3);
  float tip = vP.x, L = vP.y, seed = vI.y;
  // distance to the painted part of the centre line [0, tip]: round start, round wet head
  float ds = s < 0.0 ? s : (s > tip ? s - tip : 0.0);
  float r = length(vec2(ds, t))/w;
  // the band edge wanders slowly along the stroke (the brush is not a ruler)
  float nb = vnoise(vec2(s/(w*2.2) + seed*17.0, 3.7 + seed)) - 0.5;
  float nb2 = vnoise(vec2(s/(w*0.7) + seed*5.0, 9.1 + sign(t)*4.0)) - 0.5;
  float edge = 1.0 + 0.16*nb + 0.07*nb2;
  float a = 1.0 - smoothstep(edge - 0.6, edge + 0.6, r);   // a long soft ramp: the edge sits at 0.5
  // dry brush toward the end of the path: the paint thins into bristle streaks
  float u = clamp(s/max(L, 1e-3), 0.0, 1.0);
  float dry = vI.z*smoothstep(0.62, 1.0, u);
  float streak = vnoise(vec2(s/(w*2.6) + seed*3.0, t/w*4.2 + seed*11.0));
  a *= 1.0 - dry*(1.0 - smoothstep(0.30 + 0.4*(1.0 - dry), 0.62 + 0.3*(1.0 - dry), streak));
  a *= vI.w;
  if (a < 0.003) discard;
  // age: frames since the brush passed this point (inverse of the cosine ease)
  float tpass = vP.z + vP.w*acos(clamp(1.0 - 2.0*u, -1.0, 1.0))/3.14159265;
  float age = uNow - tpass;
  float relax = smoothstep(1.0, 16.0, age);
  float fresh = exp(-max(age, 0.0)/2.5)*smoothstep(-2.0, 0.0, age);
  vec2 d = normalize(vDir + 1e-6);
  vec2 d2 = vec2(d.x*d.x - d.y*d.y, 2.0*d.x*d.y)*0.5 + 0.5;
  float lw = clamp(log2(w/0.25)/14.0, 0.0, 1.0);    // the brush's local half width, for its marks
  oA = vec4(vec3(vI.x, d2)*a, a);
  oB = vec4(vec3(relax, fresh, lw)*a, a);
}`;

// opts: { near: { c: [x, z], half, res }, far: { c, half, res } }
export function createStrokeMaps(V, strokes, opts = {}) {
  const gl = V.gl;
  if (strokes.length > MAXS) throw new Error(`too many strokes: ${strokes.length} > ${MAXS}`);
  const prog = V.program(VS, FS, 'strokes');
  const maps = [Object.assign({ c: [0, 100], half: 128, res: 1024 }, opts.near), Object.assign({ c: [0, 800], half: 4200, res: 1024 }, opts.far)];
  for (const m of maps) {
    const mk = () => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      const lv = Math.floor(Math.log2(m.res)) + 1;
      gl.texStorage2D(gl.TEXTURE_2D, lv, gl.RGBA8, m.res, m.res);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    m.tA = mk(); m.tB = mk();
    m.fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, m.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, m.tA, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, m.tB, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('stroke fbo incomplete');
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // ribbons: two triangles per step, extended past both ends for the round caps
  const A = [], Bv = [];
  strokes.forEach((st, i) => {
    const { pts, L } = strokePath(st);
    const ext = 1.75;
    const P = pts.map((p) => ({ ...p, w: widthAt(st, p.s, L) }));
    const f = P[0], l = P[P.length - 1];
    P.unshift({ x: f.x - f.tx * f.w * ext, z: f.z - f.tz * f.w * ext, s: -f.w * ext, tx: f.tx, tz: f.tz, w: f.w });
    P.push({ x: l.x + l.tx * l.w * ext, z: l.z + l.tz * l.w * ext, s: L + l.w * ext, tx: l.tx, tz: l.tz, w: l.w });
    const vert = (p, side) => {
      const h = p.w * ext * side;
      A.push(p.x - p.tz * h, p.z + p.tx * h, p.s, h); Bv.push(p.w, i, p.tx, p.tz);
    };
    for (let k = 0; k < P.length - 1; k++) {
      const p = P[k], q = P[k + 1];
      vert(p, -1); vert(p, 1); vert(q, 1);
      vert(p, -1); vert(q, 1); vert(q, -1);
    }
  });
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const b0 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b0); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(A), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
  const b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Bv), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const nVerts = A.length / 4;
  const prg = new Float32Array(MAXS * 4), inf = new Float32Array(MAXS * 4);

  // draw every stroke as it stands at local frame t into both maps; returns the P.strokes block
  function render(t) {
    let any = false;
    strokes.forEach((st, i) => {
      const { L } = strokePath(st);
      const tip = tipAt(st, t);
      prg.set([tip, L, st.t0, st.dur], i * 4);
      inf.set([st.tint === undefined ? 0.5 : st.tint, st.seed || i * 0.37, st.dry === undefined ? 0.8 : st.dry, st.alpha === undefined ? 1 : st.alpha], i * 4);
      if (tip > 0) any = true;
    });
    gl.useProgram(prog);
    const Lp = (n) => gl.getUniformLocation(prog, n);
    gl.uniform4fv(Lp('uProg[0]'), prg); gl.uniform4fv(Lp('uInfo[0]'), inf); gl.uniform1f(Lp('uNow'), t);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(vao);
    for (const m of maps) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, m.fbo); gl.viewport(0, 0, m.res, m.res);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (any) { gl.uniform4f(Lp('uMap'), m.c[0], m.c[1], m.half, 0); gl.drawArrays(gl.TRIANGLES, 0, nVerts); }
    }
    gl.bindVertexArray(null);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0 + 11);   // a scratch unit: the valley binds its own units per pass
    for (const m of maps) for (const tx of [m.tA, m.tB]) { gl.bindTexture(gl.TEXTURE_2D, tx); gl.generateMipmap(gl.TEXTURE_2D); }
    gl.bindTexture(gl.TEXTURE_2D, null); gl.activeTexture(gl.TEXTURE0);
    return { on: any ? 1 : 0, near: maps[0], far: maps[1] };
  }
  return { render, maps, strokes };
}
