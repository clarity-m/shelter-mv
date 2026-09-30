// S10, verse 1 into pre-chorus 1a (bars 17-25, frames 1163-1810): the first environment, a pixel
// gridworld (rung 1). S08 ends pushed through the paper screen onto the bare glyph in a warm peach
// field on the bar-16 drop-out; S10 opens on exactly that frame (same glyph cells, same peach, the
// pixel world's own dither seen at 27x) and, as the verse enters, pulls back out of the light to the
// game view, the warm field irising down into him, his flat glyph dithering into his shaded pixel
// form. Local frames: bar 17 is 0, bar 20 is 216 (OFF), bar 25 is 576.
//  - bar 17 (the verse enters): the pull-back out of the screen's light; he blinks.
//  - bar 18 (the bass drops out, the voice alone): he looks around, sets off with tentative steps
//    and bumps into a step on the bar's one kick; he studies it.
//  - bar 19 (the beat comes back): he hops up onto it on the downbeat, pleased; hops off it and on
//    toward the gap, landing on the beat-4 kick, and peers in.
//  - bar 20 (the band alone): he looks across at the flag, sets himself, looks down, hops, and
//    falls short; reset on the bar-21 downbeat, where the singing comes back.
//  - bar 21: episode 2. A run-up and a real leap: he hits the far lip, scrabbles, slips; reset on
//    the bar-22 downbeat.
//  - bar 22: episode 3. He stops at the edge and sits, head down. A cursor cut from indigo card (the
//    outside world's paper) comes down into his world.
//  - bar 23: it clicks one cell of the gap on beat 2 and opens a tiny paper panel; one line of code
//    types out and, on beat 4, ONE block appears. The cursor lifts away.
//  - bar 24 (the verse's last bar): he hops onto the block on beat 2, balances, and hops across,
//    landing on beat 4; a few steps to the flag.
//  - bar 25 (one last kick on the downbeat, then the kick drops out): the flag and +1 on that
//    downbeat; in the breath after it he looks up to where the help came from, waves, and sits.
// From his first hop at the gap on, this is Revision 4's S10 unchanged: that code runs on Revision
// 4's local frame, fo = fl - OFF. HUD: EPISODE / STEP in the world's own 3x5 pixels, steps counted
// from bar 17. Revision 19: the camera is the side-scroller one (Claire approved it): it eases after
// him while he explores and is back on the one game screen, exactly, by frame 205;
// makeS10({ scroll: false }) keeps the old fixed framing.
import { createGridworld, GY, GAP, SPAWN, EDGE, GOAL, TILE, STEP } from '../sets/early-env/gridworld.js';
import { createPaperCursor } from '../sets/early-env/papercursor.js';
import * as F from '../sets/early-env/frames.js';
import { clamp, lerp, easeOut, easeInOut, smoothstep } from '../lib/util.js';

const OFF = 216;                        // bar 20: Revision 4's local frame 0
// Revision 4's frames (fo)
const EP = [0, 72, 144];                // episode starts: the bar downbeats (episode 1 began at bar 17)
const WALLX = GAP[1] - 18;              // his centre when his face meets the far wall
const CELL = [GAP[0] + TILE, GY];       // the one cell the edit fills (column 18, top row)
const BLOCKX = CELL[0] + TILE / 2;      // his centre standing on it
const LAND = GAP[1] + 24;               // his centre after the second hop
const CLICK = 234, ENTER = 270;         // bar 23, beats 2 and 4
const GOALF = 360;                      // the bar-25 downbeat: the flag, +1
const CODE = 'grid[11][18] = BLOCK';
// exploring, bars 18-19 (local frames)
const STEPY = GY - TILE;                // the step's top
const ONSTEP = (STEP[0] + STEP[1]) / 2; // his centre standing on it
const BUMP = STEP[1] + 15;              // his centre when his arm meets its face, walking left
const HOP1 = 145;                       // up onto it on the bar-19 downbeat
const OFFX = 186, HOP2 = 175;           // off it, onto the spawn pad
const HOPX = 236, HOP3 = 188;           // on toward the gap, landing on the beat-4 kick (199)
const PEER = 210;                       // at the edge, peering in

// the opening pull-back. S08's last frame: glyph cells 54.25 px (27.125 px per native px), the
// glyph's top-left at (471.75, 502). The game view: 4 px per native px, the glyph at native (182, 164).
// The zoom runs about the one screen point both framings share, geometric in scale: it eases out of
// the held match frame and settles just after beat 3 of bar 17.
const OPEN = 42, Z0 = 27.125, Z1 = 4, NA = [182, 164], A0 = [471.75, 502], A1 = [NA[0] * Z1, NA[1] * Z1];
const RHO = Z1 / Z0, FIX = [0, 1].map((i) => (A1[i] - A0[i] * RHO) / (1 - RHO));
function viewAt(fl) {
  if (fl >= OPEN) return null;
  const u = clamp(fl / OPEN), e = u * (0.4 + u * (2.2 - 1.6 * u));    // gentle start, long settle
  const Z = Z0 * Math.pow(RHO, e), q = Z / Z0;
  return { Z, ax: FIX[0] + (A0[0] - FIX[0]) * q, ay: FIX[1] + (A0[1] - FIX[1]) * q, nx: NA[0], ny: NA[1] };
}

// one hop: returns x, y (feet) and a frame for time t since takeoff; falls if it overshoots nothing
function jump(t, x0, vx, vy0, g, wall = Infinity) {
  let x = x0 + vx * t;
  const yo = vy0 * t + 0.5 * g * t * t, vy = vy0 + g * t;
  if (x > wall) x = wall;
  const y = GY + yo;
  let frame = vy < -1.3 ? F.STRETCH : vy < 1.3 ? F.APEX : F.HOPFALL;
  if (y > GY + 2) frame = F.FALL;
  return { x, y, frame, vy };
}
// a scripted hop between two standing points (lands exactly), n frames, apex h px
function hopTo(t, x0, x1, n, h) {
  const u = clamp(t / n), x = lerp(x0, x1, u), y = GY - 4 * h * u * (1 - u);
  const vy = -4 * h * (1 - 2 * u) / n;
  return { x, y, frame: vy < -1.1 ? F.STRETCH : vy < 1.1 ? F.APEX : F.HOPFALL };
}
// the same between two heights
function hopBetween(t, x0, y0, x1, y1, n, h) {
  const u = clamp(t / n), x = lerp(x0, x1, u), y = lerp(y0, y1, u) - 4 * h * u * (1 - u);
  const vy = (y1 - y0 - 4 * h * (1 - 2 * u)) / n;
  return { x, y, frame: vy < -1.1 ? F.STRETCH : vy < 1.1 ? F.APEX : F.HOPFALL };
}

// bars 17-20, up to his first hop at the gap (local frames)
function explore(fl) {
  const at = (x, y, frame, extra) => ({ x, y, frame, ...extra });
  // bar 17: he arrives on the spawn pad out of the screen's light; a blink
  if (fl < 72) return at(SPAWN, GY, fl >= 50 && fl < 53 ? F.BLINK : F.NEUTRAL);
  // bar 18, the voice alone: he looks right (the gap, the flag), then left, and sets off left
  if (fl < 83) return at(SPAWN, GY, F.LOOK);
  if (fl < 93) return at(SPAWN, GY, F.LOOK, { mirror: true });
  if (fl < 127) {
    const x = lerp(SPAWN, BUMP, (fl - 93) / 33);
    return at(x, GY, F.WALK[Math.floor((SPAWN - x) / 5) & 3], { mirror: true });
  }
  // the bump, on bar 18's one kick: his arm meets the step's face; he rocks back and studies it
  if (fl < 131) return at(BUMP + (fl < 128 ? 0 : fl < 130 ? 3 : 2), GY, F.SQUASH, { mirror: true, bonk: fl - 127 });
  if (fl < 141) return at(BUMP + 2, GY, F.CURIOUS, { mirror: true });
  if (fl < HOP1) return at(BUMP + 2, GY, F.SQUASH, { mirror: true });
  // bar 19, the beat back: up onto it on the downbeat, his first hop; pleased with himself
  if (fl < HOP1 + 11) return { ...hopBetween(fl - HOP1, BUMP + 2, GY, ONSTEP, STEPY, 11, 20), mirror: true };
  if (fl < HOP1 + 14) return at(ONSTEP, STEPY, F.SQUASH, { mirror: true });
  if (fl < HOP2 - 3) return at(ONSTEP, STEPY + (fl >= 163 && fl < 165 ? 1 : 0), F.HAPPY);
  if (fl < HOP2) return at(ONSTEP, STEPY, F.SQUASH);
  // off it, and one more hop toward the gap; a few steps to the edge, and he peers in
  if (fl < HOP2 + 10) return hopBetween(fl - HOP2, ONSTEP, STEPY, OFFX, GY, 10, 10);
  if (fl < HOP3) return at(OFFX, GY, F.SQUASH);
  if (fl < HOP3 + 11) return hopTo(fl - HOP3, OFFX, HOPX, 11, 12);
  if (fl < HOP3 + 14) return at(HOPX, GY, F.SQUASH);
  if (fl < PEER) {
    const x = lerp(HOPX, EDGE, (fl - HOP3 - 14) / (PEER - HOP3 - 14));
    return at(x, GY, F.WALK[Math.floor((x - HOPX) / 6) & 3]);
  }
  if (fl < 226) return at(EDGE, GY, fl >= 217 && fl < 220 ? F.BLINK : F.LOOKDOWN);
  // bar 20: he looks across at the flag, sets himself, looks down again (Revision 4's frames from
  // here: the look down at 40, the squash at 46, the hop at 50)
  if (fl < 240) return at(EDGE, GY, F.LOOK);
  if (fl < OFF + 40) return at(EDGE, GY, F.DETERMINED);
  if (fl < OFF + 46) return at(EDGE, GY, F.LOOKDOWN);
  return at(EDGE, GY, F.SQUASH);
}

function clawd(fl) {
  return fl < OFF + 50 ? explore(fl) : clawdR4(fl - OFF);
}
// Revision 4's S10 from his first hop at the gap, on its own local frame fl
function clawdR4(fl) {
  // ---------------------------------------------------------------- episode 1: the hop falls short
  if (fl < EP[1]) {
    const j = jump(fl - 50, EDGE, 2.0, -3.6, 0.45);
    return { ...j, stepping: j.y <= GY + 4 };
  }
  // ---------------------------------------------------------------- episode 2
  if (fl < EP[2]) {
    const t = fl - EP[1];
    if (t < 5) return { x: SPAWN, y: GY, frame: F.DETERMINED, spawn: t, stepping: false };
    if (t < 16) {
      const x = lerp(SPAWN, 188, (t - 5) / 11);
      return { x, y: GY, frame: F.WALK[Math.floor((SPAWN - x) / 5) & 3], mirror: true, stepping: true };
    }
    if (t < 23) return { x: 188, y: GY, frame: t < 19 ? F.DETERMINED : F.SQUASH, stepping: true };
    if (t < 36) {
      const x = lerp(188, EDGE, Math.pow((t - 23) / 13, 1.35));
      return { x, y: GY, frame: F.WALK[Math.floor((x - 188) / 5) & 3], stepping: true };
    }
    const tt = t - 36, vx = 3.1, vy0 = -4.0, g = 0.42;
    const tc = (WALLX - EDGE) / vx;                 // meets the far wall, ten px below the lip
    if (tt < tc) return { ...jump(tt, EDGE, vx, vy0, g), stepping: true };
    const yc = GY + vy0 * tc + 0.5 * g * tc * tc;
    const tw = tt - tc;
    if (tw < 8) return { x: WALLX, y: Math.round(yc + (tw > 5 ? 1 : 0)), frame: (Math.floor(tw / 2) & 1) ? F.CLING_B : F.CLING_A, stepping: true };
    return { x: WALLX, y: yc + 0.4 * (tw - 8) * (tw - 8) + 1, frame: F.FALL, stepping: false };
  }
  // ---------------------------------------------------------------- episode 3
  const t = fl - EP[2];
  if (t < 5) return { x: SPAWN, y: GY, frame: F.NEUTRAL, spawn: t, stepping: false };
  if (t < 34) {
    const x = lerp(SPAWN, EDGE, (t - 5) / 29);
    return { x, y: GY, frame: F.WALK[Math.floor((x - SPAWN) / 6) & 3], stepping: true };
  }
  const at = (frame, extra) => ({ x: EDGE, y: GY, frame, stepping: true, ...extra });
  if (fl < 186) return at(F.LOOKDOWN);
  if (fl < 189) return at(F.SQUASH);
  // sitting at the edge, head down; the cursor's shadow comes over him and he looks up
  if (fl < 212) return at(fl >= 201 && fl < 204 ? F.BLINK : F.SIT_DOWN);
  if (fl < 262) return at(F.SIT_UP);
  if (fl < 272) return at(F.SIT_DOWN);            // watching the cell as the line types
  if (fl < 275) return at(F.SQUASH);              // up, at the block
  if (fl < 287) return at(F.WONDER);
  if (fl < 293) return at(fl < 290 ? F.HAPPY : F.SQUASH);
  // bar 24: onto the block, landing on beat 2 (a careful hop), a balance, then across, landing on
  // beat 4 (a bolder one), and a few steps to the flag
  if (fl < 307) return { ...hopTo(fl - 293, EDGE, BLOCKX, 14, 13), stepping: true };
  if (fl < 310) return { x: BLOCKX, y: GY, frame: F.SQUASH, stepping: true };
  if (fl < 318) return { x: BLOCKX, y: GY, frame: F.WALK[0], stepping: true };
  if (fl < 322) return { x: BLOCKX, y: GY, frame: F.SQUASH, stepping: true };
  if (fl < 342) return { ...hopTo(fl - 322, BLOCKX, LAND, 20, 20), stepping: true };
  if (fl < 345) return { x: LAND, y: GY, frame: F.SQUASH, stepping: true };
  if (fl < GOALF) {
    const x = lerp(LAND, GOAL, (fl - 345) / (GOALF - 345));
    return { x, y: GY, frame: F.WALK[Math.floor((x - LAND) / 6) & 3], stepping: true };
  }
  // bar 25: the flag and +1 on the downbeat's last kick; in the breath that follows he looks up
  // where the help came from, waves, and sits by the flag
  const g0 = { x: GOAL, y: GY, goal: fl - GOALF, stepping: false };
  if (fl < 378) return { ...g0, frame: F.HAPPY };
  if (fl < 392) return { ...g0, frame: F.LOOKUP };
  if (fl < 408) return { ...g0, frame: F.WAVE[Math.floor((fl - 392) / 4) % 4], mirror: true };
  if (fl < 411) return { ...g0, frame: F.SQUASH };
  return { ...g0, frame: fl >= 419 && fl < 422 ? F.BLINK : F.SIT };
}

// the paper cursor (Revision 4's frames): comes down from above the frame to the cell, clicks,
// lifts away (screen px). Revision 19: it glides all the way off the top edge (clear of the frame,
// shadow and all, by about 313) before it is dropped at 322, instead of vanishing near the top
function cursorAt(fl) {
  if (fl < 194 || fl > 322) return null;
  const tip = [CELL[0] * 4 + 26, CELL[1] * 4 + 22];
  const u = easeOut(clamp((fl - 194) / 30));                  // descent
  const v = smoothstep(278, 320, fl);                         // departure, up and away, gently
  const sway = 6 * Math.sin((fl - 194) * 0.09) * (1 - clamp((fl - 222) / 12)) * (1 - v);
  const press = Math.exp(-Math.pow((fl - CLICK - 2) / 3, 2)) + 0.8 * Math.exp(-Math.pow((fl - ENTER - 2) / 3, 2));
  return {
    x: tip[0] + 90 * (1 - u) + 140 * v + sway,
    y: lerp(-160, tip[1], u) - 950 * v - 10 * Math.sin((fl - 222) * 0.12) * clamp((fl - 222) / 8) * (1 - clamp((fl - CLICK + 6) / 6)),
    press, rot: -0.05 - 0.12 * (1 - u) + 0.1 * v,
  };
}

// the full state at local frame fl
function state(fl) {
  const fo = fl - OFF;
  const ep = fo < EP[1] ? 0 : fo < EP[2] ? 1 : 2;
  const c = clawd(fl);
  // steps tick every 3 frames while he acts (episode 1 from bar 17); frozen once the episode is decided
  const s0 = ep === 0 ? -OFF : EP[ep];
  const sF = ep === 0 ? Math.min(fo, 70) : ep === 1 ? Math.min(fo, 137) : Math.min(fo, GOALF);
  const step = Math.floor((sF - s0) / 3);
  const sparks = [];
  if (c.spawn !== undefined) {
    const a = c.spawn + 1;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) sparks.push([Math.round(c.x + sx * (20 + 2 * a)), Math.round(c.y - 10 + sy * (8 + a))]);
  }
  // the bump: a few pale pixels where his arm meets the step
  if (c.bonk !== undefined && c.bonk < 3) {
    const a = c.bonk, x0 = STEP[1];
    for (const [dx, dy] of [[1, -15], [-1, -18], [3, -19], [2, -9]]) sparks.push([x0 + dx + (dx > 0 ? a : -a), GY + dy - a]);
  }
  // the block: it pops in on ENTER (an outline, a flash, then the tile), with dust
  const tiles = [], dust = [];
  if (fo >= ENTER) {
    const age = fo - ENTER;
    tiles.push({ x: CELL[0], y: GY, flash: age < 3 });
    if (age < 7) dust.push({ x: CELL[0] + 8, y: GY, age });
  }
  if (fo >= 307 && fo < 313) dust.push({ x: BLOCKX, y: GY, age: fo - 307 });
  if (fo >= 342 && fo < 348) dust.push({ x: LAND, y: GY, age: fo - 342 });
  // his landings while exploring
  for (const [f, x, y] of [[HOP1 + 11, ONSTEP, STEPY], [HOP2 + 10, OFFX, GY], [HOP3 + 11, HOPX, GY]]) {
    if (fl >= f && fl < f + 6) dust.push({ x, y, age: fl - f });
  }
  const st = {
    fl: fo,                               // the world's own motion (clouds, motes, flag) as in Revision 4
    clawd: { ...c, sparks, glow: 1 + 0.5 * Math.exp(-fl / 14) },
    tiles, dust,
    marquee: fo >= CLICK && fo < ENTER ? [CELL[0], CELL[1], CELL[0] + TILE - 1, CELL[1] + TILE - 1] : null,
    ripple: fo >= CLICK && fo < CLICK + 8 ? { x: CELL[0] + 8, y: CELL[1] + 8, age: fo - CLICK } : null,
    flagUp: c.goal !== undefined ? easeOut(clamp(c.goal / 10)) : 0,
    hud: { ep: ep + 1, step, epFlash: ep > 0 && fo - EP[ep] < 10 },
    reward: c.goal !== undefined && c.goal < 40 ? { x: GOAL, y: GY - 34 - 12 * easeOut(clamp(c.goal / 12)) } : null,
  };
  if (fl < OPEN) {
    st.view = viewAt(fl);
    st.afterglow = { cx: SPAWN, cy: GY - 5.3, Rn: 80 * Math.pow(1 - clamp(fl / OPEN), 1.6) };
    st.clawd.flat = 1 - smoothstep(3, 20, fl);
  }
  return st;
}

// The alternate (shots/_S10scroll.js, off by default): a side-scroller camera. The world extends
// EXT px beyond the screen's left edge; the camera eases after him while he explores (bar 18 on)
// and is back on the fixed framing, exactly, by frame 205, before he reaches the gap: the pull-back,
// the gap, both fails, the cursor, the block, the jump, the flag and the +1 are framed as in S10.
const EXT = 64;
const CAM_K = 30, CAM_TAU = 5;          // a causal gamma kernel over the last CAM_K frames: soft both ends
function camTarget(fl) {
  if (fl < 93 || fl >= HOP2) return 0;   // still for the arrival; from his hop off the step, the gap's framing
  return Math.max(-EXT, 0.75 * Math.min(0, clawd(fl).x - SPAWN));
}
function camAt(fl) {
  let s = 0, w = 0;
  for (let j = 0; j < CAM_K; j++) { const wj = (j + 1) * Math.exp(-(j + 1) / CAM_TAU); s += wj * camTarget(fl - j); w += wj; }
  return Math.round(s / w);              // whole native px: the pixel grid stays crisp
}

export function makeS10({ scroll = false } = {}) {
  let G, P, g, k;
  const S = scroll ? (f) => ({ ...state(f), cam: camAt(f) }) : state;
  return {
    async setup(ctx) {
      G = createGridworld(ctx.canvas, ctx.W, ctx.H, scroll ? { ext: EXT } : undefined);
      P = createPaperCursor();
      g = ctx.canvas.getContext('2d'); k = ctx.W / 1920;
    },
    render(ctx, fr) {
      const fl = fr.fl, fo = fl - OFF;
      g.setTransform(1, 0, 0, 1, 0, 0);
      // episode resets: a four-frame top-to-bottom redraw over the frozen last frame of the old one
      let done = false;
      for (const e of [OFF + EP[1], OFF + EP[2]]) {
        if (fl >= e && fl < e + 4) { G.render(S(fl), S(e - 1), (fl - e + 1) / 4); done = true; }
      }
      if (!done) G.render(S(fl));
      // the outside world's paper, over the pixels: the panel and the cursor (bar 23, when the
      // alternate's camera is at rest on the fixed framing)
      const cur = cursorAt(fo);
      g.save(); g.setTransform(k, 0, 0, k, 0, 0);
      const open = easeOut(clamp((fo - CLICK - 4) / 7)) * (1 - easeInOut(clamp((fo - ENTER - 4) / 8)));
      if (open > 0) {
        P.panel(g, CELL[0] * 4 - 64, CELL[1] * 4 - 118, CODE, {
          open, typed: clamp((fo - CLICK - 12) / 22), caret: fo < ENTER,
          flash: Math.exp(-Math.pow((fo - ENTER) / 4, 2)) * (fo >= ENTER - 2 ? 1 : 0),
        });
      }
      if (cur) P.draw(g, cur.x, cur.y, { press: cur.press, rot: cur.rot });
      g.restore();
    },
  };
}
export default makeS10({ scroll: true });     // revision 19: the side-scroller camera is S10 (Claire approved it)
