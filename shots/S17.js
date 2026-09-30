// S17, drop 1 (bar 47; revision 13: one bar, the same dive at double speed): back into one world. From S15's view of the wall of worlds the
// camera dives into one tile that is still grey, one Clawd's own unsolved world. The other
// worlds sink away beneath it, the tile's baked picture gives way to the real valley, the land
// beyond its edge rises back up and the void turns to a dusk sky, and the camera settles
// near him standing alone: exactly S18's first frame.
// Revision 14: the grid is S15's replicated one (wallshot.js replicaTiles), seen as S15 leaves it
// (the block's centre, 3.6 km, 58 degrees), and the dive is into its grey valley copy REP.DIVE, two
// tiles beyond his own. The last frame is unchanged.
import { makeStage, clamp, lerp, ss, easeInOut, easeOut } from '../sets/valley/shotkit.js';
import { NEUTRAL } from '../sets/valley/clawd3d.js';
import { pathAt } from '../sets/valley/terrain.js';
import { createWall } from '../sets/valley/wall.js';
import { replicaTiles, REP, tileClawd, PITCH, TILE_C, TILE_HALF, tileUVtoWorld } from '../sets/valley/wallshot.js';
import { HX, HZ, YAW, breakdownCam } from '../sets/valley/breakdown.js';
import { v3, camBasis } from '../sets/valley/valley.js';

let St, W, tiles, S15F0, GY, END;
const DIVE = REP.DIVE;                                 // the grey world we dive into (ahead of the lens)
const AZ = 200 * Math.PI / 180, HB = [Math.sin(AZ), 0, Math.cos(AZ)];
const SHIFT = [-DIVE[0] * PITCH, -DIVE[1] * PITCH];    // the dive tile sits where the real valley is
const BLOCK = [TILE_C[0] + PITCH / 2, TILE_C[1] - PITCH / 2];   // S15's framing centre (its first 2 x 2 block)
const D0 = 3600, EL0 = 58;                             // S15's last view

export default {
  async setup(ctx) {
    St = makeStage(ctx, { agents: false });
    W = createWall(St.V, { log: ctx.log });
    const T = ctx.T;
    S15F0 = T.shots().find((x) => x.id === 'S15').f0;
    tiles = replicaTiles(S15F0);
    GY = St.V.heightAt(HX, HZ);
    // S18's first frame, as a target / offset pair for the dive's end
    const c = breakdownCam(0, GY);
    const toClawd = Math.hypot(c.pos[0] - HX, c.pos[1] - GY, c.pos[2] - HZ);
    const fw = v3.norm(c.fwd);
    const tgt = v3.add(c.pos, v3.mul(fw, toClawd));
    END = { tgt, off: v3.sub(c.pos, tgt), fovy: c.fovy, pp: c.pp };
    ctx.log(`S17: dive into tile ${DIVE}, ends ${toClawd.toFixed(1)} m from him`);
  },
  render(ctx, fr) {
    // revision 13: one bar; fl is the earlier two-bar clock (0-143), so the last frame is unchanged
    const { T } = ctx, f = fr.f, fl = fr.fl * 143 / Math.max(1, fr.n - 1);
    // --- the dive: log-distance from S15's 2500 m view down to S18's opening, swinging round
    const a = easeInOut(clamp((fl - 6) / 132));
    const t0 = [BLOCK[0] + SHIFT[0], 0, BLOCK[1] + SHIFT[1]];
    const tgt = v3.lerp(t0, END.tgt, easeInOut(clamp((fl - 10) / 118)));
    const D1 = Math.hypot(...END.off);
    const D = D0 * Math.pow(D1 / D0, a);
    const el0 = EL0 * Math.PI / 180, el1 = Math.asin(END.off[1] / D1);
    const az1 = Math.atan2(END.off[0], END.off[2]);
    let daz = az1 - AZ; while (daz > Math.PI) daz -= 2 * Math.PI; while (daz < -Math.PI) daz += 2 * Math.PI;
    const b = easeInOut(clamp((fl - 30) / 108));
    const az = AZ + daz * b, el = lerp(el0, el1, easeInOut(clamp((fl - 20) / 118)));
    const pos = [tgt[0] + Math.sin(az) * Math.cos(el) * D, tgt[1] + Math.sin(el) * D, tgt[2] + Math.cos(az) * Math.cos(el) * D];
    const kk = ss(40, 90, el * 180 / Math.PI);
    const hb = [Math.sin(az), 0, Math.cos(az)];
    const cam = { pos, look: tgt, up: [-hb[0] * kk, 1 - kk * 0.9, -hb[2] * kk], fovy: lerp(40, END.fovy, ss(90, 143, fl)), pp: [0, lerp(0, END.pp[1], ss(90, 143, fl))] };
    // --- the world comes back around the dive tile
    const sinkOthers = ss(0.36, 0.62, a);                  // the other worlds sink into the dark
    const slab = ss(0.28, 0.44, a);                       // the dive tile's picture gives way to the land
    const regrow = ss(0.55, 0.9, a);                      // land beyond the edge rises back
    const vd = 1 - ss(0.5, 0.86, a);                      // void -> dusk sky
    const list = [];
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i];
      const x = TILE_C[0] + t.gi * PITCH + SHIFT[0], z = TILE_C[1] + t.gj * PITCH + SHIFT[1];
      const dive = t.gi === DIVE[0] && t.gj === DIVE[1];
      const sf = t.solveF;
      const reveal = dive ? 0 : 1.25 * easeOut((f - sf) / 26);
      const dc = Math.hypot(t.gi - DIVE[0], t.gj - DIVE[1]);
      let y = 0, app = 1;
      if (dive) { y = -16 * slab; if (slab >= 1) continue; }
      else {
        const k0 = 0.36 + 0.2 * clamp(1 - dc / 12) + 0.04 * ((t.seed % 7) / 7);
        const sk = ss(k0, k0 + 0.18, a);
        y = -2200 * sk * sk; app = 1 - ss(k0 + 0.08, k0 + 0.2, a);
        if (app <= 0.001) continue;
      }
      const tile = { x, y, z, yaw: 0, size: 2 * TILE_HALF, variant: dive ? 0 : t.variant, reveal, depth: 12, tint: t.tint, appear: app, glow: dive ? 0 : -0.8 * ss(7, 17, t.ring) };
      if (dive) tile.clawd = { x: HX + x - TILE_C[0], y: y + 1.0, z: HZ + z - TILE_C[1], w: 1.35, a: 1 - ss(0.22, 0.3, a) };
      else {
        const d = tileClawd(t, f, sf);
        const q = pathAt(d); const uv = [(q.x - TILE_C[0]) / (2 * TILE_HALF) + 0.5, (q.z - TILE_C[1]) / (2 * TILE_HALF) + 0.5];
        const wp = tileUVtoWorld(tile, uv);
        tile.clawd = { x: wp[0], y: y + 1.0, z: wp[2], w: 1.35, a: app };
      }
      list.push(tile);
    }
    const land = a > 0.22;
    const P = {
      cam, time: fr.t,
      learn: { spawn: [0, 0, 0, 1] }, hideAgents: true,
      noTerrain: !land, noProps: !land, noReflection: vd > 0.95,
      clawd: { x: HX, z: HZ, y: GY, yaw: YAW, depth: 4, grid: NEUTRAL, hidden: !land, glow: 1 + 0.15 * T.envSmooth('vocals', f, 4) },
      tile: { c: TILE_C, half: TILE_HALF, dissolve: 1 - regrow },
      void: vd, voidCol: [0.035, 0.03, 0.085], fogK: 1 - vd,
      pal: 0.3 * (1 - vd), cloudK: 1 - vd,
      shadow: { c: [HX, 0, HZ + 6], r: lerp(90, 24, ss(0.4, 1, a)) },
      key: [18, 21], sun: [9, 2.2],
      rays: 0.6 * (1 - vd), glow: 1 - vd, exposure: 0.9, bloomThr: 0.8,
      extra: (gl, c) => { for (let i = 0; i < list.length; i += 1400) W.draw(list.slice(i, i + 1400), Object.assign({ P }, c), 0, 5); },
    };
    St.V.render(P);
    St.g2.drawImage(St.glc, 0, 0);
  },
};
