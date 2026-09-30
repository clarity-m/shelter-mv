# Shelter: song map

100.00 BPM, 4/4, locked grid (DAW-quantized; tracked downbeats sit within 40 ms of it). Bar = 2.4 s = 72 frames at 30 fps; beat = 0.6 s = 18 frames. Bar 1 downbeat at 0.38 s. Bar b starts at 0.38 + 2.4(b-1) s. 90 full bars plus a tail; length 3:37.7 = 6533 frames. Key centre C major (Krumhansl estimate).

| Section | Bars | Time | Frames (30 fps) | Music |
|---|---|---|---|---|
| Intro A | 1-4 | 0:00.0-0:10.0 | 0-299 | Chop motif alone, soft; sustained bass pad; no drums. A 2-bar melodic cell repeats. |
| Intro B | 5-8 | 0:10.0-0:19.6 | 299-587 | Kick on bar 5, light percussion and a riser build in; chops sparse. |
| Hook 1 | 9-16 | 0:19.6-0:38.8 | 587-1163 | First drop: full drums, pumping bass, chop lead. Bass stops on beat 4 of bars 9, 13, 14. |
| Verse 1 | 17-24 | 0:38.8-0:58.0 | 1163-1739 | Sung lead enters over a lighter beat; bass drops out for bar 18, then returns. |
| Pre-chorus 1a | 25-28 | 0:58.0-1:07.6 | 1739-2027 | Kick drops out; low-register vocal; sustained bass. The first real breath. |
| Pre-chorus 1b | 29-32 | 1:07.6-1:17.2 | 2027-2315 | Snare pattern returns, vocal climbs; drums cut out from the end of bar 30 until a fill in the second half of bar 32 (a held breath before the drop). |
| Drop 1 | 33-48 | 1:17.2-1:55.6 | 2315-3467 | 16 bars of chop lead, full drums. Bass stutter-stops on beat 4 of bars 33, 37, 38, 40, 45, 46. |
| Breakdown | 49-52 | 1:55.6-2:05.2 | 3467-3755 | Drums and bass out; sung, spacious. The song's midpoint (1:55.6 = 53%). |
| Verse 2a | 53-56 | 2:05.2-2:14.8 | 3755-4043 | Sung; still no drums; bass creeps back in from bar 55. |
| Verse 2b | 57-64 | 2:14.8-2:34.0 | 4043-4619 | Single kick hit on the bar 57 downbeat; sung with long held notes; bass intermittent. |
| Build 2 | 65-72 | 2:34.0-2:53.2 | 4619-5195 | Chop lead returns over hats and a continuous snare roll; bass pumps. Bar 72: the drums drop out for three beats, then on beat 4 (frame 5177) the lead and voice cut out under a loud drum fill into drop 2. |
| Drop 2 | 73-80 | 2:53.2-3:12.4 | 5195-5771 | Second drop, chop lead, full drums; bar 80 dips for a turnaround. |
| Drop 2 + vocal | 81-86 | 3:12.4-3:26.8 | 5771-6203 | Sung line over the full drop: the climax. Bass stops on beat 4 of bar 85. |
| Held note | 87-88 | 3:26.8-3:31.6 | 6203-6347 | Drums fall away under one long sustained vocal note (about 4 s). |
| Outro | 89-91 | 3:31.6-3:37.7 | 6347-6532 | Pad and a wavering vocal tail; ends at 3:37.7. |

Shape: two cycles of verse, build, drop, with a sung breakdown between them. The chop lead owns every drop; sung lines own the verses, the breakdown and the last 6 bars of drop 2. The drops are 8 + 16 + 14 bars, so the song spends about 40% of its length at full energy.

Hit points for the edit: the bass stutter-stops (beat 4 of the bars listed above, about 0.3 s each), the drop downbeats at bars 9, 33 and 73, the kick on bar 57, and the drum cut-outs at bars 31-32 and 72.

Files: `grid.json` (grid), `beats.json` (tracked beats), `envelopes.npz` (per-frame curves at 30 fps: mix, stems, kick, snare, bands, centroid, onset, chroma), `bars.json` and `vocal_bars.json` (per-bar stats), `timeline.png`, `vocal_f0.png`, `ssm.png`. Stems in `stems/` (Demucs htdemucs_ft). Scripts: separate.py, beats.py, features.py, vocal.py, sections.py, run in that order with `.venv/Scripts/python.exe`.
