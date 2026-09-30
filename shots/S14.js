// S14, drop 1 (bars 37-40): he runs the valley. Ground he has crossed turns painted and
// saturated; the ground ahead stays grey CG. Each stutter-stop (bars 37, 38, 40) resets the
// episode, unmistakably: the frame holds for a beat, then time runs backward and he zips back
// along his path to the pad in a streak, STEP rolls back to zero, and EPISODE pops large as a
// ring pulses from the pad. A faint orange ghost stays where each run ended, so every run is
// seen to get further (10 m, 25 m, 72 m). The paint is what he has learned, so it persists.
// Revision 14 (Claire: simplify drop 1; S11's eyes): cut 10's scene restored and calmed. The lens
// rides ahead of him on a smoothed path (a wide centred window, no jolts), sits higher and wider on
// the long third run, and after each rewind glides back to the pad calmly while he takes a beat:
// he lands, looks left, then right, blinks, and sets off (the eye beats). The last rewind is watched
// from where the run ended, the whole painted path between. Runs: 10.5 m, 25 m, 60 m.
import { makeStage, clamp, lerp, ss, easeInOut, easeOut } from '../sets/valley/shotkit.js';
import { drawHUD } from '../sets/valley/hud.js';
import { NEUTRAL, RUN, SQUASH, solidGrid } from '../sets/valley/clawd3d.js';
import { GRIDS } from '../sets/hill/clawd-pose.js';
import { PATH, pathAt } from '../sets/valley/terrain.js';

let St, EP, LEN;
const G = {}; for (const k of Object.keys(GRIDS)) G[k] = solidGrid(GRIDS[k]);
const STANDS = [8, 20, 20, 60];   // frames on the pad before each run (after a reset: his eye beat)
const standOf = (ep) => STANDS[Math.min(ep.i, 3)];
const GL = 10;                    // the lens glides back behind his rewind, arriving GL frames after him
const HOLD = 2;        // frames the stop holds before the rewind
const CLEAR_R = 3.6;   // props whose trunk comes this close to the lens (m) are left out of S14
// distance run by local time u in 0..1 of the running part of episode i
const PROFILE = [
  (u) => 10.5 * easeInOut(u),                                   // hesitant
  (u) => 25 * (0.35 * u * u + 0.65 * u),                        // steadier
  (u) => 60 * (u < 0.12 ? 0.5 * (u / 0.12) * (u / 0.12) * 0.12 : 0.06 + (u - 0.12) * (0.94 / 0.88)),   // confident
];

function episodeAt(f) { let e = EP[0]; for (const x of EP) if (f >= x.a) e = x; return e; }
function runDist(ep, ff) {
  if (ep.i >= PROFILE.length) return 0;
  const u = clamp((ff - ep.a - standOf(ep)) / (ep.b - ep.a - standOf(ep)));
  return PROFILE[ep.i](u);
}
// where he is at frame f: running, holding at the stop, rewinding to the pad, or standing
function stateAt(f) {
  const e = episodeAt(f);
  if (e.i < PROFILE.length && f >= e.b) {
    const k = f - e.b, dEnd = runDist(e, e.b);
    if (k < HOLD) return { e, dist: dEnd, dEnd, phase: 'hold', k };
    const r = easeInOut((k - HOLD + 1) / (LEN - HOLD));
    return { e, dist: dEnd * (1 - r), dEnd, phase: 'rewind', k, r };
  }
  const d = runDist(e, Math.min(f, e.b));
  return { e, dist: d, dEnd: d, phase: d > 0.01 ? 'run' : 'stand', k: 0 };
}
// camera: 3/4 front, riding ahead of him on his left, low enough to keep the valley and sky in
// the top third. Revision 14: calm. The lens follows a 'camera distance' along the path: his own,
// averaged over a wide centred window while he runs; after a rewind it does not zip back with him but
// eases back to the pad over BACK frames (the last rewind it watches from where it is).
function camDist(f) {
  const st = stateAt(f), e = st.e;
  // the reset in progress (this episode's, or the one that just ended): glide back behind him
  const r = e.i < PROFILE.length && f >= e.b ? e : e.i > 0 ? EP[e.i - 1] : null;
  if (r) {
    const dEnd = runDist(r, r.b), t = f - r.b - HOLD;
    if (r.i >= PROFILE.length - 1) return f >= r.b ? dEnd : Math.max(st.dist, dEnd);   // the last: watched from the end
    if (t < 0) return dEnd;
    if (t < LEN - HOLD + GL) return Math.max(st.phase === 'run' ? st.dist : 0, dEnd * (1 - easeInOut(t / (LEN - HOLD + GL))));
  }
  return st.dist;
}
function camXZ(f) {
  const st = stateAt(f);
  // a wide centred window over the camera distance, so it starts and stops softly (revision 15: across
  // episode boundaries too: the camera distance is continuous there, and splitting the window made the
  // lens snap back to him on the first frame of each new episode)
  let dsum = 0, wsum = 0;
  for (let k = -9; k <= 9; k++) {
    const s2 = stateAt(f + k);
    const w = 10 - Math.abs(k); dsum += w * camDist(f + k); wsum += w;
  }
  const dist = dsum / wsum, q0 = pathAt(dist);
  const cx = q0.x, cz = q0.z;
  const hd = 0.5 * pathAt(Math.max(0, dist)).heading;
  const wide = ss(8, 40, dist);                             // higher and wider the further he gets
  const fwd = [Math.sin(hd), 0, Math.cos(hd)], side = [Math.cos(hd), 0, -Math.sin(hd)];
  const off = { f: lerp(6.2, 8.0, wide), s: lerp(-4.6, -6.0, wide), u: lerp(1.55, 2.4, wide) };
  return { x: cx + fwd[0] * off.f + side[0] * off.s, z: cz + fwd[2] * off.f + side[2] * off.s, cx, cz, fwd, side, off, wide };
}
const poseAt = (d) => (d > 0.01 ? RUN[Math.floor(d / 0.26) % 4] : NEUTRAL);

export default {
  async setup(ctx) {
    const s = ctx.shot, T = ctx.T;
    LEN = T.data().events.stop_len;
    const stops = T.events('stops').filter((x) => x >= s.f0 && x < s.f1);
    EP = [];
    let a = s.f0;
    stops.forEach((b, i) => { EP.push({ a, b, i }); a = b + LEN; });
    EP.push({ a, b: s.f1 + 200, i: EP.length });
    // the lens's exact path over the shot: any prop within CLEAR_R of it is left out, so nothing
    // sweeps past the camera; everything else stays as in S13 and S15
    const clear = [];
    for (let f = s.f0; f < s.f1; f++) { const c = camXZ(f); clear.push([c.x, c.z, CLEAR_R]); }
    St = makeStage(ctx, { clear });
    ctx.log(`S14 episodes: ${EP.map((e) => e.a + '-' + e.b).join(' ')}`);
  },
  render(ctx, fr) {
    const { T } = ctx, s = ctx.shot, f = fr.f;
    const st = stateAt(f), e = st.e, dist = st.dist;
    // paint: the furthest he has reached so far persists across resets (and through the rewind)
    let reach = st.dEnd;
    for (const x of EP) if (x.i < e.i) reach = Math.max(reach, runDist(x, x.b));
    const pa = pathAt(dist);
    // pose: run cycle keyed to distance (feet never slide; it runs backward in the rewind)
    let grid = NEUTRAL, bob = 0, squash = 1;
    if (st.phase !== 'stand') { const ph = dist / 0.26; grid = st.phase === 'rewind' && dist < 0.05 ? NEUTRAL : RUN[Math.floor(ph) % 4]; bob = 0.05 * Math.abs(Math.sin(ph * Math.PI / 2)) * (st.phase === 'hold' ? 1 : 1); }
    else {
      // on the pad: after a reset, his eye beat (lands, looks left, then right, blinks); then a squash and go
      const t0 = f - e.a, sd = standOf(e);
      if (e.i > 0 && e.i < PROFILE.length) {
        const beat = [[0, 'hopSquash'], [3, 'neutral'], [6, 'left'], [10, 'right'], [14, 'blink'], [16, 'neutral']];
        let pz = 'neutral'; for (const [a, p] of beat) if (t0 >= a) pz = p;
        grid = pz === 'neutral' ? NEUTRAL : G[pz];
        if (t0 < 3) squash = 0.95;
      } else if (e.i >= PROFILE.length) {
        // home after the last run: a look back down the path he has learned, and a blink
        const beat = [[0, 'hopSquash'], [3, 'neutral'], [5, 'right'], [12, 'blink'], [15, 'neutral']];
        let pz = 'neutral'; for (const [a, p] of beat) if (t0 >= a) pz = p;
        grid = pz === 'neutral' ? NEUTRAL : G[pz];
        if (t0 < 3) squash = 0.95;
      }
      if (e.i < PROFILE.length && t0 >= sd - 3 && t0 < sd) { grid = SQUASH; squash = 0.94; }
    }
    const y = St.V.heightAt(pa.x, pa.z) + bob;
    const C = camXZ(f);
    const { cx, cz, fwd, side, off, wide } = C;
    const gy = St.V.heightAt(cx, cz);
    const cam = {
      pos: [C.x, gy + off.u, C.z],
      look: [cx - fwd[0] * 2.5 + side[0] * 0.6, gy + 1.05, cz - fwd[2] * 2.5 + side[2] * 0.6],
      fovy: lerp(40, 44, wide),
    };
    cam.pos[1] = Math.max(cam.pos[1], St.V.heightAt(cam.pos[0], cam.pos[2]) + 1.2);
    // the last rewind is watched from where the run ended: the lens eases its aim onto the pad and
    // pushes in (a narrower lens), the whole painted path between
    const last = EP[PROFILE.length - 1];
    if (f >= last.b) {
      // (revision 15: it starts on the stop and settles two frames before the cut, never still moving)
      const k2 = easeInOut(clamp((f - last.b) / (s.f1 - 3 - last.b)));
      cam.pos[1] += 5 * k2;                       // a slow crane up: the painted path, his ghosts, him home
      cam.look = cam.look.map((v, j) => lerp(v, [0, 0.7, 0][j], k2));
      cam.fovy = lerp(cam.fovy, 30, k2);
    }
    // ghosts: where each earlier run ended (they stay), and the streak of the rewind
    const ghosts = [];
    for (const x of EP) {
      if (x.i >= PROFILE.length || f < x.b + HOLD) continue;
      if (x === e && st.phase !== 'stand' && st.phase !== 'run' && st.r !== undefined && st.r < 0.2) continue;
      const dE = runDist(x, x.b), q = pathAt(dE);
      const near = ss(9, 16, Math.hypot(q.x - cam.pos[0], q.z - cam.pos[2]));     // (never a blur by the lens)
      ghosts.push({ x: q.x, z: q.z, yaw: q.heading, grid: poseAt(dE), alpha: 0.22 * ss(x.b + HOLD, x.b + HOLD + 5, f) * near });
    }
    if (st.phase === 'rewind') {
      for (let j = 1; j <= 7; j++) {
        const dj = Math.min(st.dEnd, dist + j * (0.35 + 0.05 * st.dEnd)), q = pathAt(dj);
        ghosts.push({ x: q.x, z: q.z, yaw: q.heading, grid: poseAt(dj), alpha: 0.42 * Math.pow(1 - j / 8, 1.4) * (1 - ss(0.85, 1, st.r)) });
      }
    }
    // a ring pulses from the pad as the new episode begins
    const arr = e.i < PROFILE.length && f >= e.b ? e.b + LEN - 1 : e.a - 1;
    const ta = f - arr;
    const rings = ta >= 0 && ta < 24 ? [[0, 0, 0.8 + ta * 0.55, 0.9 * Math.exp(-ta / 9)]] : [];
    const trailW = [5.5, 6.5, 7.5, 7.5][Math.min(3, e.i)];
    const P = {
      cam, time: fr.t, greyK: 0.84,
      learn: { spawn: [0, 0, 7.5, 1.2], trail: { pts: PATH, reach: Math.max(0, reach - 0.3), w: trailW } },
      clawd: { x: pa.x, z: pa.z, y, yaw: st.phase === 'stand' ? 0 : pa.heading, depth: 4, grid, squash },
      ghosts, rings,
      shadow: { c: [cx, 0, cz], r: 40 },
      key: [22, 26], sun: [11, 2.4],
      rewind: st.phase === 'rewind' ? Math.sin(Math.PI * clamp(st.r * 1.1)) * 0.9 : st.phase === 'hold' ? 0.25 : 0,
    };
    St.V.render(P);
    const g = St.g2; g.drawImage(St.glc, 0, 0);
    // HUD: STEP rolls back during the rewind; the new episode pops large on arrival
    const stepRun = (ff, ep) => Math.max(0, Math.min(ff, ep.b) - ep.a) * 7;
    let epNo = 214 + e.i, step = stepRun(f, e), reward = 0.0098 * dist, pop = 0;
    if (st.phase === 'hold') { step = stepRun(e.b, e); reward = 0.0098 * st.dEnd; }
    if (st.phase === 'rewind') { step = Math.round(stepRun(e.b, e) * (1 - st.r)); reward = 0.0098 * dist; }
    if (f >= arr && ta < 18 && (st.phase === 'rewind' ? st.k >= LEN - 2 : true)) { if (st.phase === 'rewind') epNo += 1; pop = 1 - ss(2, 18, ta); }
    drawHUD(g, St.k, { episode: epNo, reward, step, pop, tick: pop });
  },
};
