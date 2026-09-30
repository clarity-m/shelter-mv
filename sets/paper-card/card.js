// The bookend card (S01, S02, S33): black card over a lamp-lit tissue, backlit cut paper.
//
// Layers, front to back: the card (z = 0) with its cut hole; kirigami flaps swinging back into
// the box behind the card; the tissue diffuser with a lamp behind it. The hole is the union of
//   - the square: Clawd's two heart cells (row 2, cols 8-9), always cut;
//   - eleven ray flaps (lib/spark.js): tapered capsules clipped to their angular sectors, each
//     hinged at its tip. Opening o in 0..1 swings the flap back about the hinge; the flap's
//     projected length is (1 - o), so the light runs out from the hub along the ray;
//   - eight Clawd pieces, each hinged on the side away from the centre: row 2 left and right
//     (the arms), rows 0-1 (the head, with the eyes left standing as card), row 3, four legs.
// Light: the tissue shows the lamp (hot core, orange falloff) with paper fibre. The card's cut
// edges carry a 1-2 px rim and a thin-paper edge glow; flaps are dark card with a glowing free
// edge. Light spilling through the hole lights the air (a blurred glow that also rakes the card
// face and shows its fibre) and throws soft radial shafts. Grade: lib/paperglsl.js FS_FINAL,
// identical to the swarm. Everything is a pure function of the state passed to render().
import { glkit, HDR } from '../../lib/glkit.js';
import { NOISE, PAPER, FS_DOWN, FS_UP, FS_FINAL } from '../../lib/paperglsl.js';
import { SPARK, CARD_GEOM } from '../../lib/spark.js';
import { GLYPH } from '../../lib/clawd.js';

const SCENE = HDR + NOISE + PAPER + `
uniform vec2 uRes;              // target size in px
uniform float uSc;              // target px per 1920-frame px
uniform vec2 uCC; uniform float uMC;   // card centre (1920-frame px) and magnification
uniform vec2 uTC; uniform float uMT;   // tissue centre and magnification
uniform float uCell;
uniform vec4 uRay[11];          // axis dir.xy, length L, base radius r1
uniform vec4 uRayB[11];         // tip radius r2, open o, angle (rad), 0
uniform float uCells[90];      // Clawd cell opens, row*18 + col (the two heart cells, the square, are always open)
uniform int uGlyph[5];
uniform float uRot, uRotC;      // card rotation (rad, clockwise): the spark's frame, and Clawd's (uRot - pi)
uniform vec4 uGlint;            // glint: intensity, direction toward the light (rad, screen), sharpness, 0
uniform float uLight; uniform vec4 uLamp;
uniform sampler2D uGlow; uniform float uHaze, uFront;
uniform float uHoleOnly;        // 1: output only the light passing through the open hole
uniform float uWob, uFlapT, uEdge, uRim, uCardOn;
layout(location = 0) out vec4 oL;
layout(location = 1) out vec4 oB;
const vec3 CARD = vec3(0.0017, 0.0023, 0.0066);   // black card, (14,16,26) after the grade

float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float sdUnevenCapsule(vec2 p, float r1, float r2, float h){   // axis along +y from 0 to h
  p.x = abs(p.x);
  float b = (r1 - r2)/h, a = sqrt(1.0 - b*b), k = dot(p, vec2(-b, a));
  if (k < 0.0) return length(p) - r1;
  if (k > a*h) return length(p - vec2(0.0, h)) - r2;
  return dot(p, vec2(a, b)) - r1;
}
bool glyphAt(int r, int c){ if (r < 0 || r > 4 || c < 0 || c > 17) return false; return ((uGlyph[r] >> c) & 1) != 0; }
bool isSq(int r, int c){ return r == 2 && (c == 8 || c == 9); }
float cellOpen(int r, int c){ if (!glyphAt(r, c)) return 0.0; if (isSq(r, c)) return 1.0; return uCells[r*18 + c]; }
bool inCut(ivec2 n){ return cellOpen(n.y, n.x) > 0.0; }
float sqSD(vec2 w){ return sdBox(w, vec2(uCell)); }
// signed distance (world px) to the union of cut Clawd cells; ic = the cell under w
float clawdSD(vec2 w, out ivec2 ic){
  float c = uCell; vec2 o0 = vec2(-9.0*c, -5.0*c);
  ic = ivec2(floor((w - o0)/vec2(c, 2.0*c)));
  bool inside = inCut(ic);
  float dmin = 1e5;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    ivec2 n = ic + ivec2(i, j);
    if (inCut(n) == inside) continue;
    vec2 cc = o0 + (vec2(n) + 0.5)*vec2(c, 2.0*c);
    dmin = min(dmin, sdBox(w - cc, vec2(0.5*c, c)));
  }
  return inside ? -dmin : dmin;
}
float angd(float a, float b){ return mod(a - b + PI, TAU) - PI; }   // signed a - b
float capSD(vec2 w, int j){
  vec2 dir = uRay[j].xy; vec2 pp = vec2(-dir.y, dir.x);
  return sdUnevenCapsule(vec2(dot(w, pp), dot(w, dir)), uRay[j].w, uRayB[j].x, uRay[j].z);
}
// Flap j owns its capsule minus the capsules of flaps cut before it (lower rank, uRayB.w) and the square.
float regionSD(vec2 w, int j, float cj){
  float d = max(cj, -sqSD(w));
  for (int i = 0; i < 11; i++){ if (uRayB[i].w < uRayB[j].w) d = max(d, -capSD(w, i)); }
  return d;
}
float lampAt(vec2 wt){ float r = length(wt); return uLamp.x*exp(-r/uLamp.y) + uLamp.z*exp(-r/uLamp.w); }

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y)/uSc;       // 1920-frame px, y down
  vec2 q = (p - uCC)/uMC;
  vec2 w = rot2(-uRot)*q;                                           // card world px, the spark's frame
  vec2 wc = rot2(-uRotC)*q;                                         // the same card, Clawd's frame
  vec2 wt = (p - uTC)/uMT;                                          // tissue world px (does not turn)
  // ---- the hole outline: the cut Clawd cells (with the square) and the open ray flaps
  ivec2 cell; float dC = clawdSD(wc, cell);
  float cap[11]; float dR = 1e5; int rOwn = -1; float bestRank = 99.0;
  for (int j = 0; j < 11; j++){
    cap[j] = capSD(w, j);
    if (cap[j] < 0.0 && uRayB[j].w < bestRank){ bestRank = uRayB[j].w; rOwn = j; }
  }
  for (int j = 0; j < 11; j++){
    if (uRayB[j].y <= 0.0) continue;
    float d = cap[j];
    for (int i = 0; i < 11; i++){ if (uRayB[i].w < uRayB[j].w && uRayB[i].y <= 0.0) d = max(d, -cap[i]); }
    dR = min(dR, d);
  }
  float dH = min(dC, dR);
  vec2 gH = vec2(dFdx(dH), -dFdy(dH));                             // screen gradient (y down): points into the card
  vec2 nH = gH/max(length(gH), 1e-6);
  float ePx = dH*uMC + uWob*wobble(w*1.0, 3.0);                   // screen px, >0 in the card
  float aCard = clamp(ePx + 0.5, 0.0, 1.0)*uCardOn;               // uCardOn 0: the camera has passed the card
  // ---- the light box behind: the tissue and the lamp
  float lamp = uLight*lampAt(wt);
  float Wt = lamp*(0.58 + 0.42*paperT(wt*1.15, 3.0));
  // ---- flaps swinging back inside the hole
  // ray flap over this pixel (1 = no ray opening here)
  float coverR = 1.0, fER = 1e3, kR = 0.0; vec2 wfR = w;
  if (dR < 0.0 && rOwn >= 0 && sqSD(wc) > 0.0){
    int j = rOwn;
    float o = uRayB[j].y, cs = max(1.0 - o, 1e-3);
    vec2 dir = uRay[j].xy; vec2 pp = vec2(-dir.y, dir.x);
    float xa = dot(w, dir), ya = dot(w, pp), xh = uRay[j].z;
    if (xa < xh){
      float s = xh - (xh - xa)/cs;
      wfR = s*dir + ya*pp;
      float sd = regionSD(wfR, j, capSD(wfR, j));
      fER = -sd*mix(cs, 1.0, 0.35)*uMC;
      coverR = clamp(fER + 0.5, 0.0, 1.0)*smoothstep(0.0, 0.03, cs);
    } else coverR = 1.0 - smoothstep(0.93, 0.99, o);
    kR = 1.5*smoothstep(0.0, 0.10, o);
  } else if (dR < 0.0) coverR = 0.0;
  // Clawd cell flap over this pixel (1 = no cell opening here); each cell is its own small flap,
  // hinged on the side away from the heart
  float coverC = 1.0, fEC = 1e3, kC = 0.0; vec2 wfC = wc;
  if (dC < 0.0){
    if (isSq(cell.y, cell.x)) coverC = 0.0;
    else if (glyphAt(cell.y, cell.x)){
      int r = cell.y, cc = cell.x;
      float o = cellOpen(r, cc), cs = max(1.0 - o, 1e-3), c = uCell;
      float xl = -9.0*c + float(cc)*c, xr = xl + c, yt = -5.0*c + 2.0*float(r)*c, yb = yt + 2.0*c, fr;
      vec2 s = wc;
      if (r == 2 && cc < 8){ s.x = xl + (wc.x - xl)/cs; fr = xr - s.x; }
      else if (r == 2){ s.x = xr - (xr - wc.x)/cs; fr = s.x - xl; }
      else if (r < 2){ s.y = yt + (wc.y - yt)/cs; fr = yb - s.y; }
      else { s.y = yb - (yb - wc.y)/cs; fr = s.y - yt; }
      fEC = fr*cs*uMC; coverC = clamp(fEC + 0.5, 0.0, 1.0)*smoothstep(0.0, 0.03, cs);
      wfC = s; kC = 1.5*smoothstep(0.0, 0.10, o);
    }
  }
  // light passes wherever either opening is clear (paper already cut away cannot cover it again)
  float cover, fEdge, kerfPx; vec2 wf;
  if (coverR <= coverC){ cover = coverR; fEdge = fER; wf = wfR; kerfPx = kR; } else { cover = coverC; fEdge = fEC; wf = wfC; kerfPx = kC; }
  if (dH >= 0.0){ cover = 0.0; kerfPx = 0.0; }
  cover *= clamp(-dH*uMC - kerfPx + 0.5, 0.0, 1.0);
  cover *= uCardOn;
  float thru = (1.0 - aCard)*(1.0 - cover);
  if (uHoleOnly > 0.5){ oL = vec4(thru*Wt, 0.0, 0.0, 1.0); oB = vec4(0.0); return; }
  vec3 glow = texture(uGlow, gl_FragCoord.xy/uRes).rgb;
  // flap: dark card, lit only at its free edge and faintly through its body
  float Wf = lamp*(uFlapT*paperT(wf*1.3, 7.0) + uEdge*(0.9*exp(-max(fEdge, 0.0)/0.9) + 0.25*exp(-max(fEdge, 0.0)/4.0)));
  float surfF = paperS(wf*1.2, 5.0);
  // card face: black card, raked by the light spilling into the air in front of it
  float surf = paperS(w*1.0, 1.0);
  float lampE = lamp*uCardOn;                                        // the tissue right behind this bit of card
  float e = max(ePx, 0.0);
  float Wc = uFront*glow.x*(0.65 + 0.7*surf) + lampE*(uRim*exp(-e/0.6) + uEdge*0.35*exp(-e/2.6));
  // glint: a cut face that turns toward the key light catches it (the spin carries the glint along the rays)
  float face = max(dot(-nH, vec2(cos(uGlint.y), sin(uGlint.y))), 0.0);
  Wc += uCardOn*uGlint.x*pow(face, uGlint.z)*(6.5*exp(-e/0.9) + 1.3*exp(-e/4.0)*(0.75 + 0.5*surf));
  vec3 Bc = CARD*(0.9 + 0.25*surf);
  float Wh = mix(Wt, Wf, cover);
  vec3 Bh = mix(CARD*0.8*(1.0 - smoothstep(0.0, 0.4, Wt)), CARD*(0.85 + 0.2*surfF), cover);   // the unlit box reads as card
  float W = mix(Wh, Wc, aCard) + uHaze*glow.x;
  vec3 B = mix(Bh, Bc, aCard);
  oL = vec4(W, 0.0, 0.0, 1.0); oB = vec4(B, 1.0);
}`;

// soft shafts: light through the hole smeared radially away from the lamp
const RAYS = HDR + NOISE + `
uniform sampler2D uHole; uniform vec2 uTS, uCtr; uniform float uLen, uDecay;
out vec4 o;
void main(){
  vec2 uv = gl_FragCoord.xy/uTS; vec2 d = uv - uCtr;
  float jit = h12(gl_FragCoord.xy);
  float acc = 0.0, ws = 0.0;
  for (int i = 0; i < 40; i++){
    float t = (float(i) + jit)/40.0;
    float wgt = exp(-uDecay*t);
    acc += texture(uHole, uCtr + d*(1.0 - uLen*t)).x*wgt; ws += wgt;
  }
  o = vec4(acc/ws, 0.0, 0.0, 1.0);
}`;

// motion blur for the spinning card: taps along the arc about the spin centre (shutter = uSpan rad)
const ROTBLUR = HDR + NOISE + `
uniform sampler2D uL, uB; uniform vec2 uRes, uCtr; uniform float uSpan;
layout(location = 0) out vec4 oL;
layout(location = 1) out vec4 oB;
void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y), d = p - uCtr;
  float jit = h12(gl_FragCoord.xy) - 0.5;
  vec4 aL = vec4(0.0), aB = vec4(0.0);
  for (int i = 0; i < 7; i++){
    float a = uSpan*((float(i) + 0.5 + 0.8*jit)/7.0 - 0.5);
    vec2 q = uCtr + rot2(a)*d;
    vec2 uv = vec2(q.x, uRes.y - q.y)/uRes;
    aL += texture(uL, uv); aB += texture(uB, uv);
  }
  oL = aL/7.0; oB = aB/7.0;
}`;

// ---------------------------------------------------------------- revision 5 (S01): the humans' cursor
// Opt-in with st.cursor = { samples: [[x, y, scale, press] x 5] } (the tip in 1920-frame px at five
// moments across a half-open shutter). Without it every program and pass is the original (S02, S33).
// The cursor is the humans' indigo paper arrow (sets/early-env/papercursor.js's shape). It lies on
// the card in front of the hole: a dark card silhouette against the light, rim-lit by the light behind
// and round it, faintly cool on its upper-left edges like the paper world. It also shades the light
// through the hole, so the glow and the shafts carry its shadow.
const ARROW = [[0, 0], [0, 72], [17, 57], [28, 84], [40, 79], [29, 53], [51, 53]];
const CUR_TILT = -0.05;                      // the arrow's slight tilt (papercursor.js)
const ARROW_GLSL = `
uniform vec4 uCur[5];                        // tip x, y (1920-frame px), scale, press
uniform vec2 uArrow[7];
float sdArrow(vec2 p, out vec2 n){           // polygon SDF (arrow px) and its outward normal
  vec2 g = p - uArrow[0]; float d = dot(g, g), s = 1.0;
  for (int i = 0, j = 6; i < 7; j = i, i++){
    vec2 e = uArrow[j] - uArrow[i], w = p - uArrow[i];
    vec2 b = w - e*clamp(dot(w, e)/dot(e, e), 0.0, 1.0);
    float bb = dot(b, b);
    if (bb < d){ d = bb; g = b; }
    bvec3 c = bvec3(p.y >= uArrow[i].y, p.y < uArrow[j].y, e.x*w.y > e.y*w.x);
    if (all(c) || all(not(c))) s = -s;
  }
  n = s*g/max(length(g), 1e-6);
  return s*sqrt(d);
}
// the cursor k-th of five moments across the shutter, jittered per pixel along the sampled path
// (so a fast move blurs smoothly instead of showing five copies)
vec4 curAt(int k, float jit){
  float t = clamp((float(k) + jit)/5.0*4.0, 0.0, 4.0); int i = min(int(t), 3);
  return mix(uCur[i], uCur[i + 1], t - float(i));
}
// one shutter sample: coverage (target px antialiasing), depth inside (1920 px), screen normal
float curSample(vec2 p, vec4 c, float sc, out float e, out vec2 n, out vec2 q){
  q = rot2(${(-CUR_TILT).toFixed(3)})*(p - c.xy)/c.z;
  e = 0.0; n = vec2(0.0);
  if (q.x < -10.0 || q.y < -10.0 || q.x > 62.0 || q.y > 95.0) return 0.0;
  vec2 nl; float d = sdArrow(q, nl) + 0.9*wobble(q*2.0, 5.0)/2.0;
  float dpx = d*c.z;
  e = max(-dpx, 0.0); n = rot2(${CUR_TILT.toFixed(3)})*nl;
  return clamp(0.5 - dpx*sc, 0.0, 1.0);
}
`;
// the hole pass with the cursor's shade (so the glow and the shafts carry its shadow)
function sceneWithCursor(src) {
  const put = (s, anchor, repl) => { if (s.split(anchor).length !== 2) throw new Error('card cursor patch: ' + anchor.slice(0, 40)); return s.replace(anchor, () => repl); };
  let s = put(src, 'layout(location = 0) out vec4 oL;', ARROW_GLSL + 'layout(location = 0) out vec4 oL;');
  s = put(s, 'if (uHoleOnly > 0.5){ oL = vec4(thru*Wt, 0.0, 0.0, 1.0); oB = vec4(0.0); return; }',
    `if (uHoleOnly > 0.5){
    float sh = 0.0, e, jit = h12(gl_FragCoord.xy + 3.1); vec2 n, qq;
    for (int k = 0; k < 5; k++) sh += curSample(p, curAt(k, jit), uSc, e, n, qq);
    oL = vec4(thru*Wt*(1.0 - 0.2*sh), 0.0, 0.0, 1.0); oB = vec4(0.0); return; }`);
  return s;
}
// the cursor over the finished scene (after the card's motion blur, which is the card's own)
const CURSOR_FS = HDR + NOISE + PAPER + ARROW_GLSL + `
uniform sampler2D uL, uB, uGlow; uniform vec2 uRes, uHub; uniform float uSc;
uniform float uHaze, uRimB, uRimD, uThin, uCool; uniform vec3 uCurCol;
layout(location = 0) out vec4 oL;
layout(location = 1) out vec4 oB;
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec4 L = texture(uL, uv), B = texture(uB, uv);
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y)/uSc;
  float A = 0.0, RB = 0.0, RD = 0.0, RC = 0.0, F = 0.0;
  vec2 toHub = normalize(uHub - p + 1e-4), ul = normalize(vec2(-0.6, -0.8));
  float jit = h12(gl_FragCoord.xy*1.37 + 0.7);
  for (int k = 0; k < 5; k++){
    float e; vec2 n, q; vec4 ck = curAt(k, jit);
    float c = curSample(p, ck, uSc, e, n, q);
    if (c <= 0.0) continue;
    float pr = ck.w;
    A += c;
    RB += c*(exp(-e/0.75) + 0.3*exp(-e/2.5));
    RD += c*max(dot(n, toHub), 0.0)*(exp(-e/1.1) + 0.25*exp(-e/4.0));
    RC += c*max(dot(n, ul), 0.0)*exp(-e/0.9)*(1.0 - 0.3*pr);
    F += c*paperS(q*1.6, 9.0);
  }
  if (A <= 0.0){ oL = L; oB = B; return; }
  float a = A/5.0, glow = texture(uGlow, uv).x;
  float Wb = L.x;                                    // the light that would be seen here without it
  float Wc = (uRimB*RB*Wb + uRimD*RD*glow + (uThin*Wb + uHaze*glow)*A)/5.0;
  float Kc = uCool*RC/5.0;
  vec3 Bc = uCurCol*(0.92 + 0.3*F/A);
  oL = vec4(L.x*(1.0 - a) + Wc, L.y*(1.0 - a) + Kc, L.z, L.w);
  oB = vec4(B.rgb*(1.0 - a) + Bc*a, 1.0);
}`;

// ---------------------------------------------------------------- S02 bar 4: lettering cut into the card
// Opt-in with st.letters = { segs: Float32Array(4N) (a.xy, b.xy, card px in Clawd's frame), info:
// Float32Array(4N) (letter, f0, f1, 0), n, cut: [per letter 0..1], fresh: [per letter], halfW, box }.
// Each letter is cut along its strokes as its cut runs 0 -> 1; the strokes become part of the hole,
// so the tissue's light shows through them and their cut edges carry the kerf light and rims like
// every other cut. A fresh cut flashes. Without st.letters every program is the original.
const LET_N = 160, LET_K = 16;
const LETTER_GLSL = `
uniform vec4 uLSeg[${LET_N}];
uniform vec4 uLInf[${LET_N}];
uniform float uLCut[${LET_K}];
uniform float uLFresh[${LET_K}];
uniform float uLN, uLHW;
uniform vec4 uLBox;
float lettersSD(vec2 w, out float fresh){
  fresh = 0.0;
  if (w.x < uLBox.x || w.y < uLBox.y || w.x > uLBox.z || w.y > uLBox.w) return 1e5;
  float d = 1e5;
  for (int i = 0; i < ${LET_N}; i++){
    if (float(i) >= uLN) break;
    vec4 inf = uLInf[i]; int k = int(inf.x + 0.5);
    float t1 = clamp((uLCut[k] - inf.y)/max(inf.z - inf.y, 1e-4), 0.0, 1.0);
    if (t1 <= 0.0) continue;
    vec2 a = uLSeg[i].xy, b = mix(a, uLSeg[i].zw, t1);
    vec2 pa = w - a, ba = b - a;
    float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-6), 0.0, 1.0);
    float di = length(pa - ba*h) - uLHW;
    if (di < d){ d = di; fresh = uLFresh[k]; }
  }
  return d;
}
`;
function sceneWithLetters(src) {
  const put = (s, anchor, repl) => { if (s.split(anchor).length !== 2) throw new Error('card letters patch: ' + anchor.slice(0, 40)); return s.replace(anchor, () => repl); };
  let s = put(src, 'layout(location = 0) out vec4 oL;', LETTER_GLSL + 'layout(location = 0) out vec4 oL;');
  s = put(s, 'float dH = min(dC, dR);', `float dH = min(dC, dR);
  float lFresh; float dL = lettersSD(wc, lFresh); dH = min(dH, dL);`);
  s = put(s, 'if (dH >= 0.0){ cover = 0.0; kerfPx = 0.0; }', `if (dH >= 0.0){ cover = 0.0; kerfPx = 0.0; }
  if (dL < 0.0 && dL <= min(dC, dR)){ cover = 0.0; kerfPx = 0.0; }`);
  s = put(s, 'Wc += uCardOn*uGlint.x*pow(face, uGlint.z)*(6.5*exp(-e/0.9) + 1.3*exp(-e/4.0)*(0.75 + 0.5*surf));',
    `Wc += uCardOn*uGlint.x*pow(face, uGlint.z)*(6.5*exp(-e/0.9) + 1.3*exp(-e/4.0)*(0.75 + 0.5*surf));
  Wc += uCardOn*lampE*lFresh*(2.4*exp(-e/1.1) + 0.5*exp(-e/5.0))*step(dL, 14.0);`);
  s = put(s, 'float Wh = mix(Wt, Wf, cover);', 'float Wh = mix(Wt, Wf, cover)*(1.0 + 1.1*lFresh*step(dL, 0.0));');
  return s;
}

export function createCard(canvas, log = () => {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('no webgl2');
  const K = glkit(gl, log);
  const W = canvas.width, H = canvas.height, sc = W / 1920;
  const pScene = K.program(SCENE, 'card-scene'), pRays = K.program(RAYS, 'card-rays'), pRot = K.program(ROTBLUR, 'card-rotblur');
  const pDown = K.program(FS_DOWN, 'down'), pUp = K.program(FS_UP, 'up'), pFinal = K.program(FS_FINAL, 'final');
  const hw = Math.round(W / 2), hh = Math.round(H / 2);
  const tHole = K.target(hw, hh), tRays = K.target(hw, hh), tScene = K.target(W, H, 2), tScene2 = K.target(W, H, 2);
  const sizes = [[hw, hh], [hw >> 1, hh >> 1], [hw >> 2, hh >> 2], [hw >> 3, hh >> 3], [hw >> 4, hh >> 4]];
  const down = sizes.map((s) => K.target(Math.max(s[0], 2), Math.max(s[1], 2)));
  const up = sizes.slice(0, 4).map((s) => K.target(Math.max(s[0], 2), Math.max(s[1], 2)));
  const gdown = sizes.map((s) => K.target(Math.max(s[0], 2), Math.max(s[1], 2)));
  const gup = sizes.slice(0, 4).map((s) => K.target(Math.max(s[0], 2), Math.max(s[1], 2)));

  // static geometry: rays and glyph
  const G = CARD_GEOM;
  const RAY = new Float32Array(44), RAYB = new Float32Array(44);
  SPARK.forEach((r, j) => {
    const a = r.a * Math.PI / 180, L = G.Lmax * r.len, r1 = G.base * r.w;
    RAY.set([Math.cos(a), Math.sin(a), L, r1], j * 4);
    RAYB.set([r1 * G.tip, 0, Math.atan2(Math.sin(a), Math.cos(a)), j], j * 4);
  });
  const glyphBits = GLYPH.map((row) => [...row].reduce((m, ch, c) => (ch === '#' ? m | (1 << c) : m), 0));
  // the cursor's programs and target, made on first use (revision 5); the letters' variants likewise
  let pSceneCur = null, pCur = null, tScene3 = null, pSceneLet = null, pSceneCurLet = null;
  const ARROW_F = new Float32Array(ARROW.flat());
  const slate = [0x15, 0x19, 0x2B].map((v) => Math.pow(v / 255, 2.2));

  function pyramid(src, dn, upT, thr, pre) {
    let s = { tex: src.tex, w: src.w, h: src.h };
    for (let i = 0; i < dn.length; i++) {
      K.setU(pDown, { uTS: [dn[i].w, dn[i].h], uSrcTexel: [1 / s.w, 1 / s.h], uPre: { i: i === 0 && pre ? 1 : 0 }, uThr: thr });
      K.tex(pDown, { uSrc: s.tex }); K.draw(pDown, dn[i]); s = dn[i];
    }
    let low = dn[dn.length - 1];
    for (let i = upT.length - 1; i >= 0; i--) {
      K.setU(pUp, { uTS: [upT[i].w, upT[i].h], uLowTexel: [1 / low.w, 1 / low.h], uCurW: i === 0 ? 0.6 : 1.0 });
      K.tex(pUp, { uLow: low.tex, uCur: dn[i].tex }); K.draw(pUp, upT[i]); low = upT[i];
    }
    return upT[0];
  }

  // st: { light, lamp:[A,rA,B,rB], rays:[11 opens], rank, cells:[90 opens], rot, rotSpan, glint:[I, dir, sharp],
  //       cc:[x,y], mc, tc:[x,y], mt, cardOn, haze, front, god, godLen, exposure, fade, floor, bloom, seed }
  function render(st) {
    const rb = RAYB.slice(); for (let j = 0; j < 11; j++) { rb[j * 4 + 1] = st.rays ? st.rays[j] : 0; if (st.rank) rb[j * 4 + 3] = st.rank[j]; }
    const cells = st.cells || new Array(90).fill(0);
    const rot = st.rot || 0;
    const common = {
      uSc: sc, uCC: st.cc || [960, 540], uMC: st.mc || 1, uTC: st.tc || st.cc || [960, 540], uMT: st.mt || 1,
      uCell: G.cell, uRay: RAY, uRayB: rb, uCells: { f1: new Float32Array(cells) }, uGlyph: { iv: glyphBits },
      uRot: rot, uRotC: rot - Math.PI, uGlint: [...(st.glint || [0, 0, 8]), 0],
      uLight: st.light, uLamp: st.lamp || [1.9, 95, 1.05, 380], uHaze: st.haze ?? 0.05, uFront: st.front ?? 0.35,
      uWob: 0.9, uFlapT: st.flapT ?? 0.11, uEdge: st.edge ?? 0.55, uRim: st.rim ?? 1.25, uCardOn: st.cardOn ?? 1,
    };
    // (revision 5) the cursor, if any: five shutter samples of its tip, scale and press
    const cur = st.cursor && st.cursor.samples ? new Float32Array(st.cursor.samples.flat()) : null;
    if (cur && !pSceneCur) {
      pSceneCur = K.program(sceneWithCursor(SCENE), 'card-scene-cursor'); pCur = K.program(CURSOR_FS, 'card-cursor');
      tScene3 = K.target(W, H, 2);
    }
    // (S02 bar 4) the lettering, if any
    const lt = st.letters || null;
    if (lt && !pSceneLet) pSceneLet = K.program(sceneWithLetters(SCENE), 'card-scene-letters');
    if (lt && cur && !pSceneCurLet) pSceneCurLet = K.program(sceneWithCursor(sceneWithLetters(SCENE)), 'card-scene-cursor-letters');
    if (lt) {
      const cut = new Float32Array(LET_K), fr = new Float32Array(LET_K);
      cut.set(lt.cut.slice(0, LET_K)); fr.set(lt.fresh.slice(0, LET_K));
      Object.assign(common, { uLSeg: lt.segs, uLInf: lt.info, uLN: lt.n, uLHW: lt.halfW, uLBox: lt.box, uLCut: { f1: cut }, uLFresh: { f1: fr } });
    }
    const pMain = lt ? pSceneLet : pScene;
    const setArrow = (p) => { gl.useProgram(p); gl.uniform2fv(p.u.uArrow, ARROW_F); };
    // 1. light through the hole (half res), its glow pyramid and shafts
    const pHole = cur ? (lt ? pSceneCurLet : pSceneCur) : pMain;
    K.setU(pHole, Object.assign({}, common, { uRes: [hw, hh], uSc: sc / 2, uHoleOnly: 1 }, cur ? { uCur: cur } : {}));
    if (cur) setArrow(pHole);
    K.tex(pHole, { uGlow: up[0].tex }); K.draw(pHole, tHole);
    const glow = pyramid(tHole, gdown, gup, [0, 0], false);
    const ctr = st.tc || st.cc || [960, 540];
    K.setU(pRays, { uTS: [hw, hh], uCtr: [ctr[0] / 1920, 1 - ctr[1] / 1080], uLen: st.godLen ?? 0.45, uDecay: 2.2 });
    K.tex(pRays, { uHole: tHole.tex }); K.draw(pRays, tRays);
    // 2. the scene
    K.setU(pMain, Object.assign({}, common, { uRes: [W, H], uHoleOnly: 0 }));
    K.tex(pMain, { uGlow: glow.tex }); K.draw(pMain, tScene);
    let sc2 = tScene;
    if (Math.abs(st.rotSpan || 0) > 0.002) {       // the card is turning: blur along its arc
      const c = st.cc || [960, 540];
      K.setU(pRot, { uRes: [W, H], uCtr: [c[0] * sc, c[1] * sc], uSpan: st.rotSpan });
      K.tex(pRot, { uL: tScene.texs[0], uB: tScene.texs[1] }); K.draw(pRot, tScene2); sc2 = tScene2;
    }
    if (cur) {                                     // the cursor, over the card (not blurred with it)
      const c = st.cc || [960, 540];
      K.setU(pCur, { uRes: [W, H], uSc: sc, uCur: cur, uHub: c, uHaze: st.haze ?? 0.05,
        uRimB: st.cursor.rimB ?? 0.95, uRimD: st.cursor.rimD ?? 2.4, uThin: st.cursor.thin ?? 0.04, uCool: st.cursor.cool ?? 0.08,
        uCurCol: st.cursor.col || slate });
      setArrow(pCur);
      K.tex(pCur, { uL: sc2.texs[0], uB: sc2.texs[1], uGlow: glow.tex }); K.draw(pCur, tScene3); sc2 = tScene3;
    }
    // 3. bloom on the hottest light, then the photograph
    const bloom = pyramid({ tex: sc2.texs[0], w: W, h: H }, down, up, [2.2, 1.6], true);
    K.setU(pFinal, { uRes: [W, H], uExp: st.exposure ?? 1.0, uBloomW: st.bloom ?? 0.35, uBloomK: 0.3, uGrain: 0.03, uVig: 0.2,
      uFade: st.fade ?? 1, uAddW: st.god ?? 0.35, uFloor: st.floor ?? 1, uSeed: st.seed || 0 });
    K.tex(pFinal, { uL: sc2.texs[0], uB: sc2.texs[1], uBloom: bloom.tex, uAdd: tRays.tex });
    K.draw(pFinal, null, W, H);
  }
  return { render, gl, sync: K.sync };
}
