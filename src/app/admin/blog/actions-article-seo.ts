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

export async function analyzeArticleSeoAction(input: { title: string; contentHtml: string }) {
  await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'GEMINI_API_KEY manquant.' };

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Tu es expert SEO francophone pour un blog pilates premium.
Analyse le titre et le contenu HTML suivants.

Titre: ${input.title}

Contenu (extrait HTML, tronqué si besoin): ${input.contentHtml.slice(0, 12000)}

Réponds STRICTEMENT en JSON avec les clés:
- keywords: tableau de 5 strings (mots-clés à intégrer)
- score: nombre 0-100 (score SEO estimé)
- title_suggestion: titre optimisé, moins de 60 caractères
- meta_description: meta description, moins de 160 caractères
- content_advice: paragraphe court (structure, longueur, mots-clés manquants)

Sans markdown ni texte hors JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.4, maxOutputTokens: 2048 },
  });
  const parsed = extractJsonBlock(response.text ?? '');
  if (!parsed) return { ok: false as const, error: 'Réponse invalide.' };

  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map((k) => String(k)).filter(Boolean).slice(0, 5) : [];
  const score = typeof parsed.score === 'number' ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 0;
  const title_suggestion = typeof parsed.title_suggestion === 'string' ? parsed.title_suggestion.trim() : '';
  const meta_description = typeof parsed.meta_description === 'string' ? parsed.meta_description.trim() : '';
  const content_advice = typeof parsed.content_advice === 'string' ? parsed.content_advice.trim() : '';

  return {
    ok: true as const,
    keywords,
    score,
    title_suggestion,
    meta_description,
    content_advice,
  };
}

function slugifyFr(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function generateSeoArticleDraftAction(theme: string) {
  const { user } = await requireAdmin();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false as const, error: 'GEMINI_API_KEY manquant.' };
  const themeTrim = theme.trim();
  if (themeTrim.length < 4) return { ok: false as const, error: 'Thème trop court.' };

  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Tu es rédactrice SEO expert pilates / fitness (FitMangas, Alejandra).
Thème demandé: ${themeTrim}

Génère un article de blog bilingue FR + ES.
Réponds STRICTEMENT en JSON avec les clés:
- title_fr, title_es (titres SEO < 60 caractères chacun)
- meta_description_fr, meta_description_es (< 160 caractères)
- description_fr, description_es (chapo 1-2 phrases, texte brut sans HTML)
- content_fr, content_es (article complet ~800 mots en FR et sa traduction ES complète ; HTML avec <h2>, <h3>, <p>, <ul>, <li>, <strong> uniquement)
- seo_keywords: string (3 à 5 mots-clés séparés par virgules)
- slug_suggestion: slug latin minuscules tirets, sans accents

Sans markdown ni texte hors JSON.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { temperature: 0.75, maxOutputTokens: 8192 },
  });
  const parsed = extractJsonBlock(response.text ?? '');
  if (!parsed) return { ok: false as const, error: 'Réponse Gemini invalide.' };

  const title_fr = String(parsed.title_fr ?? '').trim();
  const title_es = String(parsed.title_es ?? '').trim();
  const content_fr = String(parsed.content_fr ?? '').trim();
  const content_es = String(parsed.content_es ?? '').trim();
  if (!title_fr || !content_fr) return { ok: false as const, error: 'Contenu généré incomplet.' };

  const admin = createAdminClient();
  const { data: coachRow } = await admin.from('profiles').select('id').eq('role', 'admin').order('created_at', { ascending: true }).limit(1).maybeSingle();
  const { data: catRow } = await admin.from('blog_categories').select('id').order('sort_order', { ascending: true }).limit(1).maybeSingle();
  const coachId = coachRow?.id ?? user.id;
  const categoryId = catRow?.id ?? null;

  const baseSlug = slugifyFr(String(parsed.slug_suggestion ?? title_fr)) || `article-${Date.now()}`;
  let slug_fr = baseSlug;
  for (let i = 0; i < 8; i += 1) {
    const { data: exists } = await admin.from('blog_articles').select('id').eq('slug_fr', slug_fr).maybeSingle();
    if (!exists) break;
    slug_fr = `${baseSlug}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  const scheduled = new Date();
  scheduled.setUTCDate(scheduled.getUTCDate() + 14);
  scheduled.setUTCHours(12, 0, 0, 0);

  const { data: inserted, error } = await admin
    .from('blog_articles')
    .insert({
      coach_id: coachId,
      category_id: categoryId,
      title_fr,
      title_es: title_es || null,
      slug_fr,
      description_fr: String(parsed.description_fr ?? '').trim() || null,
      description_es: String(parsed.description_es ?? '').trim() || null,
      content_fr,
      content_es: content_es || null,
      meta_description_fr: String(parsed.meta_description_fr ?? '').trim() || null,
      meta_description_es: String(parsed.meta_description_es ?? '').trim() || null,
      seo_keywords: String(parsed.seo_keywords ?? '').trim() || null,
      status: 'draft',
      scheduled_publication_at: scheduled.toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (error || !inserted?.id) {
    console.error('[generateSeoArticleDraftAction]', error);
    return { ok: false as const, error: error?.message ?? 'Insertion impossible.' };
  }

  revalidatePath('/admin/marketing');
  revalidatePath('/admin/blog/calendar');
  revalidatePath('/admin/blog/validation');
  return { ok: true as const, articleId: inserted.id };
}
