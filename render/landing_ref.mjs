// Dump S21's core landing lines (sets/paper-fusion/landing.js) to out/stills/landing_S21.json.
import { writeFileSync } from 'fs';
import { coreLines, FOCUS } from '../sets/paper-fusion/landing.js';
const L = coreLines();
writeFileSync('out/stills/landing_S21.json', JSON.stringify({ focus: FOCUS, lines: L }));
const k = {}; for (const l of L) k[l.kind] = (k[l.kind] || 0) + 1;
let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
for (const l of L) for (const p of [l.a, l.b]) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
console.log(L.length, 'lines', JSON.stringify(k), 'bbox', [x0, y0, x1, y1].map((v) => v.toFixed(1)).join(' '), 'focus', FOCUS.map((v) => v.toFixed(1)).join(' '));
