// S02, intro A bars 3-4 (frames 155-298). The spark's ray flaps swing shut on the chop notes
// while Clawd's pieces open outward from the square (arms, then head and body, then legs): the
// light is refolded into a Clawd-shaped cut, with his eyes left standing as card. Bar 4 lets the
// light pour through; its last beat flies the camera through the hole into the lit tissue, and
// the shot ends on a warm wash for S03. Same timeline function as S01 (sets/paper-card/opening.js).
// In bar 4 the humans' cursor returns to Clawd's shape and types `train(corpus)` in the humans' code
// panel, the same panel as S13's (sets/valley/papercursor.js, read only), drawn here over the card
// render at S13's size; the click on 281 flashes it and launches the fly-through.
// R19 (Claire): the click is a burst of warm light from the cursor's tip that floods the frame, through
// Clawd's shape, into the warm wash S03 opens from (opening.js burstAt, card.js st.burst); the cursor and
// the panel dissolve into it.
import { createCard } from '../sets/paper-card/card.js';
import { openingState } from '../sets/paper-card/opening.js';
import { createPaperCursor } from '../sets/valley/papercursor.js';

let C, glCanvas, g2, CUR;
// (R19) the panel lit through by the burst: its indigo card warms to the light's peach as it dissolves
const PANEL_INK = [0x17, 0x1C, 0x30], PANEL_LIT = [0xF2, 0xC8, 0xA6];
const panelFill = (k) => `rgb(${PANEL_INK.map((c, i) => Math.round(c + (PANEL_LIT[i] - c) * k)).join(',')})`;
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
      // (revision 19, lead) the humans' panel at 1.5x, like S15's and S19's, readable at phone size
      g2.save(); g2.setTransform(kc, 0, 0, kc, 0, 0); g2.translate(p.x, p.y); g2.scale(1.5, 1.5);
      CUR.panel(g2, 0, 0, p.text, { open: p.open, a: p.a ?? 1, typed: p.typed, caret: p.caret, flash: p.flash,
        fill: p.lit > 0 ? panelFill(p.lit) : undefined });
      g2.restore();
    }
  },
};
