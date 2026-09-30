// The lab's two researchers, rebuilt in Revision 19 (Claire, cut 17: "the human silhouettes are a
// little off - try finding and tracing over a reference?"). Both are traced from photo references
// (sources in NOTES.md) and rigged as faceless backlit card silhouettes, in the lab's world px (rest view).
//
//  B stands in profile facing the screen, a mug held at his chest. His outline is traced from Pexels
//    30033728 (a man standing in profile against a plain backdrop; grabCut mask, row extents), with the
//    clasped hands in front removed and the face's profile smoothed away (the head reads as seen a little
//    from behind: faceless). Scaled to his old height (485 px, 7.6 heads) and place. The mug arm is new,
//    on the reference's shoulder: the upper arm hangs to the waist, the forearm rises to the mug.
//  A sits on a lab stool at the bench, near profile, facing the screen (her face turned away), reaching
//    onto the bench to the mouse (S08) or resting a hand on her thigh (S20's coda). A 7.5-head figure
//    (head 84 px, her bun on top). The posture and the torso's line are traced from Pexels 7679592 (a
//    woman seated in profile at a desk, mirrored): the torso leans about 14 degrees forward from the
//    sitting bones, the back curves from the buttock through the lumbar hollow to the shoulder blades;
//    the hip is at 80 degrees and the knees at 76 (near) and 67 (far), the feet on the stool's ring.
//    The lab bench is tall: its top is a little above her elbow, so she reaches up to the mouse.
//
// S20's coda poses (the same figures, two more references):
//  A leans in: she hinges forward at the hips, leading with her chest (the spine extends a little above
//    the waist, so her back lengthens instead of hunching), her head settling forward and lifting to keep
//    her eyes on the screen (after Pexels 6803531, a man leaning in to his monitor); her near hand slides
//    along her thigh until the forearm lies on it and the hand drapes over her knee (Pexels 6995881, a
//    woman perched on a stool, feet on the rung, forearms over her knees).
//  B turns toward the screen: his head comes round and nods toward it (it is to his left, below his eyes),
//    his upper body inclines a little toward it, and the mug comes down to his waist, the forearm level
//    (Pexels 5061274, a man holding a coffee cup at his waist, his head turned). S08 uses the head alone.
//
// Each figure is returned as a list of pieces [kind, polygon, edge amplitude] (kind 'card' or 'cut') in
// a fixed order: the paper engine keys each piece's hand-cut edge to its place in the draw order, so a
// moving piece keeps its edge instead of boiling. Everything is a pure function of the pose.
import { S2, lerp, clamp, bump, smooth } from './paper.js';

const rot = (p, c, a) => { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };
const limb = (ctrl, w, seg = 10) => S2.ribbon(S2.cat(ctrl, false, seg), w);
const blob = (ctrl, seg = 6) => S2.cat(ctrl, true, seg);
// two-bone IK: shoulder S, wrist target W, bone lengths l1, l2; bend +1 puts the elbow clockwise of S->W
// (y down: below a reach to the right, behind a reach downward)
export function ik2(S, W, l1, l2, bend = 1) {
  const dx = W[0] - S[0], dy = W[1] - S[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.5);
  const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a = Math.atan2(dy, dx) + bend * Math.acos(c);
  const E = [S[0] + l1 * Math.cos(a), S[1] + l1 * Math.sin(a)];
  const ex = W[0] - E[0], ey = W[1] - E[1], el = Math.hypot(ex, ey) || 1;
  return { S, E, Wr: [E[0] + ex / el * l2, E[1] + ey / el * l2] };
}

// ================================================================ researcher B
// traced outline, reference px (Pexels 30033728, 1260 x 1890): the body from the throat down the front,
// round the shoe, up the back to the nape; the head from the nape over the crown to the throat
const B_BODY_REF = [[580, 408], [577, 428], [570, 448], [562, 472], [555, 500], [549, 530], [545, 560], [542, 590], [539, 620],
  [537, 660], [534, 700], [531, 740], [529, 790], [529, 850], [531, 910], [533, 965], [535, 995], [541, 1040], [548, 1080],
  [555, 1120], [562, 1160], [570, 1200], [578, 1240], [585, 1280], [593, 1320], [600, 1360], [606, 1400], [608, 1440],
  [606, 1480], [605, 1515], [594, 1537], [560, 1549], [523, 1558], [505, 1568], [502, 1581], [512, 1591], [600, 1593],
  [690, 1593], [726, 1589], [733, 1576], [729, 1552], [716, 1525], [712, 1490], [712, 1450], [710, 1405], [706, 1360],
  [703, 1310], [699, 1265], [692, 1222], [685, 1185], [686, 1150], [690, 1105], [694, 1055], [702, 1003], [731, 988],
  [736, 950], [736, 905], [731, 865], [724, 832], [720, 800], [719, 760], [721, 720], [725, 680], [731, 640], [739, 605],
  [744, 578], [742, 545], [736, 518], [727, 492], [716, 468], [701, 446], [686, 428], [682, 410]];
const B_HEAD_REF = [[684, 414], [676, 396], [670, 378], [674, 352], [689, 328], [701, 304], [706, 283], [703, 261], [694, 243],
  [680, 228], [660, 216], [634, 209], [606, 211], [584, 218], [566, 231], [553, 248], [545, 268], [543, 292], [542, 318],
  [545, 344], [551, 368], [560, 387], [571, 400], [583, 413], [632, 422]];
// the mug arm on the reference's frame: shoulder joint, elbow, wrist, the mug's centre
const B_ARM_REF = { S: [646, 492], E: [612, 748], W: [498, 618], M: [438, 598] };
const B_K = 0.3512, B_HEEL = [1740, 934];                       // scale (his old 485 px height), heel on the floor
const toB = ([x, y]) => [B_HEEL[0] + (x - 731) * B_K, B_HEEL[1] + (y - 1590) * B_K];
const B_PIV = toB([630, 410]);                                   // the head's pivot, top of the neck
const B_HIP = toB([640, 985]);                                   // the hip joint: his upper body inclines about it
const B_HEAD_S = 0.95;                                           // the head a touch smaller: 7.6 heads
export const B_FIG = { K: B_K, heel: B_HEEL, pivot: B_PIV, hip: B_HIP, arm: Object.fromEntries(Object.entries(B_ARM_REF).map(([k, p]) => [k, toB(p)])) };
// the turn, in three overlapping parts of pose.turn: the head, the upper body, the mug. The forearm is 1.1
// heads (68 px); at rest it rises to the mug at his chest, turned it is level, the mug at his waist.
const B_TURN = { head: [0, 0.45], body: [0.3, 0.8], mug: [0.4, 1], nod: 0.18, round: 0.1, lean: 0.045, fore: 68, lowA: -Math.PI + 0.06 };
const B_MUG = [B_FIG.arm.M[0] - B_FIG.arm.W[0], B_FIG.arm.M[1] - B_FIG.arm.W[1]];   // the mug from the wrist
const B_FORE_A = Math.atan2(B_FIG.arm.W[1] - B_FIG.arm.E[1], B_FIG.arm.W[0] - B_FIG.arm.E[0]);
const part = (t, [a, b]) => smooth(a, b, t);

// pose.turn 0..1: he turns toward the screen (to his left and below his eyes). The head comes round toward
// it (the back of the skull draws in) and nods; then his upper body inclines a little toward it about the
// hips; then the mug comes down from his chest to his waist. S08 uses the head alone (turn up to 0.45).
export function researcherB(pose = {}) {
  const t = pose.turn || 0, out = [];
  const hT = part(t, B_TURN.head), bT = part(t, B_TURN.body), mT = part(t, B_TURN.mug);
  const bA = -B_TURN.lean * bT;                                    // the incline (negative: toward the screen)
  const up = (p) => (bA ? rot(p, B_HIP, bA * smooth(B_HIP[1], B_HIP[1] - 90, p[1])) : p);   // above the hips only
  out.push(['card', blob(B_BODY_REF.map(toB).map(up), 4), 0.5]);
  const head = B_HEAD_REF.map(toB).map(([x, y]) => {
    let q = [B_PIV[0] + (x - B_PIV[0]) * B_HEAD_S, B_PIV[1] + (y - B_PIV[1]) * B_HEAD_S];
    if (q[0] > B_PIV[0]) q[0] = B_PIV[0] + (q[0] - B_PIV[0]) * (1 - B_TURN.round * hT);
    return rot(rot(q, B_PIV, -B_TURN.nod * hT), B_HIP, bA);
  });
  out.push(['card', blob(head, 4), 0.5]);
  // the mug arm: upper arm hanging to the waist (the deltoid's cap over the shoulder), forearm to the mug
  const S = up(B_FIG.arm.S), E = up(B_FIG.arm.E);
  const fa = lerp(B_FORE_A, B_TURN.lowA, mT * mT * (3 - 2 * mT)) + bA;
  const W = [E[0] + B_TURN.fore * Math.cos(fa), E[1] + B_TURN.fore * Math.sin(fa)];
  const M = [W[0] + B_MUG[0], W[1] + B_MUG[1]];                   // the wrist keeps the mug upright
  out.push(['card', limb([[S[0] + 2, S[1] - 6], S, E], (t) => lerp(35, 26, t) + 2.5 * bump(t, 0.3, 0.2)), 0.45]);
  out.push(['card', limb([E, [lerp(E[0], W[0], 0.45) - 1.5 * Math.sin(fa), lerp(E[1], W[1], 0.45) + 1.5 * Math.cos(fa)], W], (t) => lerp(27, 19, t) + 2 * bump(t, 0.25, 0.15)), 0.45]);
  // the mug (its handle forward, a cut ring) and the hand round it from his side
  out.push(['card', S2.rrect(M[0] - 12, M[1] - 14, 24, 28, 4), 0.3]);
  out.push(['card', S2.ellipse(M[0] - 14, M[1] - 1, 7.5, 9, 0, 40), 0.25]);
  out.push(['cut', S2.ellipse(M[0] - 14.8, M[1] - 1, 3.6, 5, 0, 32), 0.15]);
  const hd = Math.atan2(M[1] - W[1], M[0] - W[0]);
  out.push(['card', S2.ellipse(W[0] + (M[0] + 9 - W[0]) * 0.55, W[1] + (M[1] + 3 - W[1]) * 0.55, 13, 9.5, hd, 48), 0.35]);
  out.push(['card', limb([[M[0] + 8, M[1] - 7], [M[0] + 3, M[1] - 10], [M[0] - 3, M[1] - 9]], (t) => lerp(7.5, 5.5, t), 6), 0.25]);   // the thumb over the rim
  return out;
}

// ================================================================ researcher A
// The torso's frame: origin at the sitting bones on the seat, u forward (toward the screen), v up; px
// for a head of 84. Traced from 7679592 (mirrored, scaled to her head): the back line from the seat to
// the nape, the front line from the throat to the lap.
const A_TORSO = [
  [-24, 0], [-46, 8], [-54, 26], [-52, 50], [-44, 78], [-39, 106], [-41, 136], [-47, 168], [-51, 196], [-47, 220],
  [-36, 238], [-24, 252], [-18, 270],                                                 // back: buttock, lumbar hollow, shoulder blades, C7
  [14, 266], [20, 246], [28, 230], [42, 214], [52, 194], [53, 174], [47, 156], [40, 138], [37, 114], [38, 90],
  [41, 66], [44, 44], [40, 20], [18, 0]];                                             // front: throat, chest, waist, belly, lap
// the head (its own frame, y down, facing +x; seen a little from behind, so the cheek is its outline)
const A_HEAD = [[2, -42], [20, -37], [32, -25], [37, -8], [37, 8], [33, 24], [25, 36], [14, 42], [2, 40], [-10, 34],
  [-22, 30], [-33, 18], [-39, 0], [-37, -18], [-27, -33], [-14, -40]];
export const A_FIG = {
  h: 84,                  // the design's head height (px); drawn at scale sc about the sitting bones (head 90 px)
  sc: 1.07,
  sit: [542, 880],        // the sitting bones on the seat (world): the torso leans about this point
  tilt: 0.24,             // the torso's lean at rest (rad), from the reference; S20's lean hinges A_LEAN.hip more
  shoulder: [0, 210],     // shoulder joint, torso frame
  headC: [12, 286],       // the head's centre, torso frame (the head stays upright, looking at the screen)
  neck: [[-4, 236], [4, 262]],
  l1: 118, l2: 92,        // upper arm, forearm
  knee: [708, 853], knee2: [698, 848], ankle: [665, 1005], ankle2: [636, 995],   // knees 76 and 67 degrees, feet on the ring
  stool: 542, seat: 880, ring: 1024,
};
export const A_WRIST = [-16, 1];                                   // the wrist from the palm's centre
const TA = (p, th) => [A_FIG.sit[0] + p[0] * Math.cos(th) + p[1] * Math.sin(th), A_FIG.sit[1] - p[1] * Math.cos(th) + p[0] * Math.sin(th)];
// a turn in the torso frame (u forward, v up), in TA's sense: a > 0 tips the point forward about c
const rotT = (p, c, a) => { const du = p[0] - c[0], dv = p[1] - c[1], s = Math.sin(a), co = Math.cos(a); return [c[0] + du * co + dv * s, c[1] - du * s + dv * co]; };
// the lean (S20's coda, pose.lean 0..1, with the hand off the mouse): hip is the hinge's extra forward tilt
// (rad), ext the spine's extension above the waist (so the chest leads), reach and settle the head's move
// forward and down toward the shoulders and lift its chin-up tilt (torso px, rad); the near hand slides from
// pose.hand (on her thigh) to knee (world px, the palm over her knee), the fingers drooping over it by droop
export const A_LEAN = { hip: 0.36, ext: 0.24, waist: [0, 96], reach: 7, settle: 8, lift: 0.07, droop: 0.5, knee: [728, 826] };
const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

// pose: { hand: [x, y] palm centre (on the mouse, or on her thigh; world px), mouse: bool, lean: 0..1 }
// She is designed at a head of 84 px (A_FIG, the torso frame) and drawn at A_FIG.sc about the sitting
// bones; the hand's target is in world px (the mouse on the bench), so the arm reaches it exactly.
export function researcherA(pose = {}) {
  const F = A_FIG, k = F.sc, O = F.sit;
  const toW = (p) => [O[0] + (p[0] - O[0]) * k, O[1] + (p[1] - O[1]) * k];
  const lean = pose.lean || 0;
  // (S20's coda) leaning in, the hand slides along her thigh to her knee
  const hw = pose.mouse === false && lean > 0 ? [lerp(pose.hand[0], A_LEAN.knee[0], ease(lean)), lerp(pose.hand[1], A_LEAN.knee[1], ease(lean))] : pose.hand;
  const out = researcherA0(Object.assign({}, pose, { handW: hw, hand: [O[0] + (hw[0] - O[0]) / k, O[1] + (hw[1] - O[1]) / k] }));
  return out.map(([kind, pts, amp, world]) => [kind, world ? pts : pts.map(toW), amp]);
}
function researcherA0(pose) {
  const F = A_FIG, lean = pose.lean || 0, th = F.tilt + A_LEAN.hip * lean, ex = A_LEAN.ext * lean;
  // a torso-frame point: the spine extends above the waist, then the torso tilts about the sitting bones
  const TX = (p) => { const w = ex ? smooth(50, 190, p[1]) : 0; return TA(w ? rotT(p, A_LEAN.waist, -ex * w) : p, th); };
  const hand = pose.hand, out = [];
  // ---- the stool: padded seat, gas lift, post, foot ring (its hole cut before the legs are drawn over it)
  const X = F.stool;
  out.push(['card', S2.rrect(X - 68, F.seat - 2, 136, 18, 7), 0.4]);
  out.push(['card', S2.ellipse(X, F.seat, 68, 7, 0, 60), 0.3]);
  out.push(['card', S2.rect(X - 8, F.seat + 14, 16, 16), 0.3]);
  out.push(['card', S2.rect(X - 6, F.seat + 26, 12, 230), 0.3]);
  out.push(['card', S2.ellipse(X, F.ring, 96, 10, 0, 72), 0.3]);
  out.push(['cut', S2.ellipse(X, F.ring, 90, 5.2, 0, 72), 0.1]);
  for (const s of [-1, 1]) out.push(['card', S2.ribbon(S2.line([X, F.ring - 12], [X + s * 88, F.ring - 1], 8), () => 4), 0.2]);
  // ---- legs: the far shin and foot behind, then the near thigh, shin and foot (hip and knee near 90 degrees)
  const shin = (K, Ak) => limb([K, [lerp(K[0], Ak[0], 0.33) - 3, lerp(K[1], Ak[1], 0.33)], Ak], (t) => lerp(41, 22, t) + 6 * bump(t, 0.3, 0.2), 10);
  const foot = (Ak, dx, dy) => blob([[Ak[0] - 10, Ak[1] - 11], [Ak[0] - 20, Ak[1] + 3], [Ak[0] - 18, Ak[1] + 23], [Ak[0] + 20, Ak[1] + 26],
    [Ak[0] + 55 + dx, Ak[1] + 26 + dy], [Ak[0] + 71 + dx, Ak[1] + 22 + dy], [Ak[0] + 66 + dx, Ak[1] + 13 + dy], [Ak[0] + 36, Ak[1] + 4], [Ak[0] + 11, Ak[1] - 9]], 5);
  out.push(['card', shin(F.knee2, F.ankle2), 0.5]);
  out.push(['card', foot(F.ankle2, -4, 0), 0.4]);
  const hip = TA([6, 34], F.tilt);
  out.push(['card', limb([[hip[0] - 18, hip[1] + 2], [lerp(hip[0], F.knee[0], 0.5), (hip[1] + F.knee[1]) / 2 - 3], F.knee],
    (t) => lerp(72, 43, t) + 3 * bump(t, 0.4, 0.25), 12), 0.5]);
  out.push(['card', shin(F.knee, F.ankle), 0.5]);
  out.push(['card', foot(F.ankle, 0, 0), 0.4]);
  // ---- torso, neck and head (the lean tilts them about the sitting bones, the chest leading; the head
  // settles a little toward the shoulders and lifts to keep her eyes on the screen)
  out.push(['card', blob(A_TORSO.map(TX), 6), 0.6]);
  const hc = TX([F.headC[0] + A_LEAN.reach * lean, F.headC[1] - A_LEAN.settle * lean]), phi = -A_LEAN.lift * lean, H = (p) => { const q = rot(p, [0, 0], phi); return [hc[0] + q[0], hc[1] + q[1]]; };
  out.push(['card', limb([TX(F.neck[0]), TX(F.neck[1]), H([-6, 26])], () => 38, 8), 0.4]);
  out.push(['card', blob(A_HEAD.map(H), 6), 0.5]);
  const bun = H([-25, -38]);
  out.push(['card', S2.ellipse(bun[0], bun[1], 16.5, 15.5, phi, 48), 0.4]);
  out.push(['card', S2.ellipse(...H([-18, -31]), 9, 7, phi - 0.6, 32), 0.3]);
  // ---- the near arm (two-bone IK from the shoulder to the wrist), the mouse and the hand
  const Sh = TX(F.shoulder), Wt = [hand[0] + A_WRIST[0], hand[1] + A_WRIST[1]];
  const a = ik2(Sh, Wt, F.l1, F.l2, 1);
  const cap = TX([F.shoulder[0] - 4, F.shoulder[1] + 14]);        // the deltoid's cap over the shoulder
  out.push(['card', limb([cap, a.S, [lerp(a.S[0], a.E[0], 0.5), lerp(a.S[1], a.E[1], 0.5)], a.E], (t) => lerp(42, 28, t) + 3 * bump(t, 0.3, 0.2), 10), 0.5]);
  out.push(['card', limb([a.E, [lerp(a.E[0], a.Wr[0], 0.4), lerp(a.E[1], a.Wr[1], 0.4)], a.Wr], (t) => lerp(30, 20, t) + 3 * bump(t, 0.22, 0.15), 10), 0.45]);
  const [px, py] = hand, dir = Math.atan2(py - a.Wr[1], px - a.Wr[0]) + (pose.mouse === false ? A_LEAN.droop * ease(lean) : 0);
  const HX = (u, v) => [a.Wr[0] + u * Math.cos(dir) - v * Math.sin(dir), a.Wr[1] + u * Math.sin(dir) + v * Math.cos(dir)];
  if (pose.mouse !== false) out.push(['card', S2.ellipse(pose.handW[0] + 7, pose.handW[1] + 5, 13, 6.5, 0.02), 0.4, true]);   // (world px: on the bench)
  // the hand, palm down: the back of the hand from the wrist, the fingers curling over (the mouse or the knee)
  out.push(['card', blob([HX(-4, -9), HX(10, -11), HX(24, -10), HX(34, -7), HX(42, -2), HX(46, 5), HX(42, 9), HX(30, 8),
    HX(16, 9), HX(4, 10), HX(-4, 8)], 5), 0.35]);
  out.push(['card', limb([HX(8, 6), HX(17, 11), HX(25, 11)], (t) => lerp(8, 6, t), 6), 0.3]);   // the thumb
  return out;
}
