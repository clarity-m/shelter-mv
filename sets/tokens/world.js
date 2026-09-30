// The 1D token world (rung 0), animated port of style-frames/01-pretrain + 01b-pretrain-tokens.
// A Sugimoto-gray seascape whose horizon is a stream of tokenizer output; Clawd (#D97757, the only
// colour) stands on the line; attention arcs converge on him; the field below is a weight matrix.
//
// Per frame: Canvas2D draws the token band (text, IIR motion trails in JS), the layer atlas (hidden-
// state dashes for the transformer stack), a light layer (arcs, counters) and a UI layer (HUD).
// WebGL2 then paints sky + field + halo analytically, adds those layers as light (with reflections
// in the field), blooms (4 scales + horizontal flare), grades, grains, and stamps Clawd crisp last.
//
// Coordinates: "world" px are the 1920x1080 design space of the style frame (horizon y=664, Clawd at
// x=1188). A camera {z, fx, fy, px, py} puts world point (fx,fy) at design-screen point (px,py) with
// zoom z; device px = design px * k, k = W/1920.
import { hash } from '../../lib/util.js';
import { GLYPH } from '../../lib/clawd.js';
import { buildStream } from './corpus.js';

export const HZ = 664, SX = 1188;
const FONT = 'Consolas, "Courier New", monospace';
const ADV = 0.55, CAPR = 0.64;          // Consolas advance and cap height per em
const S0 = 26, SFAR = 2.4, D0L = 16, D0R = 11;   // fisheye: px per char at Clawd / far, core widths (chars)
const CELL = 3;                          // Clawd cell width in world px (54 x 30 glyph, as in the style frames)
const GAPW = 38;                         // half-width of the clear pocket around Clawd (world px)
const BAND_UP = 210, BAND_DN = 70;       // band rows above / below the line (device px at k=1)
const ATL_ROW = 10;                      // atlas rows per layer (device px at k=1)
const MAXL = 24;

// ---- fisheye: text offset d (chars from the head) -> world px offset from Clawd ----------------
export const fishS = (d) => { const d0 = d < 0 ? D0L : D0R; return SFAR + (S0 - SFAR) / (1 + (d / d0) * (d / d0)); };
export const fishM = (d) => { const d0 = d < 0 ? D0L : D0R; return SFAR * d + (S0 - SFAR) * d0 * Math.atan(d / d0); };

const sm = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
const edgeW = (x) => 0.55 + 0.45 * sm(0, 640, x) * sm(1920, 1280, x);

// ---------------------------------------------------------------------------------- shaders
const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

const COMMON = `#version 300 es
precision highp float; precision highp int;
uniform vec2 uRes; uniform float uK;
uniform sampler2D uNoise;
float sq(float x){ return x*x; }
vec3 lin3(vec3 v){ return pow(max(v, 0.), vec3(2.2)); }
float h3(float a, float b, float c){
  uint h = uint(int(a))*374761393u + uint(int(b))*668265263u + uint(int(c))*1442695041u;
  h = (h ^ (h >> 13u)) * 1274126177u; h ^= h >> 16u; return float(h) / 4294967295.;
}
// smooth value noise from the 256^2 random texture (4 texel fetches)
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  ivec2 a = ivec2(mod(i, 256.)), b = ivec2(mod(i + 1., 256.));
  float v00 = texelFetch(uNoise, ivec2(a.x, a.y), 0).r, v10 = texelFetch(uNoise, ivec2(b.x, a.y), 0).r;
  float v01 = texelFetch(uNoise, ivec2(a.x, b.y), 0).r, v11 = texelFetch(uNoise, ivec2(b.x, b.y), 0).r;
  return mix(mix(v00, v10, f.x), mix(v01, v11, f.x), f.y);
}
float fbm4(vec2 p){ float s = 0., a = 0.5, n = 0.; for (int i = 0; i < 4; i++){ s += a*vn(p + float(i)*31.7); n += a; p *= 2.03; a *= 0.5; } return s/n; }
`;

const SCENE_FS = COMMON + `
uniform vec4 uCam;               // z, fx, fy, zk (= z * k)
uniform vec2 uCamP;              // px, py (design px)
uniform float uHZ, uSX;
uniform sampler2D uBand; uniform vec2 uBandY;        // band top row, height (device px)
uniform sampler2D uTint;                             // per column: r = tint A (vs B), g = warm
uniform float uLWarm;
uniform sampler2D uLight;
uniform sampler2D uAtlas; uniform float uAtlRow, uAtlH;
uniform int uNL; uniform float uLY[${MAXL}]; uniform float uLA[${MAXL}]; uniform float uLP[${MAXL}];
uniform sampler2D uLanes; uniform float uLaneOff, uLaneA;
uniform float uTau, uLineG, uFieldG, uReflG, uThread, uThreadTop;
uniform vec4 uGlow;              // amp, radius scale, burst amp, burst rotation
uniform vec2 uClawdW;            // world centre of the burst
uniform vec4 uClawd;             // x0, y0 (device, top-left), cell (device), on
uniform int uGlyph[5];
uniform float uRayTh[11]; uniform float uRayL[11]; uniform float uRayW[11];
uniform float uTime;
uniform vec4 uRip[8];            // beat ripples: age (frames), amp, speed (world px/frame), width (world px)
uniform int uNRip;
uniform float uHaloG, uRipLayer;
out vec4 o;

// light running outward from him along the line (and up the stack, delayed per layer)
float ripple(float x, float delay){
  float dx = abs(x - uSX), r = 0.;
  for (int i = 0; i < 8; i++){
    if (i >= uNRip) break;
    float age = uRip[i].x - delay;
    if (age < 0.) continue;
    float d = age*uRip[i].z, w = uRip[i].w;
    float dec = uRip[i].y*exp(-age/14.);
    float front = exp(-sq((dx - d)/w));
    float trail = dx < d ? 0.35*exp(-(d - dx)/(w*3.)) : 0.;
    r += dec*(front + trail);
  }
  return r;
}

const vec3 TA = vec3(1., 0.985, 0.955), TB = vec3(0.88, 0.925, 1.0);
const vec3 WARM = vec3(0.693, 0.184, 0.0953);   // lin(#D97757)
float edgeW(float x){ return 0.55 + 0.45*smoothstep(0., 640., x)*smoothstep(1920., 1280., x); }

vec3 tintAt(float xs){
  vec2 t = texture(uTint, vec2(xs/uRes.x, 0.5)).rg;
  return mix(mix(TB, TA, t.r), vec3(1.15, 0.52, 0.32), t.g*0.75);
}
vec3 band(float xs, float ys){
  float r = ys - uBandY.x;
  if (r < 0. || r > uBandY.y) return vec3(0.);
  return texture(uBand, vec2(xs/uRes.x, r/uBandY.y)).r * 2. * tintAt(xs);
}
vec3 light(float xs, float ys){
  if (ys < 0. || ys > uRes.y) return vec3(0.);
  return texture(uLight, vec2(xs, ys)/uRes).rgb;
}
float Ys(float yw){ return (uCamP.y + (yw - uCam.z)*uCam.x)*uK; }

void main(){
  float xs = gl_FragCoord.x, ys = uRes.y - gl_FragCoord.y;      // device px, top-down, pixel centres
  float zk = uCam.w;
  float x = uCam.y + (xs/uK - uCamP.x)/uCam.x;                  // world
  float y = uCam.z + (ys/uK - uCamP.y)/uCam.x;
  float HZs = Ys(uHZ);
  vec3 col;
  // ---- underpainting: luminous sky over a mirror field
  if (y < uHZ){
    float u = (uHZ - y)/uHZ;
    float g = 0.30*exp(-u/0.04) + 0.45*exp(-u/0.22) + 0.25*exp(-u/1.2);
    float hz = smoothstep(0.03, 0.4, u)*(1. - 0.5*smoothstep(0.6, 1., u));
    float dxs = (x - uSX)/1000.;
    float L = 0.27 + 0.42*g + 0.08*exp(-dxs*dxs)*exp(-u/0.55);
    L *= 1. + 0.12*(fbm4(vec2(x/2200. + 2.1, y/70.)) - 0.5)*hz;
    // horizontal brushwork: stretched value noise (strokes 50-600 px long, 1-16 px wide)
    float st = 0.034*(vn(vec2(x/260., y/(3. + 10.*u))) - 0.5) + 0.010*(vn(vec2(x/90. + 40., y/2.4)) - 0.5)
             + 0.030*(vn(vec2(x/620. + 90., y/(8. + 14.*u))) - 0.5);
    L *= 1. + st*(0.4 + 0.6*smoothstep(0.02, 0.2, u));
    col = lin3(L*vec3(0.952 + 0.068*g, 0.986 + 0.02*g, 1.07 - 0.095*g));
  } else {
    float dv = y - uHZ, v = dv/(1080. - uHZ);
    float g = 0.40*exp(-v/0.02) + 0.30*exp(-v/0.14) + 0.30*exp(-v/0.9);
    float dxs = (x - uSX)/560.;
    float L = 0.12 + 0.43*g + 0.06*exp(-dxs*dxs)*exp(-v/0.35);
    L *= 1. + 0.06*(fbm4(vec2(x/1700. + 7.7, dv/(3. + 0.09*dv))) - 0.5);
    float sc = 0.25 + v;
    L *= 1. + 0.07*(vn(vec2(x/(150.*sc) + 17., dv/(1.2 + 2.6*sc))) - 0.5) + 0.04*(vn(vec2(x/(48.*sc) + 3., dv/(0.9 + 1.5*sc))) - 0.5);
    col = lin3(L*vec3(0.985 + 0.02*g, 0.998, 1.025 - 0.035*g));
    // the field is a weight matrix: perspective cells converging on the spark; weights churn with training
    if (dv > 2.){
      const float F = 1100., CG = 0.20;
      float Z = F/dv, fpz = F/(dv*dv)/CG/zk;
      if (fpz < 1.1){
        float cz = Z/CG, j = floor(cz), fz = cz - j;
        float fpx = Z/(F*CG)/zk;
        float vis = (1. - smoothstep(0.25, 0.9, fpz))*(1. - 0.55*smoothstep(0.25, 1.0, v))*uFieldG;
        float ez = min(fz, 1. - fz)/fpz, gapOn = 1. - smoothstep(0.12, 0.3, fpz);
        float rowW = 0.22*(h3(3., j, 5.) - 0.5);
        float cu = (x - uSX)*Z/(F*CG), i = floor(cu), fx = cu - i;
        float ex = min(fx, 1. - fx)/fpx;
        float gap = (1. - smoothstep(0.2, 1.1, min(ex, ez)))*gapOn;
        float tt = uTau + h3(i, j, 77.)*3.;
        float k0 = floor(tt), a = smoothstep(0., 1., fract(tt));
        float wr = 0.5 + (mix(h3(i, j, 19. + k0*13.), h3(i, j, 19. + (k0 + 1.)*13.), a) - 0.5)/sqrt(a*a + (1. - a)*(1. - a));
        float wv = 0.62*(wr - 0.5) + 0.24*(h3(i, 9., 8.) - 0.5) + rowW;
        vec3 base = vec3(0.0144);   // lin(0.12)
        col = base + (col - base)*(1. + vis*(0.78*wv - 0.22*gap));
      }
    }
  }
  float rip0 = uNRip > 0 ? ripple(x, 0.) : 0.;
  // ---- horizon halo (sky side and mirrored in the field)
  {
    float dy = y - uHZ, ady = abs(dy)*(dy > 0. ? 1.25 : 1.);
    float vp = 0.09*exp(-sq(ady/1.6)) + 0.05*exp(-sq(ady/6.)) + 0.05*exp(-sq(ady/24.)) + 0.04*exp(-sq(ady/95.));
    col += vp*(0.6 + 0.4*exp(-sq((x - uSX)/700.)))*edgeW(x)*vec3(1., 0.985, 0.955)*uLineG*uHaloG*(1. + 0.7*rip0);
  }
  // ---- the line itself (device-px profile so it stays one crisp row at any zoom)
  {
    float dyD = ys - (HZs + 0.5*zk);
    float wv = max(1., zk);
    float fl = 0.85 + 0.15*vn(vec2(x*0.05, 0.5));
    float I = 0.30*exp(-sq(dyD/(0.62*wv))) + 0.05*exp(-sq((dyD + wv)/(0.62*wv))) + 0.09*exp(-sq((dyD - wv)/(0.62*wv)));
    col += I*edgeW(x)*fl*vec3(1., 0.99, 0.965)*uLineG*(1. + 2.2*rip0)/max(1., sqrt(zk));
  }
  // ---- other sequences in the batch + long-exposure dashes (baked lanes, scrolling)
  if (abs(y - uHZ) < 31.5){
    float row = floor(y - uHZ + 32.);
    float rate = 0.75 + 0.5*h3(row, 3., 9.);
    float lv = texture(uLanes, vec2((x + uLaneOff*rate)/4096., (row + 0.5)/64.)).r;
    float dxc = abs(x - uSX);
    float capx = 3.4 + 26.*(1./(1. + sq(dxc/(x < uSX ? 330. : 230.))));
    float dy = y - uHZ;
    float fade = dy < 0. ? 1. - smoothstep(abs(dy)*0.6, abs(dy)*1.1 + 1., capx) : 1. - 0.5*smoothstep(8., 20., capx);
    col += lv*edgeW(x)*fade*uLaneA*(1. + 1.2*rip0)*vec3(1., 0.99, 0.965);
  }
  // ---- token band + its reflection (tokens light up as a ripple passes)
  col += band(xs, ys)*(1. + 1.4*rip0);
  if (ys > HZs + 1.){
    float dy = ys - HZs;
    float my = HZs - dy;
    vec3 r = vec3(0.);
    for (int i = -3; i <= 3; i++) r += band(xs, my + float(i)*1.4*zk)*(1. - abs(float(i))/4.);
    r /= 4.;
    float farW = smoothstep(120., 450., abs(x - uSX));
    vec3 c = band(xs, my - 2.*zk)*0.6 + band(xs, my - 2.*zk + zk)*0.4;
    col += (r*0.085*exp(-dy/(34.*zk)) + c*farW*0.22*exp(-dy/(6.*zk)))*uReflG;
  }
  // ---- transformer layers: thin lines + hidden-state dashes from the atlas
  for (int l = 0; l < ${MAXL}; l++){
    if (l >= uNL) break;
    float a = uLA[l]; if (a <= 0.) continue;
    float yl = Ys(uLY[l]);
    float dd = ys - yl;
    float ripL = 0.;
    if (uNRip > 0 && abs(dd) < uAtlRow*0.5 + 3.) ripL = ripple(x, float(l + 1)*uRipLayer);
    // the layer line
    float lineI = (0.022 + 0.11*uLP[l])*exp(-sq(dd/(0.7*max(1., zk))))*edgeW(x)*a*(0.45 + 0.55*exp(-sq((x - uSX)/800.)))*(1. + 2.4*ripL);
    col += lineI*vec3(0.97, 0.98, 1.0);
    if (abs(dd) < uAtlRow*0.5){
      float d = texture(uAtlas, vec2(xs/uRes.x, (float(l + 1)*uAtlRow + uAtlRow*0.5 + dd)/uAtlH)).r*2.;
      col += d*tintAt(xs)*a*(1. + 1.6*ripL);
      // his column: a tiny warm cell in every layer
      float wx = abs(x - uSX);
      if (wx < 13.5 && abs(dd) < 1.3*max(1., zk)) col += vec3(1.25, 0.62, 0.42)*(0.18 + 0.4*uLP[l])*a*uLWarm*smoothstep(13.5, 11., wx);
    }
    // reflection of the layer in the field
    float yr = 2.*HZs - yl;
    float dr = ys - yr;
    if (abs(dr) < uAtlRow*0.5 && ys > HZs){
      float d = texture(uAtlas, vec2(xs/uRes.x, (float(l + 1)*uAtlRow + uAtlRow*0.5 - dr)/uAtlH)).r*2.;
      col += d*0.05*a*exp(-(ys - HZs)/(260.*zk))*uReflG*TA;
    }
  }
  // his column: a faint warm thread up through the stack
  if (uThread > 0. && y < uHZ){
    float dx = (x - uSX)*zk;
    col += WARM*uThread*exp(-sq(dx/1.3))*0.30*smoothstep(uHZ - 20., uHZ - 60., y)*smoothstep(uThreadTop - 30., uThreadTop + 10., y);
  }
  // ---- light layer (arcs, counters) + its faint, slightly smeared mirror in the field
  col += light(xs, ys);
  if (ys > HZs + 1.){
    float dy = ys - HZs;
    float ry = HZs - dy - 3.*zk;
    vec3 r = light(xs, ry)*0.45 + light(xs, ry + zk)*0.35 + light(xs, ry + 2.*zk)*0.2;
    col += r*0.16*exp(-dy/(220.*zk))*uReflG;
  }
  // ---- the spark: warm glow, burst, haze, and a glitter path on the field
  {
    vec2 p = vec2(x, y) - uClawdW;
    float r = length(p), R = uGlow.y;
    float amp = uGlow.x;
    vec3 gl = vec3(0.);
    float rr = r/(260.*R);
    float ga = rr < 0.18 ? mix(0.42, 0.17, rr/0.18) : rr < 0.5 ? mix(0.17, 0.045, (rr - 0.18)/0.32) : mix(0.045, 0., clamp((rr - 0.5)/0.5, 0., 1.));
    gl += WARM*amp*ga;
    float rc = r/(30.*R);
    if (rc < 1.) gl += (rc < 0.55 ? mix(vec3(1., 0.76, 0.62)*0.85, vec3(0.871, 0.392, 0.231)*0.4, rc/0.55)
                                  : mix(vec3(0.871, 0.392, 0.231)*0.4, vec3(0.), (rc - 0.55)/0.45))*amp;
    // eleven irregular rays
    float bI = 0.;
    if (uGlow.z > 0. && r < 140.*R){
      for (int i = 0; i < 11; i++){
        float th = uRayTh[i] + uGlow.w;
        vec2 d = vec2(cos(th), sin(th));
        float t = dot(p, d), q = abs(p.x*d.y - p.y*d.x);
        float Lr = uRayL[i]*R, hw = uRayW[i]*mix(1., R, 0.5);
        if (t > 0. && t < Lr){
          float w = hw*(1. - t/Lr);
          bI = max(bI, clamp((w - q)*zk + 0.5, 0., 1.));
        }
      }
      float rg = r/(112.*R);
      vec3 rc2 = rg < 0.3 ? mix(vec3(1., 0.816, 0.714), vec3(0.933, 0.588, 0.447), rg/0.3)
                          : mix(vec3(0.933, 0.588, 0.447), vec3(0.851, 0.467, 0.341), (rg - 0.3)/0.7);
      float ra = rg < 0.3 ? mix(1., 0.92, rg/0.3) : rg < 0.72 ? mix(0.92, 0.42, (rg - 0.3)/0.42) : mix(0.42, 0., clamp((rg - 0.72)/0.28, 0., 1.));
      gl += lin3(rc2)*ra*bI*uGlow.z;
    }
    // wide warm haze, and its narrow path down the field
    float I = y < uHZ ? 0.030*exp(-(p.x*p.x + p.y*p.y*2.2)/(2.*sq(330.*R)))
                      : 0.030*exp(-sq(p.x/(55.*R)))*exp(-(y - uHZ)/150.);
    gl += WARM*I*amp;
    // glitter: warm glints on the long-exposure field under him
    if (y > uHZ + 3.){
      float dv = y - uHZ;
      float rowi = floor(y);
      float pr = exp(-dv/110.);
      float hs = h3(rowi, 5., 55.);
      if (hs < pr*0.85){
        float g1 = h3(rowi, 6., 55.), g2 = h3(rowi, 7., 55.);
        float gx = uSX + (g1 - 0.5)*2.2*(3. + dv*0.085) + 2.*sin(uTime*1.3 + rowi*0.7);
        float len = 3. + g2*(5. + dv*0.07);
        float s = (x - gx)/len + 0.5;
        if (s > 0. && s < 1.) gl += WARM*sin(3.14159*s)*(0.25 + 0.75*g2)*0.5*exp(-dv/140.)*amp*(0.8 + 0.2*sin(uTime*2. + rowi));
      }
    }
    col += gl;
  }
  // ---- Clawd himself, so the bloom sees his orange (re-stamped crisp in the final pass)
  if (uClawd.w > 0.){
    vec2 q = (vec2(xs, ys) - uClawd.xy)/vec2(uClawd.z, 2.*uClawd.z);
    if (q.x >= 0. && q.x < 18. && q.y >= 0. && q.y < 5.){
      int cx = int(q.x), cy = int(q.y);
      if (((uGlyph[cy] >> (17 - cx)) & 1) == 1) col = mix(col, WARM, uClawd.w);
    }
  }
  o = vec4(col, 1.);
}`;

const BRIGHT_FS = COMMON + `
uniform sampler2D uSrc; uniform vec2 uSrcRes;
out vec4 o;
vec3 w(vec3 c){ float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return c*smoothstep(0.45, 1.4, l); }
void main(){
  vec2 c = gl_FragCoord.xy*4./uSrcRes;          // centre of this 4x4 block in src uv
  vec2 t = 1./uSrcRes;
  vec3 s = w(texture(uSrc, c + vec2(-t.x, -t.y)).rgb) + w(texture(uSrc, c + vec2(t.x, -t.y)).rgb)
         + w(texture(uSrc, c + vec2(-t.x, t.y)).rgb) + w(texture(uSrc, c + vec2(t.x, t.y)).rgb);
  o = vec4(s*0.25, 1.);
}`;

const DOWN_FS = COMMON + `
uniform sampler2D uSrc; uniform vec2 uSrcRes; uniform vec2 uF;   // integer downsample factors
out vec4 o;
void main(){
  vec2 c = gl_FragCoord.xy*uF/uSrcRes; vec2 t = 0.5/uSrcRes*(uF - 1.);
  o = vec4(0.25*(texture(uSrc, c + vec2(-t.x, -t.y)).rgb + texture(uSrc, c + vec2(t.x, -t.y)).rgb
               + texture(uSrc, c + vec2(-t.x, t.y)).rgb + texture(uSrc, c + vec2(t.x, t.y)).rgb), 1.);
}`;

const BLUR_FS = COMMON + `
uniform sampler2D uSrc; uniform vec2 uStep; uniform float uSigma; uniform vec2 uOut;
out vec4 o;
void main(){
  vec2 uv = gl_FragCoord.xy/uOut;
  int n = int(ceil(uSigma*3.));
  vec3 acc = vec3(0.); float ws = 0.;
  for (int i = -n; i <= n; i++){ float w = exp(-0.5*float(i*i)/(uSigma*uSigma)); acc += texture(uSrc, uv + float(i)*uStep).rgb*w; ws += w; }
  o = vec4(acc/ws, 1.);
}`;

const FINAL_FS = COMMON + `
uniform sampler2D uScene, uG1, uG2, uG3, uG4, uUI;
uniform vec4 uBW;
uniform float uFrame, uBlack, uUIA, uGrain;
uniform vec2 uUIR;
uniform vec4 uWash;           // amount, radius (device px), centre x, centre y (device, top-down)
uniform vec4 uClawd; uniform int uGlyph[5];
out vec4 o;
float sh(float v){ return v < 0.8 ? v : 0.8 + 0.2*(1. - exp(-(v - 0.8)/0.2)); }
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  float xs = gl_FragCoord.x, ys = uRes.y - gl_FragCoord.y;
  vec3 c = texture(uScene, uv).rgb;
  c += texture(uG1, uv).rgb*uBW.x + texture(uG2, uv).rgb*uBW.y + texture(uG3, uv).rgb*uBW.z + texture(uG4, uv).rgb*uBW.w;
  // the light we arrived through: a warm wash collapsing into him
  if (uWash.x > 0.){
    float d = length(vec2(xs, ys) - uWash.zw);
    float m = uWash.x*exp(-sq(d/(uWash.y*0.62 + 1.)));
    // starts as S02's last frame (pale peach, mean ~(243,225,207)) and warms toward his orange as it collapses
    float warmth = 1. - clamp(uWash.y/(2600.*uK), 0., 1.);
    vec3 wc = mix(vec3(0.90, 0.76, 0.63), vec3(1.05, 0.50, 0.30), smoothstep(0.1, 0.9, warmth))*(1. + 0.12*exp(-sq(d/(uWash.y*0.3 + 1.))));
    c = mix(c, wc, clamp(m, 0., 1.));
  }
  c *= 1. - uBlack;
  // HUD: diegetic, composited before grain (the UI canvas covers only the bottom-left corner)
  if (uUIA > 0. && xs < uUIR.x && ys > uRes.y - uUIR.y){
    vec4 ui = texture(uUI, vec2(xs/uUIR.x, (ys - (uRes.y - uUIR.y))/uUIR.y));
    c = c*(1. - ui.a*uUIA) + ui.rgb*ui.a*0.80*uUIA*vec3(1., 0.99, 0.97);
  }
  // vignette, soft shoulder, gamma
  float x = xs/uK, y = ys/uK;
  float vx = (x - 1920.*0.57)/(1920.*0.62), vy = (y - 1080.*0.58)/(1080.*0.80);
  float vig = 1. - 0.38*smoothstep(0.35, 1.3, sqrt(vx*vx + vy*vy));
  c *= vig;
  c = vec3(sh(c.r), sh(c.g), sh(c.b));
  c = pow(max(c, 0.), vec3(1./2.2));
  // canvas weave, grain, dither
  float wv = 1. + 0.009*sin(x*1.428)*sin(y*1.428) + 0.010*(vn(vec2(x/2.1, y/11.)) - 0.5) + 0.010*(vn(vec2(x/11. + 50., y/2.1)) - 0.5);
  float n1 = h3(xs, ys, uFrame*7. + 1.), n2 = h3(xs + 9e3, ys, uFrame*7. + 2.), n3 = h3(xs, ys + 7e3, uFrame*7. + 3.);
  float g = (n1 + n2 - 1.)*0.032*uGrain, dt = (n3 - 0.5)/255.;
  c = c*wv + g + dt;
  // Clawd, pixel-crisp, last
  if (uClawd.w > 0.){
    vec2 q = (vec2(xs, ys) - uClawd.xy)/vec2(uClawd.z, 2.*uClawd.z);
    if (q.x >= 0. && q.x < 18. && q.y >= 0. && q.y < 5.){
      int cx = int(q.x), cy = int(q.y);
      if (((uGlyph[cy] >> (17 - cx)) & 1) == 1) c = mix(c, vec3(217., 119., 87.)/255., uClawd.w);
    }
  }
  o = vec4(clamp(c, 0., 1.), 1.);
}`;

// ---------------------------------------------------------------------------------- the world
export function createTokenWorld(canvas, { W, H, log = () => {} }) {
  const k = W / 1920;
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false });
  if (!gl) throw new Error('no webgl2');
  const hasCBF = !!gl.getExtension('EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');
  if (!hasCBF) log('tokens: EXT_color_buffer_float missing, using RGBA8 targets');

  // ---- programs
  function prog(fs, name) {
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(s)}`);
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`${name}: ${gl.getProgramInfoLog(p)}`);
    const U = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const nm = info.name.replace(/\[0\]$/, ''); U[nm] = gl.getUniformLocation(p, info.name); }
    return { p, U };
  }
  const P_SCENE = prog(SCENE_FS, 'scene'), P_BRIGHT = prog(BRIGHT_FS, 'bright'), P_DOWN = prog(DOWN_FS, 'down');
  const P_BLUR = prog(BLUR_FS, 'blur'), P_FINAL = prog(FINAL_FS, 'final');
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // ---- textures and targets
  function tex(w, h, ifmt, fmt, type, data, filter = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function target(w, h) {
    const t = hasCBF ? tex(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, null) : tex(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, fb, w, h };
  }
  const q4w = Math.round(W / 4), q4h = Math.round(H / 4);
  const RT = {
    scene: target(W, H),
    b0: target(q4w, q4h), tmp0: target(q4w, q4h), g1: target(q4w, q4h), g2: target(q4w, q4h),
    b1: target(Math.round(W / 8), Math.round(H / 8)), tmp1: target(Math.round(W / 8), Math.round(H / 8)), g3: target(Math.round(W / 8), Math.round(H / 8)),
    f0: target(Math.round(W / 16), q4h), g4: target(Math.round(W / 16), q4h),
  };
  // noise
  const nz = new Uint8Array(256 * 256 * 4);
  { const r = (i) => Math.floor(hash(i, 17, 3) * 256); for (let i = 0; i < nz.length; i++) nz[i] = r(i); }
  const T_NOISE = tex(256, 256, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, nz, gl.NEAREST, gl.REPEAT);

  // lanes: other sequences in the batch (pseudo-glyphs) and long-exposure dashes, 4096 x 64 world px
  const LW = 4096, LH = 64;
  const lanes = new Float32Array(LW * LH);
  {
    const add = (x, dy, v) => { x = ((Math.round(x) % LW) + LW) % LW; const r = dy + 32; if (r >= 0 && r < LH) lanes[r * LW + x] += v; };
    let seed = 1;
    const rt = () => hash(seed++, 31337, 7);
    const glyphs = [];
    for (let g = 0; g < 160; g++) {
      const u = rt(); const cells = [];
      if (u < 0.06) cells.push([1, 4]);
      else if (u < 0.10) cells.push([0, 3], [1, 3], [2, 3]);
      else {
        const tall = rt() < 0.3, top = tall ? 0 : 2, bits = new Set();
        const put = (x, y) => { if (y >= top) bits.add(x + ',' + y); };
        const stem = rt() < 0.5 ? 0 : 2;
        for (let y = top; y < 5; y++) put(stem, y);
        if (rt() < 0.35) for (let y = 2; y < 5; y++) put(2 - stem, y);
        const nb = 1 + Math.floor(rt() * 2);
        for (let b = 0; b < nb; b++) { const y = 2 + 2 * Math.floor(rt() * 2); for (let x = 0; x < 3; x++) put(x, y); }
        for (const t of bits) cells.push(t.split(',').map(Number));
      }
      glyphs.push(cells);
    }
    const lane = (dy, bright, dens) => {
      let x = 0;
      while (x < LW) {
        const nTok = 1 + Math.floor(rt() * 3);
        for (let t = 0; t < nTok; t++) {
          const nGl = 1 + Math.floor(rt() * 3), vis = rt() < dens, head = (0.35 + 0.55 * rt()) * bright;
          const len = Math.floor(8 + Math.pow(rt(), 1.8) * 140);
          for (let q = 0; q < nGl; q++) {
            if (vis) {
              const gl2 = glyphs[Math.floor(rt() * glyphs.length)];
              const rows = new Set(gl2.map((c) => c[1]));
              for (const yy of rows) for (let s = 1; s <= len; s++) add(x + 2 + s, dy - 4 + yy, head * 0.05 * Math.pow(1 - s / len, 1.7));
              for (const c of gl2) add(x + c[0], dy - 4 + c[1], head);
            }
            x += 4;
          }
          x += 1;
        }
        x += 3 + Math.floor(rt() * 3);
      }
    };
    lane(-12, 0.13, 0.55); lane(15, 0.08, 0.45); lane(-22, 0.06, 0.35);
    for (const dy of [-3, -4, -6, -8, -10, -13, -16, -20, -25, 3, 4, 6, 8, 11, 14, 18, 23]) {
      const base = 0.30 * Math.exp(-Math.abs(dy) / 6.5);
      let x = rt() * 120;
      while (x < LW - 20) {
        const len = 16 + Math.pow(rt(), 1.5) * 520, gap = 8 + Math.pow(rt(), 2) * 260, I = base * (0.25 + 0.75 * rt());
        for (let s = 0; s < len; s++) { const t = s / len, prof = Math.pow(1 - t, 1.6) * sm(0, 0.05, t); add(x + s, dy, I * prof); }
        x += len + gap;
      }
    }
  }
  const T_LANES = tex(LW, LH, gl.R16F, gl.RED, gl.FLOAT, lanes, gl.LINEAR, gl.REPEAT);

  // Canvas2D layers
  const mk2d = (w, h, rf) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: rf })]; };
  const BH = Math.round((BAND_UP + BAND_DN) * k);
  const [bandC, bg] = mk2d(W, BH, true);
  const bandF = new Float32Array(W * BH);
  const T_BAND = tex(W, BH, gl.R16F, gl.RED, gl.FLOAT, bandF);
  const AR = Math.max(4, Math.round(ATL_ROW * k)), AH = AR * MAXL;
  const [atlC, ag] = mk2d(W, AH, true);
  const atlF = new Float32Array(W * AH);
  const T_ATL = tex(W, AH, gl.R16F, gl.RED, gl.FLOAT, atlF);
  const tintB = new Uint8Array(W * 4);
  const T_TINT = tex(W, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, tintB, gl.NEAREST);
  const lightC = document.createElement('canvas'); lightC.width = W; lightC.height = H;
  const lg = lightC.getContext('2d', { alpha: false, willReadFrequently: true });
  let lightRows = 0;
  const UIW = Math.round(700 * k), UIH = Math.round(240 * k);
  const [uiC, ug] = mk2d(UIW, UIH, true);
  const T_LIGHT = tex(W, H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const T_UI = tex(UIW, UIH, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null);

  // Clawd glyph bits and the eleven rays (01-pretrain values)
  const glyphBits = GLYPH.map((row) => { let b = 0; for (let c = 0; c < 18; c++) if (row[c] === '#') b |= 1 << (17 - c); return b; });
  const rays = { th: [], L: [], w: [] };
  { let s = 1111; const rr = () => hash(s++, 4, 4); for (let i = 0; i < 11; i++) { rays.th.push(-0.24 + i * 2 * Math.PI / 11 + (rr() - 0.5) * 0.26); rays.L.push(40 + rr() * 66); rays.w.push(1.9 + rr() * 1.8); } }

  const STREAM = buildStream(3);
  const TOKS = STREAM.toks;
  const tokAtS = (s) => {   // index of the token covering text position s (binary search)
    let lo = 0, hi = TOKS.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (TOKS[m].s0 <= s) lo = m; else hi = m - 1; }
    return lo;
  };

  // ---------------------------------------------------------------- per-frame layout
  let cam = { z: 1, fx: 960, fy: 540, px: 960, py: 540 };
  const X = (xw) => (cam.px + (xw - cam.fx) * cam.z) * k;
  const Y = (yw) => (cam.py + (yw - cam.fy) * cam.z) * k;
  const Xinv = (xs) => cam.fx + (xs / k - cam.px) / cam.z;

  // IIR motion trails over an RGB float image (rows x W): short front blur, long rear trail (to the
  // right: the stream flows leftward). kF/kR/gR are per-column.
  function trails(src, rows, kF, kR, gR, hg, rowUsed) {
    for (let y = 0; y < rows; y++) {
      if (rowUsed && !rowUsed[y]) continue;
      const o = y * W;
      let a = 0;
      for (let x = W - 1; x >= 0; x--) { const i = o + x; a = a * kF[x] + src[i] * (1 - kF[x]); src[i] = a; }
      let t = 0;
      for (let x = 0; x < W; x++) { const i = o + x; const s = src[i]; t = t * kR[x] + s * (1 - kR[x]); src[i] = s * hg[x] + t * gR[x]; }
    }
  }
  // RGBA bytes (R channel) -> float luminance, marking rows that hold anything
  function unpack(d, dst, rows, rowUsed) {
    for (let y = 0; y < rows; y++) {
      let any = 0;
      const o = y * W, oi = o * 4;
      for (let x = 0; x < W; x++) { const v = d[oi + x * 4]; dst[o + x] = v * (1 / 255); any |= v; }
      rowUsed[y] = any ? 1 : 0;
    }
  }
  const kF = new Float32Array(W), kR = new Float32Array(W), gR = new Float32Array(W), hG = new Float32Array(W);
  const rowUsedB = new Uint8Array(BH), rowUsedA = new Uint8Array(AH);

  function setTrailCols(head, speed, expo, blurOnly = false) {
    for (let x = 0; x < W; x++) {
      const xw = Xinv(x + 0.5), dpx = Math.abs(xw - SX);
      // text offset under this column (invert the fisheye by a few Newton steps)
      let d = (xw - SX) / S0;
      for (let it = 0; it < 6; it++) d -= (fishM(d) - (xw - SX)) / fishS(d);
      const vs = speed * fishS(d) * cam.z * k;                  // device px per frame
      if (blurOnly) {                                            // plain motion blur (hidden-state dashes)
        const L = 0.9 * vs * expo;
        kR[x] = L < 0.3 ? 0 : Math.exp(-1 / L);
        gR[x] = Math.min(vs / 12, 1) * 0.9;
        kF[x] = 0; hG[x] = 1 / (1 + vs / 30);
        continue;
      }
      const Lw = (26 + 210 * (1 - Math.exp(-Math.pow(dpx / 450, 1.5)))) * cam.z * k * expo;
      const L = Lw + 1.6 * vs;
      kR[x] = Math.exp(-1 / Math.max(L, 0.5));
      // at speed the stream stays visible as streaks (brighter than energy-conserving blur)
      gR[x] = (0.24 + 0.5 * sm(40, 650, dpx)) * (1 + Math.min(vs / 11, 6));
      const Lf = Math.min(0.45 * vs, 14 * k);
      kF[x] = Lf < 0.3 ? 0 : Math.exp(-1 / Lf);
      hG[x] = 1 / (1 + vs / 70);
    }
  }

  // ---------------------------------------------------------------- GL helpers
  function use(P) { gl.useProgram(P.p); return P.U; }
  function bindTex(U, name, unit, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U[name], unit); }
  function draw(fbo, w, h) { gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, w, h); gl.drawArrays(gl.TRIANGLES, 0, 3); }
  function blur(src, tmp, dst, sigma, dir) {
    let U = use(P_BLUR);
    const passes = dir === 'h' ? [[1, 0, dst]] : [[1, 0, tmp], [0, 1, dst]];
    let from = src;
    for (const [dx, dy, to] of passes) {
      U = use(P_BLUR);
      bindTex(U, 'uSrc', 0, from.t);
      gl.uniform2f(U.uStep, dx / from.w, dy / from.h); gl.uniform1f(U.uSigma, sigma); gl.uniform2f(U.uOut, to.w, to.h);
      draw(to.fb, to.w, to.h);
      from = to;
    }
  }

  // ---------------------------------------------------------------- arcs (Canvas2D, world coords)
  function arcPath(g, x0, y0, x1, y1, h, q, t0 = 0, t1 = 1) {
    const n = Math.max(12, Math.ceil(Math.abs(X(x1) - X(x0)) * Math.abs(t1 - t0) / 14));
    g.beginPath();
    for (let s = 0; s <= n; s++) {
      const t = t0 + (t1 - t0) * s / n;
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t - h * Math.pow(Math.sin(Math.PI * t), q);
      if (s === 0) g.moveTo(X(x), Y(y)); else g.lineTo(X(x), Y(y));
    }
  }
  function arc(g, x0, y0, x1, y1, h, q, a0, a1, lw, t0 = 0, t1 = 1) {
    if (a0 < 0.002 && a1 < 0.002) return;
    const gr = g.createLinearGradient(X(x0), 0, X(x1), 0);
    gr.addColorStop(0, `rgba(255,255,255,${Math.min(1, a0).toFixed(4)})`);
    gr.addColorStop(1, `rgba(255,255,255,${Math.min(1, a1).toFixed(4)})`);
    g.strokeStyle = gr; g.lineWidth = lw * k * Math.sqrt(cam.z);
    arcPath(g, x0, y0, x1, y1, h, q, t0, t1);
    g.stroke();
  }

  // ---------------------------------------------------------------- render
  const PROF = { n: 0, t: [0, 0, 0, 0, 0, 0] };
  function render(P) {
    const tp0 = performance.now();
    cam = P.cam;
    const zk = cam.z * k;
    const head = P.head, speed = P.speed ?? 0.1;
    const HZs = Y(HZ);
    const bandTop = Math.round(HZs) - Math.round(BAND_UP * k);
    const CYw = HZ - 1 - CELL * 5;                         // burst centre (world): middle of Clawd

    // ---- visible tokens (plus far-left context for arcs)
    const iA = tokAtS(head - 640), iB = tokAtS(head + 210);
    const vis = [];
    for (let i = iA; i <= iB; i++) {
      const t = TOKS[i];
      const dc = t.s0 + t.n / 2 - head;
      const xc = SX + fishM(dc), x0 = SX + fishM(t.s0 - head), x1 = SX + fishM(t.s0 + t.n - head);
      vis.push({ i, t, dc, xc, x0, x1, S: fishS(dc) });
    }
    const api = {
      k, W, H, HZ, SX, cam, X, Y, vis, TOKS, head, zk, arc, arcPath,
      tokIndexAt: (dChars) => tokAtS(head + dChars),
      tokX: (i) => { const t = TOKS[i]; return SX + fishM(t.s0 + t.n / 2 - head); },
      tokCap: (i) => { const t = TOKS[i]; return fishS(t.s0 + t.n / 2 - head) / ADV * CAPR; },
      layerY: (l) => (l === 0 ? HZ : (P.layers ? P.layers.y[l] : HZ)),
    };

    // ---- token band
    bg.setTransform(1, 0, 0, 1, 0, 0);
    bg.globalCompositeOperation = 'source-over'; bg.fillStyle = '#000'; bg.fillRect(0, 0, W, BH);
    bg.globalCompositeOperation = 'lighter'; bg.textBaseline = 'alphabetic'; bg.textAlign = 'center';
    const baseY = HZs - 1 * zk - bandTop;
    const gapL = X(SX - GAPW), gapR = X(SX + GAPW), gapSoft = 7 * zk;
    const lit = P.lit || new Map();
    const bandA = P.bandA ?? 1;
    tintB.fill(0);
    let lastFont = '';
    for (const v of vis) {
      const xs0 = X(v.x0), xs1 = X(v.x1);
      if (xs1 < -40 || xs0 > W + 40) continue;
      const t = v.t;
      const em = v.S / ADV * zk;
      if (em < 1.2) continue;
      const xc = X(v.xc), dpx = Math.abs(v.xc - SX);
      let I = 0.66 * edgeW(v.xc) * (0.55 + 0.45 * hash(v.i, 3, 71)) * (v.dc > 0 ? 0.82 : 1) * (1 + 0.5 * sm(250, 700, dpx));
      if (v.i & 1) I *= 0.72;
      if (t.t === '\n' || t.t === '<|endoftext|>' || /^ +$/.test(t.t)) I *= 0.55;
      const L = lit.get(v.i) || 0;
      I *= (1 + 2.4 * L) * bandA;
      const val = Math.min(255, Math.round(I / 2 * 255));
      bg.fillStyle = `rgb(${val},${val},${val})`;
      {
        const g2 = 0.175 * v.S * zk;
        const c0 = Math.max(0, Math.floor(xs0 - g2)), c1 = Math.min(W - 1, Math.ceil(xs1 + g2));
        const ta = (v.i & 1) ? 0 : 255, tw = t.warm ? 255 : 0;
        for (let c = c0; c <= c1; c++) { tintB[c * 4] = ta; tintB[c * 4 + 1] = tw; }
      }
      const f = `${em.toFixed(2)}px ${FONT}`;
      if (f !== lastFont) { bg.font = f; lastFont = f; }
      bg.fillText(t.disp, xc, baseY);
      // boundary tick, hanging below the line like a ruler
      if (xs1 > 0 && xs1 < W) {
        const cap = v.S / ADV * CAPR * zk;
        const th = Math.max(1, cap * 0.42);
        const tv = Math.round(0.30 * edgeW(v.x1) / 2 * 255 * bandA);
        bg.fillStyle = `rgb(${tv},${tv},${tv})`;
        const xb = X(v.x1 + 0.175 * v.S);
        bg.fillRect(xb - 0.5, HZs + 2 * zk - bandTop, Math.max(1, 0.8 * zk), th);
      }
    }
    // the pocket: tokens fade out as they enter his light and back in as they leave it
    bg.globalCompositeOperation = 'source-over';
    const gpk = bg.createLinearGradient(gapL - gapSoft, 0, gapR + gapSoft, 0);
    const f0 = gapSoft / (gapR - gapL + 2 * gapSoft), f1 = 1 - f0;
    gpk.addColorStop(0, 'rgba(0,0,0,0)'); gpk.addColorStop(f0, 'rgba(0,0,0,1)'); gpk.addColorStop(f1, 'rgba(0,0,0,1)'); gpk.addColorStop(1, 'rgba(0,0,0,0)');
    bg.fillStyle = gpk; bg.fillRect(gapL - gapSoft, 0, gapR - gapL + 2 * gapSoft, HZs + 1.5 * zk - bandTop);
    const tp1 = performance.now();
    // read back, trails, upload
    {
      const d = bg.getImageData(0, 0, W, BH).data;
      unpack(d, bandF, BH, rowUsedB);
      setTrailCols(head, speed, P.expo ?? 1);
      trails(bandF, BH, kF, kR, gR, hG, rowUsedB);
      gl.bindTexture(gl.TEXTURE_2D, T_BAND);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, BH, gl.RED, gl.FLOAT, bandF);
      gl.bindTexture(gl.TEXTURE_2D, T_TINT);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, 1, gl.RGBA, gl.UNSIGNED_BYTE, tintB);
    }

    const tp2 = performance.now();
    // ---- transformer layers (hidden-state dashes in an atlas, one block of rows per layer)
    const L = P.layers;
    const nL = L ? Math.min(L.n, MAXL - 1) : 0;
    if (nL > 0) {
      ag.setTransform(1, 0, 0, 1, 0, 0);
      ag.globalCompositeOperation = 'source-over'; ag.fillStyle = '#000'; ag.fillRect(0, 0, W, AH);
      ag.globalCompositeOperation = 'lighter';
      for (let l = 1; l <= nL; l++) {
        const a = L.a[l]; if (a <= 0) continue;
        const pl = L.pulse ? L.pulse[l] : 0;
        const rowC = l * AR + AR / 2;
        for (const v of vis) {
          const xs0 = X(v.x0), xs1 = X(v.x1);
          if (xs1 < 0 || xs0 > W) continue;
          const gp = Math.max(0.6, 0.2 * v.S * zk);
          const wdt = xs1 - xs0 - gp;
          if (wdt < 0.4) continue;
          const act = L.act ? L.act(v.i, l) : 0.5;
          const Ll = L.lit ? (L.lit.get(v.i * 64 + l) || 0) : 0;
          let I = (0.16 + 0.95 * act) * (1 + 1.3 * pl) * edgeW(v.xc) * (0.35 + 0.65 * Math.exp(-Math.pow((v.xc - SX) / 760, 2))) * (1 + 3.0 * Ll);
          if (Math.abs(v.xc - SX) < GAPW) I *= 0.25;
          const hh = Math.max(0.8, Math.min(AR * 0.6, (1.0 + 3.6 * v.S / S0) * zk * (0.55 + 0.9 * act)));
          const val = Math.min(255, Math.round(I / 2 * 255));
          ag.fillStyle = `rgb(${val},${val},${val})`;
          ag.fillRect(xs0 + gp / 2, rowC - hh / 2, wdt, hh);
        }
      }
      const rows = (nL + 1) * AR;
      const d = ag.getImageData(0, 0, W, rows).data;
      unpack(d, atlF, rows, rowUsedA);
      setTrailCols(head, speed, 1, true);
      trails(atlF, rows, kF, kR, gR, hG, rowUsedA);
      gl.bindTexture(gl.TEXTURE_2D, T_ATL);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, rows, gl.RED, gl.FLOAT, atlF.subarray(0, W * rows));
    }

    const tp3 = performance.now();
    // ---- light layer: attention arcs converging on him, fired arcs, extras
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'source-over'; lg.fillStyle = '#000'; lg.fillRect(0, 0, W, Math.min(H, Math.max(lightRows, Math.ceil(HZs + 16 * zk)) + 2));
    lg.globalCompositeOperation = 'lighter'; lg.lineCap = 'butt'; lg.lineJoin = 'bevel';
    const arcsA = (P.arcsA ?? 1) * (1 + (P.arcBoost ?? 0));
    const comet = P.comet && P.comet.amp > 0.01 ? P.comet : null;
    if (arcsA > 0.001) {
      const GAIN = 0.42 * arcsA;
      const topOf = (v) => HZ - v.S / ADV * CAPR - 3;
      for (const v of vis) {
        const t = v.t;
        if (/^ +$/.test(t.t) || t.t === '\n') continue;
        const w0 = hash(v.i, 91, 7);
        if (v.dc < 0) {
          // earlier tokens attending to him: a steady bundle converging on the spark
          const w = (hash(v.i, 90, 7) < 0.3 ? Math.pow(w0, 3) * 0.22 : 0) + (hash(v.i, 92, 7) < 0.035 ? 0.2 + 0.7 * hash(v.i, 93, 7) : 0);
          if (w < 0.006) continue;
          const s = SX - v.xc;
          if (s < 10) continue;
          const hr = (0.12 + 0.27 * Math.pow(Math.min(s, 2400) / SX, 0.7)) * (0.88 + 0.24 * hash(v.i, 94, 7));
          const hmax = HZ - 70 - 60 * hash(v.i, 89, 7);
          const born = sm(0, 60, s);                        // grows out of him as the token leaves
          const a = (0.02 + 0.5 * w) * born;
          const hh = Math.min(s * hr, hmax);
          arc(lg, v.xc, topOf(v), SX, HZ - 3, hh, 0.8, a * (w > 0.3 ? 0.32 : 0.12) * GAIN, a * GAIN, 1.0);
          if (w > 0.3) arc(lg, v.xc, topOf(v), SX, HZ - 3, hh, 0.8, a * 0.02 * GAIN, a * 0.09 * GAIN, 5);
          if (comet && w > 0.03) {
            // a bead of light races out of him along the arc: a soft tail behind a bright head,
            // over the arc itself lit up for the moment
            const ca = Math.min(0.8, comet.amp * (0.2 + 1.3 * w) * born), sz = Math.sqrt(cam.z);
            lg.strokeStyle = `rgba(255,255,255,${(ca * 0.16).toFixed(3)})`; lg.lineWidth = 1.0 * k * sz;
            arcPath(lg, v.xc, topOf(v), SX, HZ - 3, hh, 0.8, comet.t, 1); lg.stroke();
            lg.strokeStyle = `rgba(255,255,255,${(ca * 0.10).toFixed(3)})`; lg.lineWidth = 4.5 * k * sz;
            arcPath(lg, v.xc, topOf(v), SX, HZ - 3, hh, 0.8, comet.t, Math.min(1, comet.t + 0.10)); lg.stroke();
            lg.strokeStyle = `rgba(255,255,255,${(ca * 0.45).toFixed(3)})`; lg.lineWidth = 1.5 * k * sz;
            arcPath(lg, v.xc, topOf(v), SX, HZ - 3, hh, 0.8, comet.t, Math.min(1, comet.t + 0.06)); lg.stroke();
            lg.strokeStyle = `rgba(255,255,255,${ca.toFixed(3)})`; lg.lineWidth = 1.7 * k * sz;
            arcPath(lg, v.xc, topOf(v), SX, HZ - 3, hh, 0.8, comet.t, Math.min(1, comet.t + 0.018)); lg.stroke();
          }
        } else if (hash(v.i, 95, 7) < 0.12 && v.dc > 3) {
          // later positions attending back to him
          const w = Math.pow(hash(v.i, 96, 7), 2.5) * 0.35;
          const s = v.xc - SX;
          const hr = 0.11 + 0.30 * Math.pow(Math.max(s, 1) / SX, 0.7);
          const a = 0.02 + 0.35 * w;
          arc(lg, SX, HZ - 3, v.xc, topOf(v), s * hr, 0.8, a * GAIN, a * 0.12 * GAIN, 0.9);
        }
        // background lace between tokens
        if (hash(v.i, 97, 7) < 0.4 && v.dc > -520) {
          const span = 1 + Math.floor(Math.pow(hash(v.i, 98, 7), 2.4) * 40);
          const j = v.i - span; if (j < iA) continue;
          const tj = TOKS[j], xj = SX + fishM(tj.s0 + tj.n / 2 - head);
          const s = v.xc - xj; if (s < 4) continue;
          const a = (0.015 + 0.05 * Math.pow(hash(v.i, 99, 7), 2)) * GAIN / 0.42;
          arc(lg, xj, topOf(v) + 1, v.xc, topOf(v), s * (0.14 + 0.26 * hash(v.i, 100, 7)), 0.9, a * 0.7, a, 0.8);
        }
      }
    }
    if (P.drawLight) P.drawLight(lg, api);

    // ---- UI layer (HUD)
    if (P.drawUI) {
      ug.setTransform(1, 0, 0, 1, 0, 0);
      ug.clearRect(0, 0, UIW, UIH);
      ug.setTransform(1, 0, 0, 1, 0, -(H - UIH));
      P.drawUI(ug, api);
    }

    const tp4 = performance.now();
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.bindTexture(gl.TEXTURE_2D, T_LIGHT);
    {
      // everything on the light layer sits above the horizon; upload only those rows
      const need = Math.min(H, Math.ceil(HZs + 16 * zk)), rows = Math.max(need, lightRows);
      lightRows = need;
      const px = lg.getImageData(0, 0, W, rows).data;
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, rows, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(px.buffer, px.byteOffset, px.byteLength));
    }
    if (P.drawUI) {
      const px = ug.getImageData(0, 0, UIW, UIH).data;     // straight alpha; premultiplied in the shader
      gl.bindTexture(gl.TEXTURE_2D, T_UI);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, UIW, UIH, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(px.buffer, px.byteOffset, px.byteLength));
    }

    const tp5 = performance.now();
    // ---- Clawd rect (device px, integer-snapped)
    const cell = Math.max(1, Math.round(CELL * zk));
    const cx0 = Math.round(X(SX) - 9 * cell), cy0 = Math.round(Y(HZ - 1) - 10 * cell);
    const clawdOn = P.clawd ?? 1;

    // ---- scene pass
    let U = use(P_SCENE);
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uK, k);
    bindTex(U, 'uNoise', 0, T_NOISE);
    bindTex(U, 'uBand', 1, T_BAND); gl.uniform2f(U.uBandY, bandTop, BH);
    bindTex(U, 'uTint', 5, T_TINT); gl.uniform1f(U.uLWarm, L ? (L.warm ?? 1) : 0);
    bindTex(U, 'uLight', 2, T_LIGHT);
    bindTex(U, 'uAtlas', 3, T_ATL); gl.uniform1f(U.uAtlRow, AR); gl.uniform1f(U.uAtlH, AH);
    bindTex(U, 'uLanes', 4, T_LANES);
    gl.uniform4f(U.uCam, cam.z, cam.fx, cam.fy, zk); gl.uniform2f(U.uCamP, cam.px, cam.py);
    gl.uniform1f(U.uHZ, HZ); gl.uniform1f(U.uSX, SX);
    const LY = new Float32Array(MAXL), LA = new Float32Array(MAXL), LP = new Float32Array(MAXL);
    for (let l = 1; l <= nL; l++) { LY[l - 1] = L.y[l]; LA[l - 1] = L.a[l]; LP[l - 1] = L.pulse ? L.pulse[l] : 0; }
    // atlas block l holds layer l; the shader loop index is l-1, so shift the atlas by one block
    gl.uniform1i(U.uNL, nL);
    gl.uniform1fv(U.uLY, LY); gl.uniform1fv(U.uLA, LA); gl.uniform1fv(U.uLP, LP);
    gl.uniform1f(U.uLaneOff, head * SFAR); gl.uniform1f(U.uLaneA, P.laneA ?? 1);
    gl.uniform1f(U.uTau, P.tau ?? 0); gl.uniform1f(U.uLineG, P.lineG ?? 1); gl.uniform1f(U.uFieldG, P.fieldG ?? 1);
    gl.uniform1f(U.uReflG, P.reflG ?? 1); gl.uniform1f(U.uThread, nL > 0 ? (P.thread ?? 0.5) : 0);
    gl.uniform1f(U.uThreadTop, nL > 0 ? Math.min(...L.y.slice(1, nL + 1)) : HZ);
    const G = P.glow || { amp: 1, r: 1, burst: 0, rot: 0 };
    gl.uniform4f(U.uGlow, G.amp, G.r, G.burst, G.rot || 0);
    gl.uniform2f(U.uClawdW, SX, CYw);
    gl.uniform4f(U.uClawd, cx0, cy0, cell, clawdOn);
    gl.uniform1iv(U.uGlyph, glyphBits);
    gl.uniform1fv(U.uRayTh, rays.th); gl.uniform1fv(U.uRayL, rays.L); gl.uniform1fv(U.uRayW, rays.w);
    gl.uniform1f(U.uTime, P.f / 30);
    {
      const rp = (P.ripples || []).slice(0, 8), buf = new Float32Array(32);
      rp.forEach((r, i) => { buf.set([r.age, r.amp, r.speed ?? 110, r.width ?? 45], i * 4); });
      gl.uniform4fv(U.uRip, buf); gl.uniform1i(U.uNRip, rp.length);
      gl.uniform1f(U.uHaloG, P.haloG ?? 1); gl.uniform1f(U.uRipLayer, P.ripLayer ?? 1.2);
    }
    draw(RT.scene.fb, W, H);

    // ---- bloom
    U = use(P_BRIGHT); gl.uniform2f(U.uRes, W, H); bindTex(U, 'uSrc', 0, RT.scene.t); gl.uniform2f(U.uSrcRes, W, H);
    draw(RT.b0.fb, RT.b0.w, RT.b0.h);
    blur(RT.b0, RT.tmp0, RT.g1, 1.2);
    blur(RT.b0, RT.tmp0, RT.g2, 4.5);
    U = use(P_DOWN); bindTex(U, 'uSrc', 0, RT.b0.t); gl.uniform2f(U.uSrcRes, RT.b0.w, RT.b0.h); gl.uniform2f(U.uF, 2, 2);
    draw(RT.b1.fb, RT.b1.w, RT.b1.h);
    blur(RT.b1, RT.tmp1, RT.g3, 7.5);
    U = use(P_DOWN); bindTex(U, 'uSrc', 0, RT.b0.t); gl.uniform2f(U.uSrcRes, RT.b0.w, RT.b0.h); gl.uniform2f(U.uF, 4, 1);
    draw(RT.f0.fb, RT.f0.w, RT.f0.h);
    blur(RT.f0, null, RT.g4, 17.5, 'h');

    // ---- final
    U = use(P_FINAL);
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uK, k);
    bindTex(U, 'uNoise', 0, T_NOISE);
    bindTex(U, 'uScene', 1, RT.scene.t); bindTex(U, 'uG1', 2, RT.g1.t); bindTex(U, 'uG2', 3, RT.g2.t);
    bindTex(U, 'uG3', 4, RT.g3.t); bindTex(U, 'uG4', 5, RT.g4.t); bindTex(U, 'uUI', 6, T_UI);
    const bw = P.bloom ?? 1;
    gl.uniform4f(U.uBW, 0.20 * bw, 0.16 * bw, 0.15 * bw, 0.09 * bw);
    gl.uniform1f(U.uFrame, P.grainF ?? P.f); gl.uniform1f(U.uBlack, P.black ?? 0); gl.uniform1f(U.uUIA, P.drawUI ? (P.uiA ?? 1) : 0);
    gl.uniform2f(U.uUIR, UIW, UIH);
    gl.uniform1f(U.uGrain, P.grain ?? 1);
    const Wsh = P.wash || { amp: 0, r: 1 };
    gl.uniform4f(U.uWash, Wsh.amp, Wsh.r * k, X(SX), Y(CYw));
    gl.uniform4f(U.uClawd, cx0, cy0, cell, clawdOn);
    gl.uniform1iv(U.uGlyph, glyphBits);
    draw(null, W, H);
    if (P.profile) {
      gl.finish();
      const tp6 = performance.now();
      const d = [tp1 - tp0, tp2 - tp1, tp3 - tp2, tp4 - tp3, tp5 - tp4, tp6 - tp5];
      d.forEach((v, i) => { PROF.t[i] += v; });
      if (++PROF.n % P.profile === 0) {
        log('prof ms: bandDraw ' + PROF.t.map((v) => (v / PROF.n).toFixed(1)).join(' / ') + '  (bandDraw, bandIIR+up, atlas, light, uploads, gl)');
      }
    }
    return api;
  }

  return { render, TOKS, tokAtS, k };
}
