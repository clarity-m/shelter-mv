// S10's set: the first environment, a one-screen pixel gridworld seen side-on (native 480x270).
// Spawn pad left of centre, a four-tile gap, a goal flag beyond it. Static layers (sky and its
// sim grid, the distant block mesas, the ground tiles and the pit) are built once; clouds, motes,
// the flag, the bridge tiles, the edit marquee, Clawd, his light, the HUD and the reward are drawn
// per frame from a state object, so render(state) is a pure function of the state.
// Option (off by default): createGridworld(..., { ext }) builds the world ext px wider, beyond the
// screen's left edge, and st.cam (whole native px, <= 0) scrolls the camera into it; the HUD stays
// on the screen. With ext = 0 the output is exactly the one-screen world's.
import { PBuf, NW, NH, NONE, kk, qd, bay, text, textW, drawClawdPx, CI, createBlit, isClawd } from './pixel.js';
import { hash, clamp } from '../../lib/util.js';

export const GY = 184;                 // ground top (native px); tiles are 16x16 on a 16 grid
export const GAP = [272, 336];         // the pit: four tile columns
export const SPAWN = 200, EDGE = 252, GOAL = 394, POLE = 412;
export const TILE = 16;
export const STEP = [112, 144];        // a two-tile step, one tile high, left of the spawn (found exploring)

const skyLevel = (y) => 12.25 + 2.35 * Math.pow(clamp(y / GY), 1.5);
export const SUN = [418, GY - 30, 17];   // a pale overcast sun low behind the goal (x, y, radius)

const pm = (a, n) => ((a % n) + n) % n;   // a modulo that stays positive left of the screen

function buildSky(B) {
  for (let y = 0; y < NH; y++) for (let x = -B.ox; x < B.w - B.ox; x++) {
    let L = skyLevel(Math.min(y, GY));
    // the sun's wide glow lifts the sky around the goal
    const r = Math.hypot(x + 0.5 - SUN[0], (y + 0.5 - SUN[1]) * 1.15);
    L += 1.3 * Math.exp(-r / 70);
    let k = qd(L, x, y, 3);
    // the environment's sim grid: dotted lines every 32 px, one step darker (swallowed by the glow)
    const gx = pm(x, 32) === 16, gy = (y % 32) === 8;
    if ((gx || gy) && ((x + y) & 1) === 0 && y < GY - 2 && r > 44) k -= 1;
    if (r < SUN[2]) k = 16; else if (r < SUN[2] + 3) k = Math.max(k, 15 + (bay(x, y) < 0.5 ? 1 : 0));
    B.ib[y * B.w + x + B.ox] = kk(k);
  }
}

// distant mesas of stacked blocks (other levels of the same world), soft against the horizon
// far: pale stepped blocks in the haze; near: a few darker stacks with a lit top and a shaded side
const MESAS_FAR = [
  { x: 0, w: 72, h: 30 }, { x: 72, w: 32, h: 46 }, { x: 150, w: 48, h: 24 }, { x: 214, w: 24, h: 36 },
  { x: 346, w: 40, h: 20 }, { x: 452, w: 28, h: 40 },
];
const MESAS_NEAR = [
  { x: 16, w: 40, h: 22 }, { x: 96, w: 24, h: 58 }, { x: 120, w: 16, h: 30 },
  { x: 368, w: 24, h: 14 }, { x: 440, w: 40, h: 26 },
];
// beyond the screen's left edge, for a world wider than one screen
const MESAS_FAR_EXT = [{ x: -64, w: 40, h: 36 }, { x: -24, w: 24, h: 22 }];
const MESAS_NEAR_EXT = [{ x: -56, w: 24, h: 44 }, { x: -24, w: 16, h: 16 }];
function mesa(B, m, base, lit, seam) {
  const top = GY - m.h;
  for (let y = top; y < GY; y++) for (let x = Math.max(m.x, -B.ox); x < Math.min(m.x + m.w, B.w - B.ox); x++) {
    let L = base + 0.8 * Math.pow((y - top) / Math.max(m.h, 1), 2);    // haze toward the base
    if (y === top) L = lit;
    else if (x >= m.x + m.w - 3) L -= 0.7;                              // the shaded side
    else if (((y - top) % 8) === 7 || ((x - m.x) % 8) === 7) L -= 0.5;  // block seams
    B.ib[y * B.w + x + B.ox] = kk(qd(L, x, y, 3));
  }
}
function buildFore(B) {
  B.clear(NONE);
  const wide = B.ox > 0;
  for (const m of wide ? [...MESAS_FAR_EXT, ...MESAS_FAR] : MESAS_FAR) mesa(B, m, 12.9, 13.9, 0);
  for (const m of wide ? [...MESAS_NEAR_EXT, ...MESAS_NEAR] : MESAS_NEAR) mesa(B, m, 11.4, 13.2, 0);
  // ground tiles and the pit
  const rowBase = [7.9, 6.9, 6.0, 5.2, 4.5, 4.0];
  for (let y = GY; y < NH; y++) for (let x = -B.ox; x < B.w - B.ox; x++) {
    const i = y * B.w + x + B.ox;
    if (x >= GAP[0] && x < GAP[1]) {
      // the pit: falls off into the dark, with the faint outline of a back wall of tiles
      const d = (y - GY) / (NH - GY);
      let L = 4.2 - 4.6 * Math.pow(d, 0.7);
      if ((((y - GY) % 16) === 15 || (x % 16) === 15) && d < 0.8) L += 0.9 * (1 - d);
      B.ib[i] = kk(qd(L, x, y, 2.2));
      continue;
    }
    const row = Math.floor((y - GY) / TILE), ty = (y - GY) % TILE, tx = pm(x, TILE);
    const base = rowBase[Math.min(row, rowBase.length - 1)];
    let L = base;
    if (row === 0 && ty === 0) L = 12;
    else if (row === 0 && ty <= 2) L = 10;
    else if (ty === TILE - 1 || tx === TILE - 1) L = base - 1.6;
    else if (ty === 0 || tx === 0) L = base + 1.0;
    else if (hash(x, y, 3) < 0.05) L = base + (hash(x, y, 4) < 0.5 ? -1 : 1);
    // the walls of the pit: the near ledge's face is in shade, the far one catches the light
    if (x === GAP[0] - 1 && ty > 0) L = base - 2.2;
    if (x === GAP[1] && !(row === 0 && ty <= 2)) L = base + 1.8;
    // the spawn pad: a lighter plate let into the top row
    if (row === 0 && ty <= 1 && Math.abs(x + 0.5 - SPAWN) < 14) L = ty === 0 ? 15 : 12.5;
    // under the step the ground's lit top edge is covered
    if (row === 0 && ty <= 2 && x >= STEP[0] && x < STEP[1]) L = base;
    B.ib[i] = kk(L);
  }
  // the step: one tile high, worn like the ground; its face toward the spawn in shade, like the pit's
  for (let y = GY - TILE; y < GY; y++) for (let x = STEP[0]; x < STEP[1]; x++) {
    const ty = y - (GY - TILE), tx = (x - STEP[0]) % TILE, base = 7.9;
    let L = base;
    if (ty === 0) L = 12;
    else if (ty <= 2) L = 10;
    else if (x === STEP[1] - 1) L = base - 2.2;
    else if (ty === TILE - 1 || tx === TILE - 1) L = base - 1.6;
    else if (tx === 0) L = base + 1.0;
    else if (hash(x, y, 3) < 0.05) L = base + (hash(x, y, 4) < 0.5 ? -1 : 1);
    B.ib[y * B.w + x + B.ox] = kk(L);
  }
}

// the 3x5 font doubled (each font pixel 2x2 native)
function text2(B, s, x, y, c) {
  const T = new PBuf(textW(s), 5); T.clear(NONE); text(T, s, 0, 0, 1);
  for (let j = 0; j < 5; j++) for (let i = 0; i < T.w; i++) if (T.ib[j * T.w + i] === 1) B.rect(x + 2 * i, y + 2 * j, 2, 2, c);
}

function drawCloud(B, cx, cy, w, h, seed) {
  // a flat-bottomed pixel cumulus: bumps of varied size along the top, one-step shade underneath
  const n = 3 + Math.floor(hash(seed, 9) * 3);
  const bumps = [];
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n;
    const r = h * (0.6 + 0.7 * hash(k, seed, 1)) * (1 - 0.45 * Math.abs(u - 0.5) * 2);
    bumps.push([cx - w / 2 + u * w, cy - r * 0.45, r * 1.3, r]);
  }
  for (let y = Math.floor(cy - 2.5 * h); y <= cy + 1; y++) for (let x = Math.floor(cx - w / 2 - 2 * h); x <= Math.ceil(cx + w / 2 + 2 * h); x++) {
    let inside = false;
    for (const [bx, by, rx, ry] of bumps) { const dx = (x + 0.5 - bx) / rx, dy = (y + 0.5 - by) / ry; if (dx * dx + dy * dy <= 1) { inside = true; break; } }
    if (!inside) continue;
    B.set(x, y, y >= cy ? 14 : y >= cy - 2 ? 15 : 16);
  }
}

function drawFlag(B, fl, raised) {
  const top = GY - 44;
  for (let y = top; y < GY; y++) B.set(POLE, y, 3);
  B.rect(POLE - 1, top - 2, 3, 2, 15);
  B.rect(POLE - 4, GY - 3, 9, 3, 6); B.rect(POLE - 4, GY - 3, 9, 1, 11);
  // a pennant that flutters (three drawings at 6 fps); it runs up the pole when he arrives
  const ph = Math.floor(fl / 5) % 3;
  const y0 = top + 1 + Math.round(14 * (1 - raised));
  const Lp = 20, Hp = 13;
  for (let c = 0; c < Lp; c++) {
    const half = (Hp / 2) * (1 - c / Lp);
    const wave = Math.round(1.2 * Math.sin(c * 0.5 - ph * 2.1) * (c / Lp));
    for (let r = Math.round(Hp / 2 - half); r < Math.round(Hp / 2 + half); r++) {
      const lower = r > Hp / 2;
      B.set(POLE + 1 + c, y0 + r + wave, lower ? 3 : 5);     // backlit by the sun: a dark pennant
    }
  }
}

// a tile dropped in by the edit: fresh, a step lighter than the worn ground
function drawTile(B, x, y, flash) {
  for (let j = 0; j < TILE; j++) for (let i = 0; i < TILE; i++) {
    let L = 8.3;
    if (j === 0) L = 13; else if (j <= 2) L = 10.8;
    else if (j === TILE - 1 || i === TILE - 1) L = 6.2;
    else if (i === 0) L = 9.4;
    if (flash && (i === 0 || j === 0 || i === TILE - 1 || j === TILE - 1)) L = 16;
    B.set(x + i, y + j, kk(L));
  }
}

function drawMarquee(B, x0, y0, x1, y1, fl) {
  // marching ants around the slot the edit will fill
  const per = [];
  for (let x = x0; x <= x1; x++) per.push([x, y0]);
  for (let y = y0 + 1; y <= y1; y++) per.push([x1, y]);
  for (let x = x1 - 1; x >= x0; x--) per.push([x, y1]);
  for (let y = y1 - 1; y > y0; y--) per.push([x0, y]);
  const sh = Math.floor(fl / 2);
  per.forEach(([x, y], k) => B.set(x, y, ((k + sh) >> 1) & 1 ? 16 : 2));
}

function motes(B, fl) {
  for (let k = 0; k < 11; k++) {
    const x = Math.floor((hash(k, 1) * NW + 6 * Math.sin(fl * 0.021 + k * 1.7)) % NW);
    const span = GY - 30;
    const y = Math.floor(20 + ((hash(k, 2) * span - fl * (0.07 + 0.05 * hash(k, 3))) % span + span) % span);
    if (((fl >> 3) + k) % 9 === 0) continue;      // a slow shimmer, never a strobe
    const cur = B.get(x, y);
    if (cur !== NONE && cur >= 10 && cur < 17) B.set(x, y, 16);
  }
}

export function createGridworld(canvas, W, H, { ext = 0 } = {}) {
  const WW = NW + ext;                   // the world's width: one screen, plus ext beyond its left edge
  const SKY = new PBuf(WW, NH, ext), FORE = new PBuf(WW, NH, ext);
  buildSky(SKY); buildFore(FORE);
  const A = new PBuf(WW, NH, ext), Bb = new PBuf(WW, NH, ext);
  const blit = createBlit(canvas, W, H, WW);

  // draw one full state into buf
  function draw(buf, st) {
    const fl = st.fl;
    buf.copy(SKY);
    drawCloud(buf, Math.round(118 + fl * 0.06), 56, 64, 12, 1);
    drawCloud(buf, Math.round(330 + fl * 0.04), 96, 44, 9, 2);
    drawCloud(buf, Math.round(-40 + fl * 0.05), 132, 36, 7, 3);
    buf.overlay(FORE);
    motes(buf, fl);
    drawFlag(buf, fl, st.flagUp || 0);
    for (const t of st.tiles || []) drawTile(buf, t.x, Math.round(t.y), t.flash);
    if (st.marquee) drawMarquee(buf, ...st.marquee, fl);
    // a click in the world: a dotted pixel ring spreading from the point
    if (st.ripple) {
      const { x, y, age } = st.ripple, r = 3 + age * 2.2;
      for (let k = 0; k < 40; k++) {
        if (k & 1) continue;
        const a = k / 40 * Math.PI * 2;
        buf.set(Math.round(x + r * Math.cos(a)), Math.round(y + 0.8 * r * Math.sin(a)), age < 4 ? 16 : 14);
      }
    }
    // dust from landing tiles and his landings: pale pixels spreading along the ground
    for (const d of st.dust || []) {
      const a = d.age;
      for (const s of [-1, 1]) {
        buf.set(d.x + s * (2 + a), d.y - 1 - (a > 2 ? 1 : 0), 15);
        if (a < 3) buf.set(d.x + s * (4 + a * 1.5), d.y - 2, 14);
      }
    }
    // Clawd's light: warm levels in the air and on the ground around him (not on him)
    const c = st.clawd;
    if (c) {
      const lx = c.x, ly = c.y - 10;
      const R = 30 * (c.glow || 1);
      for (let y = Math.max(0, Math.floor(ly - R)); y < Math.min(NH, Math.ceil(ly + R)); y++)
        for (let x = Math.max(0, Math.floor(lx - R * 1.4)); x < Math.min(NW, Math.ceil(lx + R * 1.4)); x++) {
          const r = Math.hypot((x + 0.5 - lx) / 1.35, y + 0.5 - ly);
          const v = 2.6 * Math.pow(clamp(1 - r / R), 1.25);
          const q = qd(v, x, y, 2);
          if (q > 0) buf.warm(x, y, Math.min(q, 3));
        }
      drawClawdPx(buf, c.frame, c.x, c.y, { mirror: c.mirror, dy: c.dy || 0, flat: c.flat || 0 });
      for (const sp of c.sparks || []) buf.set(sp[0], sp[1], CI.w);
    }
    if (st.reward) {
      // +1, at twice the font's size, dark against the bright sky around the goal
      const r = st.reward, s = '+1';
      const x = Math.round(r.x - textW(s)), y = Math.round(r.y);
      text2(buf, s, x, y, 3);
    }
    // HUD, top left, in the world's own pixels (it stays on the screen when the camera scrolls)
    if (st.hud) {
      const h = st.hud, hx = 12 + (st.cam || 0), hy = 11;
      text(buf, 'EPISODE', hx, hy, 9); text(buf, 'STEP', hx, hy + 8, 9);
      const ev = String(h.ep);
      if (h.epFlash) { buf.rect(hx + 31, hy - 1, textW(ev) + 3, 7, 4); text(buf, ev, hx + 32, hy, 16); }
      else text(buf, ev, hx + 32, hy, 4);
      text(buf, String(h.step), hx + 32, hy + 8, 4);
    }
  }

  // the warm field S08 ends on: his glow, attached to the world (native px) so it zooms with the
  // camera, and irised down into him. Nine steps fitted to S08's last frame (a radial falloff from
  // pale peach at his feet to deep peach in the corners, 150 screen px a step at its 27.125x zoom),
  // dithered on the native grid, which is the cell look S08 ends on.
  const AG9 = [[244, 220, 194], [243, 217, 190], [241, 211, 181], [239, 205, 174], [234, 191, 158],
    [226, 175, 139], [218, 158, 121], [212, 148, 110], [203, 136, 96]].map((c) => blit.pack(c));
  function afterglow(u32, buf, ag) {
    if (!ag || ag.Rn <= 0) return;
    const { cx, cy, Rn } = ag, step = 150 / 27.125;
    for (let y = 0; y < NH; y++) for (let bx = 0; bx < buf.w; bx++) {
      const x = bx - buf.ox, i = y * buf.w + bx;
      if (isClawd(buf.ib[i])) continue;
      const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (clamp((Rn - r) / 3 + 0.5) <= bay(x, y)) continue;
      u32[i] = AG9[clamp(qd(r / step, x, y, 1.2), 0, 8)];
    }
  }

  return {
    // st: the state now; old + wipe (0..1): the frozen state being wiped away top to bottom
    render(st, old, wipe) {
      draw(A, st);
      if (old && wipe < 1) {
        draw(Bb, old);
        const yw = Math.floor(wipe * NH);
        const off = yw * A.w;
        A.ib.set(Bb.ib.subarray(off), off); A.wb.set(Bb.wb.subarray(off), off);
        if (yw < NH) for (let x = 0; x < A.w; x++) { A.ib[off + x] = 16; A.wb[off + x] = 0; }
      }
      // the opening zoom's view is in world px; in a wider world the camera crops at st.cam
      const view = st.view && ext ? { ...st.view, nx: st.view.nx + ext } : st.view;
      blit.put(A, (u32, b) => afterglow(u32, b, st.afterglow), view, ext ? (st.cam || 0) + ext : undefined);
    },
  };
}
