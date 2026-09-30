// Test harness for S18 (not in the film): renders a chosen list of S18's local frames in one
// Chrome session, so a sheet of stills costs one setup. The list is read from
// out/stills/_P18_list.json ({ "frames": [..], "debug": false }); global frame f picks frames[f].
//   node render/render.mjs _P18 --from 0 --to N-1 --scale 0.5
import S18 from './S18.js';

let list = [0], c18 = null;
export default {
  async setup(ctx) {
    try {
      const r = await fetch('/out/stills/_P18_list.json', { cache: 'no-store' });
      const j = await r.json();
      list = j.frames; globalThis.__P18_DEBUG = !!j.debug; globalThis.__P18_ALL_LABELS = !!j.alllabels;
    } catch (e) { ctx.log(`no list: ${e}`); }
    const s = ctx.T.shot('S18');
    c18 = Object.assign({}, ctx, { shot: s });
    await S18.setup(c18);
    ctx.log(`_P18: ${list.length} frames: ${list.join(' ')}`);
  },
  render(ctx, fr) {
    const s = c18.shot, fl = list[Math.max(0, Math.min(list.length - 1, fr.f))];
    return S18.render(c18, ctx.T.frameInfo(s, s.f0 + fl));
  },
};
