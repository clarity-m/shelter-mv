"""Pass 5: rays nearly invisible inside the swarm (no spider-web), band hierarchy and gentle warps,
stronger lit-cup contrast, smooth-union anime cumulus, a more luminous sim rim."""
P = 'C:/Users/USER/Projects/shelter-mv/style-frames/04b-swarm-contrast/frame.html'
s = open(P, encoding='utf-8').read()

def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, (old[:70], n)
    s = s.replace(old, new)

def block(start, end, new):
    global s
    i = s.index(start); j = s.index(end, i)
    s = s[:i] + new + s[j:]

# rays: the swept interior shows almost nothing; glints subtler
rep("float dust = mix(0.10, 1.0, smoothstep(1.35, 1.95, pr))", "float dust = mix(0.035, 1.0, smoothstep(1.40, 2.00, pr))")
rep("  else E = b*(cLit*lit*uKFar*pow(f, 1.5) + cHeat*uKNear*(0.5 + 0.5*lit)*(1.0 - f) + cRay*ray*0.35);",
    "  else E = uBG*b*(cLit*lit*uKFar*pow(f, 1.5) + cHeat*uKNear*(0.5 + 0.5*lit)*(1.0 - f) + cRay*ray*0.16);")
rep("  kFar: 0.16, kNear: 0.06,        // lit far faces, warm near backs",
    "  kFar: 0.18, kNear: 0.045,       // lit far faces, warm near backs")

# band hierarchy and warps
block("const BANDS = [", "for (const b of BANDS) if (QS.has('nscale'))", '''const BANDS = [   // g: brightness, w: warp amplitude (swarm units)
  { r: 0.50, dr: 0.018, e: 30, pa: -6, n: 40000,  g: 1.10, w: 0.008 },
  { r: 0.72, dr: 0.026, e: 26, pa: -2, n: 60000,  g: 0.75, w: 0.014 },
  { r: 0.97, dr: 0.036, e: 33, pa: -9, n: 90000,  g: 1.25, w: 0.018 },
  { r: 1.25, dr: 0.024, e: 24, pa: 3,  n: 72000,  g: 0.70, w: 0.024 },
  { r: 1.58, dr: 0.044, e: 29, pa: -5, n: 115000, g: 0.62, w: 0.030 },
];
''')
rep("uniform float uGain; uniform float uRStar; uniform int uMode;",
    "uniform float uBG; uniform vec2 uWarp;\nuniform float uGain; uniform float uRStar; uniform int uMode;")
rep("  float hh = g2*uDR*0.05*(1.0 + wander*3.0);",
    "  float hh = g2*uDR*0.05*(1.0 + wander*3.0) + uWarp.x*sin(2.0*lam + uWarp.y);   // gentle precession warp")
rep("uMode: { i: 0 }, uBa: b.a,", "uMode: { i: 0 }, uBG: b.g, uWarp: [b.w, b.seed % 628 / 100], uBa: b.a,")
rep("uMode: { i: 2 }, uRow: { i: 0 },", "uMode: { i: 2 }, uBG: 1, uWarp: [0, 0], uRow: { i: 0 },")

# cumulus: smooth union of the puffs, shaded as one mass (anime three-tone)
block("  // cumulus towers: sphere piles lit from the upper right", "  o = vec4(col, cov);", r'''  // cumulus towers: a smooth union of puffs, shaded as one mass in three soft tones
  float d0 = cloudSD(px);
  if (d0 < 2.0){
    float gx = cloudSD(px + vec2(1.5, 0.0)) - d0, gy = cloudSD(px + vec2(0.0, 1.5)) - d0;
    vec2 g = normalize(vec2(gx, gy) + 1e-6);
    float t = clamp(-d0/34.0, 0.0, 1.0);
    vec3 nrm = normalize(vec3(g*sqrt(max(1.0 - t*t, 0.0)), t + 0.05));
    vec3 L = normalize(vec3(0.62, -0.50, 0.60));
    float lam = dot(nrm, L) + 0.10*gn(px/26.0);
    vec3 c = mix(vec3(0.50, 0.46, 0.80)*0.24, vec3(0.96, 0.64, 0.68)*0.40, smoothstep(-0.05, 0.20, lam));
    c = mix(c, vec3(1.00, 0.84, 0.70)*0.64, smoothstep(0.38, 0.62, lam));
    c += vec3(1.0, 0.86, 0.66)*0.40*pow(1.0 - t, 6.0)*smoothstep(0.1, 0.6, dot(g, normalize(L.xy)));
    c *= mix(0.82, 1.0, smoothstep(1090.0, 1000.0, px.y));
    c *= 1.0 + 0.25*warm;
    col = mix(col, c, clamp(-d0 + 0.5, 0.0, 1.0));
  }
''')
rep("uniform vec4 uPuff[100]; uniform int uNP;\nout vec4 o;", r'''uniform vec4 uPuff[100]; uniform int uNP;
out vec4 o;
float cloudSD(vec2 p){   // signed distance to the union of all puffs, smooth-min blended (k = 10 px)
  float d = 1e5;
  for (int i = 0; i < 100; i++){ if (i >= uNP) break;
    vec4 pf = uPuff[i];
    float di = length(p - pf.xy) - pf.z;
    float h = clamp(0.5 + 0.5*(di - d)/10.0, 0.0, 1.0);
    d = mix(di, d, h) - 10.0*h*(1.0 - h);
  }
  return d;
}''')

# a more luminous boundary
rep("+ vec3(1.0, 0.86, 0.76)*0.25*outer;", "+ vec3(1.0, 0.86, 0.76)*0.40*outer;")
rep("  float outer = dep < 0.0 ? exp(dep/3.0) : 0.0;", "  float outer = dep < 0.0 ? exp(dep/5.0) : 0.0;")

open(P, 'w', encoding='utf-8').write(s)
print('edit5 ok')
