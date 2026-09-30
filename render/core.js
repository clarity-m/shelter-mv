// Pure timing math shared by the Node driver and the browser player (no I/O).
// Frame f <-> time f / FPS. Bars are 1-based: bar b starts at BAR1 + (b - 1) * BAR.

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const BPM = 100;
export const BAR = 2.4;          // seconds per bar (4/4 at 100 BPM)
export const BEAT = BAR / 4;     // 0.6 s = 18 frames
export const BAR1 = 0.38;        // bar 1 downbeat (analysis/grid.json)
export const END_T = 217.73;     // song length in seconds
export const N_FRAMES = Math.round(END_T * FPS);  // 6532 frames, 0..6531
export const LAST_BAR = 91;

export const barTime = (b) => BAR1 + (b - 1) * BAR;
export const frameOf = (t) => Math.round(t * FPS);
export const timeOf = (f) => f / FPS;
export const barAt = (t) => 1 + (t - BAR1) / BAR;        // float bar number (1.0 = bar 1 downbeat)
export const beatAt = (t) => (t - BAR1) / BEAT;          // float beats since bar 1 downbeat

// A shot's frame range [f0, f1): the first shot starts at frame 0 and the last runs to the end.
export function shotFrames(shot) {
  const [b0, b1] = shot.bars;
  const t0 = b0 <= 1 ? 0 : barTime(b0);
  const t1 = b1 >= LAST_BAR ? END_T : barTime(b1 + 1);
  // optional shift0/shift1 (frames) move a cut off the downbeat, e.g. to show a beat of anticipation
  return { f0: frameOf(t0) + (shot.shift0 || 0), f1: Math.min(frameOf(t1) + (shot.shift1 || 0), N_FRAMES) };
}

export function shotAtFrame(shots, f) {
  for (const s of shots) {
    const { f0, f1 } = shotFrames(s);
    if (f >= f0 && f < f1) return s;
  }
  return shots[shots.length - 1];
}

// Test shots (ids starting with "_", e.g. _SYNC) are not in shots.json and span the whole song.
export function testShot(id) {
  return { id, bars: [1, LAST_BAR], section: 'test', set: 'test', rung: 'test', desc: 'test shot', ...shotFrames({ bars: [1, LAST_BAR] }) };
}
