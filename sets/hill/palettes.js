// Palettes for the hill set. Values are sRGB hex, optionally [hex, intensity]; the renderer
// converts to linear light. P_* are lights and sky, A_* are albedos.
// PAL4 is the ladder's luminous dusk (rung 4). PAL5_LADDER is the ladder's rung 5 (the
// darkened sky its notes criticise; kept for reference). SHELTER is the hopeful, luminous
// rung-5 palette of the final environment.

export const PAL4 = {
  P_ZEN: '#3D4C98', P_UP: '#7A76C2', P_MID: '#D398C2', P_LOW: '#F7B69E', P_HOR: '#FFD6B0', P_GLOW: '#FFC687',
  P_SUNC: ['#FFDAA6', 1.2], P_DISC: ['#FFF8EA', 2.0],
  P_CSH: '#6E66AE', P_CLIT: '#F6C0C6', P_CUND: '#FFAC86',
  P_SUNL: ['#FFB472', 3.0], P_SKYF: ['#7A80DC', 1.3], P_BOUNCE: ['#3F6A48', 0.3], P_GLOWL: ['#FF9E7C', 1.0], P_CLAWDL: ['#F08A60', 3.0],
  A_HILL: '#5AA04E', A_FLOOR: '#474C70', A_TRUNK: '#5A3E3C', A_LEAF: '#3A8A58', A_SKIN: '#E6AE93', A_HAIR: '#2E2030',
  A_SWEATER: '#F0E3CE', A_PANTS: '#39447C', A_SHOE: '#2A2632', A_CLAWD: '#D97757', A_GRID: '#FFF2E6',
  A_TOWER: '#CFC6E6', P_WIN: ['#FFD7A0', 2.2], P_RING: ['#FFE6C8', 1.0],
};

export const PAL5_LADDER = Object.assign({}, PAL4, {
  P_ZEN: '#1B1F52', P_UP: '#3B3789', P_MID: '#8D4E9A', P_LOW: '#E07489', P_HOR: '#FFB47C', P_GLOW: '#FFA862',
  P_SUNC: ['#FFD39A', 0.75], P_DISC: ['#FFE6C8', 1.2],
  P_CSH: '#3E3A8C', P_CLIT: '#F08FB0', P_CUND: '#FFA878',
  P_SUNL: ['#FFB06A', 3.2], P_SKYF: ['#7078E6', 1.2], P_GLOWL: ['#FF9A78', 1.1],
  A_HILL: '#3FA65C', A_LEAF: '#2AA276', A_SWEATER: '#FFEBD6', A_PANTS: '#4452A0', A_HAIR: '#3A2446', A_TRUNK: '#6A4046',
});

// The shelter: a luminous dawn. The sky stays light (no night), warm at the horizon where
// the city stands, lavender overhead; the land is a soft teal-green that the light draws on.
export const SHELTER = Object.assign({}, PAL4, {
  P_ZEN: '#4A57A8', P_UP: '#8580CE', P_MID: '#D9A0CB', P_LOW: '#FFBFA4', P_HOR: '#FFE2C2', P_GLOW: '#FFD08F',
  P_SUNC: ['#FFE0B0', 1.1], P_DISC: ['#FFF8EA', 1.8],
  P_CSH: '#7A72BC', P_CLIT: '#FFD0D2', P_CUND: '#FFB892',
  P_SUNL: ['#FFBC7E', 2.8], P_SKYF: ['#8A90E6', 1.45], P_GLOWL: ['#FFA888', 1.1], P_CLAWDL: ['#FF9A6A', 3.4],
  A_HILL: '#4FA86A', A_FLOOR: '#5A5E8E', A_LEAF: '#3A9A70', A_TRUNK: '#6A4650',
  A_SWEATER: '#F6E8D6', A_PANTS: '#4A56A0', A_HAIR: '#3A2A4A',
  A_TOWER: '#C9C0E6', P_WIN: ['#FFD9A0', 2.6], P_RING: ['#FFEBD2', 1.2],
});

const srgb2lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
export function palLinear(P) {
  const out = {};
  for (const [k, v] of Object.entries(P)) {
    const [h, s] = Array.isArray(v) ? v : [v, 1];
    out[k] = [1, 3, 5].map((i) => srgb2lin(parseInt(h.slice(i, i + 2), 16) / 255) * s);
  }
  return out;
}
// blend two linear palettes
export function palMix(A, B, t) {
  const out = {};
  for (const k of Object.keys(A)) out[k] = A[k].map((v, i) => v + ((B[k] || A[k])[i] - v) * t);
  return out;
}
export const PAL_KEYS = Object.keys(PAL4);
