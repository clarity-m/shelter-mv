// Token corpus for the 1D token world (rung 0). Generic, invented training-data-like text:
// code, facts, math, markup, numbers, joined by <|endoftext|>. Never song text of any kind.
// tokenize() is a small BPE-looking heuristic: leading-space words, digit groups of <= 3,
// punctuation runs, newlines, and long words split into 3-6 letter pieces.
import { hash } from '../../lib/util.js';

export const EOT = '<|endoftext|>';
export const NL = '\n';

const DOCS = [
  'def softmax(x):\n    e = np.exp(x - x.max())\n    return e / e.sum()',
  'The Mariana Trench is about 10,994 m deep at its lowest known point.',
  '{"id": 4096, "lang": "en", "split": "train", "tokens": 512}',
  '$$\\mathrm{Attention}(Q,K,V) = \\mathrm{softmax}(QK^T / \\sqrt{d_k}) V$$',
  'Water boils at 100 degrees Celsius at sea level.',
  '<div class="row">\n  <span id="count">42</span>\n</div>',
  'int main(void) {\n    printf("%d\\n", 7 * 6);\n    return 0;\n}',
  '3.14159265358979323846264338327950288',
  'Photosynthesis converts light into chemical energy stored in glucose.',
  '## Installation\n```bash\npip install numpy scipy\n```',
  'e^{i\\pi} + 1 = 0',
  'La ville de Paris compte vingt arrondissements.',
  'SELECT name, COUNT(*) FROM orders GROUP BY name ORDER BY 2 DESC;',
  'year,rainfall_mm,temp_c\n2019,812,11.4\n2020,764,12.1\n2021,903,10.8',
  'const total = items.reduce((acc, x) => acc + x.price, 0);',
  'The speed of light in vacuum is 299,792,458 metres per second.',
  'model:\n  n_layers: 32\n  n_heads: 32\n  d_model: 4096\n  vocab: 50257',
  'fn add(a: i32, b: i32) -> i32 {\n    a + b\n}',
  'Copper is a good conductor of both heat and electricity.',
  'for i in range(n):\n    acc += w[i] * x[i]',
  'x = torch.randn(8, 512, 768, device="cuda")',
  'An octopus has three hearts and blue blood.',
  '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
  'In 1969 the Apollo 11 lander touched down on the Moon.',
  'git commit -m "fix: off-by-one in the batch loader"',
  'The human skeleton has 206 bones in adulthood.',
  'import numpy as np\nimport matplotlib.pyplot as plt',
  'Prime numbers: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37',
  'while (lo < hi) {\n    mid = (lo + hi) >> 1;\n}',
  'Mount Everest stands 8,849 metres above sea level.',
  '<p class="note">Results are averaged over 5 seeds.</p>',
  'print(f"step {step:>6d}  loss {loss:.4f}")',
  'The Pacific is the largest and deepest ocean on Earth.',
  '1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377',
  'H2O + CO2 -> H2CO3',
  'if __name__ == "__main__":\n    main()',
  'Honey that is sealed well can keep for a very long time.',
  'ls -la /var/log | grep error | wc -l',
  'The derivative of sin(x) is cos(x).',
  'px.color = "#d97757"',
  'Bees communicate the direction of food with a waggle dance.',
  'return [k for k, v in counts.items() if v > 1]',
  'A leap year has 366 days; February then has 29.',
  '.card { margin: 0 auto; padding: 12px 16px; }',
  'Granite is an igneous rock rich in quartz and feldspar.',
  'assert len(batch) == 2048',
  'The Nile flows north into the Mediterranean Sea.',
  'let grid = vec![vec![0u8; 64]; 64];',
  'Sound travels at about 343 metres per second in air.',
  'lr = 3e-4 * min(1.0, step / 2000)',
];

// words kept whole even when long (common enough to be single tokens)
const WHOLE = new Set(['Installation', 'conductor', 'electricity', 'information', 'Attention', 'direction',
  'Mediterranean', 'communicate', 'Photosynthesis', 'arrondissements', 'Celsius', 'lowest']);

function splitWord(w, seed) {
  // w may carry one leading space. Long words become BPE-ish pieces.
  const lead = w[0] === ' ' ? ' ' : '';
  const core = lead ? w.slice(1) : w;
  if (core.length <= 7 || (WHOLE.has(core) && core.length <= 11)) return [w];
  const out = [];
  let i = 0, first = true;
  while (i < core.length) {
    const left = core.length - i;
    let n = 3 + Math.floor(hash(seed, i, 7) * 4);           // 3..6 letters
    if (left - n < 2) n = left;
    out.push((first ? lead : '') + core.slice(i, i + n));
    first = false; i += n;
  }
  return out;
}

export function tokenize(text, seed = 0) {
  const re = / ?[A-Za-z_]+| ?\d{1,3}|\n| {2,}(?! )| ?[^\sA-Za-z_\d]+| /g;
  const out = [];
  let m, n = 0;
  while ((m = re.exec(text))) {
    const t = m[0];
    if (/^ ?[A-Za-z_]+$/.test(t)) out.push(...splitWord(t, seed * 131 + n));
    else if (/^ ?[^\sA-Za-z_\d]{4,}$/.test(t)) { for (let i = 0; i < t.length; i += 2) out.push(t.slice(i, i + 2)); }
    else out.push(t);
    n++;
  }
  return out;
}

// How a tokenizer viewer prints a token.
export const show = (t) => (t === NL ? '\\n' : /^ +$/.test(t) ? '·'.repeat(t.length) : t);
export const isWS = (t) => t === NL || /^ +$/.test(t);

// The whole stream: documents in a fixed shuffled order, repeated, joined by EOT.
// Returns [{t, disp, s0, n, doc, warm}] where s0 is the start in text space (chars, with a
// 0.35-char gap between tokens) and n is the display length.
export function buildStream(repeats = 3) {
  const GAP = 0.35;
  const toks = [];
  let s = 0, d = 0;
  for (let r = 0; r < repeats; r++) {
    const order = DOCS.map((_, i) => i).sort((a, b) => hash(a, r, 5) - hash(b, r, 5));
    for (const i of order) {
      const pieces = [EOT, ...tokenize(DOCS[i], i + 97 * r)];
      const hexDoc = DOCS[i].includes('#d97757');
      for (const t of pieces) {
        const disp = show(t);
        // the one token family that relates to him: his own colour, spelled out in hex
        const warm = hexDoc && /^(d|977|57| ?"#|")$/.test(t) ? 1 : 0;
        toks.push({ t, disp, s0: s, n: disp.length, doc: d, warm });
        s += disp.length + GAP;
      }
      d++;
    }
  }
  return { toks, length: s };
}
