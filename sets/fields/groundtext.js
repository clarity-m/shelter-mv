// Code written on the land (revision 10, the code principle): lines of this film's real code lying
// on the ground along paths (traces, scribe lines), in perspective, depth-tested (Clawds occlude
// them), scrolling along the path. One glyph quad per character from a monospace atlas (glyph in
// R, a soft dark halo in G, so the orange stays legible on the coloured wafer). Drawn in the valley
// renderer's scene pass (a P.extra hook), into the colour target only.
import { HDR, COMMON } from '../valley/glsl.js';

const VS = `
layout(location=0) in vec3 aP;
layout(location=1) in vec3 aT;     // atlas u, v, alpha
out vec2 vUV; out float vA; out float vD;
void main(){
  vUV = aT.xy; vA = aT.z; vD = length(aP - uCam);
  gl_Position = projectP(aP);
}`;
const FS = `
uniform sampler2D uAtlas;
uniform vec3 uInk;
in vec2 vUV; in float vA; in float vD;
layout(location=0) out vec4 oCol;
void main(){
  vec4 t = texture(uAtlas, vUV);
  float a = vA*(1.0 - smoothstep(60.0, 140.0, vD));
  float glyph = t.r, halo = t.g;
  // the halo darkens the ground a little under the glyph; the glyph is his orange
  oCol = vec4(uInk*glyph*a, max(glyph, 0.5*halo)*a);
}`;

const CW = 48, CH = 96, COLS = 16, ROWS = 6;
function atlas() {
  const c = document.createElement('canvas'); c.width = CW * COLS; c.height = CH * ROWS;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.font = '72px Consolas, "Courier New", monospace'; g.textBaseline = 'middle'; g.textAlign = 'center';
  // halo (green): a blurred, fattened copy
  g.save(); g.filter = 'blur(5px)'; g.fillStyle = '#0f0'; g.strokeStyle = '#0f0'; g.lineWidth = 9;
  for (let k = 32; k < 127; k++) { const i = k - 32, x = (i % COLS) * CW + CW / 2, y = Math.floor(i / COLS) * CH + CH / 2; g.strokeText(String.fromCharCode(k), x, y); }
  g.restore();
  // glyph (red), added on top without erasing the halo
  g.globalCompositeOperation = 'lighter'; g.fillStyle = '#f00';
  for (let k = 32; k < 127; k++) { const i = k - 32, x = (i % COLS) * CW + CW / 2, y = Math.floor(i / COLS) * CH + CH / 2; g.fillText(String.fromCharCode(k), x, y); }
  return c;
}

// path helpers: a polyline in xz with arc lengths
export function textPath(pts) {
  const S = [0];
  for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, S, L: S[S.length - 1] };
}
function at(P, s) {
  let i = 0; while (i < P.pts.length - 2 && P.S[i + 1] < s) i++;
  const a = P.pts[i], b = P.pts[i + 1], l = P.S[i + 1] - P.S[i] || 1, u = (s - P.S[i]) / l;
  return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l };
}

export function createGroundText(V) {
  const gl = V.gl;
  const prog = V.program(HDR + COMMON + VS, HDR + COMMON + FS, 'groundtext');
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas());
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const an = gl.getExtension('EXT_texture_filter_anisotropic');
  if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const bP = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bP); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  const bT = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bT); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  let cap = 0, AP = null, AT = null;

  // runs: [{ path (textPath), text, h (m), s0 (arc of the first char), n (chars shown), alpha, lift }]
  // height(x, z): the ground; returns a P.extra hook
  function hook(runs, height, P) {
    let nq = 0;
    for (const r of runs) nq += r.text.length;
    if (nq * 6 > cap) { cap = Math.max(nq * 6, cap * 2, 6000); AP = new Float32Array(cap * 3); AT = new Float32Array(cap * 3); }
    let v = 0;
    for (const r of runs) {
      const adv = 0.55 * r.h, nC = Math.min(r.text.length, r.n === undefined ? r.text.length : r.n), lift = r.lift || 0.03;
      for (let k = 0; k < nC; k++) {
        const code = r.text.charCodeAt(k); if (code <= 32 || code > 126) continue;
        const s = r.s0 + (k + 0.5) * adv;
        if (s < 0 || s > r.path.L) continue;
        const q = at(r.path, s), nx = -q.tz, nz = q.tx;                     // up of the glyph: left of the path
        const ends = Math.min(1, s / (2 * adv), (r.path.L - s) / (2 * adv));   // fade in and out at the ends
        const a = r.alpha * Math.max(0, ends);
        const i = code - 32, u0 = (i % COLS) / COLS, u1 = u0 + 1 / COLS, v0 = Math.floor(i / COLS) / ROWS, v1 = v0 + 1 / ROWS;
        const hw = 0.5 * CW * r.h / 72, hh = 0.5 * CH * r.h / 72;          // the atlas cell at h / 72 m per pixel
        const cx = [[-1, -1, u0, v1], [1, -1, u1, v1], [1, 1, u1, v0], [-1, -1, u0, v1], [1, 1, u1, v0], [-1, 1, u0, v0]];
        for (const [sx, sy, uu, vv] of cx) {
          const x = q.x + q.tx * hw * sx + nx * hh * sy, z = q.z + q.tz * hw * sx + nz * hh * sy;
          AP[v * 3] = x; AP[v * 3 + 1] = height(x, z) + lift; AP[v * 3 + 2] = z;
          AT[v * 3] = uu; AT[v * 3 + 1] = vv; AT[v * 3 + 2] = a;
          v++;
        }
      }
    }
    return (glc, ctx) => {
      if (!v) return;
      ctx.setShared(prog, ctx.B, P, ctx.S);
      gl.activeTexture(gl.TEXTURE12); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(prog, 'uAtlas'), 12);
      gl.uniform3f(gl.getUniformLocation(prog, 'uInk'), 1.0, 0.62, 0.36);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, bP); gl.bufferData(gl.ARRAY_BUFFER, AP.subarray(0, v * 3), gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, bT); gl.bufferData(gl.ARRAY_BUFFER, AT.subarray(0, v * 3), gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
      gl.drawArrays(gl.TRIANGLES, 0, v);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.depthMask(true); gl.disable(gl.BLEND);
      gl.bindVertexArray(null); gl.activeTexture(gl.TEXTURE0);
    };
  }
  return { hook };
}
