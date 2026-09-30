// Assemble the film: shot clips in shots.json order + the song.
//
//   node render/assemble.mjs              -> out/film.mp4 (1080p). Shots without a finished clip
//                                           fall back to the matching animatic segment, so there is
//                                           always a watchable full cut.
//   node render/assemble.mjs --clip out/shots/_SYNC_s0.25.mp4   -> mux one full-length clip with the song
//
// Audio comes from analysis/shelter.wav (the exact decode the beat grid was measured on), so the
// picture stays locked to the analysis.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { shotFrames, FPS, N_FRAMES } from './core.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const WAV = path.join(ROOT, 'analysis', 'shelter.wav');
const run = (args, what) => {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${what}`);
};
const frames = (p) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets',
    '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', p], { encoding: 'utf8' });
  return parseInt(r.stdout.trim());
};
const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-profile:v', 'high', '-g', '60', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'];
const FINAL = ['-c:v', 'libx264', '-preset', 'slow', '-crf', opt('--crf', '17'), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart'];

// --shot S21: mux one finished shot with its own stretch of the song -> out/shots/S21_av.mp4
const one = opt('--shot');
if (one) {
  const s = JSON.parse(fs.readFileSync(path.join(ROOT, 'shots.json'), 'utf8')).shots.find((x) => x.id === one);
  const { f0 } = shotFrames(s);
  const src = path.join(ROOT, 'out', 'shots', `${one}.mp4`), out = path.join(ROOT, 'out', 'shots', `${one}_av.mp4`);
  run(['-i', src, '-ss', (f0 / FPS).toFixed(4), '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', out], 'shot mux');
  console.log(`wrote ${path.relative(ROOT, out)} (${frames(out)} frames from frame ${f0})`);
  process.exit(0);
}

const clip = opt('--clip');
if (clip) {
  const out = clip.replace(/\.mp4$/, '_av.mp4');
  run(['-i', clip, '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', out], 'mux');
  console.log(`wrote ${path.relative(ROOT, out)} (${frames(out)} frames)`);
  process.exit(0);
}

const shots = JSON.parse(fs.readFileSync(path.join(ROOT, 'shots.json'), 'utf8')).shots.map((s) => ({ ...s, ...shotFrames(s) }));
const fb = path.join(ROOT, 'out', 'fallback');
fs.mkdirSync(fb, { recursive: true });
const list = [];
let rendered = 0;
for (const s of shots) {
  const n = s.f1 - s.f0;
  const own = path.join(ROOT, 'out', 'shots', `${s.id}.mp4`);
  if (fs.existsSync(own) && frames(own) === n) { list.push(own); rendered++; continue; }
  if (fs.existsSync(own)) console.log(`${s.id}: clip has ${frames(own)} frames, want ${n}; using fallback`);
  const alt = path.join(fb, `${s.id}.mp4`);
  if (!fs.existsSync(alt) || frames(alt) !== n) {
    run(['-ss', (s.f0 / FPS).toFixed(4), '-i', path.join(ROOT, 'animatic', 'animatic.mp4'), '-frames:v', String(n),
      '-vf', 'scale=1920:1080:flags=bicubic,setsar=1', '-r', String(FPS), '-an', ...ENC, alt], `fallback ${s.id}`);
  }
  list.push(alt);
}
const listFile = path.join(ROOT, 'out', 'concat.txt');
fs.writeFileSync(listFile, list.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n') + '\n');
const out = path.join(ROOT, 'out', 'film.mp4');
run(['-f', 'concat', '-safe', '0', '-i', listFile, '-i', WAV, '-map', '0:v', '-map', '1:a', ...FINAL, '-shortest', out], 'film');
const n = frames(out);
console.log(`wrote out/film.mp4: ${n} frames (want ${N_FRAMES}), ${rendered}/${shots.length} shots rendered, rest from the animatic`);
