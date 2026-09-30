// Training-run bookkeeping shared by S03, S04, S05, S07: one continuous run across the shots.
// Everything is a pure function of the global frame f.
import { clamp, smoothstep, vnoise } from '../../lib/util.js';

// Vocal-chop pitch per chop onset (from analysis/vocal_f0.npz, median MIDI over the first 0.25 s).
// The chop melody is pentatonic: C4 D4 E4 G4 A4 -> level 0..4.
const CHOP_MIDI = {
  289: 60, 314: 69, 318: 69, 323: 67, 332: 60, 354: 60, 362: 64, 369: 60, 395: 67, 404: 62, 429: 64,
  467: 67, 476: 60, 506: 64, 541: 60, 559: 60, 586: 60, 611: 67, 620: 60, 650: 64, 657: 60, 682: 67,
  692: 62, 725: 60, 734: 60, 754: 67, 764: 60, 770: 60, 795: 64, 829: 60, 847: 60, 865: 60, 899: 67,
  908: 60, 939: 64, 945: 60, 971: 67, 986: 62, 1011: 67, 1022: 67, 1043: 67, 1083: 64, 1135: 60,
};
const LEVEL = { 60: 0, 62: 1, 64: 2, 67: 3, 69: 4 };
export const chopLevel = (fc) => LEVEL[CHOP_MIDI[fc]] ?? 0;

export const F_START = 299;          // bar 5 downbeat: training starts
export const F_END = 1148;           // the music drops out at the end of bar 16: training "stops" here
export const STEP_END = 131072;

// Stream speed in chars per frame (at Clawd, in text space).
export function speedAt(f) {
  if (f < 587) {                                   // S03: slow, then a subtle build through bars 7-8
    const u = clamp((f - 443) / 144);
    return 0.11 + 0.36 * Math.pow(u, 2.2);
  }
  if (f < 731) return 0.50 + 0.12 * (f - 587) / 144;   // S04: fast motion
  if (f < 875) return 0.62 + 0.53 * smoothstep(731, 749, f);   // S05: continues S04's pace, then speeds up
  if (f < 1019) return 1.6;                            // S06 (outside; unseen)
  return 2.0 + 1.6 * smoothstep(1019, 1147, f);        // S07: at speed
}

// Stream head in text space (chars) = sum of speeds; the '#d97757' line reaches him in bar 8.
const H0 = 1463.5;
const HEAD = new Float64Array(1300);
{
  let h = H0;
  for (let f = 0; f < HEAD.length; f++) { HEAD[f] = h; if (f >= F_START) h += speedAt(f); }
}
export function headAt(f) {
  const x = clamp(f, 0, HEAD.length - 1.001), i = Math.floor(x), a = x - i;
  return HEAD[i] * (1 - a) + HEAD[i + 1] * a;
}

// The frame the picture shows: inside a bass stutter-stop everything holds on the stop's first frame.
export function holdFrame(T, f) {
  const s = T.since('stops', f);
  return s < T.data().events.stop_len ? f - s : f;
}

// Steps: 0 on the bar-5 kick, 131 072 when the music drops out (matches the style frame's HUD).
export function stepAt(f) {
  const u = clamp((f - F_START) / (F_END - F_START));
  return STEP_END * Math.pow(u, 2.6);
}

// Loss: 10.8 (ln 50k, a uniform guess) falling as a power law to 2.8416 at the last step.
const LINF = 2.2, S0 = 60, ALPHA = Math.log(8.6 / (2.8416 - LINF)) / Math.log(1 + STEP_END / S0);
export const lossSmooth = (step) => LINF + 8.6 / Math.pow(1 + step / S0, ALPHA);
export function lossAt(step) {
  const L = lossSmooth(step);
  const wob = (vnoise(step / 37 + 0.5, 3.1, 11) - 0.5) * 0.9 + (vnoise(step / 9 + 0.5, 7.7, 12) - 0.5) * 0.35;
  return L + wob * 0.16 * Math.sqrt(L - LINF) * (1 - smoothstep(0.985, 1, step / STEP_END));
}

// 2^22 tokens per step; 6 N D FLOPs for an N = 6 738 415 616 parameter model.
export const TOK_PER_STEP = 4194304;
export const N_PARAMS = 6738415616;
export const tokensAt = (step) => step * TOK_PER_STEP;
export const flopAt = (step) => 6 * N_PARAMS * tokensAt(step);

// Grouped integer, e.g. 131072 -> "131 072" (thin groups, like the style frame's HUD).
export function groupInt(v, sep = ' ') {
  const s = Math.floor(v).toString();
  let out = '';
  for (let i = 0; i < s.length; i++) { if (i && (s.length - i) % 3 === 0) out += sep; out += s[i]; }
  return out;
}
