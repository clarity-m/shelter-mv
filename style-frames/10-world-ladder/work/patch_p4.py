p = 'C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/ladder.html'
s = open(p, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    if old not in s:
        raise SystemExit('NOT FOUND: ' + old[:90])
    s = s.replace(old, new, count)

rep("""  const under = timed('wrap', () => lightWrap(col, aux, 0.85, 7));""", """  const under = timed('wrap', () => lightWrap(col, aux, 0.3, 3.5));""")
rep("""  const wr = lightWrap(col, aux, 0.4, 4);""", """  const wr = lightWrap(col, aux, 0.18, 3);""")

# backlit grass: the ridge on the sun side burns gold; painted streaks follow the slope
rep("""  float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
  float back = smoothstep(-0.2, 0.7, dot(n, gdir));""", """  float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
  float back = smoothstep(-0.2, 0.7, dot(n, gdir));
#if PAINTTEX
  if (h.mat == M_HILL) {
    float sunSide = smoothstep(-0.35, 0.9, dot(normalize(p.xz - CAM.xz), normalize(SUN.xz)));
    float streak = vnoise2(vec2(p.x * 1.6 + p.z * 0.4, p.y * 26.0));
    c += P_SUNL * alb * (pow(fres, 1.5) * 1.1 * sunSide + 0.1 * streak * up) * (0.4 + 0.6 * sh);
  }
#endif""")

# rung-4 finish: a gentle S-curve so the paint keeps its darks
rep("""  vec3 s = toSRGB(c);
  // canvas weave and paper tooth""", """  vec3 s = toSRGB(c);
  s = mix(s, s * s * (3.0 - 2.0 * s), 0.3);
  // canvas weave and paper tooth""")
rep("""  float edge = 1.0 - smoothstep(0.62, 0.92, across + wob);""", """  float edge = 1.0 - smoothstep(0.7, 0.9, across + wob);""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
