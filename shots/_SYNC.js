// Sync test (not in the film): a metronome over the whole song. Beat squares, a kick ring,
// chop and sung-vocal ticks, stutter-stop flashes, loudness bars, bar.beat and section name.
// Render: node render/render.mjs _SYNC --scale 0.25   then mux with render/assemble.mjs --sync
import { drawClawdCentered } from '../lib/clawd.js';

let g;
export default {
  async setup(ctx) { g = ctx.canvas.getContext('2d'); },
  render(ctx, fr) {
    const { W, H, T } = ctx, f = fr.f, k = W / 1920;
    const sec = T.sectionAt(f);
    const hue = { 'intro-a': 220, 'intro-b': 230, 'hook-1': 20, 'verse-1': 260, 'pre-1a': 280, 'pre-1b': 290,
      'drop-1': 15, breakdown: 200, 'verse-2a': 250, 'verse-2b': 255, 'build-2': 35, 'drop-2': 10,
      'drop-2-vox': 5, held: 190, outro: 210 }[sec.id] ?? 0;
    g.fillStyle = `hsl(${hue} 30% 12%)`; g.fillRect(0, 0, W, H);
    // beat squares: 4 per bar, the current one lit and decaying
    const beatIdx = Math.floor(fr.beat), inBar = ((beatIdx % 4) + 4) % 4;
    const bp = T.pulse('beats', f, 4);
    for (let i = 0; i < 4; i++) {
      const on = i === inBar && fr.beat >= 0;
      g.fillStyle = on ? `rgba(245,240,232,${0.25 + 0.75 * bp})` : 'rgba(245,240,232,0.1)';
      g.fillRect((560 + i * 210) * k, 120 * k, 170 * k, 170 * k);
    }
    // kick ring
    const kp = T.pulse('kicks', f, 3);
    g.strokeStyle = `rgba(217,119,87,${kp})`; g.lineWidth = 18 * k;
    g.beginPath(); g.arc(W / 2, 600 * k, (120 + 90 * kp) * k, 0, Math.PI * 2); g.stroke();
    // snare flash bar
    g.fillStyle = `rgba(160,190,255,${T.pulse('snares', f, 3)})`; g.fillRect(0, H - 40 * k, W, 40 * k);
    // chop ticks (left) and sung onsets (right)
    g.fillStyle = `rgba(255,210,120,${T.pulse('chops', f, 4)})`; g.fillRect(80 * k, 420 * k, 220 * k, 360 * k);
    g.fillStyle = `rgba(190,160,255,${T.pulse('sung', f, 6)})`; g.fillRect(W - 300 * k, 420 * k, 220 * k, 360 * k);
    // stutter-stop: whole frame flashes white
    if (T.inStop(f)) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, 0, W, H); }
    // loudness bars: mix vocals drums bass
    ['mix', 'vocals', 'drums', 'bass', 'kick'].forEach((c, i) => {
      const v = T.env(c, f);
      g.fillStyle = 'rgba(245,240,232,0.8)';
      g.fillRect((700 + i * 110) * k, (1000 - 200 * v) * k, 80 * k, 200 * v * k);
    });
    // Clawd bobs on the beat
    drawClawdCentered(ctx.canvas.getContext('2d'), W / 2, (600 - 20 * bp) * k, 8 * k);
    // text
    g.fillStyle = '#f5f0e8'; g.font = `${Math.round(64 * k)}px Consolas, monospace`; g.textBaseline = 'top';
    const bar = Math.floor(fr.bar), beat = inBar + 1;
    g.fillText(`${Math.floor(fr.t / 60)}:${(fr.t % 60).toFixed(1).padStart(4, '0')}  bar ${bar}.${beat}  f${f}`, 60 * k, 30 * k);
    g.font = `${Math.round(40 * k)}px Consolas, monospace`;
    g.fillText(sec.name, 60 * k, 330 * k);
  },
};
