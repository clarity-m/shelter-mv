// The swarm around Alpha Centauri B (S32, S33). Revision 2 (Claire): the shape is 04b pass 1's, a few
// crossing tilted orbital bands around the star, thick with glittering collectors, in the paper world's
// texture: warm vellum chips gathered in ringlets and knots, the wheel habitats (dark card rings with warm
// windows) riding in rows among them, pinprick glints sweeping along each band as it orbits. Far arcs show
// the collectors' lit faces, near arcs their warm backs.
// The eleven-ray spark keeps the style frame's transport (style-frames/13-paper-swarm): the light escapes
// only along the eleven lanes of lib/spark.js, lighting the haze as eleven shafts from the star (there is
// no lantern any more; the lanes are the swarm's cleared channels). A, the faint Sun and the torn-tissue
// Milky Way stay.
// Camera: a true pinhole; S32 dollies it from the hero wheel (whose hub is the sim bubble) out to the icon.
import { glkit, HDR } from '../../lib/glkit.js';
import { NOISE, PAPER, FS_DOWN, FS_UP, FS_FINAL } from '../../lib/paperglsl.js';
import { SPARK } from '../../lib/spark.js';
import { drawShelterStandIn } from './shelter-standin.js';

export const GEOM = {
  Rs: 11, RsT: 8,                       // the star's photosphere; the transport's source radius (px at the icon)
  R1: 86, R2: 128, R3: 172,             // transport geometry (sets the lanes' penumbrae)
  hazeR: [12, 22, 34],                  // the haze starts at hazeR[2]: the shafts rise from the star itself
  // orbital bands: radius and half-width (px at the icon), the view's elevation above the band plane and the
  // screen angle of its major axis (deg), orbit speed (rad/s), brightness, wheel presence, pattern seed.
  // Four near-coplanar bands and one steep ring (the hero's), as in 04b pass 1.
  bands: [
    { R: 262, hw: 16, e: 64, pa: 32, w: 0.0, g: 1.05, wheels: 0.8, seed: 1 },
    { R: 332, hw: 24, e: 16, pa: -6, w: 0.018, g: 0.9, wheels: 0.55, seed: 2 },
    { R: 206, hw: 16, e: 21, pa: 3, w: 0.032, g: 1.0, wheels: 0.55, seed: 3 },
    { R: 140, hw: 11, e: 26, pa: -9, w: 0.055, g: 1.1, wheels: 0.4, seed: 4 },
    { R: 400, hw: 28, e: 12, pa: 2, w: 0.013, g: 0.8, wheels: 0.45, seed: 5 },
  ],
  hero: { band: 0, th: 2.45 },          // the hero wheel's angle on the steep ring (near side, upper left)
  nodeS: 4.2, nodeR: 1.3, hubR: 0.215,  // wheel spacing, wheel radius (px at the icon), hub/wheel
  chipS: 0.55,                          // collector chip spacing (px at the icon)
  A: [-690, -308], sun: [-798, 354],    // Alpha Cen A and the Sun, relative to the star (screen px)
};
const P = {
  F: 5900,                              // the camera's focal length (px)
  L0: 1.0, starW: 14.0, winW: 2.8,
  Lh: 150, g: 0.2, eps: 0.0012, floor: 0.025,
  gOut: 2600, g3: 700, g2: 160, g1: 10,
  mw: 0.16,
};

const COMMON = NOISE + PAPER + `
vec2 dirUV(vec3 d){ return vec2(atan(d.y, d.x)/TAU + 0.5, acos(clamp(d.z, -1.0, 1.0))/PI); }
float angd(float a, float b){ return mod(a - b + PI, TAU) - PI; }
vec3 uvDir(vec2 uv){ float ph = uv.x*TAU - PI, th = uv.y*PI; return vec3(sin(th)*cos(ph), sin(th)*sin(ph), cos(th)); }
uniform vec4 uLane[11];   // port axes and angular radii
uniform float uLaneT[11];  // port veils: light transmitted through each port
uniform vec4 uWin;        // the porthole onto the sim bubble (outer shell only)
float portAngle(vec3 d, int k, out vec3 L){
  float best = 10.0; L = vec3(0.0, 0.0, 1.0);
  for (int j = 0; j < 11; j++){ float a = acos(clamp(dot(d, uLane[j].xyz), -1.0, 1.0)) - uLane[j].w; if (a < best){ best = a; L = uLane[j].xyz; } }
  if (k == 2 && uWin.w > 0.0){ float a = acos(clamp(dot(d, uWin.xyz), -1.0, 1.0)) - uWin.w; if (a < best){ best = a; L = uWin.xyz; } }
  return best;
}
`;

// 1. masks: where direct light can pass each shell (R, G, B = shells 1, 2, 3): the ports only
const FS_MASK = HDR + COMMON + `
uniform vec2 uRes;
out vec4 o;
void main(){
  vec3 d = uvDir(gl_FragCoord.xy/uRes);
  float aa = 0.75*PI/uRes.y;
  vec3 g;
  for (int k = 0; k < 3; k++){ vec3 Lp; g[k] = 1.0 - smoothstep(-aa, aa, portAngle(d, k, Lp)); }
  float bt = 0.0, bd = 10.0;
  for (int j = 0; j < 11; j++){ float a = acos(clamp(dot(d, uLane[j].xyz), -1.0, 1.0)); if (a < bd){ bd = a; bt = uLaneT[j]; } }
  g.z *= bt;
  o = vec4(g, 1.0);
}`;

// 2. transport: the star disc seen through the stacked shells (verbatim from the style frame)
const FS_TRANS = HDR + COMMON + `
uniform sampler2D uMask; uniform vec2 uRes; uniform vec3 uR; uniform float uRsT;
out vec4 o;
void main(){
  vec3 d = uvDir(gl_FragCoord.xy/uRes);
  vec3 t1 = normalize(abs(d.z) < 0.9 ? cross(d, vec3(0.0, 0.0, 1.0)) : cross(d, vec3(1.0, 0.0, 0.0)));
  vec3 t2 = cross(d, t1);
  float rot = h12(gl_FragCoord.xy)*TAU;
  float e1 = 0.0, e2 = 0.0, e3 = 0.0;
  const int N = 32;
  for (int i = 0; i < N; i++){
    float rr = sqrt((float(i) + 0.5)/float(N))*uRsT;
    float a = float(i)*2.39996323 + rot;
    vec3 s = (cos(a)*t1 + sin(a)*t2)*rr;
    float g1a = texture(uMask, dirUV(normalize(d + s*(uR.y - uR.x)/(uR.x*uR.y)))).r;
    float g1b = texture(uMask, dirUV(normalize(d + s*(uR.z - uR.x)/(uR.x*uR.z)))).r;
    float g2b = texture(uMask, dirUV(normalize(d + s*(uR.z - uR.y)/(uR.y*uR.z)))).g;
    float g1c = texture(uMask, dirUV(normalize(d + s/uR.x))).r;
    float g2c = texture(uMask, dirUV(normalize(d + s/uR.y))).g;
    float g3c = texture(uMask, dirUV(normalize(d + s/uR.z))).b;
    e1 += g1a; e2 += g1b*g2b; e3 += g1c*g2c*g3c;
  }
  float streak = 0.45 + 0.75*vn3(d*55.0 + 3.7) + 0.35*vn3(d*150.0 + 9.1);   // fine streaks along each shaft, baked in once
  o = vec4(e1, e2, e3*streak, 0.0)/float(N);
}`;

// 3. haze: single scattering along each line of sight, in the star layer's frame (centre uC, scale uM)
const FS_HAZE = HDR + COMMON + `
uniform sampler2D uE; uniform vec2 uRes; uniform vec2 uC; uniform float uM; uniform vec3 uR; uniform float uRs;
uniform float uLh, uG, uEps, uFloor; uniform vec4 uGain;
out vec4 o;
float hg(float mu){ float g2 = uG*uG; return pow(1.0 + g2, 1.5)/pow(1.0 + g2 - 2.0*uG*mu, 1.5); }
float clump(vec3 P){ float f = fbm3(P/150.0 + vec3(3.1, 7.7, 1.3)); return 0.35 + 1.3*f; }
float region(float rho, vec2 qh, float Rin, float Rout, int ch, float jit){
  if (rho >= Rout) return 0.0;
  float a1 = acos(rho/Rout), a0 = rho < Rin ? acos(rho/Rin) : -a1;
  const int N = 14; float da = (a1 - a0)/float(N), s = 0.0;
  for (int i = 0; i < N; i++){
    float a = a0 + (float(i) + jit)*da;
    vec3 d = vec3(qh*cos(a), sin(a));
    float E = ch == 0 ? 1.0 : (ch == 1 ? texture(uE, dirUV(d)).r : texture(uE, dirUV(d)).g);
    s += E*clump(d*rho/cos(a))*hg(d.z);
  }
  return s*da/rho;
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y)*(1920.0/uRes.x);
  vec2 q = (p - uC)/uM; float rho = max(length(q), 0.75/uM); vec2 qh = q/rho;
  float jit = h12(gl_FragCoord.xy + 0.5);
  float Wout = 0.0;
  float Rf = uR.z + 6.0*uLh;
  if (rho < Rf){
    float amax = acos(clamp(rho/Rf, 0.0, 0.9999));
    float a0 = rho < uR.z ? acos(rho/uR.z) : -amax;
    if (amax > a0){
      const int N = 64; float da = (amax - a0)/float(N);
      for (int i = 0; i < N; i++){
        float a = a0 + (float(i) + jit)*da;
        vec3 d = vec3(qh*cos(a), sin(a));
        float r = rho/cos(a);
        float h = (exp(-(r - uR.z)/uLh) + uFloor*exp(-(r - uR.z)/(3.0*uLh)))*clump(d*r);
        Wout += h*(texture(uE, dirUV(d)).b + uEps)*hg(d.z);          // (E.b carries the shafts' streaks)
      }
      Wout *= da/rho;
    }
  }
  float W3 = region(rho, qh, uR.y, uR.z, 2, jit);
  float W2 = region(rho, qh, uR.x, uR.y, 1, jit);
  float W1 = region(rho, qh, uRs, uR.x, 0, jit);
  o = vec4(Wout, W3, W2, W1)*uGain;
}`;

// 4. scene (revision 2): crossing orbital bands of paper collectors around the star, through a true
// perspective camera (each band is a tilted annulus hit exactly per pixel), composited back to front
// with the star, its corona, a dusting of loose collectors, and the hero wheel's bubble.
const FS_SCENE = HDR + COMMON + `
uniform sampler2D uE, uHz, uSim;
uniform vec3 uCamO; uniform float uCamF;       // camera position (px at the icon; +z toward the viewer), focal length (px)
uniform vec4 uBandA[5], uBandC[5];            // band planes: in-plane axes a (major axis on screen) and c
uniform vec4 uBand[5];                        // radius, half-width, orbit speed (rad/s), brightness
uniform vec4 uBandD[5];                       // wheel presence, seed, hero angle offset (co-rotating rad), is-hero-band
uniform int uNB;
uniform vec4 uStarC;                          // star: screen centre xy, magnification, photosphere radius (px at the icon)
uniform vec4 uBubC;                           // hero bubble: screen centre xy, magnification, screen radius
uniform float uBubZ;                          // hero bubble depth (px at the icon)
uniform float uChipS, uNodeS, uNodeR, uHubW, uTime, uPaperK, uGlitK, uWinW;
uniform float uL0, uStarW, uBubGain, uFilm, uBg, uDust;
uniform vec2 uA, uSun; uniform float uMW;
layout(location = 0) out vec4 oL;     // x: warm light, y: cool light
layout(location = 1) out vec4 oB;     // linear rgb of the paper itself and the sim bubble
const vec3 CARD2 = vec3(0.0052, 0.0065, 0.0144);
struct Lay { float a; float W; vec3 base; float add; };
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }

float splat(float dpx, float rpx){       // pixel coverage of a disc (radius rpx) at distance dpx; sub-pixel discs splat
  if (rpx > 0.8) return clamp(rpx - dpx + 0.5, 0.0, 1.0);
  return min(1.39*rpx*rpx*exp(-dpx*dpx/0.72), 1.0);
}
// a wheel habitat seen face-on, in units of its radius: a torus ring pierced by warm windows, six spokes,
// a collar round the hub. Returns the card's signed distance; dWin: the windows'.
float wheelSD(vec2 u, float spin, out float dWin){
  float r = length(u), a = atan(u.y, u.x) - spin;
  float dRing = max(r - 1.0, 0.78 - r);
  const float NW = 30.0;
  float ca = (fract(a/TAU*NW) - 0.5)*TAU/NW;
  dWin = max(abs(ca*r) - 0.030, abs(r - 0.89) - 0.052);
  const float NS = 6.0;
  float cs = (fract(a/TAU*NS + 0.5) - 0.5)*TAU/NS;
  float dSpoke = max(abs(sin(cs))*r - 0.034, max(uHubW - r, r - 0.80));
  float dHub = max(r - uHubW - 0.035, uHubW - r);
  return min(min(max(dRing, -dWin), dSpoke), dHub);
}
// density of collectors across a band (x in -1..1): a few ringlets with dark gaps; along it (u): knots
float bandKnots(int b, float u){
  vec2 cu = vec2(cos(u), sin(u)); float sd = uBandD[b].y;
  return 0.62 + 0.85*gn(cu*2.6 + sd*7.1) + 0.35*gn(cu*9.0 + sd*3.3);
}
float bandDens(int b, float x, float u, float kn){
  float sd = uBandD[b].y;
  float dens = 0.26*exp(-x*x*1.5);
  for (int k = 0; k < 3; k++){
    vec3 hk = hash3i(ivec3(b, k, 5), 777u + uint(sd));
    float ck = -0.7 + 1.4*hk.x, wk = 0.12 + 0.18*hk.y, ak = 0.65 + 0.45*hk.z;
    float d = (x - ck)/wk; dens += ak*exp(-d*d);
  }
  if (uBandD[b].w > 0.5){
    // the hero's band is a thick stream round the hero (the pull-back travels along it)
    float near = exp(-pow(angd(u, uBandD[b].z)/0.9, 2.0));
    dens += 0.75*near*exp(-x*x/0.25);
    kn = max(kn, mix(kn, 1.15, near));
  }
  dens *= exp(-pow(abs(x)/0.98, 8.0));
  return clamp(dens*clamp(kn, 0.15, 1.4), 0.0, 1.0);
}

// one band, hit at X (px at the icon), mh = screen px per px at the icon there
Lay bandAt(int b, vec3 X, float mh){
  Lay L; L.a = 0.0; L.W = 0.0; L.base = vec3(0.0); L.add = 0.0;
  vec3 a = uBandA[b].xyz, c = uBandC[b].xyz;
  float al = dot(X, a), be = dot(X, c);
  float r = length(vec2(al, be)), R = uBand[b].x, hw = uBand[b].y;
  float v = r - R;
  if (abs(v) > hw*1.1) return L;
  float u = atan(be, al) - uBand[b].z*uTime;          // co-rotating angle along the band
  float x = v/hw;
  float kn0 = bandKnots(b, u);                        // knots vary slowly: one lookup serves the whole cell
  float dens = bandDens(b, x, u, kn0);
  // the star's light: falling off with distance; far arcs show the collectors' lit faces, near arcs
  // their warm backs (backlit vellum)
  float I = uBand[b].w*pow(170.0/max(r, 20.0), 1.3)*uL0;
  float face = X.z < 0.0 ? 1.0 : 0.58;
  float Wc = 3.0*I*face*uPaperK;
  // ---- wheels: rows along the band (the hero's own band is gridded from the hero)
  float sn = uNodeS, Dn = sn/R;
  float uo = uBandD[b].z;
  float iu = floor(angd(u, uo)/Dn + 0.5), iv = floor(v/sn + 0.5);
  vec3 hn = hash3i(ivec3(int(iu), int(iv), b + 17), 5151u);
  bool hero = uBandD[b].w > 0.5 && iu == 0.0 && iv == 0.0;
  float ucn = uo + iu*Dn + (hero ? 0.0 : (hn.x - 0.5)*0.25*Dn), vcn = iv*sn;
  vec2 on = vec2(angd(u, ucn)*R, v - vcn);
  float rw = uNodeR, rpx = rw*mh, dn = length(on);
  bool has = hero || (hn.z < uBandD[b].x*bandDens(b, vcn/hw, ucn, kn0) && abs(vcn) < hw - 0.3*sn);
  float clear = has ? smoothstep(1.05*rw, 1.25*rw, dn) : 1.0;
  // ---- collectors: small vellum chips in rows, most dim, a few glinting as their facets turn
  float sp = uChipS, Du = sp/R;
  float ju = floor(u/Du + 0.5), jv = floor(v/sp + 0.5);
  vec3 hc = hash3i(ivec3(int(ju), int(jv), b), 4242u);
  vec2 cc = vec2((ju + (hc.x - 0.5)*0.35)*Du, (jv + (hc.y - 0.5)*0.35)*sp);
  vec2 off = vec2(angd(u, cc.x)*R, v - cc.y);
  float dc = bandDens(b, cc.y/hw, cc.x, kn0);
  float pres = step(hc.z, dc)*clear;
  vec2 lo = rot2(hc.x*6.2832)*off;
  float sdc = sdBox(lo, vec2(0.28*sp)) - 0.04*sp;
  float spx = sp*mh;
  float lod = smoothstep(1.6, 3.4, spx);                       // 0: too fine to resolve (their average)
  float covAvg = dens*0.45*clear;
  float covChip = pres*clamp(0.5 - sdc*mh, 0.0, 1.0);
  float cov = mix(covAvg, covChip, lod);
  float tone = 0.8 + 0.4*hc.y;
  float fib = lod > 0.01 ? mix(1.0, 0.7 + 0.3*paperT(lo*(24.0/sp), hc.x*9.0), lod) : 1.0;
  float eIn = max(-sdc*mh, 0.0);
  float Wchip = Wc*tone*fib*(1.0 + lod*0.8*exp(-eIn/1.2));   // resolved chips glow along their cut edges
  L.a = cov; L.W = Wchip*1.35; L.base = CARD2*1.4;
  // glints: rare, hot, sweeping along the band as it orbits
  float gsel = step(0.72, fract(hc.z*7.31 + hc.x*3.7))*step(hc.z, dc);
  float facet = pow(0.5 + 0.5*sin(TAU*(hc.x + uTime*(0.18 + 0.3*hc.y)) + u*14.0), 26.0);
  float gpx = max(0.28*sp*mh, 0.35);
  L.add += 13.0*I*gsel*facet*clear*splat(length(off)*mh, gpx)*uGlitK*uPaperK;
  // ---- the wheel over the chips
  if (has){
    float spin = hn.y*TAU + uTime*(hero ? 0.45 : (0.10 + 0.28*hn.x)*(hn.z < 0.3 ? -1.0 : 1.0));
    float res = smoothstep(2.0, 4.0, rpx);
    if (res < 1.0){        // unresolved: a warm speck that now and then catches the light as it turns
      float tw = pow(0.5 + 0.5*sin(TAU*(uTime*(0.2 + 0.4*hn.x) + hn.y)), 24.0)*step(0.5, hn.x);
      float sp2 = (1.0 - res)*splat(dn*mh, rpx);
      L.W = mix(L.W, 1.1*Wc + 0.25*uWinW*uPaperK, sp2); L.a = max(L.a, sp2*0.9);
      L.add += sp2*5.0*I*tw*uGlitK*uPaperK;
    }
    if (res > 0.0 && dn < 1.05*rw){
      vec2 uu = on/rw;
      float dWin; float dCard = wheelSD(uu, spin, dWin);
      float pxu = rpx;
      float rr = length(uu);
      float aDisc = clamp((1.0 - rr)*pxu + 0.5, 0.0, 1.0);
      float aC = clamp(0.5 - dCard*pxu, 0.0, 1.0);
      float aW = clamp(0.5 - dWin*pxu, 0.0, 1.0)*step(0.7, rr);
      float aH = clamp((uHubW - rr)*pxu + 0.5, 0.0, 1.0);
      float eIn2 = max(-dCard*pxu, 0.0);
      float wi = floor((atan(uu.y, uu.x) - spin)/TAU*30.0);
      float lit = step(0.18, fract(sin(wi*12.9898 + hn.x*78.2)*43758.5453));
      float Wwin = uWinW*(0.75 + 0.5*fract(sin(wi*4.1 + hn.y*9.7)*1375.5))*lit*uPaperK;
      float Wcard = max(Wc, 0.5*uPaperK)*(0.75*(0.85 + 0.3*hn.y) + 0.6*exp(-eIn2/1.1));   // star-lit paper, brighter along its cut edges
      float aWheel = max(max(aC, aW), hero ? 0.0 : aH);
      float Wwheel = aWheel > 0.0 ? (aC*Wcard*(1.0 - aW) + aW*Wwin + (hero ? 0.0 : aH*(1.0 - aC)*0.12))/max(aWheel, 1e-3) : 0.0;
      vec3 Bw = CARD2*aC;
      if (!hero) Bw = mix(Bw, mix(lin(vec3(0.79, 0.74, 0.92)), lin(vec3(1.0, 0.84, 0.71)), clamp(0.5 - uu.y/uHubW*0.5, 0.0, 1.0))*0.55, aH*(1.0 - aC));
      float k = res*aDisc;
      L.W = mix(L.W, Wwheel, k); L.base = mix(L.base, Bw/max(aWheel, 1e-3), k); L.a = mix(L.a, aWheel, k);
      L.add *= 1.0 - k;
    }
  }
  return L;
}

// ---- the simulated world: its picture (uSim) seen through a curved skin
vec3 simWorld(vec2 u){
  float r2 = dot(u, u);
  vec2 w = u*(1.0 + 0.10*r2*r2);
  return pow(texture(uSim, clamp(w*0.5 + 0.5, 0.0, 1.0)).rgb, vec3(2.2));
}
// ---- space (static: at infinity the pull-back does not move it)
const vec2 MWA = vec2(0.9204, -0.3912), MWN = vec2(0.3912, 0.9204);
uniform vec2 uMW0;
float mwS(vec2 p, out float t){ vec2 v = p - uMW0; t = dot(v, MWA); return dot(v, MWN) - (0.00009*(t - 850.0)*(t - 850.0) - 65.0); }
float mwW(float t){ return 150.0 + 40.0*sin(t/430.0 + 1.1) + 30.0*gn(vec2(t/260.0, 3.1)); }
float mwProfile(vec2 p){ float t; float s = mwS(p, t); float w = mwW(t); return exp(-2.0*s*s/(w*w)); }
float torn(vec2 p, float s){ return 10.0*fbm(p/60.0 + s, 3) + 3.0*fbm(p/11.0 - s, 2) + 1.3*gn(p/2.6 + s*5.0); }
float milkyWay(vec2 p){
  float t; float s = mwS(p, t); float w = mwW(t);
  float prof = exp(-2.2*s*s/(w*w));
  float along = 0.55 + 0.45*smoothstep(1900.0, -150.0, t);
  float T0 = 0.75*paperT(p*0.7, 5.0);
  float c1 = s - (-22.0 + 34.0*sin(t/310.0));
  float in1 = smoothstep(-0.8, 0.8, (26.0 + 12.0*sin(t/170.0 + 2.0)) + torn(p, 1.0) - abs(c1));
  float c2 = s - (48.0 + 20.0*sin(t/230.0 + 4.0));
  float in2 = smoothstep(-0.8, 0.8, (14.0 + 9.0*sin(t/120.0 + 1.0)) + torn(p, 2.0) - abs(c2));
  float T1 = mix(1.0, 0.72*paperT(p*0.9, 8.0), in1);
  float T2 = mix(1.0, 0.75*paperT(p*1.1, 9.0), in2);
  return uMW*prof*along*T0*T1*T2;
}
float starLayer(vec2 p, float cs, float dens, float seed, float bmin, float bmax, float bpow, float rad){
  vec2 cell = floor(p/cs); float K = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 c = cell + vec2(float(i), float(j));
    vec2 sp = (c + 0.12 + 0.76*h22(c + seed))*cs;
    float dl = dens*(1.0 + 3.0*mwProfile(sp));
    if (h12(c*1.37 + seed*0.71) > dl) continue;
    float u = pow(h12(c + seed*3.3 + 0.5), bpow);
    float b = bmin + (bmax - bmin)*u;
    float r = rad*(0.6 + 0.7*sqrt(u));
    float dd = length(p - sp);
    K += b*clamp(r + 0.5 - dd, 0.0, 1.0) + 0.10*b*exp(-dd*dd/(8.0*r*r));
  }
  return K;
}
float acenA(vec2 p){
  float dd = length(p - uA);
  float tis = paperT(p*1.3, 11.0);
  return 9.0*clamp(2.4 - dd, 0.0, 1.0) + (1.2*exp(-dd/5.0) + 0.32*exp(-dd/20.0))*tis + 0.05*exp(-dd/80.0);
}
float sunDot(vec2 p){
  float dd = length(p - uSun);
  return 2.4*clamp(1.35 - dd, 0.0, 1.0) + 0.30*exp(-dd/3.5)*paperT(p*1.5, 13.0) + 0.05*exp(-dd/14.0);
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, 1080.0 - gl_FragCoord.y);
  vec4 hz = texture(uHz, gl_FragCoord.xy/vec2(1920.0, 1080.0));
  // ---- space behind everything
  vec3 base = lin(mix(vec3(0.027, 0.031, 0.055), vec3(0.055, 0.067, 0.125), clamp(0.25 + 0.55*p.y/1080.0 + 0.25*mwProfile(p), 0.0, 1.0)));
  base *= 0.92 + 0.16*paperS(p, 21.0);
  float Kbg = milkyWay(p) + starLayer(p, 11.0, 0.22, 1.0, 0.02, 0.35, 5.0, 0.55) + starLayer(p, 37.0, 0.30, 2.0, 0.10, 1.40, 3.0, 0.75)
            + acenA(p) + sunDot(p);
  float Wl = 0.0, Kl = Kbg*uBg; vec3 B = base*uBg;
  // ---- the ray through this pixel (camera looks down -z)
  vec3 dir = vec3((p - vec2(960.0, 540.0))/uCamF, -1.0);
  // ---- band hits and the other layers, sorted far to near (ids: 0-4 bands, 5 star, 6 bubble)
  float zs[7]; int ids[7]; int n = 0;
  for (int b = 0; b < 5; b++){
    if (b >= uNB) break;
    vec3 nb = cross(uBandA[b].xyz, uBandC[b].xyz);
    float den = dot(nb, dir);
    if (abs(den) < 1e-6) continue;
    float t = -dot(nb, uCamO)/den;
    if (t <= 0.0) continue;
    vec3 X = uCamO + t*dir;
    float r = length(X);
    if (abs(r - uBand[b].x) > uBand[b].y*1.1) continue;
    zs[n] = X.z; ids[n] = b; n++;
  }
  zs[n] = 0.0; ids[n] = 5; n++;
  zs[n] = uBubZ + 0.01; ids[n] = 6; n++;
  for (int i = 1; i < 7; i++){           // insertion sort, ascending z (far first)
    if (i >= n) break;
    float zk = zs[i]; int ik = ids[i]; int j = i - 1;
    for (int s = 0; s < 7; s++){ if (j < 0 || zs[j] <= zk) break; zs[j + 1] = zs[j]; ids[j + 1] = ids[j]; j--; }
    zs[j + 1] = zk; ids[j + 1] = ik;
  }
  for (int i = 0; i < 7; i++){
    if (i >= n) break;
    int id = ids[i];
    if (id == 5){
      // the star: a hot photosphere and its corona, with a dusting of loose collectors in its plane
      vec2 q = p - uStarC.xy; float m0 = uStarC.z, rs = length(q), Rs = uStarC.w*m0;
      vec2 wd = q/m0; float rr = length(wd);
      if (uDust > 0.0){
        vec2 cid = floor(wd/6.0); vec3 hd = hash3i(ivec3(ivec2(cid), 3), 9001u);
        vec2 cpos = (cid + 0.2 + 0.6*hd.xy)*6.0;
        float pd = 0.55*exp(-pow(length(cpos)/300.0, 2.0))*smoothstep(35.0, 90.0, length(cpos));
        float twd = 0.4 + 2.2*pow(0.5 + 0.5*sin(TAU*(uTime*(0.3 + 0.5*hd.z) + hd.x)), 16.0);
        Wl += uDust*step(hd.z, pd)*splat(length(wd - cpos)*m0, max(0.3*m0, 0.35))*1.6*pow(170.0/max(length(cpos), 30.0), 1.3)*twd*uPaperK*uL0;
      }
      Wl += uL0*(2.6*exp(-rs/(13.0*m0)) + 0.8*exp(-rs/(48.0*m0)) + 0.18*exp(-rs/(160.0*m0)));
      if (rs < Rs + 1.0){
        float as = clamp(Rs - rs + 0.5, 0.0, 1.0);
        float mu = sqrt(max(1.0 - (rs/Rs)*(rs/Rs), 0.0));
        Wl = mix(Wl, uStarW*uL0*(0.55 + 0.45*mu)*(0.85 + 0.3*fbm(wd*0.8, 3)), as);
        Kl *= 1.0 - as; B *= 1.0 - as;
      }
    } else if (id == 6){
      // the sim bubble: the hub of the hero wheel habitat
      vec2 qb = p - uBubC.xy; vec2 ub = qb/uBubC.w; float rb = length(ub); float bz = uBubC.w;
      if (rb < 1.5){
        vec2 toKey = vec2(0.80, -0.59);
        float ab = clamp((1.0 - rb)*bz + 0.5, 0.0, 1.0);
        if (ab > 0.0){
          vec3 col = simWorld(ub);
          float film = smoothstep(0.80, 1.0, rb) + uFilm;
          vec3 irid = lin(vec3(0.74, 0.90, 0.94)*(0.5 + 0.5*cos(vec3(0.0, 2.1, 4.2) + atan(ub.y, ub.x)*2.0 + rb*9.0))*0.5 + 0.5);
          col = mix(col, col*0.8 + irid*0.30, clamp(film, 0.0, 1.0));
          float spec = exp(-pow(length(ub - 0.62*toKey)/0.16, 2.0));
          Wl = mix(Wl, 0.8*spec + 0.08*film, ab); B = mix(B, col*uBubGain, ab); Kl *= 1.0 - ab;
        }
      }
    } else {
      float t = -dot(cross(uBandA[id].xyz, uBandC[id].xyz), uCamO)/dot(cross(uBandA[id].xyz, uBandC[id].xyz), dir);
      vec3 X = uCamO + t*dir;
      Lay L = bandAt(id, X, uCamF/t);
      Wl = mix(Wl, L.W, L.a) + L.add; B = mix(B, L.base, L.a); Kl *= 1.0 - L.a;
    }
  }
  // the air: light scattered along the eleven shafts and around the star
  Wl += hz.x + hz.y + hz.z + hz.w;
  oL = vec4(Wl, Kl, 0.0, 1.0);
  oB = vec4(B, 1.0);
}`;

const norm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export function createSwarm(canvas, log = () => {}, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('no webgl2');
  const K = glkit(gl, log);
  const W = 1920, H = 1080;
  const G = GEOM;
  const pMask = K.program(FS_MASK, 'mask'), pTrans = K.program(FS_TRANS, 'trans'), pHaze = K.program(FS_HAZE, 'haze');
  const pScene = K.program(FS_SCENE, 'scene'), pDown = K.program(FS_DOWN, 'down'), pUp = K.program(FS_UP, 'up'), pFinal = K.program(FS_FINAL, 'final');
  const tMask = K.target(2048, 1024, 1, gl.REPEAT), tE = K.target(1024, 512, 1, gl.REPEAT), tHz = K.target(640, 360), tS = K.target(W, H, 2);
  const tMaskLo = K.target(1024, 512, 1, gl.REPEAT), tELo = K.target(512, 256, 1, gl.REPEAT);
  let curE = tE;
  const sizes = [[960, 540], [480, 270], [240, 135], [120, 68], [60, 34]];
  const down = sizes.map((s) => K.target(s[0], s[1])), up = sizes.slice(0, 4).map((s) => K.target(s[0], s[1]));
  const simTex = K.canvasTexture(opts.simSource || drawShelterStandIn(2048));

  const laneDirs = SPARK.map((r) => { const a = r.a * Math.PI / 180; return [Math.cos(r.el) * Math.cos(a), Math.cos(r.el) * Math.sin(a), Math.sin(r.el)]; });
  const WIN = [0, 0, 1, -1];                            // no porthole
  const R = [G.R1, G.R2, G.R3];
  const lanes = (portScale) => { const a = new Float32Array(44); laneDirs.forEach((L, j) => a.set([L[0], L[1], L[2], SPARK[j].port * 1.3 * portScale[j]], j * 4)); return a; };
  const LANE_T = new Float32Array(SPARK.map((r) => Math.exp((r.len - 1) * (opts.veil ?? 4.2))));
  let lastPorts = '';
  function transport(portScale) {
    const key = portScale.map((x) => x.toFixed(4)).join(',');
    if (key === lastPorts) return;
    lastPorts = key;
    const lo = portScale.some((x) => Math.abs(x - 1) > 1e-4);      // animating ports (S33): half-res masks are plenty
    const tm = lo ? tMaskLo : tMask, te = lo ? tELo : tE;
    K.setU(pMask, { uRes: [tm.w, tm.h], uLane: lanes(portScale), uWin: WIN, uLaneT: { f1: LANE_T } }); K.draw(pMask, tm);
    K.setU(pTrans, { uRes: [te.w, te.h], uR: R, uRsT: G.RsT, uLane: lanes(portScale), uWin: WIN });
    K.tex(pTrans, { uMask: tm.tex }); K.draw(pTrans, te);
    curE = te;
  }
  function pyramid(src) {
    let s = src;
    for (let i = 0; i < down.length; i++) {
      K.setU(pDown, { uTS: [down[i].w, down[i].h], uSrcTexel: [1 / s.w, 1 / s.h], uPre: { i: i === 0 ? 1 : 0 }, uThr: [2.2, 1.6] });
      K.tex(pDown, { uSrc: s.tex }); K.draw(pDown, down[i]); s = down[i];
    }
    let low = down[down.length - 1];
    for (let i = up.length - 1; i >= 0; i--) {
      K.setU(pUp, { uTS: [up[i].w, up[i].h], uLowTexel: [1 / low.w, 1 / low.h], uCurW: i === 0 ? 0.6 : 1.0 });
      K.tex(pUp, { uLow: low.tex, uCur: down[i].tex }); K.draw(pUp, up[i]); low = up[i];
    }
    return up[0];
  }

  // ---- revision 2: the swarm is a set of crossing orbital bands of collectors (04b pass 1's shape)
  const BANDS = G.bands.map((b) => {
    const e = b.e * Math.PI / 180, pa = b.pa * Math.PI / 180;
    const a = [Math.cos(pa), Math.sin(pa), 0];
    const c = [Math.sin(e) * Math.sin(pa), -Math.sin(e) * Math.cos(pa), Math.cos(e)];   // near arc up, lit far arc down
    return Object.assign({}, b, { a, c });
  });
  const hb = BANDS[G.hero.band];
  const heroTh = G.hero.th;                              // the hero band does not orbit, so the hero stays put
  const HERO_P = [0, 1, 2].map((i) => hb.R * (Math.cos(heroTh) * hb.a[i] + Math.sin(heroTh) * hb.c[i]));
  const HERO_RB = G.hubR * G.nodeR;                      // the bubble's radius, px at the icon
  const bandU = (() => {
    const A = new Float32Array(20), C = new Float32Array(20), Bd = new Float32Array(20), D = new Float32Array(20);
    BANDS.forEach((b, i) => {
      A.set([...b.a, 0], i * 4); C.set([...b.c, 0], i * 4);
      Bd.set([b.R, b.hw, i === G.hero.band ? 0 : b.w, b.g], i * 4);
      D.set([b.wheels, b.seed, i === G.hero.band ? heroTh : 0, i === G.hero.band ? 1 : 0], i * 4);
    });
    return { uBandA: A, uBandC: C, uBand: Bd, uBandD: D, uNB: { i: BANDS.length } };
  })();

  // Camera: a pinhole at (cam, D) looking down -z, focal length F. Z is the magnification of the hero's
  // plane (S32 dollies Z from 4000+ down to 1); D = zh + F/Z keeps the hero at magnification Z.
  function camera(st) {
    const F = P.F, Z = st.Z ?? 1, cam = st.cam || [0, 0];
    const D = HERO_P[2] + F / Z;
    const m0 = F / D, mh = F / (D - HERO_P[2]);
    const star = [960 + m0 * (0 - cam[0]), 540 + m0 * (0 - cam[1])];
    const bub = [960 + mh * (HERO_P[0] - cam[0]), 540 + mh * (HERO_P[1] - cam[1]), mh, HERO_RB * mh];
    return { F, O: [cam[0], cam[1], D], m0, star, bub };
  }

  // st: { Z, cam, ports:[11 scale], L0, t, exposure, fade, paper, glit, bg, bubGain, film, haze, diffuse, dust, vig, grain }
  function render(st) {
    const ps = st.ports || new Array(11).fill(1);
    transport(ps);
    const cm = camera(st);
    const L0 = st.L0 ?? P.L0;
    // haze (the eleven shafts and the glow round the star) in the star's frame
    K.setU(pHaze, { uRes: [tHz.w, tHz.h], uC: cm.star, uM: cm.m0, uR: G.hazeR, uRs: G.Rs, uLh: P.Lh, uG: P.g, uEps: P.eps * (st.diffuse ?? 1), uFloor: P.floor,
      uGain: [P.gOut * L0, P.g3 * L0, P.g2 * L0, P.g1 * L0].map((x) => x * (st.haze ?? 1)) });
    K.tex(pHaze, { uE: curE.tex }); K.draw(pHaze, tHz);
    K.setU(pScene, Object.assign({}, bandU, {
      uCamO: cm.O, uCamF: cm.F, uStarC: [cm.star[0], cm.star[1], cm.m0, G.Rs], uBubC: cm.bub, uBubZ: HERO_P[2],
      uChipS: G.chipS, uNodeS: G.nodeS, uNodeR: G.nodeR, uHubW: G.hubR, uTime: st.t || 0, uPaperK: st.paper ?? 1, uGlitK: st.glit ?? 1, uWinW: P.winW,
      uL0: L0, uStarW: P.starW, uBubGain: st.bubGain ?? 0.55, uFilm: st.film ?? 0, uBg: st.bg ?? 1, uDust: (st.dust ?? 1) * (1 - Math.min(Math.max((cm.m0 - 1.5) / 3, 0), 1)),
      uA: [960 + G.A[0], 540 + G.A[1]], uSun: [960 + G.sun[0], 540 + G.sun[1]], uMW0: [960 + G.sun[0], 540 + G.sun[1]], uMW: P.mw,
    }));
    K.tex(pScene, { uE: curE.tex, uHz: tHz.tex, uSim: simTex }); K.draw(pScene, tS);
    const bloom = pyramid({ tex: tS.texs[0], w: W, h: H });
    // st.grain / st.vig: grade overrides (S32 eases them in from S31's grade); defaults are the swarm's own
    K.setU(pFinal, { uRes: [W, H], uExp: st.exposure ?? 1.0, uBloomW: 0.35, uBloomK: 0.30, uGrain: st.grain ?? 0.03, uVig: st.vig ?? 0.18, uFade: st.fade ?? 1, uAddW: 0, uFloor: st.floor ?? 1, uSeed: st.seed || 0 });
    K.tex(pFinal, { uL: tS.texs[0], uB: tS.texs[1], uBloom: bloom.tex, uAdd: tS.texs[0] });
    K.draw(pFinal, null, W, H);
  }
  return { render, gl, sync: K.sync, GEOM: G, laneDirs, HERO_RB, HERO_P, F: P.F };
}
