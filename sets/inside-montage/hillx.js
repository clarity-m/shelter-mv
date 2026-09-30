// FORK of sets/hill/hill.js for brief H (S22, S25, S27, S30), so sets/hill stays untouched.
// With none of the options below set, it renders exactly as sets/hill does. Opt-in state keys:
//   crowd:  [{ x, z, ...clawd keys }]  more Clawds, crisp, depth-tested, blooming like the main one
//   strokeLift: 0..1   rung 4: the paint turns to light. Sky strokes melt into the underpainting; on
//           the land and tree the lift spreads out from Clawd, ~5% of strokes becoming warm motes
//           that rise, the rest melting away
//   river:  { pts: [[x, z, halfWidth], ...] (<= 16), head, flow }   painted water on the land along
//           the path up to arc length `head` (m); `flow` (s) scrolls its ripples downstream
//   lines:  [[ax, ay, az, bx, by, bz, widthPx, I, r, g, b, glowPx], ...]   lines of light in the
//           world, added in linear light before bloom (so they bloom and tone-map with the frame);
//           a zero-length segment is a point of light (S30's sparks)
//   towerHaze: 0..1   the towers' feet dissolve into the horizon haze (a city rising out of mist)
//   dim: 0..1 or [r, g, b]   scales the world (and Clawd) under the lines of light, which stay full
//   per Clawd (main or crowd): legs [4 columns], look (-1|0|1), arch (bool), armL / armR (0, -1, 1, -2):
//           exact-cell poses from the sprite canon (see CLAWD_FS in glslx.js)
//   ribbons (revision 3): [{ P: [[x,y,z]...], w: [half width m...], S: [[side]...] | null,
//           bb: [0..1...] (1 = the band turns to face the camera, a tube-like stroke), col: [[r,g,b]...]
//           or [r,g,b] (linear, intensity folded in), a: [alpha...] | number, u: [metres along...]
//           (default: arc length), seed }]   bands of luminous paint (S25's protein), drawn
//           premultiplied-over, far to near, into the composite before the lines and bloom.
//           Options: ribbonPaint (0..1, brush texture, default 1), ribbonCore (hot seam, default 0.5),
//           ribbonMinPx (minimum half width on screen, design px, default 1.1)
//   palLin (revision 3): a palette in linear light (palettes.js palLinear / palMix), used instead of
//           `pal`, so a shot can ease the sky and its light from dusk to night
//   look (revision 4): rung 4 now renders S18's painted-valley look by default (glslx.js LOOK: faceted
//           land under long green strokes, low-poly trees, a clean sky with streak clouds, peach
//           mountains, crisp post); look: 'luminous' keeps the old hazy paint. Look options:
//           drift 0..1 (S18's valley toward the shelter's palette, valley.js lookPal), keyEl / keyAz
//           (deg, the land's key light, default 30 / the sun's + 62), haze (1), props (true: low-poly trees),
//           mountains (1), salt (0..1, revision 8: a salt flat's crust, cracks and sky sheen instead of
//           grass). strokeLift in the look keeps only the rising motes.
//   per Clawd, from sets/hill: grid (a clawd-pose.js pose name or bits) and dy (lift in glyph units)
//   linesOverClawd (revision 20): the lines of light are drawn over the Clawds (additive), not hidden by them
//   decals (revision 10): { src: canvas (an atlas; only its alpha is used), key (re-uploaded when it
//           changes), quads: [{ P: [4 world corners: bottom-left, bottom-right, top-right, top-left],
//           uv: [u0, v0, u1, v1] (atlas px, v down), col: [r, g, b] (linear), a: number | [4 corners] }] }
//           the film's code lying in the world: added as light after the lines, before bloom,
//           perspective-correct, hidden behind nearer scene and under Clawds (as the lines are)
//
// The original header follows.
// The hill set renderer. One scene, ray-cast in WebGL2, seen through the ladder's lenses:
//   rung 4 "luminous": underpainting + world-anchored brushstrokes + light wrap + bloom,
//                      Clawd composited crisp as the luminous glyph (bevel, inner light);
//   rung 5 "light":    the world as a ghost, contour light on the land, world-anchored motes,
//                      the dome as threads, Clawd composited crisp as the radiant form.
// Rungs 1-3 are not ported (see NOTES.md); ladder.html remains their reference.
//
//   const hill = createHill(canvas, { log, seeding });   // seeding is fixed for a shot
//   hill.render(state);                                    // state: see defaultState()
//
// Every frame is a pure function of `state`. Nothing is carried between frames.
import {
  MAT, v3, camBasis, project, sunDir, LADDER_CAM, LADDER_SUN, HILL, hillH, HUMAN_BOUND, TREE_BOUND,
  treeGrow, CLOUDS, CLOUD_DRIFT, DEFAULT_SEEDING,
} from '../hill/scene.js';
import { PAL4, SHELTER, palLinear, PAL_KEYS } from '../hill/palettes.js';
import { gridBits } from '../hill/clawd-pose.js';
import { lookPal, LOOK_KEYS } from './valley.js';
import {
  LIT_FS, SEED_VS, STROKE_FS, MOTE_FS, BLUR_FS, DOWN_FS, COPY_FS, SKYONLY_FS, WRAP_FS, COMP_FS, FINISH_FS,
  SKY5_FS, GHOST_FS, CLAWD_FS, FAM, LINE_VS, LINE_FS, RIBBON_VS, RIBBON_FS, DECAL_FS,
} from './glslx.js';

export { MAT, camBasis, project, hillH, HILL, LADDER_CAM, LADDER_SUN };

// Clawd's size in the ladder: 144 px wide at z = 9.6 through F = 1400 -> metres per glyph unit
export const CLAWD_U = 144 * 9.6 / 1400 / 18;

export function defaultState() {
  return {
    rung: 4,
    time: 0,                                   // seconds: clouds drift, motes rise and twinkle
    cam: { pos: [0, 0.7, 0], yaw: 0, pitch: 0, F: 1400, pp: [960, 780] },
    sun: { az: LADDER_SUN.az, el: LADDER_SUN.el },
    hill: HILL,                                // Gaussian bumps [a, cx, cz, sx, sz], up to 4
    tree: { x: -4.1, z: 9.2, grow: 1 },        // null hides it; y follows the terrain
    human: null,                               // { x, z, yaw } seated figure
    clawd: { x: 1.51, z: 9.6, u: CLAWD_U, form: 'luminous', sit: 0, glow: 1, hop: 0, rays: 1, alpha: 1, eyeLight: 0.5, light: 1 },
    towers: [],                                // [{ x, z, w, h, taper, cap, rot, lit }]
    ring: null,                                // { c: [x,y,z], R, n: [nx,ny,nz], w, on }
    towerWin: 0.6, towerEdge: 0, cityPulse: 0,
    grid: null, floorGrid: null, fog: null,    // null = the rung's default
    paint: 1,                                  // rung 4: stroke opacity
    motes: 1,                                  // rung 5: mote brightness
    ghost: 0.42, contour: 1, contourStep: 0.16, edge: 1,
    dome: { mer: 0.16, lat: 0.05, fade: 0 },
    aura: null, exposure: 1, pal: null,        // pal: a palette object from palettes.js
  };
}

const INT_UNIFORMS = new Set(['uNTow', 'uFam', 'uMode', 'uRivN', 'uGridOn']);
const dimRGB = (d) => (Array.isArray(d) ? d : [d ?? 1, d ?? 1, d ?? 1]);

export function createHill(canvas, options = {}) {
  const W = canvas.width, H = canvas.height, K = W / 1920;
  const LOG = options.log || (() => {});
  const seeding = Object.assign({}, DEFAULT_SEEDING, options.seeding || {});
  const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, alpha: false, premultipliedAlpha: false });
  if (!gl) throw new Error('hill: no webgl2');
  if (!gl.getExtension('EXT_color_buffer_float')) LOG('hill: WARNING no EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');
  const TIMES = {};

  // ---------------------------------------------------------------- GL plumbing
  const VS = `#version 300 es
in vec2 aP; void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const emptyVao = gl.createVertexArray();

  function compile(fsSrc, label, vsSrc) {
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(s);
        const m = /ERROR: 0:(\d+)/.exec(info);
        const ln = m ? +m[1] : 0;
        const ctx = src.split('\n').slice(Math.max(0, ln - 3), ln + 2).map((l, i) => (Math.max(0, ln - 3) + i + 1) + ': ' + l).join('\n');
        LOG('SHADER ERROR ' + label + ': ' + info + '\n' + ctx);
        throw new Error('hill shader ' + label);
      }
      return s;
    };
    const t0 = performance.now();
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vsSrc || VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fsSrc));
    gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { LOG('LINK ERROR ' + label + ': ' + gl.getProgramInfoLog(p)); throw new Error('hill link ' + label); }
    p.locs = new Map();
    TIMES.compile = (TIMES.compile || 0) + performance.now() - t0;
    return p;
  }
  function tex(w, h, fmt, filter) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    const F32 = fmt === 'f32';
    gl.texImage2D(gl.TEXTURE_2D, 0, F32 ? gl.RGBA32F : gl.RGBA16F, w, h, 0, gl.RGBA, F32 ? gl.FLOAT : gl.HALF_FLOAT, null);
    const f = filter || (F32 ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    t.w = w; t.h = h;
    return t;
  }
  function fbo(texs) {
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    texs.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers(texs.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (st !== gl.FRAMEBUFFER_COMPLETE) LOG('hill: FBO incomplete ' + st);
    f.w = texs[0].w; f.h = texs[0].h; f.t = texs[0];
    return f;
  }
  function loc(prog, name) {
    if (!prog.locs.has(name)) prog.locs.set(name, gl.getUniformLocation(prog, name));
    return prog.locs.get(name);
  }
  function bind(prog, uniforms, textures) {
    let unit = 0;
    for (const [name, t] of Object.entries(textures || {})) {
      const l = loc(prog, name);
      if (l === null) continue;
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(l, unit); unit++;
    }
    for (const [name, v] of Object.entries(uniforms || {})) {
      const l = loc(prog, name);
      if (l === null) continue;
      if (typeof v === 'number') { if (INT_UNIFORMS.has(name)) gl.uniform1i(l, v); else gl.uniform1f(l, v); }
      else if (v instanceof Int32Array) { if (v.length === 2) gl.uniform2iv(l, v); else gl.uniform1iv(l, v); }
      else if (v instanceof Float32Array) gl.uniform4fv(l, v);
      else if (v.length === 2) gl.uniform2fv(l, v);
      else if (v.length === 3) gl.uniform3fv(l, v);
      else if (v.length === 4) gl.uniform4fv(l, v);
    }
  }
  function run(prog, target, uniforms, textures, bands = 1) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    const w = target ? target.w : W, h = target ? target.h : H;
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    bind(prog, Object.assign({ uRes: [w, h] }, uniforms), textures);
    if (bands <= 1) { gl.drawArrays(gl.TRIANGLES, 0, 3); return; }
    gl.enable(gl.SCISSOR_TEST);
    for (let b = 0; b < bands; b++) {
      const y0 = Math.floor(h * b / bands), y1 = Math.floor(h * (b + 1) / bands);
      gl.scissor(0, y0, w, y1 - y0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.flush();
    }
    gl.disable(gl.SCISSOR_TEST);
  }
  const _px = new Uint8Array(4);
  function gpuSync() { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, _px); }
  const timing = !!options.timing;
  function timed(label, fn) {
    if (!timing) return fn();
    gpuSync(); const t0 = performance.now(); const r = fn(); gpuSync();
    TIMES[label] = performance.now() - t0; return r;
  }

  // ---------------------------------------------------------------- programs and buffers
  const P = {
    lit4: compile(LIT_FS({ paintTex: true }), 'lit4'),
    lit5: compile(LIT_FS({ paintTex: false }), 'lit5'),
    seed: compile(STROKE_FS, 'stroke', SEED_VS),
    mote: compile(MOTE_FS, 'mote', SEED_VS),
    blur: compile(BLUR_FS, 'blur'), down: compile(DOWN_FS, 'down'), copy: compile(COPY_FS, 'copy'),
    skyonly: compile(SKYONLY_FS, 'skyonly'), wrap: compile(WRAP_FS, 'wrap'), comp: compile(COMP_FS, 'comp'),
    fin: compile(FINISH_FS, 'finish'), sky5: compile(SKY5_FS, 'sky5'), ghost: compile(GHOST_FS, 'ghost'),
    clawd: compile(CLAWD_FS, 'clawd'),
    lines: compile(LINE_FS, 'lines', LINE_VS),
  };
  // lines of light: one instanced quad per segment (attributes: a, b, [width, I, glow, 0], rgb)
  const lineVao = gl.createVertexArray(), lineBuf = gl.createBuffer();
  gl.bindVertexArray(lineVao); gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
  [[0, 3, 0], [1, 3, 12], [2, 4, 24], [3, 3, 40]].forEach(([l, n, off]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 52, off); gl.vertexAttribDivisor(l, 1); });
  gl.bindVertexArray(vao);
  const T = {
    col: tex(W, H, 'f16'), aux: tex(W, H, 'f32'),
    under: tex(W, H, 'f16'), paint: tex(W, H, 'f16'), kc: tex(W, H, 'f16'), comp: tex(W, H, 'f16'),
    h1: tex(W >> 1, H >> 1, 'f16'), h2: tex(W >> 1, H >> 1, 'f16'),
    q1: tex(W >> 2, H >> 2, 'f16'), q2: tex(W >> 2, H >> 2, 'f16'),
    s1: tex(W >> 4, H >> 4, 'f16'), s2: tex(W >> 4, H >> 4, 'f16'),
  };
  const FB = {
    scene: fbo([T.col, T.aux]), under: fbo([T.under]), paint: fbo([T.paint]), kc: fbo([T.kc]), comp: fbo([T.comp]),
    h1: fbo([T.h1]), h2: fbo([T.h2]), q1: fbo([T.q1]), q2: fbo([T.q2]), s1: fbo([T.s1]), s2: fbo([T.s2]),
  };
  function blur(src, tmpFb, dstFb, sigma) {
    run(P.blur, tmpFb, { uDir: [1, 0], uSigma: sigma }, { uSrc: src });
    run(P.blur, dstFb, { uDir: [0, 1], uSigma: sigma }, { uSrc: tmpFb.t });
  }

  // ---------------------------------------------------------------- seed lattices (fixed per shot)
  // (fork seeding options: fref, the focal length the lattices are sized for, for long lenses;
  //  noSky, no sky or cloud strokes, for a camera that never sees the sky)
  const S = seeding;
  const Fref = S.fref || 1400;
  function skyLattice(cell) {
    const step = cell / Fref, A = S.halfAngle + 0.12;
    const nc = Math.ceil(2 * A / step), nr = Math.ceil(1.1 / step);
    return { fam: FAM.SKY, n: nc * nr, dims: new Int32Array([nc, nr]), lat: [S.yaw - A, -0.06, step, 0], lat2: [0, 0, 0, 0] };
  }
  function terrainLattice(cell, d1) {
    const c = 1.3 * cell / Fref;
    const nc = Math.ceil(2 * S.halfAngle / c), nr = Math.ceil(Math.log(Math.min(d1, S.d1) / S.d0) / c);
    return { fam: FAM.TERRAIN, n: nc * nr, dims: new Int32Array([nc, nr]), lat: [S.origin[0], S.origin[1], c, S.yaw], lat2: [S.d0, S.halfAngle, 0, 0] };
  }
  function perObject(fam, count, per, nu = 0) {
    return { fam, n: count * per, dims: new Int32Array([per, count]), lat: [nu, 0, 0, 0], lat2: [0, 0, 0, 0] };
  }
  const pow2 = (x, lo, hi) => Math.min(hi, Math.max(lo, 1 << Math.ceil(Math.log2(Math.max(x, 1)))));
  function canopyN(cell, near) { const sp = cell * near / Fref; return pow2(4 * Math.PI * 0.65 * 0.65 / (sp * sp), 64, 8192); }
  function trunkNU(cell, near) { const sp = cell * near / Fref; const nu = pow2(2 * Math.PI * 0.16 / sp, 8, 64); const nv = pow2(1.5 / sp, 4, 128); return [nu, nu * nv]; }
  function towerNU(cell, near) { const sp = cell * near / Fref; const nu = pow2(8 * 0.83 * 1.3 / sp, 8, 64); const nv = pow2(30 / sp, 8, 256); return [nu, nu * nv]; }
  const nearTree = S.nearTree || 8, nearTower = S.nearTower || 45;
  const STROKE_LAYERS = [
    { cell: 16, len: 64, wid: 18, seed: 1, skip: 0 },
    { cell: 9, len: 36, wid: 11, seed: 2, skip: 0 },
    { cell: 5, len: 17, wid: 6, seed: 3, skip: 0.7 },
  ].map((L) => {
    const [tnu, tn] = trunkNU(L.cell, nearTree), [wnu, wn] = towerNU(L.cell, nearTower);
    const draws = [
      ...(S.noSky ? [] : [skyLattice(L.cell)]),
      terrainLattice(L.cell, L.cell < 6 ? 45 : 1e9),
      ...(S.noSky ? [] : [perObject(FAM.CLOUD, CLOUDS.length, pow2(900 / Math.pow(L.cell * 150 / Fref, 2), 64, 4096))]),
      perObject(FAM.CANOPY, 11, canopyN(L.cell, nearTree)),
    ];
    if (L.cell < 12) draws.push(perObject(FAM.TRUNK, 4, tn, tnu));
    // towers take no strokes: Clawd's new constructions stay clean inside the painting
    return Object.assign(L, { draws });
  });
  // motes: the lattice is sized for the fraction kept (keep), so it can be coarser
  const MOTE_LAYERS = [
    { cell: 4, size: 1.4, seed: 11 }, { cell: 9, size: 2.4, seed: 12 }, { cell: 22, size: 4.5, seed: 13 },
  ].map((L) => {
    const keep = { terrain: 0.1, cloud: 0.45, canopy: 0.35, trunk: 0.12, tower: 0.2 };
    const eff = (k) => L.cell / Math.sqrt(k);
    const [tnu, tn] = trunkNU(eff(keep.trunk), nearTree), [wnu, wn] = towerNU(eff(keep.tower), nearTower);
    const draws = [
      Object.assign(terrainLattice(eff(keep.terrain), 60), { keep: keep.terrain }),
      Object.assign(perObject(FAM.CLOUD, CLOUDS.length, pow2(900 / Math.pow(eff(keep.cloud) * 150 / Fref, 2), 64, 4096)), { keep: keep.cloud }),
      Object.assign(perObject(FAM.CANOPY, 11, canopyN(eff(keep.canopy), nearTree)), { keep: keep.canopy }),
      Object.assign(perObject(FAM.TRUNK, 4, tn, tnu), { keep: keep.trunk }),
      Object.assign(perObject(FAM.TOWER, 64, wn, wnu), { keep: keep.tower }),
    ];
    return Object.assign(L, { draws });
  });
  const air = S.air || null;   // { min: [x,y,z], size: [sx,sy,sz], n }
  {
    const nS = STROKE_LAYERS.reduce((a, L) => a + L.draws.reduce((b, d) => b + d.n, 0), 0);
    const nM = MOTE_LAYERS.reduce((a, L) => a + L.draws.reduce((b, d) => b + d.n, 0), 0);
    LOG(`hill: ${W}x${H}, stroke seeds ${nS}, mote seeds ${nM}`);
  }

  // ---------------------------------------------------------------- state -> uniforms
  const isLook = (st) => st.rung < 5 && st.look !== 'luminous';
  const palCache = new WeakMap();
  const linPal = (p) => { if (!palCache.has(p)) palCache.set(p, palLinear(p)); return palCache.get(p); };

  function sceneUniforms(st) {
    const B = camBasis(st.cam);
    const U = {
      uCamPos: B.pos, uCamFw: B.fw, uCamR: B.right, uCamU: B.up, uF: B.F, uPP: B.pp,
      uSun: sunDir(st.sun.az, st.sun.el), uTime: st.time, uK: K,
    };
    // terrain
    const hA = new Float32Array(16), hS = new Float32Array(16);
    let maxH = 0;
    for (let i = 0; i < 4; i++) {
      const b = st.hill[i];
      if (b) { hA.set([b[0], b[1], b[2], 0], i * 4); hS.set([1 / b[3], 1 / b[4], 0, 0], i * 4); maxH += Math.max(b[0], 0); }
      else { hA.set([0, 0, 0, 0], i * 4); hS.set([1, 1, 0, 0], i * 4); }
    }
    U.uHillA = hA; U.uHillS = hS;
    // figure
    if (st.human) {
      const h = st.human, y = h.y !== undefined ? h.y : hillH(st.hill, h.x, h.z);
      const HF = [Math.sin(h.yaw), 0, Math.cos(h.yaw)], HR = [Math.cos(h.yaw), 0, -Math.sin(h.yaw)];
      const c = HUMAN_BOUND.c;
      const bw = v3.add([h.x, y, h.z], v3.add(v3.add(v3.mul(HF, c[0]), [0, c[1], 0]), v3.mul(HR, c[2])));
      Object.assign(U, { uHumanOn: 1, uHPos: [h.x, y, h.z], uHF: HF, uHR: HR, uHB: [...bw, HUMAN_BOUND.r] });
      maxH = Math.max(maxH, y + 1);
    } else Object.assign(U, { uHumanOn: 0, uHPos: [0, -50, 0], uHF: [0, 0, 1], uHR: [1, 0, 0], uHB: [0, -50, 0, 0.1] });
    // tree
    if (st.tree && st.tree.grow > 0) {
      const t = st.tree, y = t.y !== undefined ? t.y : hillH(st.hill, t.x, t.z);
      const g = treeGrow(t.grow);
      Object.assign(U, {
        uTreeOn: 1, uTPos: [t.x, y, t.z], uTB: [t.x + TREE_BOUND.c[0], y + TREE_BOUND.c[1], t.z + TREE_BOUND.c[2], TREE_BOUND.r],
        uTrA: g.trA, uTrB: g.trB, uCan: g.can, uCanG: g.canG, uCanK: g.canK, uLeafAmp: g.leafAmp,
      });
      maxH = Math.max(maxH, y + 3.6);
    } else {
      Object.assign(U, { uTreeOn: 0, uTPos: [0, -50, 0], uTB: [0, -50, 0, 0.1], uTrA: new Float32Array(16), uTrB: new Float32Array(16),
        uCan: new Float32Array(44), uCanG: new Float32Array(44), uCanK: 0.1, uLeafAmp: 0 });
    }
    U.uMaxH = maxH + 0.3;
    // Clawd's light
    const c = st.clawd;
    const cy = c && (c.y !== undefined ? c.y : hillH(st.hill, c.x, c.z));
    if (c) U.uCGlow = [c.x, cy + (c.hop || 0) + 5 * c.u * (1 - 0.2 * (c.sit || 0)), c.z, (c.glow ?? 1) * (c.light ?? 1) * (c.alpha ?? 1)];
    else U.uCGlow = [0, -50, 0, 0];
    // towers
    const tA = new Float32Array(256), tB = new Float32Array(256);
    const tw = (st.towers || []).slice(0, 64);
    tw.forEach((q, i) => { tA.set([q.x, q.z, q.w, q.h], i * 4); tB.set([q.taper || 0, q.cap || 0, q.rot || 0, q.lit ?? 0.5], i * 4); });
    Object.assign(U, { uNTow: tw.length, uTowA: tA, uTowB: tB, uTowWin: st.towerWin ?? 0.6, uTowEdge: st.towerEdge ?? 0, uCityPulse: st.cityPulse || 0 });
    // ring
    if (st.ring && st.ring.on > 0) {
      const n = v3.norm(st.ring.n);
      const e1 = v3.norm(v3.cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
      Object.assign(U, { uRing: st.ring.on, uRingC: [...st.ring.c, st.ring.R], uRingN: [...n, st.ring.w], uRingE1: e1 });
    } else Object.assign(U, { uRing: 0, uRingC: [0, 0, 100, 10], uRingN: [0, 0, 1, 1], uRingE1: [1, 0, 0] });
    // fork option: the river (points x, z, half width; w = arc length to the point)
    const rv = st.river && st.river.pts && st.river.pts.length > 1 ? st.river.pts.slice(0, 16) : null;
    const rA = new Float32Array(64);
    if (rv) {
      let s = 0;
      rv.forEach((q, i) => { if (i) s += Math.hypot(q[0] - rv[i - 1][0], q[1] - rv[i - 1][1]); rA.set([q[0], q[1], q[2], s], i * 4); });
    }
    Object.assign(U, { uRivN: rv ? rv.length : 0, uRiv: rA, uRivHead: rv ? (st.river.head ?? 1e4) : 0, uRivFlow: rv ? (st.river.flow ?? st.time) : 0 });
    U.uStrokeLift = st.strokeLift || 0;
    U.uTowHaze = st.towerHaze || 0;
    U.uCloudOff = v3.mul(CLOUD_DRIFT, st.time);
    // look
    const r5 = st.rung >= 5;
    Object.assign(U, {
      uGridA: st.grid ?? (r5 ? 0 : 0.75), uFloorGrid: st.floorGrid ?? (r5 ? 0.8 : 0.4), uFog: st.fog ?? (r5 ? 0.02 : 0.014), uTowFog: st.towerFog ?? 0.5,
      uAuraK: st.aura ?? (r5 ? 0 : 0.85), uAuraS: 0.52,
    });
    // (fork option, revision 3: palLin, a palette already in linear light, e.g. palMix(...) of two,
    // for a sky that turns to night; it wins over pal)
    // revision 4: the painted-valley look (rung 4 unless look: 'luminous')
    const look = isLook(st);
    let pal;
    if (look) {
      const lp = lookPal(st.drift || 0);
      pal = st.palLin || (st.pal ? linPal(st.pal) : lp);
      // (the land's key light comes round from the sun's side toward the camera, as the valley's does,
      // so the faces of the hills read in the paint)
      const ke = (st.keyEl ?? 30) * Math.PI / 180, ka = (st.keyAz ?? st.sun.az + 62) * Math.PI / 180;
      Object.assign(U, {
        uDrift: st.drift || 0, uHaze: st.haze ?? 1, uProps: st.props === false ? 0 : 1, uMtn: st.mountains ?? 1, uSalt: st.salt || 0,
        uKey: [Math.sin(ka) * Math.cos(ke), Math.sin(ke), Math.cos(ka) * Math.cos(ke)],
        uGridA: st.grid ?? 0.3, uAuraK: st.aura ?? 0.45, uLeafAmp: 0,
      });
      for (const k of LOOK_KEYS) U[k] = (st.palLin && st.palLin[k]) || lp[k];
      U.uMaxH = Math.max(U.uMaxH, 3.6);
    } else pal = st.palLin || linPal(st.pal || (r5 ? SHELTER : PAL4));
    for (const k of PAL_KEYS) U[k] = pal[k];
    return { U, B, clawdY: cy };
  }

  // ---------------------------------------------------------------- passes
  function litPass(prog, U) {
    run(prog, FB.scene, U, {}, 4);
  }
  function lightWrap(U, k, sigma) {
    run(P.skyonly, FB.h2, {}, { uCol: T.col, uAux: T.aux });
    blur(T.h2, FB.h1, FB.h2, sigma * K);
    run(P.wrap, FB.under, { uK: k }, { uCol: T.col, uAux: T.aux, uWrap: T.h2 });
  }
  function seedDraws(prog, target, layers, U, mode, extra) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, W, H);
    gl.useProgram(prog);
    gl.bindVertexArray(emptyVao);
    gl.enable(gl.BLEND);
    if (mode === 0) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); else gl.blendFunc(gl.ONE, gl.ONE);
    bind(prog, Object.assign({ uRes: [W, H], uMode: mode }, U), { uUnder: mode === 0 ? T.under : T.col, uAux: T.aux });
    let n = 0;
    for (const L of layers) {
      for (const d of L.draws) {
        if (extra.skipFam && extra.skipFam.has(d.fam)) continue;
        bind(prog, {
          uFam: d.fam, uDims: d.dims, uLat: d.lat, uLat2: d.lat2, uSalt: L.seed * 13 + d.fam, uCell: L.cell,
          uSize: mode === 0 ? [L.len, L.wid] : [L.size, 0], uSkip: d.fam === FAM.SKY ? L.skip : 0,
          uKeep: d.keep ?? 1, uBloom: extra.bloom ?? 1,
        });
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, d.n);
        n += d.n;
      }
    }
    if (mode === 1 && air && air.n > 0) {
      bind(prog, { uFam: FAM.AIR, uDims: new Int32Array([air.n, 1]), uLat: [...air.min, 0], uLat2: [...air.size, 0], uSalt: 99,
        uCell: 10, uSize: [air.sizePx || 2.2, 0], uSkip: 0, uKeep: 1, uBloom: (extra.bloom ?? 1) * (air.bright ?? 1) });
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, air.n);
      n += air.n;
    }
    gl.disable(gl.BLEND);
    gl.bindVertexArray(vao);
    return n;
  }
  function clawdPass(st, B, clawdY) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.kc);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (st.crowd && st.crowd.length) return crowdPass(st, B, clawdY);
    return oneClawd(st.clawd, B, clawdY);
  }
  // fork option: the crowd. Every Clawd (the main one too) goes premultiplied-over, far to near,
  // into the crisp layer, depth-tested against the scene like the main one. Only the main one
  // lights the land.
  function crowdPass(st, B, clawdY) {
    const d0 = defaultState().clawd, dist = (c, y) => v3.len(v3.sub([c.x, y, c.z], B.pos));
    const all = [];
    for (const q of st.crowd) {
      const c = Object.assign({}, d0, q);
      if ((c.alpha ?? 1) <= 0.002) continue;
      const y = c.y !== undefined ? c.y : hillH(st.hill, c.x, c.z);
      all.push({ c, y, d: dist(c, y) });
    }
    if (st.clawd) all.push({ c: st.clawd, y: clawdY, d: dist(st.clawd, clawdY), main: true });
    all.sort((a, b) => b.d - a.d);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    let info = null;
    for (const q of all) { const r = oneClawd(q.c, B, q.y); if (q.main) info = r; }
    gl.disable(gl.BLEND);
    return info;
  }
  // fork option: lines of light, added into the composite (linear light) before bloom
  function linePass(st, B) {
    const segs = st.lines, near = 0.25;
    const data = new Float32Array(segs.length * 13); let n = 0;
    const zc = (p) => v3.dot(v3.sub(p, B.pos), B.fw);
    for (const s of segs) {
      let a = [s[0], s[1], s[2]], b = [s[3], s[4], s[5]];
      const za = zc(a), zb = zc(b);
      if (za < near && zb < near) continue;
      if (za < near) a = v3.lerp(a, b, (near - za) / (zb - za));
      else if (zb < near) b = v3.lerp(b, a, (near - zb) / (za - zb));
      data.set([a[0], a[1], a[2], b[0], b[1], b[2], s[6], s[7], s[11] ?? 6, 0, s[8], s[9], s[10]], n * 13); n++;
    }
    if (!n) return 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.comp); gl.viewport(0, 0, W, H);
    gl.useProgram(P.lines); gl.bindVertexArray(lineVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf); gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 13), gl.DYNAMIC_DRAW);
    bind(P.lines, { uCamPos: B.pos, uCamFw: B.fw, uCamR: B.right, uCamU: B.up, uF: B.F, uPP: B.pp, uK: K, uRes: [W, H], uDepthK: st.lineDepth ?? 1, uClawdK: st.linesOverClawd ? 0 : 1 }, { uAux: T.aux, uClawd: T.kc });
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    gl.disable(gl.BLEND); gl.bindVertexArray(vao);
    return n;
  }
  // fork option (revision 3): ribbons of luminous paint. The bands are built here on the CPU: each
  // point's side vector (given, or turned to face the camera), projected edges widened to a minimum
  // on screen, then every quad sorted far to near and drawn premultiplied-over into the composite.
  let ribVao = null, ribBuf = null;
  function ribbonPass(st, B) {
    if (!P.ribbon) {
      P.ribbon = compile(RIBBON_FS, 'ribbon', RIBBON_VS);
      ribVao = gl.createVertexArray(); ribBuf = gl.createBuffer();
      gl.bindVertexArray(ribVao); gl.bindBuffer(gl.ARRAY_BUFFER, ribBuf);
      [0, 1, 2].forEach((l) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 48, l * 16); });
      gl.bindVertexArray(vao);
    }
    const minPx = st.ribbonMinPx ?? 1.1, near = 0.2;
    const quads = [];
    const sub = v3.sub, add = v3.add, mul = v3.mul, dot = v3.dot, cross = v3.cross, norm = v3.norm;
    for (const rb of st.ribbons) {
      const Pp = rb.P, n = Pp.length;
      if (!n || n < 2) continue;
      const seed = rb.seed ?? 0.37;
      const V = [];   // per point: [xl, yl, zl, dl, xr, yr, zr, dr, u, face, r, g, b, a]
      let u = 0;
      for (let i = 0; i < n; i++) {
        const p = Pp[i];
        if (i) u += v3.len(sub(p, Pp[i - 1]));
        const T = norm(sub(Pp[Math.min(n - 1, i + 1)], Pp[Math.max(0, i - 1)]));
        const view = norm(sub(p, B.pos));
        let bbS = norm(cross(T, view));
        let s;
        if (rb.S && rb.S[i]) {
          const g = rb.S[i];
          s = norm(sub(g, mul(T, dot(g, T))));
          const b = rb.bb ? rb.bb[i] : 0;
          if (b > 0) { if (dot(bbS, s) < 0) bbS = mul(bbS, -1); s = norm(add(mul(s, 1 - b), mul(bbS, b))); }
        } else s = bbS;
        const w = Array.isArray(rb.w) ? rb.w[i] : rb.w;
        const face = Math.abs(dot(norm(cross(T, s)), view));
        const pl = add(p, mul(s, w)), pr = sub(p, mul(s, w));
        const c0 = project(B, p), l = project(B, pl), r = project(B, pr);
        // the band's minimum width across its own screen direction
        const a0 = project(B, Pp[Math.max(0, i - 1)]), a1 = project(B, Pp[Math.min(n - 1, i + 1)]);
        let tx = a1[0] - a0[0], ty = a1[1] - a0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const nx = -ty, ny = tx, hp = (l[0] - c0[0]) * nx + (l[1] - c0[1]) * ny;
        if (Math.abs(hp) < minPx) {
          const adj = (hp >= 0 ? minPx : -minPx) - hp;
          l[0] += nx * adj; l[1] += ny * adj; r[0] -= nx * adj; r[1] -= ny * adj;
        }
        const col = Array.isArray(rb.col[0]) ? rb.col[i] : rb.col;
        const al = rb.a === undefined ? 1 : (typeof rb.a === 'number' ? rb.a : rb.a[i]);
        // (design px y down -> GL px y up; the design height is H / K, which is 1080 only at 16:9)
        V.push([l[0] * K, (H / K - l[1]) * K, l[2], v3.len(sub(pl, B.pos)), r[0] * K, (H / K - r[1]) * K, r[2], v3.len(sub(pr, B.pos)),
          rb.u ? rb.u[i] : u, face, col[0], col[1], col[2], al]);
      }
      for (let i = 0; i + 1 < n; i++) {
        const a = V[i], b = V[i + 1];
        if (a[2] < near || a[6] < near || b[2] < near || b[6] < near) continue;
        if (a[13] <= 0.002 && b[13] <= 0.002) continue;
        quads.push({ d: a[3] + a[7] + b[3] + b[7], a, b, seed });
      }
    }
    if (!quads.length) return 0;
    quads.sort((q, r) => r.d - q.d);
    const data = new Float32Array(quads.length * 6 * 12);
    let o = 0;
    const put = (q, side, v, seed) => {
      const k = side ? 4 : 0;
      data.set([q[k], q[k + 1], q[k + 2], q[k + 3], q[8], v, q[9], seed, q[10], q[11], q[12], q[13]], o); o += 12;
    };
    for (const q of quads) {
      put(q.a, 0, -1, q.seed); put(q.a, 1, 1, q.seed); put(q.b, 0, -1, q.seed);
      put(q.b, 0, -1, q.seed); put(q.a, 1, 1, q.seed); put(q.b, 1, 1, q.seed);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.comp); gl.viewport(0, 0, W, H);
    gl.useProgram(P.ribbon); gl.bindVertexArray(ribVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, ribBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    bind(P.ribbon, { uRes: [W, H], uPaint: st.ribbonPaint ?? 1, uCore: st.ribbonCore ?? 0.5 }, { uAux: T.aux, uClawd: T.kc });
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, quads.length * 6);
    gl.disable(gl.BLEND); gl.bindVertexArray(vao);
    return quads.length;
  }
  function oneClawd(c, B, clawdY) {
    if (!c || (c.alpha ?? 1) <= 0) return null;
    const ground = [c.x, clawdY + (c.hop || 0), c.z];
    const pr = project(B, ground);
    if (pr[2] <= 0.1) return null;
    const Upx = B.F * c.u / pr[2];                        // design px per glyph unit
    const x0 = pr[0] - 9 * Upx, y0 = pr[1] - 10 * Upx - (c.dy || 0) * Upx;   // (dy: sprite lift, glyph units)
    // (revision 11) the luminous solid's extrusion, in glyph units: the back face shifts toward the
    // camera's axis as a solid 2.4 units deep would in perspective, plus a slight lower-right bias
    const ex0 = -(pr[0] - B.pp[0]) / B.F * 2.4 + 0.16, ey0 = -(pr[1] - 5 * Upx - B.pp[1]) / B.F * 2.4 + 0.2, el = Math.hypot(ex0, ey0);
    const ext = el > 1.2 ? [ex0 * 1.2 / el, ey0 * 1.2 / el] : [ex0, ey0];
    const depth = v3.len(v3.sub(v3.add(ground, [0, 5 * c.u, 0]), B.pos));
    const form = c.form === 'radiant' ? 1 : 0;
    const grid = !form && c.grid ? (c.grid instanceof Int32Array ? c.grid : gridBits(c.grid)) : null;
    const pad = form ? 8 : grid ? 3 : 1.5, padTop = grid ? 7 : pad;
    const bx0 = Math.floor((x0 - pad * Upx) * K), bx1 = Math.ceil((x0 + (18 + pad) * Upx) * K);
    const by0 = Math.floor((y0 - padTop * Upx) * K), by1 = Math.ceil((y0 + (10 + pad) * Upx) * K);
    gl.useProgram(P.clawd);
    gl.bindVertexArray(vao);
    bind(P.clawd, {
      uRes: [W, H], uK: K, uGeo: [x0, y0, Upx, depth], uForm: form, uSit: c.sit || 0, uGlow: c.glow ?? 1,
      uRays: c.rays ?? 1, uAlpha: c.alpha ?? 1, uEyeLight: c.eyeLight ?? 0.5,
      uLegX: c.legs || [4.5, 6.5, 11.5, 13.5], uPose: [c.look || 0, c.arch ? 1 : 0, c.armL || 0, c.armR || 0],
      uGridOn: grid ? 1 : 0, uGB: grid || new Int32Array(24),
      uExt: ext,
    }, { uAux: T.aux });
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(Math.max(0, bx0), Math.max(0, H - by1), Math.max(1, bx1 - bx0), Math.max(1, by1 - by0));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    return { x: pr[0], y: pr[1] - 5 * Upx, U: Upx };
  }
  // fork option (revision 10): decals. An atlas image (only its alpha: the film's code as white text)
  // laid in the world on CPU-built quads, perspective-correct, added as light before the bloom.
  let decalTex = null, decalKey, decalVao = null, decalBuf = null;
  function decalPass(st, B) {
    const dc = st.decals;
    if (!P.decal) {
      P.decal = compile(DECAL_FS, 'decal', RIBBON_VS);
      decalVao = gl.createVertexArray(); decalBuf = gl.createBuffer();
      gl.bindVertexArray(decalVao); gl.bindBuffer(gl.ARRAY_BUFFER, decalBuf);
      [0, 1, 2].forEach((l) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 48, l * 16); });
      gl.bindVertexArray(vao);
    }
    if (!decalTex || decalKey !== dc.key) {
      if (!decalTex) decalTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, decalTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, dc.src);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const an = gl.getExtension('EXT_texture_filter_anisotropic');
      if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      decalTex.w = dc.src.width; decalTex.h = dc.src.height; decalKey = dc.key;
    }
    const near = 0.2, data = [];
    for (const q of dc.quads) {
      const al = Array.isArray(q.a) ? q.a : [q.a ?? 1, q.a ?? 1, q.a ?? 1, q.a ?? 1];
      if (Math.max(...al) <= 0.002) continue;
      const v = q.P.map((p) => { const s = project(B, p); return [s[0] * K, (H / K - s[1]) * K, s[2], v3.len(v3.sub(p, B.pos))]; });
      if (v.some((x) => x[2] < near)) continue;
      const u0 = q.uv[0] / decalTex.w, v0 = q.uv[1] / decalTex.h, u1 = q.uv[2] / decalTex.w, v1 = q.uv[3] / decalTex.h;
      const uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];      // corners: bottom-left, bottom-right, top-right, top-left
      const c = q.col;
      const vert = (i) => [...v[i], uv[i][0], uv[i][1], 0, 0, c[0], c[1], c[2], al[i]];
      data.push(...vert(0), ...vert(1), ...vert(2), ...vert(0), ...vert(2), ...vert(3));
    }
    if (!data.length) return 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.comp); gl.viewport(0, 0, W, H);
    gl.useProgram(P.decal); gl.bindVertexArray(decalVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, decalBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    bind(P.decal, { uRes: [W, H] }, { uAux: T.aux, uClawd: T.kc, uAtlas: decalTex });
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 12);
    gl.disable(gl.BLEND); gl.bindVertexArray(vao);
    return data.length / 72;
  }
  function bloomAndFinish(src, thr, b1, b2, fin) {
    run(P.down, FB.q1, { uThr: thr }, { uSrc: src });
    blur(T.q1, FB.q2, FB.q1, 6 * K);
    run(P.down, FB.s1, { uThr: 0 }, { uSrc: T.q1 });
    blur(T.s1, FB.s2, FB.s1, 9 * K);
    run(P.fin, null, Object.assign({ uBloom1: b1, uBloom2: b2, uK: K }, fin), { uCol: src, uB1: T.q1, uB2: T.s1, uClawd: T.kc });
  }

  // ---------------------------------------------------------------- render
  function render(state) {
    const d0 = defaultState();
    const st = Object.assign({}, d0, state);
    for (const k of ['cam', 'sun', 'dome']) st[k] = Object.assign({}, d0[k], state[k] || {});
    st.clawd = state.clawd === null ? null : Object.assign({}, d0.clawd, state.clawd || {});
    st.tree = state.tree === null ? null : Object.assign({}, d0.tree, state.tree || {});
    const { U, B, clawdY } = sceneUniforms(st);
    const t0 = performance.now();
    let info = null;
    if (st.rung >= 5) {
      timed('scene', () => litPass(P.lit5, U));
      // sky threads -> under; ghost -> paint; motes on top
      timed('sky', () => run(P.sky5, FB.under, Object.assign({ uDomeMer: st.dome.mer, uDomeLat: st.dome.lat, uDomeFade: st.dome.fade || 0 }, U), { uCol: T.col, uAux: T.aux }));
      timed('ghost', () => run(P.ghost, FB.paint, Object.assign({ uGhost: st.ghost, uContour: st.contour, uContourStep: st.contourStep, uEdgeK: st.edge }, U), { uCol: T.under, uAux: T.aux }));
      if (st.motes > 0) timed('motes', () => { TIMES.nMotes = seedDraws(P.mote, FB.paint, MOTE_LAYERS, Object.assign({ uMoteNear: st.moteNear ?? 3.5, uMoteRise: st.moteRise ?? 0.9 }, U), 1, { bloom: st.motes }); });
      info = timed('clawd', () => clawdPass(st, B, clawdY));
      run(P.comp, FB.comp, { uDim: dimRGB(st.dim) }, { uPaint: T.paint, uClawd: T.kc });
      if (st.ribbons && st.ribbons.length) timed('ribbons', () => { TIMES.nRibbon = ribbonPass(st, B); });
      if (st.lines && st.lines.length) timed('lines', () => { TIMES.nLines = linePass(st, B); });
      if (st.decals && st.decals.quads && st.decals.quads.length) timed('decals', () => { TIMES.nDecals = decalPass(st, B); });
      timed('post', () => bloomAndFinish(T.comp, 0.7, st.bloom1 ?? 0.5, st.bloom2 ?? 0.8,
        { uVig: st.vignette ?? 0.22, uGrain: 0.02, uWeave: 0, uCurve: 0, uExposure: st.exposure }));
    } else if (isLook(st)) {
      if (!P.lit4v) P.lit4v = compile(LIT_FS({ paintTex: true, look: true }), 'lit4v');
      timed('scene', () => litPass(P.lit4v, U));
      run(P.copy, FB.under, {}, { uSrc: T.col });
      run(P.copy, FB.paint, {}, { uSrc: T.under });
      if ((st.strokeLift || 0) > 0 && st.paint > 0) timed('strokes', () => { TIMES.nStrokes = seedDraws(P.seed, FB.paint, STROKE_LAYERS, Object.assign({ uMoteOnly: 1 }, U), 0, {}); });
      info = timed('clawd', () => clawdPass(st, B, clawdY));
      run(P.comp, FB.comp, { uDim: dimRGB(st.dim) }, { uPaint: T.paint, uClawd: T.kc });
      if (st.ribbons && st.ribbons.length) timed('ribbons', () => { TIMES.nRibbon = ribbonPass(st, B); });
      if (st.lines && st.lines.length) timed('lines', () => { TIMES.nLines = linePass(st, B); });
      if (st.decals && st.decals.quads && st.decals.quads.length) timed('decals', () => { TIMES.nDecals = decalPass(st, B); });
      timed('post', () => bloomAndFinish(T.comp, 0.85, st.bloom1 ?? 0.3, st.bloom2 ?? 0.38,
        { uVig: st.vignette ?? 0.16, uGrain: 0.008, uWeave: 0, uCurve: 0.16, uExposure: st.exposure }));
    } else {
      timed('scene', () => litPass(P.lit4, U));
      timed('wrap', () => lightWrap(U, 0.3, 3.5));
      run(P.copy, FB.paint, {}, { uSrc: T.under });
      if (st.paint > 0) timed('strokes', () => { TIMES.nStrokes = seedDraws(P.seed, FB.paint, STROKE_LAYERS, U, 0, {}); });
      info = timed('clawd', () => clawdPass(st, B, clawdY));
      run(P.comp, FB.comp, { uDim: dimRGB(st.dim) }, { uPaint: T.paint, uClawd: T.kc });
      if (st.ribbons && st.ribbons.length) timed('ribbons', () => { TIMES.nRibbon = ribbonPass(st, B); });
      if (st.lines && st.lines.length) timed('lines', () => { TIMES.nLines = linePass(st, B); });
      if (st.decals && st.decals.quads && st.decals.quads.length) timed('decals', () => { TIMES.nDecals = decalPass(st, B); });
      timed('post', () => bloomAndFinish(T.comp, 0.8, st.bloom1 ?? 0.45, st.bloom2 ?? 0.65,
        { uVig: st.vignette ?? 0.25, uGrain: 0.03, uWeave: 0.04, uCurve: 0.3, uExposure: st.exposure }));
    }
    TIMES.total = performance.now() - t0;
    return info;
  }

  // render a throwaway frame per rung so the driver's first frame does not pay for compiles
  function warm(rungs = [4, 5]) { for (const r of rungs) render({ rung: r }); gpuSync(); }
  return { render, warm, W, H, K, gl, TIMES, basis: camBasis, gpuSync };
}
