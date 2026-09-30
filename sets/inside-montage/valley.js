// Revision 4: the painted-valley look's palette (rung 4 in hillx.js; the shading is glslx.js's LOOK
// variant). VALLEY is S18's dusk as agent P painted it: a violet zenith through pink to a peach
// horizon, a warm sun glow, peach mountains. Over the montage the look drifts toward the final
// environment's palette (sets/hill SHELTER, S31): lookPal(drift), drift 0 = S19 .. 1 = S31.
// The look also reads six keys of its own (LOOK_KEYS): the mountains' two tones and the land's
// lights (key, sky ambient, fill, bounce), so a night palette (night.js) can take them down too.
import { PAL4, SHELTER, palLinear, palMix } from '../hill/palettes.js';

export const VALLEY = Object.assign({}, PAL4, {
  P_ZEN: '#44357A', P_UP: '#7E54A6', P_MID: '#C979B6', P_LOW: '#F0A5B2', P_HOR: '#FAD3B3', P_GLOW: '#FFC08A',
  P_SUNC: ['#FFD9A8', 1.1], P_DISC: ['#FFF6E6', 1.6],
  P_GLOWL: ['#FF9E7C', 0.9], P_CLAWDL: ['#F08A60', 3.0],
});
export const LOOK_KEYS = ['P_MTL', 'P_MTS', 'P_KEY', 'P_AMB', 'P_FILL', 'P_BNC'];
// [at the valley, at the shelter]
export const LOOK_EXTRA = {
  P_MTL: ['#EE945E', '#F2B89C'], P_MTS: ['#BF7A80', '#B9A0C2'],
  P_KEY: [['#FFEBD1', 2.25], ['#FFE8D0', 1.75]], P_AMB: [['#ADBCF1', 0.34], ['#B4BEF0', 0.5]],
  P_FILL: [['#BCB8E9', 0.22], ['#C4C0EE', 0.28]], P_BNC: [['#CBB4A2', 0.16], ['#C8B8B0', 0.16]],
};
const one = (v) => palLinear({ x: v }).x;
const LV = palLinear(VALLEY), LS = palLinear(SHELTER);
const LX = Object.fromEntries(Object.entries(LOOK_EXTRA).map(([k, [a, b]]) => [k, [one(a), one(b)]]));
const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
// the look's palette in linear light at a drift (its own keys included)
export function lookPal(drift = 0) {
  const d = clamp01(drift), out = palMix(LV, LS, d);
  for (const [k, [a, b]] of Object.entries(LX)) out[k] = a.map((v, i) => v + (b[i] - v) * d);
  return out;
}
