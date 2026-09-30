// Post passes for the valley (from frame-v2): bright pass, blur, sun rays, final grade.
export const BRIGHT_FS = `#version 300 es
precision highp float; uniform sampler2D uT; uniform vec2 uInv; uniform float uThr; out vec4 o;
void main(){ vec2 uv = gl_FragCoord.xy*uInv; vec3 c = texture(uT, uv).rgb; float l = dot(c, vec3(0.3,0.59,0.11));
  float k = smoothstep(uThr, uThr + 0.2, l); o = vec4(c*k, 1.0); }`;
export const BLUR_FS = `#version 300 es
precision highp float; uniform sampler2D uT; uniform vec2 uDir; uniform vec2 uInv; out vec4 o;
void main(){ vec2 uv = gl_FragCoord.xy*uInv; vec3 s = vec3(0.0); float wsum = 0.0;
  for (int i = -8; i <= 8; i++) { float w = exp(-float(i*i)/24.0); s += texture(uT, uv + uDir*float(i)*uInv).rgb*w; wsum += w; }
  o = vec4(s/wsum, 1.0); }`;
export const RAYS_FS = `#version 300 es
precision highp float; uniform sampler2D uT; uniform sampler2D uAux; uniform vec2 uSunUV; uniform vec2 uInv; out vec4 o;
void main(){ vec2 uv = gl_FragCoord.xy*uInv; vec2 stepv = (uSunUV - uv)/48.0*0.95; vec3 acc = vec3(0.0); float decay = 1.0; vec2 p = uv;
  for (int i = 0; i < 48; i++) { p += stepv; float sky = 1.0 - step(0.03, texture(uAux, p).b); vec3 c = texture(uT, p).rgb;
    float l = dot(c, vec3(0.3,0.59,0.11)); acc += c*smoothstep(0.72, 0.97, l)*sky*decay; decay *= 0.965; }
  o = vec4(acc/48.0*2.4, 1.0); }`;
export const FINAL_FS = `#version 300 es
precision highp float;
uniform sampler2D uCrisp, uAux, uB1, uB2, uB3, uRays;
uniform vec2 uRes; uniform vec3 uClawdScr; uniform float uGlow, uRaysAmt, uGrain, uVig, uWarm, uFade, uGrade, uRewind; uniform vec3 uFadeCol;
out vec4 o;
float hh(vec2 p){ uvec2 q = uvec2(ivec2(p)); uint h = q.x*0x8da6b343u ^ q.y*0xd8163841u; h ^= h >> 13u; h *= 0x5bd1e995u; h ^= h >> 15u; return float(h & 0xffffu)/65535.0; }
void main(){
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec2 uv = gl_FragCoord.xy/uRes;
  float k = uRes.y/1080.0;
  vec3 c = texelFetch(uCrisp, ip, 0).rgb;
  vec4 aux = texelFetch(uAux, ip, 0);
  vec3 c0 = c;
  float onClawd = smoothstep(0.84, 0.88, aux.b)*(1.0 - smoothstep(0.93, 0.97, aux.b));
  vec3 cRaw = c;
  vec3 b = texture(uB1, uv).rgb*0.30 + texture(uB2, uv).rgb*0.35 + texture(uB3, uv).rgb*0.45;
  c = 1.0 - (1.0 - c)*(1.0 - b*vec3(1.0, 0.86, 0.72)*0.55);
  c += texture(uB1, uv).rgb*vec3(0.20, 0.06, 0.02);
  vec3 rays = texture(uRays, uv).rgb * uRaysAmt;
  c = 1.0 - (1.0 - c)*(1.0 - rays*vec3(1.0, 0.78, 0.52)*1.05);
  // Clawd's glow: around him, not over him
  vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 d = (sp - uClawdScr.xy) / vec2(1.25, 1.0);
  float gA = uClawdScr.z*0.95, gB = uClawdScr.z*0.30;
  float g = (exp(-dot(d,d)/(2.0*gA*gA))*0.50 + exp(-dot(d,d)/(2.0*gB*gB))*0.40) * uGlow;
  g *= 1.0 - 0.85*onClawd;
  c = mix(c, c*vec3(1.10, 0.90, 0.78) + vec3(0.10, 0.035, 0.0), clamp(g*1.6, 0.0, 1.0));
  c = 1.0 - (1.0 - c)*(1.0 - g*vec3(1.0, 0.62, 0.42)*0.6);
  // grade: lift shadows toward lavender, warm the highlights
  float l = dot(c, vec3(0.3,0.59,0.11));
  c += vec3(0.010, 0.006, 0.020)*(1.0 - l);
  c = mix(c, c*vec3(1.03, 1.0, 0.96), smoothstep(0.5, 1.0, l));
  c = mix(c, c*vec3(1.05, 0.99, 0.93), uWarm);
  c = mix(c, c*c*(3.0 - 2.0*c), 0.55);
  vec2 q = uv - 0.5; float vig = 1.0 - (dot(q*vec2(1.0, 1.25), q*vec2(1.0, 1.25))*0.75 + smoothstep(0.22, 0.5, -q.y)*smoothstep(0.18, 0.5, abs(q.x))*0.30)*uVig;
  c *= mix(vec3(1.0), vec3(0.93, 0.9, 1.0), 1.0 - vig) * vig;
  c = clamp((c - 0.045)/0.965, 0.0, 1.0);
  c = mix(c, c0*mix(1.0, vig, 0.5), onClawd);   // Clawd keeps his exact colour: no bloom, grade or grain
  c = mix(cRaw, c, uGrade);                    // S13's opening frames match S12's flat field exactly
  vec2 fc = gl_FragCoord.xy/k;
  float wv = sin(fc.x*1.9)*sin(fc.y*1.9);
  float weave = 1.0 + 0.012*wv*(0.6 + 0.4*hh(floor(fc/3.0)))*uGrade;
  float gr = (hh(gl_FragCoord.xy + 17.0) - 0.5)*uGrain*uGrade;
  c = mix(c*weave + gr, c, onClawd*0.85);
  c = mix(c, uFadeCol, uFade);
  // rewind: time runs backward, the world cools and thins while Clawd keeps his colour
  float lr = dot(c, vec3(0.3, 0.59, 0.11));
  vec3 cr = mix(c, vec3(lr)*vec3(0.90, 0.97, 1.10) + vec3(0.02, 0.03, 0.06), 0.55);
  cr *= 1.0 - 0.06*step(0.5, fract(gl_FragCoord.y/(3.0*k)));
  c = mix(c, mix(cr, c, onClawd), uRewind);
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
