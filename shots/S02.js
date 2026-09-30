// S02, intro A bars 3-4 (frames 155-298). The spark's ray flaps swing shut on the chop notes
// while Clawd's pieces open outward from the square (arms, then head and body, then legs): the
// light is refolded into a Clawd-shaped cut, with his eyes left standing as card. Bar 4 lets the
// light pour through; its last beat flies the camera through the hole into the lit tissue, and
// the shot ends on a warm wash for S03. Same timeline function as S01 (sets/paper-card/opening.js).
// In bar 4 the humans' cursor returns to Clawd's shape and types `train(corpus)` in the humans' code
// panel, the same panel as S13's (sets/valley/papercursor.js, read only), drawn here over the card
// render at S13's size; the click on 281 flashes it and launches the fly-through.
import { createCard } from '../sets/paper-card/card.js';
import { openingState } from '../sets/paper-card/opening.js';
import { createPaperCursor } from '../sets/valley/papercursor.js';

let C, glCanvas, g2, CUR;
export default {
  async setup(ctx) {
    // the card renders into its own WebGL canvas, copied onto the frame, so the panel can be drawn in 2D
    glCanvas = document.createElement('canvas'); glCanvas.width = 1920; glCanvas.height = 1080;
    g2 = ctx.canvas.getContext('2d');
    C = createCard(glCanvas, ctx.log);
    CUR = createPaperCursor(23);
  },
  render(ctx, fr) {
    const st = openingState(ctx.T, fr.f);
    C.render(st);
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.drawImage(glCanvas, 0, 0, ctx.W, ctx.H);
    if (st.panel) {
      const p = st.panel, kc = ctx.W / 1920;
      g2.save(); g2.setTransform(kc, 0, 0, kc, 0, 0);
      CUR.panel(g2, p.x, p.y, p.text, { open: p.open, typed: p.typed, caret: p.caret, flash: p.flash });
      g2.restore();
    }
  },
};
