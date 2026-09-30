// The biolab set (S20): a tray of vials under a lab hood, cut from card. One vial is vellum;
// when it begins to glow, it is the only warm light, and it throws the other vials' shadows up
// the hood's back panel (the lab's giant-shadow idea, at bench scale). The hood's own light is a
// dim cool strip; a cool airflow LED sits on the frame.
import { S2, lin, lerp, mulberry32, PAPER } from './kit.js';

export const LAB = { floor: 772, cx: 960, glowX: 1022, vialTop: 452, vialBot: 752, w: 40, dx: 64 };
// revision 8: the vials' x and tops, fixed (both the vials and the doses layer use them)
export const XS = [-4, -3, -2, -1, 0, 1, 2, 3].map((k) => LAB.glowX + (k - 1) * LAB.dx);
export const TOPS = (() => { const r = mulberry32(4242); return XS.map((x, i) => LAB.vialTop + ((i * 5) % 3) * 9 + r() * 10); })();

function vial(cx, top, bot, w) {
  // a test tube: straight sides, round bottom
  const r = w / 2, pts = [[cx - r, top], [cx + r, top]];
  for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; pts.push([cx + r * Math.cos(a), bot - r + r * Math.sin(a)]); }
  return pts;
}
export function biolabScene(o = {}) {
  const S = { name: 'biolab' };
  S.world = { x0: -100, y0: -80, w: 2120, h: 1240 };
  S.light = { x: LAB.glowX, y: 640, z: 44, r: 3.5, I: 0, a: 70, f: 1400 };
  S.hazeW = 5.5e-5;
  S.params = { arim: 0.1, hm: 1.2e-5, rim: 1.5 };
  S.cam = { Zc: 2000, zref: 10, c: [LAB.glowX, 620] };
  S.hazeBack = 60; S.hazeFront = 120;
  const L = S.layers = [];
  const add = l => L.push(l);
  const COOL = lin('#9FB3D9');
  // ---- the lab wall around the hood
  add({ name: 'room', z: -420, col: PAPER.slate, alb: 0.5, ao: 0, em: COOL.map(v => v * 0.6), draw: (m, rnd) => {
    m.card(S2.rect(-140, -140, 2200, 1400), 0);
    for (const y of [300, 470]) m.card(S2.rect(1700, y, 300, 7), 0.4);
    let x = 1712; for (let i = 0; i < 9; i++) { const w = 12 + rnd() * 16, h = 30 + rnd() * 50; m.card(i % 3 === 2 ? S2.rrect(x, 300 - h, w + 8, h, 6) : S2.rect(x, 300 - h, w, h), 0.4); x += w + 6 + rnd() * 10; }
  } });
  // ---- the hood interior: back panel with baffle slots, the cool light strip
  add({ name: 'back', z: -210, col: PAPER.dusk, alb: 0.85, ao: 0.3, cast: 0, em: COOL.map(v => v * 0.55), vel: COOL.map(v => v * 0.05), draw: (m, rnd) => {
    m.card(S2.rect(250, 150, 1420, 640), 0.4);
    for (const y of [214, 232, 250]) m.cut(S2.rect(420, y, 1080, 4), 0.3);
    for (const y of [712, 726]) m.cut(S2.rect(420, y, 1080, 3.5), 0.3);
    // a service valve and a bracket
    m.card(S2.rect(420, 540, 26, 60), 0.3); m.card(S2.rect(436, 560, 44, 8), 0.2); m.card(S2.ellipse(470, 548, 9, 9), 0.3);
    m.card(S2.rect(1390, 420, 8, 200), 0.3); m.card(S2.rect(1360, 420, 70, 8), 0.3);
    // the hood's own light: a dim cool strip
    m.cut(S2.rect(420, 166, 1080, 12), 0.3); m.vel(S2.rect(420, 166, 1080, 12), 0.5, 0.3);
  } });
  // ---- side walls in false perspective, and the work surface
  add({ name: 'sides', z: -120, col: PAPER.slate, alb: 0.7, ao: 0.4, draw: (m, rnd) => {
    m.card([[160, 100], [300, 150], [300, 790], [160, 820]], 0.4);
    m.card([[1760, 100], [1620, 150], [1620, 790], [1760, 820]], 0.4);
    m.card([[160, 100], [1760, 100], [1620, 150], [300, 150]], 0.4);
  } });
  add({ name: 'floor', z: -60, col: PAPER.slate, kind: 1, alb: 0.9, ao: 0.4, draw: (m, rnd) => {
    m.card([[300, LAB.floor - 20], [1620, LAB.floor - 20], [1760, 860], [160, 860]], 0.4);
  } });
  // ---- props at the back of the surface: a flask, a bottle, a pipette stand
  add({ name: 'props', z: -90, col: PAPER.deep, alb: 0.5, ao: 0.45, cast: 1, rimk: 1.3, draw: (m, rnd) => {
    m.card([[430, 762], [510, 762], [490, 706], [482, 640], [458, 640], [450, 706]], 0.4);
    m.card(S2.rrect(1420, 650, 64, 114, 9), 0.4); m.card(S2.rect(1436, 620, 32, 34), 0.3);
    m.card(S2.rect(560, 470, 7, 294), 0.3); m.card(S2.rect(536, 758, 70, 9), 0.3); m.card(S2.rect(560, 520, 96, 6), 0.2);
    m.card([[648, 525], [656, 525], [655, 680], [652, 696], [649, 680]], 0.2);
  } });
  // ---- the vials: card tubes and one vellum tube (the light sits just in front of it)
  add({ name: 'vials', z: 10, col: PAPER.deep, alb: 0.12, ao: 0.4, cast: 1, thin: 0.3, rimk: 2.4, vel: lin('#2D3656').map(v => v * 0.7), vw: 0, vl: 0, seed: 3, draw: (m, rnd) => {
    XS.forEach((x, i) => {
      const top = TOPS[i], w = LAB.w;
      if (x === LAB.glowX) {
        // the vellum vial: the liquid is denser tissue than the glass above it (open: no cap, so
        // the knot's light can pour in)
        m.vel(vial(x, top, LAB.vialBot, w), 0.5, 0.4);
        m.vel(vial(x, top + 80, LAB.vialBot, w - 5), 0.5, 0.4);
        if (!o.open) m.card(S2.rrect(x - 24, top - 26, 48, 28, 6), 0.3);
        else m.card(S2.rect(x - w / 2 - 3, top - 3, w + 6, 5), 0.2);                 // its lip
        return;
      }
      m.card(vial(x, top, LAB.vialBot, w), 0.4);
      m.card(S2.rrect(x - 24, top - 26, 48, 28, 6), 0.3);
    });
  } });
  // ---- revision 8, opt-in: the other vials' liquid as timed warm pinholes (people making it at
  //      scale: they light one after another as the layer's clock passes each one's code)
  if (o.doses) add({ name: 'doses', z: 11, col: PAPER.deep, timed: 0.03, ew: 2.2, ef: 0.4, draw: (m) => {
    XS.forEach((x, i) => { if (x !== LAB.glowX) m.timed(vial(x, TOPS[i] + 80, LAB.vialBot - 3, LAB.w - 9), o.doses[i], 0.8); });
  } });
  // ---- the rack: a punched top plate and legs, in front of the vials (and of the light)
  add({ name: 'rack', z: 52, col: PAPER.deep, alb: 0.5, ao: 0.5, cast: 1, rimk: 1.6, draw: (m, rnd) => {
    const x0 = XS[0] - 58, x1 = XS[XS.length - 1] + 58;
    m.card(S2.rrect(x0, 612, x1 - x0, 26, 5), 0.4);
    m.card(S2.rrect(x0, 706, x1 - x0, 20, 5), 0.4);
    for (const x of [x0 + 6, x1 - 24]) m.card(S2.rect(x, 612, 18, LAB.floor - 612), 0.3);
    m.card(S2.rect(x0 - 6, LAB.floor - 12, x1 - x0 + 12, 14), 0.3);
  } });
  // ---- the hood's frame and sash (nearest, soft), with the airflow LED
  add({ name: 'frame', z: 170, col: PAPER.ink, alb: 0.4, ao: 0.4, def: 0.55, rimk: 1.0, em: COOL.map(v => v * 1.2), draw: (m, rnd) => {
    m.card(S2.rect(-140, -140, 2200, 250), 0.5);
    m.card(S2.rect(-140, 870, 2200, 400), 0.5);
    m.card(S2.rect(-140, -140, 250, 1400), 0.5);
    m.card(S2.rect(1810, -140, 330, 1400), 0.5);
    m.card(S2.rect(110, 236, 1700, 34), 0.4);                                     // the raised sash rail
    m.card(S2.rect(110, 270, 14, 600), 0.3); m.card(S2.rect(1796, 270, 14, 600), 0.3);
    m.card(S2.rect(110, 840, 1700, 30), 0.4);                                     // the airfoil sill
    m.card(S2.rrect(1840, 380, 60, 90, 6), 0.4);
    m.cut(S2.ellipse(1870, 400, 3.2, 3.2), 0); m.emit(S2.ellipse(1870, 400, 3.2, 3.2), 1);
  } });
  return S;
}

// glow: 0 dark .. 1 working. The vellum vial glows by itself; the light inside it lights the hood.
export function biolabState(o) {
  const g = Math.max(0, o.glow), b = o.breath || 1;
  return {
    layers: { vials: { vw: 3.2 * g * b } },
    light: { I: 4.4e4 * g * b },
  };
}
