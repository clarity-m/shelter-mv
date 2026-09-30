"""Pass 6: soft cloud shading from a smoother field (no dark seams), a calm soap-film rim,
varied ray widths and a tighter spark, a warmer Alpha Cen A, slightly dimmer sim."""
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

# rays: irregular widths, a slightly tighter spark
rep("    const Lp = 2.3 + 1.4*r();                                   // in-plane length (swarm units)",
    "    const Lp = 2.1 + 1.25*r();                                  // in-plane length (swarm units)")
rep("    RAYS.push([ang, L, 0.010 + 0.012*r(), 0.50 + 0.60*r()]);  // angle, length, base half-width, intensity",
    "    RAYS.push([ang, L, 0.008 + 0.022*Math.pow(r(), 1.6), 0.50 + 0.60*r()]);  // angle, length, base half-width, intensity")

# clouds: silhouette from the crisp union, shading from a much smoother one
rep("float cloudSD(vec2 p){   // signed distance to the union of all puffs, smooth-min blended (k = 10 px)",
    "float cloudSD(vec2 p, float k){   // signed distance to the union of all puffs, smooth-min blended over k px")
rep("    float h = clamp(0.5 + 0.5*(di - d)/10.0, 0.0, 1.0);\n    d = mix(di, d, h) - 10.0*h*(1.0 - h);",
    "    float h = clamp(0.5 + 0.5*(di - d)/k, 0.0, 1.0);\n    d = mix(di, d, h) - k*h*(1.0 - h);")
block("  float d0 = cloudSD(px);", "  o = vec4(col, cov);", r'''  float d0 = cloudSD(px, 9.0);
  if (d0 < 2.0){
    float dS = cloudSD(px, 30.0);
    float gx = cloudSD(px + vec2(2.0, 0.0), 30.0) - dS, gy = cloudSD(px + vec2(0.0, 2.0), 30.0) - dS;
    vec2 g = normalize(vec2(gx, gy) + 1e-6);
    float t = clamp(-min(d0, dS)/40.0, 0.0, 1.0);
    vec3 nrm = normalize(vec3(g*sqrt(max(1.0 - t*t, 0.0)), t + 0.10));
    vec3 L = normalize(vec3(0.62, -0.50, 0.60));
    float lam = dot(nrm, L) + 0.06*gn(px/26.0);
    vec3 c = mix(vec3(0.62, 0.56, 0.86)*0.28, vec3(0.98, 0.70, 0.72)*0.42, smoothstep(-0.10, 0.25, lam));
    c = mix(c, vec3(1.00, 0.86, 0.72)*0.60, smoothstep(0.40, 0.70, lam));
    c += vec3(1.0, 0.86, 0.66)*0.30*pow(1.0 - clamp(-d0/12.0, 0.0, 1.0), 3.0)*smoothstep(0.1, 0.6, dot(g, normalize(L.xy)));
    c *= mix(0.86, 1.0, smoothstep(1090.0, 1000.0, px.y));
    c *= 1.0 + 0.20*warm;
    col = mix(col, c, clamp(-d0 + 0.5, 0.0, 1.0));
  }
  col *= 0.88;
''')

# rim: slow, pastel soap-film drift instead of a dotted rainbow
rep("  float th = 0.5 + 0.5*gn(vec2(ph*30.0, 1.3)) + 0.35*gn(vec2(ph*90.0, 5.1));",
    "  float th = 0.5 + 0.5*gn(vec2(ph*7.0, 1.3)) + 0.22*gn(vec2(ph*19.0, 5.1));")
rep("  vec3 irid = 0.5 + 0.5*cos(6.28318*(th*1.5 + vec3(0.02, 0.36, 0.68)));",
    "  vec3 irid = 0.5 + 0.5*cos(6.28318*(th*1.2 + vec3(0.02, 0.36, 0.68)));")
rep("           + mix(vec3(1.0), irid, 0.8)*0.55*film",
    "           + mix(vec3(1.0, 0.95, 0.90), irid, 0.55)*0.50*film")

# Alpha Cen A: yellow-white, tighter halo
rep("  vec3 c = vec3(1.0, 0.95, 0.80)*(28.0*(1.0 - smoothstep(1.3, 2.8, d)) + 2.4*exp(-d*d/30.0) + 0.40*exp(-d*d/260.0)) + vec3(1.0, 0.92, 0.75)*0.06*exp(-d/40.0);",
    "  vec3 c = vec3(1.0, 0.94, 0.76)*(30.0*(1.0 - smoothstep(1.4, 2.9, d)) + 2.6*exp(-d*d/26.0) + 0.36*exp(-d*d/200.0)) + vec3(1.0, 0.90, 0.68)*0.05*exp(-d/34.0);")
rep("  col += vec3(0.55, 0.68, 1.0)*0.012/(1.0 + pow(dA/150.0, 2.0));",
    "  col += vec3(0.62, 0.72, 1.0)*0.006/(1.0 + pow(dA/150.0, 2.0));")

open(P, 'w', encoding='utf-8').write(s)
print('edit6 ok')
