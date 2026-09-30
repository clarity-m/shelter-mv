"""Build frame-v2.html from the v1 source (frame.html is left untouched)."""
D = 'C:/Users/USER/Projects/shelter-mv/style-frames/09-style-pixel/'
s = open(D + 'frame.html', encoding='utf-8').read()


def rep(a, b, count=1):
    global s
    assert s.count(a) == count, (s.count(a), a[:80])
    s = s.replace(a, b)


rep('<title>Shelter MV - style frame 09 - pixel</title>', '<title>Shelter MV - style frame 09 v2 - pixel</title>')
rep('// Shelter MV, style frame 09: "The harness", pixel art.',
    '// Shelter MV, style frame 09 v2: "The harness", pixel art. v2: faceless\n'
    '// researchers, finger-like harness, Clawd scale switch (?cs=1|2).')

# ---------------------------------------------------------------- constants
rep('''const HX = 244.5, HY = 181;                 // harness base centre
const CLX0 = 236, CLY0 = 171;               // Clawd glyph origin (18x10 native)
const LX = 244.5, LY = 175;                 // Clawd light centre''',
'''const Q = new URLSearchParams(location.search);
const CS = +(Q.get('cs') || 2);             // Clawd scale: glyph cell = CS x 2CS native px
const HX = 244.5, HY = 181;                 // harness base centre
const CLW = 18 * CS, CLH = 10 * CS;
const CLX0 = Math.round(HX - CLW / 2), CLY0 = HY - CLH;   // feet rest on the plate
const LX = HX, LY = CLY0 + CLH / 2 - 0.5;   // Clawd light centre
// harness: plate + two cupped "hands" of jointed fingers, authored for RX = 25
const RX = CS === 2 ? 25 : 21, RY = CS === 2 ? 4.2 : 3.6, HS = RX / 25;
const FINGER_L = [                          // left hand, back to front
  { back: true, pts: [[-17, -3.1], [-22.5, -16], [-19.5, -31], [-10.5, -35.5]] },
  { back: true, pts: [[-21.5, -2], [-27.5, -15], [-25, -31.5], [-15, -37]] },
  { back: false, pts: [[-25, 0.4], [-31, -13], [-29, -29], [-19.5, -35]] },
  { back: false, front: true, pts: [[-21, 3.2], [-27, -6], [-26.5, -17.5], [-20.5, -23]] },
];
const FINGERS = [];
for (const f of FINGER_L) for (const side of [-1, 1])
  FINGERS.push({ side, back: f.back, front: !!f.front, pts: f.pts.map(([x, y]) => [HX + (side < 0 ? x : -x) * HS, HY + y * HS]) });
const STYLUS_TIP = FINGERS.find(f => f.side < 0 && !f.back && !f.front).pts[3];''')
rep('  return 3.3 * Math.pow(clamp(1 - d / 54, 0, 1), 1.35);',
    '  return 3.3 * Math.pow(clamp(1 - d / (CS === 2 ? 62 : 54), 0, 1), 1.35);')
rep('const warmInt = (x, y) => clamp(1.4 - Math.hypot(x - LX, (y - LY) * 1.1) / 90, 0, 1);',
    'const warmInt = (x, y) => clamp(1.4 - Math.hypot(x - LX, (y - LY) * 1.1) / (CS === 2 ? 98 : 90), 0, 1);')

# ---------------------------------------------------------------- researcher B: faceless, both hands on the mug, head bowed
rep("const HC = [425, 99], a = -0.08, sc = 0.78;", "const HC = [425, 99], a = -0.22, sc = 0.78;")
rep("  addPart(F, dark, -1, f => fillPoly([[436, 112], [444, 118], [446, 146], [441, 150], [437, 146]], f));\n", "")
rep("addPart(F, skin, 2, f => fillPoly(T([[-1, -4], [4, -7], [8.5, -5], [9.5, -1], [10.2, 1], [12, 3.5], [10.2, 4.5], [10.2, 6], [9.6, 7.5], [8.6, 9.5], [5.5, 11.5], [1, 10.5], [-2, 7], [-3, 2]]), f));",
    """// faceless: the face is a smooth oval shaded only by the monitor, bands run
  // from a cyan rim at the front edge back toward the hairline
  let faceB = null;
  const face = (x, y) => {
    if (!faceB) { faceB = {}; for (let i = 0; i < W * H; i++) if (PB[i] === faceId) { const yy = (i / W) | 0, xx = i % W; const b = faceB[yy] || (faceB[yy] = [xx, xx]); b[0] = Math.min(b[0], xx); b[1] = Math.max(b[1], xx); } }
    const [l, r] = faceB[y]; const u = (x - l) / Math.max(1, r - l);
    return u < 0.1 ? Mo[2] : u < 0.38 ? Sk[3] : u < 0.72 ? Sk[2] : Sk[1];
  };
  const faceId = addPart(F, face, 2, f => fillPoly(T([[-1, -4], [4, -7], [8.5, -5], [10, -1.5], [10.6, 2], [10.3, 5.5], [9, 8.8], [6, 11.2], [1, 10.5], [-2, 7], [-3, 2]]), f));""")
rep("  addPart(F, skin, 2.5, f => fillEllipse(HC[0] + 1.6, HC[1] + 1.5, 1.7, 2.3, f));\n", "")
rep("  addPart(F, dark, 5, f => fillPoly([[406, 130], [412, 131], [413, 136], [405, 137], [401, 134], [401, 129]], f));",
    "  addPart(F, dark, 4.5, f => fillPoly([[436, 127], [439, 133], [411, 135], [406, 131], [407, 126]], f));   // far forearm across the chest\n"
    "  addPart(F, dark, 5, f => fillPoly([[406, 130], [412, 131], [413, 136], [405, 137], [401, 134], [401, 129]], f));")
rep("  addPart(F, skin, 7, f => fillPoly([[400, 128], [404, 127], [405, 131], [401, 133]], f));",
    "  addPart(F, skin, 7, f => fillPoly([[400, 128], [404, 127], [405, 131], [401, 133]], f));\n"
    "  addPart(F, skin, 7.5, f => fillPoly([[402, 123], [406, 122], [407, 127], [403, 127]], f));    // second hand cradling the mug")
rep('''  const P = p => T([p])[0].map(Math.round);
  const e = P([6.5, 0.5]);
  set(e[0], e[1], C[1]); set(e[0] + 1, e[1], C[1]);
  set(e[0] - 1, e[1] - 1, C[1]); set(e[0], e[1] - 1, C[1]); set(e[0] + 1, e[1] - 1, Mo[2]); set(e[0] + 2, e[1] - 1, C[1]);
  const m = P([9, 7.5]); set(m[0], m[1], Sk[0]);
''', '')

# ---------------------------------------------------------------- rib shadows from finger roots
rep("  const bases = [[-15, -2.5], [-20.5, 0], [-16, 2.5], [15, -2.5], [20.5, 0], [16, 2.5]];",
    "  const bases = FINGERS.map(f => [f.pts[0][0] - HX, f.pts[0][1] - HY]);")
rep("cable([[263, 183], [292, 191], [322, 192], [350, 190]], cableHi);",
    "cable([[HX + RX - 3, HY + 2], [292, 191], [322, 192], [350, 190]], cableHi);")
rep("cable([[259, 183], [270, 186], [276, 189], [282, 190]], cableHi);",
    "cable([[HX + RX - 7, HY + 3], [272, 187], [278, 189], [284, 190]], cableHi);")

# ---------------------------------------------------------------- harness: fingers
a = s.index('// =============================================================== harness ===')
b = s.index('// ================================================================= Clawd ===')
s = s[:a] + '''// =============================================================== harness ===
// Two cupped hands of jointed fingers rising from a base plate and curling in
// toward Clawd without closing. Each finger is a tapered tube: the side facing
// Clawd takes his light, the outer side takes the moon (left hand) or falls to
// shadow (right hand); knuckles are notched, fingertips catch a glint.
const warmOn = (x, y, gain, rad) => gain * Math.pow(clamp(1 - Math.hypot(x - LX, (y - LY) * 1.05) / rad, 0, 1), 0.85);
function fingerGeom(P) {
  const dense = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24, t2 = t * t, t3 = t2 * t;
      const f = j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      dense.push([f(0), f(1)]);
    }
  }
  dense.push(P[P.length - 1]);
  const acc = [0];
  for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  return { dense, acc, len: acc[acc.length - 1], joints: [acc[24], acc[48]] };
}
function drawFinger(f) {
  const G = fingerGeom(f.pts);
  const w0 = (f.front ? 3.9 : 3.4) * HS + 0.2, w1 = (f.front ? 2.8 : 2.3) * HS + 0.2;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of G.dense) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0 - 3); y <= Math.ceil(y1 + 3); y++) for (let x = Math.floor(x0 - 3); x <= Math.ceil(x1 + 3); x++) {
    const px = x + 0.5, py = y + 0.5;
    let best = 1e9, bi = 0;
    for (let i = 0; i < G.dense.length; i++) {
      const dx = px - G.dense[i][0], dy = py - G.dense[i][1], d2 = dx * dx + dy * dy;
      if (d2 < best) { best = d2; bi = i; }
    }
    const s = G.acc[bi], u = s / G.len;
    let w = w0 + (w1 - w0) * u;
    let knuckle = false;
    for (const J of G.joints) if (Math.abs(s - J) < 1.6) { w += 0.9 * HS; knuckle = Math.abs(s - J) < 0.55; }
    if (Math.sqrt(best) > w / 2) continue;
    const [cx, cy] = G.dense[bi];
    const lx = LX - cx, ly = LY - cy, ll = Math.hypot(lx, ly) || 1;
    const sn = ((px - cx) * lx + (py - cy) * ly) / ll / (w / 2);        // +1 = faces Clawd
    const warm = warmOn(cx, cy, f.back ? 4.1 : 5.1, 64 * HS);
    const moonLit = f.side < 0 && !f.back;
    let c;
    if (sn > 0.3) c = [C[6], Wc[3], Wc[4], Wc[6], Wc[7]][clamp(qd(warm, x, y, 3), 0, 4)];
    else if (sn > -0.4) c = f.back ? (warm > 2.6 ? Wc[2] : C[4]) : (warm > 2.4 ? Wc[3] : C[6]);
    else c = f.back ? C[2] : (moonLit ? (u > 0.3 ? C[7] : C[6]) : C[3]);
    if (knuckle) c = sn > 0.3 ? Wc[8] : (f.back ? C[1] : C[2]);
    if (u > 0.94 && sn > -0.2) c = f.back ? Wc[6] : Wc[8];               // fingertip glint
    set(x, y, c, L_HARN);
  }
}
(function basePlate() {
  fillEllipse(HX, HY, RX + 1, RY, (x, y) => {
    const d = Math.hypot(x + 0.5 - LX, (y + 0.5 - HY) * 2.5);
    const k = qd(4.8 * Math.pow(clamp(1 - d / (RX + 4), 0, 1), 0.75), x, y, 3);
    set(x, y, [C[5], Wc[3], Wc[4], Wc[6], Wc[7], Wc[7]][clamp(k, 0, 5)], L_HARN);
  });
  for (let x = Math.floor(HX - RX - 1); x <= Math.ceil(HX + RX + 1); x++) {
    const dx = (x + 0.5 - HX) / (RX + 1);
    if (Math.abs(dx) > 1) continue;
    const y = Math.round(HY + RY * Math.sqrt(1 - dx * dx));
    const near = Math.abs(x + 0.5 - HX) < RX * 0.62;
    set(x, y, near ? Wc[4] : C[6], L_HARN); set(x, y + 1, near ? Wc[2] : C[3], L_HARN); set(x, y + 2, C[0], L_HARN);
  }
})();
FINGERS.filter(f => !f.front).forEach(drawFinger);

''' + s[b:]

# ---------------------------------------------------------------- Clawd at integer scale
rep('''function drawClawd(x0, y0) {
  for (let r = 0; r < 5; r++) for (let c = 0; c < 18; c++) {
    if (CLAWD[r][c] === '#') { set(x0 + c, y0 + r * 2, Wc[5], L_CLAWD); set(x0 + c, y0 + r * 2 + 1, Wc[5], L_CLAWD); }
  }
  for (const ex of [5, 12]) { set(x0 + ex, y0 + 2, C[1], L_CLAWD); set(x0 + ex, y0 + 3, C[1], L_CLAWD); }
}
drawClawd(CLX0, CLY0);
RIBS.filter(r => !r.back).forEach(drawRib);''',
'''// each glyph cell becomes an s x 2s block of native pixels; eyes read as the
// dark terminal behind him
function drawClawd(x0, y0, s) {
  for (let r = 0; r < 5; r++) for (let c = 0; c < 18; c++) {
    const eye = r === 1 && (c === 5 || c === 12);
    if (CLAWD[r][c] !== '#' && !eye) continue;
    for (let j = 0; j < 2 * s; j++) for (let i = 0; i < s; i++)
      set(x0 + c * s + i, y0 + r * 2 * s + j, eye ? C[1] : Wc[5], L_CLAWD);
  }
}
drawClawd(CLX0, CLY0, CS);
FINGERS.filter(f => f.front).forEach(drawFinger);''')

# ---------------------------------------------------------------- researcher A: faceless head, shifted clear of the bigger cup
a = s.index('const HEAD_A = [')
b = s.index('const HEAD_KEY = {')
s = s[:a] + '''const HEAD_A = [                           // faceless: hair, bun, and a face shaped only by light
  '....777....................',
  '..7733277..................',
  '..7442221..................',
  '.725222227.................',
  '.742222222755555...........',
  '.74222221444232255.........',
  '..72222415224433225........',
  '..712241523222223325.......',
  '....71122223322222325......',
  '...724522222233222232a.....',
  '...5242233222223222ars.....',
  '..72422222332222qqrrrrs....',
  '..52422222233qqqrrrrrss....',
  '..52222222232qqqrrrrrsst...',
  '..52222222223qqrrrrrssst...',
  '..52222222223qqrrrrrssst...',
  '..52222222223qqrrrrsssst...',
  '..52222222231qrrrrsssst....',
  '...5222222321qrrrssssst....',
  '...5222222221qrrssssttt....',
  '....5222222221rrsssttv.....',
  '.....522222221rsssttvt.....',
  '......52222pppprssttt......',
  '.......5122ppqqprstt.......',
  '.........5qqqqqprt.........',
  '.........qqqqqr............',
  '.........qqqqqr............',
  '........qqqqqr.............',
  '........qqqqqr.............',
];
''' + s[b:]
rep("(function researcherA() {\n  const F = 'A';",
    "(function researcherA() {\n  const F = 'A';\n  const AX = CS === 2 ? -9 : 0;                 // step back from the larger cup\n  const ox = pts => pts.map(([x, y]) => [x + AX, y]);")
rep("addPart(F, body, 0, f => fillPoly([[171, 184], [169, 170], [171, 158], [178, 147], [188, 140], [199, 138], [207, 142], [211, 152], [210, 168], [207, 184]], f));",
    "addPart(F, body, 0, f => fillPoly(ox([[171, 184], [169, 170], [171, 158], [178, 147], [188, 140], [199, 138], [207, 142], [211, 152], [210, 168], [207, 184]]), f));")
rep("addPart(F, body, 0.6, f => fillPoly([[186, 135], [197, 134], [204, 139], [197, 143], [189, 141]], f));",
    "addPart(F, body, 0.6, f => fillPoly(ox([[186, 135], [197, 134], [204, 139], [197, 143], [189, 141]]), f));")
rep("const ARM_U = [[198, 139], [208, 141], [214, 152], [216, 163], [211, 169], [205, 166], [201, 152]];",
    "const ARM_U = ox([[198, 139], [208, 141], [214, 152], [216, 163], [211, 169], [205, 166], [201, 152]]);")
rep("const ARM_F = [[209, 164], [213, 156], [216, 149], [221, 145], [224, 149], [219, 160], [213, 169]];",
    "const ARM_F = ox([[209, 164], [213, 156], [216, 149], [221, 145], [224, 149], [219, 160], [213, 169]]);")
for pts in ["[[186, 146], [179, 153], [175, 163]]", "[[193, 147], [190, 157]]", "[[180, 173], [190, 171], [199, 174]]",
            "[[210, 157], [213, 162]]", "[[205, 147], [207, 153]]"]:
    rep("fold(" + pts, "fold(ox(" + pts + ")")
rep("fold(ox([[210, 157], [213, 162]]), C[3]);", "fold(ox([[210, 157], [213, 162]]), C[3]);")
s = s.replace("fold(ox([[186, 146], [179, 153], [175, 163]]);", "fold(ox([[186, 146], [179, 153], [175, 163]]));")
s = s.replace("fold(ox([[193, 147], [190, 157]]);", "fold(ox([[193, 147], [190, 157]]));")
s = s.replace("fold(ox([[180, 173], [190, 171], [199, 174]]);", "fold(ox([[180, 173], [190, 171], [199, 174]]));")
s = s.replace("fold(ox([[210, 157], [213, 162]], C[3]);", "fold(ox([[210, 157], [213, 162]]), C[3]);")
s = s.replace("fold(ox([[205, 147], [207, 153]], C[3]);", "fold(ox([[205, 147], [207, 153]]), C[3]);")
rep("sprite(183, 110, HEAD_A, HEAD_KEY, L_FIGA);", "sprite(183 + AX, 110, HEAD_A, HEAD_KEY, L_FIGA);")
rep("fillPoly([[186, 136], [196, 135], [203, 139], [197, 142], [189, 141]], (x, y) => set(x, y, y <= 136 ? C[6] : C[5], L_FIGA));",
    "fillPoly(ox([[186, 136], [196, 135], [203, 139], [197, 142], [189, 141]]), (x, y) => set(x, y, y <= 136 ? C[6] : C[5], L_FIGA));")
rep("set(196, 135, Sk[2], L_FIGA);", "set(196 + AX, 135, Sk[2], L_FIGA);")
rep('''  sprite(214, 137, HAND_A, { q: Sk[1], r: Sk[2], s: Sk[3], t: Sk[4], v: Wc[7] }, L_FIGA);
  polyline([[219, 140], [231, 145]], (x, y) => set(x, y, C[1], L_FIGA));
  polyline([[219, 139], [224, 141]], (x, y) => set(x, y, C[5], L_FIGA));
  set(231, 145, Wc[8], L_FIGA); set(232, 144, Wc[7]); set(230, 143, Wc[6]); set(233, 146, Wc[6]);''',
'''  sprite(214 + AX, 137, HAND_A, { q: Sk[1], r: Sk[2], s: Sk[3], t: Sk[4], v: Wc[7] }, L_FIGA);
  // stylus from the pinch to the outer fingertip of the left hand
  const g0 = [219 + AX, 140], t0 = [Math.round(STYLUS_TIP[0] - 1.6), Math.round(STYLUS_TIP[1])];
  polyline([g0, t0], (x, y) => set(x, y, C[1], L_FIGA));
  const dl = Math.hypot(t0[0] - g0[0], t0[1] - g0[1]);
  polyline([[g0[0], g0[1] - 1], [g0[0] + 5 * (t0[0] - g0[0]) / dl, g0[1] - 1 + 5 * (t0[1] - g0[1]) / dl]], (x, y) => set(x, y, C[5], L_FIGA));
  set(t0[0], t0[1], Wc[8], L_FIGA); set(t0[0], t0[1] - 2, Wc[6]); set(t0[0] - 2, t0[1] - 1, Wc[6]);''')

# ---------------------------------------------------------------- sparks relative to Clawd
rep("[[240, 160, Wc[8]], [249, 157, Wc[7]], [236, 151, Wc[6]], [254, 147, Wc[6]], [244, 140, Wc[5]], [239, 129, Wc[4]], [251, 122, Wc[3]], [246, 111, Wc[2]]]\n    .forEach(([x, y, c]) => { if (layer(x, y) === L_WALL) set(x, y, c); });",
    "[[-4.5, -11, Wc[8]], [4.5, -14, Wc[7]], [-8.5, -20, Wc[6]], [9.5, -24, Wc[6]], [-0.5, -31, Wc[5]], [-5.5, -42, Wc[4]], [6.5, -49, Wc[3]], [1.5, -60, Wc[2]]]\n"
    "    .forEach(([dx, dy, c]) => { const x = Math.round(HX + dx), y = CLY0 + dy; if (layer(x, y) === L_WALL) set(x, y, c); });")

assert 'RIBS' not in s and 'drawRib' not in s, 'leftover v1 rib code'
open(D + 'frame-v2.html', 'w', encoding='utf-8').write(s)
print('wrote frame-v2.html', len(s))
