// S18, the pivot (bars 48-52), the film's midpoint: the tool is given freely (revisions 4-5, 13).
// Revision 13 (Claire: more time for him to explore with the cursor): five bars. Bar 48, the humans'
// cursor (the one that built his worlds) comes down over him; bar 49, the hover, let-go, fall and
// catch (local 118); bar 50, his first edits with it, each a typed line: a pebble, a puddle, a
// sapling, undone and redone; bar 51, paint(cursors=10) and the ten cursors paint the valley and
// bring in the other worlds; bar 52, they burn into light that returns to him, and the hill swells.
// Local frames are n below; the valley's own clock (camera, palette, strokes, burn, pulse, hill) runs
// on the earlier timeline T = V(n), so bar 52's last beats are as before and S19 (T = 288 + fl)
// continues unchanged. The notes below describe that timeline T.
// Revision 15 (Claire: a cursor of his own, dragged in for him; his first original creation; the
// humans make more of him): bar 48, the humans' indigo cursor drags in a new blank cream cursor, which
// trails just behind it like a dragged file, and carries it above him; he looks up. Bar 49, it lets
// go and withdraws upward, keeping its own; the new cursor flutters down slowly, rocking side to side,
// his eyes following it; he steps under it and catches it (118), and it lights orange from inside.
// Bars 50-51 as before (the first edits; the sapling is planted where the tree of the final scene will
// stand; the ten cursors). Bar 52: the light returns to him; he turns to the sapling, and it starts
// to grow in light (sets/valley/bigtree.js: S31's tree, drawn in light, then filled in S19) as the
// hill swells. Clawd acts with his eyes: one hop in bar 51, one at the light, one at the redo.
// Revision 16 (Claire: room after the copy): four bars, everything a bar earlier. Bar 48: the drag-in
// (beats 1-2), the release (27), a brisker flutter, the catch on the upbeat 48.4 (54); it lights orange
// as the drums drop out on 49.1 (72), and he first looks at his lit cursor on the first sung word (91).
// Bar 49: the first edits on the sung onsets (97, 105, 118, 127, 136). Bar 50: paint(cursors=10) (144)
// and the ten cursors. Bar 51: the burn, the light back to him, the sapling growing, the hill.
// - Phrase 1: the humans' indigo paper cursor (S10/S11's) comes down from the top of the frame
//   and hovers above him, bobbing gently, held; he looks up at it. Then it is let go: a tiny
//   pause, it slumps and tips over, and falls like paper, swaying and tilting into each swing.
//   He steps under it and hops, and catches it on his head on the bar-50 downbeat; warm light
//   floods the card from where it landed and it settles into his own orange card.
// - Phrase 2: he uses it once, the way they did: one line in his panel. On Enter (the phrase-2
//   onset) it splits into ten orange cursors that fan out across the valley.
// - Phrases 2-3: he commands them at once (looks around, arms up, hops on the onsets). Each
//   drags long brush strokes across the ground; under a stroke the grey facets become paint
//   (directional brushwork, rung-4 greens) and, a few frames behind the brush, melt into smooth
//   forms. Strokes reach further on each phrase, to the horizon by phrase 4. No radial wash:
//   paint arrives only where a cursor draws (sets/valley/strokes.js). Revision 5: each cursor
//   types its own line of code in orange beside it (CODES / SHOW below).
// - Phrase 4: the cursors burn away into motes of warm light that stream back into him; he
//   glows, and on the bar-52 downbeat one soft pulse of his own light finishes the smoothing.
//   The valley stays painted (revision 5: no flattening); S19 continues this same state
//   (valleyParams) and raises the hill from it.
import { makeStage, clamp, lerp, ss, easeInOut, easeOut } from '../sets/valley/shotkit.js';
import { NEUTRAL, RUN, solidGrid } from '../sets/valley/clawd3d.js';
import { GRIDS, mirror } from '../sets/hill/clawd-pose.js';
import { hillBumps, hillHeight, hillToValley } from '../sets/valley/raise.js';
import { createBigTree, treeLines } from '../sets/valley/bigtree.js';
import { createLightLines } from '../sets/fields/lightlines.js';
import { HX, HZ, YAW, SUN_END, TH_C, TH_V, D_END, breakdownCam } from '../sets/valley/breakdown.js';
import { createPaperCursor, HIS, PAPER } from '../sets/valley/papercursor.js';
import { projectPx, camBasis } from '../sets/valley/valley.js';
import { createStrokeMaps, pathAt, tipAt, strokePath } from '../sets/valley/strokes.js';
import { createSprouts, SAPLING } from '../sets/valley/sprouts.js';
import { rng } from '../lib/util.js';

const G = {}; for (const k of Object.keys(GRIDS)) G[k] = solidGrid(GRIDS[k]);
const WAVE = ['waveA', 'waveB', 'waveC', 'waveB'].map((k) => mirror(G[k]));   // an arm raised toward screen left
// revision 15: his eyes moved within any pose (dx columns toward screen right, dy rows; -1 = up), so
// he can follow things with his eyes alone
export function eyes(grid, dx, dy) {
  if (!dx && !dy) return grid;
  const g = grid.map((r) => r.split(''));
  const at = [];
  g.forEach((row, r) => row.forEach((ch, c) => { if (ch === 'o') at.push([r, c]); }));
  const ok = at.every(([r, c]) => g[r + dy] && (g[r + dy][c + dx] === '#' || g[r + dy][c + dx] === 'o'));
  if (!ok || !at.length) return dy ? eyes(grid, dx, 0) : grid;
  at.forEach(([r, c]) => { g[r][c] = '#'; });
  at.forEach(([r, c]) => { g[r + dy][c + dx] = 'o'; });
  return g.map((r) => r.join(''));
}
const LOOK = { up: eyes(NEUTRAL, 0, -1), upLeft: eyes(NEUTRAL, -1, -1), upRight: eyes(NEUTRAL, 1, -1) };
const CREAM = '#E8DDC6';                                  // the new cursor: blank paper, unlit
const CODE = 'paint(cursors=10)';
const NC = 10;

// ---------------------------------------------------------------- timing (local frames)
// sung phrase onsets 19, 94, 151, 188; bar downbeats 0, 72, 144, 216 (the chroma steps down
// A G F E D on 34, 72, 108, 144 and lands on G at 216)
const T_LOOK = 26, T_ARRIVE = 32, T_PAUSE = 48, T_LET = 51, T_FALL = 55, T_SQ = 63, T_TOUCH = 72;
const STEP = [-0.27, -0.14];     // his quick step toward screen left, under the falling card (m)
const T_TYPE0 = 83, T_TYPE1 = 92, T_ENTER = 94;
const T_BURN = 188, T_PULSE = 216;
// the hill (revision 6), on S18's timeline T (S19 is T 288-359): per HILL bump, start and length
const RISE = [[252, 70], [266, 70], [258, 72]];          // crest, shoulder (the tree's seat), base
const rise = (r, t) => easeInOut(clamp((t - r[0]) / r[1]));
const FULL = hillBumps([1, 1, 1]);
const CAM_BACK = 1.6, CAM_UP = 0.4;
// revision 11: the crater's still lake (carved as cursor 9's first stroke passes) and the salt plain
const CRATER = { x: 0.5, z: 58.5, t0: 102 + 1.2 * 5 }, SALT_BOX = [-16, 68, 16, 94];

let St, SM, CUR, GY, STROKES, SCHED, MOTES, ARRIVE, SPR, BT, LL;
const SEGS = new Float32Array(9 * 2000);

// ---------------------------------------------------------------- revision 13: five bars
// V(n): local frame n -> the earlier timeline T (monotone cubic through the keys, slope 1 at the end)
const VKEYS = [[0, 0], [72, 72], [144, 94], [213, 188], [234, 216], [252, 252], [287, 287]];
const VM = (() => {
  const K = VKEYS, n = K.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
  m.push(d[0]);
  for (let i = 1; i < n - 1; i++) {
    const h0 = K[i][0] - K[i - 1][0], h1 = K[i + 1][0] - K[i][0];
    m.push(d[i - 1] * d[i] <= 0 ? 0 : 3 * (h0 + h1) / ((2 * h1 + h0) / d[i - 1] + (h1 + 2 * h0) / d[i]));
  }
  m.push(1);
  return m;
})();
export function V(x) {
  const K = VKEYS;
  if (x <= 0) return x * VM[0];
  if (x >= K[K.length - 1][0]) return K[K.length - 1][1] + (x - K[K.length - 1][0]);
  let i = 0; while (x > K[i + 1][0]) i++;
  const h = K[i + 1][0] - K[i][0], t = (x - K[i][0]) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * VM[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * VM[i + 1];
}
// the humans' cursor in new frames: comes down (bar 48), hovers, is let go on the sung onset at 97,
// falls, and he catches it at 118; P1 maps those frames to the earlier acting (let-go on: slope 1)
const N = { come: 3, arrive: 22, let: 27, fall: 31, touch: 54, lit: 72 };
const N_ENTER = 144;
// the earlier phrase-1 acting (look 26, let-go 51, step, hop 63, catch 72) on the new frames: the let-go
// on 76, a slow fall with a slow step under it, the catch still on 118
const P1K = [[0, 0], [3, 10], [22, 32], [25, 48], [27, 51], [31, 55], [45, 63], [54, 72]];
const P1 = (n) => {
  if (n >= 54) return n + 18;
  let i = 0; while (i < P1K.length - 2 && n > P1K[i + 1][0]) i++;
  const [a0, b0] = P1K[i], [a1, b1] = P1K[i + 1];
  return lerp(b0, b1, clamp((n - a0) / (a1 - a0)));
};
// his first edits (bar 50), each a typed line with its Enter frame (sung onsets where they fall)
const EDITS = [
  { code: 'add(pebble)', at: 97, spot: 'pebble' },
  { code: 'add(puddle)', at: 105, spot: 'puddle' },
  { code: 'grow(sapling)', at: 118, spot: 'sapling' },
  { code: 'undo()', at: 127, spot: 'sapling' },
  { code: 'redo()', at: 136, spot: 'sapling' },
];
const LINES = [...EDITS.map((e) => ({ code: e.code, at: e.at })), { code: CODE, at: N_ENTER }];
const typeLen = (L) => Math.max(5, Math.round(L.code.length / 1.6));
// revision 16: the lines come quick, so each types between the last one's Enter and its own; its panel
// shows from START and gives way to the next one's (or folds, when there is room)
const LT0 = [], START = [];
LINES.forEach((L, i) => {
  LT0.push(Math.max(i ? LINES[i - 1].at + 3 : 0, L.at - typeLen(L) - 1));
  START.push(i ? Math.max(LT0[i] - 2, LINES[i - 1].at + 2) : LT0[0] - 2);
});
// where each thing goes (world x, z), around the spot where he catches the cursor
// revision 15: the sapling is planted where the tree of the final scene will stand (S31's tree, on the
// hill's inner shoulder), so the hill rises under it and it grows into that tree in S19
export const TREE_HILL = [-3.2, 9.6];
export const TREE_SEAT = hillToValley(TREE_HILL[0], TREE_HILL[1]);
const SPOT = { pebble: [HX + 1.55, HZ - 1.25], puddle: [HX - 2.2, HZ - 0.9], sapling: TREE_SEAT };
// the tree on the valley clock T: drawn in light from 256 (bar 52), filled 292-330 (S19)
export const treeAt = (T) => ({ g: ss(256, 318, T), fill: ss(292, 330, T), lines: ss(256, 262, T) * (1 - ss(318, 332, T)), glow: 0.7 * ss(256, 270, T) * (1 - ss(300, 330, T)) });
// how far each thing has grown at frame n (0..1); all done by bar 51
function grownAt(n) {
  const eb = (t0, len, c) => easeOutBack(clamp((n - t0) / len), c);
  let sap = eb(118, 9, 1.6);
  if (n >= 127) sap *= 1 - easeInOut(clamp((n - 127) / 5));
  if (n >= 136) sap = eb(136, 8, 1.8);
  return { pebble: eb(97, 6, 2.4), puddle: easeOut(clamp((n - 105) / 8)), sapling: sap, sapTop: clamp((n - (n >= 136 ? 136 : 118) - 3) / 6) };
}
const easeOutBack = (t, c = 1.6) => { t = clamp(t); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
// the sprouts' state for the valley renderer: pivots in world metres (riding the land and the hill)
function sproutState(n, hill, T = 0) {
  const g = grownAt(n), parts = new Float32Array(48), glow = new Float32Array(12);
  const gone = 1 - ss(262, 278, T), lit = 0.9 * ss(238, 252, T);
  const ground = (x, z) => St.V.heightAt(x, z) + (hill ? hillHeight(hill, x, z) : 0);
  const put = (i, x, y, z, sc) => parts.set([x, y, z, sc], i * 4);
  const fresh = (at) => (n < at ? 0 : 0.9 * Math.exp(-(n - at) / 7));
  let [x, z] = SPOT.pebble; put(0, x, ground(x, z), z, g.pebble); glow[0] = fresh(97);
  [x, z] = SPOT.puddle; put(1, x, ground(x, z) + 0.01, z, g.puddle); glow[1] = 0.5 * fresh(105);
  [x, z] = SPOT.sapling;
  const y0 = ground(x, z), gT = Math.max(0, g.sapling) * gone, at = n >= 136 ? 136 : 118;
  put(2, x, y0, z, gT);
  SAPLING.clumps.forEach((K, i) => { const gc = easeOutBack(clamp((n - at - 3 - 2 * i) / 7), 2.0) * (n >= 127 && n < 136 ? gT : 1) * (gT > 0.02 ? 1 : 0) * gone; put(3 + i, x + K[0] * gT, y0 + K[1] * gT, z + K[2] * gT, gc); });
  for (let i = 2; i < 6; i++) glow[i] = Math.max(fresh(at), lit);
  return { parts, glow };
}
// the card during the edits: its tip's world position (hovering, tapping on each Enter) and the click
function editCard(n) {
  const G0 = (k) => { const [x, z] = SPOT[k]; return St.V.heightAt(x, z); };
  const above = (k, h) => { const [x, z] = SPOT[k]; return [x, G0(k) + h, z]; };
  const keys = [
    [N.lit + 15, HOLD()], [93, above('pebble', 0.45)], [98, above('pebble', 0.45)], [101, above('puddle', 0.45)],
    [106, above('puddle', 0.45)], [113, above('sapling', 1.45)], [137, above('sapling', 1.45)], [142, HOLD()],
  ];
  if (n < keys[0][0] || n >= N_ENTER) return null;
  let p = keys[keys.length - 1][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, A] = keys[i], [t1, B] = keys[i + 1];
    if (n < t1) { const e = easeInOut((n - t0) / (t1 - t0)), d = Math.hypot(B[0] - A[0], B[2] - A[2]); p = [lerp(A[0], B[0], e), lerp(A[1], B[1], e) + Math.min(0.9, 0.12 * d) * 4 * e * (1 - e), lerp(A[2], B[2], e)]; break; }
  }
  // the tap: down to the ground on Enter and back up
  let press = 0, dip = 0;
  for (const E of EDITS) {
    const t = n - E.at;
    if (t > -3 && t < 5) { const k = t < 0 ? ss(-3, 0, t) : 1 - ss(1, 4, t); dip = Math.max(dip, k); press = Math.max(press, t >= 0 ? Math.exp(-t / 3) : 0); }
  }
  const E = EDITS.find((e) => Math.abs(n - e.at) < 5) || EDITS[0];
  const gy = G0(E.spot) + (E.spot === 'sapling' ? 0.15 : 0.05);
  p = [p[0], lerp(p[1], gy, dip), p[2]];
  return { p, press };
}
// his acting from the catch to Enter: he watches the card and what it makes, and delights in it
function editActing(n) {
  let pose = 'lookUp', yaw = 0, dy = 0, lean = -0.08;
  // (revision 16: it rests on his head, lights on 49.1, rises beside him, and he looks at it on the first
  // sung word; then his eyes follow each edit)
  const beats = [[65, 'lookUp'], [72, 'surprised'], [77, 'wonder'], [84, 'upRight'], [91, 'right'], [94, 'downRight'],
    [97, 'surprised'], [100, 'happy'], [102, 'downLeft'], [105, 'surprised'], [108, 'left'], [118, 'surprised'],
    [121, 'left'], [127, 'down'], [136, 'happy'], [140, 'lookUp']];
  for (const [at, p] of beats) if (n >= at) pose = p;
  const looks = [[90, 0.22], [101, -0.28], [108, -0.45], [139, 0]];
  for (let i = 0; i < looks.length; i++) { const [at, y] = looks[i], prev = i ? looks[i - 1][1] : 0; if (n >= at) yaw = lerp(prev, y, ss(at, at + 5, n)); }
  let grid = null;
  const hop = (t0, len, h) => { const t = n - t0; if (t < 0 || t >= len) return; const u = t / len; pose = ['hopSquash', 'hopStretch', 'hopApex', 'hopFall', 'hopSquash'][Math.min(4, Math.floor(u * 5))]; dy = h * Math.sin(Math.PI * clamp((u - 0.14) / 0.72)); };
  hop(136, 11, 0.14);
  if (n >= 127 && n < 136) lean = -0.02;
  grid = pose === 'upRight' ? LOOK.upRight : (G[pose] || NEUTRAL);
  return { grid, dy, lean, yaw, squash: 1, sx: STEP[0], sz: STEP[1] };
}
// revision 15, bars 48-49: the new cursor (C) carried in by the humans' cursor (H) and let fall. Screen
// px (1920 wide) through px; H's tip is the grip, C trails it by two frames like a dragged file; at the
// let-go H clicks it free and withdraws upward, and C flutters down slowly, rocking, to his head.
function carried(n, px, gyNow) {
  const H0 = px([HX, GY + 0.78, HZ]), s = clamp(16.5 / Math.max(H0[2], 0.1), 0.5, 1.5);
  const TAIL = [34, 81], tailOff = (r, sc) => [(TAIL[0] * Math.cos(r) - TAIL[1] * Math.sin(r)) * sc, (TAIL[0] * Math.sin(r) + TAIL[1] * Math.cos(r)) * sc];
  const HOV = [H0[0] - 34, H0[1] - 212];
  const hold = (t) => {
    if (t < N.arrive) { const d = easeOut(clamp((t - N.come) / (N.arrive - N.come))); return [HOV[0] + 300 * (1 - d) + 12 * Math.sin((t - N.come) * 0.09) * (1 - d), lerp(-340, HOV[1], d), -0.05 - 0.14 * (1 - d)]; }
    const ph = 2 * Math.PI * (t - N.arrive) / 20; return [HOV[0] + 3 * Math.sin(ph * 0.5), HOV[1] + 5 * Math.sin(ph), -0.05 + 0.03 * Math.sin(ph + 1.1)];
  };
  const c = hold(Math.max(N.come, Math.min(n, N.let) - 2));
  let x = c[0] + 30 * s, y = c[1] + 40 * s, rot = c[2] - 0.06, flip = 1;      // (trailing below right, like a dragged file)
  const limp = easeInOut(clamp((n - N.let) / (N.fall - N.let))), sag = Math.pow(clamp((n - N.let) / (N.fall - N.let)), 2);
  rot -= 0.45 * limp; y += 10 * sag; x -= 4 * limp;
  const tsq = actingN(N.touch), hc = px([HX + tsq.sx, gyNow + 0.78 + tsq.dy, HZ + tsq.sz]);
  const R_CATCH = 0.1, catchTip = [hc[0] - tailOff(R_CATCH, s)[0], hc[1] - tailOff(R_CATCH, s)[1] + 3];
  if (n >= N.fall) {
    const u = clamp((n - N.fall) / (N.touch - N.fall)), x0 = x, y0 = y, r0 = rot;
    const sw = Math.sin(3 * Math.PI * u) * (1 - 0.3 * u);
    x = lerp(x0, catchTip[0], u) + 58 * sw;
    y = lerp(y0, catchTip[1], 0.3 * u * u + 0.7 * Math.pow(u, 1.1)) - 10 * Math.pow(Math.abs(Math.sin(3 * Math.PI * u)), 2) * (1 - u);
    rot = lerp(r0, R_CATCH, ss(0, 0.85, u)) + 0.36 * Math.cos(3 * Math.PI * u) * ss(0, 0.1, u) * (1 - 0.5 * u);
    flip = 1 - 0.3 * (0.5 - 0.5 * Math.cos(6 * Math.PI * u)) * ss(0, 0.1, u) * (1 - ss(0.85, 1, u));
  }
  const hg = hold(Math.max(N.come, Math.min(n, N.let)));
  const away = Math.pow(clamp((n - N.let - 2) / 22), 2);
  const H = { x: hg[0] + 160 * away, y: hg[1] - 780 * away, rot: hg[2] - 0.12 * away, on: away < 1,
    press: n >= N.let - 3 && n < N.let + 3 ? Math.sin(Math.PI * (n - N.let + 3) / 6) : 0 };
  // his eyes: on the pair while it is carried, then on the falling cursor
  let eye = null;
  if (n >= 8 && n < 50) eye = [Math.abs(x - H0[0]) < 50 ? 0 : Math.sign(x - H0[0]), y < H0[1] - 120 ? -1 : 0];
  return { x, y, rot, flip, s, tailOff, R_CATCH, H, eye };
}
// his acting at local frame n: the earlier phrase 1 re-timed, the edits, then as before from Enter
export function actingN(n) {
  if (n < N.touch + 11) return acting(P1(n));
  if (n < N_ENTER) return editActing(n);
  return acting(V(n));
}

// ---------------------------------------------------------------- the strokes
// Wave 1 is laid out in the view at local ~120 (d: depth past him along the view, l: lateral),
// wave 2 in the view at ~160, wave 3 in world metres out to the mountains.
export function planStrokes() {
  const R = rng(1849);
  const S = [];
  const add = (cur, pts, w, t0, dur, o = {}) => S.push(Object.assign({ cur, pts, w, t0, dur, tint: R(), seed: R() * 10, dry: 0.7 + 0.25 * R() }, o));
  // wave 1 (phrase 2): bold strokes around him, seen from above his shoulder
  const w1 = (i) => 102 + 1.2 * i;
  add(0, [[12, 35], [0, 36.4], [-15, 35]], 3.0, w1(0), 28);
  add(1, [[-19, 43], [-4, 42.8], [15, 44.5]], 2.8, w1(1), 28);
  add(2, [[-21, 33], [-11, 50], [1, 66]], 3.0, w1(2), 28);
  add(3, [[10, 28], [13, 47], [14, 68]], 2.6, w1(3), 28);
  add(4, [[-30, 30], [-35, 52], [-33, 76]], 4.2, w1(4), 28);
  add(5, [[20, 57], [-4, 60], [-27, 65]], 4.5, w1(5), 28);           // over the crater lake
  add(6, [[-44, 46], [-53, 72], [-56, 102]], 6.0, w1(6), 28);
  add(7, [[-42, 84], [-12, 77], [17, 83]], 6.0, w1(7), 28);          // across the salt plain
  add(8, [[-12, 70], [-30, 96], [-52, 130]], 5.0, w1(8), 28);
  add(9, [[4, 70], [10, 96], [5, 124]], 5.0, w1(9), 28);
  // waves 2 and 3 (phrase 3, to the horizon by phrase 4): bands across the view receding from
  // the final camera, each about as wide as its distance allows (a landscape painted in bands)
  const DEG = Math.PI / 180, C = [HX + Math.sin(TH_C + Math.PI) * D_END, HZ + Math.cos(TH_C + Math.PI) * D_END];
  const band = (D, dir, seed, azL = -68, azR = 36) => {
    const P = [], n = 9;
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1), az = (dir > 0 ? lerp(azL, azR, t) : lerp(azR, azL, t)) * DEG;
      const r = D * (1 + 0.07 * Math.sin(az * 3.1 + seed) + 0.04 * Math.sin(az * 7.3 + 2 * seed));
      P.push([C[0] + Math.sin(az) * r, C[1] + Math.cos(az) * r]);
    }
    return P;
  };
  // wave 2: whole bands from just behind him out to the valley floor
  const W2 = [13, 17.5, 24, 33, 45, 62, 85, 116, 158, 215];
  for (let i = 0; i < NC; i++) {
    const D = W2[i], dir = (i % 2) ? 1 : -1;
    add(i, band(D, dir, R() * 6, -72, 58), 0.21 * D * (0.9 + 0.2 * R()), 146 + 0.8 * i, 16, { dry: 0.45, taper: 0.25 });
  }
  // wave 3: the far land in half-bands drawn from the edges of the view in toward the vanishing
  // point (the cursors finish, and burn, on screen near the horizon); cursors 8 and 9 sweep the
  // foreground under the settling lens, big across the bottom of the frame
  const W3 = [290, 520, 1000, 2100], MEET = [-30, 8, -19, -3];
  for (let i = 0; i < 8; i++) {
    const lvl = i >> 1, left = (i & 1) === 0, D = W3[lvl];
    const az0 = left ? -66 : 46, az1 = MEET[lvl] + (left ? 5 : -5);
    add(i, band(D, 1, R() * 6, az0, az1), 0.37 * D * (0.95 + 0.1 * R()), 168 + 0.8 * i, 24, { dry: 0.8, taper: 0.35 });
  }
  // (their tints echo the restyled S19's opening meadow: a deep teal band, olive at the bottom)
  add(8, band(8.2, 1, R() * 6, -76, 42), 2.8, 170, 18, { dry: 0.2, taper: 0.1, tint: 0.056 });
  add(9, band(4.6, -1, R() * 6, -84, 46), 2.7, 172, 18, { dry: 0.1, taper: 0.05, tint: 0.17 });   // (wide: S19's camera eases back over it)
  return S;
}

// Each cursor types its own line of code beside it as it paints (Claire, cut 5: "reinforce
// intentionality"): orange monospace, typed as the stroke starts, faded when it is done. The lines
// by stroke index; only those in SHOW are drawn (about four per wave, spread across the frame).
const CODES = [
  'ground.paint(green)', 'meadow.stroke(dir=east)', 'slope.paint(grass)', 'bank.soften()', 'field.stroke(dir=north)',
  'crater.fill(lake)', 'ridge.paint(moss)', 'plain.paint(salt)', 'path.blend(edges)', 'river.bank.soften()',
  'foreground.paint()', 'band.stroke(dir=east)', 'facets.relax()', 'field.paint(green)', 'slope.stroke(dir=west)',
  'meadow.paint(deep)', 'rocks.paint(warm)', 'hills.stroke(dir=north)', 'valley.paint(far)', 'grass.stroke(dir=east)',
  'horizon.paint(warm)', 'ridge.stroke(dir=west)', 'far.hills.paint()', 'peaks.paint(ice)', 'valley.floor.paint()',
  'peaks.blend(sky)', 'distance.stroke()', 'world.relax()', 'meadow.paint(teal)', 'edges.soften()',
];
// Wave 1's cursors stay on screen long enough to read (five lines); wave 2's cross the frame in
// about five frames, so it has none; in wave 3 three more, spread apart, are set above their
// cursors as they converge on the horizon, fading as they burn into light.
// A line starts typing when its cursor first comes on screen during the stroke.
const SHOW = new Map([[1, 0], [2, 0], [5, 0], [7, 0], [20, -40], [23, -40], [25, -64]]);

// each cursor: the split point, then its strokes in order; flights between them
function schedule() {
  const C = [];
  for (let i = 0; i < NC; i++) {
    const mine = STROKES.filter((s) => s.cur === i).sort((a, b) => a.t0 - b.t0);
    const burn = T_BURN + [0, 3, 1, 5, 2, 6, 4, 7, 2, 4][i];
    // a cursor needs a few frames to fly between strokes; its last stroke ends as it burns
    for (let k = 1; k < mine.length; k++) mine[k].t0 = Math.max(mine[k].t0, mine[k - 1].t0 + mine[k - 1].dur + 6);
    const last = mine[mine.length - 1];
    last.dur = Math.max(12, Math.min(last.dur, burn + 4 - last.t0));
    C.push({ i, strokes: mine, depart: T_ENTER + 3 + 1.1 * i, burn });
  }
  return C;
}
const HOLD = () => [HX + 0.95, GY + 1.55, HZ - 0.4];
function groundAt(x, z) { return St.V.heightAt(x, z); }
// world position of cursor c's tip at frame t, and whether it is pressing (drawing)
function cursorWorld(c, t) {
  const S = c.strokes;
  const start = (s) => { const p = pathAt(s, 0); return [p.x, groundAt(p.x, p.z), p.z]; };
  const end = (s) => { const L = strokePath(s).L, p = pathAt(s, L); return [p.x, groundAt(p.x, p.z), p.z]; };
  const fly = (A, B, u) => { const e = easeInOut(clamp(u)), d = Math.hypot(B[0] - A[0], B[2] - A[2]); const h = Math.min(3, 0.25 + 0.03 * d) * 4 * e * (1 - e); return [lerp(A[0], B[0], e), lerp(A[1], B[1], e) + h, lerp(A[2], B[2], e)]; };
  if (t < S[0].t0) return { p: fly(HOLD(), start(S[0]), (t - c.depart) / (S[0].t0 - c.depart)), press: ss(S[0].t0 - 4, S[0].t0, t), dir: null };
  for (let k = 0; k < S.length; k++) {
    const s = S[k], t1 = s.t0 + s.dur;
    if (t < t1 || k === S.length - 1) {
      if (t >= t1) { const e = end(s); return { p: e, press: 1, dir: null, done: true }; }
      const tip = tipAt(s, t), q = pathAt(s, tip);
      return { p: [q.x, groundAt(q.x, q.z), q.z], press: 1, dir: [q.tx, q.tz], stroke: s };
    }
    const n = S[k + 1];
    if (t < n.t0) {
      const u = (t - t1) / (n.t0 - t1);
      return { p: fly(end(s), start(n), u), press: 1 - ss(0, 0.3, u) + ss(0.75, 1, u), dir: null };
    }
  }
  return null;
}

// the first frame (from the stroke's start up to fl) at which cursor c's tip is on screen
function labelStart(c, st, fl) {
  for (let t = Math.floor(st.t0 - 1); t <= fl; t++) {
    const w = cursorWorld(c, Math.max(t, st.t0));
    if (!w) continue;
    const q = projectPx(camBasis(breakdownCam(Math.min(1, t / 287), GY), 1920, 1080), w.p);
    if (q[2] > 1.2 && q[0] > 60 && q[0] < 1860 && q[1] > 60 && q[1] < 1020) return t;
  }
  return null;
}

// motes: each cursor burns from its tail and sheds sparks that fly into him
function planMotes() {
  const R = rng(5207), M = [];
  const arrow = [[0, 0], [0, 72], [17, 57], [28, 84], [40, 79], [29, 53], [51, 53]];
  const inside = (x, y) => { let c = false; for (let i = 0, j = arrow.length - 1; i < arrow.length; j = i++) { const [xi, yi] = arrow[i], [xj, yj] = arrow[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  const BURN_AT = [36, 80];
  for (let i = 0; i < NC; i++) {
    let n = 0;
    while (n < 14) {
      const x = R() * 52, y = R() * 86;
      if (!inside(x, y)) continue;
      const d = Math.hypot(x - BURN_AT[0], y - BURN_AT[1]) / 96;
      M.push({ c: i, at: [x, y], born: d * 12 + R() * 3, dur: 16 + R() * 14, bend: (R() - 0.5) * 2.4, lift: 0.2 + R() * 1.4, size: 0.5 + R() * 0.7, wob: R() * 6.28 });
      n++;
    }
  }
  return M;
}

// ---------------------------------------------------------------- Clawd's acting
function acting(fl) {
  let grid = null, dy = 0, lean = 0, yaw = 0;
  let pose = 'neutral';
  if (fl >= 7 && fl < 10) pose = 'blink';
  const hop = (t0, len, h, poseSet = ['hopSquash', 'hopStretch', 'hopApex', 'hopFall', 'hopSquash']) => {
    const t = fl - t0; if (t < 0 || t >= len) return false;
    const u = t / len, i = Math.min(4, Math.floor(u * 5));
    pose = poseSet[i]; grid = null; dy = h * Math.sin(Math.PI * clamp((u - 0.14) / 0.72)); return true;
  };
  // phrase 1: he sees it coming down and looks up at it while it hovers; it is let go, he
  // starts, steps under it as it flutters down, and hops to catch it on the bar-50 downbeat
  if (fl >= T_LOOK) pose = 'lookUp';
  if (fl >= T_LET && fl < T_LET + 4) pose = 'surprised';
  const stepOut = ss(T_LET + 4, T_LET + 11, fl), stepBack = ss(98, 106, fl);
  if ((fl >= T_LET + 4 && fl < T_LET + 11) || (fl >= 98 && fl < 106)) grid = RUN[(Math.floor(fl / 2) + 1) & 3];
  hop(T_SQ, 20, 0.30);
  if (fl >= T_SQ + 20 && fl < T_ENTER) pose = fl < 88 ? 'hopApex' : 'lookUp';
  lean = -0.12 * ss(T_LOOK - 2, T_LOOK + 6, fl) * (1 - ss(T_LET + 2, T_LET + 5, fl)) + 0.06 * (stepOut - ss(T_SQ - 2, T_SQ, fl)) * (fl < T_SQ ? 1 : 0)
    - 0.08 * ss(T_SQ + 20, T_SQ + 26, fl) * (1 - ss(T_ENTER, T_ENTER + 6, fl));
  // phrase 2: Enter; the cursors fan out, he steps back to his spot, watches them go, arms up
  if (fl >= T_ENTER) pose = fl < 100 ? 'surprised' : 'wonder';
  const looks = [[106, 'left', -0.35], [114, 'right', 0.30], [123, 'left', -0.25], [133, 'wonder', 0.1], [140, 'right', 0.35], [158, 'left', -0.3], [172, 'wonder', 0.0], [180, 'right', 0.2]];
  if (fl >= 106 && fl < T_BURN) for (const [at, p, y] of looks) if (fl >= at) { pose = p; yaw = y; }
  if (fl >= 98 && fl < 106) pose = null;
  hop(108, 14, 0.18);                                              // (revision 15: one hop in bar 51)
  // phrase 4: the cursors burn, the light streams in; he takes it in, arms up
  if (fl >= T_BURN && fl < T_PULSE - 4) pose = fl < 196 ? 'surprised' : 'hopApex';
  hop(T_PULSE - 8, 16, 0.14);
  if (fl >= T_PULSE + 8) pose = 'hopApex';                         // arms up in his light
  // revision 15: he turns to the sapling; it starts to grow in light, and the hill swells under them
  if (fl >= 236) pose = 'left';
  if (fl >= 250) pose = 'wonder';
  if (fl >= 258 && fl < 262) pose = 'surprised';                   // the land lifts him
  if (fl >= 262) { pose = null; grid = LOOK.upLeft; }               // watching the tree rise in light
  // S19 (T 288-359): the humans' cursor returns (322) and selects him (324), types clawd.copy(4), and
  // on 342 four copies of him appear; they glance at each other
  if (fl >= 322) { pose = null; grid = LOOK.upRight; }
  if (fl >= 324 && fl < 327) { pose = 'surprised'; grid = null; }
  if (fl >= 327) { pose = null; grid = LOOK.up; }
  if (fl >= 342 && fl < 346) { pose = 'surprised'; grid = null; }
  if (fl >= 346) { pose = 'left'; grid = null; }
  if (fl >= 352) pose = 'right';
  if (fl >= 357) pose = 'happy';
  yaw = yaw * (1 - ss(T_BURN - 4, T_BURN + 8, fl));
  if (!grid) grid = pose === 'neutral' || !pose ? NEUTRAL : G[pose];
  // his step under the falling card (toward screen left), and back
  const st = stepOut - stepBack;
  let yw = lerp(0, yaw, ss(104, 110, fl));
  for (const [at, d] of [[236, -0.42], [318, 0.42]]) yw += d * ss(at, at + 7, fl);   // to the sapling, and back toward the lens
  return { grid, dy, lean, yaw: yw, squash: 1, sx: STEP[0] * st, sz: STEP[1] * st };
}
export { acting };
const T_P3 = () => 151;

// The valley at S18's local frame fl, for Clawd acting A. fl may run past the shot's end: S19
// continues this same state (all painted, the light released) and adds the hill to it.
export const stage = () => ({ St, GY, SM, CUR, LL });
export const POSES = G;
export function valleyParams(ctx, fl, t, f, A, n = fl) {
  const u = Math.min(1, fl / 287);
  const vox = ctx.T.envSmooth('vocals', f, 4);
  const CX = HX + A.sx, CZ = HZ + A.sz;                 // where he stands (he steps to catch it)
  const gy = St.V.heightAt(CX, CZ);
  // --- his glow: the motes arriving, then released in the pulse
  let arrived = 0; for (const a of ARRIVE) if (a <= fl) arrived++;
  const took = arrived / ARRIVE.length;
  const release = ss(T_PULSE, T_PULSE + 30, fl);
  const touchFlash = Math.exp(-Math.max(0, fl - T_TOUCH) / 7) * ss(T_TOUCH - 2, T_TOUCH, fl);
  const glow = 1 + (0.9 * touchFlash + 1.1 * took * (1 - release) + 0.6 * Math.exp(-Math.max(0, fl - T_PULSE) / 10) * ss(T_PULSE - 1, T_PULSE, fl)) * (1 - ss(250, 270, fl));
  // --- his pulse: one soft ring of light, smoothing what it passes
  const tp = fl - T_PULSE, rings = [];
  let pulse = [0, 0, 0, 1], pulseK = 0;
  if (tp >= 0) {
    const Rr = 2600 * (1 - Math.exp(-tp / 24)) + 0.5;
    pulse = [HX, HZ, Rr, 2.5 + 0.3 * Rr];
    pulseK = 0.9 * Math.exp(-tp / 20) * ss(0, 2, tp);
  }
  // --- camera: one slow move from above his shoulder down to eye level beside him
  const cam = breakdownCam(u, GY);
  // revision 13: the lens leans in a little while he makes his first things (bar 50), and back out
  // as the ten cursors fan out
  const pk = 2.6 * ss(76, 100, n) * (1 - ss(142, 166, n));
  cam.pos = [cam.pos[0] + cam.fwd[0] * pk, cam.pos[1] + cam.fwd[1] * pk, cam.pos[2] + cam.fwd[2] * pk];
  const strokes = SM.render(fl);
  strokes.smooth = 1.0;
  strokes.pulse = pulse; strokes.pulseK = pulseK;
  strokes.bleed = ss(184, 214, fl);          // phrase 4: the rest of the world follows, the paint closing its gaps
  const P = {
    cam: { pos: cam.pos, fwd: cam.fwd, fovy: cam.fovy, pp: cam.pp },
    time: t,
    learn: { spawn: [0, 0, 0, 1] },
    strokes,
    rings, smooth: 0,
    paint: lerp(1.0, 1.45, ss(60, 200, fl)),
    pal: lerp(0.3, 1.0, ss(20, 230, fl)),
    clawd: { x: CX, z: CZ, y: gy + A.dy, yaw: YAW + A.yaw, lean: A.lean, depth: 4, grid: A.grid, squash: A.squash, glow: glow + 0.15 * vox },
    hideAgents: true,
    shadow: { c: [HX, 0, HZ + 6], r: lerp(24, 60, ss(0, 0.6, u)) },
    key: [lerp(18, 14, u), lerp(21, 13, ss(0.5, 1, u))], sun: [lerp(9, SUN_END[0], ss(0.2, 1, u)), lerp(2.2, SUN_END[1], ss(0.2, 1, u))],
    exposure: lerp(0.9, 0.97, u), warm: 0.35 * ss(80, 280, fl),
    bloomThr: lerp(0.8, 0.72, ss(60, 280, fl)), rays: lerp(0.6, 0.9, u), glow: 1 + 0.5 * touchFlash + 0.7 * took * (1 - release),
  };
  // --- revision 6: with his own light he raises the hill (sets/hill HILL, raise.js) from bar 52
  // beat 3 (T 252) through S19; the crest leads, the broad base follows, the shoulder comes last.
  // The land glows warm where it is rising.
  const g = RISE.map((r) => rise(r, fl)), dg = RISE.map((r) => rise(r, fl + 0.5) - rise(r, fl - 0.5));
  const bumps = g.some((x) => x > 0) ? hillBumps(g, dg.map((d, i) => 22 * d * FULL[i].amp)) : [];
  // revision 11 (Claire): the worlds he learned in drop 1 come in with the strokes. Cursor 9 carves a
  // crater's still lake, cursor 7 lays a salt plain, and the far strokes put the icy shore's blues
  // on the peaks (glsl.js strokeAlb, uTraits).
  const cr = ss(CRATER.t0 + 4, CRATER.t0 + 22, fl);
  if (cr > 0) bumps.push({ amp: -9 * cr, x: CRATER.x, z: CRATER.z, rate: 0, su: 4.8, sv: 4.8, rx: 1, rz: 0 }, { amp: 2.6 * cr, x: CRATER.x, z: CRATER.z, rate: 0, su: 7.3, sv: 7.3, rx: 1, rz: 0 });
  P.hill = bumps.length ? bumps : null;
  P.traits = { ice: 1, salt: 1, saltBox: SALT_BOX };
  const hC = P.hill ? hillHeight(P.hill, CX, CZ) : 0;
  P.clawd.y += hC;
  // revision 13: the things he made in his first edits (they ride the land as the hill rises); revision
  // 15: the sapling grows into the tree of the final scene, drawn in light (bar 52) and then filled (S19)
  const sp = n >= 94 ? sproutState(n, P.hill, fl) : null;
  const TR = treeAt(fl);
  let tst = null, lh = null;
  if (TR.g > 0) {
    const [tx, tz] = TREE_SEAT;
    tst = { base: [tx, St.V.heightAt(tx, tz) + (P.hill ? hillHeight(P.hill, tx, tz) : 0) - 0.04, tz], yaw: TH_V, g: TR.g, fill: TR.fill, glow: TR.glow, time: t };
    if (TR.lines > 0.004) {
      const nL = treeLines(SEGS, 0, TR.g, tst.base, TH_V, P.cam.pos, 2.4, TR.lines);
      if (nL) lh = LL.hook(SEGS, nL, P);
    }
  }
  if (sp || tst) {
    P.extra = (gl, c) => { if (sp) SPR.draw(gl, c, P, sp); if (tst) BT.draw(gl, c, P, tst); if (lh) lh(gl, c); };
    P.extraShadow = (gl, c) => { if (sp) SPR.drawShadow(gl, c, P, sp); if (tst) BT.drawShadow(gl, c, P, tst); };
  }
  const flare = ss(240, 250, fl) * (1 - ss(272, 304, fl)) + 0.8 * ss(300, 306, fl) * (1 - ss(318, 332, fl));   // (S19 adds its own at the copy)
  P.clawd.glow += 1.3 * flare;
  P.glow += 0.5 * flare;
  // --- the camera eases back and up a little as the hill rises (level: the horizon stays at y 780)
  const e = easeInOut(clamp((fl - 252) / 90));
  P.cam.pos = [P.cam.pos[0] - P.cam.fwd[0] * CAM_BACK * e, P.cam.pos[1] + CAM_UP * e, P.cam.pos[2] - P.cam.fwd[2] * CAM_BACK * e];
  // keep the lens above the ground as it comes down
  P.cam.pos[1] = Math.max(P.cam.pos[1], St.V.heightAt(P.cam.pos[0], P.cam.pos[2]) + (P.hill ? hillHeight(P.hill, P.cam.pos[0], P.cam.pos[2]) : 0) + 0.55);
  return { P, CX, CZ, gy: gy + hC, glow };
}

export default {
  async setup(ctx) {
    St = makeStage(ctx, { agents: false, pools: [{ x: CRATER.x, z: CRATER.z, r: 8.5 }] });
    GY = St.V.heightAt(HX, HZ);
    STROKES = planStrokes();
    STROKES.forEach((st, i) => { st.code = CODES[i]; st.show = SHOW.has(i) || !!globalThis.__P18_ALL_LABELS; st.above = SHOW.get(i) || 0; });
    SCHED = schedule();
    SM = createStrokeMaps(St.V, STROKES, { near: { c: [0, 100], half: 128, res: 1024 }, far: { c: [0, 900], half: 4200, res: 1024 } });
    MOTES = planMotes();
    // when each mote reaches him (for his glow)
    ARRIVE = MOTES.map((m) => SCHED[m.c].burn + m.born + m.dur).sort((a, b) => a - b);
    CUR = createPaperCursor(31);
    SPR = createSprouts(St.V);
    BT = createBigTree(St.V);
    LL = createLightLines(St.V);
    ctx.log(`S18: ${STROKES.length} strokes, ${MOTES.length} motes; last stroke ends ${Math.max(...STROKES.map((s) => s.t0 + s.dur))}`);
  },
  render(ctx, fr) {
    const n = fr.fl, f = fr.f, fl = V(n);          // local frame, and the valley's clock
    const k = ctx.W / 1920;
    const A = actingN(n);
    const { P, CX, CZ, gy: gyNow } = valleyParams(ctx, fl, fr.t, f, A, n);
    // revision 15: his eyes follow the new cursor (the same camera the render uses)
    if (n >= 8 && n < 50) {
      const B0 = camBasis(P.cam, 1920, 1080), c0 = carried(n, (q) => projectPx(B0, q), gyNow);
      if (c0.eye) P.clawd.grid = eyes(P.clawd.grid, c0.eye[0], c0.eye[1]);
    }
    const info = St.V.render(P);
    const g = St.g2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(St.glc, 0, 0);
    const B = info.B;
    const toPx = (p) => { const q = projectPx(B, p); return [q[0] / k, q[1] / k, q[2]]; };   // 1920-based px + depth
    const sizeAt = (z) => clamp(16.5 / Math.max(z, 0.1), 0.5, 1.5);
    g.save(); g.setTransform(k, 0, 0, k, 0, 0);
    // Clawd's screen box, so cursors behind him are hidden by him
    const cb = [toPx([CX - 0.85, gyNow + A.dy, CZ]), toPx([CX + 0.85, gyNow + A.dy + 1.2, CZ])];
    const cz = toPx([CX, gyNow, CZ])[2];
    const clawdBox = [Math.min(cb[0][0], cb[1][0]) - 4, Math.min(cb[0][1], cb[1][1]) - 4, Math.abs(cb[1][0] - cb[0][0]) + 8, Math.abs(cb[1][1] - cb[0][1]) + 8];
    const behindClawd = (fn, depth) => {
      if (depth <= cz) { fn(); return; }
      g.save(); g.beginPath(); g.rect(-100, -100, 2200, 1400); g.rect(...clawdBox); g.clip('evenodd'); fn(); g.restore();
    };
    const head = toPx([CX, gyNow + 0.78 + A.dy, CZ]);          // his head, now
    // ------------------------------------------------ bars 48-50: the humans' cursor, given freely; his first edits
    if (n >= N.come && n < N_ENTER + 2) {
      // revision 15: the new cursor, carried in by the humans' cursor, let go, fluttering down
      const C0 = carried(n, toPx, gyNow);
      const s = C0.s, tailOff = C0.tailOff, R_CATCH = C0.R_CATCH;
      let x = C0.x, y = C0.y, rot = C0.rot, press = 0, flip = C0.flip, bump = 1;
      // caught: it rests on his head as he lands, lit from where it touched
      if (n >= N.touch) {
        const tc = n - N.touch;
        x = head[0] - tailOff(R_CATCH, s)[0]; y = head[1] - tailOff(R_CATCH, s)[1] + 3; rot = R_CATCH;
        bump = 1 - 0.06 * Math.exp(-tc / 2.5) * Math.cos(tc * 1.3);
        press = 0.7 * Math.exp(-tc / 6);
      }
      const lit = easeOut(clamp((n - N.lit) / 8));                 // (revision 16: it lights as the drums drop out)
      const heat = n < N.lit ? 0 : 0.06 + 0.94 * Math.exp(-(n - N.lit) / 7);
      // then his light lifts it off him and it rises beside him, upright: his now
      const hp = toPx(HOLD());
      const up = easeInOut(clamp((n - N.lit - 3) / 12));
      x = lerp(x, hp[0], up); y = lerp(y, hp[1], up) - 4 * Math.sin((n - N.touch) * 0.22) * up * (1 - ss(N_ENTER - 6, N_ENTER, n));
      rot = lerp(rot, -0.1, up);
      // his first edits: it goes to each spot, hovers while his line types, and taps on Enter
      const E = editCard(n);
      if (E) { const q = toPx(E.p); x = q[0]; y = q[1]; press = Math.max(press, 0.9 * E.press); rot = -0.1 + 0.05 * Math.sin((n - 130) * 0.13); }
      const his = ss(N.lit - 1, N.lit + 3, n);
      // his panel beside the card: each line opens, types, flashes on Enter and folds away (one at a
      // time: the next line's panel replaces the last)
      let li = -1; for (let i = 0; i < LINES.length; i++) if (n >= START[i]) li = i;
      if (li >= 0) {
        const L = LINES[li], t0 = LT0[li], end = li + 1 < LINES.length ? START[li + 1] - 1 : L.at + 9;
        const first = li === 0 || START[li] > LINES[li - 1].at + 6;            // (it opens, or takes the last one's place)
        const room = end - L.at >= 5;                                          // (it folds, or gives way)
        const open = (first ? easeOut(clamp((n - START[li] + 1) / 3)) : 1) * (room ? 1 - easeInOut(clamp((n - end + 3) / 3)) : 1);
        if (n <= end && open > 0.001) CUR.panel(g, x + 58, y + 22, L.code, { open, typed: clamp((n - t0 + 1) / Math.max(2, L.at - t0)), caret: n < L.at, fill: HIS.panel, flash: Math.exp(-Math.pow((n - L.at) / 3, 2)) * (n >= L.at - 1 ? 1 : 0) });
      }
      if (n < N_ENTER) {
        // his light around the card once it is lit
        if (lit > 0) {
          const cx = x + Math.cos(rot) * 20 * s - Math.sin(rot) * 40 * s, cy = y + Math.sin(rot) * 20 * s + Math.cos(rot) * 40 * s;
          const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 130 * s);
          gr.addColorStop(0, `rgba(255,196,140,${(0.42 * lit * (0.35 + heat)).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,170,120,0)');
          g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = gr; g.fillRect(cx - 140 * s, cy - 140 * s, 280 * s, 280 * s); g.restore();
        }
        CUR.draw(g, x, y, { s: s * bump, press, rot, flip, fill: his > 0.5 ? HIS.card : CREAM, edge: his > 0.5 ? HIS.edge : [226, 214, 196], glow: n < N.lit ? 0.35 : 1 + 0.25 * lit, bs: s * k / 1.45, lit: his > 0.5 ? 1 : lit, heat, litAt: [34, 80] });
        // the humans' cursor over it while it carries it; then it withdraws, keeping its own
        if (C0.H.on && n < N.touch) CUR.draw(g, C0.H.x, C0.H.y, { s, press: C0.H.press, rot: C0.H.rot, fill: PAPER.slate, bs: s * k / 1.45 });
      }
    }
    // ------------------------------------------------ phrases 2-4: his eight cursors
    if (fl >= T_ENTER) {
      const hp = toPx(HOLD());
      const items = [];
      for (const c of SCHED) {
        const burn = clamp((fl - c.burn) / 12);
        if (burn >= 1) continue;
        const st = cursorWorld(c, fl);
        if (!st) continue;
        let q = toPx(st.p);
        // the split: a fan of cards around the one, then each leaves for its first stroke
        const fan = 1 - ss(c.depart, c.depart + 7, fl);
        const spread = easeOut(clamp((fl - T_ENTER) / 5));
        const fanRot = (c.i - (NC - 1) / 2) * 0.13 * spread;
        if (fl < c.depart) q = [hp[0], hp[1], hp[2]];
        if (q[2] < 1.2) continue;                      // never at or behind the lens
        const s = sizeAt(q[2]);
        let rot = -0.1 + fanRot * fan;
        if (st.dir) { const a = toPx([st.p[0] + st.dir[0], st.p[1], st.p[2] + st.dir[1]]); rot += clamp((a[0] - q[0]) / 400, -0.12, 0.12); }
        items.push({ c, q, s, rot, press: st.press, burn, depth: q[2], shadow: c.i > 0 && fl < c.depart + 2 ? 0 : 1 });
      }
      items.sort((a, b) => b.depth - a.depth);
      for (const it of items) {
        // a little of his light around each card, so the far ones read as lights on the land
        const hr = 34 * Math.max(it.s, 0.8), ha = 0.22 * (1 - it.burn) + 0.5 * it.burn * (1 - it.burn) * 4;
        if (ha > 0.01) {
          const hx = it.q[0] + 18 * it.s, hy = it.q[1] + 30 * it.s;
          const hg = g.createRadialGradient(hx, hy, 0, hx, hy, hr);
          hg.addColorStop(0, `rgba(255,190,130,${Math.min(0.6, ha).toFixed(3)})`); hg.addColorStop(1, 'rgba(255,170,120,0)');
          g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = hg; g.fillRect(hx - hr, hy - hr, 2 * hr, 2 * hr); g.restore();
        }
        behindClawd(() => CUR.draw(g, it.q[0], it.q[1], { s: it.s, press: it.press, rot: it.rot, fill: HIS.card, edge: HIS.edge, glow: 1.0, bs: it.s * k / 1.45, lit: 1, heat: 0.06 + 0.8 * it.burn, litAt: [26, 40], burn: it.burn, burnAt: [36, 80], burnSeed: it.c.i * 1.7, shadow: it.shadow }), it.depth);
      }
      // each cursor's line of code, beside it: typed as its stroke comes on screen, faded when done
      for (const it of items) {
        for (const st of it.c.strokes) {
          if (!st.show) continue;
          const t1 = st.t0 + st.dur;
          if (fl < st.t0 - 1 || fl > t1 + 7) continue;
          const t0 = labelStart(it.c, st, fl);
          if (t0 === null) continue;
          const out = Math.max(0, 30 - it.q[0], it.q[0] - 1890, 30 - it.q[1], it.q[1] - 1050);   // its cursor leaving the frame
          const a = ss(t0, t0 + 2, fl) * (1 - ss(t1, t1 + 6, fl)) * (1 - ss(0, 0.5, it.burn)) * (1 - ss(0, 70, out));
          if (a < 0.01) continue;
          const n = Math.min(st.code.length, Math.floor((fl - t0) * 1.9) + 1), shown = st.code.slice(0, n);
          const fs = Math.round(lerp(19, 24, clamp((it.s - 0.5) / 0.9)));
          g.save();
          g.font = `${fs}px Consolas, "Courier New", monospace`; g.textBaseline = 'middle';
          const w = g.measureText(st.code).width;
          let x, y;
          if (st.above) { x = it.q[0] - 0.3 * w; y = it.q[1] + st.above; }              // wave 3: above it
          else { x = it.q[0] + 40 * it.s + 8; y = it.q[1] + 46 * it.s; if (x + w > 1890) x = it.q[0] - 10 - w; }
          x = clamp(x, 12, 1908 - w); y = clamp(y, 24, 1060);
          // a soft dark halo for legibility, then his orange, then a faint glow of his light
          g.globalAlpha = a;
          g.shadowColor = 'rgba(26,12,6,0.8)'; g.shadowBlur = 7; g.shadowOffsetX = 1; g.shadowOffsetY = 1;
          g.fillStyle = 'rgb(255,164,104)';
          g.fillText(shown, x, y);
          if (st.above) { g.shadowColor = 'rgba(40,14,8,0.85)'; g.shadowBlur = 10; g.fillText(shown, x, y); }   // over the bright horizon
          g.shadowColor = 'rgba(255,150,90,0.55)'; g.shadowBlur = 12; g.shadowOffsetX = 0; g.shadowOffsetY = 0;
          g.fillText(shown, x, y);
          if (n < st.code.length) { const cx = x + g.measureText(shown).width + 2; g.fillRect(cx, y - fs * 0.45, fs * 0.5, fs * 0.9); }
          g.restore();
        }
      }
      // motes: sparks shed by the burning cards, flying into him
      // (they vanish into him: never drawn over his cells)
      g.save(); g.beginPath(); g.rect(-100, -100, 2200, 1400); g.rect(...clawdBox); g.clip('evenodd');
      g.globalCompositeOperation = 'lighter';
      const target = toPx([CX, gyNow + A.dy + 0.4, CZ]);
      const posAt = (m, t, p0) => {
        const e = easeInOut(t);
        const dist = Math.hypot(target[0] - p0[0], target[1] - p0[1]);
        const mid = [(p0[0] + target[0]) / 2 + m.bend * 0.3 * dist, Math.min(p0[1], target[1]) - (30 + 150 * m.lift) * Math.min(1, dist / 500)];
        const wob = 10 * Math.sin(t * 9 + m.wob) * Math.sin(Math.PI * t);
        return [(1 - e) * (1 - e) * p0[0] + 2 * (1 - e) * e * mid[0] + e * e * target[0], (1 - e) * (1 - e) * p0[1] + 2 * (1 - e) * e * mid[1] + e * e * target[1] + wob];
      };
      for (const m of MOTES) {
        const c = SCHED[m.c], tb = c.burn + m.born, t = (fl - tb) / m.dur;
        if (t < 0 || t > 1) continue;
        const st = cursorWorld(c, Math.min(fl, c.burn + 12));
        const q = toPx(st.p), s = sizeAt(q[2]);
        if (q[2] < 1.2) continue;
        const rot = -0.1, cs = Math.cos(rot), sn = Math.sin(rot);
        const p0 = [q[0] + (m.at[0] * cs - m.at[1] * sn) * s, q[1] + (m.at[0] * sn + m.at[1] * cs) * s];
        const P1 = posAt(m, t, p0), Pb = posAt(m, Math.max(0, t - 1.0 / m.dur), p0);
        const sl = Math.hypot(P1[0] - Pb[0], P1[1] - Pb[1]), sk = Math.min(1, 22 / Math.max(sl, 1e-3));
        const P0 = [P1[0] + (Pb[0] - P1[0]) * sk, P1[1] + (Pb[1] - P1[1]) * sk];
        const al = ss(0, 0.06, t) * (1 - ss(0.86, 1, t));
        const hot = 1 - ss(0, 0.5, t);
        // a short streak along its path, a hot core and a small warm halo
        g.strokeStyle = `rgba(255,${Math.round(170 + 60 * hot)},${Math.round(110 + 90 * hot)},${(0.55 * al).toFixed(3)})`;
        g.lineWidth = 1.2 * m.size + 0.5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(P0[0], P0[1]); g.lineTo(P1[0], P1[1]); g.stroke();
        const r = 2.4 + 2.2 * m.size;
        const gr = g.createRadialGradient(P1[0], P1[1], 0, P1[0], P1[1], r * 2.4);
        gr.addColorStop(0, `rgba(255,244,228,${(0.95 * al).toFixed(3)})`); gr.addColorStop(0.2, `rgba(255,206,150,${(0.6 * al).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,150,90,0)');
        g.fillStyle = gr; g.fillRect(P1[0] - r * 2.4, P1[1] - r * 2.4, r * 4.8, r * 4.8);
      }
      g.restore();
    }
    // ------------------------------------------------ debug: world grid markers, stroke paths
    if (globalThis.__P18_DEBUG) {
      g.font = 'bold 15px Consolas'; g.lineWidth = 3;
      const mark = (x, z, lab, col) => { const y = St.V.heightAt(x, z), q = toPx([x, y, z]); if (q[2] < 0.5 || q[0] < 0 || q[0] > 1920 || q[1] < 0 || q[1] > 1080) return; g.fillStyle = col; g.fillRect(q[0] - 3, q[1] - 3, 6, 6); if (lab) { g.strokeStyle = '#000'; g.strokeText(lab, q[0] + 4, q[1] - 4); g.fillText(lab, q[0] + 4, q[1] - 4); } };
      for (let x = -80; x <= 80; x += 10) for (let z = 10; z <= 200; z += 10) mark(x, z, (x % 20 === 0 && z % 20 === 0) ? `${x},${z}` : '', '#ff0');
      for (let x = -1600; x <= 1600; x += 200) for (let z = 200; z <= 3000; z += 200) mark(x, z, (x % 400 === 0 && z % 400 === 0) ? `${x},${z}` : '', '#0ff');
      STROKES.forEach((st, i) => {
        const { pts, L } = strokePath(st);
        g.strokeStyle = `hsl(${(i * 47) % 360},90%,55%)`; g.lineWidth = 2; g.beginPath();
        let on = false;
        for (let j = 0; j < pts.length; j += 2) { const q = toPx([pts[j].x, St.V.heightAt(pts[j].x, pts[j].z), pts[j].z]); if (q[2] < 0.5) { on = false; continue; } if (!on) g.moveTo(q[0], q[1]); else g.lineTo(q[0], q[1]); on = true; }
        g.stroke();
        const q = toPx([pts[0].x, St.V.heightAt(pts[0].x, pts[0].z), pts[0].z]);
        if (q[2] > 0.5) { g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.strokeText(`${i}`, q[0], q[1] + 16); g.fillText(`${i}`, q[0], q[1] + 16); }
      });
    }
    g.restore();
  },
};
