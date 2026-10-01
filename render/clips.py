"""Social clips cut from the film (Claire's picks, 10-01), each on the song's grid, with editing room.

usage: python3 render/clips.py [name ...]   (default: all)  ->  out/clips/<name>.mp4

Claire gave the spans to the second; each in and out was snapped to the musical event inside or next to that
second (render/data/events.json: bars, beats, sung onsets). She trims the plain ends to the exact beat herself, so
every end without a designed fade-out gets a bar (4 beats) of room beyond the snapped point and no fade; the
fade-outs she asked for stay as designed. The picture comes from out/film.mp4 and the audio from
analysis/shelter.wav (encoded once); a 10 ms audio fade-in avoids a click on the first sample.
"""
import subprocess, sys
from pathlib import Path

ROOT = Path("C:/Users/USER/Projects/shelter-mv")
OUT = ROOT / "out" / "clips"
ROOM = 72                                   # one bar (4 beats) of handle at each plain end
LAST = 6532                                 # the film's frame count
# name: (snapped in frame, snapped out frame (exclusive), audio fade-out s, picture fade-out s, what it is)
# A fade-out of 0 marks a plain end, which gets the handle.
CLIPS = {
    "opening":         (0,    1163, 0.0, 0.0, "0:00-0:38.8: the starburst, Clawd, pretraining and hook 1, to the hook's end (bar 17)"),
    "verse1_drop1":    (1145, 3179, 2.4, 0.6, "0:38.2-1:46.0: the push into the screen (16.4), verse 1, the pre-chorus, drop 1 to the 4096 worlds (bar 45)"),
    "breakdown_build": (3680, 4907, 0.0, 0.0, "2:02.7-2:43.6: from the sung onset before bar 52 (the copy) through the techs to the bar-69 kick"),
    "climax":          (4601, 6419, 1.5, 0.6, "2:33.4-3:34.0: the sung pickup into bar 65 (the core lands) to the full starburst (bar 90)"),
    "climax_ring":     (4835, 6419, 1.5, 0.6, "2:41.2-3:34.0: from bar 68 (the satellites) to the full starburst (bar 90)"),
}


def cut(name):
    f0, f1, afo, vfo, what = CLIPS[name]
    a = max(0, f0 - ROOM)                                   # every in-point is a plain end
    b = min(LAST, f1 + ROOM) if afo == 0 and vfo == 0 else f1
    t0, dur = a / 30, (b - a) / 30
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{name}.mp4"
    vf = ["fps=30"] + ([f"fade=t=out:st={dur - vfo:.4f}:d={vfo}"] if vfo > 0 else [])
    af = (["afade=t=in:d=0.01"] if a > 0 else []) + ([f"afade=t=out:st={dur - afo:.4f}:d={afo}"] if afo > 0 else [])
    subprocess.run([
        "ffmpeg", "-loglevel", "error", "-y",
        # the picture is sought half a frame early so the first frame kept is exactly frame a (a seek to its own
        # rounded time can land one frame late); the fps filter puts it at t = 0, level with the audio
        "-ss", f"{max(0.0, t0 - 1 / 60):.4f}", "-i", str(ROOT / "out" / "film.mp4"),
        "-ss", f"{t0:.4f}", "-i", str(ROOT / "analysis" / "shelter.wav"),
        "-t", f"{dur:.4f}", "-map", "0:v", "-map", "1:a",
        "-vf", ",".join(vf)] + (["-af", ",".join(af)] if af else []) + [
        "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-maxrate", "25M", "-bufsize", "50M",
        "-pix_fmt", "yuv420p", "-profile:v", "high",
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", str(out)], check=True)
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size", "-of", "csv=p=0", str(out)],
                           capture_output=True, text=True).stdout.strip()
    print(f"{name}: {what}\n   -> {out.name} ({probe}); snapped in at {(f0 - a) / 30:.2f} s, snapped out at "
          f"{(f1 - a) / 30:.2f} s of {dur:.2f} s" + ("" if b > f1 else " (designed fade-out)"))


if __name__ == "__main__":
    for n in (sys.argv[1:] or CLIPS):
        cut(n)
