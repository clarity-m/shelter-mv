// The valley renderer (rung 3, low-poly 3D). createValley(canvas, opts) builds the meshes once
// and returns { render(P), ... }; render is a pure function of P (no state carried between frames).
//
// Passes per frame: shadow map (the terrain animates, so it is redrawn), mirrored scene for the
// river at half res, main scene with 4x MSAA (colour + aux: learned mask, depth, material),
// bloom, sun rays and the final grade. Clawd is a crisp solid: lit, never painted or grained.
import { HDR, COMMON, LIGHT, TERRAIN_VS, TERRAIN_FS, WATER_VS, WATER_FS, PROP_VS, PROP_FS, CLAWD_VS, CLAWD_FS, FULL_VS, SKY_FS, SHADOW_FS } from './glsl.js';
import { BRIGHT_FS, BLUR_FS, RAYS_FS, FINAL_FS } from './post.js';
import { buildTerrain, heightIndex, buildWater, buildProps, WATER, CLAWD_S, PATH, PATH_S, hq } from './terrain.js';
import { buildClawd, NEUTRAL } from './clawd3d.js';

export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
export const dirAE = (azDeg, elDeg) => { const a = azDeg * Math.PI / 180, e = elDeg * Math.PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; };

// display sRGB hex -> the linear value that lands there after ACES(0.95 x) and gamma 2.2
function invDisp(hex, s = 1) {
  return [1, 3, 5].map((i) => {
    const d = parseInt(hex.slice(i, i + 2), 16) / 255, a = Math.min(0.97, Math.pow(d, 2.2));
    const A = 2.51 - 2.43 * a, B = 0.03 - 0.59 * a, C = -0.14 * a;
    return s * (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) / 0.95;
  });
}
// sky palettes (linear, pre-tonemap): 0 = golden hour (02b), 1 = the rung-4 dusk (sets/hill PAL4)
export const SKY_GOLD = { hor: [0.90, 0.54, 0.30], low: [0.80, 0.40, 0.44], mid: [0.30, 0.23, 0.58], zen: [0.10, 0.11, 0.40] };
export const SKY_DUSK = { hor: invDisp('#FFD6B0', 0.95), low: invDisp('#F7B69E', 0.9), mid: invDisp('#D398C2', 0.85), zen: invDisp('#6A6CC2', 0.95) };
const mixA = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export function camBasis(cam, W, H) {
  const fwd = cam.fwd ? v3.norm(cam.fwd) : v3.norm(v3.sub(cam.look, cam.pos));
  let right = v3.cross(cam.up || [0, 1, 0], fwd);
  if (Math.hypot(...right) < 1e-6) right = [1, 0, 0];
  right = v3.norm(right);
  if (cam.roll) { const up0 = v3.cross(fwd, right), c = Math.cos(cam.roll), s = Math.sin(cam.roll); right = v3.norm(v3.add(v3.mul(right, c), v3.mul(up0, s))); }
  const up = v3.cross(fwd, right);
  const fy = 1 / Math.tan((cam.fovy || 36) * Math.PI / 360);
  return { pos: cam.pos, fwd, right, up, fy, aspect: W / H, pp: cam.pp || [0, 0], Fpx: fy * H / 2, ortho: cam.ortho || null, W, H };
}
export function projectPx(B, p) {   // world -> [x, y (down), depth] in target pixels
  const d = v3.sub(p, B.pos), zc = v3.dot(d, B.fwd);
  if (B.ortho) return [B.W / 2 * (1 + v3.dot(d, B.right) / B.ortho[0]), B.H / 2 * (1 - v3.dot(d, B.up) / B.ortho[1]), zc];
  const nx = v3.dot(d, B.right) * B.fy / (B.aspect * zc) + B.pp[0], ny = v3.dot(d, B.up) * B.fy / zc + B.pp[1];
  return [B.W / 2 * (1 + nx), B.H / 2 * (1 - ny), zc];
}

export function createValley(canvas, opts = {}) {
  const log = opts.log || (() => {});
  const t0 = performance.now();
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) throw new Error('no webgl2');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('no float colour buffers');
  gl.getExtension('OES_texture_float_linear');

  // ---------------------------------------------------------------- programs
  const compile = (type, src, name) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(s); const m = /0:(\d+)/.exec(info || ''); const lines = src.split('\n');
      throw new Error(`compile ${name}: ${info}\n${m ? lines.slice(Math.max(0, +m[1] - 3), +m[1] + 1).join('\n') : ''}`);
    }
    return s;
  };
  const program = (vs, fs, name) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs, name + '.vs')); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs, name + '.fs'));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link ${name}: ${gl.getProgramInfoLog(p)}`);
    p.loc = {}; p.name = name;
    return p;
  };
  const L = (p, n) => { if (!(n in p.loc)) p.loc[n] = gl.getUniformLocation(p, n); return p.loc[n]; };
  const u1f = (p, n, v) => { const l = L(p, n); if (l) gl.uniform1f(l, v); };
  const u1i = (p, n, v) => { const l = L(p, n); if (l) gl.uniform1i(l, v); };
  const u2f = (p, n, v) => { const l = L(p, n); if (l) gl.uniform2f(l, v[0], v[1]); };
  const u3f = (p, n, v) => { const l = L(p, n); if (l) gl.uniform3f(l, v[0], v[1], v[2]); };
  const u4f = (p, n, v) => { const l = L(p, n); if (l) gl.uniform4f(l, v[0], v[1], v[2], v[3]); };
  const u3fv = (p, n, v) => { const l = L(p, n); if (l) gl.uniform3fv(l, v); };
  const u4fv = (p, n, v) => { const l = L(p, n); if (l) gl.uniform4fv(l, v); };
  const mainFS = (body) => HDR + COMMON + LIGHT + body;
  const Pg = {
    terrain: program(HDR + COMMON + TERRAIN_VS, mainFS(TERRAIN_FS), 'terrain'),
    terrainSh: program(HDR + '#define SHADOW\n' + COMMON + TERRAIN_VS, HDR + SHADOW_FS, 'terrainSh'),
    water: program(HDR + COMMON + WATER_VS, mainFS(WATER_FS), 'water'),
    prop: program(HDR + COMMON + PROP_VS, mainFS(PROP_FS), 'prop'),
    propSh: program(HDR + '#define SHADOW\n' + COMMON + PROP_VS, HDR + SHADOW_FS, 'propSh'),
    clawd: program(HDR + COMMON + CLAWD_VS, mainFS(CLAWD_FS), 'clawd'),
    clawdSh: program(HDR + '#define SHADOW\n' + COMMON + CLAWD_VS, HDR + SHADOW_FS, 'clawdSh'),
    sky: program(FULL_VS, mainFS(SKY_FS), 'sky'),
    bright: program(FULL_VS, BRIGHT_FS, 'bright'),
    blur: program(FULL_VS, BLUR_FS, 'blur'),
    rays: program(FULL_VS, RAYS_FS, 'rays'),
    final: program(FULL_VS, FINAL_FS, 'final'),
  };
  log(`valley: programs ${(performance.now() - t0).toFixed(0)} ms`);

  // ---------------------------------------------------------------- geometry
  const T = buildTerrain();
  const hl = heightIndex(T, -120, 120, -120, 200, 2.0);
  const Wt = buildWater({ pools: opts.pools });
  const Pr = buildProps(hl, { agents: opts.agents !== false, clear: opts.clear, trees: opts.trees, noRiver: opts.noRiver, rocks: opts.rocks, pad: opts.pad });
  log(`valley: terrain ${T.stats.l0} l0 tris, ${T.stats.facets} facets, ${T.stats.rings} rings, ${T.stats.ms} ms; water ${Wt.n / 3} tris; props ${Pr.n / 3} tris`);
  const buf = (data, loc, size, type, norm) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); if (type === gl.FLOAT || norm) gl.vertexAttribPointer(loc, size, type, norm, 0, 0); else gl.vertexAttribPointer(loc, size, type, norm, 0, 0); return b; };
  const vao = () => { const v = gl.createVertexArray(); gl.bindVertexArray(v); return v; };
  const mT = { vao: vao(), n: T.n };
  buf(T.A, 0, 4, gl.FLOAT, false); buf(T.B, 1, 4, gl.FLOAT, false); buf(T.C, 2, 4, gl.UNSIGNED_BYTE, true); buf(T.D, 3, 4, gl.UNSIGNED_BYTE, true); buf(T.E, 4, 4, gl.BYTE, true);
  const mW = { vao: vao(), n: Wt.n };
  buf(Wt.P, 0, 4, gl.FLOAT, false); buf(Wt.N, 1, 4, gl.BYTE, true); buf(Wt.C, 2, 4, gl.UNSIGNED_BYTE, true); buf(Wt.F, 3, 4, gl.FLOAT, false);
  // the worlds' water: a flat grid at the water line over the training ground (drawn only in P.world)
  const WW = (() => {
    const P = [], N = [], C = [], F = [], n = 96, ext = 150, z0 = -40;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x0 = -ext + 2 * ext * i / n, x1 = -ext + 2 * ext * (i + 1) / n, za = z0 + 2 * ext * j / n, zb = z0 + 2 * ext * (j + 1) / n;
      const cx = (x0 + x1) / 2, cz = (za + zb) / 2, rnd = hq(cx, cz, 32);
      for (const [x, z] of [[x0, za], [x1, za], [x1, zb], [x0, za], [x1, zb], [x0, zb]]) {
        P.push(x, WATER, z, 0.7); N.push(0, 127, 0, 0); C.push(52, 92, 112, Math.round(rnd * 255)); F.push(cx, cz, 0, 0);
      }
    }
    return { P: new Float32Array(P), N: new Int8Array(N), C: new Uint8Array(C), F: new Float32Array(F), n: P.length / 4 };
  })();
  const mWW = { vao: vao(), n: WW.n };
  buf(WW.P, 0, 4, gl.FLOAT, false); buf(WW.N, 1, 4, gl.BYTE, true); buf(WW.C, 2, 4, gl.UNSIGNED_BYTE, true); buf(WW.F, 3, 4, gl.FLOAT, false);
  const mP = { vao: vao(), n: Pr.n };
  buf(Pr.O, 0, 4, gl.FLOAT, false); buf(Pr.An, 1, 4, gl.FLOAT, false); buf(Pr.X, 2, 4, gl.FLOAT, false); buf(Pr.N, 3, 4, gl.BYTE, true); buf(Pr.C, 4, 4, gl.UNSIGNED_BYTE, true);
  const mC = { vao: vao(), n: 0, key: '', bufs: [gl.createBuffer(), gl.createBuffer(), gl.createBuffer(), gl.createBuffer()] };
  { const [b0, b1, b2, b3] = mC.bufs;
    gl.bindBuffer(gl.ARRAY_BUFFER, b0); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.BYTE, true, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b3); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0); }
  const mFull = { vao: vao() };
  gl.bindVertexArray(null);
  const setClawdMesh = (grid, D) => {
    const key = grid.join('/') + '|' + D.toFixed(3);
    if (key === mC.key) return;
    const M = buildClawd(grid, D);
    const [b0, b1, b2, b3] = mC.bufs;
    gl.bindBuffer(gl.ARRAY_BUFFER, b0); gl.bufferData(gl.ARRAY_BUFFER, M.P, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, M.N, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, M.AO, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, b3); gl.bufferData(gl.ARRAY_BUFFER, M.M, gl.DYNAMIC_DRAW);
    mC.n = M.n; mC.key = key; mC.rows = M.rows;
  };
  // S34's crowd: one cached mesh per pose, drawn solid like the main Clawd
  const crowdMeshes = new Map();
  const crowdMesh = (grid, D) => {
    const key = grid.join('/') + '|' + D.toFixed(3);
    if (crowdMeshes.has(key)) return crowdMeshes.get(key);
    const M = buildClawd(grid, D), v = gl.createVertexArray(); gl.bindVertexArray(v);
    [[M.P, 3, gl.FLOAT, false], [M.N, 4, gl.BYTE, true], [M.AO, 1, gl.FLOAT, false], [M.M, 1, gl.FLOAT, false]].forEach(([d, n, t, nm], i) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, t, nm, 0, 0);
    });
    gl.bindVertexArray(null);
    const m = { vao: v, n: M.n }; crowdMeshes.set(key, m); return m;
  };
  // P.crowd: [{ x, y?, z, yaw, lean, grid, depth, scale, squash }]
  const drawCrowd = (prog, B, P, S) => {
    for (const c of P.crowd || []) {
      const m = crowdMesh(c.grid || NEUTRAL, Math.max(0.15, c.depth === undefined ? 4 : c.depth));
      const cy = c.y !== undefined ? c.y : heightAt(c.x, c.z);
      const Sc = Object.assign({}, S, { clawdP: [c.x, cy, c.z], crot: [c.yaw || 0, c.lean || 0, CLAWD_S * (c.scale || 1), c.squash || 1] });
      setShared(prog, B, P, Sc); u3f(prog, 'uCPos', [c.x, cy, c.z]);
      gl.bindVertexArray(m.vao); gl.drawArrays(gl.TRIANGLES, 0, m.n);
    }
  };

  // ---------------------------------------------------------------- targets
  const tex = (w, h, ifmt, fmt, type, filt) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const fbo = (texs, depth) => {
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    texs.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    if (depth) gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    gl.drawBuffers(texs.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER); if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo incomplete ' + st);
    return f;
  };
  const SAMPLES = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
  const targets = new Map();
  function getTargets(w, h) {
    const key = w + 'x' + h;
    if (targets.has(key)) return targets.get(key);
    const rb = (fmt, ms) => { const r = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, r); if (ms) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, SAMPLES, fmt, w, h); else gl.renderbufferStorage(gl.RENDERBUFFER, fmt, w, h); return r; };
    const msC = rb(gl.RGBA8, true), msX = rb(gl.RGBA8, true), msD = rb(gl.DEPTH_COMPONENT24, true);
    const fMS = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fMS);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msC);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.RENDERBUFFER, msX);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, msD);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('msaa fbo incomplete');
    const tC = tex(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR), tX = tex(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    const fC = fbo([tC]), fX = fbo([tX]);
    const rw = Math.max(2, w >> 1), rh = Math.max(2, h >> 1);
    const tR = tex(rw, rh, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    const dR = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, dR); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, rw, rh);
    const fR = fbo([tR], dR);
    const mk = (a, b) => { const t = tex(a, b, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR); return { t, f: fbo([t]), w: a, h: b }; };
    const T2 = { w, h, fMS, fC, fX, tC, tX, fR, tR, rw, rh,
      b1: mk(w >> 1, h >> 1), b1t: mk(w >> 1, h >> 1), b2: mk(w >> 2, h >> 2), b2t: mk(w >> 2, h >> 2), b3: mk(w >> 3, h >> 3), b3t: mk(w >> 3, h >> 3), rays: mk(w >> 1, h >> 1) };
    targets.set(key, T2);
    return T2;
  }
  // shadow map
  const SH = 2048;
  const tSh = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tSh);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SH, SH);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  const fSh = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fSh);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tSh, 0);
  gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // S18's stroke maps sit on units 6-9 (strokes.js); an empty 1x1 texture stands in otherwise
  const tNone = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tNone);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const STROKE_UNIT = 6;
  log(`valley: setup ${(performance.now() - t0).toFixed(0)} ms, MSAA ${SAMPLES}`);

  // ---------------------------------------------------------------- uniforms
  const trailBuf = new Float32Array(96);
  function setShared(p, B, P, S) {
    gl.useProgram(p);
    u3f(p, 'uCam', B.pos); u3f(p, 'uFwd', B.fwd); u3f(p, 'uRight', B.right); u3f(p, 'uUp', B.up);
    u1f(p, 'uFy', B.fy); u1f(p, 'uAspect', B.aspect); u2f(p, 'uPP', B.pp); u2f(p, 'uNF', [0.3, 9000]);
    u3f(p, 'uOrtho', B.ortho ? [1, B.ortho[0], B.ortho[1]] : [0, 1, 1]);
    if (B.ortho) u2f(p, 'uNF', [-2000, 4000]);
    u1i(p, 'uMirror', S.mirror ? 1 : 0); u1i(p, 'uRaw', S.raw ? 1 : 0);
    const Ln = P.learn || {};
    u4f(p, 'uSpawn', Ln.spawn || [0, 0, 0, 1]);
    u1i(p, 'uTrailN', S.trailN); u3fv(p, 'uTrail[0]', trailBuf); u2f(p, 'uTrailRW', Ln.trail ? [Ln.trail.reach, Ln.trail.w] : [0, 0]);
    u4f(p, 'uTouch', Ln.touch || [0, 0, 0, 1]); u1f(p, 'uLearnAll', Ln.all || 0);
    const R = P.rise; u4f(p, 'uRise', R ? [R.R, R.w, R.crest || 0, 1] : [0, 1, 0, 0]); u2f(p, 'uRiseC', R && R.c ? R.c : [0, 0]);
    const Sw = P.sweep;                     // revision 13: the humans' cursor drawing land in (sweep.js)
    u1i(p, 'uSweepN', Sw ? Sw.n : 0); if (Sw) u4fv(p, 'uSweep[0]', Sw.buf);
    u4f(p, 'uSweepRW', Sw ? [Sw.reach, Sw.target, 0, 0] : [0, 0, 0, 0]); u4f(p, 'uSweepTip', Sw && Sw.tip ? Sw.tip : [0, 0, 1, 0]);
    u1f(p, 'uSmoothAll', P.smooth || 0);
    const Tl = P.tile; u4f(p, 'uClip', Tl ? [Tl.c[0], Tl.c[1], Tl.half, Tl.dissolve || 0] : [0, 0, 1e6, 0]);
    u3f(p, 'uLC', S.LC); u3f(p, 'uLE', S.LE); u3f(p, 'uLX', S.LX); u3f(p, 'uLY', S.LY); u3f(p, 'uLZ', S.LZ);
    u1f(p, 'uShTx', 1 / SH);
    u3f(p, 'uKey', S.key); u3f(p, 'uSun', S.sun);
    u1f(p, 'uTime', P.time || 0); u1f(p, 'uK', S.k); u1f(p, 'uFpx', B.Fpx); u2f(p, 'uRes', [S.w, S.h]);
    u1f(p, 'uPaint', P.paint === undefined ? 1 : P.paint); u1f(p, 'uPal', P.pal || 0); u1f(p, 'uSkyWhite', P.skyWhite || 0);
    u1f(p, 'uVoid', P.void || 0); u3f(p, 'uVoidCol', P.voidCol || [0.035, 0.03, 0.09]); u1f(p, 'uExposure', P.exposure || 0.9); u1f(p, 'uFogK', P.fogK === undefined ? 1 : P.fogK); u1f(p, 'uCloudK', P.cloudK === undefined ? 1 : P.cloudK);
    u3f(p, 'uClawdP', S.clawdP); u1f(p, 'uClawdGlow', S.clawdGlow);
    u3f(p, 'uSkyHor', S.sky.hor); u3f(p, 'uSkyLow', S.sky.low); u3f(p, 'uSkyMid', S.sky.mid); u3f(p, 'uSkyZen', S.sky.zen);
    u1f(p, 'uHideAgents', P.hideAgents ? 1 : 0); u4f(p, 'uPropGate', P.propGate || [0, 0, -1, -1]); u1f(p, 'uFloor', P.floor || 0); u1f(p, 'uFloorLook', P.floorLook || 0); u2f(p, 'uFloorR', P.floorR || [1e6, 2e6]); u1f(p, 'uMeadowLift', P.meadowLift || 0); u1f(p, 'uCloudFade', P.cloudFade || 0); u1f(p, 'uGhost', 0);
    { const l = L(p, 'uRings[0]'); if (l) { const r = new Float32Array(16); (P.rings || []).slice(0, 4).forEach((q, i) => r.set(q, i * 4)); gl.uniform4fv(l, r); } } u4f(p, 'uVoidGlow', P.voidGlow || [0, 0, 0, 1]);
    u3f(p, 'uCPos', S.clawdP); u4f(p, 'uCRot', S.crot); u1f(p, 'uClawdFill', P.clawdFill || 0);
    u1i(p, 'uSh', 0); u1i(p, 'uRefl', 1);
    // S18 strokes (off unless P.strokes is on) and his pulse
    const Sk = P.strokes;
    u1i(p, 'uStrokeNA', STROKE_UNIT); u1i(p, 'uStrokeNB', STROKE_UNIT + 1); u1i(p, 'uStrokeFA', STROKE_UNIT + 2); u1i(p, 'uStrokeFB', STROKE_UNIT + 3);
    u1f(p, 'uStrokeOn', Sk && Sk.on ? 1 : 0);
    if (Sk && Sk.on) {
      u4f(p, 'uStrokeNR', [Sk.near.c[0], Sk.near.c[1], Sk.near.half, 0]); u4f(p, 'uStrokeFR', [Sk.far.c[0], Sk.far.c[1], Sk.far.half, 0]);
      u1f(p, 'uStrokeSmooth', Sk.smooth === undefined ? 1 : Sk.smooth); u1f(p, 'uStrokeBleed', Sk.bleed || 0); u1f(p, 'uStrokePal', Sk.pal || 0);
      if (Sk.die) {   // S34's wafer (revision 10)
        const D = Sk.die, n = Math.min(32, D.rects.length), R = new Float32Array(128), I = new Float32Array(128);
        for (let i = 0; i < n; i++) { R.set(D.rects[i].r, i * 4); I.set([D.rects[i].c, D.rects[i].sd || 0, D.rects[i].sn || 0, 0], i * 4); }
        u4f(p, 'uDie', [D.x0, D.z0, D.pitch, D.scribe]); u1i(p, 'uDieN', n); u1f(p, 'uDieHero', D.hero === undefined ? 9 : D.hero);
        u1f(p, 'uLatAmp', D.latAmp || 0);
        const lr = L(p, 'uDieRect[0]'), li = L(p, 'uDieInfo[0]'); if (lr) gl.uniform4fv(lr, R); if (li) gl.uniform4fv(li, I);
      }
      u4f(p, 'uPulse', Sk.pulse || [0, 0, 0, 1]); u1f(p, 'uPulseK', Sk.pulseK || 0);
    }
    // Revision 11's worlds (off unless P.world): { a, b, front, width }
    const Wd = P.world;
    u4f(p, 'uWorldM', Wd ? [Wd.a || 0, Wd.b === undefined ? (Wd.a || 0) : Wd.b, Wd.front === undefined ? 1e6 : Wd.front, Wd.width || 1] : [0, 0, 0, 1]);
    u1f(p, 'uWorldWater', S.worldWater ? 1 : 0);
    const Tr = P.traits;
    u4f(p, 'uTraits', Tr ? [Tr.ice || 0, Tr.salt || 0, 0, 0] : [0, 0, 0, 0]); u4f(p, 'uSaltBox', Tr && Tr.saltBox ? Tr.saltBox : [0, 0, 0, 0]);
    // S19's hill (off unless P.hill has bumps): [{ amp, x, z, rate, su, sv, rx, rz }]
    const Hl = P.hill && P.hill.length ? P.hill.slice(0, 6) : null;
    u1f(p, 'uHillOn', Hl ? 1 : 0);
    if (Hl) {
      const a = new Float32Array(24), b = new Float32Array(24);
      Hl.forEach((h, i) => { a.set([h.amp, h.x, h.z, h.rate || 0], i * 4); b.set([h.su, h.sv, h.rx, h.rz], i * 4); });
      const la = L(p, 'uHillA[0]'), lb = L(p, 'uHillB[0]');
      if (la) gl.uniform4fv(la, a); if (lb) gl.uniform4fv(lb, b);
    }
  }
  const draw = (m, mode = gl.TRIANGLES) => { if (!m.n) return; gl.bindVertexArray(m.vao); gl.drawArrays(mode, 0, m.n); };

  // ---------------------------------------------------------------- render
  // P: { cam, time, learn: { spawn:[x,z,R,rag], trail:{ pts:[[x,z],..], reach, w }, touch:[x,z,R,rag], all },
  //      rise:{ R, w, crest, c }, smooth, paint, pal, skyWhite, void, voidCol, tile:{ c, half, dissolve },
  //      clawd:{ x, y?, z, yaw, lean, depth, grid, scale, squash, glow, hidden }, key:[az,el], sun:[az,el],
  //      hideAgents, exposure, glow, rays, grain, vig, warm, fade, fadeCol, extra(gl, S) }
  // target: { w, h, fbo } (default: the canvas)
  function render(P, target) {
    const w = target ? target.w : canvas.width, h = target ? target.h : canvas.height;
    const TG = getTargets(w, h);
    const B = camBasis(P.cam, w, h);
    const k = h / 1080;
    // trail
    let trailN = 0;
    if (P.learn && P.learn.trail) {
      const pts = P.learn.trail.pts || PATH;
      let s = 0; trailN = Math.min(32, pts.length);
      for (let i = 0; i < trailN; i++) { if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); trailBuf[i * 3] = pts[i][0]; trailBuf[i * 3 + 1] = pts[i][1]; trailBuf[i * 3 + 2] = s; }
    }
    // Clawd
    const C = P.clawd || {};
    const cy = C.y !== undefined ? C.y : (C.x !== undefined ? heightAt(C.x, C.z) : 0);
    const clawdP = [C.x || 0, cy, C.z || 0];
    const depth = Math.max(0.15, C.depth === undefined ? 4 : C.depth);
    setClawdMesh(C.grid || NEUTRAL, depth);
    const crot = [C.yaw || 0, C.lean || 0, (C.scale || 1) * CLAWD_S, C.squash || 1];
    const clawdGlow = C.glow === undefined ? 1 : C.glow;
    // lights
    const key = dirAE(...(P.key || [20, 24])), sun = dirAE(...(P.sun || [10, 2.2]));
    const LZ = v3.mul(key, -1), LX = v3.norm(v3.cross([0, 1, 0], LZ)), LY = v3.cross(LZ, LX);
    const sc = P.shadow || {};
    const LC = sc.c || [clawdP[0], clawdP[1], clawdP[2]];
    const LR = sc.r || 40;
    const LE = [LR, LR, LR + 120];
    const pal = P.pal || 0;
    const sky = { hor: mixA(SKY_GOLD.hor, SKY_DUSK.hor, pal), low: mixA(SKY_GOLD.low, SKY_DUSK.low, pal), mid: mixA(SKY_GOLD.mid, SKY_DUSK.mid, pal), zen: mixA(SKY_GOLD.zen, SKY_DUSK.zen, pal) };
    const S = { k, w, h, trailN, clawdP, crot, clawdGlow, key, sun, LC, LE, LX, LY, LZ, sky, mirror: false, raw: false };

    gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    { const Sk = P.strokes && P.strokes.on ? P.strokes : null;
      const tx = Sk ? [Sk.near.tA, Sk.near.tB, Sk.far.tA, Sk.far.tB] : [tNone, tNone, tNone, tNone];
      tx.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + STROKE_UNIT + i); gl.bindTexture(gl.TEXTURE_2D, t); });
      gl.activeTexture(gl.TEXTURE0); }
    // --- shadow map
    gl.bindFramebuffer(gl.FRAMEBUFFER, fSh); gl.viewport(0, 0, SH, SH);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 3.0);
    if (!P.noTerrain) { setShared(Pg.terrainSh, B, P, S); draw(mT); }
    if (!P.noProps) { setShared(Pg.propSh, B, P, S); draw(mP); }
    if (!C.hidden) { setShared(Pg.clawdSh, B, P, S); draw(mC); }
    if (P.crowd) drawCrowd(Pg.clawdSh, B, P, S);
    if (P.extraShadow) P.extraShadow(gl, { B, S, setShared, Pg, TG });   // S19: the tree's shadow
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tSh);
    // --- mirrored scene for the river (half res, linear)
    if (!P.noReflection) {
      const Sm = Object.assign({}, S, { mirror: true, raw: true, w: TG.rw, h: TG.rh });
      const Bm = camBasis(P.cam, TG.rw, TG.rh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, TG.fR); gl.viewport(0, 0, TG.rw, TG.rh);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
      setShared(Pg.sky, Bm, P, Sm); gl.bindVertexArray(mFull.vao); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      setShared(Pg.terrain, Bm, P, Sm); draw(mT);
      setShared(Pg.prop, Bm, P, Sm); draw(mP);
      if (!C.hidden) { setShared(Pg.clawd, Bm, P, Sm); draw(mC); }
    }
    // --- main scene (MSAA)
    gl.bindFramebuffer(gl.FRAMEBUFFER, TG.fMS); gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    setShared(Pg.sky, B, P, S); gl.bindVertexArray(mFull.vao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    if (!P.noTerrain) { setShared(Pg.terrain, B, P, S); draw(mT); }
    if (!P.noProps) { setShared(Pg.prop, B, P, S); draw(mP); }
    if (!C.hidden) { setShared(Pg.clawd, B, P, S); draw(mC); }
    if (P.crowd) drawCrowd(Pg.clawd, B, P, S);
    // translucent Clawds: where earlier runs ended, and the streak of a rewind
    if (P.ghosts && P.ghosts.length) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      for (const gh of P.ghosts) {
        if (!(gh.alpha > 0.004)) continue;
        setClawdMesh(gh.grid || NEUTRAL, Math.max(0.15, gh.depth === undefined ? 4 : gh.depth));
        const gy = gh.y !== undefined ? gh.y : heightAt(gh.x, gh.z);
        const Sg = Object.assign({}, S, { clawdP: [gh.x, gy, gh.z], crot: [gh.yaw || 0, 0, CLAWD_S * (gh.scale || 1), 1] });
        setShared(Pg.clawd, B, P, Sg); u1f(Pg.clawd, 'uGhost', gh.alpha); u3f(Pg.clawd, 'uCPos', [gh.x, gy, gh.z]);
        draw(mC);
      }
      gl.disable(gl.BLEND); gl.depthMask(true);
      setClawdMesh(C.grid || NEUTRAL, depth);
    }
    if (!P.noTerrain) {
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, TG.tR);
      setShared(Pg.water, B, P, S); draw(mW);
      // the worlds' water (the crater's lake, the icy sea): a flat grid, kept only off the valley
      if (P.world && ((P.world.a || 0) > 0.5 || (P.world.b || 0) > 0.5)) { setShared(Pg.water, B, P, Object.assign({}, S, { worldWater: true })); draw(mWW); }
    }
    if (P.extra) P.extra(gl, { B, S, setShared, Pg, TG });
    gl.disable(gl.DEPTH_TEST);
    // --- resolve
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, TG.fMS);
    gl.readBuffer(gl.COLOR_ATTACHMENT0); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, TG.fC);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.readBuffer(gl.COLOR_ATTACHMENT1); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, TG.fX);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    // --- post
    const pass = (p, tgt, src, set) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.f); gl.viewport(0, 0, tgt.w, tgt.h); gl.useProgram(p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src); u1i(p, 'uT', 0); u2f(p, 'uInv', [1 / tgt.w, 1 / tgt.h]);
      if (set) set(p); gl.bindVertexArray(mFull.vao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const blur = (a, tmp, s) => { pass(Pg.blur, tmp, a.t, (p) => u2f(p, 'uDir', [s, 0])); pass(Pg.blur, a, tmp.t, (p) => u2f(p, 'uDir', [0, s])); };
    const thr = P.bloomThr === undefined ? 0.8 : P.bloomThr;
    pass(Pg.bright, TG.b1, TG.tC, (p) => u1f(p, 'uThr', thr)); blur(TG.b1, TG.b1t, 1.0);
    pass(Pg.bright, TG.b2, TG.b1.t, (p) => u1f(p, 'uThr', thr)); blur(TG.b2, TG.b2t, 1.5); blur(TG.b2, TG.b2t, 1.5);
    pass(Pg.bright, TG.b3, TG.b2.t, (p) => u1f(p, 'uThr', thr)); blur(TG.b3, TG.b3t, 2.0); blur(TG.b3, TG.b3t, 2.0);
    // sun rays toward the sun's screen position (skip when it is far off screen)
    const sp = projectPx(B, v3.add(B.pos, v3.mul(sun, 5000)));
    const raysOn = (P.rays === undefined ? 0.75 : P.rays) * (sp[2] > 0 ? 1 : 0) * (1 - (P.void || 0)) * (1 - (P.skyWhite || 0));
    if (raysOn > 0.001) {
      pass(Pg.rays, TG.rays, TG.tC, (p) => { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, TG.tX); u1i(p, 'uAux', 1); u2f(p, 'uSunUV', [sp[0] / w, 1 - sp[1] / h]); });
    } else { gl.bindFramebuffer(gl.FRAMEBUFFER, TG.rays.f); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    // final
    const cs = projectPx(B, [clawdP[0], clawdP[1] + 0.37 * (C.scale || 1), clawdP[2]]);
    const cw = B.ortho ? 1.35 * (C.scale || 1) * w / (2 * B.ortho[0]) : 1.35 * (C.scale || 1) * B.Fpx / Math.max(cs[2], 0.1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target && target.fbo ? target.fbo : null); gl.viewport(0, 0, w, h);
    const pf = Pg.final; gl.useProgram(pf);
    const bindT = (unit, t, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); u1i(pf, name, unit); };
    bindT(0, TG.tC, 'uCrisp'); bindT(1, TG.tX, 'uAux'); bindT(2, TG.b1.t, 'uB1'); bindT(3, TG.b2.t, 'uB2'); bindT(4, TG.b3.t, 'uB3'); bindT(5, TG.rays.t, 'uRays');
    u2f(pf, 'uRes', [w, h]); u3f(pf, 'uClawdScr', [cs[0], cs[1], cw]);
    u1f(pf, 'uGlow', C.hidden || cs[2] <= 0 ? 0 : (P.glow === undefined ? 1 : P.glow) * Math.min(1, 130 * k / Math.max(cw, 1))); u1f(pf, 'uRaysAmt', raysOn);
    u1f(pf, 'uGrain', (P.grain === undefined ? 0.035 : P.grain)); u1f(pf, 'uVig', P.vig === undefined ? 1 : P.vig); u1f(pf, 'uWarm', P.warm || 0);
    u1f(pf, 'uFade', P.fade || 0); u1f(pf, 'uGrade', P.grade === undefined ? 1 : P.grade); u1f(pf, 'uRewind', P.rewind || 0); u3f(pf, 'uFadeCol', P.fadeCol || [1, 1, 1]);
    gl.bindVertexArray(mFull.vao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    return { B, clawdScr: cs, clawdW: cw, sunScr: sp };
  }
  function heightAt(x, z) { return hl(x, z)[2]; }
  const sync = () => { const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
  return { gl, render, heightAt, heightLevels: hl, getTargets, setShared, Pg, sync, T, program, u1f, u1i, u2f, u3f, u4f, tex, fbo };
}
