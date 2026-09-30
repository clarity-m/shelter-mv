// Test (agent I, revision 11): the level-ray singularity D found in S20. A level camera whose horizon
// falls exactly on a pixel centre (design y 540.5 at 1920 wide: row 539's rays have rd.y == 0), or a
// hair above it (row 539's rays tilt down by ~4e-8 or ~7e-6), through hillx in five configurations:
//   f mod 5:  0 rung 4, the painted look (S18/S19's valley)   1 the look, S27's salt flat at night
//             2 rung 5, the finished shelter (S30/S31)        3 rung 4, the old luminous paint
//             4 the look again, the camera higher up
//   frames 0-4 exact (540.5), 10-14 a hair (540.4999), 20-24 more (540.49);
//   frames 30, 31, 32: sets/hill's own renderer (createShelter, as S31/S32 use it) at the three.
// Render at scale 1: node render/render.mjs _R11NaN --still F
import { createHill } from '../sets/inside-montage/hillx.js';
import { WORLD, worldPal } from '../sets/inside-montage/saltflat.js';
import { shelterState, SHELTER_SEEDING, createShelter } from '../sets/hill/shelter.js';

let hill, sh = null, cv, cv2, g2, W, H;
let PPY = 540.5;
const cam = (y = 1.4, z = -6) => ({ pos: [0.3, y, z], yaw: 0.05, pitch: 0, F: 1400, pp: [960, PPY] });
export default {
  async setup(ctx) {
    W = ctx.W; H = ctx.H; g2 = ctx.canvas.getContext('2d');
    cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    hill = createHill(cv, { log: ctx.log, seeding: SHELTER_SEEDING });
    hill.warm([4, 5]);
    ctx.log(`_R11NaN: ${W}x${H}; the level row is design y 540.5`);
  },
  render(ctx, fr) {
    const f = fr.f;
    if (f >= 30) {
      PPY = f === 30 ? 540.5 : f === 31 ? 540.4999 : 540.49;
      if (!sh) { cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H; sh = createShelter(cv2, { log: ctx.log }); sh.hill.warm([5]); }
      sh.render({ time: 170, build: 1, cam: cam(1.3, 2.0) });
      g2.drawImage(cv2, 0, 0, W, H);
      return;
    }
    const k = ((f % 5) + 5) % 5;
    PPY = f >= 20 ? 540.49 : f >= 10 ? 540.4999 : 540.5;
    let st;
    if (k === 0) st = { rung: 4, cam: cam() };
    else if (k === 1) st = Object.assign({}, WORLD, { rung: 4, cam: cam(2.41), clawd: null, palLin: worldPal(1), grid: 0.04 });
    else if (k === 2) st = shelterState({ time: 170, build: 1, figure: true, cam: cam(1.3, 2.0) });
    else if (k === 3) st = { rung: 4, look: 'luminous', cam: cam() };
    else st = { rung: 4, cam: cam(2.3, -2) };
    hill.render(st);
    g2.drawImage(cv, 0, 0, W, H);
  },
};
