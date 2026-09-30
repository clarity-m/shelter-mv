// Clawd, the pixel mascot: an 18x5 glyph, each cell 1 wide by 2 tall, '#' = orange #D97757.
// Rule for the whole film: Clawd stays crisp (exact cells, never blurred or painted over).
// The richer sprite set (emotes, walk cycles, ladder forms) lives in
// style-frames/05-clawd-sprites/clawd-sprites.js and clawd-3d.js.

export const GLYPH = [
  '...############...',
  '...##.######.##...',
  '.################.',
  '...############...',
  '....#.#....#.#....',
];
export const COLS = 18, ROWS = 5;
export const COLOR = '#D97757';

// Draw on a 2D context with the glyph's top-left at (x, y); cell is the cell WIDTH in px
// (height is 2x). Integer-snapped so the cells stay crisp.
export function drawClawd(ctx, x, y, cell, color = COLOR) {
  const cw = Math.max(1, Math.round(cell)), ch = cw * 2;
  const x0 = Math.round(x), y0 = Math.round(y);
  ctx.fillStyle = color;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (GLYPH[r][c] === '#') ctx.fillRect(x0 + c * cw, y0 + r * ch, cw, ch);
    }
  }
}

// Size in px of the glyph at a given cell width.
export const clawdSize = (cell) => ({ w: COLS * Math.round(cell), h: ROWS * 2 * Math.round(cell) });

// Draw centred on (cx, cy).
export function drawClawdCentered(ctx, cx, cy, cell, color = COLOR) {
  const { w, h } = clawdSize(cell);
  drawClawd(ctx, cx - w / 2, cy - h / 2, cell, color);
}
