#!/usr/bin/env node
/**
 * Pipeline 1.2–1.7 : déplace originaux → library-originals/, publie versions web dans public/library/.
 * Réversible via library-originals/ops-log.jsonl
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const ORIG = path.join(ROOT, 'library-originals');
const LIB = path.join(PUBLIC, 'library');
const LOG = path.join(ORIG, 'ops-log.jsonl');
const REPORT = path.join(ORIG, 'pipeline-report.json');

const MEDIA = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.dng', '.mov', '.mp4', '.avi', '.webm', '.m4v']);
const NON_WEB = new Set(['.mov', '.mp4', '.avi', '.webm', '.m4v', '.dng', '.heic', '.heif']);

const FOLDER_MAP = {
  barre: 'barre',
  'coaching visio': 'coaching-visio',
  'pilates mat': 'pilates-mat',
  portraits: 'portraits',
  'renfo core': 'renfo-core',
  'lifestyle-coulisses': 'lifestyle-coulisses',
};

const PREFIX = {
  portraits: 'portrait',
  'pilates-mat': 'pilates-mat',
  barre: 'barre',
  'renfo-core': 'renfo-core',
  'coaching-visio': 'coaching-visio',
  'lifestyle-coulisses': 'lifestyle',
  'ambiance-studio': 'ambiance-studio',
  'produit-captures': 'produit',
};

const TARGETS = {
  portraits: 12,
  'pilates-mat': 12,
  barre: 8,
  'renfo-core': 8,
  'coaching-visio': 6,
  'lifestyle-coulisses': 6,
  'ambiance-studio': 5,
  'produit-captures': 3,
};

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function logOp(entry) {
  ensureDir(ORIG);
  fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('._') || name === '.DS_Store') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function extOf(p) {
  return path.extname(p).toLowerCase();
}

function baseKey(name) {
  const stem = path.basename(name, path.extname(name));
  return stem
    .replace(/(\s+[2-9]|\s+\(\d+\)|_copy| copy)$/i, '')
    .replace(/[\s_\-]+/g, '')
    .toLowerCase();
}

function contentKey(p, size) {
  const h = createHash('md5');
  const fd = fs.openSync(p, 'r');
  const chunk = Buffer.alloc(Math.min(1024 * 1024, size));
  fs.readSync(fd, chunk, 0, chunk.length, 0);
  h.update(chunk);
  if (size > 2 * 1024 * 1024) {
    fs.readSync(fd, chunk, 0, chunk.length, Math.max(0, size - chunk.length));
    h.update(chunk);
  }
  fs.closeSync(fd);
  h.update(String(size));
  return h.digest('hex');
}

async function meta(p) {
  try {
    const i = await sharp(p, { failOn: 'none' }).metadata();
    return { w: i.width || 0, h: i.height || 0 };
  } catch {
    return { w: 0, h: 0 };
  }
}

function isLowRes(w, h, bytes, name) {
  const min = Math.min(w || 0, h || 0);
  const n = name.toLowerCase();
  if (/_low\b/.test(n)) return true;
  if (min > 0 && min < 1080) return true;
  if (bytes < 280 * 1024 && /\.(jpe?g|heic|heif)$/i.test(name)) return true;
  return false;
}

function classifySource(absPath) {
  const rel = path.relative(PUBLIC, absPath);
  const parts = rel.split(path.sep);
  const bibIdx = parts.findIndex((p) => /iblioth/i.test(p));
  if (bibIdx >= 0 && parts[bibIdx + 1]) {
    const raw = parts[bibIdx + 1];
    const mapped = FOLDER_MAP[raw] || FOLDER_MAP[raw.normalize?.('NFC') || raw];
    if (mapped) return mapped;
    // NFC normalize keys
    for (const [k, v] of Object.entries(FOLDER_MAP)) {
      if (k.normalize('NFC') === raw.normalize('NFC') || k === raw) return v;
    }
  }
  const lower = rel.toLowerCase();
  if (lower.includes('espace-client') || /espace cliente|espace client/i.test(rel)) return 'produit-captures';
  if (lower.includes('/replays/captures/') || lower.includes('library/replays')) return 'coaching-visio';
  if (lower.includes('library/alejandra/portraits') || /^photo alejandra pose/i.test(path.basename(rel))) return 'portraits';
  if (lower.includes('library/alejandra/exercices') || /exercice|anneau|plage/i.test(path.basename(rel))) {
    if (/barre|rouleau/i.test(path.basename(rel))) return 'barre';
    return 'pilates-mat';
  }
  if (lower.startsWith('landing/') && /hero|offer/i.test(path.basename(rel))) return 'ambiance-studio';
  if (/alejandra\.png$/i.test(rel)) return 'portraits';
  return null;
}

function produitName(basename) {
  const n = basename.toLowerCase();
  if (/dashboard|progression|boutique|blog-desktop|blog-mobile|planning/i.test(n)) {
    if (/mobile/i.test(n)) return 'produit-mobile';
    if (/replay/i.test(n)) return 'produit-replays';
    if (/boutique/i.test(n)) return 'produit-boutique';
    if (/blog/i.test(n)) return 'produit-blog';
    if (/progress/i.test(n)) return 'produit-progression';
    return 'produit-dashboard';
  }
  return 'produit-capture';
}

async function heicToJpeg(src, dest) {
  ensureDir(path.dirname(dest));
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '85', src, '--out', dest], {
    stdio: 'ignore',
  });
  return dest;
}

async function writeVariants(inputPath, destDir, baseName, isProductPng) {
  ensureDir(destDir);
  const img = sharp(inputPath, { failOn: 'none', unlimited: true }).rotate();
  const md = await img.metadata();
  const w = md.width || 0;
  const h = md.height || 0;
  if (!w || !h) throw new Error(`no dimensions: ${inputPath}`);

  const long = Math.max(w, h);
  const scale = long > 2000 ? 2000 / long : 1;
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);

  const webBase = path.join(destDir, baseName);
  let webPath;
  let webBytes;

  if (isProductPng) {
    webPath = `${webBase}.png`;
    await sharp(inputPath, { failOn: 'none', unlimited: true })
      .rotate()
      .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toFile(webPath);
    // if still huge, fall back jpg
    webBytes = fs.statSync(webPath).size;
    if (webBytes > 900 * 1024) {
      const jpg = `${webBase}.jpg`;
      await sharp(inputPath, { failOn: 'none', unlimited: true })
        .rotate()
        .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(jpg);
      fs.unlinkSync(webPath);
      webPath = jpg;
      webBytes = fs.statSync(webPath).size;
    }
  } else {
    const webp = `${webBase}.webp`;
    await sharp(inputPath, { failOn: 'none', unlimited: true })
      .rotate()
      .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(webp);
    webBytes = fs.statSync(webp).size;
    webPath = webp;
    if (webBytes > 550 * 1024) {
      await sharp(inputPath, { failOn: 'none', unlimited: true })
        .rotate()
        .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 72 })
        .toFile(webp);
      webBytes = fs.statSync(webp).size;
    }
    // JPG fallback twin for compatibility
    const jpg = `${webBase}.jpg`;
    await sharp(inputPath, { failOn: 'none', unlimited: true })
      .rotate()
      .resize(tw, th, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(jpg);
  }

  // Center crops 4:5 and 1:1
  const crop45 = `${webBase}-4x5.webp`;
  const crop11 = `${webBase}-1x1.webp`;
  await sharp(inputPath, { failOn: 'none', unlimited: true })
    .rotate()
    .resize(1080, 1350, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(crop45);
  await sharp(inputPath, { failOn: 'none', unlimited: true })
    .rotate()
    .resize(1080, 1080, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(crop11);

  const webMeta = await sharp(webPath).metadata();
  return {
    webPath: path.relative(PUBLIC, webPath),
    crop45: path.relative(PUBLIC, crop45),
    crop11: path.relative(PUBLIC, crop11),
    webBytes,
    dims: `${webMeta.width}x${webMeta.height}`,
    sourceDims: `${w}x${h}`,
  };
}

function moveToOriginals(absSrc, reason) {
  const rel = path.relative(PUBLIC, absSrc);
  const dest = path.join(ORIG, 'from-public', rel);
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest)) {
    const alt = dest + '.dup-' + Date.now();
    fs.renameSync(absSrc, alt);
    logOp({ op: 'move', from: rel, to: path.relative(ROOT, alt), reason: reason + ' (collision)' });
    return alt;
  }
  fs.renameSync(absSrc, dest);
  logOp({ op: 'move', from: rel, to: path.relative(ROOT, dest), reason });
  return dest;
}

function copyToOriginalsKeep(absSrc, reason) {
  // when we need to process then remove from public
  return moveToOriginals(absSrc, reason);
}

async function optimizeSiteAsset(absSrc) {
  // Keep relative path under public, move original, write optimized <1MB
  const rel = path.relative(PUBLIC, absSrc);
  const e = extOf(absSrc);
  if (!MEDIA.has(e)) return null;
  if (NON_WEB.has(e)) {
    moveToOriginals(absSrc, 'non-web site asset');
    return { removed: rel };
  }
  const st = fs.statSync(absSrc);
  const { w, h } = await meta(absSrc);
  const origPath = moveToOriginals(absSrc, 'site asset original (>1Mo or optimize)');
  let input = origPath;
  if (e === '.heic' || e === '.heif') {
    const tmp = origPath + '.converted.jpg';
    await heicToJpeg(origPath, tmp);
    input = tmp;
  }
  ensureDir(path.dirname(path.join(PUBLIC, rel)));
  const outExt = /\.png$/i.test(rel) && /logo|icon|favicon|avatar|coach/i.test(rel) ? '.png' : '.jpg';
  const outRel = rel.replace(/\.(png|jpe?g|webp|heic)$/i, outExt);
  const outAbs = path.join(PUBLIC, outRel);
  const long = Math.max(w || 2000, h || 2000);
  const maxSide = /logo|icon|favicon|apple-icon|og-default|avatar|coach/i.test(rel) ? Math.min(long, 1200) : 2000;
  let quality = 82;
  for (let i = 0; i < 5; i++) {
    await sharp(input, { failOn: 'none', unlimited: true })
      .rotate()
      .resize(maxSide, maxSide, { fit: 'inside', withoutEnlargement: true })
      [outExt === '.png' ? 'png' : 'jpeg'](
        outExt === '.png' ? { compressionLevel: 9 } : { quality, mozjpeg: true },
      )
      .toFile(outAbs);
    const sz = fs.statSync(outAbs).size;
    if (sz <= 1024 * 1024) {
      logOp({ op: 'optimize-site', from: rel, to: outRel, bytes: sz, reason: 'public asset <1MB' });
      return { from: rel, to: outRel, bytes: sz };
    }
    quality -= 10;
  }
  // force smaller
  await sharp(input, { failOn: 'none', unlimited: true })
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(outAbs.replace(/\.(png|jpg)$/i, '.jpg'));
  const finalRel = outRel.replace(/\.(png|jpg)$/i, '.jpg');
  const finalAbs = path.join(PUBLIC, finalRel);
  if (finalAbs !== outAbs && fs.existsSync(outAbs)) fs.unlinkSync(outAbs);
  logOp({ op: 'optimize-site', from: rel, to: finalRel, bytes: fs.statSync(finalAbs).size, reason: 'forced <1MB' });
  return { from: rel, to: finalRel, bytes: fs.statSync(finalAbs).size };
}

async function main() {
  ensureDir(ORIG);
  fs.writeFileSync(LOG, ''); // reset log this run
  const beforeBytes = walk(PUBLIC).reduce((a, p) => a + fs.statSync(p).size, 0);

  // Collect library candidates from Bibliothèque + existing library social photos + root alejandra photos + product
  const candidates = [];
  for (const p of walk(PUBLIC)) {
    const e = extOf(p);
    if (!MEDIA.has(e)) continue;
    const rel = path.relative(PUBLIC, p);
    // skip tiny site chrome for library pipeline (handled later)
    if (/^(favicon|apple-icon|icon-512|logo|manifest|sw\.js|og-default)/i.test(path.basename(rel))) continue;
    if (rel.startsWith('coaches/')) continue;
    if (rel.startsWith('replays/covers/')) continue;
    if (rel.startsWith('landing/')) continue; // assets site : optimisation in-place uniquement
    if (/library\/landing\/avatars/i.test(rel)) continue;

    const folder = classifySource(p);
    if (!folder && !rel.startsWith('Biblioth') && !/iblioth/i.test(rel) && !rel.startsWith('library/') && !/^Photo |^espace |^Espace |^alejandra/i.test(path.basename(rel))) {
      continue;
    }
    candidates.push({ abs: p, rel, folder: folder || 'lifestyle-coulisses', ext: e });
  }

  // Also take EVERYTHING under Bibliothèque
  for (const p of walk(PUBLIC)) {
    const rel = path.relative(PUBLIC, p);
    if (!/iblioth/i.test(rel.split(path.sep)[0] || '')) continue;
    const e = extOf(p);
    if (!MEDIA.has(e)) continue;
    if (candidates.some((c) => c.abs === p)) continue;
    candidates.push({ abs: p, rel, folder: classifySource(p) || 'lifestyle-coulisses', ext: e });
  }

  console.log('Candidates:', candidates.length);

  // Enrich with meta + hash
  const enriched = [];
  for (const c of candidates) {
    const st = fs.statSync(c.abs);
    const { w, h } = await meta(c.abs);
    const key = contentKey(c.abs, st.size);
    const bkey = baseKey(c.rel);
    enriched.push({
      ...c,
      bytes: st.size,
      w,
      h,
      min: Math.min(w || 0, h || 0) || 0,
      pixels: (w || 0) * (h || 0),
      hash: key,
      bkey,
    });
  }

  // Dedupe by hash: keep highest pixels then bytes
  const byHash = new Map();
  for (const e of enriched) {
    const prev = byHash.get(e.hash);
    if (!prev || e.pixels > prev.pixels || (e.pixels === prev.pixels && e.bytes > prev.bytes)) {
      byHash.set(e.hash, e);
    }
  }
  const winners = new Set([...byHash.values()].map((x) => x.abs));
  const rejected = [];
  for (const e of enriched) {
    if (!winners.has(e.abs)) {
      rejected.push({ ...e, why: 'doublon (gardé meilleure résolution)' });
    }
  }

  // Low-res rejects among winners
  const publishable = [];
  for (const e of enriched) {
    if (!winners.has(e.abs)) continue;
    if (NON_WEB.has(e.ext) && e.ext !== '.heic' && e.ext !== '.heif') {
      rejected.push({ ...e, why: `non-web ${e.ext}` });
      continue;
    }
    if (isLowRes(e.w, e.h, e.bytes, path.basename(e.rel))) {
      // HEIC without dims: try convert first? For IMG_4060 small bytes → reject
      rejected.push({ ...e, why: 'basse résolution / _low / <1080px' });
      continue;
    }
    publishable.push(e);
  }

  // Move all rejected + all publishable originals to library-originals first
  const work = [];
  for (const e of [...publishable, ...rejected]) {
    if (!fs.existsSync(e.abs)) continue;
    const dest = moveToOriginals(e.abs, e.why || 'original pour optimisation');
    work.push({ ...e, origAbs: dest });
  }

  // Counters per folder
  const counters = Object.fromEntries(Object.keys(TARGETS).map((k) => [k, 0]));
  const published = [];
  const failed = [];

  for (const e of work) {
    if (e.why) continue; // rejected
    let input = e.origAbs;
    try {
      if (e.ext === '.heic' || e.ext === '.heif') {
        const tmp = e.origAbs + '.jpg';
        await heicToJpeg(e.origAbs, tmp);
        input = tmp;
        const m = await meta(input);
        if (isLowRes(m.w, m.h, fs.statSync(input).size, path.basename(e.rel))) {
          rejected.push({ ...e, why: 'basse résolution après HEIC→JPG' });
          logOp({ op: 'skip-publish', from: e.rel, reason: 'basse résolution après HEIC' });
          continue;
        }
      }

      let folder = e.folder;
      // Reclass: coaching-visio landscapes that are clearly product already mapped
      if (folder === 'produit-captures') {
        // ok
      }

      counters[folder] = (counters[folder] || 0) + 1;
      const n = counters[folder];
      const prefix = folder === 'produit-captures' ? produitName(path.basename(e.rel)) : PREFIX[folder] || folder;
      const baseName = `${prefix}-${String(n).padStart(2, '0')}`;
      const destDir = path.join(LIB, folder);
      const isProduct = folder === 'produit-captures';
      const variants = await writeVariants(input, destDir, baseName, isProduct);
      published.push({
        folder,
        baseName,
        from: e.rel,
        ...variants,
      });
      logOp({
        op: 'publish',
        from: e.rel,
        to: variants.webPath,
        crop45: variants.crop45,
        crop11: variants.crop11,
        bytes: variants.webBytes,
      });
      console.log('OK', folder, baseName, Math.round(variants.webBytes / 1024) + 'Ko', '←', e.rel);
    } catch (err) {
      failed.push({ rel: e.rel, error: String(err) });
      logOp({ op: 'error', from: e.rel, error: String(err) });
      console.error('FAIL', e.rel, err);
    }
  }

  // Empty leftover Bibliothèque dir
  const bib = walk(PUBLIC).filter((p) => /iblioth/i.test(path.relative(PUBLIC, p).split(path.sep)[0] || ''));
  for (const p of bib) {
    if (MEDIA.has(extOf(p))) moveToOriginals(p, 'reste Bibliothèque');
  }
  // remove empty dirs under Bibliothèque
  try {
    const bibDir = fs.readdirSync(PUBLIC).find((n) => /iblioth/i.test(n));
    if (bibDir) {
      // move whole leftover tree
      const src = path.join(PUBLIC, bibDir);
      const dest = path.join(ORIG, 'from-public', bibDir);
      ensureDir(path.dirname(dest));
      if (!fs.existsSync(dest)) fs.renameSync(src, dest);
      else {
        // already moved files; remove empty
        fs.rmSync(src, { recursive: true, force: true });
      }
      logOp({ op: 'move-dir', from: bibDir, to: path.relative(ROOT, dest), reason: 'dossier Bibliothèque vidé' });
    }
  } catch (e) {
    console.warn('bib cleanup', e);
  }

  // Optimize remaining public media > 1MB or any heic left
  for (const p of walk(PUBLIC)) {
    const e = extOf(p);
    if (!MEDIA.has(e)) continue;
    const rel = path.relative(PUBLIC, p);
    if (rel.startsWith('library/')) {
      // ensure library published files < 1MB
      const sz = fs.statSync(p).size;
      if (sz > 1024 * 1024) {
        const tmp = p + '.reopt';
        await sharp(p, { failOn: 'none' })
          .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 70 })
          .toFile(tmp);
        fs.renameSync(tmp, p.endsWith('.webp') ? p : p.replace(/\.\w+$/, '.webp'));
        if (!p.endsWith('.webp') && fs.existsSync(p)) {
          moveToOriginals(p, 'library file still >1MB after publish');
        }
      }
      continue;
    }
    const sz = fs.statSync(p).size;
    if (NON_WEB.has(e) || sz > 1024 * 1024 || e === '.png') {
      // optimize png/jpg site assets
      try {
        await optimizeSiteAsset(p);
      } catch (err) {
        console.error('site opt fail', rel, err);
      }
    }
  }

  // Second pass: any file still >1MB in public
  for (const p of walk(PUBLIC)) {
    const e = extOf(p);
    if (!MEDIA.has(e)) continue;
    const sz = fs.statSync(p).size;
    if (sz <= 1024 * 1024) continue;
    const rel = path.relative(PUBLIC, p);
    console.log('RECOMPRESS', rel, Math.round(sz / 1024), 'Ko');
    const orig = moveToOriginals(p, 'encore >1Mo après 1er passage');
    const out = path.join(PUBLIC, rel.replace(/\.\w+$/, '.jpg'));
    ensureDir(path.dirname(out));
    await sharp(orig, { failOn: 'none', unlimited: true })
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 68, mozjpeg: true })
      .toFile(out);
    logOp({ op: 'recompress', from: rel, to: path.relative(PUBLIC, out), bytes: fs.statSync(out).size });
  }

  // Build manifest
  const byFolder = {};
  for (const folder of Object.keys(TARGETS)) {
    const dir = path.join(LIB, folder);
    ensureDir(dir);
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => !f.startsWith('.') && !f.includes('-4x5') && !f.includes('-1x1') && /\.(webp|jpg|png)$/i.test(f))
      : [];
    const entries = [];
    for (const f of files.sort()) {
      const base = f.replace(/\.(webp|jpg|png)$/i, '');
      const abs = path.join(dir, f);
      const m = await sharp(abs).metadata();
      entries.push({
        file: `library/${folder}/${f}`,
        ratios: {
          web: true,
          '4x5': fs.existsSync(path.join(dir, `${base}-4x5.webp`)),
          '1x1': fs.existsSync(path.join(dir, `${base}-1x1.webp`)),
        },
        dims: `${m.width}x${m.height}`,
        bytes: fs.statSync(abs).size,
      });
    }
    byFolder[folder] = {
      theme: folder,
      target: TARGETS[folder],
      count: entries.length,
      missing: Math.max(0, TARGETS[folder] - entries.length),
      files: entries,
    };
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    themeMapping: {
      dos: 'pilates-mat',
      stress: 'lifestyle-coulisses',
      bassin: 'pilates-mat',
      hanches: 'barre',
      sommeil: 'lifestyle-coulisses',
      confiance: 'portraits',
      energie: 'renfo-core',
      identite: 'portraits',
      preuve: 'coaching-visio',
      cta: 'produit-captures',
      ambiance: 'ambiance-studio',
    },
    antiRepeatN: 12,
    folders: byFolder,
  };
  fs.writeFileSync(path.join(LIB, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Clean empty old library subdirs leftovers (alejandra, raw, etc.) — move remaining to originals
  for (const p of walk(path.join(LIB))) {
    const rel = path.relative(PUBLIC, p);
    if (rel === 'library/manifest.json') continue;
    const parts = rel.split(path.sep);
    if (parts[0] === 'library' && parts[1] && !TARGETS[parts[1]] && MEDIA.has(extOf(p))) {
      moveToOriginals(p, 'ancien chemin library non mappé');
    }
  }

  const afterFiles = walk(PUBLIC);
  const afterBytes = afterFiles.reduce((a, p) => a + fs.statSync(p).size, 0);
  const over1 = afterFiles.filter((p) => MEDIA.has(extOf(p)) && fs.statSync(p).size > 1024 * 1024);

  const report = {
    beforeBytes,
    afterBytes,
    beforeMb: +(beforeBytes / 1024 / 1024).toFixed(1),
    afterMb: +(afterBytes / 1024 / 1024).toFixed(1),
    published: published.length,
    rejected: rejected.map((r) => ({ rel: r.rel, why: r.why, dims: `${r.w}x${r.h}`, mb: +(r.bytes / 1024 / 1024).toFixed(2) })),
    failed,
    folders: Object.fromEntries(
      Object.entries(byFolder).map(([k, v]) => [
        k,
        {
          count: v.count,
          target: v.target,
          missing: v.missing,
          bytes: v.files.reduce((a, f) => a + f.bytes, 0),
          with45: v.files.filter((f) => f.ratios['4x5']).length,
          with11: v.files.filter((f) => f.ratios['1x1']).length,
        },
      ]),
    ),
    over1MbRemaining: over1.map((p) => ({ rel: path.relative(PUBLIC, p), mb: +(fs.statSync(p).size / 1024 / 1024).toFixed(2) })),
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log('\n=== REPORT ===');
  console.log(JSON.stringify(report.folders, null, 2));
  console.log('before/after Mo', report.beforeMb, report.afterMb);
  console.log('over1Mb', report.over1MbRemaining);
  console.log('rejected', report.rejected.length);
  console.log('published', report.published);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
