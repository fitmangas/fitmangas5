/**
 * CM v9 — applique seuils légende + dédup overlays/thèmes + légende feed sur le board.
 * Usage: npx tsx scripts/cm-v9-apply-week.ts
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

function wordCount(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

const FEED_CAPTION = `Regarder une vidéo de Pilates, ce n'est pas progresser. Tu peux la rejouer dix fois : personne ne corrige ton bassin, personne ne remarque si tu manques, et tu recommences souvent la même séance sans même t'en rendre compte.

Sur YouTube, tu es seule devant l'écran. La coach ne dit pas ton prénom. Elle ne voit pas ton épaule qui monte. Elle ne te rappelle pas mardi prochain. Tu ranges le tapis, tu culpabilises un peu, et la semaine d'après tu te retrouves au même point de départ.

Ce que tu cherches n'est pas une nouvelle vidéo à consommer. C'est qu'on te voie, qu'on te corrige, et qu'on t'attende à heure fixe. En visio, quelqu'un lève les yeux vers toi. Quelqu'un ajuste. Quelqu'un remarque si tu n'es pas là. C'est ça qui fait tenir — pas la motivation du dimanche soir, ni une énième séance gratuite rangée dans un favori.

Tu paies pour progresser, pas pour regarder. Pour une présence réelle, une correction en direct, et un rendez-vous qui ne disparaît pas dans le fil d'actualité.

Essai gratuit 7 jours → fitmangas.com`;

async function main() {
  const { getSocialCommsBoard, saveSocialCommsBoard } = await import('../src/lib/admin/social-comms');
  const {
    isPayForNotFraming,
    overlaysShareSkeleton,
    themeKeyFromPost,
    exampleListCarouselCopy,
    polishOverlayText,
    countCaptionWords,
  } = await import('../src/lib/admin/social-cm-playbook');

  const board = await getSocialCommsBoard();
  const now = new Date().toISOString();
  const changes: string[] = [];
  const duplicates: string[] = [];

  const ig = board.posts.filter((p) => p.network === 'instagram' || p.network === 'facebook');

  // --- Detect duplicates ---
  for (let i = 0; i < ig.length; i += 1) {
    for (let j = i + 1; j < ig.length; j += 1) {
      const a = ig[i]!;
      const b = ig[j]!;
      const oa = a.overlayText || a.hookTitle || '';
      const ob = b.overlayText || b.hookTitle || '';
      if (overlaysShareSkeleton(oa, ob)) {
        duplicates.push(
          `OVERLAY ~doublon: ${a.id} (${a.format}) «${oa.slice(0, 50)}» ↔ ${b.id} (${b.format}) «${ob.slice(0, 50)}»`,
        );
      }
      if (themeKeyFromPost(a) === themeKeyFromPost(b) && a.pillarId && b.pillarId && a.pillarId === b.pillarId) {
        duplicates.push(`THÈME doublon pillar: ${a.id} / ${b.id} → ${a.pillarId}`);
      }
      const ta = (a.title || '').slice(0, 60).toLowerCase();
      const tb = (b.title || '').slice(0, 60).toLowerCase();
      if (ta.length > 30 && tb.length > 30 && (ta === tb || ta.includes(tb.slice(0, 40)) || tb.includes(ta.slice(0, 40)))) {
        duplicates.push(`TITRE ~doublon: ${a.id} ↔ ${b.id}`);
      }
    }
  }

  const payPosts = ig.filter((p) =>
    isPayForNotFraming(`${p.overlayText || ''} ${p.hookTitle || ''} ${p.title || ''} ${p.caption || ''}`),
  );
  duplicates.push(
    `CALQUE «tu paies… pas pour…» présent sur ${payPosts.length} post(s): ${payPosts.map((p) => `${p.id}(${p.format})`).join(', ')}`,
  );

  console.log('=== DOUBLONS DÉTECTÉS ===');
  duplicates.forEach((d) => console.log('-', d));

  const feedWords = wordCount(FEED_CAPTION);
  if (feedWords < 150 || feedWords > 220) {
    throw new Error(`Feed caption hors 150–220 mots (${feedWords})`);
  }
  const ctaHits = (FEED_CAPTION.match(/essai\s+gratuit\s+7\s+jours/gi) || []).length;
  if (ctaHits !== 1) throw new Error(`CTA count=${ctaHits}, attendu 1`);

  const carouselExample = exampleListCarouselCopy('fr');

  const posts = board.posts.map((p) => {
    let next = { ...p };
    let touched = false;

    // FEED — légende longue + titre distinct (overlay user conservé)
    if (p.id === 'sp_mscy1nwy_r68gwo' && p.format === 'feed') {
      const overlay = polishOverlayText(
        p.overlayText || 'TU PAIES POUR PROGRESSER PAS POUR REGARDER',
        'fr',
        56,
      );
      next = {
        ...next,
        overlayText: overlay,
        hookTitle: overlay,
        useOverlay: true,
        title:
          "Regarder une vidéo de Pilates, ce n'est pas progresser. Personne ne corrige, personne ne t'attend.",
        caption: FEED_CAPTION,
        cta: 'Essai gratuit 7 jours → fitmangas.com',
        updatedAt: now,
      };
      touched = true;
      changes.push(
        `FEED ${p.id}: légende réécrite (${countCaptionWords(FEED_CAPTION)} mots), titre distinct du reel «trois abonnements», overlay conservé «${overlay}»`,
      );
    }

    // REEL histoire — cassait le calque + doublon titre feed
    if (p.id === 'sp_mscy1nwy_2wlt6k') {
      const overlay = polishOverlayText("UN TAPIS NE T'A JAMAIS RAPPELÉE À L'ORDRE", 'fr', 56);
      next = {
        ...next,
        overlayText: overlay,
        hookTitle: overlay,
        title:
          "J'ai créé FitMangas parce que j'en avais marre de voir des femmes culpabiliser seules devant leur tapis.",
        caption:
          "J'ai créé FitMangas parce que j'en avais marre de voir des femmes culpabiliser seules devant leur tapis.\n\nEssai gratuit 7 jours — ton premier cours live t'attend.",
        updatedAt: now,
      };
      touched = true;
      changes.push(
        `REEL ${p.id}: overlay «TU PAIES… PAS POUR UN TAPIS» → «${overlay}» + titre/légende sans calque`,
      );
    }

    // REEL communauté — même ossature overlay
    if (p.id === 'sp_mscy1nwy_tqhs2s') {
      const overlay = polishOverlayText('LA VIDÉO NE LÈVE PAS LES YEUX VERS TOI', 'fr', 56);
      next = {
        ...next,
        overlayText: overlay,
        hookTitle: overlay,
        title:
          'Tu te connectes au cours et tu vois les prénoms s’afficher. Elles arrivent une par une — ce n’est plus un replay.',
        caption:
          "Envoie ça à celle qui a trois applis de sport qu'elle n'ouvre jamais. Ici, on dit ton prénom et on remarque si tu manques.\n\nEssai gratuit 7 jours — rejoins le prochain cours.",
        updatedAt: now,
      };
      touched = true;
      changes.push(
        `REEL ${p.id}: overlay «TU PAIES… PAS POUR UN REPLAY» → «${overlay}» + légende sans «paie pour… pas pour»`,
      );
    }

    // CAROUSEL — slide 5 sans calque « tu paies »
    if (p.id === 'sp_mscy1nwy_wyc4c5' && p.format === 'carousel') {
      const titles = [...(p.carouselSlideTitles || [])];
      while (titles.length < 7) titles.push('');
      titles[5] = carouselExample.slideTitles[5]!;
      next = {
        ...next,
        carouselSlideTitles: titles,
        caption: carouselExample.caption,
        overlayText: titles[0] || p.overlayText,
        updatedAt: now,
      };
      touched = true;
      changes.push(
        `CAROUSEL ${p.id}: slide 5 «TU PAIES POUR ÊTRE VUE…» → «${titles[5]}» + légende point 5 réécrite`,
      );
    }

    return touched ? next : p;
  });

  // Vérif post-fix : un seul calque pay-for restant (le feed)
  const afterPay = posts.filter((p) =>
    isPayForNotFraming(`${p.overlayText || ''} ${p.hookTitle || ''} ${p.title || ''} ${(p.caption || '').slice(0, 200)}`),
  );
  // Caption feed contains "Tu paies pour progresser, pas pour regarder" once — allowed as the week's single instance
  console.log('\n=== APRÈS CORRECTION — calques restants ===');
  afterPay.forEach((p) =>
    console.log(
      `- ${p.id} (${p.format}): overlay=${(p.overlayText || '').slice(0, 60)} | caption has pattern=${isPayForNotFraming(p.caption || '')}`,
    ),
  );

  await saveSocialCommsBoard({ ...board, posts });
  console.log('\n=== CHANGEMENTS ===');
  changes.forEach((c) => console.log('-', c));
  console.log('\nFeed caption words:', countCaptionWords(FEED_CAPTION));
  console.log('Board sauvegardé.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
