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
  idealZoneOutOfRangeDetail,
  isIdealBodyWordCount,
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
  return out;
}

function extractContentHtmlFromLooseText(raw: string): string | null {
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenced?.[1] && /<(?:h2|h3|p)\b/i.test(fenced[1])) {
    return fenced[1].trim();
  }
  const keyMatch = raw.match(/"contentHtml"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"[a-zA-Z]+"|})/);
  if (keyMatch?.[1]) {
    try {
      return JSON.parse(`"${keyMatch[1]}"`) as string;
    } catch {
      return keyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }
  // Dernier recours : gros bloc HTML dans la réponse
  const htmlStart = raw.search(/<(?:h2|h3|p)\b/i);
  if (htmlStart >= 0) {
    const chunk = raw.slice(htmlStart).replace(/```[\s\S]*$/, '').trim();
    if (chunk.length > 400 && /<\/(?:h2|h3|p)>/i.test(chunk)) return chunk;
  }
  return null;
}

function extractJsonBlock(raw: string): Record<string, unknown> | null {
  const repaired = repairAiJson(raw);
  const start = repaired.indexOf('{');
  const end = repaired.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(repaired.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      // continue
    }
  }
  const looseHtml = extractContentHtmlFromLooseText(raw);
  if (looseHtml) return { contentHtml: looseHtml };
  return null;
}

function buildEnrichPrompts(params: {
  title: string;
  description?: string | null;
  bodyOnly: string;
  lengthCorrection?: { wordsGot: number };
  banTemplateRetry?: boolean;
}): { system: string; user: string } {
  const system = `Tu es rédactrice SEO senior (FitMangas / Alejandra, coach Pilates & Barre).
Tu ENRICHIS un article : réécriture substantielle (>30% du contenu réellement retravaillé), pas un polish cosmétique.
OBLIGATOIRE: le corps final doit faire ENTRE ${BLOG_TARGET_WORDS_MIN} et ${BLOG_TARGET_WORDS_MAX} mots (contenu RÉEL, unique). Hors de cette fourchette = échec.
INTERDIT: remplissage creux, reformulations vides, promesse médicale / perte de poids, dépasser ${BLOG_TARGET_WORDS_MAX} mots.
INTERDIT: titres génériques seed « Mouvement & Souffle : L'Harmonie Essentielle », « Article pilates N », sections template listées plus bas.
Retourne STRICTEMENT un JSON: { "contentHtml": "..." } — HTML avec <h2>, <h3>, <p>, <ul>, <li>, <strong> uniquement.
Échappe correctement les guillemets dans le JSON. NE PAS écrire le CTA final (le système l'ajoute). Termine après une courte FAQ si utile.`;

  const correction =
    params.lengthCorrection != null
      ? params.lengthCorrection.wordsGot > BLOG_TARGET_WORDS_MAX
        ? `\n\nCORRECTION LONGUEUR: ta version précédente faisait ${params.lengthCorrection.wordsGot} mots — TROP LONG. Coupe agressivement (sections redondantes, exemples en trop, FAQ trop longue). Cible STRICTE: ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX} mots, vise ~1450. Pas de remplissage.`
        : `\n\nCORRECTION: ta version précédente faisait ${params.lengthCorrection.wordsGot} mots — HORS zone. Réécris pour atterrir STRICTEMENT entre ${BLOG_TARGET_WORDS_MIN} et ${BLOG_TARGET_WORDS_MAX} mots (vise ~1500). Coupe le superflu ou densifie, sans remplissage.`
      : '';

  const banRetry = params.banTemplateRetry
    ? `\n\nCORRECTION ANTI-TEMPLATE: ta version précédente a été refusée (titres / sections seed). Réécris entièrement autour du titre ci-dessous. Interdits absolus: « Mouvement & Souffle : L'Harmonie Essentielle », « Article pilates », « Pourquoi ce sujet change ta pratique », « Le contexte concret », « Exemple terrain », « Ce que tu peux retenir », « 3 actions simples ».`
    : '';

  // Corps source : on retire les H2 seed pour ne pas les réinjecter
  const cleanedSource = params.bodyOnly
    .replace(/<h[1-3][^>]*>\s*Mouvement\s*&\s*Souffle[\s\S]*?<\/h[1-3]>/gi, '')
    .replace(/##\s*Mouvement\s*&\s*Souffle[^\n]*/gi, '')
    .slice(0, 14000);

  const user = `Titre (à conserver comme fil rouge, NE PAS mettre de <h1>): ${params.title}

Chapô actuel (contexte): ${params.description?.trim() || '(aucun)'}

Corps actuel à enrichir (HTML, sans CTA):
${cleanedSource}

Consignes:
- Réécris et enrichis en profondeur: exemples terrain concrets (sans titre « Exemple terrain »), nuances, erreurs courantes, variations, FAQ utile.
- Les <h2> doivent paraphraser le titre / le sujet réel — jamais le H2 seed « Mouvement & Souffle… ».
- Conserve l'intention SEO et le sujet du titre.
- Longueur FINALE OBLIGATOIRE: ${BLOG_TARGET_WORDS_MIN}–${BLOG_TARGET_WORDS_MAX} mots (vise le milieu ~1500).
- Interdits de section template: "Pourquoi ce sujet change ta pratique", "Le contexte concret", "3 actions simples…", "Exemple terrain", "Ce que tu peux retenir".${correction}${banRetry}`;

  return { system, user };
}

async function generateEnrichedHtml(params: {
  title: string;
  description?: string | null;
  bodyOnly: string;
  lengthCorrection?: { wordsGot: number };
  banTemplateRetry?: boolean;
}): Promise<
  | { ok: true; cleaned: string; wordsAfter: number; provider: BlogAiProviderId; model: string }
  | { ok: false; reason: 'generation_failed' | 'invalid_content'; detail: string; wordsAfter?: number }
> {
  const { system, user } = buildEnrichPrompts(params);
  const cascade = await runBlogAiCascade(
    {
      system,
      user,
      temperature: params.lengthCorrection || params.banTemplateRetry ? 0.55 : 0.7,
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

  // 1er échec template / JSON → un retry avec consignes anti-seed renforcées
  if (
    !generated.ok &&
    generated.reason === 'invalid_content' &&
    /template|placeholder|contentHtml/i.test(generated.detail)
  ) {
    generated = await generateEnrichedHtml({
      title: params.title,
      description: params.description,
      bodyOnly,
      banTemplateRetry: true,
    });
  }

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
  if (!isIdealBodyWordCount(generated.wordsAfter)) {
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

  if (!isIdealBodyWordCount(generated.wordsAfter)) {
    return {
      ok: false,
      reason: 'invalid_content',
      detail: `${idealZoneOutOfRangeDetail(generated.wordsAfter)} Après 2 essais.`,
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
