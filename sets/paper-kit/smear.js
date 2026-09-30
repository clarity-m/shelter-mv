// Directional motion blur for a rendered frame (revision 10, S29's climb): a small WebGL2 pass that
// averages N taps along a direction, a box shutter, with a soft "keep" ellipse that stays sharp (the
// climber the camera is riding with). Float accumulation, so long streaks don't band.
//   const M = createSmear(W, H);
//   M.apply(srcCanvas, { dir: [0, 1], len: px, keep: [cx, cy, rx, ry] })   // returns M.canvas
// dir is the direction the scene streams toward on screen (y down): a camera racing upward sees the
// world stream down, dir [0, 1]; each pixel then averages the image from itself to len px along dir,
// so a bright star leaves a streak above it. keep is in px (y down); rx or ry 0 disables it.
export function createSmear(W, H) {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('smear: no webgl2');
  const VS = `#version 300 es
in vec2 aP; void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;
  const FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes, uDir; uniform float uLen; uniform vec4 uKeep;
out vec4 o;
void main() {
  vec2 pd = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float keep = 0.0;
  if (uKeep.z > 0.0 && uKeep.w > 0.0) keep = 1.0 - smoothstep(0.55, 1.0, length((pd - uKeep.xy) / uKeep.zw));
  float L = uLen * (1.0 - keep);
  vec3 acc = vec3(0.0);
  const int N = 56;
  for (int i = 0; i < N; i++) {
    vec2 q = pd + uDir * (L * (float(i) + 0.5) / float(N));
    acc += texture(uSrc, q / uRes).rgb;
  }
  o = vec4(acc / float(N), 1.0);
}`;
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('smear shader: ' + gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, 'aP'); gl.linkProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const U = (n) => gl.getUniformLocation(prog, n);
  const loc = { src: U('uSrc'), res: U('uRes'), dir: U('uDir'), len: U('uLen'), keep: U('uKeep') };
  function apply(src, o = {}) {
    gl.viewport(0, 0, W, H); gl.useProgram(prog);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const k = W / 1920, d = o.dir || [0, 1], kp = o.keep || [0, 0, 0, 0];
    gl.uniform1i(loc.src, 0); gl.uniform2f(loc.res, W, H); gl.uniform2f(loc.dir, d[0], d[1]);
    gl.uniform1f(loc.len, (o.len || 0) * k); gl.uniform4f(loc.keep, kp[0] * k, kp[1] * k, kp[2] * k, kp[3] * k);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return canvas;
  }
  return { apply, canvas };
}
