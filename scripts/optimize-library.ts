/**
 * Rejoue le pipeline d'optimisation sur un dossier d'originaux (idempotent).
 * Usage: npx tsx scripts/optimize-library.ts --input library-originals/from-public/Bibliothèque\ Fitmangas/barre --out public/library/barre --prefix barre
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

type Args = { input: string; out: string; prefix: string; start?: number };

function parseArgs(argv: string[]): Args {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && argv[i + 1]) out[a.slice(2)] = argv[++i];
  }
  if (!out.input || !out.out || !out.prefix) {
    console.error('Usage: --input <dir> --out <dir> --prefix <name> [--start 1]');
    process.exit(1);
  }
  return { input: out.input, out: out.out, prefix: out.prefix, start: Number(out.start || 1) };
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('._') || name === '.DS_Store') continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

async function heicToJpeg(src: string): Promise<string> {
  const dest = src + '.converted.jpg';
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', src, '--out', dest], {
    stdio: 'ignore',
  });
  return dest;
}

async function writeVariants(inputPath: string, destDir: string, baseName: string) {
  fs.mkdirSync(destDir, { recursive: true });
  const md = await sharp(inputPath, { failOn: 'none', unlimited: true }).metadata();
  const w = md.width || 0;
  const h = md.height || 0;
  const long = Math.max(w, h);
  const scale = long > 2000 ? 2000 / long : 1;
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);
  const base = path.join(destDir, baseName);

  const webp = `${base}.webp`;
  await sharp(inputPath, { failOn: 'none', unlimited: true })
    .rotate()
    .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(webp);

  await sharp(inputPath, { failOn: 'none', unlimited: true })
    .rotate()
    .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(`${base}.jpg`);

  await sharp(inputPath, { failOn: 'none', unlimited: true })
    .rotate()
    .resize(1080, 1350, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(`${base}-4x5.webp`);

  await sharp(inputPath, { failOn: 'none', unlimited: true })
    .rotate()
    .resize(1080, 1080, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(`${base}-1x1.webp`);

  return { webp, bytes: fs.statSync(webp).size };
}

async function main() {
  const args = parseArgs(process.argv);
  const files = walk(path.resolve(args.input)).filter((f) =>
    /\.(jpe?g|png|webp|heic|heif)$/i.test(f),
  );
  let n = args.start || 1;
  for (const file of files.sort()) {
    let input = file;
    if (/\.heic$/i.test(file) || /\.heif$/i.test(file)) {
      input = await heicToJpeg(file);
    }
    const baseName = `${args.prefix}-${String(n).padStart(2, '0')}`;
    const res = await writeVariants(input, path.resolve(args.out), baseName);
    console.log('OK', baseName, Math.round(res.bytes / 1024) + 'Ko', '←', path.basename(file));
    n++;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
