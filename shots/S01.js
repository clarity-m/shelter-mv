// S01, intro A bars 1-2: the film's first image. Black card; on the first vocal-chop note a
// square hole lights orange from behind. R22 (Claire: "the cursor draws the outline, the paper folds
// in after"): the humans' paper cursor draws the eleven-ray Claude spark's outline with its tip, a
// line of light where it has passed, and behind it the paper folds in ray by ray (R24), each flap just
// after the pen finishes its outline, the last ray of each of cut 18's fans landing on a chop. The card
// does not spin. The whole opening bookend is one function of the frame in sets/paper-card/opening.js
// (shared with S02).
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
