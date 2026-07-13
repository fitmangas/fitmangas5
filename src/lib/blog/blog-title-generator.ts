import { GoogleGenAI } from '@google/genai';

import { translateText } from '@/lib/blog/translate';

export type GeneratedBlogTitles = {
  title_fr: string;
  title_es: string;
};

export type TitleGenerationFailureReason =
  | 'no_api_key'
  | 'quota_exhausted'
  | 'invalid_response'
  | 'provider_error';

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
  if (title.length < 20 || title.length > 72) return false;
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
  const title_fr = topic.slice(0, 60).trim();
  return {
    title_fr: title_fr.length >= 20 ? title_fr : `${topic} — ${category}`.slice(0, 60).trim(),
    title_es: `${topic.slice(0, 50).trim()} — pilates`.slice(0, 60).trim(),
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

function retryDelayMs(error: unknown, attempt: number): number {
  const message = error instanceof Error ? error.message : String(error);
  const match = /retry in ([0-9.]+)s/i.exec(message);
  if (match) return Math.ceil(Number(match[1]) * 1000) + 500;
  return Math.min(60_000, 12_000 * (attempt + 1));
}

function isAcceptableSpanishTitle(title: string): boolean {
  if (!isAcceptableTitle(title)) return false;
  if (/pourquoi|votre pratique|mouvement\s*&\s*souffle|essentielle du|le souffle|harmonie essentielle/i.test(title)) {
    return false;
  }
  return true;
}

function parseTitles(raw: string): GeneratedBlogTitles | null {
  const data = extractJsonBlock(raw);
  if (!data) return null;
  const title_fr = normalizeTitle(data.title_fr);
  const title_es = normalizeTitle(data.title_es);
  if (!isAcceptableTitle(title_fr) || !isAcceptableSpanishTitle(title_es)) return null;
  return { title_fr, title_es };
}

function buildTitlePrompt(params: {
  contentHtmlFr: string;
  categorySlug: string;
  descriptionFr?: string;
  contentHtmlEs?: string | null;
  descriptionEs?: string | null;
}): string {
  const category = categoryLabelFr(params.categorySlug);
  const frExcerpt = stripHtml(params.contentHtmlFr).slice(0, 6000);
  const esExcerpt = params.contentHtmlEs ? stripHtml(params.contentHtmlEs).slice(0, 4000) : '';
  const descFr = params.descriptionFr?.trim() ?? '';
  const descEs = params.descriptionEs?.trim() ?? '';

  return `Tu es rédactrice SEO pour un blog pilates / barre premium (FitMangas, ton bienveillant et expert).
À partir du contenu réel de l'article ci-dessous, propose deux titres qui donnent envie de cliquer.

Catégorie éditoriale: ${category}

Chapo FR: ${descFr || '(non fourni)'}

Contenu FR (texte extrait):
${frExcerpt}

${esExcerpt ? `Contenu ES (texte extrait, pour inspirer le titre espagnol):\n${esExcerpt}\n` : ''}
${descEs ? `Chapo ES: ${descEs}\n` : ''}

Règles STRICTES:
- title_fr: 40 à 60 caractères, français naturel, accrocheur, bénéfice ou angle clair
- title_es: 40 à 60 caractères, espagnol naturel (PAS une traduction mot à mot du français)
- Cohérent avec la catégorie et le contenu réel
- INTERDIT: "Article pilates", numéros d'article, formulations génériques vagues ("mouvement & souffle")
- Pas de guillemets autour des titres

Réponds UNIQUEMENT en JSON: {"title_fr":"...","title_es":"..."}`;
}

function isGeminiRateLimitError(message: string): boolean {
  return message.includes('429') || message.includes('RESOURCE_EXHAUSTED');
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<TitleGenerationAttemptResult> {
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });
  const maxAttempts = 5;
  let lastDetail: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { temperature: 0.65, maxOutputTokens: 1024 },
      });
      const parsed = parseTitles(response.text ?? '');
      if (parsed) return { ok: true, titles: parsed };
      return { ok: false, reason: 'invalid_response', detail: 'Réponse Gemini sans titres valides.' };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      lastDetail = message;
      const isRateLimited = isGeminiRateLimitError(message);
      if (isRateLimited && attempt < maxAttempts - 1) {
        const waitMs = retryDelayMs(e, attempt);
        console.warn(`[generateBlogTitlesFromContent] Quota Gemini — nouvel essai dans ${Math.round(waitMs / 1000)}s…`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      console.error('[generateBlogTitlesFromContent] Gemini', e);
      if (isRateLimited) {
        return { ok: false, reason: 'quota_exhausted', detail: message };
      }
      return { ok: false, reason: 'provider_error', detail: message };
    }
  }

  return {
    ok: false,
    reason: 'quota_exhausted',
    detail: lastDetail ?? 'Quota Gemini épuisé après plusieurs tentatives.',
  };
}

async function generateWithOpenAI(prompt: string, apiKey: string): Promise<TitleGenerationAttemptResult> {
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      messages: [
        {
          role: 'system',
          content: 'Tu réponds uniquement avec un JSON valide {"title_fr":"...","title_es":"..."}.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    console.error('[generateBlogTitlesFromContent] OpenAI', response.status, body);
    if (response.status === 429) {
      return { ok: false, reason: 'quota_exhausted', detail: `OpenAI 429: ${body.slice(0, 200)}` };
    }
    return { ok: false, reason: 'provider_error', detail: `OpenAI ${response.status}` };
  }
  const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const parsed = parseTitles(json.choices?.[0]?.message?.content ?? '');
  if (parsed) return { ok: true, titles: parsed };
  return { ok: false, reason: 'invalid_response', detail: 'Réponse OpenAI sans titres valides.' };
}

export async function tryGenerateBlogTitlesFromContentDetailed(params: {
  contentHtmlFr: string;
  categorySlug: string;
  descriptionFr?: string;
  contentHtmlEs?: string | null;
  descriptionEs?: string | null;
}): Promise<TitleGenerationAttemptResult> {
  const prompt = buildTitlePrompt(params);
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (!geminiKey && !openaiKey) {
    return { ok: false, reason: 'no_api_key', detail: 'GEMINI_API_KEY et OPENAI_API_KEY absents.' };
  }

  let geminiFailure: TitleGenerationAttemptResult | null = null;

  if (geminiKey) {
    const fromGemini = await generateWithGemini(prompt, geminiKey);
    if (fromGemini.ok) return fromGemini;
    geminiFailure = fromGemini;
  }

  if (openaiKey) {
    const fromOpenai = await generateWithOpenAI(prompt, openaiKey);
    if (fromOpenai.ok) return fromOpenai;
    if (geminiFailure && !geminiFailure.ok && geminiFailure.reason === 'quota_exhausted') {
      return geminiFailure;
    }
    return fromOpenai;
  }

  return geminiFailure ?? { ok: false, reason: 'no_api_key' };
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

export async function generateBlogTitlesFromContent(params: {
  contentHtmlFr: string;
  categorySlug: string;
  descriptionFr?: string;
  contentHtmlEs?: string | null;
  descriptionEs?: string | null;
}): Promise<GeneratedBlogTitles> {
  const fromAi = await tryGenerateBlogTitlesFromContent(params);
  if (fromAi) return fromAi;
  return fallbackTitlesAsync(params);
}

export function buildTopicBrief(categorySlug: string, index: number, description?: string): string {
  const category = categoryLabelFr(categorySlug);
  const desc = description?.trim();
  if (desc && !/^Conseils pilates pratiques pour l/i.test(desc) && !/^Description courte pour/i.test(desc)) {
    return desc;
  }
  return `Article pilates sur le thème « ${category} » : conseils concrets, routine réaliste et progression douce (série ${index}).`;
}
