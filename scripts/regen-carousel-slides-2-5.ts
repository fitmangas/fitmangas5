/**
 * Régénère UNIQUEMENT les images slides 2–5 du carousel Mangita.
 * Titres + légende + slides 1 & 6 inchangés.
 */
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(file: string) {
  const abs = path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) return;
  for (const line of fs.readFileSync(abs, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let val = m[2]!.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]!]) process.env[m[1]!] = val;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const POST_ID = 'sp_mscy1nwy_wyc4c5';

async function main() {
  const { getSocialCommsBoard, saveSocialCommsBoard, collectUsedLibraryPaths } = await import(
    '../src/lib/admin/social-comms'
  );
  const { generateSocialPhotoForPost } = await import('../src/lib/admin/social-ai-image');

  const board = await getSocialCommsBoard();
  const target = board.posts.find((p) => p.id === POST_ID);
  if (!target) throw new Error(`Post ${POST_ID} introuvable`);

  const titles = [...(target.carouselSlideTitles || [])];
  const paths = [...(target.carouselPaths || [])];
  if (titles.length < 6 || paths.length < 6) {
    throw new Error(`Attendu 6 titres/paths, got titles=${titles.length} paths=${paths.length}`);
  }

  console.log('Titres (inchangés) :');
  titles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log('\nAvant :');
  paths.forEach((p, i) => console.log(`  ${i + 1}. ${p.slice(0, 90)}`));

  const usedLibrary = collectUsedLibraryPaths(board.posts.filter((p) => p.id !== target.id));
  if (paths[0]) usedLibrary.add(paths[0]);

  // Slides 2–5 = index 1–4
  for (let c = 1; c <= 4; c += 1) {
    const hint = titles[c]!;
    console.log(`\nGénération slide ${c + 1} ← « ${hint} » …`);
    const r = await generateSocialPhotoForPost(
      {
        ...target,
        format: 'carousel',
        useOverlay: true,
        title: hint,
        imageHint: hint,
        overlayText: hint,
        caption: target.caption,
      },
      {
        variationSeed: Date.now() % 10000 + c * 17,
        usedLibraryPaths: usedLibrary,
        preferLibrary: false,
        forceNanoBanana: true,
        libraryThemeHint: hint,
      },
    );
    if (!r.ok) throw new Error(`Slide ${c + 1}: ${r.error}`);
    const isLib =
      r.provider === 'library' || (/^\/library\//.test(r.imagePath) && !/generees/i.test(r.imagePath));
    if (isLib) throw new Error(`Slide ${c + 1}: fallback biblio refusé (${r.imagePath})`);
    paths[c] = r.imagePath;
    console.log(`  OK (${r.provider}): ${r.imagePath.slice(0, 100)}`);
  }

  const now = new Date().toISOString();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((p) =>
      p.id === POST_ID
        ? {
            ...p,
            // titres + légende inchangés
            carouselSlideTitles: titles,
            caption: target.caption,
            title: target.title,
            overlayText: target.overlayText,
            carouselPaths: paths,
            imagePath: paths[0] || p.imagePath,
            imageSource: 'ai',
            updatedAt: now,
          }
        : p,
    ),
  });

  console.log('\n=== RÉSULTAT ===');
  titles.forEach((t, i) => {
    const p = paths[i]!;
    const kind =
      i === 0
        ? 'biblio'
        : i === 5
          ? 'CTA'
          : p.includes('generees')
            ? 'IA'
            : 'autre';
    console.log(`Slide ${i + 1} [${kind}] ${t}`);
    console.log(`         ${p}`);
  });
  console.log('\nLégende inchangée (' + target.caption.length + ' car.).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
