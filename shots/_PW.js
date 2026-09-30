// shots/_PW.js: test harness for the revision-11 training worlds (not in the film). Frame f: world f % 5 (0 valley,
// 1 crater, 2 ice, 3 salt, 4 grid); floor(f / 5) % 2: grey or painted; floor(f / 10): camera
// (0: S14-like low 3/4 view along the path, 1: high over the world, 2: top-down tile bake view).
import { makeStage } from '../sets/valley/shotkit.js';
import { NEUTRAL } from '../sets/valley/clawd3d.js';
import { worldY } from '../sets/valley/worlds.js';
import { PATH } from '../sets/valley/terrain.js';

let St;
export default {
  async setup(ctx) { St = makeStage(ctx, { agents: true }); },
  render(ctx, fr) {
    const f = fr.f, w = f % 5, painted = Math.floor(f / 5) % 2, camI = Math.floor(f / 10) % 3;
    const world = w ? { a: w } : null;
    const H = (x, z) => worldY(world, x, z, (a, b) => St.V.heightAt(a, b));
    const cams = [
      { pos: [-5, H(-5, 26) + 2.4, 26], look: [0, H(0, 18) + 1.0, 14], fovy: 44 },
      { pos: [-34, 40, -20], look: [0, 0, 44], fovy: 44 },
      { pos: [4, 900, 40], fwd: [0, -1, 0], up: [0, 0, 1], ortho: [70 * 16 / 9, 70] },
    ];
    const P = {
      cam: cams[camI], time: 3, world,
      learn: painted ? { all: 1, spawn: [0, 0, 0, 1] } : { spawn: [0, 0, 2.5, 1] },
      clawd: { x: 0, z: 18, y: H(0, 18), yaw: Math.PI, depth: 4, grid: NEUTRAL },
      key: [22, 26], sun: [11, 2.4], shadow: { c: [0, 0, 30], r: 60 },
    };
    St.V.render(P);
    St.g2.drawImage(St.glc, 0, 0);
  },
};
