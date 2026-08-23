import {
  runBlogAiCascade,
  type BlogAiProviderId,
} from '@/lib/blog/ai-providers';
import {
  BLOG_MIN_BODY_WORDS,
  BLOG_TARGET_WORDS_MAX,
  BLOG_TARGET_WORDS_MIN,
  containsArticlePilatesPlaceholder,
  countBodyWords,
  ensureValidatedBlogCta,
  idealZoneOutOfRangeDetail,
  isIdealBodyWordCount,
  looksLikeFallbackTemplate,
  sanitizeBlogContentHtml,
} from '@/lib/blog/blog-content-guards';
import { BLOG_SEO_META_MAX, enforceBlogSeoMeta } from '@/lib/blog/blog-seo-limits';
import {
  looksLikeGenericBlogOpener,
  type BlogAngleId,
} from '@/lib/blog/blog-title-diversity';

export type GeneratedArticle = {
  contentHtml: string;
  description: string;
  metaDescription: string;
  seoKeywords: string | null;
  /** Provider IA qui a produit cet article (jamais « fallback »). */
  provider: BlogAiProviderId;
  model: string;
};

export type ArticleGenerationAttemptResult =
  | { ok: true; article: GeneratedArticle }
  | {
      ok: false;
      reason: 'generation_failed';
      detail: string;
    };

function truncateAtSentence(value: string, maxLength: number): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  if (sentenceEnd >= Math.floor(maxLength * 0.65)) return slice.slice(0, sentenceEnd + 1).trim();
  return `${slice.slice(0, maxLength - 1).replace(/[\s,;:.-]+$/g, '')}…`;
}

function extractJsonBlock(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const slice = raw.slice(start, end + 1);
  try {
    return JSON.parse(slice) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildPrompts(params: {
  topicBrief: string;
  category: string;
  publishDateIso: string;
  title?: string;
  recentAngles?: BlogAngleId[];
  lastAngle?: BlogAngleId | null;
  lengthCorrection?: { wordsGot: number };
}): {
  system: string;
  user: string;
} {
  const system = `Tu es copywriter SEO expert d'un blog pilates premium (FitMangas / Alejandra). Tu RÉDIGES un article UNIQUE — jamais un gabarit à trous.
Objectif stratégique FitMangas: clusters SEO autour de:
- Pilates en ligne (/pilates-en-ligne)
- Cours de Pilates en visio (/cours-pilates-visio)
- Pilates débutant à la maison (/pilates-debutant-maison)

Retourne STRICTEMENT un JSON avec ces clés:
- contentHtml (article HTML UNIQUE ; OBLIGATOIRE ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX} mots de contenu RÉEL ; hors fourchette = échec ; balises <h2>, <h3>, <p>, <ul>, <li>, <strong> uniquement ; courte FAQ en fin AVANT le CTA)
- description (120 à 159 caractères, STRICTEMENT moins de 160)
- metaDescription (140 à 159 caractères, STRICTEMENT moins de 160)
- seoKeywords (5 à 8 mots-clés longue traîne séparés par virgules)`;

  const avoidAngles = (params.recentAngles ?? []).slice(-8).join(', ') || '(aucun)';
  const lockedTitle = params.title?.trim();
  const correction =
    params.lengthCorrection != null
      ? `\n\nCORRECTION: ta version précédente faisait ${params.lengthCorrection.wordsGot} mots — HORS zone. Réécris pour atterrir STRICTEMENT entre ${BLOG_TARGET_WORDS_MIN} et ${BLOG_TARGET_WORDS_MAX} mots (vise ~1500). Coupe le superflu ou densifie, sans remplissage.`
      : '';

  const user = `Sujet SPÉCIFIQUE à traiter (un seul angle, contenu propre à CE sujet):
${params.topicBrief}

${lockedTitle ? `Titre déjà validé (NE PAS le réécrire dans contentHtml comme <h1> ; le corps doit coller à ce titre): ${lockedTitle}\n` : ''}Catégorie: ${params.category}
Date publication: ${params.publishDateIso}

Règles de RÉDACTION (obligatoires):
- Chaque article = contenu ORIGINAL rédigé pour CE sujet. Pas de texte recyclé.
- LONGUEUR FINALE OBLIGATOIRE: ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX} mots de vraie valeur (exemples terrain, nuances, erreurs courantes, variations d'exercices, FAQ utile). Vise le milieu (~1500). INTERDIT le remplissage creux, les reformulations vides, le padding, et dépasser ${BLOG_TARGET_WORDS_MAX} mots.
- Les intertitres <h2>/<h3> doivent être SPÉCIFIQUES au sujet (ex. "Respiration latérale au bureau", "Quand 15 minutes battent une heure"). INTERDIT d'utiliser les titres de section figés suivants: "Pourquoi ce sujet change ta pratique", "Le contexte concret", "3 actions simples à appliquer cette semaine", "Exemple terrain", "Ce que tu peux retenir".
- INTERDIT ABSOLU: "Article pilates N", "mouvement & souffle", tout placeholder non résolu, "Un guide concret pour progresser en pilates autour de…".
- Viser une intention de recherche précise liée au sujet
- Rattacher à UN cluster: pilates en ligne / cours pilates visio / pilates débutant maison
- ANGLE DISTINCT: un seul (respiration, dos, posture bureau, périménopause, débutante, régularité, renforcement centre, etc.)
- INTERDIT de reprendre l'angle précédent: ${params.lastAngle ?? '(aucun)'}
- Angles récents à ne pas recycler: ${avoidAngles}
- Intro = problème concret DU sujet (pas une amorce générique)
- 4-6 conseils concrets propres au sujet + une mini-story réaliste
- FAQ courte (2-3 questions) liées au sujet
- NE PAS écrire le CTA final toi-même (le système l'ajoute). Termine après la FAQ.
- Pas de liens HTML externes ; pas de promesse médicale / perte de poids / guérison
- Minimum technique ${BLOG_MIN_BODY_WORDS} mots, mais la cible métier est ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX}.${correction}`;

  return { system, user };
}

function parseGeneratedArticle(
  raw: string,
  provider: BlogAiProviderId,
  model: string,
): GeneratedArticle | null {
  const data = extractJsonBlock(raw);
  if (!data) return null;

  const contentHtml = typeof data.contentHtml === 'string' ? data.contentHtml.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const metaDescription = typeof data.metaDescription === 'string' ? data.metaDescription.trim() : '';
  const seoKeywords = typeof data.seoKeywords === 'string' ? data.seoKeywords.trim() : '';

  let cleanedHtml = sanitizeBlogContentHtml(contentHtml);
  if (!cleanedHtml) return null;
  if (looksLikeFallbackTemplate(cleanedHtml, description)) return null;
  if (looksLikeGenericBlogOpener(description) || looksLikeGenericBlogOpener(cleanedHtml)) return null;
  if (containsArticlePilatesPlaceholder(cleanedHtml) || containsArticlePilatesPlaceholder(description)) {
    return null;
  }

  cleanedHtml = ensureValidatedBlogCta(cleanedHtml);
  if (countBodyWords(cleanedHtml) < BLOG_MIN_BODY_WORDS) return null;

  const plainFallback = cleanedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    contentHtml: cleanedHtml,
    description: enforceBlogSeoMeta(
      truncateAtSentence(description || plainFallback, BLOG_SEO_META_MAX),
    ),
    metaDescription: enforceBlogSeoMeta(
      truncateAtSentence(metaDescription || description || plainFallback, BLOG_SEO_META_MAX),
    ),
    seoKeywords:
      seoKeywords && !containsArticlePilatesPlaceholder(seoKeywords) ? seoKeywords : null,
    provider,
    model,
  };
}

/**
 * Génère un article via la cascade Claude → Gemini → Mistral → Groq → OpenAI.
 * Ne renvoie JAMAIS le template de secours : en cas d’échec total → generation_failed.
 * Garde-fou longueur = même règle que la MàJ : sauver UNIQUEMENT en zone idéale 1200–1800 (1 retry).
 */
/** Qualité éditoriale prioritaire : Claude puis Gemini puis Mistral. */
export const PREMIUM_BLOG_AI_ORDER: BlogAiProviderId[] = ['claude', 'gemini', 'mistral'];

type GenerateParams = {
  topicBrief: string;
  category: string;
  publishDateIso: string;
  title?: string;
  providerOrder?: BlogAiProviderId[];
  recentAngles?: BlogAngleId[];
  lastAngle?: BlogAngleId | null;
  lengthCorrection?: { wordsGot: number };
};

async function runOneGenerationPass(params: GenerateParams): Promise<ArticleGenerationAttemptResult> {
  const { system, user } = buildPrompts(params);
  const cascade = await runBlogAiCascade(
    {
      system,
      user,
      temperature: params.lengthCorrection ? 0.55 : 0.85,
      maxOutputTokens: 12288,
    },
    params.providerOrder,
  );

  if (!cascade.ok) {
    return {
      ok: false,
      reason: 'generation_failed',
      detail: cascade.detail,
    };
  }

  const article = parseGeneratedArticle(cascade.text, cascade.provider, cascade.model);
  if (!article) {
    const retry = await retryParseAcrossProviders(params, cascade.provider, params.providerOrder);
    if (retry) return { ok: true, article: retry };
    return {
      ok: false,
      reason: 'generation_failed',
      detail: `Réponse JSON invalide, trop courte, ou contenu template de ${cascade.provider}.`,
    };
  }

  return { ok: true, article };
}

export async function tryGenerateFrenchArticle(params: {
  topicBrief: string;
  category: string;
  publishDateIso: string;
  /** Titre déjà validé (corps aligné dessus, non réécrit). */
  title?: string;
  /** Ordre de cascade optionnel (ex. PREMIUM_BLOG_AI_ORDER). */
  providerOrder?: BlogAiProviderId[];
  recentAngles?: BlogAngleId[];
  lastAngle?: BlogAngleId | null;
}): Promise<ArticleGenerationAttemptResult> {
  let result = await runOneGenerationPass(params);
  if (!result.ok) return result;

  let words = countBodyWords(result.article.contentHtml);
  if (!isIdealBodyWordCount(words)) {
    const retry = await runOneGenerationPass({
      ...params,
      lengthCorrection: { wordsGot: words },
    });
    if (!retry.ok) {
      return {
        ok: false,
        reason: 'generation_failed',
        detail: `Hors zone (${words} mots) puis retry échoué: ${retry.detail}`,
      };
    }
    result = retry;
    words = countBodyWords(result.article.contentHtml);
  }

  if (!isIdealBodyWordCount(words)) {
    return {
      ok: false,
      reason: 'generation_failed',
      detail: `${idealZoneOutOfRangeDetail(words)} Après 2 essais.`,
    };
  }

  console.info(
    `[generateFrenchArticle] contenu généré par ${result.article.provider}/${result.article.model} (${words} mots, zone idéale)`,
  );
  return result;
}

async function retryParseAcrossProviders(
  params: GenerateParams,
  skipProvider: BlogAiProviderId,
  providerOrder?: BlogAiProviderId[],
): Promise<GeneratedArticle | null> {
  const { completeWithProvider, listConfiguredBlogAiProviders } = await import('@/lib/blog/ai-providers');
  const { system, user } = buildPrompts(params);
  for (const provider of listConfiguredBlogAiProviders(providerOrder)) {
    if (provider === skipProvider) continue;
    const result = await completeWithProvider(provider, {
      system,
      user,
      temperature: 0.9,
      maxOutputTokens: 12288,
    });
    if (!result.ok) continue;
    const parsed = parseGeneratedArticle(result.text, result.provider, result.model);
    if (parsed) {
      console.info(
        `[generateFrenchArticle] contenu généré par ${parsed.provider}/${parsed.model} (retry parse)`,
      );
      return parsed;
    }
  }
  return null;
}

/**
 * @deprecated Préférer tryGenerateFrenchArticle. Renvoie null si échec (plus de fallback template).
 */
export async function generateFrenchArticle(params: {
  topicBrief: string;
  category: string;
  publishDateIso: string;
  title?: string;
}): Promise<GeneratedArticle | null> {
  const result = await tryGenerateFrenchArticle(params);
  return result.ok ? result.article : null;
}
