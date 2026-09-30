"""v2 pass 3: shorter, warmer, uneven shafts with streaks along their length; crisper near bands
(large points only for the brightest); stronger silhouettes on the disk; the sim bubble gets a
horizon, a sea and a low sun so it reads as a world."""
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

# lanes: more uneven strength
rep("    LANES.push({ d: [Math.cos(ph)*Math.cos(de), Math.sin(ph)*Math.cos(de), Math.sin(de)], al, I: 0.5 + 0.8*r() });",
    "    LANES.push({ d: [Math.cos(ph)*Math.cos(de), Math.sin(ph)*Math.cos(de), Math.sin(de)], al, I: 0.30 + 1.0*Math.pow(r(), 1.5) });")

# shafts
block("    float x = along - cd*0.97;", "  col += vec3(1.0, 0.42, 0.18)*dust*0.010/(0.4 + r*r);", r'''    float x = along - cd*0.97;
    float start = smoothstep(-0.05, 0.08, x);
    float fall = exp(-max(x, 0.0)/(0.26 + 0.26*I))/(0.6 + 0.4*along*along);
    float streak = 0.62 + 0.76*(0.5 + 0.5*gn(vec2(along*1.3 + float(k)*7.1, psi/alS*2.6)));   // striations along the shaft
    vec3 bc = mix(vec3(1.0, 0.74, 0.46), vec3(1.0, 0.46, 0.20), smoothstep(0.0, 1.0, x));
    bsum += bc*I*wedge*start*fall*streak;
  }
  col += bsum*(0.45 + 1.1*dust)*0.85*uBeam;
''')

# collectors: tighter bands, large points only for the brightest near ones, darker backs over the disk
rep("    float halo = q5 > 0.92 ? 1.0 : 0.0;             // a few drift in a soft halo around the ringlets",
    "    float halo = q5 > 0.96 ? 1.0 : 0.0;             // a few drift in a soft halo around the ringlets")
rep("  bool big = uSide == 1 && uMode == 0 && q10 < smoothstep(0.62, 0.95, dz);",
    "  bool big = uSide == 1 && uMode == 0 && gb > 0.35 && q10 < smoothstep(0.55, 0.95, dz);")
rep("  if (P.z > 0.0) E *= mix(0.30, 1.0, smoothstep(uRStar*0.9, uRStar*2.4, length(P.xy)));",
    "  if (P.z > 0.0) E *= mix(0.18, 1.0, smoothstep(uRStar*0.9, uRStar*2.4, length(P.xy)));")
block("const BANDS = [", "for (const b of BANDS) if (QS.has('nscale'))", '''const BANDS = [
  { pa: -16, b: 0.07, s:  1, r: 1.00, dr: 0.010, n: 90000 },
  { pa:  38, b: 0.12, s: -1, r: 1.05, dr: 0.009, n: 70000 },
  { pa:  71, b: 0.30, s:  1, r: 0.95, dr: 0.010, n: 60000 },
  { pa:  -3, b: 0.48, s:  1, r: 1.09, dr: 0.014, n: 85000 },
  { pa:  47, b: 0.62, s:  1, r: 0.93, dr: 0.010, n: 65000 },
  { pa: -56, b: 0.55, s: -1, r: 1.02, dr: 0.012, n: 70000 },
  { pa:  18, b: 0.35, s: -1, r: 1.14, dr: 0.015, n: 85000 },
];
''')

# the sim bubble: a world with a horizon (sea, low sun, a few clouds) under its golden-hour sky
rep("  pearl: [-0.42, 0.36, 0.40, 0.19],   // the sim world: centre (x, y, z toward camera) and radius (swarm units)",
    "  pearl: [-0.42, 0.36, 0.40, 0.21],   // the sim world: centre (x, y, z toward camera) and radius (swarm units)")
block("  float yN = d.y*0.5 + 0.5;", "  // membrane: soap-film rim", r'''  float yN = d.y*0.5 + 0.5;
  const float HZ = 0.30;                                   // horizon height (pearl-local y)
  vec3 sky = mix(vec3(0.60, 0.64, 1.00)*0.34, vec3(1.00, 0.64, 0.72)*0.46, smoothstep(0.05, 0.50, yN));
  sky = mix(sky, vec3(1.00, 0.80, 0.50)*0.90, smoothstep(0.45, 0.64, yN));
  vec2 sun = vec2(0.22, HZ - 0.07);
  sky += vec3(1.0, 0.72, 0.40)*0.9*exp(-dot(d - sun, d - sun)/0.05);
  float cd = puffs(d);
  if (cd < 0.05){
    float gx = puffs(d + vec2(0.02, 0.0)) - cd, gy = puffs(d + vec2(0.0, 0.02)) - cd;
    vec2 g = normalize(vec2(gx, gy) + 1e-6);
    float lam = dot(g, normalize(vec2(0.7, -0.7)))*0.5 + 0.5;
    vec3 cc = mix(vec3(0.80, 0.56, 0.78)*0.40, vec3(1.0, 0.86, 0.66)*0.85, smoothstep(0.35, 0.75, lam));
    sky = mix(sky, cc, clamp(-cd*pr + 0.5, 0.0, 1.0));
  }
  sky += vec3(1.0, 0.96, 0.86)*3.0*smoothstep(0.075, 0.045, length(d - sun));   // the sim's own low sun
  // the sea below the horizon, with the sun's glitter path
  if (d.y > HZ){
    float depth = (d.y - HZ)/(1.0 - HZ);
    vec3 sea = mix(vec3(0.62, 0.44, 0.66)*0.40, vec3(0.20, 0.20, 0.42)*0.30, smoothstep(0.0, 0.8, depth));
    float path = exp(-pow((d.x - sun.x)/(0.05 + 0.25*depth), 2.0))*(0.6 + 0.4*gn(vec2(d.x*30.0, d.y*90.0)));
    sea += vec3(1.0, 0.80, 0.52)*path*0.9*(1.0 - 0.5*depth);
    sky = mix(sky, sea, smoothstep(HZ, HZ + 0.012, d.y));
  }
''')
rep("  vec3 pf[7] = vec3[7](vec3(-0.42, 0.52, 0.22), vec3(-0.20, 0.44, 0.26), vec3(0.04, 0.50, 0.20), vec3(0.24, 0.58, 0.17),\n                       vec3(-0.30, 0.30, 0.16), vec3(-0.10, 0.26, 0.15), vec3(0.46, 0.62, 0.14));",
    "  vec3 pf[7] = vec3[7](vec3(-0.52, 0.16, 0.17), vec3(-0.34, 0.10, 0.20), vec3(-0.14, 0.15, 0.15), vec3(0.50, 0.14, 0.12),\n                       vec3(-0.42, -0.04, 0.13), vec3(-0.26, -0.08, 0.12), vec3(0.62, 0.10, 0.10));")
rep("  return max(d, p.y - 0.66);   // flat base", "  return max(d, p.y - 0.24);   // flat bases, just above the horizon")

open(P, 'w', encoding='utf-8').write(s)
print('v2edit3 ok')
