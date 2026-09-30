// STAND-IN for the shelter (the sim world the swarm hosts), used by S32 and the swarm icon.
// SEAM: the real shelter is being built in sets/hill/ (S31). To swap it in, give createSwarm()
// an opts.simSource canvas instead of this drawing: a square canvas (2048 x 2048 works) with the
// shelter view centred, horizon a little below the middle, and the sky continued out to the
// corners (the bubble shows the whole square as a disc; S32's first frame shows its centre
// 80% x 45%, i.e. a 1640 x 920 window of a 2048 canvas, magnified ~1.17x).
// This stand-in: a luminous dusk hill with one tree, a thin ring arching across the sky and a
// few slender lit towers behind the hill, motes of light. Pastel light-rung colours.
import { rng } from '../../lib/util.js';

export function drawShelterStandIn(size = 2048) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const S = size, R = rng(8801);
  const hz = 0.625 * S;                               // horizon
  // sky: lavender to rose to peach at the horizon
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0.0, '#8f86c4'); sky.addColorStop(0.35, '#b9a6d6'); sky.addColorStop(0.68, '#eeb9c9');
  sky.addColorStop(0.9, '#fbd0b3'); sky.addColorStop(1.0, '#ffe2c4');
  g.fillStyle = sky; g.fillRect(0, 0, S, hz + 2);
  // the setting sun, low on the right, and its bloom
  const sx = 0.64 * S, sy = hz - 0.035 * S;
  let rg = g.createRadialGradient(sx, sy, 0, sx, sy, 0.42 * S);
  rg.addColorStop(0, 'rgba(255,236,210,0.95)'); rg.addColorStop(0.08, 'rgba(255,214,178,0.75)');
  rg.addColorStop(0.35, 'rgba(255,190,170,0.25)'); rg.addColorStop(1, 'rgba(255,190,170,0)');
  g.fillStyle = rg; g.fillRect(0, 0, S, S);
  g.fillStyle = '#fff6ea'; g.beginPath(); g.arc(sx, sy, 0.03 * S, 0, Math.PI * 2); g.fill();
  // the ring arching across the sky (thin, luminous, fading at its ends)
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = `rgba(255,${238 - i * 10},${226 - i * 12},${[0.55, 0.22, 0.10][i]})`;
    g.lineWidth = [0.004, 0.012, 0.03][i] * S;
    g.beginPath(); g.ellipse(0.52 * S, hz + 0.02 * S, 0.62 * S, 0.34 * S, -0.06, Math.PI * 1.06, Math.PI * 1.94); g.stroke();
  }
  g.restore();
  // far towers: slender, pale, with lit windows (behind the hill, right of centre)
  for (let i = 0; i < 11; i++) {
    const x = (0.52 + 0.4 * R()) * S, w = (0.003 + 0.004 * R()) * S, h = (0.04 + 0.12 * R() * R()) * S;
    g.fillStyle = `rgba(${170 + 20 * R()},${150 + 20 * R()},${200 + 20 * R()},0.35)`;
    g.fillRect(x - w / 2, hz - h, w, h + 4);
    g.fillStyle = 'rgba(255,236,200,0.8)';
    for (let k = 0; k < h / (0.012 * S); k++) if (R() < 0.45) g.fillRect(x - w * 0.15, hz - h + k * 0.012 * S + 0.004 * S, w * 0.3, 0.003 * S);
  }
  // far ground band
  const fg = g.createLinearGradient(0, hz, 0, S);
  fg.addColorStop(0, '#b7a8cf'); fg.addColorStop(0.25, '#9d95c2'); fg.addColorStop(1, '#6f6fa3');
  g.fillStyle = fg; g.fillRect(0, hz, S, S - hz);
  // the hill: a broad rounded rise, crest left of centre, rim-lit by the sunset
  const hill = (x) => hz + 0.04 * S - 0.12 * S * Math.exp(-Math.pow((x / S - 0.42) / 0.2, 2)) - 0.03 * S * Math.exp(-Math.pow((x / S - 0.78) / 0.16, 2));
  g.beginPath(); g.moveTo(0, S);
  for (let x = 0; x <= S; x += 8) g.lineTo(x, hill(x));
  g.lineTo(S, S); g.closePath();
  const hg = g.createLinearGradient(0, hz - 0.17 * S, 0, S);
  hg.addColorStop(0, '#9fb3b4'); hg.addColorStop(0.2, '#82a0a6'); hg.addColorStop(1, '#4f6a82');
  g.fillStyle = hg; g.fill();
  g.save(); g.clip();
  for (let i = 0; i < 3; i++) {     // warm rim along the crest
    g.strokeStyle = `rgba(255,222,190,${[0.8, 0.3, 0.12][i]})`; g.lineWidth = [0.003, 0.01, 0.028][i] * S;
    g.beginPath(); for (let x = 0; x <= S; x += 8) g.lineTo(x, hill(x) + g.lineWidth * 0.4); g.stroke();
  }
  g.restore();
  // the tree on the crest: trunk and a soft round crown of light-flecked leaves
  const tx = 0.42 * S, ty = hill(tx);
  g.fillStyle = '#4b5b6e';
  g.beginPath(); g.moveTo(tx - 0.006 * S, ty + 4); g.lineTo(tx - 0.0035 * S, ty - 0.08 * S); g.lineTo(tx + 0.0035 * S, ty - 0.08 * S); g.lineTo(tx + 0.007 * S, ty + 4); g.fill();
  const cx = tx, cy = ty - 0.12 * S;
  for (let i = 0; i < 26; i++) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.065 * S;
    g.fillStyle = `rgba(${78 + 20 * R()},${104 + 22 * R()},${116 + 20 * R()},0.9)`;
    g.beginPath(); g.arc(cx + r * Math.cos(a) * 1.15, cy + r * Math.sin(a) * 0.85, (0.028 + 0.02 * R()) * S, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 90; i++) {   // flecks of light in the crown
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 0.085 * S;
    g.fillStyle = `rgba(255,${214 + 30 * R()},${180 + 40 * R()},${0.35 + 0.5 * R()})`;
    g.beginPath(); g.arc(cx + r * Math.cos(a) * 1.15, cy + r * Math.sin(a) * 0.85, (0.0015 + 0.003 * R()) * S, 0, Math.PI * 2); g.fill();
  }
  // motes of light drifting over the scene
  for (let i = 0; i < 140; i++) {
    const x = R() * S, y = (0.15 + 0.7 * R()) * S, r = (0.001 + 0.0035 * R() * R()) * S;
    const mg = g.createRadialGradient(x, y, 0, x, y, r * 5);
    mg.addColorStop(0, 'rgba(255,244,226,0.9)'); mg.addColorStop(0.2, 'rgba(255,226,200,0.35)'); mg.addColorStop(1, 'rgba(255,226,200,0)');
    g.fillStyle = mg; g.beginPath(); g.arc(x, y, r * 5, 0, Math.PI * 2); g.fill();
  }
  return cv;
}
