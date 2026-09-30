// Rung 2, the vector lens (after 10-world-ladder rung 2 and 07-style-ligne-claire): flat fills, two
// tones per surface, one uniform ink line, all in Canvas2D paths in 1920-based units.
// Clawd's vector form is the ladder's (rounded body, arm bar, four rounded legs, slot eyes), made
// poseable: lean, squash, lift, a taller head for looking up, per-leg offsets, raised arms, eye kinds.
import { hex, clamp } from '../../lib/util.js';

export const CLAWD = '#D97757';
export const INK = '#27272c';

// ---------------------------------------------------------------- colour
const toHex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
// s = 0: the colour's own luminance as grey; s = 1: the colour itself
export function desat(h, s) {
  const c = hex(h), y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return toHex(c.map((v) => y + (v - y) * s));
}
export const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };

// ---------------------------------------------------------------- ink helpers
export function path(g, pts, close = true) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (close) g.closePath();
}
export function shape(g, pts, fill, ink = INK, lw = 3) {
  path(g, pts);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (ink) { g.strokeStyle = ink; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
}
export function circle(g, x, y, r, fill, ink = INK, lw = 3) {
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (ink) { g.strokeStyle = ink; g.lineWidth = lw; g.stroke(); }
}
export function line(g, x0, y0, x1, y1, col = INK, lw = 3) {
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.stroke();
}
function rrect(g, x0, y0, x1, y1, r) {
  const w = x1 - x0, h = y1 - y0; r = Math.min(r, w / 2, h / 2);
  g.moveTo(x0 + r, y0); g.arcTo(x1, y0, x1, y1, r); g.arcTo(x1, y1, x0, y1, r);
  g.arcTo(x0, y1, x0, y0, r); g.arcTo(x0, y0, x1, y0, r); g.closePath();
}
// a rounded bar from (xa, ya) to (xb, yb), half-width hw
function bar(g, xa, ya, xb, yb, hw) {
  const dx = xb - xa, dy = yb - ya, L = Math.hypot(dx, dy) || 1e-6, a = Math.atan2(dy, dx);
  g.save(); g.translate(xa, ya); g.rotate(a);
  rrect(g, -hw, -hw, L + hw, hw, hw * 0.96);
  g.restore();
}

// ---------------------------------------------------------------- Clawd
export const POSE = { lean: 0, sy: 1, lift: 0, head: 0, legs: null, arms: [0, 0], eyes: null };
const LEGX = [-4.5, -2.5, 2.5, 4.5];

// x, y: ground centre (screen px); U: px per glyph unit (the glyph is 18 x 10 units)
export function drawClawd(g, x, y, U, pose = {}, { ink = INK, inkPx = 2.6, body = CLAWD, eyeCol = INK } = {}) {
  const p = { ...POSE, ...pose };
  const lift = p.lift, head = p.head;
  const legs = p.legs || [[0, 0], [0, 0], [0, 0], [0, 0]];
  const e = { dx: 0, dy: 0, h: 1, kind: 'open', ...(p.eyes || {}) };
  g.save();
  g.translate(x, y); g.rotate(p.lean); g.scale(U / Math.sqrt(p.sy), U * p.sy);
  const top = -10 - head - lift, bot = -2 - lift;
  const armY = -5 - lift;
  const parts = (gg) => {
    gg.beginPath(); rrect(gg, -6, top, 6, bot, 0.7);
    for (let k = 0; k < 4; k++) bar(gg, LEGX[k], bot - 0.4, LEGX[k] + legs[k][0], -0.5 + legs[k][1], 0.5);
    // arms: from the shoulder joint out to the tip, raised by angle
    for (const s of [-1, 1]) {
      const a = (s < 0 ? p.arms[0] : p.arms[1]) * 1.25;
      const jx = s * 5.4, tx = jx + s * 1.7 * Math.cos(a), ty = armY - 1.7 * Math.sin(a);
      bar(gg, jx, armY, tx, ty, 0.98);
    }
  };
  // ink: every part stroked thick, then every part filled, so only the union's outline remains
  const lw = 2 * inkPx / U;
  g.lineJoin = 'round';
  parts(g); g.strokeStyle = ink; g.lineWidth = lw; g.stroke();
  const grad = g.createLinearGradient(0, top, 0, 0);
  grad.addColorStop(0, '#e07e5e'); grad.addColorStop(1, '#d2704f');
  parts(g); g.fillStyle = body === CLAWD ? grad : body; g.fill();
  // eyes
  g.fillStyle = eyeCol; g.strokeStyle = eyeCol;
  const ey = -7 - head * 0.8 - lift + e.dy;
  for (const s of [-1, 1]) {
    const ex = s * 3.5 + e.dx;
    g.beginPath();
    if (e.kind === 'arch') {
      g.lineWidth = 0.62; g.lineCap = 'round';
      g.moveTo(ex - 0.75, ey + 0.55); g.quadraticCurveTo(ex, ey - 1.1, ex + 0.75, ey + 0.55); g.stroke();
    } else if (e.kind === 'closed') {
      g.lineWidth = 0.5; g.lineCap = 'round';
      g.moveTo(ex - 0.6, ey + 0.3); g.lineTo(ex + 0.6, ey + 0.3); g.stroke();
    } else {
      const hh = (e.kind === 'tall' ? 1.45 : 1.0) * e.h;
      rrect(g, ex - 0.5, ey - hh, ex + 0.5, ey + hh, 0.46); g.fill();
    }
  }
  g.restore();
}

// walk cycle: phase in cycles; legs in two pairs swinging opposite, the body bobbing
export function walkPose(phase, extra = {}) {
  const a = Math.sin(phase * Math.PI * 2), b = Math.cos(phase * Math.PI * 2);
  const sw = 0.9;
  return {
    legs: [[sw * a, -0.55 * Math.max(0, b)], [-sw * a, -0.55 * Math.max(0, -b)], [sw * a, -0.55 * Math.max(0, b)], [-sw * a, -0.55 * Math.max(0, -b)]],
    lift: 0.18 * Math.abs(a),
    eyes: { dx: 0.5 },
    ...extra,
  };
}

// ---------------------------------------------------------------- HUD (inside only)
const FONT = 'Consolas, "Courier New", monospace';
export const groupInt = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// rows: [[label, value], ...]; top-left like style frame 02b; light or dark text.
// R23 (Claire: make the HUD sizes consistent with S10's): S10's metrics at 1080p, caps about 20 px tall,
// rows 32 px apart, the label at x 48 and the value 144 px to its right; bold, so the strokes weigh about
// what S10's pixels do. Dark ink reads like S10's two tones (grey label, near-black value).
export function drawHUD(g, rows, { dark = false, a = 1, x = 48, y = 64 } = {}) {
  g.save();
  g.font = `bold 31px ${FONT}`;
  try { g.letterSpacing = '0.5px'; } catch (e) { /* older canvas */ }
  g.textBaseline = 'alphabetic';
  const c = dark ? '30,30,34' : '255,255,255';
  rows.forEach(([lab, val], i) => {
    g.fillStyle = `rgba(${c},${(dark ? 0.45 : 0.4) * a})`; g.fillText(lab, x, y + 32 * i);
    g.fillStyle = `rgba(${c},${(dark ? 0.78 : 0.72) * a})`; g.fillText(val, x + 144, y + 32 * i);
  });
  g.restore();
}
