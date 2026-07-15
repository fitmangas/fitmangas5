import {
  runBlogAiCascade,
  type BlogAiProviderId,
} from '@/lib/blog/ai-providers';
import {
  looksLikeFallbackTemplate,
  sanitizeBlogContentHtml,
} from '@/lib/blog/blog-content-guards';

export type GeneratedArticle = {
  contentHtml: string;
  description: string;
  metaDescription: string;
  seoKeywords: string;
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

function buildPrompts(params: { topicBrief: string; category: string; publishDateIso: string }): {
  system: string;
  user: string;
} {
  const system = `Tu es copywriter SEO expert d'un blog pilates premium. Tu écris en français naturel, clair et professionnel.
Objectif stratégique FitMangas: construire des clusters SEO autour de 3 pages piliers:
- Pilates en ligne (/pilates-en-ligne)
- Cours de Pilates en visio (/cours-pilates-visio)
- Pilates débutant à la maison (/pilates-debutant-maison)
Retourne STRICTEMENT un JSON avec ces clés:
- contentHtml (article en HTML, 700 à 950 mots, avec <h2>, <h3>, <p>, <ul>, <li>, <strong>, et une courte section FAQ en fin d'article)
- description (120 à 160 caractères)
- metaDescription (140 à 155 caractères)
- seoKeywords (5 à 8 mots-clés longue traîne séparés par virgules, sans répéter le titre complet)`;

  const user = `Brief éditorial: ${params.topicBrief}
Catégorie: ${params.category}
Date publication: ${params.publishDateIso}

Contraintes:
- le contenu doit être spécifique au brief (pas de titre générique type "Article pilates X")
- viser une intention de recherche précise (ex: douleur dos pilates débutant, respiration pilates, posture bureau)
- rattacher l'article à UN cluster principal: pilates en ligne, cours pilates visio, ou pilates débutant maison
- traiter une question précise du cluster sans cannibaliser la page pilier (ne pas écrire un guide général "Pilates en ligne" si l'article doit être un sous-sujet)
- proposer un angle longue traîne clair (ex: routine pilates débutant maison, respiration pilates en ligne, posture pilates visio, abdos profonds pilates débutant)
- intégrer naturellement le mot-clé principal dans l'introduction, un <h2> et la conclusion
- inclure dans la FAQ une question qui renvoie naturellement vers la pratique en ligne / visio / maison, sans lien HTML
- texte actionnable, motivant, sans jargon inutile
- intro accrocheuse qui répond à un problème concret
- 3-5 conseils concrets
- une mini-story réaliste
- conclusion avec CTA doux vers FitMangas
- ne pas inventer de liens HTML externes ; le site ajoutera le maillage interne automatiquement
- ne pas promettre de résultat médical, de perte de poids garantie ou de guérison
- INTERDIT: textes génériques type "Pourquoi ce sujet change ta pratique" ou "Un guide concret pour progresser en pilates"`;

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

  const cleanedHtml = sanitizeBlogContentHtml(contentHtml);
  if (!cleanedHtml || cleanedHtml.length < 600) return null;
  if (looksLikeFallbackTemplate(cleanedHtml, description)) return null;

  return {
    contentHtml: cleanedHtml,
    description:
      truncateAtSentence(
        description || cleanedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        160,
      ),
    metaDescription:
      truncateAtSentence(
        metaDescription ||
          description ||
          cleanedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        155,
      ),
    seoKeywords: seoKeywords || 'pilates, posture, respiration, bien-être',
    provider,
    model,
  };
}

/**
 * Génère un article via la cascade Gemini → Mistral → Groq → OpenAI.
 * Ne renvoie JAMAIS le template de secours : en cas d’échec total → generation_failed.
 */
/** Qualité éditoriale prioritaire : Gemini puis Mistral (sans Groq). */
export const PREMIUM_BLOG_AI_ORDER: BlogAiProviderId[] = ['gemini', 'mistral'];

export async function tryGenerateFrenchArticle(params: {
  topicBrief: string;
  category: string;
  publishDateIso: string;
  /** Ordre de cascade optionnel (ex. PREMIUM_BLOG_AI_ORDER). */
  providerOrder?: BlogAiProviderId[];
}): Promise<ArticleGenerationAttemptResult> {
  const { system, user } = buildPrompts(params);
  const cascade = await runBlogAiCascade(
    {
      system,
      user,
      temperature: 0.8,
      maxOutputTokens: 8192,
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
    // Un provider a répondu mais JSON invalide → tenter encore les providers suivants serait idéal ;
    // runBlogAiCascade s’arrête au premier texte. On relance en excluant le provider fautif via
    // une 2e passe manuelle sur les providers restants.
    const retry = await retryParseAcrossProviders(params, cascade.provider, params.providerOrder);
    if (retry) return { ok: true, article: retry };
    return {
      ok: false,
      reason: 'generation_failed',
      detail: `Réponse JSON invalide ou contenu template de ${cascade.provider}.`,
    };
  }

  console.info(
    `[generateFrenchArticle] contenu généré par ${article.provider}/${article.model}`,
  );
  return { ok: true, article };
}

async function retryParseAcrossProviders(
  params: {
    topicBrief: string;
    category: string;
    publishDateIso: string;
  },
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
      temperature: 0.8,
      maxOutputTokens: 8192,
    });
    if (!result.ok) continue;
    const parsed = parseGeneratedArticle(result.text, result.provider, result.model);
    if (parsed) {
      console.info(
        `[generateFrenchArticle] contenu généré par ${parsed.provider}/${parsed.model} (retry)`,
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
}): Promise<GeneratedArticle | null> {
  const result = await tryGenerateFrenchArticle(params);
  return result.ok ? result.article : null;
}
