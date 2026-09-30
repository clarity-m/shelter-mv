// FORK of sets/hill/glsl.js for brief H (see hillx.js). Additions, all inert at their defaults:
// the river in LIT_FS (uRivN = 0: off), the stroke lift in SEED_VS (uStrokeLift = 0: off) and the
// LINE_VS / LINE_FS pair for lines of light. Everything else is the original, unchanged.
// GLSL sources for the hill set. Scene state arrives as uniforms (see hill.js).
import { MAT, HUMAN_PRIMS, CLOUDS, DOME, HILL_EPS } from '../hill/scene.js';
import { PAL_KEYS } from '../hill/palettes.js';
import { CLIT_GLSL, VOL_BODY } from '../hill/clawdlight.js';   // (revision 23) Clawd's light in the world, opt-in

const fx = (x) => { const s = (+x).toFixed(5); return s.indexOf('.') < 0 ? s + '.0' : s; };
const g3 = (a) => `vec3(${fx(a[0])},${fx(a[1])},${fx(a[2])})`;

function primExpr(q) {
  if (q.t === 'sph') return `length(p - ${g3(q.c)}) - ${fx(q.r)}`;
  if (q.t === 'ell') return `sdEll(p - ${g3(q.c)}, ${g3(q.rad)})`;
  if (q.t === 'cap') return `sdCap(p, ${g3(q.a)}, ${g3(q.b)}, ${fx(q.r)})`;
  return `sdRC(p, ${g3(q.a)}, ${g3(q.b)}, ${fx(q.r)}, ${fx(q.r2)})`;
}
function sdfCode(prims, name) {
  let s = `float ${name}(vec3 p, out int mat, out int part) {\n  float d = 1e9, di; mat = 0; part = 0;\n`;
  for (const q of prims) s += `  di = ${primExpr(q)};\n  if (di < d) { mat = ${q.mat}; part = ${q.part}; }\n  d = smin(d, di, ${fx(q.k || 0.001)});\n`;
  return s + '  return d;\n}\n';
}
function sdfCodeD(prims, name) {
  let s = `float ${name}(vec3 p) {\n  float d = 1e9;\n`;
  for (const q of prims) s += `  d = smin(d, ${primExpr(q)}, ${fx(q.k || 0.001)});\n`;
  return s + '  return d;\n}\n';
}

// ---------------------------------------------------------------- shared declarations
export const SCENE_DECL = `
uniform vec2 uRes;
uniform vec3 uCamPos, uCamFw, uCamR, uCamU; uniform float uF; uniform vec2 uPP;
uniform vec3 uSun;
uniform vec4 uHillA[4]; uniform vec4 uHillS[4];
uniform float uMaxH;
uniform float uHumanOn; uniform vec3 uHPos, uHF, uHR; uniform vec4 uHB;
uniform float uTreeOn; uniform vec3 uTPos; uniform vec4 uTB; uniform vec4 uTrA[4]; uniform vec4 uTrB[4]; uniform vec4 uCan[11]; uniform vec4 uCanG[11]; uniform float uCanK, uLeafAmp;
uniform vec4 uCGlow; uniform float uAuraK, uAuraS;
uniform int uNTow; uniform vec4 uTowA[64]; uniform vec4 uTowB[64]; uniform float uTowWin, uTowEdge, uCityPulse, uTime;
uniform vec4 uRingC, uRingN; uniform vec3 uRingE1; uniform float uRing;
uniform vec3 uCloudOff;
uniform float uGridA, uFloorGrid, uFog, uTowFog;
uniform int uRivN; uniform vec4 uRiv[16]; uniform float uRivHead, uRivFlow, uStrokeLift, uTowHaze;
${PAL_KEYS.map((k) => `uniform vec3 ${k};`).join('\n')}
const int M_SKY = 0, M_FLOOR = 1, M_HILL = 2, M_TRUNK = 3, M_LEAF = 4, M_SKIN = 5, M_HAIR = 6, M_SWEATER = 7, M_PANTS = 8, M_SHOE = 9, M_CLAWD = 10, M_CLOUD = 11, M_TOWER = 12;
const vec3 DOME_C = ${g3(DOME.c)}; const float DOME_R = ${fx(DOME.R)};
const vec3 CLC[${CLOUDS.length}] = vec3[${CLOUDS.length}](${CLOUDS.map((c) => g3(c.c)).join(', ')});
const vec3 CLR[${CLOUDS.length}] = vec3[${CLOUDS.length}](${CLOUDS.map((c) => g3(c.rad)).join(', ')});
const int NCLOUD = ${CLOUDS.length};

float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float sdEll(vec3 q, vec3 r) { float k0 = length(q / r), k1 = length(q / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdCap(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float dot2(vec3 v) { return dot(v, v); }
float sdRC(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2;
  float x2 = dot2(pa * l2 - ba * y); float y2 = y * y * l2; float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float vnoise2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float hillS(vec2 q) {
  float h = 0.0;
  for (int i = 0; i < 4; i++) { vec2 d = (q - uHillA[i].yz) * uHillS[i].xy; h += uHillA[i].x * exp(-dot(d, d)); }
  return 0.5 * (h + sqrt(h * h + ${fx(HILL_EPS)}));
}
vec3 hillNormalS(vec2 q) {
  const float e = 0.01;
  return normalize(vec3(hillS(q - vec2(e, 0.0)) - hillS(q + vec2(e, 0.0)), 2.0 * e, hillS(q - vec2(0.0, e)) - hillS(q + vec2(0.0, e))));
}
float floorMix(vec2 q) { return smoothstep(0.075, 0.045, hillS(q)); }
vec3 toHuman(vec3 p) { vec3 d = p - uHPos; return vec3(dot(d, uHF), d.y, dot(d, uHR)); }
float PIXANG() { return (1920.0 / uRes.x) / uF; }
vec3 camRay(vec2 px) { return normalize(uCamFw + uCamR * (px.x - uPP.x) / uF + uCamU * (uPP.y - px.y) / uF); }
`;


// ---------------------------------------------------------------- revision 4: the painted valley
// S18's look for rung 4 (agent P's sets/valley): the land as low-poly facets under long directional
// strokes of saturated greens that follow its contours, low-poly trees and conifers, a clean
// violet-pink-peach sky with thin white streak clouds, a soft sun glow at the horizon, distant
// low-poly peach mountains, haze only toward the horizon. Compiled only into the LOOK variant.
export const LOOK_DECL = `
#if LOOK
uniform float uDrift, uHaze, uProps, uMtn;       // drift 0 = S18's valley .. 1 = the shelter's palette (S31)
uniform float uSalt;                             // (revision 8) 0 = grass .. 1 = a salt flat: pale crust, cracks, a sheen of sky
uniform vec3 uKey;                               // the land's key light: the sun raised so the paint reads
uniform vec3 P_MTL, P_MTS;                       // the mountains' two tones, lit and in shade
uniform vec3 P_KEY, P_AMB, P_FILL, P_BNC;        // the land's lights (valley.js LOOK_KEYS; night.js takes them down)
const int M_PLEAF = 13, M_PBARK = 14, M_PCONE = 15;
// low-poly trees about the valley, clear of the hill and of the shots' action: x, z, size, kind (0 round, 1 conifer)
const int NPROP = 10;
const vec4 PROPS[10] = vec4[10](
  vec4(-9.5, 15.0, 1.1, 1.0), vec4(-12.5, 19.0, 1.3, 1.0), vec4(-8.0, 22.5, 1.0, 1.0), vec4(14.5, 21.0, 1.2, 1.0), vec4(17.5, 16.0, 1.0, 1.0),
  vec4(-11.0, 11.5, 1.0, 0.0), vec4(-15.0, 16.5, 1.2, 0.0), vec4(-6.5, 27.0, 1.1, 0.0), vec4(16.5, 12.0, 1.0, 0.0), vec4(13.5, 28.0, 1.3, 0.0));
float sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h), k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float sg = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return sg * sqrt(min(dot(ca, ca), dot(cb, cb)));
}
float propSD(vec3 p, int i, out int m) {
  vec4 pr = PROPS[i];
  float sz = pr.z;
  vec3 q = p - vec3(pr.x, hillS(pr.xy), pr.y);
  if (pr.w < 0.5) {
    float dt = sdCap(q, vec3(0.0, -0.3, 0.0), vec3(0.0, 1.1 * sz, 0.0), 0.075 * sz);
    float dl = length(q - vec3(0.0, 1.42 * sz, 0.0)) - 0.56 * sz;
    m = dl < dt ? M_PLEAF : M_PBARK;
    return min(dl, dt);
  }
  float dt = sdCap(q, vec3(0.0, -0.3, 0.0), vec3(0.0, 0.5 * sz, 0.0), 0.075 * sz);
  float dc = sdCappedCone(q - vec3(0.0, 1.45 * sz, 0.0), 1.05 * sz, 0.6 * sz, 0.03 * sz);
  m = dc < dt ? M_PCONE : M_PBARK;
  return min(dc, dt);
}
#endif
`;

// ---------------------------------------------------------------- the ray-cast scene
export const SCENE_CAST = `
${sdfCode(HUMAN_PRIMS, 'sdHumanL')}
${sdfCodeD(HUMAN_PRIMS, 'sdHumanLD')}
float sdTreeL(vec3 q, out int mat, out int part) {
  float d = 1e9, di; mat = M_TRUNK; part = 11;
  for (int i = 0; i < 4; i++) {
    if (uTrA[i].w <= 0.0) continue;
    di = sdRC(q, uTrA[i].xyz, uTrB[i].xyz, uTrA[i].w, uTrB[i].w);
    if (di < d) { mat = M_TRUNK; part = 11; }
    d = smin(d, di, i == 0 ? 0.05 : 0.06);
  }
  for (int i = 0; i < 11; i++) {
    if (uCan[i].w <= 0.0) continue;
    di = length(q - uCan[i].xyz) - uCan[i].w;
    if (di < d) { mat = M_LEAF; part = 12; }
    d = smin(d, di, uCanK);
  }
  return d;
}
float sdTreeLD(vec3 q) { int m, pt; return sdTreeL(q, m, pt); }
float leaf(vec3 q) { return ((vnoise(q * 3.4) - 0.5) * 0.12 + (vnoise(q * 8.1) - 0.5) * 0.05) * uLeafAmp; }

float mapIds(vec3 p, out int mat, out int part) {
  float d = (p.y - hillS(p.xz)) * 0.72; mat = M_HILL; part = 20;
  if (uHumanOn > 0.5) {
    float bh = length(p - uHB.xyz) - uHB.w;
    if (bh < d) { int m, pt; float dh = sdHumanL(toHuman(p), m, pt); if (dh < d) { d = dh; mat = m; part = pt; } }
  }
  if (uTreeOn > 0.5) {
    float bt = length(p - uTB.xyz) - uTB.w;
    if (bt < d) { int m, pt; vec3 q = p - uTPos; float dt = sdTreeL(q, m, pt); if (m == M_LEAF) dt += leaf(q); dt *= 0.8; if (dt < d) { d = dt; mat = m; part = pt; } }
  }
#if LOOK
  if (uProps > 0.5) for (int i = 0; i < NPROP; i++) {
    vec4 pr = PROPS[i];
    if (length(p - vec3(pr.x, 1.2 * pr.z, pr.y)) - 1.6 * pr.z > d) continue;
    int mp; float dp = propSD(p, i, mp);
    if (dp < d) { d = dp; mat = mp; part = 30 + i; }
  }
#endif
  return d;
}
float mapD(vec3 p) {
  float d = (p.y - hillS(p.xz)) * 0.72;
  if (uHumanOn > 0.5) { float bh = length(p - uHB.xyz) - uHB.w; d = min(d, bh < d ? sdHumanLD(toHuman(p)) : bh + 0.01); }
  if (uTreeOn > 0.5) { float bt = length(p - uTB.xyz) - uTB.w; d = min(d, bt < d ? sdTreeLD(p - uTPos) * 0.85 : bt + 0.01); }
#if LOOK
  if (uProps > 0.5) for (int i = 0; i < NPROP; i++) {
    vec4 pr = PROPS[i];
    float bd = length(p - vec3(pr.x, 1.2 * pr.z, pr.y)) - 1.6 * pr.z;
    if (bd > d) continue;
    int mp; d = min(d, propSD(p, i, mp));
  }
#endif
  return d;
}
vec3 sdfNormal(vec3 p) {
  const vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * mapD(p + e.xyy) + e.yyx * mapD(p + e.yyx) + e.yxy * mapD(p + e.yxy) + e.xxx * mapD(p + e.xxx));
}

// Towers: tapered octagonal prisms with pointed caps, cut from planes n.x <= d.
#define CLIP(NN, DD) { vec3 _n = NN; float _den = dot(_n, rd), _dist = (DD) - dot(_n, o); if (abs(_den) < 1e-7) { if (_dist < 0.0) return 1e9; } else { float _t = _dist / _den; if (_den < 0.0) { if (_t > t0) { t0 = _t; n0 = _n; } } else t1 = min(t1, _t); } if (t0 > t1) return 1e9; }
float iTower(vec3 ro, vec3 rd, int i, float tmax, out vec3 nOut) {
  vec4 A = uTowA[i], B = uTowB[i];
  float h = A.w;
  nOut = vec3(0.0, 1.0, 0.0);
  if (h <= 0.02) return 1e9;
  vec3 o = ro - vec3(A.x, 0.0, A.y);
  float w0 = A.z, wt = A.z * (1.0 - B.x), capH = B.y, rot = B.z;
  vec2 od = o.xz, dd = rd.xz;
  float qa = dot(dd, dd), qb = dot(od, dd), qc = dot(od, od) - w0 * w0 * 1.1;
  if (qb * qb - qa * qc < 0.0) return 1e9;
  float t0 = 0.0, t1 = tmax; vec3 n0 = vec3(0.0, 1.0, 0.0);
  float s = (w0 - wt) / h;
  CLIP(vec3(0.0, -1.0, 0.0), 1.0)
  for (int k = 0; k < 8; k++) {
    float th = rot + float(k) * 0.7853982;
    vec2 cs = vec2(cos(th), sin(th));
    CLIP(vec3(cs.x, s, cs.y), w0)
    if (capH > 0.01) { float m = wt / capH; CLIP(vec3(cs.x, m, cs.y), wt + m * h) }
  }
  if (capH <= 0.01) CLIP(vec3(0.0, 1.0, 0.0), h)
  if (t0 <= 0.0) return 1e9;
  nOut = normalize(n0);
  return t0;
}
float castTowers(vec3 ro, vec3 rd, float tmax, out vec3 n, out int idx) {
  float tb = tmax; idx = -1; n = vec3(0.0, 1.0, 0.0);
  for (int i = 0; i < 64; i++) {
    if (i >= uNTow) break;
    vec3 ni; float t = iTower(ro, rd, i, tb, ni);
    if (t < tb) { tb = t; n = ni; idx = i; }
  }
  return idx >= 0 ? tb : 1e9;
}

float iEll(vec3 ro, vec3 rd, vec3 c, vec3 r, out vec3 n) {
  vec3 oc = (ro - c) / r, rr = rd / r;
  float a = dot(rr, rr), b = dot(oc, rr), cc = dot(oc, oc) - 1.0;
  float h = b * b - a * cc; if (h < 0.0) return -1.0;
  float t = (-b - sqrt(h)) / a;
  n = normalize((oc + rr * t) / r);
  return t;
}
float cloudsE(vec3 ro, vec3 rd, out vec3 nOut, out int idOut) {
  float tb = 1e9; vec3 n; nOut = vec3(0.0, -1.0, 0.0); idOut = 0;
#if LOOK
  return tb;                                   // the look's sky has streak clouds instead
#endif
  for (int i = 0; i < NCLOUD; i++) {
    float t = iEll(ro, rd, CLC[i] + uCloudOff, CLR[i], n);
    if (t > 0.0 && t < tb) { tb = t; nOut = n; idOut = i; }
  }
  return tb;
}

struct Hit { float t; int mat; int part; vec3 p; vec3 n; };
Hit castScene(vec3 ro, vec3 rd) {
  Hit h; h.t = 1e9; h.mat = M_SKY; h.part = 0; h.n = vec3(0.0); h.p = ro + rd * 1e4;
  vec3 nT; int iT; float tTow = castTowers(ro, rd, 1e4, nT, iT);
  float t = 0.05; bool hit = false; int m = 0, pt = 0;
  for (int i = 0; i < 300; i++) {
    vec3 p = ro + rd * t;
    if ((p.y > uMaxH && rd.y > 0.0) || t > 60.0 || t > tTow) break;
    float d = mapIds(p, m, pt);
    if (d < 0.0003 * t) { hit = true; break; }
    t += d;
  }
  if (hit && t < tTow) {
    h.t = t; h.mat = m; h.part = pt; h.p = ro + rd * t;
    h.n = m == M_HILL ? hillNormalS(h.p.xz) : sdfNormal(h.p);
    return h;
  }
  float tF = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  if (tTow < 1e8 && tTow < tF) { h.t = tTow; h.mat = M_TOWER; h.part = iT; h.p = ro + rd * tTow; h.n = nT; return h; }
  if (tF < 1e8) { h.t = tF; h.mat = M_FLOOR; h.part = 21; h.p = ro + rd * tF; h.n = vec3(0.0, 1.0, 0.0); return h; }
  vec3 nc; int ci; float tc = cloudsE(ro, rd, nc, ci);
  if (tc < 1e8) { h.t = tc; h.mat = M_CLOUD; h.part = 40 + ci; h.p = ro + rd * tc; h.n = nc; }
  return h;
}

float softShadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.02;
  for (int i = 0; i < 90; i++) {
    vec3 p = ro + rd * t;
    if (p.y > uMaxH || t > 45.0) break;
    float h = mapD(p);
    res = min(res, 12.0 * h / t);
    t += clamp(h, 0.012, 0.4);
    if (res < 0.002) break;
  }
  return clamp(res, 0.0, 1.0);
}
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 5; i++) { float h = 0.015 + 0.1 * float(i) / 4.0; float d = mapD(p + h * n); occ += (h - d) * sca; sca *= 0.9; }
  float big = 0.0; sca = 1.0;
  for (int i = 0; i < 4; i++) { float h = 0.25 + 0.5 * float(i); float d = mapD(p + h * n); big += max(h - d, 0.0) * sca / h; sca *= 0.8; }
  return clamp(1.0 - 2.4 * occ, 0.0, 1.0) * clamp(1.0 - 0.3 * big, 0.0, 1.0);
}

// ---------------------------------------------------------------- sky
vec3 skyBase(vec3 rd) {
  float e = max(rd.y, 0.0);
  vec3 c = mix(P_HOR, P_LOW, smoothstep(0.0, 0.08, e));
  c = mix(c, P_MID, smoothstep(0.05, 0.24, e));
  c = mix(c, P_UP, smoothstep(0.2, 0.45, e));
  c = mix(c, P_ZEN, smoothstep(0.4, 0.85, e));
  vec2 hz = normalize(rd.xz + 1e-5), hs = normalize(uSun.xz);
  float az = max(dot(hz, hs), 0.0);
  float band = pow(az, 5.0) * exp(-e * 5.0);
  c = mix(c, P_GLOW, clamp(band * 0.75, 0.0, 1.0));
  return c;
}
vec3 sunHalo(vec3 rd) {
  float d = 1.0 - dot(rd, uSun);
  return P_SUNC * (0.55 * exp(-d * 1400.0) + 0.3 * exp(-d * 180.0) + 0.14 * exp(-d * 22.0));
}
float sunDisc(vec3 rd) {
  float ang = acos(clamp(dot(rd, uSun), -1.0, 1.0));
  float r = 26.0 / 1400.0;
  return 1.0 - smoothstep(r - PIXANG(), r + PIXANG(), ang);
}
float domeLines(vec3 rd, out float el, out float mer) {
  vec3 oc = uCamPos - DOME_C; float b = dot(oc, rd); float c = dot(oc, oc) - DOME_R * DOME_R;
  float t = -b + sqrt(max(b * b - c, 0.0));
  vec3 q = (uCamPos + rd * t - DOME_C) / DOME_R;
  float az = atan(q.x, q.z); el = asin(clamp(q.y, -1.0, 1.0));
  float stp = radians(10.0);
  float pa = PIXANG() * t / DOME_R;
  float da = abs(fract(az / stp + 0.5) - 0.5) * stp * cos(el);
  float de = abs(fract(el / stp + 0.5) - 0.5) * stp;
  float la = 1.0 - smoothstep(0.35, 1.25, da / pa);
  float le = 1.0 - smoothstep(0.35, 1.25, de / pa);
  mer = la * smoothstep(0.004, 0.03, el);
  return max(la, le) * smoothstep(0.004, 0.03, el);
}
// The ring: a flat annulus far out, seen as a thin arch of light across the sky.
vec3 ringLight(vec3 rd, out float cover) {
  cover = 0.0;
  if (uRing <= 0.0) return vec3(0.0);
  vec3 n = uRingN.xyz; float den = dot(rd, n);
  if (abs(den) < 1e-5) return vec3(0.0);
  float t = dot(uRingC.xyz - uCamPos, n) / den;
  if (t <= 0.0) return vec3(0.0);
  vec3 q = uCamPos + rd * t - uRingC.xyz;
  float r = length(q) - uRingC.w, hw = uRingN.w;
  float pw = PIXANG() * t / max(abs(den), 0.06);
  cover = smoothstep(hw + pw, hw - pw, abs(r));
  float edge = exp(-pow((abs(r) - hw) / (pw * 1.3), 2.0));
  float mid = exp(-pow(r / (pw * 1.1), 2.0));
  vec3 e2 = cross(n, uRingE1);
  float ang = atan(dot(q, e2), dot(q, uRingE1));
  float stp = radians(1.6);
  float node = exp(-pow(abs(fract(ang / stp + 0.5) - 0.5) * stp * uRingC.w / (pw * 1.8), 2.0)) * mid;
  float fade = smoothstep(-0.02, 0.06, rd.y);
  return P_RING * uRing * fade * (cover * 0.12 + edge * 0.55 + mid * 0.35 + node * 1.2);
}
vec3 tonemapHP(vec3 c) {
  float m = max(max(c.r, c.g), c.b);
  if (m > 0.72) { float mm = 0.72 + 0.28 * (1.0 - exp(-(m - 0.72) / 0.28)); c *= mm / m; }
  float w = smoothstep(1.2, 4.0, m);
  return mix(c, vec3(max(max(c.r, c.g), c.b)), w * 0.5);
}
`;

// ---------------------------------------------------------------- lit forward render (rungs 4, 5)
export const LIT_FS = (opt) => `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
#define PAINTTEX ${opt.paintTex ? 1 : 0}
#define LOOK ${opt.look ? 1 : 0}
${SCENE_DECL}
${LOOK_DECL}
${SCENE_CAST}
${CLIT_GLSL}
layout(location = 0) out vec4 oCol;
layout(location = 1) out vec4 oAux;
vec3 albedo(int mat) {
  if (mat == M_HILL) return A_HILL; if (mat == M_FLOOR) return A_FLOOR; if (mat == M_TRUNK) return A_TRUNK;
  if (mat == M_LEAF) return A_LEAF; if (mat == M_SKIN) return A_SKIN; if (mat == M_HAIR) return A_HAIR;
  if (mat == M_SWEATER) return A_SWEATER; if (mat == M_PANTS) return A_PANTS; if (mat == M_SHOE) return A_SHOE;
  if (mat == M_TOWER) return A_TOWER;
  return A_CLAWD;
}
vec3 aura(vec3 rd, float tmax) {
  vec3 oc = uCGlow.xyz - uCamPos; float tc = dot(oc, rd);
  float d2 = max(dot(oc, oc) - tc * tc, 0.0);
  float behind = smoothstep(0.15, 0.6, tmax - tc) * step(0.0, tc);
  float s = uAuraS;
  return vec3(1.0, 0.78, 0.58) * uAuraK * uCGlow.w * (exp(-d2 / (s * s)) + 0.4 * exp(-d2 / (6.0 * s * s))) * behind;
}
#if LOOK
// the sky: a clean gradient, the sun's soft glow on the horizon, thin white streak clouds, the dome's
// lattice faint, and two ranges of low-poly peach mountains standing on the horizon
vec3 valleyGrad(vec3 rd) {
  float e = degrees(asin(clamp(rd.y, 0.0, 1.0)));
  vec3 c = mix(P_HOR, P_LOW, smoothstep(0.0, 4.0, e));
  c = mix(c, P_MID, smoothstep(3.0, 15.0, e));
  c = mix(c, P_UP, smoothstep(12.0, 32.0, e));
  c = mix(c, P_ZEN, smoothstep(28.0, 72.0, e));
  vec2 hz = normalize(rd.xz + 1e-5), hs = normalize(uSun.xz);
  float az = max(dot(hz, hs), 0.0);
  c += P_GLOW * pow(az, 6.0) * exp(-e / 7.0) * 0.5;
  float cs = max(dot(rd, uSun), 0.0);
  c += P_SUNC * (0.2 * pow(cs, 10.0) + 0.45 * pow(cs, 80.0) + 0.9 * pow(cs, 900.0));
  return c;
}
vec3 valleyHaze(vec3 rd) { return valleyGrad(normalize(vec3(rd.x, 0.018, rd.z))) * vec3(0.96, 0.95, 0.98); }
float streakClouds(vec3 rd, float e) {
  float az = degrees(atan(rd.x, rd.z));
  float w = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float rowH = 5.0 + 1.6 * fk;
    float v = (e + 1.8 * sin(radians(az) * 2.0 + fk * 1.3) + fk * 1.7) / rowH;
    float row = floor(v), fv = v - row;
    float rs = hash12(vec2(row, fk * 7.0 + 1.0));
    float Lw = mix(12.0, 34.0, hash12(vec2(row, fk + 3.0)));
    float u = (az + uTime * (0.2 + 0.1 * fk) + rs * 300.0) / Lw;
    float seg = floor(u), fu = u - seg;
    float hs = hash12(vec2(row * 3.1 + seg, fk + 0.5));
    float on = step(0.5, rs) * step(0.58, hs);
    float thick = mix(0.035, 0.1, hash12(vec2(seg, row + 5.0)));
    float cy = 0.3 + 0.4 * hash12(vec2(seg + 2.0, row));
    float lens = max(1.0 - abs(fu - 0.5) * 2.0, 0.0);
    float across = abs(fv - cy) / (thick * (0.25 + 0.75 * lens));
    float body = 1.0 - smoothstep(0.25, 1.0, across);
    float dry = 0.5 + 0.5 * vnoise2(vec2(u * 26.0, fv * 18.0 + hs * 17.0));
    w = max(w, on * body * dry * smoothstep(0.0, 0.25, lens) * (0.55 + 0.45 * hs));
  }
  return w * smoothstep(4.0, 10.0, e) * (1.0 - smoothstep(58.0, 84.0, e));
}
// one peak: a triangle of the horizon (azimuth centre, height, half width in degrees)
const int NPK = 11;
const vec4 PEAKS[11] = vec4[11](
  vec4(-64.0, 5.4, 18.0, 1.0), vec4(-40.0, 7.2, 22.0, 1.0), vec4(-14.0, 5.0, 16.0, 1.0), vec4(5.0, 7.6, 17.0, 1.0),
  vec4(37.0, 8.0, 19.0, 1.0), vec4(63.0, 5.6, 17.0, 1.0),
  vec4(-52.0, 3.0, 11.0, 0.0), vec4(-27.0, 3.8, 13.0, 0.0), vec4(-4.0, 2.4, 10.0, 0.0), vec4(44.0, 3.6, 12.0, 0.0), vec4(72.0, 3.8, 12.0, 0.0));
vec3 mountainsOver(vec3 c, vec3 rd, float el) {
  if (el > 9.0 || uMtn <= 0.0) return c;
  float az = degrees(atan(rd.x, rd.z)), sunAz = degrees(atan(uSun.x, uSun.z));
  vec3 hz = valleyHaze(rd);
  for (int r = 1; r >= 0; r--) {             // the far range, then the near one over it
    float best = -1.0; vec4 pk = vec4(0.0);
    for (int i = 0; i < NPK; i++) {
      vec4 q = PEAKS[i];
      if (int(q.w) != r) continue;
      float hp = q.y * uMtn * (1.0 - abs(az - q.x) / q.z);
      if (hp > best) { best = hp; pk = q; }
    }
    if (best <= 0.0 || el > best) continue;
    // facets: each side of the peak is split by a line from the apex to its foot; the sun's side lit
    float sd = az - pk.x, side = sign(sd);
    float toSun = sign(sunAz - pk.x);
    float fx = abs(sd) / pk.z, fy = el / (pk.y * uMtn);
    float inner = step(fy, 1.0 - fx / 0.45);
    float k = side == toSun ? 1.0 : 0.0;
    vec3 f = mix(P_MTS, P_MTL, k) * (inner > 0.5 ? (k > 0.5 ? 1.1 : 0.9) : 1.0);
    // painted grain along the contours (the valley's mountains are brushed the same way as the land)
    float cv = el * 3.2 + 1.3 * vnoise2(vec2(sd * 0.09, pk.x)) + 0.5 * vnoise2(vec2(sd * 0.35, el * 0.7 + pk.x));
    float band = floor(cv), bf = cv - band;
    float bk = hash12(vec2(band, pk.x + side));
    f *= 0.9 + 0.2 * bk + 0.05 * (vnoise2(vec2(sd * 1.3, cv * 6.0)) - 0.5);
    float haze = mix(0.04, 0.3, float(r)) + 0.7 * exp(-el / 1.1);
    c = mix(f, hz, clamp(haze + 0.3 * uDrift, 0.0, 0.92));
  }
  return c;
}
vec3 valleySky(vec3 rd) {
  float el = degrees(asin(clamp(rd.y, -1.0, 1.0)));
  float e = max(el, 0.0);
  vec3 c = valleyGrad(rd);
  float w = streakClouds(rd, e);
  float cs = max(dot(rd, uSun), 0.0);
  // (the clouds follow the palette: near white at dusk, a little lighter than the sky at night)
  vec3 cc = P_HOR * 1.08 + (vec3(1.0, 0.94, 0.97) - P_HOR) * 0.55 * smoothstep(0.1, 0.6, dot(P_HOR, vec3(0.2126, 0.7152, 0.0722)));
  cc = mix(cc, P_SUNC * 0.85, 0.3 * pow(cs, 3.0) * smoothstep(0.1, 0.6, dot(P_HOR, vec3(0.2126, 0.7152, 0.0722))));
  c = mix(c, cc * (0.9 + 0.1 * smoothstep(5.0, 40.0, e)), w * 0.6);
  float gel, gmer; float g = domeLines(rd, gel, gmer);
  c = mix(c, c * 1.1 + A_GRID * 0.015, g * uGridA * 0.45);
  float rcov; vec3 ring = ringLight(rd, rcov);
  c = mix(c, c * 0.93 + P_RING * 0.05, rcov * uRing * 0.6) + ring;
  return mountainsOver(c, rd, el);
}
#endif
vec3 horizonFog(vec3 rd) {
#if LOOK
  return valleyHaze(rd);
#else
  return skyBase(normalize(vec3(rd.x, 0.015, rd.z)));
#endif
}
vec3 skyColor(vec3 rd) {
#if LOOK
  return valleySky(rd);
#endif
  vec3 c = skyBase(rd) + sunHalo(rd);
  float el, mer; float g = domeLines(rd, el, mer);
  float glowMask = 1.0 - 0.8 * exp(-(1.0 - dot(rd, uSun)) * 30.0);
  c = mix(c, c * 1.18 + A_GRID * 0.03, g * uGridA * glowMask);
  float rc; vec3 ring = ringLight(rd, rc);
  c = mix(c, c * 0.93 + P_RING * 0.05, rc * uRing * 0.6) + ring;
  c = mix(c, P_DISC, sunDisc(rd));
  return c;
}
// window lights and edge light on a tower hit
vec3 towerGlow(int i, vec3 p, vec3 n, float t) {
  vec4 A = uTowA[i], B = uTowB[i];
  vec3 lp = p - vec3(A.x, 0.0, A.y);
  float h = A.w, w0 = A.z, wt = A.z * (1.0 - B.x);
  float y = lp.y;
  float wy = mix(w0, wt, clamp(y / h, 0.0, 1.0));
  float ang = atan(lp.z, lp.x) - B.z;
  float k = floor(ang / 0.7853982 + 0.5);
  float th = B.z + k * 0.7853982;
  vec2 tg = vec2(-sin(th), cos(th));
  float faceW = 0.8284 * wy;
  float u = dot(lp.xz, tg) / max(faceW, 1e-3);           // -0.5..0.5 across the face
  float pw = PIXANG() * t;
  float side = step(n.y, 0.5) * step(y, h - 0.2) * step(0.6, y);
  // windows: floors of 0.85 m, two columns per face
  float fy = y / 0.85, fu = (u + 0.5) * 2.0;
  float wyv = smoothstep(0.28, 0.28 + pw / 0.85 + 0.02, fract(fy)) * smoothstep(0.78, 0.78 - pw / 0.85 - 0.02, fract(fy));
  float wuv = smoothstep(0.18, 0.18 + pw / faceW * 2.0 + 0.02, fract(fu)) * smoothstep(0.82, 0.82 - pw / faceW * 2.0 - 0.02, fract(fu));
  float cell = hash13(vec3(floor(fy), k * 3.0 + floor(fu), float(i) * 7.13));
  float lit = step(cell, B.w) * (0.55 + 0.45 * hash13(vec3(floor(fy) * 1.3, floor(fu) + k, float(i) + 3.1)));
  // kicks ripple through the city: each tower answers a little later than the last
  float pulse = uCityPulse * (0.7 + 0.3 * sin(float(i) * 2.3));
  vec3 win = P_WIN * uTowWin * wyv * wuv * lit * side * (1.0 + 0.9 * pulse);
  // edge light: the vertical corners and a band every six floors
  float edge = smoothstep(0.5 - (pw * 1.6) / max(faceW, 1e-3), 0.5, abs(u)) * side;
  float band = exp(-pow((fract(y / 5.1 + 0.5) - 0.5) * 5.1 / (pw * 1.2 + 0.01), 2.0)) * side;
  float capEdge = (1.0 - side) * step(0.6, y) * smoothstep(0.5 - (pw * 1.6) / max(faceW, 1e-3), 0.5, abs(u));
  vec3 lines = P_RING * uTowEdge * (edge + 0.5 * band + capEdge) * (1.0 + 0.5 * pulse);
  // a beacon at the tip
  vec3 tip = vec3(0.0, h + B.y, 0.0);
  float bd = length(lp - tip);
  vec3 beacon = P_WIN * uTowEdge * 2.0 * exp(-bd * bd / (0.06 + pw * pw * 4.0)) * (1.0 + pulse);
  return win + lines + beacon;
}
// fork option: the river. Painted water on the land along a polyline (uRiv: x, z, half width,
// arc length), filled up to arc length uRivHead with a rounded, tapering front; ripples scroll
// downstream with uRivFlow. Reflects the sky, glints toward the sun, warms near Clawd.
vec3 riverShade(vec3 c, vec3 p, vec3 rd, float t) {
  vec2 q = p.xz;
  float best = 1e9, sA = 0.0, acr = 0.0, hw = 0.3; vec2 tg = vec2(1.0, 0.0);
  for (int i = 0; i < 15; i++) {
    if (i + 1 >= uRivN) break;
    vec4 A = uRiv[i], B = uRiv[i + 1];
    vec2 ab = B.xy - A.xy; float L2 = max(dot(ab, ab), 1e-6);
    float k = clamp(dot(q - A.xy, ab) / L2, 0.0, 1.0);
    vec2 cp = A.xy + ab * k; float d = length(q - cp);
    if (d < best) { best = d; sA = mix(A.w, B.w, k); hw = mix(A.z, B.z, k); tg = ab / sqrt(L2); acr = dot(q - cp, vec2(-tg.y, tg.x)); }
  }
  float ahead = uRivHead - sA;                                   // metres behind the front
  // a narrow tongue at the front, widening to the full width behind it (further for a broad river)
  float hwE = (hw + 0.08 * (vnoise2(q * 1.9) - 0.5)) * smoothstep(-0.25, 1.4 + 0.8 * hw, ahead);
  float pa = PIXANG() * t;
  // (the second factor: beyond the front hwE is 0, and the centre line must not show as a hairline)
  float cov = smoothstep(-pa, pa, hwE - best) * smoothstep(0.0, 0.03, hwE);
  if (cov <= 0.0) return c;
  vec2 rq = vec2(sA - uRivFlow * 0.6, acr);
  float r1 = vnoise2(rq * vec2(2.4, 4.5)), r2 = vnoise2(rq * vec2(6.0, 10.0) + 7.3);
  vec3 T3 = vec3(tg.x, 0.0, tg.y), N3 = vec3(-tg.y, 0.0, tg.x);
  vec3 wn = normalize(vec3(0.0, 1.0, 0.0) + T3 * (r1 - 0.5) * 0.3 + N3 * (r2 - 0.5) * 0.22);
  // it mirrors the sky a little above the horizon (bluer than the glow at the horizon itself), over
  // a deep blue body, so from a low camera it reads as water, not a pale sheet
  vec3 rf = reflect(rd, wn); rf.y = max(abs(rf.y), 0.25); rf = normalize(rf);
  float fr = 0.1 + 0.6 * pow(1.0 - clamp(dot(-rd, wn), 0.0, 1.0), 4.0);
  vec3 body = vec3(0.045, 0.11, 0.22) * (0.8 + 0.4 * r1);
  vec3 wc = mix(body, skyBase(rf) + sunHalo(rf) * 0.7, fr);
  wc += P_SUNL * 0.5 * pow(max(dot(rf, uSun), 0.0), 80.0);
  vec3 lc = uCGlow.xyz - p; float dl = length(lc);
  wc += P_CLAWDL * uCGlow.w * 0.12 / (1.0 + dl * dl * 1.5);
  float front = exp(-ahead * ahead / 0.12) * smoothstep(-0.3, 0.0, ahead);
  float bx = (hwE - best) / max(0.05, 2.0 * pa);
  float bank = exp(-bx * bx);                                    // (no pow() of a negative base)
  wc = mix(wc, wc * 1.25 + vec3(0.10, 0.09, 0.07), clamp(front * 0.8 + bank * 0.35, 0.0, 1.0));
  return mix(c, wc, cov);
}
#if LOOK
const vec3 FILLD = vec3(-0.3015, 0.3015, -0.9045);
// the greens: S18's pigments by index (0 yellow-green, 1 teal, 2 green, 3 olive, 4 deep teal),
// drifting toward the shelter's softer teal greens
vec3 greenIdx(int i) {
  vec3 g = i == 0 ? vec3(0.56, 0.68, 0.22) : i == 1 ? vec3(0.17, 0.46, 0.33) : i == 2 ? vec3(0.38, 0.59, 0.21)
         : i == 3 ? vec3(0.49, 0.56, 0.18) : vec3(0.12, 0.36, 0.27);
  vec3 t = i == 0 ? vec3(0.40, 0.62, 0.40) : i == 1 ? vec3(0.16, 0.43, 0.40) : i == 2 ? vec3(0.28, 0.54, 0.40)
         : i == 3 ? vec3(0.34, 0.52, 0.38) : vec3(0.12, 0.33, 0.33);
  return pow(mix(g, t, uDrift), vec3(2.2));
}
vec3 greenOf(float hs) { return greenIdx(int(floor(fract(hs * 5.37) * 5.0))) * (0.9 + 0.2 * fract(hs * 13.7)); }
// low-poly facets under the paint: a triangulated height grid, its vertices jittered in height
float facetH(vec2 v) { return hillS(v) + 0.12 * (hash12(v * 0.731 + 17.3) - 0.5); }
vec3 facetN(vec2 q0, float cell) {
  // (the grid turned 31 degrees off the axes, so no long diagonals line up with the view)
  const vec2 RX = vec2(0.8572, 0.5150), RZ = vec2(-0.5150, 0.8572);
  vec2 q = vec2(dot(q0, RX), dot(q0, RZ));
  vec2 g = q / cell, i = floor(g), f = g - i;
  vec2 b = f.x > f.y ? vec2(1.0, 0.0) : vec2(1.0), cc = f.x > f.y ? vec2(1.0) : vec2(0.0, 1.0);
  vec2 A = i * cell, B = (i + b) * cell, C = (i + cc) * cell;
  // back to world xz (the inverse turn) for the heights
  vec2 Aw = A.x * RX + A.y * RZ, Bw = B.x * RX + B.y * RZ, Cw = C.x * RX + C.y * RZ;
  vec3 A3 = vec3(Aw.x, facetH(Aw), Aw.y), B3 = vec3(Bw.x, facetH(Bw), Bw.y), C3 = vec3(Cw.x, facetH(Cw), Cw.y);
  vec3 n = normalize(cross(B3 - A3, C3 - A3));
  return n.y < 0.0 ? -n : n;
}
// one row of paint: patches two to five rows wide, stepping through the greens so neighbours
// differ (warm, cool, warm...), with thin strips of a contrasting green between some of them;
// along the row the stroke changes green every few metres
vec3 rowColor(float row, float s, float fr) {
  float pw = 1.0 + floor(5.0 * hash12(vec2(floor(row / 6.0), 8.8)));
  float pid = floor(row / pw) + 17.0 * pw;
  int idx = int(floor(fract(pid * 0.618 + 0.13) * 5.0));
  if (hash12(vec2(row, 4.1)) < 0.18) idx = (idx + 2) % 5;
  // along the row the brush runs out and a new stroke starts: its end is slanted across the row and
  // ragged, like a stroke's tail, never a straight cut
  float segL = mix(5.0, 14.0, hash12(vec2(row, 1.9)));
  float su = s + 60.0 * hash12(vec2(row, 6.6)) + segL * (0.55 * (fr - 0.5) + 0.12 * (vnoise2(vec2(fr * 5.0, s * 0.9 + row)) - 0.5));
  float seg = floor(su / segL);
  if (hash12(vec2(row, seg + 0.5)) > 0.75) idx = (idx + 3) % 5;
  return greenIdx(idx) * (0.92 + 0.16 * hash12(vec2(pid, seg)));
}
// the land's paint: flat fields of green with crisp, ragged edges that follow the contours on the hill
// and run across the valley on the flat (no screen derivatives: the pixel's footprint comes from the
// slope, the distance and the view)
vec3 landPaint(vec3 p, vec3 ns, vec3 rd, float t) {
  vec2 q = p.xz;
  float h = hillS(q);
  float s = q.x + 0.22 * q.y;
  float w1 = vnoise2(q * 0.06 + 3.0), w2 = vnoise2(q * 0.19 + 11.0), w3 = vnoise2(vec2(s * 0.16, q.y * 0.11 + 5.0));
  float bc = h * 3.2 + q.y * 0.3 + q.x * 0.045 + 2.3 * (w1 - 0.5) + 0.7 * (w2 - 0.5) + 1.5 * (w3 - 0.5);
  const float BW = 0.3;
  vec2 gh = -ns.xz / max(ns.y, 0.2);
  float fw = length(gh * 3.2 + vec2(0.0, 0.3)) / BW * PIXANG() * t / max(abs(dot(ns, rd)), 0.04);
  // dry-brush: the boundaries wander along the stroke at two scales
  float bv0 = bc / BW;
  bv0 += 0.8 * sin(bv0 * 0.61 + 2.0 * w1);           // rows of uneven widths
  float wob = 0.2 * (vnoise2(vec2(s * 1.7, bv0 * 0.9)) - 0.5) + 0.09 * (vnoise2(vec2(s * 6.5, bv0 * 2.3 + 4.0)) - 0.5);
  float bv = bv0 + wob, row = floor(bv), fr = bv - row;
  vec3 cA = rowColor(row, s, fr);
  vec3 cB = rowColor(fr < 0.5 ? row - 1.0 : row + 1.0, s, fr < 0.5 ? 1.0 : 0.0);
  float dE = min(fr, 1.0 - fr);
  vec3 c = mix(cB, cA, clamp(0.5 + dE / max(fw, 1e-4), 0.0, 1.0));
  // a faint grain along the stroke
  float fine = 1.0 - smoothstep(0.05, 0.2, fw);
  c *= 1.0 + 0.07 * (vnoise2(vec2(s * 0.8, bv * 9.0)) - 0.5) * fine;
  // far away the rows merge into their mean colour (no shimmer)
  vec3 mean = (greenIdx(0) * 1.4 + greenIdx(1) + greenIdx(2) * 1.2 + greenIdx(3) + greenIdx(4) * 0.6) / 5.2;
  if (uSalt > 0.0) {
    // (revision 8) a salt flat: the same brush rows in pale crust tones, the greens' values kept as
    // the rows' light and dark, with the crust's polygon cracks drawn in fine darker lines
    float lr = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)) / 0.26, 0.0, 1.4);
    vec3 salt = pow(mix(vec3(0.60, 0.61, 0.70), vec3(0.90, 0.89, 0.93), clamp(lr * 0.8, 0.0, 1.0)), vec3(2.2));
    vec2 g = q / 1.6, gi = floor(g);
    float d1 = 9.0, d2 = 9.0;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 cc = gi + vec2(float(i), float(j));
      vec2 o = cc + 0.15 + 0.7 * vec2(hash12(cc * 1.37 + 3.1), hash12(cc * 2.11 + 7.7));
      float d = length(g - o);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    float fwc = PIXANG() * t / 1.6 / max(abs(dot(ns, rd)), 0.04);
    float crack = (1.0 - smoothstep(0.02, 0.02 + 1.5 * fwc, d2 - d1)) * (1.0 - smoothstep(0.08, 0.3, fwc));
    salt *= 1.0 - 0.3 * crack;
    vec3 saltMean = pow(vec3(0.76, 0.76, 0.82), vec3(2.2));
    c = mix(c, salt, uSalt);
    mean = mix(mean, saltMean, uSalt);
  }
  return mix(c, mean, smoothstep(0.35, 0.9, fw));
}
vec3 lightV(vec3 alb, vec3 n, vec3 p, float sh, float ao) {
  float dif = max(dot(n, uKey), 0.0) * mix(0.2, 1.0, sh);
  vec3 c = alb * (P_KEY * dif + P_AMB * (0.55 + 0.45 * n.y) * ao
                 + P_BNC * clamp(0.5 - 0.5 * n.y, 0.0, 1.0) * ao + P_FILL * max(dot(n, FILLD), 0.0) * ao);
  vec3 gdir = normalize(vec3(uSun.x, 0.1, uSun.z));
  c += alb * P_GLOWL * pow(max(dot(n, gdir), 0.0), 3.0) * 0.35;
  vec3 lc = uCGlow.xyz - p; float dl = length(lc);
  c += alb * P_CLAWDL * uCGlow.w * max(dot(n, lc / dl) * 0.8 + 0.2, 0.0) / (1.0 + dl * dl * 2.5) * (0.4 + 0.6 * ao);
  return c;
}
float valleyFog(float t) { return 1.0 - exp(-max(t - 24.0, 0.0) * 0.013 * uHaze); }
vec3 landShade(Hit h, vec3 rd) {
  vec3 p = h.p; float t = h.t;
  vec3 ns = h.mat == M_FLOOR ? vec3(0.0, 1.0, 0.0) : h.n;
  // (revision 11) the facets only where they show (t < 75 m): a ray a hair below level meets the floor
  // at 1e7 m or more, where facetN's triangle degenerates in float and normalize() returns NaN, which
  // a zero-weight mix still carries (and the blurs then spread over the frame)
  float wF = 0.55 * (1.0 - smoothstep(30.0, 75.0, t));
  vec3 n = normalize(wF > 0.0 ? mix(ns, facetN(p.xz, 1.1), wF) : ns);
  vec3 alb = landPaint(p, ns, rd, t);
  float sh = softShadow(p + ns * 0.012, uKey);
  float ao = calcAO(p, ns);
  vec3 c = lightV(alb, n, p, sh, ao);
  if (uSalt > 0.0) {
    // (revision 8) the salt's wet sheen mirrors the sky, most at grazing angles (toward the horizon)
    vec3 rf = reflect(rd, vec3(0.0, 1.0, 0.0));
    float fr = 0.12 + 0.62 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 6.0);
    c = mix(c, valleyGrad(rf) * 0.92, uSalt * fr);
  }
  if (uRivN > 1) c = riverShade(c, p, rd, t);
  return mix(c, valleyHaze(rd), valleyFog(t));
}
// a low-poly ball: the normal snapped to latitude bands and staggered longitude sectors
vec3 facetBall(vec3 n, float bands, float sectors, float seed) {
  float th = acos(clamp(n.y, -1.0, 1.0)), ph = atan(n.z, n.x);
  float bi = floor(th / 3.14159265 * bands);
  float thc = (bi + 0.5) / bands * 3.14159265;
  float off = hash12(vec2(bi, seed)) * 6.2831853;
  float phc = (floor((ph + off) / 6.2831853 * sectors) + 0.5) / sectors * 6.2831853 - off;
  return vec3(sin(thc) * cos(phc), cos(thc), sin(thc) * sin(phc));
}
vec3 propShade(Hit h, vec3 rd) {
  vec3 p = h.p, n = h.n, nf, alb;
  if (h.mat == M_LEAF || h.mat == M_PLEAF) {
    nf = facetBall(n, 5.0, 8.0, float(h.part));
    float v = hash12(nf.xz * 7.1 + float(h.part));
    alb = pow(mix(mix(vec3(0.20, 0.42, 0.19), vec3(0.33, 0.55, 0.23), v), mix(vec3(0.18, 0.40, 0.33), vec3(0.27, 0.51, 0.41), v), uDrift), vec3(2.2));
  } else if (h.mat == M_PCONE) {
    float az = atan(n.z, n.x), sec = 6.2831853 / 7.0, azc = (floor(az / sec) + 0.5) * sec;
    float r = length(n.xz);
    nf = normalize(vec3(cos(azc) * r, n.y, sin(azc) * r));
    alb = pow(mix(vec3(0.15, 0.33, 0.19), vec3(0.13, 0.31, 0.27), uDrift), vec3(2.2)) * (0.88 + 0.24 * hash12(vec2(floor(az / sec), float(h.part))));
  } else {
    float az = atan(n.z, n.x), sec = 6.2831853 / 6.0, azc = (floor(az / sec) + 0.5) * sec;
    nf = normalize(vec3(cos(azc), n.y * 0.3, sin(azc)));
    alb = pow(vec3(0.34, 0.21, 0.17), vec3(2.2));
  }
  float sh = softShadow(p + n * 0.012, uKey), ao = calcAO(p, n);
  vec3 c = lightV(alb, nf, p, sh, ao);
  return mix(c, valleyHaze(rd), valleyFog(h.t));
}
#endif
vec3 shadeHit(Hit h, vec3 rd) {
  if (h.mat == M_SKY) return skyColor(rd);
#if LOOK
  if (h.mat == M_HILL || h.mat == M_FLOOR) return landShade(h, rd);
  if (h.mat == M_LEAF || h.mat == M_TRUNK || h.mat >= M_PLEAF) return propShade(h, rd);
#endif
  if (h.mat == M_CLOUD) {
    vec3 n = h.n;
    float lit = dot(n, uSun);
    vec3 c = mix(P_CSH, P_CLIT, smoothstep(-0.35, 0.6, lit));
    c = mix(c, P_CUND, smoothstep(0.1, -0.7, n.y) * 0.8);
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.5);
    c += P_SUNC * rim * exp(-(1.0 - dot(rd, uSun)) * 6.0) * 0.6;
    return mix(c, skyBase(rd), 0.2);
  }
  vec3 p = h.p, n = h.n;
  vec3 alb = albedo(h.mat);
  if (h.mat == M_TOWER) {
    float ndl = max(dot(n, uSun), 0.0);
    float up = clamp(n.y, 0.0, 1.0);
    vec3 gdir = normalize(vec3(uSun.x, 0.12, uSun.z));
    float gf = max(dot(n, gdir), 0.0);
    vec3 c = alb * (P_SUNL * ndl * 0.8 + P_SKYF * (0.45 + 0.4 * up) + P_GLOWL * gf * gf);
    float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
    c += P_SUNL * fres * smoothstep(-0.2, 0.7, dot(n, gdir)) * 0.4;
    c += P_GLOWL * alb * pow(max(dot(n, normalize(vec3(uSun.x, 0.0, uSun.z))), 0.0), 3.0) * 0.8;
    float fog = 1.0 - exp(-max(h.t - 7.0, 0.0) * uFog);
    // fork option: ground haze (uTowHaze = 0: off). The towers' feet dissolve into the horizon's
    // haze, so from a high camera the city rises out of mist instead of standing on a hard edge.
    float haze = uTowHaze * (1.0 - smoothstep(0.0, 20.0, p.y));
    c = mix(c, horizonFog(rd), max(fog * uTowFog, haze));
    return c + towerGlow(h.part, p, n, h.t) * (1.0 - 0.45 * fog * uTowFog) * (1.0 - haze);
  }
  float sh = softShadow(p + n * 0.012, uSun);
  float ao = calcAO(p, n);
  if (h.mat == M_HILL || h.mat == M_FLOOR) {
    float v = vnoise2(p.xz * 1.3) * 0.6 + vnoise2(p.xz * 4.0) * 0.4;
    alb *= 0.88 + 0.24 * v;
#if PAINTTEX
    float n1 = vnoise2(p.xz * 0.8 + 3.0), n2 = vnoise2(p.xz * 2.6 + 7.0), n3 = vnoise2(vec2(p.x * 9.0, p.z * 2.2));
    alb *= 0.72 + 0.4 * n1 + 0.2 * (n3 - 0.5);
    alb = mix(alb, alb * vec3(1.3, 1.12, 0.62), smoothstep(0.55, 0.85, n2) * 0.5);
    alb = mix(alb, alb * vec3(0.75, 0.95, 1.3), smoothstep(0.5, 0.15, n1) * 0.5);
#endif
    alb = mix(alb, A_FLOOR, h.mat == M_FLOOR ? 1.0 : floorMix(p.xz));
  }
#if PAINTTEX
  if (h.mat == M_LEAF) {
    vec3 q = p - uTPos;
    float n1 = vnoise(q * 2.2), n2 = vnoise(q * 5.5 + 3.0);
    alb *= 0.75 + 0.5 * n1;
    alb = mix(alb, alb * vec3(1.3, 1.2, 0.65), smoothstep(0.55, 0.85, n2) * 0.7);
    alb = mix(alb, alb * vec3(0.7, 0.9, 1.35), smoothstep(0.45, 0.15, n2) * 0.5);
  }
#endif
  float ndl = max(dot(n, uSun), 0.0);
  float up = clamp(n.y, 0.0, 1.0);
  vec3 skyF = P_SKYF * (0.3 + 0.7 * up) * (h.mat == M_LEAF ? 1.35 : 1.0);
  vec3 gdir = normalize(vec3(uSun.x, 0.12, uSun.z));
  float gf = max(dot(n, gdir), 0.0);
  vec3 glowF = P_GLOWL * gf * gf;
  vec3 bounce = P_BOUNCE * clamp(0.5 - 0.5 * n.y, 0.0, 1.0);
  vec3 c = alb * (P_SUNL * ndl * sh + (skyF + glowF + bounce) * ao);
  float fres = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 3.0);
  float back = smoothstep(-0.2, 0.7, dot(n, gdir));
#if PAINTTEX
  if (h.mat == M_HILL) {
    float sunSide = smoothstep(-0.35, 0.9, dot(normalize(p.xz - uCamPos.xz), normalize(uSun.xz)));
    float streak = vnoise2(vec2(p.x * 1.6 + p.z * 0.4, p.y * 26.0));
    float ridge = pow(fres, 4.0) * smoothstep(-0.05, 0.35, dot(n, gdir));
    c += P_SUNL * alb * (ridge * 2.2 * sunSide + 0.06 * streak * up) * (0.3 + 0.7 * sh);
  }
#endif
  c += P_SUNL * mix(alb, vec3(1.0), 0.35) * fres * back * (0.15 + 0.85 * sh) * 0.55;
  vec3 lc = uCGlow.xyz - p; float dl = length(lc);
  vec3 cOld = alb * P_CLAWDL * uCGlow.w * max(dot(n, lc / dl) * 0.8 + 0.2, 0.0) / (1.0 + dl * dl * 2.5) * (0.4 + 0.6 * ao);
  c += uCLit.x > 0.0 ? mix(cOld, clawdLit(p, n, alb, ao, h.mat), uCLit.x) : cOld;   // (revision 23) his light in the world
  float fm = h.mat == M_FLOOR ? 1.0 : (h.mat == M_HILL ? floorMix(p.xz) : 0.0);
  if (fm > 0.0) {
    vec3 rf = reflect(rd, vec3(0.0, 1.0, 0.0));
    float fr = 0.04 + 0.96 * pow(1.0 - max(-rd.y, 0.0), 5.0);
    c = mix(c, mix(c, skyBase(rf) + sunHalo(rf) * 0.6, fr * 0.55), fm);
    float pa = PIXANG() * h.t;
    vec2 g = abs(fract(p.xz + 0.5) - 0.5);
    float fxw = pa, fzw = pa / max(abs(rd.y), 0.015);
    float lx = 1.0 - smoothstep(0.3, 1.2, g.x / fxw), lz = 1.0 - smoothstep(0.3, 1.2, g.y / fzw);
    float fade = 1.0 - smoothstep(0.35, 0.9, max(fxw, fzw * 0.25));
    c = mix(c, c * 1.35 + A_GRID * 0.04, max(lx, lz) * fade * uFloorGrid * fm);
  }
  if (uRivN > 1 && (h.mat == M_HILL || h.mat == M_FLOOR)) c = riverShade(c, p, rd, h.t);
  float fog = 1.0 - exp(-max(h.t - 7.0, 0.0) * uFog);
  return mix(c, horizonFog(rd), fog);
}
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 px = vec2(fc.x, uRes.y - fc.y) * (1920.0 / uRes.x);
  vec3 rd = camRay(px);
  Hit h = castScene(uCamPos, rd);
  oCol = vec4(shadeHit(h, rd) + aura(rd, h.t), 1.0);
  vec2 n2 = vec2(dot(h.n, uCamR), dot(h.n, uCamU));
  oAux = vec4(float(h.mat) + float(h.part) / 64.0, min(h.t, 1e6), n2);
}`;

// ---------------------------------------------------------------- world-anchored seeds
// One instanced quad per seed. Seeds live on the scene's surfaces in world (or object) space,
// so paint and motes stay attached while the camera and the scene move. Each draw is one
// family x one layer; the lattice is fixed per shot (see hill.js seeding).
export const FAM = { SKY: 0, TERRAIN: 1, CLOUD: 2, CANOPY: 3, TRUNK: 4, TOWER: 5, AIR: 6 };
export const SEED_VS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
${SCENE_DECL}
uniform sampler2D uUnder, uAux;
uniform float uK;
uniform int uFam, uMode;
uniform float uSalt, uCell, uSkip, uKeep, uBloom, uMoteNear, uMoteRise, uMoteOnly;
uniform ivec2 uDims;
uniform vec4 uLat, uLat2;
uniform vec2 uSize;
out vec2 vUV; out vec3 vCol; out float vSeed; out float vA;
uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
float hf(uint base, uint k) { return float(pcg(base ^ (k * 0x9E3779B9u))) * (1.0 / 4294967296.0); }
int matAt(vec2 p) { return int(floor(texelFetch(uAux, ivec2(clamp(p, vec2(0.0), uRes - 1.0)), 0).x)); }
int grp(int m) { return m == M_FLOOR ? M_HILL : m; }
vec3 fib(int i, int n) {
  float z = 1.0 - 2.0 * (float(i) + 0.5) / float(n), r = sqrt(max(1.0 - z * z, 0.0)), ph = float(i) * 2.3999632;
  return vec3(r * cos(ph), z, r * sin(ph));
}
void cull() { gl_Position = vec4(3.0, 3.0, 3.0, 1.0); vA = 0.0; vCol = vec3(0.0); vUV = vec2(0.0); vSeed = 0.0; }
void main() {
  int id = gl_InstanceID;
  uint base = pcg(uint(id) * 3u + uint(uSalt) * 7919u + uint(uFam) * 104729u + 17u);
  float ja = hf(base, 1u), jb = hf(base, 2u);
  vec3 p = vec3(0.0), n = vec3(0.0, 1.0, 0.0); float Aw = 1.0, tol = 0.1, grow = 1.0; int mat = M_HILL;
  bool sky = uFam == 0;
  if (uFam == 0) {                                   // sky: a lattice of directions
    int nc = uDims.x; int r = id / nc, j = id - r * nc;
    float az = uLat.x + (float(j) + ja) * uLat.z, el = uLat.y + (float(r) + jb) * uLat.z;
    p = vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el));
    mat = M_SKY;
  } else if (uFam == 1) {                            // terrain: a polar lattice around the seeding origin
    int nc = uDims.x; int r = id / nc, j = id - r * nc;
    float c = uLat.z;
    float d = uLat2.x * exp((float(r) + jb) * c);
    float th = uLat.w - uLat2.y + (float(j) + ja) * c;
    p.xz = uLat.xy + d * vec2(sin(th), cos(th));
    p.y = hillS(p.xz);
    tol = 0.06;
    mat = M_HILL;
    Aw = c * c * d * d;
  } else if (uFam == 2) {                            // clouds: Fibonacci points on each ellipsoid
    int k = id / uDims.x, i = id - k * uDims.x;
    vec3 u = fib(i, uDims.x);
    vec3 R = CLR[k];
    p = CLC[k] + uCloudOff + R * u; n = normalize(u / R);
    float sa = 12.566 * pow((pow(R.x * R.y, 1.6) + pow(R.x * R.z, 1.6) + pow(R.y * R.z, 1.6)) / 3.0, 0.625);
    Aw = sa / float(uDims.x); tol = 3.0; mat = M_CLOUD;
  } else if (uFam == 3) {                            // canopy clumps
    int k = id / uDims.x, i = id - k * uDims.x;
    vec4 s = uCan[k];
    if (s.w <= 0.0 || uTreeOn < 0.5) { cull(); return; }
    vec3 u = fib(i, uDims.x);
    p = uTPos + s.xyz + s.w * u; n = u;
    Aw = 12.566 * s.w * s.w / float(uDims.x); tol = 0.3; mat = M_LEAF;
    float birth = 0.03 + 0.45 * hf(base, 20u);
    grow = smoothstep(birth, birth + 0.2, uCanG[k].x);
  } else if (uFam == 4) {                            // trunk and limbs
    int k = id / uDims.x, i = id - k * uDims.x;
    int nu = int(uLat.x); int iv = i / nu, iu = i - iv * nu; int nv = uDims.x / nu;
    vec4 A = uTrA[k], B = uTrB[k];
    if (A.w <= 0.0 || uTreeOn < 0.5) { cull(); return; }
    float v = (float(iv) + jb) / float(nv), ang = (float(iu) + ja) / float(nu) * 6.2831853;
    vec3 ax = B.xyz - A.xyz; float L = length(ax); vec3 w = ax / max(L, 1e-4);
    vec3 e1 = normalize(abs(w.y) < 0.9 ? cross(w, vec3(0.0, 1.0, 0.0)) : cross(w, vec3(1.0, 0.0, 0.0)));
    vec3 e2 = cross(w, e1);
    float rad = mix(A.w, B.w, v);
    n = cos(ang) * e1 + sin(ang) * e2;
    p = uTPos + A.xyz + ax * v + n * rad;
    Aw = 6.2831853 * rad * L / float(uDims.x); tol = 0.12; mat = M_TRUNK;
  } else if (uFam == 5) {                            // towers
    int k = id / uDims.x, i = id - k * uDims.x;
    if (k >= uNTow) { cull(); return; }
    vec4 A = uTowA[k], B = uTowB[k];
    if (A.w <= 0.05) { cull(); return; }
    int nu = int(uLat.x); int iv = i / nu, iu = i - iv * nu; int nv = uDims.x / nu;
    float y = (float(iv) + jb) / float(nv) * A.w;
    float wy = mix(A.z, A.z * (1.0 - B.x), y / A.w);
    float fa = (float(iu) + ja) / float(nu) * 8.0;
    float face = floor(fa), fu = fract(fa) - 0.5;
    float th = B.z + face * 0.7853982;
    vec2 nd = vec2(cos(th), sin(th)), tg = vec2(-nd.y, nd.x);
    vec2 xz = nd * wy + tg * fu * 0.8284 * wy;
    p = vec3(A.x + xz.x, y, A.y + xz.y);
    n = normalize(vec3(nd.x, (A.z - A.z * (1.0 - B.x)) / A.w, nd.y));
    Aw = 8.0 * 0.8284 * wy * A.w / float(uDims.x); tol = 0.5; mat = M_TOWER;
  } else {                                           // air: motes floating in a box
    p = uLat.xyz + vec3(ja, hf(base, 3u), jb) * uLat2.xyz;
    float per = 9.0 + 7.0 * hf(base, 4u);
    float ph = uTime / per + hf(base, 5u);
    p += vec3(sin(ph * 6.2831853) * 0.25, fract(ph) * 0.9 - 0.45, cos(ph * 4.1) * 0.2);
    mat = -1;
  }
  // ---- project
  vec3 d = sky ? p : p - uCamPos;
  float zc = dot(d, uCamFw);
  if (zc <= 0.05) { cull(); return; }
  vec2 s = vec2(uPP.x + uF * dot(d, uCamR) / zc, uPP.y - uF * dot(d, uCamU) / zc);
  vec2 sp = vec2(s.x, uRes.y / uK - s.y) * uK;              // GL pixels (y up) at the real resolution
  float marg = 40.0 * uK;
  if (sp.x < -marg || sp.y < -marg || sp.x > uRes.x + marg || sp.y > uRes.y + marg) { cull(); return; }
  vec4 ax = texelFetch(uAux, ivec2(clamp(sp, vec2(0.0), uRes - 1.0)), 0);
  int mPix = int(floor(ax.x));
  float alive = 1.0, dist = length(d), hk = hf(base, 6u);
  if (sky) {
    if (mPix != M_SKY) alive = 0.0;
    if (hk < uSkip) alive = 0.0;
  } else if (uFam == 6) {
    // air motes: hidden behind geometry
    if (ax.y < dist - 0.2) alive = 0.0;
  } else {
    if (uFam == 1) {
      n = hillNormalS(p.xz);
      Aw /= max(n.y, 0.2);
      mat = floorMix(p.xz) > 0.5 ? M_FLOOR : M_HILL;
    }
    vec3 v = -d / dist;
    float ndv = dot(n, v);
    alive *= smoothstep(0.0, 0.06, ndv);
    if (grp(mPix) != grp(mat) && !(uFam == 3 && mPix == M_TRUNK)) alive = 0.0;
    float tolD = tol + 0.012 * dist;
    alive *= 1.0 - smoothstep(0.5 * tolD, tolD, dist - ax.y);
    float P = Aw * max(ndv, 0.0) * (uF / dist) * (uF / dist) / (uCell * uCell);
    P = min(P, 1.0) * uKeep;
    alive *= clamp((P - hk) / (0.25 * P + 0.015), 0.0, 1.0);
  }
  alive *= grow;
  if (alive <= 0.003) { cull(); return; }
  vec2 corner = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  if (uMode == 0) {
    // ---- a brushstroke
    vec2 dir;
    if (sky) dir = vec2(1.0, (hf(base, 7u) - 0.5) * 0.12);
    else {
      vec2 n2 = vec2(dot(n, uCamR), dot(n, uCamU));
      float l2 = length(n2);
      vec2 iso = l2 > 1e-4 ? vec2(-n2.y, n2.x) / l2 : vec2(1.0, 0.0);
      if (iso.x < 0.0) iso = -iso;
      dir = normalize(mix(vec2(1.0, 0.0), iso, smoothstep(0.05, 0.2, l2)));
      if (uFam == 2) dir = normalize(mix(dir, vec2(1.0, 0.0), 0.45));
      if (uFam == 1) dir = normalize(mix(dir, vec2(1.0, 0.0), 0.3));
      if (uFam == 4 || uFam == 5) {
        vec3 axw = uFam == 4 ? normalize(uTrB[id / uDims.x].xyz - uTrA[id / uDims.x].xyz) : vec3(0.0, 1.0, 0.0);
        vec2 a2 = vec2(dot(axw, uCamR), dot(axw, uCamU));
        dir = length(a2) > 1e-3 ? normalize(a2) : vec2(0.0, 1.0);
      }
    }
    float ang = (hf(base, 8u) - 0.5) * (sky ? 0.08 : 0.5);
    dir = vec2(dir.x * cos(ang) - dir.y * sin(ang), dir.x * sin(ang) + dir.y * cos(ang));
    vec2 nrm = vec2(-dir.y, dir.x);
    float len = uSize.x * uK * (0.7 + 0.6 * hf(base, 9u)), wid = uSize.y * uK * (0.75 + 0.5 * hf(base, 10u));
    if (sky) len *= 1.8;
    if (uFam == 3) { len *= 0.55; wid *= 0.8; }
    if (uFam == 4) { len *= 0.5; wid *= 0.45; }
    if (uFam == 5) { len *= 0.55; wid *= 0.4; }
    int ma = matAt(sp + dir * len * 0.5), mb = matAt(sp - dir * len * 0.5);
    int mc = matAt(sp + dir * len * 0.25), md = matAt(sp - dir * len * 0.25);
    if (grp(ma) != grp(mPix) || grp(mb) != grp(mPix) || grp(mc) != grp(mPix) || grp(md) != grp(mPix)) { len *= 0.35; wid *= (uFam >= 4 ? 0.5 : 0.8); }
    len *= mix(0.2, 1.0, grow); wid *= mix(0.5, 1.0, grow);
    vec2 ps = sp + nrm * (hf(base, 11u) - 0.5) * wid * 1.2 + dir * (hf(base, 12u) - 0.5) * len * 0.5;
    vec3 col = texelFetch(uUnder, ivec2(clamp(ps, vec2(0.0), uRes - 1.0)), 0).rgb;
    if (grp(matAt(ps)) != grp(mPix)) col = texelFetch(uUnder, ivec2(clamp(sp, vec2(0.0), uRes - 1.0)), 0).rgb;
    float vv = hf(base, 13u) - 0.5;
    col *= 1.0 + vv * (sky ? 0.05 : 0.16);
    float tmp = hf(base, 14u) - 0.5;
    col *= mix(vec3(1.0), tmp > 0.0 ? vec3(1.06, 1.0, 0.9) : vec3(0.93, 0.99, 1.08), abs(tmp) * (sky ? 0.8 : 1.6));
    float rise = 0.0;
    if (uStrokeLift > 0.0) {
      // fork option: the paint turns to light. The sky's strokes melt into the smooth underpainting;
      // on the land and the tree the lift spreads out from Clawd, and about a third of the strokes
      // round up into small warm motes that rise off their surface while the rest melt away.
      float order = sky ? hf(base, 31u) : 0.65 * clamp(length(p.xz - uCGlow.xz) / 16.0, 0.0, 1.0) + 0.35 * hf(base, 31u);
      float lk = clamp((uStrokeLift * 1.35 - 0.8 * order) / 0.55, 0.0, 1.0);
      float sh = smoothstep(0.0, 0.5, lk);
      if (sky || hf(base, 34u) > 0.055) {
        wid *= mix(1.0, 0.35, sh); len *= mix(1.0, 0.7, sh);
        alive *= 1.0 - smoothstep(0.1, 0.8, lk);
        if (uMoteOnly > 0.5) alive = 0.0;          // (revision 4: the look keeps only the rising motes)
      } else {
        float mote = (2.6 + 2.8 * hf(base, 33u)) * uK;
        // (revision 4, the look: no strokes to shrink, so a mote is round and warm from the start; fewer
        // of them, and none close to the camera, so the look stays crisp)
        if (uMoteOnly > 0.5) { alive *= smoothstep(0.05, 0.3, lk) * step(hf(base, 36u), 0.35) * smoothstep(8.0, 22.0, dist); sh = 1.0; }
        len = mix(len, mote, sh); wid = mix(wid, mote, sh);
        col = mix(col, col * 0.35 + vec3(1.0, 0.64, 0.36) * (0.8 + 0.45 * hf(base, 35u)), sh);
        rise = lk * lk * (50.0 + 150.0 * hf(base, 32u)) * uK;
        alive *= 1.0 - smoothstep(0.75, 1.0, lk);
      }
    }
    vec2 pos = sp + dir * corner.x * len * 0.5 + nrm * corner.y * wid * 0.5 + vec2(0.0, rise);
    vCol = col; vUV = corner * 0.5 + 0.5; vSeed = hf(base, 15u); vA = alive;
    gl_Position = vec4(pos / uRes * 2.0 - 1.0, 0.0, 1.0);
  } else {
    // ---- a mote of light: anchored to its surface, it rises and fades on its own cycle
    vec3 c = texelFetch(uUnder, ivec2(clamp(sp, vec2(0.0), uRes - 1.0)), 0).rgb;
    float e = 0.0;
    for (int k = 0; k < 6; k++) {
      float an = float(k) * 1.0472 + ja * 3.0;
      vec4 b = texelFetch(uAux, ivec2(clamp(sp + vec2(cos(an), sin(an)) * 3.0 * uK, vec2(0.0), uRes - 1.0)), 0);
      if (abs(floor(b.x) - floor(ax.x)) > 0.5 || abs(b.y - ax.y) > 0.08 * min(b.y, ax.y)) e = 1.0;
    }
    float near = uFam == 6 ? 1.0 : exp(-length(p - uCGlow.xyz) / uMoteNear);
    float per = 4.0 + 5.0 * hf(base, 16u);
    float ph = fract(uTime / per + hf(base, 17u));
    float rise = (0.01 + 0.08 * hf(base, 18u) + near * uMoteRise * (0.3 + hf(base, 19u))) * ph;
    vec3 away = normalize(vec3(p.x - uCGlow.x, 0.0, p.z - uCGlow.z) + vec3(1e-4, 0.0, 0.0));
    vec3 pw = p + vec3(0.0, rise, 0.0) + away * rise * 0.4 * near;
    vec3 dw = pw - uCamPos; float zw = dot(dw, uCamFw);
    if (sky || zw <= 0.05) { cull(); return; }
    vec2 sw = vec2(uPP.x + uF * dot(dw, uCamR) / zw, uPP.y - uF * dot(dw, uCamU) / zw);
    vec2 spw = vec2(sw.x, uRes.y / uK - sw.y) * uK;
    float life = uFam == 6 ? 1.0 : mix(1.0, sin(3.14159 * ph), 0.35 + 0.65 * near);
    float tw = 0.75 + 0.25 * sin(uTime * (1.5 + 2.0 * hf(base, 21u)) + 6.283 * hf(base, 22u));
    float sz = uSize.x * uK * (0.6 + 0.9 * hf(base, 23u)) * (1.0 + e * 0.5);
    vec3 col = (c * (1.4 + 1.2 * e) + vec3(0.9, 0.55, 0.3) * near * 0.8) * (0.6 + 0.8 * near);
    if (uFam == 2) col = c * 1.3;
    if (uFam == 3) col = mix(c * 2.0, vec3(1.0, 0.8, 0.46), 0.55) * 1.2;
    if (uFam == 5) col = mix(c * 1.6, vec3(1.0, 0.85, 0.62), 0.5);
    if (uFam == 6) col = vec3(1.0, 0.78, 0.5) * 0.9;
    vCol = col * uBloom; vUV = corner; vSeed = 0.0; vA = alive * (0.55 + 0.45 * hf(base, 24u)) * life * tw;
    gl_Position = vec4((spw + corner * sz) / uRes * 2.0 - 1.0, 0.0, 1.0);
  }
}`;

export const STROKE_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec3 vCol; in float vSeed; in float vA;
out vec4 o;
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  if (vA <= 0.003) discard;
  vec2 q = vUV;
  float across = abs(q.y - 0.5) * 2.0;
  float wob = 0.22 * (vn(vec2(q.x * 5.0, vSeed * 13.0)) - 0.5);
  float edge = 1.0 - smoothstep(0.7, 0.9, across + wob);
  float taper = smoothstep(0.0, 0.22 + 0.1 * vSeed, q.x) * (1.0 - smoothstep(0.7, 1.0, q.x + 0.1 * vn(vec2(q.y * 7.0, vSeed * 3.0))));
  float bristle = 0.62 + 0.38 * vn(vec2(q.y * 16.0 + vSeed * 37.0, q.x * 1.5));
  float a = clamp(edge * taper * bristle * 1.35, 0.0, 1.0) * vA;
  vec3 c = vCol * (0.95 + 0.1 * vn(vec2(q.y * 11.0 + vSeed * 9.0, q.x * 3.0)));
  c *= 1.0 + 0.07 * (q.y - 0.5) * 2.0 - 0.05 * smoothstep(0.6, 1.0, across);
  o = vec4(c * a, a);
}`;

export const MOTE_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec3 vCol; in float vSeed; in float vA;
out vec4 o;
void main() {
  if (vA <= 0.003) discard;
  float r = length(vUV);
  float a = exp(-r * r * 3.2) * vA;
  o = vec4(vCol * a, a);
}`;

// ---------------------------------------------------------------- post
export const BLUR_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes; uniform vec2 uDir; uniform float uSigma;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 st = uDir / uRes;
  vec4 acc = vec4(0.0); float wsum = 0.0;
  float sp = max(uSigma / 8.0, 1.0);
  for (int i = -24; i <= 24; i++) {
    float x = float(i); float w = exp(-x * x * sp * sp / (2.0 * uSigma * uSigma));
    acc += texture(uSrc, uv + st * x * sp) * w; wsum += w;
  }
  o = acc / wsum;
}`;
export const DOWN_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes; uniform float uThr;
out vec4 o;
// a 4:1 box downsample: four bilinear taps cover the 4x4 source block exactly (no shimmer)
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 ts = 1.0 / vec2(textureSize(uSrc, 0));
  vec3 c = 0.25 * (texture(uSrc, uv + ts * vec2(-1.0, -1.0)).rgb + texture(uSrc, uv + ts * vec2(1.0, -1.0)).rgb +
                   texture(uSrc, uv + ts * vec2(-1.0, 1.0)).rgb + texture(uSrc, uv + ts * vec2(1.0, 1.0)).rgb);
  float m = max(max(c.r, c.g), c.b);
  o = vec4(c * smoothstep(uThr, uThr + 0.5, m), 1.0);
}`;
export const COPY_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes;
out vec4 o;
void main() { o = texture(uSrc, gl_FragCoord.xy / uRes); }`;
export const SKYONLY_FS = `#version 300 es
precision highp float;
uniform sampler2D uCol, uAux; uniform vec2 uRes;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  ivec2 q = ivec2(uv * vec2(textureSize(uAux, 0)));
  float sky = floor(texelFetch(uAux, q, 0).x) < 0.5 ? 1.0 : 0.0;
  o = vec4(texture(uCol, uv).rgb * sky, sky);
}`;
export const WRAP_FS = `#version 300 es
precision highp float;
uniform sampler2D uCol, uAux, uWrap; uniform vec2 uRes; uniform float uK;
out vec4 o;
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(uCol, q, 0).rgb;
  float m = floor(texelFetch(uAux, q, 0).x);
  vec4 w = texture(uWrap, gl_FragCoord.xy / uRes);
  if (m > 0.5) c += w.rgb * uK;
  o = vec4(c, 1.0);
}`;
// (fork option uDim: the world and Clawd dimmed under the lines of light, which are added after)
export const COMP_FS = `#version 300 es
precision highp float;
uniform sampler2D uPaint, uClawd; uniform vec2 uRes; uniform vec3 uDim;
out vec4 o;
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(uPaint, ij, 0).rgb;
  vec4 k = texelFetch(uClawd, ij, 0);
  o = vec4((c * (1.0 - k.a) + k.rgb) * uDim, 1.0);
}`;
const POST_LIB = `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 tonemapHP(vec3 c) {
  float m = max(max(c.r, c.g), c.b);
  if (m > 0.72) { float mm = 0.72 + 0.28 * (1.0 - exp(-(m - 0.72) / 0.28)); c *= mm / m; }
  float w = smoothstep(1.2, 4.0, m);
  return mix(c, vec3(max(max(c.r, c.g), c.b)), w * 0.5);
}
vec3 toSRGB(vec3 c) { c = max(c, 0.0); return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y); }
`;
// canvas weave is anchored to the screen on purpose: it is the canvas, not the world
export const FINISH_FS = `#version 300 es
precision highp float;
uniform sampler2D uCol, uB1, uB2, uClawd; uniform vec2 uRes;
uniform float uBloom1, uBloom2, uVig, uGrain, uWeave, uCurve, uExposure, uK;
out vec4 o;
${POST_LIB}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture(uCol, uv).rgb * uExposure;
  float kc = texture(uClawd, uv).a;
  c += (texture(uB1, uv).rgb * uBloom1 + texture(uB2, uv).rgb * uBloom2) * (1.0 - 0.85 * kc);
  c = tonemapHP(c);
  vec2 q = uv - 0.5; q.x *= 1.25;
  c *= 1.0 - uVig * smoothstep(0.3, 0.95, length(q));
  vec3 s = toSRGB(c);
  s = mix(s, s * s * (3.0 - 2.0 * s), uCurve * (1.0 - kc));
  vec2 f = gl_FragCoord.xy / uK;
  float weave = sin(f.x * 1.9) * sin(f.y * 1.7) * 0.5 + 0.5;
  float thread = vn(f * vec2(0.9, 0.12)) * 0.5 + vn(f * vec2(0.12, 0.9)) * 0.5;
  s *= 1.0 + uWeave * ((weave - 0.5) * 0.6 + (thread - 0.5) * 0.9) * (1.0 - kc);
  s += (hash12(gl_FragCoord.xy) - 0.5) * uGrain;
  o = vec4(s, 1.0);
}`;

// ---------------------------------------------------------------- rung 5: the world as light
export const SKY5_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
${SCENE_DECL}
uniform sampler2D uCol, uAux; uniform float uDomeMer, uDomeLat, uDomeFade;
out vec4 o;
float domeLines(vec3 rd, out float el, out float mer) {
  vec3 oc = uCamPos - DOME_C; float b = dot(oc, rd); float c = dot(oc, oc) - DOME_R * DOME_R;
  float t = -b + sqrt(max(b * b - c, 0.0));
  vec3 q = (uCamPos + rd * t - DOME_C) / DOME_R;
  float az = atan(q.x, q.z); el = asin(clamp(q.y, -1.0, 1.0));
  float stp = radians(10.0), stpM = radians(30.0);
  float pa = PIXANG() * t / DOME_R;
  float da = abs(fract(az / stpM + 0.5) - 0.5) * stpM * cos(el);
  float de = abs(fract(el / stp + 0.5) - 0.5) * stp;
  mer = exp(-pow(da / (pa * 0.9), 2.0));
  float lat = exp(-pow(de / (pa * 0.9), 2.0));
  vec2 f = vec2(da, de);
  float node = exp(-dot(f, f) / (2.0 * pow(pa * 2.2, 2.0)));
  return lat + node * 3.0;
}
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy);
  vec4 a = texelFetch(uAux, q, 0);
  vec3 c = texelFetch(uCol, q, 0).rgb;
  if (floor(a.x) > 0.5) { o = vec4(c, 1.0); return; }
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * (1920.0 / uRes.x);
  vec3 rd = camRay(px);
  float el, mer; float lat = domeLines(rd, el, mer);
  float sunMask = 1.0 - 0.9 * exp(-(1.0 - dot(rd, uSun)) * 25.0);
  // threads of light: meridians rise like lantern ribs; latitudes stay faint
  float up = smoothstep(0.02, 0.12, el) * (1.0 - uDomeFade * smoothstep(0.7, 1.2, el));
  vec3 thread = vec3(1.0, 0.84, 0.66);
  c += thread * (mer * uDomeMer + lat * uDomeLat) * up * sunMask;
  o = vec4(c, 1.0);
}`;

export const GHOST_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
${SCENE_DECL}
uniform sampler2D uCol, uAux; uniform float uGhost, uContour, uContourStep, uEdgeK, uK;
out vec4 o;
float edgeAt(ivec2 q, vec4 a) {
  float e = 0.0; int R = max(1, int(round(2.0 * uK)));
  for (int k = 0; k < 8; k++) {
    float an = float(k) * 0.785398;
    ivec2 d = ivec2(round(vec2(cos(an), sin(an)) * float(R)));
    vec4 b = texelFetch(uAux, clamp(q + d, ivec2(0), textureSize(uAux, 0) - 1), 0);
    if (abs(floor(b.x) - floor(a.x)) > 0.5 || abs(b.y - a.y) > 0.08 * min(a.y, b.y)) e += 0.125;
  }
  return e;
}
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(uCol, q, 0).rgb;
  vec4 a = texelFetch(uAux, q, 0);
  int mat = int(floor(a.x));
  if (mat == M_SKY) { o = vec4(c, 1.0); return; }
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * (1920.0 / uRes.x);
  vec3 rd = camRay(px);
  vec3 p = uCamPos + rd * a.y;
  float e = edgeAt(q, a);
  float dC = length(p - uCGlow.xyz);
  float near = exp(-dC / 4.0) * uCGlow.w;
  float ghost = mat == M_CLOUD ? 0.75 : (mat == M_TOWER ? 0.8 : uGhost);
  vec3 g = c * ghost;
  vec3 warm = vec3(1.0, 0.72, 0.45);
  g += (c * 0.8 + warm * 0.7 * near) * e * uEdgeK * (0.8 + 1.4 * near);
  if (mat == M_HILL || mat == M_FLOOR) {
    // the hill drawn as a height map in light: contours every uContourStep metres, one to
    // two pixels wide wherever they are (fwidth), brightest in a pool around Clawd
    float hh = p.y / uContourStep;
    float dd = abs(fract(hh + 0.5) - 0.5);
    float fw = clamp(fwidth(hh), 1e-4, 0.35) * 0.9;
    float ln = exp(-dd * dd / (fw * fw)) * (1.0 - smoothstep(0.12, 0.35, fwidth(hh)));
    vec3 lc = mix(vec3(0.95, 0.62, 0.42), vec3(1.0, 0.86, 0.62), near);
    float fadeH = smoothstep(0.03, 0.2, p.y);
    float pool = 0.07 + 1.9 * pow(near, 1.3);
    g += lc * ln * uContour * pool * fadeH * (1.0 - smoothstep(18.0, 36.0, a.y));
  }
  if (mat >= M_SKIN && mat <= M_SHOE) {
    // the figure: soft, low detail, lit from within by his light, rimmed toward him
    g = c * 0.62 + warm * e * (0.9 + 1.6 * near);
  }
  o = vec4(g, 1.0);
}`;

// ---------------------------------------------------------------- Clawd composites (crisp)
// Drawn in glyph units: the 18 x 10 box, y down; one glyph cell is 1 x 2 units.
// uGeo: box top-left in design px (x, y), px per unit U, depth (m) for occlusion.
// (revision 23) Clawd's glow in the air around him (sets/hill/clawdlight.js); no occluder here (S30 has no figure)
export const CLAWDVOL_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
${SCENE_DECL}
float volOcc(vec3 p) { return 1e9; }
${VOL_BODY}`;

export const CLAWD_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uAux; uniform vec2 uRes; uniform float uK;
uniform vec4 uGeo; uniform float uForm, uSit, uGlow, uRays, uAlpha, uEyeLight;
// fork option: poses from the sprite canon (style-frames/05-clawd-sprites), exact cells.
//   uLegX  the four leg columns (cell centres; neutral 4.5 6.5 11.5 13.5, walk-pass 5.5 6.5 12.5 13.5,
//          hop-apex spread 3.5 5.5 12.5 14.5)
//   uPose  x: look, the eyes shifted a whole column (-1 left, +1 right: the "side" eyes)
//          y: 1 = arch eyes (the "happy" emote)
//          z, w: left / right arm: 0 level, -1 raised a row, +1 dropped a row (the walk swing),
//                -2 up (tip on row 0, elbow on row 1: the happy emote's cheer)
uniform vec4 uLegX, uPose;
uniform float uHalo;   // (revision 23) the radiant form's flat 2D halo (1; S30's landing eases to the world's glow)
// (revision 4, from sets/hill: sprite-grid poses from clawd-pose.js, for S19 and S24)
uniform int uGridOn; uniform int uGB[24];
out vec4 o;
float sdRoundBox(vec2 p, vec2 c, vec2 hb, float r) { vec2 q = abs(p - c) - hb + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float smin(float a, float b, float k) { if (k <= 0.0) return min(a, b); float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float sdRay(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  p -= a; b -= a;
  float h = dot(b, b);
  vec2 q = vec2(dot(p, vec2(b.y, -b.x)), dot(p, b)) / h;
  q.x = abs(q.x);
  float bb = ra - rb; vec2 c = vec2(sqrt(max(h - bb * bb, 1e-6)), bb);
  float k = c.x * q.y - c.y * q.x, m = dot(c, q), n = dot(q, q);
  if (k < 0.0) return sqrt(h * n) - ra;
  if (k > c.x) return sqrt(h * (n + 1.0 - 2.0 * q.y)) - rb;
  return m - ra;
}
// silhouette: body + arm bar + four legs, minus the eyes. Sitting lowers the body one row,
// drops the arms to the ground row and hides the legs (the SIT sprite).
// one arm tip (and elbow) off the bar, for a posed arm (mode as uPose.z/w); 1e9 when level
float armOff(vec2 p, bool right, float mode, float sy, float ra) {
  if (abs(mode) < 0.5) return 1e9;
  float tipX = right ? 16.5 : 1.5;
  if (mode < -1.5) {
    // up: the tip on row 0 and the elbow on row 1 (the elbow reaches into the body, so no seam)
    return min(sdRoundBox(p, vec2(tipX, 1.0 + sy), vec2(0.5, 1.0), ra),
               sdRoundBox(p, vec2(right ? 15.25 : 2.75, 3.0 + sy), vec2(0.75, 1.0), ra));
  }
  return sdRoundBox(p, vec2(tipX, 5.0 + 2.0 * mode + 2.0 * sy), vec2(0.5, 1.0), ra);
}
vec3 clawd(vec2 p, float rb, float ra, float rl, float re, float k, float kl) {
  float sy = 2.0 * uSit;
  float d = sdRoundBox(p, vec2(9.0, 4.0 + sy), vec2(6.0, 4.0), rb);
  // the arm bar on row 2: to column 1 / 16 where an arm is level, else stopping at the body
  float mL = uPose.z, mR = uPose.w;
  float xl = abs(mL) < 0.5 ? 1.0 : (mL < -1.5 ? 3.0 : 2.0), xr = abs(mR) < 0.5 ? 17.0 : (mR < -1.5 ? 15.0 : 16.0);
  d = smin(d, sdRoundBox(p, vec2(0.5 * (xl + xr), 5.0 + 2.0 * sy), vec2(0.5 * (xr - xl), 1.0), ra), k);
  d = min(d, min(armOff(p, false, mL, sy, ra), armOff(p, true, mR, sy, ra)));
  float legL = 1.25 * (1.0 - uSit);
  if (legL > 0.02) {
    d = smin(d, sdRoundBox(p, vec2(uLegX.x, 10.0 - legL), vec2(0.5, legL), rl), kl);
    d = smin(d, sdRoundBox(p, vec2(uLegX.y, 10.0 - legL), vec2(0.5, legL), rl), kl);
    d = smin(d, sdRoundBox(p, vec2(uLegX.z, 10.0 - legL), vec2(0.5, legL), rl), kl);
    d = smin(d, sdRoundBox(p, vec2(uLegX.w, 10.0 - legL), vec2(0.5, legL), rl), kl);
  }
  float eye;
  if (uPose.y > 0.5) {
    // arch eyes: three holes on the eye row and one under each end (happy, closed)
    eye = 1e9;
    for (int e = 0; e < 2; e++) {
      float cx = e == 0 ? 5.5 : 12.5;
      eye = min(eye, sdRoundBox(p, vec2(cx, 3.0 + sy), vec2(1.5, 1.0), re));
      eye = min(eye, sdRoundBox(p, vec2(cx - 1.0, 5.0 + sy), vec2(0.5, 1.0), re));
      eye = min(eye, sdRoundBox(p, vec2(cx + 1.0, 5.0 + sy), vec2(0.5, 1.0), re));
    }
  } else {
    float lx = uPose.x;
    eye = min(sdRoundBox(p, vec2(5.5 + lx, 3.0 + sy), vec2(0.5, 1.0), re), sdRoundBox(p, vec2(12.5 + lx, 3.0 + sy), vec2(0.5, 1.0), re));
  }
  return vec3(max(d, -eye), eye, d);
}
// The same three distances from a sprite grid (sets/hill/clawd-pose.js): 22 x 8 cells of 1 x 2 units,
// the canonical glyph at cols 2..19 and rows 3..7. x = body with the holes carved, y = holes,
// z = body + holes; w = distance to accent cells. Exact union-of-boxes distances: crisp cells.
int cellK(ivec2 c) {
  if (c.x < 0 || c.x > 21 || c.y < 0 || c.y > 7) return 0;
  if (((uGB[c.y] >> c.x) & 1) != 0) return 1;
  if (((uGB[8 + c.y] >> c.x) & 1) != 0) return 2;
  if (((uGB[16 + c.y] >> c.x) & 1) != 0) return 3;
  return 0;
}
vec4 clawdGrid(vec2 p) {
  ivec2 c0 = ivec2(int(floor(p.x + 2.0)), int(floor(p.y * 0.5 + 3.0)));
  int k0 = cellK(c0);
  float dS = 1e9, dNS = 1e9, dH = 1e9, dNH = 1e9, dA = 1e9;
  for (int j = -2; j <= 2; j++) for (int i = -4; i <= 4; i++) {
    ivec2 c = c0 + ivec2(i, j);
    int k = cellK(c);
    vec2 q = abs(p - vec2(float(c.x) - 1.5, float(c.y) * 2.0 - 5.0)) - vec2(0.5, 1.0);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    if (k == 1 || k == 2) dS = min(dS, d); else dNS = min(dNS, d);
    if (k == 2) dH = min(dH, d); else dNH = min(dNH, d);
    if (k == 3) dA = min(dA, d);
  }
  float sil = (k0 == 1 || k0 == 2) ? -dNS : dS;
  float hole = k0 == 2 ? -dNH : dH;
  return vec4(max(sil, -hole), hole, sil, dA);
}
vec3 clawdL(vec2 p) { return uGridOn == 1 ? clawdGrid(p).xyz : clawd(p, 0.25, 0.3, 0.2, 0.18, 0.0, 0.0); }
vec3 lin(vec3 s) { return pow(s, vec3(2.2)); }
const vec3 C_OR = vec3(0.851, 0.467, 0.341), C_PEACH = vec3(0.965, 0.722, 0.6), C_WHITE = vec3(1.0, 0.957, 0.902),
           C_DEEP = vec3(0.612, 0.271, 0.208), C_GOLD = vec3(1.0, 0.851, 0.659);
float U;
float cover(float du) { return clamp(0.5 - du * U, 0.0, 1.0); }
// rung 4 (revision 11, Claire): the valley engine's crisp extruded solid (sets/valley/clawd3d.js), as
// in S18, S19 and S34. The front face is flat #D97757 with hard edges (no chamfer, no gold, no inner
// glow), the eyes are clean ink slots (the valley's pocket-floor ink), and where the extrusion shows,
// a darker side face: the front silhouette swept back along uExt (glyph units, from hillx: toward the
// camera's axis as a solid in perspective, with a slight lower-right bias so it always reads solid),
// shaded by the face it shows (light from the upper left).
uniform vec2 uExt;
vec3 clawdS(vec2 p) { return uGridOn == 1 ? clawdGrid(p).xyz : clawd(p, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0); }
const vec3 C_INK = vec3(0.118, 0.090, 0.078);
vec4 luminous(vec2 g) {
  vec3 s = clawdS(g);
  if (uGridOn == 1 && s.z > 0.0) {
    float da = clawdGrid(g).w;
    if (da < 0.02) return vec4(lin(C_GOLD) * 1.6 * uGlow, cover(da));
  }
  float aF = cover(s.z);
  float L = length(uExt);
  float sw = 1e9, tB = 0.0;
  if (aF < 1.0 && L > 0.01 && s.z < L + 0.1) {
    for (int k = 1; k <= 8; k++) {
      float t = float(k) / 8.0, d = clawdS(g - uExt * t).z;
      if (d < sw) { sw = d; tB = t; }
    }
  }
  float aS = cover(sw) * (1.0 - aF);
  if (aF <= 0.0 && aS <= 0.0) return vec4(0.0);
  vec3 body = lin(C_OR) * uGlow;
  vec3 front = mix(body, lin(C_INK), cover(s.y));
  vec3 side = vec3(0.0);
  if (aS > 0.0) {
    vec2 q = g - uExt * tB; const float e = 0.03;
    vec2 gn = vec2(clawdS(q + vec2(e, 0.0)).z - clawdS(q - vec2(e, 0.0)).z, clawdS(q + vec2(0.0, e)).z - clawdS(q - vec2(0.0, e)).z);
    gn = normalize(gn + 1e-9);
    side = body * (0.7 + 0.12 * dot(gn, vec2(-0.6, -0.8)));
  }
  float a = aF + aS;
  return vec4((front * aF + side * aS) / max(a, 1e-4), a);
}
// rung 5: radiant. The body turns to light, the eyes stay dark, and beams leave the limbs
// along the directions the spark's rays would take.
const float RA[11] = float[11](0.0, 47.0, 63.0, 116.0, 133.0, 180.0, -151.0, -121.0, -92.0, -61.0, -31.0);
const float RL[11] = float[11](8.3, 7.0, 7.9, 7.5, 6.6, 8.7, 6.2, 7.8, 8.9, 7.1, 6.6);
const float RW[11] = float[11](0.8, 0.62, 0.66, 0.64, 0.6, 0.8, 0.66, 0.72, 0.76, 0.7, 0.66);
const vec2 RF[11] = vec2[11](vec2(17.0, 5.0), vec2(13.5, 10.0), vec2(11.5, 10.0), vec2(6.5, 10.0), vec2(4.5, 10.0), vec2(1.0, 5.0),
  vec2(3.6, 0.4), vec2(6.2, 0.0), vec2(9.0, 0.0), vec2(11.8, 0.0), vec2(14.4, 0.4));
vec4 radiant(vec2 g) {
  const float SC = 0.88;
  float sy = 2.0 * uSit;
  vec2 CEN = vec2(9.0, 4.6 + sy);
  vec3 s = clawd((g - CEN) / SC + CEN, 0.6, 0.95, 0.45, 0.4, 0.3, 0.18);
  float body = s.z * SC, eye = s.y * SC;
  float aBody = cover(max(body, -eye));
  float aEye = cover(eye) * step(body, 0.0);
  float beam = 0.0;
  for (int i = 0; i < 11; i++) {
    float th = radians(RA[i]);
    vec2 dir = vec2(cos(th), sin(th));
    vec2 f = RF[i];
    float w = 1.0;
    if (i >= 1 && i <= 4) { f.y = 10.0 - 2.0 * uSit; w = 1.0 - uSit; }     // legs: tucked when sitting
    else if (i == 0 || i == 5) f.y = 5.0 + 4.0 * uSit;                     // arms: drop to the ground row
    else f.y += sy;
    if (w <= 0.01) continue;
    vec2 a = (f - CEN) * SC + CEN;
    float L = RL[i] * (dir.y > 0.5 ? 0.46 : 0.62) * uRays * w;
    if (L < 0.05) continue;
    float dr = sdRay(g, a - dir * 0.7, a + dir * L, RW[i] * 0.9, 0.12);
    float hh = clamp(dot(g - a, dir) / L, 0.0, 1.0);
    beam = max(beam, cover(dr) * pow(1.0 - hh, 1.6) * w * 0.85);
  }
  float rr = length((g - CEN) * vec2(0.62, 1.0));
  vec3 halo = vec3(1.0, 0.62, 0.38) * (0.16 * exp(-rr * rr / 18.0) + 0.05 * exp(-rr / 7.0)) * uGlow * uHalo;
  if (aBody <= 0.0 && beam <= 0.0 && aEye <= 0.0) return vec4(halo, -1.0);
  float di = -body;
  vec3 c = mix(C_PEACH, C_WHITE, smoothstep(0.2, 3.0, di) * 0.9);
  c = mix(C_OR, c, smoothstep(0.0, 0.55, di));
  vec3 hot = lin(c) * (1.0 + 1.6 * smoothstep(0.3, 2.5, di)) * uGlow;
  vec3 b = lin(mix(C_OR, C_PEACH, 0.35)) * 1.4 * uGlow;
  vec3 eyeC = vec3(0.30, 0.10, 0.07);
  float a = aBody + beam * (1.0 - aBody);
  vec3 col = (hot * aBody + b * beam * (1.0 - aBody)) / max(a, 1e-4);
  col = mix(col, eyeC, aEye);
  a = max(a, aEye);
  return vec4(col + halo * (1.0 - a) / max(a, 1e-3), a);
}
void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uK;     // design px, y down
  U = uGeo.z * uK;                                                   // real px per glyph unit
  vec2 g = (px - uGeo.xy) / uGeo.z;
  vec4 r = uForm < 0.5 ? luminous(g) : radiant(g);
  // hidden where the scene is nearer than he is
  float tp = texelFetch(uAux, ivec2(gl_FragCoord.xy), 0).y;
  float vis = smoothstep(uGeo.w - 0.6, uGeo.w - 0.35, tp) * uAlpha;
  if (r.a < 0.0) { o = vec4(r.rgb * vis, 0.0); return; }      // halo only: pure additive light
  r.a *= vis;
  o = vec4(r.rgb * r.a, r.a);
}`;

// ---------------------------------------------------------------- fork option: lines of light
// One instanced quad per world-space segment (a, b), projected with the scene camera. Additive
// linear light: a hot core of width w px plus an exponential glow; hidden where the scene is
// nearer than the line (uDepthK = 1) and never drawn over Clawd (the crisp layer's alpha).
export const LINE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aA; layout(location = 1) in vec3 aB; layout(location = 2) in vec4 aW; layout(location = 3) in vec3 aC;
uniform vec3 uCamPos, uCamFw, uCamR, uCamU; uniform float uF, uK; uniform vec2 uPP, uRes;
out vec2 vP; out vec2 vA; out vec2 vB; out vec4 vW; out vec3 vC; out vec2 vD;
vec2 proj(vec3 p) { vec3 d = p - uCamPos; float z = dot(d, uCamFw); vec2 s = vec2(uPP.x + uF * dot(d, uCamR) / z, uPP.y - uF * dot(d, uCamU) / z); return vec2(s.x, uRes.y / uK - s.y) * uK; }
void main() {
  vec2 a = proj(aA), b = proj(aB);
  float reach = (aW.x * 0.5 + aW.z * 4.0 + 2.0) * uK;
  vec2 d = b - a; float L = length(d);
  vec2 t = L > 1e-4 ? d / L : vec2(1.0, 0.0);
  vec2 n = vec2(-t.y, t.x);
  vec2 c = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec2 p = mix(a - t * reach, b + t * reach, c.x) + n * reach * (c.y * 2.0 - 1.0);
  vP = p; vA = a; vB = b; vW = aW; vC = aC; vD = vec2(length(aA - uCamPos), length(aB - uCamPos));
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
}`;
export const LINE_FS = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vP; in vec2 vA; in vec2 vB; in vec4 vW; in vec3 vC; in vec2 vD;
uniform sampler2D uAux, uClawd; uniform float uK, uDepthK, uClawdK;   // (revision 20) uClawdK 0: lines over the Clawds
out vec4 o;
void main() {
  vec2 pa = vP - vA, ba = vB - vA; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float d = length(pa - ba * h) / uK;
  // complementary one-pixel windows at the ends, so where a polyline's segments meet they add up to
  // one instead of doubling into a bead (points, and segments under 2 px, keep their round light)
  float L = length(ba), along = dot(pa, ba) / max(L, 1e-6);
  float win = L > 2.0 ? clamp(along + 0.5, 0.0, 1.0) * clamp(L - along + 0.5, 0.0, 1.0) : 1.0;
  if (win <= 0.0) discard;
  float hw = max(vW.x * 0.5, 0.35);
  float core = exp(-d * d / (2.0 * hw * hw));
  float glow = exp(-d / max(vW.z, 0.1)) * 0.3;
  float dist = mix(vD.x, vD.y, h);
  float scene = texelFetch(uAux, ivec2(gl_FragCoord.xy), 0).y;
  float vis = mix(1.0, smoothstep(dist - 0.6, dist - 0.15, scene), uDepthK);
  vis *= 1.0 - uClawdK * texelFetch(uClawd, ivec2(gl_FragCoord.xy), 0).a;
  o = vec4(vC * vW.y * (core + glow) * vis * win, 0.0);
}`;

// ---------------------------------------------------------------- fork option (revision 3): ribbons
// A band of luminous paint in the world (S25's protein). The CPU builds it (hillx.js ribbonPass):
// screen-space quads, sorted far to near, drawn premultiplied-over into the composite before bloom,
// so near turns cover far ones like paint while the light still blooms. Per vertex:
//   aP  GL px x, y; camera depth (clip w, so u, v interpolate in perspective); distance (occlusion)
//   aUV u (metres along the band), v (-1..1 across), facing (0 edge-on .. 1 face-on), seed
//   aC  linear colour (intensity folded in), alpha
export const RIBBON_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aP; layout(location = 1) in vec4 aUV; layout(location = 2) in vec4 aC;
uniform vec2 uRes;
out vec4 vUV; out vec4 vC; out float vDist;
void main() {
  vUV = aUV; vC = aC; vDist = aP.w;
  gl_Position = vec4((aP.xy / uRes * 2.0 - 1.0) * aP.z, 0.0, aP.z);
}`;
export const RIBBON_FS = `#version 300 es
precision highp float; precision highp sampler2D;
in vec4 vUV; in vec4 vC; in float vDist;
uniform sampler2D uAux, uClawd; uniform float uPaint, uCore;
out vec4 o;
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  float u = vUV.x, v = vUV.y, face = vUV.z, sd = vUV.w;
  float across = abs(v);
  // a loaded brush: ragged edges, bristle streaks along the band, a little dry-brush breakup
  float wob = (vn(vec2(u * 4.5, sd * 7.0)) - 0.5) * 0.26 + (vn(vec2(u * 15.0, sd * 3.0 + 5.0)) - 0.5) * 0.12;
  float edge = 1.0 - smoothstep(0.7, 0.97, across + wob * uPaint);
  float br = 0.6 * vn(vec2(v * 5.5 + sd * 11.0, u * 1.3)) + 0.4 * vn(vec2(v * 16.0 + sd * 5.0, u * 3.1));
  float dry = smoothstep(0.25, 0.05, vn(vec2(v * 9.0 + sd * 2.0, u * 0.7 + 3.0))) * smoothstep(0.35, 0.9, across);
  float a = clamp(edge * (1.0 - 0.6 * dry * uPaint) * mix(1.0, 0.82 + 0.3 * br, uPaint), 0.0, 1.0) * vC.a;
  vec3 c = vC.rgb * mix(1.0, 0.62 + 0.62 * br, uPaint);
  // lit from within: brighter where the band faces the camera, a hot seam down its middle, and a
  // bright rim where it turns edge-on
  c *= 0.78 + 0.34 * face + 0.35 * (1.0 - face);
  c += vC.rgb * uCore * exp(-across * across * 7.0);
  ivec2 ij = ivec2(gl_FragCoord.xy);
  float scene = texelFetch(uAux, ij, 0).y;
  float vis = smoothstep(vDist - 0.6, vDist - 0.15, scene) * (1.0 - texelFetch(uClawd, ij, 0).a);
  a *= vis;
  if (a <= 0.002) discard;
  o = vec4(c * a, a);
}`;

// ---------------------------------------------------------------- fork option (revision 10): decals
// An image lying in the world (the film's code as text on the ground, along a ring): CPU-built quads
// with RIBBON_VS's vertex layout (clip w = camera depth, so the atlas is sampled in perspective).
// Only the atlas's alpha is used: additive linear light, hidden where the scene is nearer and never
// drawn over a Clawd, as the lines of light are.
export const DECAL_FS = `#version 300 es
precision highp float; precision highp sampler2D;
in vec4 vUV; in vec4 vC; in float vDist;
uniform sampler2D uAux, uClawd, uAtlas;
out vec4 o;
void main() {
  float cov = texture(uAtlas, vUV.xy).a;
  ivec2 ij = ivec2(gl_FragCoord.xy);
  float scene = texelFetch(uAux, ij, 0).y;
  float vis = smoothstep(vDist - 0.6, vDist - 0.15, scene) * (1.0 - texelFetch(uClawd, ij, 0).a);
  float a = cov * vC.a * vis;
  if (a <= 0.002) discard;
  o = vec4(vC.rgb * a, 0.0);
}`;
