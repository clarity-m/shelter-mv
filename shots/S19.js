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
import S18, { valleyParams, acting, stage, eyes, watchW, watchS } from './S18.js';
import { hillHeight } from '../sets/valley/raise.js';
import { projectPx as projectPxB } from '../sets/valley/valley.js';
import { TH_V, YAW } from '../sets/valley/breakdown.js';
import { clamp, lerp, ss, easeInOut, easeOut } from '../sets/valley/shotkit.js';
import { HIS, PAPER } from '../sets/valley/papercursor.js';
import { NEUTRAL, solidGrid } from '../sets/valley/clawd3d.js';
import { GRIDS } from '../sets/hill/clawd-pose.js';

const G = {}; for (const k of Object.keys(GRIDS)) G[k] = solidGrid(GRIDS[k]);
const LOOK = { up: eyes(NEUTRAL, 0, -1), upLeft: eyes(NEUTRAL, -1, -1), upRight: eyes(NEUTRAL, 1, -1) };
// revision 20b: the humans' cursor is already here, watching (S18's watchW path); it glides to him from
// late 51 (58), selects him on 52.1 (73), types, and clicks at 52.2.5 (100); then it drifts up to watch
const IN = 58, SEL = 73, ENTER = 100, JOY = 110;
// revision 22 (Claire: the cursor's stops read as stutter): its path is one fluid line at a constant
// angle. curve() is a C1 Hermite through waypoints P at parameter knots K (Catmull-Rom tangents), so
// the velocity carries through every waypoint; each phase runs under one ease-in/ease-out.
function curve(P, K, u) {
  let i = 0; while (i < P.length - 2 && u > K[i + 1]) i++;
  const h = K[i + 1] - K[i], t = (u - K[i]) / h, t2 = t * t, t3 = t2 * t;
  const tan = (j) => { const a = Math.max(0, j - 1), b = Math.min(P.length - 1, j + 1); return [0, 1].map((q) => (P[b][q] - P[a][q]) / (K[b] - K[a])); };
  const m0 = tan(i), m1 = tan(i + 1);
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  return [0, 1].map((q) => h00 * P[i][q] + h10 * h * m0[q] + h01 * P[i + 1][q] + h11 * h * m1[q]);
}
const smooth01 = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
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
    if (s >= 130 && s < 133) grid = G.blink;
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
      if (dl === 2 && s >= 136 && s < 139) pose = 'blink';
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
    // --- the humans' cursor (revision 22): phase A (0-71) runs on from S18's path, curving left toward the
    // growing tree and round over him to his top-right corner, never stopping; phase B (71-104) is the
    // story's hold, selecting him (73), typing and clicking (100), with the idle hover; phase C (104-143)
    // is one eased rise to watch the five, arriving as the shot ends
    {
      const tip = [head[0] + 0.5 * cw, head[1] - 0.46 * cw];      // his top right corner
      // (a loop, not a reversal: out left and up toward the tree, down round its far side, back in to him)
      const A = [toPx(watchW(288, CX, gy, CZ)), toPx([CX - 3.0, gy + 4.2, CZ - 0.5]), toPx([CX - 3.3, gy + 3.0, CZ - 0.6]), toPx([CX - 1.0, gy + 2.5, CZ - 0.7]), [tip[0], tip[1], 1]];
      const C = [[tip[0], tip[1], 1], toPx([CX + 0.4, gy + 2.3, CZ - 0.8]), toPx([CX + 1.2, gy + 3.3, CZ - 0.9])];
      let x, y, cs;
      if (s < 71) { const u = smooth01(s / 71); [x, y] = curve(A, [0, 0.3, 0.55, 0.8, 1], u); cs = lerp(watchS(A[0][2]), 1.2, u); }
      else if (s < 104) {
        const amp = ss(71, 78, s) * (1 - ss(97, 104, s));          // the idle hover, easing in and out of the hold
        x = tip[0] + amp * 2.6 * Math.sin((s - 71) * 2 * Math.PI / 38); y = tip[1] + amp * 2.2 * Math.sin((s - 71) * 2 * Math.PI / 27); cs = 1.2;
      } else { const u = smooth01((s - 104) / 39); [x, y] = curve(C, [0, 0.45, 1], u); cs = lerp(1.2, watchS(C[2][2]), u); }
      const press = Math.max(Math.exp(-Math.pow((s - SEL) / 2.2, 2)), Math.exp(-Math.pow((s - ENTER) / 2.2, 2)));
      // its label (S10's paper panel, 1.5x, readable at phone size): typed after the selection, run on the
      // second click; anchored at his corner, so it doesn't hover with the cursor
      const open = easeOut(clamp((s - SEL - 1) / 4)) * (1 - easeInOut(clamp((s - ENTER - 2) / 6)));
      if (open > 0.001) { g.save(); g.translate(tip[0] + 64, tip[1] + 34); g.scale(1.5, 1.5);
        CUR.panel(g, 0, 0, CODE, { open, typed: clamp((s - SEL - 3) / 10), caret: s < ENTER, flash: Math.exp(-Math.pow((s - ENTER) / 4, 2)) * (s >= ENTER - 2 ? 1 : 0) }); g.restore(); }
      CUR.draw(g, x, y, { s: cs, press, rot: -0.06, fill: PAPER.slate, bs: cs * k / 1.45 });
    }
    g.restore();
  },
};
