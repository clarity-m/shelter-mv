# sets/voyage: the fleet leaving the solar system (R12-R20, agent D)

S30's three outside views (36 frames each): sails, beams, the Sun and the stars.
0. **Looking back** past the flock at the Sun, small in its orbits. The camera is downstream of the
   beams, so the sails glow through from behind; the beams converge on the Sun and Earth.
1. **One star among many.** As the fleet speeds up (v/c 0.04 to 0.32), aberration draws the stars
   toward the point ahead. R19: the beams fade out over the view's first half.
2. **A and B** by the point ahead, the flock coasting in (no beams); the stars crowd forward and
   whiten a little. A and B sit in clear sky at lower left (`AB`), never over a sail. R20: small
   (12 and 8 px), they wink: brief twinkles (`WINKS`) flash the spikes out and swell the glow.

**Physics.** O's `fleet3d.js` (read only): the sails are parallel and face the source
(`SOURCE_DIR`), the formation perpendicular to the beams. The beams are Earth's laser array
pushing each sail, so they belong only near the Sun; each meets its sail's hub along the normal.
O's hero (index `N_SAILS`) is the flock's nearest member, turned into the voyage's frame (source
at -Z, travel +Z). Stars sit at their aberrated angle, cos t' = (cos t + b) / (1 + b cos t), with
subtle Doppler colour and short trails that grow with speed.

**API.** `createVoyage(cv, { k, log })` draws into a fresh canvas's 2D context; `voyageFrame(view
0-2, t 0-35)` is a pure function (`shots/_VOYAGE.js` plays the views as frames 0-107).

**Look.** O's `drawSail` in the shared orange, rgb(255,158,104). Close cameras (8-13 units, a
900 px lens): near sails large and cut by the frame.

**Page time.** 0.19 s/frame.
