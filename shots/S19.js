// S19 (bars 51-52, frames 3611-3754), revisions 15-17: Clawd's first original creation, then
// the humans make more of him. Revision 17b: bar 51 grows the tree, its canopy blooming on the sung
// onsets; in the quiet bar 52 the copy runs by 52.2, and the five share one happy beat, then stillness to
// the hard cut (Claire: one emote lets the beat feel longer). One continuous action with S18: its valleyParams run on from S18's
// last frame on the valley clock (T 288 on), here slowed so the growth breathes in the quiet bar 52.
// - Bar 52: the hill finishes rising under the sapling, which grows into the tree of the final scene
//   (S31's tree, sets/valley/bigtree.js): drawn in light, then filled, its canopy glittering; in no
//   training world was there anything like it. Clawd looks up at it.
// - Bar 53: the humans' indigo cursor comes in, clicks him on 53.1 (a selection outline) and types
//   clawd.copy(4) in S10's paper label; it clicks on the sung onset (105, 53.2), and four copies of him
//   appear beside him, each already holding its own orange cursor, and his own re-forms from his light.
//   The copies are the humans' act, made because they trust him; he never copies himself. They glance
//   at each other and share one happy beat; the five hold, still, by the tree to the hard cut into S20.
import S18, { valleyParams, acting, stage, eyes } from './S18.js';
import { hillHeight } from '../sets/valley/raise.js';
import { projectPx as projectPxB } from '../sets/valley/valley.js';
import { TH_V, YAW } from '../sets/valley/breakdown.js';
import { clamp, lerp, ss, easeInOut, easeOut } from '../sets/valley/shotkit.js';
import { HIS, PAPER } from '../sets/valley/papercursor.js';
import { NEUTRAL, solidGrid } from '../sets/valley/clawd3d.js';
import { GRIDS } from '../sets/hill/clawd-pose.js';

const G = {}; for (const k of Object.keys(GRIDS)) G[k] = solidGrid(GRIDS[k]);
const LOOK = { up: eyes(NEUTRAL, 0, -1), upLeft: eyes(NEUTRAL, -1, -1), upRight: eyes(NEUTRAL, 1, -1) };
const IN = 62, SEL = 73, ENTER = 90, JOY = 100;              // the cursor comes in; selects him (52.1); runs the copy (52.2); the one shared beat
const CODE = 'clawd.copy(4)';
// the four copies: metres from him across the view (+ right) and toward the lens (-); each one's delay
const RV = [Math.cos(TH_V), -Math.sin(TH_V)], FV = [Math.sin(TH_V), Math.cos(TH_V)];
const COPIES = [[-1.5, -0.9, 0], [1.5, -1.0, 1], [-2.9, -2.0, 2], [2.9, -2.2, 3]];   // (on the near slope, in view)
const easeOutBack = (t, c = 1.7) => { t = clamp(t); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// the valley clock over S19's frames. Bar 51 (0-71): T 288-330, the tree's canopy blooming and filling,
// faster just after each sung onset, slope 1 out of S18; bar 52: the last settling, slowly (T 330-346)
const SUNG = [7, 19, 24, 44, 55, 69];
const wSung = (x) => 0.6 + SUNG.reduce((a, o) => { const u = (x - o) / 3; return a + (u > 0 ? 1.1 * u * Math.exp(1 - u) : 0); }, 0);
const CL = (() => {
  // the lead-in term A exp(-x / 8) is solved so the clock leaves S18 at S18's own rate (1 T per frame)
  const build = (A) => { const C = [0]; for (let x = 0; x < 72; x += 0.25) { const w = (y) => wSung(y) + A * Math.exp(-y / 8); C.push(C[C.length - 1] + 0.125 * (w(x) + w(x + 0.25))); } return C; };
  let A = 2, C = build(A);
  for (let it = 0; it < 30; it++) { const slope0 = 42 * (wSung(0) + A) / C[C.length - 1]; A *= 1 / slope0; C = build(A); }
  return C;
})();
function clockAt(x) {
  if (x >= 72) return 330 + 16 * (1 - Math.pow(1 - clamp((x - 72) / 71), 2));
  const i = Math.max(0, x) / 0.25, a = Math.min(CL.length - 1, Math.floor(i)), b = Math.min(CL.length - 1, a + 1), f = i - Math.floor(i);
  return 288 + 42 * (CL[a] * (1 - f) + CL[b] * f) / CL[CL.length - 1];
}
// one small bob (a squash and a little hop) starting at frame t0
const bob = (s, t0, h = 0.08) => { const t = s - t0; if (t < 0 || t >= 10) return null; const u = t / 10; return { pose: ['hopSquash', 'hopStretch', 'hopApex', 'hopFall', 'hopSquash'][Math.min(4, Math.floor(u * 5))], dy: h * Math.sin(Math.PI * clamp((u - 0.14) / 0.72)) }; };

export default {
  async setup(ctx) {
    await S18.setup(ctx);                                // the valley as S18 left it
    ctx.log(`S19: the tree of the final scene; ${CODE} on ${ENTER}`);
  },
  render(ctx, fr) {
    const s = fr.fl, T = clockAt(s), k = ctx.W / 1920;
    const { St, CUR } = stage();
    // --- his acting: watching the tree grow (S18's clock, held at its look up at the tree), then bar 53's
    // beats keyed to the music here
    const A = acting(Math.min(T, 317));
    A.yaw += 0.42 * ss(IN, IN + 8, s);                   // he turns back toward the lens as the cursor comes
    let grid = A.grid;
    if (s >= IN + 4) grid = LOOK.upRight;                // the humans' cursor, coming in at his upper right
    if (s >= SEL && s < SEL + 3) grid = G.surprised;     // clicked: selected
    if (s >= ENTER) grid = NEUTRAL;                      // copied: he looks out, still
    if (s >= JOY && s < JOY + 12) grid = G.happy;        // the one shared beat of joy
    if (s >= 124 && s < 127) grid = G.blink;
    A.grid = grid;
    const { P, CX, CZ, gy } = valleyParams(ctx, T, fr.t, fr.f, A);
    // --- the four copies, beside him on the hill
    const crowd = [], cards = [], rings = [];
    for (const [dx, dz, dl] of COPIES) {
      const t = s - ENTER - dl;
      if (t < 0) continue;
      const x = CX + dx * RV[0] + dz * FV[0], z = CZ + dx * RV[1] + dz * FV[1];
      const sc = Math.min(1, 0.3 + 0.7 * easeOutBack(t / 6));
      const side = dx < 0 ? 1 : -1;                      // +1: he is to its screen right
      let pose = t < 3 ? 'hopSquash' : 'neutral';
      if (s >= JOY && s < JOY + 12) pose = 'happy';                 // the one shared beat, with him
      if (dl === 2 && s >= 132 && s < 135) pose = 'blink';
      const y = St.V.heightAt(x, z) + (P.hill ? hillHeight(P.hill, x, z) : 0), squash = t < 3 ? 0.94 : 1;
      crowd.push({ x, z, y, yaw: YAW + 0.16 * side, grid: pose === 'neutral' ? NEUTRAL : G[pose], depth: 4, scale: sc, squash });
      cards.push({ p: [x + 0.8 * Math.sign(dx) * RV[0], y + 1.3, z + 0.8 * Math.sign(dx) * RV[1] - 0.3], a: ss(1, 5, t) });   // (held on its outer side)
      if (t < 16) rings.push([x, z, 0.5 + t * 0.32, 0.8 * Math.exp(-t / 5)]);
    }
    if (crowd.length) P.crowd = crowd;
    // his own cursor re-forms from his light as the copies appear, so all five hold one (S20's five)
    if (s >= ENTER) { cards.push({ p: [CX + 0.9, gy + A.dy + 1.42, CZ - 0.3], a: ss(ENTER, ENTER + 4, s) }); P.clawd.glow = (P.clawd.glow || 1) + 0.9 * Math.exp(-(s - ENTER) / 6); }
    P.rings = (P.rings || []).concat(rings);
    const info = St.V.render(P);
    const g = St.g2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(St.glc, 0, 0);
    g.save(); g.setTransform(k, 0, 0, k, 0, 0);
    const toPx = (p) => { const q = projectPxB(info.B, p); return [q[0] / k, q[1] / k, q[2]]; };
    const sizeAt = (z) => clamp(16.5 / Math.max(z, 0.1), 0.5, 1.5);
    // --- the orange cursors
    for (const c of cards) {
      const q = toPx(c.p), sz = sizeAt(q[2]);
      if (q[2] > 0.5 && c.a > 0.01) CUR.draw(g, q[0], q[1], { s: sz, rot: -0.1, fill: HIS.card, edge: HIS.edge, glow: 1.0, bs: sz * k / 1.45, lit: 1, heat: 0.1, litAt: [26, 40], a: c.a });
    }
    // --- the selection: a dashed outline round him (53.1), widening round all five as they appear
    const head = toPx([CX, gy + A.dy + 0.37, CZ]);
    const cw = info.clawdW ? info.clawdW / k : 110;
    if (s >= SEL && s < ENTER + 14) {
      let x0 = head[0] - 0.62 * cw - 10, x1 = head[0] + 0.62 * cw + 10, y0 = head[1] - 0.42 * cw - 10, y1 = head[1] + 0.42 * cw + 10;
      const pop = 1 + 0.12 * Math.exp(-(s - SEL) / 2.5);
      const wide = easeInOut(clamp((s - ENTER - 2) / 6));
      if (wide > 0) {
        const qs = crowd.map((c) => toPx([c.x, c.y + 0.37, c.z]));
        const X0 = Math.min(x0, ...qs.map((q) => q[0] - 0.62 * cw - 10)), X1 = Math.max(x1, ...qs.map((q) => q[0] + 0.62 * cw + 10));
        const Y0 = Math.min(y0, ...qs.map((q) => q[1] - 0.42 * cw - 10)), Y1 = Math.max(y1, ...qs.map((q) => q[1] + 0.42 * cw + 10));
        x0 = lerp(x0, X0, wide); x1 = lerp(x1, X1, wide); y0 = lerp(y0, Y0, wide); y1 = lerp(y1, Y1, wide);
      }
      const a = ss(SEL, SEL + 2, s) * (1 - ss(ENTER + 8, ENTER + 14, s));
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2 * pop, hh = (y1 - y0) / 2 * pop;
      g.save();
      g.globalAlpha = a; g.lineWidth = 2.2; g.setLineDash([9, 6]); g.lineDashOffset = -s * 0.8;
      g.shadowColor = 'rgba(16,19,31,0.7)'; g.shadowBlur = 4;
      g.strokeStyle = 'rgb(236,228,212)'; g.strokeRect(cx - hw, cy - hh, 2 * hw, 2 * hh);
      g.setLineDash([]); g.fillStyle = 'rgb(236,228,212)';
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.fillRect(cx + sx * hw - 4, cy + sy * hh - 4, 8, 8);
      g.restore();
    }
    // --- the humans' cursor: in from the upper right, clicks him, types the copy, runs it, leaves
    if (s >= IN) {
      const tip = [head[0] + 0.5 * cw, head[1] - 0.46 * cw];      // his top right corner
      const d = easeOut(clamp((s - IN) / (SEL - 2 - IN)));
      const away = Math.pow(clamp((s - ENTER - 4) / 14), 2);
      const x = lerp(tip[0] + 420, tip[0], d) + 160 * away, y = lerp(-220, tip[1], d) - 760 * away;
      const press = Math.max(Math.exp(-Math.pow((s - SEL) / 2.2, 2)), Math.exp(-Math.pow((s - ENTER) / 2.2, 2)));
      // its label (S10's paper panel): typed after the selection, run on the second click
      const open = easeOut(clamp((s - SEL - 1) / 4)) * (1 - easeInOut(clamp((s - ENTER - 2) / 6)));
      // (revision 19, lead) the humans' panel at 1.5x, like S02's and S15's, readable at phone size
      if (open > 0.001) { g.save(); g.translate(x + 64, y + 34); g.scale(1.5, 1.5);
        CUR.panel(g, 0, 0, CODE, { open, typed: clamp((s - SEL - 3) / 10), caret: s < ENTER, flash: Math.exp(-Math.pow((s - ENTER) / 4, 2)) * (s >= ENTER - 2 ? 1 : 0) }); g.restore(); }
      if (away < 1) CUR.draw(g, x, y, { s: 1.2, press, rot: -0.06, fill: PAPER.slate, bs: 1.2 * k / 1.45 });
    }
    g.restore();
  },
};
