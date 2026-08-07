import { runBlogAiCascade, type BlogAiProviderId } from '@/lib/blog/ai-providers';
import {
  assertTitleDiversity,
  buildTitleDiversityPromptBlock,
  preferredMoldsForContext,
  type TitleDiversityContext,
} from '@/lib/blog/blog-title-diversity';
import { translateText } from '@/lib/blog/translate';
import { BLOG_SEO_TITLE_MAX, enforceBlogSeoTitle } from '@/lib/blog/blog-seo-limits';

export type GeneratedBlogTitles = {
  title_fr: string;
  title_es: string;
  provider?: BlogAiProviderId;
  model?: string;
};

export type TitleGenerationFailureReason =
  | 'no_api_key'
  | 'quota_exhausted'
  | 'invalid_response'
  | 'provider_error'
  | 'generation_failed';

export type TitleGenerationAttemptResult =
  | { ok: true; titles: GeneratedBlogTitles }
  | { ok: false; reason: TitleGenerationFailureReason; detail?: string };

const GENERIC_TITLE_RE = /^Article pilates \d+\s*[—–-]\s*mouvement\s*&\s*souffle$/i;

export function isGenericPilatesTitle(title: string | null | undefined): boolean {
  if (!title?.trim()) return false;
  return GENERIC_TITLE_RE.test(title.trim());
}

const CATEGORY_LABELS_FR: Record<string, string> = {
  technique: 'technique',
  respiration: 'respiration',
  posture: 'posture & alignement',
  'posture-alignement': 'posture & alignement',
  renforcement: 'renforcement',
  'bien-etre': 'bien-être',
  nutrition: 'nutrition légère',
};

export function categoryLabelFr(categorySlug: string): string {
  const key = categorySlug.toLowerCase().trim().replace(/\s+/g, '-');
  return CATEGORY_LABELS_FR[key] ?? categorySlug.replace(/-/g, ' ');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

function normalizeTitle(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function isAcceptableTitle(title: string): boolean {
  // Score SEO admin exige title.length < 60 → max 59. Ancien plafond 72 = bug (titres « OK » mais croix rouge).
  if (title.length < 36 || title.length > BLOG_SEO_TITLE_MAX) return false;
  if (isGenericPilatesTitle(title)) return false;
  if (/article\s+pilates\s+\d+/i.test(title)) return false;
  return true;
}

function fallbackTitles(params: {
  contentHtmlFr: string;
  descriptionFr?: string;
  categorySlug: string;
}): GeneratedBlogTitles {
  const h2Headings = [...params.contentHtmlFr.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)]
    .map((match) => match[1].replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const specificH2 = h2Headings.find((heading) => !/pourquoi ce sujet change ta pratique/i.test(heading));
  const plain = stripHtml(params.contentHtmlFr);
  const base =
    params.descriptionFr?.trim() ||
    specificH2 ||
    h2Headings[0] ||
    plain.split(/[.!?]/).find((sentence) => sentence.trim().length > 24)?.trim() ||
    plain.slice(0, 55);
  const sanitized = base
    .replace(/article\s+pilates\s+\d+[^.!?—–-]*/gi, '')
    .replace(/description courte pour l['’]article\s+\d+\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const category = categoryLabelFr(params.categorySlug);
  const topic = sanitized || category;
  const title_fr = topic.slice(0, BLOG_SEO_TITLE_MAX).trim();
  return {
    title_fr: title_fr.length >= 20 ? title_fr : enforceBlogSeoTitle(`${topic} — ${category}`),
    title_es: enforceBlogSeoTitle(`${topic.slice(0, 50).trim()} — pilates`),
  };
}

async function fallbackTitlesAsync(params: {
  contentHtmlFr: string;
  descriptionFr?: string;
  categorySlug: string;
}): Promise<GeneratedBlogTitles> {
  const local = fallbackTitles(params);
  const translatedEs = await translateText(local.title_fr, 'es');
  const title_es =
    translatedEs && isAcceptableTitle(translatedEs) ? translatedEs : local.title_es;
  return { title_fr: local.title_fr, title_es };
}

function isAcceptableSpanishTitle(title: string): boolean {
  if (!isAcceptableTitle(title)) return false;
  if (/pourquoi|votre pratique|mouvement\s*&\s*souffle|essentielle du|le souffle|harmonie essentielle/i.test(title)) {
    return false;
  }
  return true;
}

function parseTitles(
  raw: string,
  provider?: BlogAiProviderId,
  model?: string,
): GeneratedBlogTitles | null {
  const data = extractJsonBlock(raw);
  if (!data) return null;
  const title_fr = enforceBlogSeoTitle(normalizeTitle(data.title_fr));
  const title_es = enforceBlogSeoTitle(normalizeTitle(data.title_es));
  if (!isAcceptableTitle(title_fr) || !isAcceptableSpanishTitle(title_es)) return null;
  return { title_fr, title_es, provider, model };
}

function buildTitlePrompt(params: {
  contentHtmlFr: string;
  categorySlug: string;
  descriptionFr?: string;
  contentHtmlEs?: string | null;
  descriptionEs?: string | null;
  diversity?: TitleDiversityContext;
}): { system: string; user: string } {
  const category = categoryLabelFr(params.categorySlug);
  const frExcerpt = stripHtml(params.contentHtmlFr).slice(0, 6000);
  const esExcerpt = params.contentHtmlEs ? stripHtml(params.contentHtmlEs).slice(0, 4000) : '';
  const descFr = params.descriptionFr?.trim() ?? '';
  const descEs = params.descriptionEs?.trim() ?? '';
  const diversityCtx: TitleDiversityContext = params.diversity ?? { recentTitles: [] };
  const preferred = preferredMoldsForContext(diversityCtx);

  const system =
    'Tu es rédactrice SEO pour un blog pilates / barre premium (FitMangas). Tu réponds uniquement avec un JSON valide {"title_fr":"...","title_es":"..."}.';

  const user = `À partir du contenu réel de l'article ci-dessous, propose deux titres qui donnent envie de cliquer.

Catégorie éditoriale: ${category}

Chapo FR: ${descFr || '(non fourni)'}

Contenu FR (texte extrait):
${frExcerpt}

${esExcerpt ? `Contenu ES (texte extrait, pour inspirer le titre espagnol):\n${esExcerpt}\n` : ''}
${descEs ? `Chapo ES: ${descEs}\n` : ''}

Règles STRICTES:
- title_fr: OBLIGATOIREMENT 45 à 59 caractères (STRICTEMENT moins de 60 — Google tronque au-delà). Compte-les.
- title_es: OBLIGATOIREMENT 45 à 59 caractères (STRICTEMENT moins de 60), espagnol naturel (PAS une traduction mot à mot du français)
- Viser une requête précise, pas seulement "pilates" (ex: respiration pilates, posture bureau, mal de dos, abdos profonds, routine débutant)
- Prioriser les clusters FitMangas quand c'est cohérent: pilates en ligne, cours pilates visio, pilates débutant maison
- Éviter de cannibaliser les pages piliers: le titre doit cibler un sous-sujet précis, pas reprendre seulement "Pilates en ligne" ou "Cours de Pilates en visio"
- Donner envie de cliquer sans promesse médicale ni sensationnalisme
- Cohérent avec la catégorie et le contenu réel
- INTERDIT: "Article pilates", numéros d'article, formulations génériques vagues ("mouvement & souffle"), titres trop courts
- Pas de guillemets autour des titres
- Gabarit préféré pour CE titre (choisis-en UN): ${preferred[0] ?? 'question'}
- Exemples de gabarits à faire tourner: question ("Pourquoi ton dos lâche à 15h ?"), affirmation-bénéfice, mythe cassé ("Le Pilates ne muscle pas — vraiment ?"), scène concrète, chiffre (durée) — PAS toujours "N astuces pour…"

${buildTitleDiversityPromptBlock(diversityCtx)}`;

  return { system, user };
}

function acceptTitlesIfDiverse(
  titles: GeneratedBlogTitles,
  diversity: TitleDiversityContext | undefined,
  angleHint?: string,
): GeneratedBlogTitles | null {
  if (!diversity) return titles;
  const check = assertTitleDiversity(titles.title_fr, diversity, { angleHint });
  if (!check.ok) {
    console.info(`[generateBlogTitles] titre rejeté (diversité): ${check.reason}`);
    return null;
  }
  return titles;
}

export async function tryGenerateBlogTitlesFromContentDetailed(params: {
  contentHtmlFr: string;
  categorySlug: string;
  descriptionFr?: string;
  contentHtmlEs?: string | null;
  descriptionEs?: string | null;
  providerOrder?: import('@/lib/blog/ai-providers').BlogAiProviderId[];
  /** Titres / angles récents pour anti-répétition de moule. */
  diversity?: TitleDiversityContext;
}): Promise<TitleGenerationAttemptResult> {
  const diversity = params.diversity ?? { recentTitles: [] };
  const angleHint = `${params.descriptionFr ?? ''} ${params.categorySlug}`;
  let lastDiversityReject = '';

  // Jusqu’à 2 passes : 1re génération + 1 régénération si moule/angle en conflit.
  for (let pass = 0; pass < 2; pass += 1) {
    const diversityForPass: TitleDiversityContext = {
      ...diversity,
      forbidNTips: pass > 0 && lastDiversityReject.includes('N astuces'),
    };
    const { system, user } = buildTitlePrompt({ ...params, diversity: diversityForPass });
    const cascade = await runBlogAiCascade(
      {
        system,
        user,
        temperature: pass === 0 ? 0.65 : 0.85,
        maxOutputTokens: 1024,
      },
      params.providerOrder,
    );

    if (!cascade.ok) {
      const quotaOnly =
        cascade.attempts.length > 0 &&
        cascade.attempts.every((a) => a.reason === 'quota_exhausted' || a.reason === 'no_api_key');
      if (cascade.attempts.every((a) => a.reason === 'no_api_key')) {
        return { ok: false, reason: 'no_api_key', detail: cascade.detail };
      }
      if (quotaOnly || cascade.attempts.some((a) => a.reason === 'quota_exhausted')) {
        return { ok: false, reason: 'quota_exhausted', detail: cascade.detail };
      }
      if (pass === 1) {
        return { ok: false, reason: 'generation_failed', detail: cascade.detail };
      }
      continue;
    }

    const tryAccept = (raw: string, provider?: BlogAiProviderId, model?: string) => {
      const parsed = parseTitles(raw, provider, model);
      if (!parsed) return null;
      return acceptTitlesIfDiverse(parsed, diversity, angleHint);
    };

    let accepted = tryAccept(cascade.text, cascade.provider, cascade.model);
    if (!accepted) {
      const parsedOnce = parseTitles(cascade.text, cascade.provider, cascade.model);
      if (parsedOnce) {
        const check = assertTitleDiversity(parsedOnce.title_fr, diversity, { angleHint });
        if (!check.ok) lastDiversityReject = check.reason;
      }

      const { completeWithProvider, listConfiguredBlogAiProviders } = await import('@/lib/blog/ai-providers');
      for (const provider of listConfiguredBlogAiProviders(params.providerOrder)) {
        if (provider === cascade.provider && pass === 0) continue;
        const result = await completeWithProvider(provider, {
          system,
          user,
          temperature: 0.8,
          maxOutputTokens: 1024,
        });
        if (!result.ok) continue;
        accepted = tryAccept(result.text, result.provider, result.model);
        if (accepted) break;
        const parsed = parseTitles(result.text, result.provider, result.model);
        if (parsed) {
          const check = assertTitleDiversity(parsed.title_fr, diversity, { angleHint });
          if (!check.ok) lastDiversityReject = check.reason;
        }
      }
    }

    if (accepted) {
      console.info(`[generateBlogTitles] titres générés par ${accepted.provider}/${accepted.model}`);
      return { ok: true, titles: accepted };
    }

    if (pass === 1) {
      return {
        ok: false,
        reason: 'invalid_response',
        detail: lastDiversityReject
          ? `Anti-répétition: ${lastDiversityReject}`
          : `JSON titres invalide (${cascade.provider}).`,
      };
    }
  }

  return {
    ok: false,
    reason: 'invalid_response',
    detail: lastDiversityReject || 'Échec génération titres (diversité).',
  };
}

export async function tryGenerateBlogTitlesFromContent(params: {
  contentHtmlFr: string;
  categorySlug: string;
  descriptionFr?: string;
  contentHtmlEs?: string | null;
  descriptionEs?: string | null;
}): Promise<GeneratedBlogTitles | null> {
  const result = await tryGenerateBlogTitlesFromContentDetailed(params);
  return result.ok ? result.titles : null;
}

/**
 * Génère titres via IA. Échec total → throw (plus de fallbackTitles silencieux).
 */
export async function generateBlogTitlesFromContent(params: {
  contentHtmlFr: string;
  categorySlug: string;
  descriptionFr?: string;
  contentHtmlEs?: string | null;
  descriptionEs?: string | null;
}): Promise<GeneratedBlogTitles> {
  const fromAi = await tryGenerateBlogTitlesFromContent(params);
  if (fromAi) return fromAi;
  throw new Error('Génération titres blog échouée — aucun titre de secours injecté.');
}

export function buildTopicBrief(categorySlug: string, index: number, description?: string): string {
  const category = categoryLabelFr(categorySlug);
  const desc = description?.trim();
  if (desc && !/^Conseils pilates pratiques pour l/i.test(desc) && !/^Description courte pour/i.test(desc)) {
    return desc;
  }
  // Pas de seed « Article pilates sur le thème… » (placeholder bloqué à la publication).
  throw new Error(
    `Brief topic manquant pour « ${category} » (série ${index}) — fournis une description concrète, pas un placeholder.`,
  );
}
