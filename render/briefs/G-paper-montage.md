# Brief G: the outside world's breakthroughs (backlit paper), shots S06, S16, S20, S23, S26, S28, S29

Read `render/GUIDE.md` first, then the TREATMENT.md sections for your shots and
`analysis/STRUCTURE.md`. The worked example is `shots/S21.js` with
`sets/paper-fusion/`.

## Your sets

These are the outside world's shots in the quick-motion intercut. None has Clawd
and none has people. Each one shows Claude's impact as warm orange light shining
through the paper. The film intercuts them with bright pastel inside shots, often
for only 2.4-4.8 s each, so every one needs a single strong composition that
reads in a second.

Style:
- the bible is `style-frames/prompts/_paper-common.md`;
- the references are `style-frames/11-paper-lab`, `12-paper-fusion`
  (`sets/paper-fusion` is its production port) and `13-paper-swarm`;
- the sets `sets/paper-lab` and `sets/paper-swarm`, if present, are other agents'
  production versions.

Consider building a small shared paper toolkit first, in `sets/paper-kit/` or
`lib/paper*.js`. It would cover:
- layers as 2D masks at depths;
- opaque card and translucent vellum;
- warm and cool lights;
- transmission with fibre, rims and soft layer shadows;
- haze and shafts, bloom, grain and vignette;
- a 2.5D camera.

Match 12's look exactly. Keep the colour rule: cool indigo papers, and the warm
orange ramp only for Claude's light.

## Shots

**S06:** bars 13-14, frames 875-1018, 4.8 s. Hook 1. A GPU rack in layered card at
night. A card slides in on each of the two bass stutter-stops (bars 13 and 14;
T.events('stops'), T.inStop), and its LEDs light up as warm pinholes. The help
arrives as hardware.

**S16:** bars 45-46, frames 3179-3322, 4.8 s. Drop 1. The rack is now a hall of
racks in receding card layers. A row of pinhole LEDs lights on each stop (bars 45
and 46).

**S20:** bars 55-56, frames 3899-4024, 4.2 s. It ends a beat early, because S21
starts a beat early. A tray of vials under a lab hood, cut from card. One vial is
vellum, and it begins to glow warm: a new protein works.

**S23:** bars 61-62, frames 4331-4474, 4.8 s. A paper skyline at night. One
district's windows warm up window by window as a new grid comes online: lanterns
in specific places, never spreading like a map (no "infection" read).

**S26:** bars 67-68, frames 4763-4906, 4.8 s. Build 2. A paper observatory on a
ridge. The dome's slit opens, spilling light, toward two bright pinholes low in the
sky: Alpha Centauri A and B.

**S28:** bars 71-72, frames 5051-5194, 4.8 s. A launch gantry in layered card at
night. The engines light the tissue beneath them orange. In the second half of bar
72 the music drops out: find it with T.env('mix', f), and cut to one beat of black.

**S29:** bars 73-76, frames 5195-5482, 9.6 s. Drop 2. Liftoff lands on the bar-73
downbeat (frame 5195): the rocket climbs on a column of glowing tissue. Its payload
unfurls a square vellum sail that catches an orange beam from the ground and
sails off, leaving the Sun behind among pinhole stars. The square echoes the
square of light that opens the film. Kicks can pulse the plume.

Also build the sail on its own, in the dark, as a renderable element: another shot
(S30) intercuts it per beat with inside shots. Document how to call it.

## Deliverables

- the shots, the sets, and `out/shots/<ID>.mp4` plus `_av.mp4` for each, with
  contact sheets;
- a NOTES.md in your set folder, updated as you go;
- a final reply of 5-8 sentences.

Budget: about 120-180 minutes. Order: S29, S23, S20, S06, S16, S28, S26. Other
agents work in parallel; the ownership rules are in the GUIDE.
