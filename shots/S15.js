// S15, drop 1 (bars 41-44; revision 14: drag and drop, then duplicate). One calm pull-back; the clicks
// and the typed line carry the music.
//  - 41.1: close on Clawd in his learned valley. The world beyond the environment's edge falls away
//    and the sky gives way to the void; he glances left, then right, blinks, and looks up as the
//    camera pulls back: the valley is one tile.
//  - 41.4, 42.2, 42.4: the humans' indigo paper cursor (S10's) drags in three different worlds, one
//    at a time, each dropped beside the valley with a click on the beat: a funnel crater, an icy
//    shore, a salt flat, grey and unlearned. With the valley they make one 2 x 2 block.
//  - then it types one command in S10's label style and clicks on the 43.1 downbeat: the four
//    duplicate outward, a ring of blocks per wave, a wave per beat, to 64 x 64 worlds (44.3), each
//    with its own tiny orange Clawd, each colouring in as it is solved. The camera keeps pulling back.
// The grid and its timing are shared with S17 (sets/valley/wallshot.js replicaTiles).
import { makeStage, clamp, lerp, ss, easeInOut, easeOut } from '../sets/valley/shotkit.js';
import { drawHUD, fmtInt } from '../sets/valley/hud.js';
import { NEUTRAL, solidGrid } from '../sets/valley/clawd3d.js';
import { GRIDS } from '../sets/hill/clawd-pose.js';
import { PATH, pathAt } from '../sets/valley/terrain.js';
import { createWall } from '../sets/valley/wall.js';
import { replicaTiles, REP, tileClawd, PITCH, TILE_C, TILE_HALF, tileUVtoWorld } from '../sets/valley/wallshot.js';
import { projectPx } from '../sets/valley/valley.js';
import { createPaperCursor, PAPER } from '../sets/valley/papercursor.js';

const CMD = 'envs.replicate(4096)';
// revision 20 (Claire: he looked backwards against how he spawns): he keeps his spawn facing (yaw 0,
// down the valley, as in S13 and S14) and the lens looks at his face from the valley's side, a
// little to his left (3/4), as S14 did; the dropped worlds land on the far side of him
const AZ = 0.3;                                         // the lens's heading from its target
const HB = [Math.sin(AZ), 0, Math.cos(AZ)];             // target -> lens, horizontally
const FWD = [-HB[0], 0, -HB[2]], RIGHT = [FWD[2], 0, -FWD[0]];   // screen-far and screen-right on the ground (camBasis: right = up x fwd)
const YAW = 0;                                          // as he spawns
const TC = [TILE_C[0], 0, TILE_C[1]];
const BLOCK = [TILE_C[0] + PITCH / 2, 0, TILE_C[1] - PITCH / 2];  // the 2 x 2 block's centre
const CARRY_H = 24, CARRY = 20, HOLD = 4, FALL = 5;     // carried height (m); carry, click-hold and fall (frames)
// where each world is dragged in from, relative to its slot (m): the left, the far side, the far left
const FROM = [[-230, 20], [60, 250], [-190, 190]].map(([r, f]) => [RIGHT[0] * r + FWD[0] * f, RIGHT[2] * r + FWD[2] * f]);
// his eyes: glances in the glyph (the pockets shift a cell), then the sheet's blink and look up
const EYES_L = ['...############...', '...#o######o###...', '.################.', '...############...', '....#.#....#.#....'];
const EYES_R = ['...############...', '...###o######o#...', '.################.', '...############...', '....#.#....#.#....'];
const G = { blink: solidGrid(GRIDS.blink), lookUp: solidGrid(GRIDS.lookUp) };
function heroGrid(fl) {
  if (fl < 2) return NEUTRAL;
  if (fl < 9) return EYES_L;
  if (fl < 11) return NEUTRAL;
  if (fl < 18) return EYES_R;
  if (fl < 21) return G.blink;
  if (fl < 90) return G.lookUp;
  return NEUTRAL;
}

let St, W, tiles, CUR, f0;

// the camera: log-distance eases out from him to the block, then keeps pulling back, gathering pace
function camAt(fl) {
  const lnD = Math.log(8) + Math.log(320 / 8) * ss(6, 58, fl) + Math.log(470 / 320) * ss(50, 150, fl) + Math.log(3600 / 470) * Math.pow(clamp((fl - 130) / 157), 1.25);
  const D = Math.exp(lnD);
  const el = (lerp(9, 50, ss(6, 62, fl)) + 8 * ss(62, 287, fl)) * Math.PI / 180;
  const head = [0, 0.45, 0];
  let tgt = [lerp(head[0], TC[0], ss(16, 58, fl)), lerp(head[1], 0, ss(16, 46, fl)), lerp(head[2], TC[2], ss(16, 58, fl))];
  const kb = ss(40, 150, fl);
  tgt = [lerp(tgt[0], BLOCK[0], kb), tgt[1], lerp(tgt[2], BLOCK[2], kb)];
  const pos = [tgt[0] + HB[0] * D * Math.cos(el), tgt[1] + D * Math.sin(el), tgt[2] + HB[2] * D * Math.cos(el)];
  const kk = ss(40, 90, el * 180 / Math.PI);
  return { pos, look: tgt, up: [-HB[0] * kk, 1 - kk * 0.9, -HB[2] * kk], fovy: 40 };
}
// one of the three dragged worlds at local frame fl: its centre, and the landing glow
function dragged(t, fl) {
  const k = REP.DROPS.findIndex((d) => d[0] === t.gi && d[1] === t.gj), dF = REP.DROPS[k][2];
  const slot = [TC[0] + t.gi * PITCH, TC[2] + t.gj * PITCH];
  const u = easeInOut(clamp((fl - (dF - CARRY)) / (CARRY - 2)));
  const x = slot[0] + FROM[k][0] * (1 - u), z = slot[1] + FROM[k][1] * (1 - u);
  let y = CARRY_H, glow = 0;
  if (fl >= dF) {
    const q = (fl - dF) / FALL;
    y = q < 1 ? CARRY_H * (1 - q * q) : -1.4 * Math.sin(Math.PI * clamp((fl - dF - FALL) / 6));
    glow = q >= 1 ? 0.28 * Math.exp(-(fl - dF - FALL) / 5) : 0;
  }
  return { x, y, z, glow, visible: fl >= dF - CARRY };
}

export default {
  async setup(ctx) {
    St = makeStage(ctx);
    W = createWall(St.V, { log: ctx.log });
    f0 = ctx.shot.f0;
    tiles = replicaTiles(f0);
    CUR = createPaperCursor(41);
    ctx.log(`S15: ${tiles.length} worlds; drops at ${REP.DROPS.map((d) => d[2]).join(', ')}, click at ${REP.CLICK}`);
  },
  render(ctx, fr) {
    const f = fr.f, fl = fr.fl, kc = ctx.W / 1920;
    const cam = camAt(fl);
    // --- the valley: learned along his trail, then all of it as the view opens
    const dissolve = ss(4, 40, fl), vd = ss(8, 44, fl);
    const touchR = lerp(0, 150, ss(12, 60, fl));
    const cy = St.V.heightAt(0, 0);
    // --- the worlds
    const list = [];
    let envs = 0;
    for (const t of tiles) {
      const x0 = TC[0] + t.gi * PITCH, z0 = TC[2] + t.gj * PITCH;
      const tile = { x: x0, y: 0, z: z0, yaw: 0, size: 2 * TILE_HALF, variant: t.variant, reveal: 0, depth: 12, tint: t.tint, appear: 1 };
      if (t.hero) { tile.hideTop = true; envs++; }
      else if (t.drop !== null) {
        const d = dragged(t, fl);
        if (!d.visible) continue;
        tile.x = d.x; tile.y = d.y; tile.z = d.z; tile.glow = d.glow;
        if (f >= t.drop) envs++;
      } else {
        if (f < t.appearF) continue;
        tile.appear = ss(t.appearF, t.appearF + 10, f);
        if (tile.appear > 0.5) envs++;
      }
      tile.reveal = t.hero ? 0 : 1.25 * easeOut((f - t.solveF) / 26);
      // its own Clawd: the real one in the valley; a marker in each of the others from its birth
      if (t.hero) tile.clawd = { x: 0, y: cy + 0.4, z: 0, w: 1.35, a: ss(58, 90, fl) };
      else if (f >= t.born) {
        const q = pathAt(tileClawd(t, f, t.solveF)), uv = [(q.x - TC[0]) / (2 * TILE_HALF) + 0.5, (q.z - TC[2]) / (2 * TILE_HALF) + 0.5];
        const wp = tileUVtoWorld(tile, uv);
        tile.clawd = { x: wp[0], y: tile.y + 1.0, z: wp[2], w: 1.35, a: ss(t.born, t.born + 6, f) * tile.appear };
      }
      list.push(tile);
    }
    const P = {
      cam, time: fr.t,
      learn: { spawn: [0, 0, 7.5, 1.2], trail: { pts: PATH, reach: 10.5, w: 7.5 }, touch: [0, 20, touchR, 6] },
      clawd: { x: 0, z: 0, y: cy, yaw: YAW, depth: 4, grid: heroGrid(fl) },
      tile: { c: TILE_C, half: TILE_HALF, dissolve },
      void: vd, voidCol: [0.035, 0.03, 0.085], fogK: 1 - vd,
      shadow: { c: [lerp(0, BLOCK[0], ss(20, 150, fl)), 0, lerp(0, BLOCK[2], ss(20, 150, fl))], r: lerp(40, 260, ss(10, 150, fl)) },
      key: [22, 26], sun: [11, 2.4], rays: 0.75 * (1 - vd), glow: 1 - vd,
      noReflection: vd > 0.95,
      extra: (gl, c) => { for (let i = 0; i < list.length; i += 1400) W.draw(list.slice(i, i + 1400), Object.assign({ P }, c), 0, 5); },
    };
    const info = St.V.render(P);
    const g = St.g2; g.drawImage(St.glc, 0, 0);
    // --- the humans' cursor: it carries each world in, clicks it down, types the command, clicks
    const px = (p) => { const q = projectPx(info.B, p); return [q[0] / kc, q[1] / kc, q[2]]; };
    let cur = null, press = 0;
    const dropF = REP.DROPS.map((d) => d[2]);
    const grabOf = (k) => { const t = tiles.find((q) => q.gi === REP.DROPS[k][0] && q.gj === REP.DROPS[k][1]); const d = dragged(t, Math.min(fl, dropF[k])); return px([d.x, d.y, d.z]); };
    const k = dropF.findIndex((d) => fl < d + HOLD);
    if (k >= 0 && fl >= dropF[k] - CARRY) {
      cur = grabOf(k);
      press = fl >= dropF[k] ? Math.max(0, 1 - (fl - dropF[k]) / HOLD) : 0;
    }
    // between drops: a flick out to the next world, waiting just beyond the frame
    for (let i = 0; i < 2 && !cur; i++) {
      if (fl >= dropF[i] + HOLD && fl < dropF[i + 1] - CARRY) {
        const a = grabOf(i), b = grabOf(i + 1), u = easeInOut((fl - dropF[i] - HOLD) / (dropF[i + 1] - CARRY - dropF[i] - HOLD));
        cur = [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - 80 * Math.sin(Math.PI * u), 1];
      }
    }
    // the command: over the block, typed in S10's paper panel; the click on 43.1 runs it
    const bc = px(BLOCK);
    const pX = bc[0] - 330, pY = bc[1] - 250;
    const open = easeOut(clamp((fl - dropF[2] - 1) / 4)) * (1 - easeInOut(clamp((fl - REP.CLICK - 6) / 8)));
    const typed = clamp((fl - dropF[2] - 2) / 13);
    if (fl >= dropF[2] + HOLD && fl < REP.CLICK + 40) {
      const pt = [pX + 1.5 * 320, pY + 30];                    // the panel's end: the cursor waits there to run it
      const a = grabOf(2), u = easeInOut((fl - dropF[2] - HOLD) / 8);
      cur = [lerp(a[0], pt[0], u), lerp(a[1], pt[1], u), 1];
      press = Math.exp(-Math.pow((fl - REP.CLICK - 1) / 3, 2));
      const v = easeInOut(clamp((fl - REP.CLICK - 8) / 28));   // then it lifts away
      cur = [cur[0] + 260 * v, cur[1] - 900 * v * v, 1];
    }
    g.save(); g.setTransform(kc, 0, 0, kc, 0, 0);
    if (open > 0) {
      g.save(); g.translate(pX, pY); g.scale(1.5, 1.5);
      CUR.panel(g, 0, 0, CMD, { open, typed, caret: fl < REP.CLICK, flash: Math.exp(-Math.pow((fl - REP.CLICK) / 4, 2)) * (fl >= REP.CLICK - 2 ? 1 : 0) });
      g.restore();
    }
    if (cur && cur[1] > -300 && cur[1] < 1400 && cur[0] > -300 && cur[0] < 2300) CUR.draw(g, cur[0], cur[1], { s: 2.3, press, rot: -0.08, fill: PAPER.slate, bs: 2.3 * kc / 1.45 });
    g.restore();
    drawHUD(g, St.k, { episode: 217, reward: 0.103, step: 118 + fl, extra: [['ENVS', fmtInt(envs)]] });
  },
};
