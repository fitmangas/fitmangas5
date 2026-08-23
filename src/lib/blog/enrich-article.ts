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

function buildEnrichPrompts(params: {
  title: string;
  description?: string | null;
  bodyOnly: string;
  lengthCorrection?: { wordsGot: number };
}): { system: string; user: string } {
  const system = `Tu es rédactrice SEO senior (FitMangas / Alejandra, coach Pilates & Barre).
Tu ENRICHIS un article : réécriture substantielle (>30% du contenu réellement retravaillé), pas un polish cosmétique.
OBLIGATOIRE: le corps final doit faire ENTRE ${BLOG_TARGET_WORDS_MIN} et ${BLOG_TARGET_WORDS_MAX} mots (contenu RÉEL, unique). Hors de cette fourchette = échec.
INTERDIT: remplissage creux, reformulations vides, promesse médicale / perte de poids, dépasser ${BLOG_TARGET_WORDS_MAX} mots.
Retourne STRICTEMENT un JSON: { "contentHtml": "..." } — HTML avec <h2>, <h3>, <p>, <ul>, <li>, <strong> uniquement.
NE PAS écrire le CTA final (le système l'ajoute). Termine après une courte FAQ si utile.`;

  const correction =
    params.lengthCorrection != null
      ? `\n\nCORRECTION: ta version précédente faisait ${params.lengthCorrection.wordsGot} mots — HORS zone. Réécris pour atterrir STRICTEMENT entre ${BLOG_TARGET_WORDS_MIN} et ${BLOG_TARGET_WORDS_MAX} mots (vise ~1500). Coupe le superflu ou densifie, sans remplissage.`
      : '';

  const user = `Titre (à conserver comme fil rouge, NE PAS mettre de <h1>): ${params.title}

Chapô actuel (contexte): ${params.description?.trim() || '(aucun)'}

Corps actuel à enrichir (HTML, sans CTA):
${params.bodyOnly.slice(0, 14000)}

Consignes:
- Réécris et enrichis en profondeur: exemples terrain, nuances, erreurs courantes, variations, FAQ utile.
- Conserve l'intention SEO et le sujet du titre.
- Longueur FINALE OBLIGATOIRE: ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX} mots (vise le milieu ~1500).
- Interdits de section template: "Pourquoi ce sujet change ta pratique", "Le contexte concret", "3 actions simples…", "Exemple terrain", "Ce que tu peux retenir".${correction}`;

  return { system, user };
}

async function generateEnrichedHtml(params: {
  title: string;
  description?: string | null;
  bodyOnly: string;
  lengthCorrection?: { wordsGot: number };
}): Promise<
  | { ok: true; cleaned: string; wordsAfter: number; provider: BlogAiProviderId; model: string }
  | { ok: false; reason: 'generation_failed' | 'invalid_content'; detail: string; wordsAfter?: number }
> {
  const { system, user } = buildEnrichPrompts(params);
  const cascade = await runBlogAiCascade(
    {
      system,
      user,
      temperature: params.lengthCorrection ? 0.55 : 0.7,
      maxOutputTokens: 12288,
    },
    PREMIUM_BLOG_AI_ORDER,
  );

  if (!cascade.ok) {
    return { ok: false, reason: 'generation_failed', detail: cascade.detail };
  }

  const data = extractJsonBlock(cascade.text);
  const rawHtml = typeof data?.contentHtml === 'string' ? data.contentHtml.trim() : '';
  if (!rawHtml) {
    return { ok: false, reason: 'invalid_content', detail: 'JSON sans contentHtml exploitable.' };
  }

  let cleaned = sanitizeBlogContentHtml(rawHtml);
  cleaned = ensureValidatedBlogCta(cleaned);
  const wordsAfter = countBodyWords(cleaned);

  if (looksLikeFallbackTemplate(cleaned, params.description) || containsArticlePilatesPlaceholder(cleaned)) {
    return {
      ok: false,
      reason: 'invalid_content',
      detail: 'Contenu template / placeholder détecté — MàJ refusée.',
      wordsAfter,
    };
  }

  if (wordsAfter < BLOG_MIN_BODY_WORDS) {
    return {
      ok: false,
      reason: 'invalid_content',
      detail: `Corps trop court après enrichissement (${wordsAfter} < ${BLOG_MIN_BODY_WORDS}).`,
      wordsAfter,
    };
  }

  return {
    ok: true,
    cleaned,
    wordsAfter,
    provider: cascade.provider,
    model: cascade.model,
  };
}

/**
 * Enrichit un corps d’article existant (cible 1200–1800, >30% réécrit).
 * Ne touche ni au titre ni au CTA (réinjecté après).
 * Refuse de sauvegarder hors zone idéale (1 retry auto si hors fourchette).
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

  let generated = await generateEnrichedHtml({
    title: params.title,
    description: params.description,
    bodyOnly,
  });

  if (!generated.ok) {
    return {
      ok: false,
      reason: generated.reason,
      detail: generated.detail,
      wordsBefore,
      wordsAfter: generated.wordsAfter,
    };
  }

  // Hors zone idéale → une seule correction auto, sinon refus (évite « Long » / « Sous idéal » sauvés).
  if (generated.wordsAfter < BLOG_TARGET_WORDS_MIN || generated.wordsAfter > BLOG_TARGET_WORDS_MAX) {
    const retry = await generateEnrichedHtml({
      title: params.title,
      description: params.description,
      bodyOnly: stripValidatedBlogCta(generated.cleaned),
      lengthCorrection: { wordsGot: generated.wordsAfter },
    });
    if (!retry.ok) {
      return {
        ok: false,
        reason: retry.reason,
        detail: `Hors zone (${generated.wordsAfter} mots) puis retry échoué: ${retry.detail}`,
        wordsBefore,
        wordsAfter: retry.wordsAfter ?? generated.wordsAfter,
      };
    }
    generated = retry;
  }

  if (generated.wordsAfter < BLOG_TARGET_WORDS_MIN || generated.wordsAfter > BLOG_TARGET_WORDS_MAX) {
    return {
      ok: false,
      reason: 'invalid_content',
      detail: `Longueur hors zone idéale après 2 essais (${generated.wordsAfter} mots ; cible ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX}). Relance ou édite manuellement.`,
      wordsBefore,
      wordsAfter: generated.wordsAfter,
    };
  }

  const rewriteRatio = substantialRewriteRatio(params.contentHtml, generated.cleaned);
  if (requireSubstantial && rewriteRatio < BLOG_SUBSTANTIAL_REWRITE_MIN_RATIO) {
    return {
      ok: false,
      reason: 'insufficient_rewrite',
      detail: `Changement réel ${(rewriteRatio * 100).toFixed(0)}% < ${BLOG_SUBSTANTIAL_REWRITE_MIN_RATIO * 100}% — fausse MàJ évitée. Relance ou édite manuellement.`,
      rewriteRatio,
      wordsBefore,
      wordsAfter: generated.wordsAfter,
    };
  }

  return {
    ok: true,
    contentHtml: generated.cleaned,
    wordsBefore,
    wordsAfter: generated.wordsAfter,
    rewriteRatio,
    provider: generated.provider,
    model: generated.model,
  };
}
