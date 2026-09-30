// S11's set: the vector physics environment (a ramp up to a plateau, drawn like a physics diagram)
// and the flick worlds that follow it on the snare. Everything is in 1920x1080 units; the caller
// sets the canvas transform. All worlds share one ground line (FY) under Clawd at FX, so a flick
// reads as the world changing around him, not as a new shot.
import { shape, circle, line, path, desat, mixHex, INK, drawHUD } from './vector.js';
import { clamp, hash } from '../../lib/util.js';

export const B = [460, 830];            // the ramp's foot
export const RAMP = 480;                // its length along the surface
export const FX = 960, FY = 620;        // Clawd's place in the flick worlds (and on the plateau)
export const topOf = (th) => [B[0] + RAMP * Math.cos(th), B[1] - RAMP * Math.sin(th)];

const GREY = { sky: ['#838389', '#909095', '#9e9ea2', '#ababaf', '#b8b8bb'], gTop: '#a6a6aa', gBody: '#76767b',
  rTop: '#bcbcbf', rBody: '#8d8d92', prop: '#9d9da1', propS: '#838388', grid: 'rgba(255,255,255,0.10)' };

function skyBands(g, cols, y1, edges) {
  // flat bands whose edges sag gently, like the ladder's banded dome sky
  g.fillStyle = cols[0]; g.fillRect(0, 0, 1920, 1080);
  for (let i = 1; i < cols.length; i++) {
    const e = edges[i - 1], sag = 26 + 10 * i;
    g.beginPath(); g.moveTo(0, e - sag * 0.2);
    g.quadraticCurveTo(960, e + sag, 1920, e - sag * 0.2);
    g.lineTo(1920, 1080); g.lineTo(0, 1080); g.closePath();
    g.fillStyle = cols[i]; g.fill();
  }
}
function simGrid(g, y1, col, off = 0) {
  g.strokeStyle = col; g.lineWidth = 1.2;
  g.beginPath();
  for (let x = ((80 - off) % 160 + 160) % 160; x < 1920; x += 160) { g.moveTo(x, 0); g.lineTo(x, y1); }
  for (const y of [120, 280, 440]) { g.moveTo(0, y); g.lineTo(1920, y); }
  g.stroke();
}
function flag(g, x, y, col, colS, ph) {
  line(g, x, y, x, y - 118, INK, 3);
  const pts = [];
  for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([x + 70 * u, y - 116 + 4 * Math.sin(u * 5 - ph) * u + 20 * u]); }
  for (let i = 8; i >= 0; i--) { const u = i / 8; pts.push([x + 70 * u, y - 116 + 4 * Math.sin(u * 5 - ph) * u + 40 - 20 * u]); }
  shape(g, pts, col, INK, 2.6);
}

// ---------------------------------------------------------------- the ramp world (grey)
// st: { th (ramp angle, rad), th0 (the angle before the edit, for its ghost), ghost (0..1),
//       edit (0..1 highlight on the new surface), fl, handle, selected,
//       cam (optional { x, y }: the camera panned right by x and risen by y, in px; the sky stays,
//            the far apparatus pans at half speed, the ground and the ramp move with the camera) }
export function drawRamp(g, st) {
  const C = GREY;
  const cx = st.cam ? st.cam.x : 0, cy = st.cam ? st.cam.y : 0;
  const X1 = 1920 + cx;                   // the frame's right edge, in world x
  skyBands(g, C.sky, B[1], [170, 330, 480, 620]);
  simGrid(g, B[1] + cy, C.grid, 0.3 * cx);
  // distant apparatus in the haze: a gantry with a hanging weight, a wheel
  g.save(); g.translate(-0.5 * cx, cy); g.globalAlpha = 0.5;
  shape(g, [[1320, B[1]], [1320, 360], [1760, 360], [1760, B[1]], [1740, B[1]], [1740, 380], [1340, 380], [1340, B[1]]], '#a2a2a6', null);
  line(g, 1600, 380, 1600, 520, '#8e8e93', 2); shape(g, [[1575, 520], [1625, 520], [1632, 580], [1568, 580]], '#9a9a9f', null);
  circle(g, 180, 560, 120, '#a8a8ac', null); circle(g, 180, 560, 18, '#9a9a9e', null);
  g.restore();
  g.save(); g.translate(-cx, cy);
  // ground
  g.fillStyle = C.gBody; g.fillRect(cx - 10, B[1], 1940, 1080 - B[1]);
  g.fillStyle = C.gTop; g.fillRect(cx - 10, B[1], 1940, 18);
  g.strokeStyle = 'rgba(39,39,44,0.28)'; g.lineWidth = 2; g.beginPath();
  for (let x = 60 + 120 * Math.floor((cx - 60) / 120); x < X1; x += 120) { if (x < cx - 10) continue; g.moveTo(x, B[1] + 18); g.lineTo(x, 1080); }
  g.moveTo(cx - 10, B[1] + 110); g.lineTo(X1 + 10, B[1] + 110); g.stroke();
  line(g, cx - 10, B[1], X1 + 10, B[1], INK, 3);
  // props at the foot: a ball and a crate
  circle(g, 178, B[1] - 40, 40, C.prop, INK, 3);
  g.beginPath(); g.arc(178, B[1] - 40, 28, -2.4, -1.2); g.strokeStyle = '#c3c3c6'; g.lineWidth = 5; g.lineCap = 'round'; g.stroke();
  shape(g, [[240, B[1]], [240, B[1] - 76], [316, B[1] - 76], [316, B[1]]], C.propS, INK, 3);
  line(g, 240, B[1] - 76, 316, B[1], INK, 2); line(g, 316, B[1] - 76, 240, B[1], INK, 2);
  // the ramp and the plateau it climbs to (one body, two tones: a lit surface band over the face)
  const T = topOf(st.th);
  const body = [[B[0], B[1]], T, [X1 + 10, T[1]], [X1 + 10, B[1]]];
  shape(g, body, C.rBody, null);
  // the lit band: the surface offset inward, mitred where the ramp meets the plateau
  const band = 20;
  shape(g, [[B[0], B[1]], T, [T[0] + band * Math.tan(st.th / 2), T[1] + band], [B[0] + band / Math.sin(st.th), B[1]]], C.rTop, null);
  g.fillStyle = C.rTop; g.fillRect(T[0], T[1], X1 + 10 - T[0], band);
  g.save(); path(g, body); g.clip();
  g.strokeStyle = 'rgba(39,39,44,0.22)'; g.lineWidth = 2; g.beginPath();
  for (let y = T[1] + band + 70; y < B[1]; y += 70) { g.moveTo(B[0], y); g.lineTo(X1, y); }
  for (let x = 1240; x < X1; x += 240) { g.moveTo(x, T[1] + band); g.lineTo(x, B[1]); }
  g.stroke(); g.restore();
  shape(g, body, null, INK, 3);
  // the edit: the new surface flashes pale, the old one lingers as a dashed ghost
  if (st.edit > 0) line(g, B[0], B[1], T[0], T[1], `rgba(255,255,255,${0.7 * st.edit})`, 6);
  if (st.ghost > 0) {
    const T0 = topOf(st.th0);
    g.save(); g.setLineDash([10, 9]); g.globalAlpha = st.ghost;
    line(g, B[0], B[1], T0[0], T0[1], INK, 2); line(g, T0[0], T0[1], X1, T0[1], INK, 2);
    g.restore();
  }
  // angle annotation: an arc at the foot and a live readout
  g.save();
  g.strokeStyle = 'rgba(39,39,44,0.75)'; g.lineWidth = 2;
  g.beginPath(); g.arc(B[0], B[1], 120, -st.th, 0); g.stroke();
  g.setLineDash([6, 6]); line(g, B[0] + 20, B[1] - 1, B[0] + 150, B[1] - 1, 'rgba(39,39,44,0.5)', 2);
  g.restore();
  g.font = '22px Consolas, "Courier New", monospace';
  g.fillStyle = 'rgba(33,33,38,0.85)';
  const deg = Math.round(st.th * 180 / Math.PI);
  g.fillText(`θ ${deg}°`, B[0] + 136, B[1] - 26);
  flag(g, 1540, T[1], '#e4e4e6', null, st.fl * 0.25);
  // the editor's grip on the world: the selected surface and a square handle at the ramp's top
  if (st.selected > 0) line(g, B[0], B[1], T[0], T[1], `rgba(250,250,248,${(0.7 * st.selected).toFixed(3)})`, 4);
  if (st.handle > 0) {
    g.save(); g.globalAlpha = st.handle;
    const h = 11;
    shape(g, [[T[0] - h, T[1] - h], [T[0] + h, T[1] - h], [T[0] + h, T[1] + h], [T[0] - h, T[1] + h]], '#f4f3ef', INK, 2.5);
    g.restore();
  }
  g.restore();
}

// ---------------------------------------------------------------- the flick worlds
// Each is drawn around Clawd's place (FX, FY) with its own full-colour palette, desaturated by s.
// scroll: how far he has walked (px); the ground moves under him, the far layer slower.
const W6 = [
  // 1: stairs of stone blocks, a flat pale sun
  (g, s, scroll, t) => {
    const P = (h) => desat(h, s);
    skyBands(g, ['#8fa4c2', '#9db2cd', '#abbfd6', '#b9cbdf', '#c6d6e7'].map(P), FY, [150, 300, 430, 530]);
    simGrid(g, FY, 'rgba(255,255,255,0.10)', scroll * 0.3);
    circle(g, 380 - scroll * 0.1, 250, 110, P('#efe4cc'), null);
    const x0 = 1260 - scroll;
    for (let k = 0; k < 6; k++) shape(g, [[x0 + k * 110, FY], [x0 + k * 110, FY - 70 * (k + 1)], [x0 + k * 110 + 110, FY - 70 * (k + 1)], [x0 + k * 110 + 110, FY]], P(k & 1 ? '#8c96a3' : '#98a2ae'), INK, 3);
    ground(g, P('#a9b1ba'), P('#7a838e'), scroll, 120);
  },
  // 2: a seesaw on a fulcrum with a ball
  (g, s, scroll, t) => {
    const P = (h) => desat(h, s);
    skyBands(g, ['#86a9cc', '#95b5d4', '#a5c1dc', '#b5cde3', '#c4d8ea'].map(P), FY, [150, 300, 430, 530]);
    simGrid(g, FY, 'rgba(255,255,255,0.10)', scroll * 0.3);
    const cx = 1420 - scroll * 0.9, tilt = 0.16 * Math.sin(t * 0.09);
    shape(g, [[cx - 70, FY], [cx, FY - 120], [cx + 70, FY]], P('#7f8c99'), INK, 3);
    g.save(); g.translate(cx, FY - 124); g.rotate(tilt);
    shape(g, [[-330, -12], [330, -12], [330, 12], [-330, 12]], P('#b98b58'), INK, 3);
    circle(g, -270, -56, 44, P('#5d8fcc'), INK, 3);
    shape(g, [[210, -12], [210, -96], [294, -96], [294, -12]], P('#c9a46e'), INK, 3);
    g.restore();
    ground(g, P('#9fb883'), P('#6f8a5c'), scroll, 0);
  },
  // 3: a gallery of pendulums under a gantry
  (g, s, scroll, t) => {
    const P = (h) => desat(h, s);
    skyBands(g, ['#7fa7bf', '#8fb3c8', '#a0c0d2', '#b1ccdb', '#c2d8e4'].map(P), FY, [150, 300, 430, 530]);
    const x0 = 180 - scroll * 0.6;
    shape(g, [[x0, 150], [x0 + 1700, 150], [x0 + 1700, 180], [x0, 180]], P('#6f8793'), INK, 3);
    for (let k = 0; k < 7; k++) {
      const px = x0 + 150 + k * 230, a = 0.5 * Math.sin(t * 0.14 - k * 0.55);
      const bx = px + 330 * Math.sin(a), by = 180 + 330 * Math.cos(a);
      line(g, px, 180, bx, by, INK, 2.4);
      circle(g, bx, by, 34, P(k % 2 ? '#3f9fb0' : '#58b3a4'), INK, 3);
    }
    for (const lx of [x0 + 30, x0 + 1670]) shape(g, [[lx - 16, FY], [lx - 16, 150], [lx + 16, 150], [lx + 16, FY]], P('#627a86'), INK, 3);
    ground(g, P('#a3b98c'), P('#72895f'), scroll, 0);
  },
  // 4: zig-zag ramps with rolling balls, a chequered floor
  (g, s, scroll, t) => {
    const P = (h) => desat(h, s);
    skyBands(g, ['#86b0da', '#96bce0', '#a7c8e6', '#b8d3ec', '#c9def2'].map(P), FY, [150, 300, 430, 530]);
    simGrid(g, FY, 'rgba(255,255,255,0.12)', scroll * 0.3);
    const x0 = 1150 - scroll * 0.8;
    for (let k = 0; k < 3; k++) {
      const y = 190 + k * 140, dir = k & 1 ? -1 : 1;
      const a = [x0 + (dir > 0 ? 0 : 560), y], b = [x0 + (dir > 0 ? 560 : 0), y + 90];
      shape(g, [a, b, [b[0], b[1] + 18], [a[0], a[1] + 18]], P('#b77c52'), INK, 3);
      const u = ((t * 0.035 + k * 0.37) % 1);
      const bx = a[0] + (b[0] - a[0]) * u, by = a[1] + (b[1] - a[1]) * u - 26;
      circle(g, bx, by, 24, P(k === 1 ? '#5f93d6' : '#e3b44f'), INK, 3);
    }
    ground(g, P('#cfd7de'), P('#8e9aa6'), scroll, 60, P('#b4c0cb'));
  },
  // 5: a pier over water, floating crates
  (g, s, scroll, t) => {
    const P = (h) => desat(h, s);
    skyBands(g, ['#7eb2e0', '#90bde5', '#a2c9ea', '#b4d4ef', '#c6dff4'].map(P), 560, [140, 280, 400, 490]);
    shape(g, [[-400, 562], [-400, 500], [-10, 530], [300, 470], [700, 520], [1100, 450], [1500, 510], [1930, 460], [2300, 500], [2300, 562]].map(([x, y]) => [x - scroll * 0.15, y]), P('#86b27a'), INK, 2.5);
    g.fillStyle = P('#4f93cf'); g.fillRect(0, 560, 1920, 520);
    for (let k = 0; k < 5; k++) {
      const y = 600 + k * 90;
      g.beginPath();
      for (let x = 0; x <= 1920; x += 20) g.lineTo(x, y + 6 * Math.sin((x + scroll * (0.4 + 0.2 * k)) * 0.02 + t * 0.15 + k));
      g.strokeStyle = P('#8cc1ea'); g.lineWidth = 3; g.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const cx = ((300 + k * 700 - scroll * 0.7) % 2200 + 2200) % 2200 - 140, bob = 6 * Math.sin(t * 0.12 + k * 2);
      shape(g, [[cx, 700 + bob], [cx + 90, 704 + bob], [cx + 90, 780 + bob], [cx, 776 + bob]], P('#c99a62'), INK, 3);
    }
    // the pier he walks on
    g.fillStyle = P('#b1834f'); g.fillRect(0, FY, 1920, 26);
    line(g, 0, FY, 1920, FY, INK, 3); line(g, 0, FY + 26, 1920, FY + 26, INK, 3);
    for (let x = ((-scroll) % 360 + 360) % 360 - 40; x < 1920; x += 360) {
      shape(g, [[x, FY + 26], [x + 30, FY + 26], [x + 30, 1090], [x, 1090]], P('#7d5d3d'), INK, 3);
    }
  },
  // 6: the hill and its tree at dusk (the ladder's rung 2), glimpsed
  (g, s, scroll, t) => {
    const P = (h) => desat(h, s);
    skyBands(g, ['#6f7096', '#8a87aa', '#a69cb8', '#c2b0bf', '#d9c3c1'].map(P), 760, [170, 330, 470, 590]);
    for (const [r, c] of [[150, '#e8d4c7'], [100, '#f0dfcd'], [52, '#fbf3e6']]) circle(g, 1500 - scroll * 0.1, 640, r, P(c), null);
    const hill = [[-10, 1090], [-10, 700]];
    for (let x = 0; x <= 1930; x += 30) hill.push([x, FY + 150 * Math.pow((x - FX) / 900, 2) + 12 * Math.sin((x + scroll) * 0.004)]);
    hill.push([1930, 1090]);
    shape(g, hill, P('#4a5a5c'), INK, 3);
    const tx = 520 - scroll * 0.5, ty = FY + 150 * Math.pow((tx - FX) / 900, 2);
    shape(g, [[tx - 14, ty + 4], [tx - 8, ty - 150], [tx + 10, ty - 150], [tx + 16, ty + 4]], P('#3d3437'), INK, 3);
    const canopy = () => { g.beginPath(); g.ellipse(tx, ty - 240, 230, 130, 0, 0, Math.PI * 2); };
    canopy(); g.fillStyle = P('#3b4a4d'); g.fill();
    // the lit side toward the sun: a crescent, the canopy clipped against itself shifted away
    g.save(); canopy(); g.clip();
    g.beginPath(); g.rect(tx - 400, ty - 500, 800, 600); g.ellipse(tx - 36, ty - 222, 230, 130, 0, 0, Math.PI * 2, true);
    g.fillStyle = P('#708062'); g.fill('evenodd'); g.restore();
    canopy(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  },
];

// ground band shared by the flick worlds: a lit top edge and seams that scroll under him
function ground(g, top, body, scroll, seam, alt) {
  g.fillStyle = body; g.fillRect(0, FY, 1920, 1080 - FY);
  g.fillStyle = top; g.fillRect(0, FY, 1920, 22);
  if (alt) {
    for (let x = ((-scroll) % 120 + 120) % 120 - 120, k = Math.floor(scroll / 120); x < 1920; x += 120, k++) if (k & 1) { g.fillStyle = alt; g.fillRect(x, FY, 60, 22); g.fillRect(x + 60, FY + 22, 60, 1058 - FY); }
  }
  if (seam) { g.strokeStyle = 'rgba(39,39,44,0.35)'; g.lineWidth = 2; g.beginPath(); for (let x = ((-scroll) % seam + seam) % seam; x < 1920; x += seam) { g.moveTo(x, FY + 22); g.lineTo(x, 1080); } g.stroke(); }
  line(g, 0, FY, 1920, FY, INK, 3);
}

export const FLICKS = W6.length;
export function drawFlick(g, k, s, scroll, t) { W6[k](g, s, scroll, t); }
export { drawHUD };
