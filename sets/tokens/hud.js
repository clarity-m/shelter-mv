// The small inside-only HUD (style frame 01: bottom-left STEP / LOSS and a tiny loss curve).
// Drawn on the UI layer in screen space (never moves with the camera).
import { lossAt, groupInt } from './train.js';

const FONT = 'Consolas, "Courier New", monospace';

export function drawHUD(g, api, { step, a = 1, curve = 1 }) {
  if (a <= 0.001) return;
  const k = api.k, H = api.H;
  const hx = 66 * k, hy = H - 96 * k;
  g.save();
  g.font = `${(13 * k).toFixed(2)}px ${FONT}`;
  g.textBaseline = 'alphabetic';
  try { g.letterSpacing = `${(1.6 * k).toFixed(2)}px`; } catch (e) { /* older canvas */ }
  g.fillStyle = `rgba(255,255,255,${0.36 * a})`;
  g.fillText('STEP', hx, hy); g.fillText('LOSS', hx, hy + 22 * k);
  g.fillStyle = `rgba(255,255,255,${0.66 * a})`;
  g.fillText(groupInt(step), hx + 62 * k, hy);
  g.fillText(lossAt(step).toFixed(4), hx + 62 * k, hy + 22 * k);
  // the loss so far, on a linear step axis that rescales as training runs
  if (curve > 0 && step >= 1) {
    g.strokeStyle = `rgba(255,255,255,${0.40 * a * curve})`;
    g.lineWidth = Math.max(1, k); g.beginPath();
    const n = 140;
    for (let i = 0; i <= n; i++) {
      const s = step * i / n;
      const L = lossAt(s);
      const x = hx + (168 + i) * k, y = hy + (19 - (L - 2.0) / 8.8 * 30) * k;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}
