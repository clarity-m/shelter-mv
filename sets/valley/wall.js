// The wall of worlds (S15, S17): the valley is one tile among hundreds of parallel environments.
// Revision 11: tiles of five kinds (the valley, funnel craters, icy shores, salt flats, grid plains;
// sets/valley/worlds.js), the kind in the tile variant's bits 3+. Each kind is baked top-down twice
// with the valley renderer itself (grey, painted) into one texture array, then drawn
// as instanced slabs: a textured top that colours in from its own Clawd when the tile is solved,
// and cut-earth sides. Each tile has its own tiny orange Clawd (a marker never smaller than a
// few pixels) running its own episodes. Layout is recomputed every frame in JS, so S17 can bend
// the grid into the harness's cupped ribs.
import { HDR, COMMON } from './glsl.js';
import { PATH, pathAt, PATH_S } from './terrain.js';

export const TILE_C = [4, 40], TILE_HALF = 70;          // the valley tile in world metres
export const SPAWN_UV = [(0 - TILE_C[0]) / (2 * TILE_HALF) + 0.5, (0 - TILE_C[1]) / (2 * TILE_HALF) + 0.5];

const TILE_VS = `
layout(location=0) in vec3 aV;    // unit slab: top at y=0 (x,z in -0.5..0.5), sides down to y=-1
layout(location=1) in vec3 aN;
layout(location=2) in vec4 iA;    // x, y, z, yaw
layout(location=3) in vec4 iB;    // size, variant, reveal radius (uv), depth
layout(location=4) in vec4 iC;    // tint, spawn u, spawn v, appear 0..1
layout(location=5) in vec4 iD;    // bend: tilt about x, tilt about z, glow, hide top
out vec2 vUV; out vec3 vWP; flat out vec3 vN; flat out vec4 vB; flat out vec4 vC; flat out vec4 vD; flat out float vSide; flat out float vKind;
void main(){
  float app = iC.w;
  float s = iB.x;
  vec3 lp = vec3(aV.x*s, aV.y*iB.w, aV.z*s);
  // tilt (the ribs cup toward the viewer)
  float ca = cos(iD.x), sa = sin(iD.x), cb = cos(iD.y), sb = sin(iD.y);
  lp = vec3(lp.x, lp.y*ca - lp.z*sa, lp.y*sa + lp.z*ca);
  lp = vec3(lp.x*cb - lp.y*sb, lp.x*sb + lp.y*cb, lp.z);
  vec3 n = aN;
  n = vec3(n.x, n.y*ca - n.z*sa, n.y*sa + n.z*ca);
  n = vec3(n.x*cb - n.y*sb, n.x*sb + n.y*cb, n.z);
  float cy = cos(iA.w), sy = sin(iA.w);
  vec3 wp = iA.xyz + vec3(lp.x*cy + lp.z*sy, lp.y, -lp.x*sy + lp.z*cy);
  wp.y -= (1.0 - app)*(1.0 - app)*s*1.6;
  vN = vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy);
  vec2 uv = aV.xz + 0.5;
  int k = int(iB.y + 0.5);
  vKind = float(k >> 3); k &= 7;
  if ((k & 4) != 0) uv.x = 1.0 - uv.x;
  int r = k & 3;
  if (r == 1) uv = vec2(uv.y, 1.0 - uv.x); else if (r == 2) uv = vec2(1.0 - uv.x, 1.0 - uv.y); else if (r == 3) uv = vec2(1.0 - uv.y, uv.x);
  vUV = uv; vWP = wp; vB = iB; vC = iC; vD = iD; vSide = aV.y < -0.001 || aN.y < 0.5 ? 1.0 : 0.0;
  gl_Position = projectP(wp);
}`;
const TILE_FS = `
in vec2 vUV; in vec3 vWP; flat in vec3 vN; flat in vec4 vB; flat in vec4 vC; flat in vec4 vD; flat in float vSide; flat in float vKind;
uniform highp sampler2DArray uBakes;
uniform vec3 uKey; uniform float uFade;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
void main(){
  if (vC.w <= 0.001) discard;
  vec3 col;
  if (vSide > 0.5) {
    // cut earth: strata, darker with depth, lit by the key
    float y = -vWP.y / max(vB.w, 1.0);
    vec3 e = mix(vec3(0.62, 0.52, 0.46), vec3(0.36, 0.30, 0.36), smoothstep(0.0, 1.0, y));
    e *= 0.86 + 0.14*step(0.5, fract(y*6.0 + vC.x*3.0));
    float l = 0.7 + 0.4*max(dot(normalize(vN), uKey), 0.0);
    col = e*l;
    col = mix(col, vec3(0.70, 0.70, 0.72)*l, 1.0 - smoothstep(0.0, 0.6, vB.z));   // grey until solved
  } else {
    if (vD.w > 0.5) discard;
    vec3 g = texture(uBakes, vec3(vUV, 2.0*vKind)).rgb, p = texture(uBakes, vec3(vUV, 2.0*vKind + 1.0)).rgb;
    float d = length(vUV - vC.yz);
    float nz = vnoise(vUV*14.0 + vC.x*31.0)*0.06;
    float m = 1.0 - smoothstep(vB.z - 0.05, vB.z, d + nz);
    col = mix(g, p, m);
    float front = m*(1.0 - smoothstep(0.0, 0.05, vB.z - d - nz))*step(0.001, vB.z)*step(vB.z, 1.2);
    col += front*vec3(1.0, 0.78, 0.52)*0.35;
    col *= 1.0 + (vC.x - 0.5)*0.08;
    // a thin bright rim: the environment's walls
    vec2 e2 = min(vUV, 1.0 - vUV);
    col = mix(col, vec3(0.96, 0.93, 0.90), (1.0 - smoothstep(0.0, 0.012, min(e2.x, e2.y)))*0.55);
  }
  col *= 1.0 + vD.z;
  col = mix(col, vec3(0.035, 0.03, 0.09), uFade);
  oCol = vec4(col, 1.0);
  oAux = vec4(1.0, 0.99, 0.3, 0.0);
}`;
export function createWall(V, opts = {}) {
  const gl = V.gl, log = opts.log || (() => {});
  const t0 = performance.now();
  const prog = V.program(HDR + COMMON + TILE_VS, HDR + COMMON + TILE_FS, 'tile');
  const mprog = V.program(HDR + COMMON + `
layout(location=0) in vec4 aP;   // x, y, z, true width (m)
layout(location=1) in vec4 aQ;   // alpha, yaw, 0, 0
uniform float uMinPx, uResY;
out float vA;
void main(){
  vec4 cp = projectP(aP.xyz + vec3(0.0, aP.w*0.2, 0.0));
  gl_Position = cp;
  float px = uOrtho.x > 0.5 ? aP.w/uOrtho.z*0.5*uResY : aP.w*uFy/max(cp.w, 1e-3)*0.5*uResY;
  gl_PointSize = clamp(max(px, uMinPx), 1.0, 40.0)*3.0;
  vA = aQ.x;
}`, HDR + `
in float vA;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
void main(){
  if (vA <= 0.01) discard;
  vec2 q0 = gl_PointCoord*2.0 - 1.0;
  vec2 q = q0*3.0;
  float r = length(q0);
  float halo = exp(-r*r*7.0)*0.55*vA;
  bool glyph = max(abs(q.x), abs(q.y)) < 1.0;
  // the glyph's silhouette at speck size: a wide body, arms, legs
  bool body = abs(q.x) < 0.66 && q.y > -0.52 && q.y < 0.26;
  bool arms = abs(q.x) < 0.90 && q.y > -0.18 && q.y < 0.08;
  bool legs = (abs(abs(q.x) - 0.40) < 0.10 || abs(abs(q.x) - 0.18) < 0.07) && q.y >= 0.26 && q.y < 0.52;
  if (glyph && (body || arms || legs)) { oCol = vec4(vec3(0.851, 0.467, 0.341), vA); oAux = vec4(1.0, 0.99, 0.9, vA); return; }
  if (halo < 0.01) discard;
  oCol = vec4(vec3(1.0, 0.62, 0.40), halo);
  oAux = vec4(1.0, 0.99, 0.3, halo);
}`, 'mark');
  // --- the slab mesh (top quad + 4 sides)
  const V3 = [], N3 = [];
  const quad = (a, b, c, d, n) => { for (const p of [a, b, c, a, c, d]) { V3.push(...p); N3.push(...n); } };
  quad([-0.5, 0, -0.5], [0.5, 0, -0.5], [0.5, 0, 0.5], [-0.5, 0, 0.5], [0, 1, 0]);
  quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, -1, 0.5], [-0.5, -1, 0.5], [0, 0, 1]);
  quad([0.5, 0, -0.5], [-0.5, 0, -0.5], [-0.5, -1, -0.5], [0.5, -1, -0.5], [0, 0, -1]);
  quad([0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, -1, -0.5], [0.5, -1, 0.5], [1, 0, 0]);
  quad([-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, -1, 0.5], [-0.5, -1, -0.5], [-1, 0, 0]);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const mk = (data, loc, size, div) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, div ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); if (div) gl.vertexAttribDivisor(loc, 1); return b; };
  mk(new Float32Array(V3), 0, 3, 0); mk(new Float32Array(N3), 1, 3, 0);
  const MAXI = 1400;
  const iBufs = [2, 3, 4, 5].map((loc) => mk(new Float32Array(MAXI * 4), loc, 4, 1));
  const mvao = gl.createVertexArray(); gl.bindVertexArray(mvao);
  const mBufs = [mk(new Float32Array(MAXI * 4), 0, 4, 0), mk(new Float32Array(MAXI * 4), 1, 4, 0)];
  gl.bindVertexArray(null);
  const nVerts = V3.length / 3;

  // --- bakes: each kind's tile seen straight down, grey and painted (layers 2k, 2k + 1)
  const SZ = opts.bakeSize || 1024, KINDS = 5;
  const tBakes = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tBakes);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.floor(Math.log2(SZ)) + 1, gl.RGBA8, SZ, SZ, 2 * KINDS);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const bake = (kind, all) => {
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tBakes, 0, 2 * kind + all);
    V.render({
      cam: { pos: [TILE_C[0], 900, TILE_C[1]], fwd: [0, -1, 0], up: [0, 0, 1], ortho: [TILE_HALF, TILE_HALF] },
      learn: { all, spawn: [0, 0, 0, 1] }, tile: { c: TILE_C, half: TILE_HALF, dissolve: 1 }, void: 1, world: kind ? { a: kind } : null,
      clawd: { x: 0, z: 0, y: -50, hidden: true }, fogK: 0, cloudK: 0, rays: 0, grain: 0, vig: 0, glow: 0, grade: 0,
      shadow: { c: [TILE_C[0], 0, TILE_C[1]], r: TILE_HALF * 1.15 }, time: 3, key: [22, 38], exposure: 0.95,
    }, { w: SZ, h: SZ, fbo: f });
    gl.deleteFramebuffer(f);
  };
  for (let kind = 0; kind < KINDS; kind++) { bake(kind, 0); bake(kind, 1); }
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, tBakes); gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  log(`wall: ${2 * KINDS} bakes ${(performance.now() - t0).toFixed(0)} ms`);

  const iA = new Float32Array(MAXI * 4), iB = new Float32Array(MAXI * 4), iC = new Float32Array(MAXI * 4), iD = new Float32Array(MAXI * 4);
  const mP = new Float32Array(MAXI * 4), mQ = new Float32Array(MAXI * 4);
  // tiles: [{ x, y, z, yaw, size, variant, reveal, depth, tint, appear, tiltX, tiltZ, glow, hideTop, clawd: {x,y,z,w,a} }]
  function draw(tiles, ctx, fade = 0, minPx = 4) {
    const n = Math.min(MAXI, tiles.length);
    let nm = 0;
    for (let i = 0; i < n; i++) {
      const t = tiles[i], o = i * 4;
      const sp = t.spawnUV || SPAWN_UV;
      iA[o] = t.x; iA[o + 1] = t.y || 0; iA[o + 2] = t.z; iA[o + 3] = t.yaw || 0;
      iB[o] = t.size; iB[o + 1] = t.variant || 0; iB[o + 2] = t.reveal || 0; iB[o + 3] = t.depth || 24;
      iC[o] = t.tint || 0.5; iC[o + 1] = sp[0]; iC[o + 2] = sp[1]; iC[o + 3] = t.appear === undefined ? 1 : t.appear;
      iD[o] = t.tiltX || 0; iD[o + 1] = t.tiltZ || 0; iD[o + 2] = t.glow || 0; iD[o + 3] = t.hideTop ? 1 : 0;
      if (t.clawd && t.clawd.a > 0.01) { const c = t.clawd, q = nm * 4; mP[q] = c.x; mP[q + 1] = c.y; mP[q + 2] = c.z; mP[q + 3] = c.w; mQ[q] = c.a; nm++; }
    }
    [iA, iB, iC, iD].forEach((arr, k) => { gl.bindBuffer(gl.ARRAY_BUFFER, iBufs[k]); gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr.subarray(0, n * 4)); });
    const { B, S, setShared } = ctx;
    setShared(prog, B, ctx.P, S);
    V.u3f(prog, 'uKey', S.key); V.u1f(prog, 'uFade', fade);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D_ARRAY, tBakes); V.u1i(prog, 'uBakes', 2);
    gl.bindVertexArray(vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, nVerts, n);
    if (nm) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mBufs[0]); gl.bufferSubData(gl.ARRAY_BUFFER, 0, mP.subarray(0, nm * 4));
      gl.bindBuffer(gl.ARRAY_BUFFER, mBufs[1]); gl.bufferSubData(gl.ARRAY_BUFFER, 0, mQ.subarray(0, nm * 4));
      setShared(mprog, B, ctx.P, S);
      V.u1f(mprog, 'uMinPx', minPx * S.k); V.u1f(mprog, 'uResY', S.h);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.bindVertexArray(mvao); gl.drawArrays(gl.POINTS, 0, nm);
      gl.disable(gl.BLEND); gl.depthMask(true);
    }
    gl.bindVertexArray(null);
  }
  // a tile Clawd's position in tile uv after running d metres along the path
  function clawdUV(d) { const p = pathAt(d); return [(p.x - TILE_C[0]) / (2 * TILE_HALF) + 0.5, (p.z - TILE_C[1]) / (2 * TILE_HALF) + 0.5]; }
  return { draw, clawdUV, tBakes, pathLen: PATH_S[PATH_S.length - 1] };
}

// uv inside a tile -> world, given the tile's centre, size, yaw and variant (matches TILE_VS)
export function tileUVtoWorld(t, uv) {
  let [u, v] = uv;
  // invert the variant mapping: the shader maps slab (x,z) -> uv; find slab coords for this uv
  const k = t.variant || 0, r = k & 3;
  let a = u, b = v;
  if (r === 1) { a = 1 - v; b = u; } else if (r === 2) { a = 1 - u; b = 1 - v; } else if (r === 3) { a = v; b = 1 - u; }
  if (k & 4) a = 1 - a;
  const lx = (a - 0.5) * t.size, lz = (b - 0.5) * t.size;
  const cy = Math.cos(t.yaw || 0), sy = Math.sin(t.yaw || 0);
  return [t.x + lx * cy + lz * sy, (t.y || 0), t.z - lx * sy + lz * cy];
}
