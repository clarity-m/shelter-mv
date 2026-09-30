"""v2 pass 4: shafts that glow where they leave the shell and die within about a radius (softer start,
warmer colour); a third near-edge-on band so the disk carries clear silhouettes; a slightly larger disk."""
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

block("    float x = along - cd*0.97;", "  col += vec3(1.0, 0.42, 0.18)*dust*0.010/(0.4 + r*r);", r'''    float x = along - cd*0.97;
    float start = smoothstep(-0.10, 0.16, x);
    float fall = exp(-max(x, 0.0)/(0.16 + 0.22*I))/(0.5 + 0.5*along*along);
    float streak = 0.62 + 0.76*(0.5 + 0.5*gn(vec2(along*1.3 + float(k)*7.1, psi/alS*2.6)));   // striations along the shaft
    vec3 bc = mix(vec3(1.0, 0.70, 0.40), vec3(1.0, 0.44, 0.18), smoothstep(0.0, 0.9, x));
    bsum += bc*I*wedge*start*fall*streak;
  }
  col += bsum*(0.45 + 1.1*dust)*1.25*uBeam;
''')

rep("  rStar: 0.15,                        // photosphere radius (swarm units)",
    "  rStar: 0.17,                        // photosphere radius (swarm units)")
block("const BANDS = [", "for (const b of BANDS) if (QS.has('nscale'))", '''const BANDS = [
  { pa: -16, b: 0.07, s:  1, r: 1.00, dr: 0.010, n: 90000 },
  { pa:  38, b: 0.12, s: -1, r: 1.05, dr: 0.009, n: 70000 },
  { pa:  71, b: 0.30, s:  1, r: 0.95, dr: 0.010, n: 60000 },
  { pa:  -3, b: 0.48, s:  1, r: 1.09, dr: 0.014, n: 85000 },
  { pa:  47, b: 0.62, s:  1, r: 0.93, dr: 0.010, n: 65000 },
  { pa: -56, b: 0.55, s: -1, r: 1.02, dr: 0.012, n: 70000 },
  { pa:  18, b: 0.35, s: -1, r: 1.14, dr: 0.015, n: 85000 },
  { pa: 104, b: 0.05, s: -1, r: 0.98, dr: 0.009, n: 60000 },
];
''')
rep("  if (P.z > 0.0) E *= mix(0.18, 1.0, smoothstep(uRStar*0.9, uRStar*2.4, length(P.xy)));",
    "  if (P.z > 0.0) E *= mix(0.10, 1.0, smoothstep(uRStar*0.9, uRStar*2.2, length(P.xy)));")
rep("  occ: 0.85,                          // how much a near collector hides what is behind it",
    "  occ: 0.92,                          // how much a near collector hides what is behind it")

open(P, 'w', encoding='utf-8').write(s)
print('v2edit4 ok')
