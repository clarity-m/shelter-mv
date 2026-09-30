"""Pass 7: near-side collectors partly occlude what lies behind them (arcs read in depth against
the glow), softer and lighter cloud shading, a warmer soap-film rim."""
P = 'C:/Users/USER/Projects/shelter-mv/style-frames/04b-swarm-contrast/frame.html'
s = open(P, encoding='utf-8').read()

def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, (old[:70], n)
    s = s.replace(old, new)

# near-side occlusion
rep("uniform float uBG; uniform vec2 uWarp;", "uniform float uBG; uniform vec2 uWarp; uniform float uOcc;")
rep("  vec3 E; float a = 0.0;\n", "  vec3 E; float a = (uMode == 0 && uSide == 1) ? uOcc : 0.0;   // warm backs hide a little of the glow behind them\n")
rep("    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);\n    drawBands(1);\n    drawBands(2);",
    "    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);\n    drawBands(1);\n    gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);\n    drawBands(2);")
rep("uKFar: P.kFar, uKNear: P.kNear, uSide: { i: side } }, rayU);", "uKFar: P.kFar, uKNear: P.kNear, uOcc: P.occ, uSide: { i: side } }, rayU);")
rep("  kFar: 0.18, kNear: 0.045,       // lit far faces, warm near backs",
    "  kFar: 0.18, kNear: 0.045,       // lit far faces, warm near backs\n  occ: 0.35,                      // how much each near-side collector hides behind it")
rep("for (const k of ['gain', 'kFar', 'kNear',", "for (const k of ['gain', 'kFar', 'kNear', 'occ',")

# softer cloud shading
rep("    float dS = cloudSD(px, 30.0);\n    float gx = cloudSD(px + vec2(2.0, 0.0), 30.0) - dS, gy = cloudSD(px + vec2(0.0, 2.0), 30.0) - dS;",
    "    float dS = cloudSD(px, 44.0);\n    float gx = cloudSD(px + vec2(2.0, 0.0), 44.0) - dS, gy = cloudSD(px + vec2(0.0, 2.0), 44.0) - dS;")
rep("    vec3 c = mix(vec3(0.62, 0.56, 0.86)*0.28, vec3(0.98, 0.70, 0.72)*0.42, smoothstep(-0.10, 0.25, lam));\n    c = mix(c, vec3(1.00, 0.86, 0.72)*0.60, smoothstep(0.40, 0.70, lam));",
    "    vec3 c = mix(vec3(0.72, 0.62, 0.90)*0.30, vec3(0.98, 0.70, 0.72)*0.42, smoothstep(-0.30, 0.30, lam));\n    c = mix(c, vec3(1.00, 0.86, 0.72)*0.60, smoothstep(0.35, 0.75, lam));")

# warmer soap-film rim
rep("  vec3 irid = 0.5 + 0.5*cos(6.28318*(th*1.2 + vec3(0.02, 0.36, 0.68)));",
    "  vec3 irid = (0.5 + 0.5*cos(6.28318*(th*1.2 + vec3(0.02, 0.36, 0.68))))*vec3(1.0, 0.86, 1.0);")
rep("           + mix(vec3(1.0, 0.95, 0.90), irid, 0.55)*0.50*film",
    "           + mix(vec3(1.0, 0.92, 0.88), irid, 0.45)*0.50*film")

open(P, 'w', encoding='utf-8').write(s)
print('edit7 ok')
