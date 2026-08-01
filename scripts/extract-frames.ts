/**
 * Extrait des frames depuis FitMangas-Reels/brutes/ via ffmpeg,
 * puis sort JPG optimisé + variantes 4:5 et 1:1 vers le dossier cible.
 *
 * Usage:
 *   npx tsx scripts/extract-frames.ts --video FitMangas-Reels/brutes/foo.mp4 --out public/library/portraits --prefix portrait --start 13
 *   npx tsx scripts/extract-frames.ts --dir FitMangas-Reels/brutes --out public/library/lifestyle-coulisses --prefix lifestyle --every 5
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && argv[i + 1]) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function writeVariantsFromJpg(inputPath: string, destDir: string, baseName: string) {
  fs.mkdirSync(destDir, { recursive: true });
  const base = path.join(destDir, baseName);
  const md = sharp(inputPath, { failOn: 'none' }).metadata();
  return md.then(async (m) => {
    const w = m.width || 0;
    const h = m.height || 0;
    const long = Math.max(w, h);
    const scale = long > 2000 ? 2000 / long : 1;
    const tw = Math.round(w * scale);
    const th = Math.round(h * scale);

    await sharp(inputPath)
      .rotate()
      .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(`${base}.jpg`);
    await sharp(inputPath)
      .rotate()
      .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(`${base}.webp`);
    await sharp(inputPath)
      .rotate()
      .resize(1080, 1350, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .toFile(`${base}-4x5.webp`);
    await sharp(inputPath)
      .rotate()
      .resize(1080, 1080, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .toFile(`${base}-1x1.webp`);
  });
}

function extractOne(video: string, destDir: string, prefix: string, index: number, atSec: number) {
  const tmp = path.join(destDir, `.tmp-frame-${index}.jpg`);
  fs.mkdirSync(destDir, { recursive: true });
  execFileSync(
    'ffmpeg',
    ['-y', '-ss', String(atSec), '-i', video, '-frames:v', '1', '-q:v', '2', tmp],
    { stdio: 'ignore' },
  );
  const baseName = `${prefix}-${String(index).padStart(2, '0')}`;
  return writeVariantsFromJpg(tmp, destDir, baseName).then(() => {
    fs.unlinkSync(tmp);
    console.log('OK', baseName, 'from', path.basename(video), `@${atSec}s`);
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const out = path.resolve(args.out || 'public/library/portraits');
  const prefix = args.prefix || 'frame';
  let start = Number(args.start || 1);
  const every = Number(args.every || 3);

  const videos: string[] = [];
  if (args.video) videos.push(path.resolve(args.video));
  if (args.dir) {
    const dir = path.resolve(args.dir);
    for (const name of fs.readdirSync(dir)) {
      if (/\.(mp4|mov|m4v)$/i.test(name)) videos.push(path.join(dir, name));
    }
  }
  if (!videos.length) {
    console.error('Usage: --video <file> | --dir <brutes> --out <dir> --prefix <name> [--start N] [--every sec]');
    process.exit(1);
  }

  for (const video of videos.sort()) {
    // duration probe
    let duration = 10;
    try {
      const probe = execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', video],
        { encoding: 'utf8' },
      );
      duration = Math.max(1, Math.floor(Number(probe.trim()) || 10));
    } catch {
      /* keep default */
    }
    for (let t = Math.min(every, duration - 1); t < duration; t += every) {
      await extractOne(video, out, prefix, start, t);
      start++;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
