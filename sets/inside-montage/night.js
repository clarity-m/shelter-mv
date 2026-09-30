// Night falls inside (revision 3; revision 4: from the painted-valley look). The rung-4 look's palette
// (valley.js lookPal, at the shot's drift) eased toward a deep indigo night whose sky sits on the
// paper world's night (S23's and S26's skies), for the inside twins whose last frames cut to it.
// Use with hillx's `palLin`: hill.render({ ..., palLin: nightPal(k, drift) }), k 0 = the look as it
// is (so a switch onto it is seamless) .. 1 = night. The look's own keys (the land's lights and the
// mountains) go down with it. (look: 'luminous' shots: nightPal(k, 0, PAL4) keeps the old base.)
import { PAL4, palLinear, palMix } from '../hill/palettes.js';
import { lookPal } from './valley.js';

export const NIGHT = Object.assign({}, PAL4, {
  P_ZEN: '#28304E', P_UP: '#303A58', P_MID: '#3A4464', P_LOW: '#44506E', P_HOR: '#4C5876', P_GLOW: '#545474',
  P_SUNC: ['#FFDAA6', 0.1], P_DISC: ['#FFF8EA', 0.2],
  P_CSH: '#262E4E', P_CLIT: '#3A4268', P_CUND: '#454064',
  P_SUNL: ['#FFB472', 0.22], P_SKYF: ['#4C5A9A', 0.5], P_BOUNCE: ['#1C2A40', 0.2], P_GLOWL: ['#FF9E7C', 0.1],
  // the look's own keys at night: moonlit land, mountains gone to the night's blue
  P_MTL: '#3E4468', P_MTS: '#343A5E', P_KEY: ['#8A96C8', 0.3], P_AMB: ['#6070B0', 0.36], P_FILL: ['#5060A0', 0.14], P_BNC: ['#303850', 0.06],
});
const LN = palLinear(NIGHT);
export function nightPal(k, drift = 0, base = null) {
  const from = base ? palLinear(base) : lookPal(drift);
  const out = palMix(from, LN, Math.min(Math.max(k, 0), 1));
  // (palMix walks the base's keys: the look's own keys are in lookPal, and in NIGHT)
  if (base) for (const key of Object.keys(LN)) if (!(key in out)) out[key] = LN[key];
  return out;
}
