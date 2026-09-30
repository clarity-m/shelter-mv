// Test harness for S15 (not in the film): renders the S15 local frames listed in
// out/stills/_P15_list.json in one Chrome session; global frame f picks frames[f].
import S15 from './S15.js';
let list = [0], c15 = null;
export default {
  async setup(ctx) {
    try { const r = await fetch('/out/stills/_P15_list.json', { cache: 'no-store' }); list = (await r.json()).frames; } catch (e) { ctx.log(`no list: ${e}`); }
    c15 = Object.assign({}, ctx, { shot: ctx.T.shot('S15') });
    await S15.setup(c15);
  },
  render(ctx, fr) {
    const s = c15.shot, fl = list[Math.max(0, Math.min(list.length - 1, fr.f))];
    return S15.render(c15, ctx.T.frameInfo(s, s.f0 + fl));
  },
};
