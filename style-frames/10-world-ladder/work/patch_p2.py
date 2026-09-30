p = 'C:/Users/USER/Projects/shelter-mv/style-frames/10-world-ladder/ladder.html'
s = open(p, encoding='utf-8').read()

def rep(old, new, count=1):
    global s
    if old not in s:
        raise SystemExit('NOT FOUND: ' + old[:90])
    s = s.replace(old, new, count)

# ---- aura: a warm-white glow behind him (not on him), like the halo rings of rungs 1-2
rep("""vec3 aura(vec3 rd, float tmax) {
  vec3 oc = CGLOW - CAM; float tc = dot(oc, rd);
  float d2 = max(dot(oc, oc) - tc * tc, 0.0);
  float inFront = smoothstep(-0.4, 0.2, tmax - tc);
  return P_CLAWDL * AURA_K * (exp(-d2 / (AURA_S * AURA_S)) + 0.35 * exp(-d2 / (9.0 * AURA_S * AURA_S))) * inFront;
}""", """vec3 aura(vec3 rd, float tmax) {
  vec3 oc = CGLOW - CAM; float tc = dot(oc, rd);
  float d2 = max(dot(oc, oc) - tc * tc, 0.0);
  float behind = smoothstep(0.15, 0.6, tmax - tc);
  vec3 warmWhite = vec3(1.0, 0.78, 0.58);
  return warmWhite * AURA_K * (exp(-d2 / (AURA_S * AURA_S)) + 0.4 * exp(-d2 / (6.0 * AURA_S * AURA_S))) * behind;
}""")

# ---- a define for painterly texture in the underpainting
rep("#define LUMCLAWD ${opt.lumClawd ? 1 : 0}", "#define LUMCLAWD ${opt.lumClawd ? 1 : 0}\n#define PAINTTEX ${opt.paintTex ? 1 : 0}")
rep("""  if (h.mat == M_HILL) {
    float v = vnoise2(p.xz * 1.3) * 0.6 + vnoise2(p.xz * 4.0) * 0.4;
    alb *= 0.88 + 0.24 * v;
    alb = mix(alb, A_FLOOR, floorMix(p.xz));
  }""", """  if (h.mat == M_HILL) {
    float v = vnoise2(p.xz * 1.3) * 0.6 + vnoise2(p.xz * 4.0) * 0.4;
    alb *= 0.88 + 0.24 * v;
#if PAINTTEX
    // grass a painter would mix: warm and cool patches, streaks along the slope
    float n1 = vnoise2(p.xz * 0.8 + 3.0), n2 = vnoise2(p.xz * 2.6 + 7.0), n3 = vnoise2(vec2(p.x * 9.0, p.z * 2.2));
    alb *= 0.8 + 0.4 * n1 + 0.2 * (n3 - 0.5);
    alb = mix(alb, alb * vec3(1.35, 1.15, 0.6), smoothstep(0.5, 0.85, n2) * 0.6);
    alb = mix(alb, alb * vec3(0.75, 0.95, 1.3), smoothstep(0.5, 0.15, n1) * 0.5);
#endif
    alb = mix(alb, A_FLOOR, floorMix(p.xz));
  }
#if PAINTTEX
  if (h.mat == M_LEAF) {
    vec3 q = p - TPOS;
    float n1 = vnoise(q * 2.2), n2 = vnoise(q * 5.5 + 3.0);
    alb *= 0.75 + 0.5 * n1;
    alb = mix(alb, alb * vec3(1.3, 1.2, 0.65), smoothstep(0.55, 0.85, n2) * 0.7);
    alb = mix(alb, alb * vec3(0.7, 0.9, 1.35), smoothstep(0.45, 0.15, n2) * 0.5);
  }
#endif""")
# more sky light on up-facing leaves (clumps read as lit tops)
rep("""  vec3 skyF = P_SKYF * (0.3 + 0.7 * up);""", """  vec3 skyF = P_SKYF * (0.3 + 0.7 * up) * (h.mat == M_LEAF ? 1.35 : 1.0);""")

# ---- rung 3 Clawd: saturated, glowing a little, light pool on the grass
rep("""  const opt = { lowpoly: true, clawd3d: true, pal: 3, gridAlpha: 0.4, floorGrid: 0.55, fog: 0.016, clawdEmit: 0.72, auraK: 0.16, auraS: 0.5 };""",
    """  const opt = { lowpoly: true, clawd3d: true, pal: 3, gridAlpha: 0.45, floorGrid: 0.55, fog: 0.016, clawdEmit: 0.85, auraK: 0.32, auraS: 0.42 };""")
rep("""P_CLAWDL: ['#E8835F', 1.0],\n    A_HILL: '#6E9A57'""", """P_CLAWDL: ['#E8835F', 2.2],\n    A_HILL: '#6E9A57'""")
# low-poly facets read more: bigger height jitter, stronger per-facet tone
rep("""  return h + (hash12(vec2(v) * 1.7 + 3.1) - 0.5) * 0.13 * smoothstep(0.02, 0.4, h);""",
    """  return h + (hash12(vec2(v) * 1.7 + 3.1) - 0.5) * 0.2 * smoothstep(0.02, 0.4, h);""")
rep("""#if LOWPOLY
  alb *= 0.94 + 0.12 * h.fid;
#endif""", """#if LOWPOLY
  alb *= 0.9 + 0.2 * h.fid;
#endif""")

# ---- rung 4: luminous Clawd stays saturated; warm-white aura; texture on
rep("""    c = mix(c, A_CLAWD * 1.25 + vec3(0.55, 0.24, 0.1) * core, front * 0.85);""",
    """    c = mix(c, A_CLAWD * (1.15 + 0.55 * core) + vec3(0.12, 0.04, 0.0) * core, front * 0.9);""")
rep("""  const opt = { lowpoly: false, clawd3d: true, leafNoise: true, pal: 4, gridAlpha: 0.3, floorGrid: 0.4, fog: 0.02, clawdEmit: 0.8, auraK: 0.22, auraS: 0.5, eyesRecess: true, lumClawd: true };""",
    """  const opt = { lowpoly: false, clawd3d: true, leafNoise: true, pal: 4, gridAlpha: 0.4, floorGrid: 0.4, fog: 0.02, clawdEmit: 0.8, auraK: 0.55, auraS: 0.45, eyesRecess: true, lumClawd: true, paintTex: true };""")
rep("""P_GLOWL: ['#FF9E7C', 1.0], P_CLAWDL: ['#F08A60', 1.5],""", """P_GLOWL: ['#FF9E7C', 1.0], P_CLAWDL: ['#F08A60', 3.0],""")

# ---- strokes: paint ridges and more colour drift so the marks read
rep("""  float v = (h1(fid * 4.4) - 0.5);
  col *= 1.0 + v * 0.07;
  col = mix(col, col * vec3(1.03, 1.0, 0.97), h1(fid * 7.2) - 0.5);""", """  float v = (h1(fid * 4.4) - 0.5);
  col *= 1.0 + v * (mat == 0 ? 0.05 : 0.16);
  float tmp = h1(fid * 7.2) - 0.5;
  col *= mix(vec3(1.0), tmp > 0.0 ? vec3(1.06, 1.0, 0.9) : vec3(0.93, 0.99, 1.08), abs(tmp) * (mat == 0 ? 0.8 : 1.6));""")
rep("""  vec3 c = vCol * (0.95 + 0.1 * vn(vec2(q.y * 11.0 + vSeed * 9.0, q.x * 3.0)));
  o = vec4(c * a, a);""", """  vec3 c = vCol * (0.95 + 0.1 * vn(vec2(q.y * 11.0 + vSeed * 9.0, q.x * 3.0)));
  // paint ridge: the loaded edge of the stroke catches a little more light
  c *= 1.0 + 0.07 * (q.y - 0.5) * 2.0 - 0.05 * smoothstep(0.6, 1.0, across);
  o = vec4(c * a, a);""")

# ---- rung 5: tighter pool, dimmer old sun, figure lit from the spark side
rep("""    float pool = pow(smoothstep(900.0, 40.0, ds), 1.6);
    g += lc * ln * (0.05 + 1.3 * pool) * smoothstep(3.2, 7.0, a.y);""", """    float pool = pow(smoothstep(760.0, 30.0, ds), 2.2);
    g += lc * ln * (0.015 + 1.6 * pool) * smoothstep(3.2, 7.0, a.y);""")
rep("""  P_SUNC: ['#FFD39A', 1.3], P_DISC: ['#FFF4E0', 2.2],""", """  P_SUNC: ['#FFD39A', 0.75], P_DISC: ['#FFE6C8', 1.2],""")
rep("""    g = c * 0.42 + vec3(0.9, 0.55, 0.35) * e * 1.8;""", """    float side = smoothstep(-0.2, 0.9, (uSpark.x - px.x) < 0.0 ? -1.0 : 1.0);
    g = c * 0.42 + vec3(0.9, 0.55, 0.35) * e * (1.2 + 1.2 * side);""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
