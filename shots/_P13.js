// Test harness for S13 (not in the film): renders the S13 local frames listed in
// out/stills/_P13_list.json in one Chrome session; global frame f picks frames[f].
import S13 from './S13.js';
let list = [0], c13 = null;
export default {
  async setup(ctx) {
    try { const r = await fetch('/out/stills/_P13_list.json', { cache: 'no-store' }); list = (await r.json()).frames; } catch (e) { ctx.log(`no list: ${e}`); }
    c13 = Object.assign({}, ctx, { shot: ctx.T.shot('S13') });
    await S13.setup(c13);
  },
  render(ctx, fr) {
    const s = c13.shot, fl = list[Math.max(0, Math.min(list.length - 1, fr.f))];
    return S13.render(c13, ctx.T.frameInfo(s, s.f0 + fl));
  },
};
