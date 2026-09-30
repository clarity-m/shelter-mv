// The observatory set (S26): a paper observatory on a ridge at night. The dome's slit faces low
// in the west, toward Alpha Centauri A and B (two bright cool pinholes). A warm light inside the
// dome (behind the dome card) spills through the slit as it opens: the haze between the dome and
// the camera catches a soft shaft that points up the slit's line toward the two stars.
import { S2, lin, lerp, clamp, mulberry32, PAPER } from './kit.js';

// stars (sky coordinates): revision 3 spreads A and B a little so they read as two points in the
// match cut from S25c (MATCH.md); A is the brighter
export const OBS = { cx: 1330, cy: 596, R: 128, base: 718, slitA: -150 * Math.PI / 180, stars: [[466, 326], [500, 344]] };
const r2 = v => Math.round(v * 200) / 200;

// the slit: a band along one meridian of the dome, turned toward the camera and to the left
// (azimuth PSI), from near the horizon up past the zenith; w = its opening in px
const PSI = -58 * Math.PI / 180;
function slitBand(w, e0 = 6, e1 = 96) {
  const { cx, cy, R } = OBS, C = [];
  for (let i = 0; i <= 28; i++) { const e = lerp(e0, e1, i / 28) * Math.PI / 180; C.push([cx + R * Math.cos(e) * Math.sin(PSI), cy - R * Math.sin(e)]); }
  const L = [], Rr = [];
  C.forEach((p, i) => {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const hw = w / 2 * (0.75 + 0.25 * Math.cos(lerp(e0, e1, i / 28) * Math.PI / 180));
    L.push([p[0] - ty * hw, p[1] + tx * hw]); Rr.push([p[0] + ty * hw, p[1] - tx * hw]);
  });
  return L.concat(Rr.reverse());
}
export function obsScene(o = {}) {
  const S = { name: 'observatory' };
  S.world = { x0: -120, y0: -100, w: 2160, h: 1280 };
  S.sky = { top: '#141A2E', hor: '#2E3A62', horY: 820 };
  S.light = { x: OBS.cx + 10, y: OBS.cy - 40, z: -46, r: 10, I: 0, a: 70, f: 1100 };
  S.hazeW = 0.7e-4;
  S.params = { arim: 0.14, hm: 1.2e-5, rim: 1.4 };
  S.cam = { Zc: 2400, zref: 0, c: [1100, 560] };
  S.hazeBack = 120; S.hazeFront = 420;
  S.moon = { dir: [-0.35, 0.5, 1], I: 0.25, disc: [0, 0, 0] };
  const L = S.layers = [];
  const add = l => L.push(l);
  const ridge = (m, pts) => m.card([[-160, 1300]].concat(pts, [[2100, 1300]]), 0.6);
  // the far ridge. Revision 7 (cumulative light): the valley below it holds the lit city, warm
  // window pinpricks with the reactor's glow among them (a separate rng: the ridge is unchanged)
  add({ name: 'far', z: -640, col: PAPER.far, ao: 0.2, ew: 0, ef: 0.3, draw: (m, rnd) => {
    const p = []; for (let x = -160; x <= 2100; x += 30) p.push([x, 770 - 60 * Math.sin(x / 380 + 0.5) - 26 * Math.sin(x / 140 + 1.1) - 18 * rnd()]); ridge(m, p);
    const R = mulberry32(7070);
    const yf = (x) => 770 - 60 * Math.sin(x / 380 + 0.5) - 26 * Math.sin(x / 140 + 1.1);   // far ridge line (highest case)
    const ym = (x) => 830 - 40 * Math.sin(x / 300 + 2.0) - 14 * Math.sin(x / 90);          // the mid ridge in front
    for (let i = 0; i < 110; i++) {
      const town = R() < 0.65, x = town ? 430 + (R() + R() + R() - 1.5) * 230 : 60 + R() * 780;
      const lo = yf(x) + 10, hi = ym(x) - 16;
      if (hi - lo < 6) continue;
      const y = lo + (hi - lo) * (0.3 + 0.7 * R()), r = 1.0 + 0.8 * R();
      const e = S2.ellipse(x, y, r, r * 0.9, 0, 10);
      m.cut(e, 0); m.emit(e, 0.35 + 0.65 * R(), 0);
    }
    const rx = 640, ry = yf(640) + 30;                                                        // the reactor, far off
    m.soft(34, () => m.emit(S2.ellipse(rx, ry - 6, 58, 20), 0.14));
    m.soft(8, () => m.emit(S2.ellipse(rx, ry - 3, 16, 7), 0.45));
    m.emit(S2.ellipse(rx, ry, 5, 1.6, 0, 16), 1.0, 0);
  } });
  add({ name: 'mid', z: -400, col: PAPER.dusk, ao: 0.3, em: lin('#9FB3D9').map(v => v * 0.6), draw: (m, rnd) => {
    const p = []; for (let x = -160; x <= 2100; x += 26) p.push([x, 830 - 40 * Math.sin(x / 300 + 2.0) - 14 * Math.sin(x / 90) - 10 * rnd()]); ridge(m, p);
    for (let i = 0; i < 7; i++) { const x = 180 + rnd() * 500, y = 850 + rnd() * 30; m.cut(S2.ellipse(x, y, 1.5, 1.5), 0); m.emit(S2.ellipse(x, y, 1.5, 1.5), 0.5 + 0.5 * rnd()); }
  } });
  // inside the dome: its back wall (lit by the lamp) and the telescope on its pier
  add({ name: 'inside', z: -70, col: PAPER.dusk, alb: 0.11, ao: 0.2, cast: 1, bound: 1, draw: (m, rnd) => {
    m.card(S2.ellipse(OBS.cx, OBS.cy, OBS.R - 4, OBS.R - 4), 0.2);
    m.card(S2.rect(OBS.cx - OBS.R + 4, OBS.cy, 2 * OBS.R - 8, OBS.base - OBS.cy), 0.2);
  } });
  add({ name: 'scope', z: -24, col: PAPER.ink, alb: 0.3, ao: 0.4, cast: 1, thin: 0.3, rimk: 2.2, bound: 1, draw: (m, rnd) => {
    const a = OBS.slitA, c = [OBS.cx + 10, OBS.cy + 10], d = [Math.cos(a), Math.sin(a)];
    m.card(S2.bar([c[0] - d[0] * 40, c[1] - d[1] * 40], [c[0] + d[0] * 112, c[1] + d[1] * 112], 28), 0.3);
    m.card(S2.bar([c[0] + d[0] * 94, c[1] + d[1] * 94], [c[0] + d[0] * 118, c[1] + d[1] * 118], 36), 0.2);
    m.card(S2.rect(c[0] - 9, c[1], 18, OBS.base - c[1]), 0.3);
    m.card(S2.rect(c[0] - 26, c[1] + 4, 52, 12), 0.2);
  } });
  // the building: drum and dome, the slit cut by the shutters' opening
  add({ name: 'dome', z: 0, col: PAPER.slate, alb: 0.8, ao: 0.45, cast: 1, rimk: 1.3, thin: 0.12, key: pose => 'S' + r2(pose.open || 0), seed: 6, draw: (m, rnd, pose) => {
    const { cx, cy, R, base } = OBS, open = pose.open || 0;
    m.card(S2.arc(cx, cy, R, R, Math.PI, 2 * Math.PI, 64).concat([[cx + R, cy + 2], [cx - R, cy + 2]]), 0.4);
    m.card(S2.rect(cx - R - 8, cy, 2 * R + 16, 10), 0.3);
    m.card(S2.rect(cx - R + 2, cy + 8, 2 * R - 4, base - cy - 6), 0.4);
    m.cut(S2.rect(cx + 40, base - 58, 30, 54), 0.3);                                       // the door (light leaks round it)
    m.card(S2.rect(cx + 42, base - 56, 26, 52), 0.2);
    // the slit's seam runs over the dome; its middle section opens (the telescope looks low)
    m.cut(slitBand(2.2, 4, 98), 0);
    if (open > 0.002) m.cut(slitBand(44 * open, 18, 74), 0.3);
    const sh = 44 * open;
    m.card(slitBand(9, 18, 74).map(([x, y]) => [x + sh * 0.32, y - sh * 0.08]), 0.2);   // the shutter leaf, pushed aside
  } });
  add({ name: 'spill', z: 20, col: PAPER.deep, alb: 0, ao: 0, ew: 0, ef: 0.25, draw: (m, rnd) => {
    const e = 46 * Math.PI / 180, S0 = [OBS.cx + OBS.R * Math.cos(e) * Math.sin(PSI), OBS.cy - OBS.R * Math.sin(e)];
    const T = [(OBS.stars[0][0] + OBS.stars[1][0]) / 2, (OBS.stars[0][1] + OBS.stars[1][1]) / 2];
    const dx = T[0] - S0[0], dy = T[1] - S0[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const at = (t, w) => [[S0[0] + ux * len * t + nx * w, S0[1] + uy * len * t + ny * w], [S0[0] + ux * len * t - nx * w, S0[1] + uy * len * t - ny * w]];
    m.soft(44, () => {
      const segs = 16;
      for (let k = 0; k < segs; k++) {
        const t0 = 0.02 + 0.86 * k / segs, t1 = 0.02 + 0.86 * (k + 1) / segs + 0.01;
        const w0 = 18 + 150 * t0, w1 = 18 + 150 * t1, v = 0.55 * Math.pow(1 - t0, 2.2);
        const a = at(t0, w0), b = at(t1, w1);
        m.emit([a[0], b[0], b[1], a[1]], v, 0);
      }
    });
    m.soft(14, () => { const a = at(0.0, 14), b = at(0.22, 44); m.emit([a[0], b[0], b[1], a[1]], 0.4, 0); });
  } });
  add({ name: 'ridge', z: 40, col: PAPER.deep, alb: 0.6, ao: 0.45, cast: 1, draw: (m, rnd) => {
    const p = []; for (let x = -160; x <= 2100; x += 22) { const u = (x - 1350) / 700; p.push([x, 722 + 260 * u * u * (u < 0 ? 0.55 : 1) + 8 * Math.sin(x / 37) + 4 * rnd()]); } ridge(m, p);
    // a path up to the door, a few rocks and a railing
    for (let i = 0; i < 12; i++) { const x = 1100 + rnd() * 500, u = (x - 1350) / 700, y = 712 + 260 * u * u; m.card(S2.ellipse(x, y + 4, 8 + rnd() * 16, 5 + rnd() * 6), 0.4); }
  } });
  add({ name: 'fg', z: 330, col: PAPER.ink, alb: 0.3, ao: 0.4, def: 0.85, draw: (m, rnd) => {
    const p = []; for (let x = -160; x <= 2100; x += 26) p.push([x, 1010 + 50 * Math.sin(x / 260 + 0.3) + 10 * Math.sin(x / 50)]); ridge(m, p);
    for (const [tx, s] of [[120, 1.2], [260, 0.9], [1800, 1.1]]) {
      const ty = 1010 + 50 * Math.sin(tx / 260 + 0.3);
      m.card([[tx - 3 * s, ty], [tx + 3 * s, ty], [tx + 1, ty - 260 * s], [tx - 1, ty - 260 * s]], 0.3);
      for (let k = 0; k < 9; k++) { const y = ty - 60 * s - k * 22 * s, w = (80 - k * 8) * s; m.card([[tx - w, y], [tx + w, y], [tx, y - 40 * s]], 0.4); }
    }
  } });
  return S;
}

export function obsState(o) {
  const open = clamp(o.open, 0, 1), g = o.glow === undefined ? open : o.glow;
  return {
    pose: { open },
    light: { I: 4.2e4 * g * (o.breath || 1) },
    layers: { spill: { ew: 0.62 * Math.pow(open, 1.2) * (o.breath || 1) }, far: { ew: o.city === undefined ? 1.35 : o.city } },
    fills: [{ x: OBS.cx + 55, y: OBS.base - 24, z: 30, I: 900 * g, a: 30, f: 200, h: 0.2 }],
  };
}
