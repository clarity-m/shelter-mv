// Clawd's frames for the early environments: the model sheet's own (style-frames/05-clawd-sprites)
// plus a few poses the sheet lacks, built on its grid and face kit (22x8, the glyph at cols 2..19,
// rows 3..7, ground at the bottom of row 7).
import { CS } from './pixel.js';

export const E = CS.EMOTES, M = CS.MOTION;
export const NEUTRAL = E.neutral, BLINK = E.blink, HAPPY = E.happy, DETERMINED = E.determined, WONDER = E.wonder;
export const CURIOUS = E.curious;
export const WALK = M.walk.frames;                  // spread, pass A, spread, pass B (eyes to the right)
export const LOOK = WALK[0];                        // standing, eyes to the right (mirror: to the left)
export const [SQUASH, STRETCH, APEX, HOPFALL] = M.hop.frames;
export const [, LOOKUP, TIPTOE] = M.lookUp.frames;
export const SIT = M.sit.frames[0];
export const WAVE = M.wave.frames;                  // A, B, C, B: the right arm (mirror for the left)

// looking down and ahead at the gap: the sad slump without the tear, eyes shifted toward it
export const LOOKDOWN = [
  '......................',
  '......................',
  '......................',
  '......##########......',
  '.....############.....',
  '.....###o######o#.....',
  '...################...',
  '......#.#....#.#......',
];
// falling: tall eyes, arms thrown up
export const FALL = [
  '......................',
  '......................',
  '...#..............#...',
  '...#.############.#...',
  '....###o######o###....',
  '.....##o######o##.....',
  '.....############.....',
  '......#.#....#.#......',
];
// clinging to the far lip: arms up, legs scrabbling (two drawings)
export const CLING_A = [
  '......................',
  '...................#..',
  '...#...............#..',
  '...#.############.##..',
  '....####o######o##....',
  '.....###o######o#.....',
  '.....############.....',
  '.....#..#.....#..#....',
];
export const CLING_B = [
  '......................',
  '...................#..',
  '...#...............#..',
  '...#.############.##..',
  '....####o######o##....',
  '.....###o######o#.....',
  '.....############.....',
  '.......##.....##......',
];
// sitting at the edge, head down, eyes on the gap
export const SIT_DOWN = [
  '......................',
  '......................',
  '......................',
  '......................',
  '.....############.....',
  '.....############.....',
  '.....###o######o#.....',
  '...################...',
];
// sitting, looking up
export const SIT_UP = [
  '......................',
  '......................',
  '......................',
  '......................',
  '.....##o######o##.....',
  '.....############.....',
  '.....############.....',
  '...################...',
];
