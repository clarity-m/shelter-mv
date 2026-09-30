// Revision 4: S24's seed towers, standing where S24 left them (sets/hill SKYLINE, the first
// SKYLINE_SEED), for the shots after it (S25, S25c): kept dim, so they never compete with what the
// crowd draws. k 0..1 scales how lit their windows are.
import { SKYLINE, SKYLINE_SEED } from '../hill/scene.js';

export function seedTowers(lit = 0.18) {
  return SKYLINE.slice(0, SKYLINE_SEED).map(([x, z, w, h, taper, cap, rot]) => ({ x, z, w, h, taper, cap, rot, lit }));
}
