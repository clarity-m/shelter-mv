// The paper lab's two scenes, from style-frames/11-paper-lab/frame.html:
//   sceneLab()   S08, the night lab (frame.png)
//   sceneHands() S09, the hands close-up (detail.png)
// Shapes and numbers are the frame's; what changed: the worlds extend past the frame (the
// camera moves), and the moving parts are driven by a pose object:
//   pose.A     = { tip: [x, y], ta }      researcher A's stylus tip and tool angle (arm by IK)
//   pose.B     = { turn }                  researcher B's head turn toward the glow, 0..1
//   pose.hands = { L, R }                  the 2D hand rig (handShapes) for both hands
//   pose.curl  = 0..1                      the harness ribs curling closed (knuckle bends)
import { S2, lerp, smooth, bump, clamp, lin } from './paper.js';
import { researcherA, researcherB } from './people.js';

export const PAPER = { ink: '#10131F', deep: '#171C30', slate: '#212843', dusk: '#2D3656', far: '#3B4668' };
const r2 = v => Math.round(v * 100) / 100;
const fmt = o => JSON.stringify(o, (k, v) => typeof v === 'number' ? r2(v) : v);
const rot = (p, c, a) => { const s = Math.sin(a), co = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };

// ================================================================ S08: the lab
// researcher A's arm: shoulder fixed, elbow by two-bone IK, hand + finger + tool rigid on the tip
const ARM = (() => {
  const S = [574, 690], E = [660, 741], Wr = [806, 694], m1 = [612, 722], m2 = [740, 718];
  const tip = [874, 655], base = [826, 684];
  const l1 = Math.hypot(E[0] - S[0], E[1] - S[1]), l2 = Math.hypot(Wr[0] - E[0], Wr[1] - E[1]);
  const local = (A, B, P) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]), u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L]; const d = [P[0] - A[0], P[1] - A[1]]; return [d[0] * u[0] + d[1] * u[1], -d[0] * u[1] + d[1] * u[0]]; };
  return { S, E, Wr, tip, base, l1, l2, ta0: Math.atan2(tip[1] - base[1], tip[0] - base[0]), lm1: local(S, E, m1), lm2: local(E, Wr, m2) };
})();
export const A_REST = { tip: ARM.tip.slice(), ta: ARM.ta0 };
const fromLocal = (A, B, l) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]), u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L]; return [A[0] + l[0] * u[0] - l[1] * u[1], A[1] + l[0] * u[1] + l[1] * u[0]]; };
function armIK(Wr, S = ARM.S) {
  const dx = Wr[0] - S[0], dy = Wr[1] - S[1], d = Math.min(Math.hypot(dx, dy), ARM.l1 + ARM.l2 - 0.01);
  const c = clamp((ARM.l1 * ARM.l1 + d * d - ARM.l2 * ARM.l2) / (2 * ARM.l1 * d), -1, 1), al = Math.atan2(dy, dx) + Math.acos(c);
  const E = [S[0] + ARM.l1 * Math.cos(al), S[1] + ARM.l1 * Math.sin(al)];
  return { S, E, Wr, m1: fromLocal(S, E, ARM.lm1), m2: fromLocal(E, Wr, ARM.lm2) };
}
function armPose(p) {
  const tip = p.tip, da = p.ta - ARM.ta0;
  const xf = q => rot([q[0] - ARM.tip[0] + tip[0], q[1] - ARM.tip[1] + tip[1]], tip, da);
  return Object.assign(armIK(xf(ARM.Wr)), { xf, da });
}

// Revision 2 (Claire, cut 2): the harness is replaced by a computer screen. Clawd lives inside it on
// a grey pixel horizon, glowing; the screen's warm light is the room's main light. Researcher A
// leans in at the mouse, and the outside paper cursor (sets/early-env/papercursor.js) moves on the
// screen beside him. The pole monitor is gone. sceneLab({exact: true}) is still the style frame
// verbatim (the harness), for verifying the port.
export const MON = { bezel: [832, 470, 336, 228], hole: [848, 484, 304, 194], z: 466 };
export const CURSOR_REST = [1098, 606];      // the paper cursor's tip on the screen (world px)
export const HAND_REST = [792, 716];         // A's palm on the mouse
export const HAND_LAP = [700, 814];          // (revision 3) A's palm resting on her thigh (with pose.A.mouse = false); R19: on the new figure's thigh, near the knee
const ARROW = [[0, 0], [0, 72], [17, 57], [28, 84], [40, 79], [29, 53], [51, 53]];   // papercursor.js

// Revision 3 (S20's coda, additive; the defaults are S08's lab):
//   sceneLab({ screen: 'ext' })   the screen is layer kind 3 and shows an external canvas (createPaper's
//                                 ext option) mapped onto MON.hole
//   sceneLab({ cursor: false })   no paper cursor on the screen (the layer stays, empty, so every other
//                                 layer keeps its index and its hand-cut edges)
//   pose.A.lean = 0..1            A bends forward from the seat toward the screen and lifts her head
//                                 (quantised to 0.01, like the layer key, so a frame is a pure function of it)
//   pose.A.mouse = false          no mouse under A's hand (with hand: HAND_LAP her hand rests in her lap)
export function sceneLab(o = {}) {
  const exact = !!o.exact;           // exact = the style frame (harness, frame extents) for verifying the port
  const mon = !exact;                // the monitor version (revision 2)
  const extScreen = mon && o.screen === 'ext', cursorOn = o.cursor !== false;
  const S = { name: 'lab' };
  const cx = 1000, CELL = 7, gw = 18 * CELL, gh = 10 * CELL, feetY = mon ? 646 : 727;
  const WO = S.world = exact ? { x0: 0, y0: 0, w: 1920, h: 1080 } : { x0: -96, y0: -48, w: 2112, h: 1176 };
  const L0 = exact ? -30 : -260;     // left end of the bench (past the frame edge)
  S.clawd = { x0: cx - gw / 2, y0: feetY - gh, cell: CELL, z: mon ? MON.z : 600 };
  S.light = mon ? { x: cx, y: 600, z: MON.z + 2, r: 40, I: 2.6e5, a: 210, f: 560 }
    : { x: cx, y: feetY - gh / 2, z: 600, r: 5.5, I: 4.3e5, a: 210, f: 560 };
  S.moon = { dir: [0.3, 0.52, 1], I: 0.55, disc: [372, 330, 21] };
  S.sky = { top: '#1B2138', hor: '#34406A', horY: 640 };
  S.mon = mon ? null : { x: 1525, y: 519, z: 212, I: 1.0 };
  // the pixel screen: native pixel = half a Clawd cell (as in S10), grid on his cells, horizon at his feet
  if (mon) S.screen = { origin: [S.clawd.x0 - 26 * 3.5, feetY - 46 * 3.5], pix: 3.5, horizon: 46, glowR: 21, gain: 1.1 };
  if (extScreen) S.ext = { rect: MON.hole.slice() };
  S.eyes = 'dark';
  S.cam = { Zc: 2400, zref: 600 };
  const L = S.layers = [];
  const add = o => L.push(o);

  const city = (m, rnd, top0, top1, winP, x0, x1, big) => {
    let x = x0;
    while (x < x1) {
      const w = (big ? 24 : 14) + rnd() * (big ? 40 : 30), top = top0 + rnd() * (top1 - top0), base = 700;
      m.card(S2.rect(x, top, w, base - top), 0.45);
      const r = rnd();
      if (r < 0.18) m.card(S2.rect(x + w * 0.28, top - 7 - rnd() * 7, w * 0.44, 12), 0.4);
      else if (r < 0.27) m.card([[x + w * 0.5 - 3, top + 2], [x + w * 0.5, top - 16 - rnd() * 14], [x + w * 0.5 + 3, top + 2]], 0.3);
      else if (r < 0.35) { m.card(S2.rrect(x + w * 0.3, top - 15, 13, 10, 3), 0.3); m.card(S2.rect(x + w * 0.3 + 2, top - 6, 2, 7), 0.2); m.card(S2.rect(x + w * 0.3 + 9, top - 6, 2, 7), 0.2); }
      else if (r < 0.42) m.card(S2.rect(x + w * 0.7, top - 22, 1.6, 23), 0.2);
      for (let wy = top + 6; wy < base - 60; wy += big ? 10 : 8) for (let wx = x + 4; wx < x + w - 5; wx += big ? 8 : 6) {
        if (rnd() < winP) { const h = S2.rect(wx, wy, big ? 2.6 : 2, big ? 3.6 : 2.8); m.cut(h, 0); m.emit(h, 0.3 + rnd() * 0.7); }
      }
      x += w + (rnd() < 0.35 ? 2 + rnd() * 5 : -rnd() * 3);
    }
  };
  // the far city is wider than the window so the lateral dolly can slide it
  add({ name: 'cityFar', z: -560, col: PAPER.far, ao: 0.25, em: lin('#9FB3D9').map(v => v * 0.55),
    draw: (m, rnd) => city(m, rnd, 478, 560, 0.1, exact ? 90 : 20, exact ? 520 : 600, false) });
  add({ name: 'cityNear', z: -320, col: PAPER.dusk, ao: 0.35, em: lin('#9FB3D9').map(v => v * 0.7),
    draw: (m, rnd) => city(m, rnd, 528, 606, 0.07, exact ? 70 : 10, exact ? 540 : 600, true) });

  const WIN = S.win = [150, 62, 440, 640];
  add({ name: 'wall', z: 0, col: PAPER.slate, alb: 0.78, ao: 0, draw: (m, rnd) => {
    m.card(exact ? S2.rect(-40, -40, 1920 + 80, 1080 + 80) : S2.rect(WO.x0 - 40, WO.y0 - 40, WO.w + 80, WO.h + 80), 0);
    m.cut(S2.rect(WIN[0], WIN[1], WIN[2] - WIN[0], WIN[3] - WIN[1]), 0.6);
    m.card(S2.rect(292, WIN[1] - 2, 6, WIN[3] - WIN[1] + 4), 0.5);
    m.card(S2.rect(WIN[0] - 2, 252, WIN[2] - WIN[0] + 4, 6), 0.5);
    m.card(S2.rect(WIN[0] - 2, 448, WIN[2] - WIN[0] + 4, 6), 0.5);
  } });
  add({ name: 'wallFront', z: 22, col: PAPER.slate, alb: 0.74, ao: 0.5, vel: [0.036, 0.045, 0.085], draw: (m, rnd) => {
    for (let k = 0, y = WIN[1] - 6; y < 150; k++, y += 9) m.vel(S2.rect(WIN[0] - 4, y, WIN[2] - WIN[0] + 8, 9.4), k % 2 ? 0.62 : 0.9, 0.35);
    m.card(S2.rrect(WIN[0] - 9, 148, WIN[2] - WIN[0] + 18, 9, 3), 0.5);
    m.card(S2.ribbon(S2.line([414, 156], [416, 222]), () => 1.8), 0.2);
    m.card(S2.ellipse(416, 227, 4.6, 5.4), 0.3); m.cut(S2.ellipse(416, 227, 2.2, 2.9), 0.2);
    m.card(S2.rect(WIN[0] - 22, WIN[3] - 2, WIN[2] - WIN[0] + 44, 13), 0.6);
    for (const [sy, sx0, sx1] of [[268, 1470, 1860], [392, 1520, 1860]]) {
      m.card(S2.rect(sx0, sy, sx1 - sx0, 8), 0.5);
      m.card([[sx0 + 30, sy + 8], [sx0 + 44, sy + 8], [sx0 + 34, sy + 28]], 0.4);
      m.card([[sx1 - 44, sy + 8], [sx1 - 30, sy + 8], [sx1 - 34, sy + 28]], 0.4);
    }
    let bx = 1492; for (const [bw, bh, lean] of [[13, 58, 0], [10, 50, 0], [15, 62, 0], [11, 46, 0.22]]) {
      if (lean) m.card([[bx, 268], [bx + bw, 268], [bx + bw + bh * Math.sin(lean), 268 - bh * Math.cos(lean)], [bx + bh * Math.sin(lean), 268 - bh * Math.cos(lean)]], 0.5);
      else m.card(S2.rect(bx, 268 - bh, bw, bh), 0.5);
      bx += bw + 1.5;
    }
    m.card(S2.rrect(1600, 232, 30, 36, 5), 0.5); m.card(S2.rect(1604, 225, 22, 9), 0.4);
    m.card(S2.ellipse(1690, 250, 17, 17), 0.5); m.card(S2.rect(1685, 212, 10, 26), 0.4);
    m.card(S2.rrect(1760, 238, 58, 30, 3), 0.5);
    m.card([[1560, 392], [1586, 392], [1590, 366], [1556, 366]], 0.5);
    for (const [a, l] of [[-2.2, 34], [-1.75, 42], [-1.3, 38], [-0.9, 30], [-2.6, 24]]) {
      const bx0 = 1573, by0 = 366, tip = [bx0 + Math.cos(a) * l, by0 + Math.sin(a) * l];
      m.card(S2.ribbon(S2.bez([bx0, by0], [bx0 + Math.cos(a) * l * 0.4, by0 + Math.sin(a) * l * 0.5 - 4], [tip[0] - Math.cos(a) * 6, tip[1] - 8], tip, 16), t => 7 * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)) + 0.8), 0.3);
    }
    m.card(S2.rect(1660, 350, 70, 42), 0.5); m.card(S2.rect(1740, 362, 48, 30), 0.5);
  } });
  add({ name: 'floor', z: 100, col: PAPER.deep, kind: 1, alb: 0.55, ao: 0.3, draw: (m, rnd) => {
    m.card(S2.rect(1200, 902, exact ? 1920 : 1100, 240), 0.3);
    if (mon) m.card(S2.rrect(1482, 917, 46, 11, 3), 0.4);     // where the cables end: a power strip
  } });

  // researcher B at the monitor (animated: one small head turn toward the glow; R19: pose.B.turn is people.js's
  // turn toward the screen, the head alone in S08 and the whole turn with the mug lowered in S20's coda)
  add({ name: 'B', z: 200, col: PAPER.deep, alb: 0.3, rimk: 1.6, ao: 0.55, cast: 1, vel: [0.044, 0.05, 0.066],
    key: pose => 'B' + fmt(pose.B || {}), seed: 2, draw: (m, rnd, pose) => {
    const turn = r2((pose.B && pose.B.turn) || 0);     // (R19) as the key sees it: the draw is a function of the key
    if (!mon) {                        // the pole monitor (gone in the monitor version)
      m.card(S2.rrect(1449, 465, 152, 106, 5), 0.5);
      m.cut(S2.rect(1457, 473, 136, 90), 0.4);
      m.vel(S2.rect(1457, 473, 136, 90), 0.55, 0.3);
      const gx = 1457, gy = 473, cw = 136 / 6, ch = 90 / 4;
      const floorCells = [0, 1, 2, 3, 5, 7, 8, 9, 11, 12, 14, 15, 17, 18, 19, 20, 21, 23];
      for (const c of floorCells) m.vel(S2.rect(gx + (c % 6) * cw + 1, gy + Math.floor(c / 6) * ch + 1, cw - 2, ch - 2), 0.45, 0);
      for (let i = 1; i < 6; i++) m.card(S2.rect(gx + i * cw - 0.9, gy, 1.8, 90), 0);
      for (let j = 1; j < 4; j++) m.card(S2.rect(gx, gy + j * ch - 0.9, 136, 1.8), 0);
      m.card(S2.ribbon(S2.line([1525, 568], [1525, 918]), () => 7), 0.4);
      m.card([[1486, 932], [1564, 932], [1548, 916], [1502, 916]], 0.4);
    }
    // (R19) the monitor version draws the traced figure (people.js); the style frame keeps its own
    if (mon) { for (const [k, pts, amp] of researcherB({ turn })) (k === 'cut' ? m.cut : m.card)(pts, amp); return; }
    // the head turns a little toward the glow: it lowers and comes round toward the camera,
    // so the back-of-head mass slides in behind it
    const piv = [1700, 512], ht = -0.07 * turn;
    const hp = rot([1687 - 1.5 * turn, 481 + 1 * turn], piv, ht), hh = rot([1697 - 5 * turn, 471 + 1.2 * turn], piv, ht);
    m.card(S2.ellipse(hp[0], hp[1], 25 - 0.8 * turn, 31, -0.26 + ht), 0.5);
    m.card(S2.ellipse(hh[0], hh[1], 25 - 1.5 * turn, 26, -0.34 + ht - 0.04 * turn), 0.5);
    m.card(S2.cat([[1706, 492], [1716, 500], [1712, 510], [1702, 506]].map(p => rot([p[0] - 2.5 * turn, p[1]], piv, ht))), 0.3);
    m.card(S2.ribbon(S2.line([1692, 500], [1700, 540]), t => 22 + 5 * t), 0.4);
    m.card(S2.cat([[1665, 553], [1688, 538], [1718, 539], [1736, 556], [1742, 612], [1738, 690], [1744, 770], [1750, 836], [1702, 842], [1660, 834], [1664, 760], [1662, 690], [1657, 618], [1656, 580]]), 0.6);
    m.cut(S2.cat([[1703, 845], [1700, 800], [1697, 845]]), 0.3);
    m.card(S2.ribbon(S2.cat([[1716, 830], [1720, 880], [1723, 922]], false, 10), t => 23 - 4 * t), 0.5);
    m.card(S2.ribbon(S2.cat([[1684, 830], [1681, 880], [1679, 920]], false, 10), t => 23 - 4 * t), 0.5);
    m.card(S2.cat([[1662, 931], [1667, 915], [1690, 913], [1694, 931]]), 0.4);
    m.card(S2.cat([[1703, 934], [1708, 918], [1732, 917], [1735, 934]]), 0.4);
    m.card(S2.ribbon(S2.cat([[1678, 560], [1684, 610], [1687, 640]], false, 10), t => 21 - 3 * t), 0.5);
    m.card(S2.ribbon(S2.cat([[1687, 640], [1668, 622], [1648, 604]], false, 10), t => 18 - 4 * t), 0.5);
    m.card(S2.rrect(1626, 578, 23, 27, 4), 0.5);
    m.card(S2.ellipse(1621, 591, 7.5, 8.5), 0.3); m.cut(S2.ellipse(1621, 591, 3.5, 4.5), 0.2);
    m.card(S2.ellipse(1650, 598, 11, 9, 0.3), 0.4);
  } });

  add({ name: 'benchTop', z: 380, col: PAPER.slate, kind: 1, alb: 0.3, ao: 0.35, draw: (m, rnd) => {
    m.card([[L0, 713], [1348, 712], [1348, 1100], [L0, 1100]], 0.5);
  } });

  if (mon) {
    // ---- the computer screen (revision 2). The screen is its own light: its layers don't shadow it.
    const [hx0, hy0, hw, hh] = MON.hole, [bx0, by0, bw, bh] = MON.bezel;
    add({ name: 'screen', z: MON.z, kind: extScreen ? 3 : 2, col: PAPER.ink, ao: 0, cast: -1, draw: (m) => {
      m.card(S2.rect(hx0 - 3, hy0 - 3, hw + 6, hh + 6), 0);
    } });
    add({ name: 'monitor', z: MON.z + 4, col: PAPER.ink, alb: 0.35, thin: 0.3, ao: 0.4, cast: -1, rimk: 0.12,
      em: lin('#9FB3D9').map(v => v * 1.3), draw: (m) => {
      m.card(S2.rrect(bx0, by0, bw, bh, 10), 0.5);
      m.cut(S2.rrect(hx0, hy0, hw, hh, 3), 0.3);
      m.card([[cx - 18, by0 + bh - 2], [cx + 18, by0 + bh - 2], [cx + 25, 716], [cx - 25, 716]], 0.4);   // neck
      m.card(S2.rrect(cx - 56, 712, 112, 9, 4), 0.4);                                                   // foot
      const led = S2.ellipse(bx0 + bw - 22, by0 + bh - 10, 1.7, 1.7, 0, 16);                            // power LED
      m.cut(led, 0); m.emit(led, 0.8);
    } });
    // the outside cursor: a cut-paper arrow (sets/early-env/papercursor.js), slate card, warm edges
    add({ name: 'cursor', z: MON.z + 6, col: PAPER.slate, alb: 0.03, thin: 3.0, ao: 0.2, cast: -1, rimk: 2.0, seed: 4,
      key: pose => 'C' + fmt(pose.cursor || CURSOR_REST), draw: (m, rnd, pose) => {
      if (!cursorOn) return;
      const [tx, ty] = pose.cursor || CURSOR_REST;
      m.card(ARROW.map(p => rot([tx + p[0] * 0.3, ty + p[1] * 0.3], [tx, ty], -0.05)), 0.35);
    } });
    // the desk: keyboard in front of the screen, and the cables off the bench's end to the floor
    add({ name: 'desk', z: 640, col: PAPER.ink, alb: 0.5, thin: 0.05, ao: 0.4, cast: 1, draw: (m) => {
      m.card([[866, 723], [1012, 723], [1019, 731], [859, 731]], 0.4);
      m.cut(S2.rect(872, 725.2, 134, 1.2), 0);
      const cab = S2.cat([[cx + 40, 719], [1180, 721], [1290, 722], [1330, 726], [1343, 752], [1348, 830], [1356, 892], [1400, 918], [1488, 926]], false, 16);
      m.card(S2.ribbon(cab, () => 4.2, [false, true]), 0.3);
      const cab2 = S2.cat([[cx + 30, 720], [1160, 723], [1300, 725], [1336, 733], [1352, 790], [1368, 860], [1420, 900], [1500, 912]], false, 16);
      m.card(S2.ribbon(cab2, () => 3.2, [false, true]), 0.3);
    } });
  }
  const HC = { cx, poleY: 738, Rh: 118, Rv: 116 };
  const rib = (side, k, th1, w0, w1) => {
    const cyc = HC.poleY - HC.Rv, pts = [];
    for (let i = 0; i <= 64; i++) {
      const th = 0.3 + (th1 - 0.3) * i / 64, hook = smooth(th1 - 0.6, th1, th);
      pts.push([HC.cx + side * (Math.sin(th) * HC.Rh * k - hook * hook * 17 * k), cyc + Math.cos(th) * HC.Rv + hook * hook * 7]);
    }
    return S2.ribbon(pts, t => lerp(w0, w1, t) + 1.7 * bump(t, 0.47, 0.03) + 1.4 * bump(t, 0.76, 0.026));
  };
  if (!mon) add({ name: 'ribsBack', z: 420, col: PAPER.deep, alb: 0.07, ao: 0, cast: 1, draw: (m, rnd) => {
    const ks = [1.0, 0.885, 0.77, 0.655], th = [2.16, 2.3, 2.25, 2.06];
    for (const s of [-1, 1]) ks.forEach((k, i) => m.card(rib(s, k, th[i] + (s > 0 ? 0.02 : 0), 12.5, 8.5), 0.5));
    m.card(S2.cat([[cx - 84, 742], [cx - 80, 708], [cx - 58, 684], [cx, 676], [cx + 58, 684], [cx + 80, 708], [cx + 84, 742]]), 0.5);
  } });
  if (!mon) add({ name: 'ribsFront', z: 680, col: PAPER.ink, alb: 0.5, thin: 0.05, ao: 0.4, cast: 1, em: lin('#9FB3D9').map(v => v * 1.3), draw: (m, rnd) => {
    for (const s of [-1, 1]) {
      const pts = S2.bez([cx + s * 100, 736], [cx + s * 137, 702], [cx + s * 133, 630], [cx + s * 97, 598], 48);
      m.card(S2.ribbon(pts, t => lerp(12, 8, t) + 1.8 * bump(t, 0.55, 0.035)), 0.5);
    }
    m.card(S2.rrect(cx - 112, 727, 224, 20, 8), 0.5);
    for (let k = -6; k <= 6; k++) if (Math.abs(k) > 1) m.cut(S2.ellipse(cx + k * 14.5, 732.2, 1.7, 1.7, 0, 14), 0);
    for (const lx of [cx + 70, cx + 79]) { m.cut(S2.ellipse(lx, 733.5, 1.7, 1.7, 0, 16), 0); m.emit(S2.ellipse(lx, 733.5, 1.7, 1.7, 0, 16), 1); }
    const cab = S2.cat([[cx + 106, 734], [1180, 733], [1290, 731.5], [1330, 734], [1343, 752], [1348, 830], [1356, 892], [1400, 918], [1488, 926]], false, 16);
    m.card(S2.ribbon(cab, () => 4.2, [false, true]), 0.3);
    const cab2 = S2.cat([[cx + 100, 739], [1160, 738], [1300, 736], [1336, 742], [1352, 790], [1368, 860], [1420, 900], [1500, 912]], false, 16);
    m.card(S2.ribbon(cab2, () => 3.2, [false, true]), 0.3);
  } });
  add({ name: 'benchFront', z: 720, col: PAPER.deep, alb: 0.55, ao: 0.45, draw: (m, rnd) => {
    m.card(S2.rect(L0, 736, 1332 - L0, 400), 0.5);
  } });
  add({ name: 'benchLip', z: 726, col: PAPER.slate, alb: 0.7, ao: 0.5, draw: (m, rnd) => {
    m.card(S2.rect(L0, 735, 1334 - L0, 12), 0.5);
    for (const x of [300, 640, 980]) m.card(S2.rect(x, 747, 3, 330), 0.3);
    for (const x of [270, 330, 610, 670, 950, 1010]) m.card(S2.rrect(x - 9, 800, 18, 4, 2), 0.3);
  } });

  // researcher A: seated, leaning in (animated: the stylus hand, or in the monitor version the hand
  // on the mouse, and the head lifted a little toward the screen)
  add({ name: 'A', z: 860, col: PAPER.ink, alb: 0.5, thin: 0.3, def: 0.22, ao: 0.6, rimk: 2.4,
    key: pose => 'A' + fmt(pose.A || (mon ? { hand: HAND_REST } : A_REST)), seed: 1, draw: (m, rnd, pose) => {
    const hand = mon ? ((pose.A && pose.A.hand) || HAND_REST) : null;
    // (R19) the monitor version draws the traced figure (people.js); the style frame keeps its own
    if (mon) {
      const pa = pose.A || {};
      for (const [k, pts, amp] of researcherA({ hand: hand.map(r2), mouse: pa.mouse !== false, lean: r2(pa.lean || 0) })) (k === 'cut' ? m.cut : m.card)(pts, amp);
      return;
    }
    // (revision 3) the lean: the spine bends forward about the seat, fully from the shoulders up, the
    // head lifting toward the screen; lean = 0 draws exactly the revision-2 figure
    const lean = mon ? r2((pose.A && pose.A.lean) || 0) : 0, LP = [522, 950], th = 0.16 * lean;
    const Bd = p => lean ? rot(p, LP, th * smooth(950, 690, p[1])) : p;
    const ap = mon ? armIK([hand[0] - 13, hand[1] + 1], Bd(ARM.S)) : armPose(pose.A || A_REST);
    const hx = 604, hy = 614, lift = mon ? -0.13 - 0.1 * lean : 0, hp = [572, 664];
    const H = p => { const q = lift ? rot(p, hp, lift) : p; return lean ? rot(q, LP, th) : q; };
    const hc0 = H([hx, hy]), hc1 = H([hx - 9, hy - 7]), hc2 = H([hx - 30, hy - 45]);
    m.card(S2.ellipse(hc0[0], hc0[1], 40, 50, 0.56 + lift + th), 0.5);
    m.card(S2.ellipse(hc1[0], hc1[1], 40, 45, 0.62 + lift + th), 0.5);
    m.card(S2.ellipse(hc2[0], hc2[1], 19, 18), 0.5);
    m.card(S2.ribbon(S2.cat([[hx - 38, hy - 22], [hx - 50, hy + 8], [hx - 47, hy + 40]].map(H), false, 10), t => 3.2 - 2.2 * t), 0.2);
    m.card(S2.ribbon(S2.line(Bd([hx - 14, hy + 34]), Bd([hx - 40, hy + 62])), () => 34), 0.4);
    const torso = [[566, 652], [520, 674], [486, 736], [460, 824], [448, 900], [458, 948], [522, 962], [588, 942], [618, 885], [636, 805], [636, 742], [620, 700], [598, 674]];
    m.card(S2.cat(lean ? torso.map(Bd) : torso), 0.6);
    m.card(S2.ribbon(S2.cat([[552, 942], [640, 928], [712, 922]], false, 10), t => 72 - 14 * t), 0.5);
    m.card(S2.ribbon(S2.cat([[712, 930], [716, 1000], [712, 1110]], false, 10), t => 52 - 10 * t), 0.5);
    m.card(S2.ribbon(S2.cat([ap.S, ap.m1, ap.E], false, 12), t => 36 - 8 * t), 0.5);    // upper arm
    m.card(S2.ribbon(S2.cat([ap.E, ap.m2, ap.Wr], false, 12), t => 29 - 9 * t), 0.5);   // forearm
    if (mon) {
      const [px, py] = hand;
      if (!(pose.A && pose.A.mouse === false)) m.card(S2.ellipse(px + 7, py + 5, 13, 6.5, 0.02), 0.4);   // the mouse under it
      m.card(S2.ellipse(px, py, 19, 10.5, -0.12), 0.5);                                    // hand, palm down
      m.card(S2.ribbon(S2.cat([[px + 8, py - 4], [px + 20, py - 3], [px + 28, py + 2]], false, 8), t => 9 - 3 * t), 0.4);   // fingers
      m.card(S2.ribbon(S2.cat([[px + 2, py + 6], [px + 10, py + 9], [px + 15, py + 9]], false, 8), t => 6 - 2 * t), 0.3);    // thumb
    } else {
      const hc = ap.xf([818, 688]);
      m.card(S2.ellipse(hc[0], hc[1], 21, 13, -0.42 + ap.da), 0.5);                         // hand, pinch grip
      m.card(S2.ribbon(S2.cat([[806, 684], [822, 675], [836, 674]].map(ap.xf), false, 8), t => 9 - 3 * t), 0.4);
      m.card(S2.ribbon(S2.line(ap.xf([826, 684]), ap.xf([874, 655])), t => 3.4 - 1.6 * t), 0.2);   // the tool
    }
    m.card(S2.ellipse(484, 968, 74, 11), 0.5);
    m.card(S2.ribbon(S2.line([484, 972], [484, 1100]), () => 20), 0.4);
    m.card(S2.ribbon(S2.line([430, 1050], [540, 1050]), () => 7), 0.3);
  } });
  add({ name: 'fg', z: 1080, col: PAPER.ink, alb: 0.4, thin: 0.3, def: 1.0, ao: 0.35, rimk: 1.2, draw: (m, rnd) => {
    const leaves = [[1890, 1110, 1728, 900, 50], [1930, 1110, 1846, 838, 44], [1860, 1110, 1640, 1000, 40], [1960, 1110, 1930, 880, 46]];
    for (const [x0, y0, x1, y1, w] of leaves) {
      const cl = S2.bez([x0, y0], [x0 - (x0 - x1) * 0.1, y0 - (y0 - y1) * 0.75], [x1 + (x0 - x1) * 0.3, y1 - 26], [x1, y1], 48);
      m.card(S2.ribbon(cl, t => w * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.92)), 0.7) + 1.0), 0.7);
      m.cut(S2.ribbon(cl.slice(6, 40), t => 1.4 - t), 0.2);
    }
  } });
  // (the frame's query default ralb = 0.07 is baked into ribsBack above)
  if (exact) L.forEach(l => { delete l.key; delete l.seed; });   // the frame's own edge noise
  return S;
}

// Dust in the moonlight: motes drift in closed form; only those inside the window's light
// shaft are returned (their brightness is the moonlight reaching them).
export function labDust(t, n = 2600) {
  const out = [], WIN = [150, 62, 440, 640], kx = 0.3, ky = 0.52;
  const H0 = 1080, fr = x => x - Math.floor(x);
  for (let i = 0; i < n; i++) {
    const h = k => fr(Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453);
    const z = 40 + 900 * h(1) + 24 * Math.sin(0.11 * t + 6.3 * h(2));
    const x = 60 + 1300 * h(3) + 10 * Math.sin(0.19 * t + 6.3 * h(4)) + 3 * t * (h(5) - 0.4);
    let y = 1100 * h(6) - (2.5 + 3 * h(7)) * t + 9 * Math.sin(0.15 * t + 6.3 * h(8));
    y = ((y % H0) + H0) % H0;
    // trace back to the wall along the moonlight
    const qx = x - kx * z, qy = y - ky * z, soft = 1 + 0.012 * z;
    const inX = smooth(WIN[0] - soft, WIN[0] + soft, qx) * (1 - smooth(WIN[2] - soft, WIN[2] + soft, qx));
    const inY = smooth(WIN[1] - soft, WIN[1] + soft, qy) * (1 - smooth(WIN[3] - soft, WIN[3] + soft, qy));
    let a = inX * inY;
    if (a < 0.02) continue;
    const bar = (v, c, w) => 1 - smooth(c - w / 2 - soft, c - w / 2 + soft, v) * (1 - smooth(c + w / 2 - soft, c + w / 2 + soft, v));
    a *= bar(qx, 295, 6) * bar(qy, 255, 6) * bar(qy, 451, 6);
    const by = y - ky * (z - 22);
    if (by < 150) a *= 0.2;
    const tw = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin((0.9 + 1.6 * h(9)) * t + 6.3 * h(10)), 5);
    out.push({ x, y, z, size: 1.0 + 1.4 * h(11), I: 0.34 * a * tw * (0.4 + 0.6 * h(12)) });
  }
  return out;
}

// ================================================================ S09: the hands
// A hand as a 2D rig (from the frame): palm, four fingers of three phalanges, and a thumb.
// wrist (wx, wy); pa = palm axis angle; side = +1 puts index and thumb clockwise of the axis;
// fa = forearm angle; flex > 0 curls a finger toward the little-finger side.
export function handShapes(o) {
  const Lf = o.Lf, Lp = 0.94 * Lf, Wp = 0.84 * Lf, parts = [];
  const ax = [Math.cos(o.pa), Math.sin(o.pa)], px = [-ax[1] * o.side, ax[0] * o.side];
  const P = (u, v) => [o.wx + ax[0] * u + px[0] * v, o.wy + ax[1] * u + px[1] * v];
  const F = [[0.95, 0.35, 0.92, 0.2], [1.0, 0.11, 1.0, 0.207], [0.97, -0.14, 0.95, 0.193], [0.87, -0.38, 0.77, 0.17]];
  const tips = [], chains = [];
  F.forEach(([mu, mv, len, bw], i) => {
    const b = P(mu * Lp, mv * Wp);
    let a = o.pa + o.side * o.spread[i];
    let p = [b[0] - Math.cos(a) * 0.12 * Lf, b[1] - Math.sin(a) * 0.12 * Lf];
    const pts = [p.slice()], seg = [0.12 + 0.47, 0.29, 0.24];
    for (let k = 0; k < 3; k++) { a -= o.side * o.flex[i][k]; p = [p[0] + Math.cos(a) * seg[k] * len * Lf, p[1] + Math.sin(a) * seg[k] * len * Lf]; pts.push(p.slice()); }
    const tot = 1.12, t1 = 0.59 / tot, t2 = 0.88 / tot;
    parts.push(S2.ribbon(S2.cat(pts, false, 10), t => bw * Lf * (1 - 0.28 * t) * (1 + 0.075 * bump(t, t1, 0.05) + 0.05 * bump(t, t2, 0.04)), [false, true]));
    tips.push(p); chains.push(pts);
  });
  parts.push(S2.cat([[0.0, 0.34], [0.3, 0.5], [0.72, 0.52], [0.95, 0.44], [1.03, 0.12], [1.0, -0.16], [0.9, -0.44], [0.62, -0.53], [0.25, -0.5], [-0.02, -0.33]].map(([u, v]) => P(u * Lp, v * Wp))));
  { let p = P(0.16 * Lp, 0.3 * Wp), a = o.pa + o.side * o.thumb.spread;
    const pts = [p.slice()], seg = [0.46 * Lp, 0.36 * Lf, 0.3 * Lf];
    for (let k = 0; k < 3; k++) { a -= o.side * o.thumb.flex[k]; p = [p[0] + Math.cos(a) * seg[k], p[1] + Math.sin(a) * seg[k]]; pts.push(p.slice()); }
    parts.push(S2.ribbon(S2.cat(pts, false, 10), t => Lf * (0.29 - 0.1 * t) * (1 + 0.06 * bump(t, 0.64, 0.05)), [false, true]));
    tips.push(p); }
  const w0 = P(0.04 * Lp, 0), fd = [Math.cos(o.fa), Math.sin(o.fa)];
  const fore = S2.cat([w0, [o.wx + fd[0] * o.fore * 0.5, o.wy + fd[1] * o.fore * 0.5], [o.wx + fd[0] * o.fore, o.wy + fd[1] * o.fore]], false, 12);
  parts.push(S2.ribbon(fore, t => Wp * (0.68 + 0.22 * t), [true, false]));
  const c0 = [o.wx + fd[0] * o.cuff, o.wy + fd[1] * o.cuff];
  return { parts, tips, chains, sleeve: S2.line(c0, [o.wx + fd[0] * (o.fore + 80), o.wy + fd[1] * (o.fore + 80)], 16), sleeveW: Wp * 1.2 };
}
// the detail frame's pose (xc = 790, tilt = 0.1)
const FLEX0 = [[0.16, 0.3, 0.26], [0.18, 0.33, 0.28], [0.2, 0.35, 0.28], [0.24, 0.36, 0.28]];
export const HANDS_REST = {
  L: { wx: 746, wy: 862, pa: -2.26, side: -1, fa: 2.0, Lf: 182, fore: 440, cuff: 250, spread: [0.1, 0.03, -0.03, -0.1], flex: FLEX0, thumb: { spread: 0.2, flex: [0.08, 0.2, 0.2] } },
  R: { wx: 852, wy: 850, pa: -0.7, side: 1, fa: 1.34, Lf: 182, fore: 440, cuff: 250, spread: [0.1, 0.03, -0.03, -0.1], flex: FLEX0, thumb: { spread: 0.2, flex: [0.08, 0.2, 0.2] } },
};
// the harness in the close-up
export const HC9 = { cx: 1540, poleY: 1000, Rh: 226, Rv: 222 };
// A rib is a finger: its base follows the cage's ellipse; curling bends it at its two knuckles
// (t = 0.47, 0.76) toward the centre, keeping its length (the segments rotate, never stretch).
function ribPts9(side, k, th1, curl, a1, a2) {
  const cyc = HC9.poleY - HC9.Rv, pts = [];
  for (let i = 0; i <= 64; i++) {
    const th = 0.3 + (th1 - 0.3) * i / 64, hook = smooth(th1 - 0.6, th1, th);
    pts.push([HC9.cx + side * (Math.sin(th) * HC9.Rh * k - hook * hook * 36 * k), cyc + Math.cos(th) * HC9.Rv + hook * hook * 15]);
  }
  if (curl <= 0) return pts;
  const out = [pts[0].slice()];
  for (let i = 1; i <= 64; i++) {
    const t = (i - 0.5) / 64;
    const ang = -side * curl * (a1 * smooth(0.43, 0.51, t) + a2 * smooth(0.72, 0.8, t));
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], c = Math.cos(ang), s = Math.sin(ang);
    const q = out[i - 1];
    out.push([q[0] + dx * c - dy * s, q[1] + dx * s + dy * c]);
  }
  return out;
}

export function sceneHands(o = {}) {
  const exact = !!o.exact;
  const S = { name: 'hands' };
  const CELL = 13, gw = 18 * CELL, gh = 10 * CELL, xc = 790, feetY = 632;
  const cxw = xc + 30;
  const WO = S.world = exact ? { x0: 0, y0: 0, w: 1920, h: 1080 } : { x0: -60, y0: -60, w: 2440, h: 1400 };
  const X1 = WO.x0 + WO.w, Y1 = WO.y0 + WO.h;
  S.clawd = { x0: cxw - gw / 2, y0: feetY - gh, cell: CELL, z: 520 };
  S.light = { x: cxw, y: feetY - gh / 2, z: 520, r: 10, I: 2.3e5, a: 230, f: 600 };
  S.moon = { dir: [0.34, 0.5, 1], I: 0.5, disc: [0, 0, 0] };
  S.sky = { top: '#1B2138', hor: '#34406A', horY: 900 };
  S.eyes = 'dark';
  S.hazeW = 1.15e-4;
  S.cam = { Zc: 1500, zref: 520 };
  const L = S.layers = [];
  const add = o => L.push(o);
  add({ name: 'cityNear', z: -300, col: PAPER.dusk, ao: 0.3, em: lin('#9FB3D9').map(v => v * 0.6), def: 0.6, draw: (m, rnd) => {
    let x = -40; while (x < 330) { const w = 50 + rnd() * 60, top = 300 + rnd() * 110; m.card(S2.rect(x, top, w, 600), 0.5);
      for (let wy = top + 12; wy < 470; wy += 18) for (let wx = x + 8; wx < x + w - 8; wx += 14) if (rnd() < 0.09) { const h = S2.rect(wx, wy, 4.5, 6.5); m.cut(h, 0); m.emit(h, 0.4 + rnd() * 0.6); }
      x += w + 3; }
  } });
  add({ name: 'wall', z: 0, col: PAPER.slate, alb: 0.78, ao: 0, def: 0.5, draw: (m, rnd) => {
    m.card(exact ? S2.rect(-40, -40, 1920 + 80, 1080 + 80) : S2.rect(WO.x0 - 40, WO.y0 - 40, WO.w + 80, WO.h + 80), 0);
    m.cut(S2.rect(-60, -60, 360, 520), 0.6);
    m.card(S2.rect(118, -60, 12, 520), 0.5); m.card(S2.rect(-60, 214, 360, 12), 0.5);
  } });
  add({ name: 'wallFront', z: 26, col: PAPER.slate, alb: 0.74, ao: 0.5, def: 0.5, draw: (m, rnd) => {
    m.card(S2.rect(-80, 454, 420, 26), 0.6);
  } });
  add({ name: 'benchTop', z: 240, col: PAPER.slate, kind: 1, alb: 0.3, ao: 0.35, def: 0.35, draw: (m, rnd) => {
    m.card(exact ? [[1060, 968], [1920 + 40, 964], [1920 + 40, 1200], [1060, 1200]] : [[1060, 968], [X1 + 40, 963], [X1 + 40, Y1 + 40], [1060, Y1 + 40]], 0.5);
  } });
  const band = m => {
    m.card(S2.rrect(HC9.cx - 228, 982, 456, 36, 14), 0.6);
    for (let k = -7; k <= 7; k++) if (Math.abs(k) > 1) m.cut(S2.ellipse(HC9.cx + k * 29, 993, 3.4, 3.4, 0, 16), 0);
  };
  // the harness ribs (behind Clawd once he is in); they curl closed over him
  const ks = [1.0, 0.885, 0.77, 0.655], th = [2.16, 2.3, 2.25, 2.06];
  const A1 = [0.62, 0.66, 0.7, 0.74], A2 = [0.55, 0.6, 0.62, 0.66];
  add({ name: 'harness', z: 300, col: PAPER.deep, alb: 0.14, ao: 0.4, cast: 1, def: 0.35, rimk: 2.2,
    key: pose => 'H' + r2(pose.curl || 0), seed: 3, draw: (m, rnd, pose) => {
    const curl = pose.curl || 0;
    for (const s of [-1, 1]) ks.forEach((k, i) => {
      const pts = ribPts9(s, k, th[i], curl, A1[i], A2[i]);
      m.card(S2.ribbon(pts, t => lerp(26, 18, t) + 3.6 * bump(t, 0.47, 0.03) + 3 * bump(t, 0.76, 0.026)), 0.6);
    });
    if (exact) band(m);
  } });
  // the harness band, in front of Clawd once he sits in the cage
  if (!exact) add({ name: 'harnessBand', z: 460, col: PAPER.deep, alb: 0.14, ao: 0.4, cast: 1, def: 0.35, rimk: 2.2, draw: (m, rnd) => {
    band(m);
  } });
  const hand = (key, z) => add({ name: 'hand' + key, z, col: PAPER.ink, alb: 0.45, thin: 2.8, ao: 0.5, rimk: 2.2, seed: key === 'L' ? 5 : 6,
    key: pose => key + fmt((pose.hands || HANDS_REST)[key]), draw: (m, rnd, pose) => {
    const h = handShapes((pose.hands || HANDS_REST)[key]);
    for (const pt of h.parts) m.card(pt, 0.55);
  } });
  hand('L', 580); hand('R', 600);
  add({ name: 'sleeves', z: 640, col: PAPER.deep, alb: 0.4, thin: 0.2, ao: 0.5, def: 0.7, seed: 7,
    key: pose => 'S' + fmt(pose.hands || HANDS_REST), draw: (m, rnd, pose) => {
    const hs = pose.hands || HANDS_REST;
    for (const key of ['L', 'R']) { const h = handShapes(hs[key]); m.card(S2.ribbon(h.sleeve, t => h.sleeveW * (1 + 0.1 * t), [false, false]), 0.7); }
  } });
  if (exact) L.forEach(l => { delete l.key; delete l.seed; });
  return S;
}
