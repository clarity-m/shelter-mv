p = 'C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/ladder.html'
s = open(p, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    if old not in s:
        raise SystemExit('NOT FOUND: ' + old[:80])
    s = s.replace(old, new, count)

# 1) Clawd eye mode + luminous shading hooks in COMMON
rep("#define LEAFNOISE ${opt.leafNoise ? 1 : 0}\nuniform vec2 uRes;",
    "#define LEAFNOISE ${opt.leafNoise ? 1 : 0}\n#define EYES_RECESS ${opt.eyesRecess ? 1 : 0}\n#define CLAWDONLY ${opt.clawdOnly ? 1 : 0}\n#define LUMCLAWD ${opt.lumClawd ? 1 : 0}\nuniform vec2 uRes;")
rep("""  float e = min(sdBox(p - vec3(-3.5 * CU, 7.0 * CU, 0.0), vec3(0.5 * CU, CU, CDEP)),
                sdBox(p - vec3(3.5 * CU, 7.0 * CU, 0.0), vec3(0.5 * CU, CU, CDEP)));
  return max(d, -e);
}""", """#if EYES_RECESS
  float ez = -0.5 * CDEP, eh = 1.6 * CU;
  float e = min(sdBox(p - vec3(-3.5 * CU, 7.0 * CU, ez), vec3(0.5 * CU, CU, eh)),
                sdBox(p - vec3(3.5 * CU, 7.0 * CU, ez), vec3(0.5 * CU, CU, eh)));
#else
  float e = min(sdBox(p - vec3(-3.5 * CU, 7.0 * CU, 0.0), vec3(0.5 * CU, CU, CDEP)),
                sdBox(p - vec3(3.5 * CU, 7.0 * CU, 0.0), vec3(0.5 * CU, CU, CDEP)));
#endif
  return max(d, -e);
}
// 1 inside an eye socket, for the inner light
float clawdEye(vec3 q) {
  vec2 a = abs(vec2(abs(q.x) - 3.5 * CU, q.y - 7.0 * CU)) - vec2(0.5 * CU, CU);
  return (max(a.x, a.y) < 0.002 && q.z > -0.5 * CDEP + 0.004) ? 1.0 : 0.0;
}""")

# 2) luminous Clawd shading in shadeHit
rep("""  if (h.mat == M_CLAWD) {
    // lit by the scene, plus an inner warmth so the orange holds in backlight
    c = A_CLAWD * (${fx(0.0)} + CLAWD_EMIT + P_SUNL * ndl * sh * 0.55 + (skyF + glowF) * ao * 0.55);
    c += P_SUNL * A_CLAWD * fres * 0.5;
  }""", """  if (h.mat == M_CLAWD) {
    // lit by the scene, plus an inner warmth so the orange holds in backlight
    c = A_CLAWD * (CLAWD_EMIT + P_SUNL * ndl * sh * 0.55 + (skyF + glowF) * ao * 0.55);
    c += P_SUNL * A_CLAWD * fres * 0.5;
#if LUMCLAWD
    vec3 q = toClawd(p);
    vec3 nl = vec3(CYAW.x * n.x - CYAW.y * n.z, n.y, CYAW.y * n.x + CYAW.x * n.z);
    // the front face glows from inside, hottest in the middle; side faces stay deeper
    float front = smoothstep(0.5, 0.95, -nl.z);
    vec2 cc = vec2(q.x / (8.0 * CU), (q.y - 5.0 * CU) / (5.0 * CU));
    float core = exp(-dot(cc, cc) * 1.6);
    c = mix(c, A_CLAWD * 1.25 + vec3(0.55, 0.24, 0.1) * core, front * 0.85);
    // the lip of the front face catches light like a chamfer
    float ez = abs(q.z + 0.5 * CDEP) < 0.35 * CU ? 1.0 : 0.0;
    c += vec3(1.0, 0.62, 0.38) * ez * (1.0 - front) * 0.8;
    // eyes: light pours out of the sockets
    c = mix(c, vec3(3.2, 2.4, 1.5), clawdEye(q));
#endif
  }""")

# 3) CLAWDONLY main
rep("""      Hit h = castScene(CAM, rd);
      acc += shadeHit(h, rd) + aura(rd, h.t);
      if (sx == 0 && sy == 0) aux = vec4(float(h.mat) + float(h.part) / 64.0, h.t, h.n.x, h.n.y);
    }
  }
  oCol = vec4(acc / float(N * N), 1.0);
  oAux = aux;""", """      Hit h = castScene(CAM, rd);
#if CLAWDONLY
      if (h.mat == M_CLAWD) { acc += shadeHit(h, rd); aux.x += 1.0; }
#else
      acc += shadeHit(h, rd) + aura(rd, h.t);
      if (sx == 0 && sy == 0) aux = vec4(float(h.mat) + float(h.part) / 64.0, h.t, h.n.x, h.n.y);
#endif
    }
  }
#if CLAWDONLY
  oCol = vec4(acc / max(aux.x, 1.0), aux.x / float(N * N));
  oAux = vec4(0.0);
#else
  oCol = vec4(acc / float(N * N), 1.0);
  oAux = aux;
#endif""")

stroke_code = open('C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/work/strokes.js.txt', encoding='utf-8').read()
rep("// ================================================================ RUNGS\n", stroke_code + "\n// ================================================================ RUNGS\n")

i0 = s.index("function rung4() {"); i1 = s.index("const RUNGS = { 3: rung3, 4: rung4 };")
s = s[:i0] + open('C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/work/rung4.js.txt', encoding='utf-8').read() + s[i1:]
open(p, 'w', encoding='utf-8').write(s)
print('ok')
