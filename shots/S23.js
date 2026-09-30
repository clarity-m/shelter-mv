// S23, bars 66-69 (frames 4691-4978; revision 9): a hard cut from S21's reactor to the dark city, the
// reactor glowing on the left bank and the small hall on the right; the reactor's light runs along the
// bank and the city comes online building by building on the snare roll (bars 66-67); in bar 68
// satellites light across the sky, doubling each beat, and on the bar-69 kick the rest close into a
// ring from horizon to horizon (the first ring of a swarm) as the camera tilts up. One district comes
// online window by window as a new grid reaches it: warm lanterns in specific places (the
// order is shuffled by building, never a spreading front), and a soft warm glow rises behind
// the district as it fills. The camera drifts sideways so the paper layers part.
// The sky glints too (revision 1): star-shaped pinholes twinkle, one flares on each beat, and two
// paper satellites cross slowly; each catches one warm glint (bar 62's downbeat, the last beat).
// Revision 22 (Claire: the satellites lit sides to centre but flashed left to right): the ring travels
// one way. On the bar-69 kick the rest light left to right along the arch, the ring's line drawing
// with them, at the pulse's speed (one crossing per beat, entering the frame on the beat), and the
// pulse carries on left to right. The bar-68 doublings stay scattered.
import { createPaper, smooth, lerp, easeInOut } from '../sets/paper-kit/kit.js';
import { cityScene, cityState, SHOT_N, ONLINE, setOnline, setSats, SATS, RING, ringAt, satAt, arcT, lapAt } from '../sets/paper-kit/city.js';
import { clamp, toScreen } from '../sets/paper-kit/kit.js';

let E;
// sky coordinates (about screen px at the rest view); clear of the moon and the rooftops
const TWINKLE = [[560, 100, 0.0, 1.1], [820, 232, 1.3, 0.8], [1010, 112, 2.1, 1.0], [1480, 176, 0.7, 0.9],
                 [1692, 82, 2.9, 1.2], [268, 330, 1.9, 0.7], [1226, 176, 3.7, 0.9]];
const BEAT = [[1150, 252], [700, 322], [1590, 292], [432, 84], [1332, 70], [902, 152]];
const glint = (dt, decay) => dt < 0 ? 0 : smooth(0, 2, dt) * Math.exp(-dt / decay);

export function skyGlints(T, fr) {
  const t = fr.t, f0 = fr.f - fr.fl;
  const pins = [];
  TWINKLE.forEach(([x, y, ph, w], k) => {
    const s1 = 0.5 + 0.5 * Math.sin(t * (2.1 + 0.37 * k) + ph), s2 = 0.5 + 0.5 * Math.sin(t * (3.3 - 0.29 * k) + 2 * ph);
    const I = 0.62 * w * (0.5 + 0.5 * s1 * s2 + 0.15 * s1);
    pins.push([x, y, 1.25, I, 7, 0.35 * s1 * s2, 0.75, k % 2 ? Math.PI / 4 : 0]);
  });
  // one star flares on each beat, taking turns
  const beats = T.events('beats').filter(b => b >= f0 - 40 && b <= fr.f);
  const lastIdx = new Map();
  beats.forEach(b => { const k = T.events('beats').indexOf(b) % BEAT.length; lastIdx.set(k, b); });
  BEAT.forEach(([x, y], k) => {
    const b = lastIdx.get(k), p = b === undefined ? 0 : glint(fr.f - b, 8);
    pins.push([x, y, 1.35, 0.42 + 2.1 * p, 11, p, 0.95, k % 2 ? 0 : Math.PI / 4]);
  });
  // two paper satellites crossing slowly; each catches one warm glint
  const u = fr.fl / (fr.n - 1);
  const d62 = T.frameOf(T.barTime(62)) - f0, last = T.events('beats').filter(b => b < f0 + fr.n).pop() - f0;
  const sats = [
    { x: lerp(640, 1060, u), y: lerp(62, 30, u), rot: -0.08, s: 1.0, cool: 0.42, glint: 6.5 * glint(fr.fl - d62, 7) },
    { x: lerp(1770, 1500, u), y: lerp(252, 214, u), rot: 0.14, s: 0.8, cool: 0.34, glint: 5.5 * glint(fr.fl - last, 6) },
  ];
  return { pins, sats };
}

// the camera drifts sideways; (revision 9) it tilts up through bars 68-69 so the sky, and the ring,
// take the frame
export function camAt(fl, n) {
  const u = fl / (n - 1), tx = lerp(70, -70, easeInOut(u)), ty = -260 * easeInOut(clamp((fl - 140) / 90, 0, 1));
  return { t: [tx, ty], pan: [0.55 * tx, 0.25 * ty], tz: 60 * u };
}
const SAT_CAM = (cam) => Object.assign({ Zc: 2400, zref: -180, c: [960, 540], t: [0, 0], tz: 0, pan: [0, 0] }, cam);
// (R22) the arch's length fraction at the screen's left edge, with the camera at local frame fl
function leftEdgeU(fl, n) {
  const cam = SAT_CAM(camAt(fl, n)), x = (u) => toScreen(cam, ringAt(arcT(u)), -900)[0];
  let lo = 0, hi = 0.5;
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (x(m) < 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
export function s23State(T, fr) {
  const lit = fr.fl / SHOT_N;                       // the district clock: codes are local frames / 288
  const v = T.envSmooth('vocals', fr.f, 6);
  // the glow behind the district rises as its buildings come online, and holds
  const fill = smooth(ONLINE.district[0] - 4, Math.max(...ONLINE.district) + 10, fr.fl);
  // the reactor glows from the first frame, pulses on the beats, and flares as its light leaves it
  const reactor = 2.3 * (1 + 0.14 * T.pulse('beats', fr.f, 5) + 0.5 * Math.exp(-(((fr.fl - 5) / 5) ** 2)));
  const st = cityState({ lit, fill, breath: 0.92 + 0.16 * v, pre: 0, near: 0, reactor });
  st.cam = camAt(fr.fl, fr.n);
  const g = skyGlints(T, fr);
  st.sky = { starD: 0.14, moon: [330, 150, 13], pins: g.pins, sats: g.sats };
  return st;
}

// revision 9: each satellite flares as it lights (a warm four-point glint that settles to a point),
// drawn in 2D over the paper frame at its screen position through the camera.
// R19 (Claire: highlight the satellites): bigger, clearer flares with a fine diagonal cross; each
// satellite twinkles as it holds; once the ring closes, a soft glow lies along the arch.
// R20 (Claire): the satellites keep apart (48, evenly spaced), and the pulse runs along the ring left to
// right, one beat per crossing, so it reads as an orbit.
function drawGlints(g, s, st, fl, beats) {
  const cam = SAT_CAM(st.cam);
  const P = (t) => toScreen(cam, ringAt(t), -900);
  let n = 0;
  g.lineCap = 'round';
  // the arch's glow, where its line has lit
  const segs = [];
  for (let k = 0; k <= 120; k++) { const t = k / 120, on = smooth(SATS.line(t), SATS.line(t) + 5, fl); segs.push([P(t), on]); }
  for (const [w, al] of [[16, 0.10], [6, 0.22]]) {
    g.lineWidth = w * s;
    for (let k = 0; k < 120; k++) {
      const on = Math.min(segs[k][1], segs[k + 1][1]);
      if (on < 0.01) continue;
      g.strokeStyle = `rgba(255,178,128,${(al * on).toFixed(3)})`;
      g.beginPath(); g.moveTo(segs[k][0][0] * s, segs[k][0][1] * s); g.lineTo(segs[k + 1][0][0] * s, segs[k + 1][0][1] * s); g.stroke();
    }
  }
  // the pulse: left to right along the closed ring, one crossing per beat after the kick's own lap
  // (R22: on the same laps as the kick's sweep, entering the frame on each beat)
  const ring = beats.filter((b) => b > SATS.kick + 1);
  const beatGlint = (u) => { let v = 0; for (const b of ring) { const at = lapAt(b, u), d = fl - at; if (d > -3 && d < 12) v = Math.max(v, Math.exp(-(d * d) / 4.5)); } return v; };
  for (let i = 0; i < RING.n; i++) {
    const a = fl - SATS.at[i];
    if (a < 0) continue;
    const t = i / (RING.n - 1), [x, y] = toScreen(cam, satAt(i), -900);
    const tw = 0.78 + 0.22 * Math.sin(fl * (0.31 + 0.047 * (i % 7)) + i * 1.7);
    const flare = Math.exp(-a / 7) * Math.min(a / 1.5, 1) + 0.8 * beatGlint(t), steady = 0.6 * Math.min(a / 3, 1) * tw;
    const I = flare + steady;
    if (I < 0.02) continue;
    const r = (7 + 14 * flare) * s;
    const grd = g.createRadialGradient(x * s, y * s, 0, x * s, y * s, r);
    grd.addColorStop(0, `rgba(255,232,206,${Math.min(1, 0.95 * I).toFixed(3)})`); grd.addColorStop(0.4, `rgba(255,190,140,${Math.min(1, 0.4 * I).toFixed(3)})`); grd.addColorStop(1, 'rgba(255,170,110,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x * s, y * s, r, 0, 2 * Math.PI); g.fill();
    if (flare > 0.05) {
      const L = (12 + 38 * Math.min(flare, 1.2)) * s, D = 0.45 * L;
      g.strokeStyle = `rgba(255,222,190,${Math.min(1, 0.95 * flare).toFixed(3)})`; g.lineWidth = 1.8 * s;
      g.beginPath(); g.moveTo(x * s - L, y * s); g.lineTo(x * s + L, y * s); g.moveTo(x * s, y * s - L); g.lineTo(x * s, y * s + L); g.stroke();
      g.strokeStyle = `rgba(255,222,190,${Math.min(1, 0.5 * flare).toFixed(3)})`; g.lineWidth = 1.1 * s;
      g.beginPath(); g.moveTo(x * s - D, y * s - D); g.lineTo(x * s + D, y * s + D); g.moveTo(x * s - D, y * s + D); g.lineTo(x * s + D, y * s - D); g.stroke();
    }
    n++;
  }
  return n;
}

let glc, g2;
export default {
  async setup(ctx) {
    // revision 8: the city comes online building by building on the snare roll (65-72)
    const f0 = ctx.shot.f0, f1 = ctx.shot.f1;
    const on = setOnline(ctx.T.events('snares').filter((f) => f >= f0 && f < f1 - 6).map((f) => f - f0), 144);
    // bar 68 doubling, then (R22) the bar-69 kick's sweep (4907) from the screen's left edge
    const u0 = leftEdgeU(216, f1 - f0);
    setSats(144, 216, u0);
    ctx.log(`S23 online: district ${on.district.join(', ')}; skyline ${on.mid.join(', ')}; the sweep enters at u ${u0.toFixed(3)}`);
    glc = document.createElement('canvas'); glc.width = ctx.W; glc.height = ctx.H;
    g2 = ctx.canvas.getContext('2d');
    E = createPaper(glc, cityScene(), { k: ctx.scale, log: ctx.log });
  },
  render(ctx, fr) {
    const st = s23State(ctx.T, fr);
    E.frame(st);
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.filter = 'none'; g2.globalAlpha = 1;
    g2.drawImage(glc, 0, 0, ctx.W, ctx.H);
    if (fr.fl >= 140) {
      const f0 = fr.f - fr.fl, beats = ctx.T.events('beats').filter((b) => b >= f0 && b <= fr.f).map((b) => b - f0);
      g2.save(); g2.globalCompositeOperation = 'lighter'; drawGlints(g2, ctx.W / 1920, st, fr.fl, beats); g2.restore();
    }
  },
};
