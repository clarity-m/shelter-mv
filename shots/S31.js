// S31, drop 2 + vocal (bars 81-85), rung 5: the shelter. The final environment Claude built
// to shelter people: the hill, the tree, a faceless figure sitting at its foot and Clawd
// sitting beside her, radiant. Behind the hill a skyline of slender lit towers under a ring
// that arches across the sky. The camera cranes up slowly; every kick pulses the city's
// windows. On beat 4 of bar 85 the bass stops: the world holds its breath (time freezes, the
// lights ease down, Clawd's light draws in), and the shot ends on that held moment. S32's
// pull-back lets it go on the bar-86 downbeat (Revision 4: the reveal gets that bar).
// Revision 1: tiny figures gather out of the light on the far ridge and kites rise over the far
// slopes in bar 81; she leans back once, on the phrase at 6002; Clawd blinks and glances up at her.
// Revision 19 (agent I): the vocal drop (81.1) is the song's climax. A wave of warm light runs out
// from the pair through the shelter (sets/hill/shelter.js `waveT`): the land's contours flare as the
// front crosses them, each tower's windows flash as it reaches them and stay a little brighter, and
// the ring brightens. The lower city is denser (mid-rise blocks in sets/hill/scene.js SKYLINE). The
// figure no longer pops in: she forms from light beside Clawd as the wave leaves them, her outline
// drawn in lines of light, then her real self, over about a beat. The first frame has no figure, so
// S30 lands on it exactly. The shelter renders off screen and is composited here in 2D, so her
// forming can cross-fade two renders (without her, with her); outside those frames it is one render.
import { createShelter, s31Anim, craneCam, SHELTER_SPOTS, S31_F0 } from '../sets/hill/shelter.js';
import { hillH, HILL, FAR_RIDGE, camBasis, project } from '../sets/hill/scene.js';
import { smoothstep, clamp } from '../lib/util.js';

let sh, glCv, g2, W, H, K, cvA, gA, cvB, gB, cvL, gL, cvF, gF;
export const HOLD0 = 6118, HOLD1 = 6131;   // the stop on bar 85 beat 4 .. the bar-86 downbeat

// The shelter's render state at global frame f, for a shot starting at f0 that is nFrames long.
// Shared with the S32 seam (sets/inside-montage/seam.js), which renders S31's last frame wider.
export function s31Params(T, f, f0, nFrames) {
  // held time: frozen from the stop until the next downbeat
  const held = clamp(f - HOLD0, 0, HOLD1 - HOLD0);
  const fe = f - held;                                  // effective frame
  const n = nFrames - 1 - Math.max(0, Math.min(f0 + nFrames, HOLD1) - HOLD0);
  const u = clamp((fe - f0) / n, 0, 1);                 // crane progress
  const inHold = f >= HOLD0 && f < HOLD1;
  const breath = inHold ? smoothstep(HOLD0, HOLD0 + 8, f) : 0;
  // kicks pulse the city: a quick lift, a soft decay
  const kick = inHold ? 0 : T.pulse('kicks', f, 5);
  const vox = T.envSmooth('vocals', f, 5);
  return {
    time: 150 + fe / 30,
    crane: u,
    cityPulse: 0.5 * kick,
    towerWin: 0.9 * (1 - 0.25 * breath),
    clawdGlow: 1.0 + 0.12 * (vox - 0.5) + 0.12 * breath,
    // revision 1: the far slopes fill with people and kites during bar 81, she leans back on
    // the phrase at 6002, Clawd blinks and glances up at her (all frozen through the hold)
    ...s31Anim(fe),
    // revision 19: the wave runs from the drop, and she is there from the frame after it (forming
    // over the first beat, see render)
    waveT: fe - S31_F0,
    figure: fe > S31_F0,
  };
}

// ---------------------------------------------------------------- her forming (revision 19)
// frames since the drop: her outline draws in 0-10 (two strokes up from her feet, meeting at her head),
// her real self fades in 6-17, the lines burn off 12-22; a faint fill of light while she is light
const FORM_END = 24;
const formAt = (t) => ({
  draw: smoothstep(0, 10, t), line: 1 - smoothstep(12, 22, t), real: smoothstep(6, 17, t),
  fill: 0.22 * smoothstep(2, 8, t) * (1 - smoothstep(10, 18, t)),
});
const HILL_DONE = HILL.concat([FAR_RIDGE]);
function figureBox(p) {
  const S = SHELTER_SPOTS, cam = p.cam || craneCam(p.crane), B = camBasis(cam);
  const y = hillH(HILL_DONE, S.human.x, S.human.z);
  const b = project(B, [S.human.x, y, S.human.z]), t = project(B, [S.human.x, y + 1.35, S.human.z]);
  const hgt = b[1] - t[1];
  const x0 = Math.max(0, Math.floor((b[0] - 0.85 * hgt) * K)), x1 = Math.min(W, Math.ceil((b[0] + 0.85 * hgt) * K));
  const y0 = Math.max(0, Math.floor((t[1] - 0.25 * hgt) * K)), y1 = Math.min(H, Math.ceil((b[1] + 0.2 * hgt) * K));
  return [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)];
}
function formFigure(p, t) {
  const F = formAt(t), [x0, y0, bw, bh] = figureBox(p);
  const A = gA.getImageData(x0, y0, bw, bh).data, B = gB.getImageData(x0, y0, bw, bh).data;
  // her pixels: where the render with her differs from the one without, closed (dilated then eroded
  // by a pixel) so her silhouette has no pinholes
  const n = bw * bh, m0 = new Uint8Array(n), m1 = new Uint8Array(n), m = new Uint8Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const d = Math.max(Math.abs(A[j] - B[j]), Math.abs(A[j + 1] - B[j + 1]), Math.abs(A[j + 2] - B[j + 2]));
    m0[i] = d > 10 ? 1 : 0;
  }
  const at = (a, x, y) => (x < 0 || y < 0 || x >= bw || y >= bh ? 0 : a[y * bw + x]);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    let v = 0;
    for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1; dx++) if (at(m0, x + dx, y + dy)) { v = 1; break; }
    m1[y * bw + x] = v;
  }
  let cx = 0, cy = 0, cn = 0;
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    let v = 1;
    for (let dy = -1; dy <= 1 && v; dy++) for (let dx = -1; dx <= 1; dx++) if (!at(m1, x + dx, y + dy)) { v = 0; break; }
    m[y * bw + x] = v;
    if (v) { cx += x; cy += y; cn++; }
  }
  if (cn < 8) { g2.drawImage(t < FORM_END / 2 ? cvA : cvB, 0, 0, W, H); return; }
  cx /= cn; cy /= cn;
  // her light: the outline (within a pixel or two of her edge, by K) drawn up both sides from her feet,
  // the pen's tip hottest; and, drawn once, a faint fill of light
  const edgeR = Math.max(1, Math.round(1.6 * K));
  cvL.width = bw; cvL.height = bh; cvF.width = bw; cvF.height = bh;
  const L = gL.createImageData(bw, bh), o = L.data, Fi = gF.createImageData(bw, bh), of = Fi.data;
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const i = y * bw + x;
    if (!m[i]) continue;
    let edge = false;
    for (let dy = -edgeR; dy <= edgeR && !edge; dy++) for (let dx = -edgeR; dx <= edgeR; dx++) if (!at(m, x + dx, y + dy)) { edge = true; break; }
    const j = i * 4;
    of[j] = 255; of[j + 1] = 226; of[j + 2] = 190; of[j + 3] = Math.round(255 * F.fill);
    if (!edge) continue;
    const s = Math.abs(Math.atan2(x - cx, y - cy)) / Math.PI;           // 0 at her feet .. 1 at her head
    if (s > F.draw) continue;
    const a = clamp(F.line * (0.8 + 1.4 * Math.exp(-(F.draw - s) / 0.05)));
    o[j] = 255; o[j + 1] = 238; o[j + 2] = 214; o[j + 3] = Math.round(255 * a);
  }
  gL.putImageData(L, 0, 0); gF.putImageData(Fi, 0, 0);
  g2.drawImage(cvA, 0, 0, W, H);
  if (F.real > 0) { g2.globalAlpha = F.real; g2.drawImage(cvB, 0, 0, W, H); g2.globalAlpha = 1; }
  g2.save(); g2.globalCompositeOperation = 'lighter';
  if (F.fill > 0) { g2.filter = `blur(${(1.5 * K).toFixed(1)}px)`; g2.drawImage(cvF, x0, y0); }
  if (F.line > 0) {
    g2.filter = `blur(${(4 * K).toFixed(1)}px)`; g2.drawImage(cvL, x0, y0);
    g2.filter = 'none'; g2.drawImage(cvL, x0, y0);
  }
  g2.restore();
}

export default {
  async setup(ctx) {
    W = ctx.W; H = ctx.H; K = W / 1920;
    g2 = ctx.canvas.getContext('2d');
    glCv = document.createElement('canvas'); glCv.width = W; glCv.height = H;
    sh = createShelter(glCv, { log: ctx.log });
    sh.hill.warm([5]);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d', { willReadFrequently: true })]; };
    [cvA, gA] = mk(); [cvB, gB] = mk();
    cvL = document.createElement('canvas'); gL = cvL.getContext('2d');
    cvF = document.createElement('canvas'); gF = cvF.getContext('2d');
  },
  render(ctx, fr) {
    const p = s31Params(ctx.T, fr.f, fr.f - fr.fl, fr.n), t = p.waveT;
    if (t <= 0 || t >= FORM_END) { sh.render(p); g2.drawImage(glCv, 0, 0, W, H); return; }
    sh.render(Object.assign({}, p, { figure: false })); gA.drawImage(glCv, 0, 0);
    sh.render(p); gB.drawImage(glCv, 0, 0);
    formFigure(p, t);
  },
};
