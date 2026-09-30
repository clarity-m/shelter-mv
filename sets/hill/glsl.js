// GLSL sources for the hill set. Scene state arrives as uniforms (see hill.js).
import { MAT, HUMAN_PRIMS, CLOUDS, DOME, HILL_EPS } from './scene.js';
import { PAL_KEYS } from './palettes.js';
import { CLIT_GLSL, VOL_BODY } from './clawdlight.js';

const fx = (x) => { const s = (+x).toFixed(5); return s.indexOf('.') < 0 ? s + '.0' : s; };
const g3 = (a) => `vec3(${fx(a[0])},${fx(a[1])},${fx(a[2])})`;

function primExpr(q, p = 'p') {
  if (q.t === 'sph') return `length(${p} - ${g3(q.c)}) - ${fx(q.r)}`;
  if (q.t === 'ell') return `sdEll(${p} - ${g3(q.c)}, ${g3(q.rad)})`;
  if (q.t === 'cap') return `sdCap(${p}, ${g3(q.a)}, ${g3(q.b)}, ${fx(q.r)})`;
  return `sdRC(${p}, ${g3(q.a)}, ${g3(q.b)}, ${fx(q.r)}, ${fx(q.r2)})`;
}
// The seated figure can lean back (uHLean.xy = cos, sin of the torso angle about the hip) and
// lift her head (uHLean.zw, about the neck). HUMAN_PRIMS order: 0 pelvis, 1-4 torso and shoulders,
// 5 neck, 6-8 head and hair, 9-14 legs, 15-20 arms and hands.
const HEAD = new Set([6, 7, 8]), UPPER = new Set([1, 2, 3, 4, 5, 15, 16, 17, 18, 19, 20]);
const pvar = (i) => (HEAD.has(i) ? 'pH' : UPPER.has(i) ? 'pU' : 'p');
const LEAN = '  vec3 pU = humanRot(p, vec2(-0.02, 0.16), uHLean.xy);\n  pU = humanRotYZ(pU, vec2(0.16, 0.0), uHTilt);\n  vec3 pH = humanRot(pU, vec2(0.1, 0.66), uHLean.zw);\n  pH = humanRotXZ(pH, vec2(0.1, 0.0), uHYaw);\n';
function sdfCode(prims, name) {
  let s = `float ${name}(vec3 p, out int mat, out int part) {\n  float d = 1e9, di; mat = 0; part = 0;\n${LEAN}`;
  prims.forEach((q, i) => { s += `  di = ${primExpr(q, pvar(i))};\n  if (di < d) { mat = ${q.mat}; part = ${q.part}; }\n  d = smin(d, di, ${fx(q.k || 0.001)});\n`; });
  return s + '  return d;\n}\n';
}
function sdfCodeD(prims, name) {
  let s = `float ${name}(vec3 p) {\n  float d = 1e9;\n${LEAN}`;
  prims.forEach((q, i) => { s += `  d = smin(d, ${primExpr(q, pvar(i))}, ${fx(q.k || 0.001)});\n`; });
  return s + '  return d;\n}\n';
}

// ---------------------------------------------------------------- shared declarations
export const SCENE_DECL = `
uniform vec2 uRes;
uniform vec3 uCamPos, uCamFw, uCamR, uCamU; uniform float uF; uniform vec2 uPP;
uniform vec3 uSun;
uniform vec4 uHillA[4]; uniform vec4 uHillS[4];
uniform float uMaxH;
uniform float uHumanOn; uniform vec3 uHPos, uHF, uHR; uniform vec4 uHB; uniform vec4 uHLean; uniform vec2 uHTilt;
uniform vec2 uHYaw;   // (revision 20) her head's turn about the neck: cos, sin
uniform vec4 uRingLand;   // (revision 20, A/B still) the habitat's land band: strength, half-width, wave arc, wave strength
uniform float uTreeOn; uniform vec3 uTPos; uniform vec4 uTB; uniform vec4 uTrA[4]; uniform vec4 uTrB[4]; uniform vec4 uCan[11]; uniform vec4 uCanG[11]; uniform float uCanK, uLeafAmp;
uniform vec4 uCGlow; uniform float uAuraK, uAuraS;
uniform int uNTow; uniform vec4 uTowA[64]; uniform vec4 uTowB[64]; uniform float uTowWin, uTowEdge, uCityPulse, uTime;
uniform vec4 uRingC, uRingN; uniform vec3 uRingE1; uniform float uRing;
uniform vec3 uCloudOff;
uniform float uGridA, uFloorGrid, uFog, uTowFog;
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
vec3 humanRot(vec3 p, vec2 pv, vec2 cs) { vec2 d = p.xy - pv; return vec3(vec2(cs.x * d.x + cs.y * d.y, -cs.y * d.x + cs.x * d.y) + pv, p.z); }
vec3 humanRotYZ(vec3 p, vec2 pv, vec2 cs) { vec2 d = p.yz - pv; return vec3(p.x, vec2(cs.x * d.x + cs.y * d.y, -cs.y * d.x + cs.x * d.y) + pv); }
vec3 humanRotXZ(vec3 p, vec2 pv, vec2 cs) { vec2 d = p.xz - pv; vec2 r = vec2(cs.x * d.x + cs.y * d.y, -cs.y * d.x + cs.x * d.y) + pv; return vec3(r.x, p.y, r.y); }
float PIXANG() { return (1920.0 / uRes.x) / uF; }
vec3 camRay(vec2 px) { return normalize(uCamFw + uCamR * (px.x - uPP.x) / uF + uCamU * (uPP.y - px.y) / uF); }
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
  return d;
}
float mapD(vec3 p) {
  float d = (p.y - hillS(p.xz)) * 0.72;
  if (uHumanOn > 0.5) { float bh = length(p - uHB.xyz) - uHB.w; d = min(d, bh < d ? sdHumanLD(toHuman(p)) : bh + 0.01); }
  if (uTreeOn > 0.5) { float bt = length(p - uTB.xyz) - uTB.w; d = min(d, bt < d ? sdTreeLD(p - uTPos) * 0.85 : bt + 0.01); }
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
${SCENE_DECL}
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
vec3 horizonFog(vec3 rd) { return skyBase(normalize(vec3(rd.x, 0.015, rd.z))); }
// (revision 20, an A/B still only) the habitat's land in place of the abstract ring: a wide band of
// fields, a river with glints and settlement lights on the ring's plane, rising from both horizons and
// arcing overhead, hazed by distance; the vocal drop's wave runs along it (uRingLand: strength, band
// half-width m, wave front arc position m, wave strength). Off (x = 0) everywhere else.
vec4 ringLand(vec3 rd) {
  vec3 n = uRingN.xyz; float den = dot(rd, n);
  if (abs(den) < 1e-5) return vec4(0.0);
  float t = dot(uRingC.xyz - uCamPos, n) / den;
  if (t <= 0.0) return vec4(0.0);
  vec3 q = uCamPos + rd * t - uRingC.xyz;
  float r = length(q) - uRingC.w, HW = uRingLand.y;
  float pw = PIXANG() * t / max(abs(den), 0.06);
  float cov = smoothstep(HW + pw, HW - pw, abs(r)) * smoothstep(-0.03, 0.02, rd.y);
  if (cov <= 0.0) return vec4(0.0);
  vec3 e2 = cross(n, uRingE1);
  float ang = atan(dot(q, e2), dot(q, uRingE1));
  float s = (ang + 1.5708) * uRingC.w;                       // arc length from the crown (m)
  // fields: a patchwork of long plots across the band, each strip across it cut to its own lengths
  float row = floor(r / 15.0), segL = 14.0 + 22.0 * hash13(vec3(row, 1.1, 2.2));
  vec2 cell = vec2(floor(s / segL + hash13(vec3(row, 3.3, 4.4))), row);
  float h1 = hash13(vec3(cell, 3.7)), h2 = hash13(vec3(cell, 9.1));
  vec3 fc = h1 < 0.3 ? vec3(0.30, 0.52, 0.28) : h1 < 0.55 ? vec3(0.62, 0.62, 0.30) : h1 < 0.8 ? vec3(0.22, 0.46, 0.40) : vec3(0.45, 0.58, 0.32);
  fc *= 0.85 + 0.3 * h2;
  vec2 fr = fract(vec2(s / segL + hash13(vec3(row, 3.3, 4.4)), r / 15.0));
  float hedge = smoothstep(0.0, 0.06, min(min(fr.x, 1.0 - fr.x), min(fr.y, 1.0 - fr.y)));
  fc *= 0.8 + 0.2 * hedge;
  // a river meandering along the band, silver with glints
  float rv = 22.0 * sin(s / 140.0) + 9.0 * sin(s / 53.0 + 1.3);
  float wv = smoothstep(4.0 + pw, 4.0 - pw, abs(r - rv));
  float glint = step(0.93, hash13(vec3(floor(s / 3.0), floor(r / 2.0), 5.3))) * wv;
  fc = mix(fc, vec3(0.55, 0.66, 0.85), wv) + vec3(1.0, 0.95, 0.85) * glint * 1.2;
  // settlements: warm lights in clusters
  float hs = hash13(vec3(cell, 12.5));
  vec3 lc = vec3(0.0);
  if (hs < 0.16) {
    for (int k = 0; k < 5; k++) {
      vec2 lp = vec2((cell.x - hash13(vec3(row, 3.3, 4.4)) + 0.2 + 0.6 * hash13(vec3(cell, float(k) + 20.0))) * segL, (cell.y + 0.2 + 0.6 * hash13(vec3(cell, float(k) + 40.0))) * 15.0);
      float dl = length(vec2(s, r) - lp);
      lc += vec3(1.0, 0.78, 0.5) * exp(-dl * dl / (2.0 * pow(max(1.0, pw), 2.0))) * 1.6;
    }
  }
  // the walls: a thin bright rim at both edges (the old ring's light)
  float rim = exp(-pow((abs(r) - HW) / (pw * 1.4 + 0.5), 2.0));
  // haze by distance, lighter toward the crown
  vec3 sky = skyBase(rd);
  vec3 c = mix(fc * 0.9, sky, 0.38 + 0.2 * smoothstep(0.1, 0.6, rd.y)) + lc + P_RING * rim * 0.6;
  // the wave runs along the land from both feet up to the crown
  float dw = abs(abs(s) - uRingLand.z);
  c += vec3(1.0, 0.75, 0.48) * uRingLand.w * (exp(-dw * dw / 180.0) + 0.25 * step(abs(s), uRingLand.z) * exp(-(uRingLand.z - abs(s)) / 80.0));
  return vec4(c, cov);
}
vec3 skyColor(vec3 rd) {
  vec3 c = skyBase(rd) + sunHalo(rd);
  float el, mer; float g = domeLines(rd, el, mer);
  float glowMask = 1.0 - 0.8 * exp(-(1.0 - dot(rd, uSun)) * 30.0);
  c = mix(c, c * 1.18 + A_GRID * 0.03, g * uGridA * glowMask);
  if (uRingLand.x > 0.0) { vec4 L = ringLand(rd); c = mix(c, L.rgb, L.a * uRingLand.x); }
  else { float rc; vec3 ring = ringLight(rd, rc); c = mix(c, c * 0.93 + P_RING * 0.05, rc * uRing * 0.6) + ring; }
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
vec3 shadeHit(Hit h, vec3 rd) {
  if (h.mat == M_SKY) return skyColor(rd);
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
    c = mix(c, horizonFog(rd), fog * uTowFog);
    return c + towerGlow(h.part, p, n, h.t) * (1.0 - 0.45 * fog * uTowFog);
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
uniform float uSalt, uCell, uSkip, uKeep, uBloom, uMoteNear, uMoteRise;
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
    vec2 pos = sp + dir * corner.x * len * 0.5 + nrm * corner.y * wid * 0.5;
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
export const COMP_FS = `#version 300 es
precision highp float;
uniform sampler2D uPaint, uClawd; uniform vec2 uRes;
out vec4 o;
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(uPaint, ij, 0).rgb;
  vec4 k = texelFetch(uClawd, ij, 0);
  o = vec4(c * (1.0 - k.a) + k.rgb, 1.0);
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
uniform vec4 uWave;   // (revision 19) the vocal drop's wave: centre x, z, radius (m), strength
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
    if (uWave.w > 0.0) {
      // the wave's front makes the contours flare as it crosses them
      float dw = length(p.xz - uWave.xy) - uWave.z, wW = 0.5 + 0.05 * uWave.z;
      g += vec3(1.0, 0.8, 0.55) * ln * uContour * fadeH * 2.6 * uWave.w * exp(-dw * dw / (2.0 * wW * wW));
    }
  }
  if (uWave.w > 0.0 && (mat == M_HILL || mat == M_FLOOR || mat == M_TOWER)) {
    // (revision 19) the wave of warm light: a bright front running out from the pair across the land
    // and through the towers, a faint afterglow behind it (the tree and the pair are left to their own
    // light)
    float dw = length(p.xz - uWave.xy) - uWave.z, wW = 0.3 + 0.04 * uWave.z;
    float front = exp(-dw * dw / (2.0 * wW * wW)), trail = dw < 0.0 ? exp(dw / (1.0 + 0.15 * uWave.z)) : 0.0;
    g += vec3(1.0, 0.72, 0.44) * uWave.w * (mat == M_TOWER ? 0.8 : 0.55) * (front + 0.12 * trail);
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
export const CLAWD_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uAux; uniform vec2 uRes; uniform float uK;
uniform vec4 uGeo; uniform float uForm, uSit, uGlow, uRays, uAlpha, uEyeLight;
uniform int uGridOn; uniform int uGB[24]; uniform vec4 uEye;
uniform float uHalo;   // (revision 23) the radiant form's flat 2D halo (1; S31 uses the world's glow instead)
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
vec3 clawd(vec2 p, float rb, float ra, float rl, float re, float k, float kl) {
  float sy = 2.0 * uSit;
  float d = sdRoundBox(p, vec2(9.0, 4.0 + sy), vec2(6.0, 4.0), rb);
  d = smin(d, sdRoundBox(p, vec2(9.0, 5.0 + 2.0 * sy), vec2(8.0, 1.0), ra), k);
  float legL = 1.25 * (1.0 - uSit);
  if (legL > 0.02) {
    d = smin(d, sdRoundBox(p, vec2(4.5, 10.0 - legL), vec2(0.5, legL), rl), kl);
    d = smin(d, sdRoundBox(p, vec2(6.5, 10.0 - legL), vec2(0.5, legL), rl), kl);
    d = smin(d, sdRoundBox(p, vec2(11.5, 10.0 - legL), vec2(0.5, legL), rl), kl);
    d = smin(d, sdRoundBox(p, vec2(13.5, 10.0 - legL), vec2(0.5, legL), rl), kl);
  }
  float eo = uEye.z, rr = min(re, 1.0 * eo);
  float eye = eo < 0.05 ? 1e9 : min(sdRoundBox(p, vec2(5.5 + uEye.x, 3.0 + sy + uEye.y), vec2(0.5, 1.0 * eo), rr),
                                    sdRoundBox(p, vec2(12.5 + uEye.x, 3.0 + sy + uEye.y), vec2(0.5, 1.0 * eo), rr));
  if (uEye.w > 0.001 && eo >= 0.05) {
    // (revision 22) his smile, ^^, in this vector style: each eye becomes a small arch stroke inside the
    // open eye's own footprint (about one unit across), and uEye.w morphs the open eye into it (0..1)
    float ea = 1e9;
    for (int e = 0; e < 2; e++) {
      vec2 d = p - vec2((e == 0 ? 5.5 : 12.5) + uEye.x, 3.0 + sy + uEye.y + 0.22);
      const float R = 0.33, T = 0.42;
      ea = min(ea, d.y <= 0.0 ? abs(length(d) - R) - 0.5 * T : length(vec2(abs(d.x) - R, d.y)) - 0.5 * T);
    }
    eye = mix(eye, ea, clamp(uEye.w, 0.0, 1.0));
  }
  return vec3(max(d, -eye), eye, d);
}
// The same three distances from a sprite grid (clawd-pose.js): 22 x 8 cells of 1 x 2 units, the
// canonical glyph at cols 2..19 and rows 3..7. x = body with the holes carved, y = holes,
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
// rung 4: chamfered bevel with crisp miters, inner light, eyes lit from within
vec4 luminous(vec2 g) {
  vec3 s = clawdL(g);
  float d = s.x;
  if (uGridOn == 1 && s.z > 0.0) {
    float da = clawdGrid(g).w;
    if (da < 0.02) return vec4(lin(C_GOLD) * 1.6 * uGlow, cover(da));
  }
  if (s.y < 0.02 && s.z < 0.0) {
    float e = clamp(-s.y / 0.5, 0.0, 1.0);
    return vec4(lin(mix(C_GOLD, C_WHITE, e)) * (1.4 + 1.2 * uEyeLight), 1.0);
  }
  float a = cover(d);
  if (a <= 0.0) return vec4(0.0);
  float di = -d;
  vec3 c;
  if (di < 0.85) {
    const float e = 0.01;
    float gx = clawdL(g + vec2(e, 0.0)).x - clawdL(g - vec2(e, 0.0)).x;
    float gy = clawdL(g + vec2(0.0, e)).x - clawdL(g - vec2(0.0, e)).x;
    vec2 gn = normalize(vec2(gx, gy) + 1e-9);
    vec3 L4 = normalize(vec3(-0.5, -0.78, 0.75));
    float diff = max(0.0, dot(normalize(vec3(gn, 1.0)), L4));
    c = mix(C_DEEP, C_PEACH, pow(diff, 1.6));
    if (s.y < 0.9) c = mix(c, C_GOLD, 0.35 * (1.0 - s.y / 0.9));
  } else {
    float glow = smoothstep(0.7, 3.2, di), top = clamp(1.0 - g.y / 8.0, 0.0, 1.0);
    c = mix(C_OR, C_PEACH, 0.1 * glow + 0.05 * top);
  }
  float emit = di < 0.85 ? 1.0 : 1.0 + 0.1 * smoothstep(0.7, 3.2, di);
  return vec4(lin(c) * uGlow * emit, a);
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

// (revision 23) Clawd's glow in the air around him (clawdlight.js VOL_BODY), shadowed by her body
export const CLAWDVOL_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
${SCENE_DECL}
${sdfCodeD(HUMAN_PRIMS, 'sdHumanLD')}
float volOcc(vec3 p) { return sdHumanLD(toHuman(p)); }
${VOL_BODY}`;

// ---------------------------------------------------------------- the shelter's people (S31)
// Kites of glowing paper over the far slopes (string, tail) and a few tiny faceless figures on
// the far ridge. Screen-space SDFs placed by projecting world anchors (hill.js), depth-tested
// against the scene, drawn premultiplied over the lit world before bloom.
export const EXTRAS_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
uniform sampler2D uAux; uniform vec2 uRes; uniform float uK;
uniform int uNKite, uNPer;
uniform vec4 uKA[4], uKB[4], uKC[4];
uniform vec4 uPA[8], uPB[8], uPC[8];
uniform vec3 uWarm, uCool;
uniform int uNTre; uniform vec4 uRA[12], uRB[12], uRC[12];   // (revision 20) cloud-pruned pines: A base x, y (design px), px per m, depth m;
//   B grow, height m, seed, lean (-1, 1); C style, pads, trunk thickness, shade
uniform vec2 uSunPx;                                  // (revision 23) the sun on screen (design px): the trees' rim light
uniform vec3 uHaze, uHazeT; uniform float uTreeFog, uTime;   // (revision 23) the trees' distance haze (linear: foliage, bark), per m
out vec4 o;
float hsh(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hsh(i), hsh(i + vec2(1, 0)), f.x), mix(hsh(i + vec2(0, 1)), hsh(i + vec2(1, 1)), f.x), f.y); }
float sminT(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / max(k, 1e-6); return min(a, b) - h * h * k * 0.25; }
// a segment's distance, position along it (0..1) and signed side (+ to the left of a -> b)
vec3 segI(vec2 q, vec2 a, vec2 b) {
  vec2 ba = b - a, pa = q - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  float d = length(pa - ba * h);
  return vec3(d, h, ba.x * pa.y - ba.y * pa.x >= 0.0 ? d : -d);
}
// kites  A: x, y (design px), px per m, angle; B: string end x, y, alpha, tail phase; C: depth m, glow
// people A: feet x, y, px per m, depth m; B: alpha, arm up, scale, flip; C: walk phase, walk amp, glow
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0); return length(pa - ba * h); }
vec4 over(vec4 acc, vec3 c, float a) { return vec4(acc.rgb * (1.0 - a) + c * a, acc.a * (1.0 - a) + a); }
void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uK;
  float tPix = texelFetch(uAux, ivec2(gl_FragCoord.xy), 0).y;
  vec4 acc = vec4(0.0);
  vec3 add = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    if (i >= uNPer) break;
    vec4 A = uPA[i], B = uPB[i], C = uPC[i];
    if (B.x <= 0.0) continue;
    float s = A.z * B.z;
    vec2 q = (px - A.xy) / s; q.y = -q.y;
    float side = q.x;
    if (B.w > 0.5) q.x = -q.x;
    if (abs(q.x) > 1.2 || q.y < -0.3 || q.y > 2.6) continue;
    float sw = sin(C.x) * C.y;
    float d = length(q - vec2(0.0, 1.6)) - 0.115;
    d = min(d, sdSeg(q, vec2(0.0, 0.98), vec2(0.0, 1.36)) - 0.15);
    d = min(d, sdSeg(q, vec2(-0.07, 0.9), vec2(-0.08 + sw * 0.25, 0.06)) - 0.06);
    d = min(d, sdSeg(q, vec2(0.07, 0.9), vec2(0.09 - sw * 0.25, 0.06)) - 0.06);
    d = min(d, sdSeg(q, vec2(-0.17, 1.36), vec2(-0.21 - sw * 0.12, 0.93)) - 0.05);
    d = min(d, sdSeg(q, vec2(0.17, 1.36), mix(vec2(0.21 + sw * 0.12, 0.93), vec2(0.34, 1.98), B.y)) - 0.05);
    float pxm = 1.0 / (s * uK);
    float cov = clamp(0.5 - d / pxm, 0.0, 1.0);
    float vis = smoothstep(A.w - 3.0, A.w - 1.0, tPix);
    float glow = C.z;
    add += uWarm * glow * exp(-max(d, 0.0) / 0.25) * 0.35 * vis;
    if (cov <= 0.0) continue;
    float rim = clamp(1.0 + d / (pxm * 2.2), 0.0, 1.0) * smoothstep(-0.25, 0.25, side);
    vec3 c = uCool + uWarm * (0.55 * rim + 0.08 + 1.2 * glow);
    acc = over(acc, c, cov * vis * B.x * 0.9);
  }
  for (int i = 0; i < 4; i++) {
    if (i >= uNKite) break;
    vec4 A = uKA[i], B = uKB[i], C = uKC[i];
    if (B.z <= 0.0) continue;
    float s = A.z, pxm = 1.0 / (s * uK);
    float vis = smoothstep(C.x - 3.0, C.x - 0.5, tPix);
    vec2 k1 = B.xy, mid = mix(A.xy, k1, 0.5) + vec2(0.0, length(k1 - A.xy) * 0.07);
    float dS = min(sdSeg(px, A.xy, mid), sdSeg(px, mid, k1)) * uK;
    add += uWarm * exp(-dS * dS / 0.45) * 0.22 * B.z * vis;
    vec2 q = (px - A.xy) / s; q.y = -q.y;
    if (abs(q.x) > 2.4 || q.y > 1.9 || q.y < -5.4) continue;
    float ca = cos(A.w), sa = sin(A.w);
    vec2 r = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
    r /= 1.55;                                                    // a big kite: 1.1 m across
    float dk = (abs(r.x) / 0.36 + abs(r.y - 0.08) / (r.y > 0.08 ? 0.4 : 0.6) - 1.0) * 0.27 * 1.55;
    float covk = clamp(0.5 - dk / pxm, 0.0, 1.0);
    float spar = min(abs(r.x), abs(r.y - 0.08));
    float dt = 1e9; vec2 prev = vec2(0.0, -0.52);
    for (int j = 1; j <= 7; j++) {
      float u = float(j) / 7.0;
      vec2 cur = vec2(0.2 * sin(B.w + u * 5.5) * u, -0.52 - u * 2.3);
      dt = min(dt, sdSeg(r, prev, cur)); prev = cur;
    }
    add += uWarm * exp(-pow(dt * 1.55 / (pxm * 1.3), 2.0)) * 0.8 * B.z * vis;
    vec3 paper = uWarm * (2.3 + C.y) * (1.0 - 0.4 * exp(-spar * spar * 2.4 / (pxm * pxm * 1.5)));
    acc = over(acc, paper, covk * vis * B.z);
    add += uWarm * exp(-max(dk, 0.0) / 0.5) * 0.35 * B.z * vis;
  }
  for (int i = 0; i < 12; i++) {
    if (i >= uNTre) break;
    vec4 A = uRA[i], B = uRB[i], C = uRC[i];
    if (B.x <= 0.0) continue;
    // a cloud-pruned garden pine (niwaki; revision 20, Claire), each in its own classic style (C.x: 0 formal
    // upright, 1 informal upright, 2 slanting, 3 windswept, 4 a broad low twin-trunk spreader), with its own
    // number of pads (C.y), trunk (C.z), shade (C.w) and lean (B.w); it rises and its pads fill out, bottom
    // up, as the wave passes.
    // (revision 23, Claire: finished like the rest of the world) The pads are clumps of the main tree's teal
    // foliage, each clump its own dome: sky light on the tops, the low sun's warm rim on the edges that face
    // it, dappled light, darker undersides and folds, a few of the canopy's gold glints. The trunk tapers from
    // a root flare, rounded, with bark striations, rimmed by the sunset and shaded under the pads. A soft
    // contact shadow grounds it, and its greens haze with distance.
    float s = A.z, pxm = 1.0 / (s * uK), g = B.x, hT = B.y * (0.3 + 0.7 * g), sd = B.z, ln = B.w;
    int style = int(C.x + 0.5); float np = C.y, th = C.z;
    vec2 q = (px - A.xy) / s; q.y = -q.y;                               // metres, y up from the base
    if (abs(q.x) > 1.0 * hT + 4.0 * pxm || q.y < -0.06 * hT - 4.0 * pxm || q.y > 1.25 * hT) continue;
    float vis = smoothstep(A.w - 3.0, A.w - 1.0, tPix), grown = min(1.0, g * 1.6);
    float fz = 1.0 - exp(-max(A.w - 7.0, 0.0) * uTreeFog);             // its distance haze
    // the contact shadow: a soft dark pool at its foot, on the ground at its own depth only
    float onGround = 1.0 - smoothstep(3.0, 8.0, abs(tPix - A.w));
    float cs = exp(-pow(q.x / (0.3 * hT), 2.0) - pow((q.y + 0.008 * hT) / (0.03 * hT + 2.0 * pxm), 2.0));
    acc = over(acc, mix(vec3(0.012, 0.02, 0.02), uHazeT * 0.5, fz), cs * onGround * 0.6 * grown);
    vec2 k1, k2, k3;
    if (style == 0) { k1 = vec2(0.02, 0.33); k2 = vec2(-0.01, 0.6); k3 = vec2(0.01, 0.93); }
    else if (style == 1) { k1 = vec2(0.13, 0.33); k2 = vec2(0.05, 0.6); k3 = vec2(0.2, 0.86); }
    else if (style == 2) { k1 = vec2(0.16, 0.3); k2 = vec2(0.34, 0.54); k3 = vec2(0.52, 0.76); }
    else if (style == 3) { k1 = vec2(0.1, 0.3); k2 = vec2(0.22, 0.52); k3 = vec2(0.38, 0.72); }
    else { k1 = vec2(0.07, 0.22); k2 = vec2(0.02, 0.4); k3 = vec2(0.12, 0.56); }
    vec2 t0 = vec2(0.0), t1 = vec2(ln * k1.x, k1.y) * hT, t2 = vec2(ln * k2.x, k2.y) * hT, t3 = vec2(ln * k3.x, k3.y) * hT;
    float w0 = 0.05 * th * hT;
    // the trunk: three tapering segments joined smoothly, flaring at the root; its cross-section coordinate
    // (-1..1) and axis come from the nearest part, for the round shading and the bark
    vec3 sa = segI(q, t0, t1), sb = segI(q, t1, t2), sc = segI(q, t2, t3);
    float flare = 0.9 * w0 * exp(-max(q.y, 0.0) / (0.045 * hT));
    float wa = mix(w0, 0.76 * w0, sa.y) + flare, wb = mix(0.76 * w0, 0.56 * w0, sb.y), wc = mix(0.56 * w0, 0.34 * w0, sc.y);
    float da = sa.x - wa, db = sb.x - wb, dc = sc.x - wc;
    vec2 ax = normalize(t1 - t0 + vec2(0.0, 1e-4)); float uT = sa.z / wa;
    if (db < da && db <= dc) { ax = normalize(t2 - t1); uT = sb.z / wb; }
    else if (dc < da) { ax = normalize(t3 - t2); uT = sc.z / wc; }
    float dT = sminT(sminT(da, db, 0.5 * w0), dc, 0.4 * w0), dNear = min(da, min(db, dc));
    if (style == 4) {                                                   // the twin's stem
      vec2 u0 = t1 * 0.45, u1 = vec2(-ln * 0.17, 0.3) * hT, u2 = vec2(-ln * 0.32, 0.46) * hT;
      vec3 s4 = segI(q, u0, u1), s5 = segI(q, u1, u2);
      float w4 = mix(0.62, 0.5, s4.y) * w0, w5 = mix(0.5, 0.36, s5.y) * w0;
      float d4 = s4.x - w4, d5 = s5.x - w5;
      if (min(d4, d5) < dNear) { dNear = min(d4, d5); if (d4 < d5) { ax = normalize(u1 - u0); uT = s4.z / w4; } else { ax = normalize(u2 - u1); uT = s5.z / w5; } }
      dT = sminT(dT, sminT(d4, d5, 0.3 * w0), 0.35 * w0);
    }
    // the pads: five clumps each (the middle ones higher), smoothly joined, leafy at the edge, flat beneath
    float dP = 1e9, hB = -1e9, hB2 = -1e9, padLow = 0.0, bB = 1.0; vec2 eB = vec2(0.0), eP = vec2(0.0);
    for (int k = 0; k < 5; k++) {
      float fk = float(k);
      if (fk >= np) break;
      float fr = np > 1.0 ? fk / (np - 1.0) : 1.0;                        // 0 the lowest pad .. 1 the crown
      float hk = fract(sin(sd * 13.1 + fk * 7.7) * 4375.85), alt = mod(fk, 2.0) < 0.5 ? -1.0 : 1.0;
      float y, off, a, b = 0.075, side;
      if (style == 0) { y = mix(0.36, 0.95, fr); side = fr > 0.99 ? 0.0 : alt; off = 0.17 * (1.0 - 0.5 * fr); a = 0.32 - 0.16 * fr; }
      else if (style == 1) { y = mix(0.42, 0.93, fr); side = fr > 0.99 ? ln * 0.4 : -ln * alt; off = 0.2; a = 0.29 - 0.1 * fr; }
      else if (style == 2) { y = mix(0.34, 0.82, fr); side = mod(fk, 2.0) < 0.5 ? ln : -ln * 0.35; off = 0.17; a = 0.26 - 0.06 * fr; }
      else if (style == 3) { y = mix(0.34, 0.78, fr); side = ln; off = 0.22 + 0.22 * fr; a = 0.3 - 0.05 * fr; b = 0.056; }
      else { y = mix(0.3, 0.64, fr); side = alt * ln; off = 0.3 - 0.1 * fr; a = 0.42 - 0.12 * fr; b = 0.07; }
      y = (y + 0.03 * (hk - 0.5)) * hT;
      float tx = y <= t1.y ? mix(t0.x, t1.x, y / max(t1.y, 1e-4)) : y <= t2.y ? mix(t1.x, t2.x, (y - t1.y) / max(t2.y - t1.y, 1e-4))
                : mix(t2.x, t3.x, clamp((y - t2.y) / max(t3.y - t2.y, 1e-4), 0.0, 1.0));
      if (style == 4 && side * ln < 0.0) { vec2 u1 = vec2(-ln * 0.17, 0.3) * hT, u2 = vec2(-ln * 0.32, 0.46) * hT; tx = mix(u1.x, u2.x, clamp((y - u1.y) / max(u2.y - u1.y, 1e-4), 0.0, 1.0)); }
      float grow = smoothstep(0.12 * fk, 0.12 * fk + 0.45, g);
      a *= hT * (0.85 + 0.3 * hk) * grow; b *= hT * (0.9 + 0.2 * hk) * (0.4 + 0.6 * grow) * 1.25;
      if (a <= 0.0) continue;
      vec2 c = vec2(tx + side * off * hT, y);
      if (style == 3) c.x += ln * 0.35 * a;                               // the windswept pads stream downwind
      float dPad = 1e9;
      for (int m = 0; m < 5; m++) {
        float fm = float(m) - 2.0, am = abs(fm);
        float hm = fract(sin(sd * 21.7 + fk * 5.3 + fm * 3.1) * 4375.85);
        vec2 cm = c + vec2(fm * 0.3 * a + (hm - 0.5) * 0.16 * a, (0.42 - 0.16 * am) * b + (hm - 0.5) * 0.26 * b);
        vec2 rr = vec2((0.36 - 0.035 * am) * a, (1.0 - 0.14 * am) * b) * (0.88 + 0.24 * hm);
        vec2 e = (q - cm) / rr;
        float hg = 1.0 - dot(e, e);                                     // this clump's dome height here
        if (hg > hB) { hB2 = hB; hB = hg; eB = e; } else if (hg > hB2) hB2 = hg;
        dPad = sminT(dPad, (length(e) - 1.0) * min(rr.x, rr.y), 0.35 * b);
      }
      dPad += (vn(q * 5.0 + vec2(sd * 7.3, fk * 1.7)) - 0.5) * 0.12 * b + (vn(q * 13.0 + vec2(sd * 3.1, fk)) - 0.5) * 0.05 * b;
      float bottom = c.y - 0.35 * b + (vn(vec2(q.x * 4.0, sd + fk)) - 0.5) * 0.12 * b;
      dPad = max(dPad, bottom - q.y);
      if (dPad < dP) { padLow = bottom; bB = b; eP = (q - c - vec2(0.0, 0.3 * b)) / vec2(1.05 * a, 1.3 * b); }
      dP = min(dP, dPad);
      // a branch from the trunk into the pad
      vec3 sr = segI(q, vec2(tx, y - 0.2 * b), c - vec2(0.0, 0.1 * b));
      float wr = 0.02 * th * hT * (1.0 - 0.4 * sr.y), dr = sr.x - wr;
      if (dr < dNear) { dNear = dr; ax = normalize(c - vec2(tx, y - 0.2 * b) + vec2(1e-4, 0.0)); uT = sr.z / wr; }
      dT = sminT(dT, dr, 0.3 * w0);
    }
    float d = min(dT, dP);
    float cov = clamp(0.5 - d / pxm, 0.0, 1.0);
    if (cov <= 0.0) continue;
    vec2 sunD = normalize(vec2(uSunPx.x - A.x, A.y - uSunPx.y) + vec2(1e-4, 0.0));   // toward the sun, y up
    vec3 warm = vec3(1.0, 0.7, 0.44), c, rimC;
    if (dP < dT) {
      // each clump's dome, blended with the whole pad's, so the pad reads as one mass with soft lumps
      vec3 n = normalize(mix(normalize(vec3(eB, sqrt(max(hB, 0.0)) + 0.15)),
                             normalize(vec3(eP, sqrt(max(1.0 - dot(eP, eP), 0.0)) + 0.15)), 0.5));
      vec3 leaf = mix(vec3(0.022, 0.070, 0.068), vec3(0.034, 0.088, 0.050), C.w);   // the main tree's teal .. greener
      float sky = 0.5 + 0.5 * n.y;
      float low = smoothstep(0.0, 0.6 * bB, q.y - padLow);                // the underside in shade
      float fold = smoothstep(0.0, 0.22, hB - hB2);                       // where two clumps meet
      float dap = smoothstep(0.5, 0.8, vn(q * 2.6 + vec2(sd * 5.1, 0.0))) * smoothstep(-0.1, 0.7, n.y);
      // the low sun behind it: a warm rim a few pixels deep along the silhouette's sun side, and the sunward
      // flanks of the clumps glowing through
      float face = max(dot(normalize(eB + 1e-5), sunD), 0.0);
      float rim = exp(max(dP, -40.0 * pxm) / (2.4 * pxm)) * (0.1 + 0.9 * face) + 0.28 * pow(clamp(1.0 - n.z, 0.0, 1.0), 1.3) * face;
      float core = 0.72 + 0.28 * smoothstep(0.0, 3.0 * w0, dT);             // darker where the trunk enters
      float mott = 0.84 + 0.32 * vn(q * 7.0 + vec2(sd * 2.3, 0.0));        // leafy mottling, like the canopy's paint
      c = leaf * (0.7 + 1.4 * sky) * (0.35 + 0.65 * low) * (0.8 + 0.2 * fold) * core * mott
        + leaf * vec3(3.2, 3.4, 1.6) * dap * low * 0.9;
      rimC = warm * rim * 1.1 * (0.3 + 0.7 * low);
      // the canopy's gold glints, twinkling
      vec2 gc = floor(q / 0.22), gp = (gc + vec2(hsh(gc + sd), hsh(gc + sd + 7.1))) * 0.22;
      float gl = step(0.86, hsh(gc * 1.3 + sd * 3.0)) * exp(-dot(q - gp, q - gp) / (pxm * pxm * 1.5));
      c += vec3(1.0, 0.8, 0.46) * gl * max(0.0, 0.45 + 0.55 * sin(uTime * (1.5 + 2.0 * hsh(gc)) + 6.28 * hsh(gc + 3.3))) * 0.8;
    } else {
      float u = clamp(uT, -1.0, 1.0), rnd = sqrt(max(1.0 - u * u, 0.0));
      vec2 nrm = vec2(-ax.y, ax.x) * sign(u + 1e-6);
      float stri = vn(vec2(u * 2.2 + sd * 3.0, dot(q, ax) / max(w0, 1e-3) * 0.9));
      vec3 bark = vec3(0.07, 0.056, 0.05) * (0.7 + 0.6 * stri);
      float rimT = (0.35 * pow(abs(u), 2.0) + exp(max(dT, -40.0 * pxm) / (1.8 * pxm))) * max(dot(nrm, sunD), 0.0);
      float padShade = smoothstep(0.0, 0.25 * hT, dP);                    // in the shade just under a pad
      c = bark * (0.6 + 0.9 * rnd) * (0.72 + 0.28 * padShade);
      rimC = warm * rimT * 1.0 * (0.4 + 0.6 * padShade);
    }
    c = mix(c, dP < dT ? uHaze : uHazeT, fz) + rimC * (1.0 - 0.45 * fz);   // the haze, and the sun's rim through it
    acc = over(acc, c, cov * vis * grown);
  }
  o = vec4(acc.rgb + add * (1.0 - acc.a), acc.a);
}`;
