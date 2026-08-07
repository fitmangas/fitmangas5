/**
 * Régénère le carousel Mangita (6 slides) — titres + images (biblio / IA / CTA).
 * Usage: npx tsx scripts/regen-carousel-6slides.ts
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

const MANGITA_TITLES_FR = [
  'CE QU’UNE MANGITA A COMPRIS',
  '1. AVANT, PERSONNE NE L’ATTENDAIT',
  '2. LA COACH DIT SON PRÉNOM',
  '3. ON CORRIGE SON BASSIN EN DIRECT',
  '4. ELLE NE RATE PLUS LE MARDI',
  'ESSAI 7 JOURS — ON T’ATTEND EN VISIO',
];

const MANGITA_CAPTION = `Une Mangita nous a écrit : « J’ai compris que je ne payais pas pour des exercices. Je payais pour qu’on m’attende. »

Avant, personne ne la rappelait si elle manquait. Le tapis restait roulé, la culpabilité montait, et chaque reprise recommençait à zéro — sans correction, sans prénom, sans rendez-vous.

Maintenant, la coach dit son prénom. Quelqu’un voit son bassin et ajuste. Quelqu’un remarque si elle n’est pas là le mardi. Ce n’est plus une vidéo à consommer : c’est une présence.

Ce qu’elle a compris : progresser, ce n’est pas regarder. C’est être vue, corrigée, attendue.

Essai gratuit 7 jours → fitmangas.com`;

async function main() {
  const { getSocialCommsBoard, saveSocialCommsBoard, collectUsedLibraryPaths } = await import(
    '../src/lib/admin/social-comms'
  );
  const {
    normalizeCarouselSlideTitles,
    isBareNumericSlideTitle,
    CAROUSEL_SLIDE_COUNT,
    withCarouselSlideCount,
    polishOverlayText,
  } = await import('../src/lib/admin/social-cm-playbook');
  const { generateSocialPhotoForPost, uploadSocialGeneratedImage } = await import('../src/lib/admin/social-ai-image');
  const { composeCarouselCtaSlideBuffer } = await import('../src/lib/admin/compose-carousel-cta');

  const board = await getSocialCommsBoard();
  const target = board.posts.find((p) => p.id === POST_ID);
  if (!target) throw new Error(`Post ${POST_ID} introuvable`);

  const slideTitles = normalizeCarouselSlideTitles(MANGITA_TITLES_FR, MANGITA_TITLES_FR[0]!, 'fr').titles;
  console.log('=== 6 TITRES ===');
  slideTitles.forEach((t, i) => {
    console.log(`${i + 1}. ${t}${isBareNumericSlideTitle(t) ? ' ← INVALIDE' : ''}`);
  });
  if (slideTitles.length !== CAROUSEL_SLIDE_COUNT) throw new Error('Pas 6 titres');
  if (slideTitles.some(isBareNumericSlideTitle)) throw new Error('Titre numérique détecté');

  const usedLibrary = collectUsedLibraryPaths(board.posts.filter((p) => p.id !== target.id));
  const paths: Array<string | null> = new Array(CAROUSEL_SLIDE_COUNT).fill(null);

  // Slide 1 — portrait Alejandra
  {
    const r = await generateSocialPhotoForPost(
      { ...target, format: 'carousel', useOverlay: true, imageHint: 'portrait Alejandra', overlayText: slideTitles[0]! },
      {
        variationSeed: 11,
        usedLibraryPaths: usedLibrary,
        preferLibrary: true,
        forceNanoBanana: false,
        libraryFolder: 'portraits',
        libraryThemeHint: 'portrait Alejandra confiance',
      },
    );
    if (!r.ok) throw new Error(`Slide 1: ${r.error}`);
    paths[0] = r.imagePath;
    usedLibrary.add(r.imagePath);
    console.log('Slide 1 (library):', r.imagePath, r.provider);
  }

  // Slides 2–5 — IA sur le sujet
  for (let c = 1; c <= 4; c += 1) {
    const hint = slideTitles[c]!;
    const r = await generateSocialPhotoForPost(
      {
        ...target,
        format: 'carousel',
        useOverlay: true,
        title: hint,
        imageHint: hint,
        overlayText: hint,
      },
      {
        variationSeed: 20 + c,
        usedLibraryPaths: usedLibrary,
        preferLibrary: false,
        forceNanoBanana: true,
        libraryThemeHint: hint,
      },
    );
    if (!r.ok) {
      console.warn(`Slide ${c + 1} échec:`, r.error);
      continue;
    }
    const isLib =
      r.provider === 'library' || (/^\/library\//.test(r.imagePath) && !/generees/i.test(r.imagePath));
    if (isLib) {
      console.warn(`Slide ${c + 1} biblio refusée:`, r.imagePath);
      continue;
    }
    paths[c] = r.imagePath;
    console.log(`Slide ${c + 1} (IA ${r.provider}):`, r.imagePath.slice(0, 90));
  }

  // Slide 6 — CTA composé
  {
    const buf = await composeCarouselCtaSlideBuffer({ overlayText: slideTitles[5] });
    paths[5] = await uploadSocialGeneratedImage(buf, `${target.id}-cta`, {
      prompt: 'carousel-cta-dashboard-contain',
      provider: 'brand',
      theme: 'cta-dashboard',
    });
    console.log('Slide 6 (CTA composed):', paths[5]);
  }

  for (let i = 0; i < CAROUSEL_SLIDE_COUNT; i += 1) {
    if (!paths[i]) throw new Error(`Slide ${i + 1} manquante`);
  }

  const now = new Date().toISOString();
  const overlay = polishOverlayText(slideTitles[0]!, 'fr', 56);
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((p) =>
      p.id === target.id
        ? {
            ...p,
            title: withCarouselSlideCount('Ce qu’une Mangita a compris en progressant avec nous', 6),
            caption: MANGITA_CAPTION,
            cta: 'Essai gratuit 7 jours → fitmangas.com',
            overlayText: overlay,
            hookTitle: overlay,
            useOverlay: true,
            carouselSlideTitles: slideTitles,
            carouselPaths: paths as string[],
            imagePath: paths[0]!,
            imageSource: 'ai',
            generationStatus: 'done',
            generationError: null,
            pillarId: 'progres_adherente',
            updatedAt: now,
          }
        : p,
    ),
  });

  console.log('\n=== RÉSULTAT ===');
  console.log('slides:', paths.length);
  paths.forEach((p, i) => console.log(`  ${i + 1}: ${p}`));
  console.log('Board sauvegardé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
