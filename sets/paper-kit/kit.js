// paper-kit: a general backlit cut-paper engine for the outside world (brief G, S06-S29).
// Forked from sets/paper-lab/paper.js (a port of style-frames/11-paper-lab); graded to match
// style-frames/12-paper-fusion exactly (warm light is ONE scalar W taken through 12's ramp at the
// very end, 12's bloom, vignette and grain), so every warm hue comes from the fixed orange ramp.
//
// What the lab engine had (kept): layers as 2D masks at depths (R card, G vellum, B pinholes),
// hand-cut edges, fibre, one warm area light with soft shadows projected through every layer,
// rims (bright toward the light, dark away), thin-paper glow, soft layer shadows (AO), haze with
// shafts, moonlight and cool rims, a night-sky tissue, the 2.5D camera, soft focus, dust.
// What is new here:
//  - per-layer 2D transforms every frame (st.layers[name] = {dx, dy, s, sx, sy, rot, piv}): cards slide,
//    rise and open without redrawing their masks;
//  - per-frame layer overrides (em, ew, vw, vl, col, z, ...) so glows can animate;
//  - warm vellum: G coverage glows W = (vw + vl * light) * fibre (tissue lit from behind);
//  - warm pinholes: B emission adds ew * B to W (cool emission uEm when ew = 0);
//  - timed pinholes: a layer with timed > 0 stores a per-shape time code in G, and a shape lights
//    when the layer's clock st.layers[name].t passes its code (windows, LEDs, one by one, with no
//    mask redraw); with cw > 0 the layer also holds chase codes (m.chase): pulses that travel
//    along cables or cascade down LED rows as the chase clock cc advances (gain cg);
//  - paper fibre is sampled in each layer's own coordinates, so it sticks to moving paper (vf
//    scales a vellum layer's fibre contrast);
//  - two unshadowed warm fill lights next to the shadowed main light;
//  - outdoor moonlight (no wall), a space sky (st.sky.space), bright pinholes with optional
//    star-shaped cuts (st.sky.pins, up to 16), and paper satellites with warm glints (st.sky.sats).
export const W = 1920, H = 1080;

// ---------------------------------------------------------------- utilities
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
export const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const easeIn = t => Math.pow(clamp(t, 0, 1), 3);
export const easeInOut = t => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const lin = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); };
export function vnoise1(seed) {
  const r = mulberry32(seed), T = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) T[i] = r() * 2 - 1;
  return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return T[i & 1023] + (T[(i + 1) & 1023] - T[i & 1023]) * u; };
}
// the papers (style bible), near to far
export const PAPER = { ink: '#10131F', deep: '#171C30', slate: '#212843', dusk: '#2D3656', far: '#3B4668' };

// ---------------------------------------------------------------- shapes (from the lab)
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
  arc(cx, cy, rx, ry, a0, a1, n = 48) { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; },
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
  // a straight strut of width w from a to b (square ends)
  bar(a, b, w) { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2; return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; },
  poly: pts => pts.map(p => p.slice()),
};
export function resample(pts, step = 2) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  return out;
}
// hand-cut edge: wobble along the normal plus the occasional notch (sequential rng, static layers)
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
// same look, keyed to arclength with a per-shape seed: animated shapes keep their cut edge
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
// A mask layer: R = opaque card, G = vellum (or, on a timed layer, the time code), B = pinholes.
function recorder(ops, edge) {
  let blur = 0;
  const put = (pts, col, amp, mode) => ops.push({ pts: edge(pts, amp), col, mode, blur });
  return {
    // everything drawn inside fn is blurred by r px (soft tissue profiles, glows)
    soft: (r, fn) => { const b0 = blur; blur = r; fn(); blur = b0; },
    card: (pts, amp = 0.6) => put(pts, '#ff0000', amp, 'add'),
    vel: (pts, v = 1, amp = 0.6) => put(pts, `rgb(0,${Math.round(255 * v)},0)`, amp, 'add'),
    // vellum as a union (max instead of sum): overlapping pieces merge into one cut shape
    velU: (pts, v = 1, amp = 0.6) => put(pts, `rgb(0,${Math.round(255 * v)},0)`, amp, 'max'),
    cardU: (pts, amp = 0.6) => put(pts, '#ff0000', amp, 'max'),
    emit: (pts, v = 1, amp = 0) => put(pts, `rgb(0,0,${Math.round(255 * v)})`, amp, 'add'),
    cut: (pts, amp = 0.6) => put(pts, '#000', amp, 'cut'),
    // on a dual layer (cw > 0): a step code (lights when the clock passes t01, 127 levels) or a
    // chase code (a pulse passes when the chase clock cc is at c01, mod 1)
    step2: (pts, t01, v = 1, amp = 0) => {
      const e = edge(pts, amp);
      ops.push({ pts: e, col: `rgb(0,${clamp(Math.round(127 * t01), 1, 127)},0)`, mode: 'code', blur });
      ops.push({ pts: e, col: `rgb(0,0,${Math.round(255 * v)})`, mode: 'add', blur });
    },
    chase: (pts, c01, v = 1, amp = 0) => {
      const e = edge(pts, amp), c = ((c01 % 1) + 1) % 1;
      ops.push({ pts: e, col: `rgb(0,${128 + Math.round(127 * c)},0)`, mode: 'code', blur });
      ops.push({ pts: e, col: `rgb(0,0,${Math.round(255 * v)})`, mode: 'add', blur });
    },
    // a timed pinhole: lights when the layer clock passes t01 (0..1); cut the hole first
    timed: (pts, t01, v = 1, amp = 0) => {
      const e = edge(pts, amp);
      ops.push({ pts: e, col: `rgb(0,${clamp(Math.round(255 * t01), 1, 255)},0)`, mode: 'code' });
      ops.push({ pts: e, col: `rgb(0,0,${Math.round(255 * v)})`, mode: 'add' });
    },
  };
}
function paintOps(x, ops, ms = 1) {
  for (const o of ops) {
    x.filter = o.blur ? `blur(${(o.blur * ms).toFixed(2)}px)` : 'none';
    x.globalCompositeOperation = o.mode === 'cut' ? 'source-over' : (o.mode === 'code' || o.mode === 'max') ? 'lighten' : 'lighter';
    x.beginPath(); o.pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath();
    x.fillStyle = o.col; x.fill();
    if (o.mode === 'code') { x.strokeStyle = o.col; x.lineWidth = 4; x.lineJoin = 'round'; x.stroke(); }
  }
  x.filter = 'none';
  x.globalCompositeOperation = 'lighter';
}
function opsBox(ops) {
  let a = 1e9, b = 1e9, c = -1e9, d = -1e9, m = 4;
  for (const o of ops) { m = Math.max(m, 4 + 3 * (o.blur || 0)); for (const p of o.pts) { if (p[0] < a) a = p[0]; if (p[1] < b) b = p[1]; if (p[0] > c) c = p[0]; if (p[1] > d) d = p[1]; } }
  return a > c ? null : [a - m, b - m, c + m, d + m];
}

// ---------------------------------------------------------------- fibre texture (from the lab)
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

// ---------------------------------------------------------------- the 2.5D camera (from the lab)
// A layer at depth z (wall = 0, +z toward the camera) is authored in screen px of the rest view.
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
export function panFor(cam, F, zF, S) {
  const c = cam.c || [W / 2, H / 2], d = cam.Zc - zF, e = Math.max(d - (cam.tz || 0), 1), Dref = cam.Zc - cam.zref;
  const s = d / e, t = cam.t || [0, 0];
  return [S[0] - c[0] - (F[0] - c[0]) * s + t[0] * Dref / e, S[1] - c[1] - (F[1] - c[1]) * s + t[1] * Dref / e];
}

// ================================================================ SHADERS
const LIB = `
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 h22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), u.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.07 + 17.1; a *= 0.5; } return s; }
// the humans' light: around #9FB3D9, never above #D8E2F5 (linear)
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
uniform vec2 uRes; uniform float uK, uLod0, uMS; uniform int uN;
uniform vec4 uLA[16];   // z, albedo, thin, defocus
uniform vec4 uLB[16];   // ao, rim gain, kind (1 = horizontal), casts into haze
uniform vec3 uCol[16], uVel[16], uEm[16];
uniform vec4 uXf[16];   // world -> mask: the inverse 2x2 (a, b, c, d) about the pivot
uniform vec4 uXt[16];   // offset dx, dy, pivot x, y
uniform vec4 uXg[16];   // clock (timed), fade width (> 0: timed layer), bound (zero outside its mask), opacity
uniform float uXs[16];  // the paper-edge stencil step in world px (1; a layer with lpx: one of its own px)
uniform vec4 uXc[16];   // chase clock, chase width (> 0: dual codes), chase gain, vellum fibre gain
uniform vec4 uVW[16];   // vellum self-glow, vellum lit gain, pinhole warm gain, pinhole fibre
uniform vec3 uLP; uniform float uLR, uLI, uLA0, uRim, uLF;
uniform vec4 uFP[2], uFI[2];   // fill lights: xyz; I, a, falloff, haze gain
uniform vec3 uMD; uniform float uMI, uMoonRim, uMoonZ0; uniform int uWallIdx;
uniform float uHazeW, uHazeM, uHazeA; uniform vec3 uHazeCol; uniform float uZ0, uZCam;
uniform vec3 uSkyTop, uSkyHor, uMoon; uniform float uHorY, uSkyOn, uSkyZ, uStarD, uStarB, uSpace;
uniform vec4 uPin[16], uPinX[16]; uniform vec2 uSkyOff;
uniform vec4 uSat[2], uSatL[2];
uniform vec2 uUpN; uniform float uAmbRim;
uniform vec2 uWO, uWS;
uniform vec2 uCamC, uPan, uCamT; uniform float uCamTz, uCamZc, uCamDref, uCamNear;
layout(location = 0) out vec4 oCol;
layout(location = 1) out vec4 oAux;
${LIB}
#define LZ(j) uLA[j].x
vec2 toWorld(vec2 P, float z) {
  float d = uCamZc - z, e = max(d - uCamTz, 1.0);
  return uCamC + (P - uCamC - uPan + uCamT * (uCamDref / e)) * (e / d);
}
vec2 xfP(int i, vec2 P) { vec4 x = uXf[i]; vec4 t = uXt[i]; vec2 d = P - t.zw - t.xy; return t.zw + vec2(x.x * d.x + x.y * d.y, x.z * d.x + x.w * d.y); }
vec4 M(int i, vec2 P, float lod) {
  vec2 uv = (xfP(i, P) - uWO) / uWS;
  if (uXg[i].z > 0.5 && (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0)) return vec4(0.0);
  return textureLod(uM, vec3(uv, float(i)), lod) * uXg[i].w;
}
float opac(int i, vec4 m) { return clamp(m.r + (uXg[i].y > 0.0 ? 0.0 : 0.55 * m.g), 0.0, 1.0); }
vec4 paper(vec2 P, float seed) {
  float a = seed * 2.399; mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
  vec2 q = R * P + seed * vec2(137.1, 71.3);
  vec4 t = texture(uFib, q / 1024.0);
  float fl = fbm(q / 34.0) * 0.62 + fbm(q / 9.0) * 0.38;
  return vec4(t.r * 2.0 - 1.0, (fl - 0.5) * 2.6, t.g * 2.0 - 1.0, t.b * 2.0 - 1.0);
}
float softOcc(int j, vec2 q, float r) {
  if (r < 0.9) return opac(j, M(j, q, 0.0));
  float lod = log2(r) + 0.2;
  vec2 a = vec2(0.55, 0.2) * r, b = vec2(-0.2, 0.55) * r;
  return 0.36 * opac(j, M(j, q, lod)) + 0.16 * (opac(j, M(j, q + a, lod)) + opac(j, M(j, q - a, lod)) + opac(j, M(j, q + b, lod)) + opac(j, M(j, q - b, lod)));
}
float softOcc3(int j, vec2 q, float r) {
  float lod = log2(max(r, 1.0)) + 0.5;
  vec2 a = vec2(0.45, 0.25) * r;
  return 0.5 * opac(j, M(j, q, lod)) + 0.25 * (opac(j, M(j, q + a, lod)) + opac(j, M(j, q - a, lod)));
}
float visL(vec3 p, int self) {
  float v = 1.0, lo = min(p.z, uLP.z) + 0.5, hi = max(p.z, uLP.z) - 0.5;
  for (int j = 0; j < 16; j++) {
    if (j >= uN) break;
    float zj = LZ(j);
    if (j == self || zj <= lo || zj >= hi) continue;
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
    float zj = LZ(j);
    if (uLB[j].w < 0.5 || zj <= lo || zj >= hi) continue;
    float t = (zj - p.z) / (uLP.z - p.z);
    v *= 1.0 - softOcc3(j, mix(p.xy, uLP.xy, t), max(uLR * t, 1.0));
    if (v < 0.004) return 0.0;
  }
  return v;
}
// moonlight comes from behind (+z toward the camera): occluders are the layers behind p
float visMoon(vec3 p, int self) {
  vec2 k = uMD.xy / uMD.z; float v = 1.0;
  for (int j = 0; j < 16; j++) {
    if (j >= uN) break;
    float zj = LZ(j);
    if (j == self || zj < uMoonZ0 || zj >= p.z - 0.5) continue;
    v *= 1.0 - softOcc(j, p.xy - (p.z - zj) * k, 0.8 + (p.z - zj) * 0.012);
    if (v < 0.004) return 0.0;
  }
  return v;
}
float aoFront(int i, vec2 P) {
  float zi = LZ(i), keep = 1.0;
  vec2 away = uLI > 0.0 ? P - uLP.xy : vec2(-uMD.x, -uMD.y);
  away = away / max(length(away), 1e-3);
  for (int j = 0; j < 16; j++) {
    if (j >= uN) break;
    if (j <= i) continue;
    float gap = LZ(j) - zi;
    if (gap > 560.0) break;
    float s = uLB[j].x * (1.0 - gap / 560.0);
    if (s <= 0.0) continue;
    float r = 1.5 + gap * 0.06;
    keep *= 1.0 - s * opac(j, M(j, P - away * (1.5 + gap * 0.04), log2(r) + 0.6));
  }
  return 1.0 - keep;
}
vec2 gradC(int i, vec2 P) {
  float h = uXs[i];
  float l = M(i, P - vec2(h, 0.0), uLod0).r, r = M(i, P + vec2(h, 0.0), uLod0).r;
  float u = M(i, P - vec2(0.0, h), uLod0).r, d = M(i, P + vec2(0.0, h), uLod0).r;
  return vec2(r - l, d - u) * 0.5;
}
float starLayer(vec2 p, float cs, float dens, float seed, float bmin, float bmax, float bpow, float rad) {
  vec2 cell = floor(p / cs); float K = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = cell + vec2(float(i), float(j));
    vec2 sp = (c + 0.12 + 0.76 * h22(c + seed)) * cs;
    if (h12(c * 1.37 + seed * 0.71) > dens) continue;
    float u = pow(h12(c + seed * 3.3 + 0.5), bpow);
    float b = bmin + (bmax - bmin) * u;
    float r = rad * (0.6 + 0.7 * sqrt(u));
    float dd = length(p - sp);
    K += b * clamp(r + 0.5 - dd, 0.0, 1.0) + 0.10 * b * exp(-dd * dd / (8.0 * r * r));
  }
  return K;
}
float sdBox(vec2 q, vec2 b) { vec2 d = abs(q) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
vec3 sky(vec2 P, out float Wsky) {
  Wsky = 0.0;
  if (uSkyOn < 0.5) return uSkyTop;
  vec4 pa = paper(P, 7.7);
  float t = clamp(P.y / uHorY, 0.0, 1.0);
  vec3 c = mix(uSkyTop, uSkyHor, mix(t, t * t * (3.0 - 2.0 * t), 0.4));
  c = mix(c, mix(vec3(0.0024, 0.0027, 0.0044), vec3(0.0051, 0.0060, 0.0137), 0.3 + 0.4 * t), uSpace);
  c *= 1.0 + 0.13 * pa.y + 0.08 * pa.x + 0.05 * pa.z;
  float K = 0.0;
  if (uMoon.z > 0.0) {
    vec2 d = P - uMoon.xy; float r = length(d), ang = atan(d.y, d.x);
    float rr = uMoon.z + 0.3 * sin(ang * 5.0 + 1.3) + 0.2 * sin(ang * 13.0 + 0.4);
    float disc = clamp(rr - r + 0.5, 0.0, 1.0), o = max(r - rr, 0.0);
    float hal = 0.2 * exp(-o / 60.0) + 0.16 * exp(-o / 13.0);
    c += coolRamp(hal * (1.0 + 0.7 * pa.y + 0.35 * pa.x)) * (1.0 - disc);
    c = mix(c, mix(vec3(0.52, 0.6, 0.8), vec3(0.6867, 0.7605, 0.9131), smoothstep(rr, rr * 0.2, r)), disc);
  }
  // pinhole stars: sparse on the night tissue, dense in space
  K += uStarB * starLayer(P, 27.0, uStarD, 1.0, 0.1, 0.9, 3.0, 0.7);
  K += uSpace * uStarB * (starLayer(P, 11.0, 0.22, 2.0, 0.02, 0.35, 5.0, 0.55) + starLayer(P, 37.0, 0.30, 3.0, 0.10, 1.4, 3.0, 0.75));
  for (int k = 0; k < 16; k++) {
    vec4 pn = uPin[k]; if (pn.w <= 0.0) continue;
    vec2 dv = P - pn.xy; float dd = length(dv);
    if (dd > 260.0) continue;
    float tis = 1.0 + 0.5 * pa.y;
    K += pn.w * (4.0 * clamp(pn.z + 0.5 - dd, 0.0, 1.0) + (0.9 * exp(-dd / (1.6 * pn.z)) + 0.22 * exp(-dd / (7.0 * pn.z))) * tis + 0.04 * exp(-dd / 70.0));
    // a star-shaped cut (punched-tin style): two thin slits through the pinhole, tapered, that
    // blaze when the light behind the pinhole flares. uPinX: half-length, amount, half-width, turn
    vec4 px = uPinX[k];
    if (px.y > 0.0 && dd < px.x + 2.0) {
      float ca = cos(px.w), sa = sin(px.w);
      vec2 a = abs(vec2(ca * dv.x + sa * dv.y, -sa * dv.x + ca * dv.y));
      float sx = clamp(px.z * (1.0 - a.x / px.x) - a.y + 0.5, 0.0, 1.0);
      float sy = clamp(px.z * (1.0 - a.y / px.x) - a.x + 0.5, 0.0, 1.0);
      K += pn.w * px.y * 2.2 * max(sx, sy) * tis;
    }
  }
  c += coolRamp(K);
  // satellites: tiny cut-card silhouettes (body, boom, two foil panels) crossing the sky; the
  // panels hold a little cool light and can catch a warm glint (uSatL.x, added to W)
  for (int k = 0; k < 2; k++) {
    vec4 sp = uSat[k]; if (sp.w <= 0.0) continue;
    vec2 d = (P - sp.xy) / sp.w; float ca = cos(sp.z), sa = sin(sp.z);
    vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
    if (abs(q.x) > 40.0 || abs(q.y) > 40.0) continue;
    float body = sdBox(q, vec2(2.4, 3.4)), boom = sdBox(q, vec2(8.0, 0.4));
    float pan = sdBox(vec2(abs(q.x) - 9.6, q.y), vec2(4.2, 2.7));
    float seam = sdBox(vec2(abs(q.x) - 9.6, q.y), vec2(0.28, 2.8));
    float cCard = clamp(0.5 - min(body, boom) * sp.w, 0.0, 1.0);
    float cPan = clamp(0.5 - pan * sp.w, 0.0, 1.0) * (1.0 - 0.8 * clamp(0.5 - seam * sp.w, 0.0, 1.0));
    vec3 card = vec3(0.0087, 0.0116, 0.0296) * (1.0 + 0.1 * pa.y);
    c = mix(c, card, max(cCard, cPan));
    c += coolRamp(uSatL[k].y * cPan * (0.85 + 0.3 * pa.y));
    Wsky += uSatL[k].x * (cPan * (0.9 + 0.25 * pa.y) + 0.22 * exp(-length(q) / 7.0) * (1.0 - max(cCard, cPan)));
  }
  return c;
}
void haze(vec2 P, float z0, float z1, float jit, inout vec3 col, inout float W, inout float hC) {
  float len = z1 - z0;
  if (len <= 0.5) return;
  float tr = exp(-len * uHazeA);
  col = col * tr + uHazeCol * (1.0 - tr); W *= tr; hC *= tr;
  float n = clamp(floor(len / 55.0) + 1.0, 1.0, 8.0), dz = len / n;
  for (int k = 0; k < 8; k++) {
    if (float(k) >= n) break;
    float z = z0 + (float(k) + jit) * dz;
    if (z < 0.0 && uWallIdx >= 0) continue;
    vec3 s = vec3(toWorld(P, z), z);
    if (uLI > 0.0) {
      vec3 d = uLP - s;
      float dd = dot(d, d), e = uLI / (dd + uLA0 * uLA0) * exp(-sqrt(dd) / uLF) * uHazeW * dz;
      if (e > 1.5e-4) e *= visLh(s);
      W += e;
    }
    for (int q = 0; q < 2; q++) {
      if (uFI[q].x <= 0.0) continue;
      vec3 d2 = uFP[q].xyz - s; float d2d = dot(d2, d2);
      W += uFI[q].x / (d2d + uFI[q].y * uFI[q].y) * exp(-sqrt(d2d) / uFI[q].z) * uHazeW * uFI[q].w * dz;
    }
    hC += uHazeM * dz;
  }
}
void main() {
  vec2 P = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uK;
  float jit = h12(P * 1.37 + 0.71);
  float Wsky = 0.0;
  vec3 col = sky(toWorld(P, uSkyZ) + uSkyOff, Wsky);
  float W = Wsky, hC = 0.0, defo = 0.0, zPrev = uZ0, front = 0.0, frontZ = -1.0e4;
  float zCam = uCamZc - uCamTz - uCamNear;
  for (int i = 0; i < 16; i++) {
    if (i >= uN) break;
    float zi = LZ(i);
    if (zi > zCam) break;
    haze(P, zPrev, zi, jit, col, W, hC);
    zPrev = zi;
    vec2 Q = toWorld(P, zi);
    vec4 m = M(i, Q, uLod0);
    bool tmd = uXg[i].y > 0.0;
    float card = m.r, vel = tmd ? 0.0 : m.g, em = m.b;
    if (card + vel + em < 0.003) continue;
    vec4 pa = paper(xfP(i, Q), float(i) * 1.618 + 0.3);
    vec3 p = vec3(Q, zi);
    vec3 dL = uLP - p; float dist = length(dL); vec3 l = dL / dist;
    float irr = uLI > 0.0 ? uLI / (dist * dist + uLA0 * uLA0) * exp(-dist / uLF) : 0.0;
    float vis = -1.0;
    if (vel > 0.003) {
      // vellum / tissue: its own cool tone, and warm light passing through it (with fibre)
      float fib = max(1.0 + (0.36 * pa.y + 0.22 * pa.x + 0.14 * pa.z) * uXc[i].w, 0.2);
      float cv = clamp(vel * 3.0, 0.0, 1.0) * (1.0 - card);
      float wv = uVW[i].x;
      if (uVW[i].y > 0.0) {
        if (irr > 0.0) { vis = visL(p, i); wv += uVW[i].y * irr * vis; }
        for (int k = 0; k < 2; k++) {
          if (uFI[k].x <= 0.0) continue;
          vec3 d2 = uFP[k].xyz - p; float dd = length(d2);
          wv += uVW[i].y * uFI[k].x / (dd * dd + uFI[k].y * uFI[k].y) * exp(-dd / uFI[k].z);
        }
      }
      col = mix(col, uVel[i] * vel * fib, cv);
      W = mix(W, wv * vel * fib + 0.3 * W, cv);
      hC *= 1.0 - cv;
    }
    if (card > 0.003) {
      float ao = aoFront(i, Q);
      vec3 base = uCol[i] * (1.0 - 0.55 * ao) * (1.0 + 0.03 * pa.y + 0.02 * pa.x);
      vec3 n = uLB[i].z > 0.5 ? normalize(vec3(0.0, uUpN.x, uUpN.y)) : vec3(0.0, 0.0, 1.0);
      float warm = 0.0, cool = 0.0, cf = dot(n, l);
      if (irr > 0.0 && cf > 0.0) {
        if (vis < 0.0) vis = visL(p, i);
        warm += irr * cf * vis * uLA[i].y * (1.0 + 0.13 * pa.x + 0.09 * pa.y + 0.06 * pa.z);
      }
      for (int k = 0; k < 2; k++) {
        if (uFI[k].x <= 0.0) continue;
        vec3 d2 = uFP[k].xyz - p; float dd = length(d2);
        float c2 = dot(n, d2 / dd);
        if (c2 > 0.0) warm += uFI[k].x / (dd * dd + uFI[k].y * uFI[k].y) * exp(-dd / uFI[k].z) * c2 * uLA[i].y * (1.0 + 0.1 * pa.x + 0.08 * pa.y);
      }
      vec2 g = gradC(i, Q); float gl0 = length(g), e = clamp(gl0 * 2.0, 0.0, 1.0);
      if (e > 0.02) {
        vec2 en = -g / gl0;
        if (irr > 0.0) {
          float f = dot(en, l.xy / max(length(l.xy), 1e-3)) * length(l.xy);
          if (vis < 0.0) vis = visL(p, i);
          float dk = e * clamp(-f * 2.5, 0.0, 1.0);
          warm *= 1.0 - 0.6 * dk;
          warm += min(e * max(f, 0.0) * irr * vis * uRim * uLB[i].y, 2.2) * (0.8 + 0.35 * pa.x + 0.25 * pa.y);
          base *= 1.0 - 0.45 * dk;
        }
        for (int k = 0; k < 2; k++) {
          if (uFI[k].x <= 0.0) continue;
          vec3 d2 = uFP[k].xyz - p; float dd = length(d2);
          float i2 = uFI[k].x / (dd * dd + uFI[k].y * uFI[k].y) * exp(-dd / uFI[k].z);
          float f2 = dot(en, d2.xy / max(length(d2.xy), 1e-3)) * length(d2.xy) / dd;
          warm += min(e * max(f2, 0.0) * i2 * uRim * uLB[i].y, 2.2) * (0.8 + 0.35 * pa.x);
        }
        if (uMI > 0.0) {
          float fm = dot(en, -normalize(uMD.xy));
          if (fm > 0.0) cool += e * fm * uMI * uMoonRim * visMoon(p + vec3(en * 2.0, 0.0), i);
        }
        cool += e * max(-en.y, 0.0) * uAmbRim * (0.7 + 0.3 * pa.y);
      }
      if (irr > 0.0 && zi > uLP.z && uLA[i].z > 0.0) {
        if (vis < 0.0) vis = visL(p, i);
        vec2 dl = normalize(uLP.xy - Q + 1e-3);
        float thick = 0.0;
        for (int k = 1; k <= 12; k++) thick += M(i, Q + dl * ((float(k) * 2.2 - 1.0) * uXs[i]), 0.6).r * 2.2;
        float tr = exp(-thick / 6.0) + 0.14 * exp(-thick / 15.0);
        warm += min(irr * ((zi - uLP.z) / dist) * vis * uLA[i].z * tr, 1.6) * (1.0 + 0.4 * pa.y + 0.2 * pa.x);
      }
      if (uLB[i].z > 0.5 && uMI > 0.0) {
        float cm = max(dot(n, -uMD), 0.0);
        if (cm > 0.0) cool += cm * uMI * visMoon(p, i) * (1.0 + 0.25 * pa.y);
      }
      col = mix(col, base + coolRamp(cool), card);
      W = mix(W, warm, card);
      hC *= 1.0 - card;
      defo = mix(defo, uLA[i].w, card);
      if (zi > uLP.z) front += (1.0 - front) * card;
      if (card > 0.5) frontZ = zi;
    }
    if (em > 0.003) {
      // warm pinholes (ew > 0) add to W; cool ones (the layer's em colour) add to the base.
      // On a timed layer, a pinhole with a time code is dark until the clock passes the code,
      // then warm; a pinhole without a code keeps the cool colour.
      float warmOn = step(0.001, uVW[i].z), coolOn = 1.0 - warmOn;
      if (tmd) {
        ivec2 ts = ivec2(textureSize(uM, 0).xy);
        ivec2 tc = clamp(ivec2(floor((xfP(i, Q) - uWO) * uMS)), ivec2(0), ts - 1);
        float code = texelFetch(uM, ivec3(tc, i), 0).g;
        if (code > 0.0) {
          if (uXc[i].y > 0.0) {
            float g8 = code * 255.0;
            if (g8 >= 127.5) {
              // a chase code: a pulse sits where the chase clock is, and travels as it advances
              float cc = (g8 - 128.0) / 127.0, dd = fract(uXc[i].x - cc + 0.5) - 0.5;
              warmOn *= exp(-dd * dd / (uXc[i].y * uXc[i].y)) * uXc[i].z;
            } else { float cs = g8 / 127.0; warmOn *= smoothstep(cs, cs + uXg[i].y, uXg[i].x); }
          } else warmOn *= smoothstep(code, code + uXg[i].y, uXg[i].x);
          coolOn = 0.0;
        }
        else { warmOn = 0.0; coolOn = 1.0; }
      }
      W += uVW[i].z * em * warmOn * max(1.0 + uVW[i].w * pa.y, 0.2);
      col += uEm[i] * em * coolOn;
    }
  }
  haze(P, zPrev, min(uZCam, zCam), jit, col, W, hC);
  col += coolRamp(hC);
  oCol = vec4(col, W);
  oAux = vec4(front, frontZ, defo, 1.0);
}`;

const BLUR_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes, uDir; uniform float uSigma;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes, px = uDir / vec2(textureSize(uSrc, 0));
  vec4 s = texture(uSrc, uv); float wsum = 1.0;
  for (int i = 1; i <= 36; i++) {
    float x = float(i); if (x > uSigma * 2.6) break;
    float w = exp(-0.5 * x * x / (uSigma * uSigma));
    s += w * (texture(uSrc, uv + px * x) + texture(uSrc, uv - px * x)); wsum += 2.0 * w;
  }
  o = s / wsum;
}`;
// 12's bright pass: warm scalar above 2.2
const BRIGHT_FS = `#version 300 es
precision highp float;
uniform sampler2D uSrc; uniform vec2 uRes; uniform float uTh;
out vec4 o;
void main() { float w = texture(uSrc, gl_FragCoord.xy / uRes).a; o = vec4(max(w - uTh, 0.0), 0.0, 0.0, 1.0); }`;
// 12's photograph: base * (1 - 0.55 W) + ramp(W), vignette, grain; plus soft focus per layer
const FINAL_FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uHdr, uSoft, uB1, uB2, uAux;
uniform vec2 uRes; uniform float uK, uBloom, uGrain, uVig, uExpo, uFade, uWarmK;
out vec4 o;
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 lin3(float r, float g, float b) { vec3 c = vec3(r, g, b) / 255.0; return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 srgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
vec3 ramp(float w) {
  vec3 c1 = lin3(138.0, 58.0, 36.0), c2 = lin3(196.0, 96.0, 63.0), c3 = lin3(217.0, 119.0, 87.0);
  vec3 c4 = lin3(240.0, 160.0, 112.0), c5 = lin3(255.0, 217.0, 184.0), c6 = lin3(255.0, 243.0, 230.0);
  w = max(w, 0.0);
  if (w < 0.25) return c1 * (w / 0.25);
  if (w < 0.6) return mix(c1, c2, (w - 0.25) / 0.35);
  if (w < 1.0) return mix(c2, c3, (w - 0.6) / 0.4);
  if (w < 1.8) return mix(c3, c4, (w - 1.0) / 0.8);
  if (w < 3.0) return mix(c4, c5, (w - 1.8) / 1.2);
  if (w < 5.0) return mix(c5, c6, (w - 3.0) / 2.0);
  return c6;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 q = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uK;
  vec4 sh = texture(uHdr, uv), so = texture(uSoft, uv);
  float w = clamp(texture(uAux, uv).b * 1.6, 0.0, 1.0);
  vec4 c = mix(sh, so, w);
  float Wt = (c.a * uWarmK + uBloom * (0.35 * texture(uB1, uv).r + 0.22 * texture(uB2, uv).r)) * uExpo;
  vec3 col = c.rgb * uExpo * (1.0 - 0.55 * clamp(Wt, 0.0, 1.0)) + ramp(Wt);
  vec2 v = (uv - 0.5) * vec2(1.0, 0.8);
  col *= 1.0 - uVig * dot(v, v);
  vec3 s = srgb(col);
  float g = (h12(q * 1.13 + 7.7) + h12(q * 0.91 + 3.1) + h12(q * 1.37 + 1.9)) / 3.0 - 0.5;
  s += g * uGrain * (0.5 + 0.5 * s);
  o = vec4(clamp(s * uFade, 0.0, 1.0), 1.0);
}`;
// dust motes (from the lab): soft cool points, hidden behind the frontmost card
const DUST_VS = `#version 300 es
layout(location = 0) in vec4 aD;
layout(location = 1) in float aZ;
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
uniform sampler2D uAux; uniform vec3 uDustCol; uniform float uDustW;
in float vI; in float vZ;
out vec4 o;
void main() {
  vec2 d = (gl_PointCoord - 0.5) * 3.0;
  float a = exp(-dot(d, d) * 1.6);
  if (texelFetch(uAux, ivec2(gl_FragCoord.xy), 0).g > vZ) discard;
  o = vec4(uDustCol * vI * a, uDustW * vI * a);
}`;

// ================================================================ ENGINE
// scene: { world: {x0, y0, w, h}, layers: [...], light, fills, moon, sky, hazeW, params, cam, maskScale }
// layer: { name, z, col, alb, kind, thin, def, ao, cast, rimk, vel (cool rgb), em (cool rgb),
//          vw (warm vellum self-glow), vl (warm vellum lit gain), ew (warm pinhole gain), ef (pinhole
//          fibre), timed (fade width in clock units; the G channel holds codes), draw(m, rnd, pose),
//          key(pose) for pose-driven redraws, seed, lpx (opt-in, R13: paper edges and thin-paper
//          transmission measured in the layer's own px, for layers scaled far from 1: S35's levels),
//          xs (opt-in, R14: that stencil in world px, per frame) }
export const LAYER_DEFAULTS = { alb: 0.7, kind: 0, thin: 0, def: 0, ao: 0.45, cast: 0, rimk: 1, vel: [0, 0, 0], em: [0, 0, 0], vw: 0, vl: 0, ew: 0, ef: 0.3, timed: 0, bound: 0, op: 1 };
export const PARAM_DEFAULTS = { rim: 1.3, mrim: 0.45, hm: 0, ha: 0.00012, arim: 0.12, bth: 2.2, bloom: 1.0, grain: 0.06, vig: 0.6, hw: 6.0e-5, warmK: 1.0 };

export function createPaper(CANVAS, scene, opts = {}) {
  const LOGFN = opts.log || (() => {});
  const K = opts.k || 1;
  const RW = Math.round(W * K), RH = Math.round(H * K);
  const BANDS = opts.bands || 3;
  const TIMES = {};
  const WO = scene.world;
  const MS = scene.maskScale || 1;
  const TW = Math.round(WO.w * MS), TH = Math.round(WO.h * MS);
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
  const byName = {}; layers.forEach((l, i) => { if (l.name) byName[l.name] = i; });
  const t0 = performance.now();
  const arr = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, arr);
  const levels = Math.floor(Math.log2(Math.max(TW, TH))) + 1;
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, TW, TH, N);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  const scratch = document.createElement('canvas');
  // paint a world rect (x, y, w, h) of layer i into its texture slice
  function paintRect(ops, rx, ry, rw, rh, i) {
    const tx = Math.floor((rx - WO.x0) * MS), ty = Math.floor((ry - WO.y0) * MS);
    const tw = Math.min(TW - tx, Math.ceil(rw * MS) + 1), th = Math.min(TH - ty, Math.ceil(rh * MS) + 1);
    if (tw <= 0 || th <= 0) return;
    if (scratch.width !== tw || scratch.height !== th) { scratch.width = tw; scratch.height = th; }
    const x = scratch.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#000'; x.fillRect(0, 0, tw, th);
    x.globalCompositeOperation = 'lighter';
    x.setTransform(MS, 0, 0, MS, -tx - WO.x0 * MS, -ty - WO.y0 * MS);
    paintOps(x, ops, MS);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, arr);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, tx, ty, i, tw, th, 1, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
  }
  function recordLayer(i, pose) {
    const ly = layers[i], ops = [];
    let mk;
    if (ly.key) { let n = 0; const base = (ly.seed || 0) * 131 + 9001 + i * 7919; mk = recorder(ops, (pts, amp) => roughStable(pts, base + (n++) * 7907, amp)); }
    else { const rnd = mulberry32(1000 + i * 7919 + (ly.seed || 0)); mk = recorder(ops, (pts, amp) => rough(pts, rnd, amp)); }
    ly.draw(mk, mulberry32(77 + i + (ly.seed || 0) * 31), pose || {});
    return ops;
  }
  const clipRect = (b) => {
    const x0 = Math.max(WO.x0, Math.floor(b[0])), y0 = Math.max(WO.y0, Math.floor(b[1]));
    const x1 = Math.min(WO.x0 + WO.w, Math.ceil(b[2])), y1 = Math.min(WO.y0 + WO.h, Math.ceil(b[3]));
    return x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
  };
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

  const mainP = compile(MAIN_FS, 'main'), blurP = compile(BLUR_FS, 'blur'), brightP = compile(BRIGHT_FS, 'bright'), finP = compile(FINAL_FS, 'final');
  const dustP = compile(DUST_FS, 'dust', DUST_VS);
  const hdr = target2(RW, RH);
  const sA = target(RW, RH), sB = target(RW, RH);
  const h2 = [Math.round(RW / 2), Math.round(RH / 2)], h4 = [Math.round(RW / 4), Math.round(RH / 4)];
  const b0 = target(...h2), bA = target(...h2), bB = target(...h2);
  const q0 = target(...h4), qA = target(...h4), qB = target(...h4);
  const dustBuf = gl.createBuffer();

  function drawDust(motes, cam, warm) {
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
    setU(dustP, { uRes: [RW, RH], uK: K, uDustCol: warm ? [0, 0, 0] : lin('#9FB3D9'), uDustW: warm ? 1.0 : 0.0 });
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, n);
    gl.disable(gl.BLEND);
    gl.disableVertexAttribArray(1);
  }

  const mo0 = scene.moon || { dir: [0.3, 0.5, 1], I: 0, disc: [0, 0, 0] };
  const sky0 = scene.sky || { top: '#07080E', hor: '#0E1120', horY: 1080 };
  const wallIdx = byName.wall !== undefined ? byName.wall : -1;

  // ---- per frame
  // st: { pose, cam, light: {x, y, z, r, I, a, f}, fills: [{x, y, z, I, a, f, h}], layers: {name: {...}},
  //       sky: {space, starD, starB, pins: [[x, y, r, I]], moon: [x, y, r], top, hor, horY},
  //       moon: {dir, I}, dust: [{x, y, z, size, I}], dustWarm, post: {bloom, grain, vig, expo, fade, warmK} }
  function frame(st = {}) {
    const ta = performance.now();
    const nUp = st.pose ? updateMasks(st.pose) : 0;
    const tb = performance.now();
    const li = Object.assign({ x: 960, y: 540, z: 0, r: 4, I: 0, a: 200, f: 600 }, scene.light || {}, st.light || {});
    const cam = Object.assign({ Zc: 2400, zref: 600, c: [W / 2, H / 2], t: [0, 0], tz: 0, pan: [0, 0], near: 60 }, scene.cam || {}, st.cam || {});
    const fills = (st.fills || scene.fills || []).slice(0, 2);
    const FP = new Float32Array(8), FI = new Float32Array(8);
    fills.forEach((f, k) => { FP.set([f.x, f.y, f.z, 0], k * 4); FI.set([f.I, f.a || 150, f.f || 600, f.h === undefined ? 1 : f.h], k * 4); });
    const LA = new Float32Array(64), LB = new Float32Array(64), COL = new Float32Array(48), VEL = new Float32Array(48), EM = new Float32Array(48);
    const XF = new Float32Array(64), XT = new Float32Array(64), XG = new Float32Array(64), XC = new Float32Array(64), VW = new Float32Array(64), XS = new Float32Array(16);
    const ov = st.layers || {};
    layers.forEach((l0, i) => {
      const l = ov[l0.name] ? Object.assign({}, l0, ov[l0.name]) : l0;
      LA.set([l.z, l.alb, l.thin, l.def], i * 4);
      LB.set([l.ao, l.rimk, l.kind, l.cast], i * 4);
      COL.set(typeof l.col === 'string' ? lin(l.col) : l.col, i * 3);
      VEL.set(l.vel, i * 3); EM.set(l.em, i * 3);
      // layer transform: world = piv + (dx, dy) + R(rot) S(sx, sy) (local - piv)
      const s = l.s === undefined ? 1 : l.s, sx = s * (l.sx === undefined ? 1 : l.sx), sy = s * (l.sy === undefined ? 1 : l.sy);
      const rot = l.rot || 0, piv = l.piv || [0, 0], co = Math.cos(rot), si = Math.sin(rot);
      XF.set([co / sx, si / sx, -si / sy, co / sy], i * 4);
      XT.set([l.dx || 0, l.dy || 0, piv[0], piv[1]], i * 4);
      XS[i] = l.xs !== undefined ? l.xs : l.lpx ? Math.min(Math.abs(sx), Math.abs(sy)) : 1;   // (opt-in) the edge stencil: explicit, the layer's own px, or 1
      XG.set([l.t === undefined ? 1 : l.t, l.timed || 0, l.bound ? 1 : 0, l.op === undefined ? 1 : l.op], i * 4);
      XC.set([l.cc || 0, l.cw || 0, l.cg === undefined ? 1 : l.cg, l.vf === undefined ? 1 : l.vf], i * 4);
      VW.set([l.vw, l.vl, l.ew, l.ef], i * 4);
    });
    const sk = Object.assign({ space: 0, starD: 0.15, starB: 1, pins: [], moon: null }, sky0, st.sky || {});
    // pins: [x, y, r, I] plus optional star cut [halfLen, amount, halfWidth, turn]; sats: {x, y, rot, s, glint, cool}
    const PIN = new Float32Array(64), PINX = new Float32Array(64);
    (sk.pins || []).slice(0, 16).forEach((p, k) => { PIN.set(p.slice(0, 4), k * 4); if (p.length > 4) PINX.set(p.slice(4, 8), k * 4); });
    const SAT = new Float32Array(8), SATL = new Float32Array(8);
    (sk.sats || []).slice(0, 2).forEach((q, k) => { SAT.set([q.x, q.y, q.rot || 0, q.s || 1], k * 4); SATL.set([q.glint || 0, q.cool === undefined ? 0.4 : q.cool, 0, 0], k * 4); });
    const mo = Object.assign({}, mo0, st.moon || {});
    const U = {
      uK: K, uLod0: Math.max(0, Math.log2(1 / K)), uMS: MS, uWO: [WO.x0, WO.y0], uWS: [WO.w, WO.h], uN: N,
      uLA: LA, uLB: LB, uCol: COL, uVel: VEL, uEm: EM, uXf: XF, uXt: XT, uXg: XG, uXc: XC, uVW: VW, uXs: XS,
      uLP: [li.x, li.y, li.z], uLR: li.r, uLI: li.I, uLA0: li.a, uLF: li.f, uRim: P0.rim,
      uFP: FP, uFI: FI,
      uMD: mo.dir, uMI: mo.I, uMoonRim: P0.mrim, uMoonZ0: wallIdx >= 0 ? -0.5 : -1e5, uWallIdx: wallIdx,
      uHazeW: st.hazeW !== undefined ? st.hazeW : (scene.hazeW || P0.hw), uHazeM: st.hazeM !== undefined ? st.hazeM : P0.hm, uHazeA: st.hazeA !== undefined ? st.hazeA : P0.ha, uHazeCol: lin(scene.hazeCol || '#2A3150'),
      uZ0: layers[0].z - (scene.hazeBack || 240), uZCam: layers[N - 1].z + (scene.hazeFront || 160),
      uSkyTop: lin(sk.top), uSkyHor: lin(sk.hor), uHorY: sk.horY, uSkyOn: scene.sky ? 1 : 0, uSkyZ: scene.skyZ || -3000,
      uStarD: sk.starD, uStarB: sk.starB, uSpace: sk.space, uPin: PIN, uPinX: PINX, uSat: SAT, uSatL: SATL, uSkyOff: sk.off || [0, 0], uMoon: sk.moon || mo.disc || [0, 0, 0],
      uUpN: [-0.93, 0.37], uAmbRim: P0.arim,
      uCamC: cam.c, uPan: cam.pan, uCamT: cam.t, uCamTz: cam.tz, uCamZc: cam.Zc, uCamDref: cam.Zc - cam.zref, uCamNear: cam.near,
    };
    run(mainP, hdr, U, { uM: { arr }, uFib: fib }, BANDS);
    if (st.dust) drawDust(st.dust, cam, st.dustWarm);
    const po = Object.assign({ bloom: P0.bloom, grain: P0.grain, vig: P0.vig, expo: 1, fade: 1, warmK: P0.warmK }, st.post || {});
    run(blurP, sA, { uDir: [1, 0], uSigma: 2.2 * K }, { uSrc: hdr }); run(blurP, sB, { uDir: [0, 1], uSigma: 2.2 * K }, { uSrc: sA });
    run(brightP, b0, { uTh: P0.bth }, { uSrc: hdr });
    run(blurP, bA, { uDir: [1, 0], uSigma: 5 * K }, { uSrc: b0 }); run(blurP, bB, { uDir: [0, 1], uSigma: 5 * K }, { uSrc: bA });
    run(blurP, q0, { uDir: [0, 0], uSigma: 0.1 }, { uSrc: bB });
    run(blurP, qA, { uDir: [1, 0], uSigma: 12 * K }, { uSrc: q0 }); run(blurP, qB, { uDir: [0, 1], uSigma: 12 * K }, { uSrc: qA });
    run(finP, null, { uK: K, uBloom: po.bloom, uGrain: po.grain, uVig: po.vig, uExpo: po.expo, uFade: po.fade, uWarmK: po.warmK },
      { uHdr: hdr, uSoft: sB, uB1: bB, uB2: qB, uAux: hdr.aux });
    if (opts.sync) gpuSync();
    TIMES.masksMs = tb - ta; TIMES.maskLayers = nUp; TIMES.frameMs = performance.now() - ta;
  }
  LOGFN(`paper-kit: ${N} layers, world ${WO.w}x${WO.h} (masks ${TW}x${TH}), render ${RW}x${RH}, masks+fibre ${TIMES.masks.toFixed(0)} ms`);
  return { frame, gpuSync, TIMES, layers, byName, gl };
}

// Render into ctx.canvas at any preview scale: the engine renders natively at ctx.scale.
export function kitSetup(ctx, scene, extra = {}) {
  return createPaper(ctx.canvas, scene, Object.assign({ k: ctx.scale, log: ctx.log }, extra));
}
