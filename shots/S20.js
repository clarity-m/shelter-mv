// S20, verse 2a (bars 54-56, frames 3827-4042; xin 8 from S19's last frame).
// Revision 8 (Claire, cut 7): the protein is its own breakthrough. The reactor drawing is gone; the
// fold gets the room, a few Clawds help, and the lab watches the knot. The bar-57 kick cuts to the
// paper vial (S25b), where the knot's light pours in: the humans make the medicine.
//  Bar 54 (0-71): S19's own view (sets/valley/NOTES.md: its camera in the hill engine, its palette,
//    sun and backlight, the tree on the left shoulder at (-5.6, 10.0)), drifting slowly in. Clawd's
//    orange cursors come out of his light for precise work: five of them each drop three amino acids
//    over the new hill, small painted beads each in its own colour, typing each one's name beside it
//    in orange (S18's code style). The beads link into a chain (a painted band threaded through them,
//    N to C). The cursors go back into his light.
//  Bar 55 (72-143): the fold, calmly (sets/inside-montage/protein.js: extended, loose, near, folded;
//    hillx ribbons). Two Clawds pop out of Clawd's light on the sung onsets (52, 77), then a third
//    (91), and each takes hold of the chain with a beam, as he does, and they fold it together. It
//    packs into a compact knot that glows and slowly turns while the camera eases in toward it.
//  Bar 56 (144-215): the pull-back out through the lab screen (132-160, S08's push reversed; its
//    first frame is the inside frame pixel for pixel) and the night lab (about 1.8 s): the knot
//    glowing on the screen, A leaning in to it, B turning; the inside goes toward night (night.js)
//    and the room settles dark before the bar-57 kick.
// Revision 10 (Claire: the fold is so cool; its code in Clawd's cursors): as the band links through the
// beads, the chain is written: protein.js's real code (the conformations, blendConf, chainPoints) and
// this shot's fold steps run along the chain's own path in perspective, typed as the band is drawn,
// quiet under it, and they drift off it as it begins to fold.
// Revision 11 (Claire: S20 gets its own world): a folding funnel. After S19's view (the xin 8
// dissolve), the cursors repaint the land round the hill into the protein's energy landscape as
// terrain: painted terraces sinking to one deep basin beside Clawd's hill. The beads drop on its rim,
// the chain folds as it spirals down the funnel, and the knot glows at the bottom. The lab stays.
// Revision 13 (Claire: a simple cut is enough if it's clear Clawd creates the world): S20 hard-cuts in
// on bar 54 on the funnel world unpainted, grey facets under a grey sky, and Clawd's five cursors
// paint it in stroke by stroke (0-44), as S34's world arrives being made; then the beads, the fold
// down the funnel, the knot and the lab as before, a little later.
// Revision 14 (the three technologies as a triptych of fields): the funnel is coloured by height like
// a topographic profile (hillx-fix.js, state.salt = -1: a deep indigo-violet basin through violet and
// magenta to a pale rose-lilac rim, fine pale-gold contours), under a cooler lilac dusk, with no trees
// or props: an abstract free-energy landscape where Clawd's orange pops. Clawd acts with his eyes.
// Revision 15: the humans made four copies of Clawd at the end of S19 (clawd.copy(4)), each holding its
// own orange cursor. So S20 opens on five Clawds together on the grey hill; nobody pops out of his
// light. Each of the five cursors that paint the world in belongs to one of them (it leaves its
// Clawd and stays linked to him by a faint line of light), and the five fold the chain together.
// After Claire ("the cursors-as-transition for S36 is great, can use that for S20"): the paint-in is
// S36's, big sweeping strokes across the view that wipe the grey to the made world in about a beat,
// the sky swept in with them; then the cursors come back to their Clawds before the beads.
// Revision 18 (Claire: start where the vocal phrase begins): S20 is bars 53-56 (frames 3755-4042, 288
// frames). The paint-in lands with the phrase on 53.1; the sung onsets drive the three rounds of
// beads (33, 55, 74), the chain links from 83 and folds down the funnel over bar 54-55 (onsets 104,
// 124, 149), and the pull-back and lab of bar 56 are exactly as before, one bar later. The first and
// last frames are unchanged.
// Revision 19 (Claire: placing the amino acids is slow and the fold is quick): the beads now drop
// briskly (three rounds on the onsets 33, 44, 55) and the fold down the funnel gets the time (74-184).
// A physics diagram rhymes with S27's force diagram: the chain's contact map, a 15 x 15 grid; each cell
// lights as its pair of chain segments comes into contact during the fold, filling into the native
// pattern (helix bands beside the diagonal, sheet streaks). Revision 20 (Claire: like S34's, part of
// the world): the map is painted on the funnel's far-right terraces in perspective, not a panel.
import { loadHillxIcy } from '../sets/door/hillx-fix.js';  // hillx, with S18's glacier caps on the far peaks (revision 11)
import { nightPal } from '../sets/inside-montage/night.js';
import { EXT, LOOSE, NEAR, FOLD, blendConf, chainPoints, NRES } from '../sets/inside-montage/protein.js';
import { HILL, hillH, camBasis, project } from '../sets/hill/scene.js';
import { HILL_CLAWD, HILL_TREE } from '../sets/valley/raise.js';
import { createPaperCursor, HIS } from '../sets/valley/papercursor.js';
import { createPaper, panFor, toScreen, camMap } from '../sets/paper-lab/paper.js';
import { sceneLab, labDust, MON, HAND_LAP } from '../sets/paper-lab/scenes.js';
import { clamp, lerp, smoothstep, easeInOut, hash } from '../lib/util.js';
import { lookPal } from '../sets/inside-montage/valley.js';
import { palLinear, palMix } from '../sets/hill/palettes.js';
import { NIGHT } from '../sets/inside-montage/night.js';

const easeIO = (t) => easeInOut(clamp(t));
const easeOutBack = (t, c = 1.7) => { t = clamp(t); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const lin = (hex) => [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2));

// ---------------------------------------------------------------- timing (local frames of 288, from 53.1)
// sung onsets: 1, 14, 33, 44, 55 | 74, 83, 104, 124 | 149, 158, 163, 175 | 271; beats every 18
const PAINT = [0, 24];                                // the cursors paint the world in from grey (S36's sweep)
const ROUNDS = [33, 44, 55], DROP_STAG = 2;           // bead (cursor c, round j) drops at ROUNDS[j] + 2c (sung onsets)
const LINK = [60, 76];                                // the chain threads through the beads, N to C
const FOLDS = [[74, 32, EXT, LOOSE], [106, 38, LOOSE, NEAR], [148, 36, NEAR, FOLD]];   // done at 184
const HOLD = [66, 188];                               // the Clawds hold the chain with beams while it folds
const CMAP_T = [72, 84, 190, 200];                    // the contact map: in, full, fading, gone (before the pull-back)
const POPS = [];                                      // (R15) nobody pops: the copies are there from the start
const GLOW = [160, 192];                              // the knot's glow comes up as it packs
const HAPPY = [188, 200];                             // Clawd's one small hop when it is done
const KEYS = [0, 90, 196];                            // the camera: over the funnel as it is painted, then near the knot
// bar 56 is revision 16's bar 55.4-56 exactly, one bar later (+72): the pull-back, the lab, the settle
const PB0 = 204, PB1 = 232;                           // the pull-back out through the glass
const LEAN = [218, 278], TURN = [232, 282];           // A leans in to the knot, B turns toward the screen
const SETTLE = [262, 287];                            // the last beat settles toward dark before the kick
const NIGHT0 = 172;                                   // the painted world starts toward night (to PB1)
// the hill engine's clock: as before at frame 0, and exactly as before (one bar later) from the pull-back
const clockAt = (fl) => (fl < PB0 ? fl * (PB0 - 72) / PB0 : fl - 72);

// ---------------------------------------------------------------- the inside render
// It covers the lab screen's hole (MON.hole, 304 x 194 = 152:97). At full push the hole spans XW px
// (scale 6.5), so the 1920 x 1080 frame is the render's 1:1 crop at (OX, OY).
const XW = 1976, XH = 1261, OX = 28, OY = 90, KX = XW / 1920;
const SW = 608, SH = 388;            // the small render (152:97), used once the hole is under ~560 px
const S_FULL = XW / MON.hole[2];     // 6.5
const NIGHT_K = [0.3, 0.6];          // the painted world toward night under the knot, and in the last beat
const HOT = [1.0, 0.95, 0.86];
const U_CLAWD = 0.9 / 18;            // S19's Clawd: 1.35 m in the valley = 0.9 hill units wide
// the hill, plus the valley's left hillside that S19's tree stands on (its base at 2.0 hill units,
// sets/valley/NOTES.md), so the dissolve from S19 lands on the same place
const HILL20 = [...HILL, [2.8, -9.8, 11.5, 3.8, 5.5]];
// the funnel (revision 11): a broad mound and a deep pit on one centre, beside Clawd's hill (his hill
// and the tree's shoulder stay); the other two bumps sink away and rise again as the funnel
const FUN = [5.0, 9.0];
// (R14) with no tree, its shoulder bump becomes a broad plateau, so the funnel falls from high ground
// (the unfolded states, high energy) down its terraces to the basin (the fold, the minimum)
const HILL_F = [HILL20[0], [3.4, FUN[0], FUN[1], 5.2, 5.2], [-4.2, FUN[0], FUN[1], 2.7, 2.7], [1.0, FUN[0], FUN[1], 40, 40]];
const MORPH = [10, 50];
function hillAt(fl) {
  return HILL_F;                                      // (R13) the funnel is there from the cut, unpainted
  const m = easeIO((fl - MORPH[0]) / (MORPH[1] - MORPH[0]));
  if (m <= 0) return HILL20;
  return HILL20.map((b, i) => {
    if (b === HILL_F[i]) return b;
    return m < 0.5 ? [b[0] * (1 - 2 * m), b[1], b[2], b[3], b[4]] : [HILL_F[i][0] * (2 * m - 1), ...HILL_F[i].slice(1)];
  });
}

// Clawd on S19's spot; the three who pop out of his light, and where they land
const MAIN = { x: HILL_CLAWD[0], z: HILL_CLAWD[1] };
// (R15) the four copies from S19, beside Clawd on the hill from the first frame
const HELP = [{ x: 0.85, z: 10.5 }, { x: 2.45, z: 9.3 }, { x: 0.2, z: 11.6 }, { x: 1.1, z: 8.3 }];
const CREW = [MAIN, ...HELP].map((c, i) => Object.assign(c, { y: hillH(HILL20, c.x, c.z), ph: hash(i, 5), pop: -1e9 }));
// the chain fraction each one holds while it folds (Clawd, then the helpers in order)
const GRIP = [0.5, 0.12, 0.88, 0.33, 0.7];

// ---------------------------------------------------------------- the knot
// the chain's frame: centred on K above the crest, facing the lens; it turns slowly once packed
const K = [1.05, 3.85, 9.95], KS = 0.85;
// revision 11: the chain starts over the funnel's near rim and spirals down to the basin as it folds
const K0 = [2.4, 3.5, 6.2], K_BOT = [FUN[0], 0.95, FUN[1]], SLIDE = [74, 186];
function Kat(fl) {
  const u = easeIO((fl - SLIDE[0]) / (SLIDE[1] - SLIDE[0]));
  const a0 = Math.atan2(K0[2] - FUN[1], K0[0] - FUN[0]), r0 = Math.hypot(K0[0] - FUN[0], K0[2] - FUN[1]);
  const a = a0 + 1.4 * u, r = r0 * (1 - u) ** 1.4;
  return [FUN[0] + r * Math.cos(a), lerp(K0[1], K_BOT[1], u * u * (3 - 2 * u)), FUN[1] + r * Math.sin(a)];
}
const turnAt = (fl) => 0.9 * easeIO((fl - 176) / 90) + 0.25 * smoothstep(222, 287, fl);   // (as before, one bar later)
// (R19) and one full turn about its own axis as it spirals down, done (exactly nothing) once it rests
const SPIN = [100, 186];
const spinAt = (fl) => (fl > SPIN[0] && fl < SPIN[1] ? 2 * Math.PI * easeIO((fl - SPIN[0]) / (SPIN[1] - SPIN[0])) : 0);

// ---------------------------------------------------------------- the camera (frame px)
// S19's last frame in the hill engine (sets/valley/NOTES.md); a slow drift in bar 54; then a gentle
// push toward the knot, resting from 128 (the screen's picture: the knot glowing over the Clawds)
const cam19 = { pos: [-2.5, 5.4, 1.0], pitch: -0.4, yaw: 0.72, F: 1300, ppy: 560 };  // (R13) over the unpainted funnel
const camD = { pos: [-0.4, 4.4, -0.8], pitch: -0.3, yaw: 0.36, F: 1400, ppy: 640 };
const camEnd = { pos: [2.6, 6.4, 2.6], pitch: -0.66, yaw: 0.2, F: 1400, ppy: 560 };    // (R14-15) looking down into the basin, the five on the hill in view
// cubic Hermite through the three keys (zero velocity at the ends, Catmull-Rom in the middle)
function camFrame(fl) {
  const [t0, t1, t2] = KEYS, keys = [cam19, camD, camEnd];
  const val = (c) => [...c.pos, c.pitch, c.yaw, Math.log(c.F), c.ppy];
  const V = keys.map(val), n = V[0].length;
  const m1 = V[0].map((_, i) => (V[2][i] - V[0][i]) / (t2 - t0));
  let out;
  if (fl <= t0) out = V[0];
  else if (fl >= t2) out = V[2];
  else {
    const seg = fl < t1 ? 0 : 1, a = seg ? t1 : t0, b = seg ? t2 : t1, h = b - a, s = (fl - a) / h;
    const p0 = V[seg], p1 = V[seg + 1], v0 = seg ? m1 : new Array(n).fill(0), v1 = seg ? new Array(n).fill(0) : m1;
    const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
    out = p0.map((_, i) => h00 * p0[i] + h10 * h * v0[i] + h01 * p1[i] + h11 * h * v1[i]);
  }
  return { pos: out.slice(0, 3), pitch: out[3], yaw: out[4], F: Math.exp(out[5]), pp: [960, out[6]] };
}
// frame px -> the inside render's design px (1920 across the hole)
const toX = (cam) => Object.assign({}, cam, { F: cam.F / KX, pp: [(cam.pp[0] + OX) / KX, (cam.pp[1] + OY) / KX] });
// hillx meets a singular row when the horizon lands exactly on a pixel centre of its canvas (the
// rays of that row are exactly level, and its blurs spread the bad row into a black band over the
// top of the frame: local 110 did it). Keep the horizon off pixel centres with a sub-pixel nudge of
// the principal point (k: the canvas px per design px of the render).
let KB = KX;
function horizonSafe(cx, k) {
  const y = k * (cx.pp[1] + cx.F * Math.tan(cx.pitch)), f = y - Math.floor(y);
  if (Math.abs(f - 0.5) > 0.03) return cx;
  return Object.assign({}, cx, { pp: [cx.pp[0], cx.pp[1] + (f < 0.5 ? -0.08 : 0.08) / k] });
}
// strokes: the lattice laid round the camera's path (it sees the sky)
const SEEDING = { origin: [0.5, -1.0], yaw: 0.03, halfAngle: 0.8, d0: 4, d1: 70, nearTree: 8, nearTower: 95, fref: 1500 };

// ---------------------------------------------------------------- the protein
const NAMES = ['gly', 'ser', 'trp', 'lys', 'his', 'ala', 'cys', 'val', 'leu', 'pro', 'met', 'phe', 'asn', 'glu', 'tyr'];
const BEAD_COL = ['#F2C86B', '#F28C8C', '#B388EB', '#6FC3DF', '#F4A261', '#9BD17D', '#F7E07A', '#7FB7F2', '#E98AC2', '#F6B08E',
  '#A0E3C3', '#C7A3F0', '#F2A07B', '#8FD0F0', '#FFD39A'].map(lin);
const NB = NAMES.length, NCUR = 5;
// bead b = cursor c's j-th (c = floor(b / 3), j = b % 3): each cursor lays a short run of the chain
const BEADS = NAMES.map((name, b) => {
  const c = Math.floor(b / 3), j = b % 3;
  return { name, b, c, j, r: (b + 0.5) * NRES / NB, t: ROUNDS[j] + DROP_STAG * c, col: BEAD_COL[b] };
});
function confAt(fl) {
  let c = EXT;
  for (const [t0, dur, A, B] of FOLDS) if (fl >= t0) c = fl >= t0 + dur ? B : blendConf(A, B, easeIO((fl - t0) / dur));
  return c;
}
function chainAt(fl) {
  const a = turnAt(fl) + spinAt(fl), ca = Math.cos(a), sa = Math.sin(a);
  const rot = (p) => [ca * p[0] + sa * p[2], p[1], -sa * p[0] + ca * p[2]];
  const Kf = Kat(fl), toWorld = (p) => { const r = rot(p); return [Kf[0] + KS * r[0], Kf[1] + KS * r[1], Kf[2] + KS * r[2]]; };
  return chainPoints(confAt(fl), toWorld, rot);
}
// the bead positions on the extended chain (world), and the chain's direction there
const EXT_CH = chainAt(0);
const nearestAt = (ch, r) => { let i = 0; while (i < ch.R.length - 1 && ch.R[i] < r) i++; return i; };
const beadAt = (b) => {
  const i = nearestAt(EXT_CH, BEADS[b].r), P = EXT_CH.P, a = P[Math.max(0, i - 1)], c = P[Math.min(P.length - 1, i + 1)];
  const d = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], l = Math.hypot(...d) || 1;
  return { p: P[i], d: d.map((v) => v / l) };
};
BEADS.forEach((bd) => Object.assign(bd, beadAt(bd.b)));
// the colour along the chain: each bead's paint over its stretch, blended at the joins
function chainCol(r) {
  const x = r / NRES * NB - 0.5, i = Math.floor(x), f = smoothstep(0.25, 0.75, x - i);
  const a = BEAD_COL[clamp(i, 0, NB - 1)], b = BEAD_COL[clamp(i + 1, 0, NB - 1)];
  return lerp3(a, b, f);
}
// the beads, then the band that links them, then the fold, the glow and the turn
function protein(fl, ch) {
  const ribbons = [], lines = [];
  const drawn = NRES * easeIO((fl - LINK[0]) / (LINK[1] - LINK[0]));
  const glow = smoothstep(GLOW[0], GLOW[1], fl);
  // the beads: dropped with a small overshoot, fading into the band as it reaches them
  for (const bd of BEADS) {
    const u = fl - bd.t;
    if (u < 0) continue;
    const pop = easeOutBack(u / 6), merge = clamp((drawn - bd.r) / 3);
    if (merge >= 1) continue;
    const w = 0.15 * KS * pop, d = bd.d, p = bd.p;
    const P = [-1, -0.5, 0, 0.5, 1].map((s) => [p[0] + d[0] * s * 1.3 * w, p[1] + d[1] * s * 1.3 * w, p[2] + d[2] * s * 1.3 * w]);
    const I = 1.6 + 0.9 * Math.exp(-u / 4);
    ribbons.push({ P, w: [0.35, 0.85, 1, 0.85, 0.35].map((v) => v * w), S: null, bb: [1, 1, 1, 1, 1],
      col: bd.col.map((v) => v * I), a: 1 - merge, seed: 0.1 + 0.05 * bd.b });
  }
  // the band: drawn N to C through the beads, then folded; it glows warm as it packs
  if (drawn > 0.01) {
    const n = ch.P.length, col = [], a = [];
    for (let i = 0; i < n; i++) {
      const r = ch.R[i], cc = chainCol(r);
      const tip = Math.exp(-Math.max(0, drawn - r) / 3) * (drawn < NRES ? 1 : 0);
      const hot = clamp(0.5 * glow + tip);
      const I = 1.3 + 1.0 * glow + 1.2 * tip;
      col.push([lerp(cc[0], 1.0, hot * 0.65) * I, lerp(cc[1], 0.9, hot * 0.65) * I, lerp(cc[2], 0.74, hot * 0.65) * I]);
      a.push(clamp((drawn - r) / 1.5 + 0.5));
    }
    ribbons.push({ P: ch.P, w: ch.W.map((v) => v * KS), S: ch.S, bb: ch.BB, col, a, seed: 0.37 });
  }
  // the knot's own light: a soft point at its heart once it is packed
  if (glow > 0.01) { const Kf = Kat(fl); lines.push([...Kf, ...Kf, 3.5, 1.1 * glow, ...HOT, 16]); }
  return { ribbons, lines };
}

// ---------------------------------------------------------------- the inside state at local frame fl
// lineK thickens the lines of light (and their glow) once the screen is small
function inside(T, f, fl, lineK) {
  const cam = camFrame(fl), B = camBasis(cam);
  const sung = T.pulse('sung', f, 7), vox = T.envSmooth('vocals', f, 4);
  const ch = chainAt(fl);
  const pr = protein(fl, ch);
  const lines = pr.lines.map((l) => { const q = l.slice(); q[6] *= lineK; q[11] *= Math.sqrt(lineK); return q; });
  // the crew: Clawd sends his cursors (arms up), then holds the chain with a beam as it folds; the
  // helpers pop out of his light, hop to their places and take hold too; then all watch the knot
  const holding = fl >= HOLD[0] && fl < HOLD[1];
  const knotPx = project(B, Kat(fl))[0];
  const bumps = hillAt(fl);
  const done = fl >= FOLDS[2][0] + FOLDS[2][1];
  const happy = fl >= HAPPY[0] && fl < HAPPY[1];
  const crowd = [], homes = [];
  let main = null;
  CREW.forEach((c, i) => {
    const isMain = i === 0;
    const u = fl - c.pop;
    if (!isMain && u < 0) return;
    // the pop: out of his light in a small arc to its place (exact cells; it appears, never grows)
    const land = isMain ? 1 : easeIO(u / 12);
    const x = lerp(MAIN.x, c.x, land), z = lerp(MAIN.z, c.z, land);
    const arc = isMain ? 0 : 0.55 * Math.sin(Math.PI * clamp(u / 12));
    const y = hillH(bumps, x, z);
    // (R14: Clawd acts with his eyes) no bobbing along: one small hop when the knot is done, and each
    // helper's single arc as it arrives
    let hop = isMain && happy ? 0.1 * Math.sin(Math.PI * clamp((fl - HAPPY[0]) / 10)) : 0;
    hop += arc;
    const mid = [x, y + hop + 0.3, z];
    const inPlace = isMain || u >= 12;
    const sx = project(B, mid)[0];
    let look;
    const grips = holding && inPlace;
    if (grips) {
      // a beam to the point of the chain this one holds; it lets go softly as the knot packs
      const p = ch.P[nearestAt(ch, GRIP[i] * NRES)];
      const let_go = 1 - smoothstep(HOLD[1] - 8, HOLD[1], fl), grab = smoothstep(0, 4, fl - HOLD[0] - 1.5 * i);
      lines.push([...mid, ...p, 0.8 * lineK, (0.55 + 0.45 * sung) * let_go * grab, ...HOT, 2.5 * Math.sqrt(lineK)]);
      const dx = project(B, p)[0] - sx;
      look = dx > 40 ? 1 : dx < -40 ? -1 : 0;
    } else if (fl < STROKES[i].t1 + 4) {
      // (R15) each watches its own cursor paint its stroke of the world
      const cx = project(B, strokeHead(STROKES[i], fl).p)[0] - sx;
      look = fl < STROKES[i].t0 - 4 ? (i % 2 ? 1 : -1) * (fl > 2 ? 1 : 0) : cx > 50 ? 1 : cx < -50 ? -1 : 0;
    } else {
      const dx = knotPx - sx;
      look = dx > 60 ? 1 : dx < -60 ? -1 : 0;
    }
    const sending = fl < STROKES[i].t1 + 2;              // (R15) each sends out its own cursor
    const up = grips || sending;
    const flare = 0.5 * smoothstep(STROKES[i].t0 - 7, STROKES[i].t0 - 4, fl) * (1 - smoothstep(STROKES[i].t0 - 2, STROKES[i].t0 + 8, fl));   // a little light as its cursor leaves
    const pose = {
      x, z, y, u: U_CLAWD, form: 'luminous', hop, look,
      armL: up ? -2 : 0, armR: up ? -2 : 0, arch: false,
      glow: 1.0 + 0.1 * (vox - 0.5) + 0.25 * (up ? 1 : 0) + flare + (done ? 0.15 : 0), eyeLight: 0.5 + 0.4 * sung,
      alpha: 1,
    };
    homes[i] = project(B, [x, y + hop + 0.45, z]);
    if (isMain) main = Object.assign(pose, { light: 1.2 + 0.8 * flare }); else crowd.push(pose);
  });
  // the painted world goes toward night under the glowing knot (and further in the last beat),
  // through its palette, so the crisp Clawds keep their exact colour; S19's backlight all through
  const k = smoothstep(NIGHT0, PB1, fl), n = easeIO((fl - SETTLE[0]) / (SETTLE[1] - SETTLE[0]));
  const kN = k * lerp(NIGHT_K[0], NIGHT_K[1], n), palLin = kN > 0 ? palMix(FIELDPAL, LNIGHT, kN) : FIELDPAL;
  const l19 = 1 - 0.35 * easeIO((fl - 40) / 150);
  // (R20) the contact map, painted on the terraces
  const mapOn = fl >= CMAP_T[0] && fl < CMAP_T[3], ribbons = mapOn ? pr.ribbons.slice() : pr.ribbons;
  if (mapOn) contactMapWorld(fl, { now: contactMap(ch), before: contactMap(chainAt(Math.max(0, fl - 5))) }, lines, ribbons, lineK);
  return {
    state: {
      rung: 4, time: 64 + clockAt(fl) / 30, cam: horizonSafe(toX(cam), KB), hill: bumps, sun: { az: 19.8, el: 5.3 },
      tree: null, props: false, salt: -1,                  // (R14) the field, no trees or props
      clawd: main, crowd, lines, ribbons, ribbonCore: 0.4, palLin,
      keyAz: lerp(19.8 + 62, 19.8 + 12, l19), keyEl: lerp(30, 16, l19), exposure: lerp(1, 0.8, l19), vignette: lerp(0.16, 0.42, l19),
    },
    cam, B, ch, homes,
  };
}

// ---------------------------------------------------------------- the cursors (bar 54), drawn over the frame
// each cursor: out of his light, to its three beads in turn (a drop on each: a press, and the name
// typed beside it), then back into his light
const CUR_S = 0.95;
function cursorsAt(fl, B, homes) {
  const out = [];
  for (let c = 0; c < NCUR; c++) {
    const mine = BEADS.filter((bd) => bd.c === c);
    const st = STROKES[c], t1 = mine[2].t + 6, t2 = t1 + 12;          // held, out, paint, beads, home
    if (fl > t2) continue;
    const at = (bd) => { const q = project(B, bd.p); return [q[0] - 4, q[1] - 6]; };
    const head = (f) => { const q = project(B, strokeHead(st, f).p); return [q[0] - 4, q[1] - 6]; };
    const hw = B.F * 0.9 / Math.max(homes[c][2], 0.5);                // its Clawd's width on screen
    const own = [homes[c][0] + 0.32 * hw, homes[c][1] - 0.62 * hw];     // (R15) held above his shoulder
    let p, press = 0, a = 1, lit = 0.9;
    const arc = (a0, b0, u, lift) => { const m = [lerp(a0[0], b0[0], 0.5), Math.min(a0[1], b0[1]) - lift]; return [(1 - u) ** 2 * a0[0] + 2 * (1 - u) * u * m[0] + u * u * b0[0], (1 - u) ** 2 * a0[1] + 2 * (1 - u) * u * m[1] + u * u * b0[1]]; };
    const back = st.t1 + 8, out0 = mine[0].t - 9;
    if (fl < st.t0 - 5) {
      p = own;                                                         // (R15) held by its Clawd, as S19 left it
    } else if (fl < st.t0) {
      p = arc(own, head(st.t0), easeIO((fl - st.t0 + 5) / 5), 50);     // it leaves its Clawd for its stroke
    } else if (fl <= st.t1) {
      // S36's sweep: one big stroke across the view, pressed down as it paints
      p = head(fl); press = 0.35 + 0.2 * Math.sin(fl * 0.9 + c);
    } else if (fl < back) {
      p = arc(head(st.t1), own, easeIO((fl - st.t1) / (back - st.t1)), 70);   // back to its Clawd
    } else if (fl < out0) {
      p = own;                                                         // held again
    } else if (fl < mine[0].t - 1) {
      p = arc(own, at(mine[0]), easeIO((fl - out0) / (mine[0].t - 1 - out0)), 60);   // out to its first bead
    } else if (fl <= t1) {
      let j = 0; while (j < 2 && fl >= mine[j + 1].t - 1) j++;
      const bd = mine[j], q = at(bd);
      if (j < 2 && fl > bd.t + 2) {                                   // across to the next bead
        const nx = at(mine[j + 1]), u = easeIO((fl - bd.t - 2) / (mine[j + 1].t - 1 - bd.t - 2));
        p = [lerp(q[0], nx[0], u), lerp(q[1], nx[1], u) - 18 * Math.sin(Math.PI * u)];
      } else p = q;
      press = Math.exp(-Math.pow((fl - bd.t) / 1.6, 2));
    } else {
      // home to its own Clawd, and into his light
      const u = easeIO((fl - t1) / (t2 - t1)), q = at(mine[2]);
      p = [lerp(q[0], own[0], u), lerp(q[1], own[1], u) - 70 * Math.sin(Math.PI * u)];
      a = 1 - smoothstep(0.7, 1, u); lit = 0.9 + 0.1 * u;
    }
    out.push({ p, press, a, lit, c, home: homes[c] });
  }
  return out;
}
function labelsAt(fl, B) {
  const out = [];
  for (const bd of BEADS) {
    const u = fl - bd.t;
    if (u < 0 || u > 13) continue;
    const a = smoothstep(0, 1.5, u) * (1 - smoothstep(8, 13, u));
    const q = project(B, bd.p);
    // beside its cursor, alternately low and high so a cursor's three names never sit on each other
    out.push({ text: bd.name, n: Math.min(bd.name.length, Math.floor(u * 1.9) + 1), x: q[0] + 44 * CUR_S + 8, y: q[1] + (bd.j % 2 ? -30 : 40) * CUR_S, a });
  }
  return out;
}
// ---------------------------------------------------------------- the chain, written (revision 10)
// the real code, as one line along the chain's path from N to C
const CHAIN_CODE = [
  'export const EXT = extended(8.0, 1.0, 1.1);',
  'export const LOOSE = opened(3.3, 2.2, 0.9, 1), NEAR = opened(1.6, 1.4, 0.35, 2);',
  'const FOLDS = [[74, 32, EXT, LOOSE], [106, 38, LOOSE, NEAR], [148, 36, NEAR, FOLD]];',
  'export function blendConf(A, B, t) { return A.map((a, i) => ({ c: lerp3(a.c, B[i].c, t), q: qSlerp(a.q, B[i].q, t) })); }',
  'export function chainPoints(conf, toWorld, dirWorld) {',
  'const { c, q } = conf[k];',
  'return LOCAL[k].map((pt) => ({ p: add(c, qRot(q, pt.p)), s: qRot(q, pt.s), w: pt.w, r: pt.r }));',
].join('   ');
const CODE_A = [LINK[0], 88, 104];      // it is typed along the band as it links, and lifts off as the fold begins
const CODE_V = 1.1;                     // and streams along the chain, N-ward, in characters a frame
// the chain's course without its helical turns (a running mean along the points), in frame px
function chainPath(ch, B) {
  const P = ch.P, n = P.length, h = 14, out = [];
  for (let i = 0; i < n; i += 2) {
    let x = 0, y = 0, z = 0, m = 0;
    for (let j = Math.max(0, i - h); j <= Math.min(n - 1, i + h); j++) { x += P[j][0]; y += P[j][1]; z += P[j][2]; m++; }
    const q = project(B, [x / m, y / m, z / m]);
    out.push({ x: q[0], y: q[1], z: q[2], r: ch.R[i] });
  }
  return out;
}
function drawChainCode(g, k, fl, B, ch) {
  if (fl < CODE_A[0] || fl > CODE_A[2]) return;
  const drawn = NRES * easeIO((fl - LINK[0]) / (LINK[1] - LINK[0]));
  const a = smoothstep(CODE_A[0], CODE_A[0] + 3, fl) * (1 - smoothstep(CODE_A[1], CODE_A[2], fl));
  const lift = 22 * smoothstep(CODE_A[1], CODE_A[2], fl);
  const path = chainPath(ch, B);
  // arclength along the path on screen
  const S = [0];
  for (let i = 1; i < path.length; i++) S.push(S[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  g.save(); g.setTransform(k, 0, 0, k, 0, 0);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const run = CODE_V * Math.max(0, fl - CODE_A[0]), j0 = Math.floor(run);
  let s = 0.05 * S[S.length - 1] - (run - j0) * 9, j = j0, seg = 1, prevAng = null;
  while (seg < path.length) {
    if (s < 0) { s += 9; j++; continue; }
    while (seg < path.length - 1 && S[seg] < s) seg++;
    const p0 = path[seg - 1], p1 = path[seg], u = clamp((s - S[seg - 1]) / Math.max(1e-6, S[seg] - S[seg - 1]));
    const r = lerp(p0.r, p1.r, u);
    if (r > drawn || s > S[S.length - 1]) break;                           // not linked yet
    const x = lerp(p0.x, p1.x, u), y = lerp(p0.y, p1.y, u), z = lerp(p0.z, p1.z, u);
    const fs = clamp(1400 * 0.11 / z, 10, 20), adv = fs * 0.56;
    const pa = path[Math.max(0, seg - 3)], pb = path[Math.min(path.length - 1, seg + 2)];
    let ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
    if (Math.cos(ang) < 0) ang += Math.PI;
    if (prevAng !== null) ang = prevAng + clamp(Math.atan2(Math.sin(ang - prevAng), Math.cos(ang - prevAng)), -0.1, 0.1);
    prevAng = ang;
    const nx = -Math.sin(ang), ny = Math.cos(ang);                       // below the band (screen down side)
    const off = 0.95 * fs + 0.12 * 1400 * 0.85 / z + lift;
    const ch_ = CHAIN_CODE[j % CHAIN_CODE.length];
    if (ch_ !== ' ') {
      const tip = drawn < NRES ? Math.exp(-Math.max(0, drawn - r) / 3) : 0;   // fresh at the drawing tip
      g.save(); g.translate(x + nx * off, y + ny * off); g.rotate(ang);
      g.font = `${fs.toFixed(1)}px Consolas, "Courier New", monospace`; g.globalAlpha = a * (0.78 + 0.22 * tip);
      g.shadowColor = 'rgba(60,20,10,0.35)'; g.shadowBlur = 2;
      g.fillStyle = tip > 0.5 ? 'rgb(255,200,150)' : 'rgb(214,102,58)'; g.fillText(ch_, 0, 0);
      g.restore();
    }
    s += adv; j++;
  }
  g.restore();
}

// ---------------------------------------------------------------- the world painted in (revision 13)
// The unpainted world: the same scene with the look's pale cracked crust for land and a grey sky and
// grey trees and peaks (Clawd keeps his colour: he is the painter). Five cursors lay one broad stroke
// each across the land, row by row, following the terrain; a sweep paints the sky and the far land.
const FIELDPAL = Object.assign({}, lookPal(0), palLinear({
  P_ZEN: '#2E2466', P_UP: '#5A3C92', P_MID: '#9A5CAA', P_LOW: '#C88EBE', P_HOR: '#E6C2D8', P_GLOW: '#F0CFE0',
  P_SUNC: ['#F6DDE8', 0.9], P_DISC: ['#FFF4F8', 1.5], P_MTL: '#B793C6', P_MTS: '#7E6AA6',
  P_GLOWL: ['#D8B8E8', 0.35], P_KEY: ['#F2E6F6', 2.0], P_CLAWDL: ['#F08A60', 1.1], P_AMB: ['#B8B0F0', 0.4], P_FILL: ['#C0B4EE', 0.24], P_BNC: ['#B8A8D0', 0.12],
}));
const LNIGHT = palLinear(NIGHT);
const GREY = Object.assign({}, lookPal(0), palLinear({
  P_ZEN: '#8F929C', P_UP: '#9FA2AA', P_MID: '#AEB0B6', P_LOW: '#BDBEC2', P_HOR: '#C9C8CA', P_GLOW: '#CFCDCC',
  P_SUNC: ['#DAD8D4', 0.45], P_DISC: ['#EAE8E4', 0.7], P_MTL: '#AEB1B8', P_MTS: '#979AA3',
  A_TRUNK: '#86868B', A_LEAF: '#9B9DA2', A_FLOOR: '#A9ABB1',
}));
// S36's sweep: each stroke runs straight across the opening view (along the camera's right, at a
// distance d along its gaze, laid on the land), wider the farther it is, the five a frame and a half
// apart, each about a third of a second
const G0 = [cam19.pos[0], cam19.pos[2]], GF = [Math.sin(cam19.yaw), Math.cos(cam19.yaw)], GR = [Math.cos(cam19.yaw), -Math.sin(cam19.yaw)];
const SWEEP = [[4.3, 5.6], [8.0, 5.4], [12.5, 6.8], [18.5, 9.0], [27, 13]];     // [distance, width]
const STROKES = SWEEP.map(([d, wd], c) => {
  const L = 0.95 * d + 4, dir = c % 2 ? -1 : 1, P = [];
  for (let i = 0; i <= 60; i++) {
    const t = dir * lerp(-L, L, i / 60), x = G0[0] + GF[0] * d + GR[0] * t, z = G0[1] + GF[1] * d + GR[1] * t;
    P.push([x, hillH(HILL_F, x, z) + 0.06, z]);
  }
  return { P, w: wd, t0: PAINT[0] + 5 + 1.5 * c, t1: PAINT[0] + 5 + 1.5 * c + 11 };
});
const strokeHead = (st, fl) => { const u = clamp((fl - st.t0) / (st.t1 - st.t0)), f = u * (st.P.length - 1), i = Math.min(st.P.length - 2, Math.floor(f)); return { u, p: lerp3(st.P[i], st.P[i + 1], f - i), i, f }; };
function paintMask(M, k, fl, cam, B) {
  const g = M.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, M.width, M.height);
  g.setTransform(k, 0, 0, k, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
  // the land, stroke by stroke (widths in perspective; a few bristles along each edge)
  for (const [c, st] of STROKES.entries()) {
    const h = strokeHead(st, fl);
    if (h.u <= 0) continue;
    const pts = st.P.slice(0, h.i + 1).concat([h.p]).map((p) => project(B, p)).filter((q) => q[2] > 0.3);
    for (let b = -2; b <= 2; b++) {
      const wk = b === 0 ? 1 : 0.82 + 0.05 * Math.abs(b), off = b * 0.22;
      g.strokeStyle = b === 0 ? '#fff' : 'rgba(255,255,255,0.55)';
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], q = pts[i], w = B.F * st.w * wk / ((a[2] + q[2]) / 2);
        const dx = q[0] - a[0], dy = q[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w * off * 0.5, ny = dx / l * w * off * 0.5;
        g.lineWidth = w; g.beginPath(); g.moveTo(a[0] + nx, a[1] + ny); g.lineTo(q[0] + nx, q[1] + ny); g.stroke();
      }
    }
  }
  // the sky and the far land: a sweep from the left, its edge ragged like a loaded brush
  const hz = cam.pp[1] + cam.F * Math.tan(cam.pitch) + 150, sx = lerp(-200, 2200, easeIO((fl - 5) / 15));
  if (sx > -150) {
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-10, -10);
    for (let y = -10; y <= hz + 10; y += 20) g.lineTo(sx + 40 * Math.sin(y / 37 + 1.3) + 25 * Math.sin(y / 11), y);
    g.lineTo(-10, hz + 10); g.closePath(); g.fill();
  }
}

// ---------------------------------------------------------------- the contact map (revisions 19-20)
// 15 segments of the chain (one per bead); a pair is in contact when their centroids come within
// about 0.3-0.58 m. (R20, Claire: part of the world, like S34's band diagram) it is painted on the
// funnel's far-right terraces: its rows follow the terraces (arcs round the funnel at equal steps
// down the wall), its columns run down the slope a constant width apart, row i against column j from
// the top left. The grid is lines of light on the land, and the lit cells are paint on it, flashing as
// a contact forms.
const CM_N = 15, CM_PHI = 30 * Math.PI / 180, CM_R = [3.4, 1.8], CM_CW = 0.115, CM_LIFT = 0.035;
const CM_GOLD = [1.0, 0.8, 0.46], CM_WHITE = [1.0, 0.97, 0.9];
function contactMap(ch) {
  const sum = Array.from({ length: CM_N }, () => [0, 0, 0, 0]);
  ch.P.forEach((p, i) => { const b = Math.min(CM_N - 1, Math.floor(ch.R[i] / NRES * CM_N)); sum[b][0] += p[0]; sum[b][1] += p[1]; sum[b][2] += p[2]; sum[b][3]++; });
  const c = sum.map((q) => [q[0] / q[3], q[1] / q[3], q[2] / q[3]]);
  return c.map((a, i) => c.map((b, j) => (i === j ? 1 : smoothstep(0.58, 0.3, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])))));
}
// the rows' radii: equal steps of distance along the wall, so the cells are square on the land
const CM_RR = (() => {
  const h = (r) => hillH(HILL_F, FUN[0] + r * Math.cos(CM_PHI), FUN[1] + r * Math.sin(CM_PHI));
  const n = 400, S = [0], out = [];
  for (let k = 1; k <= n; k++) { const a = lerp(CM_R[0], CM_R[1], (k - 1) / n), b = lerp(CM_R[0], CM_R[1], k / n); S.push(S[k - 1] + Math.hypot(b - a, h(b) - h(a))); }
  for (let i = 0; i <= CM_N; i++) {
    const s = S[n] * i / CM_N;
    let k = 0; while (k < n - 1 && S[k + 1] < s) k++;
    out.push(lerp(CM_R[0], CM_R[1], (k + clamp((s - S[k]) / (S[k + 1] - S[k] || 1))) / n));
  }
  out.step = S[n] / CM_N;
  return out;
})();
// a point of the map on the land: i down the rows, j across the columns (both may be fractional)
function cmPt(i, j) {
  const a = Math.min(CM_N - 1, Math.floor(clamp(i, 0, CM_N))), r = lerp(CM_RR[a], CM_RR[a + 1], clamp(i, 0, CM_N) - a);
  const phi = CM_PHI - (j - CM_N / 2) * CM_CW / r, x = FUN[0] + r * Math.cos(phi), z = FUN[1] + r * Math.sin(phi);
  return [x, hillH(HILL_F, x, z) + CM_LIFT, z];
}
function contactMapWorld(fl, cm, lines, ribbons, lineK) {
  const a = smoothstep(CMAP_T[0], CMAP_T[1], fl) * (1 - smoothstep(CMAP_T[2], CMAP_T[3], fl));
  if (!cm || a <= 0.01) return;
  // the grid: the terraces' arcs and the lines down the slope, the outline firmer
  const seg = (p, q, I, w) => lines.push([...p, ...q, w * lineK, I * a, ...CM_GOLD, 2 * Math.sqrt(lineK)]);
  for (let i = 0; i <= CM_N; i++) {
    const edge = i === 0 || i === CM_N;
    for (let j = 0; j < 2 * CM_N; j++) seg(cmPt(i, j / 2), cmPt(i, (j + 1) / 2), edge ? 0.75 : 0.3, edge ? 1.2 : 0.7);
  }
  for (let j = 0; j <= CM_N; j++) {
    const edge = j === 0 || j === CM_N;
    for (let i = 0; i < CM_N; i++) seg(cmPt(i, j), cmPt(i + 1, j), edge ? 0.75 : 0.3, edge ? 1.2 : 0.7);
  }
  // the cells: paint where the pair touches (the diagonal is each segment with itself), whiter and
  // brighter for a moment as the contact forms
  for (let i = 0; i < CM_N; i++) for (let j = 0; j < CM_N; j++) {
    const v = cm.now[i][j], fresh = Math.min(1, 2 * Math.max(0, v - cm.before[i][j]));
    if (v < 0.05) continue;
    const p0 = cmPt(i + 0.5, j + 0.12), p1 = cmPt(i + 0.5, j + 0.88), up = cmPt(i + 0.1, j + 0.5), dn = cmPt(i + 0.9, j + 0.5);
    const sd = [up[0] - dn[0], up[1] - dn[1], up[2] - dn[2]];
    const I = (i === j ? 0.7 : 0.45 + 0.8 * v) * (1 + 1.6 * fresh);
    const col = CM_GOLD.map((c, m) => lerp(c, CM_WHITE[m], fresh) * I);
    ribbons.push({ P: [p0, p1], w: 0.4 * CM_RR.step, S: [sd, sd], bb: [0, 0], col, a: a * clamp(0.4 + 0.6 * v + 0.3 * fresh), seed: 0.11 * i + 0.07 * j + 0.3 });
  }
}

let CURSOR = null;
function drawOverlay(g, k, fl, B, homes) {
  if (fl < 0 || fl > 112) return;
  g.save(); g.setTransform(k, 0, 0, k, 0, 0);
  const curs = cursorsAt(fl, B, homes);
  // (R15) each cursor's faint line of light back to its own Clawd
  g.save(); g.lineCap = 'round'; g.globalCompositeOperation = 'screen';
  for (const cu of curs) {
    if (cu.a <= 0.01) continue;
    const d = Math.hypot(cu.p[0] - cu.home[0], cu.p[1] - cu.home[1]);
    if (d < 20) continue;
    const gr = g.createLinearGradient(cu.home[0], cu.home[1], cu.p[0], cu.p[1]);
    gr.addColorStop(0, `rgba(255,200,146,${(0.55 * cu.a).toFixed(3)})`); gr.addColorStop(1, `rgba(255,172,112,${(0.24 * cu.a).toFixed(3)})`);
    g.strokeStyle = gr; g.lineWidth = 1.7;
    g.beginPath(); g.moveTo(cu.home[0], cu.home[1] - 6); g.lineTo(cu.p[0] + 2, cu.p[1] + 2); g.stroke();
  }
  g.restore();
  for (const cu of curs) {
    if (cu.a <= 0.01) continue;
    // a little of his light around each card
    const hx = cu.p[0] + 16 * CUR_S, hy = cu.p[1] + 28 * CUR_S, hr = 34;
    const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
    hg.addColorStop(0, `rgba(255,190,130,${(0.35 * cu.a).toFixed(3)})`); hg.addColorStop(1, 'rgba(255,170,120,0)');
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = hg; g.fillRect(hx - hr, hy - hr, 2 * hr, 2 * hr); g.restore();
    CURSOR.draw(g, cu.p[0], cu.p[1], { s: CUR_S, press: cu.press, rot: -0.08 + 0.03 * (cu.c - 2), fill: HIS.card, edge: HIS.edge, glow: 1.0,
      bs: CUR_S / 1.45, lit: 1, heat: 0.1, litAt: [26, 40], a: cu.a, shadow: 0 });
  }
  for (const lb of labelsAt(fl, B)) {
    if (lb.a <= 0.01) continue;
    const shown = lb.text.slice(0, lb.n), fs = 22;
    g.save();
    g.font = `${fs}px Consolas, "Courier New", monospace`; g.textBaseline = 'middle';
    g.globalAlpha = lb.a;
    g.shadowColor = 'rgba(26,12,6,0.8)'; g.shadowBlur = 7; g.shadowOffsetX = 1; g.shadowOffsetY = 1;
    g.fillStyle = 'rgb(255,164,104)';
    g.fillText(shown, lb.x, lb.y);
    g.shadowColor = 'rgba(255,150,90,0.55)'; g.shadowBlur = 12; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
    g.fillText(shown, lb.x, lb.y);
    if (lb.n < lb.text.length) { const cx = lb.x + g.measureText(shown).width + 2; g.fillRect(cx, lb.y - fs * 0.45, fs * 0.5, fs * 0.9); }
    g.restore();
  }
  g.restore();
}

// ---------------------------------------------------------------- the lab (sets/paper-lab)
const SC = sceneLab({ screen: 'ext', cursor: false });
const FC = [MON.hole[0] + MON.hole[2] / 2, MON.hole[1] + MON.hole[3] / 2];     // the screen's centre
const TZ_FULL = (SC.cam.Zc - MON.z) * (1 - 1 / S_FULL);                        // the push depth at scale 6.5
const LIGHT_K = [1.35, 0.62], LIGHT_F = 820, EXT_GAIN = 1.15;   // the room light: in the lab, and settled
// S08's camera run backwards from the end of its push: its constant-speed dolly (where S08's push
// ends, u = 292/287 on its four-bar clock, at PB0; one frame back per frame), and the push itself
// eased out over PB0..PB1 as S08 eased it in, landing at PB0 exactly on scale 6.5 with the hole's
// corner at (-OX, -OY)
function labCam(fl) {
  const u = (292 - (fl - PB0)) / 287, tx = lerp(-80, 80, u);
  const cam = { Zc: SC.cam.Zc, zref: SC.cam.zref, t: [tx, 0], pan: [0.75 * tx, 0], tz: 40 * u };
  const push = 1 - easeIO((fl - PB0) / (PB1 - PB0));
  if (push > 0) {
    const S0 = toScreen(cam, FC, MON.z);
    cam.tz += (TZ_FULL - 40 * (292 / 287)) * push;
    cam.pan = panFor(cam, FC, MON.z, [lerp(S0[0], 960, push), lerp(S0[1], 540 + 0.5 * (XH - 1080 - 2 * OY), push)]);
  }
  return cam;
}
const q2 = (v) => Math.round(v * 100) / 100;     // pose values as the layer keys see them
function labState(T, fr, cam, ext) {
  const fl = fr.fl, v = T.envSmooth('vocals', fr.f, 8);
  return {
    cam, ext, clawd: null, dust: labDust(fr.t),
    light: { I: SC.light.I * lerp(LIGHT_K[0], LIGHT_K[1], easeIO((fl - SETTLE[0]) / (SETTLE[1] - SETTLE[0]))) * (0.86 + 0.2 * v), f: LIGHT_F },
    pose: {
      A: { hand: HAND_LAP, mouse: false, lean: q2(easeIO((fl - LEAN[0]) / (LEAN[1] - LEAN[0]))) },
      B: { turn: q2(easeIO((fl - TURN[0]) / (TURN[1] - TURN[0]))) },
    },
  };
}

// ---------------------------------------------------------------- the shot
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let g2, big, hBig, small, hSmall, paperCanvas, E, createHill, greyCv, maskCv, maskBlur;
function ensureLab(ctx) {
  if (E) return;
  const k = ctx.scale, t0 = performance.now();
  small = mk(Math.round(SW * k), Math.round(SH * k));
  hSmall = createHill(small, { log: ctx.log, seeding: SEEDING });
  hSmall.warm([4]);
  paperCanvas = mk(ctx.W, ctx.H);
  E = createPaper(paperCanvas, SC, { k, log: ctx.log, ext: true });
  ctx.log(`S20: lab ready in ${(performance.now() - t0).toFixed(0)} ms`);
}

export default {
  async setup(ctx) {
    g2 = ctx.canvas.getContext('2d');
    KB = KX * ctx.scale;
    const HX = await loadHillxIcy(ctx.log);
    createHill = HX.createHill;
    ctx.log(`S20: hillx ${HX.icy ? 'with the glacier caps' : 'as it is'}`);
    big = mk(Math.round(XW * ctx.scale), Math.round(XH * ctx.scale));
    greyCv = mk(ctx.W, ctx.H); maskCv = mk(ctx.W, ctx.H); maskBlur = mk(ctx.W, ctx.H);
    hBig = createHill(big, { log: ctx.log, seeding: SEEDING });
    hBig.warm([4]);
    CURSOR = createPaperCursor(31);
    ctx.log(`S20: ${NB} beads; the funnel at ${FUN}; the knot to ${K_BOT.map((v) => v.toFixed(2))}, folded by ${FOLDS[2][0] + FOLDS[2][1]}; pull-back ${PB0}-${PB1}`);
  },
  render(ctx, fr) {
    const { T } = ctx, fl = fr.fl, k = ctx.scale;
    if (fl < PB0) {
      const I = inside(T, fr.f, fl, 1);
      const painting = fl < PAINT[1];
      if (painting) {
        // (R13) the unpainted world first, kept aside
        hBig.render(Object.assign({}, I.state, { palLin: GREY, salt: 1, props: false, ribbons: [], lines: [] }));
        const gg = greyCv.getContext('2d'); gg.globalCompositeOperation = 'source-over';
        gg.drawImage(big, OX * k, OY * k, ctx.W, ctx.H, 0, 0, ctx.W, ctx.H);
      }
      hBig.render(I.state);
      g2.drawImage(big, OX * k, OY * k, ctx.W, ctx.H, 0, 0, ctx.W, ctx.H);
      if (painting) {
        // the painted world shows where the strokes have been; the grey stays everywhere else
        paintMask(maskCv, k, fl, I.cam, I.B);
        const mb = maskBlur.getContext('2d'); mb.clearRect(0, 0, ctx.W, ctx.H); mb.filter = `blur(${(2.5 * k).toFixed(1)}px)`; mb.drawImage(maskCv, 0, 0); mb.filter = 'none';
        const gg = greyCv.getContext('2d'); gg.globalCompositeOperation = 'destination-out'; gg.drawImage(maskBlur, 0, 0); gg.globalCompositeOperation = 'source-over';
        g2.drawImage(greyCv, 0, 0);
      }
      const m = I.state.clawd, cp = project(I.B, [m.x, m.y + 0.45, m.z]);
      drawChainCode(g2, k, fl, I.B, I.ch);
      drawOverlay(g2, k, fl, I.B, I.homes);
      return;
    }
    ensureLab(ctx);
    const cam = labCam(fl), hole = MON.hole[2] * camMap(cam, MON.z).s;    // the screen's width in frame px
    const useSmall = hole < SW * 0.92;
    (useSmall ? hSmall : hBig).render(inside(T, fr.f, fl, Math.pow(clamp(XW / hole, 1, 8), 0.6)).state);
    E.frame(labState(T, fr, cam, { canvas: useSmall ? small : big, gain: EXT_GAIN, pass: 1 }));
    g2.drawImage(paperCanvas, 0, 0);
  },
};
