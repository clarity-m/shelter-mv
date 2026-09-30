// S01, intro A bars 1-2: the film's first image. Black card; on the first vocal-chop note a
// square hole lights orange from behind; over the following notes kirigami flaps swing back
// from its edges into the eleven-ray Claude spark. The whole opening bookend is one function
// of the frame in sets/paper-card/opening.js (shared with S02).
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
