// The inside HUD for rung 3 (style frame 02b): EPISODE / REWARD / STEP, top left, small clean
// monospace. `tick` (0..1) flashes the episode value when an episode resets.
const FONT = 'Consolas, "Cascadia Mono", "Courier New", monospace';

export const fmtInt = (n, w = 6) => { const s = String(Math.max(0, Math.floor(n))).padStart(w, '0'); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };

export function drawHUD(g, k, { episode, reward, step, a = 1, tick = 0, extra, pop = 0, dark = 0 }) {
  if (a <= 0.001) return;
  g.save();
  g.font = `500 ${(15 * k).toFixed(2)}px ${FONT}`;
  g.textBaseline = 'top';
  try { g.letterSpacing = `${(1.5 * k).toFixed(2)}px`; } catch (e) { /* older canvas */ }
  const rows = [['EPISODE', fmtInt(episode)], ['REWARD', (reward >= 0 ? '+' : '') + reward.toFixed(3)], ['STEP', fmtInt(step, 4)]];
  if (extra) rows.push(...extra);
  const x = 64 * k, y = 56 * k;
  const base = (al) => (dark > 0.5 ? `rgba(58,48,54,${al})` : `rgba(245,240,232,${al})`);
  g.fillStyle = base(0.50 * a);
  rows.forEach((r, i) => g.fillText(r[0], x, y + i * 22 * k));
  rows.forEach((r, i) => {
    if (i === 0 && pop > 0.01) return;
    const hot = i === 0 ? tick : 0;
    g.fillStyle = hot > 0.01 ? `rgba(255,${Math.round(236 - 60 * hot)},${Math.round(214 - 110 * hot)},${(0.86 + 0.14 * hot) * a})` : base(0.86 * a);
    g.fillText(r[1], x + 96 * k, y + i * 22 * k);
  });
  // the reset beat: the new episode number pops large, then settles into its row
  if (pop > 0.01) {
    const sc = 1 + 1.6 * pop;
    g.font = `600 ${(15 * sc * k).toFixed(2)}px ${FONT}`;
    g.fillStyle = `rgba(255,${Math.round(236 - 70 * pop)},${Math.round(214 - 120 * pop)},${a})`;
    g.fillText(rows[0][1], x + 96 * k, y - 7 * k * (sc - 1));
  }
  g.restore();
}
