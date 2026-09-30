// The voyage (agent D; revision 12): the fleet of sails leaving the solar system, for S30's three
// outside views (36 frames each; S30 local frames 36-71, 108-143, 180-215). Only the sails and their
// beams, the Sun and the stars:
//   0  looking back past the fleet at the Sun, small in the fine paper rings of its orbits: the
//      camera is downstream of the beams, so it sees the sails from behind, translucent vellum
//      backlit by the beams, and the beams converge on the Sun and Earth;
//   1  the Sun one star among many, the dark between: as the fleet speeds up, aberration pulls the
//      stars away from the point it is leaving (toward the point ahead, behind the lens), and the
//      stars behind warm and dim a little;
//   2  the two stars ahead, A and B, large and near, the fleet heading in on its beams from behind:
//      the stars crowd toward the point ahead and whiten a little.
// Physics (R12): beamed sails face their beam. The source (the Earth's array, beside the Sun at these
// distances) is far away, so the beams are parallel, meet each sail's centre along its normal, and
// all the sails are parallel; the formation lies in the plane perpendicular to the beams. The flock is
// O's (sets/paper-kit/fleet3d.js): its SHEET.N points to the source, and the fleet travels along -N.
// Stars are drawn with relativistic aberration and Doppler (subtle), any trails pointing along the
// direction of travel. The sky, the Sun's orbits and the A/B pinholes are paper (paper-kit/kit.js).
//
//   import { createVoyage } from '../sets/voyage/voyage.js';
//   const V = createVoyage(cv, { k: ctx.scale, log: ctx.log });   // cv: a fresh canvas, W x H
//   V.voyageFrame(view, t);      // view 0..2, t 0..35: draws the frame into cv (2D context)
//   g2.drawImage(cv, 0, 0, W, H);
// Deterministic: a frame is a pure function of (view, t). 1920x1080 (times k).
import { createPaper, S2, lin, clamp, lerp, mulberry32, PAPER } from '../paper-kit/kit.js';
import { SHEET, N_SAILS, FLEET_COLOURS, sailMesh, drawSail, SOURCE_DIR } from '../paper-kit/fleet3d.js';

export const VIEWS = 3, VIEW_LEN = 36;
// the fleet's one orange, as O publishes it in MATCH.md (S29, bar 76): rgb(255, 158, 104)
export const FLEET_ORANGE = [255, 158, 104];
const TAU = Math.PI * 2;
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(4)})`;
const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

// ---------------------------------------------------------------- the fleet in 3D (O's sheet)
// The formation is O's (sets/paper-kit/fleet3d.js, MATCH.md): a tilted plane of 96 thin sails (12 x 8,
// 1.8 apart, 1.19 square) lying in the sheet's plane, facing their beams. The beams come from home, far
// along +N; the fleet travels along -N. Each view looks at the same sheet from further off.
// (revision 12) The voyage keeps O's flock but turns it into its own frame, with the source (SHEET.N,
// where the beams come from) behind at -Z and the fleet travelling +Z, centred on the origin: in
// deep space nothing says which way is up, and the cameras stay well-conditioned.
const EN = v3.norm(SOURCE_DIR), E1 = v3.norm(v3.sub(SHEET.U, v3.mul(EN, v3.dot(SHEET.U, EN)))), EW = v3.cross(E1, EN);
const toV = (p) => { const d = v3.sub(p, SHEET.c); return [v3.dot(d, E1), v3.dot(d, EW), -v3.dot(d, EN)]; };
const dirV = (n) => [v3.dot(n, E1), v3.dot(n, EW), -v3.dot(n, EN)];
function meshV(m) {
  return { hub: toV(m.hub), tips: m.tips.map(toV), n: dirV(m.n),
    panels: m.panels.map((q) => ({ tip0: toV(q.tip0), tip1: toV(q.tip1), edge: toV(q.edge), belly: toV(q.belly), n: dirV(q.n) })) };
}
// O's flock (fleet3d.js sailMesh / drawSail, revision 12): light sails, each an X of booms with four
// billowed, scalloped membrane panels, all parallel and facing the source, in O's formation; index
// N_SAILS is O's hero, the flock's nearest member (same mesh and orientation, just nearer)
export const FLEET3 = Array.from({ length: N_SAILS + 1 }, (_, i) => ({ i, mesh: meshV(sailMesh(i, { open: 1 })) }));
FLEET3.forEach((s) => { s.P = s.mesh.hub; });

// ---------------------------------------------------------------- cameras
// A camera is aimed by where the travel axis vanishes on screen (VP: the Sun behind, or the
// destination ahead) and placed so the sheet's centre sits at a screen point at a distance.
function basis(yaw, pitch, F, pos) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const fw = [sy * cp, sp, cy * cp], right = [cy, 0, -sy], up = v3.cross(fw, right);
  return { pos, fw, right, up, F, pp: [960, 540] };
}
function project(B, p) {
  const d = v3.sub(p, B.pos), z = v3.dot(d, B.fw);
  return [B.pp[0] + B.F * v3.dot(d, B.right) / z, B.pp[1] - B.F * v3.dot(d, B.up) / z, z];
}
const rayDir = (B, sx, sy) => v3.norm(v3.add(B.fw, v3.add(v3.mul(B.right, (sx - 960) / B.F), v3.mul(B.up, (540 - sy) / B.F))));
// yaw and pitch that put direction dir at screen (sx, sy) (a small deterministic search)
function aim(dir, sx, sy, F) {
  let yaw = Math.atan2(dir[0], dir[2]), pitch = Math.asin(clamp(dir[1], -1, 1));
  for (let it = 0; it < 60; it++) {
    const B = basis(yaw, pitch, F, [0, 0, 0]), p = project(B, dir);
    const ex = p[0] - sx, ey = p[1] - sy;
    if (Math.abs(ex) + Math.abs(ey) < 1e-4) break;
    yaw += ex / F * 0.9; pitch -= ey / F * 0.9;
  }
  return { yaw, pitch };
}
// per view: the travel axis's vanishing point, where the sheet's centre sits (screen, distance) at
// t = 0 and t = 35, the focal length
const centreOf = () => [0, 0, 0];
function placeFleet() {}
// the direction of travel (the apex) and of the source (the Sun, the Earth's array beside it)
export const SOURCE = [0, 0, -1], APEX = [0, 0, 1];
// per view: which way it looks (the source or the apex, put on screen at `aim`), where the flock's
// centre sits (screen x, y, distance) at t = 0 and t = 35, the focal length, the speed (v/c) range
export const VIEWCAM = [
  // (R14: closer, so the near sails are large and cut by the frame and the sheet's regularity breaks up)
  { look: SOURCE, aim: [330, 880], at0: [1180, 400, 8.6], at1: [1200, 410, 7.8], F: 900, beta: [0.01, 0.012] },  // looking back at the Sun
  { look: SOURCE, aim: [230, 900], at0: [1300, 380, 9.6], at1: [1320, 390, 8.6], F: 900, beta: [0.04, 0.32] },   // the Sun among the stars
  { look: APEX, aim: [560, 330], at0: [1720, 920, 11], at1: [1730, 900, 12.4], F: 900, beta: [0.3, 0.34] },      // A and B ahead
];
VIEWCAM.forEach((V) => Object.assign(V, aim(V.look, V.aim[0], V.aim[1], V.F)));
function viewCam(b, u) {
  const V = VIEWCAM[b], o = V, B0 = basis(o.yaw, o.pitch, V.F, [0, 0, 0]);
  const sx = lerp(V.at0[0], V.at1[0], u), sy = lerp(V.at0[1], V.at1[1], u), dist = lerp(V.at0[2], V.at1[2], u);
  const pos = v3.sub(centreOf(), v3.mul(rayDir(B0, sx, sy), dist));
  return basis(o.yaw, o.pitch, V.F, pos);
}

// ---------------------------------------------------------------- drawing the fleet (2D, over the paper)
// Each sail is thin translucent tissue in the fleet orange: brighter toward the light it is catching
// (lightPt, on screen), with a hot spot where its beam meets it, a fine lit edge and its two spars.
function drawFleet(g, k, B, opts) {
  const { beams = 1, lit = 1 } = opts;
  const sails = FLEET3.map((s) => ({ s, z: project(B, s.P)[2] }))
    .filter((q) => q.z > 3.2).sort((a, b) => b.z - a.z);             // (none right at the lens)
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // the beams: parallel, from the far source along +N to each sail's centre (normal incidence),
  // clipped at the lens; in perspective they converge on the source when it is in view
  if (beams > 0) {
    g.strokeStyle = rgba(FLEET_COLOURS.beam, 0.28 * beams); g.lineWidth = 1.1 * k;
    for (const q of sails) {
      const S = q.s.P, H = v3.add(S, v3.mul(SOURCE, 1e5));
      const zs = v3.dot(v3.sub(S, B.pos), B.fw), zh = v3.dot(v3.sub(H, B.pos), B.fw);
      let E = H;
      if (zh < 1) { const f = (zs - 1) / (zs - zh); E = v3.add(S, v3.mul(v3.sub(H, S), f)); }
      const a = project(B, S), e = project(B, E);
      g.beginPath(); g.moveTo(e[0] * k, e[1] * k); g.lineTo(a[0] * k, a[1] * k); g.stroke();
    }
  }
  // the sails, far to near, as light through tissue (O's drawSail, added): lit by the beams on their
  // source side; from behind (views 0 and 1) they glow through as backlit vellum
  g.globalCompositeOperation = 'lighter';
  const proj = (p) => project(B, p);
  for (const q of sails) drawSail(g, k, proj, q.s.mesh, { lit, alpha: clamp((q.z - 3.2) / 2.5), light: SOURCE, hot: beams > 0 ? 1 : 0.4, back: opts.back });
  g.restore();
}

// ---------------------------------------------------------------- the paper sky
const ellPt = (cx, cy, rx, ry, rot, a) => { const x = rx * Math.cos(a), y = ry * Math.sin(a), c = Math.cos(rot), s = Math.sin(rot); return [cx + x * c - y * s, cy + x * s + y * c]; };
function orbit(m, cx, cy, rx, sq, rot, w, v, n = 200) {
  for (let i = 0; i < n; i++) m.vel(S2.bar(ellPt(cx, cy, rx, rx * sq, rot, TAU * i / n), ellPt(cx, cy, rx, rx * sq, rot, TAU * (i + 1) / n), w), v, 0);
}
function pinhole(m, x, y, r, v, spike = 0, turn = 0) {
  const e = S2.ellipse(x, y, r, r, 0, Math.max(8, Math.round(r * 5)));
  m.cut(e, 0); m.emit(e, v, 0);
  if (spike > 0) for (let k = 0; k < 2; k++) {
    const a = turn + k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), w = Math.max(0.6, r * 0.22);
    m.emit([[x + c * spike, y + s * spike], [x - s * w, y + c * w], [x - c * spike, y - s * spike], [x + s * w, y - c * w]], 0.75 * v, 0);
  }
}
export const SUN = VIEWCAM[0].aim;                                    // view 0's Sun (the source, behind)
export const SUN1 = VIEWCAM[1].aim;                                   // view 1's
export const AB = [[470, 262, 46], [742, 432, 27]];                 // view 2: A and B (x, y, disc radius), by the point ahead
const ORBITS = [25, 38, 54, 80, 144, 236, 350, 468];                 // Mercury to Neptune, small
function drawStars(m, rnd, b) {
  if (b === 2) { const [[ax, ay, ar], [bx, by, br]] = AB; pinhole(m, ax, ay, ar, 1, 260, 0.15); pinhole(m, bx, by, br, 0.85, 150, 0.55); }
  if (b !== 0) return;                                              // views 1 and 2: the stars are drawn with aberration
  const R = mulberry32(711 + b);
  for (let i = 0; i < 150; i++) {
    const x = -200 + R() * 2320, y = -200 + R() * 1480, u = R(), v = R();
    if (b === 2 && AB.some(([ax, ay, ar]) => Math.hypot(x - ax, y - ay) < ar * 4)) continue;
    pinhole(m, x, y, 0.6 + 0.7 * u * u, 0.25 + 0.45 * v);
  }
  pinhole(m, SUN[0], SUN[1], 4, 1, 24, 0.3);
}
function drawOrbits(m, rnd, b) {
  if (b === 0) ORBITS.forEach((r, i) => orbit(m, SUN[0], SUN[1], r, 0.34, -0.12, i < 4 ? 1.2 : 1.6, 0.55 + 0.1 * (i > 3), 160 + 40 * (i > 3)));
}
export function voyageScene() {
  const S = { name: 'voyage' };
  S.world = { x0: -240, y0: -240, w: 2400, h: 1560 };
  S.maskScale = 1;
  S.sky = { top: '#05060C', hor: '#0B0E1A', horY: 1080 };
  S.light = { x: 960, y: 540, z: -900, r: 10, I: 0, a: 100, f: 1200 };
  S.moon = { dir: [0.4, 0.3, 1], I: 0.25, disc: [0, 0, 0] };
  S.hazeW = 1e-9;
  S.params = { arim: 0.1, hm: 0, ha: 0, rim: 1.4, hw: 1e-9 };
  S.cam = { Zc: 2400, zref: 0, c: [960, 540] };
  const key = (pose) => 'V' + (pose.view | 0);
  const d = (fn) => (m, r, p) => fn(m, r, p.view | 0);
  S.layers = [
    { name: 'stars', z: -1000, col: PAPER.ink, alb: 0, ao: 0, ew: 3.2, ef: 0.1, bound: 1, key, seed: 21, draw: d(drawStars) },
    { name: 'orbits', z: -900, col: PAPER.ink, alb: 0, ao: 0, vel: lin('#5C6BA6').map((v) => v * 0.55), vw: 0, bound: 1, key, seed: 22, draw: d(drawOrbits) },
  ];
  return S;
}
export function viewState(b, t) {
  const u = clamp(t / (VIEW_LEN - 1), 0, 1), L = {};
  let starD = 0.05;
  if (b === 0) { L.orbits = { s: lerp(1, 0.84, u), piv: SUN }; L.stars = { s: lerp(1, 0.97, u), piv: SUN }; }
  else if (b === 1) starD = 0.02;
  else { L.stars = { s: lerp(1, 1.06, u), piv: [560, 330], ew: 4.2 }; starD = 0.02; }
  return { layers: L, sky: { space: 1, starD, starB: 1, pins: [], off: [0, 0] }, hazeW: 1e-9, u };
}

// ---------------------------------------------------------------- glows and view 1's moving stars
function glowOver(g, k, x, y, r0, a) {
  const R = r0 * 9, gr = g.createRadialGradient(x * k, y * k, 0, x * k, y * k, R * k);
  for (let i = 0; i <= 12; i++) { const r = R * (i / 12) ** 2, v = i === 12 ? 0 : a / (1 + (r / r0) ** 2) - a / 82; gr.addColorStop((i / 12) ** 2, `rgba(255,150,96,${Math.max(v, 0).toFixed(4)})`); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect((x - R) * k, (y - R) * k, 2 * R * k, 2 * R * k); g.restore();
}
// The stars under aberration. A catalogue of warm pinholes on the sphere (rest-frame directions);
// at speed beta along APEX each is seen at the aberrated angle cos t' = (cos t + b) / (1 + b cos t)
// from the apex, so they crowd toward the point ahead and thin out behind, and its Doppler factor
// d = 1 / (gamma (1 - b cos t')) whitens it a little ahead and warms and dims it behind (kept
// subtle). Each leaves a short trail from where it stood at 94% of the speed, pointing along its
// drift, toward the direction of travel, growing with speed.
const CATALOGUE = (() => {
  const R = mulberry32(2718), out = [];
  for (let i = 0; i < 2600; i++) {
    const z = 2 * R() - 1, a = TAU * R(), r = Math.sqrt(1 - z * z), u = R();
    out.push({ n: [r * Math.cos(a), z, r * Math.sin(a)], r: 0.7 + 1.5 * u * u * u, I: 0.35 + 0.65 * Math.pow(R(), 1.5) });
  }
  return out;
})();
function aberrate(n, beta) {
  const c = v3.dot(n, APEX), perp = v3.sub(n, v3.mul(APEX, c)), pl = Math.hypot(...perp);
  const c2 = (c + beta) / (1 + beta * c), s2 = Math.sqrt(Math.max(0, 1 - c2 * c2));
  const n2 = pl > 1e-9 ? v3.add(v3.mul(APEX, c2), v3.mul(perp, s2 / pl)) : n;
  const gam = 1 / Math.sqrt(1 - beta * beta), dop = 1 / (gam * (1 - beta * c2));
  return { n: n2, dop };
}
function drawAberration(g, k, B, beta) {
  const at = (n) => { const z = v3.dot(n, B.fw); return z > 0.05 ? [B.pp[0] + B.F * v3.dot(n, B.right) / z, B.pp[1] - B.F * v3.dot(n, B.up) / z] : null; };
  g.save(); g.lineCap = 'round'; g.globalCompositeOperation = 'lighter';
  for (const st of CATALOGUE) {
    const A = aberrate(st.n, beta), p = at(A.n);
    if (!p || p[0] < -20 || p[0] > 1940 || p[1] < -20 || p[1] > 1100) continue;
    const d = A.dop, warm = clamp((1 - d) * 1.6), white = clamp((d - 1) * 1.2);
    const col = [255, Math.round(lerp(lerp(222, 246, white), 150, warm)), Math.round(lerp(lerp(188, 236, white), 100, warm))];
    const a = clamp(st.I * Math.pow(d, 1.6));
    if (a < 0.03) continue;
    const q = at(aberrate(st.n, beta * 0.94).n);
    if (q) {
      const len = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (len > 0.8) { g.strokeStyle = rgba(col, 0.35 * a); g.lineWidth = Math.max(0.8, st.r) * k; g.beginPath(); g.moveTo(q[0] * k, q[1] * k); g.lineTo(p[0] * k, p[1] * k); g.stroke(); }
    }
    g.fillStyle = rgba(col, a); g.beginPath(); g.arc(p[0] * k, p[1] * k, st.r * k, 0, TAU); g.fill();
    if (st.r > 1.5) { g.fillStyle = rgba(col, 0.16 * a); g.beginPath(); g.arc(p[0] * k, p[1] * k, st.r * 3.2 * k, 0, TAU); g.fill(); }
  }
  g.restore();
}

export function createVoyage(canvas, opts = {}) {
  const k = opts.k || 1, w = Math.round(1920 * k), h = Math.round(1080 * k);
  const glc = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const E = createPaper(glc, voyageScene(), { k, log: opts.log, pose: { view: 0 } });
  const g = canvas.getContext('2d');
  function voyageFrame(view, t) {
    const b = clamp(Math.round(view), 0, VIEWS - 1), tt = clamp(t, 0, VIEW_LEN - 1);
    const st = viewState(b, tt), u = st.u, kk = canvas.width / 1920, B = viewCam(b, u);
    const V = VIEWCAM[b], beta = lerp(V.beta[0], V.beta[1], u * u * (3 - 2 * u));
    E.frame({ pose: { view: b }, layers: st.layers, sky: st.sky, hazeW: st.hazeW });
    g.drawImage(glc, 0, 0, canvas.width, canvas.height);
    if (b === 0) {
      glowOver(g, kk, SUN[0], SUN[1], 40, 0.7);
      drawFleet(g, kk, B, { back: 1 });
    } else if (b === 1) {
      drawAberration(g, kk, B, beta);
      // the Sun sits on the axis behind: aberration leaves it where it is, a little warmer and dimmer
      const sd = aberrate(SOURCE, beta).dop;
      glowOver(g, kk, SUN1[0], SUN1[1], 13, 0.55 * sd);
      g.save(); g.fillStyle = rgba([255, Math.round(236 * sd), Math.round(214 * sd * sd)], 0.95); g.beginPath(); g.arc(SUN1[0] * kk, SUN1[1] * kk, 2.2 * kk, 0, TAU); g.fill(); g.restore();
      drawFleet(g, kk, B, { beams: 0.6, back: 1 });
    } else {
      const s = lerp(1, 1.06, u), at = (x, y) => [560 + s * (x - 560), 330 + s * (y - 330)];
      const [[ax, ay, ar], [bx, by, br]] = AB;
      drawAberration(g, kk, B, beta);
      glowOver(g, kk, ...at(ax, ay), ar * 2.2 * s, 0.8); glowOver(g, kk, ...at(bx, by), br * 2.2 * s, 0.7);
      drawFleet(g, kk, B, {});
    }
  }
  return { voyageFrame, frame: voyageFrame, engine: E, gl: E.gl };
}
