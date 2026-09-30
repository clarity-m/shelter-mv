// Revision 10 (agent I): the film's own code lying in the world, for hillx's `decals` option. Code is
// part of the world, never a panel over the frame: lines of it run along paths in the scene (the salt
// flat, the ground round the hill, the habitat's ring), in perspective and occluded like everything
// else, streaming along them. It rhymes with S03's line of tokens.
//
//   const lines = await readCode(['/sets/paper-kit/elevatorlines.js'], log);   // real lines, code only
//   const A = codeAtlas(lines, { px: 36 });   // { canvas, key, rows: [{ x0, y0, y1, n }], adv }
//   const quads = [];
//   streamQuads(quads, A, { path, top, read, head, u0, u1, gw, start, gap, chunk, alpha, col });
//   hill.render({ ..., decals: { src: A.canvas, key: A.key, quads } });
//
// streamQuads lays consecutive lines of the atlas along a path, the first starting at u = head and the
// rest following outward (+u), `gap` characters apart, and emits one quad per `chunk` characters:
//   path(u) -> [x, y, z]   the text's baseline at distance u (m) along the path
//   top(u)  -> [x, y, z]   the top of the row above path(u) (the row's height sets the glyphs' size)
//   read    +1: the text reads toward +u; -1: toward -u
//   gw      metres per character along the path; u0..u1 the stretch that is drawn
//   alpha(u) -> 0..1 (per corner, so fades are smooth); col [r, g, b] linear light
// A stream flows by moving its head (head = h0 - v t flows toward -u). Pure: no state between frames.

// real lines of code from the film's files (served by the renderer's page), blank and comment-only
// lines dropped unless asked for, tabs expanded, indentation capped
export async function readCode(paths, log = () => {}, { comments = false, indent = 6 } = {}) {
  const out = [];
  for (const p of paths) {
    try {
      const r = await fetch(p, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      for (const raw of (await r.text()).split(/\r?\n/)) {
        const l = raw.replace(/\t/g, '  ').replace(/\s+$/, '');
        if (!l.trim() || (!comments && /^\s*\/\//.test(l))) continue;
        out.push(l.replace(/^ +/, (m) => ' '.repeat(Math.min(m.length, indent))));
      }
    } catch (e) { log(`codeline: WARNING could not read ${p}: ${e && e.message}`); }
  }
  return out;
}

let atlasN = 0;
// one row per line, white on transparent, in as many columns as needed to fit maxH; lines longer
// than a column are cut at a character boundary
export function codeAtlas(lines, { px = 36, width = 4096, maxH = 4096, font = 'Consolas, "Courier New", monospace' } = {}) {
  const cv = document.createElement('canvas');
  const g0 = cv.getContext('2d');
  g0.font = `${px}px ${font}`;
  const adv = g0.measureText('MMMMMMMMMM').width / 10, rowH = Math.ceil(px * 1.32);
  const perCol = Math.max(1, Math.floor(maxH / rowH)), cols = Math.max(1, Math.ceil(lines.length / perCol));
  const colW = Math.floor(width / cols), maxN = Math.floor((colW - 8) / adv);
  cv.width = width; cv.height = Math.min(maxH, Math.ceil(lines.length / cols) * rowH + 4);
  const g = cv.getContext('2d');
  g.font = `${px}px ${font}`; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff';
  const rows = lines.map((l, i) => {
    const c = Math.floor(i / perCol), r = i % perCol, x0 = c * colW + 4, y0 = r * rowH + 2;
    const s = l.slice(0, maxN);
    g.fillText(s, x0, y0 + Math.round(px * 1.0));
    return { x0, y0, y1: y0 + rowH, n: s.length };
  });
  return { canvas: cv, key: `codeAtlas${++atlasN}`, rows, adv, rowH };
}

const mod = (a, n) => ((a % n) + n) % n;
export function streamQuads(out, A, o) {
  const N = A.rows.length;
  if (!N) return out;
  const gap = o.gap ?? 4, chunk = o.chunk ?? 6, read = o.read ?? 1, alpha = o.alpha || (() => 1);
  let a = o.head, j = o.start || 0;
  for (let guard = 0; guard < 2000; guard++) {                // skip the lines wholly before u0
    const w = A.rows[mod(j, N)].n * o.gw;
    if (a + w >= o.u0) break;
    a += w + gap * o.gw; j++;
  }
  for (let guard = 0; guard < 400 && a < o.u1; guard++) {
    const r = A.rows[mod(j, N)], n = r.n, w = n * o.gw;
    for (let c0 = 0; c0 < n; c0 += chunk) {
      const c1 = Math.min(n, c0 + chunk);
      const ua = read > 0 ? a + c0 * o.gw : a + w - c0 * o.gw, ub = read > 0 ? a + c1 * o.gw : a + w - c1 * o.gw;
      if (Math.max(ua, ub) < o.u0 || Math.min(ua, ub) > o.u1) continue;
      const aa = alpha(ua), ab = alpha(ub);
      if (aa <= 0.002 && ab <= 0.002) continue;
      out.push({
        P: [o.path(ua), o.path(ub), o.top(ub), o.top(ua)],
        uv: [r.x0 + c0 * A.adv, r.y0, r.x0 + c1 * A.adv, r.y1],
        col: o.col, a: [aa, ab, ab, aa],
      });
    }
    a += w + gap * o.gw; j++;
  }
  return out;
}
