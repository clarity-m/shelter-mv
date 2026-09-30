"""Pass 8: collectors closer to Claude orange; a sparse set of bright glinting collectors so the
bands sparkle even at thumbnail size."""
P = 'C:/Users/USER/Projects/shelter-mv/style-frames/04b-swarm-contrast/frame.html'
s = open(P, encoding='utf-8').read()

def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, (old[:70], n)
    s = s.replace(old, new)

rep("  float q1 = U01(s), q2 = U01(s), q3 = U01(s), q4 = U01(s), q5 = U01(s), q6 = U01(s), q7 = U01(s), q8 = U01(s);",
    "  float q1 = U01(s), q2 = U01(s), q3 = U01(s), q4 = U01(s), q5 = U01(s), q6 = U01(s), q7 = U01(s), q8 = U01(s), q9 = U01(s);")
rep("  float b = exp(1.0*gb - 0.5)*uGain*(1.0 - 0.35*halo);",
    "  float b = exp(1.0*gb - 0.5)*uGain*(1.0 - 0.35*halo)*(q9 < 0.003 ? 3.5 : 1.0);   // a few catch the light and glint")
rep("  vec3 cLit = vec3(1.00, 0.62, 0.32), cHeat = vec3(1.00, 0.30, 0.13), cRay = vec3(1.0, 0.80, 0.60);",
    "  vec3 cLit = vec3(1.00, 0.52, 0.28), cHeat = vec3(1.00, 0.30, 0.14), cRay = vec3(1.0, 0.78, 0.58);")

open(P, 'w', encoding='utf-8').write(s)
print('edit8 ok')
