// Browser-side timeline: shots, sections, audio envelopes and events.
// Everything a shot needs to stay in sync with the song. Load once with loadTimeline().
import * as core from './core.js';
export * from './core.js';

let D = null;

export async function loadTimeline(root = '..') {
  const get = (p) => fetch(`${root}/${p}`).then((r) => {
    if (!r.ok) throw new Error(`fetch ${p}: ${r.status}`);
    return p.endsWith('.bin') ? r.arrayBuffer() : r.json();
  });
  const [shotsDoc, sections, envMeta, envBin, events] = await Promise.all([
    get('shots.json'), get('analysis/sections.json'), get('render/data/env.json'),
    get('render/data/env.bin'), get('render/data/events.json'),
  ]);
  const shots = shotsDoc.shots.map((s) => ({ ...s, ...core.shotFrames(s) }));
  D = { shots, sections, envMeta, env: new Float32Array(envBin), events };
  return D;
}

export const data = () => D;
export const shots = () => D.shots;
export const shot = (id) => D.shots.find((s) => s.id === id) || (id.startsWith('_') ? core.testShot(id) : undefined);
export const sectionAt = (f) => D.sections.find((s) => f >= s.f0 && f < s.f1) || D.sections[D.sections.length - 1];

// Normalised (0..1) audio channel at frame f. Channels: mix vocals drums bass other kick snare
// sub lowmid high onset drums_onset centroid chroma_C .. chroma_B. Fractional f interpolates.
export function env(name, f) {
  const off = D.envMeta.channels[name];
  if (off === undefined) throw new Error(`unknown env channel ${name}`);
  const N = D.envMeta.N;
  const x = Math.min(Math.max(f, 0), N - 1);
  const i = Math.floor(x), j = Math.min(i + 1, N - 1), a = x - i;
  return D.env[off + i] * (1 - a) + D.env[off + j] * a;
}

// Centred moving average of a channel over +-r frames (cheap smoothing for camera drift etc.).
export function envSmooth(name, f, r = 4) {
  let s = 0;
  for (let k = -r; k <= r; k++) s += env(name, f + k);
  return s / (2 * r + 1);
}

// Event lists (frame indices): beats bars kicks snares chops sung stops.
export const events = (name) => D.events[name];

// Frames since the latest event at or before f (Infinity if none yet).
export function since(name, f) {
  const ev = D.events[name];
  let lo = 0, hi = ev.length - 1, best = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (ev[m] <= f) { best = m; lo = m + 1; } else hi = m - 1;
  }
  return best < 0 ? Infinity : f - ev[best];
}

// Exponential pulse: 1 on the event frame, decaying with the given half-life in frames.
export const pulse = (name, f, halfLife = 6) => {
  const d = since(name, f);
  return d === Infinity ? 0 : Math.pow(0.5, d / halfLife);
};

// Is frame f inside a bass stutter-stop (the ~0.33 s cut on beat 4 of certain bars)?
export const inStop = (f) => since('stops', f) < D.events.stop_len;

// Per-frame info handed to a shot's render(). tl = seconds since the shot started, u = 0..1 progress.
export function frameInfo(s, f) {
  const t = core.timeOf(f);
  const n = Math.max(s.f1 - s.f0, 1);
  return {
    f, t, fl: f - s.f0, tl: (f - s.f0) / core.FPS, u: (f - s.f0) / n, n,
    bar: core.barAt(t), beat: core.beatAt(t),
    section: sectionAt(f).id,
  };
}
