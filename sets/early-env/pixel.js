// Rung 1, the pixel lens (after style-frames/09-style-pixel and 10-world-ladder rung 1).
// Everything is authored at 480x270 into a palette-index buffer, lit through grey ramps with a 4x4
// Bayer dither only where two ramp steps meet, then blown up nearest-neighbour (4x at 1080p).
// Clawd is the ladder's shaded pixel form: every glyph cell is 2x4 native px (36x20 body), shaded
// automatically from any 22x8 sprite frame in style-frames/05-clawd-sprites/clawd-sprites.js.
import '../../style-frames/05-clawd-sprites/clawd-sprites.js';
import { clamp, hex } from '../../lib/util.js';

export const CS = globalThis.ClawdSprites;
export const NW = 480, NH = 270;

// ---------------------------------------------------------------- palette
// K0..K16: the environment greys (near neutral: a breath of cool in the darks, of warm in the lights)
const GREYS = ['#111114', '#18181c', '#202025', '#29292e', '#333338', '#3e3e43', '#4a4a4f', '#57575c',
  '#66666a', '#767679', '#88888a', '#9b9b9c', '#aeaead', '#c1c0be', '#d4d3d0', '#e6e5e1', '#f4f3ef'];
// Clawd: body, highlight, light, shade, deep shade (the ladder ramp), eyes, then the sprite accents
const CLAWD = ['#D97757', '#F7B793', '#E8906E', '#B55B47', '#8A3F3D', '#1c1413',
  '#F5F0E8', '#F4A2B3', '#8CCBF2', '#FFD483', '#8F8A82'];
export const PAL = [...GREYS, ...CLAWD].map(hex);
export const NK = GREYS.length;
export const CI = { '#': 17, L: 18, l: 19, s: 20, S: 21, o: 22, w: 23, p: 24, b: 25, y: 26, g: 27 };
export const NONE = 255;
export const kk = (v) => clamp(Math.round(v), 0, NK - 1);
export const isClawd = (i) => i >= 17 && i < 28;

// his light on the grey world: warm tint levels (the pixel's grey mixed toward WARM)
const WARM = hex('#f0a47f');
const WLV = [0, 0.1, 0.2, 0.32, 0.46, 0.6, 0.75, 0.9];

// ---------------------------------------------------------------- dither
const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bay = (x, y) => BAY4[((y & 3) << 2) | (x & 3)];
// quantise a continuous level: solid inside a step, ordered dither only near the step edges
export const qd = (v, x, y, sharp = 2) => { const b = Math.floor(v); return b + ((v - b - 0.5) * sharp + 0.5 > bay(x, y) ? 1 : 0); };

// ---------------------------------------------------------------- buffer
export class PBuf {
  // ox (optional): the buffer holds world x from -ox to w - ox - 1 (a world wider than one screen)
  constructor(w = NW, h = NH, ox = 0) { this.w = w; this.h = h; this.ox = ox; this.ib = new Uint8Array(w * h); this.wb = new Uint8Array(w * h); }
  clear(c = NONE) { this.ib.fill(c); this.wb.fill(0); }
  copy(o) { this.ib.set(o.ib); this.wb.set(o.wb); }
  set(x, y, c) {
    x = Math.floor(x) + this.ox; y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.ib[y * this.w + x] = c;
  }
  get(x, y) {
    x = Math.floor(x) + this.ox; y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return NONE;
    return this.ib[y * this.w + x];
  }
  warm(x, y, lv) {
    x = Math.floor(x) + this.ox; y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (lv > this.wb[i]) this.wb[i] = lv;
  }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); }
  // paint every non-NONE pixel of o over this
  overlay(o) {
    const a = this.ib, b = o.ib;
    for (let i = 0; i < a.length; i++) if (b[i] !== NONE) a[i] = b[i];
  }
}

// ---------------------------------------------------------------- 3x5 font (HUD, reward)
const GL = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001010010',
  '8': '111101111101111', '9': '111101111001111', E: '111100110100111', P: '110101110100100',
  I: '111010010010111', S: '011100010001110', O: '010101101101010', D: '110101101101110',
  T: '111010010010010', R: '110101110101101', '+': '000010111010000', ' ': '000000000000000',
  '-': '000000111000000', '.': '000000000000010',
};
export const textW = (s) => s.length * 4 - 1;
export function text(buf, s, x, y, c) {
  for (let k = 0; k < s.length; k++) {
    const g = GL[s[k]] || GL[' '];
    for (let i = 0; i < 15; i++) if (g[i] === '1') buf.set(x + k * 4 + (i % 3), y + ((i / 3) | 0), c);
  }
}

// ---------------------------------------------------------------- Clawd, shaded pixel form
// A 22x8 glyph frame is doubled to 44x16 cells (each cell 1 px wide, 2 px tall on the native grid)
// and shaded like the ladder's PX2 sprite: light from the upper left, dark corner pixels to round
// the silhouette, a shaded lip over each eye, shadow under the arms.
const shadeCache = new Map();
export function shade(grid, mirror = false) {
  const key = grid.join('/') + (mirror ? 'm' : '');
  let S = shadeCache.get(key);
  if (S) return S;
  const G = mirror ? grid.map((r) => r.split('').reverse().join('')) : grid;
  const R = G.length * 2, C = G[0].length * 2;
  const U = [];
  for (let r = 0; r < R; r++) { const row = []; for (let c = 0; c < C; c++) row.push(G[r >> 1][c >> 1]); U.push(row); }
  const body = (r, c) => r >= 0 && c >= 0 && r < R && c < C && (U[r][c] === '#');
  const solid = (r, c) => r >= 0 && c >= 0 && r < R && c < C && (U[r][c] === '#' || U[r][c] === 'o');
  let topRow = R;
  for (let r = 0; r < R && topRow === R; r++) for (let c = 0; c < C; c++) if (body(r, c)) { topRow = r; break; }
  S = [];
  for (let r = 0; r < R; r++) {
    const row = [];
    let runStart = -1;
    for (let c = 0; c < C; c++) {
      const ch = U[r][c];
      if (ch !== '#') { row.push(ch); runStart = -1; continue; }
      const up = solid(r - 1, c), dn = solid(r + 1, c), lf = solid(r, c - 1), rt = solid(r, c + 1);
      const thin = !solid(r, c - 2) || !solid(r, c + 2);   // legs and arm tips: two cells wide
      let s = '#';
      if (!up) { if (runStart < 0) runStart = c; } else runStart = -1;
      if ((!up && !lf) || (!up && !rt)) s = 'S';
      else if (!dn && !rt) s = 'S';
      else if (!dn && !lf) s = thin ? 's' : 'S';
      else if (!up) s = (r === topRow && c - runStart <= 3) ? 'L' : 'l';
      else if (r + 1 < R && U[r + 1][c] === 'o') s = 's';          // lip over an eye
      else if (!rt) s = 's';
      else if (!dn) s = 's';
      else if (!lf) s = body(r - 1, c - 1) ? 's' : (thin ? '#' : 'l');   // under an arm: shadow
      row.push(s);
    }
    S.push(row);
  }
  shadeCache.set(key, S);
  return S;
}

// draw a frame anchored at its ground centre (cx, groundY); dx, dy in glyph cells like the sheet
// flat (0..1): dither the shading away toward the bare glyph (flat body, dark eyes)
export function drawClawdPx(buf, grid, cx, groundY, { mirror = false, dx = 0, dy = 0, eye = CI.o, flat = 0 } = {}) {
  const S = shade(grid, mirror);
  const C = S[0].length;
  const x0 = Math.round(cx - C / 2 + dx * 2), y0 = Math.round(groundY - S.length * 2 - dy * 4);
  let box = [Infinity, Infinity, -Infinity, -Infinity];
  for (let r = 0; r < S.length; r++) for (let c = 0; c < C; c++) {
    const ch = S[r][c];
    if (ch === '.') continue;
    let ci = ch === 'o' ? eye : CI[ch];
    if (ci === undefined) continue;
    const shadeT = ch === 'L' || ch === 'l' || ch === 's' || ch === 'S';
    for (let k = 0; k < 2; k++) {
      const X = x0 + c, Y = y0 + 2 * r + k;
      buf.set(X, Y, shadeT && flat > bay(X, Y) ? CI['#'] : ci);
    }
    box = [Math.min(box[0], x0 + c), Math.min(box[1], y0 + 2 * r), Math.max(box[2], x0 + c), Math.max(box[3], y0 + 2 * r + 1)];
  }
  return box;
}

// ---------------------------------------------------------------- output
// Index buffer -> RGBA through a LUT (warm levels x palette), then a nearest-neighbour blow-up.
// bw (optional): the buffer's width, for a world wider than one screen
export function createBlit(canvas, W, H, bw = NW) {
  const nat = document.createElement('canvas'); nat.width = bw; nat.height = NH;
  const nx = nat.getContext('2d');
  const img = nx.createImageData(bw, NH);
  const u32 = new Uint32Array(img.data.buffer);
  const g = canvas.getContext('2d');
  const pack = (c) => ((255 << 24) | (Math.round(c[2]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[0])) >>> 0;
  const lut = new Uint32Array(8 * 256);
  for (let w = 0; w < 8; w++) for (let i = 0; i < 256; i++) {
    const c = PAL[i] || [255, 0, 255];
    const t = isClawd(i) ? 0 : WLV[w];
    lut[(w << 8) | i] = pack(c.map((v, k) => v + (WARM[k] - v) * t));
  }
  return {
    u32, pack,
    // post(u32) may rewrite pixels (the afterglow) before the upload. view (optional): a zoom,
    // {Z: screen px per native px at 1080p, ax, ay: where buffer point (nx, ny) lands, nx, ny}.
    // sx (optional, no view): the buffer column at the screen's left edge (a scrolled camera)
    put(buf, post, view, sx) {
      const { ib, wb } = buf;
      for (let i = 0; i < ib.length; i++) u32[i] = lut[(wb[i] << 8) | ib[i]];
      if (post) post(u32, buf);
      nx.putImageData(img, 0, 0);
      g.imageSmoothingEnabled = false;
      if (view) {
        const kk = W / 1920, Z = view.Z * kk;
        g.setTransform(Z, 0, 0, Z, (view.ax - view.nx * view.Z) * kk, (view.ay - view.ny * view.Z) * kk);
        g.drawImage(nat, 0, 0);
        g.setTransform(1, 0, 0, 1, 0, 0);
      } else if (sx !== undefined) g.drawImage(nat, sx, 0, NW, NH, 0, 0, W, H);
      else g.drawImage(nat, 0, 0, W, H);
    },
  };
}
