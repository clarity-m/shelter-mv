// The shelter: the final environment Claude builds to shelter people (S31), also used by
// S30 (being assembled) and S32 (the pull-back starts inside it).
//
//   import { createShelter } from '../sets/hill/shelter.js';
//   const sh = createShelter(canvas, { log });            // canvas: any size, 16:9
//   sh.render({ time, crane, build, cityPulse, cam, ... }); // one frame, pure function
//
// time       seconds (motes, clouds, twinkle). Freeze it to hold a breath.
// crane      0..1 along the S31 crane (low behind the pair -> high over their shoulders),
//            ignored when cam is given ({ pos, yaw, pitch, F, pp }).
// build      0..1 assembly: hill rises (0-0.3), tree grows (0.25-0.6), towers rise in a
//            staggered wave (0.2-0.9), the ring draws in (0.6-1). Default 1 (finished).
// figure     show the seated figure (default true when build >= 1).
// cityPulse  0..1 extra window light (S31 drives it with the kicks).
// clawdGlow  multiplier on Clawd's light (default 1).
// lean       0..1 the seated figure leans back and lifts her head (S31, from frame 6002).
// eyes       { dx, dy, open } Clawd's eyes in glyph units (glance) and openness (blink).
// presence   0..1 the far slopes fill with people: tiny figures gather out of the light on the
//            far ridge and kites rise over the slopes beyond the hill. Default 0 (S30 unchanged).
// Any other key is passed through to the hill renderer's state (see hill.js defaultState).
import { createHill, CLAWD_U } from './hill.js';
import { HILL, SKYLINE, FAR_RIDGE, hillH } from './scene.js';
import { SHELTER } from './palettes.js';

const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const lerp = (a, b, t) => a + (b - a) * t;

// where the pair sit: she is at the tree's foot on the side toward the city, Clawd on her right
export const SHELTER_SPOTS = {
  tree: { x: -4.1, z: 9.2 },
  human: { x: -3.35, z: 8.35 },
  clawd: { x: -2.55, z: 8.55 },
};
// the S31 crane: two keys, eased between
export const CRANE = [
  { pos: [-2.1, 1.22, 3.0], yaw: 0.075, pitch: 0.0, F: 1400, pp: [960, 760] },
  { pos: [-2.3, 2.3, 2.45], yaw: 0.08, pitch: -0.07, F: 1400, pp: [960, 760] },
];
export function craneCam(u) {
  const a = CRANE[0], b = CRANE[1], e = ease(u);
  return { pos: a.pos.map((v, i) => lerp(v, b.pos[i], e)), yaw: lerp(a.yaw, b.yaw, e), pitch: lerp(a.pitch, b.pitch, e), F: a.F, pp: a.pp };
}
// seeding for strokes and motes: fixed for any shot that uses the shelter
export const SHELTER_SEEDING = {
  origin: [-2.2, 2.2], yaw: 0.08, halfAngle: 0.8, d0: 1.0, d1: 140, nearTree: 5, nearTower: 95,
  air: { min: [-7, 0.9, 5.2], size: [9, 2.8, 6.5], n: 900, sizePx: 2.0, bright: 0.8 },
};
export const RING = { c: [0, -100, 420], R: 360, n: [0, 0.25, -1], w: 2.2 };

// ---------------------------------------------------------------- the people of the shelter
// Tiny faceless figures on the far ridge (z ~ 61, 60 m out: about 40 px tall) and kites over the
// slopes beyond the hill, their flyers out of sight behind it. All closed-form in time.
const clampP = (v) => Math.min(Math.max(v, 0), 1);
export const FAR_PEOPLE = [
  { x: 2.6, z: 61.3, flip: false },                       // a couple and their child
  { x: 3.2, z: 61.4, flip: true },
  { x: 3.7, z: 61.2, scale: 0.62, flip: true },
  { x: 7.2, z: 61.6, arm: 1, flip: false },               // pointing up at the kites
  { x: 9.6, z: 61.0, walk: 0.22, flip: false },           // walking slowly along the ridge
];
// kites placed in open sky right of the city at the crane's start; their flyers are out of sight
// behind the hill (the strings run down behind it)
export const KITES = [
  { p: [22.0, 15.6, 57.3], end: [14, 0.4, 55], ph: 0.0 },
  { p: [29.3, 23.1, 60.8], end: [19, 0.4, 57], ph: 2.1 },
  { p: [37.0, 14.1, 62.2], end: [26, 0.4, 58], ph: 4.2 },
];
export function shelterPeople(time, presence) {
  if (!(presence > 0)) return { kites: null, people: null };
  const people = FAR_PEOPLE.map((q, i) => {
    const a = clampP(presence * 1.5 - i * 0.1);
    const x = q.x + (q.walk ? q.walk * (time - 342.4) : 0);        // S31 starts at time 342.4
    return { p: [x, q.z], alpha: a, arm: q.arm || 0, scale: q.scale || 1, flip: q.flip,
      walk: q.walk ? [time * 5.2, 0.5] : [0, 0], glow: 0.9 * Math.sin(Math.PI * a) };
  });
  const kites = KITES.map((k, i) => {
    const a = clampP(presence * 1.4 - 0.15 - i * 0.12);
    const up = a * a * (3 - 2 * a);
    const t = time + k.ph;
    const p = [k.p[0] + 0.6 * Math.sin(0.9 * t), k.end[1] + (k.p[1] - k.end[1]) * up + 0.4 * Math.sin(1.3 * t + 1), k.p[2]];
    return { p, end: k.end, angle: 0.13 * Math.sin(1.1 * t + 0.5), tail: 2.6 * t, alpha: a, glow: 0.5 * Math.sin(Math.PI * a) };
  });
  return { kites, people };
}

export function shelterState(o = {}) {
  const build = o.build ?? 1;
  const time = o.time ?? 0;
  const gHill = ease(build / 0.3);
  const hill = HILL.concat([FAR_RIDGE]).map((b) => [b[0] * gHill, b[1], b[2], b[3], b[4]]);
  const gTree = clamp((build - 0.25) / 0.35);
  const towers = SKYLINE.map(([x, z, w, h, taper, cap, rot], i) => {
    const st = 0.2 + 0.6 * ((i * 0.618) % 1);
    const g = easeOut((build - st) / 0.12);
    return { x, z, w, h: h * g, taper, cap: cap * g, rot, lit: 0.5 };
  }).filter((t) => t.h > 0.05);
  const S = SHELTER_SPOTS;
  const showFig = o.figure ?? build >= 1;
  const cy = hillH(hill, S.clawd.x, S.clawd.z);
  const st = {
    rung: 5,
    time,
    cam: o.cam || craneCam(o.crane ?? 0),
    sun: { az: 12, el: 3.2 },
    hill,
    tree: { x: S.tree.x, z: S.tree.z, grow: gTree },
    human: showFig ? { x: S.human.x, z: S.human.z, yaw: 0.35, lean: o.lean || 0 } : null,
    clawd: { x: S.clawd.x, z: S.clawd.z, y: cy, u: CLAWD_U * 0.95, form: 'radiant', sit: 1, glow: o.clawdGlow ?? 1, rays: 0.75, light: 0.9,
      eyes: o.eyes || null },
    ...shelterPeople(time, o.presence || 0),
    towers,
    towerWin: 0.9, towerEdge: 0.55, towerFog: 0.5, cityPulse: o.cityPulse || 0,
    ring: Object.assign({}, RING, { on: ease((build - 0.6) / 0.4) }),
    pal: SHELTER,
    floorGrid: 0.0, grid: 0, fog: 0.017,
    ghost: 0.66, contour: 0.9, contourStep: 0.16, edge: 0.9,
    dome: { mer: 0.12, lat: 0.03, fade: 0.6 },
    moteNear: 3.0, moteRise: 0.8, motes: 1,
    aura: 0.35, exposure: 1.0, vignette: 0.18,
  };
  const own = ['build', 'crane', 'figure', 'cam', 'time', 'cityPulse', 'clawdGlow', 'lean', 'eyes', 'presence'];
  for (const [k, v] of Object.entries(o)) if (v !== undefined && !own.includes(k)) st[k] = v;
  return st;
}

export function createShelter(canvas, opts = {}) {
  const hill = createHill(canvas, { log: opts.log, timing: opts.timing, seeding: Object.assign({}, SHELTER_SEEDING, opts.seeding || {}) });
  return { hill, render: (o) => hill.render(shelterState(o)), state: shelterState };
}

// ---------------------------------------------------------------- S32 seam
// The swarm's bubble (sets/paper-swarm, S32) wants the shelter on a SQUARE canvas with S31's
// last frame filling its centre 80% x 45% and the sky continued to the corners. The renderer
// works at any aspect (design width is always 1920 units), so this is just a wider lens:
//   const sq = document.createElement('canvas'); sq.width = sq.height = 2048;
//   const sh = createShelter(sq, { log });  sh.hill.warm([5]);
//   sh.render(S31_LAST_SQUARE);             // then pass sq as createSwarm's opts.simSource
// S31's acting as a function of its effective frame fe (global frame with the bar-85 hold removed,
// see shots/S31.js): the far slopes fill during bar 81, she leans back on the phrase at 6002, and
// Clawd blinks and twice glances up at her. Its first frame (fe 5771) is S31's opening view exactly
// as before revision 1: presence 0, lean 0, eyes open and centred.
export const S31_F0 = 5771;
const GLANCES = [[5889, 5941], [6021, 6075]];           // glance up at her (fe ranges)
const BLINKS = [5836, 5960, 6080, 6150, 6181];
export function s31Anim(fe) {
  const sm = (a, b, x) => { const t = clampP((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  let g = 0;
  for (const [a, b] of GLANCES) g = Math.max(g, sm(a, a + 5, fe) * (1 - sm(b - 5, b, fe)));
  let open = 1;
  for (const b of BLINKS) { const d = Math.abs(fe - b); if (d < 2.5) open = Math.min(open, d < 1 ? 0 : 0.35 * (d - 0.5)); }
  return {
    presence: sm(S31_F0 + 6, S31_F0 + 80, fe),
    lean: sm(6002, 6044, fe),
    eyes: { dx: -0.85 * g, dy: -0.6 * g, open },
  };
}
export const S31_LAST = Object.assign({ time: 150 + 6189 / 30, crane: 1 }, s31Anim(6189));
export function squareCam(cam, frac = 0.8) {
  return Object.assign({}, cam, { F: cam.F * frac, pp: [960, 960 + (cam.pp[1] - 540) * frac] });
}
export const S31_LAST_SQUARE = Object.assign({}, S31_LAST, { cam: squareCam(craneCam(1)) });
