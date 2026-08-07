/**
 * Applique le texte LISTE sur le carousel Mangita — SANS régénérer les images.
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

async function main() {
  const {
    mangitaProgressListCarouselCopy,
    normalizeCarouselSlideTitles,
    looksLikeNarrativeCarouselFragment,
    isBareNumericSlideTitle,
    polishOverlayText,
    countCaptionWords,
    analyzeCaptionForPost,
    CAROUSEL_LIST_FORMAT_RULES,
    withCarouselSlideCount,
  } = await import('../src/lib/admin/social-cm-playbook');
  const { getSocialCommsBoard, saveSocialCommsBoard } = await import('../src/lib/admin/social-comms');

  console.log('=== REGLE VERROUILLEE (extrait) ===\n');
  console.log(CAROUSEL_LIST_FORMAT_RULES);

  const bad = [
    'CE QU’UNE MANGITA A COMPRIS',
    '1. AVANT, PERSONNE NE L’ATTENDAIT',
    '2. LA COACH DIT SON PRÉNOM',
    '3. ON CORRIGE SON BASSIN EN DIRECT',
    '4. ELLE NE RATE PLUS LE MARDI',
    'ESSAI 7 JOURS — ON T’ATTEND EN VISIO',
  ];
  const rescued = normalizeCarouselSlideTitles(bad, bad[0]!, 'fr').titles;
  console.log('\n=== Garde-fou : narration → liste ===');
  rescued.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t}${looksLikeNarrativeCarouselFragment(t, i) ? ' ⚠ NARRATIVE' : ''}`);
  });

  const polished = polishOverlayText("1. PERSONNE NE T'ATTEND", 'fr', 56);
  console.log('\n=== polishOverlayText("1. PERSONNE NE T\'ATTEND") ===');
  console.log(' →', polished, '| bare?', isBareNumericSlideTitle(polished));

  const copy = mangitaProgressListCarouselCopy('fr');
  const titles = normalizeCarouselSlideTitles(copy.slideTitles, copy.slideTitles[0]!, 'fr').titles;
  const words = countCaptionWords(copy.caption);
  const analysis = analyzeCaptionForPost(copy.caption, 'instagram', 'carousel', 0);

  console.log('\n=== TEXTE À VALIDER (aucune image régénérée) ===');
  titles.forEach((t, i) => console.log(`Slide ${i + 1}: ${t}`));
  console.log(`\n--- LÉGENDE (${words} mots, zone OK=${analysis.ok}) ---\n`);
  console.log(copy.caption);
  console.log('\nhook 125 car.:', JSON.stringify(copy.caption.slice(0, 125)));

  if (words < 150 || words > 300) throw new Error(`Légende hors 150–300 mots (${words})`);
  if (titles.some((t, i) => looksLikeNarrativeCarouselFragment(t, i) || isBareNumericSlideTitle(t))) {
    throw new Error('Titres encore hors format LISTE');
  }

  const board = await getSocialCommsBoard();
  const id = 'sp_mscy1nwy_wyc4c5';
  const before = board.posts.find((p) => p.id === id);
  if (!before) throw new Error('Carousel introuvable');
  const keptPaths = [...(before.carouselPaths || [])];

  const now = new Date().toISOString();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((p) =>
      p.id === id
        ? {
            ...p,
            title: withCarouselSlideCount(copy.title, 6),
            caption: copy.caption,
            cta: 'Essai gratuit 7 jours → fitmangas.com',
            overlayText: titles[0]!,
            hookTitle: titles[0]!,
            carouselSlideTitles: titles,
            carouselPaths: keptPaths,
            imagePath: keptPaths[0] || p.imagePath,
            updatedAt: now,
          }
        : p,
    ),
  });

  console.log('\nBoard : texte LISTE appliqué. Images inchangées (' + keptPaths.length + ' paths).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
