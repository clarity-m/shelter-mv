/* clawd-sprites.js : Clawd sprite and model-sheet data for the Shelter MV.
 *
 * Classic script (works from file:// in Chrome): <script src="clawd-sprites.js"></script>
 * then use window.ClawdSprites. Also exports via module.exports when available.
 *
 * GRID RULES
 *   Every pixel is 1 unit wide by 2 units tall (terminal quadrant blocks), so draw with pixelH = 2 * pixelW.
 *   Every sprite is a 22 x 8 frame (FRAME). The canonical 18 x 5 glyph sits at cols 2..19, rows 3..7.
 *   The ground is the bottom edge of row 7; the horizontal center is col 11 (between cols 10 and 11).
 *   Rows 0..2 and cols 0..1 / 20..21 are headroom for accents (hearts, z, sparks) and raised arms.
 *   Motion frames may carry dx / dy offsets (in cells) instead of baking translation into the grid.
 *
 * KEY
 *   '.' empty          '#' body, Claude orange
 *   'o' face hole      transparent by default, like the glyph's eyes; set palette.o to fill it
 *   'w' warm white     sparkles, z, the '!' mark, top face of a block
 *   'g' block gray     front face of a gridworld block
 *   'p' pink           blush, heart
 *   'b' blue           tear
 *   'y' gold           held light, thinking spinner
 *   'L' 'l' 's' 'S'    highlight / light / shade / deep shade (the 2x ladder sprite only)
 */
(function (root) {
  'use strict';

  const PALETTE = {
    '#': '#D97757',
    'o': null,
    'w': '#F5F0E8',
    'g': '#8F8A82',
    'p': '#F4A2B3',
    'b': '#8CCBF2',
    'y': '#FFD483',
    'L': '#F7B793',
    'l': '#E8906E',
    's': '#B55B47',
    'S': '#8A3F3D',
  };

  const FRAME = { w: 22, h: 8, bodyCol: 2, bodyRow: 3, centerCol: 11 };

  // The glyph exactly as decoded from the Claude Code terminal mascot (18 x 5).
  const GLYPH = [
    '...############...',
    '...##o######o##...',
    '.################.',
    '...############...',
    '....#.#....#.#....',
  ];

  // ---------------------------------------------------------------- emotes
  // Face vocabulary (all carved as holes into the canonical body; row 1 = the glyph's eye row):
  //   open   one hole on row 1               closed  no holes (blink)
  //   slit   three holes in a row (- -)      arch    three on row 1, feet on row 2 (happy, closed)
  //   cup    sides on row 1, three on row 2  tall    rows 1 and 2 (surprised, wonder)
  //   low    one hole on row 2 (sad, shy)    side    shifted one column (walk, thinking)
  //   o.O    one tall eye (curious)          \ /     row 1 plus inner row 2 (determined)
  //   up     looking up: the head gains a narrower top row and the eyes rise with it (MOTION.lookUp)
  const EMOTES = {
    neutral: [
      '......................',
      '......................',
      '......................',
      '.....############.....',
      '.....##o######o##.....',
      '...################...',
      '.....############.....',
      '......#.#....#.#......',
    ],
    blink: [
      '......................',
      '......................',
      '......................',
      '.....############.....',
      '.....############.....',
      '...################...',
      '.....############.....',
      '......#.#....#.#......',
    ],
    happy: [
      '......................',
      '......................',
      '......................',
      '...#.############.#...',
      '....##ooo####ooo##....',
      '.....#o#o####o#o#.....',
      '.....############.....',
      '......#.#....#.#......',
    ],
    sad: [
      '......................',
      '......................',
      '......................',
      '......##########......',
      '.....############.....',
      '.....##o######o##.....',
      '...####b###########...',
      '......#.#....#.#......',
    ],
    surprised: [
      '....................w.',
      '....................w.',
      '......................',
      '...#.############.#.w.',
      '....###o######o###....',
      '.....##o######o##.....',
      '.....############.....',
      '.....#..#....#..#.....',
    ],
    sleepy: [
      '......................',
      '.................ww...',
      '..................ww..',
      '.....############.....',
      '.....############.....',
      '.....#ooo####ooo#.....',
      '...################...',
      '......#.#....#.#......',
    ],
    determined: [
      '......................',
      '......................',
      '......................',
      '.....############.....',
      '.....##o######o##.....',
      '....####o####o####....',
      '.....############.....',
      '.....#.#......#.#.....',
    ],
    curious: [
      '......................',
      '......................',
      '......................',
      '......############....',
      '.....###o######o#.....',
      '...############o###...',
      '.....############.....',
      '......#.#....#.#......',
    ],
    love: [
      '...............pp.pp..',
      '................ppp...',
      '.................p....',
      '.....############.....',
      '.....#ooo####ooo#.....',
      '...###o#o####o#o###...',
      '.....#pp######pp#.....',
      '......#.#....#.#......',
    ],
    wonder: [
      '...w..................',
      '..www............w....',
      '...w..................',
      '.....############.....',
      '...####o######o####...',
      '.....##o######o##.....',
      '.....############.....',
      '......#.#....#.#......',
    ],
    shy: [
      '......................',
      '......................',
      '......................',
      '.....############.....',
      '.....############.....',
      '.....#o######o###.....',
      '....##pp#####pp###....',
      '.......##....##.......',
    ],
    thinking: [
      '.................y.y..',
      '..................y...',
      '.................y.y..',
      '.....############.....',
      '.....###o######o#.#...',
      '...###############....',
      '.....############.....',
      '......#.#....#.#......',
    ],
    content: [
      '......................',
      '......................',
      '......................',
      '.....############.....',
      '.....#o#o####o#o#.....',
      '...###ooo####ooo###...',
      '.....#pp######pp#.....',
      '......#.#....#.#......',
    ],
    bittersweet: [
      '......................',
      '......................',
      '......................',
      '.....############.....',
      '.....#ooo####ooo#.....',
      '...###o#o####o#o###...',
      '.....#b##########.....',
      '......#.#....#.#......',
    ],
  };

  const EMOTE_ORDER = [
    'neutral', 'blink', 'happy', 'sad', 'surprised', 'sleepy', 'determined',
    'curious', 'love', 'wonder', 'shy', 'thinking', 'content', 'bittersweet',
  ];

  // ---------------------------------------------------------------- motion
  // Walk: facing right (mirror() for left). Legs alternate spread / together; the body advances
  // one column every two frames, so planted feet never slide. dx is added to (loop * advance).
  const WALK_SPREAD = [
    '......................',
    '......................',
    '......................',
    '.....############.....',
    '.....###o######o#.....',
    '...################...',
    '.....############.....',
    '......#.#....#.#......',
  ];
  const WALK_PASS_A = [
    '......................',
    '......................',
    '......................',
    '.....############.....',
    '...#.###o######o#.....',
    '....##############....',
    '.....############.#...',
    '.......##.....##......',
  ];
  const WALK_PASS_B = [
    '......................',
    '......................',
    '......................',
    '.....############.....',
    '.....###o######o#.#...',
    '....##############....',
    '...#.############.....',
    '.......##.....##......',
  ];

  // Hop: squash, stretch, apex, fall, land.
  const HOP_SQUASH = [
    '......................',
    '......................',
    '......................',
    '......................',
    '....##############....',
    '....###o######o###....',
    '...################...',
    '.....#.#......#.#.....',
  ];
  const HOP_STRETCH = [
    '......................',
    '......................',
    '....#.##########.#....',
    '.....###o####o###.....',
    '......##########......',
    '......##########......',
    '......##########......',
    '.......#.#..#.#.......',
  ];
  const HOP_APEX = [
    '......................',
    '......................',
    '......................',
    '...#.############.#...',
    '....###o######o###....',
    '.....############.....',
    '.....############.....',
    '.....#.#......#.#.....',
  ];
  const HOP_FALL = [
    '......................',
    '......................',
    '......................',
    '.....############.....',
    '...####o######o####...',
    '.....############.....',
    '.....############.....',
    '......#.#....#.#......',
  ];

  const SIT = [
    '......................',
    '......................',
    '......................',
    '......................',
    '.....############.....',
    '.....##o######o##.....',
    '.....############.....',
    '...################...',
  ];
  // Sitting on a ledge: the ledge top is the top edge of row 6 (seatRow); legs dangle over it.
  // The leg that swings toward camera foreshortens to one row.
  const SIT_EDGE_A = [
    '......................',
    '......................',
    '.....############.....',
    '.....##o######o##.....',
    '...################...',
    '.....############.....',
    '......#.#....#.#......',
    '......#.#.............',
  ];
  const SIT_EDGE_B = [
    '......................',
    '......................',
    '.....############.....',
    '.....##o######o##.....',
    '...################...',
    '.....############.....',
    '......#.#....#.#......',
    '.............#.#......',
  ];

  const WAVE_A = [
    '......................',
    '......................',
    '...................#..',
    '.....############.#...',
    '.....##o######o###....',
    '...###o#o####o#o#.....',
    '.....############.....',
    '......#.#....#.#......',
  ];
  const WAVE_B = [
    '......................',
    '......................',
    '..................#...',
    '.....############.#...',
    '.....##o######o###....',
    '...###o#o####o#o#.....',
    '.....############.....',
    '......#.#....#.#......',
  ];
  const WAVE_C = [
    '......................',
    '......................',
    '.................#....',
    '.....############.#...',
    '.....##o######o###....',
    '...###o#o####o#o#.....',
    '.....############.....',
    '......#.#....#.#......',
  ];

  // Carry a gridworld block on the head, arms out for balance.
  const CARRY = [
    '......................',
    '.........wwww.........',
    '.........gggg.........',
    '...#.############.#...',
    '....###o######o###....',
    '.....############.....',
    '.....############.....',
    '......#.#....#.#......',
  ];
  // Cradle a small light in front, eyes down on it.
  const HOLD = [
    '......................',
    '......................',
    '......................',
    '.....############.....',
    '.....############.....',
    '.....##o######o##.....',
    '....#####yyyy#####....',
    '......#.#yyyy#.#......',
  ];

  const SLEEP_A = [
    '...................ww.',
    '....................ww',
    '................ww....',
    '.................ww...',
    '.....############.....',
    '.....#o#o####o#o#.....',
    '.....#ooo####ooo#.....',
    '...################...',
  ];
  const SLEEP_B = [
    '......................',
    '.................ww...',
    '..................ww..',
    '......................',
    '.....############.....',
    '.....#o#o####o#o#.....',
    '.....#ooo####ooo#.....',
    '...################...',
  ];

  const LOOK_UP = [
    '......................',
    '......................',
    '......##########......',
    '.....##o######o##.....',
    '.....############.....',
    '...################...',
    '.....############.....',
    '......#.#....#.#......',
  ];
  const LOOK_UP_TIPTOE = [
    '......................',
    '......##########......',
    '.....##o######o##.....',
    '...################...',
    '.....############.....',
    '.....############.....',
    '......#.#....#.#......',
    '......#.#....#.#......',
  ];

  const MOTION = {
    walk:    { fps: 8,  loop: true,  frames: [WALK_SPREAD, WALK_PASS_A, WALK_SPREAD, WALK_PASS_B], dx: [0, 0, 1, 1], advance: 2 },
    hop:     { fps: 12, loop: false, frames: [HOP_SQUASH, HOP_STRETCH, HOP_APEX, HOP_FALL, HOP_SQUASH], dy: [0, 0, 3, 1, 0] },
    sit:     { fps: 0,  loop: false, frames: [SIT] },
    sitEdge: { fps: 3,  loop: true,  frames: [SIT_EDGE_A, SIT_EDGE_B], seatRow: 6 },
    wave:    { fps: 6,  loop: true,  frames: [WAVE_A, WAVE_B, WAVE_C, WAVE_B] },
    carry:   { fps: 0,  loop: false, frames: [CARRY] },
    hold:    { fps: 0,  loop: false, frames: [HOLD] },
    sleep:   { fps: 2,  loop: true,  frames: [SLEEP_A, SLEEP_B] },
    lookUp:  { fps: 4,  loop: false, frames: [EMOTES.neutral, LOOK_UP, LOOK_UP_TIPTOE] },
  };

  // ---------------------------------------------------------------- ladder rung 2
  // 36 x 10 at the same 1:2 pixel shape: every glyph pixel becomes 2 x 2. Light from the upper left,
  // a hue-shifted ramp (warm highlights, red-violet shadows), dark corner pixels that round the
  // silhouette against a dark ground, and a shaded lip above each eye so the holes read as recessed.
  const PX2 = [
    '......SLLLlllllllllllllllllllS......',
    '......l###ss############ss###s......',
    '......l###oo############oo###s......',
    '......l###oo############oo###s......',
    '..Sllll#######################lllS..',
    '..ssss########################ssss..',
    '......s######################S......',
    '......SssssssssssssssssssssssS......',
    '........#s..#s........#s..#s........',
    '........sS..sS........sS..sS........',
  ];

  // ---------------------------------------------------------------- helpers
  function drawSprite(ctx, grid, x, y, pixelW, pixelH, palette) {
    const pal = palette ? Object.assign({}, PALETTE, palette) : PALETTE;
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      const y0 = Math.round(y + r * pixelH), y1 = Math.round(y + (r + 1) * pixelH);
      let c = 0;
      while (c < row.length) {
        const ch = row[c];
        let n = 1;
        while (c + n < row.length && row[c + n] === ch) n++;
        const color = ch === '.' ? null : pal[ch];
        if (color) {
          const x0 = Math.round(x + c * pixelW), x1 = Math.round(x + (c + n) * pixelW);
          ctx.fillStyle = color;
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
        }
        c += n;
      }
    }
  }

  // Place a 22 x 8 frame by its ground center: cx = horizontal center, groundY = ground line.
  function drawFrame(ctx, grid, cx, groundY, pixelW, pixelH, palette, dx, dy) {
    const x = cx - FRAME.centerCol * pixelW + (dx || 0) * pixelW;
    const y = groundY - grid.length * pixelH - (dy || 0) * pixelH;
    drawSprite(ctx, grid, x, y, pixelW, pixelH, palette);
  }

  // Horizontal flip (e.g. walking left).
  function mirror(grid) {
    return grid.map(row => row.split('').reverse().join(''));
  }

  // Monochrome terminal version using the same quadrant blocks as the original glyph.
  // rowOffset 1 aligns a 22 x 8 frame with the glyph's own character cells.
  const QUAD = ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█';
  function toTerminal(grid, rowOffset) {
    const off = rowOffset === undefined ? (grid.length === FRAME.h ? 1 : 0) : rowOffset;
    const rows = [];
    for (let i = 0; i < off; i++) rows.push('.'.repeat(grid[0].length));
    grid.forEach(r => rows.push(r));
    if (rows.length % 2) rows.push('.'.repeat(grid[0].length));
    const ink = ch => ch !== '.' && ch !== 'o';
    const out = [];
    for (let r = 0; r < rows.length; r += 2) {
      let line = '';
      for (let c = 0; c < rows[r].length; c += 2) {
        const at = (rr, cc) => (cc < rows[rr].length && ink(rows[rr][cc])) ? 1 : 0;
        line += QUAD[at(r, c) | (at(r, c + 1) << 1) | (at(r + 1, c) << 2) | (at(r + 1, c + 1) << 3)];
      }
      out.push(line.replace(/\s+$/, ''));
    }
    return out.join('\n');
  }

  const api = { PALETTE, FRAME, GLYPH, EMOTES, EMOTE_ORDER, MOTION, PX2, drawSprite, drawFrame, mirror, toTerminal };
  root.ClawdSprites = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
