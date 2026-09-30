"""Pass 4: slimmer, softer shafts; a halo of resolved stragglers around each band; a larger
white-hot core; varied, dimmer golden-hour cumulus in the sim."""
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

# slimmer shafts
rep("    RAYS.push([ang, L, 0.020 + 0.020*r(), 0.55 + 0.65*r()]);  // angle, length, base half-width, intensity",
    "    RAYS.push([ang, L, 0.010 + 0.012*r(), 0.50 + 0.60*r()]);  // angle, length, base half-width, intensity")
rep("    float skirt = exp(-q*q/12.0)*0.16;\n    float fall = pow(1.0 - t, 1.25)/(0.55 + 0.45*al);",
    "    float skirt = exp(-q*q/16.0)*0.24;\n    float fall = pow(1.0 - t, 1.15)/(0.55 + 0.45*al);")

# more collectors, a quarter of them in a soft halo around each band
block("const BANDS = [", "for (const b of BANDS) if (QS.has('nscale'))", '''const BANDS = [
  { r: 0.50, dr: 0.018, e: 30, pa: -6, n: 40000 },
  { r: 0.72, dr: 0.026, e: 26, pa: -2, n: 60000 },
  { r: 0.97, dr: 0.036, e: 33, pa: -9, n: 90000 },
  { r: 1.25, dr: 0.024, e: 24, pa: 3,  n: 72000 },
  { r: 1.58, dr: 0.044, e: 29, pa: -5, n: 115000 },
];
''')
rep("  float wander = q5 < 0.03 ? 1.0 : 0.0;             // a few stragglers fray the band edges",
    "  float wander = q5 < 0.03 ? 1.0 : 0.0;             // a few stragglers fray the band edges\n"
    "  float halo = q5 > 0.75 ? 1.0 : 0.0;               // a quarter drift in a soft halo around the ringlets")
rep("  float rr = uR + (u*uDR + wander*g1*uDR*1.8)*wl;",
    "  float rr = uR + (mix(u, g1*1.5, halo)*uDR + wander*g1*uDR*1.8)*wl;")
rep("  float b = exp(1.0*gb - 0.5)*uGain;",
    "  float b = exp(1.0*gb - 0.5)*uGain*(1.0 - 0.35*halo);")

# larger white-hot core
rep("  col += vec3(1.00, 0.93, 0.84)*8.0*exp(-r*r/0.0020)\n       + vec3(1.00, 0.55, 0.26)*1.10*exp(-r/0.10)",
    "  col += vec3(1.00, 0.93, 0.84)*8.0*exp(-r*r/0.0036)\n       + vec3(1.00, 0.55, 0.26)*1.30*exp(-r/0.11)")
rep("  exposure: 1.0, bloom: 0.45,", "  exposure: 1.0, bloom: 0.55,")

# cumulus: one hero tower, varied puffs
block("const PUFFS = [];", "const puffArr = ", '''const PUFFS = [];
{
  const r = mulberry32(777);
  const clouds = [[640, 1125, 240, 185, 30], [1070, 1112, 170, 105, 22], [300, 1105, 120, 58, 14], [1390, 1100, 120, 52, 14], [1580, 1092, 70, 28, 8]];  // x, base y, half-width, height, puffs
  for (const [cx, yb, hw, ht, np] of clouds){
    for (let j = 0; j < np; j++){
      const v = Math.pow(r(), 0.75);
      const u = (r()*2 - 1)*(1 - 0.62*v);
      const rad = hw*(0.10 + 0.26*Math.pow(r(), 1.4))*(1 - 0.40*v);
      PUFFS.push(cx + u*hw, yb - v*ht, rad, yb);
    }
  }
}
''')
rep("uniform vec4 uPuff[80]; uniform int uNP;", "uniform vec4 uPuff[100]; uniform int uNP;")
rep("  for (int i = 0; i < 80; i++){ if (i >= uNP) break;\n    vec4 pf = uPuff[i];",
    "  for (int i = 0; i < 100; i++){ if (i >= uNP) break;\n    vec4 pf = uPuff[i];")
rep("  vec3 sky = mix(vec3(0.62, 0.72, 1.00)*0.30, vec3(0.90, 0.68, 0.86)*0.36, smoothstep(0.0, 0.5, yN));\n  sky = mix(sky, vec3(1.00, 0.76, 0.54)*0.56, smoothstep(0.45, 1.0, yN));",
    "  vec3 sky = mix(vec3(0.60, 0.70, 1.00)*0.26, vec3(0.90, 0.66, 0.84)*0.32, smoothstep(0.0, 0.5, yN));\n  sky = mix(sky, vec3(1.00, 0.74, 0.52)*0.50, smoothstep(0.45, 1.0, yN));")
rep("    vec3 c = mix(vec3(0.54, 0.50, 0.84)*0.26, vec3(0.98, 0.68, 0.70)*0.46, smoothstep(-0.1, 0.25, lam));\n    c = mix(c, vec3(1.00, 0.88, 0.72)*0.82, smoothstep(0.30, 0.75, lam));",
    "    vec3 c = mix(vec3(0.50, 0.46, 0.80)*0.24, vec3(0.96, 0.64, 0.68)*0.40, smoothstep(-0.1, 0.25, lam));\n    c = mix(c, vec3(1.00, 0.84, 0.70)*0.64, smoothstep(0.30, 0.75, lam));")

open(P, 'w', encoding='utf-8').write(s)
print('edit4 ok')
