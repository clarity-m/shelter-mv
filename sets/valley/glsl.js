// GLSL for the valley set. Lighting, sky, paint and post are ported from
// style-frames/02b-environment-poly/frame-v2.html; the learned field, facet waves, geomorph,
// world-anchored strokes and tile mode are new for animation.

export const HDR = '#version 300 es\nprecision highp float;\nprecision highp int;\n';

export const COMMON = `
const float PI = 3.14159265;
const float WATER = -0.55;
uint hashu(uint x){ x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }
float hash21(ivec2 p){ return float(hashu(uint(p.x)*0x8da6b343u ^ hashu(uint(p.y)*0xd8163841u + 0x9e3779b9u)) >> 8u) * (1.0/16777216.0); }
float vnoise(vec2 p){ vec2 i = floor(p), f = p - i; ivec2 ii = ivec2(i); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash21(ii),hash21(ii+ivec2(1,0)),u.x), mix(hash21(ii+ivec2(0,1)),hash21(ii+ivec2(1,1)),u.x), u.y); }
const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);
float fbmV(vec2 p, int oct){ float s=0.0, a=0.5, n=0.0; for(int i=0;i<6;i++){ if(i>=oct) break; s += a*vnoise(p); n += a; p = ROT*p*2.03 + vec2(17.3, 9.1); a *= 0.5; } return s/n; }
float posHash(vec2 q, int k){ return hash21(ivec2(floor(q*64.0 + 0.5)) + ivec2(k*7919, k*3571)); }
float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 lin(vec3 c){ return pow(max(c, 0.0), vec3(2.2)); }

// ---- camera
uniform vec3 uCam, uFwd, uRight, uUp;
uniform float uFy, uAspect; uniform vec2 uPP; uniform vec2 uNF; uniform vec3 uOrtho;
uniform int uMirror;

// ---- the learned field (where Clawd has learned), facet waves, tile mode
uniform vec4 uSpawn;          // x, z, radius, raggedness
uniform vec3 uTrail[32];      // x, z, arc length
uniform int uTrailN;
uniform vec2 uTrailRW;        // reach (arc length painted), half width
uniform vec4 uTouch;          // x, z, radius, raggedness (S18)
uniform float uLearnAll;
uniform vec4 uRise;           // front radius, front width, crest height, on
uniform vec2 uRiseC;
uniform float uSmoothAll;     // S18: facets subdivide into smooth forms where learned
uniform vec4 uRings[4];       // S18 pulses from his feet: x, z, radius, strength
uniform float uFloor;         // S18's end: the world relaxes into S19's flat painted floor
uniform float uFloorLook;     // 0: the old hazy floor colour; 1 (revision 4): a flat meadow keeping the brushwork
uniform vec2 uFloorR;         // revision 4: flattened fully within x (m from the origin), not at all past y
uniform float uMeadowLift;    // revision 4: the meadow's extra sky light at the settle
// how far the ground at q has relaxed into the floor
float floorK(vec2 q){ return uFloor*(uFloorLook > 0.5 ? 1.0 - smoothstep(uFloorR.x, uFloorR.y, length(q)) : 1.0); }
uniform vec4 uClip;           // tile centre x, z, half size, dissolve 0..1 (S15)

// ---- S18 (revision 3): brush strokes drawn by his cursors (strokes.js), two world-space maps.
// A: (tint, cos 2th, sin 2th, coverage), B: (relax, fresh, 0, coverage), premultiplied.
uniform float uStrokeOn, uStrokeSmooth, uStrokeBleed, uStrokePal;
// S18 (revision 11): the worlds he learned, brought in by the strokes: ice on the peaks, a salt plain
uniform vec4 uTraits;       // ice, salt, 0, 0
uniform vec4 uSaltBox;      // the salt plain: x0, z0, x1, z1
// S34 (revision 10): the land is a wafer of dies (uStrokePal 2). A grid of dies (origin x, z, pitch,
// scribe gap, metres); each die a layout of blocks in die-local 0..1 (x across, y = world -z):
// uDieRect = x0, y0, x1, y1; uDieInfo = colour (0 orange, 1 teal, 2 rose, 3 gold, 4 violet), stripe
// direction (0 none, 1 rows, 2 columns), stripe count, 0.
uniform vec4 uDie;
uniform vec4 uDieRect[32];
uniform vec4 uDieInfo[32];
uniform int uDieN;
uniform float uDieHero;       // die (0, 0) is blank (< 0) and fills block by block as the chip's light spreads (radius)
// S34 (revision 14): the silicon crystal's periodic potential (uStrokePal 3) on the same grid (uDie)
uniform float uLatAmp;        // the wells' depth in the shading (m)
uniform sampler2D uStrokeNA, uStrokeNB, uStrokeFA, uStrokeFB;
uniform vec4 uStrokeNR, uStrokeFR;     // map centre x, z, half size
uniform vec4 uPulse;                   // his light's pulse: x, z, radius, width (smooths behind it)
uniform float uPulseK;                 // its light
float strokeNW(vec2 q, out vec2 un, out vec2 uf){
  un = (q - uStrokeNR.xy)/(2.0*uStrokeNR.z) + 0.5;
  uf = (q - uStrokeFR.xy)/(2.0*uStrokeFR.z) + 0.5;
  vec2 e = abs(un - 0.5)*2.0;
  return 1.0 - smoothstep(0.9, 0.985, max(e.x, e.y));
}
vec4 strokeA(vec2 q){ vec2 un, uf; float w = strokeNW(q, un, uf); return mix(texture(uStrokeFA, uf), texture(uStrokeNA, un), w); }
vec4 strokeB(vec2 q){ vec2 un, uf; float w = strokeNW(q, un, uf); return mix(texture(uStrokeFB, uf), texture(uStrokeNB, un), w); }
float pulseK(vec2 q){
  if (uPulse.z <= 0.0) return 0.0;
  return 1.0 - smoothstep(uPulse.z - uPulse.w, uPulse.z, length(q - uPulse.xy));
}
// ---- S19 (revision 5): the hill he raises with his light. Up to three anisotropic gaussian
// bumps in metres (sets/valley/raise.js mirrors this for Clawd, the tree and the camera).
uniform float uHillOn;
uniform vec4 uHillA[6];   // amplitude (m; negative carves), centre x, centre z, rise rate (normalised, for the glow)
uniform vec4 uHillB[6];   // sigma along the axis r, sigma along f = (-r.y, r.x) (m), axis r.x, r.y
float hillAt(vec2 q, out vec2 grad, out float rate){
  float h = 0.0; grad = vec2(0.0); rate = 0.0;
  if (uHillOn < 0.5) return 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 A = uHillA[i], B = uHillB[i];
    if (A.x == 0.0 && A.w <= 0.0) continue;
    vec2 d = q - A.yz, r = B.zw, f = vec2(-B.w, B.z);
    float lu = dot(d, r)/B.x, lv = dot(d, f)/B.y;
    float e = exp(-(lu*lu + lv*lv));
    h += A.x*e; rate += A.w*e;
    grad += -2.0*A.x*e*(lu*r/B.x + lv*f/B.y);
  }
  return h;
}
// ---- Revision 11: the training worlds (S14's episodes, S15's wall, S17). World 0 is the valley's
// own mesh; 1 funnel crater, 2 icy shore, 3 salt flat and 4 grid plain are height fields laid over
// the same low-poly mesh. uWorldM: world A, world B, the front's radius (m from the spawn), its
// width: world B inside the front (it re-forms outward from the pad). All zero: the valley only.
uniform vec4 uWorldM;
uniform float uWorldWater;    // the worlds' own water grid is being drawn
float farRange(vec2 q, float amp){
  float r = length(q);
  return amp*smoothstep(420.0, 900.0, r)*(1.0 - smoothstep(2400.0, 3400.0, r))*max(0.0, 0.35 + fbmV(q*0.0021 + 3.3, 4) - 0.5);
}
const vec2 CRATER_C = vec2(0.0, 52.0);
float craterH(vec2 q){
  vec2 d = q - CRATER_C; float r = length(d), th = atan(d.y, d.x);
  float k = clamp(floor((29.0 - r)/2.6 + th/6.2831853 + 0.5), 0.0, 10.0);   // spiral terraces
  float hin = mix(6.0 - k*0.58, -2.4, 1.0 - smoothstep(5.0, 6.5, r));         // down to the basin
  float flank = 6.4*smoothstep(46.0, 31.0, r);                                  // the outer flank
  float h = mix(flank, hin, smoothstep(31.0, 29.0, r));
  h += 0.4*smoothstep(28.5, 30.0, r)*smoothstep(32.5, 30.5, r);                // the rim's lip
  h += 0.35*(vnoise(q*0.12) - 0.5)*smoothstep(46.0, 60.0, r);
  h += 14.0*smoothstep(150.0, 260.0, length(q))*vnoise(q*0.012 + 7.0);          // mesas beyond
  h = mix(h, 0.0, smoothstep(8.0, 3.5, length(q)));                            // the pad: flat at 0
  return h + farRange(q, 70.0);
}
float iceH(vec2 q){
  float shore = -6.0 + 2.0*sin(q.y*0.045) + 1.2*sin(q.y*0.11 + 1.0);
  float sea = smoothstep(shore + 1.5, shore - 2.0, q.x);
  float h = 0.25 + 0.18*(vnoise(q*0.2) - 0.5);                                 // the snow shelf
  float bx = 11.0 + 3.0*sin(q.y*0.06 + 2.0);                                   // the snowy bluff
  h += 9.5*smoothstep(bx, bx + 14.0, q.x)*(0.8 + 0.4*vnoise(q*0.05)) + 4.0*smoothstep(bx + 14.0, bx + 40.0, q.x)*vnoise(q*0.03);
  // the sea: a floor below the water, floes on it (square-ish plates on a rotated jittered grid)
  vec2 qr = mat2(0.88, 0.47, -0.47, 0.88)*q;
  vec2 cell = floor(qr/7.0), f = qr/7.0 - cell;
  float h1 = hash21(ivec2(cell)), h2 = hash21(ivec2(cell) + ivec2(3, 7)), h3 = hash21(ivec2(cell) + ivec2(11, 5));
  vec2 o = abs(f - (0.35 + 0.3*vec2(h2, h3)));
  float plate = step(0.42, h1)*(1.0 - smoothstep(0.30, 0.36, max(o.x, o.y)));
  float floe = mix(-2.2, -0.32 + 0.1*h2, plate);
  floe += plate*9.0*step(0.9, hash21(ivec2(cell) + ivec2(9, 1)))*smoothstep(110.0, 200.0, length(q));   // bergs
  h = mix(h, floe, sea);
  h = mix(h, 0.0, smoothstep(8.0, 3.5, length(q)));
  return h + farRange(q, 90.0)*smoothstep(-60.0, 40.0, q.x);
}
float saltH(vec2 q){
  float h = 0.06*(vnoise(q*0.3) - 0.5);
  h = mix(h, 0.0, smoothstep(8.0, 3.5, length(q)));
  return h + farRange(q, 80.0);
}
float gridH(vec2 q){ return 0.04*(vnoise(q*0.3) - 0.5)*smoothstep(3.5, 8.0, length(q)) + farRange(q, 60.0); }
float worldH(float w, vec2 q){
  if (w < 1.5) return craterH(q);
  if (w < 2.5) return iceH(q);
  if (w < 3.5) return saltH(q);
  return gridH(q);
}
// Revision 13: the humans' cursor draws land in (sets/valley/sweep.js). A swept band (a polyline with
// arc lengths and half widths, drawn up to uSweepRW.x) raises the valley (target 1, S13) or forms
// world B (target 2, S14) where the cursor's tip has passed, ahead of the radial front.
uniform vec4 uSweep[24];     // x, z, arc length, half width
uniform int uSweepN;
uniform vec4 uSweepRW;       // reach, target, 0, 0
uniform vec4 uSweepTip;      // x, z, radius, glow
float sweepCover(vec2 q){
  if (uSweepN < 2 || uSweepRW.x <= 0.0) return 0.0;
  float best = 1e9;
  for (int i = 0; i < 23; i++) {
    if (i >= uSweepN - 1) break;
    vec4 A = uSweep[i], B = uSweep[i+1];
    if (A.z > uSweepRW.x) break;
    vec2 ab = B.xy - A.xy; float L = max(length(ab), 1e-4);
    float tmax = clamp((uSweepRW.x - A.z)/L, 0.0, 1.0);
    float t = clamp(dot(q - A.xy, ab)/(L*L), 0.0, tmax);
    float ws = L < 1e-3 ? max(A.w, B.w) : mix(A.w, B.w, t);      // (a zero-length segment is a disc)
    best = min(best, length(q - (A.xy + ab*t))/max(ws, 1e-3));
  }
  return 1.0 - smoothstep(0.6, 1.0, best);
}
bool worldsOn(){ return uWorldM.x > 0.5 || uWorldM.y > 0.5; }
float worldMix(vec2 q){
  float m = 1.0 - smoothstep(uWorldM.z - uWorldM.w, uWorldM.z, length(q));
  if (uSweepRW.y > 1.5) m = max(m, sweepCover(q));
  return m;
}
float worldAt(vec2 q){ return worldMix(q) > 0.5 ? uWorldM.y : uWorldM.x; }
// how much of q is still the valley (its trees, rocks and river)
float valleyness(vec2 q){
  if (!worldsOn()) return 1.0;
  float m = worldMix(q);
  return (uWorldM.x < 0.5 ? 1.0 - m : 0.0) + (uWorldM.y < 0.5 ? m : 0.0);
}
// the ground's height at q given the valley's own height there
float worldY(vec2 q, float yValley){
  if (!worldsOn()) return yValley;
  float m = worldMix(q);
  float yA = uWorldM.x > 0.5 ? worldH(uWorldM.x, q) : yValley, yB = uWorldM.y > 0.5 ? worldH(uWorldM.y, q) : yValley;
  return mix(yA, yB, m);
}
// a world's learned (painted) colour for a facet (sRGB): centroid c, height y, up-ness ny, random r1
vec3 worldAlb(float w, vec2 c, float y, float ny, float r1){
  if (w < 1.5) {
    vec2 d = c - CRATER_C; float r = length(d), th = atan(d.y, d.x);
    float k = floor((29.0 - r)/2.6 + th/6.2831853 + 0.5);
    vec3 tread = mix(vec3(0.48, 0.60, 0.34), vec3(0.58, 0.66, 0.40), r1);
    vec3 riser = mod(k, 2.0) < 0.5 ? vec3(0.80, 0.58, 0.40) : vec3(0.70, 0.45, 0.33);
    vec3 col = ny > 0.93 ? tread : riser;
    if (r > 30.5) col = mix(vec3(0.66, 0.63, 0.42), vec3(0.78, 0.64, 0.46), smoothstep(0.95, 0.8, ny));
    if (r < 6.5) col = vec3(0.84, 0.78, 0.60);
    if (y > 8.0) col = mix(vec3(0.74, 0.54, 0.42), vec3(0.90, 0.84, 0.78), smoothstep(40.0, 70.0, y));
    return col;
  }
  if (w < 2.5) {
    vec3 col = mix(vec3(0.50, 0.58, 0.68), mix(vec3(0.91, 0.95, 0.99), vec3(0.84, 0.90, 0.97), r1), smoothstep(0.70, 0.88, ny));
    if (y < -0.1 && y > -0.6) col = mix(vec3(0.86, 0.94, 0.99), vec3(0.72, 0.87, 0.96), r1);   // floes
    if (y < -1.0) col = vec3(0.30, 0.46, 0.56);
    return col;
  }
  if (w < 3.5) return mix(vec3(0.95, 0.93, 0.91), vec3(0.96, 0.88, 0.86), step(0.62, r1))*(y > 12.0 ? vec3(0.86, 0.80, 0.84) : vec3(1.0));
  vec2 cell = floor(c/6.0); float hc = hash21(ivec2(cell) + ivec2(21, 4));
  vec3 col = hc < 0.25 ? vec3(0.62, 0.78, 0.80) : hc < 0.5 ? vec3(0.84, 0.70, 0.78) : hc < 0.75 ? vec3(0.86, 0.80, 0.62) : vec3(0.76, 0.74, 0.84);
  return y > 12.0 ? vec3(0.80, 0.78, 0.84) : col;
}
// the pulse's light: a broad soft front and a fading afterglow behind it
float pulseGlow(vec2 q){
  if (uPulse.z <= 0.0 || uPulseK <= 0.0) return 0.0;
  float x = (length(q - uPulse.xy) - uPulse.z)/uPulse.w;
  return uPulseK*(exp(-x*x) + (x < 0.0 ? 0.3*exp(x*0.8) : 0.0));
}

float learnedAt(vec2 q){
  float nz = vnoise(q*0.11 + 4.0)*2.0 - 1.0, nz2 = vnoise(q*0.37 + 9.0)*2.0 - 1.0;
  float m = uLearnAll;
  if (uSpawn.z > 0.0) {
    float d = length(q - uSpawn.xy) + nz*uSpawn.w + nz2*0.5;
    m = max(m, 1.0 - smoothstep(uSpawn.z - 2.2, uSpawn.z, d));
  }
  if (uTrailN > 1 && uTrailRW.x > 0.0) {
    float best = 1e9, bs = 0.0;
    for (int i = 0; i < 31; i++) {
      if (i >= uTrailN - 1) break;
      vec3 A = uTrail[i], B = uTrail[i+1];
      if (A.z > uTrailRW.x) break;
      vec2 ab = B.xy - A.xy; float L = max(length(ab), 1e-4);
      float tmax = clamp((uTrailRW.x - A.z)/L, 0.0, 1.0);
      float t = clamp(dot(q - A.xy, ab)/(L*L), 0.0, tmax);
      float dd = length(q - (A.xy + ab*t));
      if (dd < best) { best = dd; bs = A.z + t*L; }
    }
    float w = uTrailRW.y * (0.45 + 0.55*smoothstep(uTrailRW.x + 1.0, uTrailRW.x - 9.0, bs));
    m = max(m, 1.0 - smoothstep(w - 2.2, w, best + nz*2.4 + nz2*0.7));
  }
  if (uTouch.z > 0.0) {
    float dt = length(q - uTouch.xy) + nz*uTouch.w + nz2*0.9;
    m = max(m, 1.0 - smoothstep(uTouch.z - 3.0, uTouch.z, dt));
  }
  return clamp(m, 0.0, 1.0);
}
float levelOf(float m){ return 2.0*smoothstep(0.06, 0.8, m); }
float riseAt(vec2 q, float jit){
  if (uRise.w < 0.5) return 1.0;
  float d = length(q - uRiseC);
  float r = smoothstep(0.0, 1.0, (uRise.x - d + (jit - 0.5)*uRise.y*0.5)/uRise.y);
  if (uSweepRW.y > 0.5 && uSweepRW.y < 1.5) r = max(r, clamp(sweepCover(q)*1.35 - 0.2 + (jit - 0.5)*0.3, 0.0, 1.0));
  return r;
}
// a pulse ring lifts the facets as it passes
float ringLift(vec2 q){
  float y = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 R = uRings[i]; if (R.w <= 0.0) continue;
    float w = 0.9 + R.z*0.035, d = (length(q - R.xy) - R.z)/w;
    y += R.w*0.32*exp(-d*d)*smoothstep(0.0, 2.0, R.z);
  }
  return y;
}
float ringGlow(vec2 q){
  float g = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 R = uRings[i]; if (R.w <= 0.0) continue;
    float w = 0.45 + R.z*0.02, d = (length(q - R.xy) - R.z)/w;
    g += R.w*(exp(-d*d) + 0.35*exp(-d*d*0.08)*step(d, 0.0));
  }
  return g;
}
float crestAt(vec2 q){
  if (uRise.w < 0.5) return 0.0;
  float d = length(q - uRiseC), w = max(uRise.y*0.55, 0.5);
  float x = (d - uRise.x)/w;
  return uRise.z * exp(-x*x) * smoothstep(1.0, 6.0, d);
}
// tile mode: facets outside the tile square fall away (0 = in place, 1 = gone)
// exact square clip: the cut sweeps in from far away to the tile edge as the dissolve completes
bool clipOut(vec2 p){
  if (uClip.w <= 0.0) return false;
  vec2 o = abs(p - uClip.xy) - (uClip.z + (1.0 - smoothstep(0.55, 1.0, uClip.w))*1500.0);
  return max(o.x, o.y) > 0.0;
}
float clipGone(vec2 c, float jit){
  if (uClip.w <= 0.0) return 0.0;
  vec2 o2 = abs(c - uClip.xy) - uClip.z;
  float o = max(o2.x, o2.y);
  if (o <= 0.0) return 0.0;
  float t = 1.0 - smoothstep(0.0, 900.0, o)*0.75 - jit*0.25;   // far land goes first
  return smoothstep(t - 0.12, t, uClip.w*1.12);
}
vec4 projectP(vec3 p){
  if (uMirror == 1) p.y = 2.0*WATER - p.y;
  vec3 d = p - uCam;
  float zc = dot(d, uFwd), xr = dot(d, uRight), yu = dot(d, uUp);
  if (uOrtho.x > 0.5) return vec4(xr/uOrtho.y, yu/uOrtho.z, (zc - uNF.x)/(uNF.y - uNF.x)*2.0 - 1.0, 1.0);
  float A = (uNF.y + uNF.x)/(uNF.y - uNF.x), B = -2.0*uNF.y*uNF.x/(uNF.y - uNF.x);
  return vec4(xr*uFy/uAspect + uPP.x*zc, yu*uFy + uPP.y*zc, A*zc + B, zc);
}
// shadow-map projection
uniform vec3 uLC, uLE, uLX, uLY, uLZ;
vec4 projectL(vec3 p){ vec3 d = p - uLC; return vec4(dot(d, uLX)/uLE.x, dot(d, uLY)/uLE.y, dot(d, uLZ)/uLE.z, 1.0); }
`;

// ------------------------------------------------------------------ fragment-side lighting
export const LIGHT = `
precision highp sampler2DShadow;
uniform sampler2DShadow uSh;
uniform float uShTx;
uniform vec3 uKey, uSun;
uniform float uTime, uK, uFpx, uPaint, uPal, uSkyWhite, uVoid, uExposure, uFogK, uCloudK, uCloudFade;
uniform vec3 uClawdP; uniform float uClawdGlow;
uniform vec2 uRes;
uniform int uRaw;
uniform vec3 uSkyHor, uSkyLow, uSkyMid, uSkyZen, uVoidCol;
uniform vec4 uVoidGlow;

const vec3 KEYCOL = vec3(1.00, 0.83, 0.64) * 2.35;
const vec3 SKYCOL = vec3(0.42, 0.50, 0.88) * 0.30;
const vec3 BNCCOL = vec3(0.60, 0.46, 0.36) * 0.16;
const vec3 FILLDIR = normalize(vec3(-0.35, 0.30, -1.0));
const vec3 FILLCOL = vec3(0.50, 0.48, 0.82) * 0.22;
const vec3 CLAWDCOL = vec3(0.851, 0.467, 0.341);
const float FOGD = 0.00072;

vec2 skyQ(vec3 rd){ return vec2(degrees(atan(rd.x, rd.z)), degrees(asin(clamp(rd.y, -1.0, 1.0)))); }
vec3 dirQ(vec2 q){ float a = radians(q.x), e = radians(q.y); return vec3(sin(a)*cos(e), sin(e), cos(a)*cos(e)); }
vec3 skyGrad(vec3 rd, bool tight){
  vec2 q = skyQ(rd);
  float e = max(q.y, 0.0);
  float cs = max(dot(rd, uSun), 0.0);
  vec3 c = mix(uSkyHor, uSkyLow, smoothstep(0.0, 3.2, e));
  c = mix(c, uSkyMid, smoothstep(2.5, 10.0, e));
  c = mix(c, uSkyZen, smoothstep(8.0, 34.0, e));
  float sunSide = 0.5 + 0.5*dot(normalize(rd.xz + 1e-5), normalize(uSun.xz));
  c += vec3(0.26, 0.11, 0.00) * (1.0 - smoothstep(0.0, 7.0, e)) * sunSide * sunSide * (1.0 - 0.5*uPal);
  c += vec3(1.00, 0.46, 0.14) * pow(cs, 9.0)*0.22 + vec3(1.00, 0.60, 0.22) * pow(cs, 110.0)*0.40;
  if (tight) {
    c += vec3(1.00, 0.78, 0.46) * pow(cs, 2500.0)*1.0;
    c += vec3(1.00, 0.95, 0.85) * smoothstep(0.999955, 0.999975, cs)*28.0;
  }
  return c;
}
float h13(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)))*43758.5453); }
// painted sky: horizontal ribbons anchored to the sky (azimuth, elevation), so they never swim
vec3 skyPaint(vec3 c, vec3 rd){
  vec2 q = skyQ(rd);
  vec3 o = c;
  for (int k = 0; k < 2; k++) {
    float rowH = k == 0 ? 0.62 : 0.34;
    float v = (q.y + 0.35*sin(q.x*0.13 + float(k)*2.0) + 0.2*sin(q.x*0.41))/rowH + float(k)*0.5;
    float row = floor(v), fr = fract(v);
    float off = h13(vec3(row, 1.7, float(k)))*40.0;
    float Ls = mix(3.0, 9.0, h13(vec3(row, 3.1, float(k))));
    float su = (q.x + off)/Ls; float seg = floor(su), f = fract(su);
    float hs = h13(vec3(row, seg, 5.0 + float(k)));
    vec2 qs = vec2((seg + 0.5)*Ls - off + (hs - 0.5)*1.5, (row + 0.5 - float(k)*0.5)*rowH + (hs - 0.5)*0.9);
    vec3 sc = skyGrad(dirQ(qs), false) * (1.0 + (hs - 0.5)*0.07);
    float body = smoothstep(0.0, 0.10, f)*(1.0 - smoothstep(0.75, 1.0, f))*smoothstep(0.0, 0.25, fr)*(1.0 - smoothstep(0.75, 1.0, fr));
    float bristle = vnoise(vec2(q.x*3.0, v*7.0 + hs*40.0));
    float cover = body*(k == 0 ? 0.75 : 0.5)*uPaint;
    // S18 paints the sky harder (uPaint up to 1.45): never past full cover, and the sun stays clear
    if (uStrokeOn > 0.5) cover = min(cover, 1.0)*(1.0 - 0.9*smoothstep(0.99984, 0.99997, max(dot(rd, uSun), 0.0)));
    o = mix(o, sc*(0.97 + 0.06*bristle), cover);
  }
  return o;
}
vec3 skyColor(vec3 rd){
  vec3 c = skyGrad(rd, true);
  vec2 q = skyQ(rd);
  float ci = fbmV(vec2(q.x*0.11 + uTime*0.004, q.y*0.9 + q.x*0.05) + 7.0, 5);
  float cm = smoothstep(0.58, 0.80, ci) * smoothstep(9.0, 16.0, q.y);
  c = mix(c, vec3(1.05, 0.80, 0.84), cm*0.30);
  c = skyPaint(c, rd);
  // faint skybox lattice high above: the sky is part of the environment too
  float pwd = 1.2 * degrees(1.0/uFpx);
  vec2 gq = abs(fract(q/vec2(6.0, 3.0) + 0.5) - 0.5)*vec2(6.0, 3.0);
  float gl = 1.0 - smoothstep(pwd*0.4, pwd*1.1, min(gq.x, gq.y));
  c = mix(c, c*1.08 + vec3(0.02), gl * smoothstep(10.0, 22.0, q.y) * 0.45);
  return c;
}
vec3 hazeColor(vec3 rd){
  vec3 r = normalize(vec3(rd.x, 0.03, rd.z));
  float daz = abs(degrees(atan(rd.x, rd.z) - atan(uSun.x, uSun.z)));
  daz = min(daz, 360.0 - daz);
  vec3 warm = skyGrad(r, false);
  vec3 cool = mix(vec3(0.46, 0.46, 0.72), vec3(0.62, 0.50, 0.76), uPal);
  warm = mix(vec3(lum(warm)), warm, mix(1.25, 0.9, uPal)) * mix(0.86, 0.9, uPal);
  return mix(cool, warm, smoothstep(50.0, 6.0, daz)*0.8 + 0.2);
}
float shadowAt(vec3 p, vec3 n){
  vec3 q = p + n*0.04;
  vec4 l = projectL(q);
  vec3 ls = l.xyz;
  if (max(abs(ls.x), abs(ls.y)) > 0.99 || abs(ls.z) > 1.0) return 1.0;
  vec3 uvz = ls*0.5 + 0.5; uvz.z -= 0.0015;
  float a = 0.0;
  a += texture(uSh, uvz + vec3(-0.6, -0.6, 0.0)*uShTx);
  a += texture(uSh, uvz + vec3( 0.6, -0.6, 0.0)*uShTx);
  a += texture(uSh, uvz + vec3(-0.6,  0.6, 0.0)*uShTx);
  a += texture(uSh, uvz + vec3( 0.6,  0.6, 0.0)*uShTx);
  return a*0.25;
}
// drifting cloud shadows (they breathe the land without touching Clawd)
float cloudShade(vec3 p){
  vec2 q = p.xz*0.018 + vec2(uTime*0.020, uTime*0.006);
  float c = smoothstep(0.52, 0.72, fbmV(q + 3.0, 4));
  c *= smoothstep(7.0, 14.0, length(p.xz - uClawdP.xz));
  return 1.0 - 0.62*c*uCloudK;
}
vec3 lightSurf(vec3 p, vec3 n, vec3 alb, float ao, float sh){
  float dif = max(dot(n, uKey), 0.0) * mix(0.10, 1.0, sh);
  float sky = 0.55 + 0.45*n.y;
  float bnc = clamp(0.5 - 0.5*n.y, 0.0, 1.0);
  vec3 c = alb * (KEYCOL*dif + SKYCOL*sky*ao + BNCCOL*bnc*ao + FILLCOL*max(dot(n, FILLDIR), 0.0)*ao);
  vec3 lc = uClawdP + vec3(0.0, 0.34, 0.0) - p; float dl = length(lc);
  float gl = (0.35 + 0.65*max(dot(n, lc/dl), 0.0)) / (1.0 + dl*dl*1.4);
  c += alb * CLAWDCOL * gl * 1.2 * uClawdGlow;
  c += alb * vec3(1.0, 0.82, 0.55) * 0.22 * exp(-dl*dl*0.10) * max(n.y, 0.0) * (0.25 + 0.75*sh) * uClawdGlow;
  vec2 cq = (p.xz - uClawdP.xz) / vec2(0.71, 0.34);
  c *= 1.0 - 0.40 * exp(-dot(cq, cq)*1.3) * (1.0 - smoothstep(0.02, 0.4, abs(p.y - uClawdP.y)));
  return c;
}
// world-anchored brush strokes on a surface: rows across the stroke direction, segments along it.
// Two scales crossfade with distance so strokes keep a roughly constant size on screen.
vec3 strokeLayer(vec3 base, vec3 p, vec3 d3, vec3 e3, float w, float rnd){
  float u = dot(p, d3)/w, v = dot(p, e3)/w;
  vec3 c = base;
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 1.0 : 1.6;
    float vv = v*sc + rnd*13.0 + float(k)*0.37;
    float row = floor(vv), fr = fract(vv);
    float off = h13(vec3(row, rnd*91.0, float(k)))*60.0;
    float Ls = mix(2.6, 7.5, h13(vec3(row, 3.1, rnd*17.0 + float(k))));
    float su = (u*sc + off)/Ls;
    float seg = floor(su), f = fract(su);
    float hs = h13(vec3(row, seg, rnd*57.0 + float(k)*7.0));
    float body = smoothstep(0.0, 0.14, f)*(1.0 - smoothstep(0.72, 1.0, f))*smoothstep(0.0, 0.3, fr)*(1.0 - smoothstep(0.7, 1.0, fr));
    float val = (hs - 0.5)*0.30;
    vec3 tint = mix(vec3(1.07, 1.0, 0.90), vec3(0.92, 0.99, 1.09), h13(vec3(seg, row, 5.0 + float(k))));
    float bristle = vnoise(vec2(u*sc*0.8, vv*6.0 + hs*40.0)) - 0.5;
    vec3 s = base*(1.0 + val + bristle*0.18)*tint;
    c = mix(c, s, body*(k == 0 ? 0.9 : 0.55));
  }
  return c;
}
vec3 paintSurf(vec3 base, vec3 p, vec3 n, float rnd, float amt, float dist, float smoothK){
  if (amt <= 0.001) return base;
  vec3 dh = vec3(0.0, 1.0, 0.0) - n*n.y; float sl = length(dh);
  float a = rnd*6.2831853;
  vec3 fd = vec3(cos(a), 0.0, sin(a)); fd = fd - n*dot(fd, n);
  vec3 d3 = normalize(mix(normalize(fd + 1e-5), dh/max(sl, 1e-4), smoothstep(0.10, 0.35, sl)));
  // smooth forms: one continuous flow across facets (along the contours, wavering)
  float fa = (vnoise(p.xz*0.045) - 0.5)*3.0 + 0.6;
  vec3 flow = vec3(cos(fa), 0.0, sin(fa)); flow = normalize(flow - n*dot(flow, n) + 1e-5);
  d3 = normalize(mix(d3, flow, smoothK));
  float r2 = mix(rnd, 0.37, smoothK);
  vec3 e3 = normalize(cross(n, d3));
  float ww = 5.2*uK*dist/uFpx;
  float lod = log2(max(ww, 1e-4)/0.012);
  float l0 = floor(lod), frac = lod - l0;
  vec3 c0 = strokeLayer(base, p, d3, e3, 0.012*exp2(l0), r2);
  vec3 c1 = strokeLayer(base, p, d3, e3, 0.012*exp2(l0 + 1.0), r2);
  return mix(base, mix(c0, c1, frac), amt);
}
// smooth painted forms (S18): colour as a continuous field instead of per facet
vec3 smoothAlb(vec3 p, vec3 n){
  float v = vnoise(p.xz*0.06), v2 = vnoise(p.xz*0.23 + 11.0);
  vec3 g = mix(vec3(0.34, 0.58, 0.33), vec3(0.56, 0.70, 0.36), v);
  g = mix(g, vec3(0.28, 0.48, 0.40), v2*0.45);
  g = mix(g, vec3(0.86, 0.78, 0.58), smoothstep(0.2, -0.4, p.y));            // sandy banks
  g = mix(g, vec3(0.60, 0.50, 0.42), smoothstep(0.70, 0.45, n.y)*0.6);       // earth on steep ground
  float far = smoothstep(260.0, 520.0, length(p.xz));
  g = mix(g, mix(vec3(0.42, 0.56, 0.36), vec3(0.95, 0.94, 0.96), smoothstep(55.0, 75.0, p.y)), far);
  return lin(g);
}
// per-pixel marks of a world on its ground: the salt's polygon cracks, the grid's lines
float worldMark(float w, vec2 p){
  if (w > 2.5 && w < 3.5) {
    vec2 g = p/4.5, ci = floor(g), f = g - ci;
    float d1 = 9.0, d2 = 9.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 cp = o + vec2(hash21(ivec2(ci + o)), hash21(ivec2(ci + o) + ivec2(17, 29)))*0.8 + 0.1;
      float d = length(cp - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    float e = d2 - d1, fw = fwidth(e);
    return 1.0 - 0.38*(1.0 - smoothstep(0.02, 0.05 + fw, e));
  }
  if (w > 3.5) {
    vec2 g = abs(fract(p/6.0 + 0.5) - 0.5)*6.0, fw = fwidth(p);
    return 1.0 - 0.42*(1.0 - smoothstep(0.1, 0.22 + max(fw.x, fw.y), min(g.x, g.y)));
  }
  return 1.0;
}
float worldMarkAt(vec2 p){
  if (!worldsOn()) return 1.0;
  float m = worldMix(p);
  return mix(worldMark(uWorldM.x, p), worldMark(uWorldM.y, p), m);
}
// ---- S18 brush strokes: the crisp bristled band edge, directional marks, per-stroke pigment
// a: soft coverage from the map; the edge is where a + streaks crosses 0.5. Fine streaks run
// along the stroke about 4 px apart on screen (two world-anchored scales crossfaded with
// distance); coarse ones are a fixed fraction of the brush (sw: its half width).
float strokeEdge(float a, float fwa, vec2 q, vec2 d, float dist, float sw){
  vec2 e = vec2(-d.y, d.x);
  float u = dot(q, d), v = dot(q, e);
  float ww = 4.0*uK*dist/uFpx;
  float lod = log2(max(ww, 1e-4)/0.02);
  float l0 = floor(lod), fr = lod - l0;
  float s0 = 0.02*exp2(l0), s1 = 2.0*s0;
  float b0 = vnoise(vec2(u/(s0*6.0), v/s0) + vec2(l0*7.1, l0*3.3));
  float b1 = vnoise(vec2(u/(s1*6.0), v/s1) + vec2(l0*7.1 + 7.1, l0*3.3 + 3.3));
  float br = mix(b0, b1, fr) - 0.5;
  float bc = vnoise(vec2(u/(sw*1.6), v/(sw*0.11)) + 3.7) - 0.5;
  float fw = clamp(fwa*1.2, 0.012, 0.3);
  float th = 0.5 - 0.44*uStrokeBleed;
  return smoothstep(th - fw, th + fw, a + (0.42*br + 0.5*bc)*(1.0 - 0.5*uStrokeBleed));
}
// S34's wafer: the die-shot palette, iridescent across the wafer (hue drifts per die and with the
// view), fine array stripes that fade before they alias, and a flat average colour far away
vec3 diePal(float ci, float shift){
  // a step down in value and saturation (Claire's die photo is dark, its colour in the highlights),
  // with the arrays bronze-gold and the logic a cool magenta, so nothing sits next to Clawd's hue
  vec3 c = ci < 0.5 ? vec3(0.53, 0.41, 0.19) : ci < 1.5 ? vec3(0.13, 0.38, 0.44) : ci < 2.5 ? vec3(0.47, 0.19, 0.47)
         : ci < 3.5 ? vec3(0.76, 0.62, 0.29) : vec3(0.28, 0.18, 0.40);
  // iridescence: a drift toward the neighbouring hue
  vec3 nb = ci < 0.5 ? vec3(0.56, 0.49, 0.22) : ci < 1.5 ? vec3(0.17, 0.34, 0.52) : ci < 2.5 ? vec3(0.38, 0.21, 0.53)
          : ci < 3.5 ? vec3(0.66, 0.68, 0.34) : vec3(0.23, 0.20, 0.45);
  return mix(c, nb, shift);
}
// S34 (revision 14): the silicon crystal's periodic potential, an egg-crate of wells, one under each
// die of the grid (uDie: origin, pitch), coloured by the potential like a painted density map (deep
// teal wells, teal-green, gold crests) with fine contours circling each well; each chip Clawd draws in
// light sits in one well. The relief is in the shading (latNormal); the ground stays flat.
float latF(vec2 q){
  vec2 lo = vec2(uDie.x, uDie.y - uDie.z), hi = vec2(uDie.x + uDie.z, uDie.y);
  return smoothstep(0.2, 2.6, length(max(max(lo - q, q - hi), 0.0)));
}
float latV(vec2 q){
  vec2 a = 6.2831853*(q - vec2(uDie.x + 0.5*uDie.z, uDie.y - 0.5*uDie.z))/uDie.z;
  return (2.0 - cos(a.x) - cos(a.y))*0.25;
}
float latFar(vec2 q){ return smoothstep(0.03, 0.12, max(fwidth(q.x), fwidth(q.y))/uDie.z); }
vec3 latNormal(vec2 q){
  float e = 0.05, amp = uLatAmp*(1.0 - latFar(q));
  float hx = (latV(q + vec2(e, 0.0)) - latV(q - vec2(e, 0.0)))/(2.0*e), hz = (latV(q + vec2(0.0, e)) - latV(q - vec2(0.0, e)))/(2.0*e);
  return normalize(vec3(-amp*hx, 1.0, -amp*hz));
}
vec3 latColor(vec2 q, vec3 rd){
  float v = latV(q);
  vec3 c = v < 0.3 ? mix(vec3(0.055, 0.24, 0.28), vec3(0.10, 0.37, 0.40), v/0.3)
         : v < 0.6 ? mix(vec3(0.10, 0.37, 0.40), vec3(0.19, 0.51, 0.44), (v - 0.3)/0.3)
         : v < 0.86 ? mix(vec3(0.19, 0.51, 0.44), vec3(0.56, 0.55, 0.26), (v - 0.6)/0.26)
         : mix(vec3(0.56, 0.55, 0.26), vec3(0.78, 0.67, 0.38), (v - 0.86)/0.14);
  // fine contours circling each well (every fourteenth of the potential), every fourth a little stronger
  float k = v*14.0, fk = max(fwidth(k), 1e-4);
  float line = 1.0 - smoothstep(0.0, 1.2, abs(fract(k + 0.5) - 0.5)/fk);
  float major = 1.0 - step(0.5, mod(floor(k + 0.5), 4.0));
  c *= 1.0 - (0.2 + 0.16*major)*line*(1.0 - smoothstep(0.25, 0.6, fk));
  c *= 0.96 + 0.08*vnoise(q*0.9 + 3.0);                  // the brush's mottle
  return lin(mix(c, vec3(0.15, 0.37, 0.36), latFar(q)));
}
vec3 dieColor(vec2 q, vec3 rd){
  vec2 g = (q - uDie.xy)/uDie.z;
  g.y = -g.y;                                          // die-local y runs toward the lens (world -z)
  vec2 cell = floor(g), f = g - cell;
  float sc = uDie.w/uDie.z;
  float shift = 0.5 + 0.5*sin(dot(cell, vec2(0.61, 0.37)) + 2.3*rd.x + 1.7*rd.z);
  shift = 0.8*shift*(0.6 + 0.4*hash21(ivec2(cell) + ivec2(31, 17)));
  vec3 sub = vec3(0.20, 0.13, 0.27);                   // the substrate between blocks
  vec3 avg = mix(vec3(0.40, 0.30, 0.36), vec3(0.32, 0.30, 0.42), shift);
  float pix = max(fwidth(g.x), fwidth(g.y));           // dies per pixel: far away, the average
  float far = smoothstep(0.02, 0.06, pix);
  vec3 c = sub;
  vec2 u = (f - 0.5*sc)/(1.0 - sc);
  // painted edges: the blocks' borders waver a little, like a brush's
  vec2 uw = u + 0.0045*(vec2(vnoise(u*vec2(38.0, 9.0) + cell*7.1), vnoise(u*vec2(9.0, 38.0) + cell*3.3 + 11.0)) - 0.5);
  bool inScribe = f.x < 0.5*sc || f.x > 1.0 - 0.5*sc || f.y < 0.5*sc || f.y > 1.0 - 0.5*sc;
  if (inScribe) c = vec3(0.11, 0.08, 0.15);
  else {
    // a thin gold seal ring just inside the scribe
    vec2 e = min(u, 1.0 - u);
    if (min(e.x, e.y) < 0.012) c = vec3(0.70, 0.55, 0.26);
    for (int i = 0; i < 32; i++) {
      if (i >= uDieN) break;
      vec4 r = uDieRect[i], inf = uDieInfo[i];
      if (uw.x >= r.x && uw.x <= r.z && uw.y >= r.y && uw.y <= r.w) {
        // the hero die: a block takes its colour when the light reaches its centre
        if (cell == vec2(0.0) && uDieHero < length(0.5*(r.xy + r.zw) - 0.5)) continue;
        c = diePal(inf.x, shift)*(0.93 + 0.14*hash21(ivec2(cell*13.0) + ivec2(i*7, i*3)));
        if (inf.y > 0.5) {
          float t = inf.y < 1.5 ? (uw.y - r.y)/(r.w - r.y) : (uw.x - r.x)/(r.z - r.x);
          float k = t*inf.z, fk = fwidth(k);
          float line = (1.0 - smoothstep(0.0, 0.25 + fk, abs(fract(k) - 0.5)*2.0 - 0.55))*(1.0 - smoothstep(0.25, 0.6, fk));
          c *= 1.0 - 0.16*line;
        }
      }
    }
  }
  // a soft mottle at the brush's scale, a little less saturation, and a cool sheen at grazing angles
  c *= 0.95 + 0.1*vnoise(q*0.9 + 3.0);
  c = mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, 0.8);
  c = mix(c, c*vec3(0.92, 1.0, 1.12) + 0.04, 0.35*pow(1.0 - abs(rd.y), 4.0));
  return lin(mix(c, avg, far));
}
// the pigment a stroke lays down: one of the rung-4 greens per stroke, over the terrain's own
// banks, earth and far snow (smoothAlb)
vec3 strokeAlb(vec3 p, vec3 n, float tint){
  if (uStrokePal > 2.5) return latColor(p.xz, normalize(p - uCam))*(0.97 + 0.06*fract(tint*7.31));
  if (uStrokePal > 1.5) return dieColor(p.xz, normalize(p - uCam))*(0.94 + 0.12*fract(tint*7.31));
  vec3 base = smoothAlb(p, n);
  float h = fract(tint*5.37);
  vec3 pg = h < 0.2 ? vec3(0.290, 0.549, 0.310) : h < 0.4 ? vec3(0.184, 0.420, 0.271) : h < 0.6 ? vec3(0.369, 0.604, 0.282)
          : h < 0.8 ? vec3(0.180, 0.431, 0.384) : vec3(0.451, 0.561, 0.290);
  // S34's fields: ripe wheat, ochre, young green, olive, straw
  if (uStrokePal > 0.5) pg = h < 0.2 ? vec3(0.851, 0.690, 0.290) : h < 0.4 ? vec3(0.765, 0.560, 0.235) : h < 0.6 ? vec3(0.494, 0.639, 0.282)
          : h < 0.8 ? vec3(0.561, 0.600, 0.235) : vec3(0.890, 0.776, 0.455);
  pg = lin(pg)*(0.86 + 0.24*fract(tint*13.7));
  float grass = smoothstep(-0.25, 0.35, p.y)*smoothstep(0.55, 0.8, n.y)*(1.0 - smoothstep(48.0, 66.0, p.y));
  vec3 col = mix(base, pg, mix(0.75*grass, 1.0, floorK(p.xz)*uFloorLook));
  // the icy shore's blues on the far peaks: blue-white on the tops, glacier blue on the steep
  if (uTraits.x > 0.0) {
    float ice = smoothstep(20.0, 40.0, p.y)*uTraits.x;
    vec3 iceC = lin(mix(vec3(0.38, 0.58, 0.88), vec3(0.78, 0.89, 1.0), smoothstep(0.5, 0.9, n.y)));
    col = mix(col, iceC, ice);
  }
  // the salt flat's pale crust, cracked, on the flat floor inside the box (a ragged edge)
  if (uTraits.y > 0.0) {
    vec2 dd = max(uSaltBox.xy - p.xz, p.xz - uSaltBox.zw);
    float outside = max(dd.x, dd.y) + 6.0*(vnoise(p.xz*0.07 + 5.0) - 0.5);
    float salt = (1.0 - smoothstep(-2.0, 2.0, outside))*smoothstep(0.85, 0.96, n.y)*uTraits.y;
    float crack = worldMark(3.0, p.xz);
    col = mix(col, lin(mix(vec3(0.66, 0.56, 0.72), vec3(0.98, 0.87, 0.88), smoothstep(0.62, 0.99, crack))), salt);
  }
  return col;
}
// the paint inside a stroke: striations along the brush, paint load varying along it, a denser rim
vec3 strokeTex(vec3 c, vec2 q, vec2 d, float sw, float a, float fwa){
  vec2 e = vec2(-d.y, d.x);
  float u = dot(q, d), v = dot(q, e);
  // fine bristle striations (fading out before they alias), a broader streakiness, the paint load
  float sp = sw*0.05;
  float vq = v/sp + 2.0*vnoise(vec2(u/(sw*1.7), 7.0));
  float fq = fwidth(vq);
  float st = (vnoise(vec2(u/(sw*3.0), vq)) - 0.5)*(1.0 - smoothstep(0.3, 0.8, fq));
  float vq2 = v/(sw*0.22) + vnoise(vec2(u/(sw*2.5), 3.0));
  float st2 = (vnoise(vec2(u/(sw*5.0) + 9.0, vq2)) - 0.5)*(1.0 - smoothstep(0.3, 0.8, fwidth(vq2)));
  float load = vnoise(vec2(u/(sw*4.5) + 3.1, v/(sw*1.3) + 5.2)) - 0.5;
  float rim = smoothstep(0.45, 0.6, a)*(1.0 - smoothstep(0.62, 0.95, a));
  float k = (1.0 + 0.20*st + 0.16*st2)*(1.0 + 0.22*load)*(1.0 - 0.10*rim);
  c *= k*mix(vec3(0.97, 1.0, 1.04), vec3(1.03, 1.0, 0.95), clamp(0.5 + 2.0*(st + st2), 0.0, 1.0));
  return c;
}
// paintSurf with the brush direction supplied (dk blends it in)
vec3 paintSurfD(vec3 base, vec3 p, vec3 n, float rnd, float amt, float dist, float smoothK, vec3 dOver, float dk){
  if (amt <= 0.001) return base;
  vec3 dh = vec3(0.0, 1.0, 0.0) - n*n.y; float sl = length(dh);
  float a = rnd*6.2831853;
  vec3 fd = vec3(cos(a), 0.0, sin(a)); fd = fd - n*dot(fd, n);
  vec3 d3 = normalize(mix(normalize(fd + 1e-5), dh/max(sl, 1e-4), smoothstep(0.10, 0.35, sl)));
  float fa = (vnoise(p.xz*0.045) - 0.5)*3.0 + 0.6;
  vec3 flow = vec3(cos(fa), 0.0, sin(fa)); flow = normalize(flow - n*dot(flow, n) + 1e-5);
  d3 = normalize(mix(d3, flow, smoothK*(1.0 - dk)));
  vec3 dO = normalize(dOver - n*dot(dOver, n) + 1e-5);
  d3 = normalize(mix(d3, dO, dk));
  float r2 = mix(mix(rnd, 0.37, smoothK), rnd, dk);
  vec3 e3 = normalize(cross(n, d3));
  float ww = 5.2*uK*dist/uFpx;
  float lod = log2(max(ww, 1e-4)/0.012);
  float l0 = floor(lod), frac = lod - l0;
  vec3 c0 = strokeLayer(base, p, d3, e3, 0.012*exp2(l0), r2);
  vec3 c1 = strokeLayer(base, p, d3, e3, 0.012*exp2(l0 + 1.0), r2);
  return mix(base, mix(c0, c1, frac), amt);
}
float edgeLine(vec3 b, float w){ vec3 d = fwidth(b); vec3 a = smoothstep(d*(w - 0.6), d*(w + 0.6), b); return 1.0 - min(min(a.x, a.y), a.z); }
vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }
vec3 fogIt(vec3 col, vec3 p, vec3 rv, float tF, float mask){
  float fd = 1.0 - exp(-tF*FOGD*uFogK*exp(-max(p.y, 0.0)*0.004));
  float sat = mix(0.16, 1.0, mask);
  col = mix(vec3(lum(col)), col, sat);
  col = mix(col, mix(hazeColor(rv), vec3(0.95, 0.94, 0.93), uSkyWhite), fd);
  // tile mode: the world around the tile fades into the void
  return col;
}
vec4 finishCol(vec3 col){
  if (uRaw == 1) return vec4(col, 1.0);
  return vec4(pow(aces(col * 0.95 * uExposure), vec3(1.0/2.2)), 1.0);
}
`;

// ------------------------------------------------------------------ terrain
export const TERRAIN_VS = `
layout(location=0) in vec4 aA;   // x z y0 y1
layout(location=1) in vec4 aB;   // y2 cx cz r0
layout(location=2) in vec4 aC;   // bary0 xyz, r2
layout(location=3) in vec4 aD;   // learned albedo, th
layout(location=4) in vec4 aE;   // smooth normal, far
out vec3 vWP; out vec3 vB0; out vec3 vNs; out float vLift;
flat out vec4 vF;    // r0, r2, th, far
flat out vec4 vAlb;  // albedo, learned mask at the centroid
flat out vec4 vR;    // rise at the centroid, clip gone, level, 0
void main(){
  vec2 q = aA.xy;
  float jit = posHash(q, 1);
  float m = learnedAt(q);
  float L = clamp(max(levelOf(m), 2.0*uSmoothAll*smoothstep(0.25, 0.7, m)), 0.0, 2.0);
  if (uStrokeOn > 0.5) {       // S18: facets under relaxed paint subdivide into smooth forms
    vec4 sb = strokeB(q);
    L = max(L, 2.0*max(smoothstep(0.08, 0.8, sb.r), pulseK(q)));
  }
  float y = L < 1.0 ? mix(aA.z, aA.w, L) : mix(aA.w, aB.x, L - 1.0);
  y = worldY(q, y);
  float rs = riseAt(q, jit);
  y = y*rs + crestAt(q)*(0.7 + 0.6*jit);
  y = mix(y, 0.0, floorK(q)) + ringLift(q);
  vec2 hg; float hr;
  y += hillAt(q, hg, hr);
  vec3 p = vec3(q.x, y, q.y);
  vec2 c = aB.yz;
  float cj = posHash(c, 2);
  float gone = clipGone(c, cj);
  if (gone > 0.0) { p.xz = mix(p.xz, c, gone*0.9); p.y -= gone*gone*(20.0 + 40.0*cj); }
  vWP = p; vB0 = aC.xyz; vNs = aE.xyz; vLift = hr;
  if (uHillOn > 0.5) { float ny = max(aE.y, 0.05); vNs = normalize(vec3(aE.x/ny - hg.x, 1.0, aE.z/ny - hg.y)); }
  vF = vec4(aB.w, aC.w, aD.w, aE.w);
  vec3 albC = aD.rgb;
  if (worldsOn()) {           // a facet takes the colour of the world at its centroid
    float wc = worldAt(c);
    if (wc > 0.5) {
      vec2 e = vec2(0.8, 0.0);
      vec2 g = vec2(worldH(wc, c + e.xy) - worldH(wc, c - e.xy), worldH(wc, c + e.yx) - worldH(wc, c - e.yx))/1.6;
      albC = worldAlb(wc, c, worldH(wc, c), 1.0/sqrt(1.0 + dot(g, g)), posHash(c, 3));
    }
  }
  vAlb = vec4(albC, learnedAt(c));
  vR = vec4(riseAt(c, cj), gone, L, 0.0);
#ifdef SHADOW
  gl_Position = projectL(p);
#else
  gl_Position = projectP(p);
#endif
}`;

export const TERRAIN_FS = `
in vec3 vWP; in vec3 vB0; in vec3 vNs; in float vLift;
flat in vec4 vF; flat in vec4 vAlb; flat in vec4 vR;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
void main(){
  if (vR.y > 0.98) discard;
  vec3 p = vWP;
  if (clipOut(p.xz)) discard;
  if (uMirror == 1 && p.y < WATER - 0.02) discard;
  vec3 nf = normalize(cross(dFdx(p), dFdy(p)));
  if (nf.y < 0.0) nf = -nf;
  float mask = vAlb.a;
  float smoothK = clamp(uSmoothAll*smoothstep(0.3, 0.95, mask), 0.0, 1.0);
  // S18: his cursors' brush strokes (coverage sc, direction, tint, fresh paint)
  float sc = 0.0, sFresh = 0.0, sTint = 0.5, sW = 1.0, sA = 0.0, sFwa = 0.0; vec2 sDir = vec2(1.0, 0.0);
  if (uStrokeOn > 0.5) {
    vec4 sa = strokeA(p.xz), sb = strokeB(p.xz);
    float a = sa.a, fwa = fwidth(a);
    vec3 v = sa.rgb/max(a, 1e-3);
    sTint = v.x;
    vec2 c2 = v.yz*2.0 - 1.0;
    float th = 0.5*atan(c2.y, c2.x + 1e-6);
    sDir = vec2(cos(th), sin(th));
    float relax = clamp(sb.r/max(a, 1e-3), 0.0, 1.0);
    sFresh = clamp(sb.g/max(a, 1e-3), 0.0, 1.0);
    sW = 0.25*exp2(14.0*clamp(sb.b/max(a, 1e-3), 0.0, 1.0));
    sA = a; sFwa = fwa;
    sc = a > 0.002 ? strokeEdge(a, fwa, p.xz, sDir, length(p - uCam), sW) : 0.0;
    smoothK = max(smoothK, max(sc*relax*uStrokeSmooth, pulseK(p.xz)));
  }
  vec3 n = normalize(mix(mix(nf, normalize(vNs), smoothK), vec3(0.0, 1.0, 0.0), floorK(p.xz)));
  if (uStrokeOn > 0.5 && uStrokePal > 2.5) n = normalize(mix(n, latNormal(p.xz), sc));    // S34: the wells, where painted
  float g = mask - (vF.z*0.45 + 0.28);
  float lt = smoothstep(0.0, 0.08, g);
  float front = lt*(1.0 - smoothstep(0.0, 0.16, g));
  float gv = 0.45 + (vF.x - 0.5)*0.11;
  vec3 alb = mix(vec3(gv), lin(vAlb.rgb)*(0.84 + 0.30*vF.y), lt);
  if (uStrokeOn > 0.5) lt = max(lt, sc);
  alb *= worldMarkAt(p.xz);
  float white = 1.0 - smoothstep(0.1, 0.85, vR.x);
  alb = mix(alb, smoothAlb(p, n)*(0.95 + 0.1*vnoise(p.xz*0.9)), smoothK*lt);
  if (uStrokeOn > 0.5) alb = mix(alb, strokeTex(strokeAlb(p, n, sTint), p.xz, sDir, sW, sA, sFwa)*(uStrokePal > 1.5 ? 0.95 + 0.1*vF.y : 1.0), sc);
  alb = mix(alb, lin(vec3(0.44, 0.40, 0.55))*(0.92 + 0.16*vnoise(p.xz*0.35)), uFloor*(1.0 - uFloorLook));
  vec3 rd = normalize(p - uCam);
  if (uOrtho.x > 0.5) rd = uFwd;
  float tF = length(p - uCam);
  if (uStrokeOn > 0.5) {
    if (uMirror == 0) alb = paintSurfD(alb, p, n, mix(vF.y, sTint, sc), lt*uPaint*(1.0 - white)*(1.0 - 0.45*sc), tF, smoothK, vec3(sDir.x, 0.0, sDir.y), sc);
  } else {
    if (uMirror == 0) alb = paintSurf(alb, p, n, vF.y, lt*uPaint*(1.0 - white), tF, smoothK);
  }
  float sh = mix(shadowAt(p, n) * cloudShade(p), 1.0, 0.45*smoothK);
  vec3 col = lightSurf(p, n, alb, 1.0, sh);
  col += sc*sFresh*vec3(1.0, 0.66, 0.38)*0.35*(1.0 - uFloor);
  if (uFloorLook > 0.5) col = col*(1.0 - 0.18*uMeadowLift*floorK(p.xz)*smoothstep(12.0, 40.0, length(p - uCam))) + alb*vec3(0.50, 0.56, 0.62)*uMeadowLift*floorK(p.xz);
  if (uStrokeOn > 0.5) col += pulseGlow(p.xz)*alb*vec3(1.0, 0.74, 0.50)*1.6;
  // S19: his light in the land as it rises (brightest where it moves fastest)
  if (uHillOn > 0.5) col += clamp(vLift, 0.0, 2.0)*(alb*1.1 + vec3(0.05, 0.03, 0.01))*vec3(1.0, 0.70, 0.42);
  float e = edgeLine(vB0, 1.25*uK);
  float wire = (1.0 - lt)*mix(0.10, 0.8, 1.0 - white)*(1.0 - smoothK);
  col = mix(col, col*0.55 + vec3(0.02, 0.02, 0.03), e*wire);
  col += front*vec3(1.0, 0.80, 0.56)*0.34;
  col += ringGlow(p.xz)*vec3(1.0, 0.74, 0.46)*1.3*(0.6 + 0.4*e);
  // the rising front glows as it passes
  float crest = uRise.w > 0.5 ? exp(-pow((length(p.xz - uRiseC) - uRise.x)/max(uRise.y*0.5, 0.5), 2.0)) : 0.0;
  col += crest*uRise.z*0.9*vec3(1.0, 0.88, 0.72)*(0.3 + 0.7*e);
  // revision 13: a soft light where the humans' cursor is drawing the land in
  if (uSweepTip.w > 0.0) col += uSweepTip.w*exp(-pow(length(p.xz - uSweepTip.xy)/uSweepTip.z, 2.0))*vec3(1.0, 0.9, 0.78)*(0.35 + 0.65*e);
  vec3 rv = uMirror == 1 ? vec3(rd.x, -rd.y, rd.z) : rd;
  col = fogIt(col, p, rv, tF, max(lt, white));
  // S18's ice keeps its blue through the dusk haze: glacier blue at the haze's own brightness, deepest
  // on the faces turned from the sun, paler (alpenglow) on the faces toward it
  if (uStrokeOn > 0.5 && uTraits.x > 0.0) {
    float iceK = sc*smoothstep(20.0, 40.0, p.y)*uTraits.x;
    float away = 1.0 - 0.55*smoothstep(-0.2, 0.6, dot(n.xz, normalize(uSun.xz + 1e-5)));
    float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(col, L*vec3(0.66, 0.92, 1.42) + vec3(0.0, 0.015, 0.05), 0.72*iceK*away);
  }
  oCol = finishCol(col);
  if (white > 0.001 && uRaw == 0) {
    vec2 gq = abs(fract(p.xz + 0.5) - 0.5), fw = max(fwidth(p.xz), vec2(1e-5));
    float gl = 1.0 - smoothstep(0.35*uK, 1.1*uK, min(gq.x/fw.x, gq.y/fw.y));
    gl *= (1.0 - smoothstep(0.05, 0.16, max(fw.x, fw.y)/uK)) * (1.0 - smoothstep(60.0, 260.0, tF));
    vec3 wc = mix(vec3(0.941, 0.918, 0.886), vec3(0.972, 0.935, 0.895), smoothstep(20.0, 300.0, tF));
    wc = mix(wc, vec3(0.73, 0.70, 0.66), gl*0.95);
    vec2 cq = (p.xz - uClawdP.xz) / vec2(0.85, 0.40);
    wc *= 1.0 - 0.10*exp(-dot(cq, cq)*1.2);
    oCol.rgb = mix(oCol.rgb, wc, white);
  }
  // S18's end: S19's painted floor at dusk (mauve at the feet, peach haze toward the horizon)
  if (uFloor*(1.0 - uFloorLook) > 0.001 && uRaw == 0) {
    float ld = log(max(tF, 1.0));
    vec3 fc = mix(vec3(0.50, 0.35, 0.44), vec3(0.86, 0.66, 0.57), smoothstep(log(3.5), log(13.0), ld));
    fc = mix(fc, vec3(0.97, 0.81, 0.67), smoothstep(log(11.0), log(55.0), ld));
    vec2 sq = p.xz*vec2(2.2, 5.5);
    fc *= 0.95 + 0.10*vnoise(sq) + 0.05*(vnoise(sq*3.1 + 7.0) - 0.5);
    float sd = max(dot(normalize(vec3(rd.x, 0.0, rd.z) + 1e-5), normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0);
    fc += vec3(0.05, 0.035, 0.0)*pow(sd, 10.0);
    oCol.rgb = mix(oCol.rgb, fc, uFloor*(1.0 - uFloorLook));
  }
  oAux = vec4(max(lt, 0.0), tF/(tF + 60.0), vF.w > 0.5 ? 0.5 : 0.25, 0.0);
}`;

// ------------------------------------------------------------------ water
export const WATER_VS = `
layout(location=0) in vec4 aP;   // x, y, z, depth
layout(location=1) in vec4 aN;   // facet normal
layout(location=2) in vec4 aC;   // body colour, rnd
layout(location=3) in vec4 aF;   // centroid x, z
out vec3 vWP; flat out vec3 vN; flat out vec4 vC; flat out vec4 vM;
void main(){
  vec3 p = aP.xyz;
  vec2 c = aF.xy;
  float cj = posHash(c, 2);
  float gone = clipGone(c, cj);
  float rs = riseAt(c, cj);
  float vv = valleyness(c);
  rs = min(rs, uWorldWater > 0.5 ? 1.0 - vv : vv);
  vWP = p; vN = aN.xyz; vC = aC;
  vM = vec4(learnedAt(c), aP.w, gone, rs);
  gl_Position = projectP(p);
}`;
export const WATER_FS = `
in vec3 vWP; flat in vec3 vN; flat in vec4 vC; flat in vec4 vM;
uniform sampler2D uRefl;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
void main(){
  if (vM.z > 0.02 || vM.w < 0.35 || uFloor > 0.3) discard;
  vec3 p = vWP; vec3 n = normalize(vN);
  if (clipOut(p.xz)) discard;
  vec3 rd = normalize(p - uCam); if (uOrtho.x > 0.5) rd = uFwd;
  float tF = length(p - uCam);
  float mask = vM.x;
  if (uStrokeOn > 0.5) {       // S18: strokes paint the water too
    vec4 sa = strokeA(p.xz), sb = strokeB(p.xz);
    float a = sa.a, fwa = fwidth(a);
    vec2 c2 = (sa.yz/max(a, 1e-3))*2.0 - 1.0;
    float th = 0.5*atan(c2.y, c2.x + 1e-6);
    float sw = 0.25*exp2(14.0*clamp(sb.b/max(a, 1e-3), 0.0, 1.0));
    mask = max(mask, a > 0.002 ? strokeEdge(a, fwa, p.xz, vec2(cos(th), sin(th)), tF, sw) : 0.0);
  }
  float lt = smoothstep(0.1, 0.5, mask);
  vec2 suv = gl_FragCoord.xy / uRes;
  vec2 off = vec2(n.x, n.z) * vec2(0.07, 0.15);
  vec3 refl = texture(uRefl, clamp(suv + off, vec2(0.001), vec2(0.999))).rgb;
  float cosv = clamp(dot(-rd, n), 0.0, 1.0);
  float fres = 0.02 + 0.98*pow(1.0 - cosv, 5.0);
  float sh = shadowAt(p, vec3(0.0, 1.0, 0.0)) * cloudShade(p);
  vec3 body = mix(vec3(0.36, 0.36, 0.38), lin(vC.rgb), lt) * (SKYCOL*1.1 + KEYCOL*0.22*sh);
  refl *= mix(1.0, 0.52, smoothstep(45.0, 180.0, tF));
  vec3 col = mix(body, min(refl, vec3(1.6))*0.72, clamp(fres*1.05, 0.0, 1.0));
  vec3 rr = reflect(rd, n);
  col += vec3(1.0, 0.86, 0.62) * pow(max(dot(rr, uSun), 0.0), 500.0) * 3.5 * sh;
  col = paintSurf(col, p, vec3(0.0, 1.0, 0.0), vC.a, lt*0.8*uPaint, tF, 0.0);
  col = fogIt(col, p, rd, tF, max(lt, 0.3));
  oCol = finishCol(col);
  oAux = vec4(lt, tF/(tF + 60.0), 0.75, 0.0);
}`;

// ------------------------------------------------------------------ props and clouds
export const PROP_VS = `
layout(location=0) in vec4 aO;   // local offset, kind
layout(location=1) in vec4 aAn;  // anchor x, z, y0, y1
layout(location=2) in vec4 aX;   // y2, grey, emission, rnd
layout(location=3) in vec4 aN;   // normal
layout(location=4) in vec4 aC;   // learned albedo, paint
uniform float uHideAgents;
// revision 14 (S13): props revealed where the humans' cursor clicks: trees and rocks inside a radius
// growing from (x, z); agents inside a radius growing from the spawn (a negative radius: always shown)
uniform vec4 uPropGate;
out vec3 vWP; flat out vec3 vN; flat out vec4 vC; flat out vec4 vM;
void main(){
  float kind = aO.w;
  vec3 p; float m = 1.0, gone = 0.0, rs = 1.0;
  if (kind > 0.5 && kind < 1.5) {           // cloud: absolute position
    p = aO.xyz; m = 1.0;
  } else {
    vec2 q = aAn.xy;
    float jit = posHash(q, 1);
    float lm = learnedAt(q);
    m = kind > 1.5 && kind < 2.5 ? 1.0 : lm;
    float L = clamp(max(levelOf(lm), 2.0*uSmoothAll*smoothstep(0.25, 0.7, lm)), 0.0, 2.0);
    if (uStrokeOn > 0.5) {     // S18: a prop takes its colour when a stroke passes over it
      vec4 sb = strokeB(q);
      m = max(m, smoothstep(0.3, 0.7, sb.a));
      L = max(L, 2.0*max(smoothstep(0.08, 0.8, sb.r), pulseK(q)));
    }
    float y = L < 1.0 ? mix(aAn.z, aAn.w, L) : mix(aAn.w, aX.x, L - 1.0);
    if (kind > 2.5) y = worldY(q, y);                     // agents stand on whatever world it is
    rs = riseAt(q, jit);
    float grow = smoothstep(0.55, 1.0, rs);
    if (kind < 0.5) grow *= smoothstep(0.3, 0.7, valleyness(q));   // trees and rocks belong to the valley
    if (kind > 2.5 && uHideAgents > 0.5) grow = 0.0;
    if (uPropGate.z >= 0.0 && kind < 0.5) grow *= smoothstep(0.0, 1.0, (uPropGate.z - length(q - uPropGate.xy))/6.0 + (jit - 0.5)*0.9);
    if (uPropGate.w >= 0.0 && kind > 2.5) grow *= smoothstep(0.0, 1.0, (uPropGate.w - length(q))/10.0 + (jit - 0.5)*0.9);
    grow *= 1.0 - smoothstep(0.0, 0.7, uFloor)*(1.0 - uFloorLook);
    p = vec3(q.x, mix(y*rs + crestAt(q), 0.0, floorK(q)) + ringLift(q), q.y) + aO.xyz*grow;
    if (uHillOn > 0.5) { vec2 hg; float hr; p.y += hillAt(q, hg, hr); }
    gone = clipGone(q, posHash(q, 2));
    if (gone > 0.0) p.y -= gone*gone*30.0;
    if (grow <= 0.001) gone = 1.0;
  }
  vWP = p; vN = aN.xyz; vC = aC;
  vM = vec4(m, aX.y, aX.z, max(gone, kind > 0.5 && kind < 1.5 ? 2.0 : 0.0));
#ifdef SHADOW
  gl_Position = kind > 0.5 && kind < 1.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectL(p);
#else
  gl_Position = projectP(p);
#endif
}`;
export const PROP_FS = `
in vec3 vWP; flat in vec3 vN; flat in vec4 vC; flat in vec4 vM;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
vec3 cloudLit(vec3 n, float rnd, vec3 dc){
  float az = atan(dc.x, dc.z), el = asin(clamp(dc.y, -1.0, 1.0));
  float saz = atan(uSun.x, uSun.z), sel = asin(uSun.y);
  vec2 ts = vec2(saz - az, sel - el);
  if (ts.x > PI) ts.x -= 2.0*PI; if (ts.x < -PI) ts.x += 2.0*PI;
  float dsun = degrees(length(ts));
  vec3 eaz = vec3(cos(az), 0.0, -sin(az));
  vec3 eel = vec3(-sin(az)*sin(el), cos(el), -cos(az)*sin(el));
  vec3 L = normalize(normalize(ts.x*eaz + ts.y*eel + 1e-5) + 0.15*dc);
  float nl = dot(n, L);
  float facet = smoothstep(-0.70, 0.90, nl);
  float pos = clamp(exp(-dsun*0.10)*1.25 + (1.0 - smoothstep(3.0, 9.0, degrees(el)))*0.30, 0.0, 1.0);
  float lit = clamp(facet*0.75 + pos*0.50 - 0.22, 0.0, 1.0);
  float up = clamp(n.y, 0.0, 1.0), dn = clamp(-n.y, 0.0, 1.0);
  vec3 shadowC = mix(vec3(0.16, 0.15, 0.36), vec3(0.30, 0.24, 0.50), uPal);
  vec3 topC = mix(vec3(0.30, 0.32, 0.62), vec3(0.46, 0.42, 0.74), uPal);
  vec3 litC = vec3(1.36, 0.80, 0.47);
  vec3 underC = vec3(0.92, 0.48, 0.44);
  vec3 c = mix(shadowC, topC, up*0.8);
  c = mix(c, underC, dn*0.7);
  c = mix(c, litC, lit);
  float sunProx = exp(-dsun*0.12);
  float rim = pow(1.0 - abs(dot(n, -dc)), 2.0);
  c += vec3(1.5, 1.05, 0.70) * rim * smoothstep(0.1, 0.7, nl) * (0.08 + 1.6*sunProx);
  c = mix(c, vec3(1.25, 0.88, 0.62), sunProx*0.35);
  return c * (0.955 + 0.09*rnd);
}
void main(){
  if (vM.w > 0.97 && vM.w < 1.5) discard;
  vec3 p = vWP; vec3 n = normalize(vN);
  bool cloud = vM.w > 1.5;
  if (uMirror == 1 && !cloud && p.y < WATER - 0.02) discard;
  vec3 rd = normalize(p - uCam); if (uOrtho.x > 0.5) rd = uFwd;
  vec3 rv = uMirror == 1 ? vec3(rd.x, -rd.y, rd.z) : rd;
  float tF = length(p - uCam);
  vec3 col;
  if (cloud) {
    if (uVoid > 0.5) discard;
    if (uCloudFade > 0.99) discard;
    col = cloudLit(n, vC.a, rv);
    col = mix(col, skyColor(rv), uCloudFade);
    col = mix(col, uVoidCol, uVoid);
    oCol = finishCol(col);
    vec3 wsky = mix(vec3(0.984, 0.933, 0.878), vec3(0.925, 0.905, 0.905), smoothstep(0.0, 0.5, max(rv.y, 0.0)));
    if (uRaw == 0) oCol.rgb = mix(oCol.rgb, wsky, uSkyWhite);
    oAux = vec4(0.72, 1.0, 0.05, 0.85*(1.0 - uVoid));
    return;
  }
  if (clipOut(p.xz)) discard;
  float lt = smoothstep(0.25, 0.6, vM.x);
  vec3 alb = mix(vec3(vM.y*vM.y*0.78), lin(vC.rgb), lt);
  float sh = shadowAt(p, n) * cloudShade(p);
  col = lightSurf(p, n, alb, 1.0, sh);
  float fr = pow(1.0 - max(dot(-rv, n), 0.0), 3.0);
  col += fr * vec3(1.0, 0.85, 0.7) * 0.30 * alb;
  col += alb * vM.z * 3.0;
  if (uMirror == 0) col = paintSurf(col, p, n, fract(vC.a*7.3 + p.y), lt*vC.a*uPaint*0.8, tF, 0.0);
  col = fogIt(col, p, rv, tF, max(lt, 0.0));
  oCol = finishCol(col);
  oAux = vec4(lt, tF/(tF + 60.0), 1.0, 0.0);
}`;

// ------------------------------------------------------------------ Clawd (crisp solid, never painted)
export const CLAWD_VS = `
layout(location=0) in vec3 aP;
layout(location=1) in vec4 aN;
layout(location=2) in float aAO;
layout(location=3) in float aM;
uniform vec3 uCPos; uniform vec4 uCRot;  // yaw, lean (forward pitch about the feet), scale, squash
out vec3 vWP; flat out vec3 vN; out float vAO; flat out float vM;
vec3 xf(vec3 v){
  float cl = cos(uCRot.y), sl = sin(uCRot.y);
  v = vec3(v.x, v.y*cl - v.z*sl, v.y*sl + v.z*cl);   // lean forward about the feet
  float cy = cos(uCRot.x), sy = sin(uCRot.x);
  return vec3(v.x*cy + v.z*sy, v.y, -v.x*sy + v.z*cy);
}
void main(){
  vec3 lp = aP * vec3(1.0, uCRot.w, 1.0) * uCRot.z;
  vec3 p = uCPos + xf(lp);
  vWP = p; vN = normalize(xf(aN.xyz)); vAO = aAO; vM = aM;
#ifdef SHADOW
  gl_Position = projectL(p);
#else
  gl_Position = projectP(p);
#endif
}`;
export const CLAWD_FS = `
in vec3 vWP; flat in vec3 vN; in float vAO; flat in float vM;
uniform vec3 uCPos; uniform float uGhost; uniform float uClawdFill;   // S34: lifts his shading toward #D97757 under a backlight
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
void main(){
  vec3 p = vWP; vec3 n = normalize(vN);
  if (uMirror == 1 && p.y < WATER - 0.02) discard;
  vec3 base = vM > 0.5 ? vec3(0.118, 0.090, 0.078) : vec3(0.851, 0.467, 0.341);
  float sh = shadowAt(p, n);
  float ao = vAO * mix(0.6, 1.0, smoothstep(0.0, 0.16, p.y - uCPos.y));
  float dif = max(dot(n, uKey), 0.0) * mix(0.35, 1.0, sh);
  float shade = (0.74 + 0.30*dif/0.9 + 0.07*max(n.y, 0.0)) * mix(0.72, 1.0, ao);
  vec3 disp = base * clamp(mix(shade, 1.0, uClawdFill), 0.5, 1.0);
  disp = mix(disp, vec3(0.96), uSkyWhite*0.0);
  float tF = length(p - uCam);
  if (uGhost > 0.0) {
    vec3 gc = mix(vec3(0.851, 0.467, 0.341), vec3(1.0, 0.72, 0.52), 0.35) * (0.85 + 0.25*max(dot(n, -normalize(p - uCam)), 0.0));
    oCol = uRaw == 1 ? vec4(pow(gc, vec3(2.2))*uGhost, uGhost) : vec4(gc*uGhost, uGhost);
    oAux = vec4(0.0);
    return;
  }
  oCol = uRaw == 1 ? vec4(pow(disp, vec3(2.2))*1.3, 1.0) : vec4(disp, 1.0);
  oAux = vec4(1.0, tF/(tF + 60.0), 0.9, 0.0);
}`;

// ------------------------------------------------------------------ sky (fullscreen)
export const FULL_VS = '#version 300 es\nvoid main(){ vec2 p = vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }\n';
export const SKY_FS = `
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oAux;
void main(){
  vec2 ndc = gl_FragCoord.xy/uRes*2.0 - 1.0;
  vec3 rd = uOrtho.x > 0.5 ? uFwd : normalize(uFwd + uRight*((ndc.x - uPP.x)*uAspect/uFy) + uUp*((ndc.y - uPP.y)/uFy));
  if (uMirror == 1) rd.y = -rd.y;
  vec3 col = skyColor(rd);
  col = mix(vec3(lum(col)), col, 0.96);
  // below the horizon (only seen past the world's edge): haze
  col = mix(col, hazeColor(rd), smoothstep(0.0, -0.02, rd.y));
  vec3 vc = uVoidCol*(1.0 + 0.35*(ndc.y*0.5 + 0.5)) + vec3(0.03, 0.02, 0.05)*(1.0 - length(ndc)*0.5);
  vec2 gq = (ndc - uVoidGlow.xy)*vec2(uAspect, 1.0)/max(uVoidGlow.w, 1e-3);
  vc += uVoidGlow.z*(vec3(1.0, 0.30, 0.10)*exp(-dot(gq, gq)*1.4) + vec3(0.32, 0.08, 0.05)*exp(-dot(gq, gq)*0.25));
  col = mix(col, vc, uVoid);
  oCol = finishCol(col);
  if (uRaw == 0) {
    float el = max(rd.y, 0.0);
    vec3 wsky = mix(vec3(0.984, 0.933, 0.878), vec3(0.925, 0.905, 0.905), smoothstep(0.0, 0.5, el));
    float hz = 1.0 - smoothstep(0.6, 1.6, abs(rd.y*uFpx/uK + 0.4));
    wsky = mix(wsky, vec3(0.733, 0.694, 0.659), hz*0.9);
    oCol.rgb = mix(oCol.rgb, wsky, uSkyWhite);
  } else oCol.rgb = mix(oCol.rgb, vec3(1.8), uSkyWhite);
  oAux = vec4(0.72, 1.0, 0.0, 1.0 - uVoid);
}`;
export const SHADOW_FS = 'void main(){}';
