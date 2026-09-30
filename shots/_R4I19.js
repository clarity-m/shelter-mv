// Test wrapper (agent I, revision 4): S19 rendered on its own frames with no dissolve from S18,
// for out/stills/r4_S19_open.png. Frame numbers are S19's (global).
import S from './S19.js';
export default {
  async setup(ctx) { return S.setup(Object.assign({}, ctx, { shot: ctx.T.shot('S19') })); },
  render(ctx, fr) { return S.render(ctx, ctx.T.frameInfo(ctx.T.shot('S19'), fr.f)); },
};
