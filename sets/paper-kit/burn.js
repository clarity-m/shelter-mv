// The landing's lines of light, drawn over a rendered paper frame in 2D (revision 8), after S21's
// device (shots/S21.js drawLines): on the landing frame the inside drawing's lines appear on the
// paper object white-hot with S21's bloom (a 7 px and a 2.2 px blur under the sharp lines); each
// then burns from white to Claude's orange and goes in about 7 frames, staggered by its `burn`.
//
//   const B = createBurn(ctx);                      // owns an offscreen 2D canvas at ctx.W x ctx.H
//   B.draw(g2, lines, k, { flash, width })          // k = frames since the landing; lines are
//                                                   //   [{ pts: [[x, y], ...] (1920 px), burn, I }]
//   returns the number of lines still alive (0 once they have all gone)
import { clamp } from './kit.js';

export const BURN_LEN = 7;
export function createBurn(ctx) {
  const lc = document.createElement('canvas'); lc.width = ctx.W; lc.height = ctx.H;
  const lg = lc.getContext('2d'), s = ctx.W / 1920;
  function draw(g2, lines, k, o = {}) {
    if (k < 0) return 0;
    const flashK = o.flash ?? 1, w0 = o.width ?? 2.2;
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, lc.width, lc.height);
    lg.globalCompositeOperation = 'lighter';
    lg.lineCap = 'round'; lg.lineJoin = 'round';
    const flash = 1 + 0.6 * flashK * Math.exp(-k / 2.5);
    let n = 0;
    for (const e of lines) {
      const b = clamp((k - e.burn) / BURN_LEN, 0, 1);                             // (kit's clamp needs its bounds)
      if (b >= 1) continue;
      const I = (e.I ?? 1) * flashK * flash * (1 - b * b);
      const g = Math.round(244 - 90 * b), bl = Math.round(226 - 150 * b);        // white-hot to orange
      lg.strokeStyle = `rgba(255,${g},${bl},${Math.min(1, 0.85 * I).toFixed(3)})`;
      lg.lineWidth = (w0 * (e.w ?? 1) + 1.2 * b) * s;
      lg.beginPath();
      e.pts.forEach((p, i) => (i ? lg.lineTo(p[0] * s, p[1] * s) : lg.moveTo(p[0] * s, p[1] * s)));
      lg.stroke(); n++;
    }
    if (!n) return 0;
    g2.save();
    g2.globalCompositeOperation = 'lighter';
    g2.filter = `blur(${(7 * s).toFixed(2)}px)`; g2.globalAlpha = 0.9; g2.drawImage(lc, 0, 0);
    g2.filter = `blur(${(2.2 * s).toFixed(2)}px)`; g2.globalAlpha = 0.8; g2.drawImage(lc, 0, 0);
    g2.filter = 'none'; g2.globalAlpha = 1; g2.drawImage(lc, 0, 0);
    g2.restore();
    return n;
  }
  return { draw };
}
