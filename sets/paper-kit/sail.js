// The square vellum sail (S29's payload, and a standalone element for S30).
// A square of tissue: four panels glued along two diagonal card spars, with concentric glued
// seams (the square again, inside the square), lattice booms, a fine hem with corner grommets,
// and a small card probe at the hub. The ground beam is a tapering strip of streaked tissue
// behind it. Warm light: the beam's hit point is a light just behind the tissue, so the membrane
// glows hottest at the centre and shows its fibre and seams; pulses of light travel up the beam
// into it. Subtle motion: the membrane billows (the edges belly and ripple), the hot spot drifts.
// The square echoes the square of light that opens the film (S01).
//
// Standalone use (S30):
//   import { createSail } from '../sets/paper-kit/sail.js';
//   const sail = createSail(canvas, { k: ctx.scale, log: ctx.log });   // takes a webgl2 context on canvas
//   sail.render({ x, y, size, rot, glow, beam, beamAng, off, sun, unfurl, fade });
// Optional: t (seconds) drives the billow; without it the motion follows x and off (the voyage).
// See NOTES.md for the parameters. Everything is a pure function of the arguments.
import { createPaper, S2, lin, clamp, lerp, smooth, easeOut } from './kit.js';

export const SAIL = { cx: 960, cy: 540, R: 212 };   // rest centre and half-diagonal (side 300 px)
const q2 = v => Math.round(v * 100) / 100;

// the sail's outline for an unfurl amount u (0 folded .. 1 open) and billow phase ph: four spar
// tips, edges that sag inward while it opens (then belly out a little and ripple), a quarter turn
// that unwinds as it opens
export function sailOutline(u, cx = SAIL.cx, cy = SAIL.cy, R = SAIL.R, ph = 0) {
  const e = easeOut(u), r = lerp(12, R, e), tw = (1 - e) * 0.9, sag = 0.42 * (1 - smooth(0.15, 1.0, u));
  const bw = smooth(0.55, 1.0, u);
  const tips = [0, 1, 2, 3].map(k => { const a = -Math.PI * 3 / 4 + k * Math.PI / 2 + tw; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const pts = [];
  for (let k = 0; k < 4; k++) {
    const A = tips[k], B = tips[(k + 1) % 4], mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const sg = sag - bw * (0.015 + 0.035 * Math.sin(ph + 1.9 * k));
    const inw = [cx - mid[0], cy - mid[1]], ctrl = [mid[0] + inw[0] * sg * 1.6, mid[1] + inw[1] * sg * 1.6];
    for (let i = 0; i < 16; i++) { const t = i / 16, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; pts.push([a * A[0] + b * ctrl[0] + c * B[0], a * A[1] + b * ctrl[1] + c * B[1]]); }
  }
  return { pts, tips, r };
}
const poseKey = pose => 'U' + q2(pose.unfurl === undefined ? 1 : pose.unfurl) + 'P' + q2(pose.ph || 0);

// layer definitions: beam (z -70), sail (z 0), probe (z 34). o.z0 shifts all three.
export function sailLayers(o = {}) {
  const z0 = o.z0 || 0, cx = SAIL.cx, cy = SAIL.cy;
  const beamLen = o.beamLen || 1900;
  return [
    { name: 'beam', z: z0 - 70, col: '#171C30', alb: 0, ao: 0, vel: lin('#2D3656').map(v => v * 0.25), vw: 0.3, vl: 1.0, vf: 1.3, seed: 13, draw: (m, rnd) => {
      // overlapping tissue strips make a soft profile, widest where it meets the sail
      m.soft(9, () => {
        for (const [w0, w1, v] of [[30, 20, 0.2], [84, 50, 0.14], [150, 84, 0.08]]) {
          const pts = [[cx - w0 / 2, cy + 30], [cx + w0 / 2, cy + 30], [cx + w1 / 2, cy + beamLen], [cx - w1 / 2, cy + beamLen]];
          m.vel(pts, v, 0);
        }
      });
      // long fibre streaks along it: thin tissue strips, each slightly off the axis
      m.soft(1.2, () => {
        for (let k = 0; k < 9; k++) {
          const x0 = (rnd() - 0.5) * 36, x1 = x0 * 0.6 + (rnd() - 0.5) * 10, w = 2 + rnd() * 4;
          m.vel([[cx + x0 - w / 2, cy + 40 + rnd() * 60], [cx + x0 + w / 2, cy + 40 + rnd() * 60], [cx + x1 + w / 3, cy + beamLen], [cx + x1 - w / 3, cy + beamLen]], 0.035 + 0.03 * rnd(), 0);
        }
      });
      // a hand-cut core strip keeps it paper
      m.vel([[cx - 9, cy + 30], [cx + 9, cy + 30], [cx + 5, cy + beamLen], [cx - 5, cy + beamLen]], 0.1, 1.0);
      // where it catches the sail: light scattered in the tissue, spilling a little past the edges
      m.soft(30, () => { m.vel(S2.ellipse(cx, cy, SAIL.R * 0.74, SAIL.R * 0.74), 0.11, 0); });
    } },
    { name: 'sail', z: z0, col: '#171C30', alb: 0.25, ao: 0.2, thin: 0.3, rimk: 1.6, bound: 1, vel: lin('#3B4668').map(v => v * 0.3), vw: 0.0, vl: 1.0, vf: 1.7,
      key: poseKey, seed: 11,
      draw: (m, rnd, pose) => {
        const u = pose.unfurl === undefined ? 1 : pose.unfurl, ph = pose.ph || 0;
        const { pts, tips, r } = sailOutline(u, cx, cy, SAIL.R, ph);
        if (r < 13) { m.card(S2.ellipse(cx, cy, 12, 12), 0.3); return; }
        const n = 16, sc = (p, f) => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f];
        // four tissue panels, glued along the spars (slightly different sheets)
        for (let k = 0; k < 4; k++) {
          const tri = [[cx, cy]];
          for (let i = 0; i <= n; i++) tri.push(pts[(k * n + i) % pts.length]);
          m.vel(tri, [0.86, 0.8, 0.9, 0.83][k], 0.5);
        }
        // glued seams: two concentric squares of double tissue (a little less light)
        if (u > 0.3) {
          for (const f of [0.42, 0.74]) {
            for (let i = 0; i < pts.length; i++) {
              const a = sc(pts[i], f), b = sc(pts[(i + 1) % pts.length], f), bar = S2.bar(a, b, 1.2);
              m.cut(bar, 0); m.vel(bar, 0.58, 0);
            }
          }
        }
        // a fine hem; each spar is a lattice boom (two hairline rails with zig-zag ties); the hub;
        // grommet tabs at the corners
        const hw = lerp(0.9, 1.5, u);
        for (let i = 0; i < pts.length; i++) m.card(S2.bar(pts[i], pts[(i + 1) % pts.length], hw), 0);
        for (const tp of tips) {
          const d = [tp[0] - cx, tp[1] - cy], l = Math.hypot(d[0], d[1]) || 1, ux = d[0] / l, uy = d[1] / l, nx = -uy, ny = ux;
          const w0 = lerp(2.2, 4.4, u), w1 = lerp(1.4, 2.0, u), P = (t, side) => { const w = lerp(w0, w1, t) / 2; return [cx + d[0] * t + nx * w * side, cy + d[1] * t + ny * w * side]; };
          const t0 = 10 / l;
          m.card(S2.bar(P(t0, -1), P(1, -1), 0.95), 0); m.card(S2.bar(P(t0, 1), P(1, 1), 0.95), 0);
          const nt = Math.max(3, Math.floor(l / 11));
          for (let k = 0; k < nt; k++) { const ta = t0 + (1 - t0) * k / nt, tb = t0 + (1 - t0) * (k + 1) / nt; m.card(S2.bar(P(ta, k % 2 ? 1 : -1), P(tb, k % 2 ? -1 : 1), 0.7), 0); }
        }
        m.card(S2.ellipse(cx, cy, 8, 8), 0.3);
        for (const tp of tips) {
          const d = [tp[0] - cx, tp[1] - cy], l = Math.hypot(d[0], d[1]) || 1, ux = d[0] / l, uy = d[1] / l;
          m.card([[tp[0] + ux * 3, tp[1] + uy * 3], [tp[0] - ux * 9 - uy * 6, tp[1] - uy * 9 + ux * 6], [tp[0] - ux * 9 + uy * 6, tp[1] - uy * 9 - ux * 6]], 0.1);
          m.cut(S2.ellipse(tp[0] - ux * 3.5, tp[1] - uy * 3.5, 1.3, 1.3, 0, 10), 0);
        }
      } },
    { name: 'probe', z: z0 + 34, col: '#10131F', alb: 0.3, ao: 0.5, thin: 0.25, rimk: 2.0, cast: 1, bound: 1, em: lin('#9FB3D9').map(v => v * 0.9),
      key: poseKey, seed: 12, draw: (m, rnd, pose) => {
      const u = pose.unfurl === undefined ? 1 : pose.unfurl, ph = pose.ph || 0;
      // a small card probe at the hub: body, a dish, two stubby booms, a cool status light
      m.card(S2.rrect(cx - 17, cy - 12, 34, 24, 4), 0.4);
      m.card(S2.bar([cx - 17, cy], [cx - 36, cy - 4], 3), 0.2);
      m.card(S2.bar([cx + 17, cy], [cx + 36, cy + 4], 3), 0.2);
      m.card(S2.arc(cx, cy - 22, 14, 7, 0, Math.PI, 18).concat([[cx - 14, cy - 22]]), 0.2);
      m.card(S2.bar([cx, cy - 12], [cx, cy - 20], 3), 0);
      m.cut(S2.ellipse(cx - 7, cy + 2, 2.2, 2.2), 0); m.emit(S2.ellipse(cx - 7, cy + 2, 2.2, 2.2), 0.7);
    } },
  ];
}

// the billow phase: t (seconds) when given, else it follows the sail's travel (x) and the voyage (off)
export function sailPhase(o) {
  if (o.t !== undefined) return o.t * 3.9;
  const off = o.off || [0, 0];
  return 0.003 * (o.x === undefined ? SAIL.cx : o.x) - 0.012 * off[0] + 0.006 * off[1];
}

// per-frame layer transforms, the beam light and the beam's travelling pulses for a sail at
// screen (x, y), scale, rotation
export function sailState(o) {
  const x = o.x === undefined ? SAIL.cx : o.x, y = o.y === undefined ? SAIL.cy : o.y;
  const s = o.size === undefined ? 1 : o.size, rot = o.rot || 0, glow = o.glow === undefined ? 1 : o.glow;
  const beam = o.beam === undefined ? 1 : o.beam, ba = o.beamAng === undefined ? 0.35 : o.beamAng;
  const ph = o.ph === undefined ? sailPhase(o) : o.ph, z0 = o.z0 || 0;
  const piv = [SAIL.cx, SAIL.cy], d = { dx: x - SAIL.cx, dy: y - SAIL.cy, piv };
  const layers = {
    sail: Object.assign({ s, rot }, d),
    probe: Object.assign({ s, rot }, d),
    beam: Object.assign({ s, rot: ba, vw: 0.75 * beam, vl: 1.6 * beam }, d),
  };
  // the beam's hit point: a light just behind the tissue; it drifts a little as the membrane moves
  const hx = x + s * 7 * Math.sin(0.8 * ph), hy = y + s * 6 * Math.cos(0.6 * ph);
  const light = { x: hx, y: hy, z: z0 - 26, r: 6, I: 5.2e4 * glow * s * s * (1 + 0.04 * Math.sin(1.3 * ph)), a: 120 * s, f: 900 * s };
  // two pulses of light climbing the beam into the sail
  const dir = [-Math.sin(ba), Math.cos(ba)], fills = [];
  for (let j = 0; j < 2; j++) {
    const D = 50 + 1150 * (((-0.24 * ph + j / 2) % 1) + 1) % 1;
    const near = smooth(40, 220, D) * (1 - smooth(900, 1200, D));
    fills.push({ x: x + dir[0] * D * s, y: y + dir[1] * D * s, z: z0 - 58, I: 900 * beam * s * s * near, a: 26 * s, f: 240 * s, h: 0 });
  }
  return { layers, light, fills, ph };
}

export function sailScene(o = {}) {
  return {
    name: 'sail',
    world: { x0: 560, y0: 300, w: 800, h: 2000 },
    layers: sailLayers(o),
    sky: { top: '#07080E', hor: '#0E1120', horY: 1080 },
    light: { x: 960, y: 540, z: -26, r: 6, I: 5.2e4, a: 120, f: 900 },
    hazeW: 1.2e-5,
    params: { arim: 0.05, ha: 0, hm: 0 },
    cam: { Zc: 2400, zref: 0 },
  };
}

// The standalone element for S30: the sail crossing the pinhole dark.
export function createSail(canvas, opts = {}) {
  const E = createPaper(canvas, sailScene(), { k: opts.k || 1, log: opts.log });
  function render(o = {}) {
    const { layers, light, fills, ph } = sailState(o);
    const off = o.off || [0, 0];
    const pins = [];
    if (o.sun) pins.push([o.sun[0] + off[0], o.sun[1] + off[1], 1.7, 1.25]);
    E.frame({
      pose: { unfurl: o.unfurl === undefined ? 1 : clamp(o.unfurl, 0, 1), ph },
      layers, light, fills,
      sky: { space: 1, starD: 0.05, starB: 1, off, pins },
      post: { fade: o.fade === undefined ? 1 : o.fade },
    });
  }
  return { render, engine: E, gl: E.gl, sync: E.gpuSync };
}
