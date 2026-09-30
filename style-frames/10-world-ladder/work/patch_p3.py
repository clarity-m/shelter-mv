p = 'C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/ladder.html'
s = open(p, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    if old not in s:
        raise SystemExit('NOT FOUND: ' + old[:90])
    s = s.replace(old, new, count)

# sun a touch higher so its disc clears the ridge in every rung
rep("const SUN_PX = [Q.has('sx') ? +Q.get('sx') : 1490, Q.has('sy') ? +Q.get('sy') : 700];",
    "const SUN_PX = [Q.has('sx') ? +Q.get('sx') : 1492, Q.has('sy') ? +Q.get('sy') : 682];")

# rung 3: facets vary in hue as well as value
rep("""#if LOWPOLY
  alb *= 0.9 + 0.2 * h.fid;
#endif""", """#if LOWPOLY
  alb *= 0.9 + 0.2 * h.fid;
  alb *= mix(vec3(0.94, 0.98, 1.08), vec3(1.07, 1.03, 0.9), fract(h.fid * 7.31));
#endif""")

# strokes: sample colour a little off-centre across the stroke, so neighbours differ
rep("""  vec3 col = texelFetch(uUnder, ivec2(p), 0).rgb;""", """  vec2 ps = p + nrm * (h1(fid * 2.2) - 0.5) * wid * 1.2 + dir * (h1(fid * 3.7) - 0.5) * len * 0.5;
  vec3 col = texelFetch(uUnder, ivec2(clamp(ps, vec2(0.0), uRes - 1.0)), 0).rgb;
  if (matAt(ps) != mat) col = texelFetch(uUnder, ivec2(p), 0).rgb;""")
# the stroke fragment: a more opaque, more deliberate mark
rep("""  float edge = 1.0 - smoothstep(0.55, 0.95, across + wob);""", """  float edge = 1.0 - smoothstep(0.62, 0.92, across + wob);""")
rep("""  float a = clamp(edge * taper * bristle * 1.15, 0.0, 1.0);""", """  float a = clamp(edge * taper * bristle * 1.35, 0.0, 1.0);""")

# light wrap: the bright sky bleeds over backlit silhouettes (rungs 3, 4)
rep("""const PAINT_FINISH_FS = `#version 300 es""", """const SKYONLY_FS = `#version 300 es
precision highp float;
uniform sampler2D uCol, uAux; uniform vec2 uRes;
out vec4 o;
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy);
  float sky = floor(texelFetch(uAux, q, 0).x) < 0.5 ? 1.0 : 0.0;
  o = vec4(texelFetch(uCol, q, 0).rgb * sky, sky);
}`;
const WRAP_FS = `#version 300 es
precision highp float;
uniform sampler2D uCol, uAux, uWrap; uniform vec2 uRes; uniform float uK;
out vec4 o;
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(uCol, q, 0).rgb;
  float m = floor(texelFetch(uAux, q, 0).x);
  vec4 w = texture(uWrap, gl_FragCoord.xy / uRes);
  if (m > 0.5 && m != 10.0) c += w.rgb * uK;
  o = vec4(c, 1.0);
}`;
function lightWrap(col, aux, k, sigma) {
  _blurProg = _blurProg || compile(BLUR_FS, 'blur');
  const a = tex(W / 2, H / 2, 'f16'), b = tex(W / 2, H / 2, 'f16'), fa = fbo([a]), fb = fbo([b]);
  const so = tex(W, H, 'f16'), fso = fbo([so]);
  run(compile(SKYONLY_FS, 'skyonly'), fso, {}, { uCol: col, uAux: aux });
  run(compile(COPY_HALF_FS, 'half'), fa, {}, { uSrc: so });
  run(_blurProg, fb, { uDir: [1, 0], uSigma: sigma }, { uSrc: a });
  run(_blurProg, fa, { uDir: [0, 1], uSigma: sigma }, { uSrc: b });
  const outT = tex(W, H, 'f16'), fo = fbo([outT]);
  run(compile(WRAP_FS, 'wrap'), fo, { uK: k }, { uCol: col, uAux: aux, uWrap: a });
  return outT;
}
const COPY_HALF_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes;
out vec4 o;
void main() { o = texture(uSrc, gl_FragCoord.xy / uRes); }`;
const PAINT_FINISH_FS = `#version 300 es""")

# rung 4: bigger first layers, wrap before painting
rep("""  let paint = col;
  if (Q.get('paint') !== '0') paint = timed('paint', () => paintStrokes(col, aux, [
    { cell: 13, len: 52, wid: 14, seed: 1 },
    { cell: 7, len: 28, wid: 8, seed: 2 },
    { cell: 4, len: 14, wid: 4.5, seed: 3, skip: 0.6 },
  ]));""", """  const under = timed('wrap', () => lightWrap(col, aux, 0.85, 7));
  let paint = under;
  if (Q.get('paint') !== '0') paint = timed('paint', () => paintStrokes(under, aux, [
    { cell: 16, len: 64, wid: 18, seed: 1 },
    { cell: 9, len: 36, wid: 11, seed: 2 },
    { cell: 5, len: 17, wid: 6, seed: 3, skip: 0.7 },
  ]));""")
rep("""  run(fin, null, { uBloom1: 0.4, uBloom2: 0.5, uVig: 0.25, uGrain: 0.03, uWeave: 0.035 }, { uCol: comp, uB1: bl[0], uB2: bl[1] });""",
    """  run(fin, null, { uBloom1: 0.45, uBloom2: 0.65, uVig: 0.25, uGrain: 0.03, uWeave: 0.04 }, { uCol: comp, uB1: bl[0], uB2: bl[1] });""")
# rung 3: a lighter wrap
rep("""  timed('scene', () => runTiled(prog, fb, { uSS: +(Q.get('ss') || 3) }, { uPl: plTex, uPm: pmTex }, 12));
  const bl = timed('bloom', () => bloomChain(col, 0.85, [[4, 5], [16, 7]]));
  const fin = compile(FINISH_FS, 'finish');
  run(fin, null, { uBloom1: 0.22, uBloom2: 0.3, uVig: 0.22, uGrain: 0.012, uExposure: 1.0 }, { uCol: col, uB1: bl[0], uB2: bl[1] });""",
    """  timed('scene', () => runTiled(prog, fb, { uSS: +(Q.get('ss') || 3) }, { uPl: plTex, uPm: pmTex }, 12));
  const wr = lightWrap(col, aux, 0.4, 4);
  const bl = timed('bloom', () => bloomChain(wr, 0.85, [[4, 5], [16, 7]]));
  const fin = compile(FINISH_FS, 'finish');
  run(fin, null, { uBloom1: 0.22, uBloom2: 0.3, uVig: 0.22, uGrain: 0.012, uExposure: 1.0 }, { uCol: wr, uB1: bl[0], uB2: bl[1] });""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
