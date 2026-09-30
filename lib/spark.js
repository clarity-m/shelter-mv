// The Claude spark: eleven irregular, tapered rays. Shared by the paper card (S01, S02, S33,
// where the rays are cut holes) and the swarm (S32, S33, where they are the shafts through the
// lantern's ports), so the two bookends show the same spark.
//   a    screen angle in degrees, clockwise from +x (y down)
//   len  length relative to the longest ray
//   w    base width relative to the average ray
//   el   the swarm lane's elevation toward the camera (rad); port: the port's angular radius (rad)
export const SPARK = [
  { a: -90, len: 1.00, w: 1.12, el: 0.10, port: 0.085 },
  { a: -57, len: 0.60, w: 0.84, el: -0.16, port: 0.050 },
  { a: -25, len: 0.79, w: 0.96, el: 0.40, port: 0.066 },
  { a: 5, len: 0.92, w: 1.06, el: -0.05, port: 0.080 },
  { a: 37, len: 0.55, w: 0.80, el: 0.50, port: 0.046 },
  { a: 68, len: 0.76, w: 0.92, el: -0.20, port: 0.060 },
  { a: 98, len: 0.96, w: 1.06, el: 0.08, port: 0.078 },
  { a: 129, len: 0.61, w: 0.84, el: -0.10, port: 0.050 },
  { a: 160, len: 0.89, w: 1.02, el: 0.18, port: 0.078 },
  { a: 194, len: 0.57, w: 0.80, el: -0.24, port: 0.046 },
  { a: 227, len: 0.73, w: 0.92, el: 0.12, port: 0.062 },
];
export const N_RAYS = SPARK.length;

// Card geometry at 1920x1080 (world px on the card plane at magnification 1).
export const CARD_GEOM = {
  cell: 36,        // Clawd cell width; the opening square is two cells (72 x 72 px)
  Lmax: 420,       // the longest ray, centre to tip
  base: 30,        // average base half-width of a ray
  tip: 0.42,       // tip radius as a fraction of the base half-width
};
