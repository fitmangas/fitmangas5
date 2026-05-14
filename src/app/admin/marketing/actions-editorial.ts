'use server';

import { revalidatePath } from 'next/cache';
import { GoogleGenAI } from '@google/genai';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function suggestEditorialTopicAction() {
  const { user } = await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'GEMINI_API_KEY manquant.' };

  const admin = createAdminClient();
  const { data: articles } = await admin
    .from('blog_articles')
    .select('title_fr, title_es')
    .order('created_at', { ascending: false })
    .limit(40);

  const titles = (articles ?? []).map((a) => a.title_fr).filter(Boolean);
  const month = new Date().getMonth() + 1;
  const seasonHint =
    month === 12 || month <= 2
      ? 'hiver, reprise en douceur, motivation'
      : month >= 3 && month <= 5
        ? 'printemps, énergie, préparation été'
        : month >= 6 && month <= 8
          ? 'été, voyage, routines courtes'
          : month >= 9 && month <= 11
            ? 'rentrée, régularité, objectifs'
            : '';

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Tu es stratège éditorial pour un blog pilates / fitness premium (FitMangas, Alejandra).
Mois courant (contexte saisonnier): ${seasonHint}.
Titres déjà couverts (évite les doublons thématiques): ${titles.slice(0, 30).join(' | ')}

Propose UN sujet d'article SEO pertinent (pilates, barre, mobilité, respiration, posture, bien-être actif).
Réponds STRICTEMENT en JSON:
{ "suggestion_fr": "...", "suggestion_es": "...", "topics_hint": "mots-clés courts, virgules" }
Sans markdown ni texte hors JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.85, maxOutputTokens: 1024 },
  });
  const raw = response.text ?? '';
  const parsed = extractJsonBlock(raw);
  const suggestion_fr = typeof parsed?.suggestion_fr === 'string' ? parsed.suggestion_fr.trim() : '';
  const suggestion_es = typeof parsed?.suggestion_es === 'string' ? parsed.suggestion_es.trim() : '';
  const topics_hint = typeof parsed?.topics_hint === 'string' ? parsed.topics_hint.trim() : '';
  if (!suggestion_fr) return { ok: false as const, error: 'Réponse Gemini invalide.' };

  await admin.from('marketing_editorial_suggestions').insert({
    suggestion_fr,
    suggestion_es: suggestion_es || null,
    topics_hint: topics_hint || null,
    created_by: user.id,
  });

  revalidatePath('/admin/marketing');
  return { ok: true as const, suggestion_fr, suggestion_es, topics_hint };
}
