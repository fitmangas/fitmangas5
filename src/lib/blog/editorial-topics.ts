import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { GoogleGenAI } from '@google/genai';

import { categoryLabelFr } from '@/lib/blog/blog-title-generator';

export type EditorialTopic = {
  id: string;
  categorySlug: string;
  briefFr: string;
};

const CATEGORY_SLUGS = ['technique', 'respiration', 'posture', 'renforcement', 'bien-etre', 'nutrition'] as const;

const STATIC_POOL_PATH = resolve(process.cwd(), 'data/blog-editorial-topics.json');

function slugifyTopicId(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function hashBrief(brief: string): string {
  return createHash('sha256').update(brief.trim().toLowerCase()).digest('hex').slice(0, 10);
}

export function loadStaticTopicPool(): EditorialTopic[] {
  try {
    const raw = readFileSync(STATIC_POOL_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { topics?: EditorialTopic[] };
    return (parsed.topics ?? []).filter((topic) => topic.id && topic.categorySlug && topic.briefFr);
  } catch {
    return [];
  }
}

function normalizeCategorySlug(categorySlug: string): string {
  const key = categorySlug.toLowerCase().trim();
  if (key.includes('posture') || key.includes('align')) return 'posture';
  if (key.includes('respir')) return 'respiration';
  if (key.includes('renforc')) return 'renforcement';
  if (key.includes('bien')) return 'bien-etre';
  if (key.includes('nutri')) return 'nutrition';
  return 'technique';
}

function pickCategoryForIndex(index: number): string {
  return CATEGORY_SLUGS[index % CATEGORY_SLUGS.length] ?? 'technique';
}

async function generateDynamicTopics(params: {
  categorySlug: string;
  count: number;
  usedBriefs: string[];
}): Promise<EditorialTopic[]> {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  if (!key) return [];

  const category = categoryLabelFr(params.categorySlug);
  const avoid = params.usedBriefs.slice(0, 40).map((brief) => `- ${brief}`).join('\n');
  const prompt = `Tu es rédactrice en chef d'un blog pilates / barre premium.
Génère ${params.count} briefs éditoriaux UNIQUES pour la catégorie « ${category} ».
Chaque brief = 1 angle concret (bénéfice, problème résolu, situation réelle), 1-2 phrases, en français.
INTERDIT: numéros d'article, « mouvement & souffle » générique, titres vagues.

Briefs déjà utilisés (ne pas répéter ni paraphraser):
${avoid || '(aucun)'}

Réponds UNIQUEMENT en JSON: {"topics":[{"briefFr":"..."}]}`;

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.85, maxOutputTokens: 2048 },
  });

  const text = response.text ?? '';
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return [];

  const parsed = JSON.parse(text.slice(start, end + 1)) as { topics?: Array<{ briefFr?: string }> };
  const out: EditorialTopic[] = [];
  for (const row of parsed.topics ?? []) {
    const briefFr = row.briefFr?.trim();
    if (!briefFr || briefFr.length < 24) continue;
    const briefKey = briefFr.toLowerCase();
    if (params.usedBriefs.some((used) => used.toLowerCase() === briefKey)) continue;
    const id = `${normalizeCategorySlug(params.categorySlug)}-${hashBrief(briefFr)}`;
    out.push({ id, categorySlug: normalizeCategorySlug(params.categorySlug), briefFr });
  }
  return out;
}

export async function pickNextEditorialTopic(params: {
  usedTopicIds: Set<string>;
  usedBriefs: string[];
  seed?: number;
}): Promise<EditorialTopic | null> {
  const staticPool = loadStaticTopicPool().filter((topic) => !params.usedTopicIds.has(topic.id));
  if (staticPool.length > 0) {
    const index = (params.seed ?? Date.now()) % staticPool.length;
    return staticPool[index] ?? staticPool[0] ?? null;
  }

  const categorySlug = pickCategoryForIndex(params.usedTopicIds.size + params.usedBriefs.length);
  const generated = await generateDynamicTopics({
    categorySlug,
    count: 3,
    usedBriefs: params.usedBriefs,
  });
  const fresh = generated.find((topic) => !params.usedTopicIds.has(topic.id));
  return fresh ?? null;
}

export { CATEGORY_SLUGS, normalizeCategorySlug };
