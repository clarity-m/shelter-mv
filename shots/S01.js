// S01, intro A bars 1-2: the film's first image. Black card; on the first vocal-chop note a
// square hole lights orange from behind. R20 (Claire): the humans' paper cursor draws the
// eleven-ray Claude spark's outline, ray by ray, as a thin line of light cut into the card; then
// the rays fill with light and their flaps swing open. The card no longer spins. The whole opening
// bookend is one function of the frame in sets/paper-card/opening.js (shared with S02).
import { createCard } from '../sets/paper-card/card.js';
import { openingState } from '../sets/paper-card/opening.js';

let C, glCanvas, g2;
export default {
  async setup(ctx) {
    if (ctx.scale === 1) glCanvas = ctx.canvas;
    else { glCanvas = document.createElement('canvas'); glCanvas.width = 1920; glCanvas.height = 1080; g2 = ctx.canvas.getContext('2d'); }
    C = createCard(glCanvas, ctx.log);
  },
  render(ctx, fr) {
    C.render(openingState(ctx.T, fr.f));
    if (g2) g2.drawImage(glCanvas, 0, 0, ctx.W, ctx.H);
  },
};
