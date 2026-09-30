// S21, build 2, bar 65 only (frames 4619-4690): the kick that starts build 2 ignites a fusion reactor
// (outside, backlit paper). Hard cut from S36's ring of light on the kick.
// Revision 8 (Claire: the reactor need not be an exact blueprint, only its core; the rocket's exact
// blueprint is the progression): only the core lands. On the kick the ring and coils that S36's
// Clawds made in light (sets/paper-fusion/landing.js: the plasma ring, its meridians and the twelve
// coils) flash onto the paper reactor, exactly on it, through this shot's own camera; the column,
// cap, base and ports stay plain paper, the humans' build. Over the first beat the lines burn off
// into the ignition as the plasma blooms: the coils first, the plasma ring last, its light going into
// the plasma itself. Then the plasma pulses on the beats and breathes with the voice while the camera
// pushes in and the layers part (the lines follow that zoom while they last). The fusion set renders
// into a private WebGL canvas; the lines are drawn over it in 2D.
import { createFusion } from '../sets/paper-fusion/fusion.js';
import { coreEdges, proj, FOCUS, LD } from '../sets/paper-fusion/landing.js';
import { smoothstep, clamp, hash } from '../lib/util.js';

const KICK = 0;   // local frame of the bar-65 kick (the shot's first frame)

// when each part burns off (frames after the kick): the coils first, the plasma ring last
const BURN = { coil: [2, 8], merid: [6, 4], helix: [7, 6], torus: [9, 9] };   // the field lines just before the ring
const EDGES = coreEdges().map((e, i) => {
  const [t0, span] = BURN[e.kind] || [4, 6];
  return { a: proj(e.a), b: proj(e.b), port: false, ring: e.kind === 'torus' || e.kind === 'helix', dim: e.dim ?? 1,
    burn: t0 + span * hash(i, 71) };
});
const BURN_LEN = 7;    // frames a line takes to burn away

let F, glCanvas, g2, lc, lg;
function drawLines(k, push, scale) {
  // intensity and colour per line: the flash on the kick, then each burns warm and goes
  const z = LD / (LD - push), s = scale;
  const X = (p) => (FOCUS[0] + (p[0] - FOCUS[0]) * z) * s, Y = (p) => (FOCUS[1] + (p[1] - FOCUS[1]) * z) * s;
  lg.setTransform(1, 0, 0, 1, 0, 0);
  lg.globalCompositeOperation = 'source-over';
  lg.clearRect(0, 0, lc.width, lc.height);
  lg.globalCompositeOperation = 'lighter';
  lg.lineCap = 'round';
  const flash = 1 + 0.6 * Math.exp(-k / 2.5);
  let n = 0;
  for (const e of EDGES) {
    const b = clamp((k - e.burn) / BURN_LEN);
    if (b >= 1) continue;
    const I = e.dim * flash * (1 - b * b) * (e.ring ? 1.2 : 1);
    // white-hot, turning to Claude's orange as it burns
    const r = 255, g = Math.round(244 - 90 * b), bl = Math.round(226 - 150 * b);
    lg.strokeStyle = lg.fillStyle = `rgba(${r},${g},${bl},${Math.min(1, 0.85 * I).toFixed(3)})`;
    if (e.port) { lg.beginPath(); lg.arc(X(e.a), Y(e.a), 3.2 * s, 0, 2 * Math.PI); lg.fill(); n++; continue; }
    lg.lineWidth = (2.2 + 1.2 * b) * s;
    lg.beginPath(); lg.moveTo(X(e.a), Y(e.a)); lg.lineTo(X(e.b), Y(e.b)); lg.stroke(); n++;
  }
  return n;
}

export default {
  async setup(ctx) {
    // the set is authored at 1920x1080 and renders privately; the frame is composited in 2D
    glCanvas = document.createElement('canvas'); glCanvas.width = 1920; glCanvas.height = 1080;
    g2 = ctx.canvas.getContext('2d');
    lc = document.createElement('canvas'); lc.width = ctx.W; lc.height = ctx.H;
    lg = lc.getContext('2d');
    F = createFusion(glCanvas, (s) => ctx.log(s));
    ctx.log(`S21: ${EDGES.length} drawing edges, focus ${FOCUS.map((v) => v.toFixed(0)).join(', ')}`);
  },
  render(ctx, fr) {
    const T = ctx.T, k = fr.fl - KICK, s = ctx.W / 1920;
    // After the ignition flash the plasma stays alive: a pulse on every beat, a slow
    // two-bar breath, and a little of the voice; the whole thing runs a bit brighter.
    let ign = 0;
    if (k >= 0) {
      const on = smoothstep(6, 24, k);
      const beat = T.pulse('beats', fr.f, 5);
      const breath = Math.sin(2 * Math.PI * k / 144);
      const voice = T.envSmooth('vocals', fr.f, 4) - 0.5;
      ign = (1 + 0.55 * Math.exp(-k / 5)) * (1.1 + on * (0.3 * beat + 0.08 * breath + 0.1 * voice));
    }
    const reach = k < 0 ? 0.3 : 0.35 + 7.5 * (1 - Math.exp(-k / 11));
    const u = fr.fl / (fr.n - 1);
    const push = 0.13 * smoothstep(0, 1, u) + 0.02 * u;
    F.renderFrame({ ign, reach, push });
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.globalCompositeOperation = 'source-over'; g2.filter = 'none';
    g2.drawImage(glCanvas, 0, 0, ctx.W, ctx.H);
    // the drawing, landing on it and burning off over the first beat
    if (k >= 0 && k < 24 && drawLines(k, push, s) > 0) {
      g2.globalCompositeOperation = 'lighter';
      g2.filter = `blur(${(7 * s).toFixed(2)}px)`; g2.globalAlpha = 0.9; g2.drawImage(lc, 0, 0);
      g2.filter = `blur(${(2.2 * s).toFixed(2)}px)`; g2.globalAlpha = 0.8; g2.drawImage(lc, 0, 0);
      g2.filter = 'none'; g2.globalAlpha = 1; g2.drawImage(lc, 0, 0);
      g2.globalCompositeOperation = 'source-over';
    }
  },
};
