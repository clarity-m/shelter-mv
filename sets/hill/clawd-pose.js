// Clawd's poses for the luminous composite: the sprite grids of style-frames/05-clawd-sprites
// (clawd-sprites.js, copied here because that file is a classic script), turned into the bit rows
// the CLAWD_FS shader reads. Every sprite is a 22 x 8 frame on the 1:2 cell grid; the canonical
// 18 x 5 glyph sits at cols 2..19, rows 3..7, and the ground is the bottom edge of row 7.
// Keys: '#' body, 'o' face hole (lit from within), 'w' / 'y' accents (small warm lights).

const G = {
  neutral: ['......................', '......................', '......................', '.....############.....',
    '.....##o######o##.....', '...################...', '.....############.....', '......#.#....#.#......'],
  blink: ['......................', '......................', '......................', '.....############.....',
    '.....############.....', '...################...', '.....############.....', '......#.#....#.#......'],
  happy: ['......................', '......................', '......................', '...#.############.#...',
    '....##ooo####ooo##....', '.....#o#o####o#o#.....', '.....############.....', '......#.#....#.#......'],
  surprised: ['....................w.', '....................w.', '......................', '...#.############.#.w.',
    '....###o######o###....', '.....##o######o##.....', '.....############.....', '.....#..#....#..#.....'],
  wonder: ['...w..................', '..www............w....', '...w..................', '.....############.....',
    '...####o######o####...', '.....##o######o##.....', '.....############.....', '......#.#....#.#......'],
  determined: ['......................', '......................', '......................', '.....############.....',
    '.....##o######o##.....', '....####o####o####....', '.....############.....', '.....#.#......#.#.....'],
  content: ['......................', '......................', '......................', '.....############.....',
    '.....#o#o####o#o#.....', '...###ooo####ooo###...', '.....############.....', '......#.#....#.#......'],
  hopSquash: ['......................', '......................', '......................', '......................',
    '....##############....', '....###o######o###....', '...################...', '.....#.#......#.#.....'],
  hopStretch: ['......................', '......................', '....#.##########.#....', '.....###o####o###.....',
    '......##########......', '......##########......', '......##########......', '.......#.#..#.#.......'],
  hopApex: ['......................', '......................', '......................', '...#.############.#...',
    '....###o######o###....', '.....############.....', '.....############.....', '.....#.#......#.#.....'],
  hopFall: ['......................', '......................', '......................', '.....############.....',
    '...####o######o####...', '.....############.....', '.....############.....', '......#.#....#.#......'],
  lookUp: ['......................', '......................', '......##########......', '.....##o######o##.....',
    '.....############.....', '...################...', '.....############.....', '......#.#....#.#......'],
  waveA: ['......................', '......................', '...................#..', '.....############.#...',
    '.....##o######o###....', '...###o#o####o#o#.....', '.....############.....', '......#.#....#.#......'],
  waveB: ['......................', '......................', '..................#...', '.....############.#...',
    '.....##o######o###....', '...###o#o####o#o#.....', '.....############.....', '......#.#....#.#......'],
  waveC: ['......................', '......................', '.................#....', '.....############.#...',
    '.....##o######o###....', '...###o#o####o#o#.....', '.....############.....', '......#.#....#.#......'],
};
// the canonical body with its two eyes placed anywhere: dc shifts them sideways (glance),
// row 4 is the eye row, row 5 looks down
function face(dc = 0, row = 4) {
  const g = G.blink.map((r) => r.split(''));
  g[row][7 + dc] = 'o'; g[row][14 + dc] = 'o';
  return g.map((r) => r.join(''));
}
G.left = face(-1); G.right = face(1); G.down = face(0, 5); G.downLeft = face(-1, 5); G.downRight = face(1, 5);
export const GRIDS = G;
export const mirror = (g) => g.map((r) => r.split('').reverse().join(''));

// grid rows -> Int32Array(24): body bits, hole bits, accent bits (8 rows each, bit c = column c)
export function gridBits(g) {
  const out = new Int32Array(24);
  g.forEach((row, r) => {
    for (let c = 0; c < 22; c++) {
      const ch = row[c];
      if (ch === '#') out[r] |= 1 << c;
      else if (ch === 'o') out[8 + r] |= 1 << c;
      else if (ch === 'w' || ch === 'y') out[16 + r] |= 1 << c;
    }
  });
  return out;
}

// The hop from MOTION.hop: squash, stretch, apex, fall, squash at 12 fps, lifted dy cells
// (one cell = 2 glyph units). `scale` shrinks the lift for small hops. fl is frames since take-off.
const HOP = ['hopSquash', 'hopStretch', 'hopApex', 'hopFall', 'hopSquash'];
const HOP_DY = [0, 0, 3, 1, 0];
export function hopAt(fl, scale = 0.6) {
  if (fl < 0 || fl >= 12.5) return null;
  const i = Math.min(4, Math.floor(fl * 12 / 30));
  // the lift follows a smooth arc through the sprite's keys so the rise and fall read as motion
  const u = fl / 12.5, lift = Math.sin(Math.PI * Math.min(Math.max((u - 0.12) / 0.76, 0), 1));
  return { pose: HOP[i], dy: 2 * HOP_DY[2] * lift * scale };
}
// The wave (MOTION.wave, 6 fps): a raised arm, mirrored so it reaches toward screen left.
export function waveAt(fl) {
  if (fl < 0) return null;
  const seq = ['waveA', 'waveB', 'waveC', 'waveB'];
  return { pose: seq[Math.floor(fl * 6 / 30) % 4] };
}

// A shot's acting: keys [{ at, pose, mirror }] hold a pose from `at`; hops [{ at, scale }] and
// waves [{ at, len, mirror }] override it while they run; blinks [at] close the eyes for 3 frames
// (only on poses that have open eyes). Returns { grid, dy } for local frame fl (dy in glyph units, up).
export function act(script, fl) {
  let key = script.keys[0];
  for (const k of script.keys) if (fl >= k.at) key = k;
  let pose = key.pose, mir = !!key.mirror, dy = 0;
  for (const w of script.waves || []) {
    if (fl >= w.at && fl < w.at + w.len) { pose = waveAt(fl - w.at).pose; mir = w.mirror !== false; }
  }
  for (const h of script.hops || []) {
    const r = hopAt(fl - h.at, h.scale ?? 0.6);
    if (r) { pose = r.pose; dy = r.dy; mir = false; }
  }
  const eyed = ['neutral', 'left', 'right', 'down', 'downLeft', 'downRight', 'determined', 'lookUp'];
  for (const b of script.blinks || []) if (fl >= b && fl < b + 3 && eyed.includes(pose)) pose = pose === 'lookUp' ? 'lookUp' : 'blink';
  let grid = GRIDS[pose];
  if (mir) grid = mirror(grid);
  return { grid, dy };
}
