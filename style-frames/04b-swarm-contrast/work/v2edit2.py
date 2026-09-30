"""v2 pass 2: luminous warm shafts that fade soon after leaving the shell (light, not smoke), a much
sparser veil, thinner bands, backlit near collectors over the disk, a larger disk, and a bigger, warmer
sim bubble."""
P = 'C:/Users/USER/Projects/shelter-mv/style-frames/04b-swarm-contrast/frame-v2.html'
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

# params
rep("  rStar: 0.12,                        // photosphere radius (swarm units)",
    "  rStar: 0.15,                        // photosphere radius (swarm units)")
rep("  pearl: [-0.47, 0.33, 0.30, 0.14],   // the sim world: centre (x, y, z toward camera) and radius (swarm units)",
    "  pearl: [-0.42, 0.36, 0.40, 0.19],   // the sim world: centre (x, y, z toward camera) and radius (swarm units)")
rep("  nVeil: 140000,                      // sparse collectors between the bands: the shell itself",
    "  nVeil: 40000,                       // sparse collectors between the bands: the shell itself")
rep("  exposure: 1.0, bloom: 0.45,", "  exposure: 1.0, bloom: 0.35,")

# thinner bands
block("const BANDS = [", "for (const b of BANDS) if (QS.has('nscale'))", '''const BANDS = [
  { pa: -16, b: 0.07, s:  1, r: 1.00, dr: 0.013, n: 70000 },
  { pa:  38, b: 0.12, s: -1, r: 1.05, dr: 0.011, n: 62000 },
  { pa:  71, b: 0.30, s:  1, r: 0.95, dr: 0.012, n: 60000 },
  { pa:  -3, b: 0.48, s:  1, r: 1.09, dr: 0.018, n: 85000 },
  { pa:  47, b: 0.62, s:  1, r: 0.93, dr: 0.013, n: 65000 },
  { pa: -56, b: 0.55, s: -1, r: 1.02, dr: 0.015, n: 70000 },
  { pa:  18, b: 0.35, s: -1, r: 1.14, dr: 0.019, n: 85000 },
];
''')

# collectors: fewer halo stragglers, big points only at the front, backlit over the disk
rep("    float halo = q5 > 0.78 ? 1.0 : 0.0;             // a fifth drift in a soft halo around the ringlets",
    "    float halo = q5 > 0.92 ? 1.0 : 0.0;             // a few drift in a soft halo around the ringlets")
rep("  bool big = uSide == 1 && uMode == 0 && q10 < smoothstep(0.55, 0.92, dz);",
    "  bool big = uSide == 1 && uMode == 0 && q10 < smoothstep(0.62, 0.95, dz);")
rep("  float b = exp(0.8*gb - 0.32)*uGain*(uMode == 1 ? 0.30 : 1.0);",
    "  float b = exp(0.8*gb - 0.32)*uGain*(uMode == 1 ? 0.18 : 1.0);")
rep("  E += b*vec3(1.0, 0.85, 0.65)*0.6*open;              // the collectors lining a lane catch its light\n",
    "  E += b*vec3(1.0, 0.85, 0.65)*0.6*open;              // the collectors lining a lane catch its light\n"
    "  if (P.z > 0.0) E *= mix(0.30, 1.0, smoothstep(uRStar*0.9, uRStar*2.4, length(P.xy)));   // backlit: we see their dark backs against the star\n")

# star disk slightly softer so silhouettes survive the bloom
rep("  vec3 dc = vec3(1.0, 0.93, 0.82)*9.0*(0.55 + 0.45*mu);", "  vec3 dc = vec3(1.0, 0.93, 0.82)*7.0*(0.55 + 0.45*mu);")

# shafts: light first, dust second; bright where they leave the shell, gone within ~1.5 radii
block("  float dust = dustField(px, r)*uDust;", "  col += vec3(1.0, 0.42, 0.18)*dust*0.010/(0.4 + r*r);", r'''  float dust = dustField(px, r)*uDust;
  vec3 bsum = vec3(0.0);
  for (int k = 0; k < 12; k++){ if (k >= uNL) break;
    vec3 d3 = uLane[k].xyz; float al = uLaneP[k].x, I = uLaneP[k].y;
    float cd = max(length(d3.xy), 0.2); vec2 e = d3.xy/cd;
    float along = dot(s, e); if (along <= 0.0) continue;
    float perp = abs(s.x*e.y - s.y*e.x);
    float psi = atan(perp, along);
    float alS = atan(tan(al)/cd);
    float wedge = 1.0 - smoothstep(alS*0.35, alS*1.30, psi);
    float x = along - cd*0.97;
    float start = smoothstep(-0.05, 0.08, x);
    float fall = exp(-max(x, 0.0)/(0.45 + 0.35*I))/(0.6 + 0.4*along*along);
    vec3 bc = mix(vec3(1.0, 0.82, 0.58), vec3(1.0, 0.50, 0.22), smoothstep(0.0, 1.2, x));
    bsum += bc*I*wedge*start*fall;
  }
  col += bsum*(0.35 + 1.3*dust)*0.60*uBeam;
''')
rep("  vec2 q = px/230.0;\n  vec2 w = vec2(fbm(q*0.8 + vec2(1.7, 9.2), 4), fbm(q*0.8 + vec2(8.3, 2.8), 4));\n  float f = fbm(q*1.4 + 1.3*w + vec2(3.1, 7.7), 6);\n  float d = smoothstep(-0.10, 0.45, f);\n  return d*d*",
    "  vec2 q = px/150.0;\n  vec2 w = vec2(fbm(q*0.7 + vec2(1.7, 9.2), 4), fbm(q*0.7 + vec2(8.3, 2.8), 4));\n  float f = fbm(q*1.3 + 1.1*w + vec2(3.1, 7.7), 6);\n  float d = smoothstep(-0.20, 0.50, f);\n  return d*")

# the sim bubble: a warmer golden-hour sky so it reads as sky, not as a planet
rep("  vec3 sky = mix(vec3(0.48, 0.62, 1.00)*0.34, vec3(0.94, 0.66, 0.84)*0.40, smoothstep(0.15, 0.62, yN));\n  sky = mix(sky, vec3(1.00, 0.78, 0.52)*0.62, smoothstep(0.58, 0.92, yN));",
    "  vec3 sky = mix(vec3(0.64, 0.66, 1.00)*0.34, vec3(1.00, 0.66, 0.74)*0.46, smoothstep(0.10, 0.55, yN));\n  sky = mix(sky, vec3(1.00, 0.80, 0.52)*0.80, smoothstep(0.55, 0.88, yN));")

open(P, 'w', encoding='utf-8').write(s)
print('v2edit2 ok')
