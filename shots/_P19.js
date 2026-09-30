// Test harness for S19 (not in the film): renders the S19 local frames listed in
// out/stills/_P19_list.json in one Chrome session; global frame f picks frames[f].
//   node render/render.mjs _P19 --from 0 --to N-1 [--scale 0.5]
import S19 from './S19.js';

let list = [0], c19 = null;
export default {
  async setup(ctx) {
    try { const r = await fetch('/out/stills/_P19_list.json', { cache: 'no-store' }); list = (await r.json()).frames; } catch (e) { ctx.log(`no list: ${e}`); }
    c19 = Object.assign({}, ctx, { shot: ctx.T.shot('S19') });
    await S19.setup(c19);
    ctx.log(`_P19: ${list.length} frames: ${list.join(' ')}`);
  },
  render(ctx, fr) {
    const s = c19.shot, fl = list[Math.max(0, Math.min(list.length - 1, fr.f))];
    return S19.render(c19, ctx.T.frameInfo(s, s.f0 + fl));
  },
};
