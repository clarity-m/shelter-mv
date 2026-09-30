// S36, verse 2b (bars 62-64, frames 4403-4618; hard cut to S21 on the bar-65 kick). Revision 8 (new).
// A world Clawd makes for the reactor's core: the sea at sunset, the sun big and low over the water,
// Clawd and three Clawds on a low bluff above the shore. Revision 9 (compute has arrived): six more
// Clawds pop out of Clawd's light as they work (`crew.spawn(6)`), each taking hold of the sun with a
// beam, and more of the cursors type code. The last frame is unchanged. Revision 10: the code lives in
// the world, the shot's own lines written along the beams in perspective (the hook, the pull, the
// press, then the core's lines on the beams that draw it); the first half-beat opens a little dimmer
// and warmer, out of S35's hall, and comes up to the sunset. Revision 11 (Claire: S36 gets its own
// world): a polar sea under the aurora. Ice floes on a cold sea, a snowy bluff, a low polar sun and
// curtains of aurora (teal, green, violet) in the painted look. Clawd takes the sun as before; as
// night falls the aurora flares, and its field lines bend down into the twelve coils round the ring
// (plasma held by magnetic fields, which a tokamak imitates). The polar palette gives way to the old
// night palette under the finished core, the floes and curtains fade, and the last frame is exact.
// Revision 12 (the physics): the coils are the magnets, not field lines. As night falls and the aurora
// flares, its light comes down and winds round the ring as helical field lines (landing.js
// helixEdges: the toroidal field plus the plasma current's own, a twisted rope of light, drawn a touch
// finer than the ring); then the Clawds' beams close the twelve D-coils round it, as the magnets. The
// last frame puts the helices on S21's landing too.
// Revision 14 (the three technologies as a group): like S20's funnel and S34's lattice, the polar world
// is painted in by Clawd's cursors: it opens grey and dim out of S35's dark campus, the four cursors lay
// broad strokes across the sea and the bluff and sweep the sky in (0-16), then fly on to hook the sun.
// Clawd acts with his eyes: no bobbing, the new Clawds arc in once.
// Revision 15: S35's campus holds a beat longer, so S36 starts at 62.2 (frame 4421, 198 frames). Bar 62's
// content (the paint-in, the hook) is compressed into its three beats by a time warp: local frame t
// plays the old local frame t * 72 / 54 for t < 54, and t + 18 from there on, so bars 63-64 and the
// last frame are exactly as before. The audio cues read the true frame.
//  Bar 62 (0-71): orange cursors come out of Clawd's light, type `sun.hook()` and hook the sun's rim;
//    beams of light run from the four Clawds to the hooks while the camera rises over the bluff.
//  Bar 63 (72-143): they pull it down out of the sky toward the water (`pull(sun, down)`); the sky
//    drains to night as it goes (Clawd took the sun). Over the water they press it flat and hollow
//    (`press(sun, ring)`): a ring of plasma hovering over the sea. The cursors burn into its light.
//  Bar 64 (144-215): the ring is drawn in light (its loops and cross-sections), and the twelve coils
//    close round it, drawn by the Clawds' beams (`coils.close(12)`; sets/inside-montage/reactor.js,
//    the core only: torus, merid, coil). The camera cranes up to the fusion set's own camera, which it
//    reaches at 196: the last frame puts the ring and coils exactly on sets/paper-fusion/LANDING.md's
//    lines (landing.js coreLines(): 0.00 px), where S21 flashes them on the kick. The bass returns
//    under it all; the snare pickup (194, 203, 208) brightens the ring.
import { loadHillxDoor } from '../sets/door/hillx-fix.js';  // (R23) hillx with solid Clawds (world-oriented, depth-tested)
import { reactorEdges, reactorPlacement, SC } from '../sets/inside-montage/reactor.js';
import { helixEdges } from '../sets/paper-fusion/landing.js';
import { nightPal, NIGHT } from '../sets/inside-montage/night.js';
import { lookPal } from '../sets/inside-montage/valley.js';
import { palLinear, palMix } from '../sets/hill/palettes.js';
import { camBasis, project } from '../sets/hill/scene.js';
import { createPaperCursor, HIS } from '../sets/valley/papercursor.js';
import { codeAtlas } from '../sets/inside-montage/codeline.js';
import { clamp, lerp, smoothstep, easeInOut, hash } from '../lib/util.js';

const easeIO = (t) => easeInOut(clamp(t));
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const WARM = [1.0, 0.84, 0.64], HOT = [1.0, 0.95, 0.86];

// ---------------------------------------------------------------- timing (local frames of 216)
// sung onsets 28, 51, 91, 98, 125, 198; beats every 18; the snare pickup 194, 203, 208; bar 65's kick 216
const OUT = [12, 28];                     // the cursors come out of his light and fly to the sun
const PAINT = [0, 72];                    // (R14) first they paint the world in from grey; (R19) over bar 62's three beats
const HOOK = 28;                          // they hook its rim (sung onset)
const PULL = [44, 104];                   // the pull: the sun comes down out of the sky to the water
const PRESS = [96, 124];                  // pressed flat and hollow into the ring
const BURN = [118, 128];                  // the cursors burn into its light (the lead one stays)
const RING_DRAW = [118, 142];             // the ring's loops and cross-sections in light
const HELIX_DRAW = [146, 176];            // the aurora's light winds round the ring: the field's helices
const COIL_DRAW = [168, 196];             // then the Clawds' beams close the coils round it (the magnets)
const KEYS = [0, 56, 112, 196];           // the camera: the shore, back over the bluff (all in view for the pull), then the crane to the fusion camera
// the code on the beams: this file's own lines, one per beam, by phase (i: which Clawd)
const CODE = {
  hook: ['beam = onRim(sun, c.th);', 'const holding = fl >= HOOK + 2 && fl < PRESS[1];',
    'const onRim = (s, th, out = 1) => add(s.c, add(mul(s.U, Math.cos(th) * (s.rc + s.hw * out)), mul(s.V, Math.sin(th) * (s.rc + s.hw * out))));',
    'const SUN0 = [3.0, 22.0, 160.0], R_SUN0 = 9.0;'],
  pull: ['const c = hermite3(SUN0, [0, -40, -40], C, [0, -2, -24], p);', 'const p = easeIO((fl - PULL[0]) / (PULL[1] - PULL[0]));',
    'const kN = lerp(0, 0.86, smoothstep(PULL[0] + 6, PRESS[1], fl)) + 0.1 * smoothstep(PRESS[1], 200, fl);', 'const t2 = t * t, t3 = t2 * t;'],
  press: ['const k = easeIO((fl - PRESS[0]) / (PRESS[1] - PRESS[0]));', 'const phi = k * Math.PI / 2;',
    'const rc = lerp(R / 2, RING_R, k), hw = lerp(R / 2, TUBE * 1.15, k);', 'const RING_R = SC.R0 * S, TUBE = SC.A * S;'],
  crew: ['const land = i < 4 ? 1 : easeIO(u / 12);', 'const POPS = [24, 40, 56, 72, 88, 104];', 'CREW.forEach((c, i) => {',
    'const inPlace = i < 4 || u >= 12;', 'const x = lerp(home.x, c.x, land), z = lerp(home.z, c.z, land);', 'if (u < 0) return;'],
  core: ["const CORE = reactorEdges(0).filter((e) => e.kind === 'torus' || e.kind === 'merid' || e.kind === 'coil');",
    'const Bw = lerp3(e.A, e.B, r);', 'const PL = reactorPlacement(C, S);', 'const CAM_LAND = PL.cam(12);',
    'const t0 = remap(e.t0, src, dst), t1 = remap(e.t0 + e.dt, src, dst);', 'const r = clamp((fl - e.t0) / e.dt);',
    'const I = e.dim * (0.72 + 0.9 * fresh) * (1 + 0.6 * snare);', 'const fresh = r < 1 ? 1 : Math.exp(-(fl - e.t0 - e.dt) / 6);',
    'lines.push([...e.A, ...Bw, 1.6, I, c[0], c[1], c[2], 3.2 + 2 * fresh]);', 'if (r < 1) tips.push(Bw);'],
};
const PHASES = [['hook', HOOK + 2], ['pull', PULL[0] + 8], ['press', PRESS[0] + 2], ['core', RING_DRAW[0]]];
function codeFor(i, fl) {
  let ph = PHASES[0];
  for (const q of PHASES) if (fl >= q[1]) ph = q;
  const set = i >= 4 && ph[0] !== 'core' ? 'crew' : ph[0], lines = CODE[set];
  const t0 = set === 'crew' ? Math.max(ph[1], CREW[i].pop + 14) : ph[1];
  return { text: lines[(i * 3) % lines.length], t0 };
}
const POPS = [24, 40, 56, 72, 88, 104];    // the six who pop out of Clawd's light, on the beats

// ---------------------------------------------------------------- the world
// a flat floor with a low bluff in front, and the sea from the shoreline (z 8.5) to the horizon
const LAND = [[0.75, 0.4, 5.2, 4.8, 2.3]];
const SEA = { pts: [[-900, 8.5 + 450, 450], [900, 8.5 + 450, 450]], head: 1e4 };
// Clawd and three Clawds on the bluff (each with a cursor that hooks the sun at its rim angle th),
// then the six who pop out of his light and take hold with beams of their own
const CREW = [{ x: 0.4, z: 5.6 }, { x: -1.5, z: 6.1 }, { x: 2.2, z: 6.0 }, { x: -0.5, z: 4.6 },
  { x: -2.9, z: 5.5 }, { x: 3.5, z: 5.4 }, { x: 1.3, z: 6.8 }, { x: -1.1, z: 7.1 }, { x: -3.6, z: 6.7 }, { x: 4.3, z: 6.6 }]
  .map((c, i) => Object.assign(c, { ph: hash(i, 9), th: [70, 125, 20, 235, 160, 340, 95, 200, 185, 300][i] * Math.PI / 180,
    pop: i < 4 ? -1e9 : POPS[i - 4] }));
const U_CLAWD = 0.9 / 18;

// ---------------------------------------------------------------- the ring and its core in light
// the fusion core placed over the water; its camera at distance 12 is S21's (sets/paper-fusion/LANDING.md)
const C = [0.4, 2.3, 13.5], S = 1.1;
const PL = reactorPlacement(C, S);
const CAM_LAND = PL.cam(12);
const RING_R = SC.R0 * S, TUBE = SC.A * S;
const CORE = reactorEdges(0).filter((e) => e.kind === 'torus' || e.kind === 'merid' || e.kind === 'coil');
const span = (ks) => { const E = CORE.filter((e) => ks.includes(e.kind)); return [Math.min(...E.map((e) => e.t0)), Math.max(...E.map((e) => e.t0 + e.dt))]; };
const RAW_RING = span(['torus', 'merid']), RAW_COIL = span(['coil']);
const remap = (t, [a, b], [c, d]) => c + (t - a) * (d - c) / (b - a);
const EDGES = CORE.map((e) => {
  const [src, dst] = e.kind === 'coil' ? [RAW_COIL, COIL_DRAW] : [RAW_RING, RING_DRAW];
  const t0 = remap(e.t0, src, dst), t1 = remap(e.t0 + e.dt, src, dst);
  return { kind: e.kind, dim: e.dim ?? 1, t0, dt: t1 - t0, A: PL.toWorld(e.a), B: PL.toWorld(e.b) };
});
// the field's helices: each of the six lines is wound from its start round the ring, the six a frame
// or so apart, each tip fed by a line of the aurora's light
const HX = helixEdges(), HX_N = HX.filter((e) => e.line === 0).length, HX_RUN = HELIX_DRAW[1] - HELIX_DRAW[0] - 8;
HX.forEach((e, k) => {
  const i = k - e.line * HX_N, t0 = HELIX_DRAW[0] + 1.4 * e.line + HX_RUN * i / HX_N;
  EDGES.push({ kind: 'helix', dim: e.dim ?? 1, t0, dt: HX_RUN / HX_N, A: PL.toWorld(e.a), B: PL.toWorld(e.b), line: e.line });
});

// ---------------------------------------------------------------- the sun
// from low in the sky over the sea down to the ring; its disc faces the lens until the press lays it
// flat and hollows it into the plasma ring (radius RING_R, tube TUBE)
const SUN0 = [3.0, 22.0, 160.0], R_SUN0 = 9.0;
function hermite3(p0, m0, p1, m1, t) {
  const t2 = t * t, t3 = t2 * t;
  return add(add(mul(p0, 2 * t3 - 3 * t2 + 1), mul(m0, t3 - 2 * t2 + t)), add(mul(p1, -2 * t3 + 3 * t2), mul(m1, t3 - t2)));
}
function sunAt(fl) {
  const p = easeIO((fl - PULL[0]) / (PULL[1] - PULL[0]));
  const c = hermite3(SUN0, [0, -40, -40], C, [0, -2, -24], p);
  // pressed smaller as it comes: about the same size in the sky all the way down, the ring's at the end
  const R = R_SUN0 * Math.pow(Math.hypot(c[0] - C[0], c[1] - C[1], c[2] - C[2]) / Math.hypot(SUN0[0] - C[0], SUN0[1] - C[1], SUN0[2] - C[2]), 0.92) * (1 - p) + (RING_R + TUBE) * p;
  // (R19) first its hole opens while it still faces the lens (a torus seen face on), then it lies down
  const u = clamp((fl - PRESS[0]) / (PRESS[1] - PRESS[0]));
  const k = easeIO(u / 0.6);                                           // 0 the disc .. 1 the ring
  const phi = easeIO((u - 0.35) / 0.65) * Math.PI / 2;                 // facing the lens .. lying flat
  const U = [1, 0, 0], V = [0, Math.cos(phi), Math.sin(phi)];
  // (R19) pressed into a torus, not a flat ring: its hole opens as it is pressed and its band rounds
  // into a tube (the plasma, a little inside the vessel's lines); tb: 0 the flat band .. 1 the tube
  const rc = lerp(R / 2, RING_R, k), hw = lerp(R / 2, TUBE * 0.9, k), tb = smoothstep(0.2, 0.9, k);
  return { c, R, k, U, V, rc, hw, p, tb };
}
const onRim = (s, th, out = 1) => add(s.c, add(mul(s.U, Math.cos(th) * (s.rc + s.hw * out)), mul(s.V, Math.sin(th) * (s.rc + s.hw * out))));

// ---------------------------------------------------------------- the polar world (revision 11)
// the look's palette made polar: a deep blue zenith through ice blue to a pale peach horizon under the
// low sun, snow on the land, icy mountains; it gives way to the look's own base (so to the old night
// palette exactly) under the finished core
const L0 = lookPal(0), LNIGHT = palLinear(NIGHT);
const POLAR = Object.assign({}, L0, palLinear({
  P_ZEN: '#1A2352', P_UP: '#36468A', P_MID: '#6F80BC', P_LOW: '#A9C1DC', P_HOR: '#F2D9C8', P_GLOW: '#FFD3A6',
  A_HILL: '#E4EDF6', A_FLOOR: '#AFC0D8', P_MTL: '#CBD8EC', P_MTS: '#8D9FC8',
  P_KEY: ['#FFEAD8', 2.0], P_AMB: ['#A8C4F4', 0.44], P_FILL: ['#B8C8F0', 0.26], P_BNC: ['#D6E0EE', 0.2],
}));
const TO_LOOK = [150, 196];
function palAt(fl, kN) {
  const w = smoothstep(TO_LOOK[0], TO_LOOK[1], fl);
  if (w >= 1) return kN > 0 ? nightPal(kN, 0) : null;                 // exactly revision 10 from here on
  const base = palMix(POLAR, L0, w);
  return kN > 0 ? palMix(base, LNIGHT, kN) : base;
}
// the aurora: curtains far over the sea, faint at dusk, brighter as night falls, flaring as the
// coils are called down (140-156), then spent into them
const AUR_COLS = [[0.16, 0.95, 0.72], [0.3, 1.0, 0.42], [0.62, 0.42, 1.0], [0.2, 0.8, 0.95]];
// (R19) taller, into the sky the lower horizon gives them
const CURTAINS = [
  { x0: -52, x1: -4, z: 110, y: 17, h: 20, ph: 0.3, c: 0 }, { x0: -16, x1: 36, z: 130, y: 22, h: 25, ph: 1.7, c: 1 },
  { x0: 14, x1: 66, z: 105, y: 16, h: 18, ph: 2.9, c: 2 }, { x0: -36, x1: 24, z: 90, y: 13, h: 14, ph: 4.1, c: 3 },
];
const auroraK = (fl) => (0.3 + 0.5 * smoothstep(50, 110, fl) + 0.9 * Math.exp(-(((fl - 126) / 12) ** 2))) * (1 - smoothstep(150, 196, fl));
// each curtain is a row of thin vertical rays (painted strokes) hanging from a wavy hem, green-teal
// at the hem and violet toward the top, their brightness rippling along the row
function aurora(fl, out) {
  const A = auroraK(fl);
  if (A < 0.01) return;
  for (const c of CURTAINS) {
    const n = 40, top = AUR_COLS[2];
    for (let j = 0; j < n; j++) {
      const u = (j + 0.5 * hash(j, c.c + 11)) / n, x = lerp(c.x0, c.x1, u);
      const z = c.z + 3.5 * Math.sin(u * 7 + c.ph + fl * 0.05) + 1.8 * Math.sin(u * 17 + c.ph * 2 - fl * 0.08);
      const y0 = c.y + 2 * Math.sin(u * 5 + c.ph), hgt = c.h * (1.3 + 0.9 * hash(j, c.c + 21));
      const k = A * (0.5 + 0.5 * Math.sin(u * 13 + c.ph + fl * 0.13)) * Math.pow(Math.sin(Math.PI * u), 0.5);
      if (k < 0.02) continue;
      const hem = AUR_COLS[c.c === 2 ? 0 : c.c];
      const P = [[x, y0, z], [x, y0 + 0.45 * hgt, z], [x, y0 + hgt, z]];
      const col = [mul(hem, 1.5 * k), mul(lerp3(hem, top, 0.5), 1.0 * k), mul(top, 0.5 * k)];
      const wr = 0.28 + 0.3 * hash(j, c.c + 31);
      out.push({ P, w: [wr, wr * 1.2, wr * 0.8], S: null, bb: [1, 1, 1], col, a: [clamp(0.9 * k), clamp(0.6 * k), 0], seed: 0.2 + 0.013 * j + 0.1 * c.c });
    }
  }
}
// ice floes on the sea: flat pale plates, thicker near the shore; gone before the core lands
const FLOES = (() => {
  const out = [];
  for (let i = 0; i < 46; i++) {
    const r1 = hash(i, 3), r2 = hash(i, 4), r3 = hash(i, 5);
    const z = 9.5 + 60 * r1 * r1, x = (r2 - 0.5) * (14 + 1.6 * z) + 0.4;
    if (Math.abs(x - C[0]) < 3 && Math.abs(z - C[2]) < 4) continue;       // leave the ring's water open
    out.push({ x, z, l: 0.6 + 2.2 * r3, w: 0.25 + 0.6 * hash(i, 6), rot: (hash(i, 7) - 0.5) * 0.8 });
  }
  return out;
})();
function floes(fl, out, night) {
  const a = 1 - smoothstep(150, 188, fl), dk = 1 - 0.62 * night;
  if (a < 0.01) return;
  for (const f of FLOES) {
    const c = Math.cos(f.rot), s0 = Math.sin(f.rot), P = [], S = [];
    for (let j = -2; j <= 2; j++) { const t = j / 2 * f.l; P.push([f.x + c * t, 0.03, f.z + s0 * t]); S.push([-s0, 0, c]); }
    const wv = [0.55, 0.95, 1, 0.9, 0.5].map((v) => v * f.w);
    out.push({ P, w: wv, S, bb: [0, 0, 0, 0, 0], col: [0.62 * dk, 0.7 * dk, 0.8 * dk], a, seed: 0.5 + 0.01 * (f.x % 7) });
  }
}

// ---------------------------------------------------------------- the world painted in (revision 14)
const GREY36 = Object.assign({}, L0, palLinear({
  P_ZEN: '#50545E', P_UP: '#5E626C', P_MID: '#6C6F78', P_LOW: '#7A7C84', P_HOR: '#86878D', P_GLOW: '#8C8C90',
  P_SUNC: ['#9A9A9C', 0.3], P_DISC: ['#A8A8AA', 0.4], P_MTL: '#7C7E86', P_MTS: '#6A6C74', A_FLOOR: '#6E7078',
}));
const STROKE_W = 4.2;
const STROKES = [0, 1, 2, 3].map((c) => {
  const z0 = [4.2, 9.5, 16, 26][c], dir = c % 2 ? -1 : 1, P = [];
  for (let i = 0; i <= 60; i++) {
    const u = i / 60, x = (dir > 0 ? lerp(-9, 11, u) : lerp(11, -9, u)) * (1 + z0 / 30);
    const z = z0 + 0.8 * Math.sin(x / 2.2 + c);
    P.push([x, 0.05 + (z < 8.5 ? LAND.reduce((h, b) => h + b[0] * Math.exp(-(((x - b[1]) / b[3]) ** 2 + ((z - b[2]) / b[4]) ** 2)), 0) : 0), z]);
  }
  return { P, t0: PAINT[0] + 1 + 2 * c, t1: PAINT[0] + 1 + 2 * c + 13 };
});
const strokeHead = (st, fl) => { const u = clamp((fl - st.t0) / (st.t1 - st.t0)), f = u * (st.P.length - 1), i = Math.min(st.P.length - 2, Math.floor(f)); return { u, p: lerp3(st.P[i], st.P[i + 1], f - i), i }; };
// (R19) less like a wipe: the four strokes are laid in the first beat and their paint soaks outward
// over the next two; the sky's colour blooms out from the sun with a ragged edge; what grey is left
// fades in the last beat (see render)
function paintMask(M, k, fl, cam, B, sunC) {
  const g = M.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, M.width, M.height);
  g.setTransform(k, 0, 0, k, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
  // (R19) each stroke is a band lying on the land and the sea (so it never paints the sky), five
  // bristles across it, and it widens as its paint soaks outward
  const landY = (x, z) => 0.05 + (z < 8.5 ? LAND.reduce((h, b) => h + b[0] * Math.exp(-(((x - b[1]) / b[3]) ** 2 + ((z - b[2]) / b[4]) ** 2)), 0) : 0);
  const zMin = cam.pos[2] + 1.0;
  for (const st of STROKES) {
    const h = strokeHead(st, fl);
    if (h.u <= 0) continue;
    const spread = 1 + 1.7 * easeIO((fl - st.t1 + 6) / 46);
    const W = st.P.slice(0, h.i + 1).concat([h.p]);
    if (W.length < 2) continue;
    for (let b = -2; b <= 2; b++) {
      const hw = 0.5 * STROKE_W * spread * (b === 0 ? 1 : 0.82 + 0.05 * Math.abs(b)), off = b * 0.11 * STROKE_W * spread;
      const L = [], R = [];
      for (let i = 0; i < W.length; i++) {
        const a = W[Math.max(0, i - 1)], c = W[Math.min(W.length - 1, i + 1)];
        let dx = c[0] - a[0], dz = c[2] - a[2];
        const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        const rag = 1 + 0.12 * Math.sin(i * 0.9 + b * 2.1 + st.t0) + 0.06 * Math.sin(i * 2.3 + b);
        const side = (d) => {
          const x = W[i][0] - dz * d, z = Math.max(zMin, W[i][2] + dx * d);
          return project(B, [x, landY(x, z), z]);
        };
        L.push(side(off + hw * rag)); R.push(side(off - hw * rag));
      }
      g.fillStyle = b === 0 ? '#fff' : 'rgba(255,255,255,0.55)';
      g.beginPath();
      L.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
      for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
      g.closePath(); g.fill();
    }
  }
  // the sky and the far sea: the colour blooms out from the sun, a loaded brush's ragged edge
  const u = Math.pow(clamp((fl - 4) / 66), 1.3);                         // (over all three beats)
  if (u > 0) {
    const c = project(B, sunC), R = 1750 * u;
    g.fillStyle = '#fff'; g.beginPath();
    for (let j = 0; j <= 90; j++) {
      const th = j / 90 * 2 * Math.PI;
      const r = R * (1 + 0.1 * Math.sin(5 * th + 1.3) + 0.05 * Math.sin(9 * th + 0.4 + 0.05 * fl) + 0.025 * Math.sin(17 * th + 2.1));
      const x = c[0] + r * Math.cos(th), y = c[1] + 0.75 * r * Math.sin(th);
      if (j) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath(); g.fill();
  }
}

// ---------------------------------------------------------------- the binding energy curve (revisions 19-20)
// A physics diagram in light: the binding energy per nucleon B/A (MeV) against the mass number A (log
// scale): the light nuclei's steep, jagged climb to helium-4's spike, the broad peak at iron and
// nickel, the slow fall to uranium. D + T -> 4He + n is marked: from D (1.11) and T (2.83) up to 4He
// (7.07); the energy released is 4 x 7.07 - 2 x 1.11 - 3 x 2.83 = 17.6 MeV. (R20, like S34's band
// diagram) it is drawn on the ice shelf in perspective, just in front of the crowd: A across (x), B/A
// up the ice away from the lens (+z). Lines of light on the ice; the labels are ground text (decals),
// long in depth so they read from the shore.
const BE = [[1, 0], [2, 1.112], [3, 2.827], [4, 7.074], [6, 5.332], [7, 5.606], [9, 6.463], [10, 6.475], [11, 6.928],
  [12, 7.68], [14, 7.476], [16, 7.976], [20, 8.032], [24, 8.261], [28, 8.448], [32, 8.493], [40, 8.551], [56, 8.79],
  [62, 8.795], [84, 8.717], [120, 8.505], [138, 8.393], [184, 8.005], [208, 7.867], [238, 7.57]];
const BD = { x0: -3.0, w: 6.4, z0: 3.2, d: 1.9, amax: 250, emax: 9.5, lift: 0.03 };
const BCLK = { ax0: 40, ax1: 50, cv0: 46, cv1: 70, mk0: 68, ar0: 72, ar1: 80, lb0: 78, lb1: 92, out0: 104, out1: 118 };
const landAt = (x, z) => LAND.reduce((h, b) => h + b[0] * Math.exp(-(((x - b[1]) / b[3]) ** 2 + ((z - b[2]) / b[4]) ** 2)), 0);
const onIce = (x, z) => [x, landAt(x, z) + BD.lift, z];
const bdXZ = (A, e) => [BD.x0 + BD.w * Math.log10(A) / Math.log10(BD.amax), BD.z0 + BD.d * e / BD.emax];
const bdPt = (A, e) => onIce(...bdXZ(A, e));
const BE_XZ = BE.map(([A, e]) => bdXZ(A, e));
const BE_S = BE_XZ.reduce((s, p, i) => (i ? s.concat(s[i - 1] + Math.hypot(p[0] - BE_XZ[i - 1][0], p[1] - BE_XZ[i - 1][1])) : [0]), []);
const PALE = [0.9, 0.86, 0.8], COOL = [0.62, 0.8, 1.15];
const bdFade = (fl) => smoothstep(BCLK.ax0, BCLK.ax0 + 4, fl) * (1 - smoothstep(BCLK.out0, BCLK.out1, fl));
function bindingCurve(fl, lines) {
  const fade = bdFade(fl);
  if (fade <= 0.01) return;
  const seg = (a, b, w, I, c, glow = 3) => lines.push([...a, ...b, w, I * fade, c[0], c[1], c[2], glow]);
  // a polyline on the ice between two (x, z) points, in short steps so it follows the ice
  const run = (p, q, w, I, c, glow = 3, n = 8) => {
    for (let j = 0; j < n; j++) seg(onIce(lerp(p[0], q[0], j / n), lerp(p[1], q[1], j / n)), onIce(lerp(p[0], q[0], (j + 1) / n), lerp(p[1], q[1], (j + 1) / n)), w, I, c, glow);
  };
  // the axes, drawn out from the origin, with ticks (B/A 2, 4, 6, 8 MeV; A 10, 100)
  const ua = easeIO((fl - BCLK.ax0) / (BCLK.ax1 - BCLK.ax0));
  if (ua > 0) {
    const o = bdXZ(1, 0);
    run(o, bdXZ(Math.pow(BD.amax, ua), 0), 1.4, 0.6, PALE, 2.5, 24);
    run(o, bdXZ(1, BD.emax * ua), 1.4, 0.6, PALE, 2.5, 8);
    for (const e of [2, 4, 6, 8]) if (e < BD.emax * ua) { const p = bdXZ(1, e); run(p, [p[0] + 0.14, p[1]], 1.1, 0.45, PALE, 2, 2); }
    for (const A of [10, 100]) if (Math.log10(A) < ua * Math.log10(BD.amax)) { const p = bdXZ(A, 0); run(p, [p[0], p[1] + 0.12], 1.1, 0.45, PALE, 2, 2); }
  }
  // the curve, drawn from hydrogen to uranium
  const uc = easeIO((fl - BCLK.cv0) / (BCLK.cv1 - BCLK.cv0)), sEnd = uc * BE_S[BE_S.length - 1];
  for (let i = 1; i < BE_XZ.length && BE_S[i - 1] < sEnd; i++) {
    const r = Math.min(1, (sEnd - BE_S[i - 1]) / (BE_S[i] - BE_S[i - 1]));
    run(BE_XZ[i - 1], [lerp(BE_XZ[i - 1][0], BE_XZ[i][0], r), lerp(BE_XZ[i - 1][1], BE_XZ[i][1], r)], 2.2, 1.3, WARM, 3.5, 4);
  }
  // D and T light as points; the arrow climbs from them to 4He, which flashes as it arrives
  const um = smoothstep(BCLK.mk0, BCLK.mk0 + 4, fl);
  if (um > 0) { const d = bdPt(2, 1.112), t = bdPt(3, 2.827); seg(d, d, 5, 1.3 * um, COOL, 11); seg(t, t, 5, 1.3 * um, COOL, 11); }
  const ur = easeIO((fl - BCLK.ar0) / (BCLK.ar1 - BCLK.ar0));
  if (ur > 0) {
    const a = bdXZ(2.6, 1.3), c = bdXZ(5.5, 2.4), end = bdXZ(4.25, 6.3);
    const bz = (t) => [0, 1].map((m) => (1 - t) ** 2 * a[m] + 2 * (1 - t) * t * c[m] + t * t * end[m]);
    for (let j = 1; j <= 14; j++) { if ((j - 1) / 14 >= ur) break; run(bz((j - 1) / 14), bz(Math.min(ur, j / 14)), 1.6, 1.3, HOT, 3, 1); }
    if (ur >= 1) {
      const dx = end[0] - c[0], dz = end[1] - c[1], l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l;
      for (const s of [1, -1]) run(end, [end[0] - 0.13 * ux + s * 0.08 * uz, end[1] - 0.13 * uz - s * 0.08 * ux], 1.6, 1.3, HOT, 3, 1);
    }
    const he = bdPt(4, 7.074), flash = ur >= 1 ? Math.exp(-(fl - BCLK.ar1) / 6) : 0;
    seg(he, he, 6, 1.4 + 2.4 * flash, HOT, 12 + 10 * flash);
  }
}
// its labels, lying on the ice (hillx decals): each row of the atlas laid along x from (x, z), its
// glyphs `gz` deep and `gw` wide per character (long in depth, like road markings, so they read
// from the low camera), typed in and fading with the diagram
const BD_LABELS = [
  { text: 'binding energy per nucleon', x: -3.0, z: 5.18, gw: 0.05, gz: 0.3, t0: BCLK.ax1, t1: BCLK.ax1 + 14, a: 0.75, col: [0.95, 0.9, 0.82] },
  { text: 'A', x: 3.52, z: 3.12, gw: 0.07, gz: 0.3, t0: BCLK.cv1 - 4, t1: BCLK.cv1, a: 0.75, col: [0.95, 0.9, 0.82] },
  { text: 'D + T → ⁴He + n', x: -1.05, z: 3.74, gw: 0.058, gz: 0.36, t0: BCLK.lb0, t1: BCLK.lb0 + 10, a: 1, col: [1.25, 1.12, 0.95] },
  { text: '17.6 MeV', x: -1.05, z: 3.28, gw: 0.07, gz: 0.4, t0: BCLK.lb0 + 7, t1: BCLK.lb1, a: 1, col: [1.4, 0.82, 0.42] },
];
let BD_ATLAS = null;
function bindingLabels(fl, quads) {
  const fade = bdFade(fl);
  if (fade <= 0.01 || !BD_ATLAS) return;
  BD_LABELS.forEach((lb, li) => {
    const row = BD_ATLAS.rows[li], n = Math.round(row.n * clamp((fl - lb.t0) / (lb.t1 - lb.t0)));
    for (let c0 = 0; c0 < n; c0 += 2) {
      const c1 = Math.min(n, c0 + 2), xa = lb.x + c0 * lb.gw, xb = lb.x + c1 * lb.gw;
      const a = lb.a * fade;
      quads.push({ P: [onIce(xa, lb.z), onIce(xb, lb.z), onIce(xb, lb.z + lb.gz), onIce(xa, lb.z + lb.gz)],
        uv: [row.x0 + c0 * BD_ATLAS.adv, row.y0, row.x0 + c1 * BD_ATLAS.adv, row.y1], col: lb.col, a: [a, a, a, a] });
    }
  });
}

// ---------------------------------------------------------------- the field's lines (revision 20)
// The aurora as physics, kept faint: dipole field lines arc through the sky out of the pole (far north,
// left of the sun, on the horizon) and come down into the curtains, which hang where the lines come
// down: the field there is vertical, and an aurora's rays run along the field. Each line is
// r = L sin^2(theta) in its own meridian plane, L the distance from the pole to its curtain. A little
// light drifts down each line into the curtains (the electrons that light them); the tokamak's helices
// later carry on the same language.
const POLE = [-70, 0, 300];
const FIELD = (() => {
  const out = [];
  CURTAINS.forEach((c, ci) => {
    for (let k = 0; k < 4; k++) {
      const x = lerp(c.x0, c.x1, (k + 0.5) / 4), ex = x - POLE[0], ez = c.z - POLE[2], L = Math.hypot(ex, ez);
      const pts = [];
      for (let j = 0; j <= 44; j++) {
        const th = lerp(0.14, Math.PI / 2, j / 44), r = L * Math.sin(th) ** 2;
        pts.push([POLE[0] + ex / L * r * Math.sin(th), r * Math.cos(th), POLE[2] + ez / L * r * Math.sin(th)]);
      }
      out.push({ pts, col: lerp3(AUR_COLS[c.c === 2 ? 0 : c.c], [0.85, 0.9, 1.0], 0.5), ph: hash(ci * 4 + k, 41) });
    }
  });
  return out;
})();
function fieldLines(fl, lines) {
  const A = Math.min(1, auroraK(fl));
  if (A < 0.02) return;
  for (const f of FIELD) {
    const head = ((fl / 50 + f.ph) % 1) * 1.15;                    // the drifting light, out of the pole to the curtain
    for (let j = 1; j < f.pts.length; j++) {
      const s = j / (f.pts.length - 1), ends = smoothstep(0.02, 0.4, s) * (1 - 0.6 * smoothstep(0.85, 1, s));   // soft into the pole
      const pulse = Math.exp(-(((s - head) / 0.05) ** 2));
      const I = A * (0.1 + 0.28 * pulse) * ends;
      if (I < 0.004) continue;
      lines.push([...f.pts[j - 1], ...f.pts[j], 0.8, I, ...f.col, 2.5]);
    }
  }
}

// ---------------------------------------------------------------- the camera
// (R19) the horizon lower (about 130 px) so the aurora has the sky: the lens shifted down and the
// camera brought down toward the Clawds so they stay in frame; the landing camera is unchanged
const camShore = { pos: [0.3, 1.15, -2.5], pitch: 0.02, yaw: 0, F: 1500, ppy: 780 };
const camOver = { pos: [0.35, 2.2, -4.6], pitch: -0.035, yaw: 0, F: 1350, ppy: 770 };
const camOver2 = { pos: [0.38, 2.7, -3.6], pitch: -0.07, yaw: 0, F: 1450, ppy: 730 };
const camLand = { pos: CAM_LAND.pos, pitch: CAM_LAND.pitch, yaw: 0, F: CAM_LAND.F, ppy: CAM_LAND.pp[1] };
// a cubic Hermite through the keys (Catmull-Rom tangents, zero at the ends); from the last key on,
// exactly the fusion camera
function camFrame(fl) {
  const last = KEYS.length - 1;
  if (fl >= KEYS[last]) return { pos: CAM_LAND.pos.slice(), yaw: 0, pitch: CAM_LAND.pitch, F: CAM_LAND.F, pp: CAM_LAND.pp.slice() };
  const keys = [camShore, camOver, camOver2, camLand];
  const V = keys.map((c) => [...c.pos, c.pitch, Math.log(c.F), c.ppy]), n = V[0].length;
  const M = V.map((v, i) => (i === 0 || i === last) ? new Array(n).fill(0) : v.map((_, j) => (V[i + 1][j] - V[i - 1][j]) / (KEYS[i + 1] - KEYS[i - 1])));
  let seg = 0; while (seg < last - 1 && fl >= KEYS[seg + 1]) seg++;
  const a = KEYS[seg], b = KEYS[seg + 1], h = b - a, s = clamp((fl - a) / h);
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  const out = V[seg].map((_, j) => h00 * V[seg][j] + h10 * h * M[seg][j] + h01 * V[seg + 1][j] + h11 * h * M[seg + 1][j]);
  return { pos: out.slice(0, 3), yaw: 0, pitch: out[3], F: Math.exp(out[4]), pp: [960, out[5]] };
}
const SEEDING = { origin: [0.3, -1.5], yaw: 0, halfAngle: 0.75, d0: 3, d1: 70, nearTree: 8, nearTower: 95, fref: 1800 };

// ---------------------------------------------------------------- the inside state
function sceneAt(T, f, fl) {
  const cam = camFrame(fl), B = camBasis(cam);
  const sung = T.pulse('sung', f, 7), snare = fl >= 186 ? T.pulse('snares', f, 5) : 0;
  const sun = sunAt(fl);
  const lines = [], ribbons = [], tips = [];
  // the sun, then the ring: a painted band round its centre, in its own plane (bb 0), rounding into a
  // tube as it is pressed (bb 1: the band faces the lens all round, a torus)
  {
    const N = 96, P = [], Sd = [], col = [], bb = [];
    const I = lerp(5.2, 1.7, sun.k) * (1 + 0.9 * snare) * (1 + 0.2 * smoothstep(RING_DRAW[0], COIL_DRAW[1], fl));
    const tint = lerp3([1.0, 0.8, 0.52], [1.0, 0.62, 0.36], sun.k);
    for (let i = 0; i <= N; i++) {
      const a = 2 * Math.PI * i / N, d = add(mul(sun.U, Math.cos(a)), mul(sun.V, Math.sin(a)));
      P.push(add(sun.c, mul(d, sun.rc))); Sd.push(d); bb.push(sun.tb);
      const w = 1 + 0.12 * Math.sin(3 * a + fl * 0.2) * sun.k;           // the plasma stirs
      col.push(mul(tint, I * w));
    }
    aurora(fl, ribbons); floes(fl, ribbons, smoothstep(PULL[0] + 6, PRESS[1], fl));
    ribbons.push({ P, w: sun.hw, S: Sd, bb, col, a: 1, seed: 0.61 });
    // its light: a wide halo while it is the sun, then the ring's own glow
    const halo = (1 - sun.k) * (1 - 0.5 * sun.p);
    if (halo > 0.01) lines.push([...sun.c, ...sun.c, 30 * halo, 1.1 * halo, 1.0, 0.7, 0.42, 90 * halo]);
  }
  // the core in light: every edge drawn from its first end to its second over its slot, hot while it is
  // being drawn, settling warm; the ring's loops glow with the plasma
  for (const e of EDGES) {
    const r = clamp((fl - e.t0) / e.dt);
    if (r <= 0) continue;
    const Bw = lerp3(e.A, e.B, r);
    const fresh = r < 1 ? 1 : Math.exp(-(fl - e.t0 - e.dt) / 6);
    const c = fresh > 0.3 ? HOT : WARM;
    const I = e.dim * (0.72 + 0.9 * fresh) * (1 + 0.6 * snare);
    const hx = e.kind === 'helix';
    // (the helices: finer, whiter and a little brighter than the ring they wind round, so the twist reads
    // over the plasma's glow)
    const hc = hx ? HOT : c;
    lines.push([...e.A, ...Bw, hx ? 1.1 : 1.6, hx ? 1.9 * I : I, hc[0], hc[1], hc[2], hx ? 2.2 + 1.2 * fresh : 3.2 + 2 * fresh]);
    if (r < 1 && !hx) tips.push(Bw);
    // revision 12: the aurora's light comes down to each helix's growing tip and winds it round
    if (r < 1 && hx) {
      const k = e.line * 7 + 3, th = 1.3 * Math.sin(k * 2.39);
      const top = [C[0] + 34 * Math.sin(th), 40, C[2] + 125], ctl = [Bw[0] + 3 * Math.sin(k), Bw[1] + 11, Bw[2] + 9];
      const ac = AUR_COLS[k % AUR_COLS.length], N = 12;
      let prev = top;
      for (let j = 1; j <= N; j++) {
        const t = j / N, u1 = 1 - t, q = add(add(mul(top, u1 * u1), mul(ctl, 2 * u1 * t)), mul(Bw, t * t));
        const cc = lerp3(ac, HOT, smoothstep(0.8, 1, t)), Iq = (0.22 + 1.1 * t * t) * (1 + 0.5 * snare);
        lines.push([...prev, ...q, 0.9, Iq, cc[0], cc[1], cc[2], 2.2 + 1.2 * t]);
        prev = q;
      }
    }
  }
  bindingCurve(fl, lines);
  fieldLines(fl, lines);
  const quads = [];
  bindingLabels(fl, quads);
  // the Clawds: arms up while they hold the sun and while they draw; each with a beam to its hook, or
  // to a live tip once the core is being drawn
  const holding = fl >= HOOK + 2 && fl < PRESS[1];
  const crowd = [], beams = [];
  let main = null;
  const landH = (x, z) => LAND.reduce((h, b) => h + b[0] * Math.exp(-(((x - b[1]) / b[3]) ** 2 + ((z - b[2]) / b[4]) ** 2)), 0);
  const home = CREW[0];
  CREW.forEach((c, i) => {
    const u = fl - c.pop;
    if (u < 0) return;
    // the pop: out of his light in a small arc to its place (exact cells: it appears, it never grows)
    const land = i < 4 ? 1 : easeIO(u / 12);
    const x = lerp(home.x, c.x, land), z = lerp(home.z, c.z, land);
    const y = landH(x, z);
    const hop = i < 4 ? 0 : 0.5 * Math.sin(Math.PI * clamp(u / 12));   // (R14) no bobbing: one arc as each arrives
    const mid = [x, y + hop + 0.3, z];
    const sx = project(B, mid)[0];
    const inPlace = i < 4 || u >= 12;
    let look = 0, beam = null, bI = 0;
    if (holding && inPlace) {
      beam = onRim(sun, c.th); bI = smoothstep(HOOK, HOOK + 5, fl) * (1 - smoothstep(PRESS[1] - 6, PRESS[1], fl)) * (i < 4 ? 1 : smoothstep(12, 16, u));
    } else if (tips.length && inPlace) {
      beam = tips[(i * 7 + Math.floor(fl / 9) * 3) % tips.length]; bI = 1;
    }
    const calling = fl >= HELIX_DRAW[0] && fl < HELIX_DRAW[1] && inPlace;   // arms up to the aurora
    if (beam && bI > 0.01) {
      lines.push([...mid, ...beam, 0.8, (0.55 + 0.45 * sung) * bI, ...HOT, 2.5]);
      beams.push({ i, A: mid, Z: beam, a: bI });
      const dx = project(B, beam)[0] - sx;
      look = dx > 40 ? 1 : dx < -40 ? -1 : 0;
    }
    const up = !!beam || calling || (i === 0 && fl >= OUT[0] - 4 && fl < HOOK);
    const popFlare = i === 0 ? POPS.reduce((a, p) => a + Math.exp(-Math.max(0, fl - p) / 5) * smoothstep(p - 3, p, fl), 0) * 0.7 : 0;
    // (R23, Claire: like S34's) a solid in the world, not a sprite: the crew faces the lens while the
    // world is painted in and the cursors leave; then each turns three-quarters toward the sun, his
    // work, as his hook takes hold (the new ones once they have landed): a quarter turn at most, so he
    // reads as himself, and the camera's rise shows his sides and top
    const aL = Math.atan2(camShore.pos[0] - x, camShore.pos[2] - z) + 0.3 * (hash(i, 23) - 0.5);
    const turn = (i === 0 ? 0.3 : 0.45) * (c.x < 0.4 ? 1 : -1);
    const tw = i < 4 ? smoothstep(HOOK - 6, HOOK + 10, fl) : smoothstep(c.pop + 8, c.pop + 22, fl);
    const yaw = aL - turn * easeIO(tw);
    const pose = { x, z, y, u: U_CLAWD, form: 'luminous', hop, look, yaw, armL: up ? -2 : 0, armR: up ? -2 : 0,
      glow: 1.0 + 0.25 * (up ? 1 : 0) + popFlare + (i === 0 ? 0.9 * Math.exp(-Math.max(0, fl - OUT[0]) / 6) * smoothstep(OUT[0] - 4, OUT[0], fl) : 0),
      eyeLight: 0.5 + 0.4 * sung, alpha: i < 4 ? 1 : smoothstep(0, 3, u) };
    if (i === 0) main = Object.assign(pose, { light: 1.2 }); else crowd.push(pose);
  });
  // the sky drains to night as the sun comes down; its glow and the sea's glint follow the sun
  const dv = [sun.c[0] - cam.pos[0], sun.c[1] - cam.pos[1], sun.c[2] - cam.pos[2]];
  const az = Math.atan2(dv[0], dv[2]) * 180 / Math.PI, el = Math.atan2(dv[1], Math.hypot(dv[0], dv[2])) * 180 / Math.PI;
  const kN = lerp(0, 0.86, smoothstep(PULL[0] + 6, PRESS[1], fl)) + 0.1 * smoothstep(PRESS[1], 200, fl);
  return {
    state: {
      rung: 4, time: 80 + fl / 30, cam, hill: LAND, solidClawds: { depth: 4 }, sun: { az, el: Math.max(el, -8) }, tree: null, mountains: 0, props: false,
      salt: 1 - smoothstep(170, 196, fl),
      river: { pts: SEA.pts, head: SEA.head, flow: 0.4 * fl / 30 },
      clawd: main, crowd, lines, ribbons, ribbonCore: 0.5, palLin: palAt(fl, kN),
      decals: quads.length ? { src: BD_ATLAS.canvas, key: BD_ATLAS.key, quads } : undefined,
      // the night sea goes dark under the finished core (the Clawds are out of frame by then), so the
      // ring and coils carry the light into S21's flash; ribbons and lines are drawn over the dim
      dim: lerp(1, 0.4, smoothstep(146, 200, fl)),
    },
    cam, B, sun, beams,
  };
}

// ---------------------------------------------------------------- the cursors and their code (2D, over the frame)
const CUR_S = 0.95;
function cursorsAt(fl, B, sun, clawdPx) {
  const out = [];
  CREW.slice(0, 4).forEach((c, i) => {
    const st = STROKES[i], t0 = st.t0 - 1, arrive = HOOK - 2 + i;
    const lead = i === 0;
    const t2 = lead ? 186 : BURN[1];
    if (fl < t0 || fl > t2) return;
    const hookPx = () => { const q = project(B, onRim(sun, c.th, 1.15)); return [q[0], q[1]]; };
    const head = (f) => { const q = project(B, strokeHead(st, f).p); return [q[0], q[1]]; };
    let p, a = 1, burn = 0, press = 0;
    if (fl <= st.t1) {
      // (R14) laying its stroke of the world, pressed down as it paints
      p = head(fl); press = 0.35; a = smoothstep(t0, t0 + 2, fl);
    } else if (fl < arrive) {
      const u = easeIO((fl - st.t1) / (arrive - st.t1)), q = hookPx(), s0 = head(st.t1);
      const mid = [lerp(s0[0], q[0], 0.5) + (i - 1.5) * 70, Math.min(s0[1], q[1]) - 60];
      p = [(1 - u) ** 2 * s0[0] + 2 * (1 - u) * u * mid[0] + u * u * q[0], (1 - u) ** 2 * s0[1] + 2 * (1 - u) * u * mid[1] + u * u * q[1]];
    } else if (fl < BURN[0] || !lead && fl < BURN[1]) {
      p = hookPx(); press = fl < arrive + 4 ? Math.exp(-Math.pow((fl - arrive - 1) / 1.5, 2)) : 0;
      if (!lead) burn = smoothstep(BURN[0], BURN[1], fl);
    } else {
      // the lead cursor lets go and hovers by the ring to type the coils' line, then flies home
      const q = hookPx(), home = [clawdPx[0], 1150];
      const drift = [q[0] + 90 * easeIO((fl - BURN[0]) / 20), q[1] - 40 * easeIO((fl - BURN[0]) / 20)];
      const u = easeIO((fl - 170) / 16);
      p = [lerp(drift[0], home[0], u), lerp(drift[1], home[1], u)];
    }
    out.push({ p, a, burn, press, i });
  });
  return out;
}
let CURSOR = null;
function drawOverlay(g, k, fl, B, sun, clawdPx) {
  if (fl < 0 || fl > 186) return;
  g.save(); g.setTransform(k, 0, 0, k, 0, 0);
  const curs = cursorsAt(fl, B, sun, clawdPx);
  for (const cu of curs) {
    if (cu.a <= 0.01 || cu.burn >= 1) continue;
    const hx = cu.p[0] + 16 * CUR_S, hy = cu.p[1] + 28 * CUR_S, hr = 34;
    const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
    hg.addColorStop(0, `rgba(255,190,130,${(0.35 * cu.a).toFixed(3)})`); hg.addColorStop(1, 'rgba(255,170,120,0)');
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = hg; g.fillRect(hx - hr, hy - hr, 2 * hr, 2 * hr); g.restore();
    CURSOR.draw(g, cu.p[0], cu.p[1], { s: CUR_S, press: cu.press, rot: -0.08 + 0.04 * (cu.i - 1.5), fill: HIS.card, edge: HIS.edge,
      glow: 1.0, bs: CUR_S / 1.45, lit: 1, heat: 0.1 + 0.8 * cu.burn, litAt: [26, 40], a: cu.a, shadow: 0,
      burn: cu.burn, burnAt: [36, 80], burnSeed: cu.i * 1.7 });
  }
  g.restore();
}
// the code on the beams: each beam carries its Clawd's line, typed out of the Clawd along the beam in
// perspective (a fixed size in the world, so it shrinks with distance), drifting slowly outward. It
// reads left to right whichever way the beam leans, and is quieter than the beam it rides.
const CH = 0.14, CW = 0.085, S0 = 0.55, DRIFT = 0.012;
function drawBeamCode(g, k, fl, B, beams) {
  if (!beams.length) return;
  g.save(); g.setTransform(k, 0, 0, k, 0, 0);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const bm of beams) {
    const { text, t0 } = codeFor(bm.i, fl), age = fl - t0;
    if (age < 0) continue;
    const n = Math.min(text.length, Math.floor(age * 3.2) + 1);
    const d = sub(bm.Z, bm.A), L = Math.hypot(d[0], d[1], d[2]), dir = mul(d, 1 / L);
    const at = (sArc) => add(bm.A, mul(dir, sArc));
    const pa = project(B, at(S0)), pb = project(B, at(Math.min(L, S0 + 1)));
    const fwd = pb[0] >= pa[0];
    const a = bm.a * 0.62 * smoothstep(0, 2, age);
    for (let j = 0; j < n; j++) {
      const sArc = S0 + DRIFT * age + (fwd ? j : n - 1 - j) * CW;
      const out = 1 - smoothstep(0.5, 0.78, sArc / L);             // it thins out before the target
      if (out <= 0.02) continue;
      const p = project(B, at(sArc)), q = project(B, at(sArc + 0.02));
      if (p[2] < 0.3) continue;
      const fs = clamp(B.F * CH / p[2], 0, 26);
      if (fs < 6) continue;
      let ang = Math.atan2(q[1] - p[1], q[0] - p[0]); if (!fwd) ang += Math.PI;
      g.save(); g.translate(p[0], p[1]); g.rotate(ang);
      g.font = `${fs.toFixed(1)}px Consolas, "Courier New", monospace`; g.globalAlpha = a * out;
      g.shadowColor = 'rgba(40,14,8,0.6)'; g.shadowBlur = 3;
      g.fillStyle = 'rgb(255,170,112)'; g.fillText(text[j], 0, 0);
      g.restore();
    }
  }
  g.restore();
}

// ---------------------------------------------------------------- the shot
let hill, glc, g2, greyCv, maskCv, maskBlur;
const mkCv = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
export default {
  async setup(ctx) {
    glc = document.createElement('canvas'); glc.width = ctx.W; glc.height = ctx.H;
    g2 = ctx.canvas.getContext('2d');
    greyCv = mkCv(ctx.W, ctx.H); maskCv = mkCv(ctx.W, ctx.H); maskBlur = mkCv(ctx.W, ctx.H);
    const HXL = await loadHillxDoor(ctx.log, { icy: false, solid: true });
    if (!HXL.solid) ctx.log('S36: WARNING no solid Clawds');
    hill = HXL.createHill(glc, { log: ctx.log, seeding: SEEDING });
    hill.warm([4]);
    CURSOR = createPaperCursor(47);
    BD_ATLAS = codeAtlas(BD_LABELS.map((l) => l.text), { px: 48, width: 2048, maxH: 512 });
    ctx.log(`S36: ${EDGES.length} core edges; ring ${RING_DRAW.join('-')}, coils ${COIL_DRAW.join('-')}; landing camera ${CAM_LAND.pos.map((v) => v.toFixed(2))}`);
  },
  render(ctx, fr) {
    const { T } = ctx, k = ctx.scale;
    const fl = fr.fl < 54 ? fr.fl * 72 / 54 : fr.fl + 18;     // (R15) the time warp
    const I = sceneAt(T, fr.f, fl);
    const painting = fl < PAINT[1];
    if (painting) {
      // (R14) the unpainted world first, kept aside: grey, no sun, no aurora or floes
      hill.render(Object.assign({}, I.state, { palLin: GREY36, salt: 1, ribbons: [], lines: [], decals: undefined }));
      const gg = greyCv.getContext('2d'); gg.globalCompositeOperation = 'source-over'; gg.setTransform(1, 0, 0, 1, 0, 0);
      gg.clearRect(0, 0, ctx.W, ctx.H); gg.drawImage(glc, 0, 0);
    }
    hill.render(I.state);
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.drawImage(glc, 0, 0);
    if (painting) {
      paintMask(maskCv, k, fl, I.cam, I.B, I.sun.c);
      const mb = maskBlur.getContext('2d'); mb.clearRect(0, 0, ctx.W, ctx.H); mb.filter = `blur(${(10 * k).toFixed(1)}px)`; mb.drawImage(maskCv, 0, 0); mb.filter = 'none';
      const gg = greyCv.getContext('2d'); gg.globalCompositeOperation = 'destination-out'; gg.drawImage(maskBlur, 0, 0); gg.globalCompositeOperation = 'source-over';
      g2.globalAlpha = 1 - smoothstep(PAINT[1] - 24, PAINT[1], fl);
      g2.drawImage(greyCv, 0, 0);
      g2.globalAlpha = 1;
    }
    const m = I.state.clawd, cp = project(I.B, [m.x, m.y + 0.45, m.z]);
    drawBeamCode(g2, k, fl, I.B, I.beams);
    drawOverlay(g2, k, fl, I.B, I.sun, [cp[0], cp[1]]);
    // out of S35's warm hall: the first half-beat opens a little dimmer and warmer
    if (fl < 10) {
      const u = smoothstep(0, 10, fl), m3 = [lerp(0.64, 1, u), lerp(0.5, 1, u), lerp(0.47, 1, u)].map((v) => Math.round(255 * v));
      g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'multiply';
      g2.fillStyle = `rgb(${m3.join(',')})`; g2.fillRect(0, 0, ctx.W, ctx.H); g2.globalCompositeOperation = 'source-over';
    }
  },
};
