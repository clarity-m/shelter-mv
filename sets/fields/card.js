// S34 (revision 9): the compute card Clawd designs, in lines of light. The card's lines are given in
// screen px at S35's first frame (O's paper card, MATCH.md; a placeholder until it is published),
// unprojected through S34's last camera onto a vertical plane through the card's foot, so the last
// frame lands them exactly. The card grows up out of the soil as the plant did: the gold edge
// connector first, then the board rising from its bottom edge, the traces running up from the
// connector, the chip and its fine grid, and the heat fins last (the plant's grain head).
// Each line grows from its lowest point; a closed outline grows up both sides and closes at the top.

// ---------------------------------------------------------------- a placeholder card (screen px)
// A board standing on its edge connector, face to the lens: 440 x 190 px, the connector's fingers
// at the bottom (gold), a chip with an 8 x 8 grid, traces to the connector, heat fins over the right.
export function CARD_PLACEHOLDER() {
  const L = [];
  const rect = (x0, y0, x1, y1) => [[x0, y1], [x1, y1], [x1, y0], [x0, y0], [x0, y1]];
  const B = { x0: 1080, x1: 1520, y0: 790, y1: 985 };
  L.push({ part: 'board', pts: rect(B.x0, B.y0, B.x1, B.y1) });
  // the edge connector: a gold strip below the board's bottom edge, with fingers
  const C = { x0: 1150, x1: 1400, y0: 985, y1: 1004 };
  L.push({ part: 'connector', pts: rect(C.x0, C.y0, C.x1, C.y1) });
  for (let x = C.x0 + 6; x < C.x1 - 3; x += 9) L.push({ part: 'finger', pts: [[x, C.y1 - 2], [x, C.y0 + 3]] });
  // the chip: a square with a fine grid
  const K = { x0: 1150, y0: 835, s: 104 };
  L.push({ part: 'chip', pts: rect(K.x0, K.y0, K.x0 + K.s, K.y0 + K.s) });
  for (let i = 1; i < 8; i++) {
    const t = K.s * i / 8;
    L.push({ part: 'grid', pts: [[K.x0 + t, K.y0 + K.s], [K.x0 + t, K.y0]] });
    L.push({ part: 'grid', pts: [[K.x0, K.y0 + K.s - t], [K.x0 + K.s, K.y0 + K.s - t]] });
  }
  // traces: from the connector up to the chip's pins (45-degree bends)
  for (let i = 0; i < 7; i++) {
    const xc = C.x0 + 20 + i * 30, xk = K.x0 + 10 + i * 14, yk = K.y0 + K.s;
    const ym = yk + 14 + 4 * Math.abs(i - 3);
    L.push({ part: 'trace', pts: [[xc, C.y0], [xc, ym + Math.abs(xc - xk)], [xk, ym], [xk, yk]] });
  }
  for (let i = 0; i < 4; i++) {           // and out to the right, under the fins
    const y = K.y0 + 16 + i * 24;
    L.push({ part: 'trace', pts: [[K.x0 + K.s, y], [K.x0 + K.s + 40, y], [K.x0 + K.s + 58, y + 18]] });
  }
  // heat fins: parallel vertical blades over the right of the board
  for (let x = 1300; x <= 1500; x += 13) L.push({ part: 'fin', pts: [[x, 972], [x, 804]] });
  return L;
}

// ---------------------------------------------------------------- growth order
// [start, length] within the growth (0..1), by the part's name (O's names may differ: keywords)
function orderOf(part) {
  const p = part.toLowerCase();
  if (/connect|finger|edge|gold|pin|pad|tab/.test(p)) return [0.0, 0.22];
  if (/board|pcb|outline|card|bracket|plate/.test(p)) return [0.1, 0.3];
  if (/trace|wire|route/.test(p)) return [0.3, 0.26];
  if (/chip|die|pkg|package/.test(p)) return [0.46, 0.16];
  if (/grid|core|cell/.test(p)) return [0.58, 0.16];
  if (/fin|heat|sink|fan|cool/.test(p)) return [0.7, 0.3];
  return [0.4, 0.3];
}
// true for the gold parts (drawn in gold light, not white)
export const isGold = (part) => /connect|finger|edge|gold|pad|tab/.test(part.toLowerCase());

// ---------------------------------------------------------------- lines -> growing parts
const resample = (pts, step) => {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / step));
    for (let j = 1; j <= n; j++) out.push([a[0] + (b[0] - a[0]) * j / n, a[1] + (b[1] - a[1]) * j / n]);
  }
  return out;
};
// lines: [{ part, pts }] in screen px; B: camBasis of the last camera (1920 x 1080); foot: world point
// under the card's foot. Returns [{ part, gold, edges: [[world offset from foot]...], at, len }].
export function cardFromLines(lines, B, foot) {
  const n = [B.fwd[0], 0, B.fwd[2]], nl = Math.hypot(n[0], n[2]); n[0] /= nl; n[2] /= nl;
  const un = (q) => {
    const nx = (q[0] / 960 - 1 - B.pp[0]) * B.aspect / B.fy, ny = (1 - q[1] / 540 - B.pp[1]) / B.fy;
    const d = [0, 1, 2].map((k) => B.fwd[k] + B.right[k] * nx + B.up[k] * ny);
    const t = ((foot[0] - B.pos[0]) * n[0] + (foot[2] - B.pos[2]) * n[2]) / (d[0] * n[0] + d[2] * n[2]);
    return [B.pos[0] + d[0] * t - foot[0], B.pos[1] + d[1] * t - foot[1], B.pos[2] + d[2] * t - foot[2]];
  };
  let cx = 0, cn = 0; for (const L of lines) for (const p of L.pts) { cx += p[0]; cn++; }
  cx /= Math.max(cn, 1);
  // within each part, stagger its lines bottom-up then outward from the centre
  const groups = new Map();
  for (const L of lines) { const k = L.part.replace(/\d+$/, ''); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(L); }
  const out = [];
  for (const [k, Ls] of groups) {
    const [at0, len0] = orderOf(k);
    const key = (L) => { const low = Math.max(...L.pts.map((p) => p[1])); const mx = L.pts.reduce((s, p) => s + p[0], 0) / L.pts.length; return -low * 1000 + Math.abs(mx - cx); };
    const sorted = Ls.slice().sort((a, b) => key(a) - key(b));
    sorted.forEach((L, i) => {
      const m = sorted.length, per = m > 1 ? Math.min(len0 * 0.6, len0 / Math.sqrt(m)) : len0;
      const at = at0 + (m > 1 ? (len0 - per) * i / (m - 1) : 0);
      const P = resample(L.pts, 3);
      const closed = Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 1.5;
      let edges;
      if (closed) {
        const Q = P.slice(0, -1), N = Q.length;
        // start: the lowest points' band, the one nearest the card's centre; end: half the loop on
        const low = Math.max(...Q.map((p) => p[1]));
        let s = 0, best = 1e9;
        Q.forEach((p, j) => { if (p[1] > low - 2 && Math.abs(p[0] - cx) < best) { best = Math.abs(p[0] - cx); s = j; } });
        const e = (s + Math.floor(N / 2)) % N;
        const a = [], b = [];
        for (let j = s; ; j = (j + 1) % N) { a.push(Q[j]); if (j === e) break; }
        for (let j = s; ; j = (j - 1 + N) % N) { b.push(Q[j]); if (j === e) break; }
        edges = [a, b];
      } else {
        const p0 = P[0], p1 = P[P.length - 1];
        const lowFirst = Math.abs(p0[1] - p1[1]) > 3 ? p0[1] > p1[1] : Math.abs(p0[0] - cx) <= Math.abs(p1[0] - cx);
        edges = [lowFirst ? P : P.slice().reverse()];
      }
      out.push({ part: L.part, gold: isGold(L.part), edges: edges.map((E) => E.map(un)), at, len: per });
    });
  }
  return out;
}
export const cardDrawn = (part, g) => Math.max(0, Math.min(1, (g - part.at) / part.len));
// the card's foot pixel: the bottom centre of its gold edge connector (else of its lowest line)
export function footPixel(lines) {
  const gold = lines.filter((L) => isGold(L.part)), use = gold.length ? gold : lines;
  let low = -1e9; for (const L of use) for (const p of L.pts) low = Math.max(low, p[1]);
  const band = []; for (const L of use) for (const p of L.pts) if (p[1] > low - 2) band.push(p[0]);
  return [(Math.min(...band) + Math.max(...band)) / 2, low];
}
