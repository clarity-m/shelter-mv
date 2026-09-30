// GLSL shared by the backlit-paper sets, taken from style-frames/13-paper-swarm so the
// card bookends and the swarm grade and texture identically.
//   NOISE  hashes, gradient noise, fbm, 3D value noise
//   PAPER  fibres(), paperT() (transmission of thin paper, mean ~1), paperS() (surface relief, mean ~0)
//   RAMP   rampW(): the one warm ramp #8A3A24..#FFF3E6; rampK(): the cool ramp, max #D8E2F5
//   FS_DOWN / FS_UP   bloom and glow chains;  FS_FINAL   ramp + bloom + grain + vignette + fade
import { HDR } from './glkit.js';

export const NOISE = `
const float PI = 3.14159265358979, TAU = 6.28318530717959;
uvec3 pcg3d(uvec3 v){
  v = v*1664525u + 1013904223u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  v ^= v >> 16u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  return v;
}
vec3 hash3i(ivec3 c, uint seed){ uvec3 u = uvec3(c + ivec3(1024)); u.x += seed; return vec3(pcg3d(u) & uvec3(0xFFFFFFu))/16777215.0; }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz)*p3.zy); }
float gn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);
  float a = dot(h22(i)*2.0-1.0, f);
  float b = dot(h22(i+vec2(1.0,0.0))*2.0-1.0, f-vec2(1.0,0.0));
  float c = dot(h22(i+vec2(0.0,1.0))*2.0-1.0, f-vec2(0.0,1.0));
  float d = dot(h22(i+vec2(1.0,1.0))*2.0-1.0, f-vec2(1.0,1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p, int oct){
  float s = 0.0, a = 0.5;
  mat2 Rm = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++){ if (i >= oct) break; s += a*gn(p); p = Rm*p*2.03 + vec2(13.7, 7.3); a *= 0.5; }
  return s;
}
float h13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h13(i), h13(i+vec3(1,0,0)), f.x), mix(h13(i+vec3(0,1,0)), h13(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i+vec3(0,0,1)), h13(i+vec3(1,0,1)), f.x), mix(h13(i+vec3(0,1,1)), h13(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ return 0.55*vn3(p) + 0.30*vn3(p*2.07 + 17.1) + 0.15*vn3(p*4.13 + 5.3); }
mat2 rot2(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
`;

export const PAPER = `
float fibres(vec2 p, float s){
  float acc = 0.0;
  for (int i = 0; i < 3; i++){
    float a = 0.35 + (float(i) - 1.0)*0.55 + s*2.0;
    vec2 r = rot2(a)*p;
    float n = gn(vec2(r.x*0.07, r.y*0.45) + vec2(s*13.1 + float(i)*7.7, s*5.3 - float(i)*3.1));
    acc += pow(clamp(1.0 - abs(n)*3.2, 0.0, 1.0), 5.0);
  }
  return acc/3.0;
}
float paperT(vec2 p, float s){   // transmission of thin paper: cloudy flocs, mottling, fibres (mean ~1)
  float fl = fbm(p*0.026 + s*3.1, 4);
  float md = fbm(p*0.12 + s*1.7, 3);
  float f = fibres(p, s);
  return clamp(1.0 + 1.0*fl + 0.35*md + 1.1*(f - 0.10), 0.15, 2.5);
}
float paperS(vec2 p, float s){   // surface relief seen in raking light (mean ~0)
  return 0.6*fbm(p*0.10 + s*2.3, 3) + 0.6*(fibres(p*1.4, s + 0.5) - 0.10);
}
float wobble(vec2 p, float s){   // hand-cut edges: sub-pixel wander plus the odd small nick (px)
  float w = 0.45*gn(p*0.21 + s) + 0.22*gn(p*0.63 - s*1.7);
  float nick = smoothstep(0.50, 0.60, gn(p*0.075 + s*3.7 + 11.0));
  return w - 1.4*nick;
}
`;

export const RAMP = `
vec3 rampW(float x){
  const vec3 c0 = vec3(0.541, 0.227, 0.141), c1 = vec3(0.769, 0.376, 0.247), c2 = vec3(0.851, 0.467, 0.341);
  const vec3 c3 = vec3(0.941, 0.627, 0.439), c4 = vec3(1.0, 0.851, 0.722), c5 = vec3(1.0, 0.953, 0.902);
  if (x < 0.28) return c0*(x/0.28);
  if (x < 0.46) return mix(c0, c1, (x - 0.28)/0.18);
  if (x < 0.60) return mix(c1, c2, (x - 0.46)/0.14);
  if (x < 0.74) return mix(c2, c3, (x - 0.60)/0.14);
  if (x < 0.87) return mix(c3, c4, (x - 0.74)/0.13);
  return mix(c4, c5, clamp((x - 0.87)/0.10, 0.0, 1.0));
}
vec3 rampK(float x){
  const vec3 k1 = vec3(0.290, 0.345, 0.471), k2 = vec3(0.624, 0.702, 0.851), k3 = vec3(0.847, 0.886, 0.961);
  if (x < 0.40) return k1*(x/0.40);
  if (x < 0.75) return mix(k1, k2, (x - 0.40)/0.35);
  return mix(k2, k3, clamp((x - 0.75)/0.25, 0.0, 1.0));
}
`;

// downsample (optionally thresholded) and tent upsample: the bloom / glow pyramid
export const FS_DOWN = HDR + `
uniform sampler2D uSrc; uniform vec2 uTS, uSrcTexel, uThr; uniform int uPre;
out vec4 o;
void main(){
  vec2 uv = gl_FragCoord.xy/uTS;
  vec4 c = 0.25*(texture(uSrc, uv + uSrcTexel*vec2(-1.0, -1.0)) + texture(uSrc, uv + uSrcTexel*vec2(1.0, -1.0))
               + texture(uSrc, uv + uSrcTexel*vec2(-1.0, 1.0)) + texture(uSrc, uv + uSrcTexel*vec2(1.0, 1.0)));
  if (uPre == 1) c = vec4(max(c.x - uThr.x, 0.0), max(c.y - uThr.y, 0.0), 0.0, 0.0);
  o = c;
}`;
export const FS_UP = HDR + `
uniform sampler2D uLow, uCur; uniform vec2 uTS, uLowTexel; uniform float uCurW;
out vec4 o;
void main(){
  vec2 uv = gl_FragCoord.xy/uTS; vec2 t = uLowTexel;
  vec4 s = texture(uLow, uv)*4.0
         + (texture(uLow, uv + vec2(t.x, 0.0)) + texture(uLow, uv - vec2(t.x, 0.0)) + texture(uLow, uv + vec2(0.0, t.y)) + texture(uLow, uv - vec2(0.0, t.y)))*2.0
         + texture(uLow, uv + t) + texture(uLow, uv - t) + texture(uLow, uv + vec2(t.x, -t.y)) + texture(uLow, uv + vec2(-t.x, t.y));
  o = s/16.0 + uCurW*texture(uCur, uv);
}`;

// the photograph: warm scalar W (x) and cool scalar K (y) through their ramps over the paper base,
// bloom on the hottest parts, grain, vignette; uFade multiplies everything (1 = normal, 0 = black).
export const FS_FINAL = HDR + NOISE + RAMP + `
uniform sampler2D uL, uB, uBloom, uAdd; uniform float uExp, uBloomW, uBloomK, uGrain, uVig, uFade, uAddW, uFloor;
uniform vec2 uRes; uniform float uSeed;
out vec4 o;
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec4 L = texture(uL, uv); vec3 base = texture(uB, uv).rgb; vec4 bl = texture(uBloom, uv);
  float add = uAddW > 0.0 ? texture(uAdd, uv).x*uAddW : 0.0;
  float Wv = (L.x + uBloomW*bl.x + add)*uExp, Kv = (L.y + uBloomK*bl.y)*uExp;
  vec3 c = base + pow(rampW(1.0 - exp(-Wv)), vec3(2.2)) + pow(rampK(1.0 - exp(-Kv)), vec3(2.2));
  c = pow(clamp(c, 0.0, 1.0), vec3(1.0/2.2));
  vec2 v = (uv - 0.5)*vec2(1.0, 0.5625)*2.0;
  c *= 1.0 - uVig*smoothstep(0.25, 1.25, dot(v, v));
  float luma = dot(c, vec3(0.299, 0.587, 0.114));
  vec2 gp = gl_FragCoord.xy*(1920.0/uRes.x);
  float gr = h12(gp*1.013 + 17.0 + uSeed) + h12(gp*0.917 + 91.0 - uSeed) - 1.0;
  c += gr*uGrain*1.7*(0.30 + 0.70*sqrt(luma));
  c = max(c, vec3(0.020, 0.024, 0.043)*uFloor);      // the night paper never goes fully black (until the end)
  o = vec4(clamp(c*uFade, 0.0, 1.0), 1.0);
}`;
