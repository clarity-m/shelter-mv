// The outside world's hand in the early environments: an arrow cursor cut from indigo card, and a
// tiny paper panel holding one line of code. Backlit-paper vocabulary from sets/paper-kit and
// sets/paper-lab (read only): the style bible's indigo cards, a hand-cut edge keyed to arclength
// (so it never boils while moving), paper fibre, warm light from 12-paper-fusion's ramp bleeding
// round the edges, and a faint soft drop shadow on the world beneath. Canvas2D, 1920-based units.
import { rng as mulberry32, clamp } from '../../lib/util.js';

// the style bible's papers and the warm ramp's steps (sets/paper-kit/kit.js)
export const PAPER = { ink: '#10131F', deep: '#171C30', slate: '#212843', dusk: '#2D3656', far: '#3B4668' };
const WARM = { c3: [217, 119, 87], c4: [240, 160, 112], c5: [255, 217, 184], c6: [255, 243, 230] };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ---------------------------------------------------------------- hand-cut edge
function vnoise1(seed) {
  const r = mulberry32(seed), T = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) T[i] = r() * 2 - 1;
  return (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return T[i & 1023] + (T[(i + 1) & 1023] - T[i & 1023]) * u; };
}
function resample(pts, step) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  return out;
}
// wobble along the normal, keyed to arclength (the paper-kit's roughStable, without notches)
function handCut(pts, seed, amp) {
  const d = resample(pts, 1.5), N = d.length, r = mulberry32(seed);
  const n1 = vnoise1((r() * 1e9) | 0), n2 = vnoise1((r() * 1e9) | 0);
  const out = []; let s = 0;
  for (let i = 0; i < N; i++) {
    const p = d[i], a = d[(i - 1 + N) % N], b = d[(i + 1) % N];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    if (i > 0) s += Math.hypot(p[0] - d[i - 1][0], p[1] - d[i - 1][1]);
    const off = amp * (0.62 * n1(s / 16) + 0.38 * n2(s / 4.5));
    out.push([p[0] + ty * off, p[1] - tx * off]);
  }
  return out;
}
function tracePath(g, pts) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

// paper fibre: a small tile of soft streaks, used as a pattern over the card
function fibreTile() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), r = mulberry32(4217);
  x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 260; i++) {
    const px = r() * 128, py = r() * 128, a = r() * Math.PI, l = 3 + r() * 11, light = r() < 0.5;
    x.strokeStyle = light ? `rgba(120,132,180,${0.05 + 0.08 * r()})` : `rgba(4,6,14,${0.06 + 0.1 * r()})`;
    x.lineWidth = 0.6 + r() * 0.8;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
  }
  return c;
}

// the arrow, tip at (0, 0), in px at scale 1 (about 52 x 86)
const ARROW = [[0, 0], [0, 72], [17, 57], [28, 84], [40, 79], [29, 53], [51, 53]];

export function createPaperCursor(seed = 77) {
  const cut = handCut(ARROW, seed, 0.9);
  let pattern = null;
  const pat = (g) => { if (!pattern) pattern = g.createPattern(fibreTile(), 'repeat'); return pattern; };

  // one piece of card: drop shadow, warm light round its edge, the card with fibre, its lit rim
  function card(g, pts, { lift = 1, glow = 1, fill = PAPER.slate, a = 1 }) {
    g.save();
    g.globalAlpha = a;
    // faint drop shadow on the world below (closer and sharper as the card comes down)
    g.save();
    g.translate(9 + 9 * lift, 11 + 11 * lift);
    g.filter = `blur(${(3 + 5 * lift).toFixed(1)}px)`;
    tracePath(g, pts); g.fillStyle = `rgba(6,8,18,${(0.34 - 0.08 * lift).toFixed(3)})`; g.fill();
    g.restore();
    // warm light spilling round the cut edge (lit from behind)
    g.save();
    g.shadowColor = rgba(WARM.c4, 0.85 * glow); g.shadowBlur = 16; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    tracePath(g, pts); g.fillStyle = fill; g.fill();
    g.shadowColor = rgba(WARM.c5, 0.6 * glow); g.shadowBlur = 5;
    tracePath(g, pts); g.fill();
    g.restore();
    // the card face: fibre, and a slight falloff toward the far corner
    tracePath(g, pts);
    g.fillStyle = pat(g); g.fill();
    // the cut edge catches the light: a thin warm line, strongest on the upper-left
    g.save();
    tracePath(g, pts); g.clip();
    g.lineWidth = 3.2; g.strokeStyle = rgba(WARM.c4, 0.55 * glow);
    tracePath(g, pts); g.stroke();
    g.restore();
    g.restore();
  }

  return {
    // tip at (x, y); s: scale; press: 0..1 (the click: the card dips toward the world)
    draw(g, x, y, { s = 1.45, press = 0, a = 1, glow = 1, rot = -0.05 } = {}) {
      g.save();
      g.translate(x, y); g.rotate(rot); g.scale(s * (1 - 0.05 * press), s * (1 - 0.05 * press));
      card(g, cut, { lift: 1 - 0.75 * press, glow, a });
      g.restore();
    },
    // a tiny paper panel: one line of code cut through the card, the warm light showing through
    panel(g, x, y, text, { typed = 1, open = 1, a = 1, flash = 0, caret = true } = {}) {
      if (open <= 0) return;
      g.save();
      g.font = '22px Consolas, "Courier New", monospace';
      const tw = g.measureText(text).width;
      const w = tw + 44, h = 50;
      g.translate(x, y); g.scale(1, open);
      const box = handCut([[0, -h / 2], [w, -h / 2], [w, h / 2], [0, h / 2]], 911, 0.8);
      card(g, box, { lift: 0.8, glow: 0.7 + 0.8 * flash, fill: PAPER.deep, a });
      // the typed characters, cut out: warm light through them
      const n = Math.floor(clamp(typed) * text.length + 1e-6), shown = text.slice(0, n);
      g.textBaseline = 'middle';
      g.shadowColor = rgba(WARM.c4, 0.9); g.shadowBlur = 8 + 10 * flash;
      g.fillStyle = rgba(flash > 0.3 ? WARM.c6 : WARM.c5, a);
      g.fillText(shown, 22, 1);
      if (caret && typed < 1) {
        const cx = 22 + g.measureText(shown).width + 2;
        g.fillRect(cx, -11, 11, 22);
      }
      g.restore();
    },
  };
}
