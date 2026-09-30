// Test shot (agent O): the fleet alone, in 2D (sets/paper-kit/fleet3d.js), for looking at the flock.
//   frames < 1000: unfurled, unlit (pale); 1000..1999: lit, with beams; 2000+: unfurl = (f - 2000) / 60
// Revision 12: every sail faces the source (parallel), the beams run along the normal to each hub,
// and the hero is the flock's nearest member (index N_SAILS).
import { project, camBasis, CAM, sailMesh, drawSail, beamSource, slotAt, N_SAILS, FLEET_COLOURS as FC, SHEET } from '../sets/paper-kit/fleet3d.js';
const B = camBasis(CAM);
const depth = (p) => (p[0] - B.pos[0]) * B.fw[0] + (p[1] - B.pos[1]) * B.fw[1] + (p[2] - B.pos[2]) * B.fw[2];
// a segment clipped to the near plane, projected
export function clipProject(a, b, near = 0.5) {
  let za = depth(a), zb = depth(b);
  if (za < near && zb < near) return null;
  if (za < near) { const t = (near - za) / (zb - za); a = a.map((v, i) => v + (b[i] - v) * t); }
  if (zb < near) { const t = (near - zb) / (za - zb); b = b.map((v, i) => v + (a[i] - v) * t); }
  return [project(a), project(b)];
}
let g, W, H;
export default {
  async setup(ctx) { W = ctx.W; H = ctx.H; g = ctx.canvas.getContext('2d'); },
  render(ctx, fr) {
    const k = W / 1920, f = fr.f, lit = f >= 1000 && f < 2000 ? 1 : 0, open = f >= 2000 ? Math.min(1, (f - 2000) / 60) : 1;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#05060c'; g.fillRect(0, 0, W, H);
    const order = [...Array(N_SAILS + 1).keys()].sort((a, b) => project(slotAt(b))[2] - project(slotAt(a))[2]);
    g.globalCompositeOperation = 'lighter';
    if (lit) for (const i of order) {
      const seg = clipProject(beamSource(i), slotAt(i));
      if (!seg) continue;
      g.strokeStyle = `rgba(${FC.beam.join(',')},${i === N_SAILS ? 0.4 : 0.26})`; g.lineWidth = (i === N_SAILS ? 2 : 1.2) * k;
      g.beginPath(); g.moveTo(seg[0][0] * k, seg[0][1] * k); g.lineTo(seg[1][0] * k, seg[1][1] * k); g.stroke();
    }
    for (const i of order) drawSail(g, k, (p) => project(p), sailMesh(i, { open, t: fr.t }), { lit, light: SHEET.N });
  },
};
