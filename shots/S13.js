// S13, drop 1 (bars 33-36), revision 14: the humans build his first open world. On the bar-33
// downbeat Clawd's flat glyph extrudes into a solid (the first frame is S12's hand-off). Then the
// humans' indigo paper cursor (S10, S11, S18) builds the valley around him alone, one click per kick,
// each with a typed line in S10's paper label: the ground, hills, the river, boulders, the far ground,
// a ridge, the mountains, the dusk sky, the low sun, clouds, the other agents, the spawn, warm light;
// then it picks him (`agent = clawd`) and types `train()` on the last kick, into S14's episodes.
// Each piece appears grey, unlearned, where it clicks (land in discs, sweep.js; boulders and agents
// through the props gate). Clawd waits on the pad and watches with his eyes (S11's rule): glances
// at the cursor, a blink, one small start when it picks him, one small hop at train(). The camera
// only drifts back and up; the clicks carry the music. The stutter-stop on 33.4 holds the frame.
import { makeStage, freezeOf, motionFrames, eventsIn, clamp, lerp, ss, easeInOut, easeOut, easeOutBack } from '../sets/valley/shotkit.js';
import { drawHUD } from '../sets/valley/hud.js';
import { NEUTRAL, solidGrid } from '../sets/valley/clawd3d.js';
import { GRIDS } from '../sets/hill/clawd-pose.js';
import { createPaperCursor, PAPER } from '../sets/valley/papercursor.js';
import { projectPx, camBasis } from '../sets/valley/valley.js';
import { makeSweep } from '../sets/valley/sweep.js';
import { swoopAt } from '../sets/valley/swoop.js';

let St, CUR, CL;
const G = {}; for (const k of Object.keys(GRIDS)) G[k] = solidGrid(GRIDS[k]);
const TINY = 0.001;
// the clicks (local frames: the kicks of bars 33-36) and what each makes; `p` is where it clicks
const CLICKS = [
  { at: 1, code: 'ground.raise()', p: [1.3, 0.05, 1.1] },            // revision 19: on 33.1, with the extrusion: the shock wave
  { at: 19, code: 'hill.add()', p: [22, 0, -30], disc: 20 },
  { at: 37, code: 'hill.add()', p: [-24, 0, -32], disc: 20 },
  { at: 55, code: 'hill.add()', p: [-4, 0, -66], disc: 22 },
  { at: 73, code: 'river.carve()', p: [20, 0, -44], disc: 21 },
  { at: 91, code: 'rocks.scatter(24)', p: [-2, 0, -14], rocks: true },     // (revision 15: no trees before his sapling)
  { at: 104, code: 'ground.extend(120)', p: [12, 0, -90], R: 120 },
  { at: 127, code: 'ridge.add()', p: [0, 0, -175], disc: 62 },
  { at: 145, code: 'mountains.raise()', p: [-60, 40, -900], R: 3300 },
  { at: 163, code: 'sky.set(dusk)', p: [30, 160, -500], sky: true },
  { at: 172, code: 'sun.set(low)', p: [-40, 110, -500], sun: true },
  { at: 181, code: 'clouds.add(4)', p: [60, 120, -500], clouds: true },
  { at: 199, code: 'agents.add(34)', p: [-18, 0, -40], agents: true },
  { at: 216, code: 'spawn.set(pad)', p: [0.9, 0.1, 0.6], ring: true },
  { at: 235, code: 'light.warm()', p: [-30, 90, -500], warm: true },
  { at: 248, code: 'agent = clawd', p: [0.64, 0.8, 0.1], pick: true },    // (on his top corner, clear of his face)
  { at: 271, code: 'train()', p: [0.66, 0.8, 0.1], train: true },
];
const since = (fe, c) => fe - c.at;
const typeLen = (c) => Math.max(5, Math.min(9, Math.round(c.code.length / 1.9)));

export default {
  async setup(ctx) {
    St = makeStage(ctx);
    CUR = createPaperCursor(23);
    CL = CLICKS.map((c) => Object.assign({}, c, { at: c.at }));
    ctx.log(`S13: ${CL.length} clicks`);
  },
  render(ctx, fr) {
    const { T } = ctx, s = ctx.shot;
    const LEN = T.data().events.stop_len;
    const fz = freezeOf(T, fr.f);
    const fl = fr.fl;
    // the stutter-stop on 33.4 holds the frame (everything waits on the frozen frame)
    const stop = fz.stop >= s.f0 ? fz.stop : -1e9;
    const k = fr.f - stop, held = k >= 0 && k < LEN;
    const fe = held ? stop - s.f0 : fl;                     // effective local frame
    const m = motionFrames(T, s.f0, fr.f);                  // motion time (paused in the stop)
    const at = (c) => since(fe, c);
    const done = (c, len) => easeOut(clamp(at(c) / len));
    // --- the land: the first ring under him on the downbeat, then the radial extensions
    // (the front's width is a function of its radius only, never less than the first ring's, so the
    // rise mask only ever grows and a new extension never lowers land that has already risen; the
    // crest travels with the front and scales with its radius, so it never reaches the near field)
    // revision 19: the first click punches the flat field into 3D: a ring of facets races out from him
    // like a shock wave, its crest high at first and settling as it goes (frame 0 is S12's hand-off)
    let R = 0.4 + 44 * easeOut(clamp((fe - 1) / 16)), crest = fe >= 1 ? 1.7 * Math.exp(-(fe - 1) / 6) * ss(0, 2, fe - 1) : 0;
    for (const c of CL) {
      if (!c.R || at(c) < 0) continue;
      const R0 = R, u = done(c, c.R > 1000 ? 18 : 14);
      R = lerp(R0, c.R, u); crest = (0.45 + 0.012 * R) * Math.exp(-at(c) / 7) * ss(0, 3, at(c));
    }
    const w = Math.max(2.2 + 0.32 * 6.1, 2.2 + 0.1 * R);
    // the discs, each where it was clicked (a zero-width thread between them: sweep.js discs)
    const pts = [];
    for (const c of CL) {
      if (!c.disc || at(c) < 0) continue;
      const r = c.disc * easeOut(clamp(at(c) / 10));
      pts.push([c.p[0], c.p[2], TINY], [c.p[0], c.p[2], Math.max(TINY, r)], [c.p[0], c.p[2], TINY]);
    }
    const sweep = pts.length >= 2 ? makeSweep(pts, 1e6, 1, 0) : null;
    const byKey = (key) => CL.find((c) => c[key]);
    const cT = byKey('rocks'), cA = byKey('agents'), cSky = byKey('sky'), cSun = byKey('sun'), cCl = byKey('clouds');
    const cRing = byKey('ring'), cWarm = byKey('warm'), cPick = byKey('pick'), cTrain = byKey('train');
    const treesR = at(cT) < 0 ? 0 : 95 * easeInOut(clamp(at(cT) / 16));
    const agentsR = at(cA) < 0 ? 0 : 320 * easeInOut(clamp(at(cA) / 16));
    const skyWhite = 1 - easeInOut(clamp(at(cSky) / 12));
    const sunK = easeInOut(clamp(at(cSun) / 12));
    // --- the extrusion on the downbeat
    const depth = 4 * easeOutBack(fl / 9, 1.9);
    // --- camera: S12's hand-off (1.572 m up, 8.516 m back, 40 deg), drifting slowly back and up to
    // take in the valley being built behind him
    const u = easeInOut(clamp(m / 286));
    const az = lerp(0, 7, u) * Math.PI / 180, dcam = lerp(8.516, 14.5, u), hcam = lerp(1.572, 4.4, u);
    const cam = { pos: [Math.sin(az) * dcam, hcam, Math.cos(az) * dcam], look: [0, lerp(0.375, 1.0, u), lerp(0, -12, u)], fovy: 40 };
    const B0 = camBasis(cam, 1920, 1080);
    // (revision 15: a click on the ground sits on the finished land's surface, never under it)
    const scr = (p) => projectPx(B0, p[1] < 0.05 && Math.hypot(p[0], p[2]) > 2 ? [p[0], Math.max(0, St.V.heightAt(p[0], p[2])) + 0.3, p[2]] : p);
    // --- where the cursor is, and what it is doing (screen px, 1920 wide)
    let active = CL.findIndex((c, i) => fe < c.at + (i === 0 ? 12 : 4)); if (active < 0) active = CL.length - 1;
    const cursorAt = (ff) => {
      // it comes down from above in the first beat, then glides to each click point in turn
      let i = 0; while (i < CL.length - 1 && ff >= CL[i].at + 2) i++;
      const c = CL[i], prev = i ? CL[i - 1] : null;
      const tgt = scr(c.p), from = prev ? scr(prev.p) : tgt;            // (the first click: it is there on the downbeat)
      const t0 = prev ? prev.at + 2 : 4, t1 = c.at - 2;
      const e = easeInOut(clamp((ff - t0) / Math.max(4, t1 - t0)));
      const cl = (q) => [clamp(q[0], 110, 1800), clamp(q[1], 120, 990)];
      const A2 = prev ? cl(from) : from, B2 = cl(tgt);
      return { x: lerp(A2[0], B2[0], e), y: lerp(A2[1], B2[1], e) - (prev ? 60 * Math.sin(Math.PI * e) : 0), c, tx: B2[0], ty: B2[1] };
    };
    const cur = cursorAt(fe);
    // revision 20: it swoops in (from S12's last beat) and lands on the first click, 33.1
    const swp = swoopAt(fr.f);
    if (swp && !swp.done) { cur.x = swp.x; cur.y = swp.y; cur.rot = swp.rot; }
    // after train() it withdraws, up and away, so S14 opens on him alone
    const away = easeInOut(clamp((fe - 276) / 11));
    cur.x += 520 * away; cur.y -= 760 * away;
    // --- his eyes: toward the cursor (per click, so they settle), a blink now and then
    const hs = scr([0, 0.45, 0]);
    const eyesFor = (x, y) => (y < hs[1] - 260 ? (x < hs[0] - 200 ? 'left' : x > hs[0] + 200 ? 'right' : 'lookUp') : x < hs[0] - 90 ? (y > hs[1] + 40 ? 'downLeft' : 'left') : x > hs[0] + 90 ? (y > hs[1] + 40 ? 'downRight' : 'right') : 'down');
    let pose = 'neutral', squash = 1, dy = 0, glow = 1;
    if (fe >= 12) { const c = CL[active], t = scr(c.p); pose = eyesFor(t[0], t[1]); }
    for (const b of [44, 118, 190, 262]) if (fe >= b && fe < b + 3) pose = 'blink';
    // picked: a small start and a look up at it, then a glad face; train(): one small hop
    if (at(cPick) >= 0 && at(cPick) < 20) { pose = at(cPick) < 5 ? 'surprised' : 'lookUp'; squash = 1 - 0.05 * Math.exp(-at(cPick) / 3) * ss(0, 1, at(cPick)); glow += 0.8 * Math.exp(-at(cPick) / 10); }
    if (at(cPick) >= 20 && at(cTrain) < -6) pose = 'happy';
    if (at(cTrain) >= -6) {
      const t = at(cTrain) + 6, len = 14, uu = t / len;
      if (uu < 1) { pose = ['hopSquash', 'hopStretch', 'hopApex', 'hopFall', 'hopSquash'][Math.min(4, Math.floor(uu * 5))]; dy = 0.22 * Math.sin(Math.PI * clamp((uu - 0.14) / 0.72)); }
      else pose = 'neutral';
    }
    const grid = fe < 12 ? NEUTRAL : pose === 'neutral' ? NEUTRAL : G[pose];
    // --- the paint: only the pad's own patch (he has learned nothing yet)
    const rings = [];
    if (at(cRing) >= 0 && at(cRing) < 26) { const t = at(cRing); rings.push([0, 0, 0.8 + t * 0.6, 0.9 * Math.exp(-t / 9)]); }
    if (at(cTrain) >= 0 && at(cTrain) < 20) { const t = at(cTrain); rings.push([0, 0, 0.8 + t * 0.6, 0.8 * Math.exp(-t / 8)]); }
    const P = {
      cam, time: fr.t,
      rise: { R, w, crest, c: [0, 0] }, sweep, greyK: 0.84,
      skyWhite,
      propGate: [cT.p[0], cT.p[2], treesR, agentsR],
      hideAgents: at(cA) < 0,
      cloudK: easeInOut(clamp(at(cCl) / 12)),
      learn: { spawn: [0, 0, lerp(0, 4.5, ss(0, 60, fl)) + 3 * easeOut(clamp(at(cTrain) / 12)), 1.2] },
      clawd: { x: 0, z: 0, y: dy, yaw: 0, depth, grid, squash, glow },
      shadow: { c: [0, 0, lerp(8, -10, u)], r: 45 },
      key: [22, 26], sun: [11, 2.4],
      vig: lerp(0.0, 1, 1 - skyWhite), rays: 0.75 * (1 - skyWhite) * sunK, grade: 1 - skyWhite, glow: 1 - 0.8 * skyWhite,
      bloomThr: lerp(0.8, 0.97, skyWhite),
      warm: 0.3 * easeInOut(clamp(at(cWarm) / 14)),
      rewind: held && k < 2 ? 0.25 : 0,
      rings,
    };
    const info = St.V.render(P);
    const g = St.g2; g.drawImage(St.glc, 0, 0);
    // --- the humans' cursor and its label (S10's paper panel), over the world; Clawd stays in front
    const kc = ctx.W / 1920;
    g.save(); g.setTransform(kc, 0, 0, kc, 0, 0);
    const c = CL[active], prevAt = active ? CL[active - 1].at + (active === 1 ? 12 : 4) : -10, t0 = Math.max(c.at - typeLen(c) - 1, prevAt);
    const open = easeOut(clamp((fe - t0 + 2) / 3)) * (1 - easeInOut(clamp((fe - c.at - (active === 0 ? 8 : 1)) / 4)));
    if (fe >= 1 && open > 0.001) {
      // (revision 19: the panels 1.75x, readable at phone size; papercursor.js's default is unchanged)
      const tq = cursorAt(c.at), PS = 1.75, pw = PS * (c.code.length * 12.2 + 44);
      const px = clamp(tq.tx + 64, 20, 1900 - pw), py = clamp(tq.ty + 48, 30 + 25 * PS, 1050 - 25 * PS);
      g.save(); g.translate(px, py); g.scale(PS, PS);
      CUR.panel(g, 0, 0, c.code, { open, typed: clamp((fe - t0) / Math.max(3, Math.min(typeLen(c), c.at - t0 - 1))), caret: fe < c.at, flash: Math.exp(-Math.pow((fe - c.at) / 4, 2)) * (fe >= c.at - 2 ? 1 : 0) });
      g.restore();
    }
    if (fe >= 0 && away < 1) {
      const press = CL.reduce((acc, cc) => Math.max(acc, at(cc) >= 0 && at(cc) < 8 ? Math.exp(-at(cc) / 3) : 0), 0);
      // (revision 15: the humans' cursor is always drawn whole, on top of the world)
      CUR.draw(g, cur.x, cur.y, { s: 2.0, press, rot: cur.rot === undefined ? -0.06 : cur.rot, fill: PAPER.slate, bs: 2.0 * kc / 1.45 });
    }
    g.restore();
    // HUD: nothing to count until the sky is there; train() starts episode 1
    const trained = at(cTrain) >= 0;
    if (trained) drawHUD(g, St.k, { episode: 1, reward: 0, step: Math.max(0, at(cTrain)) * 4, pop: 1 - ss(2, 16, at(cTrain)), tick: 1 - ss(2, 16, at(cTrain)), a: ss(0, 3, at(cTrain)), dark: 0 });
  },
};
