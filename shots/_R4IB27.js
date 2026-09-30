// Test wrapper (agent I, revision 4): S27 through the cut-4 backup engine, on S27's own frames, for the rung-5 before/after check.
import S from '../backups/cut4/code/shots/S27.js';
export default {
  async setup(ctx) { return S.setup(Object.assign({}, ctx, { shot: ctx.T.shot('S27') })); },
  render(ctx, fr) { return S.render(ctx, ctx.T.frameInfo(ctx.T.shot('S27'), fr.f)); },
};
