"""v2 pass 5: shafts become lit dust (hot root at the opening, quick Gaussian fade, filamentary dust,
a faint unlit haze around the cage for context); bloom skips its finest level so silhouettes and points
stay crisp; the two edge-on bands are a little thicker so they read as silhouettes on the disk."""
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

# filamentary dust
block("float dustField(vec2 px, float r){", "void main(){", r'''float dustField(vec2 px, float r){
  vec2 q = px/170.0;
  vec2 w = vec2(fbm(q*0.7 + vec2(1.7, 9.2), 4), fbm(q*0.7 + vec2(8.3, 2.8), 4));
  float f = fbm(q*1.2 + 1.2*w + vec2(3.1, 7.7), 6);
  float rid = 1.0 - abs(fbm(q*2.1 + 0.8*w + vec2(6.4, 0.9), 5))*2.2;     // ridged filaments
  float d = smoothstep(-0.15, 0.45, f)*(0.35 + 0.65*smoothstep(0.2, 0.9, rid));
  return d*smoothstep(0.90, 1.20, r)*exp(-pow(r/3.2, 2.0));   // the swarm has swept its own interior clean
}
''')
block("    float x = along - cd*0.97;", "  col += vec3(1.0, 0.42, 0.18)*dust*0.010/(0.4 + r*r);", r'''    float x = along - cd*0.97;
    float start = smoothstep(-0.10, 0.12, x);
    float L = 0.30 + 0.50*I;                                        // how far this lane's light carries
    float fall = exp(-pow(max(x, 0.0)/L, 1.6))*(1.0 + 1.6*exp(-max(x, 0.0)/0.07));   // hot at the opening
    float streak = 0.62 + 0.76*(0.5 + 0.5*gn(vec2(along*1.3 + float(k)*7.1, psi/alS*2.6)));
    vec3 bc = mix(vec3(1.0, 0.72, 0.42), vec3(1.0, 0.44, 0.18), smoothstep(0.0, 0.8, x));
    bsum += bc*I*wedge*start*fall*streak/(0.6 + 0.4*along);
  }
  col += bsum*(0.20 + 1.7*dust)*0.62*uBeam;
  col += vec3(1.0, 0.40, 0.20)*dust*0.018/(0.5 + 0.5*r*r);     // unlit haze, barely there: the shafts light it
''')
rep("  col += vec3(1.0, 0.42, 0.18)*dust*0.010/(0.4 + r*r);      // the cage's own warm glow, barely\n", "")

# bloom: skip the finest level so thin silhouettes and single points stay crisp
rep("uniform sampler2D uLow; uniform sampler2D uCur; uniform vec2 uTS; uniform vec2 uLowTexel; out vec4 o;",
    "uniform sampler2D uLow; uniform sampler2D uCur; uniform vec2 uTS; uniform vec2 uLowTexel; uniform float uCurW; out vec4 o;")
rep("  o = vec4(texture(uCur, uv).rgb + s/16.0, 1.0);", "  o = vec4(texture(uCur, uv).rgb*uCurW + s/16.0, 1.0);")
rep("    setU(pUp, { uTS: [up[i].w, up[i].h], uLowTexel: [1/low.w, 1/low.h] });",
    "    setU(pUp, { uTS: [up[i].w, up[i].h], uLowTexel: [1/low.w, 1/low.h], uCurW: i === 0 ? 0 : 1 });")
rep("  exposure: 1.0, bloom: 0.35,", "  exposure: 1.0, bloom: 0.45,")

# thicker edge-on bands (their near arcs are the silhouettes across the disk)
rep("  { pa: -16, b: 0.07, s:  1, r: 1.00, dr: 0.010, n: 90000 },", "  { pa: -16, b: 0.07, s:  1, r: 1.00, dr: 0.016, n: 100000 },")
rep("  { pa: 104, b: 0.05, s: -1, r: 0.98, dr: 0.009, n: 60000 },", "  { pa: 104, b: 0.05, s: -1, r: 0.98, dr: 0.014, n: 70000 },")

open(P, 'w', encoding='utf-8').write(s)
print('v2edit5 ok')

# out-of-plane thickness per band: the edge-on bands need it to make a visible silhouette line
s = open(P, encoding='utf-8').read()
rep("  { pa: -16, b: 0.07, s:  1, r: 1.00, dr: 0.016, n: 100000 },", "  { pa: -16, b: 0.07, s:  1, r: 1.00, dr: 0.016, n: 100000, t: 0.7 },")
rep("  { pa: 104, b: 0.05, s: -1, r: 0.98, dr: 0.014, n: 70000 },", "  { pa: 104, b: 0.05, s: -1, r: 0.98, dr: 0.014, n: 70000, t: 0.7 },")
rep("uniform float uR; uniform float uDR; uniform float uBW;", "uniform float uR; uniform float uDR; uniform float uBW; uniform float uBT;")
rep("    float hh = g2*uDR*0.06 + uBW*sin(2.0*lam + float(uRow)*1.7);", "    float hh = g2*uDR*uBT + uBW*sin(2.0*lam + float(uRow)*1.7);")
rep("uR: b.r, uDR: b.dr, uBW: b.w,", "uR: b.r, uDR: b.dr, uBW: b.w, uBT: b.t || 0.06,")
open(P, 'w', encoding='utf-8').write(s)
print('thickness ok')
