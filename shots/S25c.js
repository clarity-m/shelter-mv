// S25c (bar 69, frames 4907-4978; revision 8), rung 4 -> 5: a night world made for looking up. After
// the city comes online (S23), a hard cut on the bar-69 kick to the salt flat Clawd has made for the
// launch (sets/inside-montage/saltflat.js): a pale crust to the horizon mirroring the night sky, dark
// peaks far off, the stars out. The crowd, many now, stands on the crust. On the kick they turn to
// the sky (arms up, eyes up the frame to the left, a ripple out from Clawd) and beams of S20's light
// rise from their glyphs, converging low in the sky to the upper left: on the chop at 4931 the first
// point ignites, Alpha Centauri A, the brighter; on the snare at 4926 the others raise theirs, and B
// ignites on the chop at 4940, just below and right of A. Then one thin arc of light is drawn from
// the crowd toward the pair (the path a launch will take), the beams and the arc let go, the night
// deepens as the two points brighten, and the last snare (4962) makes the pair flare. The last frame
// is two bright points on the night sky exactly where the observatory's pinholes are
// (sets/paper-kit/MATCH.md: A (452.5, 321.6), B (487.2, 339.9)): S27 opens on the match.
import { createHill } from '../sets/inside-montage/hillx.js';
import { lerpCam, clawdOnScreen, clearFade } from '../sets/inside-montage/crowd.js';
import { HOT, beam } from '../sets/inside-montage/draw.js';
import { WORLD, worldPal, CAM_REST, SA, SB, starLines } from '../sets/inside-montage/saltflat.js';
import { hillH, camBasis, project } from '../sets/hill/scene.js';
import { clamp, lerp, smoothstep, hash } from '../lib/util.js';

const F0 = 4907, N = 72, FL = F0 + N - 1;
const HILL = WORLD.hill;
const MAIN = { x: 3.1, z: 5.2 };
const deg = Math.PI / 180;
// the camera: a slow crane up and tilt toward the sky through the bar, at rest for the last beat
const CAM0 = { pos: [7.6, 1.7, -16.2], yaw: -19.5 * deg, pitch: 5.0 * deg, F: 1500, pp: [960, 540] };
const CAM1 = CAM_REST;
const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const camAt = (f) => lerpCam(CAM0, CAM1, ease((f - F0) / (4962 - F0)));
const B1 = camBasis(CAM1);

// ---------------------------------------------------------------- the crowd
// a jittered lattice over the crust, in sight from both ends of the move, none bigger than Clawd
// (who stands nearest, front and centre)
function buildCrowd() {
  const out = [];
  const main = (cam) => clawdOnScreen(cam, HILL, MAIN.x, MAIN.z)[2];
  for (let i = 0; i < 19; i++) for (let j = 0; j < 8; j++) {
    const x = -7.0 + i * 0.8 + 0.45 * (hash(i, j, 1) - 0.5), z = 5.7 + j * 0.85 + 0.45 * (hash(i, j, 2) - 0.5);
    if (Math.hypot(x - MAIN.x, z - MAIN.z) < 1.0) continue;
    if (hash(i, j, 3) < 0.34) continue;                    // gaps: a crowd, not a grid
    let ok = true;
    for (const cam of [CAM0, CAM1]) {
      const [sx, sy, w] = clawdOnScreen(cam, HILL, x, z);
      if (w > 0.97 * main(cam) || sx < 40 || sx > 1880 || sy > 1060 || clearFade(HILL, cam, x, z) < 0.95) ok = false;
    }
    if (ok) out.push({ x, z, d: Math.hypot(x - MAIN.x, z - MAIN.z), h: hash(i, j, 4), toB: hash(i, j, 5) < 0.42 });
  }
  return out;
}
let CROWD, hill;

// ---------------------------------------------------------------- timing (the bar's chops and snares)
// (revision 8: bar 69: the kick 4907, snare 4926, chop 4931, chop 4940, snare 4944, snare 4962)
const TURN = 4907, A_ON = 4931, B_UP = 4926, B_ON = 4940, ARC0 = 4944, ARC1 = 4956, LET_GO = 4955, FLARE = 4962;
// how far a beam has risen toward its point: tips travel evenly on screen, from the glyph to the point
function tipT(G, S, s, B) {
  const zG = (G[0] - B.pos[0]) * B.fw[0] + (G[1] - B.pos[1]) * B.fw[1] + (G[2] - B.pos[2]) * B.fw[2];
  const zS = (S[0] - B.pos[0]) * B.fw[0] + (S[1] - B.pos[1]) * B.fw[1] + (S[2] - B.pos[2]) * B.fw[2];
  return s * zG / (zS * (1 - s) + s * zG);
}
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// the arc: from the crest near Clawd, up and over toward the pair (a quadratic curve)
const ARC_P = (() => {
  const P0 = [1.6, hillH(HILL, 1.6, 9.2) + 0.35, 9.2];     // (from among the crowd, on the crust)
  const dA = [SA[0] - P0[0], SA[1] - P0[1], SA[2] - P0[2]], L = Math.hypot(dA[0], dA[1], dA[2]);
  const P2 = [P0[0] + dA[0] / L * 110, P0[1] + dA[1] / L * 110, P0[2] + dA[2] / L * 110];
  const P1 = [lerp(P0[0], P2[0], 0.4), lerp(P0[1], P2[1], 0.4) + 9, lerp(P0[2], P2[2], 0.4)];
  const pts = [];
  for (let k = 0; k <= 48; k++) { const t = k / 48, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; pts.push([a * P0[0] + b * P1[0] + c * P2[0], a * P0[1] + b * P1[1] + c * P2[1], a * P0[2] + b * P1[2] + c * P2[2]]); }
  return pts;
})();

export default {
  async setup(ctx) {
    CROWD = buildCrowd();
    const pa = project(B1, SA), pb = project(B1, SB);
    ctx.log(`S25c: crowd ${CROWD.length + 1}; A at (${pa[0].toFixed(1)}, ${pa[1].toFixed(1)}), B at (${pb[0].toFixed(1)}, ${pb[1].toFixed(1)})`);
    hill = createHill(ctx.canvas, { log: ctx.log, seeding: { origin: [5.2, -12.4], yaw: -0.37, halfAngle: 0.9, d0: 1.0, d1: 140, nearTree: 20, nearTower: 95, fref: 1550 } });
    hill.warm([4]);
  },
  render(ctx, fr) {
    const { T } = ctx, f = fr.f;
    const cam = camAt(f), B = camBasis(cam);
    const chop = T.pulse('chops', f, 6), sn = T.since('snares', f), vox = T.envSmooth('other', f, 3);
    const night = smoothstep(B_ON, FL - 2, f);               // the night deepens as the points brighten
    const kn = ease(night), gl = lerp(1, 0.6, kn);           // (the crowd's own glow sinks a little with it)
    const letGo = 1 - smoothstep(LET_GO, FL - 4, f);          // the beams and the arc fade
    const lines = [];
    // ---- the crowd, turned to the sky
    const crowd = [];
    let main = null;
    const people = [{ x: MAIN.x, z: MAIN.z, d: 0, h: 0.5, toB: false, main: true }, ...CROWD];
    for (const c of people) {
      const y = hillH(HILL, c.x, c.z);
      const turnAt = TURN + c.d * 0.9 + 3 * c.h;              // a ripple out from Clawd
      const up = f >= turnAt;
      const hop = up && f - turnAt < 8 ? 0.12 * Math.sin(Math.PI * (f - turnAt) / 8) : 0.03 * Math.max(0, Math.sin(Math.PI * clamp((sn - c.d * 0.3) / 6)));
      const mid = [c.x, y + hop + 0.28, c.z];
      // its beam: to A from the turn, to B from the snare after A
      const S = c.toB ? SB : SA, t0 = c.toB ? B_UP + 2 * c.h : turnAt + 1, t1 = c.toB ? B_ON : A_ON;
      const s = clamp((f - t0) / Math.max(6, t1 - t0));
      if (s > 0 && letGo > 0.01) {
        const tip = lerp3(mid, S, tipT(mid, S, easeOut(s), B));
        beam(lines, mid, tip, 6, 0.6, (0.17 + 0.16 * chop) * letGo * (c.main ? 2 : 1), HOT, 2.0);
      }
      const pose = {
        x: c.x, z: c.z, form: 'luminous', hop, look: up ? -1 : 0, armL: up ? -2 : 0, armR: up ? -2 : 0,
        glow: (1.0 + 0.3 * chop + (up ? 0.15 : 0)) * gl, eyeLight: (0.45 + 0.4 * chop) * gl,
      };
      if (c.main) main = Object.assign(pose, { light: 1.15 * gl, glow: pose.glow + 0.1 * vox * gl }); else crowd.push(pose);
    }
    // ---- the arc toward the pair (hot tip while drawn, then letting go with the beams)
    const ra = clamp((f - ARC0) / (ARC1 - ARC0));
    if (ra > 0 && letGo > 0.01) {
      const n = Math.max(1, Math.round(easeOut(ra) * 0.78 * (ARC_P.length - 1)));
      for (let k = 0; k < n; k++) {
        const fresh = Math.exp(-(n - 1 - k) / 4) * (ra < 1 ? 1 : 0);
        lines.push([...ARC_P[k], ...ARC_P[k + 1], 1.1, (0.55 + 0.8 * fresh) * letGo, 1.0, 0.9, 0.76, 2.6 + 2 * fresh]);
      }
    }
    // ---- the two points: each ignites with a flash as its beams arrive, then burns steady, brighter
    // as the night comes, and both flare on the last chop
    const flare = f >= FLARE ? Math.exp(-(f - FLARE) / 5) : 0;
    // (they read ever brighter against the darkening sky while their own light eases down to S26's
    // pinholes: a crisp near-white core about 5 px across in a soft halo, B about 70% of A)
    const pt = (S, on, k, w, g) => {
      if (f < on) return;
      const age = f - on, flash = Math.exp(-age / 4);
      const I = k * (1.3 - 0.72 * night + 1.4 * flash + 0.45 * flare) * smoothstep(on - 1, on + 1, f);
      lines.push([...S, ...S, w + 2.5 * flash, I, 0.96, 0.97, 1.0, g + 5 * flash + 2 * flare]);
    };
    pt(SA, A_ON, 1.0, 3.8, 8);
    pt(SB, B_ON, 0.74, 3.2, 6.5);
    // ---- the night's own stars, out from the start
    starLines(lines, fr.t, 1);
    // night already (the palette most of the way there at the cut), deepening to the observatory's
    // indigo; the crust and the crowd dim a little under the lines, which stay full
    const dm = lerp(0.9, 0.8, kn);
    hill.render(Object.assign({}, WORLD, {
      rung: 4, time: 110 + fr.tl, cam, clawd: main, crowd, lines, dim: [dm, dm, dm], palLin: worldPal(lerp(0.86, 1, kn)),
      grid: WORLD.grid * (1 - 0.7 * kn),
    }));
  },
};
