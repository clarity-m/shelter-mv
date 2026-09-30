// S34, verse 2b (bars 58-60, frames 4115-4330), revisions 8-10: the chip. Revision 10 (Claire, cut
// 9): the chip is drawn flat on the ground, the land is a wafer of dies in the die-shot palette,
// and the code is part of the world. The benchmark's structure and timing are kept:
// - 0-35: we arrive over grey facets as four of Clawd's cursors lay the last strokes, and the
//   land they paint is a wafer: dies of orange arrays, teal caches, rose logic, gold buses on violet
//   (glsl.js dieColor), in S18's brushwork. One die, the one before him, is still blank.
// - 38-63: three cursors write lines of this film's real code onto the ground as they go, three
//   buses of text running into the blank die; on Enter (63) the lead presses a seed of light in (72).
// - 74-136: the chip spreads out from the seed across the die in lines of light, blocks and buses,
//   and each block fills with its colour as the light reaches it; the code streams along the buses
//   and the die's scribe lines. Clawd, watching, hops for joy (130).
// - 144-215: a dozen Clawds pop out of his light and lay out more chips down the wafer's columns,
//   the light racing along each, code streaming to the horizon along the scribe lines (the S03
//   rhyme). The camera rises and looks down on the chip: the last frame puts it exactly on S35's
//   paper chip (MATCH.md; the final camera is solved from its outline).
// Every Clawd stays at S18/S19's size; the chip is the brightest thing and the code is quieter.
// Revision 14 (Claire: the chip land read too literally; the three tech worlds are abstract fields):
// the land the cursors paint is now the silicon crystal's periodic potential, an egg-crate of wells,
// one under each die of the grid, coloured by the potential (deep teal wells, teal-green, gold
// crests) with fine contours circling each well (glsl.js latColor, uStrokePal 3). No die layout is
// painted and there are no props; the chips exist only as light. The hero die is a flat teal floor
// for the chip. Clawd watches from the floor of a well; the crowd arrives with one hop each and then
// stands still, arms up (the eyes carry it). Structure, timing and the landing are unchanged.
// Sung onsets (local): 15, 28, 63, 72, 94, 118, 145, 172, 190, 198, 208.
import { makeStage, clamp, lerp, ss, easeInOut, easeOut } from '../sets/valley/shotkit.js';
import { NEUTRAL, RUN, solidGrid } from '../sets/valley/clawd3d.js';
import { GRIDS } from '../sets/hill/clawd-pose.js';
import { setLand } from '../sets/valley/terrain.js';
import { createStrokeMaps, pathAt, tipAt, strokePath } from '../sets/valley/strokes.js';
import { createPaperCursor, HIS } from '../sets/valley/papercursor.js';
import { projectPx } from '../sets/valley/valley.js';
import { FIELD_TREES, fieldStrokes } from '../sets/fields/fields.js';
import { createLightLines } from '../sets/fields/lightlines.js';
import { createGroundText, textPath } from '../sets/fields/groundtext.js';
import { DIE_TEMPLATE, wafer, dieToWorld, worldToDie, dieLines, templateFromLines } from '../sets/fields/die.js';
import { chipFromMatch, solveCamera, unproject } from '../sets/fields/chipmatch.js';
import { fbmG, sstep } from '../sets/valley/terrain.js';
import { rng } from '../lib/util.js';

const G = {}; for (const k of Object.keys(GRIDS)) G[k] = solidGrid(GRIDS[k]);
const T_ENTER = 63, T_SEED = 72, T_GROW = [74, 128], T_CROWD = 144;
// the three lines the cursors write: real lines of this film (glsl.js dieColor, which paints this
// wafer; lightlines.js, which draws these lines of light)
const TYPED = [
  { text: 'vec2 cell = floor(g), f = g - cell;', t0: 38, t1: 56 },
  { text: 'c = diePal(inf.x, shift);', t0: 45, t1: 59 },
  { text: 'gl.drawArrays(gl.TRIANGLES, 0, v);', t0: 50, t1: 62 },
];

// ---------------------------------------------------------------- the land and the wafer
// a gentle land (a wafer is flat), low-poly facets under the paint, far rolling hills at the rim
function waferLand(x, z) {
  return 0;                  // revision 14: a flat plane to the horizon; the wells are in the shading
}
const PITCH = 7, SCRIBE = 0.5;
const W = wafer(-3.0, 11.0, PITCH, SCRIBE);               // die (0, 0): x -3..4, z 4..11
const C = dieToWorld(W, 0, 0, 0.5, 0.5);                  // the seed: the blank die's centre

// ---------------------------------------------------------------- the camera
let CAM_END;                                              // solved from S35's chip (setup)
const KEYS0 = [
  [0, { pos: [-7.5, 8.5, -19], look: [2.5, 1.2, 24] }],
  [66, { pos: [-3.0, 6.0, -5.5], look: [C[0] - 0.5, 0, C[1] - 1.0] }],
  [140, { pos: [C[0], 9.0, -5.0], look: [C[0], 0.5, 16] }],
  [186, { pos: [C[0], 12.0, -3.5], look: [C[0], 0, 14.5] }],
];
const vn = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
function camAt(fl) {
  const keys = KEYS0.map(([f, k]) => [f, { pos: k.pos, fwd: vn(k.look.map((v, i) => v - k.pos[i])), up: [0, 1, 0], fovy: 40 }]).concat([[215, CAM_END]]);
  let i = 0; while (i < keys.length - 2 && fl > keys[i + 1][0]) i++;
  const [f0, a] = keys[i], [f1, b] = keys[i + 1], u = easeInOut(clamp((fl - f0) / (f1 - f0)));
  const L = (p, q) => p.map((v, j) => lerp(v, q[j], u));
  // up: level cameras keep world up; the final (steep) camera brings its own
  return { pos: L(a.pos, b.pos), fwd: vn(L(a.fwd, b.fwd)), up: vn(L(a.up, b.up)), fovy: lerp(a.fovy || 40, b.fovy || 40, u) };
}

// ---------------------------------------------------------------- layout
// Clawd watches from a crossing of two dark scribe lanes, beyond the die (out of the last frame), so
// his #D97757 stands on the darkest ground in the world
const CLAWD = { x: W.x0 - 0.5 * PITCH, z: W.z0 + 0.5 * PITCH };     // (revision 14: a well's floor)
const ROW_N = 22, ACC = 0.1, LINE_Z = W.z0, LANE_V = 2.4;
let St, SM, STROKES, CUR, LL, GT, CROWD, CHIP, STREAM, RINGS;

// the chip's lines in die-local coords, resampled into short pieces with their distance from the
// seed (for the radial spread)
function pieces(lines, step = 0.012) {
  const out = [];
  for (const L of lines) {
    for (let i = 1; i < L.pts.length; i++) {
      const a = L.pts[i - 1], b = L.pts[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 0; k < n; k++) {
        const p = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], q = [a[0] + (b[0] - a[0]) * (k + 1) / n, a[1] + (b[1] - a[1]) * (k + 1) / n];
        out.push({ p, q, d: Math.hypot((p[0] + q[0]) / 2 - 0.5, (p[1] + q[1]) / 2 - 0.5), part: L.part });
      }
    }
  }
  return out;
}
// one die's lines into the segment list: pieces within radius R lit; heat, alpha, width
function dieSegs(out, n, i, j, P, R, heat, alpha, width, fresh) {
  const V = St.V;
  for (const pc of P) {
    if (pc.d > R) continue;
    const a = dieToWorld(W, i, j, pc.p[0], pc.p[1]), b = dieToWorld(W, i, j, pc.q[0], pc.q[1]);
    const h = heat + fresh * Math.exp(-Math.max(0, R - pc.d) * 30);       // the front is hottest
    const o = n * 9;
    out[o] = a[0]; out[o + 1] = V.heightAt(a[0], a[1]) + 0.04; out[o + 2] = a[1];
    out[o + 3] = b[0]; out[o + 4] = V.heightAt(b[0], b[1]) + 0.04; out[o + 5] = b[1];
    out[o + 6] = width * (pc.part === 'edge' ? 1.25 : pc.part === 'trace' ? 0.8 : 1); out[o + 7] = Math.min(1, h); out[o + 8] = alpha;
    n++; if (n * 9 >= out.length) return n;
  }
  return n;
}

// ---------------------------------------------------------------- the crowd
// A dozen Clawds pop out of his light and line up along the scribe lane beyond the hero's row,
// facing the lens, each at S18/S19's size, so they read as Clawds at a glance (eyes, arms up).
// From the centre outward each hops, and its light runs along the lane under their feet to its own
// column of dies and races up the column to the horizon. Before the camera looks straight down they
// turn and run off up the wafer after the light, out of the last frame.
function colX(col) { return dieToWorld(W, col, 0, 0.5, 0.5)[0]; }
function planCrowd() {
  const R = rng(3458);
  return Array.from({ length: 12 }, (_, k) => {
    const out = Math.abs(k - 5.5) - 0.5;                    // 0 at the centre .. 5 at the ends
    const col = k < 6 ? k - 6 : k - 5, x = -9.9 + 1.8 * k;
    const pop = T_CROWD + 0.9 * out + 0.8 * R(), land = pop + 13, fire = land + 1 + 0.9 * out;
    return { k, x, col, pop, land, fire, head: fire + Math.abs(colX(col) - x) / LANE_V,
      speed: 0.55 + 0.1 * R(), off: 187 + 0.8 * out + R(), ph: R() * 4, ang: (k / 12) * Math.PI * 2 };
  });
}
function crowdAt(c, fl) {
  if (fl < c.pop) return null;
  const tp = fl - c.pop;
  // out of his light in a burst, a leap to the lane, then facing the lens
  const burst = easeOut(clamp(tp / 6));
  const bx = CLAWD.x + Math.cos(c.ang) * 1.4 * burst, bz = CLAWD.z + Math.sin(c.ang) * 0.9 * burst;
  const u = easeInOut(clamp((tp - 5) / 8));
  let x = lerp(bx, c.x, u), z = lerp(bz, LINE_Z, u);
  const leap = Math.hypot(c.x - bx, LINE_Z - bz);
  let grid = G.hopApex, dy = 0, yaw = Math.PI;
  if (tp < 6) dy = 0.3 * Math.sin(Math.PI * tp / 6);
  else if (tp < 13) { grid = G.hopStretch; dy = Math.min(1.6, 0.12 * leap) * Math.sin(Math.PI * clamp((tp - 5) / 8)); }
  else grid = G.wonder;
  // its hop as it sends its light (squash, stretch, apex, fall, squash)
  const th = fl - c.fire;
  if (th >= -3 && th < 12) { const v = clamp((th + 3) / 15); grid = [G.hopSquash, G.hopStretch, G.hopApex, G.hopFall, G.hopSquash][Math.min(4, Math.floor(v * 5))]; dy = 0.3 * Math.sin(Math.PI * clamp((v - 0.14) / 0.72)); }
  else if (th >= 12) { grid = G.hopApex; }                      // arms up, still (revision 14: no bobbing)
  // then it turns and runs off up the wafer after the light
  const to = fl - c.off;
  if (to >= 0) {
    yaw = lerp(Math.PI, 0, easeInOut(clamp(to / 5)));
    if (to >= 3) { const r = to - 3; z = LINE_Z + 0.22 * r + 0.014 * r * r; grid = RUN[Math.floor((r + c.ph) / 2) & 3]; dy = 0.05 * Math.abs(Math.sin(r * 0.9 + c.ph)); }
  }
  return { x, z, dy, grid, yaw };
}

// ---------------------------------------------------------------- the code streams (real lines)
async function codeLines() {
  const src = [];
  for (const f of ['/sets/fields/die.js', '/sets/fields/groundtext.js', '/sets/fields/lightlines.js']) {
    try { const r = await fetch(f, { cache: 'no-store' }); if (r.ok) src.push(...(await r.text()).split('\n')); } catch (e) { /* offline: the typed lines only */ }
  }
  const keep = src.map((l) => l.trim()).filter((l) => l.length >= 16 && l.length <= 64 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('{ r:') && /[=(]/.test(l) && !/^[{}()[\];,]+$/.test(l) && /^[\x20-\x7e]+$/.test(l));
  return keep.length ? keep : TYPED.map((t) => t.text);
}

export default {
  async setup(ctx) {
    setLand(waferLand);
    St = makeStage(ctx, { agents: false, trees: [], noRiver: true, rocks: false, pad: false });
    STROKES = fieldStrokes();
    SM = createStrokeMaps(St.V, STROKES, { near: { c: [0, 100], half: 128, res: 1024 }, far: { c: [0, 900], half: 4200, res: 1024 } });
    CUR = createPaperCursor(31);
    LL = createLightLines(St.V);
    GT = createGroundText(St.V);
    // the chip: S35's paper chip (MATCH.md), else the die template; the last camera sees die (0, 0)
    // exactly where S35's chip stands
    const M = await chipFromMatch();
    const die0 = [dieToWorld(W, 0, 0, 0, 0), dieToWorld(W, 0, 0, 1, 0), dieToWorld(W, 0, 0, 1, 1), dieToWorld(W, 0, 0, 0, 1)].map((q) => [q[0], 0, q[1]]);
    CAM_END = solveCamera(M.quad, die0);
    // O's lines unprojected through the last camera onto the die's plane, in die-local coords
    const lines = M.screenLines ? M.screenLines.map((L) => ({ part: L.part, pts: L.pts.map((q) => { const w = unproject(CAM_END, q, 0.04); return worldToDie(W, 0, 0, w[0], w[2]); }) })) : null;
    CHIP = pieces(lines || dieLines(DIE_TEMPLATE));
    // the painted wafer takes the chip's own floorplan, so every light outline sits on its blocks
    if (lines) W.rects = templateFromLines(lines);
    RINGS = pieces((lines || dieLines(DIE_TEMPLATE)).filter((L) => !/strip|trace/.test(L.part)), 0.03);
    STREAM = await codeLines();
    CROWD = planCrowd();
    ctx.log(`S34: chip from ${M.src} (${(M.screenLines || []).length} lines, ${CHIP.length} pieces); last camera ${CAM_END.pos.map((v) => v.toFixed(2)).join(', ')}; ${STREAM.length} code lines`);
  },
  render(ctx, fr) {
    const fl = fr.fl, k = ctx.W / 1920, V = St.V;
    const cam = camAt(fl);
    const strokes = SM.render(fl);
    // the wafer: the blank die fills block by block as the chip's light spreads (uDieHero: radius)
    const R = T_GROW[0] > fl ? -1 : 0.75 * easeOut(clamp((fl - T_GROW[0]) / (T_GROW[1] - T_GROW[0])));
    strokes.smooth = 1; strokes.pal = 3; strokes.bleed = 0.25;
    strokes.die = Object.assign({ hero: R, latAmp: 2.4 }, W);
    // --- Clawd: watches the cursors, the seed, the chip; a hop of joy; his light releases the crowd
    let grid = NEUTRAL, dy = 0, yaw = Math.PI - 0.35;
    if (fl >= 20) grid = G.lookUp;
    if (fl >= T_ENTER + 2) grid = G.right;
    if (fl >= T_SEED + 6) grid = G.wonder;
    const hop = (t0, len, h) => { const tt = fl - t0; if (tt < 0 || tt >= len) return; const u = tt / len; grid = [G.hopSquash, G.hopStretch, G.hopApex, G.hopFall, G.hopSquash][Math.min(4, Math.floor(u * 5))]; dy = h * Math.sin(Math.PI * clamp((u - 0.14) / 0.72)); };
    hop(130, 14, 0.25);
    if (fl >= T_CROWD - 2 && fl < T_CROWD + 6) grid = G.hopApex;
    if (fl >= T_CROWD + 6) { grid = G.wonder; yaw = lerp(Math.PI - 0.35, Math.PI - 0.12, ss(T_CROWD + 6, T_CROWD + 22, fl)); }   // the crowd lines up in front of him
    const gy = V.heightAt(CLAWD.x, CLAWD.z);
    const glow = 0.7 + 1.1 * ss(T_CROWD - 10, T_CROWD, fl) * (1 - ss(T_CROWD + 4, T_CROWD + 24, fl));
    const crowd = [];
    for (const c of CROWD) { const s = crowdAt(c, fl); if (s) crowd.push({ x: s.x, z: s.z, y: V.heightAt(s.x, s.z) + s.dy, yaw: s.yaw, grid: s.grid, depth: 4 }); }
    // --- the lines of light: the seed, the hero chip spreading, then the columns racing
    const segs = new Float32Array(9 * 60000);
    let n = 0;
    if (fl >= T_ENTER && fl < T_GROW[0] + 8) {
      const u = clamp((fl - T_ENTER) / (T_SEED - T_ENTER)), y = V.heightAt(C[0], C[1]) + lerp(1.2, 0.03, u * u);
      const flash = fl >= T_SEED ? Math.exp(-(fl - T_SEED) / 4) : 0;
      segs.set([C[0], y, C[1], C[0], y + 0.001, C[1], 7 + 20 * flash, 1, 1], n * 9); n++;
    }
    if (R >= 0) n = dieSegs(segs, n, 0, 0, CHIP, R, 1 - 0.35 * ss(T_GROW[1], 190, fl), 1, 2.8, 0.6);
    // the lane light: from each Clawd's feet along the lane to its column's head
    for (const c of CROWD) {
      if (fl < c.fire) continue;
      const x1 = colX(c.col), dir = Math.sign(x1 - c.x), L = Math.abs(x1 - c.x), reach = Math.min(L, (fl - c.fire) * LANE_V);
      const fade = (1 - 0.7 * ss(c.head + 4, c.head + 24, fl)) * (1 - ss(182, 194, fl));
      if (fade <= 0.01) continue;
      for (let d = 0; d < reach; d += 0.6) {
        const d1 = Math.min(reach, d + 0.6), xa = c.x + dir * d, xb = c.x + dir * d1, hot = Math.exp(-(reach - d1) / 3);
        segs.set([xa, V.heightAt(xa, LINE_Z) + 0.05, LINE_Z, xb, V.heightAt(xb, LINE_Z) + 0.05, LINE_Z, 2.4, 0.25 + 0.75 * hot, (0.35 + 0.65 * hot) * fade], n * 9); n++;
      }
    }
    for (const c of CROWD) {
      if (fl < c.head) continue;
      const t = fl - c.head, front = c.speed * t + 0.5 * ACC * t * t;
      for (let q = 0; q < ROW_N; q++) {
        const dz = Math.abs(q * PITCH - (LINE_Z - C[1])); if (dz > front) break;   // rows 0 and 1 first
        const born = c.head + (-c.speed + Math.sqrt(c.speed * c.speed + 2 * ACC * dz)) / ACC;
        const g = clamp((fl - born) / 8), dist = Math.hypot(colX(c.col) - cam.pos[0], C[1] + q * PITCH - cam.pos[2]);
        // lit dies settle to a dim amber, so at the end the landing chip is the one white subject
        const settle = 1 - 0.45 * ss(192, 212, fl);
        n = dieSegs(segs, n, c.col, -q, dist < 40 ? RINGS : RINGS.filter((p, i) => (i & 3) === 0), 0.75 * g, (0.18 + 0.6 * (1 - g)) * settle,
          (0.42 + 0.35 * (1 - g)) * (1 - 0.6 * ss(40, 120, dist)) * settle, dist < 30 ? 1.7 : 1.2, 0.5);
        if (n > 59000) break;
      }
    }
    // --- the code on the ground: the cursors' three lines, then the streams
    const runs = [];
    const busZ = (i) => C[1] - 1.1 - 1.15 * i, busX0 = C[0] - 12.5, busX1 = C[0] - 0.4;
    TYPED.forEach((t, i) => {
      const h = 0.46, adv = 0.55 * h, path = textPath([[busX0, busZ(i)], [busX1, busZ(i)]]);
      const nC = Math.max(0, Math.min(t.text.length, Math.floor((fl - t.t0) * t.text.length / (t.t1 - t.t0)) + 1));
      // written from the left, then after the seed it streams on into the chip and is gone
      const flow = Math.max(0, fl - T_SEED) * 0.28;
      const s0 = path.L - t.text.length * adv - 0.6 + flow;
      const a = ss(t.t0 - 1, t.t0 + 2, fl) * (1 - ss(T_GROW[0] + 18, T_GROW[0] + 34, fl)) * 0.85;
      if (fl >= t.t0 - 1 && a > 0.01) runs.push({ path, text: t.text, h, s0, n: nC, alpha: a });
    });
    // along the die's four scribe lines and its buses as the chip spreads, and on down the columns
    if (fl >= T_GROW[0] + 6) {
      const a = 0.6 * ss(T_GROW[0] + 6, T_GROW[0] + 20, fl);
      const e = (u, v) => dieToWorld(W, 0, 0, u, v);
      const ring = [[e(-0.02, 1.035), e(1.02, 1.035)], [e(1.035, 1.02), e(1.035, -0.02)], [e(-0.02, -0.035), e(1.02, -0.035)], [e(-0.035, 1.02), e(-0.035, -0.02)]];
      ring.forEach((pq, i) => {
        const text = STREAM.slice((i * 3) % STREAM.length).concat(STREAM).slice(0, 3).join('   ');
        runs.push({ path: textPath(pq), text, h: 0.3, s0: -2 - (fl - T_GROW[0]) * 0.12 + 0.6 * i, alpha: a });
      });
    }
    if (fl >= T_CROWD) {
      const a = 0.5 * ss(T_CROWD, T_CROWD + 16, fl);
      for (let b = -5; b <= 6; b++) {
        // the column scribe lines, streaming toward the horizon (the die's own two start beyond it)
        const x = W.x0 + b * PITCH, zs = b === 0 || b === 1 ? C[1] + 4.2 : C[1] - 2;
        const text = STREAM.slice(((b + 5) * 4) % STREAM.length).concat(STREAM).slice(0, 6).join('   ');
        runs.push({ path: textPath([[x, zs], [x, C[1] + 150]]), text, h: 0.4, s0: 4 - (fl - T_CROWD) * 0.9, alpha: 0.8 * a });
      }
    }
    const P = {
      cam, time: fr.t, learn: { spawn: [0, 0, 0, 1] }, strokes,
      paint: 1.2, pal: 0.0, skyGentle: 1,
      clawd: { x: CLAWD.x, z: CLAWD.z, y: gy + dy, yaw, depth: 4, grid, glow },
      crowd, hideAgents: true, clawdFill: 0.95,
      shadow: { c: [C[0], 0, C[1] + 8], r: 40 },
      key: [-32, 16], sun: [-26, 7.5],
      exposure: 0.96, warm: 0.2, bloomThr: 0.76, rays: 0.6, glow: 0.55,
    };
    const lines = LL.hook(segs, n, P), text = GT.hook(runs, (x, z) => V.heightAt(x, z), P);
    P.extra = (gl, c) => { text(gl, c); lines(gl, c); };
    const info = V.render(P);
    const g2 = St.g2;
    g2.setTransform(1, 0, 0, 1, 0, 0);
    g2.drawImage(St.glc, 0, 0);
    // --- 2D: the four cursors finishing the land, then writing their lines, the lead pressing the seed
    const toPx = (p) => { const q = projectPx(info.B, p); return [q[0] / k, q[1] / k, q[2]]; };
    g2.save(); g2.setTransform(k, 0, 0, k, 0, 0);
    const last = STROKES.filter((s) => s.cur !== undefined).sort((a, b) => a.cur - b.cur);
    last.forEach((st, i) => {
      const L = strokePath(st).L, t1 = st.t0 + st.dur;
      let p, press = 1;
      // where it writes: the end of its typed line (cursor 3 hovers by the seed)
      const t = TYPED[i];
      const h = 0.46, adv = 0.55 * h, x1 = busX1 - 0.6;
      const writeAt = (ff) => { if (!t) return [C[0] - 0.8, V.heightAt(C[0], C[1]) + 1.2, C[1] - 0.6]; const nC = clamp((ff - t.t0) / (t.t1 - t.t0)) * t.text.length; const x = x1 - t.text.length * adv + nC * adv; return [x, V.heightAt(x, busZ(i)) + 0.05, busZ(i) + 0.25]; };
      if (fl < t1) { const q = pathAt(st, tipAt(st, Math.max(fl, st.t0))); p = [q.x, V.heightAt(q.x, q.z), q.z]; }
      else { const e = pathAt(st, L), a = [e.x, V.heightAt(e.x, e.z), e.z], u = easeInOut(clamp((fl - t1) / 12)); const w = writeAt(fl); p = a.map((v, j) => lerp(v, w[j], u) + (j === 1 ? 2.5 * u * (1 - u) : 0)); press = 1 - ss(t1, t1 + 5, fl) + (t && fl >= t.t0 && fl < t.t1 ? 0.6 : 0); }
      // the lead presses the seed in on Enter; then they all burn away
      if (i === 0 && fl >= T_ENTER - 2) { const u = easeInOut(clamp((fl - T_ENTER + 2) / 8)); const s = [C[0], V.heightAt(C[0], C[1]) + 0.1, C[1]]; p = p.map((v, j) => lerp(v, s[j], u)); press = Math.max(press, Math.sin(Math.PI * clamp((fl - T_ENTER) / 10))); }
      const burn = clamp((fl - (T_SEED + 2 + 3 * i)) / 12);
      if (burn >= 1) return;
      const q = toPx(p), s = clamp(16.5 / Math.max(q[2], 0.1), 0.45, 1.5);
      const a = ss(-3, 2, fl - st.t0 + 3);
      if (q[2] > 0.5) CUR.draw(g2, q[0], q[1], { s, press: clamp(press), rot: -0.1, fill: HIS.card, edge: HIS.edge, glow: 1.0, bs: s * k / 1.45, lit: 1, heat: 0.06 + 0.8 * burn, litAt: [26, 40], burn, burnAt: [36, 80], burnSeed: i * 1.7, a });
    });
    g2.restore();
  },
};
