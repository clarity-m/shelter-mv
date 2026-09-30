// Lines of light in the valley renderer (S34's plants): world-space segments drawn as ribbons of
// constant screen width, depth-tested against the scene (terrain, props, Clawds) without writing
// depth, added into the colour target only (the aux target keeps the scene's materials), so the
// valley's bloom picks them up. A hot white core fading to his orange at the edge, like S21's lines.
// Built per frame from a flat list: segments [ax, ay, az, bx, by, bz, width px, heat 0..1 (< 0: gold), alpha].
import { HDR, COMMON } from '../valley/glsl.js';

const VS = `
layout(location=0) in vec4 aA;    // a.xyz, side (-1 / 1)
layout(location=1) in vec4 aB;    // b.xyz, end (0 = a, 1 = b)
layout(location=2) in vec4 aW;    // width px, heat, alpha, 0
uniform vec2 uRes;
out float vSide; out float vHeat; out float vAlpha; out float vW;
void main(){
  vec4 pa = projectP(aA.xyz), pb = projectP(aB.xyz);
  vec4 p = aB.w < 0.5 ? pa : pb;
  if (pa.w < 0.05 || pb.w < 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 sa = pa.xy/pa.w*uRes*0.5, sb = pb.xy/pb.w*uRes*0.5;      // screen px (centred)
  vec2 d = sb - sa; float l = length(d);
  vec2 t = l > 1e-4 ? d/l : vec2(1.0, 0.0), n = vec2(-t.y, t.x);
  float w = aW.x*0.5 + 1.5;                                        // half width plus a soft edge
  vec2 off = n*aA.w*w + t*(aB.w < 0.5 ? -w : w);                   // square caps, the ends overlap
  p.xy += off/(uRes*0.5)*p.w;
  gl_Position = p;
  vSide = aA.w; vHeat = aW.y; vAlpha = aW.z; vW = aW.x;
}`;
const FS = `
in float vSide; in float vHeat; in float vAlpha; in float vW;
layout(location=0) out vec4 oCol;
void main(){
  float r = abs(vSide);                                            // 0 at the centre line, 1 at the soft edge
  float core = 1.0 - smoothstep(0.18, 0.55, r), glow = (1.0 - r)*(1.0 - r);
  vec3 hot = vec3(1.0, 0.97, 0.90), warm = vec3(1.0, 0.62, 0.34);
  vec3 c = mix(warm, hot, clamp(vHeat*0.7 + 0.3*core, 0.0, 1.0));
  // negative heat: gold light (S34's edge connector), -1 bright .. 0 deep
  if (vHeat < 0.0) c = mix(vec3(0.95, 0.46, 0.06), vec3(1.0, 0.72, 0.22), clamp(-vHeat*0.7 + 0.2*core, 0.0, 1.0));
  float a = vAlpha*(0.85*core + 0.35*glow);
  oCol = vec4(c*a, a);
}`;

export function createLightLines(V) {
  const gl = V.gl;
  const prog = V.program(HDR + COMMON + VS, HDR + FS, 'lightlines');
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const bufs = [0, 1, 2].map((i) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 0, 0); return b; });
  gl.bindVertexArray(null);
  let cap = 0, A = null, Bb = null, W = null;
  // segs: Float32Array of 9 per segment; returns a P.extra hook drawing them
  function hook(segs, n, P) {
    return (glc, ctx) => {
      if (!n) return;
      if (n * 6 > cap) { cap = Math.max(n * 6, cap * 2, 6144); A = new Float32Array(cap * 4); Bb = new Float32Array(cap * 4); W = new Float32Array(cap * 4); }
      const SIDE = [-1, 1, 1, -1, 1, -1], END = [0, 0, 1, 0, 1, 1];
      for (let i = 0; i < n; i++) {
        const o = i * 9;
        for (let c = 0; c < 6; c++) {
          const vi = (i * 6 + c) * 4;
          A[vi] = segs[o]; A[vi + 1] = segs[o + 1]; A[vi + 2] = segs[o + 2]; A[vi + 3] = SIDE[c];
          Bb[vi] = segs[o + 3]; Bb[vi + 1] = segs[o + 4]; Bb[vi + 2] = segs[o + 5]; Bb[vi + 3] = END[c];
          W[vi] = segs[o + 6]; W[vi + 1] = segs[o + 7]; W[vi + 2] = segs[o + 8]; W[vi + 3] = 0;
        }
      }
      const v = n * 6;
      ctx.setShared(prog, ctx.B, P, ctx.S);
      gl.bindVertexArray(vao);
      [A, Bb, W].forEach((d, i) => { gl.bindBuffer(gl.ARRAY_BUFFER, bufs[i]); gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, v * 4), gl.DYNAMIC_DRAW); });
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
      gl.drawArrays(gl.TRIANGLES, 0, v);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.depthMask(true); gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
    };
  }
  return { hook };
}
