// The launch set (S28, S29): a rocket beside its service tower at night, in cut paper.
// Warm light: the engines. The flame under the nozzles, the plume column and the exhaust
// billows are tissue; the main light rides the nozzles (shadows of the rocket and tower fall on
// the billows), a fill light burns in the flame trench. The sail (sail.js) rides in the fairing.
// World coords are the rest view (1920x1080, y down); the rocket's nozzle exit is at (1000, 826).
import { S2, lin, lerp, clamp, smooth, mulberry32, PAPER } from './kit.js';
import { sailLayers, SAIL } from './sail.js';

export const RK = { x: 1000, noz: 826, pad: 834, top: 196, fairBase: 318 };
export const PLUME = 900;
const r2 = v => Math.round(v * 200) / 200;

// the fairing halves: open = 0 closed .. 1 peeled away (each half hinges at its base corner)
function fairingShapes(open) {
  const cx = RK.x, yb = RK.fairBase, yt = RK.top, w = 36;
  const half = side => {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, y = lerp(yb, yt, t), x = cx + side * w * Math.pow(1 - t, 0.55) * (1 - 0.12 * t); pts.push([x, y]); }
    pts.push([cx, yt + 2], [cx, yb]);
    // hinge at the outer base corner; peel outward and fall back
    const hx = cx + side * w, hy = yb, a = side * open * 1.35, drop = open * open * 60, out = open * 50 * side;
    return pts.map(([x, y]) => { const dx = x - hx, dy = y - hy, c = Math.cos(a), s = Math.sin(a); return [hx + dx * c - dy * s + out, hy + dx * s + dy * c + drop]; });
  };
  return [half(-1), half(1)];
}

export function launchScene(o = {}) {
  const S = { name: 'launch' };
  S.world = { x0: -100, y0: -120, w: 2120, h: 1320 };
  S.sky = { top: '#1B2138', hor: '#34406A', horY: 760 };
  S.moon = { dir: [0.34, 0.46, 1], I: 0.42, disc: [0, 0, 0] };
  S.light = { x: RK.x, y: RK.noz + 14, z: 10, r: 12, I: 0, a: 110, f: 900 };
  S.hazeW = 7e-5;
  S.params = { arim: 0.14, hm: 2.5e-5 };
  S.cam = { Zc: 2400, zref: 0 };
  S.hazeFront = 600;
  const L = S.layers = [];
  const add = l => L.push(l);

  // ---- far land: low hills, a distant coast town (cool pinholes)
  add({ name: 'farHills', z: -700, col: PAPER.far, ao: 0.2, em: lin('#9FB3D9').map(v => v * 0.5), draw: (m, rnd) => {
    const pts = [[-140, 1250]];
    for (let x = -140; x <= 2060; x += 40) pts.push([x, 752 - 22 * Math.sin(x / 260 + 0.7) - 12 * Math.sin(x / 97 + 2.1) - (x > 1300 && x < 1700 ? 30 * Math.sin((x - 1300) / 400 * Math.PI) : 0)]);
    pts.push([2060, 1250]);
    m.card(pts, 0.5);
    for (let i = 0; i < 26; i++) { const x = 1330 + rnd() * 360, y = 752 - 10 - rnd() * 34 * Math.sin((x - 1300) / 400 * Math.PI); const h = S2.rect(x, y, 2.2, 2.6); m.cut(h, 0); m.emit(h, 0.3 + 0.7 * rnd()); }
    // revision 7, opt-in (S27's paper beats, S28): the lit city on the horizon, a town on the left
    // with the reactor's glow and more of the coast town on the right (warm when the shot sets
    // this layer's ew; a separate rng, so nothing above changes). S29 and S30 don't pass it.
    if (o.city) {
      const R = mulberry32(5150), hy = (x) => 752 - 22 * Math.sin(x / 260 + 0.7) - 12 * Math.sin(x / 97 + 2.1);
      for (let i = 0; i < 70; i++) {
        const left = i < 42, x = left ? 20 + R() * 390 : 1560 + R() * 300;
        const top = x > 1300 && x < 1700 ? hy(x) - 30 * Math.sin((x - 1300) / 400 * Math.PI) : hy(x);
        const y = top + 8 + R() * Math.max(4, 772 - top - 12), h = S2.rect(x, y, 2.0, 2.4);
        m.cut(h, 0); m.emit(h, 0.3 + 0.7 * R());
      }
      const rx = 250, ry = hy(250) + 16;
      m.soft(26, () => m.emit(S2.ellipse(rx, ry - 6, 46, 16), 0.12));
      m.soft(6, () => m.emit(S2.ellipse(rx, ry - 2, 12, 5), 0.4));
      m.emit(S2.ellipse(rx, ry, 4, 1.4, 0, 16), 0.9);
    }
  } });
  // ---- near land: flat scrub, lightning masts with their wires, a water tower
  add({ name: 'nearLand', z: -420, col: PAPER.dusk, ao: 0.3, em: lin('#9FB3D9').map(v => v * 0.8), draw: (m, rnd) => {
    const pts = [[-140, 1250]];
    for (let x = -140; x <= 2060; x += 24) pts.push([x, 790 - 4 * Math.sin(x / 61) - 3 * rnd()]);
    pts.push([2060, 1250]); m.card(pts, 0.5);
    for (const [mx, top] of [[560, 250], [1480, 280]]) {
      m.card([[mx - 5, 792], [mx + 5, 792], [mx + 1.5, top], [mx - 1.5, top]], 0.3);
      for (const dx of [-120, 120]) m.card(S2.ribbon(S2.cat([[mx, top + 6], [mx + dx * 0.5, top + 190], [mx + dx, 792]], false, 10), () => 1.1, [false, false]), 0);
      m.cut(S2.ellipse(mx, top - 3, 2.2, 2.2), 0); m.emit(S2.ellipse(mx, top - 3, 2.2, 2.2), 1);
    }
    // water tower
    m.card(S2.rrect(1640, 700, 44, 30, 8), 0.4); m.card(S2.rect(1646, 728, 4, 64), 0.2); m.card(S2.rect(1674, 728, 4, 64), 0.2);
    m.card(S2.bar([1648, 740], [1676, 780], 2), 0); m.card(S2.bar([1676, 740], [1648, 780], 2), 0);
    for (let x = -100; x < 2040; x += 30 + rnd() * 60) { const h = 6 + rnd() * 14; m.card(S2.ellipse(x, 792, 10 + rnd() * 16, h), 0.5); }
  } });

  // ---- the sail's beam (hidden until S29's last bar), then the tower
  const sl = sailLayers({ z0: 5 });
  add(sl[0]);
  add({ name: 'gantry', z: -40, col: PAPER.slate, alb: 0.75, ao: 0.4, cast: 1, rimk: 1.2, em: lin('#9FB3D9').map(v => v * 0.9),
    key: pose => 'A' + r2(pose.arms || 0), seed: 4, draw: (m, rnd, pose) => {
    const x0 = 800, x1 = 896, yT = 168, yB = RK.pad;
    // lattice: rails and X braces, drawn as card with triangular windows cut out
    m.card(S2.rect(x0, yT, x1 - x0, yB - yT), 0.4);
    const bay = 58, rw = 9, bw = 5;
    for (let y = yT + 12; y + bay <= yB - 4; y += bay) {
      const a = [x0 + rw, y], b = [x1 - rw, y], c = [x1 - rw, y + bay - bw], d = [x0 + rw, y + bay - bw], mid = [(x0 + x1) / 2, y + (bay - bw) / 2];
      const sh = (p, q) => { const k = 0.8; return [lerp(mid[0], p[0], k), lerp(mid[1], p[1], k)]; };
      for (const [p, q] of [[a, b], [b, c], [c, d], [d, a]]) {
        const tri = [sh(p), sh(q), [lerp(mid[0], (p[0] + q[0]) / 2, 0.22), lerp(mid[1], (p[1] + q[1]) / 2, 0.22)]];
        m.cut(tri, 0.3);
      }
    }
    // platforms and a crane jib at the top, a lightning rod
    for (let y = yT + 12 + bay * 2; y < yB - 60; y += bay * 3) m.card(S2.rect(x0 - 26, y - 4, x1 - x0 + 44, 7), 0.3);
    m.card(S2.rect(x0 + 40, 96, 6, yT - 96 + 2), 0.2);
    m.card(S2.bar([x0 + 43, 118], [x0 - 110, 150], 5), 0.2); m.card(S2.bar([x0 + 43, 104], [x0 - 110, 150], 2), 0);
    m.card(S2.bar([x0 - 104, 150], [x0 - 104, 214], 1.5), 0);
    for (const [lx, ly] of [[x0 + 43, 100], [x0 + 6, yT + 160], [x1 - 6, yT + 330], [x0 + 6, yT + 520]]) { m.cut(S2.ellipse(lx, ly, 2, 2), 0); m.emit(S2.ellipse(lx, ly, 2, 2), 0.9); }
    // swing arms to the rocket; they rotate up and back to retract
    const arms = pose.arms || 0;
    [[330, 0], [470, 0.15], [640, 0.3]].forEach(([ay, lag]) => {
      const u = clamp((arms - lag) / (1 - lag * 0.6), 0, 1), ang = -u * 1.25, hx = x1, hy = ay;
      const reach = RK.x - 30 - hx, rot = p => [hx + (p[0] - hx) * Math.cos(ang) - (p[1] - hy) * Math.sin(ang), hy + (p[0] - hx) * Math.sin(ang) + (p[1] - hy) * Math.cos(ang)];
      m.card([[hx, hy - 7], [hx + reach, hy - 5], [hx + reach, hy + 6], [hx, hy + 9]].map(rot), 0.3);
      m.card(S2.bar([hx, hy + 26], [hx + reach * 0.8, hy + 5], 3).map(rot), 0.1);
    });
  } });
  // ---- exhaust billows behind the pad (tissue lit by the engines)
  // exhaust billows: masses of overlapping puffs merged into one scalloped tissue cut each;
  // the masses nearer the trench are denser tissue (brighter G)
  const billows = (m, rnd, n, spread, y0, rMin, rMax, vmin) => {
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, u = Math.pow(rnd(), 0.9);
      const x = RK.x + side * (30 + spread * u), y = y0 - rnd() * (30 + 70 * u) + 26 * u * u;
      const r = lerp(rMin, rMax, rnd()) * (0.75 + 0.5 * u);
      m.velU(S2.ellipse(x, y, r, r * (0.78 + 0.2 * rnd()), rnd() * 3), vmin, 1.0);
    }
  };
  add({ name: 'cloudsBack', z: -20, col: PAPER.dusk, vel: lin('#212843').map(v => v * 1.1), vw: 0, vl: 1.0, ao: 0.3, seed: 8, draw: (m, rnd) => {
    billows(m, rnd, 22, 430, 846, 36, 92, 0.7);
  } });
  // ---- the rocket (core, two boosters, fins, nozzles) and its flame
  add({ name: 'rocket', z: 0, col: PAPER.deep, alb: 0.22, ao: 0.5, thin: 0.15, cast: 1, rimk: 1.4, vw: 0, bound: 1, draw: (m, rnd) => {
    const cx = RK.x;
    m.card(S2.rect(cx - 28, RK.fairBase - 2, 56, 800 - RK.fairBase + 2), 0.4);            // core
    m.card([[cx - 28, 800], [cx + 28, 800], [cx + 20, 816], [cx - 20, 816]], 0.3);        // boat-tail
    for (const nx of [-12, 0, 12]) m.card([[cx + nx - 4, 814], [cx + nx + 4, 814], [cx + nx + 6.5, RK.noz], [cx + nx - 6.5, RK.noz]], 0.2);
    for (const s of [-1, 1]) {
      const bx = cx + s * 46;
      m.card(S2.rect(bx - 15, 520, 30, 290), 0.4);
      m.card(S2.cat([[bx - 15, 522], [bx - 9, 492], [bx, 478], [bx + 9, 492], [bx + 15, 522]], false, 8).concat([[bx + 15, 530], [bx - 15, 530]]), 0.3);
      m.card([[bx - 10, 808], [bx + 10, 808], [bx + 8, RK.noz], [bx - 8, RK.noz]], 0.2);
      m.card([[bx + s * 15, 760], [bx + s * 34, 800], [bx + s * 34, 816], [bx + s * 15, 806]], 0.3);   // fin
      m.card(S2.rect(s > 0 ? bx - 15 - 17 : bx + 15, 560, 17, 5), 0.2); m.card(S2.rect(s > 0 ? bx - 15 - 17 : bx + 15, 760, 17, 5), 0.2);
      m.cut(S2.rect(bx - 15, 640, 30, 1.6), 0);
    }
    for (const y of [420, 560, 700]) m.cut(S2.rect(cx - 28, y, 56, 1.6), 0);             // stage seams
    // the flame: tissue under the nozzles (its glow is the layer's vw)
    m.soft(3, () => {
      for (const nx of [-46, -12, 0, 12, 46]) m.vel([[cx + nx - 7, RK.noz], [cx + nx + 7, RK.noz], [cx + nx + 3, RK.noz + 70], [cx + nx - 3, RK.noz + 70]], nx === 0 ? 0.6 : 0.45, 0);
      m.vel(S2.ellipse(cx, RK.noz + 30, 58, 30), 0.3, 0);
    });
  } });
  add(sl[1]);
  // ---- the plume column: authored 1000 px tall above the pad, stretched by sy as the rocket climbs
  // the plume column: authored PLUME px tall above the pad, stretched by sy as the rocket climbs
  add({ name: 'plume', z: 8, col: PAPER.deep, vel: lin('#2D3656').map(v => v * 0.5), vw: 0, vl: 0.8, ao: 0, bound: 1, seed: 9, draw: (m, rnd) => {
    const cx = RK.x, yb = RK.pad + 6, yt = yb - PLUME;
    m.soft(6, () => {
      for (const [wt, wb, v] of [[20, 70, 0.26], [44, 150, 0.16], [80, 260, 0.1]]) m.vel([[cx - wt / 2, yt + 8], [cx + wt / 2, yt + 8], [cx + wb / 2, yb], [cx - wb / 2, yb]], v, 0);
    });
    m.vel([[cx - 7, yt + 8], [cx + 7, yt + 8], [cx + 26, yb], [cx - 26, yb]], 0.12, 1.4);
    // puffs along the edges: exhaust tissue, not a beam
    for (let i = 0; i < 26; i++) { const t = rnd(), y = lerp(yt + 40, yb - 20, t), w = lerp(12, 110, t), side = rnd() < 0.5 ? -1 : 1; m.velU(S2.ellipse(cx + side * w * (0.3 + 0.4 * rnd()), y, 10 + 30 * t, 16 + 20 * t), 0.14, 0.8); }
  } });
  add({ name: 'fairing', z: 12, col: PAPER.deep, alb: 0.5, ao: 0.4, thin: 0.2, cast: 1, rimk: 1.5, bound: 1,
    key: pose => 'F' + r2(pose.fair || 0), seed: 5, draw: (m, rnd, pose) => {
    for (const h of fairingShapes(pose.fair || 0)) m.card(h, 0.3);
  } });
  add(sl[2]);
  // ---- the pad: the launch mount and the flame trench, the ground at its depth
  add({ name: 'pad', z: 40, col: PAPER.slate, alb: 0.8, ao: 0.45, cast: 1, rimk: 1.2, draw: (m, rnd) => {
    m.card([[700, RK.pad], [1300, RK.pad], [1330, 870], [1330, 1300], [670, 1300], [670, 870]], 0.5);
    m.cut([[936, 848], [1064, 848], [1072, 900], [928, 900]], 0.6);                       // the trench mouth
    for (const x of [960, 1000, 1040]) m.card(S2.rect(x - 3, 848, 6, 52), 0.3);
    m.card(S2.rect(-140, 896, 2200, 420), 0.5);                                           // the ground
    for (const x of [760, 1240]) { m.card(S2.rect(x - 4, 780, 8, 56), 0.2); m.card(S2.rect(x - 16, 776, 32, 6), 0.2); }
  } });
  add({ name: 'cloudsFront', z: 90, col: PAPER.dusk, vel: lin('#212843').map(v => v * 1.0), vw: 0, vl: 1.0, ao: 0.3, seed: 12, draw: (m, rnd) => {
    billows(m, rnd, 16, 480, 902, 40, 104, 0.8);
  } });
  // ---- foreground: dunes, grass and a fence, in soft focus
  add({ name: 'fg', z: 330, col: PAPER.ink, alb: 0.3, ao: 0.4, def: 0.9, rimk: 0.8, draw: (m, rnd) => {
    const pts = [[-160, 1300]];
    for (let x = -160; x <= 2080; x += 30) pts.push([x, 1010 - 40 * Math.sin(x / 300 + 0.4) - 18 * Math.sin(x / 90)]);
    pts.push([2080, 1300]); m.card(pts, 0.6);
    for (let i = 0; i < 70; i++) { const x = -120 + rnd() * 2160, y = 1000 - 40 * Math.sin(x / 300 + 0.4) + 10; const h = 20 + rnd() * 50, lean = (rnd() - 0.5) * 30; m.card(S2.ribbon(S2.bez([x, y + 10], [x, y - h * 0.4], [x + lean * 0.6, y - h * 0.8], [x + lean, y - h], 10), t => 4 * (1 - t) + 0.6, [false, true]), 0.2); }
    for (let x = 1250; x < 2100; x += 110) m.card(S2.rect(x, 900 - 0.06 * (x - 1250), 6, 140), 0.3);
    m.card(S2.ribbon(S2.line([1250, 915], [2100, 864]), () => 2), 0); m.card(S2.ribbon(S2.line([1250, 945], [2100, 894]), () => 2), 0);
  } });
  return S;
}

// Per-frame state of the launch set. o: { fl-independent values }
//   eng: engine power 0..1+, rise: px the rocket has climbed, arms 0..1, fair 0..1,
//   clouds: billow growth 0..1, plumeOn: 0..1, pulse: kick pulse 0..1, cam: {...}
//   sail: sailState() output merged in by the shot (or null to hide the sail)
export function launchState(o) {
  const rise = o.rise || 0, eng = o.eng || 0, cl = o.clouds || 0, pulse = o.pulse || 0, drop = o.drop || 0;
  const HIDE = { dx: 1e6 };
  const rk = { dy: -rise + drop };
  const flame = eng * (1 + 0.22 * pulse);
  const layers = {
    rocket: Object.assign({ vw: 2.2 * flame }, rk),
    fairing: { dy: -rise },
    plume: { sy: Math.max(rise + 14, 1) / PLUME, piv: [RK.x, RK.pad + 6], vw: 1.0 * (o.plumeOn || 0) * (1 + 0.3 * pulse), op: Math.min(1, 3 * (o.plumeOn || 0)) },
    cloudsBack: { s: 1 + 0.18 * cl, sx: 1 + 0.35 * cl, piv: [RK.x, 870], vw: 0.05 * eng },
    cloudsFront: { s: 1 + 0.12 * cl, sx: 1 + 0.4 * cl, piv: [RK.x, 910], vw: 0.04 * eng },
    sail: HIDE, probe: HIDE, beam: HIDE,
  };
  if (o.sail) Object.assign(layers, o.sail.layers);
  const light = { x: RK.x, y: RK.noz + 26 - rise + drop, z: 10, I: 5.5e4 * flame, r: 12, a: 110, f: 1100 };
  const padFire = Math.max(0, eng * (1 - smooth(150, 900, rise)));
  const fills = [{ x: RK.x, y: 880, z: 60, I: 4.5e4 * padFire * (1 + 0.15 * pulse), a: 140, f: 520, h: 1.0 }];
  if (o.fill2) fills.push(o.fill2);
  return { layers, light, fills, pose: { arms: o.arms || 0, fair: o.fair || 0, unfurl: o.unfurl === undefined ? 0 : o.unfurl } };
}
