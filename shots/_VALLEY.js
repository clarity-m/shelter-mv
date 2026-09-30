// Test shot for sets/valley (not in shots.json). Frame % 10 picks a variant:
// 0 over-the-shoulder view down the valley, spawn painted; 1 the white field (S13 opening);
// 2 mid-rise; 3 trail painted, 3/4 front; 4 smooth paint (S18 end); 5 top-down tile view.
import { createValley } from '../sets/valley/valley.js';
import { drawHUD } from '../sets/valley/hud.js';
import { PATH, pathAt } from '../sets/valley/terrain.js';

let V, glc, g2;
export default {
  async setup(ctx) {
    glc = document.createElement('canvas'); glc.width = ctx.W; glc.height = ctx.H;
    V = createValley(glc, { log: ctx.log });
    g2 = ctx.canvas.getContext('2d');
  },
  render(ctx, fr) {
    const v = fr.f % 10, k = ctx.H / 1080;
    let P;
    if (v === 0) P = { cam: { pos: [-2.2, 3.6, -9.5], look: [1.5, 0.2, 14], fovy: 38 }, learn: { spawn: [0, 0, 9, 2] }, clawd: { x: 0, z: 0, yaw: 0 } };
    if (v === 1) P = { cam: { pos: [0, 1.9, 8.5], look: [0, 0.45, 0], fovy: 34 }, rise: { R: 0.5, w: 3, crest: 0 }, skyWhite: 1, clawd: { x: 0, z: 0, yaw: 0, depth: 0 }, learn: { spawn: [0, 0, 0, 1] } };
    if (v === 2) P = { cam: { pos: [5, 2.6, 7.5], look: [0, 0.4, 0], fovy: 38 }, rise: { R: 22, w: 7, crest: 0.6 }, skyWhite: 0.4, clawd: { x: 0, z: 0, yaw: 0 }, learn: { spawn: [0, 0, 4, 1.5] } };
    if (v === 3) { const c = pathAt(30); P = { cam: { pos: [c.x - 7, 3.2, c.z + 8], look: [c.x, 0.5, c.z - 2], fovy: 40 }, learn: { spawn: [0, 0, 7, 2], trail: { pts: PATH, reach: 30, w: 6 } }, clawd: { x: c.x, z: c.z, yaw: c.heading } }; }
    if (v === 4) P = { cam: { pos: [-6, 4.5, -10], look: [2, 0.5, 20], fovy: 40 }, learn: { spawn: [0, 0, 0, 1], touch: [0, 0, 400, 6] }, smooth: 1, pal: 1, clawd: { x: 0, z: 0, yaw: 0 }, hideAgents: true };
    if (v === 5) P = { cam: { pos: [4, 400, 40], look: [4, 0, 40.01], fovy: 30, up: [0, 0, 1], ortho: [70 * 16 / 9, 70] }, learn: { all: 1 }, tile: { c: [4, 40], half: 70, dissolve: 1 }, void: 1, clawd: { x: 0, z: 0, yaw: 0, hidden: true }, noReflection: true };
    P.time = fr.t;
    const t0 = performance.now();
    V.render(P);
    V.sync();
    ctx.log(`variant ${v}: ${(performance.now() - t0).toFixed(0)} ms`);
    g2.drawImage(glc, 0, 0);
    drawHUD(g2, k, { episode: 1, reward: 0.0, step: 12 });
  },
};
