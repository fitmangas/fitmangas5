import {
  runBlogAiCascade,
  type BlogAiProviderId,
} from '@/lib/blog/ai-providers';
import {
  BLOG_MIN_BODY_WORDS,
  BLOG_SUBSTANTIAL_REWRITE_MIN_RATIO,
  BLOG_TARGET_WORDS_MAX,
  BLOG_TARGET_WORDS_MIN,
  containsArticlePilatesPlaceholder,
  countBodyWords,
  ensureValidatedBlogCta,
  looksLikeFallbackTemplate,
  sanitizeBlogContentHtml,
  stripValidatedBlogCta,
  substantialRewriteRatio,
} from '@/lib/blog/blog-content-guards';
import { PREMIUM_BLOG_AI_ORDER } from '@/lib/blog/blog-content-generator';

export type EnrichArticleResult =
  | {
      ok: true;
      contentHtml: string;
      wordsBefore: number;
      wordsAfter: number;
      rewriteRatio: number;
      provider: BlogAiProviderId;
      model: string;
    }
  | {
      ok: false;
      reason: 'generation_failed' | 'insufficient_rewrite' | 'invalid_content';
      detail: string;
      rewriteRatio?: number;
      wordsBefore?: number;
      wordsAfter?: number;
    };

function extractJsonBlock(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Enrichit un corps d’article existant (cible 1200–1800, >30% réécrit).
 * Ne touche ni au titre ni au CTA (réinjecté après).
 */
export async function enrichArticleBodyHtml(params: {
  title: string;
  contentHtml: string;
  description?: string | null;
  /** Défaut true (articles publiés). false = brouillons / non indexés. */
  requireSubstantialRewrite?: boolean;
}): Promise<EnrichArticleResult> {
  const wordsBefore = countBodyWords(params.contentHtml);
  const bodyOnly = stripValidatedBlogCta(params.contentHtml);
  const requireSubstantial = params.requireSubstantialRewrite !== false;

  const system = `Tu es rédactrice SEO senior (FitMangas / Alejandra, coach Pilates & Barre).
Tu ENRICHIS un article : réécriture substantielle (>30% du contenu réellement retravaillé), pas un polish cosmétique.
Cible: ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX} mots de contenu RÉEL et unique.
INTERDIT: remplissage creux, reformulations vides, promesse médicale / perte de poids.
Si le sujet ne porte pas ${BLOG_TARGET_WORDS_MIN} mots utiles, préfère ~900 mots denses plutôt que diluer.
Retourne STRICTEMENT un JSON: { "contentHtml": "..." } — HTML avec <h2>, <h3>, <p>, <ul>, <li>, <strong> uniquement.
NE PAS écrire le CTA final (le système l'ajoute). Termine après une courte FAQ si utile.`;

  const user = `Titre (à conserver comme fil rouge, NE PAS mettre de <h1>): ${params.title}

Chapô actuel (contexte): ${params.description?.trim() || '(aucun)'}

Corps actuel à enrichir (HTML, sans CTA):
${bodyOnly.slice(0, 14000)}

Consignes:
- Réécris et enrichis en profondeur: exemples terrain, nuances, erreurs courantes, variations, FAQ utile.
- Conserve l'intention SEO et le sujet du titre.
- Minimum ${BLOG_MIN_BODY_WORDS} mots ; idéal ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX}.
- Interdits de section template: "Pourquoi ce sujet change ta pratique", "Le contexte concret", "3 actions simples…", "Exemple terrain", "Ce que tu peux retenir".`;

  const cascade = await runBlogAiCascade(
    {
      system,
      user,
      temperature: 0.7,
      maxOutputTokens: 12288,
    },
    PREMIUM_BLOG_AI_ORDER,
  );

  if (!cascade.ok) {
    return { ok: false, reason: 'generation_failed', detail: cascade.detail, wordsBefore };
  }

  const data = extractJsonBlock(cascade.text);
  const rawHtml = typeof data?.contentHtml === 'string' ? data.contentHtml.trim() : '';
  if (!rawHtml) {
    return {
      ok: false,
      reason: 'invalid_content',
      detail: 'JSON sans contentHtml exploitable.',
      wordsBefore,
    };
  }

  let cleaned = sanitizeBlogContentHtml(rawHtml);
  cleaned = ensureValidatedBlogCta(cleaned);
  const wordsAfter = countBodyWords(cleaned);

  if (looksLikeFallbackTemplate(cleaned, params.description) || containsArticlePilatesPlaceholder(cleaned)) {
    return {
      ok: false,
      reason: 'invalid_content',
      detail: 'Contenu template / placeholder détecté — MàJ refusée.',
      wordsBefore,
      wordsAfter,
    };
  }

  if (wordsAfter < BLOG_MIN_BODY_WORDS) {
    return {
      ok: false,
      reason: 'invalid_content',
      detail: `Corps trop court après enrichissement (${wordsAfter} < ${BLOG_MIN_BODY_WORDS}).`,
      wordsBefore,
      wordsAfter,
    };
  }

  const rewriteRatio = substantialRewriteRatio(params.contentHtml, cleaned);
  if (requireSubstantial && rewriteRatio < BLOG_SUBSTANTIAL_REWRITE_MIN_RATIO) {
    return {
      ok: false,
      reason: 'insufficient_rewrite',
      detail: `Changement réel ${(rewriteRatio * 100).toFixed(0)}% < ${BLOG_SUBSTANTIAL_REWRITE_MIN_RATIO * 100}% — fausse MàJ évitée. Relance ou édite manuellement.`,
      rewriteRatio,
      wordsBefore,
      wordsAfter,
    };
  }

  return {
    ok: true,
    contentHtml: cleaned,
    wordsBefore,
    wordsAfter,
    rewriteRatio,
    provider: cascade.provider,
    model: cascade.model,
  };
}
