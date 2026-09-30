// S35, bar 61 (frames 4331-4402; revision 13): powers of ten, from the die to the data centre.
// On the downbeat the chip Clawd drew flat on the ground in S34 lands: its floorplan's lines flash
// onto the paper die, seen face-on, and burn off gently (bar 61 is quiet), the blocks first and the
// die's outline last, its light going into the die, whose blocks glow. Then one continuous pull-out
// in log zoom (sets/paper-kit/datacenter.js):
//   - the card sits in an open frame at the far end of S16's hall, on the aisle's vanishing point;
//     we pull straight back down the aisle, card, rack, the end row, and S16's bays enter one by
//     one as the camera passes them (a tunnel book), each coming online as it arrives, warm light
//     running back from the chip toward us;
//   - out through the roof: the hall's roof, a paper layer, comes over the view; above it, its
//     cooling fans lit from inside, and we keep rising;
//   - the building, then the campus: long, low halls laid out as the die's floorplan, lighting in a
//     wave outward from the hall we left, and a short settle with the campus exactly where the die
//     was on the first frame.
// Two paper sets render into private WebGL canvases; the landing's lines are drawn over them in 2D
// (sets/paper-kit/burn.js, S21's device).
import { createPaper, smooth, clamp, lerp, toScreen } from '../sets/paper-kit/kit.js';
import { aisleScene, aisleState, aisleCam, campusScene, campusState, setWave, DIE_LINES_A, A_S0, Z_END, HERO_C } from '../sets/paper-kit/datacenter.js';
import { HALL } from '../sets/paper-kit/rack.js';
import { createBurn } from '../sets/paper-kit/burn.js';
import { hash } from '../lib/util.js';

// ---------------------------------------------------------------- the move
// LAM = ln(how far we have zoomed out since the first frame).
// R13-R15 built it from three overlapping ramps (the aisle into the lit hall, then through the roof
// and out, then a long settle), which peaked near beats 2 and 3 and all but stopped in the lit hall.
// R23 (Claire: the pull-out's start-stop felt harsh; the beats are soft here): one continuous move,
// steady in log scale, so each power of ten takes the same time (about 12.7 frames). Its rate eases
// in from the first frame (0-12), holds, and from local 40 eases into the campus hold (a gaussian
// fall-off, so there is no kink), resting by about 65. The full campus is on screen from about 49.
// LAM_END is R13's: the campus comes to rest exactly where the die was on the first frame.
export const LAST = 89;
export const LAM_END = 4.15 + 3.5 + 0.47;
const MOVE = { in0: 0, in1: 12, out0: 40, tau: 12 };
const moveRate = (f) => smooth(MOVE.in0, MOVE.in1, f) * (f <= MOVE.out0 ? 1 : Math.exp(-(((f - MOVE.out0) / MOVE.tau) ** 2)));
const DT = 0.01;
const LAM_TAB = (() => {
  const n = Math.round((LAST + 1) / DT) + 1, t = new Float64Array(n);
  for (let i = 1; i < n; i++) t[i] = t[i - 1] + moveRate((i - 0.5) * DT) * DT;
  const k = LAM_END / t[Math.round(LAST / DT)];
  for (let i = 0; i < n; i++) t[i] *= k;
  return t;
})();
export const MOVE_RATE = LAM_TAB[Math.round(30 / DT)] - LAM_TAB[Math.round(29 / DT)];   // the steady rate, per frame
export const LAM = (fl) => {
  const x = clamp(fl, 0, LAST + 1) / DT, i = Math.min(Math.floor(x), LAM_TAB.length - 2);
  return LAM_TAB[i] + (LAM_TAB[i + 1] - LAM_TAB[i]) * (x - i);
};
const smoother = (u) => { u = clamp(u, 0, 1); return u * u * u * (u * (6 * u - 15) + 10); };
const smootherD = (u) => (u <= 0 || u >= 1 ? 0 : 30 * u * u * (1 - u) * (1 - u));
const F_KEEP = 47;                                                 // (the wave's R14/R15 hand-over)
export const sAisle = (fl) => A_S0 * Math.exp(-LAM(fl));          // the camera's scale on the far end
export const sCampus = (fl) => Math.exp(LAM_END - LAM(fl));       // ... on the campus's roofs (1 at rest)
// the roof comes over while LAM crosses PASS (R23: a little wider, as the move no longer slows here)
export const PASS = [4.05, 4.95];
export const passMix = (fl) => smooth(PASS[0], PASS[1], LAM(fl));
const panY = (fl) => 20 * (1 - smooth(0.2, 3.8, LAM(fl)));        // the die at the frame's centre first
const panK = (fl) => 1 - smooth(PASS[0], LAM_END - 0.4, LAM(fl));

// the frame each bay (0 near .. 6 far) is entered by the camera
const ZS = [470, 280, 120, -10, -130, -240, -340];
const firstFrame = (pred) => { for (let f = 0; f <= LAST + 1; f += 0.05) if (pred(f)) return f; return LAST + 1; };
export const BAY_IN = ZS.map((z) => firstFrame((f) => 2400 - (2400 - Z_END) * (1 - 1 / sAisle(f)) > z));
// the wave front over the campus (world px from the hero hall): out from our hall as we rise, then
// across the whole campus in the hold. R15: R14's front up to local 47, then it slows on its way to
// the far edge (its log-radius eases toward 390 px at the speed it had), so the outer halls and
// the generators round the fence light one by one through the new beat (about 65-78).
const F_PASS = firstFrame((f) => LAM(f) >= PASS[0]), F_WAVE1 = 63, F_WEND = 88, R_EDGE = 390;
const waveR14 = (f) => 14 * Math.pow(440 / 14, smoother((f - F_PASS) / (F_WAVE1 - F_PASS)));
const R47 = waveR14(F_KEEP), R47d = Math.log(440 / 14) * smootherD((F_KEEP - F_PASS) / (F_WAVE1 - F_PASS)) / (F_WAVE1 - F_PASS);
const W_A = Math.log(R_EDGE / R47), W_TAU = W_A / R47d;
const waveR = (f) => (f <= F_KEEP ? waveR14(f) : R47 * Math.exp(W_A * (1 - Math.exp(-(f - F_KEEP) / W_TAU))));
setWave((d) => { const f = firstFrame((x) => x >= F_PASS && waveR(x) >= d); return clamp((f - F_PASS) / (F_WEND - F_PASS), 0, 1); });
const waveT = (fl) => clamp((fl - F_PASS) / (F_WEND - F_PASS), 0, 1);
const WAVE_FADE = 0.02 * (F_WAVE1 - F_PASS) / (F_WEND - F_PASS);    // R14's fade, in frames

// ---------------------------------------------------------------- the landing: only the chip
const ORDER = { strip: 1, array: 1.5, narrow: 1.5, cache: 2.2, logic: 3, core: 4.5, die: 6 };
const LINES = DIE_LINES_A().map((l, i) => ({ pts: l.pts, burn: (ORDER[l.part] ?? 3) + 1.5 * hash(i, 7), I: l.part === 'die' ? 1.2 : 1, w: l.part === 'strip' ? 0.7 : 1 }));
export const dieLinesAt = (fl) => { const cam = aisleCam(sAisle(fl), panY(fl)); return LINES.map((l) => Object.assign({}, l, { pts: l.pts.map((p) => toScreen(cam, p, Z_END)) })); };

export function s35Aisle(T, fr) {
  const fl = fr.fl;
  const sb = T.since('beats', fr.f), pulse = sb === Infinity ? 0 : smooth(-0.5, 1, sb) * (1 - smooth(8, 12, sb));
  const st = aisleState({
    sc: sAisle(fl), panY: panY(fl),
    card: smooth(1, 10, fl) * (1 + 0.1 * T.pulse('beats', fr.f, 6)),
    lamp: smooth(3, 12, fl), endOn: smooth(6, 22, fl) * 0.99,
    wave: { cc: 0.6 - 0.6 * clamp(sb / 12, 0, 1), cg: 0.8 * pulse * smooth(20, 26, fl) },
  });
  const near = 0.5 * (st.on[0] + st.on[1]);
  const [vx, vy] = HALL.vp;
  st.fills = [
    { x: vx, y: vy + 12, z: Z_END + 40, I: 380 * smooth(14, 28, fl), a: 30, f: 160, h: 0.4 },
    { x: vx, y: vy + 150, z: 250, I: 1.0e4 * near, a: 300, f: 800, h: 0.3 },
  ];
  return st;
}
export function s35Campus(T, fr) {
  const fl = fr.fl;
  // the settle: the campus is all on; its light swells and spills into the land (the cut to S36's
  // low sun carries warm centre to warm centre)
  // R15: once the wave reaches the fence, power runs out along the lines (the pulses travel outward)
  const sw = smooth(66, LAST, fl);
  return campusState({ s: sCampus(fl), panK: panK(fl), t: waveT(fl), fade: WAVE_FADE, lines: { cc: -fl / 24, cg: 0.9 * smooth(66, 76, fl) },
    glow: 1 + 0.35 * sw, post: { expo: 1 + 0.3 * sw } });
}

let EA, EB, B, glA, glB, g2, SLAB;
// the roof slab we pass through: dark card, its torn edges, its underside catching the hall's warm
// light (a 2D strip, drawn moving, so it is soft)
function makeSlab(W, Hs) {
  const c = document.createElement('canvas'); c.width = W; c.height = Hs;
  const x = c.getContext('2d'), R = (() => { let a = 7; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
  const edge = (y0, amp) => { const pts = []; for (let px = 0; px <= W; px += 12) pts.push([px, y0 + amp * (Math.sin(px / 97) * 0.6 + (R() - 0.5))]); return pts; };
  const top = edge(Hs * 0.1, Hs * 0.03), bot = edge(Hs * 0.8, Hs * 0.025);
  x.beginPath(); top.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); for (let i = bot.length - 1; i >= 0; i--) x.lineTo(bot[i][0], bot[i][1]); x.closePath();
  const g = x.createLinearGradient(0, 0, 0, Hs); g.addColorStop(0, '#0B0D16'); g.addColorStop(0.55, '#121626'); g.addColorStop(0.8, '#2A2230');
  x.fillStyle = g; x.fill();
  x.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${R() < 0.5 ? '255,255,255' : '0,0,0'},${(0.02 + 0.04 * R()).toFixed(3)})`; x.fillRect(R() * W, R() * Hs, 6 + 30 * R(), 1); }
  x.globalCompositeOperation = 'source-over';
  x.strokeStyle = 'rgba(217,119,87,0.85)'; x.lineWidth = Math.max(1.5, Hs * 0.02);
  x.beginPath(); bot.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
  x.strokeStyle = 'rgba(217,119,87,0.25)'; x.lineWidth = Hs * 0.08; x.stroke();
  return c;
}
export default {
  async setup(ctx) {
    glA = document.createElement('canvas'); glA.width = ctx.W; glA.height = ctx.H;
    glB = document.createElement('canvas'); glB.width = ctx.W; glB.height = ctx.H;
    g2 = ctx.canvas.getContext('2d');
    EA = createPaper(glA, aisleScene(), { k: ctx.scale, log: ctx.log });
    EB = createPaper(glB, campusScene(), { k: ctx.scale, log: ctx.log });
    B = createBurn(ctx);
    SLAB = makeSlab(ctx.W, Math.round(0.16 * ctx.H));
    ctx.log(`S35: ${LINES.length} die lines; bays in at ${BAY_IN.map((f) => f.toFixed(1)).join(', ')}; pass ${F_PASS.toFixed(1)}; hero ${HERO_C.map((v) => v.toFixed(1))}; steady ${MOVE_RATE.toFixed(4)}/frame`);
  },
  render(ctx, fr) {
    const fl = fr.fl, mix = passMix(fl), W = ctx.W, H = ctx.H;
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.filter = 'none'; g2.globalAlpha = 1;
    if (mix < 1) {
      EA.frame(s35Aisle(ctx.T, fr));
      if (mix <= 0) g2.drawImage(glA, 0, 0, W, H);
      else {
        // rising through the roof: the hall drops away (slides down, smeared along its motion)
        const dy = 0.22 * H * mix * mix, sm = 0.06 * H * mix, n = 6;
        g2.fillStyle = '#07080E'; g2.fillRect(0, 0, W, H);
        g2.filter = `blur(${(2.5 * mix * W / 1920).toFixed(2)}px)`;
        for (let q = 0; q < n; q++) { g2.globalAlpha = 1 / (q + 1); g2.drawImage(glA, 0, dy - sm * q / (n - 1), W, H); }
        g2.globalAlpha = 1; g2.filter = 'none';
      }
    }
    if (mix > 0) {
      EB.frame(s35Campus(ctx.T, fr));
      if (mix >= 1) {
        g2.drawImage(glB, 0, 0, W, H);
        const sw = smooth(64, LAST, fl);
        if (sw > 0) {
          // the campus's light spilling into the night round it
          const r = 0.62 * W, gr = g2.createRadialGradient(W / 2, H / 2, 0.08 * W, W / 2, H / 2, r);
          gr.addColorStop(0, `rgba(217,119,87,${(0.3 * sw).toFixed(3)})`); gr.addColorStop(0.45, `rgba(170,90,80,${(0.14 * sw).toFixed(3)})`); gr.addColorStop(1, 'rgba(120,80,110,0)');
          g2.globalCompositeOperation = 'screen'; g2.fillStyle = gr; g2.fillRect(0, 0, W, H); g2.globalCompositeOperation = 'source-over';
        }
      }
      else {
        // the roof slab sweeps down across the frame: above it, the roof seen from above
        const band = SLAB.height, wy = lerp(-band * 0.5, H + band * 0.6, smooth(0, 1, mix));
        g2.save(); g2.beginPath(); g2.rect(0, 0, W, Math.max(0, wy - band * 0.4)); g2.clip(); g2.drawImage(glB, 0, 0, W, H); g2.restore();
        g2.filter = `blur(${(5 * W / 1920).toFixed(2)}px)`;
        g2.drawImage(SLAB, 0, wy - band * 0.5, W, band);
        g2.filter = 'none';
      }
    }
    if (fl < 16) B.draw(g2, dieLinesAt(fl), fl, { flash: 0.6 });   // gentle: bar 61 is quiet
  },
};
