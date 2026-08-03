/**
 * CM v8 — régénère le carousel de la semaine au format LISTE validé.
 * Usage: npx tsx scripts/regen-carousel-v8.ts
 */
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(file: string) {
  const abs = path.join(process.cwd(), file);
  if (!fs.existsSync(abs)) return;
  for (const line of fs.readFileSync(abs, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1]!;
    let val = m[2]!.trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function main() {
  const { getSocialCommsBoard, saveSocialCommsBoard, collectUsedLibraryPaths } = await import(
    '../src/lib/admin/social-comms'
  );
  const {
    exampleListCarouselCopy,
    proofreadCarouselCopy,
    withCarouselSlideCount,
  } = await import('../src/lib/admin/social-cm-playbook');
  const { generateSocialPhotoForPost, uploadSocialGeneratedImage } = await import('../src/lib/admin/social-ai-image');
  const { BrandBackgroundProvider } = await import('../src/lib/admin/image-providers/brand-background-provider');
  const { listProductCapturePaths, sanitizeCarouselPaths } = await import(
    '../src/lib/admin/image-providers/library-provider'
  );

  const board = await getSocialCommsBoard();
  const target = board.posts.find((p) => p.format === 'carousel');
  if (!target) {
    console.error('Aucun carousel trouvé sur le board.');
    process.exit(1);
  }

  const locale = target.locale || 'fr';
  const example = exampleListCarouselCopy(locale);
  const slideTitles = example.slideTitles.map((t) => proofreadCarouselCopy(t, locale));
  const caption = proofreadCarouselCopy(example.caption, locale);
  const overlayText = slideTitles[0]!;
  const title = withCarouselSlideCount(
    locale === 'es'
      ? '5 razones para dejar el Pilates de YouTube'
      : '5 raisons d’arrêter le Pilates YouTube',
    7,
  );
  const cta = locale === 'es' ? 'Prueba gratis 7 días → fitmangas.com' : 'Essai gratuit 7 jours → fitmangas.com';

  console.log('Post:', target.id);
  console.log('Titres:');
  slideTitles.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log('Caption chars:', caption.length);
  if (/ERROURS/i.test(slideTitles.join(' ') + caption)) {
    throw new Error('Orthographe: ERROURS encore présent');
  }

  const usedLibrary = collectUsedLibraryPaths(board.posts.filter((p) => p.id !== target.id));
  const paths: Array<string | null> = new Array(7).fill(null);

  // Slide 6 (index 5) = fond de marque
  {
    const brand = new BrandBackgroundProvider();
    const brandImg = await brand.generate('quote-frame citation slide', { width: 1080, height: 1350 });
    if ('buffer' in brandImg && brandImg.buffer.length) {
      paths[5] = await uploadSocialGeneratedImage(brandImg.buffer, `${target.id}-s6`);
      console.log('Slide 6 brand OK');
    }
  }

  // Slide 7 (index 6) = CTA dashboard réel
  paths[6] =
    listProductCapturePaths().find((p) => /produit-dashboard-02-4x5/i.test(p)) ||
    '/library/produit-captures/produit-dashboard-02-4x5.webp';
  console.log('Slide 7 CTA:', paths[6]);

  // Slides 1–5 (index 0–4) = images IA / library selon cascade
  for (let c = 0; c < 5; c += 1) {
    const r = await generateSocialPhotoForPost(
      { ...target, title, caption, overlayText, useOverlay: true, imageHint: slideTitles[c] || title },
      {
        variationSeed: (target.generationSlot ?? 0) * 10 + c + 1,
        usedLibraryPaths: usedLibrary,
        preferLibrary: c === 0,
        forceNanoBanana: c > 0 && c < 5,
        allowUnsplash: false,
        libraryThemeHint: slideTitles[c] || title,
      },
    );
    if (!r.ok) {
      console.warn(`Slide ${c + 1} échec:`, r.error);
    } else {
      paths[c] = r.imagePath;
      usedLibrary.add(r.imagePath);
      console.log(`Slide ${c + 1} OK (${r.provider}):`, r.imagePath.slice(0, 80));
    }
  }

  const fallbackPool = listProductCapturePaths();
  const filled: string[] = [];
  for (let c = 0; c < 7; c += 1) {
    filled[c] =
      paths[c] ||
      filled[c - 1] ||
      fallbackPool.find((p) => !filled.includes(p)) ||
      fallbackPool[0] ||
      '/library/produit-captures/produit-dashboard-02-4x5.webp';
  }
  const carouselPaths = sanitizeCarouselPaths(filled);
  console.log('Final slide count:', carouselPaths.length);
  carouselPaths.forEach((p, i) => console.log(`  ${i + 1}: ${p}`));

  const now = new Date().toISOString();
  const nextBoard = {
    ...board,
    posts: board.posts.map((p) =>
      p.id === target.id
        ? {
            ...p,
            title,
            caption,
            cta,
            overlayText,
            useOverlay: true,
            hookTitle: overlayText,
            carouselSlideTitles: slideTitles,
            carouselPaths,
            imagePath: carouselPaths[0] ?? null,
            imageSource: 'ai' as const,
            generationStatus: 'done' as const,
            generationError: null,
            updatedAt: now,
          }
        : p,
    ),
  };
  await saveSocialCommsBoard(nextBoard);
  console.log('Board sauvegardé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
