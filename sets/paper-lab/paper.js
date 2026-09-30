// Backlit cut-paper engine for the lab set (S08, S09).
// Ported by hand from style-frames/11-paper-lab/frame.html. Shapes, hand-cut edges, masks,
// fibre, the lighting pass and the post chain are the frame's own code. What is new:
//  - explicit parameters instead of query strings (scene.params, per-frame state);
//  - a 2.5D camera: every layer maps world -> screen by its own scale and offset (parallax,
//    lateral dolly, pan, push-in); all lighting stays in world space;
//  - animated layers: a layer with key(pose) is redrawn when its key changes, and only the
//    union of its old and new bounding boxes is re-uploaded (deterministic: the result equals a
//    fresh draw of the pose);
//  - roughStable(): hand-cut edge noise keyed to arclength, so moving shapes do not boil;
//  - dust motes (points, occluded by the frontmost card);
//  - Clawd composited with exact box coverage (crisp cells at any sub-pixel position or scale);
//  - a warm fill (for the S09 push into the glow) and an exposure control;
//  - a render scale k (0.5 = half-res preview; masks stay full-res);
//  - revision 3 (S20), opt-in with { ext: true }: a screen layer (kind 3) that shows an external
//    canvas, exact at 1:1 (see MAIN_FS_EXT). Without the option nothing changes.
export const W = 1920, H = 1080;

// ---------------------------------------------------------------- utilities (from the frame)
export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
export const lin = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); };
export function vnoise1(seed) {
  const r = mulberry32(seed), T = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) T[i] = r() * 2 - 1;
  return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return T[i & 1023] + (T[(i + 1) & 1023] - T[i & 1023]) * u; };
}

// ---------------------------------------------------------------- shapes (from the frame)
// Every shape is a closed polygon: an array of [x, y] in world px (y down).
export const S2 = {
  rect: (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
  rrect(x, y, w, h, r, n = 6) {
    const o = [], cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of cs) for (let k = 0; k <= n; k++) { const a = a0 + Math.PI / 2 * k / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return o;
  },
  ellipse(cx, cy, rx, ry, rot = 0, n = 72) {
    const o = [], c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * c - y * s, cy + x * s + y * c]); }
    return o;
  },
  bez(p0, p1, p2, p3, n = 48) {
    const o = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      o.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
    return o;
  },
  cat(ctrl, closed = true, seg = 14) {
    const o = [], n = ctrl.length, get = i => closed ? ctrl[(i + n) % n] : ctrl[clamp(i, 0, n - 1)];
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (let k = 0; k < seg; k++) {
        const t = k / seg, t2 = t * t, t3 = t2 * t;
        o.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    if (!closed) o.push(ctrl[n - 1].slice());
    return o;
  },
  ribbon(cl, wf, caps = [true, true]) {
    const n = cl.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = cl[Math.max(0, i - 1)], b = cl[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const w = wf(i / (n - 1)) / 2;
      L.push([cl[i][0] - ty * w, cl[i][1] + tx * w]); R.push([cl[i][0] + ty * w, cl[i][1] - tx * w]);
    }
    const cap = (c, from, w) => { const o = [], a0 = Math.atan2(from[1] - c[1], from[0] - c[0]); for (let k = 1; k < 12; k++) { const a = a0 - Math.PI * k / 12; o.push([c[0] + Math.cos(a) * w, c[1] + Math.sin(a) * w]); } return o; };
    const out = L.slice();
    if (caps[1]) out.push(...cap(cl[n - 1], L[n - 1], wf(1) / 2));
    out.push(...R.slice().reverse());
    if (caps[0]) out.push(...cap(cl[0], R[0], wf(0) / 2));
    return out;
  },
  line: (a, b, n = 24) => { const o = []; for (let i = 0; i <= n; i++) o.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]); return o; },
};
export function resample(pts, step = 2) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  return out;
}
// Hand-cut edge (the frame's version): wobble along the normal plus the occasional notch, drawn
// from one sequential rng per layer. Used for static layers, so they match the style frame.
export function rough(pts, rnd, amp = 0.6, notch = 1 / 380) {
  if (amp <= 0) return pts;
  const d = resample(pts, 2.0), N = d.length;
  const n1 = vnoise1((rnd() * 1e9) | 0), n2 = vnoise1((rnd() * 1e9) | 0);
  const out = []; let s = 0, nAt = -1, nLen = 0, nDep = 0;
  for (let i = 0; i < N; i++) {
    const p = d[i], a = d[(i - 1 + N) % N], b = d[(i + 1) % N];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    if (i > 0) s += Math.hypot(p[0] - d[i - 1][0], p[1] - d[i - 1][1]);
    let off = amp * (0.62 * n1(s / 21) + 0.38 * n2(s / 5.3));
    if (nAt < 0 && rnd() < notch * 2) { nAt = s; nLen = 2.5 + rnd() * 4; nDep = (0.7 + rnd() * 1.1) * (rnd() < 0.5 ? 1 : -1); }
    if (nAt >= 0) { const u = (s - nAt) / nLen; if (u > 1) nAt = -1; else off += nDep * (1 - Math.abs(2 * u - 1)); }
    out.push([p[0] + ty * off, p[1] - tx * off]);
  }
  return out;
}
// Same look, but every shape has its own seed and the noise (notches included) is keyed to
// arclength, so an animated shape keeps its cut edge from frame to frame instead of boiling.
const NOTCH = 190;
export function roughStable(pts, seed, amp = 0.6) {
  if (amp <= 0) return pts;
  const d = resample(pts, 2.0), N = d.length;
  const r = mulberry32(seed);
  const n1 = vnoise1((r() * 1e9) | 0), n2 = vnoise1((r() * 1e9) | 0);
  const notch = c => { const q = mulberry32((seed * 7919 + c * 104729) | 0); return [q(), q(), q(), q(), q()]; };
  const cache = new Map();
  const out = []; let s = 0;
  for (let i = 0; i < N; i++) {
    const p = d[i], a = d[(i - 1 + N) % N], b = d[(i + 1) % N];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    if (i > 0) s += Math.hypot(p[0] - d[i - 1][0], p[1] - d[i - 1][1]);
    let off = amp * (0.62 * n1(s / 21) + 0.38 * n2(s / 5.3));
    const c = Math.floor(s / NOTCH);
    for (let cc = c - 1; cc <= c; cc++) {
      if (cc < 0) continue;
      let h = cache.get(cc); if (!h) { h = notch(cc); cache.set(cc, h); }
      if (h[0] < 0.5) continue;
      const at = cc * NOTCH + h[1] * NOTCH * 0.9, len = 2.5 + h[2] * 4, dep = (0.7 + h[3] * 1.1) * (h[4] < 0.5 ? 1 : -1);
      const u = (s - at) / len;
      if (u >= 0 && u <= 1) off += dep * (1 - Math.abs(2 * u - 1));
    }
    out.push([p[0] + ty * off, p[1] - tx * off]);
  }
  return out;
}

// ---------------------------------------------------------------- masks
// A mask layer: R = opaque card, G = self-lit vellum, B = pinhole emission. Draw calls are
// recorded (so a layer's bounding box is known before it is painted), then painted with
// 'lighter' (cuts paint black with 'source-over'), exactly as the frame did.
function recorder(ops, edge) {
  const put = (pts, col, amp, cut) => ops.push({ pts: edge(pts, amp), col, cut });
  return {
    card: (pts, amp = 0.6) => put(pts, '#ff0000', amp),
    vel: (pts, v = 1, amp = 0.6) => put(pts, `rgb(0,${Math.round(255 * v)},0)`, amp),
    emit: (pts, v = 1, amp = 0) => put(pts, `rgb(0,0,${Math.round(255 * v)})`, amp),
    cut: (pts, amp = 0.6) => put(pts, '#000', amp, true),
  };
}
function paintOps(x, ops) {
  for (const o of ops) {
    x.globalCompositeOperation = o.cut ? 'source-over' : 'lighter';
    x.beginPath(); o.pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
    x.fillStyle = o.col; x.fill();
  }
  x.globalCompositeOperation = 'lighter';
}
function opsBox(ops) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (const o of ops) for (const p of o.pts) { if (p[0] < a) a = p[0]; if (p[1] < b) b = p[1]; if (p[0] > c) c = p[0]; if (p[1] > d) d = p[1]; }
  return a > c ? null : [a - 3, b - 3, c + 3, d + 3];
}

// ---------------------------------------------------------------- fibre texture (from the frame)
function makeFibre() {
  const S = 1024, rnd = mulberry32(4242);
  const layer = (count, lenA, lenB, wA, wB, aA, aB, aniso) => {
    const c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, S, S); x.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const px = rnd() * S, py = rnd() * S;
      const ang = rnd() < aniso ? (rnd() - 0.5) * 0.8 : rnd() * Math.PI;
      const len = lenA + (lenB - lenA) * rnd() * rnd();
      const bend = (rnd() - 0.5) * len * 0.45;
      const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2, nx = -Math.sin(ang) * bend, ny = Math.cos(ang) * bend;
      const a = aA + (aB - aA) * rnd();
      x.strokeStyle = rnd() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      x.lineWidth = wA + (wB - wA) * rnd();
      for (const ox of [0, -S, S]) for (const oy of [0, -S, S]) {
        const X = px + ox, Y = py + oy;
        if (X + len < 0 || X - len > S || Y + len < 0 || Y - len > S) continue;
        x.beginPath(); x.moveTo(X - dx, Y - dy); x.quadraticCurveTo(X + nx, Y + ny, X + dx, Y + dy); x.stroke();
      }
    }
    return x.getImageData(0, 0, S, S).data;
  };
  const f1 = layer(26000, 4, 32, 0.45, 1.1, 0.05, 0.2, 0.62);
  const f2 = layer(2400, 30, 120, 0.6, 1.4, 0.05, 0.13, 0.62);
  const r2 = mulberry32(777), data = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) { data[i * 4] = f1[i * 4]; data[i * 4 + 1] = f2[i * 4]; data[i * 4 + 2] = (r2() * 255) | 0; data[i * 4 + 3] = 255; }
  return { S, data };
}

// ---------------------------------------------------------------- the 2.5D camera
// A layer at depth z (wall = 0, +z toward the camera) authored in screen px of the rest view.
// Camera: rest depth Zc, lateral move t (world px at the reference depth zref), push tz toward
// the scene, pan (a screen shift for every layer: the camera turning), principal point c.
//   screen = c + (world - c) * s + o,  s = d / (d - tz),  o = pan - t * Dref / (d - tz),
//   d = Zc - z, Dref = Zc - zref.
export function camMap(cam, z) {
  const d = cam.Zc - z, e = Math.max(d - (cam.tz || 0), 1), Dref = cam.Zc - cam.zref;
  const t = cam.t || [0, 0], pan = cam.pan || [0, 0];
  return { s: d / e, o: [pan[0] - t[0] * Dref / e, pan[1] - t[1] * Dref / e] };
}
export function toScreen(cam, p, z) {
  const { s, o } = camMap(cam, z), c = cam.c || [W / 2, H / 2];
  return [c[0] + (p[0] - c[0]) * s + o[0], c[1] + (p[1] - c[1]) * s + o[1]];
}
// The pan that puts world point F (depth zF) at screen point S, given the other camera terms.
export function panFor(cam, F, zF, S) {
  const c = cam.c || [W / 2, H / 2], d = cam.Zc - zF, e = Math.max(d - (cam.tz || 0), 1), Dref = cam.Zc - cam.zref;
  const s = d / e, t = cam.t || [0, 0];
  return [S[0] - c[0] - (F[0] - c[0]) * s + t[0] * Dref / e, S[1] - c[1] - (F[1] - c[1]) * s + t[1] * Dref / e];
}

// ================================================================ SHADERS
const LIB = `
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.07 + 17.1; a *= 0.5; } return s; }
// Claude's light: #8A3A24 #C4603F #D97757 #F0A070 #FFD9B8 #FFF3E6 (linear)
vec3 warmRamp(float x) {
  const vec3 c1 = vec3(0.2542, 0.0423, 0.0176), c2 = vec3(0.5520, 0.1170, 0.0497), c3 = vec3(0.6939, 0.1845, 0.0953);
  const vec3 c4 = vec3(0.8714, 0.3515, 0.1620), c5 = vec3(1.0, 0.6939, 0.4793), c6 = vec3(1.0, 0.8963, 0.7913);
  if (x <= 0.0) return vec3(0.0);
  if (x < 0.25) return c1 * pow(x / 0.25, 2.2);
  if (x < 0.5) return mix(c1, c2, (x - 0.25) / 0.25);
  if (x < 0.7) return mix(c2, c3, (x - 0.5) / 0.2);
  if (x < 1.0) return mix(c3, c4, (x - 0.7) / 0.3);
  if (x < 1.5) return mix(c4, c5, (x - 1.0) / 0.5);
  return mix(c5, c6, clamp((x - 1.5) / 0.9, 0.0, 1.0));
}
// the humans' light: around #9FB3D9, never above #D8E2F5
vec3 coolRamp(float x) {
  const vec3 k1 = vec3(0.3467, 0.4508, 0.6939), k2 = vec3(0.6867, 0.7605, 0.9131);
  if (x <= 0.0) return vec3(0.0);
  if (x < 1.0) return k1 * x;
  return mix(k1, k2, clamp(x - 1.0, 0.0, 1.0));
}
`;
const VS = `#version 300 es
in vec2 aP; void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;

const MAIN_FS = `#version 300 es
precision highp float; precision highp int; precision highp sampler2DArray;
uniform sampler2DArray uM; uniform sampler2D uFib;
uniform vec2 uRes; uniform float uK, uLod0; uniform int uN;
uniform float uZ[16]; uniform vec3 uCol[16]; uniform float uAlb[16]; uniform int uKind[16]; uniform float uThin[16];
uniform float uDef[16]; uniform vec3 uVel[16]; uniform vec3 uEm[16]; uniform float uAO[16]; uniform int uCast[16]; uniform float uRimK[16];
uniform vec3 uLP; uniform float uLR, uLI, uLA, uRim, uLF;
uniform vec3 uMD; uniform float uMI, uMoonRim; uniform int uWallIdx, uWallFIdx;
uniform vec3 uMP; uniform float uMonI, uHazeMon;
uniform float uHazeW, uHazeM, uHazeA; uniform vec3 uHazeCol; uniform float uZ0, uZCam;
uniform vec3 uSkyTop, uSkyHor, uMoon; uniform float uHorY, uSkyOn, uSkyZ;
uniform vec2 uUpN; uniform float uAmbRim;
uniform vec2 uWO, uWS;
uniform vec2 uCamC, uPan, uCamT; uniform float uCamTz, uCamZc, uCamDref, uCamNear;
uniform vec4 uScrR;      // pixel screen: grid origin x, y (world px), native pixel (world px), horizon row
uniform vec4 uScrG;      // Clawd's centre x, y (world px), glow radius (native px), glow gain
uniform float uScrGain;
layout(location = 0) out vec4 oCol;
layout(location = 1) out vec4 oAux;
${LIB}
// ---- a computer screen showing the pixel world (after sets/early-env/pixel.js: its greys, its
// warm tint levels for Clawd's light, and ordered dither only where two steps meet)
const vec3 GREYS[17] = vec3[17](vec3(17., 17., 20.), vec3(24., 24., 28.), vec3(32., 32., 37.), vec3(41., 41., 46.),
  vec3(51., 51., 56.), vec3(62., 62., 67.), vec3(74., 74., 79.), vec3(87., 87., 92.), vec3(102., 102., 106.),
  vec3(118., 118., 121.), vec3(136., 136., 138.), vec3(155., 155., 156.), vec3(174., 174., 173.), vec3(193., 192., 190.),
  vec3(212., 211., 208.), vec3(230., 229., 225.), vec3(244., 243., 239.));
const float WLV[8] = float[8](0.0, 0.1, 0.2, 0.32, 0.46, 0.6, 0.75, 0.9);
const float BAY[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
float bay4(vec2 n) { vec2 m = mod(n, 4.0); return (BAY[int(m.y) * 4 + int(m.x)] + 0.5) / 16.0; }
float qd(float v, vec2 n, float sharp) { float b = floor(v); return b + (((v - b - 0.5) * sharp + 0.5) > bay4(n) ? 1.0 : 0.0); }
vec3 s2l(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 screenCol(vec2 Q) {
  vec2 n = floor((Q - uScrR.xy) / uScrR.z);
  float hz = uScrR.w, L;
  if (n.y < hz) {
    // night sky of the gridworld, its faint grid, and two low mesas on the horizon
    float t = clamp((n.y + 40.0) / (hz + 40.0), 0.0, 1.0);
    L = 1.3 + 2.2 * t * t;
    if (mod(n.x, 16.0) == 15.0 || mod(hz - n.y, 16.0) == 0.0) L += 0.6;
    float m1 = step(abs(n.x - 12.0), 7.0) * step(hz - 6.0, n.y), m2 = step(abs(n.x - 72.0), 9.0) * step(hz - 9.0, n.y);
    if (m1 + m2 > 0.0) L = 4.1 + (mod(n.x, 8.0) == 7.0 ? -0.5 : 0.0);
    L = qd(L, n, 2.2);
  } else {
    float r = n.y - hz, row = floor(r / 16.0), ty = mod(r, 16.0), tx = mod(n.x, 16.0);
    float base = row < 1.0 ? 5.4 : row < 2.0 ? 4.6 : 3.9;
    L = base;
    if (row < 1.0 && ty < 1.0) L = 8.6;
    else if (row < 1.0 && ty <= 2.0) L = 7.2;
    else if (ty == 15.0 || tx == 15.0) L = base - 1.6;
    else if (ty == 0.0 || tx == 0.0) L = base + 1.0;
  }
  vec3 g = GREYS[int(clamp(L, 0.0, 16.0))] / 255.0;
  // his light on the grey world: warm tint levels, strongest round him
  vec2 dc = (uScrR.xy + (n + 0.5) * uScrR.z - uScrG.xy) / (uScrG.z * uScrR.z * vec2(1.35, 1.0));
  float lv = clamp(qd(uScrG.w * exp(-dot(dc, dc)) * 7.0, n, 2.0), 0.0, 7.0);
  g = mix(g, vec3(240.0, 164.0, 127.0) / 255.0, WLV[int(lv)]);
  return s2l(g) * uScrGain;
}
// screen (reference px) -> world xy on the plane at depth z
vec2 toWorld(vec2 P, float z) {
  float d = uCamZc - z, e = max(d - uCamTz, 1.0);
  return uCamC + (P - uCamC - uPan + uCamT * (uCamDref / e)) * (e / d);
}
vec4 M(int i, vec2 P, float lod) { return textureLod(uM, vec3((P - uWO) / uWS, float(i)), lod); }
float opac(vec4 m) { return clamp(m.r + 0.55 * m.g, 0.0, 1.0); }
vec4 paper(vec2 P, float seed) {
  float a = seed * 2.399; mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
  vec2 q = R * P + seed * vec2(137.1, 71.3);
  vec4 t = texture(uFib, q / 1024.0);
  float fl = fbm(q / 34.0) * 0.62 + fbm(q / 9.0) * 0.38;
  return vec4(t.r * 2.0 - 1.0, (fl - 0.5) * 2.6, t.g * 2.0 - 1.0, t.b * 2.0 - 1.0);
}
float softOcc(int j, vec2 q, float r) {
  if (r < 0.9) return opac(M(j, q, 0.0));
  float lod = log2(r) + 0.2;
  vec2 a = vec2(0.55, 0.2) * r, b = vec2(-0.2, 0.55) * r;
  return 0.36 * opac(M(j, q, lod)) + 0.16 * (opac(M(j, q + a, lod)) + opac(M(j, q - a, lod)) + opac(M(j, q + b, lod)) + opac(M(j, q - b, lod)));
}
float softOcc3(int j, vec2 q, float r) {
  float lod = log2(max(r, 1.0)) + 0.5;
  vec2 a = vec2(0.45, 0.25) * r;
  return 0.5 * opac(M(j, q, lod)) + 0.25 * (opac(M(j, q + a, lod)) + opac(M(j, q - a, lod)));
}
float visL(vec3 p, int self) {
  float v = 1.0, lo = min(p.z, uLP.z) + 0.5, hi = max(p.z, uLP.z) - 0.5;
  for (int j = 0; j < 16; j++) {
    if (j >= uN) break;
    float zj = uZ[j];
    if (j == self || zj <= lo || zj >= hi || uCast[j] < 0) continue;   // cast < 0: the light's own housing
    float t = (zj - p.z) / (uLP.z - p.z);
    v *= 1.0 - softOcc(j, mix(p.xy, uLP.xy, t), uLR * t);
    if (v < 0.004) return 0.0;
  }
  return v;
}
float visLh(vec3 p) {
  float v = 1.0, lo = min(p.z, uLP.z) + 0.5, hi = max(p.z, uLP.z) - 0.5;
  for (int j = 0; j < 16; j++) {
    if (j >= uN) break;
    float zj = uZ[j];
    if (uCast[j] <= 0 || zj <= lo || zj >= hi) continue;
    float t = (zj - p.z) / (uLP.z - p.z);
    v *= 1.0 - softOcc3(j, mix(p.xy, uLP.xy, t), max(uLR * t, 1.0));
    if (v < 0.004) return 0.0;
  }
  return v;
}
float moonAperture(vec3 s) {
  vec2 k = uMD.xy / uMD.z;
  float v = 1.0 - softOcc3(uWallIdx, s.xy - s.z * k, 1.0 + s.z * 0.012);
  if (v < 0.01) return 0.0;
  if (uWallFIdx >= 0) { float zf = uZ[uWallFIdx]; if (s.z > zf) v *= 1.0 - 0.85 * softOcc3(uWallFIdx, s.xy - (s.z - zf) * k, 1.0 + (s.z - zf) * 0.012); }
  return v;
}
float visMoon(vec3 p, int self) {
  if (p.z < -0.5) return 1.0;
  vec2 k = uMD.xy / uMD.z; float v = 1.0;
  for (int j = 0; j < 16; j++) {
    if (j >= uN) break;
    float zj = uZ[j];
    if (j == self || zj < -0.5 || zj >= p.z - 0.5) continue;
    v *= 1.0 - softOcc(j, p.xy - (p.z - zj) * k, 0.8 + (p.z - zj) * 0.012);
    if (v < 0.004) return 0.0;
  }
  return v;
}
float aoFront(int i, vec2 P) {
  float zi = uZ[i], keep = 1.0;
  vec2 away = zi > -0.5 ? P - uLP.xy : uMD.xy;
  away = away / max(length(away), 1e-3);
  for (int j = 0; j < 16; j++) {
    if (j >= uN) break;
    if (j <= i) continue;
    float gap = uZ[j] - zi;
    if (gap > 560.0) break;
    float s = uAO[j] * (1.0 - gap / 560.0);
    if (s <= 0.0) continue;
    float r = 1.5 + gap * 0.06;
    keep *= 1.0 - s * opac(M(j, P - away * (1.5 + gap * 0.04), log2(r) + 0.6));
  }
  return 1.0 - keep;
}
vec2 gradC(int i, vec2 P) {
  float l = M(i, P - vec2(1.0, 0.0), uLod0).r, r = M(i, P + vec2(1.0, 0.0), uLod0).r;
  float u = M(i, P - vec2(0.0, 1.0), uLod0).r, d = M(i, P + vec2(0.0, 1.0), uLod0).r;
  return vec2(r - l, d - u) * 0.5;
}
vec3 sky(vec2 P) {
  if (uSkyOn < 0.5) return uSkyTop;
  vec4 pa = paper(P, 7.7);
  float t = clamp(P.y / uHorY, 0.0, 1.0);
  vec3 c = mix(uSkyTop, uSkyHor, mix(t, t * t * (3.0 - 2.0 * t), 0.4));
  c *= 1.0 + 0.13 * pa.y + 0.08 * pa.x + 0.05 * pa.z;
  if (uMoon.z > 0.0) {
    vec2 d = P - uMoon.xy; float r = length(d), ang = atan(d.y, d.x);
    float rr = uMoon.z + 0.3 * sin(ang * 5.0 + 1.3) + 0.2 * sin(ang * 13.0 + 0.4);
    float disc = clamp(rr - r + 0.5, 0.0, 1.0), o = max(r - rr, 0.0);
    float hal = 0.2 * exp(-o / 60.0) + 0.16 * exp(-o / 13.0);
    c += coolRamp(hal * (1.0 + 0.7 * pa.y + 0.35 * pa.x)) * (1.0 - disc);
    c = mix(c, mix(vec3(0.52, 0.6, 0.8), vec3(0.6867, 0.7605, 0.9131), smoothstep(rr, rr * 0.2, r)), disc);
  }
  vec2 cell = floor(P / 27.0); float h = h12(cell + 11.3);
  if (h > 0.85) {
    vec2 sp = (cell + 0.2 + 0.6 * vec2(h12(cell + 3.7), h12(cell + 8.1))) * 27.0;
    c += coolRamp(clamp(1.25 - length(P - sp), 0.0, 1.0) * (0.25 + 0.6 * h12(cell + 5.5)));
  }
  return c;
}
void haze(vec2 P, float z0, float z1, float jit, inout vec3 col, inout float hW, inout float hC) {
  float len = z1 - z0;
  if (len <= 0.5) return;
  float tr = exp(-len * uHazeA);
  col = col * tr + uHazeCol * (1.0 - tr); hW *= tr; hC *= tr;
  if (uMonI > 0.0 && z0 <= uMP.z && uMP.z < z1) {
    float dm = length(toWorld(P, uMP.z) - uMP.xy);
    hC += uHazeMon * (exp(-dm / 26.0) + 0.25 * exp(-dm / 90.0));
  }
  float n = clamp(floor(len / 55.0) + 1.0, 1.0, 8.0), dz = len / n;
  for (int k = 0; k < 8; k++) {
    if (float(k) >= n) break;
    float z = z0 + (float(k) + jit) * dz;
    if (z < 0.0 && uWallIdx >= 0) continue;
    vec3 s = vec3(toWorld(P, z), z), d = uLP - s;
    float dd = dot(d, d), e = uLI / (dd + uLA * uLA) * exp(-sqrt(dd) / uLF) * uHazeW * dz;
    if (e > 1.5e-4) e *= visLh(s);
    hW += e;
    if (uMI > 0.0 && uWallIdx >= 0) hC += uHazeM * dz * moonAperture(s);
  }
}
void main() {
  vec2 P = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uK;
  float jit = h12(P * 1.37 + 0.71);
  vec3 col = sky(toWorld(P, uSkyZ));
  float hW = 0.0, hC = 0.0, defo = 0.0, zPrev = uZ0, front = 0.0, frontZ = -1.0e4;
  float zCam = uCamZc - uCamTz - uCamNear;
  for (int i = 0; i < 16; i++) {
    if (i >= uN) break;
    float zi = uZ[i];
    if (zi > zCam) break;
    haze(P, zPrev, zi, jit, col, hW, hC);
    zPrev = zi;
    vec2 Q = toWorld(P, zi);
    vec4 m = M(i, Q, uLod0);
    float card = m.r, vel = m.g, em = m.b;
    if (card + vel + em < 0.003) continue;
    if (uKind[i] == 2) {                     // a screen: its own light, not lit by the room (2x2 samples)
      vec3 sc = vec3(0.0);
      for (int k = 0; k < 4; k++) sc += screenCol(toWorld(P + (vec2(float(k & 1), float(k >> 1)) - 0.5) * 0.5 / uK, zi));
      col = mix(col, sc * 0.25, card);
      hW *= 1.0 - card; hC *= 1.0 - card;
      defo = mix(defo, uDef[i], card);
      if (card > 0.5) frontZ = zi;
      continue;
    }
    vec4 pa = paper(Q, float(i) * 1.618 + 0.3);
    vec3 p = vec3(Q, zi);
    bool inside = zi > -0.5 || uWallIdx < 0;
    if (vel > 0.003) {
      float fib = max(1.0 + 0.36 * pa.y + 0.22 * pa.x + 0.14 * pa.z, 0.2);
      float cv = clamp(vel * 3.0, 0.0, 1.0);
      col = mix(col, uVel[i] * vel * fib, cv * (1.0 - card));
      hW *= 1.0 - cv; hC *= 1.0 - cv;
    }
    if (card > 0.003) {
      float ao = aoFront(i, Q);
      vec3 base = uCol[i] * (1.0 - 0.55 * ao) * (1.0 + 0.03 * pa.y + 0.02 * pa.x);
      vec3 n = uKind[i] == 1 ? normalize(vec3(0.0, uUpN.x, uUpN.y)) : vec3(0.0, 0.0, 1.0);
      vec3 dL = uLP - p; float dist = length(dL); vec3 l = dL / dist;
      float irr = uLI / (dist * dist + uLA * uLA) * exp(-dist / uLF);
      float warm = 0.0, cool = 0.0, vis = -1.0, cf = dot(n, l);
      if (inside && cf > 0.0) {
        vis = visL(p, i);
        warm += irr * cf * vis * uAlb[i] * (1.0 + 0.13 * pa.x + 0.09 * pa.y + 0.06 * pa.z);
      }
      vec2 g = gradC(i, Q); float gl0 = length(g), e = clamp(gl0 * 2.0, 0.0, 1.0);
      if (e > 0.02) {
        vec2 en = -g / gl0;
        if (inside) {
          float f = dot(en, l.xy / max(length(l.xy), 1e-3)) * length(l.xy);
          if (vis < 0.0) vis = visL(p, i);
          float dk = e * clamp(-f * 2.5, 0.0, 1.0);
          warm *= 1.0 - 0.6 * dk;
          warm += min(e * max(f, 0.0) * irr * vis * uRim * uRimK[i], 1.35) * (0.8 + 0.35 * pa.x + 0.25 * pa.y);
          base *= 1.0 - 0.45 * dk;
        }
        if (uMI > 0.0) {
          float fm = dot(en, -normalize(uMD.xy));
          if (fm > 0.0) cool += e * fm * uMI * uMoonRim * visMoon(p + vec3(en * 2.0, 0.0), i);
        }
        cool += e * max(-en.y, 0.0) * uAmbRim * (0.7 + 0.3 * pa.y);
        if (uMonI > 0.0) {
          vec3 dm = uMP - p; float dmm = length(dm), fmn = dot(en, dm.xy / dmm);
          if (fmn > 0.0) cool += e * fmn * uMonI / (1.0 + dmm * dmm / 5000.0);
        }
      }
      if (inside && zi > uLP.z && uThin[i] > 0.0) {
        if (vis < 0.0) vis = visL(p, i);
        vec2 dl = normalize(uLP.xy - Q + 1e-3);
        float thick = 0.0;
        for (int k = 1; k <= 12; k++) thick += M(i, Q + dl * (float(k) * 2.2 - 1.0), 0.6).r * 2.2;
        float tr = exp(-thick / 6.0) + 0.14 * exp(-thick / 15.0);
        warm += min(irr * ((zi - uLP.z) / dist) * vis * uThin[i] * tr, 1.0) * (1.0 + 0.4 * pa.y + 0.2 * pa.x);
      }
      if (uKind[i] == 1 && uMI > 0.0) {
        float cm = max(dot(n, -uMD), 0.0);
        if (cm > 0.0) cool += cm * uMI * visMoon(p, i) * (1.0 + 0.25 * pa.y);
      }
      vec3 c = base * (1.0 - 0.62 * smoothstep(0.0, 0.7, warm)) + warmRamp(warm) + coolRamp(cool);
      col = mix(col, c, card);
      hW *= 1.0 - card; hC *= 1.0 - card;
      defo = mix(defo, uDef[i], card);
      if (zi > uLP.z) front += (1.0 - front) * card;
      if (card > 0.5) frontZ = zi;
    }
    if (em > 0.003) col += uEm[i] * em;
  }
  haze(P, zPrev, min(uZCam, zCam), jit, col, hW, hC);
  col += warmRamp(hW) + coolRamp(hC);
  oCol = vec4(col, defo);
  oAux = vec4(front, frontZ, 0.0, 1.0);
}`;

const BLUR_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes, uDir; uniform float uSigma;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes, px = uDir / vec2(textureSize(uSrc, 0));
  vec4 s = texture(uSrc, uv); float wsum = 1.0;
  for (int i = 1; i <= 24; i++) {
    float x = float(i); if (x > uSigma * 3.0) break;
    float w = exp(-0.5 * x * x / (uSigma * uSigma));
    s += w * (texture(uSrc, uv + px * x) + texture(uSrc, uv - px * x)); wsum += 2.0 * w;
  }
  o = s / wsum;
}`;
const BRIGHT_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes; uniform float uTh;
out vec4 o;
void main() {
  vec3 c = texture(uSrc, gl_FragCoord.xy / uRes).rgb;
  float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
  o = vec4(c * max(L - uTh, 0.0) / max(L, 1e-4), 1.0);
}`;
const FINAL_FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uHdr, uSoft, uB1, uB2, uB3, uFib, uAux;
uniform vec2 uRes; uniform float uK, uBloom, uGrain, uVig, uExpo;
uniform vec4 uClawd; uniform int uGlyph[5]; uniform int uEyes;
uniform vec4 uFill;
out vec4 o;
${LIB}
vec3 tm(vec3 x) { vec3 k = vec3(0.8); return min(x, k) + 0.2 * (1.0 - exp(-max(x - k, 0.0) / 0.2)); }
vec3 srgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 P = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uK;
  vec4 sh = texture(uHdr, uv), so = texture(uSoft, uv);
  float w = clamp(max(sh.a, so.a) * 1.6, 0.0, 1.0);
  vec3 c = mix(sh.rgb, so.rgb, w);
  c += uBloom * (0.5 * texture(uB1, uv).rgb + 0.32 * texture(uB2, uv).rgb + 0.18 * texture(uB3, uv).rgb);
  c *= uExpo;
  if (uFill.w > 0.0) {
    // warm light through tissue, filling the frame from the glow outward (S09's last beat)
    vec2 d = (P - uFill.xy) / uFill.z;
    float r2 = dot(d, d);
    vec2 q = P * 0.8 + 311.0;
    float fib = (texture(uFib, q / 1024.0).r - 0.5) * 0.5 + (texture(uFib, q / 2048.0).g - 0.5) * 0.4 + (fbm(q / 60.0) - 0.5) * 0.9;
    float x = (0.95 + 0.85 * exp(-r2 * 0.9)) * (1.0 + 0.16 * fib);
    float reach = smoothstep(uFill.w * 3.2, uFill.w * 3.2 - 1.2, sqrt(r2));
    // the paper stays faintly visible inside the light: dark cuts leave a soft ghost
    vec3 fl = warmRamp(x) * (0.8 + 0.2 * clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)) / 0.3, 0.0, 1.0));
    c = mix(c, max(c, fl), reach * smoothstep(0.0, 0.35, uFill.w));
  }
  c = tm(c);
  vec2 q = (uv - 0.5) * vec2(1.0, 0.82); c *= 1.0 - uVig * smoothstep(0.28, 0.78, length(q));
  vec3 s = srgb(c);
  float n = (h12(P + 0.5) + h12(P * 1.31 + 7.7) - 1.0);
  s += uGrain * n * (0.35 + 0.65 * sqrt(max(dot(s, vec3(0.333)), 0.0)));
  // Clawd: exact cells with box coverage, composited last, hidden only by layers in front of him
  if (uClawd.w > 0.5) {
    float fc = texture(uAux, uv).r;
    float cw = uClawd.z, chh = 2.0 * cw, hp = 0.5 / uK;
    vec2 a = P - hp - uClawd.xy, b = P + hp - uClawd.xy;
    if (fc < 0.999 && b.x > 0.0 && b.y > 0.0 && a.x < 18.0 * cw && a.y < 5.0 * chh) {
      int cx0 = int(floor(a.x / cw)), cy0 = int(floor(a.y / chh));
      float body = 0.0, eye = 0.0;
      for (int yy = 0; yy < 3; yy++) {
        int gy = cy0 + yy;
        float y0 = float(gy) * chh; if (y0 >= b.y) break;
        if (gy < 0 || gy > 4) continue;
        float oy = min(b.y, y0 + chh) - max(a.y, y0); if (oy <= 0.0) continue;
        for (int xx = 0; xx < 3; xx++) {
          int gx = cx0 + xx;
          float x0 = float(gx) * cw; if (x0 >= b.x) break;
          if (gx < 0 || gx > 17) continue;
          float ox = min(b.x, x0 + cw) - max(a.x, x0); if (ox <= 0.0) continue;
          if (((uGlyph[gy] >> (17 - gx)) & 1) == 1) body += ox * oy;
          else if (gy == 1 && (gx == 5 || gx == 12)) eye += ox * oy;
        }
      }
      float A = 4.0 * hp * hp; body = min(body / A, 1.0); eye = min(eye / A, 1.0 - body);
      if (body + eye > 0.0) {
        vec2 fq = P * 0.9;
        float f = texture(uFib, fq / 1024.0).r - 0.5 + (fbm(P / 7.0) - 0.5) * 0.8;
        vec3 cB = vec3(217.0, 119.0, 87.0) / 255.0 + f * 3.0 / 255.0 + n * 1.2 / 255.0;
        vec3 cE = uEyes == 1 ? vec3(1.0, 0.9, 0.8) : vec3(0.105, 0.066, 0.07) + n * 1.5 / 255.0;
        vec3 s1 = s * (1.0 - body - eye) + cB * body + cE * eye;
        s = mix(s1, s, fc);
      }
    }
  }
  o = vec4(s, 1.0);
}`;
// ---------------------------------------------------------------- revision 3 (S20): an external screen
// createPaper(..., { ext: true }) compiles these variants of MAIN_FS and FINAL_FS. Without the option
// the shaders are the originals above, byte for byte (S08 renders unchanged).
//  - layer kind 3: a screen showing an external canvas (st.ext.canvas, e.g. an inside render),
//    uploaded per frame as an sRGB texture with mipmaps and mapped onto the world rect
//    scene.ext.rect; sampled as a 2x2 box one level finer than its footprint (one exact sample at 1:1);
//  - the main pass writes the screen's visible coverage to aux.b;
//  - the final pass blends the post chain's result back to the screen's own pixels by
//    st.ext.pass * coverage, so at 1:1 the screen shows its canvas exactly (a push out through
//    the glass starts pixel for pixel on the frame that came before).
const EXT_SAMPLE = `
uniform sampler2D uExt; uniform vec4 uExtR; uniform float uExtLod;
vec3 extLin(vec2 P, float z) {
  float off = 0.25 * clamp(uExtLod, 0.0, 1.0) / uK, lod = max(uExtLod - 1.0, 0.0);
  vec3 s = vec3(0.0);
  for (int k = 0; k < 4; k++) {
    vec2 q = toWorld(P + (vec2(float(k & 1), float(k >> 1)) * 2.0 - 1.0) * off, z);
    s += textureLod(uExt, (q - uExtR.xy) / uExtR.zw, lod).rgb;
  }
  return s * 0.25;
}
`;
function patch(src, pairs, label) {
  for (const [anchor, repl] of pairs) {
    const n = src.split(anchor).length - 1;
    if (n !== 1) throw new Error(`paper ext patch (${label}): anchor found ${n} times: ${anchor.slice(0, 60)}`);
    src = src.replace(anchor, () => repl);
  }
  return src;
}
const TOWORLD = `vec2 toWorld(vec2 P, float z) {
  float d = uCamZc - z, e = max(d - uCamTz, 1.0);
  return uCamC + (P - uCamC - uPan + uCamT * (uCamDref / e)) * (e / d);
}
`;
const MAIN_FS_EXT = patch(MAIN_FS, [
  ['uniform float uScrGain;\n', 'uniform float uScrGain;\nuniform float uExtGain;\n'],
  [TOWORLD, TOWORLD + EXT_SAMPLE],
  ['  float zCam = uCamZc - uCamTz - uCamNear;\n', '  float zCam = uCamZc - uCamTz - uCamNear;\n  float scrCov = 0.0;\n'],
  ['    vec4 pa = paper(Q, float(i) * 1.618 + 0.3);\n', `    if (uKind[i] == 3) {                     // an external screen: its own light, not lit by the room
      col = mix(col, extLin(P, zi) * uExtGain, card);
      hW *= 1.0 - card; hC *= 1.0 - card;
      defo = mix(defo, uDef[i], card);
      if (card > 0.5) frontZ = zi;
      scrCov = card;
      continue;
    }
    vec4 pa = paper(Q, float(i) * 1.618 + 0.3);\n`],
  ['      hW *= 1.0 - cv; hC *= 1.0 - cv;\n', '      hW *= 1.0 - cv; hC *= 1.0 - cv;\n      scrCov *= 1.0 - cv * (1.0 - card);\n'],
  ['      col = mix(col, c, card);\n', '      col = mix(col, c, card);\n      scrCov *= 1.0 - card;\n'],
  ['  oAux = vec4(front, frontZ, 0.0, 1.0);', '  oAux = vec4(front, frontZ, scrCov, 1.0);'],
], 'main');
const FINAL_FS_EXT = patch(FINAL_FS, [
  ['uniform vec4 uFill;\n', 'uniform vec4 uFill;\nuniform vec2 uCamC, uPan, uCamT; uniform float uCamTz, uCamZc, uCamDref, uExtPass, uExtZ;\n' + TOWORLD + EXT_SAMPLE],
  ['  s += uGrain * n * (0.35 + 0.65 * sqrt(max(dot(s, vec3(0.333)), 0.0)));\n', `  s += uGrain * n * (0.35 + 0.65 * sqrt(max(dot(s, vec3(0.333)), 0.0)));
  // the external screen shows its canvas as rendered (coverage from the main pass)
  float cov = texture(uAux, uv).b * uExtPass;
  if (cov > 0.0) s = mix(s, srgb(extLin(P, uExtZ)), cov);
`],
], 'final');

// dust motes: soft points added to the HDR image, hidden behind the frontmost card
const DUST_VS = `#version 300 es
layout(location = 0) in vec4 aD;   // screen x, y (reference px), size (px), intensity
layout(location = 1) in float aZ;  // world depth
uniform vec2 uRes; uniform float uK;
out float vI; out float vZ;
void main() {
  vec2 p = aD.xy * uK;
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  gl_PointSize = max(aD.z * uK * 3.0, 1.5);
  vI = aD.w * min(aD.z * uK, 1.0); vZ = aZ;
}`;
const DUST_FS = `#version 300 es
precision highp float;
uniform sampler2D uAux; uniform vec3 uDustCol;
in float vI; in float vZ;
out vec4 o;
void main() {
  vec2 d = (gl_PointCoord - 0.5) * 3.0;
  float a = exp(-dot(d, d) * 1.6);
  if (texelFetch(uAux, ivec2(gl_FragCoord.xy), 0).g > vZ) discard;
  o = vec4(uDustCol * vI * a, 0.0);
}`;

// ================================================================ ENGINE
// scene: { world: {x0, y0, w, h}, layers: [...], light, moon, sky, mon, eyes, hazeW, params, cam }
// Layer fields as in the frame (z, col, alb, kind, thin, def, ao, cast, rimk, vel, em, draw), plus
// key(pose) -> string for animated layers (drawn with roughStable) and seed.
export const LAYER_DEFAULTS = { alb: 0.7, kind: 0, thin: 0, def: 0, ao: 0.45, cast: 0, rimk: 1, vel: [0, 0, 0], em: [0, 0, 0] };
export const PARAM_DEFAULTS = { rim: 1.3, mrim: 0.45, hmon: 0.1, hm: 1.15e-4, ha: 0.00012, arim: 0.12, bth: 0.5, bloom: 0.55, grain: 0.03, vig: 0.2, hw: 6.0e-5 };

export function createPaper(CANVAS, scene, opts = {}) {
  const LOGFN = opts.log || (() => {});
  const K = opts.k || 1;
  const RW = Math.round(W * K), RH = Math.round(H * K);
  const BANDS = opts.bands || 3;
  const TIMES = {};
  const WO = scene.world;
  const P0 = Object.assign({}, PARAM_DEFAULTS, scene.params || {});
  const gl = CANVAS.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: false });
  if (!gl) throw new Error('no webgl2');
  if (!gl.getExtension('EXT_color_buffer_float')) LOGFN('WARNING: no EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear');
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  function compile(fs, label, vs = VS) {
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(s), mm = /ERROR: 0:(\d+)/.exec(info), ln = mm ? +mm[1] : 0;
        LOGFN('SHADER ERROR ' + label + ': ' + info + '\n' + src.split('\n').slice(Math.max(0, ln - 4), ln + 2).map((l, i) => (Math.max(0, ln - 4) + i + 1) + ': ' + l).join('\n'));
        throw new Error('shader ' + label);
      }
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { LOGFN('LINK ERROR ' + label + ': ' + gl.getProgramInfoLog(p)); throw new Error('link'); }
    return p;
  }
  function setU(prog, u) {
    if (!prog.info) {
      prog.info = {};
      const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(prog, i); prog.info[a.name.replace(/\[0\]$/, '')] = { type: a.type, loc: gl.getUniformLocation(prog, a.name) }; }
    }
    for (const [k, v] of Object.entries(u)) {
      const f = prog.info[k]; if (!f) continue;
      const a = (Array.isArray(v) || ArrayBuffer.isView(v)) ? v : [v];
      switch (f.type) {
        case gl.FLOAT: gl.uniform1fv(f.loc, new Float32Array(a)); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(f.loc, new Float32Array(a)); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(f.loc, new Float32Array(a)); break;
        case gl.FLOAT_VEC4: gl.uniform4fv(f.loc, new Float32Array(a)); break;
        case gl.INT: case gl.BOOL: gl.uniform1iv(f.loc, new Int32Array(a)); break;
      }
    }
  }
  function target(w, h) {
    const fb = gl.createFramebuffer(), t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { fb, t, w, h };
  }
  function target2(w, h) {
    const a = target(w, h), t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, t, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    a.aux = t;
    // a second framebuffer on the colour texture alone, for the dust pass (which reads aux)
    a.fbCol = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, a.fbCol); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, a.t, 0);
    return a;
  }
  const _px = new Uint8Array(4);
  function gpuSync() { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, _px); }
  function run(prog, tgt, uni, texs, bands = 1) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.fb : null);
    const w = tgt ? tgt.w : RW, h = tgt ? tgt.h : RH;
    gl.viewport(0, 0, w, h); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    let unit = 0;
    for (const [name, t] of Object.entries(texs || {})) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(t.arr ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D, t.arr ? t.arr : (t.t || t));
      gl.uniform1i(gl.getUniformLocation(prog, name), unit); unit++;
    }
    setU(prog, Object.assign({ uRes: [w, h] }, uni));
    if (bands > 1) {
      gl.enable(gl.SCISSOR_TEST);
      for (let b = 0; b < bands; b++) { const y0 = Math.floor(h * b / bands), y1 = Math.floor(h * (b + 1) / bands); gl.scissor(0, y0, w, y1 - y0); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.flush(); }
      gl.disable(gl.SCISSOR_TEST);
    } else gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ---- layers and masks
  const layers = scene.layers.map(l => Object.assign({}, LAYER_DEFAULTS, l));
  layers.sort((a, b) => a.z - b.z);
  const N = layers.length;
  if (N > 16) throw new Error('too many layers');
  const t0 = performance.now();
  const arr = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, arr);
  const levels = Math.floor(Math.log2(Math.max(WO.w, WO.h))) + 1;
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, WO.w, WO.h, N);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  const scratch = document.createElement('canvas');
  function paintRect(ops, rx, ry, rw, rh, i) {
    if (scratch.width !== rw || scratch.height !== rh) { scratch.width = rw; scratch.height = rh; }
    const x = scratch.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#000'; x.fillRect(0, 0, rw, rh);
    x.globalCompositeOperation = 'lighter';
    x.setTransform(1, 0, 0, 1, -rx, -ry);
    paintOps(x, ops);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, arr);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, rx - WO.x0, ry - WO.y0, i, rw, rh, 1, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
  }
  function recordLayer(i, pose) {
    const ly = layers[i], ops = [];
    let mk;
    if (ly.key) { let n = 0; const base = (ly.seed || 0) * 131 + 9001 + i * 7919; mk = recorder(ops, (pts, amp) => roughStable(pts, base + (n++) * 7907, amp)); }
    else { const rnd = mulberry32(1000 + i * 7919 + (ly.seed || 0)); mk = recorder(ops, (pts, amp) => rough(pts, rnd, amp)); }
    ly.draw(mk, mulberry32(77 + i), pose || {});
    return ops;
  }
  const clipRect = (b) => {
    const x0 = Math.max(WO.x0, Math.floor(b[0])), y0 = Math.max(WO.y0, Math.floor(b[1]));
    const x1 = Math.min(WO.x0 + WO.w, Math.ceil(b[2])), y1 = Math.min(WO.y0 + WO.h, Math.ceil(b[3]));
    return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
  };
  // first draw of every layer, full size
  const pose0 = opts.pose || {};
  for (let i = 0; i < N; i++) {
    const ly = layers[i], ops = recordLayer(i, pose0);
    paintRect(ops, WO.x0, WO.y0, WO.w, WO.h, i);
    if (ly.key) { ly._key = ly.key(pose0); ly._box = opsBox(ops); }
  }
  gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // redraw the animated layers whose pose key changed; only the old+new bounding box is uploaded
  function updateMasks(pose) {
    let n = 0;
    for (let i = 0; i < N; i++) {
      const ly = layers[i];
      if (!ly.key) continue;
      const key = ly.key(pose);
      if (key === ly._key) continue;
      const ops = recordLayer(i, pose), box = opsBox(ops), old = ly._box;
      const u = box && old ? [Math.min(box[0], old[0]), Math.min(box[1], old[1]), Math.max(box[2], old[2]), Math.max(box[3], old[3])] : (box || old);
      const r = u && clipRect(u);
      if (r) { paintRect(ops, r[0], r[1], r[2], r[3], i); n++; }
      ly._key = key; ly._box = box;
    }
    if (n) gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    return n;
  }
  // ---- fibre
  const fbd = makeFibre();
  const fib = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fib);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fbd.S, fbd.S, 0, gl.RGBA, gl.UNSIGNED_BYTE, fbd.data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gpuSync(); TIMES.masks = performance.now() - t0;

  // ---- static uniforms
  const pack = (f, n = 1) => { const a = []; layers.forEach(l => { const v = f(l); if (n === 1) a.push(v); else a.push(...v); }); return a; };
  const idx = name => layers.findIndex(l => l.name === name);
  const mo = scene.moon || { dir: [0.3, 0.5, 1], I: 0, disc: [0, 0, 0] };
  const sky = scene.sky || { top: '#07080E', hor: '#0E1120', horY: 1080 };
  const U0 = {
    uK: K, uLod0: Math.max(0, Math.log2(1 / K)), uWO: [WO.x0, WO.y0], uWS: [WO.w, WO.h],
    uN: N, uZ: pack(l => l.z), uCol: pack(l => lin(l.col), 3), uAlb: pack(l => l.alb), uKind: pack(l => l.kind),
    uThin: pack(l => l.thin), uDef: pack(l => l.def), uVel: pack(l => l.vel, 3), uEm: pack(l => l.em, 3), uAO: pack(l => l.ao), uCast: pack(l => l.cast), uRimK: pack(l => l.rimk),
    uRim: P0.rim, uMD: mo.dir, uMI: mo.I, uMoonRim: P0.mrim, uWallIdx: idx('wall'), uWallFIdx: idx('wallFront'),
    uMP: scene.mon ? [scene.mon.x, scene.mon.y, scene.mon.z] : [0, 0, 0], uMonI: scene.mon ? scene.mon.I : 0, uHazeMon: scene.mon ? P0.hmon : 0,
    uHazeW: scene.hazeW || P0.hw, uHazeM: P0.hm, uHazeA: P0.ha, uHazeCol: lin('#2A3150'),
    uZ0: layers[0].z - 240, uZCam: layers[N - 1].z + 160,
    uSkyTop: lin(sky.top), uSkyHor: lin(sky.hor), uHorY: sky.horY, uSkyOn: scene.sky ? 1 : 0, uSkyZ: -3000,
    uMoon: mo.disc, uUpN: [-0.93, 0.37], uAmbRim: P0.arim,
  };
  const EXT = !!opts.ext;       // revision 3: layer kind 3 shows st.ext.canvas (see MAIN_FS_EXT)
  const mainP = compile(EXT ? MAIN_FS_EXT : MAIN_FS, 'main'), blurP = compile(BLUR_FS, 'blur'), brightP = compile(BRIGHT_FS, 'bright'), finP = compile(EXT ? FINAL_FS_EXT : FINAL_FS, 'final');
  const dustP = compile(DUST_FS, 'dust', DUST_VS);
  const hdr = target2(RW, RH);
  const sA = target(RW, RH), sB = target(RW, RH);
  const h2 = [Math.round(RW / 2), Math.round(RH / 2)], h4 = [Math.round(RW / 4), Math.round(RH / 4)], h8 = [Math.round(RW / 8), Math.round(RH / 8)];
  const b0 = target(...h2), bA = target(...h2), bB = target(...h2);
  const q0 = target(...h4), qA = target(...h4), qB = target(...h4);
  const e0 = target(...h8), eA = target(...h8), eB = target(...h8);
  const glyph = ['...############...', '...##.######.##...', '.################.', '...############...', '....#.#....#.#....'].map(r => parseInt(r.replace(/#/g, '1').replace(/\./g, '0'), 2));
  const dustBuf = gl.createBuffer();

  function drawDust(motes, cam) {
    const n = motes.length; if (!n) return;
    const d = new Float32Array(n * 5);
    motes.forEach((m, i) => {
      const { s } = camMap(cam, m.z), p = toScreen(cam, [m.x, m.y], m.z);
      d.set([p[0], p[1], m.size * s, m.I, m.z], i * 5);
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdr.fbCol);
    gl.viewport(0, 0, RW, RH); gl.useProgram(dustP);
    gl.bindBuffer(gl.ARRAY_BUFFER, dustBuf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, hdr.aux); gl.uniform1i(gl.getUniformLocation(dustP, 'uAux'), 0);
    setU(dustP, { uRes: [RW, RH], uK: K, uDustCol: lin('#9FB3D9').map(v => v * 1.0) });
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, n);
    gl.disable(gl.BLEND);
    gl.disableVertexAttribArray(1);
  }

  // ---- the external screen (ext option): one sRGB texture with mipmaps per source canvas,
  // refilled from the canvas every frame; filtered in linear light
  const extCache = new Map();
  const extZ = EXT ? (layers.find(l => l.kind === 3) || { z: 0 }).z : 0;
  function extUpload(c) {
    let e = extCache.get(c);
    if (!e) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texStorage2D(gl.TEXTURE_2D, Math.floor(Math.log2(Math.max(c.width, c.height))) + 1, gl.SRGB8_ALPHA8, c.width, c.height);
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      e = { tex: t, w: c.width, h: c.height };
      extCache.set(c, e);
    }
    gl.bindTexture(gl.TEXTURE_2D, e.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    return e;
  }

  // ---- per frame
  // st: { pose, cam, light: {x, y, z, r, I, a, f}, clawd: {x0, y0, cell, z} | null, dust: [{x, y, z, size, I}],
  //       post: {bloom, grain, vig, expo, fill: [sx, sy, radius, amount]},
  //       ext: {canvas, gain, pass} (ext option only) }
  function frame(st) {
    const ta = performance.now();
    const nUp = st.pose ? updateMasks(st.pose) : 0;
    const tb = performance.now();
    const li = Object.assign({}, scene.light, st.light || {});
    const cam = Object.assign({ Zc: 2400, zref: 600, c: [W / 2, H / 2], t: [0, 0], tz: 0, pan: [0, 0], near: 60 }, scene.cam || {}, st.cam || {});
    const scr = scene.screen, c0 = st.clawd || scene.clawd;
    const U = Object.assign({}, U0, {
      uLP: [li.x, li.y, li.z], uLR: li.r, uLI: li.I, uLA: li.a, uLF: li.f,
      uCamC: cam.c, uPan: cam.pan, uCamT: cam.t, uCamTz: cam.tz, uCamZc: cam.Zc, uCamDref: cam.Zc - cam.zref, uCamNear: cam.near,
      uScrR: scr ? [scr.origin[0], scr.origin[1], scr.pix, scr.horizon] : [0, 0, 1, 0],
      uScrG: scr && c0 ? [c0.x0 + 9 * c0.cell, c0.y0 + 5 * c0.cell, scr.glowR, st.screen && st.screen.glow !== undefined ? st.screen.glow : 1] : [0, 0, 1, 0],
      uScrGain: scr ? scr.gain : 1,
    });
    let extU = null, extT = null;
    if (EXT && st.ext && st.ext.canvas) {
      const e = extUpload(st.ext.canvas), R = scene.ext.rect;
      extT = e.tex;
      extU = { uExtR: R, uExtLod: Math.log2((e.w / R[2]) / (camMap(cam, extZ).s * K)), uExtGain: st.ext.gain ?? 1,
        uExtPass: st.ext.pass ?? 1, uExtZ: extZ };
    }
    if (extU) run(mainP, hdr, Object.assign(U, extU), { uM: { arr }, uFib: fib, uExt: extT }, BANDS);
    else run(mainP, hdr, U, { uM: { arr }, uFib: fib }, BANDS);
    if (st.dust) drawDust(st.dust, cam);
    const po = Object.assign({ bloom: P0.bloom, grain: P0.grain, vig: P0.vig, expo: 1, fill: [0, 0, 1, 0] }, st.post || {});
    run(blurP, sA, { uDir: [1, 0], uSigma: 2.2 * K }, { uSrc: hdr }); run(blurP, sB, { uDir: [0, 1], uSigma: 2.2 * K }, { uSrc: sA });
    run(brightP, b0, { uTh: P0.bth }, { uSrc: hdr });
    run(blurP, bA, { uDir: [1, 0], uSigma: 3 * K }, { uSrc: b0 }); run(blurP, bB, { uDir: [0, 1], uSigma: 3 * K }, { uSrc: bA });
    run(blurP, q0, { uDir: [0, 0], uSigma: 0.1 }, { uSrc: bB });
    run(blurP, qA, { uDir: [1, 0], uSigma: 5 * K }, { uSrc: q0 }); run(blurP, qB, { uDir: [0, 1], uSigma: 5 * K }, { uSrc: qA });
    run(blurP, e0, { uDir: [0, 0], uSigma: 0.1 }, { uSrc: qB });
    run(blurP, eA, { uDir: [1, 0], uSigma: 7 * K }, { uSrc: e0 }); run(blurP, eB, { uDir: [0, 1], uSigma: 7 * K }, { uSrc: eA });
    let cl = [0, 0, 1, 0];
    if (st.clawd) {
      const c = st.clawd, z = c.z !== undefined ? c.z : li.z, { s } = camMap(cam, z), p = toScreen(cam, [c.x0, c.y0], z);
      cl = [p[0], p[1], c.cell * s, 1];
    }
    if (extU) run(finP, null, Object.assign({
      uK: K, uBloom: po.bloom, uGrain: po.grain, uVig: po.vig, uExpo: po.expo, uFill: po.fill,
      uClawd: cl, uGlyph: glyph, uEyes: scene.eyes === 'hot' ? 1 : 0,
      uCamC: cam.c, uPan: cam.pan, uCamT: cam.t, uCamTz: cam.tz, uCamZc: cam.Zc, uCamDref: cam.Zc - cam.zref,
    }, extU), { uHdr: hdr, uSoft: sB, uB1: bB, uB2: qB, uB3: eB, uFib: fib, uAux: hdr.aux, uExt: extT });
    else run(finP, null, {
      uK: K, uBloom: po.bloom, uGrain: po.grain, uVig: po.vig, uExpo: po.expo, uFill: po.fill,
      uClawd: cl, uGlyph: glyph, uEyes: scene.eyes === 'hot' ? 1 : 0,
    }, { uHdr: hdr, uSoft: sB, uB1: bB, uB2: qB, uB3: eB, uFib: fib, uAux: hdr.aux });
    if (opts.sync) gpuSync();
    TIMES.masksMs = tb - ta; TIMES.maskLayers = nUp; TIMES.frameMs = performance.now() - ta;
    return cl;
  }
  LOGFN(`paper engine: ${N} layers, world ${WO.w}x${WO.h}, render ${RW}x${RH}, masks+fibre ${TIMES.masks.toFixed(0)} ms`);
  return { frame, gpuSync, TIMES, layers, gl };
}
