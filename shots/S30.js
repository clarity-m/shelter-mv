// S30, drop 2 (bars 77-80, frames 5483-5770), rung 5. Revision 10: two beats in, two beats out.
//   bars 77-79: each bar is two beats inside (the build), then two beats outside (the voyage).
//     inside  - Clawds set the hill at the centre of the new world and raise the city behind it:
//               sets/hill's shelter with build 0 -> 1 and no figure. The build only advances while
//               we are inside, a sixth per beat eased onto the kick, so each inside beat shows a
//               visible step: the plain and the hill swelling, the tree, the towers, the ring.
//               Builders beyond counting: the first crew (46) on the hill and a sea of them (about
//               2,550) covering the plain out to the far ridge and the city's feet, small radiant
//               Clawds (the fork's `crowd` option, sets/inside-montage/hillx.js) that hop on the kicks
//               and flare on the chops. Clawd stands and works with them. One long move per bar: the
//               new world from high up; side on to the tree as it grows with the city rising beyond;
//               looking up past the tree as the ring draws across the sky. On each angle any builder
//               that would come out bigger than Clawd is left out, so no Clawd ever gets big.
//     the code - the shelter's own renderer (sets/hill/shelter.js and shots/S31.js, read at setup)
//               lives in the world (hillx `decals`, sets/inside-montage/codeline.js): two rings of it
//               on the ground round the hill, following the slopes, among the builders, and once the
//               habitat's ring draws in, a line of it along the ring's arc across the sky, streaming
//               down into the city. It goes as the builders do, in bar 80's first beat.
//     outside - agent D's voyage (sets/voyage/voyage.js, voyageFrame(view 0-2, t 0-35)): looking
//               back at the Sun; the Sun one star among many; the two stars ahead. The single sail
//               (sets/paper-kit/sail.js) is only a fallback if the voyage fails to load.
//   bar 80 (the turnaround): the finished hill. The builders turn to light (each flares and fades,
//     and the first crew's sparks rise: the fork's `lines` as points), Clawd sits down, and the
//     camera settles to rest exactly on S31's opening view (craneCam(0), S31's clock and glow), so the
//     cut to S31 lands on the same frame with the figure appearing beside him.
import { craneCam, shelterState, SHELTER_SPOTS, SHELTER_SEEDING, RING } from '../sets/hill/shelter.js';
import { hillH, HILL, FAR_RIDGE, camBasis, project } from '../sets/hill/scene.js';
import { createHill, CLAWD_U } from '../sets/inside-montage/hillx.js';
import { readCode, codeAtlas, streamQuads } from '../sets/inside-montage/codeline.js';
import { clamp, lerp, smoothstep, hash } from '../lib/util.js';

const F0 = 5483, BEAT = 18, LAND = 5699;          // shot start, beat length, bar 80's downbeat
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);

let hill, hillCv, voy = null, voyCv = null, sail = null, sailCv = null, g2, W, H, K, ATLAS = null;

// ---------------------------------------------------------------- the clocks
// bars 77-79: inside on beats 1-2 (local 0-35 of each bar), outside on beats 3-4 (local 36-71)
const isInside = (f) => f >= LAND || (f - F0) % 72 < 36;
const segOf = (f) => Math.min(2, Math.floor((f - F0) / 72));
// the build: inside beat b = 0..5 (two per bar) advances it by 1/6, eased from its kick; it holds
// while we are outside
function buildAt(f) {
  if (f >= LAND) return 1;
  const fl = f - F0, seg = Math.floor(fl / 72), in72 = fl - 72 * seg;
  if (in72 >= 36) return (2 * seg + 2) / 6;
  const k = Math.floor(in72 / BEAT), t = in72 - k * BEAT;
  return (2 * seg + k + easeOut((t - 1) / 13)) / 6;
}

// ---------------------------------------------------------------- cameras
const look = (pos, at, F = 1400, pp = [960, 700]) => {
  const d = [at[0] - pos[0], at[1] - pos[1], at[2] - pos[2]];
  return { pos, yaw: Math.atan2(d[0], d[2]), pitch: Math.atan2(d[1], Math.hypot(d[0], d[2])), F, pp };
};
const lerpCam = (a, b, t) => ({ pos: a.pos.map((v, i) => lerp(v, b.pos[i], t)), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t), F: lerp(a.F, b.F, t), pp: [lerp(a.pp[0], b.pp[0], t), lerp(a.pp[1], b.pp[1], t)] });
// one [from, to] pair per inside bar; the camera travels from -> to across its two beats
const ANGLES = [
  // bar 77: the new world from high up: the plain under the dome's threads, the hill swelling, the builders
  [look([2.6, 5.0, -6.4], [-0.6, 0.0, 10.5], 1150), look([1.8, 4.3, -4.4], [-0.6, 0.1, 10.5], 1150)],
  // bar 78: side on to the tree as it grows, the city rising beyond
  [look([-11.0, 1.55, 4.0], [-3.4, 2.2, 10.5], 1300), look([-9.9, 1.75, 5.5], [-3.4, 2.2, 10.5], 1300)],
  // bar 79: looking up past the tree: the ring draws across the sky over the towers
  [look([-0.9, 0.78, 0.2], [2, 54, 150], 1100, [960, 860]), look([-0.4, 0.92, 1.2], [3, 57, 150], 1100, [960, 860])],
];
// bar 80: settle onto S31's first frame (craneCam(0)) from a little further back and higher
const S31_CAM = craneCam(0);
const LAND_FROM = Object.assign({}, S31_CAM, { pos: [S31_CAM.pos[0] + 0.9, S31_CAM.pos[1] + 0.55, S31_CAM.pos[2] - 2.2], pitch: S31_CAM.pitch - 0.03 });

function camAt(f) {
  if (f >= LAND) return lerpCam(LAND_FROM, S31_CAM, easeOut(Math.pow(clamp((f - LAND) / 66), 0.8)));
  const seg = segOf(f), t = (f - F0) - 72 * seg, [a, b] = ANGLES[seg];
  return lerpCam(a, b, ease(t / 35) * 0.85 + 0.15 * t / 35);
}

// ---------------------------------------------------------------- the crowd
// the first crew: a ring of workers around the hill's foot and more on its slopes; deterministic
const S = SHELTER_SPOTS;
// the landing crew: on the slopes the S31 view sees (all smaller on screen than Clawd there), so
// bar 80 shows builders turning to light before the world settles
const LAND_CREW = [[1.0, 12.0], [2.6, 12.2], [4.2, 11.4], [5.6, 12.2], [0.0, 13.0], [-1.0, 12.6], [3.4, 13.6], [-6.4, 12.6]];
const CREW = (() => {
  const out = LAND_CREW.map(([x, z], i) => ({ x, z, ph: hash(i, 23), s: hash(i, 24), crew: true }));
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996 + 0.3, r = 6.4 + 2.4 * hash(i, 1);
    const x = 0.2 + r * Math.cos(a) * 1.25, z = 10.2 + r * Math.sin(a) * 0.9;
    if (out.some((c) => Math.hypot(c.x - x, c.z - z) < 1.2)) continue;
    out.push({ x, z, ph: hash(i, 3), s: hash(i, 4) });
  }
  for (let i = 0; i < 60 && out.length < 46; i++) {
    const a = i * 2.39996 + 1.1, r = 1.7 + 3.4 * Math.sqrt(hash(i, 12));
    const x = r * Math.cos(a) * 1.3, z = 10.4 + r * Math.sin(a) * 0.8;
    if (Math.hypot(x - S.tree.x, z - S.tree.z) < 1.6 || Math.hypot(x - S.clawd.x, z - S.clawd.z) < 1.4) continue;
    if (out.some((c) => Math.hypot(c.x - x, c.z - z) < 1.2)) continue;
    out.push({ x, z, ph: hash(i, 13), s: hash(i, 14) });
  }
  return out;
})();
// revision 9, the sea of builders: rings round the hill's centre out past the far ridge to the city's
// feet, spacing growing with the radius (1.3 m near the hill, about 4 m at the city)
const HC = [0.2, 10.4];
const SEA = (() => {
  const out = [];
  let r = 2.4, ring = 0;
  while (r < 92) {
    const s = 1.25 + 0.034 * r, n = Math.max(6, Math.floor(2 * Math.PI * r / s));
    for (let k = 0; k < n; k++) {
      const a = 2 * Math.PI * (k + 0.8 * hash(ring, k, 31)) / n + 0.37 * ring;
      const rr = r + (hash(ring, k, 32) - 0.5) * 0.8 * s;
      const x = HC[0] + rr * Math.cos(a) * 1.15, z = HC[1] + rr * Math.sin(a);
      if (z > 97 || z < -40) continue;
      if (Math.hypot(x - S.tree.x, z - S.tree.z) < 1.8 || Math.hypot(x - S.clawd.x, z - S.clawd.z) < 1.6 || Math.hypot(x - S.human.x, z - S.human.z) < 1.3) continue;
      if (rr < 12 && CREW.some((c) => Math.hypot(c.x - x, c.z - z) < 1.1)) continue;
      out.push({ x, z, ph: hash(ring, k, 33), s: hash(ring, k, 34), sea: true });
    }
    r += s; ring++;
  }
  return out;
})();
const CROWD = CREW.concat(SEA);
// which builders each angle shows: none wider on screen than maxPx (checked at both ends of the move),
// and none off the frame
const HILL_DONE = HILL.concat([FAR_RIDGE]);
const CLAWD_W = CLAWD_U * 18;
function shown(cams, maxPx) {
  const out = new Set();
  const Bs = cams.map((cam) => camBasis(cam));
  CROWD.forEach((c, i) => {
    const p = [c.x, hillH(HILL_DONE, c.x, c.z) + 0.3, c.z];
    const ok = cams.every((cam, q) => {
      const pr = project(Bs[q], p), z = pr[2];
      if (z <= 0.5) return false;
      const w = cam.F * CLAWD_W / z;
      return w <= maxPx && pr[0] > -w - 40 && pr[0] < 1960 + w && pr[1] > -60 && pr[1] < 1080 + 2 * w;
    });
    if (ok) out.add(i);
  });
  return out;
}
const VIS = ANGLES.map((ab) => shown(ab, 115));
const VIS_LAND = new Set([...shown([LAND_FROM, S31_CAM], 105), ...CROWD.map((c, i) => (c.crew ? i : -1)).filter((i) => i >= 0)]);

// bar 80: each builder turns to light on its own frame across the first two beats
const EXIT0 = LAND + 3;
const exitAt = (c, f) => clamp((f - EXIT0 - 20 * c.s) / 14);

// how far the sight line from the camera to the middle of a builder clears the terrain (m, negative
// when a ridge hides it). Builders fade out smoothly as their middle goes behind a ridge, so one
// behind the crest never shows only its rays poking over the silhouette, and nothing pops.
function clearance(bumps, cam, x, y, z) {
  const [cx, cy, cz] = cam.pos;
  let m = 1e9;
  for (let s = 1; s < 44; s++) {
    const t = s / 48, px = cx + (x - cx) * t, pz = cz + (z - cz) * t, py = cy + (y - cy) * t;
    m = Math.min(m, py - hillH(bumps, px, pz));
  }
  return m;
}

function crowdAt(T, f, bumps, cam) {
  const kick = T.pulse('kicks', f, 4), chop = T.pulse('chops', f, 6), sinceK = T.since('kicks', f);
  const vis = f >= LAND ? VIS_LAND : VIS[segOf(f)];
  const out = [];
  CROWD.forEach((c, i) => {
    if (!vis.has(i)) return;
    const y = hillH(bumps, c.x, c.z);
    const k = f >= LAND ? exitAt(c, f) : 0;
    const alpha = (1 - smoothstep(0.4, 1.0, k)) * smoothstep(-0.02, 0.18, clearance(bumps, cam, c.x, y + 0.3, c.z));
    if (alpha <= 0.002) return;
    const hop = Math.max(0, Math.sin(Math.PI * clamp((sinceK - c.ph * 3) / 8))) * 0.12 * (1 - k);
    out.push({
      x: c.x, z: c.z, y, hop,
      form: 'radiant', sit: 0, rays: 0.8 + 0.3 * kick + 0.5 * Math.sin(Math.PI * k),
      glow: (0.95 + 0.35 * chop * (i % 3 === 0 ? 1 : 0.4)) * (1 + 1.4 * Math.sin(Math.PI * clamp(k * 1.5))),
      alpha,
    });
  });
  return out;
}
// the sparks that rise from each of the first crew as it goes: closed-form in time, drawn as points
// of light. Every one beyond Clawd's line sends its sparks up, so from S31's low view they rise over
// the crest into the sky above the city (the hill hides where they start). (The sea just flares.)
function sparksAt(f, bumps) {
  if (f < EXIT0) return [];
  const out = [];
  CREW.forEach((c, i) => {
    if (c.z < 7.5) return;
    const born = EXIT0 + 20 * c.s + 2, y0 = hillH(bumps, c.x, c.z) + 0.3;
    for (let q = 0; q < 12; q++) {
      const tq = (f - born - 6 * hash(i, q, 5)) / 42;
      if (tq <= 0 || tq >= 1) continue;
      const ang = hash(i, q, 6) * 6.2832, sp = 0.25 + 0.5 * hash(i, q, 7), e = 1 - (1 - tq) * (1 - tq);
      const p = [c.x + Math.cos(ang) * sp * e, y0 + (1.6 + 3.6 * hash(i, q, 8)) * e, c.z + Math.sin(ang) * sp * e];
      const I = (2.4 + 1.6 * hash(i, q, 9)) * Math.pow(1 - tq, 1.3) * clamp(tq * 10);
      out.push([...p, ...p, 3.2, I, 1.0, 0.8, 0.55, 6]);
    }
  });
  return out;
}

// ---------------------------------------------------------------- the code in the world (revision 10)
// Two rings of the shelter's code on the ground round the hill (following the slopes, among the
// builders; the text's top toward the hill, so it reads upright from outside the ring), streaming
// round it; and, once the habitat's ring draws in (build 0.6-1), a line along the ring's arc across
// the sky, just inside it, streaming down its left side into the city. Orange, lower in contrast than
// the world being built. It goes in bar 80's first beat, before the builders turn to light.
const CODE_COL = [1.0, 0.45, 0.2];
const GROUND_RINGS = [{ r: 6.9, gh: 1.25, gw: 0.17, v: 1.1, start: 11 }, { r: 10.6, gh: 1.5, gw: 0.2, v: 1.1, start: 83 }];
const RN = (() => { const n = RING.n, l = Math.hypot(...n); return n.map((v) => v / l); })();
const RE1 = (() => { const c = [RN[1] * 0 - RN[2] * 1, RN[2] * 0 - RN[0] * 0, RN[0] * 1 - RN[1] * 0], l = Math.hypot(...c); return c.map((v) => v / l); })();
const RE2 = [RN[1] * RE1[2] - RN[2] * RE1[1], RN[2] * RE1[0] - RN[0] * RE1[2], RN[0] * RE1[1] - RN[1] * RE1[0]];
const ringPt = (rad, a) => [0, 1, 2].map((i) => RING.c[i] + rad * (Math.cos(a) * RE1[i] + Math.sin(a) * RE2[i]));
const SKY = { gh: 16, gw: 6.6, a0: -168 * Math.PI / 180, a1: -12 * Math.PI / 180, v: 1.0, start: 40 };
function codeQuads(f, st) {
  const fade = 1 - smoothstep(LAND, LAND + 10, f);
  if (!ATLAS || fade <= 0) return null;
  const quads = [], t = (f - F0) / 30, bumps = st.hill, kick = 0.85 + 0.15 * clamp(1 - (f - F0) % 18 / 6);
  const on = (x, z, lift = 0.05) => [x, hillH(bumps, x, z) + lift, z];
  for (const R of GROUND_RINGS) {
    const L = 2 * Math.PI * R.r;
    streamQuads(quads, ATLAS, {
      path: (u) => { const a = u / R.r; return on(HC[0] + R.r * Math.cos(a), HC[1] + R.r * Math.sin(a)); },
      top: (u) => { const a = u / R.r, r2 = R.r - R.gh; return on(HC[0] + r2 * Math.cos(a), HC[1] + r2 * Math.sin(a)); },
      read: 1, head: -L / 2 - 120 - R.v * 30 * R.gw * t, u0: -L / 2, u1: L / 2, gw: R.gw, start: R.start, gap: 5, chunk: 5,
      alpha: () => 1.7 * fade * kick, col: CODE_COL,
    });
  }
  const ringOn = st.ring ? st.ring.on || 0 : 0;
  if (ringOn > 0.01) {
    const rb = RING.R - 5 - SKY.gh, rt = RING.R - 5, u0 = rb * SKY.a0, u1 = rb * SKY.a1;
    streamQuads(quads, ATLAS, {
      path: (u) => ringPt(rb, u / rb), top: (u) => ringPt(rt, u / rb), read: 1,
      head: u0 - SKY.v * 30 * SKY.gw * t + 40, u0, u1, gw: SKY.gw, start: SKY.start, gap: 6, chunk: 4,
      alpha: () => 0.9 * fade * ringOn, col: CODE_COL,
    });
  }
  return quads.length ? { src: ATLAS.canvas, key: ATLAS.key, quads } : null;
}

// ---------------------------------------------------------------- the outside beats
// revision 10: D's voyage, view 0..2 (one per bar), frame 0..35 of it
function renderOutside(ctx, fr) {
  const fl = fr.f - F0, view = Math.min(2, Math.floor(fl / 72)), t = fl - 72 * view - 36;
  if (voy) { voy.voyageFrame(view, t); g2.drawImage(voyCv, 0, 0, W, H); return; }
  renderSail(ctx, fr, view, t);
}
// fallback: the single sail (revision 8)
function renderSail(ctx, fr, j, t) {
  const kick = ctx.T.pulse('kicks', fr.f, 5), e = t / 35, u = (j * 36 + t) / 108;
  const FR = [{ x: [520, 760], y: [640, 590], size: 0.6, rot: -0.18 }, { x: [760, 980], y: [520, 490], size: 1.0, rot: 0.1 }, { x: [980, 1160], y: [600, 550], size: 0.55, rot: 0.05 }][j];
  if (sail) {
    sail.render({ x: lerp(FR.x[0], FR.x[1], e), y: lerp(FR.y[0], FR.y[1], e), size: FR.size, rot: FR.rot + 0.05 * e,
      glow: 0.85 + 0.35 * kick, beam: 0.7, beamAng: 0.35 + FR.rot, off: [-900 * u, 140 * u], unfurl: 1 });
    g2.drawImage(sailCv, 0, 0, W, H);
  } else {                                                   // PLACEHOLDER if both fail to load
    g2.fillStyle = '#07080e'; g2.fillRect(0, 0, W, H);
    g2.fillStyle = '#fff'; g2.font = `${Math.round(28 * K)}px monospace`; g2.fillText('PLACEHOLDER: S30 outside (sets/voyage/voyage.js)', 40 * K, 60 * K);
  }
}

export default {
  async setup(ctx) {
    W = ctx.W; H = ctx.H; K = W / 1920;
    g2 = ctx.canvas.getContext('2d');
    hillCv = document.createElement('canvas'); hillCv.width = W; hillCv.height = H;
    hill = createHill(hillCv, { log: ctx.log, seeding: SHELTER_SEEDING });   // as createShelter does
    hill.warm([5]);
    try {
      const m = await import('../sets/voyage/voyage.js');
      voyCv = document.createElement('canvas'); voyCv.width = W; voyCv.height = H;
      voy = m.createVoyage(voyCv, { k: ctx.scale, log: ctx.log });
    } catch (e) {
      ctx.log('S30: WARNING voyage unavailable, falling back to the sail: ' + (e && e.message)); voy = null;
      try {
        const m = await import('../sets/paper-kit/sail.js');
        sailCv = document.createElement('canvas'); sailCv.width = W; sailCv.height = H;
        sail = m.createSail(sailCv, { k: ctx.scale, log: ctx.log });
      } catch (e2) { ctx.log('S30: sail unavailable, placeholder: ' + (e2 && e2.message)); sail = null; }
    }
    const code = await readCode(['/sets/hill/shelter.js', '/shots/S31.js'], ctx.log);
    ATLAS = code.length ? codeAtlas(code, { px: 40 }) : null;
    if (!ATLAS) ctx.log('S30: WARNING no code in the world (could not read the shelter\'s files)');
    ctx.log(`S30: crowd ${CROWD.length} (crew ${CREW.length}, sea ${SEA.length}), per bar ${VIS.map((v) => v.size).join(' ')}, landing ${VIS_LAND.size}; code lines ${code.length}`);
  },
  render(ctx, fr) {
    const { T } = ctx, f = fr.f;
    if (!isInside(f)) { renderOutside(ctx, fr); return; }
    const build = buildAt(f);
    const cam = camAt(f);
    const gHill = ease(build / 0.3);
    // in bar 80 Clawd breathes with the voice exactly as S31.js does, so the cut matches
    const glow = f >= LAND ? 1.0 + 0.12 * (T.envSmooth('vocals', f, 5) - 0.5) : 1.0 + 0.25 * T.pulse('kicks', f, 6);
    const st = shelterState({
      time: 150 + f / 30, build, figure: false, cam,
      cityPulse: f >= LAND ? 0 : 0.4 * T.pulse('kicks', f, 5),
      floorGrid: 0.7 * (1 - gHill),
      clawdGlow: glow,
    });
    // Clawd works standing (hopping on the kicks with the rest) and sits down once it is built
    st.clawd.sit = f >= LAND ? ease((f - LAND - 22) / 20) : 0;
    if (f < LAND) st.clawd.hop = 0.1 * Math.max(0, Math.sin(Math.PI * clamp(T.since('kicks', f) / 8)));
    st.crowd = crowdAt(T, f, st.hill, cam);
    const sp = sparksAt(f, st.hill);
    if (sp.length) st.lines = sp;
    const dc = codeQuads(f, st);
    if (dc) st.decals = dc;
    hill.render(st);
    g2.drawImage(hillCv, 0, 0, W, H);
  },
};
