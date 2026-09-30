"""Pass 3 edits: knotted ringlet bands with smooth phase lighting, lanes in the ring plane whose
shafts show in dust beyond the swarm, and the sim edge as a window onto a golden-hour sky."""
P = 'C:/Users/USER/Projects/shelter-mv/style-frames/04b-swarm-contrast/frame.html'
s = open(P, encoding='utf-8').read()

def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, (old[:70], n)
    s = s.replace(old, new)

def block(start, end, new):
    """Replace from marker start (inclusive) up to marker end (exclusive)."""
    global s
    i = s.index(start); j = s.index(end, i)
    s = s[:i] + new + s[j:]

# ------------------------------------------------------------------ JS: plane, rays, bands
block("// ---------------------------------------------------------------- the spark: 11 shafts of escaping light",
      "const NPTS = BANDS.reduce", r'''// ---------------------------------------------------------------- the ring plane
// The bands share a mean plane (the lanes and the dust lie in it too), seen from below at PLANE_E.
const PLANE_E = 28*Math.PI/180, PLANE_PA = -4*Math.PI/180;

// ---------------------------------------------------------------- the spark: 11 lanes of escaping light
// Lanes run outward in the ring plane, so their screen lengths are foreshortened like the rings.
const RAYS = [];
{
  const r = mulberry32(9127);
  const N = 11, rot = -Math.PI/2 + 0.12;
  for (let k = 0; k < N; k++){
    const ang = rot + k*2*Math.PI/N + (r() - 0.5)*0.32;
    const Lp = 2.3 + 1.4*r();                                   // in-plane length (swarm units)
    const c = Math.cos(ang - PLANE_PA), sq = 0.62;
    const L = Lp*Math.sqrt(c*c + sq*sq*(1 - c*c));              // screen length
    RAYS.push([ang, L, 0.020 + 0.020*r(), 0.55 + 0.65*r()]);  // angle, length, base half-width, intensity
  }
}
const rayArr = new Float32Array(48); RAYS.forEach((q, k) => rayArr.set(q, k*4));

// ---------------------------------------------------------------- swarm bands
// Each band is a thin annulus of collectors in its own plane. e is the elevation of the view from
// below that plane (0 = edge-on). Collectors face the star, so the far arcs show their lit faces:
// they pass under the star as a bright cup, while the near arcs (warm backs) arch over it.
// Along a band the collectors bunch into knots joined by thin threads; across it they form a few
// ringlets. Both densities are tabulated as inverse CDFs for the GPU, plus a width profile.
const BANDS = [
  { r: 0.50, dr: 0.018, e: 30, pa: -6, n: 30000 },
  { r: 0.72, dr: 0.026, e: 26, pa: -2, n: 45000 },
  { r: 0.97, dr: 0.036, e: 33, pa: -9, n: 70000 },
  { r: 1.25, dr: 0.024, e: 24, pa: 3,  n: 55000 },
  { r: 1.58, dr: 0.044, e: 29, pa: -5, n: 90000 },
];
for (const b of BANDS) if (QS.has('nscale')) b.n = Math.round(b.n*(+QS.get('nscale')));
const NQ = 1024, NBIN = 2048, NBD = BANDS.length;
const invU = new Float32Array(NQ*NBD), invL = new Float32Array(NQ*NBD), widL = new Float32Array(NQ*NBD);
function invCdf(pdf){
  const n = pdf.length, c = new Float64Array(n+1);
  for (let i = 0; i < n; i++) c[i+1] = c[i] + Math.max(pdf[i], 0);
  const tot = c[n]; for (let i = 0; i <= n; i++) c[i] /= tot;
  const out = new Float32Array(NQ); let j = 0;
  for (let i = 0; i < NQ; i++){
    const q = i/(NQ-1);
    while (j < n-1 && c[j+1] < q) j++;
    const f = (q - c[j])/Math.max(c[j+1] - c[j], 1e-12);
    out[i] = (j + Math.min(Math.max(f, 0), 1))/n;
  }
  return out;
}
{
  const r = mulberry32(31337);
  BANDS.forEach((b, bi) => {
    // across the band: a few crisp ringlets with dark gaps
    const K = 2 + Math.floor(r()*3), rl = [];
    for (let i = 0; i < K; i++) rl.push([r()*1.3 - 0.65, 0.05 + 0.13*r(), 0.4 + 0.6*r()]);
    const pu = new Float64Array(NBIN);
    for (let i = 0; i < NBIN; i++){
      const u = (i + 0.5)/NBIN*2 - 1;
      let v = 0.05*Math.exp(-u*u*2.0);
      for (const [c, w, a] of rl){ const d = (u - c)/w; v += a*Math.exp(-d*d); }
      v *= Math.exp(-Math.pow(Math.abs(u)/0.95, 8));
      pu[i] = v;
    }
    invU.set(invCdf(pu), bi*NQ);
    // along the band: knots (dense clusters) joined by thinner threads
    const n1 = makeNoise1D(r, 16), n2 = makeNoise1D(r, 96);
    const KN = 6 + Math.floor(r()*6), kn = [];
    for (let i = 0; i < KN; i++) kn.push([r(), 0.006 + 0.035*Math.pow(r(), 1.5), 0.5 + 2.5*Math.pow(r(), 2)]);
    const knot = t => { let v = 0; for (const [c, w, a] of kn){ let d = t - c; d -= Math.round(d); d /= w; v += a*Math.exp(-d*d); } return v; };
    const pl = new Float64Array(NBIN);
    for (let i = 0; i < NBIN; i++){ const t = i/NBIN; pl[i] = 0.20 + 0.55*n1(t*16)*n2(t*96) + knot(t); }
    invL.set(invCdf(pl), bi*NQ);
    for (let i = 0; i < NQ; i++) widL[bi*NQ + i] = 0.70 + 0.30*Math.min(knot(i/NQ), 2.0);
    const e = b.e*Math.PI/180, pa = b.pa*Math.PI/180;
    b.a = [Math.cos(pa), Math.sin(pa), 0];
    b.c = [Math.sin(e)*Math.sin(pa), -Math.sin(e)*Math.cos(pa), Math.cos(e)];   // near arc above the star, lit far arc below
    b.nrm = [b.a[1]*b.c[2] - b.a[2]*b.c[1], b.a[2]*b.c[0] - b.a[0]*b.c[2], b.a[0]*b.c[1] - b.a[1]*b.c[0]];
    b.seed = Math.imul(0x9E3779B1, bi + 1) >>> 0;
  });
}
''')

# ------------------------------------------------------------------ JS: sim cumulus (sphere-pile, screen space)
rep("const NPTS = BANDS.reduce((s, b) => s + b.n, 0);\n", r'''const NPTS = BANDS.reduce((s, b) => s + b.n, 0);

// ---------------------------------------------------------------- the sim's cumulus: sphere piles, bases below frame
const PUFFS = [];
{
  const r = mulberry32(777);
  const clouds = [[300, 1110, 170, 95], [700, 1115, 250, 160], [1090, 1105, 210, 120], [1430, 1110, 150, 75]];  // x, base y, half-width, height
  for (const [cx, yb, hw, ht] of clouds){
    for (let j = 0; j < 20; j++){
      const v = Math.pow(r(), 0.85);
      const u = (r()*2 - 1)*(1 - 0.6*v);
      PUFFS.push(cx + u*hw, yb - v*ht, hw*(0.20 + 0.16*r())*(1 - 0.45*v), yb);
    }
  }
}
const puffArr = new Float32Array(PUFFS), NPUFF = PUFFS.length/4;
''')

# ------------------------------------------------------------------ GLSL: plane-aware helpers
rep('''const RAYS_GLSL = `
uniform vec4 uRay[12]; uniform int uNR;''', '''const RAYS_GLSL = `
uniform vec4 uRay[12]; uniform int uNR; uniform vec2 uPlane;   // ring plane: position angle, sin(elevation)
float planeRho(vec2 s){   // radius in the ring plane of a screen offset, assuming it lies in that plane
  vec2 a = vec2(cos(uPlane.x), sin(uPlane.x)), c = vec2(sin(uPlane.x), -cos(uPlane.x));
  return length(vec2(dot(s, a), dot(s, c)/uPlane.y));
}''')

# star glow a touch wider, then shafts that show in the dust beyond the swarm
block("  // white core with a compact orange falloff", "  // Alpha Cen A: faint cool outer halo", r'''  // white core with a compact orange falloff
  col += vec3(1.00, 0.93, 0.84)*8.0*exp(-r*r/0.0020)
       + vec3(1.00, 0.55, 0.26)*1.10*exp(-r/0.10)
       + vec3(1.00, 0.34, 0.13)*0.16/(1.0 + pow(r/0.28, 2.0))
       + vec3(0.60, 0.14, 0.06)*0.012/(1.0 + pow(r/1.00, 2.0));
  // shafts: the swarm has swept its interior clean, so escaping light shows in the dust beyond it;
  // inside, only the roots near the core and the glinting collectors along each lane trace it
  float pr = planeRho(s);
  float dust = mix(0.10, 1.0, smoothstep(1.35, 1.95, pr))*(0.75 + 0.5*(0.5 + 0.5*fbm(px/160.0 + vec2(5.0, 2.0), 4)));
  vec3 sh = vec3(0.0);
  for (int k = 0; k < 12; k++){ if (k >= uNR) break;
    vec4 R = uRay[k]; vec2 d = vec2(cos(R.x), sin(R.x));
    float al = dot(s, d); if (al <= 0.0) continue;
    float t = al/R.y; if (t >= 1.0) continue;
    float pe = abs(s.x*d.y - s.y*d.x);
    float w = R.z*pow(1.0 - t, 0.85) + 0.002;
    float q = pe/w;
    float core = exp(-q*q);
    float skirt = exp(-q*q/12.0)*0.16;
    float fall = pow(1.0 - t, 1.25)/(0.55 + 0.45*al);
    float vis = max(dust, 1.6*exp(-al/0.10));
    float mott = 0.70 + 0.6*(0.5 + 0.5*gn(vec2(al*3.0 + float(k)*17.0, float(k)*3.7)));
    vec3 rc = mix(vec3(1.0, 0.86, 0.70), vec3(1.0, 0.52, 0.25), smoothstep(0.2, 2.2, al));
    sh += rc*R.w*(core + skirt)*fall*vis*mott;
  }
  col += sh*0.70;
''')

# ------------------------------------------------------------------ collectors: width profile, smooth phase lighting
rep("uniform sampler2D uInvU; uniform sampler2D uInvL;\nout vec4 vCol;",
    "uniform sampler2D uInvU; uniform sampler2D uInvL; uniform sampler2D uWidL;\nout vec4 vCol;")
rep("  float rr = uR + u*uDR + wander*g1*uDR*1.8;",
    "  float wl = lut(uWidL, fract(lam/6.2831853));\n  float rr = uR + (u*uDR + wander*g1*uDR*1.8)*wl;")
block("  vec3 E; float a = 0.0;", "  vec2 px = floor(uC + s2*uRs) + 0.5;", r'''  vec3 E; float a = 0.0;
  float f = 0.5 - 0.5*P.z/max(r3, 1e-4);        // lit fraction of the face we see: 1 behind the star, 0 in front
  if (uMode == 2) E = b*(mix(cHeat, cLit, 0.5)*lit*0.10 + cRay*ray*0.20);
  else E = b*(cLit*lit*uKFar*pow(f, 1.5) + cHeat*uKNear*(0.5 + 0.5*lit)*(1.0 - f) + cRay*ray*0.35);
''')

# ------------------------------------------------------------------ the sim: a window onto its golden-hour sky
block("const FS_SIM = HDR", "const FS_OVER = HDR", r'''const FS_SIM = HDR + NOISE + SIMGEO + `
uniform vec4 uPuff[80]; uniform int uNP;
out vec4 o;
void main(){
  vec2 px = vec2(gl_FragCoord.x, 1080.0 - gl_FragCoord.y);
  float dep, el, ph, dist; simGeo(px, dep, el, ph, dist);
  float cov = clamp(dep + 0.5, 0.0, 1.0);
  if (dep < -4.0){ o = vec4(0.0); return; }
  // the sky keeps its own horizontal: pale blue up high, rose, then a peach-gold horizon below frame
  float yN = clamp((px.y - 890.0)/190.0, 0.0, 1.0);
  vec3 sky = mix(vec3(0.62, 0.72, 1.00)*0.30, vec3(0.90, 0.68, 0.86)*0.36, smoothstep(0.0, 0.5, yN));
  sky = mix(sky, vec3(1.00, 0.76, 0.54)*0.56, smoothstep(0.45, 1.0, yN));
  float warm = exp(-pow((px.x - 1250.0)/480.0, 2.0));
  sky *= 1.0 + 0.35*warm*yN;
  vec3 col = sky;
  // cumulus towers: sphere piles lit from the upper right
  float best = -1e9, cc = 0.0; vec3 nrm = vec3(0.0, 0.0, 1.0); float yb = 0.0;
  for (int i = 0; i < 80; i++){ if (i >= uNP) break;
    vec4 pf = uPuff[i];
    if (px.y > pf.w) continue;
    vec2 dd = (px - pf.xy)/pf.z; float d2 = dot(dd, dd);
    if (d2 >= 1.0) continue;
    float z = sqrt(1.0 - d2);
    cc = max(cc, clamp((1.0 - sqrt(d2))*pf.z + 0.5, 0.0, 1.0));
    if (z*pf.z > best){ best = z*pf.z; nrm = vec3(dd, z); yb = pf.w; }
  }
  if (cc > 0.0){
    vec3 L = normalize(vec3(0.62, -0.50, 0.60));
    float lam = dot(nrm, L);
    vec3 c = mix(vec3(0.54, 0.50, 0.84)*0.26, vec3(0.98, 0.68, 0.70)*0.46, smoothstep(-0.1, 0.25, lam));
    c = mix(c, vec3(1.00, 0.88, 0.72)*0.82, smoothstep(0.30, 0.75, lam));
    float rimL = pow(1.0 - nrm.z, 3.0)*max(dot(normalize(nrm.xy + 1e-4), normalize(L.xy)), 0.0);
    c += vec3(1.0, 0.85, 0.65)*rimL*0.45;
    c *= 1.0 + 0.25*warm;
    col = mix(col, c, cc);
  }
  o = vec4(col, cov);
}
`;
''')
# strokes: sky strokes lie horizontal (the sim keeps its own horizon), bending along cloud edges
rep("  vec2 d = aPos - uBub.xy; vec2 tang = normalize(vec2(-d.y, d.x));",
    "  vec2 d = aPos - uBub.xy; vec2 tang = vec2(1.0, 0.0);")
rep("  vec2 sz = aSz*vec2(1.0, clamp(dep/60.0, 0.35, 1.0));   // strokes flatten toward the rim\n",
    "  vec2 sz = aSz;\n")

# ------------------------------------------------------------------ JS wiring
rep("const texU = tableTex(NQ, NBD, invU), texL = tableTex(NQ, NBD, invL);",
    "const texU = tableTex(NQ, NBD, invU), texL = tableTex(NQ, NBD, invL), texW = tableTex(NQ, NBD, widL);")
rep("const rayU = { uRay: { v4: rayArr }, uNR: { i: RAYS.length } };",
    "const rayU = { uRay: { v4: rayArr }, uNR: { i: RAYS.length }, uPlane: [PLANE_PA, Math.sin(PLANE_E)] };")
rep("bindTex(pPts, 'uInvU', 0, texU); bindTex(pPts, 'uInvL', 1, texL);",
    "bindTex(pPts, 'uInvU', 0, texU); bindTex(pPts, 'uInvL', 1, texL); bindTex(pPts, 'uWidL', 2, texW);")
rep("    setU(pSim, { uBub: P.bub });", "    setU(pSim, { uBub: P.bub, uPuff: { v4: puffArr }, uNP: { i: NPUFF } });")
rep("  kFar: 0.15, kNear: 0.05,        // lit far faces, warm near backs",
    "  kFar: 0.16, kNear: 0.06,        // lit far faces, warm near backs")
rep("  nDrift: 9000,                   // instances in transit between bands",
    "  nDrift: 5000,                   // instances in transit between bands")
rep("  grid: 1.0,                      // wireframe on the sim membrane",
    "  grid: 0.0,                      // wireframe on the sim membrane (1 ribs, 2 ribs and parallels)")

open(P, 'w', encoding='utf-8').write(s)
print('edit3 ok')
