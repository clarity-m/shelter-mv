// S11, pre-chorus 1a into 1b (bars 26-30, frames 1811-2170): the world becomes vector (rung 2), a
// physics environment drawn like a diagram. It first appears at the pixel world's resolution and
// sharpens in two steps (the ladder's 1 -> 2 transition). Help first, then independence.
//  - bar 26: Clawd is climbing a 34-degree ramp; he slips and slides back to its foot.
//  - bar 27: the paper cursor from S10 comes down, takes the ramp's handle and drags it: the ramp
//    eases to 26 degrees (the old surface stays as a dashed ghost, the readout counts down). The
//    cursor lets go and lifts away; he goes again.
//  - bar 28 (still no drums): he makes the eased plateau on the downbeat, quietly, and looks back at
//    the ghost. On beat 2 a new episode: he is back at the foot and the ramp springs back up into
//    its ghost, 34 degrees. The cursor starts down to help again, but he is already going; it
//    stops, and withdraws.
//  - bar 29 downbeat (the snare returns): he tops the steep ramp on his own. Arms up; the surface he
//    climbed flashes. The camera rises to his level and follows him along the plateau.
//  - bars 29-30: on the backbeat snares (T.events('snares')) the world changes around him, twice,
//    each more saturated; the second is the ladder's hill, where he stops on the last snare before
//    the drums cut out (S12's first frame has him in the same place, at the same size).
import { drawRamp, drawFlick, B, RAMP, FX, FY, topOf } from '../sets/early-env/physics.js';
import { drawClawd, walkPose, drawHUD, groupInt, line } from '../sets/early-env/vector.js';
import { createPaperCursor } from '../sets/early-env/papercursor.js';
import { clamp, lerp, easeInOut, easeOut, smoothstep } from '../lib/util.js';

const D2R = Math.PI / 180, TH0 = 34 * D2R, TH1 = 26 * D2R;
const U = 8;                                  // px per glyph unit: 144 x 80, the size he had in S10
const DRAG = [90, 114];                       // bar 27: the cursor drags the handle, 34 -> 26
const EASED = 144;                            // the bar-28 downbeat: he makes the eased plateau
const RESET = 162;                            // bar 28, beat 2: a new episode; the ramp springs to 34
const GO = 174;                               // he sets off (a sung onset)
const MADE = 216;                             // the bar-29 downbeat, the snare's return: the top
const T34 = topOf(TH0);
const S_EASED = RAMP + (FX - topOf(TH1)[0]);  // his stop on the eased plateau, at FX
// the steep climb, [local frame, distance along the path, px per frame]: he slows where he slipped
// in bar 26 (s ~ 300), digs in, and comes over the top on the snare
const STEEP = [[GO, -40, 0], [181, 6, 11], [197, 250, 16], [204, 312, 7], [213, 468, 18], [MADE, 510, 9], [222, 530, 0]];
const S_TOP = 530, X_TOP = T34[0] + S_TOP - RAMP;   // where he comes to rest on the plateau
// the cursor's second descent, [local frame, tip y, px per frame]: it brakes as he sets off
const CUR2 = [[RESET + 2, -180, 0], [GO + 4, 160, 24], [GO + 10, 238, 3], [GO + 14, 226, -1.5], [196, 222, 0]];
const LIFT = FY - T34[1];                     // the camera rises this much: the plateau lands on FY
const WALK = [228, 244], VW = 9;              // he walks off, 0 -> 9 px a frame (the flicks' pace)
const WORLDS = [4, 5];                        // the pier, then the ladder's hill (physics.js)
const SAT = [0.15, 1.12];                     // near-even chroma steps (mean RGB range 4.2, 15.6, 29.2)
const EPIS = [1204, 1205, 9406, 44090];       // the two ramp episodes, then each world's
let FL = [270, 306], STOP = 342;              // local frames of the flicks; where he stops (setup)

// cubic Hermite through [f, value, slope] keys
function herm(keys, f) {
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, s0, v0] = keys[i], [f1, s1, v1] = keys[i + 1];
    if (f > f1) continue;
    const h = f1 - f0, t = clamp((f - f0) / h), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * s0 + (t3 - 2 * t2 + t) * h * v0 + (3 * t2 - 2 * t3) * s1 + (t3 - t2) * h * v1;
  }
  return keys[keys.length - 1][1];
}
// a spring with a small overshoot (5%, so the readout never shows more than 34)
const backOut = (u) => 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2);

const theta = (fl) => fl < RESET ? lerp(TH0, TH1, easeInOut(clamp((fl - DRAG[0]) / (DRAG[1] - DRAG[0]))))
  : lerp(TH1, TH0, backOut(clamp((fl - RESET) / 12)));

// px walked along the plateau after the top
function walked(fl) {
  const [a, b] = WALK;
  if (fl <= a) return 0;
  if (fl <= b) return 0.5 * VW * (fl - a) * (fl - a) / (b - a);
  return 0.5 * VW * (b - a) + VW * (fl - b);
}
// the camera after the top: it rises to his level, and once he reaches FX it follows him
function camAt(fl) {
  if (fl < MADE) return { x: 0, y: 0 };
  const D = walked(fl), M = 2 * (FX - X_TOP);
  const sx = D < M ? D - D * D / (2 * M) : M / 2;      // his screen x eases into FX
  return { x: D - sx, y: LIFT * easeInOut(clamp((fl - 222) / 36)) };
}

// distance along the ground path (negative: the flat before the ramp; past RAMP: the plateau)
function sAt(fl) {
  if (fl < 40) return 200 + 110 * (1 - Math.pow(1 - fl / 40, 2));
  if (fl < 44) return 310 - 3 * (fl - 40);
  if (fl < 60) return 298 - 338 * Math.pow((fl - 44) / 16, 2);
  if (fl < 114) return -40;
  if (fl < EASED) { const u = (fl - 114) / (EASED - 114); return -40 + (S_EASED + 40) * (u < 0.15 ? u * u / 0.3 : u - 0.075) / 0.925; }
  if (fl < RESET) return S_EASED;
  if (fl < GO) return -40;
  if (fl < 222) return herm(STEEP, fl);
  return S_TOP + walked(fl);
}
function place(s, th) {
  const T = topOf(th);
  if (s < 0) return { x: B[0] + s, y: B[1], lean: -th * smoothstep(-36, 0, s) };
  if (s > RAMP) return { x: T[0] + s - RAMP, y: T[1], lean: -th * (1 - smoothstep(RAMP, RAMP + 30, s)) };
  return { x: B[0] + s * Math.cos(th), y: B[1] - s * Math.sin(th), lean: -th * Math.min(smoothstep(-36, 0, s), 1 - smoothstep(RAMP, RAMP + 30, s)) };
}
function poseAt(fl, s, lean, cur) {
  if (fl < 40) return walkPose(s / 64, { lean, eyes: { dx: 0.6, dy: -0.3 } });
  if (fl < 44) return walkPose(fl * 0.45, { lean, arms: [0.5, 0.5], eyes: { kind: 'tall', dx: 0.3 } });
  if (fl < 60) return { lean, sy: 0.96, arms: [0.95, 0.95], legs: [[0.8, 0], [0.8, 0], [0.8, 0], [0.8, 0]], eyes: { kind: 'tall', dx: 0.2, dy: -0.2 } };
  if (fl < 66) { const q = (fl - 60) / 6; return { lean, sy: 0.84 + 0.1 * easeOut(q), arms: [0.4 * (1 - q), 0.4 * (1 - q)], eyes: { kind: 'tall', h: 0.8 } }; }
  // at the foot, deflated; then he watches the cursor come down and take the ramp
  if (fl < 112) {
    let eyes = { dx: 0.2, dy: 0.5 };
    if (cur) {
      const dx = cur.x - B[0] + 40, dy = cur.y - (B[1] - 40), L = Math.hypot(dx, dy) || 1;
      eyes = { dx: 0.8 * dx / L, dy: 1.0 * dy / L };
    }
    if (fl >= 74 && fl < 77) eyes = { kind: 'closed' };
    return { sy: 0.94 + 0.06 * smoothstep(80, 90, fl), head: 0.5 * smoothstep(80, 90, fl), eyes };
  }
  if (fl < 114) return { eyes: { kind: 'tall', dx: 0.6 }, lift: -0.3 };
  if (fl < EASED) return walkPose(s / 60, { lean, eyes: { dx: 0.7, dy: -0.3 } });
  // made it, quietly: a small hop, arms half up; then he looks back at the steep ghost
  if (fl < 152) { const h = clamp((fl - EASED - 1) / 7); return { arms: [0.5, 0.5], lift: 0.8 * Math.sin(Math.PI * h), eyes: { kind: 'arch' } }; }
  if (fl < RESET) { const q = smoothstep(152, 156, fl); return { eyes: { dx: lerp(0.3, -0.9, q), dy: lerp(0, 0.35, q) } }; }
  // the new episode: at the foot he looks up the steep ramp, narrows his eyes, crouches, and goes
  if (fl < GO) {
    const q = smoothstep(RESET + 2, RESET + 7, fl), crouch = smoothstep(GO - 6, GO - 1, fl);
    return { sy: 1 - 0.1 * crouch, eyes: { dx: lerp(0, 0.75, q), dy: lerp(0, -0.55, q), h: 1 - 0.25 * q } };
  }
  if (fl < MADE) {
    // his steps quicken where it is hardest
    return walkPose(s / 56 + 0.9 * smoothstep(196, 206, fl), { lean, eyes: { dx: 0.8, dy: -0.45, h: 0.8 } });
  }
  // the top, on the snare: arms up, a hop; then he walks on
  if (fl < WALK[0]) { const h = clamp((fl - MADE - 1) / 11); return { arms: [0.95, 0.95], lift: 2.0 * Math.sin(Math.PI * h), eyes: { kind: 'arch' } }; }
  return walkPose(walked(fl) / 66, { eyes: { dx: 0.6 } });
}
// the paper cursor, screen px
function cursorAt(fl) {
  // bar 27: down to the handle, drags it along the ramp's arc, lets go, lifts away
  if (fl >= 62 && fl <= 150) {
    const T = topOf(theta(fl));
    const u = easeOut(clamp((fl - 62) / 26)), v = easeInOut(clamp((fl - 118) / 30));
    const grab = smoothstep(84, 90, fl) * (1 - smoothstep(113, 118, fl));
    const tip = fl < DRAG[0] ? T34 : T;
    return {
      x: tip[0] + 110 * (1 - u) + 90 * v + 4,
      y: lerp(-180, tip[1] + 2, u) - 760 * v * v,
      press: grab, rot: -0.05 - 0.14 * (1 - u) + 0.12 * v,
    };
  }
  // bar 28: it comes down to help again, but he is already going: as he sets off it brakes, bobs
  // back, hovers, and withdraws
  if (fl >= RESET + 2 && fl <= 216) {
    const y = herm(CUR2, fl), u = clamp((y + 180) / (T34[1] + 182)), v = easeInOut(clamp((fl - 196) / 20));
    return {
      x: T34[0] + 110 * (1 - u) + 90 * v + 4,
      y: y - 760 * v * v,
      press: 0, rot: -0.05 - 0.14 * (1 - u) + 0.12 * v,
    };
  }
  return null;
}
// the vector world's spawn mark: four short pale strokes flying out from his middle
function burst(g, x, y, age) {
  if (age < 0 || age >= 7) return;
  const a = age / 7;
  g.save(); g.globalAlpha = 1 - a * a;
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const r0 = 60 + 34 * easeOut(a), r1 = r0 + 4 + 20 * (1 - a);
    line(g, x + sx * r0, y + sy * r0 * 0.55, x + sx * r1, y + sy * r1 * 0.55, '#f7f6f2', 4);
  }
  g.restore();
}
function ghostAt(fl) {
  if (fl < DRAG[0]) return 0;
  if (fl < RESET) return 1 - 0.55 * smoothstep(DRAG[1] + 4, DRAG[1] + 24, fl) + 0.4 * smoothstep(151, 158, fl);
  return 0.85 * (1 - smoothstep(RESET + 3, RESET + 9, fl));     // the surface springs up into it
}

// draw the whole frame into context gc at scale kk (1920 units -> pixels)
function drawScene(gc, kk, fl, P) {
  gc.setTransform(kk, 0, 0, kk, 0, 0);
  let fi = -1;
  for (let i = 0; i < FL.length; i++) if (fl >= FL[i]) fi = i;
  if (fi < 0) {
    const th = theta(fl), cam = camAt(fl);
    const handle = smoothstep(82, 88, fl) * (1 - smoothstep(116, 124, fl));
    const edit = fl >= MADE ? Math.exp(-(fl - MADE) / 6) : 0;
    drawRamp(gc, { th, th0: TH0, ghost: ghostAt(fl), edit, fl, handle, selected: handle, cam });
    const s = sAt(fl), p = place(s, th), cur = cursorAt(fl);
    drawClawd(gc, p.x - cam.x, p.y + cam.y, U, poseAt(fl, s, p.lean, cur));
    // the reset: he leaves the plateau and appears at the foot
    if (fl >= RESET) {
      const e = place(S_EASED, TH1), f = place(-40, TH0);
      burst(gc, e.x, e.y - 40, fl - RESET); burst(gc, f.x, f.y - 40, fl - RESET);
    }
    const ep = fl < RESET ? EPIS[0] : EPIS[1];
    const step = fl < RESET ? Math.floor(fl / 2) + 131 : Math.floor((Math.min(fl, MADE) - RESET) / 2);
    drawHUD(gc, [['EPISODE', groupInt(ep)], ['STEP', String(step)]]);
    if (cur) P.draw(gc, cur.x, cur.y, { press: cur.press, rot: cur.rot });
    return;
  }
  // the worlds change around him on the snare; he walks on, and stops on the hill
  const walkF = Math.min(fl, STOP);
  const scroll = 9 * (walkF - FL[fi]) + 40;          // each world starts where it looks best
  drawFlick(gc, WORLDS[fi], SAT[fi], scroll, fl);
  const pose = fl < STOP ? walkPose(walked(walkF) / 66, { eyes: { dx: 0.6 } })     // his stride runs on across the cuts
    : { eyes: fl >= STOP + 9 && fl < STOP + 12 ? { kind: 'closed' } : { dx: 0.7, dy: -0.2 }, sy: 1 - 0.05 * Math.exp(-(fl - STOP) / 3) };
  drawClawd(gc, FX, FY, U, pose);
  drawHUD(gc, [['EPISODE', groupInt(EPIS[fi + 2] + (walkF - FL[fi]) * 3)], ['STEP', String(Math.floor((walkF - FL[fi]) * 1.5) + 12)]]);
}

let g, k, P, lo, mid;
export default {
  async setup(ctx) {
    g = ctx.canvas.getContext('2d');
    k = ctx.W / 1920;
    P = createPaperCursor();
    const f0 = ctx.shot.f0, f1 = ctx.shot.f1;
    // the backbeat snares after the top, leaving his triumph a beat and a half: the worlds change on
    // the first two, and the next one stops him
    const beats = ctx.T.events('beats');
    const back = ctx.T.events('snares').filter((f) => f >= f0 + MADE + 36 && f < f1 && beats.some((b) => Math.abs(b - f) <= 2 && ((b - f0 - MADE) / 18) % 2 === 1));
    if (back.length >= WORLDS.length) FL = back.slice(0, WORLDS.length).map((f) => f - f0);
    if (back.length > WORLDS.length) STOP = back[WORLDS.length] - f0;
    ctx.log(`S11 worlds at local ${FL.join(', ')}; stop at ${STOP}`);
    // the opening resolution steps: a quarter, then a half of the frame
    lo = document.createElement('canvas'); lo.width = Math.round(ctx.W / 4); lo.height = Math.round(ctx.H / 4);
    mid = document.createElement('canvas'); mid.width = Math.round(ctx.W / 2); mid.height = Math.round(ctx.H / 2);
  },
  render(ctx, fr) {
    const fl = fr.fl;
    if (fl < 12) {
      const c = fl < 6 ? lo : mid;
      drawScene(c.getContext('2d'), k * c.width / ctx.W, fl, P);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.imageSmoothingEnabled = false;
      g.drawImage(c, 0, 0, ctx.W, ctx.H);
      return;
    }
    drawScene(g, k, fl, P);
  },
};
