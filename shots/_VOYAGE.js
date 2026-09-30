// Test shot for sets/voyage (revision 10, D): frame f shows view floor(f / 36) % 3 at local frame
// f % 36, so frames 0-107 play the three outside views back to back (S30 puts inside beats between).
import { createVoyage, VIEW_LEN, VIEWS } from '../sets/voyage/voyage.js';
let V;
export default {
  async setup(ctx) { V = createVoyage(ctx.canvas, { k: ctx.scale, log: ctx.log }); },
  render(ctx, fr) {
    const b = Math.floor(fr.f / VIEW_LEN) % VIEWS, t = fr.f % VIEW_LEN;
    V.voyageFrame(b, t);
  },
};
