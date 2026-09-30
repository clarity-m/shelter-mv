// Loads sets/inside-montage/hillx.js (read only) for S20's inside render.
//
// loadHillx(): with one fix. S20's render is not 16:9 (it covers the lab screen's 152:97 hole), and
// hillx's ribbon pass used to flip y with the design height 1080 instead of its canvas's (H / K). The
// fix is upstream now (the line is gone), so this returns the module as it is.
//
// loadHillxIcy() also adds (revision 14) a field colouring for S20's free-energy landscape, switched on by
// state.salt = -1 (hillx passes salt through; the stock crust only acts for salt > 0): the land is
// coloured by height like a topographic profile, a deep indigo-violet basin through violet and
// magenta to a pale rose-lilac rim, with fine pale-gold contour lines at even heights, the brush
// rows' light and dark kept in it.
// loadHillxIcy() (revision 11): the same, with S18's glacier caps on the hill engine's far peaks.
// P's S18 turns the valley engine's far peaks glacier blue, and S19 ends on them, so S20's opening
// (the hill engine, dissolving from S19's last frame) needs the same pale icy caps, or they would
// fade out in the dissolve. glslx.js (read only) is loaded as a copy with a few lines added to
// mountainsOver: pale blue-white caps on the lit faces, glacier blue in shade, ragged along the snow
// line, under the same haze. If the anchor line has changed upstream, it logs a warning and loads
// hillx unchanged.
const H_URL = new URL('../inside-montage/hillx.js', import.meta.url).href;
const G_URL = new URL('../inside-montage/glslx.js', import.meta.url).href;
const absolute = (src, base) => src.replace(/from '(\.{1,2}\/[^']+)'/g, (m, rel) => `from '${new URL(rel, base).href}'`);
const blobOf = (src) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));

export async function loadHillx() {
  const src0 = await (await fetch(H_URL, { cache: 'no-store' })).text();
  const A = '(1080 - l[1]) * K', B = '(1080 - r[1]) * K';
  if (src0.split(A).length !== 2 || src0.split(B).length !== 2) return import(H_URL);
  const src = absolute(src0.replace(A, '(H / K - l[1]) * K').replace(B, '(H / K - r[1]) * K'), H_URL);
  return Object.assign({ patched: true }, await import(blobOf(src)));
}

const CAP_ANCHOR = '    f *= 0.9 + 0.2 * bk + 0.05 * (vnoise2(vec2(sd * 1.3, cv * 6.0)) - 0.5);';
const CAP_GLSL = `
    // (sets/door/hillx-fix.js, revision 11) S18's glacier caps, as S19 leaves them: pale blue-white on
    // the lit faces, glacier blue in shade, ragged along the snow line
    float capK = smoothstep(0.5, 0.7, fy + 0.12 * (vnoise2(vec2(sd * 0.45, pk.x * 0.7)) - 0.5));
    vec3 capC = k > 0.5 ? vec3(0.86, 0.74, 0.78) : vec3(0.46, 0.52, 0.80);
    f = mix(f, capC, capK * 0.92);`;
const FIELD_ANCHOR = '  return mix(c, mean, smoothstep(0.35, 0.9, fw));';
const FIELD_GLSL = `
  if (uSalt < -0.5) {
    // (sets/door/hillx-fix.js, revision 14) the free-energy landscape: colour by height, contours
    float hh = clamp(h / 2.3, 0.0, 1.0);
    vec3 f0 = vec3(0.09, 0.05, 0.24), f1 = vec3(0.29, 0.13, 0.50), f2 = vec3(0.58, 0.19, 0.55), f3 = vec3(0.87, 0.72, 0.87);
    vec3 fc = hh < 0.33 ? mix(f0, f1, hh / 0.33) : hh < 0.68 ? mix(f1, f2, (hh - 0.33) / 0.35) : mix(f2, f3, (hh - 0.68) / 0.32);
    fc = pow(fc, vec3(2.2));
    float lr = clamp(dot(c, vec3(0.2126, 0.7152, 0.0722)) / max(dot(mean, vec3(0.2126, 0.7152, 0.0722)), 1e-4), 0.55, 1.5);
    fc *= 0.82 + 0.3 * lr;
    float dhp = length(gh) * PIXANG() * t / max(abs(dot(ns, rd)), 0.04);
    float cv = h / 0.18, fwv = dhp / 0.18, dd = 0.5 - abs(fract(cv) - 0.5);
    float line = (1.0 - smoothstep(0.0, 0.03 + 0.9 * fwv, dd)) * (1.0 - smoothstep(0.25, 0.55, fwv));
    fc = mix(fc, pow(vec3(0.96, 0.84, 0.55), vec3(2.2)), 0.78 * line);
    return fc;
  }
`;
export async function loadHillxIcy(log = () => {}) {
  let g = await (await fetch(G_URL, { cache: 'no-store' })).text();
  if (g.split(FIELD_ANCHOR).length === 2) g = g.replace(FIELD_ANCHOR, FIELD_GLSL + FIELD_ANCHOR);
  else log('hillx-fix: WARNING the land paint line in glslx.js has changed; no field colouring');
  if (g.split(CAP_ANCHOR).length !== 2) {
    log('hillx-fix: WARNING the mountains line in glslx.js has changed; no icy caps');
    return Object.assign({ icy: false }, await loadHillx());
  }
  g = absolute(g.replace(CAP_ANCHOR, CAP_ANCHOR + CAP_GLSL), G_URL);
  let h = await (await fetch(H_URL, { cache: 'no-store' })).text();
  if (h.split("from './glslx.js'").length !== 2) {
    log('hillx-fix: WARNING hillx.js no longer imports ./glslx.js; no icy caps');
    return Object.assign({ icy: false }, await loadHillx());
  }
  const A = '(1080 - l[1]) * K', B = '(1080 - r[1]) * K';
  if (h.split(A).length === 2 && h.split(B).length === 2) h = h.replace(A, '(H / K - l[1]) * K').replace(B, '(H / K - r[1]) * K');
  h = absolute(h.replace("from './glslx.js'", `from '${blobOf(g)}'`), H_URL);
  return Object.assign({ icy: true, patched: true }, await import(blobOf(h)));
}
