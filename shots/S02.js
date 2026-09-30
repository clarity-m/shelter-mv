// S02, intro A bars 3-4 (frames 155-298). The spark's ray flaps swing shut on the chop notes
// while Clawd's pieces open outward from the square (arms, then head and body, then legs): the
// light is refolded into a Clawd-shaped cut, with his eyes left standing as card. Bar 4 lets the
// light pour through; its last beat flies the camera through the hole into the lit tissue, and
// the shot ends on a warm wash for S03. Same timeline function as S01 (sets/paper-card/opening.js).
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
