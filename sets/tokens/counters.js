// Odometer counters for S05: every digit rolls, and fast digits are motion-blurred by drawing
// several sub-frame samples (a spinning digit becomes a soft gray blur, a slow one rolls cleanly).
const FONT = 'Consolas, "Courier New", monospace';

// value: the number now; rate: its increase per frame; x,y: baseline start (device px).
export function drawOdometer(g, { value, rate, x, y, size, alpha = 1, sep = ',', minDigits = 1 }) {
  const digits = Math.max(minDigits, Math.floor(Math.log10(Math.max(1, value))) + 1);
  const chars = [];
  for (let p = digits - 1; p >= 0; p--) { chars.push(p); if (p > 0 && p % 3 === 0) chars.push(-1); }
  g.save();
  g.font = `${size.toFixed(2)}px ${FONT}`;
  g.textBaseline = 'alphabetic';
  const adv = size * 0.55, lh = size * 1.05;
  let cx = x;
  for (const p of chars) {
    if (p < 0) {                               // group separator
      g.fillStyle = `rgba(255,255,255,${0.5 * alpha})`;
      g.fillText(sep, cx, y);
      cx += adv * 0.8;
      continue;
    }
    const sp = rate / Math.pow(10, p);           // digit turns per frame
    if (sp > 0.9 || !isFinite(sp)) {             // spinning faster than a digit per frame: a soft drum blur
      const top = y - size * 0.78, h = size * 0.86;
      const gr = g.createLinearGradient(0, top, 0, top + h);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, `rgba(255,255,255,${0.30 * alpha})`);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(cx + adv * 0.14, top, adv * 0.72, h);
      cx += adv;
      continue;
    }
    const n = sp > 0.12 ? 6 : 1;
    g.save();
    g.beginPath(); g.rect(cx - 1, y - size * 0.95, adv + 2, size * 1.2); g.clip();
    for (let j = 0; j < n; j++) {
      const vj = (value + rate * (n > 1 ? j / n - 0.5 : 0)) / Math.pow(10, p);
      const d = Math.floor(vj) % 10, fr = vj - Math.floor(vj);
      const roll = p === 0 || sp > 0.04 ? fr : smooth(0.88, 1, fr);
      const a = alpha / n * (sp > 2 ? 0.75 : 1);
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.fillText(String(d), cx, y - roll * lh);
      g.fillText(String((d + 1) % 10), cx, y + (1 - roll) * lh);
    }
    g.restore();
    cx += adv;
  }
  g.restore();
  return cx;
}

function smooth(a, b, x) { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); }

export function drawLabel(g, text, x, y, size, alpha) {
  g.save();
  g.font = `${size.toFixed(2)}px ${FONT}`;
  try { g.letterSpacing = `${(size * 0.12).toFixed(2)}px`; } catch (e) { /* ok */ }
  g.fillStyle = `rgba(255,255,255,${alpha})`;
  g.fillText(text, x, y);
  g.restore();
}
