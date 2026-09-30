// Test wrapper (agent I, revision 4): S30 through the current engine, on S30's own frames, for the rung-5 before/after check.
import S from './S30.js';
export default {
  async setup(ctx) { return S.setup(Object.assign({}, ctx, { shot: ctx.T.shot('S30') })); },
  render(ctx, fr) { return S.render(ctx, ctx.T.frameInfo(ctx.T.shot('S30'), fr.f)); },
};
