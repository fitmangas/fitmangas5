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
  const system = `Tu es copywriter expert d'un blog pilates premium. Tu écris en français naturel, clair et professionnel.
Retourne STRICTEMENT un JSON avec ces clés:
- contentHtml (article en HTML, 350 à 500 mots, avec <h2>, <h3>, <p>, <ul>, <li>, <strong>)
- description (160 caractères max)
- metaDescription (155 caractères max)
- seoKeywords (liste séparée par virgules)`;

  const user = `Brief éditorial: ${params.topicBrief}
Catégorie: ${params.category}
Date publication: ${params.publishDateIso}

Contraintes:
- le contenu doit être spécifique au brief (pas de titre générique type "Article pilates X")
- texte actionnable, motivant, sans jargon inutile
- intro accrocheuse
- 2-3 conseils concrets
- une mini-story réaliste
- conclusion avec CTA doux
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
      description || cleanedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160),
    metaDescription:
      metaDescription ||
      description.slice(0, 155) ||
      cleanedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 155),
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
