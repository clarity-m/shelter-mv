// (Revision 19: Claire approved this version and it is now S10's default; this test shot renders the
// same thing and is kept only for reference.)
// Test shot (not in shots.json): an alternate S10 for Claire to compare. The camera scrolls gently
// with Clawd, side-scroller style, while he explores (bars 18-19), into a world that extends a little
// beyond the screen's left edge, and settles on S10's fixed framing before he reaches the gap; the
// key beats, the first frame (S08's match) and the last frame (the cut into S11) are S10's own.
// It renders S10's frames:  node render/render.mjs _S10scroll --from 1163 --to 1810
import { makeS10 } from './S10.js';

const S = makeS10({ scroll: true });
let s10;
export default {
  async setup(ctx) { s10 = ctx.T.shot('S10'); await S.setup(ctx); },
  render(ctx, fr) { return S.render(ctx, ctx.T.frameInfo(s10, fr.f)); },
};
