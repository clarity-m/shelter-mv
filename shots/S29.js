// S29, drop 2, bars 73-76 (frames 5183-5482, shift0 -12; revision 12, the physics): the space elevator,
// the release, the fleet.
//  72.4    (local 0-11, the fill) every line S27's crowd drew (sets/paper-kit/elevatorlines.js) lands on
//          the dark paper elevator at sea and burns off before the drop; the climber lights.
//  73      the drop (local 12): the climber launches, a hard acceleration with the camera zooming in on
//          it. Near things show its speed: the tether's markings and the climber's edges blur along the
//          tether (sets/paper-kit/smear.js). The stars are too far away to streak; the tether turns with
//          the Earth and the climb takes days, so the sky turns about the Earth's axis in time-lapse trails
//          (sets/paper-kit/sky2d.js). We face due north, so the celestial pole is on the horizon straight
//          ahead, behind the tether: the trails are concentric circles centred on the elevator. The pole
//          rises from behind the tower to sit behind the climber as the camera rides up with it, and the
//          sky wheels round it, the trails lengthening as it climbs; the sky goes to black as it leaves
//          the air.
//  74      the climb in space, braking as the zoom eases back. On 74.4 (local 138) the payload is
//          released, and we are in its frame, which is inertial: the star trails stop dead as points,
//          and the tether and climber, still turning, fall away below, swing aside and shrink. The pod
//          just drifts: a sling release, no push.
//  75      (local 156) the pod bursts, and a flock of light sails spreads into a curved, staggered sheet
//          (sets/paper-kit/fleet3d.js), unfurling; the nearest member hangs low left. Only sails in view.
//  76      (local 228) a forest of beams rises from below, one to each sail at normal incidence: every
//          sail faces the source, so all are parallel. They light orange, and the push carries the
//          flock away along the beams.
// Revision 19 (Claire; drop 2):
//   - the launch on 73.1 (local 12) is an ignition: a bloom from the climber that floods the frame;
//   - the star trails start on that downbeat (they used to fade in over two beats);
//   - the lasers are brighter (a white-hot core in a warm halo) and the sails larger;
//   - once the beams have lit the sails the push accelerates all the way to the cut (it used to ease
//     out), and the camera rides along at about a third of the flock's speed.
// Revision 20 (Claire):
//   - the pulses inside the ribbon pass behind the climber and its payload;
//   - the beams reach the sails in three waves, mirroring S23's satellites: a few on 76.1, more on
//     the half-beat, then all the rest at once on 76.2. Each sail is pushed from the moment it lights
//     (at most 6 frames ahead of the rest).
import { createPaper, smooth, clamp, lerp, easeInOut, easeOut, toScreen, panFor } from '../sets/paper-kit/kit.js';
import { groundScene, spaceScene, layerXF } from '../sets/paper-kit/elevator.js';
import { EL, STROKES, heat } from '../sets/paper-kit/elevatorlines.js';
import { createBurn } from '../sets/paper-kit/burn.js';
import { createSmear } from '../sets/paper-kit/smear.js';
import { project, camBasis, CAM, slotAt, sailMesh, drawSail, beamFrom, N_SAILS, SHEET, TRAVEL, FLEET_COLOURS as FC } from '../sets/paper-kit/fleet3d.js';
import { makeSky, skyCam, turn, projectDir, unprojectDir, drawSky3 } from '../sets/paper-kit/sky2d.js';
import { hash } from '../lib/util.js';

export const DROP = 12, X0 = 26, X1 = 34, STOP = 134, FLING = 138, BURST = 156, BEAMS = 228, AWAY = 246, LAST = 299;
const SAIL_K = 1.4, FOLLOW = 0.3, PUSH_D = 12;        // (R19) sail size, the camera's share of the push, the push
// ---------------------------------------------------------------- the launch and the climb (as in revision 11)
export const zoomAt = (fl) => 1 + 1.25 * smooth(DROP, X1, fl) - 1.25 * smooth(114, STOP, fl);
const tau = (fl) => Math.max(0, fl - DROP);
const climbS = (fl) => { const t = tau(fl); return 1.4 * t * t + 0.02 * t * t * t; };
const climbY = (fl) => EL.climber.y - climbS(fl);
const SPEED = [], DIST = [];
for (let f = 0; f <= LAST + 1; f++) {
  const t = tau(f), vg = (2.8 * t + 0.06 * t * t) * zoomAt(f);
  const v = f < X1 ? vg : f < 60 ? lerp((2.8 * 22 + 0.06 * 484) * zoomAt(X1), 250, smooth(X1, 60, f)) : f < 112 ? 250 : 250 * (1 - smooth(112, STOP, f));
  SPEED.push(v); DIST.push((f ? DIST[f - 1] : 0) + v);
}
const speed = (fl) => SPEED[clamp(Math.floor(fl), 0, LAST)], dist = (fl) => DIST[clamp(Math.floor(fl), 0, LAST)];
const BLUR = (fl) => Math.min(300, 1.3 * speed(fl)) * smooth(DROP + 1, DROP + 6, fl);
const climberY = (fl) => lerp(EL.climber.y, 450, smooth(DROP, X1, fl));
const CLIMB_Y = 330;
const spaceCY = (fl) => (fl < STOP ? lerp(450, CLIMB_Y, smooth(114, STOP, fl)) : CLIMB_Y);

// ---------------------------------------------------------------- the sky: a celestial sphere, turning (sky2d.js)
// The camera faces due north, so the celestial pole is on the horizon straight ahead, behind the
// tether's line: the trails are concentric circles centred on the elevator. At the landing the pole sits
// on the paper horizon behind the tower; as the camera rides up with the climber it rises to sit right
// behind the climber, and the sky wheels around it. The horizon dips as it climbs (the lower circles
// open up in space).
const RATE = 0.03, EXPO = 20, SKY_F = 1500;
const STARS = makeSky(15000, 4242);
const poleY = (fl) => (fl < X1 ? lerp(690, climberY(fl), smooth(DROP, X1, fl)) : spaceCY(fl));
const skyPitch = (fl) => Math.atan((poleY(fl) - 540) / SKY_F) + 0.06 * awayAt(fl);
const skyCamAt = (fl) => skyCam(-0.05 * awayAt(fl), skyPitch(fl), SKY_F);
const dipAt = (fl) => 1.2 * smooth(DROP + 4, X1 + 6, fl);
const startK = (f) => (f < DROP ? 0 : 0.45 + 0.55 * smooth(DROP, 60, f));      // (R19) the trails start on the drop
const rateAt = (f) => (f < DROP || f >= FLING ? 0 : RATE * startK(f));
const ANG = []; { let a = 0; for (let f = 0; f <= LAST + 1; f++) { ANG.push(a); a += rateAt(f); } }
const skyAngle = (fl) => ANG[clamp(Math.floor(fl), 0, LAST)];
// the exposure's arc: it lengthens with the climb and, at release, the trails stop dead
const trailAt = (fl) => RATE * EXPO * startK(fl) * smooth(DROP - 0.5, DROP + 1.5, fl) * (fl < FLING ? 1 : Math.max(0, 1 - (fl - FLING) / 3));
const MOON_D = unprojectDir(skyCam(0, Math.atan((690 - 540) / SKY_F), SKY_F), 300, 170);   // the moon, where the landing shows it

// ---------------------------------------------------------------- the ground (the landing, the launch)
const D8 = 2400 - 8;
function camA(fl) {
  const m = zoomAt(fl), cam = { Zc: 2400, zref: 0, c: [960, 540], t: [0, 0], tz: D8 - D8 / m, pan: [0, 0] };
  cam.pan = panFor(cam, [EL.climber.x, climbY(fl)], 8, [960, climberY(fl)]);
  return cam;
}
export function groundState(T, fr) {
  const fl = fr.fl, on = smooth(0, 8, fl), beat = T.pulse('beats', fr.f, 6), launch = Math.exp(-Math.max(fl - DROP, 0) / 5) * smooth(DROP - 1, DROP + 1, fl);
  return {
    cam: camA(fl),
    layers: {
      coast: { ew: 1.3 }, anchor: { ew: 2.0 * on }, ribbon: { vw: 0.18 * on + 0.4 * launch },
      climber: Object.assign({ vw: 1.4 * on * (1 + 0.15 * beat) + 1.2 * launch }, layerXF([EL.climber.x, EL.climber.y], 0, climbY(fl) - EL.climber.y, 1)),
    },
    light: { x: EL.climber.x, y: climbY(fl), z: 30, I: 3.2e4 * on * (1 + 1.5 * launch), r: 10, a: 90, f: 900 },
    fills: [{ x: EL.ribbon.x, y: EL.tower.top - 20, z: 20, I: 9000 * on * (1 + 2 * launch), a: 60, f: 500, h: 0.6 }],
    sky: { starD: 0, starB: 0, moon: null },                      // (the sky's stars and moon are 2D: sky2d)
    post: { fade: 1 },
  };
}
const LINE_BURN = STROKES.map((s, i) => 0.5 * heat(s.part) + 1.4 * hash(i, 13));
export function s29Lines(fr) {
  const cam = camA(fr.fl), dy = climbY(fr.fl) - EL.climber.y;
  return STROKES.map((s, i) => ({
    pts: s.pts.map(([x, y]) => toScreen(cam, [x, y + (s.part === 'climber' || s.part === 'sails' ? dy : 0)], s.z)),
    burn: LINE_BURN[i], I: s.I, w: s.w,
  }));
}

// ---------------------------------------------------------------- space; the release in the payload's frame
// after release the tether and climber fall away below, swing aside (still turning) and shrink
const relT = (fl) => Math.max(0, fl - FLING);
const fallY = (t) => 0.45 * t * t + 3 * t, swingX = (t) => -(0.3 * t * t + 2 * t), tiltA = (t) => -0.006 * t, shrinkS = (t) => 1 / (1 + 0.03 * t);
export function spaceState(T, fr) {
  const fl = fr.fl, beat = T.pulse('beats', fr.f, 6), Z = zoomAt(fl), cy = spaceCY(fl);
  const t = relT(fl), flash = fl >= FLING ? Math.exp(-t / 4) : 0;
  const sh = shrinkS(t), fx = swingX(t), fy = fallY(t), rot = tiltA(t);
  const H = { dx: 1e6 };
  const layers = {
    tether: { s: Z * sh, piv: [960, cy], dx: fx, dy: (dist(fl) % (30 * Z)) + fy, rot, vw: 0.22 + 0.2 * flash },
    climber: Object.assign({ vw: (1.3 * (1 + 0.15 * beat) + 1.5 * flash) * (fl < FLING ? 1 : sh), rot }, layerXF([960, 0], fx, cy + fy, Z * sh)),
    sail: H, probe: H, beam: H,                                    // (the hero is a flock member now)
  };
  // the pod: on the climber until the release, then still (it drifts free with the tip's velocity)
  const b = Math.max(0, fl - BURST), apart = 0.9 * b * b + 14 * b, fade = 1 - smooth(BURST + 4, BURST + 22, fl);
  for (const [name, side] of [['podL', -1], ['podR', 1]]) {
    layers[name] = fade <= 0 ? H : Object.assign({ rot: side * 0.05 * b, vw: (2.2 + 2.5 * flash) * fade, op: fade },
      layerXF([960, 0], side * apart, cy - apart * 0.4, fl < FLING ? Z : 1));
  }
  return {
    layers, pose: { unfurl: 0, ph: 0 },
    sky: { space: 1, starD: 0, starB: 0, pins: [] },
    light: { x: 960 + fx, y: cy + fy, z: 30, I: 2.4e4 * (1 + 2 * flash) * (fl < FLING ? 1 : sh * sh), r: 10, a: 90, f: 900 },
    fills: [],
    post: { fade: 1 },
  };
}

// ---------------------------------------------------------------- the flock (2D over the paper)
const B0 = camBasis(CAM);
const depthOf = (B, p) => (p[0] - B.pos[0]) * B.fw[0] + (p[1] - B.pos[1]) * B.fw[1] + (p[2] - B.pos[2]) * B.fw[2];
const un = (sx, sy, z) => [0, 1, 2].map((j) => B0.pos[j] + B0.fw[j] * z + B0.rt[j] * (sx - B0.pp[0]) * z / B0.f + B0.up[j] * (B0.pp[1] - sy) * z / B0.f);
const BURST_AT = [960, CLIMB_Y - 5], BURST3 = un(BURST_AT[0], BURST_AT[1], 12);
// the push (R19): from AWAY the displacement grows as the square of time and a little faster, to the cut
const awayAt = (fl) => { const p = clamp((fl - AWAY) / (LAST - AWAY), 0, 1); return p * p * (0.75 + 0.25 * p); };
function clipSeg(B, a, b, near = 0.5) {
  let za = depthOf(B, a), zb = depthOf(B, b);
  if (za < near && zb < near) return null;
  if (za < near) { const u = (near - za) / (zb - za); a = a.map((v, i) => v + (b[i] - v) * u); }
  if (zb < near) { const u = (near - zb) / (za - zb); b = b.map((v, i) => v + (a[i] - v) * u); }
  return [a, b];
}
// (R20) the beams' three waves: the hero and two near the middle, then twelve spread out, then the rest
const WAVE_T = [BEAMS, BEAMS + 9, BEAMS + 18];
const FIRST = new Set([N_SAILS, 5 * 14 + 6, 4 * 14 + 8]);
const waveOf = (i) => (FIRST.has(i) ? 0 : hash(i, 17) < 0.09 ? 1 : 2);
const beamAt = (i) => { const w = waveOf(i); return WAVE_T[w] - 6 + (w === 2 ? 1.5 : 3) * hash(i, 3); };
const pushOf = (i, fl) => { const t0 = Math.max(beamAt(i) + 6, AWAY - 6), p = clamp((fl - t0) / (LAST - AWAY), 0, 1.15); return p * p * (0.75 + 0.25 * p); };
function drawFlock(g, s, fl, tsec) {
  const away = awayAt(fl), D = PUSH_D * away;                       // the main push (the camera follows it)
  const cam = Object.assign({}, CAM, { pos: TRAVEL.map((v) => v * FOLLOW * D), pitch: CAM.pitch + 0.06 * away, yaw: CAM.yaw - 0.05 * away }), B = camBasis(cam);
  const P = (p) => project(p, cam);
  const sails = [];
  for (let i = 0; i <= N_SAILS; i++) {                              // (N_SAILS is the hero, the nearest member)
    const t0 = BURST + 2 + 12 * hash(i, 5), u = clamp((fl - t0) / 32, 0, 1);
    if (u <= 0) continue;
    const e = easeOut(u), slot = slotAt(i), Di = PUSH_D * pushOf(i, fl);
    const c = [0, 1, 2].map((j) => lerp(BURST3[j], slot[j], e) + TRAVEL[j] * Di);
    const open = smooth(0.3, 1, u) * smooth(BURST + 6, BURST + 62, fl);
    const tb = beamAt(i), lit = clamp((fl - tb - 5) / 6, 0, 1), grow = clamp((fl - tb) / 7, 0, 1);
    const warm = 0.55 * (1 - e) * (1 - smooth(BURST + 20, BURST + 44, fl));
    sails.push({ i, c, open, lit: Math.max(lit, warm), grow, z: depthOf(B, c), spin: (hash(i, 9) - 0.5) * 1.4 * (1 - open) });
  }
  sails.sort((a, b) => b.z - a.z);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.globalCompositeOperation = 'lighter';
  // the beams, behind the sails: each runs along the sails' normal from the far source to its hub
  for (const q of sails) {
    if (q.grow <= 0) continue;
    const src = beamFrom(q.c, 60), end = [0, 1, 2].map((j) => lerp(src[j], q.c[j], q.grow));
    const seg = clipSeg(B, src, end);
    if (!seg) continue;
    const a = P(seg[0]), bb = P(seg[1]), hero = q.i === N_SAILS, on = clamp(q.grow * 1.6, 0, 1);
    // (R19: a bright laser) a warm halo round a white-hot core
    g.strokeStyle = `rgba(${FC.beam.join(',')},${((hero ? 0.2 : 0.12) * on).toFixed(3)})`; g.lineWidth = (hero ? 9 : 5) * s;
    g.beginPath(); g.moveTo(a[0] * s, a[1] * s); g.lineTo(bb[0] * s, bb[1] * s); g.stroke();
    g.strokeStyle = `rgba(255,228,200,${((hero ? 0.85 : 0.6) * on).toFixed(3)})`; g.lineWidth = (hero ? 2.4 : 1.4) * s;
    g.beginPath(); g.moveTo(a[0] * s, a[1] * s); g.lineTo(bb[0] * s, bb[1] * s); g.stroke();
  }
  let n = 0;
  g.globalCompositeOperation = 'screen';                            // (R19) larger sails overlap: screen, not add
  for (const q of sails) if (drawSail(g, s, P, sailMesh(q.i, { c: q.c, open: q.open, spin: q.spin, t: tsec, side: SHEET.side * SAIL_K }), { lit: q.lit, light: SHEET.N, hot: q.lit })) n++;
  g.globalCompositeOperation = 'source-over';
  return n;
}

// ---------------------------------------------------------------- 2D light: the sky, the tether's pulses, the flashes
function drawSky(g, s, fl) {
  const Z = zoomAt(fl), ground = 1 - smooth(X0, X1, fl);
  // the stars go into their own canvas; what they pass behind is erased from it at its exact
  // silhouette (so no box shows round the climber), then the sky is added over the frame
  const k = skc;
  k.setTransform(1, 0, 0, 1, 0, 0); k.globalCompositeOperation = 'source-over'; k.clearRect(0, 0, sk.width, sk.height);
  k.globalCompositeOperation = 'lighter';
  const angle = skyAngle(fl), trail = trailAt(fl), C = skyCamAt(fl);
  drawSky3(k, s, STARS, C, { angle, trail, gain: 0.8, minB: 0.42 * ground, dip: dipAt(fl) });
  // the moon turns with the stars (a thick trail in the time-lapse); it sets out of frame as it climbs
  // (it circles the pole too: it slides down the left side and leaves through the bottom left near
  //  local 92; it fades there so it never comes round into the fleet's frames)
  const md = turn(MOON_D, angle), mp = md[1] > -Math.sin(dipAt(fl)) ? projectDir(C, md) : null, ma = 1 - smooth(82, 92, fl);
  if (mp && ma > 0 && mp[0] > -80 && mp[0] < 2000 && mp[1] > -80 && mp[1] < 1160) {
    const [mx, my] = mp;
    if (trail > 1e-4) {
      const pts = [mp]; for (let j = 1; j <= 8; j++) { const q = projectDir(C, turn(MOON_D, angle - trail * j / 8)); if (q) pts.push(q); }
      k.strokeStyle = `rgba(190,204,236,${(0.16 * ma).toFixed(3)})`; k.lineWidth = 12 * s; k.lineCap = 'round'; k.lineJoin = 'round';
      k.beginPath(); pts.forEach((q, j) => (j ? k.lineTo(q[0] * s, q[1] * s) : k.moveTo(q[0] * s, q[1] * s))); k.stroke();
    }
    const hg = k.createRadialGradient(mx * s, my * s, 0, mx * s, my * s, 70 * s);
    hg.addColorStop(0, `rgba(160,178,217,${(0.35 * ma).toFixed(3)})`); hg.addColorStop(1, 'rgba(160,178,217,0)');
    k.fillStyle = hg; k.beginPath(); k.arc(mx * s, my * s, 70 * s, 0, 2 * Math.PI); k.fill();
    k.fillStyle = `rgba(206,216,240,${(0.95 * ma).toFixed(3)})`; k.beginPath(); k.arc(mx * s, my * s, 14 * s, 0, 2 * Math.PI); k.fill();
  }
  // erase what the sky passes behind
  k.globalCompositeOperation = 'destination-out'; k.fillStyle = '#000';
  const R = (x0, y0, x1, y1) => k.fillRect(x0 * s, y0 * s, (x1 - x0) * s, (y1 - y0) * s);
  if (ground > 0) {
    const cam = camA(fl), yTop = toScreen(cam, [960, EL.horizon - 62], -640)[1];
    R(0, Math.max(0, yTop), 1920, 1080);                                              // the land and sea
    const a = toScreen(cam, [EL.deck[0], EL.tower.top - 30], 0), b = toScreen(cam, [EL.deck[2], EL.legBot], 0);
    R(a[0], a[1], b[0], b[1]);                                                         // the anchor and its tower
  }
  if (fl < FLING + 3) {
    const cy = fl < X1 ? climberY(fl) : spaceCY(fl);
    R(960 - 8 * Z, 0, 960 + 8 * Z, 1080);                                             // the tether
    R(960 - 39 * Z, cy - 39 * Z, 960 + 39 * Z, cy + 39 * Z);                          // the climber: body,
    R(960 - 65 * Z, cy - 34 * Z, 960 + 65 * Z, cy + 24 * Z);                          //   its packs of sails,
    R(960 - 17 * Z, cy - 49 * Z, 960 + 17 * Z, cy + 49 * Z);                          //   and its clamps
  }
  g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(sk, 0, 0); g.restore();
}
function drawTrail(g, s, fl, cy) {
  const Z = zoomAt(fl), L = 2.0 * BLUR(fl);
  if (L < 4) return;
  const gr = g.createLinearGradient(0, (cy + 40 * Z) * s, 0, (cy + 40 * Z + L) * s);
  gr.addColorStop(0, 'rgba(255,190,140,0.5)'); gr.addColorStop(1, 'rgba(255,150,96,0)');
  g.fillStyle = gr; g.fillRect((960 - 13 * Z) * s, (cy + 40 * Z) * s, 26 * Z * s, L * s);
}
function drawPulses(g, s, fl, cy) {
  const on = smooth(DROP, DROP + 6, fl) * (1 - smooth(STOP - 12, STOP, fl)), Z = zoomAt(fl);
  if (on <= 0) return;
  // (R20) they run inside the ribbon, so they pass behind the climber and its payload: nothing is
  // drawn over the climber's body, packs and clamps (the same outline the stars are erased at)
  const top = cy - 52 * Z - 3, bot = cy + 52 * Z + 3;             // (round caps reach 3Z further)
  g.lineCap = 'round';
  for (let k = 0; k < 7; k++) {
    const y0 = ((k * 263 + dist(fl) * 1.35) % 1500) - 200, y1 = y0 + 26 * Z;
    g.strokeStyle = `rgba(255,222,188,${(0.8 * on).toFixed(3)})`; g.lineWidth = 6 * Z * s;
    for (const [a, b] of [[y0, Math.min(y1, top)], [Math.max(y0, bot), y1]]) {
      if (b <= a) continue;
      g.beginPath(); g.moveTo(960 * s, a * s); g.lineTo(960 * s, b * s); g.stroke();
    }
  }
}
function drawFlashes(g, s, fl) {
  const at = (x, y, r, a) => {
    const gr = g.createRadialGradient(x * s, y * s, 0, x * s, y * s, r * s);
    gr.addColorStop(0, `rgba(255,236,214,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,170,110,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x * s, y * s, r * s, 0, 2 * Math.PI); g.fill();
  };
  // (R19) the ignition on 73.1: a hot core at the climber, a bloom that floods the frame, and a brief
  // lens streak through it
  if (fl >= DROP - 1 && fl < DROP + 20) {
    const k = Math.max(0, fl - DROP), pre = smooth(DROP - 1, DROP, fl), cy = climberY(fl);
    at(960, cy, 90 + 55 * k, pre * Math.exp(-k / 3.5));
    at(960, cy, 760 + 30 * k, 0.5 * pre * Math.exp(-k / 6));
    const sa = 0.75 * pre * Math.exp(-k / 3);
    if (sa > 0.01) {
      const gr = g.createLinearGradient(0, 0, 1920 * s, 0);
      gr.addColorStop(0, 'rgba(255,190,140,0)'); gr.addColorStop(0.5, `rgba(255,236,214,${sa.toFixed(3)})`); gr.addColorStop(1, 'rgba(255,190,140,0)');
      g.fillStyle = gr; g.fillRect(0, (cy - 2.5) * s, 1920 * s, 5 * s);
    }
  }
  if (fl >= FLING && fl < FLING + 14) at(960, CLIMB_Y - 5, 40 + 5 * (fl - FLING), 0.55 * Math.exp(-(fl - FLING) / 3.5));   // the release
  if (fl >= BURST && fl < BURST + 22) { const k = fl - BURST; at(BURST_AT[0], BURST_AT[1], 30 + 22 * k, 0.9 * Math.exp(-k / 4)); }   // the burst
}

let EA, EB, B, M, glA, glB, mc, mg, lc, lg, g2, sk, skc;
export default {
  async setup(ctx) {
    const mk = () => { const c = document.createElement('canvas'); c.width = ctx.W; c.height = ctx.H; return c; };
    glA = mk(); glB = mk(); mc = mk(); lc = mk(); sk = mk(); mg = mc.getContext('2d'); lg = lc.getContext('2d'); skc = sk.getContext('2d');
    g2 = ctx.canvas.getContext('2d');
    EA = createPaper(glA, groundScene(), { k: ctx.scale, log: ctx.log });
    EB = createPaper(glB, spaceScene(), { k: ctx.scale, log: ctx.log });
    B = createBurn(ctx); M = createSmear(ctx.W, ctx.H);
    ctx.log(`S29: ${STROKES.length} elevator lines; the flock ${N_SAILS} + the nearest; burst at ${BURST_AT.map(Math.round)}`);
  },
  render(ctx, fr) {
    const fl = fr.fl, s = ctx.W / 1920;
    const reset = (g) => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.globalAlpha = 1; };
    reset(mg); mg.fillStyle = '#000'; mg.fillRect(0, 0, ctx.W, ctx.H);
    if (fl < X1) { EA.frame(groundState(ctx.T, fr)); mg.drawImage(glA, 0, 0, ctx.W, ctx.H); }
    if (fl >= X0) {
      EB.frame(spaceState(ctx.T, fr));
      mg.globalAlpha = smooth(X0, X1, fl); mg.drawImage(glB, 0, 0, ctx.W, ctx.H); mg.globalAlpha = 1;
    }
    const cy = fl < X1 ? climberY(fl) : spaceCY(fl);
    mg.globalCompositeOperation = 'lighter'; drawPulses(mg, s, fl, cy); mg.globalCompositeOperation = 'source-over';
    // the motion blur: near things only (the tether's markings, the climber's edges); the stars are
    // drawn after it, unblurred
    let out = mc;
    const Z = zoomAt(fl);
    if (fl > DROP && fl <= STOP && BLUR(fl) > 1) out = M.apply(mc, { dir: [0, 1], len: BLUR(fl), keep: [960, cy, 104 * Z, 112 * Z] });
    reset(g2); g2.drawImage(out, 0, 0, ctx.W, ctx.H);
    drawSky(g2, s, fl);
    g2.save(); g2.globalCompositeOperation = 'lighter';
    if (fl > DROP && fl <= STOP + 2) drawTrail(g2, s, fl, cy);
    drawFlashes(g2, s, fl);
    g2.restore();
    // the landing, in the fill before the drop
    if (fl < 24) B.draw(g2, s29Lines(fr), fl, { flash: 1 });
    // the flock and its beams, with a soft glow once lit
    if (fl >= BURST) {
      reset(lg); lg.clearRect(0, 0, ctx.W, ctx.H);
      if (drawFlock(lg, s, fl, fr.t)) {
        const glow = smooth(BEAMS, BEAMS + 12, fl);
        g2.save(); g2.globalCompositeOperation = 'lighter';
        if (glow > 0) { g2.filter = `blur(${(7 * s).toFixed(2)}px)`; g2.globalAlpha = 0.55 * glow; g2.drawImage(lc, 0, 0); }
        g2.filter = 'none'; g2.globalAlpha = 1; g2.drawImage(lc, 0, 0);
        g2.restore();
      }
    }
  },
};
