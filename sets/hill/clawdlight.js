// (revision 23, Claire: "the 2D static drawn rays of light coming out of clawd don't fit the visual theme
// here") Clawd's light as part of the painted world, shared by sets/hill (S31) and the hillx fork (S30 as
// it lands on S31's opening view). Both pieces are off unless a shot asks (shelter.js `worldLight`).
//
//   CLIT_GLSL  for the lit pass (after SCENE_CAST): his warm light on the land, the tree and her, wrapped
//              round her, falling off with distance, with a soft shadow (her body shades the grass beyond
//              her). uCLit = [mix 0..1 from the old term, source radius m, strength, range m]; mix 0 keeps
//              the old term exactly.
//   VOL_BODY   the glow (a fragment shader body; each engine prepends its declarations and an occluder
//              `float volOcc(vec3 p)`): light scattered in the air around him, integrated along each view
//              ray up to the scene's depth, so it respects what stands in front of him and behind him,
//              shadowed by her, drifting slowly like warm air rising off him, with soft optional shafts.
//              Drawn additively into the Clawd layer before the Clawds. uVol = [strength, core radius m,
//              shafts 0..1, range m], uVolFall = decay length (m), uVolCol = colour (linear).
export const CLIT_GLSL = `
uniform vec4 uCLit;
float clawdShadow(vec3 ro, vec3 rd, float tmax, float k) {
  float res = 1.0, t = 0.03;
  for (int i = 0; i < 48; i++) {
    if (t >= tmax) break;
    float h = mapD(ro + rd * t);
    res = min(res, k * h / t);
    if (res < 0.01) break;
    t += clamp(h, 0.015, 0.3);
  }
  return clamp(res, 0.0, 1.0);
}
vec3 clawdLit(vec3 p, vec3 n, vec3 alb, float ao, int mat) {
  vec3 lv = uCGlow.xyz - p; float dl = length(lv);
  if (dl > uCLit.w || uCGlow.w <= 0.0) return vec3(0.0);
  vec3 l = lv / max(dl, 1e-4);
  float s = uCLit.y;
  float wrap = (mat >= M_SKIN && mat <= M_SHOE) ? 0.5 : 0.2;
  float ndl = clamp((dot(n, l) + wrap) / (1.0 + wrap), 0.0, 1.0);
  if (ndl <= 0.0) return vec3(0.0);
  float fall = smoothstep(uCLit.w, 0.45 * uCLit.w, dl) / (dl * dl + s * s);
  float sh = clawdShadow(p + n * 0.015, l, dl - 0.7 * s, 1.6 * dl / s);
  // the grass also catches a little of his colour itself (the sheen of the blades), so the pool reads warm
  vec3 k = alb + (mat == M_HILL || mat == M_FLOOR ? vec3(0.1, 0.06, 0.02) : vec3(0.0));
  return k * P_CLAWDL * uCGlow.w * uCLit.z * ndl * fall * mix(1.0, sh, 0.92) * (0.55 + 0.45 * ao);
}
`;

export const VOL_BODY = `
uniform sampler2D uAux;
uniform vec4 uVol; uniform float uVolFall; uniform vec3 uVolCol;
out vec4 o;
// how much of his light reaches the air at x: her body casts a soft shadow through the glow
float volVis(vec3 x, vec3 L) {
  if (uHumanOn < 0.5) return 1.0;
  vec3 d = L - x; float dl = length(d); d /= max(dl, 1e-4);
  vec3 oc = uHB.xyz - x; float tb = clamp(dot(oc, d), 0.0, dl);
  if (length(oc - d * tb) > uHB.w + 0.05) return 1.0;
  float res = 1.0, t = 0.02;
  for (int k = 0; k < 20; k++) {
    if (t > dl - 0.5 * uVol.y) break;
    float hh = volOcc(x + d * t);
    res = min(res, 5.0 * hh / t);
    if (res < 0.02) break;
    t += clamp(hh, 0.02, 0.25);
  }
  return clamp(res, 0.0, 1.0);
}
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 px = vec2(fc.x, uRes.y - fc.y) * (1920.0 / uRes.x);
  vec3 rd = camRay(px);
  float T = texelFetch(uAux, ivec2(fc), 0).y;
  vec3 L = uCGlow.xyz, oc = L - uCamPos;
  float b = dot(oc, rd), h2 = max(dot(oc, oc) - b * b, 0.0), R = uVol.w;
  o = vec4(0.0);
  if (h2 >= R * R || uCGlow.w <= 0.0) return;
  // the in-scattered light of a softened point source, 1 / (r^2 + s^2), importance-sampled along the ray:
  // t = b + H tan(a) with a uniform makes each sample carry equal weight of the unshadowed integral
  float H = sqrt(h2 + uVol.y * uVol.y);
  float t0 = max(0.02, b - R), t1 = min(T, b + R);
  if (t1 <= t0) return;
  float a0 = atan((t0 - b) / H), a1 = atan((t1 - b) / H);
  const int N = 24;
  float acc = 0.0;
  for (int i = 0; i < N; i++) {
    float t = b + H * tan(mix(a0, a1, (float(i) + 0.5) / float(N)));
    vec3 x = uCamPos + rd * t;
    vec3 dx = x - L; float r = length(dx);
    float f = (exp(-r / uVolFall) + 0.13 * exp(-r / (3.0 * uVolFall))) * smoothstep(R, 0.6 * R, r);   // close, soft tail
    f *= 0.72 + 0.56 * vnoise(x * 1.6 + vec3(0.0, -uTime * 0.2, 0.0));          // living air, rising off him
    if (uVol.z > 0.0) {                                                          // soft shafts, slowly turning
      float sh = vnoise(dx / max(r, 1e-3) * 4.0 + vec3(0.07, 0.0, -0.05) * uTime);
      f *= 1.0 + uVol.z * (2.0 * sh - 1.0) * smoothstep(0.15, 0.7, r);
    }
    if (f > 1e-4) f *= volVis(x, L);
    acc += f;
  }
  o = vec4(uVolCol * (uVol.x * uCGlow.w * (a1 - a0) / H * acc / float(N)), 0.0);
}`;
