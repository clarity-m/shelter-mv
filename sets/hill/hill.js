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
} from './scene.js';
import { PAL4, SHELTER, palLinear, PAL_KEYS } from './palettes.js';
import {
  LIT_FS, SEED_VS, STROKE_FS, MOTE_FS, BLUR_FS, DOWN_FS, COPY_FS, SKYONLY_FS, WRAP_FS, COMP_FS, FINISH_FS,
  SKY5_FS, GHOST_FS, CLAWD_FS, EXTRAS_FS, FAM, CLAWDVOL_FS,
} from './glsl.js';
import { gridBits } from './clawd-pose.js';

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
    kites: null, people: null,                 // see extrasPass (the shelter's kites and distant figures)
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

const INT_UNIFORMS = new Set(['uNTow', 'uFam', 'uMode', 'uGridOn', 'uNKite', 'uNPer', 'uNTre']);

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
    clawd: compile(CLAWD_FS, 'clawd'), extras: compile(EXTRAS_FS, 'extras'), vol: compile(CLAWDVOL_FS, 'vol'),
  };
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
  const Fref = 1400;
  const S = seeding;
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
      skyLattice(L.cell),
      terrainLattice(L.cell, L.cell < 6 ? 45 : 1e9),
      perObject(FAM.CLOUD, CLOUDS.length, pow2(900 / Math.pow(L.cell * 150 / Fref, 2), 64, 4096)),
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
      // lean 1: torso back 17 deg, head up 21 deg, a settle of 7 deg toward her right (Clawd)
      const th = 0.3 * (h.lean || 0), ph = 0.36 * (h.lean || 0) + (h.look || 0), ps = 0.12 * (h.lean || 0);
      Object.assign(U, { uHumanOn: 1, uHPos: [h.x, y, h.z], uHF: HF, uHR: HR, uHB: [...bw, HUMAN_BOUND.r + 0.1],
        uHLean: [Math.cos(th), Math.sin(th), Math.cos(ph), Math.sin(ph)], uHTilt: [Math.cos(ps), Math.sin(ps)],
        uHYaw: [Math.cos(h.turn || 0), Math.sin(h.turn || 0)] });
      maxH = Math.max(maxH, y + 1);
    } else Object.assign(U, { uHumanOn: 0, uHPos: [0, -50, 0], uHF: [0, 0, 1], uHR: [1, 0, 0], uHB: [0, -50, 0, 0.1], uHLean: [1, 0, 1, 0], uHTilt: [1, 0], uHYaw: [1, 0] });
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
    // (revision 23) his light in the world (clawdlight.js): mix from the old term, source radius, strength, range
    const cl = st.clawdLit;
    U.uCLit = cl && cl.mix > 0 ? [cl.mix, cl.core ?? 0.3, cl.k ?? 1, cl.range ?? 5] : [0, 0, 0, 0];
    // towers
    const tA = new Float32Array(256), tB = new Float32Array(256);
    const tw = (st.towers || []).slice(0, 64);
    tw.forEach((q, i) => { tA.set([q.x, q.z, q.w, q.h], i * 4); tB.set([q.taper || 0, q.cap || 0, q.rot || 0, q.lit ?? 0.5], i * 4); });
    Object.assign(U, { uNTow: tw.length, uTowA: tA, uTowB: tB, uTowWin: st.towerWin ?? 0.6, uTowEdge: st.towerEdge ?? 0, uCityPulse: st.cityPulse || 0 });
    // (revision 19) the vocal drop's wave of warm light (shelter.js shelterState: centre x, z, radius, strength)
    U.uWave = st.wave ? [st.wave.c[0], st.wave.c[1], st.wave.r, st.wave.k] : [0, 0, 0, 0];
    U.uRingLand = st.ringLand ? [st.ringLand.k ?? 1, st.ringLand.w ?? 70, st.ringLand.wave ?? 0, st.ringLand.waveK ?? 0] : [0, 0, 0, 0];
    // ring
    if (st.ring && st.ring.on > 0) {
      const n = v3.norm(st.ring.n);
      const e1 = v3.norm(v3.cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
      Object.assign(U, { uRing: st.ring.on, uRingC: [...st.ring.c, st.ring.R], uRingN: [...n, st.ring.w], uRingE1: e1 });
    } else Object.assign(U, { uRing: 0, uRingC: [0, 0, 100, 10], uRingN: [0, 0, 1, 1], uRingE1: [1, 0, 0] });
    U.uCloudOff = v3.mul(CLOUD_DRIFT, st.time);
    // look
    const r5 = st.rung >= 5;
    Object.assign(U, {
      uGridA: st.grid ?? (r5 ? 0 : 0.75), uFloorGrid: st.floorGrid ?? (r5 ? 0.8 : 0.4), uFog: st.fog ?? (r5 ? 0.02 : 0.014), uTowFog: st.towerFog ?? 0.5,
      uAuraK: st.aura ?? (r5 ? 0 : 0.85), uAuraS: 0.52,
    });
    const pal = linPal(st.pal || (r5 ? SHELTER : PAL4));
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
  // (revision 23) Clawd's glow in the air (clawdlight.js VOL_BODY): added into the Clawd layer before his
  // body, over a box round his light's reach (st.clawdVol: { k, core, shafts, range, fall, col })
  function volPass(st, B, U) {
    const v = st.clawdVol;
    if (!v || !(v.k > 0) || !(U.uCGlow[3] > 0)) return false;
    const L = U.uCGlow.slice(0, 3), pr = project(B, L), R = v.range ?? 2;
    if (pr[2] <= 0.2) return false;
    const rp = 1.08 * B.F * R / Math.sqrt(Math.max(pr[2] * pr[2] - R * R, 0.25));
    const x0 = Math.max(0, Math.floor((pr[0] - rp) * K)), x1 = Math.min(W, Math.ceil((pr[0] + rp) * K));
    const y0 = Math.max(0, Math.floor((pr[1] - rp) * K)), y1 = Math.min(H, Math.ceil((pr[1] + rp) * K));
    if (x1 <= x0 || y1 <= y0) return false;
    gl.useProgram(P.vol);
    gl.bindVertexArray(vao);
    bind(P.vol, Object.assign({}, U, { uRes: [W, H], uVol: [v.k, v.core ?? 0.3, v.shafts ?? 0, R], uVolFall: v.fall ?? 0.6,
      uVolCol: v.col || [1.0, 0.66, 0.42] }), { uAux: T.aux });
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, H - y1, x1 - x0, y1 - y0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    return true;
  }
  function clawdPass(st, B, clawdY, U) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.kc);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const c = st.clawd;
    if (!c || (c.alpha ?? 1) <= 0) return null;
    const ground = [c.x, clawdY + (c.hop || 0), c.z];
    const pr = project(B, ground);
    if (pr[2] <= 0.1) return null;
    const Upx = B.F * c.u / pr[2];                        // design px per glyph unit
    const x0 = pr[0] - 9 * Upx, y0 = pr[1] - 10 * Upx;
    const depth = v3.len(v3.sub(v3.add(ground, [0, 5 * c.u, 0]), B.pos));
    const form = c.form === 'radiant' ? 1 : 0;
    const grid = !form && c.grid ? (c.grid instanceof Int32Array ? c.grid : gridBits(c.grid)) : null;
    const lift = (c.dy || 0) * Upx;                       // sprite lift in glyph units (hops)
    const pad = form ? 8 : grid ? 3 : 1.5, padTop = grid ? 7 : pad;
    const bx0 = Math.floor((x0 - pad * Upx) * K), bx1 = Math.ceil((x0 + (18 + pad) * Upx) * K);
    const by0 = Math.floor((y0 - lift - padTop * Upx) * K), by1 = Math.ceil((y0 - lift + (10 + pad) * Upx) * K);
    const vol = U ? volPass(st, B, U) : false;
    gl.useProgram(P.clawd);
    gl.bindVertexArray(vao);
    bind(P.clawd, {
      uRes: [W, H], uK: K, uGeo: [x0, y0 - lift, Upx, depth], uForm: form, uSit: c.sit || 0, uGlow: c.glow ?? 1,
      uRays: c.rays ?? 1, uAlpha: c.alpha ?? 1, uEyeLight: c.eyeLight ?? 0.5,
      uGridOn: grid ? 1 : 0, uGB: grid || new Int32Array(24),
      uEye: [c.eyes?.dx || 0, c.eyes?.dy || 0, c.eyes?.open ?? 1, +(c.eyes?.arch || 0)], uHalo: c.halo ?? 1,
    }, { uAux: T.aux });
    if (vol) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }   // his body over his glow
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(Math.max(0, bx0), Math.max(0, H - by1), Math.max(1, bx1 - bx0), Math.max(1, by1 - by0));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
    if (vol) gl.disable(gl.BLEND);
    return { x: pr[0], y: pr[1] - 5 * Upx, U: Upx };
  }
  // Kites and distant people (world anchors projected here, drawn by EXTRAS_FS):
  //   kites:  [{ p: [x,y,z], angle, tail, end: [x,y,z], alpha, glow }]
  //   people: [{ p: [x,z] or [x,y,z] feet, alpha, arm, scale, flip, walk: [phase, amp], glow }]
  function extrasPass(st, B, U) {
    const kites = (st.kites || []).slice(0, 4), people = (st.people || []).slice(0, 8), trees = (st.youngTrees || []).slice(0, 12);
    if (!kites.length && !people.length && !trees.length) return;
    const KA = new Float32Array(16), KB = new Float32Array(16), KC = new Float32Array(16);
    let nk = 0;
    for (const k of kites) {
      const a = project(B, k.p), e = project(B, k.end);
      if (a[2] <= 0.5) continue;
      const ee = e[2] > 0.5 ? e : [a[0], a[1] + 400, 1];
      KA.set([a[0], a[1], B.F / a[2], k.angle || 0], nk * 4); KB.set([ee[0], ee[1], k.alpha ?? 1, k.tail || 0], nk * 4);
      KC.set([v3.len(v3.sub(k.p, B.pos)), k.glow || 0, 0, 0], nk * 4); nk++;
    }
    const PA = new Float32Array(32), PB = new Float32Array(32), PC = new Float32Array(32);
    let np = 0;
    for (const q of people) {
      const f = q.p.length === 3 ? q.p : [q.p[0], hillH(st.hill, q.p[0], q.p[1]), q.p[1]];
      const a = project(B, f);
      if (a[2] <= 0.5) continue;
      PA.set([a[0], a[1], B.F / a[2], v3.len(v3.sub(f, B.pos))], np * 4);
      PB.set([q.alpha ?? 1, q.arm || 0, q.scale || 1, q.flip ? 1 : 0], np * 4);
      PC.set([q.walk ? q.walk[0] : 0, q.walk ? q.walk[1] : 0, q.glow || 0, 0], np * 4); np++;
    }
    // (revision 20) cloud-pruned pines (niwaki): { p: [x, z], h: height m, grow 0..1, seed, lean, style, pads, thick, shade }
    const RA = new Float32Array(48), RB = new Float32Array(48), RC = new Float32Array(48);
    let nt = 0;
    for (const t of trees) {
      if (!(t.grow > 0)) continue;
      const f = [t.p[0], hillH(st.hill, t.p[0], t.p[1]), t.p[1]], a = project(B, f);
      if (a[2] <= 0.5) continue;
      RA.set([a[0], a[1], B.F / a[2], v3.len(v3.sub(f, B.pos))], nt * 4); RB.set([t.grow, t.h, t.seed || 0, t.lean || 1], nt * 4);
      RC.set([t.style ?? 1, t.pads || 4, t.thick || 1, t.shade ?? 0.5], nt * 4); nt++;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.paint);
    gl.viewport(0, 0, W, H);
    gl.useProgram(P.extras);
    gl.bindVertexArray(vao);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // (revision 23) the trees' rim light comes from the sun's place on screen; their greens haze with distance
    const sunP = project(B, v3.add(B.pos, v3.mul(U.uSun, 1000)));
    bind(P.extras, { uRes: [W, H], uK: K, uNKite: nk, uNPer: np, uKA: KA, uKB: KB, uKC: KC, uPA: PA, uPB: PB, uPC: PC, uNTre: nt, uRA: RA, uRB: RB, uRC: RC,
      uWarm: st.extrasWarm || [1.0, 0.7, 0.44], uCool: st.extrasCool || [0.05, 0.045, 0.09],
      uSunPx: sunP[2] > 0 ? [sunP[0], sunP[1]] : [960, -2000], uHaze: st.treeHaze || [0.2, 0.28, 0.24], uHazeT: st.treeHazeBark || [0.28, 0.25, 0.245], uTreeFog: st.treeFog ?? 0.0075, uTime: U.uTime }, { uAux: T.aux });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
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
      timed('extras', () => extrasPass(st, B, U));
      info = timed('clawd', () => clawdPass(st, B, clawdY, U));
      run(P.comp, FB.comp, {}, { uPaint: T.paint, uClawd: T.kc });
      timed('post', () => bloomAndFinish(T.comp, 0.7, st.bloom1 ?? 0.5, st.bloom2 ?? 0.8,
        { uVig: st.vignette ?? 0.22, uGrain: 0.02, uWeave: 0, uCurve: 0, uExposure: st.exposure }));
    } else {
      timed('scene', () => litPass(P.lit4, U));
      timed('wrap', () => lightWrap(U, 0.3, 3.5));
      run(P.copy, FB.paint, {}, { uSrc: T.under });
      if (st.paint > 0) timed('strokes', () => { TIMES.nStrokes = seedDraws(P.seed, FB.paint, STROKE_LAYERS, U, 0, {}); });
      extrasPass(st, B, U);
      info = timed('clawd', () => clawdPass(st, B, clawdY, U));
      run(P.comp, FB.comp, {}, { uPaint: T.paint, uClawd: T.kc });
      timed('post', () => bloomAndFinish(T.comp, 0.8, st.bloom1 ?? 0.45, st.bloom2 ?? 0.65,
        { uVig: st.vignette ?? 0.25, uGrain: 0.03, uWeave: 0.04, uCurve: 0.3, uExposure: st.exposure }));
    }
    TIMES.total = performance.now() - t0;
    return info;
  }

  // render a throwaway frame per rung so the driver's first frame does not pay for compiles
  function warm(rungs = [4, 5]) { for (const r of rungs) render({ rung: r }); gpuSync(); }
  // (revision 23) where the figure is in the last frame rendered, from the scene's own materials (skin to
  // shoes): a w x h mask (1 = her) of the canvas box at x0, y0 (canvas px, y down), 0 off the canvas.
  // S31's forming outline uses it, since her shadow in his light also differs between renders.
  let matBuf = null;
  function figureMask(x0, y0, w, h) {
    const out = new Uint8Array(w * h);
    const ax = Math.max(0, x0), ay = Math.max(0, y0), bx = Math.min(W, x0 + w), by = Math.min(H, y0 + h);
    if (bx <= ax || by <= ay) return out;
    const cw = bx - ax, ch = by - ay;
    if (!matBuf || matBuf.length < cw * ch * 4) matBuf = new Float32Array(cw * ch * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.scene);
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(ax, H - by, cw, ch, gl.RGBA, gl.FLOAT, matBuf);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const m = Math.floor(matBuf[((ch - 1 - y) * cw + x) * 4]);
      if (m >= MAT.SKIN && m <= MAT.SHOE) out[(ay - y0 + y) * w + (ax - x0 + x)] = 1;
    }
    return out;
  }
  return { render, warm, W, H, K, gl, TIMES, basis: camBasis, gpuSync, figureMask };
}
