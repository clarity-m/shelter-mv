/* clawd-3d.js : extrude Clawd sprite grids into voxel solids, plus a small WebGL2 voxel raymarcher.
 *
 * Classic script: <script src="clawd-sprites.js"></script><script src="clawd-3d.js"></script>
 * then use window.Clawd3D. Also exports via module.exports when available.
 *
 * WORLD UNITS  One unit = one glyph pixel width. A glyph pixel is 1 wide x 2 tall, so a sprite cell is
 *   1 x 2 in x, y, and the body is extruded `depth` units in z (3 to 5 reads as Clawd; default 4).
 *   x right, y up, z toward the viewer. Origin = the frame's ground center: x = col - 11 for a 22 x 8
 *   frame (col - width / 2 in general), y = 0 at the ground line, z = 0 at mid-depth (front face +depth/2).
 *
 * buildVoxels(grid, depth, opts) -> array of boxes { x, y, z, w, h, d, key, kind, color }
 *   (x, y, z) is the min corner, (w, h, d) the size. kinds:
 *     'body'    '#' cells, full depth (horizontal runs merged when opts.merge)
 *     'floor'   ink floor of a recessed eye pocket ('o' cells, opts.eyes = 'recess')
 *     'inlay'   blush / tear pixels that sit inside the body: flush with the front face
 *     'accent'  floating accent pixels (heart, z, !, sparks): small inset voxels at mid-depth
 *     'object'  other accent pixels inside the body span (held light, carried things): small voxels
 *               just in front of the front face
 *   Everything except 'accent' / 'object' is aligned to a 1 x 2 x 0.5 lattice, so voxelize() is exact.
 */
(function (root) {
  'use strict';

  const DEFAULTS = {
    depth: 4,          // extrusion depth in pixel widths
    eyes: 'recess',    // 'recess' | 'punch'
    recess: 1.0,       // eye pocket depth (shallow keeps the ink floor visible from 3/4 views)
    floor: 0.5,        // thickness of the ink floor at the bottom of the pocket
    inlay: 0.5,        // thickness of blush / tear inlays
    accentDepth: 1,    // depth of accent voxels before inset
    inset: 0.12,       // accent voxels shrink by this much on every side (reads as separate little voxels)
    objectGap: 0.25,   // gap between the front face and held objects
    merge: true,       // merge horizontal runs of body / floor / inlay cells into single boxes
    dx: 0, dy: 0,      // motion offsets in cells (dy rows lift the sprite 2 units per row)
  };

  const SP = root.ClawdSprites;
  const COLORS = Object.assign({ '#': '#D97757', 'w': '#F5F0E8', 'g': '#8F8A82', 'p': '#F4A2B3',
                                 'b': '#8CCBF2', 'y': '#FFD483' }, SP ? SP.PALETTE : {}, { 'k': '#1E1714' });
  delete COLORS.o;
  // Material ids used by voxelize() and the renderer.
  const MATERIAL = { '#': 1, 'k': 2, 'p': 3, 'b': 4, 'w': 5, 'y': 6, 'g': 7 };

  function buildVoxels(grid, depth, opts) {
    const o = Object.assign({}, DEFAULTS, opts || {});
    const D = depth || o.depth;
    const rows = grid.length, cols = grid[0].length;
    const cx = cols / 2, zb = -D / 2, zf = D / 2;
    const out = [];
    const add = (x, y, z, w, h, d, key, kind) => {
      if (w > 0 && h > 0 && d > 0) out.push({ x, y, z, w, h, d, key, kind, color: COLORS[key] });
    };
    for (let r = 0; r < rows; r++) {
      const row = grid[r];
      const y = (rows - 1 - r) * 2 + o.dy * 2;
      let first = -1, last = -1;
      for (let c = 0; c < cols; c++) if (row[c] === '#' || row[c] === 'o') { if (first < 0) first = c; last = c; }
      for (let c = 0; c < cols; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const x = c - cx + o.dx;
        if (ch === '#') { add(x, y, zb, 1, 2, D, '#', 'body'); continue; }
        if (ch === 'o') {
          if (o.eyes === 'punch') continue;
          const zfloor = zf - o.recess;
          add(x, y, zb, 1, 2, zfloor - o.floor - zb, '#', 'body');
          add(x, y, zfloor - o.floor, 1, 2, o.floor, 'k', 'floor');
          continue;
        }
        const inside = first >= 0 && c > first && c < last;
        if (inside && (ch === 'p' || ch === 'b')) {
          add(x, y, zb, 1, 2, D - o.inlay, '#', 'body');
          add(x, y, zf - o.inlay, 1, 2, o.inlay, ch, 'inlay');
          continue;
        }
        const i = o.inset, a = o.accentDepth;
        const z0 = inside ? zf + o.objectGap : -a / 2;
        add(x + i, y + i, z0 + i, 1 - 2 * i, 2 - 2 * i, a - 2 * i, ch, inside ? 'object' : 'accent');
      }
    }
    return o.merge ? mergeRuns(out) : out;
  }

  // Merge horizontally adjacent lattice boxes with identical y, z, h, d, key and kind.
  function mergeRuns(boxes) {
    const keep = [], lattice = [];
    boxes.forEach(b => (b.kind === 'accent' || b.kind === 'object' ? keep : lattice).push(b));
    lattice.sort((a, b) => a.y - b.y || a.z - b.z || a.d - b.d || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) || a.x - b.x);
    const merged = [];
    for (const b of lattice) {
      const m = merged[merged.length - 1];
      if (m && m.y === b.y && m.z === b.z && m.h === b.h && m.d === b.d && m.key === b.key && m.kind === b.kind &&
          Math.abs(m.x + m.w - b.x) < 1e-9) m.w += b.w;
      else merged.push(Object.assign({}, b));
    }
    return merged.concat(keep);
  }

  // Dense material grid for the lattice boxes (body / floor / inlay). Accents stay as boxes.
  function voxelize(boxes, opts) {
    const dz = (opts && opts.dz) || 0.5;
    const lat = boxes.filter(b => b.kind !== 'accent' && b.kind !== 'object');
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (const b of lat) {
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); z0 = Math.min(z0, b.z);
      x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); z1 = Math.max(z1, b.z + b.d);
    }
    if (!lat.length) { x0 = y0 = z0 = 0; x1 = 1; y1 = 2; z1 = dz; }
    x0 = Math.floor(x0) - 1; x1 = Math.ceil(x1) + 1;
    y0 = Math.floor(y0 / 2) * 2; y1 = Math.ceil(y1 / 2) * 2 + 2;
    z0 = Math.floor(z0 / dz) * dz - dz; z1 = Math.ceil(z1 / dz) * dz + dz;
    const nx = Math.round(x1 - x0), ny = Math.round((y1 - y0) / 2), nz = Math.round((z1 - z0) / dz);
    const data = new Uint8Array(nx * ny * nz);
    for (const b of lat) {
      const id = MATERIAL[b.key] || 1;
      for (let k = 0; k < nz; k++) {
        const zc = z0 + (k + 0.5) * dz; if (zc < b.z || zc > b.z + b.d) continue;
        for (let j = 0; j < ny; j++) {
          const yc = y0 + (j + 0.5) * 2; if (yc < b.y || yc > b.y + b.h) continue;
          for (let i = 0; i < nx; i++) {
            const xc = x0 + i + 0.5; if (xc < b.x || xc > b.x + b.w) continue;
            data[i + nx * (j + ny * k)] = id;
          }
        }
      }
    }
    return { data, dims: [nx, ny, nz], origin: [x0, y0, z0], cell: [1, 2, dz] };
  }

  // ---------------------------------------------------------------- WebGL2 voxel raymarcher
  const VS = `#version 300 es
  in vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FS = `#version 300 es
  precision highp float; precision highp int; precision highp usampler3D;
  uniform usampler3D uGrid;
  uniform ivec3 uDims; uniform vec3 uOrigin; uniform vec3 uCell;
  uniform int uNumAcc; uniform vec4 uAccMin[48]; uniform vec4 uAccMax[48];
  uniform vec2 uCenter; uniform vec3 uTarget; uniform float uUnitPx; uniform float uYaw; uniform float uElev;
  uniform vec3 uKeyDir; uniform vec3 uFillDir; uniform vec3 uKeyCol; uniform vec3 uFillCol;
  uniform vec3 uSkyCol; uniform vec3 uBounceCol; uniform vec3 uPal[8]; uniform float uEmit[8];
  uniform vec3 uGroundAlb; uniform float uGroundR; uniform float uGroundOn; uniform int uSS; uniform float uExposure;
  out vec4 outColor;

  vec3 rotY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
  uint cellAt(ivec3 c) {
    if (any(lessThan(c, ivec3(0))) || any(greaterThanEqual(c, uDims))) return 0u;
    return texelFetch(uGrid, c, 0).r;
  }
  float occ(ivec3 c) { return cellAt(c) != 0u ? 1.0 : 0.0; }

  float traceGrid(vec3 ro, vec3 rd, out vec3 n, out int m, out ivec3 ci) {
    vec3 gmin = uOrigin, gmax = uOrigin + vec3(uDims) * uCell;
    vec3 inv = 1.0 / rd;
    vec3 t0 = (gmin - ro) * inv, t1 = (gmax - ro) * inv;
    vec3 tmn = min(t0, t1), tmx = max(t0, t1);
    float tE = max(max(tmn.x, tmn.y), tmn.z), tX = min(min(tmx.x, tmx.y), tmx.z);
    if (tX <= max(tE, 0.0)) return -1.0;
    float t = max(tE, 0.0);
    n = -rd;
    if (tE >= 0.0) {
      if (tE == tmn.x) n = vec3(-sign(rd.x), 0.0, 0.0);
      else if (tE == tmn.y) n = vec3(0.0, -sign(rd.y), 0.0);
      else n = vec3(0.0, 0.0, -sign(rd.z));
    }
    vec3 p = (ro + rd * t - gmin) / uCell;
    ivec3 c = clamp(ivec3(floor((ro + rd * (t + 1e-4) - gmin) / uCell)), ivec3(0), uDims - 1);
    vec3 dc = rd / uCell;
    ivec3 st = ivec3(sign(dc));
    vec3 tD = abs(1.0 / dc);
    vec3 nb = vec3(c) + max(vec3(st), vec3(0.0));
    vec3 tN = t + (nb - p) / dc;
    for (int i = 0; i < 128; i++) {
      uint mm = texelFetch(uGrid, c, 0).r;
      if (mm != 0u) { m = int(mm); ci = c; return t; }
      if (tN.x < tN.y && tN.x < tN.z) { t = tN.x; tN.x += tD.x; c.x += st.x; n = vec3(-float(st.x), 0.0, 0.0); }
      else if (tN.y < tN.z) { t = tN.y; tN.y += tD.y; c.y += st.y; n = vec3(0.0, -float(st.y), 0.0); }
      else { t = tN.z; tN.z += tD.z; c.z += st.z; n = vec3(0.0, 0.0, -float(st.z)); }
      if (any(lessThan(c, ivec3(0))) || any(greaterThanEqual(c, uDims))) return -1.0;
    }
    return -1.0;
  }
  float hitBox(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax, out vec3 n) {
    vec3 inv = 1.0 / rd;
    vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
    vec3 tmn = min(t0, t1), tmx = max(t0, t1);
    float tE = max(max(tmn.x, tmn.y), tmn.z), tX = min(min(tmx.x, tmx.y), tmx.z);
    if (tX < tE || tE < 0.0) return -1.0;
    if (tE == tmn.x) n = vec3(-sign(rd.x), 0.0, 0.0);
    else if (tE == tmn.y) n = vec3(0.0, -sign(rd.y), 0.0);
    else n = vec3(0.0, 0.0, -sign(rd.z));
    return tE;
  }
  bool occluded(vec3 ro, vec3 rd) {
    vec3 n; int m; ivec3 ci;
    if (traceGrid(ro, rd, n, m, ci) >= 0.0) return true;
    for (int i = 0; i < 48; i++) {
      if (i >= uNumAcc) break;
      vec3 nb; if (hitBox(ro, rd, uAccMin[i].xyz, uAccMax[i].xyz, nb) >= 0.0) return true;
    }
    return false;
  }
  // smooth voxel ambient occlusion on a grid face
  float voxelAO(ivec3 c, vec3 n, vec3 fr) {
    ivec3 f = c + ivec3(n);
    ivec3 eb, ec; float u, v;
    if (abs(n.x) > 0.5) { eb = ivec3(0, 1, 0); ec = ivec3(0, 0, 1); u = fr.y; v = fr.z; }
    else if (abs(n.y) > 0.5) { eb = ivec3(1, 0, 0); ec = ivec3(0, 0, 1); u = fr.x; v = fr.z; }
    else { eb = ivec3(1, 0, 0); ec = ivec3(0, 1, 0); u = fr.x; v = fr.y; }
    float s1m = occ(f - eb), s1p = occ(f + eb), s2m = occ(f - ec), s2p = occ(f + ec);
    float amm = s1m * s2m > 0.5 ? 0.0 : 3.0 - (s1m + s2m + occ(f - eb - ec));
    float apm = s1p * s2m > 0.5 ? 0.0 : 3.0 - (s1p + s2m + occ(f + eb - ec));
    float amp = s1m * s2p > 0.5 ? 0.0 : 3.0 - (s1m + s2p + occ(f - eb + ec));
    float app = s1p * s2p > 0.5 ? 0.0 : 3.0 - (s1p + s2p + occ(f + eb + ec));
    return mix(mix(amm, apm, u), mix(amp, app, u), v) / 3.0;
  }
  // hairline chamfer on convex edges: bend the normal toward the open side
  vec3 edgeNormal(ivec3 c, vec3 n, vec3 fr) {
    const float W = 0.07;
    vec3 add = vec3(0.0);
    for (int a = 0; a < 3; a++) {
      if (abs(n[a]) > 0.5) continue;
      ivec3 e = ivec3(0); e[a] = 1;
      vec3 ev = vec3(e);
      float cs = uCell[a];
      float d0 = fr[a] * cs, d1 = (1.0 - fr[a]) * cs;
      if (d0 < W && cellAt(c - e) == 0u) add -= ev * (1.0 - d0 / W);
      if (d1 < W && cellAt(c + e) == 0u) add += ev * (1.0 - d1 / W);
    }
    return normalize(n + add);
  }
  float groundAO(vec3 p) {
    if (uOrigin.y > 0.01) return 1.0;
    vec3 cp = (p - uOrigin) / uCell;
    float s = 0.0;
    for (int dx = -2; dx <= 2; dx++) for (int dz = -3; dz <= 3; dz++) {
      ivec3 c = ivec3(int(floor(cp.x)) + dx, 0, int(floor(cp.z)) + dz);
      if (cellAt(c) == 0u) continue;
      vec3 cc = uOrigin + (vec3(c) + 0.5) * uCell;
      float d = length(vec2(cc.x - p.x, cc.z - p.z));
      s += max(0.0, 1.0 - d / 1.6) * uCell.z;
    }
    return 1.0 - clamp(s * 0.55, 0.0, 0.8);
  }
  vec3 toDisplay(vec3 c) {
    c *= uExposure;
    c = c / (1.0 + 0.12 * c);
    return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
  }

  void main() {
    vec3 f = vec3(0.0, -sin(uElev), -cos(uElev));
    vec3 r = vec3(1.0, 0.0, 0.0);
    vec3 u = vec3(0.0, cos(uElev), -sin(uElev));
    vec3 Lk0 = normalize(rotY(uKeyDir, -uYaw)), Lf = normalize(rotY(uFillDir, -uYaw));
    vec4 acc = vec4(0.0);
    for (int sy = 0; sy < 4; sy++) for (int sx = 0; sx < 4; sx++) {
      if (sy >= uSS || sx >= uSS) continue;
      vec2 o = (vec2(float(sx), float(sy)) + 0.5) / float(uSS) - 0.5;
      vec2 d = (gl_FragCoord.xy + o - uCenter) / uUnitPx;
      vec3 roW = uTarget + r * d.x + u * d.y - f * 80.0;
      vec3 ro = rotY(roW, -uYaw), rd = rotY(f, -uYaw);
      rd = mix(rd, vec3(1e-5), vec3(lessThan(abs(rd), vec3(1e-5))));
      vec3 Lk = normalize(Lk0 + vec3(o.x, o.y * 0.5, -o.y) * 0.05);
      vec3 hn = vec3(0.0); int hm = 0; ivec3 hc = ivec3(0); bool onGrid = false;
      float ht = traceGrid(ro, rd, hn, hm, hc);
      if (ht >= 0.0) onGrid = true; else ht = 1e9;
      for (int i = 0; i < 48; i++) {
        if (i >= uNumAcc) break;
        vec3 nb; float tb = hitBox(ro, rd, uAccMin[i].xyz, uAccMax[i].xyz, nb);
        if (tb >= 0.0 && tb < ht) { ht = tb; hn = nb; hm = int(uAccMin[i].w); onGrid = false; }
      }
      float tg = (uGroundOn > 0.5 && rd.y < -1e-4) ? -ro.y / rd.y : 1e9;
      vec4 col = vec4(0.0);
      if (hm != 0 && ht < tg) {
        vec3 p = ro + rd * ht;
        vec3 n = hn; float ao = 1.0;
        if (onGrid) {
          vec3 fr = clamp((p - uOrigin) / uCell - vec3(hc), 0.0, 1.0);
          ao = 0.28 + 0.72 * voxelAO(hc, hn, fr);
          n = edgeNormal(hc, hn, fr);
        }
        float sh = occluded(p + hn * 2e-3, Lk) ? 0.0 : 1.0;
        vec3 alb = uPal[hm];
        float dk = max(dot(n, Lk), 0.0) * sh, df = max(dot(n, Lf), 0.0);
        vec3 hemi = mix(uBounceCol, uSkyCol, 0.5 + 0.5 * n.y);
        vec3 H = normalize(Lk - rd);
        float spec = pow(max(dot(n, H), 0.0), 60.0) * 0.06 * sh;
        vec3 c = alb * (uKeyCol * dk + uFillCol * df + hemi * ao) + uKeyCol * spec + alb * uEmit[hm];
        col = vec4(toDisplay(c), 1.0);
      } else if (tg < 1e8) {
        vec3 p = ro + rd * tg;
        float a = 1.0 - smoothstep(uGroundR * 0.3, uGroundR, length(p.xz));
        if (a > 0.0) {
          float sh = occluded(p + vec3(0.0, 2e-3, 0.0), Lk) ? 0.0 : 1.0;
          vec3 c = uGroundAlb * (uKeyCol * max(Lk.y, 0.0) * sh + uSkyCol * groundAO(p));
          col = vec4(toDisplay(c) * a, a);
        }
      }
      acc += col;
    }
    outColor = acc / float(uSS * uSS);
  }`;

  const srgb2lin = h => [1, 3, 5].map(i => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2));

  // Default studio: warm key from the upper left front, cool fill from the right and a little behind.
  const LIGHTS = {
    keyDir: [-0.5, 0.7, 0.8], keyCol: [1.0 * 1.3, 0.8 * 1.3, 0.58 * 1.3],
    fillDir: [0.95, 0.22, -0.3], fillCol: [0.42 * 0.95, 0.58 * 0.95, 1.0 * 0.95],
    skyCol: [0.34 * 0.34, 0.42 * 0.34, 0.6 * 0.34], bounceCol: [0.42 * 0.18, 0.28 * 0.18, 0.2 * 0.18],
    groundAlb: srgb2lin('#3A3531'),
  };

  function createRenderer(canvas) {
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, alpha: true });
    if (!gl) throw new Error('WebGL2 unavailable');
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = name => gl.getUniformLocation(prog, name);
    const tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    // palette by material id
    const pal = new Float32Array(24), emit = new Float32Array(8);
    Object.keys(MATERIAL).forEach(k => { const id = MATERIAL[k]; pal.set(srgb2lin(COLORS[k]), id * 3); });
    emit[MATERIAL.w] = 0.35; emit[MATERIAL.y] = 0.9; emit[MATERIAL.p] = 0.08; emit[MATERIAL.b] = 0.12;
    gl.uniform3fv(U('uPal'), pal); gl.uniform1fv(U('uEmit'), emit);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);

    // view: { boxes, rect: [x, y, w, h] in canvas px (top-left origin), center: [px, py] (defaults to rect
    // center), target: [x, y, z] world point drawn at center, unitPx, yaw, elev (radians), ss, ground, groundR }
    function draw(view) {
      const L = Object.assign({}, LIGHTS, view.lights || {});
      const vg = voxelize(view.boxes);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_3D, tex);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage3D(gl.TEXTURE_3D, 0, gl.R8UI, vg.dims[0], vg.dims[1], vg.dims[2], 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, vg.data);
      gl.uniform1i(U('uGrid'), 0);
      gl.uniform3i(U('uDims'), vg.dims[0], vg.dims[1], vg.dims[2]);
      gl.uniform3fv(U('uOrigin'), vg.origin); gl.uniform3fv(U('uCell'), vg.cell);
      const acc = view.boxes.filter(b => b.kind === 'accent' || b.kind === 'object').slice(0, 48);
      const amin = new Float32Array(48 * 4), amax = new Float32Array(48 * 4);
      acc.forEach((b, i) => { amin.set([b.x, b.y, b.z, MATERIAL[b.key] || 5], i * 4); amax.set([b.x + b.w, b.y + b.h, b.z + b.d, 0], i * 4); });
      gl.uniform1i(U('uNumAcc'), acc.length);
      gl.uniform4fv(U('uAccMin'), amin); gl.uniform4fv(U('uAccMax'), amax);
      const H = canvas.height, [rx, ry, rw, rh] = view.rect;
      const c = view.center || [rx + rw / 2, ry + rh / 2];
      gl.uniform2f(U('uCenter'), c[0], H - c[1]);
      gl.uniform3fv(U('uTarget'), view.target || [0, 5, 0]);
      gl.uniform1f(U('uUnitPx'), view.unitPx || 14);
      gl.uniform1f(U('uYaw'), view.yaw || 0); gl.uniform1f(U('uElev'), view.elev || 0);
      gl.uniform3fv(U('uKeyDir'), L.keyDir); gl.uniform3fv(U('uFillDir'), L.fillDir);
      gl.uniform3fv(U('uKeyCol'), L.keyCol); gl.uniform3fv(U('uFillCol'), L.fillCol);
      gl.uniform3fv(U('uSkyCol'), L.skyCol); gl.uniform3fv(U('uBounceCol'), L.bounceCol);
      gl.uniform3fv(U('uGroundAlb'), L.groundAlb);
      gl.uniform1f(U('uGroundR'), view.groundR || 16);
      gl.uniform1f(U('uGroundOn'), view.ground === false ? 0 : 1);
      gl.uniform1i(U('uSS'), view.ss || 3);
      gl.uniform1f(U('uExposure'), view.exposure || 1.0);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.scissor(rx, H - (ry + rh), rw, rh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // finish() forces the GPU to complete (a 1-pixel readback) so callers can time a batch of draws.
    const px = new Uint8Array(4);
    const finish = () => { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    return { gl, draw, finish };
  }

  // Project a world point for a view (matches the shader), for 2D annotations: returns canvas px.
  function project(view, p) {
    const yaw = view.yaw || 0, e = view.elev || 0, t = view.target || [0, 5, 0], s = view.unitPx || 14;
    const [rx, ry, rw, rh] = view.rect, c = view.center || [rx + rw / 2, ry + rh / 2];
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const w = [cy * p[0] + sy * p[2] - t[0], p[1] - t[1], -sy * p[0] + cy * p[2] - t[2]];
    const u = w[0], v = w[1] * Math.cos(e) - w[2] * Math.sin(e);
    return [c[0] + u * s, c[1] - v * s];
  }

  const api = { DEFAULTS, COLORS, MATERIAL, LIGHTS, buildVoxels, mergeRuns, voxelize, createRenderer, project };
  root.Clawd3D = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
