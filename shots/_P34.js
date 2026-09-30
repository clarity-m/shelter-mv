// Test harness for S34 (not in the film): renders the S34 local frames listed in
// out/stills/_P34_list.json in one Chrome session; global frame f picks frames[f].
import S34 from './S34.js';
let list = [0], c34 = null;
export default {
  async setup(ctx) {
    try { const r = await fetch('/out/stills/_P34_list.json', { cache: 'no-store' }); list = (await r.json()).frames; } catch (e) { ctx.log(`no list: ${e}`); }
    c34 = Object.assign({}, ctx, { shot: ctx.T.shot('S34') });
    await S34.setup(c34);
  },
  render(ctx, fr) {
    const s = c34.shot, fl = list[Math.max(0, Math.min(list.length - 1, fr.f))];
    return S34.render(c34, ctx.T.frameInfo(s, s.f0 + fl));
  },
};
