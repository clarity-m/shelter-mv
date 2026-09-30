// Copied from sets/early-env/papercursor.js (read only) for S18, where Clawd takes over the tool:
// the same paper cursor and code panel, with colour options so his is cut from his own orange card
// and his panel is lit by his own light. Original notes: the outside world's hand in the early
// environments, an arrow cursor cut from indigo card, and a tiny paper panel holding one line of
// code. Backlit-paper vocabulary from sets/paper-kit and
// sets/paper-lab (read only): the style bible's indigo cards, a hand-cut edge keyed to arclength
// (so it never boils while moving), paper fibre, warm light from 12-paper-fusion's ramp bleeding
// round the edges, and a faint soft drop shadow on the world beneath. Canvas2D, 1920-based units.
import { rng as mulberry32, clamp } from '../../lib/util.js';
// Clawd's own version: his orange card, a warm-brown panel, his light through the letters
export const HIS = { card: '#D97757', panel: '#3B2420', edge: [255, 226, 196], halo: [255, 170, 120] };

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

  // one piece of card: drop shadow, warm light round its edge, the card with fibre, its lit rim.
  // S18 extras: bs scales the blurs with the card's size on screen; lit (0..1) spreads warm light
  // through the card from litAt (heat: how hot that light is); burn (0..1) eats the card from
  // burnAt, leaving a glowing edge.
  function card(g, pts, { lift = 1, glow = 1, fill = PAPER.slate, a = 1, edge = WARM.c4, bs = 1, lit = 0, litAt = [0, 0], heat = 0, burn = 0, burnAt = [0, 0], burnSeed = 0, shadow = 1 }) {
    if (burn >= 1 || a <= 0) return;
    g.save();
    g.globalAlpha = a;
    let hole = null;
    if (burn > 0) {
      const rb = 4 + burn * 128, n = 48;
      hole = [];
      for (let i = 0; i < n; i++) {
        const th = 2 * Math.PI * i / n;
        const r = rb * (1 + 0.13 * Math.sin(3 * th + burnSeed) + 0.08 * Math.sin(7 * th + 2.3 * burnSeed) + 0.05 * Math.sin(13 * th + 4.1 * burnSeed));
        hole.push([burnAt[0] + Math.cos(th) * r, burnAt[1] + Math.sin(th) * r]);
      }
      g.beginPath(); g.rect(-600, -600, 1200, 1200);
      g.moveTo(hole[0][0], hole[0][1]); for (let i = 1; i < n; i++) g.lineTo(hole[i][0], hole[i][1]); g.closePath();
      g.clip('evenodd');
    }
    // faint drop shadow on the world below (closer and sharper as the card comes down)
    g.save();
    g.translate(9 + 9 * lift, 11 + 11 * lift);
    g.filter = `blur(${((3 + 5 * lift) * bs).toFixed(2)}px)`;
    tracePath(g, pts); g.fillStyle = `rgba(6,8,18,${((0.34 - 0.08 * lift) * (1 - 0.55 * lit) * shadow).toFixed(3)})`; g.fill();
    g.restore();
    // warm light spilling round the cut edge (lit from behind); hotter while the card is lit
    const gh = glow * (1 + 1.4 * heat * lit);
    g.save();
    g.shadowColor = rgba(WARM.c4, Math.min(1, 0.85 * gh)); g.shadowBlur = 16 * bs * (1 + 0.9 * heat * lit); g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    tracePath(g, pts); g.fillStyle = fill; g.fill();
    g.shadowColor = rgba(WARM.c5, Math.min(1, 0.6 * gh)); g.shadowBlur = 5 * bs;
    tracePath(g, pts); g.fill();
    g.restore();
    // his light inside the card: it spreads from litAt, white-hot at first, settling to his orange
    if (lit > 0) {
      g.save();
      tracePath(g, pts); g.clip();
      const R = 8 + lit * 150, C = WARM.c3;
      const mixc = (p, q, t) => [0, 1, 2].map((i) => Math.round(p[i] + (q[i] - p[i]) * t));
      const core = mixc(C, WARM.c6, heat), mid = mixc(C, WARM.c5, 0.85 * heat);
      const grd = g.createRadialGradient(litAt[0], litAt[1], 0, litAt[0], litAt[1], R);
      grd.addColorStop(0, rgba(core, 1)); grd.addColorStop(0.4, rgba(mid, 1));
      grd.addColorStop(0.8, rgba(C, 1)); grd.addColorStop(1, rgba(C, 0));
      g.fillStyle = grd; g.fillRect(-200, -200, 400, 400);
      if (lit < 1) {   // the arriving edge of the light, brighter
        const rg = g.createRadialGradient(litAt[0], litAt[1], R * 0.62, litAt[0], litAt[1], R);
        rg.addColorStop(0, rgba(WARM.c5, 0)); rg.addColorStop(0.7, rgba(WARM.c6, 0.55 * (1 - lit))); rg.addColorStop(1, rgba(WARM.c6, 0));
        g.fillStyle = rg; g.fillRect(-200, -200, 400, 400);
      }
      g.restore();
    }
    // the card face: fibre, and a slight falloff toward the far corner (fainter where lit)
    tracePath(g, pts);
    g.save(); g.globalAlpha *= 1 - 0.55 * lit; g.fillStyle = pat(g); g.fill(); g.restore();
    // the cut edge catches the light: a thin warm line, strongest on the upper-left
    g.save();
    tracePath(g, pts); g.clip();
    g.lineWidth = 3.2; g.strokeStyle = rgba(edge, Math.min(1, 0.55 * glow * (1 + heat * lit)));
    tracePath(g, pts); g.stroke();
    // the burning edge
    if (hole) {
      g.beginPath(); g.moveTo(hole[0][0], hole[0][1]); for (let i = 1; i < hole.length; i++) g.lineTo(hole[i][0], hole[i][1]); g.closePath();
      g.shadowColor = rgba(WARM.c4, 1); g.shadowBlur = 10 * bs;
      g.lineWidth = 5; g.strokeStyle = rgba(WARM.c6, 0.95); g.stroke();
      g.lineWidth = 11; g.strokeStyle = rgba(WARM.c4, 0.45); g.stroke();
    }
    g.restore();
    g.restore();
  }

  return {
    // tip at (x, y); s: scale; press: 0..1 (the click: the card dips toward the world);
    // flip: horizontal squash (-1..1) for a card turning over
    draw(g, x, y, { s = 1.45, press = 0, a = 1, glow = 1, rot = -0.05, fill, edge, bs = 1, lit = 0, litAt, heat = 0, burn = 0, burnAt, burnSeed = 0, flip = 1, shadow = 1 } = {}) {
      g.save();
      g.translate(x, y); g.rotate(rot); g.scale(s * (1 - 0.05 * press) * flip, s * (1 - 0.05 * press));
      card(g, cut, { lift: 1 - 0.75 * press, glow, a, fill: fill || PAPER.slate, edge: edge || WARM.c4, bs, lit, litAt: litAt || [28, 78], heat, burn, burnAt: burnAt || [36, 80], burnSeed, shadow });
      g.restore();
    },
    outline: cut,
    // a tiny paper panel: one line of code cut through the card, the warm light showing through
    panel(g, x, y, text, { typed = 1, open = 1, a = 1, flash = 0, caret = true, fill } = {}) {
      if (open <= 0) return;
      g.save();
      g.font = '22px Consolas, "Courier New", monospace';
      const tw = g.measureText(text).width;
      const w = tw + 44, h = 50;
      g.translate(x, y); g.scale(1, open);
      const box = handCut([[0, -h / 2], [w, -h / 2], [w, h / 2], [0, h / 2]], 911, 0.8);
      card(g, box, { lift: 0.8, glow: 0.7 + 0.8 * flash, fill: fill || PAPER.deep, a });
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
