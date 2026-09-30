// Test harness for S14 (not in the film): renders the S14 local frames listed in
// out/stills/_P14_list.json in one Chrome session; global frame f picks frames[f].
import S14 from './S14.js';
let list = [0], c14 = null;
export default {
  async setup(ctx) {
    try { const r = await fetch('/out/stills/_P14_list.json', { cache: 'no-store' }); list = (await r.json()).frames; } catch (e) { ctx.log(`no list: ${e}`); }
    c14 = Object.assign({}, ctx, { shot: ctx.T.shot('S14') });
    await S14.setup(c14);
  },
  render(ctx, fr) {
    const s = c14.shot, fl = list[Math.max(0, Math.min(list.length - 1, fr.f))];
    return S14.render(c14, ctx.T.frameInfo(s, s.f0 + fl));
  },
};
