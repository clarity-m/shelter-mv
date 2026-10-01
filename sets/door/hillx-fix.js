// Loads sets/inside-montage/hillx.js (read only) for S20's and S36's renders.
//
// loadHillx(): with one fix. S20's render is not 16:9 (it covers the lab screen's 152:97 hole), and
// hillx's ribbon pass used to flip y with the design height 1080 instead of its canvas's (H / K). The
// fix is upstream now (the line is gone), so this returns the module as it is.
//
// loadHillxIcy() also adds (revision 14) a field colouring for S20's free-energy landscape, switched on by
// state.salt = -1 (hillx passes salt through; the stock crust only acts for salt > 0): the land is
// coloured by height like a topographic profile, a deep indigo-violet basin through violet and
// magenta to a pale rose-lilac rim, with fine pale-gold contour lines at even heights, the brush
// rows' light and dark kept in it.
// loadHillxIcy() (revision 11): the same, with S18's glacier caps on the hill engine's far peaks.
// P's S18 turns the valley engine's far peaks glacier blue, and S19 ends on them, so S20's opening
// (the hill engine, dissolving from S19's last frame) needs the same pale icy caps, or they would
// fade out in the dissolve. glslx.js (read only) is loaded as a copy with a few lines added to
// mountainsOver: pale blue-white caps on the lit faces, glacier blue in shade, ragged along the snow
// line, under the same haze. If the anchor line has changed upstream, it logs a warning and loads
// hillx unchanged.
const H_URL = new URL('../inside-montage/hillx.js', import.meta.url).href;
const G_URL = new URL('../inside-montage/glslx.js', import.meta.url).href;
const absolute = (src, base) => src.replace(/from '(\.{1,2}\/[^']+)'/g, (m, rel) => `from '${new URL(rel, base).href}'`);
const blobOf = (src) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));

export async function loadHillx() {
  const src0 = await (await fetch(H_URL, { cache: 'no-store' })).text();
  const A = '(1080 - l[1]) * K', B = '(1080 - r[1]) * K';
  if (src0.split(A).length !== 2 || src0.split(B).length !== 2) return import(H_URL);
  const src = absolute(src0.replace(A, '(H / K - l[1]) * K').replace(B, '(H / K - r[1]) * K'), H_URL);
  return Object.assign({ patched: true }, await import(blobOf(src)));
}

const CAP_ANCHOR = '    f *= 0.9 + 0.2 * bk + 0.05 * (vnoise2(vec2(sd * 1.3, cv * 6.0)) - 0.5);';
const CAP_GLSL = `
    // (sets/door/hillx-fix.js, revision 11) S18's glacier caps, as S19 leaves them: pale blue-white on
    // the lit faces, glacier blue in shade, ragged along the snow line
    float capK = smoothstep(0.5, 0.7, fy + 0.12 * (vnoise2(vec2(sd * 0.45, pk.x * 0.7)) - 0.5));
    vec3 capC = k > 0.5 ? vec3(0.86, 0.74, 0.78) : vec3(0.46, 0.52, 0.80);
    f = mix(f, capC, capK * 0.92);`;
const FIELD_ANCHOR = '  return mix(c, mean, smoothstep(0.35, 0.9, fw));';
const FIELD_GLSL = `
  if (uSalt < -0.5) {
    // (sets/door/hillx-fix.js, revision 14) the free-energy landscape: colour by height, contours
    float hh = clamp(h / 2.3, 0.0, 1.0);
    vec3 f0 = vec3(0.09, 0.05, 0.24), f1 = vec3(0.29, 0.13, 0.50), f2 = vec3(0.58, 0.19, 0.55), f3 = vec3(0.87, 0.72, 0.87);
    vec3 fc = hh < 0.33 ? mix(f0, f1, hh / 0.33) : hh < 0.68 ? mix(f1, f2, (hh - 0.33) / 0.35) : mix(f2, f3, (hh - 0.68) / 0.32);
    fc = pow(fc, vec3(2.2));
    float lr = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)) / max(dot(mean, vec3(0.2126, 0.7152, 0.0722)), 1e-4), 0.55, 1.5);
    fc *= 0.82 + 0.3 * lr;
    float dhp = length(gh) * PIXANG() * t / max(abs(dot(ns, rd)), 0.04);
    float cv = h / 0.18, fwv = dhp / 0.18, dd = 0.5 - abs(fract(cv) - 0.5);
    float line = (1.0 - smoothstep(0.0, 0.03 + 0.9 * fwv, dd)) * (1.0 - smoothstep(0.25, 0.55, fwv));
    fc = mix(fc, pow(vec3(0.96, 0.84, 0.55), vec3(2.2)), 0.78 * line);
    return fc;
  }
`;
export async function loadHillxIcy(log = () => {}) {
  let g = await (await fetch(G_URL, { cache: 'no-store' })).text();
  if (g.split(FIELD_ANCHOR).length === 2) g = g.replace(FIELD_ANCHOR, FIELD_GLSL + FIELD_ANCHOR);
  else log('hillx-fix: WARNING the land paint line in glslx.js has changed; no field colouring');
  if (g.split(CAP_ANCHOR).length !== 2) {
    log('hillx-fix: WARNING the mountains line in glslx.js has changed; no icy caps');
    return Object.assign({ icy: false }, await loadHillx());
  }
  g = absolute(g.replace(CAP_ANCHOR, CAP_ANCHOR + CAP_GLSL), G_URL);
  let h = await (await fetch(H_URL, { cache: 'no-store' })).text();
  if (h.split("from './glslx.js'").length !== 2) {
    log('hillx-fix: WARNING hillx.js no longer imports ./glslx.js; no icy caps');
    return Object.assign({ icy: false }, await loadHillx());
  }
  const A = '(1080 - l[1]) * K', B = '(1080 - r[1]) * K';
  if (h.split(A).length === 2 && h.split(B).length === 2) h = h.replace(A, '(H / K - l[1]) * K').replace(B, '(H / K - r[1]) * K');
  h = absolute(h.replace("from './glslx.js'", `from '${blobOf(g)}'`), H_URL);
  return Object.assign({ icy: true, patched: true }, await import(blobOf(h)));
}

// ---------------------------------------------------------------- revision 23: solid Clawds
// (Claire, on cut 21: in S20 and S36 the Clawds kept facing the lens as the camera moved, and were
// drawn over the protein.) loadHillxDoor(log, { icy, solid }) loads the engine with S20's field and
// caps (icy) and/or solid Clawds (solid). With state.solidClawds ({ depth }) every Clawd is the valley
// engine's extruded solid (sets/valley/clawd3d.js buildClawd, as in S34): the pose's grid (arms, eyes
// and legs from the same pose fields as the sprite) extruded `depth` glyph units, facing its own
// world direction (c.yaw: 0 faces +z, PI faces a lens on -z), rasterized in the scene camera with
// 4x MSAA and a depth buffer, and hidden where the scene is nearer. His distance goes to a second
// layer (kcD) that the ribbon, line and decal passes read: they are hidden only behind a nearer
// Clawd and pass in front of a farther one. Without state.solidClawds the engine draws as before.
const C3D_URL = new URL('../valley/clawd3d.js', import.meta.url).href;
const MASK_GLSL = `
uniform sampler2D uClawdD;
// (sets/door/hillx-fix.js, revision 23) a solid Clawd hides this only where he is nearer
float clawdMask(ivec2 ij, float d) {
  float a = texelFetch(uClawd, ij, 0).a;
  vec2 cd = texelFetch(uClawdD, ij, 0).xy;
  return cd.y > 0.002 ? a * step(cd.x / cd.y, d - 0.02) : a;
}`;
const MASK_DECLS = ['uniform sampler2D uAux, uClawd; uniform float uK, uDepthK, uClawdK;', 'uniform sampler2D uAux, uClawd; uniform float uPaint, uCore;', 'uniform sampler2D uAux, uClawd, uAtlas;'];
const MASK_SWAPS = [
  ['vis *= 1.0 - uClawdK * texelFetch(uClawd, ivec2(gl_FragCoord.xy), 0).a;', 'vis *= 1.0 - uClawdK * clawdMask(ivec2(gl_FragCoord.xy), dist);', 1],
  ['float vis = smoothstep(vDist - 0.6, vDist - 0.15, scene) * (1.0 - texelFetch(uClawd, ij, 0).a);', 'float vis = smoothstep(vDist - 0.6, vDist - 0.15, scene) * (1.0 - clawdMask(ij, vDist));', 2],
];
const SOLID_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aP; layout(location = 1) in vec4 aN; layout(location = 2) in float aAO; layout(location = 3) in float aM;
uniform vec3 uCamPos, uCamFw, uCamR, uCamU, uPos; uniform float uF, uK; uniform vec2 uPP, uRes, uYS; uniform vec4 uBox;
out vec3 vWP; out float vAO; flat out vec3 vN; flat out float vM; flat out float vFront;
// the glyph's local frame (x across as seen from the front, y up from the feet, z toward his front),
// mirrored in x for this engine's left-handed world, turned by the yaw and scaled to metres
vec3 xf(vec3 v) { float c = cos(uYS.x), s = sin(uYS.x); v.x = -v.x; return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
void main() {
  vec3 wp = uPos + xf(aP) * uYS.y;
  vWP = wp; vN = xf(aN.xyz); vAO = aAO; vM = aM; vFront = aN.z;
  // the engine's projection (design px, y down) to canvas px (y up) in the box, times the depth z:
  // linear in the vertex, so the GPU clips a Clawd that reaches behind the lens
  vec3 d = wp - uCamPos; float z = dot(d, uCamFw);
  float gx = uPP.x * uK * z + uF * uK * dot(d, uCamR), gy = (uRes.y - uPP.y * uK) * z + uF * uK * dot(d, uCamU);
  const float n = 0.05, f = 500.0;
  gl_Position = vec4((gx - uBox.x * z) / uBox.z * 2.0 - z, (gy - uBox.y * z) / uBox.w * 2.0 - z, (f + n) / (f - n) * z - 2.0 * f * n / (f - n), z);
}`;
const SOLID_FS = `#version 300 es
precision highp float; precision highp sampler2D;
in vec3 vWP; in float vAO; flat in vec3 vN; flat in float vM; flat in float vFront;
uniform sampler2D uAux; uniform vec3 uCamPos; uniform vec4 uBox; uniform float uGlow, uAlpha, uRef;
layout(location = 0) out vec4 oC; layout(location = 1) out vec4 oD;
vec3 lin(vec3 s) { return pow(s, vec3(2.2)); }
void main() {
  float dist = length(vWP - uCamPos);
  float tp = texelFetch(uAux, ivec2(gl_FragCoord.xy + uBox.xy), 0).y;
  // hidden where the scene is nearer than he is, tested at his middle's distance as the sprite was, so
  // a slope never cuts through his legs (Clawds, ribbons and lines between them sort by the depth buffer)
  float vis = smoothstep(uRef - 0.6, uRef - 0.35, tp) * uAlpha;
  if (vis <= 0.002) discard;
  // the luminous form's colours: a flat #D97757 front, ink eye pockets, the extruded sides darker
  // (lit from above), a little ambient occlusion under the arms and in the pockets
  vec3 body = lin(vec3(0.851, 0.467, 0.341)) * uGlow, c;
  if (vM > 0.5) c = lin(vec3(0.118, 0.090, 0.078));
  else if (vFront > 0.5) c = body;
  else { vec3 n = normalize(vN); c = body * (0.64 + 0.16 * max(n.y, 0.0) - 0.05 * max(-n.y, 0.0)) * mix(0.78, 1.0, vAO); }
  oC = vec4(c * vis, vis);
  oD = vec4(dist * vis, vis, 0.0, 0.0);
}`;
// the engine side, injected into createHill (it uses the engine's gl, W, H, K, T, FB, vao, tex, fbo,
// compile, bind, project, hillH and defaultState)
const SOLID_JS = `
  // ---------------------------------------------------------------- (sets/door/hillx-fix.js, revision 23)
  const SOLID = (() => {
    const VS = ${JSON.stringify(SOLID_VS)}, FS = ${JSON.stringify(SOLID_FS)};
    let dT = null, dF = null, prog = null, ms = null, rs = null, cap = [0, 0], held = [];
    const meshes = new Map();
    const dTex = () => { if (!dT) { dT = tex(W, H, 'f16'); dF = fbo([dT]); } return dT; };
    const clearD = () => { dTex(); gl.bindFramebuffer(gl.FRAMEBUFFER, dF); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); };
    // the pose as a sprite grid (18 x 5 cells of 1 x 2 units), from the sprite's own pose fields
    const gridOf = (c) => {
      const g = ['...############...', '...############...', '.################.', '...############...', '..................'].map((r) => r.split(''));
      (c.legs || [4.5, 6.5, 11.5, 13.5]).forEach((lx) => { g[4][Math.floor(lx)] = '#'; });
      const arm = (mode, right) => {
        if (Math.abs(mode) < 0.5) return;
        const tip = right ? 16 : 1, sh = right ? 15 : 2;
        g[2][tip] = '.';
        if (mode < -1.5) { g[2][sh] = '.'; g[1][sh] = '#'; g[0][tip] = '#'; } else if (mode < 0) g[1][tip] = '#'; else g[3][tip] = '#';
      };
      arm(c.armL || 0, false); arm(c.armR || 0, true);
      if (c.arch) { for (const x of [5, 12]) { g[1][x - 1] = g[1][x] = g[1][x + 1] = 'o'; g[2][x - 1] = g[2][x + 1] = 'o'; } }
      else { const lx = Math.round(c.look || 0); g[1][5 + lx] = 'o'; g[1][12 + lx] = 'o'; }
      return g.map((r) => r.join(''));
    };
    const mesh = (grid, D) => {
      const key = grid.join('/') + '|' + D;
      let m = meshes.get(key);
      if (m) return m;
      const M = buildClawd(grid, D), v = gl.createVertexArray(); gl.bindVertexArray(v);
      [[M.P, 3, gl.FLOAT, false], [M.N, 4, gl.BYTE, true], [M.AO, 1, gl.FLOAT, false], [M.M, 1, gl.FLOAT, false]].forEach(([d, n, t, nm], i) => {
        const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, t, nm, 0, 0);
      });
      gl.bindVertexArray(vao);
      m = { vao: v, n: M.n }; meshes.set(key, m); return m;
    };
    // multisampled targets the size of the Clawds' box on screen (grown as needed), and single-sample
    // resolves of the same size
    const targets = (w, h) => {
      if (ms && cap[0] >= w && cap[1] >= h) return;
      const cw = Math.min(W, Math.max(cap[0], Math.ceil(w / 512) * 512)), ch = Math.min(H, Math.max(cap[1], Math.ceil(h / 512) * 512));
      for (const o of held) { if (o instanceof WebGLRenderbuffer) gl.deleteRenderbuffer(o); else if (o instanceof WebGLFramebuffer) gl.deleteFramebuffer(o); else gl.deleteTexture(o); }
      held = [];
      const sm = gl.getInternalformatParameter(gl.RENDERBUFFER, gl.RGBA16F, gl.SAMPLES), samples = Math.min(4, sm && sm.length ? sm[0] : 4);
      const rb = (fmt) => { const r = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, r); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, fmt, cw, ch); held.push(r); return r; };
      ms = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, ms);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rb(gl.RGBA16F));
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.RENDERBUFFER, rb(gl.RGBA16F));
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb(gl.DEPTH_COMPONENT24));
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (st !== gl.FRAMEBUFFER_COMPLETE) LOG('hill: solid Clawds FBO incomplete ' + st);
      rs = [fbo([tex(cw, ch, 'f16')]), fbo([tex(cw, ch, 'f16')])];
      held.push(ms, rs[0], rs[0].t, rs[1], rs[1].t);
      cap = [cw, ch];
      LOG('hill: solid Clawds, ' + samples + 'x MSAA, ' + cw + 'x' + ch);
    };
    function pass(st, B, clawdY) {
      const d0 = defaultState().clawd, list = [], D = (st.solidClawds && st.solidClawds.depth) || 4;
      for (const q of st.crowd || []) {
        const c = Object.assign({}, d0, q);
        if ((c.alpha ?? 1) <= 0.002) continue;
        list.push({ c, y: c.y !== undefined ? c.y : hillH(st.hill, c.x, c.z) });
      }
      if (st.clawd && (st.clawd.alpha ?? 1) > 0.002) list.push({ c: st.clawd, y: clawdY, main: true });
      // the box round them all on the canvas (px, y up)
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, info = null;
      const items = [];
      for (const q of list) {
        const c = q.c, s = c.u, yaw = c.yaw ?? Math.PI, pos = [c.x, q.y + (c.hop || 0), c.z], cy = Math.cos(yaw), sy = Math.sin(yaw);
        let behind = 0, bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
        for (const lx of [-9.6, 9.6]) for (const ly of [-0.6, 10.6]) for (const lz of [-D / 2 - 0.6, D / 2 + 0.6]) {
          const p = project(B, [pos[0] + (-lx * cy + lz * sy) * s, pos[1] + ly * s, pos[2] + (lx * sy + lz * cy) * s]);
          if (p[2] < 0.05) { behind++; continue; }
          bx0 = Math.min(bx0, p[0] * K); bx1 = Math.max(bx1, p[0] * K); by0 = Math.min(by0, H - p[1] * K); by1 = Math.max(by1, H - p[1] * K);
        }
        if (behind === 8) continue;                               // wholly behind the lens
        if (behind) { bx0 = 0; by0 = 0; bx1 = W; by1 = H; }       // reaching past it: the whole canvas
        if (bx1 < 0 || bx0 > W || by1 < 0 || by0 > H) continue;
        x0 = Math.min(x0, bx0); x1 = Math.max(x1, bx1); y0 = Math.min(y0, by0); y1 = Math.max(y1, by1);
        items.push({ c, pos, yaw, s });
        if (q.main) { const pr = project(B, pos), Upx = B.F * s / pr[2]; info = { x: pr[0], y: pr[1] - 5 * Upx, U: Upx }; }
      }
      const X0 = Math.max(0, Math.floor(x0) - 2), Y0 = Math.max(0, Math.floor(y0) - 2), X1 = Math.min(W, Math.ceil(x1) + 2), Y1 = Math.min(H, Math.ceil(y1) + 2);
      if (!items.length || X1 <= X0 || Y1 <= Y0) return info;
      const bw = X1 - X0, bh = Y1 - Y0;
      targets(bw, bh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, ms); gl.viewport(0, 0, bw, bh);
      gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]); gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
      gl.depthMask(true); gl.clearBufferfv(gl.DEPTH, 0, [1]);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
      if (!prog) prog = compile(FS, 'solid clawd', VS);
      gl.useProgram(prog);
      bind(prog, { uCamPos: B.pos, uCamFw: B.fw, uCamR: B.right, uCamU: B.up, uF: B.F, uPP: B.pp, uK: K, uRes: [W, H], uBox: [X0, Y0, bw, bh] }, { uAux: T.aux });
      for (const it of items) {
        const m = mesh(gridOf(it.c), D);
        const uRef = Math.hypot(it.pos[0] - B.pos[0], it.pos[1] + 5 * it.s - B.pos[1], it.pos[2] - B.pos[2]);
        bind(prog, { uPos: it.pos, uYS: [it.yaw, it.s], uGlow: it.c.glow ?? 1, uAlpha: it.c.alpha ?? 1, uRef }, {});
        gl.bindVertexArray(m.vao); gl.drawArrays(gl.TRIANGLES, 0, m.n);
      }
      gl.disable(gl.DEPTH_TEST); gl.bindVertexArray(vao);
      // resolve the samples, then put the box into the Clawd layer and his distance into kcD
      for (let a = 0; a < 2; a++) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, ms); gl.readBuffer(gl.COLOR_ATTACHMENT0 + a);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rs[a]);
        gl.blitFramebuffer(0, 0, bw, bh, 0, 0, bw, bh, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rs[a]); gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, a ? dF : FB.kc);
        gl.blitFramebuffer(0, 0, bw, bh, X0, Y0, X1, Y1, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      }
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      return info;
    }
    return { dTex, clearD, pass, gridOf };
  })();
`;
const H_SWAPS = [
  ['    if (st.crowd && st.crowd.length) return crowdPass(st, B, clawdY);', '    if (st.solidClawds) return SOLID.pass(st, B, clawdY);\n    if (st.crowd && st.crowd.length) return crowdPass(st, B, clawdY);', 1],
  ['}, { uAux: T.aux, uClawd: T.kc });', '}, { uAux: T.aux, uClawd: T.kc, uClawdD: SOLID.dTex() });', 2],
  ['{ uAux: T.aux, uClawd: T.kc, uAtlas: decalTex }', '{ uAux: T.aux, uClawd: T.kc, uClawdD: SOLID.dTex(), uAtlas: decalTex }', 1],
];
export async function loadHillxDoor(log = () => {}, { icy = false, solid = true } = {}) {
  const lf = (s) => s.replace(/\r\n/g, '\n');
  let g = lf(await (await fetch(G_URL, { cache: 'no-store' })).text());
  let h = lf(await (await fetch(H_URL, { cache: 'no-store' })).text());
  const fail = (why) => { log('hillx-fix: WARNING ' + why + '; loading hillx unchanged'); return import(H_URL); };
  if (icy) {
    if (g.split(FIELD_ANCHOR).length === 2) g = g.replace(FIELD_ANCHOR, FIELD_GLSL + FIELD_ANCHOR);
    else log('hillx-fix: WARNING the land paint line in glslx.js has changed; no field colouring');
    if (g.split(CAP_ANCHOR).length === 2) g = g.replace(CAP_ANCHOR, CAP_ANCHOR + CAP_GLSL);
    else log('hillx-fix: WARNING the mountains line in glslx.js has changed; no icy caps');
  }
  if (solid) {
    for (const d of MASK_DECLS) {
      const i = g.indexOf(d);
      if (i < 0 || g.indexOf(d, i + 1) >= 0) return fail('a Clawd mask declaration in glslx.js has changed');
      const e = g.indexOf('\n', i);
      g = g.slice(0, e) + MASK_GLSL + g.slice(e);
    }
    for (const [a, b, n] of MASK_SWAPS) {
      if (g.split(a).length !== n + 1) return fail('a Clawd mask line in glslx.js has changed');
      g = g.split(a).join(b);
    }
    // the solid pass goes in before clawdPass, which clears kcD first (loose anchors: the engine's
    // owner may add to clawdPass)
    const iP = h.indexOf('  function clawdPass(');
    const iB = iP < 0 ? -1 : h.indexOf('    gl.bindFramebuffer(gl.FRAMEBUFFER, FB.kc);', iP);
    if (iP < 0 || h.indexOf('  function clawdPass(', iP + 1) >= 0 || iB < 0 || iB - iP > 400) return fail('the Clawd pass in hillx.js has changed');
    h = h.slice(0, iP) + SOLID_JS + h.slice(iP, iB) + '    SOLID.clearD();\n' + h.slice(iB);
    for (const [a, b, n] of H_SWAPS) {
      if (h.split(a).length !== n + 1) return fail('the Clawd pass in hillx.js has changed');
      h = h.split(a).join(b);
    }
    h = `import { buildClawd } from '${C3D_URL}';\n` + h;
  }
  if (h.split("from './glslx.js'").length !== 2) return fail('hillx.js no longer imports ./glslx.js');
  h = absolute(h.replace("from './glslx.js'", `from '${blobOf(absolute(g, G_URL))}'`), H_URL);
  return Object.assign({ icy, solid, patched: true }, await import(blobOf(h)));
}
