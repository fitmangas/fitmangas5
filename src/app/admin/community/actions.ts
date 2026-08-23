'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/require-admin';
import {
  buildMetaOAuthUrl,
  exchangeMetaCodeForConnection,
  facebookMirrorMediaReady,
  metaAppConfigured,
  publishFacebookPost,
  publishInstagramNow,
  verifyFacebookPublishId,
} from '@/lib/admin/meta-social';
import {
  emptyAlejandraDouble,
  getAlejandraDoubleProfile,
  refreshAlejandraPhotaStatus,
  saveAlejandraDoubleProfile,
  startAlejandraPhotaTraining,
} from '@/lib/admin/alejandra-double';
import { resolvePhotaApiKey } from '@/lib/admin/phota-client';
import {
  CAPTION_BY_FORMAT,
  captionBandCharCeiling,
  captionForPublish,
  CAROUSEL_SLIDE_COUNT,
  CAROUSEL_LIST_FORMAT_RULES,
  enforceFaceCamShotList,
  polishInstagramHook,
  hookNeedsReview,
  polishPostTitle,
  SOCIAL_CM_GUIDELINES,
  TITLE_FEW_SHOT_ES,
  TITLE_FEW_SHOT_FR,
  type SocialMediaKind,
  titleFailsQualityGate,
  polishOverlayText,
  withCarouselSlideCount,
  mergeCaptionWithCta,
  normalizeCarouselSlideTitles,
  overlaysNeedReviewFromTitles,
  sanitizeTrashTalkCopy,
} from '@/lib/admin/social-cm-playbook';
import {
  buildWeeklySlots,
  plannedAtParis,
} from '@/lib/admin/social-week-planner';
import { parisScheduleToIso } from '@/lib/admin/social-paris-time';
import { markSpanishVariantsStale, whyItWorksNeedsReviewForLocale } from '@/lib/admin/social-copy-quality';
import { adaptCaptionToLinkedInViaLlm } from '@/lib/admin/social-linkedin-adapt';
import {
  collectUsedLibraryPaths,
  createSocialPostId,
  emptyMetaConnection,
  getMetaSocialConnection,
  getSocialCommsBoard,
  pickLibraryImage,
  saveMetaSocialConnection,
  saveSocialCommsBoard,
  SOCIAL_LIBRARY_IMAGES,
  type MetaSocialConnection,
  type SocialCommsBoard,
  type SocialLocale,
  type SocialNetwork,
  type SocialPost,
  type SocialPostFormat,
  type SocialPostStatus,
} from '@/lib/admin/social-comms';
import { runSocialTextCascade } from '@/lib/admin/social-text-ai';
import { loadHooksBank, recordHooks, topHooksForFewShot } from '@/lib/admin/social-hooks-bank';
import {
  loadPillarHistory,
  pickWeeklyPillar,
  recordWeekThemePlan,
  buildWeekThemePlan,
  getWeeklyPillar,
  getContentTheme,
  CONTENT_FAMILY_LABELS,
  TRIAL_CTA_FR,
  TRIAL_CTA_ES,
  type ContentFamilyId,
  type WeeklyPillar,
  type WeekPlanSnapshot,
} from '@/lib/admin/social-pillars';
import { SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';
import { createAdminClient } from '@/lib/supabase/admin';

function revalidateCommunity() {
  revalidatePath('/admin/community');
  revalidatePath('/admin');
}

/** Nettoie les légendes IA pour coller aux bandes idéales (surtout Reels). */
function sanitizeCaptionForFormat(raw: string, format: SocialPostFormat, hardMax: number): string {
  let c = raw
    .replace(/\*\*/g, '')
    .replace(/[🚀🧘💪🔥✨😊😂🙏💕❤️]/g, '')
    .replace(/^Slide\s*\d+\s*[:：]\s*/gim, '')
    .replace(/\n?\s*Slide\s*\d+\s*[:：]\s*/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const band = CAPTION_BY_FORMAT[format];
  // Reels : zone idéale en car. Feed/carousel : plafond car. dérivé des mots (algo 2026) — ne plus tronquer à 180 car.
  const targetMax =
    format === 'reel'
      ? Math.min(hardMax, band?.idealMax ?? 150)
      : format === 'feed' || format === 'carousel'
        ? Math.min(hardMax, captionBandCharCeiling(band ?? CAPTION_BY_FORMAT.feed))
        : hardMax;

  if (c.length > targetMax) {
    const sliced = c.slice(0, targetMax);
    const lastStop = Math.max(
      sliced.lastIndexOf('.'),
      sliced.lastIndexOf('!'),
      sliced.lastIndexOf('?'),
      sliced.lastIndexOf('\n'),
    );
    c = lastStop > targetMax * 0.5 ? sliced.slice(0, lastStop + 1).trim() : sliced.trim();
  }
  return c.slice(0, hardMax);
}

/** Répare les JSON IA les plus fréquents (virgules, newlines dans strings, truncation). */
function repairAiJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = s.indexOf('{');
  if (start < 0) return s;
  s = s.slice(start);

  // Newlines / tabs bruts dans des strings → \n
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i]!;
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') continue;
      if (ch === '\t') {
        out += '\\t';
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    out += ch;
  }
  s = out;

  // Virgules traînantes
  s = s.replace(/,\s*([\]}])/g, '$1');

  // Truncation : fermer posts / objet
  const openCurly = (s.match(/\{/g) || []).length;
  const closeCurly = (s.match(/\}/g) || []).length;
  const openSquare = (s.match(/\[/g) || []).length;
  const closeSquare = (s.match(/\]/g) || []).length;
  if (openSquare > closeSquare) s += ']'.repeat(openSquare - closeSquare);
  if (openCurly > closeCurly) s += '}'.repeat(openCurly - closeCurly);

  return s;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const attempts = [trimmed, repairAiJson(trimmed)];
  let lastError: Error | null = null;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const start = attempt.indexOf('{');
      const end = attempt.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(attempt.slice(start, end + 1));
        } catch (e2) {
          lastError = e2 instanceof Error ? e2 : new Error(String(e2));
        }
      }
    }
  }
  throw lastError || new Error('JSON introuvable');
}

function imageSourceFromProviderName(provider: string): SocialPost['imageSource'] {
  if (provider === 'gemini' || provider === 'phota' || provider === 'brand') return 'ai';
  if (provider === 'library') return 'library';
  if (provider === 'unsplash') return 'unsplash';
  return 'none';
}

type SlotSpec = {
  slotId: number;
  network: SocialNetwork;
  format: SocialPostFormat;
  mediaKind: string;
  feedIntent: string | null;
  dayOffset: number;
  parisHour: number;
  captionMin: number;
  captionMax: number;
  captionIdeal: string;
  hashtagIdeal: number;
  needsReelBrief: boolean;
  needsPhoto: boolean;
  assignPillar: string | null;
  contentFamily: ContentFamilyId | null;
  themeLabel: string | null;
  forceTrialCta: boolean;
  showProductOrCoach: boolean;
  shareHook: boolean;
  reelAngle: string | null;
};

async function generatePostsJsonForSlots(
  context: Awaited<ReturnType<typeof loadGenerationContext>>,
  slotSpec: SlotSpec[],
  locale: SocialLocale,
): Promise<{ ok: true; posts: unknown[] } | { ok: false; error: string }> {
  const articles = context.articlesByLocale[locale];
  const compactContext = {
    locale,
    articles: articles.slice(0, 5).map((a) => ({
      title: a.title,
      slug: a.slug,
      description: (a.description || '').slice(0, 140),
      url: a.url,
    })),
    courses: context.courses.filter((c) => !c.language || c.language === locale).slice(0, 3),
    pillars: context.pillars.slice(0, 4),
  };
  const pillarsLite = slotSpec.map((s) => ({
    slotId: s.slotId,
    family: s.contentFamily,
    theme: s.assignPillar,
    label: s.themeLabel,
    forceTrialCta: s.forceTrialCta,
    shareHook: s.shareHook,
  }));
  const langName = locale === 'es' ? 'español' : 'français';
  const fewShot = (locale === 'es' ? TITLE_FEW_SHOT_ES : TITLE_FEW_SHOT_FR).join('\n- ');
  const hooksBank = await loadHooksBank();
  const topHooks = topHooksForFewShot(hooksBank, locale, 10)
    .map((h) => h.text)
    .filter(Boolean);
  const hooksBlock = topHooks.length
    ? `Hooks gagnants (réutiliser le CALIBRE, pas recopier) :\n- ${topHooks.join('\n- ')}`
    : '';

  const prompt = `FitMangas CM. Contenu 100% en ${langName}. JSON strict uniquement, sans markdown.

CIBLE PRODUIT (ne jamais l'oublier) :
La cliente ne paie PAS pour du Pilates gratuit (YouTube). Elle paie pour NE PAS ÊTRE SEULE :
rendez-vous fixe + correction en direct + le fait d'être vue. Toute copie s'appuie sur cet axe,
pas seulement sur le soulagement de symptôme.

Contexte:
${JSON.stringify(compactContext)}
Mix familles/thèmes des slots : ${JSON.stringify(pillarsLite)}
Slots (${slotSpec.length}): ${JSON.stringify(slotSpec)}
${hooksBlock}

Règles STRICTES (langue = ${locale}):
- Exactement ${slotSpec.length} objets, slotId = ${slotSpec.map((s) => s.slotId).join(',')}
- TOUT le texte (title, caption, hookTitle, reelScript, shotList, cta, whyItWorks) en ${langName} — JAMAIS anglais
- Accords ${locale === 'es' ? 'femeninos' : 'féminins'}
- CHAQUE slot a sa famille (portée / confiance / conversion) + thème — respecte assignPillar / contentFamily
- PORTÉE = découverte (symptôme OK mais relié au « ne plus être seule »)
- CONFIANCE = montrer le produit ou la coach (cours visio, correction, communauté) — PAS un exo générique
- CONVERSION = une objection ; CTA EXPLICITE « essai gratuit 7 jours » (JAMAIS « abonne-toi »)
- Au moins le slot marqué shareHook=true doit inclure une accroche type « envoie ça à… » / « envía esto a… »
- Légendes conçues pour être ENVOYÉES À UNE COPINE (partages DM)
- TITRES = RECONNAISSANCE CONCRÈTE D'ABORD (scène vécue féminine) puis reformulation claire. Jamais ouvrir par « X n'est pas Y » sans scène.
- Few-shot calibre :
- ${fewShot}
- INTERDIT : hurle, sauvage, guerrière, plume, fantôme, inébranlable, rayonne, doux, suave, « un geste qui », « libère ta », « éveille ta », « sculpte ta », « déverrouille », « active ton noyau », « force invisible », « prestance »
- INTERDIT : commencer par un nom d'exercice
- INTERDIT : 5 titres avec la même charpente syntaxique
- overlayText / hookTitle: TOUJOURS une phrase autonome COURTE COMPLÈTE EN MAJUSCULES (max ~8–10 mots), lisible en 1s. JAMAIS recopier/tronquer le titre long. INTERDIT de finir sur une préposition/pronom (en, du, tu, te, si, pas du…). Si trop long → reformuler plus court, ne pas couper.
- TRASH-TALK : tape sur le MENSONGE de l'industrie / l'excuse / la situation absurde — JAMAIS sur le corps, l'âge, le poids ou un défaut de la femme (interdit: vieille, trop vieille, grosse, molle, paresseuse, nulle). Elle doit se sentir comprise, pas jugée.
- REEL caption: 70–150 caractères STRICT. 0 ou 1 emoji max. CTA = dernière ligne de la caption.
- reelScript = UNE string avec \\n. Format IDÉES + BRIEF parlable face cam
- shotList: UNIQUEMENT face cam téléphone. INTERDIT plans d'exercice filmés
- FEED caption: 150–220 MOTS (~800–1200 car.). Mini-histoire / valeur. Hook dans les 125 PREMIERS caractères. CTA « essai gratuit 7 jours » UNE seule fois, dernière ligne. overlayText = texte sur image (court, complet).
- CAROUSEL — RÈGLE VERROUILLÉE (ne jamais dériver) :
${CAROUSEL_LIST_FORMAT_RULES}
  slideTitles = array de EXACTEMENT 6 strings.
  INTERDIT titre = numéro nu. INTERDIT narration (« CE QU'UNE MANGITA A COMPRIS », « LA COACH DIT SON PRÉNOM »).
  Orthographe soignée FR/ES (ERREURS pas ERROURS).
  Si progrès adhérente : anonymiser (« une Mangita »), JAMAIS prénom + visage IA — mais les TITRES restent une LISTE autonome (pas un récit à son sujet).
- FRANÇAIS NATUREL : le calque « Tu paies pour X, pas pour Y » = MAX 1 post dans tout le batch. Autres posts : formulations variées (« Un tapis ne t'a jamais rappelée à l'ordre. », « La vidéo ne lève pas les yeux vers toi. », « Ce que tu paies, ce n'est pas le cours : c'est qu'on t'attende. »).
- ANTI-RÉPÉTITION SEMAINE : thèmes/piliers DISTINCTS entre posts. Overlays à structures DIFFÉRENTES (interdit deux overlays « TU PAIES… PAS POUR… »).
- WhatsApp: teaser article communauté (pas d'acquisition), sourceType=blog, sourceRef=slug, lien url, 160–300 car.
- LinkedIn: ton pro, 350–700 car., question finale
- hashtags = array sans #
- imageHint EN ANGLAIS (scène photo PARTIELLE : mains/profil/détail — jamais corps entier). Si showProductOrCoach: coaching visio / coach portrait library vibe. Si progres_adherente: pas de visage IA « fausse cliente ».

JSON exact:
{"posts":[{"slotId":0,"title":"","caption":"","hashtags":[],"cta":"","imageHint":"","overlayText":"","useOverlay":false,"hookTitle":"","reelScript":"","shotList":"","slideTitles":["","","","","",""],"sourceType":"ai","sourceRef":null,"whyItWorks":""}]}`;

  const runOnce = async (strict: boolean) => {
    const aiResult = await runSocialTextCascade({
      system: strict
        ? `JSON valide uniquement. Langue ${langName}. Titres bankables (ancre+plat+retournement). Reels: caption courte, shotList face cam only.`
        : `Community manager FitMangas wellness premium en ${langName}. JSON valide. Face cam only. Titres sans mélodrame.`,
      user: strict
        ? `${prompt}\n\nIMPORTANT: JSON parseable. \\n dans les strings. shotList = face cam only. Langue ${langName}.`
        : prompt,
      temperature: strict ? 0.35 : 0.55,
      maxOutputTokens: 8192,
    });
    if (!aiResult.ok) return { ok: false as const, error: aiResult.detail || 'Génération texte impossible.' };
    try {
      const parsed = extractJsonObject(aiResult.text) as { posts?: unknown[] };
      const posts = Array.isArray(parsed.posts) ? parsed.posts : [];
      if (!posts.length) return { ok: false as const, error: 'Réponse IA sans posts.' };
      return { ok: true as const, posts };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'JSON IA invalide.',
      };
    }
  };

  const first = await runOnce(false);
  if (first.ok) return first;
  const second = await runOnce(true);
  if (second.ok) return second;
  return { ok: false, error: second.error || first.error };
}

async function loadGenerationContext() {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const [{ data: articles }, { data: courses }] = await Promise.all([
    admin
      .from('blog_articles')
      .select('title_fr, title_es, slug_fr, slug_es, description_fr, description_es, seo_keywords')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10),
    admin
      .from('courses')
      .select('title, starts_at, course_language')
      .eq('is_published', true)
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(8),
  ]);

  const mapArticle = (
    row: {
      title_fr: string | null;
      title_es: string | null;
      slug_fr: string | null;
      slug_es: string | null;
      description_fr: string | null;
      description_es: string | null;
      seo_keywords: string | null;
    },
    locale: SocialLocale,
  ) => {
    const title = locale === 'es' ? row.title_es || row.title_fr : row.title_fr || row.title_es;
    const slug = locale === 'es' ? row.slug_es || row.slug_fr : row.slug_fr || row.slug_es;
    const description =
      locale === 'es' ? row.description_es || row.description_fr : row.description_fr || row.description_es;
    if (!title || !slug) return null;
    return {
      title,
      slug,
      description: description || '',
      keywords: row.seo_keywords,
      url: `https://fitmangas.com/blog/${slug}`,
    };
  };

  const articlesFr = (articles ?? [])
    .map((row) => mapArticle(row, 'fr'))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const articlesEs = (articles ?? [])
    .map((row) => mapArticle(row, 'es'))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return {
    articlesByLocale: {
      fr: articlesFr,
      es: articlesEs.length ? articlesEs : articlesFr,
    },
    courses: (courses ?? []).map((row) => ({
      title: row.title,
      startsAt: row.starts_at,
      language: (row.course_language === 'es' ? 'es' : 'fr') as SocialLocale,
    })),
    pillars: SEO_PILLAR_PAGES.map((page) => ({
      title: page.shortTitle,
      url: `https://fitmangas.com/${page.slug}`,
      description: page.description,
    })),
    images: SOCIAL_LIBRARY_IMAGES,
  };
}

export async function updateSocialPostStatusAction(postId: string, status: SocialPostStatus) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId ? { ...post, status, updatedAt: new Date().toISOString() } : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function markAllSocialPostsReadyAction() {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const now = new Date().toISOString();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.status === 'idea' || post.status === 'ready'
        ? { ...post, status: 'ready' as const, updatedAt: now }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

/** Peaufine les posts existants (titres, hooks, captions, shotList face cam) sans régénérer l’IA. */
export async function polishExistingSocialPostsAction() {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const now = new Date().toISOString();
  let polished = 0;

  const posts = board.posts.map((post) => {
    if (post.status === 'published' || post.status === 'skipped') return post;

    let next = { ...post };
    let changed = false;

    if (post.format === 'reel') {
      const locale = post.locale ?? 'fr';
      const hookTitle = polishInstagramHook(post.hookTitle, post.title, locale);
      const title = polishPostTitle(post.title, hookTitle, 'reel', locale);
      const shotList = enforceFaceCamShotList(post.shotList, locale);
      const caption = sanitizeCaptionForFormat(post.caption, 'reel', 150);
      if (
        hookTitle !== post.hookTitle ||
        title !== post.title ||
        shotList !== post.shotList ||
        caption !== post.caption
      ) {
        changed = true;
        next = { ...next, hookTitle, title, shotList, caption, updatedAt: now };
      }
    } else if (post.format === 'feed' || post.format === 'carousel' || post.format === 'text') {
      const locale = post.locale ?? 'fr';
      const titleBase = polishPostTitle(post.title, post.hookTitle || post.title, post.format, locale);
      const title =
        post.format === 'carousel' && post.carouselPaths?.length
          ? withCarouselSlideCount(titleBase, post.carouselPaths.length)
          : titleBase;
      const captionMax =
        post.format === 'feed'
          ? captionBandCharCeiling(CAPTION_BY_FORMAT.feed)
          : post.format === 'text'
            ? 420
            : captionBandCharCeiling(CAPTION_BY_FORMAT.carousel);
      const caption = sanitizeCaptionForFormat(
        post.caption,
        post.format === 'text' ? 'text' : post.format,
        captionMax,
      );
      if (title !== post.title || caption !== post.caption) {
        changed = true;
        next = { ...next, title, caption, updatedAt: now };
      }
    }

    if (changed) polished += 1;
    return next;
  });

  if (polished === 0) {
    return { ok: true as const, polished: 0, message: 'Rien à peaufiner — les posts sont déjà propres.' };
  }

  await saveSocialCommsBoard({ ...board, posts });
  revalidateCommunity();
  return {
    ok: true as const,
    polished,
    message: `${polished} post(s) peaufiné(s) : titres, légendes, plans face cam.`,
  };
}

export async function updateSocialPostCaptionAction(postId: string, caption: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const target = board.posts.find((p) => p.id === postId);
  const now = new Date().toISOString();
  let posts = board.posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          caption: caption.trim(),
          updatedAt: now,
          status: post.status === 'idea' ? ('ready' as const) : post.status,
        }
      : post,
  );
  if (target?.locale === 'fr') {
    posts = markSpanishVariantsStale(posts, postId, now);
  }
  await saveSocialCommsBoard({ ...board, posts });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostScheduleAction(postId: string, plannedAt: string | null) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            plannedAt,
            updatedAt: new Date().toISOString(),
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostParisScheduleAction(postId: string, date: string, hour: number) {
  await requireAdmin();
  const plannedAt = parisScheduleToIso(date, hour);
  return updateSocialPostScheduleAction(postId, plannedAt);
}

export async function updateSocialPostImageAction(postId: string, imagePath: string | null) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const isAllowed =
    imagePath === null ||
    (SOCIAL_LIBRARY_IMAGES as readonly string[]).includes(imagePath) ||
    imagePath.startsWith('http') ||
    imagePath.startsWith('/library/social/');
  const safe = isAllowed ? imagePath : pickLibraryImage();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            imagePath: safe,
            imageSource: safe && safe.startsWith('http') ? ('ai' as const) : post.imageSource,
            updatedAt: new Date().toISOString(),
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostImageFeedbackAction(postId: string, feedback: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? { ...post, imageFeedback: feedback.trim().slice(0, 500), updatedAt: new Date().toISOString() }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function generateSocialImageAction(postId: string, feedbackOverride?: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };

  const feedback = (feedbackOverride ?? post.imageFeedback).trim();
  const double = await getAlejandraDoubleProfile();
  const { generateSocialAiImage } = await import('@/lib/admin/social-ai-image');
  const result = await generateSocialAiImage(post, feedback, post.id.length);
  if (!result.ok) return result;

  const source = imageSourceFromProviderName(result.provider);

  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            imagePath: result.imagePath,
            imageSource: source,
            aiImagePrompt: result.prompt,
            imageFeedback: '',
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  });
  revalidateCommunity();
  const engineLabel =
    result.provider === 'phota'
      ? 'PHOTA entraîné'
      : result.provider === 'gemini'
        ? 'Gemini + refs'
        : result.provider;
  const doubleNote =
    double.enabled && (result.provider === 'gemini' || result.provider === 'phota')
      ? ` · Double (${engineLabel})`
      : '';
  return {
    ok: true as const,
    message: `Visuel Nano Banana 2 (${engineLabel})${doubleNote}.`,
  };
}

/** Applique une correction image-to-image sur l’image existante. */
export async function refineSocialImageAction(postId: string, feedbackOverride?: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  const feedback = (feedbackOverride ?? post.imageFeedback).trim();
  const { refineSocialAiImage } = await import('@/lib/admin/social-ai-image');
  const result = await refineSocialAiImage(post, feedback);
  if (!result.ok) return result;
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            imagePath: result.imagePath,
            imageSource: 'ai',
            aiImagePrompt: result.prompt,
            imageFeedback: '',
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  });
  revalidateCommunity();
  return { ok: true as const, message: 'Correction visuelle appliquée (image-to-image).' };
}

export async function updateSocialPostTitleAction(postId: string, title: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const target = board.posts.find((p) => p.id === postId);
  const now = new Date().toISOString();
  let posts = board.posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          title: title.trim().slice(0, 180),
          titleNeedsReview: false,
          updatedAt: now,
        }
      : post,
  );
  if (target?.locale === 'fr') {
    posts = markSpanishVariantsStale(posts, postId, now);
  }
  await saveSocialCommsBoard({ ...board, posts });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostCtaAction(postId: string, cta: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const target = board.posts.find((p) => p.id === postId);
  const now = new Date().toISOString();
  let posts = board.posts.map((post) =>
    post.id === postId
      ? { ...post, cta: cta.trim().slice(0, 180), updatedAt: now }
      : post,
  );
  if (target?.locale === 'fr') {
    posts = markSpanishVariantsStale(posts, postId, now);
  }
  await saveSocialCommsBoard({ ...board, posts });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostThemeAction(
  postId: string,
  themeId: string,
  family?: ContentFamilyId | null,
) {
  await requireAdmin();
  const theme = getContentTheme(themeId);
  if (!theme) return { ok: false as const, error: 'Thème introuvable.' };
  const resolvedFamily = family || theme.family;
  const board = await getSocialCommsBoard();
  const post = board.posts.find((p) => p.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            pillarId: theme.id,
            contentFamily: resolvedFamily,
            cta:
              theme.forceTrialCta && !p.cta
                ? p.locale === 'es'
                  ? TRIAL_CTA_ES
                  : TRIAL_CTA_FR
                : p.cta,
            updatedAt: new Date().toISOString(),
          }
        : p,
    ),
  });
  revalidateCommunity();
  return {
    ok: true as const,
    message: `Thème : ${CONTENT_FAMILY_LABELS[resolvedFamily]} · ${theme.label}`,
  };
}

/** Régénère UN post (texte + image) en gardant slot / langue / date / pilier. */
export async function regenerateOneSocialPostAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((p) => p.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };

  // Run isolé : ne touche pas les autres posts de la semaine
  const runId = `solo_${Date.now().toString(36)}`;
  const resetBoard = {
    ...board,
    posts: board.posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            generationRunId: runId,
            generationStatus: 'pending' as const,
            generationError: null,
            generationSlot: p.generationSlot ?? 0,
            generationMediaKind:
              p.generationMediaKind ||
              (p.format === 'reel' ? 'video_brief' : p.format === 'carousel' ? 'carousel' : 'photo'),
            generationDayOffset: p.generationDayOffset ?? 0,
            generationSlotIndex: p.generationSlotIndex ?? 0,
            updatedAt: new Date().toISOString(),
          }
        : p,
    ),
  };
  await saveSocialCommsBoard(resetBoard);
  const next = await generateNextPostAction(runId, 'pending');
  revalidateCommunity();
  if (!next.ok) return { ok: false as const, error: 'Régénération échouée.' };
  if ('failedMessage' in next && typeof next.failedMessage === 'string' && next.failedMessage) {
    return { ok: false as const, error: next.failedMessage };
  }
  const after = await getSocialCommsBoard();
  const updated = after.posts.find((p) => p.id === postId);
  if (updated?.generationStatus === 'failed') {
    return { ok: false as const, error: updated.generationError || 'Régénération échouée.' };
  }
  if (post.locale === 'fr') {
    const boardAfter = await getSocialCommsBoard();
    const now = new Date().toISOString();
    await saveSocialCommsBoard({
      ...boardAfter,
      posts: markSpanishVariantsStale(boardAfter.posts, postId, now),
    });
    revalidateCommunity();
    return {
      ok: true as const,
      message: 'Post FR régénéré. Variante(s) ES marquées périmées — relancer « Générer ES ».',
    };
  }
  return { ok: true as const, message: 'Post régénéré.' };
}

/** Crée la variante ES d’un post FR en réutilisant l’image. */
export async function generateSpanishVariantAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const source = board.posts.find((p) => p.id === postId);
  if (!source) return { ok: false as const, error: 'Post introuvable.' };
  if (source.locale !== 'fr') return { ok: false as const, error: 'Disponible uniquement depuis un post FR.' };
  const already = board.posts.find(
    (p) => p.locale === 'es' && p.adaptedFromId === source.id && p.network === source.network && p.format === source.format,
  );
  if (already && !already.esStale) {
    return { ok: true as const, message: 'Variante ES déjà présente.' };
  }
  // Si ES stale : on remplace l’ancienne variante
  const boardWithoutStaleEs = already
    ? { ...board, posts: board.posts.filter((p) => p.id !== already.id) }
    : board;

  const context = await loadGenerationContext();
  const pillarHistory = await loadPillarHistory();
  const weekPillar = getWeeklyPillar(source.pillarId) || pickWeeklyPillar(pillarHistory, Date.now());
  const mediaKind =
    (source.generationMediaKind as import('@/lib/admin/social-cm-playbook').SocialMediaKind | null) ||
    (source.format === 'reel' ? 'video_brief' : source.format === 'carousel' ? 'carousel' : 'photo');
  const slot = {
    network: source.network,
    format: source.format,
    mediaKind,
    dayOffset: source.generationDayOffset ?? 0,
    slotIndex: source.generationSlotIndex ?? 0,
    feedIntent: undefined,
  } as const;
  const slotSpec = buildSlotSpecForWeek(
    [slot],
    weekPlanFromTheme(weekPillar, source.contentFamily),
  )[0]!;
  const batch = await generatePostsJsonForSlots(context, [{ ...slotSpec, slotId: 0 }], 'es');
  if (!batch.ok) return { ok: false as const, error: batch.error };
  const row = (batch.posts.find((p) => Boolean(p && typeof p === 'object')) as Record<string, unknown> | undefined) ?? {};
  const articleSlugFallback = context.articlesByLocale.es?.[0]?.slug ?? null;
  const normalized = normalizeGeneratedRowForPost({
    row,
    slot: slot as unknown as ReturnType<typeof buildWeeklySlots>[number],
    slotSpec,
    locale: 'es',
    articleSlugFallback,
  });
  const now = new Date().toISOString();
  const esPost: SocialPost = {
    ...source,
    id: createSocialPostId(),
    locale: 'es',
    ...normalized,
    plannedAt: source.plannedAt,
    pillarId: source.pillarId,
    imagePath: source.imagePath,
    carouselPaths: [...(source.carouselPaths ?? [])],
    imageSource: source.imageSource,
    aiImagePrompt: source.aiImagePrompt,
    imageFeedback: '',
    adaptedFromId: source.id,
    generationStatus: 'done',
    generationError: null,
    generationRunId: source.generationRunId || null,
    createdAt: now,
    updatedAt: now,
    metaExternalId: null,
    facebookExternalId: null,
    status: 'idea',
  };
  const esPostFresh: SocialPost = { ...esPost, esStale: false };
  await saveSocialCommsBoard({
    ...boardWithoutStaleEs,
    posts: [esPostFresh, ...boardWithoutStaleEs.posts].slice(0, 160),
  });
  revalidateCommunity();
  return {
    ok: true as const,
    message: already ? 'Variante ES régénérée (FR mis à jour).' : 'Variante ES créée (même image).',
  };
}

export async function saveAlejandraDoubleAction(input: {
  enabled: boolean;
  referencePaths: string[];
}) {
  await requireAdmin();
  const paths = Array.isArray(input.referencePaths) ? input.referencePaths.map(String) : [];
  if (paths.length < 2) {
    return { ok: false as const, error: 'Sélectionne au moins 2 portraits (idéal : 10–50 pour PHOTA).' };
  }
  const current = await getAlejandraDoubleProfile();
  await saveAlejandraDoubleProfile({
    ...current,
    enabled: Boolean(input.enabled),
    referencePaths: paths,
    updatedAt: new Date().toISOString(),
  });
  revalidateCommunity();
  return {
    ok: true as const,
    message: input.enabled
      ? `Pack Double enregistré (${paths.length} photos). Lance l’entraînement PHOTA pour la meilleure fidélité.`
      : 'Double désactivé.',
  };
}

export async function resetAlejandraDoubleAction() {
  await requireAdmin();
  const defaults = emptyAlejandraDouble();
  await saveAlejandraDoubleProfile(defaults);
  revalidateCommunity();
  return {
    ok: true as const,
    message: `Double réinitialisé (${defaults.referencePaths.length} photos biblio). Relance l’entraînement PHOTA.`,
  };
}

export async function trainAlejandraPhotaAction(tier: 'standard' | 'fast' = 'standard') {
  await requireAdmin();
  if (!resolvePhotaApiKey()) {
    return {
      ok: false as const,
      error:
        'PHOTALABS_API_KEY manquante. Crée une clé sur le portal PhotoLabs (API PHOTA) — pas besoin de Dupliq.',
    };
  }
  const profile = await getAlejandraDoubleProfile();
  const result = await startAlejandraPhotaTraining(profile, tier);
  revalidateCommunity();
  if (!result.ok) return result;
  return { ok: true as const, message: result.message };
}

export async function refreshAlejandraPhotaStatusAction() {
  await requireAdmin();
  const profile = await getAlejandraDoubleProfile();
  const result = await refreshAlejandraPhotaStatus(profile);
  revalidateCommunity();
  if (!result.ok) return result;
  return { ok: true as const, message: result.message };
}

export async function updateSocialPostReelBriefAction(
  postId: string,
  input: { hookTitle?: string; reelScript?: string; shotList?: string },
) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            hookTitle:
              input.hookTitle !== undefined
                ? polishInstagramHook(input.hookTitle, post.title, post.locale ?? 'fr')
                : post.hookTitle,
            reelScript: input.reelScript !== undefined ? input.reelScript.trim().slice(0, 4000) : post.reelScript,
            shotList:
              input.shotList !== undefined
                ? enforceFaceCamShotList(input.shotList.trim(), post.locale ?? 'fr').slice(0, 800)
                : post.shotList,
            updatedAt: new Date().toISOString(),
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function updateSocialPostFacebookMirrorAction(postId: string, alsoPublishFacebook: boolean) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (post.network !== 'instagram') {
    return { ok: false as const, error: 'Le miroir Facebook ne s’applique qu’aux posts Instagram.' };
  }
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? { ...item, alsoPublishFacebook, updatedAt: new Date().toISOString() }
        : item,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

/** Crée ou retire une adaptation LinkedIn à partir d’un post (souvent Instagram). */
export async function toggleLinkedInAdaptationAction(postId: string, enabled: boolean) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const source = board.posts.find((item) => item.id === postId);
  if (!source) return { ok: false as const, error: 'Post introuvable.' };
  if (source.network === 'linkedin') {
    return { ok: false as const, error: 'Ce post est déjà LinkedIn.' };
  }

  const existing = board.posts.find((item) => item.network === 'linkedin' && item.adaptedFromId === postId);
  const now = new Date().toISOString();

  if (!enabled) {
    if (!existing) return { ok: true as const, message: 'Aucune adaptation LinkedIn.' };
    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.filter((item) => item.id !== existing.id),
    });
    revalidateCommunity();
    return { ok: true as const, message: 'Adaptation LinkedIn retirée.' };
  }

  if (existing) {
    return { ok: true as const, message: 'Adaptation LinkedIn déjà présente.' };
  }

  const adapted = await adaptCaptionToLinkedInViaLlm({
    title: source.title,
    caption: source.caption,
    cta: source.cta,
    hookTitle: source.hookTitle,
    locale: source.locale ?? 'fr',
  });
  const linkedInPost: SocialPost = {
    id: createSocialPostId(),
    network: 'linkedin',
    format: 'feed',
    locale: source.locale ?? 'fr',
    title: adapted.title,
    caption: adapted.caption,
    hashtags: adapted.hashtags,
    cta: adapted.cta,
    imageHint: source.imageHint,
    imagePath: source.imagePath,
    imageSource: source.imageSource,
    aiImagePrompt: source.aiImagePrompt,
    imageFeedback: '',
    overlayText: source.overlayText,
    useOverlay: false,
    hookTitle: '',
    reelScript: '',
    shotList: '',
    rawVideoPath: null,
    editedVideoPath: null,
    videoStatus: null,
    carouselPaths: source.carouselPaths ?? [],
    plannedAt: source.plannedAt,
    status: 'idea',
    sourceType: source.sourceType,
    sourceRef: source.sourceRef,
    whyItWorks: adapted.needsManual
      ? `Adaptation LinkedIn à finaliser manuellement (${adapted.error || 'IA indisponible'})`
      : `Adapté via IA depuis ${source.network} · ${source.title}`,
    whyItWorksNeedsReview: adapted.needsManual,
    metaExternalId: null,
    alsoPublishFacebook: false,
    adaptedFromId: source.id,
    facebookExternalId: null,
    createdAt: now,
    updatedAt: now,
  };

  await saveSocialCommsBoard({
    ...board,
    posts: [linkedInPost, ...board.posts].slice(0, 80),
  });
  revalidateCommunity();
  return {
    ok: true as const,
    message: adapted.needsManual
      ? `Post LinkedIn créé en brouillon — ${adapted.error || 'légende à rédiger manuellement'}.`
      : 'Post LinkedIn créé via cascade texte. Vérifie la légende puis copie/publie.',
  };
}

export async function deleteSocialPostAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.filter((post) => post.id !== postId && post.adaptedFromId !== postId),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function attachSocialRawVideoAction(postId: string, rawVideoPath: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((p) => p.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (post.format !== 'reel') return { ok: false as const, error: 'Upload vidéo réservé aux Reels.' };

  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            rawVideoPath,
            videoStatus: 'raw_uploaded',
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  });
  revalidateCommunity();
  return { ok: true as const, message: 'Vidéo brute enregistrée (référence). Monte-la sur ton Mac avec Claude + HyperFrames local.' };
}

/** MP4 déjà monté sur le Mac (Claude + HyperFrames local) → prêt à publier. */
export async function attachSocialEditedVideoAction(postId: string, editedVideoPath: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((p) => p.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (post.format !== 'reel') return { ok: false as const, error: 'Upload montage réservé aux Reels.' };

  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((item) =>
      item.id === postId
        ? {
            ...item,
            editedVideoPath,
            videoStatus: 'edited',
            status: item.status === 'idea' ? 'ready' : item.status,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  });
  revalidateCommunity();
  return { ok: true as const, message: 'MP4 monté importé. Prêt à publier / programmer.', editedVideoPath };
}

/** @deprecated Option API cloud retirée — montage = Claude Mac + HyperFrames local. */
export async function renderSocialReelMontageAction(_postId: string) {
  await requireAdmin();
  return {
    ok: false as const,
    error:
      'Le montage cloud dans FitMangas est désactivé. Monte sur ton Mac (Claude + HyperFrames local gratuit), puis importe le MP4 ici.',
  };
}

export async function updateSocialPostOverlayAction(postId: string, overlayText: string, useOverlay: boolean) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            overlayText: polishOverlayText(overlayText, post.locale, 56) || post.overlayText || '',
            useOverlay,
            updatedAt: new Date().toISOString(),
          }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function markSocialPostManualSentAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  await saveSocialCommsBoard({
    ...board,
    posts: board.posts.map((post) =>
      post.id === postId
        ? { ...post, manualSentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : post,
    ),
  });
  revalidateCommunity();
  return { ok: true as const };
}

export async function saveMetaConnectionManualAction(input: {
  pageId: string;
  pageName?: string;
  igUserId?: string;
  igUsername?: string;
  accessToken: string;
}) {
  await requireAdmin();
  const connection: MetaSocialConnection = {
    connected: true,
    pageId: input.pageId.trim(),
    pageName: input.pageName?.trim() || null,
    igUserId: input.igUserId?.trim() || null,
    igUsername: input.igUsername?.trim() || null,
    accessToken: input.accessToken.trim(),
    tokenExpiresAt: null,
    updatedAt: new Date().toISOString(),
  };
  if (!connection.pageId || !connection.accessToken) {
    return { ok: false as const, error: 'Page ID et token sont obligatoires.' };
  }
  if (connection.igUserId && connection.pageId === connection.igUserId) {
    return {
      ok: false as const,
      error:
        'Page ID et IG User ID sont identiques — anormal. Ce sont deux numéros différents (Page Facebook ≠ compte Instagram Business). Récupère-les via Graph API Explorer → /me/accounts → instagram_business_account.',
    };
  }
  await saveMetaSocialConnection(connection);
  revalidateCommunity();
  return { ok: true as const };
}

export async function disconnectMetaAction() {
  await requireAdmin();
  await saveMetaSocialConnection(emptyMetaConnection());
  revalidateCommunity();
  return { ok: true as const };
}

export async function getMetaConnectUrlAction() {
  await requireAdmin();
  if (!metaAppConfigured()) {
    return { ok: false as const, error: 'Ajoute META_APP_ID et META_APP_SECRET dans Vercel/.env.' };
  }
  const state = `fm_${Date.now().toString(36)}`;
  return { ok: true as const, url: buildMetaOAuthUrl(state) };
}

export async function completeMetaOAuthAction(code: string) {
  await requireAdmin();
  try {
    const connection = await exchangeMetaCodeForConnection(code);
    await saveMetaSocialConnection(connection);
    revalidateCommunity();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Connexion Meta échouée.' };
  }
}

export async function publishSocialPostNowAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };

  if (post.titleNeedsReview) {
    return { ok: false as const, error: 'Titre à revoir : corrige le titre avant publication Meta.' };
  }
  if (post.overlaysNeedReview) {
    return { ok: false as const, error: 'Overlays à revoir : corrige les textes carousel avant publication.' };
  }
  if (post.carouselMissingSlides) {
    return { ok: false as const, error: 'Slide manquante : carousel incomplet, publication bloquée.' };
  }
  if (post.whyItWorksNeedsReview) {
    return { ok: false as const, error: 'whyItWorks hors langue : à corriger avant publication.' };
  }
  if (post.esStale) {
    return { ok: false as const, error: 'Variante ES périmée : re-traduis depuis le FR avant publication.' };
  }
  if (
    post.format !== 'reel' &&
    post.format !== 'text' &&
    post.network !== 'whatsapp' &&
    (!post.imagePath || post.imageSource === 'none') &&
    !(post.carouselPaths ?? []).some(Boolean)
  ) {
    return { ok: false as const, error: 'Image manquante : impossible de publier sans visuel.' };
  }

  if (post.network === 'whatsapp') {
    return {
      ok: false as const,
      error: 'WhatsApp communauté : copie le message et envoie-le manuellement (API communauté limitée).',
    };
  }
  if (post.network === 'linkedin') {
    return {
      ok: false as const,
      error: 'LinkedIn : copie la légende (et le visuel) puis publie manuellement sur LinkedIn.',
    };
  }
  if (post.network === 'tiktok') {
    return { ok: false as const, error: 'TikTok arrive plus tard.' };
  }

  const connection = await getMetaSocialConnection();
  if (!connection.connected || !connection.accessToken) {
    return { ok: false as const, error: 'Connecte d’abord Meta (Instagram/Facebook).' };
  }

  try {
    let externalId: string;
    let facebookExternalId: string | null = post.facebookExternalId;

    if (post.network === 'instagram') {
      externalId = await publishInstagramNow(connection, post);
      if (post.alsoPublishFacebook) {
        try {
          facebookExternalId = await publishFacebookPost(connection, post, { schedule: false });
        } catch (fbError) {
          console.error('[publishSocialPostNowAction] FB mirror', post.id, fbError);
          await saveSocialCommsBoard({
            ...board,
            posts: board.posts.map((item) =>
              item.id === postId
                ? {
                    ...item,
                    status: 'published',
                    metaExternalId: externalId,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          });
          revalidateCommunity();
          return {
            ok: true as const,
            externalId,
            message: `Publié sur Instagram. Miroir Facebook échoué : ${fbError instanceof Error ? fbError.message : 'erreur'}.`,
          };
        }
      }
    } else {
      externalId = await publishFacebookPost(connection, post, { schedule: false });
    }

    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId
          ? {
              ...item,
              status: 'published',
              metaExternalId: externalId,
              facebookExternalId,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    });
    revalidateCommunity();
    const fbOk = Boolean(facebookExternalId);
    return {
      ok: true as const,
      externalId,
      facebookExternalId,
      message:
        post.network === 'instagram' && post.alsoPublishFacebook
          ? fbOk
            ? 'Publié sur Instagram + Facebook.'
            : 'Publié sur Instagram. Miroir Facebook non confirmé — utilise « Publier miroir FB ».'
          : 'Publié sur Meta.',
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Publication échouée.' };
  }
}

export async function scheduleSocialPostAction(postId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (post.titleNeedsReview) {
    return { ok: false as const, error: 'Titre à revoir : corrige le titre avant programmation Meta.' };
  }
  if (post.overlaysNeedReview || post.carouselMissingSlides) {
    return { ok: false as const, error: 'Carousel incomplet / overlays à revoir — programmation bloquée.' };
  }
  if (!post.plannedAt) return { ok: false as const, error: 'Choisis d’abord une date/heure.' };

  if (post.network === 'facebook') {
    const connection = await getMetaSocialConnection();
    if (!connection.connected) return { ok: false as const, error: 'Connecte Meta d’abord.' };
    try {
      const externalId = await publishFacebookPost(connection, post, { schedule: true });
      await saveSocialCommsBoard({
        ...board,
        posts: board.posts.map((item) =>
          item.id === postId
            ? {
                ...item,
                status: 'scheduled',
                metaExternalId: externalId,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      });
      revalidateCommunity();
      return { ok: true as const, mode: 'facebook_native' as const };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : 'Programmation Facebook échouée.' };
    }
  }

  if (post.network === 'instagram') {
    // Instagram : file FitMangas uniquement. Le miroir Facebook part au cron (même instant que IG),
    // avec overlay composé côté serveur — évite les IDs fantômes d’un FB programmé trop tôt.
    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId
          ? {
              ...item,
              status: 'scheduled',
              facebookExternalId: null,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    });
    revalidateCommunity();
    return {
      ok: true as const,
      mode: 'instagram_queue' as const,
      message: post.alsoPublishFacebook
        ? 'Instagram en file FitMangas. À l’heure prévue : publication IG + miroir Facebook (même visuel que la preview).'
        : 'Instagram programmé dans FitMangas. Le cron publiera à l’heure prévue.',
    };
  }

  if (post.network === 'whatsapp') {
    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId ? { ...item, status: 'scheduled', updatedAt: new Date().toISOString() } : item,
      ),
    });
    revalidateCommunity();
    return {
      ok: true as const,
      mode: 'whatsapp_manual' as const,
      message:
        'WhatsApp programmé (semi-manuel) : à l’heure prévue, copie le texte depuis le bandeau « À envoyer » puis poste dans la communauté.',
    };
  }

  if (post.network === 'linkedin') {
    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId ? { ...item, status: 'scheduled', updatedAt: new Date().toISOString() } : item,
      ),
    });
    revalidateCommunity();
    return {
      ok: true as const,
      mode: 'linkedin_manual' as const,
      message: 'LinkedIn rappel programmé : à l’heure, copie la légende et publie manuellement.',
    };
  }

  return { ok: false as const, error: 'Réseau non programmable pour l’instant.' };
}

/** Appelé par le cron : publie les posts Instagram “scheduled” dont l’heure est passée (+ miroir FB). */
export async function processDueSocialPostsAction() {
  const board = await getSocialCommsBoard();
  const connection = await getMetaSocialConnection();
  const now = Date.now();
  let published = 0;
  let nextPosts = [...board.posts];

  for (const post of board.posts) {
    if (post.status !== 'scheduled' || !post.plannedAt) continue;
    if (new Date(post.plannedAt).getTime() > now) continue;
    if (post.network !== 'instagram') continue;
    if (!connection.connected) continue;
    try {
      const externalId = await publishInstagramNow(connection, post);
      let facebookExternalId = post.facebookExternalId;
      if (post.alsoPublishFacebook) {
        if (!facebookMirrorMediaReady(post)) {
          console.error('[processDueSocialPostsAction] FB mirror skipped — média manquant', post.id);
        } else {
          const fbAlreadyLive =
            facebookExternalId && (await verifyFacebookPublishId(connection, facebookExternalId, post.format));
          if (!fbAlreadyLive) {
            try {
              facebookExternalId = await publishFacebookPost(connection, post, { schedule: false });
            } catch (fbError) {
              console.error('[processDueSocialPostsAction] FB mirror', post.id, fbError);
            }
          }
        }
      }
      nextPosts = nextPosts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              status: 'published',
              metaExternalId: externalId,
              facebookExternalId,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
      published += 1;
    } catch (e) {
      console.error('[processDueSocialPostsAction]', post.id, e);
    }
  }

  if (published > 0) {
    await saveSocialCommsBoard({ ...board, posts: nextPosts });
    revalidateCommunity();
  }
  return { ok: true as const, published };
}

/** Publie / complète le miroir Facebook d’un post IG (refuse le doublon sauf force). */
export async function publishFacebookMirrorNowAction(postId: string, opts?: { force?: boolean }) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const post = board.posts.find((item) => item.id === postId);
  if (!post) return { ok: false as const, error: 'Post introuvable.' };
  if (post.network !== 'instagram') {
    return { ok: false as const, error: 'Miroir Facebook : réservé aux posts Instagram.' };
  }
  if (!post.alsoPublishFacebook) {
    return { ok: false as const, error: 'Coche « Aussi Facebook » avant de publier le miroir.' };
  }
  if (post.facebookExternalId && !opts?.force) {
    return {
      ok: false as const,
      error: `Déjà sur Facebook (ID ${post.facebookExternalId}). Évite de republier pour ne pas créer de doublon.`,
      facebookExternalId: post.facebookExternalId,
    };
  }
  if (!facebookMirrorMediaReady(post)) {
    return {
      ok: false as const,
      error:
        post.format === 'reel'
          ? 'MP4 manquant pour Facebook.'
          : 'Visuel manquant pour Facebook.',
    };
  }

  const connection = await getMetaSocialConnection();
  if (!connection.connected || !connection.accessToken || !connection.pageId) {
    return { ok: false as const, error: 'Connecte d’abord Meta (Page Facebook).' };
  }

  try {
    const facebookExternalId = await publishFacebookPost(connection, post, { schedule: false });
    if (!facebookExternalId) {
      return { ok: false as const, error: 'Facebook n’a renvoyé aucun ID de post.' };
    }
    await saveSocialCommsBoard({
      ...board,
      posts: board.posts.map((item) =>
        item.id === postId
          ? {
              ...item,
              facebookExternalId,
              alsoPublishFacebook: true,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    });
    revalidateCommunity();
    return {
      ok: true as const,
      facebookExternalId,
      message: 'Miroir Facebook publié.',
      previewCaption: captionForPublish(post).slice(0, 280),
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'Publication Facebook échouée.' };
  }
}

/** Crée un post manuel vierge (sans IA) dans « En cours ». */
export async function createManualSocialPostAction(input: {
  format: SocialPostFormat;
  locale?: SocialLocale;
}) {
  await requireAdmin();
  const format = input.format;
  if (!['feed', 'reel', 'carousel', 'story', 'text'].includes(format)) {
    return { ok: false as const, error: 'Format invalide.' };
  }
  const locale = input.locale === 'es' ? 'es' : 'fr';
  const board = await getSocialCommsBoard();
  const now = new Date().toISOString();
  const isReel = format === 'reel';
  const isCarousel = format === 'carousel';
  const post: SocialPost = {
    id: createSocialPostId(),
    network: 'instagram',
    format,
    locale,
    title: '',
    caption: '',
    hashtags: [],
    cta: '',
    imageHint: '',
    imagePath: null,
    imageSource: isReel ? 'none' : 'library',
    aiImagePrompt: '',
    imageFeedback: '',
    overlayText: null,
    useOverlay: format === 'feed' || isCarousel,
    hookTitle: '',
    reelScript: '',
    shotList: '',
    rawVideoPath: null,
    editedVideoPath: null,
    videoStatus: isReel ? 'brief' : null,
    carouselPaths: isCarousel ? Array.from({ length: CAROUSEL_SLIDE_COUNT }, () => '') : [],
    carouselSlideTitles: isCarousel ? Array.from({ length: CAROUSEL_SLIDE_COUNT }, () => '') : [],
    plannedAt: null,
    status: 'idea',
    sourceType: 'manual',
    sourceRef: null,
    whyItWorks: 'Post manuel — à compléter.',
    metaExternalId: null,
    alsoPublishFacebook: true,
    adaptedFromId: null,
    facebookExternalId: null,
    generationStatus: 'done',
    createdAt: now,
    updatedAt: now,
  };

  await saveSocialCommsBoard({
    ...board,
    posts: [post, ...board.posts].slice(0, 80),
  });
  revalidateCommunity();
  return {
    ok: true as const,
    postId: post.id,
    message: `Post ${format} manuel créé — complète les champs puis programme / publie.`,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (true) {
      const i = cursor;
      cursor += 1;
      if (i >= tasks.length) return;
      out[i] = await tasks[i]!();
    }
  });
  await Promise.all(workers);
  return out;
}

export async function generateSocialWeekPlanAction(
  networks: SocialNetwork[] = ['instagram', 'whatsapp', 'linkedin'],
  locales: SocialLocale[] = ['fr'],
) {
  const init = await initWeekPlanAction(networks, locales);
  if (!init.ok) return init;
  return {
    ok: true as const,
    created: init.total,
    runId: init.runId,
    message:
      'Génération initialisée en mode progressif (post par post). Continue avec generateNextPostAction puis finalizeWeekPlanAction.',
  };
}

function weekPlanFromTheme(
  theme: WeeklyPillar,
  familyOverride?: ContentFamilyId | null,
): WeekPlanSnapshot {
  const family = familyOverride || theme.family;
  return {
    mixLabel: `${CONTENT_FAMILY_LABELS[family]} · ${theme.label}`,
    counts: {
      portee: family === 'portee' ? 1 : 0,
      confiance: family === 'confiance' ? 1 : 0,
      conversion: family === 'conversion' ? 1 : 0,
    },
    assignments: [{ family, themeId: theme.id, label: theme.label }],
    shareHookSlotIndex: family !== 'conversion' ? 0 : -1,
  };
}

function buildSlotSpecForWeek(
  slots: ReturnType<typeof buildWeeklySlots>,
  weekPlan: WeekPlanSnapshot,
): SlotSpec[] {
  return slots.map((slot, index) => {
    const band =
      slot.network === 'whatsapp'
        ? CAPTION_BY_FORMAT.text
        : slot.network === 'linkedin'
          ? { min: 350, idealMin: 350, idealMax: 700, max: 900 }
          : CAPTION_BY_FORMAT[slot.format];
    const assignment = weekPlan.assignments[index % weekPlan.assignments.length]!;
    const theme = getContentTheme(assignment.themeId);
    const localeAngles = theme?.reelAnglesFr ?? [];
    return {
      slotId: index,
      network: slot.network,
      format: slot.format,
      mediaKind: slot.mediaKind,
      feedIntent: slot.feedIntent ?? null,
      dayOffset: slot.dayOffset,
      parisHour:
        SOCIAL_CM_GUIDELINES[slot.network].bestHours[
          slot.slotIndex % SOCIAL_CM_GUIDELINES[slot.network].bestHours.length
        ],
      captionMin: band.min,
      captionMax:
        slot.format === 'reel' ? 140 : Math.min(band.max, slot.network === 'linkedin' ? 700 : band.max),
      captionIdeal: slot.format === 'reel' ? '70-140' : `${band.idealMin}-${band.idealMax}`,
      hashtagIdeal: SOCIAL_CM_GUIDELINES[slot.network].hashtagIdeal,
      needsReelBrief: slot.mediaKind === 'video_brief',
      needsPhoto: slot.mediaKind === 'photo' || slot.mediaKind === 'carousel',
      assignPillar: assignment.themeId,
      contentFamily: assignment.family,
      themeLabel: assignment.label,
      forceTrialCta: Boolean(theme?.forceTrialCta),
      showProductOrCoach: Boolean(theme?.showProductOrCoach),
      shareHook: index === weekPlan.shareHookSlotIndex,
      reelAngle: slot.format === 'reel' ? localeAngles[index % Math.max(localeAngles.length, 1)] ?? null : null,
    };
  });
}

function generationCounts(posts: SocialPost[], runId: string) {
  const scoped = posts.filter((p) => p.generationRunId === runId);
  const done = scoped.filter((p) => p.generationStatus === 'done').length;
  const failed = scoped.filter((p) => p.generationStatus === 'failed').length;
  const retrying = scoped.filter((p) => p.generationStatus === 'retrying').length;
  const pending = scoped.filter((p) => p.generationStatus === 'pending').length;
  return { total: scoped.length, done, failed, retrying, pending };
}

function normalizeGeneratedRowForPost(params: {
  row: Record<string, unknown>;
  slot: ReturnType<typeof buildWeeklySlots>[number];
  slotSpec: SlotSpec;
  locale: SocialLocale;
  articleSlugFallback: string | null;
}) {
  const { row, slot, slotSpec, locale, articleSlugFallback } = params;
  const isReel = slot.mediaKind === 'video_brief';
  const band = CAPTION_BY_FORMAT[slot.format] ?? CAPTION_BY_FORMAT.feed;
  const captionMax =
    slot.format === 'reel'
      ? 150
      : slot.network === 'whatsapp'
        ? 420
        : slot.network === 'linkedin'
          ? 900
          : captionBandCharCeiling(band);
  const rawTitle = typeof row.title === 'string' ? row.title : `Post ${SOCIAL_CM_GUIDELINES[slot.network].label}`;
  const rawHook =
    typeof row.hookTitle === 'string' && row.hookTitle.trim() ? row.hookTitle.trim() : isReel ? rawTitle : '';
  const hookTitle = isReel ? polishInstagramHook(rawHook, rawTitle, locale) : '';
  let title = polishPostTitle(rawTitle, hookTitle || rawHook, slot.format, locale);
  let titleNeedsReview = titleFailsQualityGate(title) || /titre à revoir|título a revisar/i.test(title);
  if (titleNeedsReview) {
    const retry = polishPostTitle(hookTitle || rawHook, rawTitle, slot.format, locale);
    if (!titleFailsQualityGate(retry) && !/titre à revoir|título a revisar/i.test(retry)) {
      title = retry;
      titleNeedsReview = false;
    }
  }
  if (isReel && hookNeedsReview(hookTitle)) {
    titleNeedsReview = true;
  }

  // Brief Reel : pas de template silencieux — vide = échec explicite à la génération
  const reelScriptRaw =
    typeof row.reelScript === 'string' && row.reelScript.trim()
      ? row.reelScript.trim().replace(/\\n/g, '\n')
      : '';
  const shotListRaw = isReel
    ? enforceFaceCamShotList(
        typeof row.shotList === 'string' && row.shotList.trim()
          ? row.shotList.trim().replace(/\\n/g, '\n')
          : '',
        locale,
      )
    : '';

  let sourceType: SocialPost['sourceType'] =
    row.sourceType === 'blog' || row.sourceType === 'pillar' || row.sourceType === 'course' || row.sourceType === 'ai'
      ? row.sourceType
      : 'ai';
  let sourceRef = typeof row.sourceRef === 'string' ? row.sourceRef : null;
  if (slot.network === 'whatsapp' && articleSlugFallback) {
    sourceType = 'blog';
    sourceRef = sourceRef || articleSlugFallback;
  }

  return {
    title: sanitizeTrashTalkCopy(title, locale),
    caption: (() => {
      const rawCaption =
        typeof row.caption === 'string'
          ? sanitizeCaptionForFormat(row.caption, slot.format === 'text' ? 'text' : slot.format, captionMax)
          : '';
      const ctaText = (() => {
        if (slotSpec.forceTrialCta) {
          return locale === 'es' ? TRIAL_CTA_ES : TRIAL_CTA_FR;
        }
        return typeof row.cta === 'string' ? row.cta.slice(0, 180) : '';
      })();
      return mergeCaptionWithCta(rawCaption, ctaText);
    })(),
    hashtags: Array.isArray(row.hashtags)
      ? row.hashtags.map(String).filter(Boolean).slice(0, SOCIAL_CM_GUIDELINES[slot.network].hashtagMax)
      : [],
    cta: (() => {
      if (slotSpec.forceTrialCta) {
        return locale === 'es' ? TRIAL_CTA_ES : TRIAL_CTA_FR;
      }
      return typeof row.cta === 'string' ? row.cta.slice(0, 180) : '';
    })(),
    imageHint: typeof row.imageHint === 'string' ? row.imageHint.slice(0, 500) : '',
    overlayText: (() => {
      const rawOverlay = typeof row.overlayText === 'string' ? row.overlayText.trim() : '';
      const rawHook = hookTitle.trim();
      const candidate = rawOverlay || rawHook;
      return polishOverlayText(candidate, locale, 56);
    })(),
    useOverlay: row.useOverlay === true || slot.format === 'feed' || slot.format === 'carousel',
    hookTitle: (() => {
      const h = polishOverlayText(hookTitle || (typeof row.overlayText === 'string' ? row.overlayText : ''), locale, 56);
      return h;
    })(),
    ...(() => {
      if (slot.format !== 'carousel') {
        return { carouselSlideTitles: [] as string[], overlaysNeedReview: false };
      }
      const normalizedSlides = normalizeCarouselSlideTitles(
        (row as { slideTitles?: unknown }).slideTitles ?? (row as { carouselSlideTitles?: unknown }).carouselSlideTitles,
        typeof row.overlayText === 'string' ? row.overlayText : hookTitle,
        locale,
      );
      return {
        carouselSlideTitles: normalizedSlides.titles,
        overlaysNeedReview: normalizedSlides.overlaysNeedReview,
      };
    })(),
    reelScript: reelScriptRaw.slice(0, 4000),
    shotList: shotListRaw.slice(0, 800),
    sourceType,
    sourceRef,
    whyItWorks: typeof row.whyItWorks === 'string' ? row.whyItWorks.slice(0, 220) : '',
    whyItWorksNeedsReview: whyItWorksNeedsReviewForLocale(
      typeof row.whyItWorks === 'string' ? row.whyItWorks : '',
      locale,
    ),
    titleNeedsReview: titleNeedsReview || (isReel && hookNeedsReview(hookTitle)),
    pillarId: typeof slotSpec.assignPillar === 'string' ? slotSpec.assignPillar : null,
    contentFamily: slotSpec.contentFamily,
  };
}

export async function initWeekPlanAction(
  networks: SocialNetwork[] = ['instagram', 'whatsapp', 'linkedin'],
  locales: SocialLocale[] = ['fr'],
) {
  await requireAdmin();
  const targetNetworks = networks.length
    ? networks.filter((n) => n !== 'facebook')
    : (['instagram', 'whatsapp', 'linkedin'] as SocialNetwork[]);
  // Défaut FR uniquement — ES = bouton « Générer en espagnol » par post
  const targetLocales: SocialLocale[] = (locales.length ? locales : (['fr'] as SocialLocale[])).filter(
    (l, i, arr) => (l === 'fr' || l === 'es') && arr.indexOf(l) === i,
  );
  if (!targetLocales.length) return { ok: false as const, error: 'Aucune langue sélectionnée (FR / ES).' };
  const slots = buildWeeklySlots(targetNetworks);
  if (!slots.length) return { ok: false as const, error: 'Aucun réseau sélectionné pour la génération.' };

  const board = await getSocialCommsBoard();
  const pillarHistory = await loadPillarHistory();
  const weekSeed = Date.now();
  const weekPlan = buildWeekThemePlan(pillarHistory, slots.length, weekSeed);
  const slotSpec = buildSlotSpecForWeek(slots, weekPlan);
  const now = new Date().toISOString();
  const runId = `run_${Date.now().toString(36)}`;

  const skeleton: SocialPost[] = [];
  for (const locale of targetLocales) {
    for (let i = 0; i < slots.length; i += 1) {
      const slot = slots[i]!;
      const spec = slotSpec[i]!;
      skeleton.push({
        id: createSocialPostId(),
        network: slot.network,
        format: slot.format,
        locale,
        title: locale === 'es' ? 'Generación en curso…' : 'Génération en cours…',
        caption: '',
        hashtags: [],
        cta: spec.forceTrialCta ? (locale === 'es' ? TRIAL_CTA_ES : TRIAL_CTA_FR) : '',
        imageHint: '',
        imagePath: null,
        imageSource: slot.mediaKind === 'video_brief' ? 'none' : 'library',
        aiImagePrompt: '',
        imageFeedback: '',
        overlayText: '',
        useOverlay: false,
        hookTitle: '',
        reelScript: '',
        shotList: '',
        rawVideoPath: null,
        editedVideoPath: null,
        videoStatus: slot.mediaKind === 'video_brief' ? 'brief' : null,
        carouselPaths: [],
        plannedAt: plannedAtParis(slot.network, slot.dayOffset, slot.slotIndex),
        status: 'idea',
        sourceType: 'ai',
        sourceRef: null,
        whyItWorks: '',
        metaExternalId: null,
        titleNeedsReview: false,
        pillarId: spec.assignPillar ?? null,
        contentFamily: spec.contentFamily,
        alsoPublishFacebook: slot.network === 'instagram',
        adaptedFromId: null,
        facebookExternalId: null,
        generationStatus: 'pending',
        generationError: null,
        generationRunId: runId,
        generationSlot: i,
        generationMediaKind: slot.mediaKind,
        generationDayOffset: slot.dayOffset,
        generationSlotIndex: slot.slotIndex,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await recordWeekThemePlan(weekPlan, now.slice(0, 10));
  await saveSocialCommsBoard({
    ...board,
    posts: [...skeleton, ...board.posts].slice(0, 160),
  });
  revalidateCommunity();

  return {
    ok: true as const,
    runId,
    total: skeleton.length,
    mixLabel: weekPlan.mixLabel,
    message: `Squelette généré (${skeleton.length} posts). ${weekPlan.mixLabel}`,
  };
}

export async function requeueFailedWeekPlanAction(runId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  let count = 0;
  const posts = board.posts.map((post) => {
    if (post.generationRunId !== runId || post.generationStatus !== 'failed') return post;
    count += 1;
    return {
      ...post,
      generationStatus: 'pending' as const,
      generationError: null,
      updatedAt: new Date().toISOString(),
    };
  });
  if (!count) return { ok: true as const, count: 0, message: 'Aucun échec à relancer.' };
  await saveSocialCommsBoard({ ...board, posts });
  revalidateCommunity();
  return { ok: true as const, count, message: `${count} post(s) remis en file.` };
}

export async function generateNextPostAction(runId: string, mode: 'pending' | 'failed' = 'pending') {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const target = board.posts
    .filter((p) => p.generationRunId === runId)
    .filter((p) =>
      mode === 'failed'
        ? p.generationStatus === 'failed'
        : p.generationStatus === 'pending' || p.generationStatus === 'retrying',
    )
    .sort((a, b) => {
      const sa = a.generationSlot ?? Number.MAX_SAFE_INTEGER;
      const sb = b.generationSlot ?? Number.MAX_SAFE_INTEGER;
      if (sa !== sb) return sa - sb;
      return a.locale.localeCompare(b.locale);
    })[0];

  if (!target) {
    const counts = generationCounts(board.posts, runId);
    return { ok: true as const, completed: true, ...counts };
  }

  const markRetrying = {
    ...board,
    posts: board.posts.map((p) =>
      p.id === target.id
        ? { ...p, generationStatus: 'retrying' as const, generationError: null, updatedAt: new Date().toISOString() }
        : p,
    ),
  };
  await saveSocialCommsBoard(markRetrying);

  try {
    const context = await loadGenerationContext();
    const pillarHistory = await loadPillarHistory();
    const weekPillar =
      getWeeklyPillar(target.pillarId) || pickWeeklyPillar(pillarHistory, Date.now());
    const slot = {
      network: target.network,
      format: target.format,
      mediaKind:
        (target.generationMediaKind as SocialMediaKind | null) ||
        (target.format === 'reel' ? 'video_brief' : target.format === 'carousel' ? 'carousel' : 'photo'),
      dayOffset: target.generationDayOffset ?? 0,
      slotIndex: target.generationSlotIndex ?? 0,
      feedIntent: undefined,
    } as const;
    const slotSpec = buildSlotSpecForWeek(
      [slot],
      weekPlanFromTheme(weekPillar, target.contentFamily),
    )[0]!;
    const batch = await generatePostsJsonForSlots(context, [{ ...slotSpec, slotId: 0 }], target.locale);
    if (!batch.ok) throw new Error(batch.error);
    const row = (batch.posts.find((p) => Boolean(p && typeof p === 'object')) as Record<string, unknown> | undefined) ?? {};
    const articleSlugFallback = context.articlesByLocale[target.locale]?.[0]?.slug ?? null;
    const normalized = normalizeGeneratedRowForPost({
      row,
      slot: slot as unknown as ReturnType<typeof buildWeeklySlots>[number],
      slotSpec,
      locale: target.locale,
      articleSlugFallback,
    });

    if (slot.mediaKind === 'video_brief' && !normalized.reelScript.trim()) {
      throw new Error('Brief Reel vide — génération texte échouée (pas de template de secours).');
    }

    let imagePath: string | null = target.imagePath;
    let carouselPaths: string[] = target.carouselPaths ?? [];
    let imageSource: SocialPost['imageSource'] = target.format === 'reel' ? 'none' : 'library';
    let aiImagePrompt = '';

    if (slot.mediaKind !== 'video_brief') {
      const { collectUsedUnsplashIdsFromPosts, generateSocialPhotoForPost, uploadSocialGeneratedImage } = await import(
        '@/lib/admin/social-ai-image'
      );
      const latestBoard = await getSocialCommsBoard();
      const usedLibrary = collectUsedLibraryPaths(latestBoard.posts);
      const usedUnsplash = collectUsedUnsplashIdsFromPosts(latestBoard.posts);

      if (slot.mediaKind === 'carousel') {
        const paths: Array<string | null> = new Array(CAROUSEL_SLIDE_COUNT).fill(null);
        const slidesNormalized =
          normalized.carouselSlideTitles?.length === CAROUSEL_SLIDE_COUNT
            ? {
                titles: normalized.carouselSlideTitles,
                overlaysNeedReview:
                  Boolean((normalized as { overlaysNeedReview?: boolean }).overlaysNeedReview) ||
                  overlaysNeedReviewFromTitles(normalized.carouselSlideTitles),
              }
            : normalizeCarouselSlideTitles(
                normalized.carouselSlideTitles,
                normalized.overlayText || normalized.hookTitle,
                target.locale,
              );
        const slideTitles = slidesNormalized.titles;
        normalized.carouselSlideTitles = slideTitles;
        (normalized as { overlaysNeedReview?: boolean }).overlaysNeedReview = slidesNormalized.overlaysNeedReview;
        normalized.overlayText = slideTitles[0] || normalized.overlayText;
        const tasks: Array<() => Promise<void>> = [];

        // Slide 1 (index 0) = vraie photo Alejandra (identité / confiance)
        tasks.push(async () => {
          const r = await generateSocialPhotoForPost(target, {
            variationSeed: (target.generationSlot ?? 0) * 10 + 1,
            usedLibraryPaths: usedLibrary,
            usedUnsplashIds: usedUnsplash,
            preferLibrary: true,
            forceNanoBanana: false,
            allowUnsplash: false,
            libraryFolder: 'portraits',
            libraryThemeHint: 'portrait Alejandra confiance identité',
          });
          if (r.ok) {
            paths[0] = r.imagePath;
            imageSource = imageSourceFromProviderName(r.provider);
            aiImagePrompt = r.prompt;
            usedLibrary.add(r.imagePath);
          }
        });

        // Slides 2–5 (index 1–4) = images IA sur le sujet du point (formule 10 composants)
        for (let c = 1; c <= 4; c += 1) {
          const slideHint = slideTitles[c] || normalized.imageHint || normalized.title;
          tasks.push(async () => {
            const r = await generateSocialPhotoForPost(
              {
                ...target,
                format: 'carousel',
                useOverlay: true,
                imageHint: slideHint,
                title: slideHint,
                overlayText: slideHint,
              },
              {
                variationSeed: (target.generationSlot ?? 0) * 10 + c + 1,
                usedLibraryPaths: usedLibrary,
                usedUnsplashIds: usedUnsplash,
                preferLibrary: false,
                forceNanoBanana: true,
                allowUnsplash: false,
                libraryThemeHint: slideHint,
              },
            );
            if (r.ok) {
              // Slides pédagogiques : refuser un fallback bibliothèque lifestyle hors sujet
              const isLibraryLifestyle =
                r.provider === 'library' ||
                (/^\/library\//.test(r.imagePath) && !/generees|produit-captures/i.test(r.imagePath));
              if (isLibraryLifestyle) {
                console.warn(`[carousel] slide ${c + 1}: image biblio refusée (hors sujet) → ${r.imagePath}`);
              } else {
                paths[c] = r.imagePath;
                imageSource = imageSourceFromProviderName(r.provider);
                aiImagePrompt = r.prompt;
              }
            }
            await sleep(250);
          });
        }

        await runWithConcurrency(tasks, 3);

        // Slide 6 (index 5) = CTA dashboard desktop ENTIER en carte flottante (pré-composé)
        {
          const { composeCarouselCtaSlideBuffer } = await import('@/lib/admin/compose-carousel-cta');
          const ctaBuf = await composeCarouselCtaSlideBuffer({
            overlayText: slideTitles[5] || 'ESSAI 7 JOURS — ON T’ATTEND EN VISIO',
          });
          paths[5] = await uploadSocialGeneratedImage(ctaBuf, `${target.id}-cta`, {
            prompt: 'carousel-cta-dashboard-contain',
            provider: 'brand',
            theme: 'cta-dashboard',
          });
        }

        const { sanitizeCarouselPaths, carouselHasMissingSlides } = await import(
          '@/lib/admin/image-providers/library-provider'
        );
        const resolved = sanitizeCarouselPaths(paths.map((p) => p || ''));
        for (let c = 0; c < CAROUSEL_SLIDE_COUNT; c += 1) {
          if (paths[c]) resolved[c] = paths[c]!;
        }
        carouselPaths = resolved.slice(0, CAROUSEL_SLIDE_COUNT);
        if (carouselHasMissingSlides(carouselPaths, CAROUSEL_SLIDE_COUNT)) {
          const missing = carouselPaths
            .map((p, i) => (!p?.trim() ? i + 1 : null))
            .filter(Boolean)
            .join(', ');
          throw new Error(
            `Carousel failed : slide(s) manquante(s) [${missing}] — pas de duplication silencieuse. Relancer la génération image.`,
          );
        }
        imagePath = carouselPaths[0] ?? null;
        imageSource = imageSource === 'library' ? 'ai' : imageSource;
      } else {
        // Feed = vraie photo bibliothèque uniquement (pas d'IA). Overlay + logo brûlés ensuite.
        const r = await generateSocialPhotoForPost(target, {
          variationSeed: target.id.length,
          usedLibraryPaths: usedLibrary,
          usedUnsplashIds: usedUnsplash,
          preferLibrary: true,
          forceNanoBanana: false,
          allowUnsplash: false,
          libraryThemeHint: normalized.imageHint || normalized.title || target.pillarId || 'portraits',
        });
        if (!r.ok) throw new Error(r.error);
        imagePath = r.imagePath;
        imageSource = imageSourceFromProviderName(r.provider);
        aiImagePrompt = r.prompt;
      }
    }

    const now = new Date().toISOString();
    const refreshed = await getSocialCommsBoard();
    await saveSocialCommsBoard({
      ...refreshed,
      posts: refreshed.posts.map((p) =>
        p.id === target.id
          ? {
              ...p,
              ...normalized,
              imagePath,
              carouselPaths,
              imageSource,
              aiImagePrompt,
              carouselMissingSlides: false,
              generationStatus: 'done',
              generationError: null,
              updatedAt: now,
            }
          : p,
      ),
    });

    const donePost = (await getSocialCommsBoard()).posts.find((p) => p.id === target.id);
    if (donePost) {
      await recordHooks([
        {
          text: (donePost.hookTitle || donePost.title).slice(0, 120),
          pillarId: donePost.pillarId || 'weekly',
          format: donePost.format,
          locale: donePost.locale,
          date: now,
          score: null,
        },
      ]);
    }

    const updated = await getSocialCommsBoard();
    const counts = generationCounts(updated.posts, runId);
    revalidateCommunity();
    return { ok: true as const, completed: false, postId: target.id, ...counts };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const refreshed = await getSocialCommsBoard();
    await saveSocialCommsBoard({
      ...refreshed,
      posts: refreshed.posts.map((p) =>
        p.id === target.id
          ? {
              ...p,
              generationStatus: 'failed',
              generationError: msg.slice(0, 500),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    });
    const updated = await getSocialCommsBoard();
    const counts = generationCounts(updated.posts, runId);
    revalidateCommunity();
    return { ok: true as const, completed: false, postId: target.id, ...counts, failedMessage: msg.slice(0, 500) };
  }
}

export async function finalizeWeekPlanAction(runId: string) {
  await requireAdmin();
  const board = await getSocialCommsBoard();
  const counts = generationCounts(board.posts, runId);
  if (!counts.total) return { ok: false as const, error: 'Run introuvable.' };
  const now = new Date().toISOString();
  await saveSocialCommsBoard({
    ...board,
    lastGeneratedAt: counts.done > 0 ? now : board.lastGeneratedAt,
  });
  revalidateCommunity();
  return {
    ok: true as const,
    ...counts,
    message: `Génération terminée: ${counts.done}/${counts.total} done, ${counts.failed} failed.`,
  };
}

/** Série « 50 conseils Pilates » — compte comme PORTÉE, n° mémorisé. */
export async function generateConseilSeriesPostAction() {
  await requireAdmin();
  const { claimNextConseilNumber, CONSEIL_KEYWORD_BANK_FR, CONSEIL_SERIES_TOTAL, getConseilSeriesState } = await import(
    '@/lib/admin/social-conseil-series'
  );
  const state = await getConseilSeriesState();
  if (state.nextNumber > CONSEIL_SERIES_TOTAL) {
    return { ok: false as const, error: `Série complète (${CONSEIL_SERIES_TOTAL}/50).` };
  }
  const keyword =
    CONSEIL_KEYWORD_BANK_FR.find((k) => !state.usedKeywords.includes(k)) ||
    CONSEIL_KEYWORD_BANK_FR[(state.nextNumber - 1) % CONSEIL_KEYWORD_BANK_FR.length]!;
  const claimed = await claimNextConseilNumber(keyword);
  if (!claimed) return { ok: false as const, error: 'Impossible de réserver un numéro de conseil.' };

  const board = await getSocialCommsBoard();
  const now = new Date().toISOString();
  const overlay = polishOverlayText(`CONSEIL N°${claimed.number} : ${claimed.keyword.toUpperCase()}`, 'fr', 56);
  const title = `Conseil n°${claimed.number} — ${claimed.keyword}`;

  const textCascade = await runSocialTextCascade({
    system: `Tu es community manager Instagram FitMangas. Réponds UNIQUEMENT JSON:
{"caption":"...","reelScript":"...","whyItWorks":"..."}
Légende courte FR (max 150 car.), brief Reel face cam (pas script à lire), whyItWorks en français.`,
    user: `Série 50 conseils — n°${claimed.number} sur le thème « ${claimed.keyword} ».
Pas de gabarit figé. Une idée concrète, langage plat, CTA essai 7 jours fitmangas.com.`,
    temperature: 0.7,
    maxOutputTokens: 900,
  });
  if (!textCascade.ok) {
    return {
      ok: false as const,
      error: `Série conseil : cascade texte échouée — ${textCascade.detail || 'pas de légende template'}.`,
    };
  }
  let captionBody = '';
  let reelScript = '';
  let whyItWorks = `Série 50 conseils · portée · n°${claimed.number}/${CONSEIL_SERIES_TOTAL}`;
  try {
    const match = textCascade.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON introuvable');
    const parsed = JSON.parse(match[0]) as { caption?: string; reelScript?: string; whyItWorks?: string };
    captionBody = String(parsed.caption || '').trim();
    reelScript = String(parsed.reelScript || '').trim().replace(/\\n/g, '\n');
    if (parsed.whyItWorks) whyItWorks = String(parsed.whyItWorks).trim().slice(0, 220);
  } catch (e) {
    return {
      ok: false as const,
      error: `Série conseil : parse IA échoué — ${e instanceof Error ? e.message : 'erreur'} (pas de gabarit).`,
    };
  }
  if (!captionBody || !reelScript) {
    return { ok: false as const, error: 'Série conseil : caption ou brief vide après IA — à revoir.' };
  }
  const caption = mergeCaptionWithCta(captionBody, 'Essai gratuit 7 jours → fitmangas.com');
  const post: SocialPost = {
    id: createSocialPostId(),
    network: 'instagram',
    format: 'reel',
    locale: 'fr',
    title,
    caption,
    hashtags: ['pilates', 'fitmangas', 'conseil'],
    cta: 'Essai gratuit 7 jours → fitmangas.com',
    imageHint: 'partial framing hands breathing calm editorial lifestyle',
    imagePath: null,
    imageSource: 'none',
    aiImagePrompt: '',
    imageFeedback: '',
    overlayText: overlay,
    useOverlay: true,
    hookTitle: overlay,
    reelScript,
    shotList: enforceFaceCamShotList('', 'fr'),

    rawVideoPath: null,
    editedVideoPath: null,
    videoStatus: 'brief',
    carouselPaths: [],
    carouselSlideTitles: [],
    seriesKind: 'conseil_50',
    seriesNumber: claimed.number,
    seriesKeyword: claimed.keyword,
    plannedAt: plannedAtParis('instagram', 0, 0),
    status: 'idea',
    sourceType: 'ai',
    sourceRef: `conseil-${claimed.number}`,
    whyItWorks,
    whyItWorksNeedsReview: whyItWorksNeedsReviewForLocale(whyItWorks, 'fr'),
    metaExternalId: null,
    titleNeedsReview: false,
    pillarId: 'energie_crash',
    contentFamily: 'portee',
    alsoPublishFacebook: true,
    adaptedFromId: null,
    facebookExternalId: null,
    generationStatus: 'done',
    generationError: null,
    createdAt: now,
    updatedAt: now,
  };

  await saveSocialCommsBoard({
    ...board,
    posts: [post, ...board.posts].slice(0, 160),
    lastGeneratedAt: board.lastGeneratedAt,
  });
  revalidateCommunity();
  return {
    ok: true as const,
    message: `Conseil n°${claimed.number} — ${claimed.keyword} ajouté (${claimed.number}/${CONSEIL_SERIES_TOTAL}).`,
    postId: post.id,
  };
}
