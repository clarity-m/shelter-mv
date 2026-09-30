// Test harness for the hill set (not in the film). The frame number picks a variant:
//   f % 100: 0 rung 4 ladder view, 1 rung 5 ladder view, 2 rung 4 with the skyline seed,
//            3 the shelter (crane start), 4 the shelter (crane end),
//            5 the S32 seam: the shelter on a 2048 square (shown fitted to the frame height),
//            6 / 7 the shelter with an exaggerated lean (x3) / none, for checking the figure rig
//   floor(f / 100) adds time in seconds (motion checks).
// node render/render.mjs _HILL --still 3
import { createHill } from '../sets/hill/hill.js';
import { shelterState, createShelter, SHELTER_SEEDING, S31_LAST_SQUARE } from '../sets/hill/shelter.js';
import { SKYLINE, SKYLINE_SEED } from '../sets/hill/scene.js';

let hill, cv, sq, g2;
export default {
  async setup(ctx) {
    cv = document.createElement('canvas'); cv.width = ctx.W; cv.height = ctx.H;
    hill = createHill(cv, { log: ctx.log, timing: true, seeding: SHELTER_SEEDING });
    g2 = ctx.canvas.getContext('2d');
  },
  render(ctx, fr) {
    const v = fr.f % 100, time = Math.floor(fr.f / 100);
    g2.fillStyle = '#000'; g2.fillRect(0, 0, ctx.W, ctx.H);
    if (v === 5) {
      if (!sq) { const c = document.createElement('canvas'); c.width = c.height = 2048; sq = createShelter(c, { log: ctx.log }); sq.canvas = c; }
      sq.render(Object.assign({}, S31_LAST_SQUARE, { time: S31_LAST_SQUARE.time + time }));
      g2.drawImage(sq.canvas, (ctx.W - ctx.H) / 2, 0, ctx.H, ctx.H);
      return;
    }
    const human = { x: -1.37, z: 5.2, yaw: Math.atan2(1.51 + 1.37, 9.6 - 5.2) + 0.3 };
    let st;
    if (v === 0) st = { rung: 4, time, human };
    else if (v === 1) st = { rung: 5, time, human, clawd: { form: 'radiant' } };
    else if (v === 2) st = { rung: 4, time, towers: SKYLINE.slice(0, SKYLINE_SEED).map(([x, z, w, h, taper, cap, rot]) => ({ x, z, w, h, taper, cap, rot, lit: 0.3 })) };
    else if (v === 6) st = shelterState({ time, crane: 0.6, lean: 3, presence: 1 });
    else if (v === 7) st = shelterState({ time, crane: 0.6, lean: 0, presence: 1 });
    else st = shelterState({ time, crane: v === 3 ? 0 : 1 });
    hill.render(st);
    g2.drawImage(cv, 0, 0);
    ctx.log(`variant ${v} t=${time}: ` + Object.entries(hill.TIMES).map(([k, x]) => `${k}=${typeof x === 'number' ? x.toFixed(0) : x}`).join(' '));
  },
};
