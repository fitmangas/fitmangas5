import { GoogleGenAI } from '@google/genai';

type GeneratedArticle = {
  contentHtml: string;
  description: string;
  metaDescription: string;
  seoKeywords: string;
};

function fallbackContent(title: string, category: string): GeneratedArticle {
  const description = `Un guide concret pour progresser en pilates autour de "${title}".`;
  const paragraphs = [
    `<h2>Pourquoi ce sujet change ta pratique</h2><p>${title} revient souvent dans les blocages des élèves : manque de régularité, surcharge mentale ou difficulté à sentir les bons appuis. En pilates, les progrès ne viennent pas d'une séance parfaite, mais d'une répétition intelligente et douce. L'objectif est de construire un rituel réaliste, compatible avec ton emploi du temps, tout en gardant le plaisir de bouger.</p>`,
    `<h2>Le contexte concret</h2><p>Beaucoup de pratiquantes pensent qu'il faut faire plus longtemps pour obtenir des résultats. En réalité, des séances courtes mais fréquentes donnent souvent de meilleurs effets sur la posture, la mobilité et l'énergie générale. Le corps retient plus facilement des repères simples : respiration, alignement, activation du centre et qualité des transitions.</p>`,
    `<h3>3 actions simples à appliquer cette semaine</h3><ul><li><strong>Bloque un créneau fixe</strong> de 20 à 30 minutes, deux à trois fois par semaine.</li><li><strong>Choisis un objectif unique</strong> par séance : mobilité, renforcement ou récupération.</li><li><strong>Termine par 2 minutes de respiration</strong> pour ancrer le travail et faire redescendre le stress.</li></ul>`,
    `<h2>Exemple terrain</h2><p>Une élève qui reprenait après plusieurs mois d'arrêt a commencé avec deux séances de 25 minutes, centrées sur le gainage profond et les hanches. En trois semaines, elle a constaté moins de tensions lombaires et une meilleure stabilité sur ses exercices. Le point clé n'était pas la difficulté, mais la régularité et la précision du mouvement.</p>`,
    `<h2>Ce que tu peux retenir</h2><p>Sur le thème <strong>${category}</strong>, l'important est d'avancer pas à pas : une structure claire, des objectifs mesurables, et une pratique régulière. Garde une trace de tes séances et observe ton ressenti. C'est cette constance qui transforme le corps, la posture et la confiance au quotidien.</p><p>Si cet article t'aide, note-le et partage-le à une amie qui veut reprendre en douceur.</p>`,
  ];

  const contentHtml = paragraphs.join('\n\n');
  const metaDescription = `${title} : conseils pilates pratiques, méthode progressive et routine concrète pour des résultats durables.`;
  const seoKeywords = `${title}, pilates, ${category}, posture, respiration, bien-être`;

  return { contentHtml, description, metaDescription, seoKeywords };
}

function extractJsonBlock(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const slice = raw.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

function buildPrompts(params: { title: string; category: string; publishDateIso: string }): {
  system: string;
  user: string;
} {
  const system = `Tu es copywriter expert d'un blog pilates premium. Tu écris en français naturel, clair et professionnel.
Retourne STRICTEMENT un JSON avec ces clés:
- contentHtml (article en HTML, 350 à 500 mots, avec <h2>, <h3>, <p>, <ul>, <li>, <strong>)
- description (160 caractères max)
- metaDescription (155 caractères max)
- seoKeywords (liste séparée par virgules)`;

  const user = `Titre: ${params.title}
Catégorie: ${params.category}
Date publication: ${params.publishDateIso}

Contraintes:
- texte actionnable, motivant, sans jargon inutile
- intro accrocheuse
- 2-3 conseils concrets
- une mini-story réaliste
- conclusion avec CTA doux`;

  return { system, user };
}

function parseGeneratedArticle(
  raw: string,
  title: string,
  category: string,
): GeneratedArticle | null {
  const data = extractJsonBlock(raw);
  if (!data) return null;

  const contentHtml = typeof data.contentHtml === 'string' ? data.contentHtml.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const metaDescription = typeof data.metaDescription === 'string' ? data.metaDescription.trim() : '';
  const seoKeywords = typeof data.seoKeywords === 'string' ? data.seoKeywords.trim() : '';

  if (!contentHtml || contentHtml.length < 600) {
    return null;
  }

  const fb = fallbackContent(title, category);
  return {
    contentHtml,
    description: description || fb.description,
    metaDescription: metaDescription || fb.metaDescription,
    seoKeywords: seoKeywords || fb.seoKeywords,
  };
}

async function generateWithGemini(params: {
  title: string;
  category: string;
  publishDateIso: string;
  apiKey: string;
}): Promise<GeneratedArticle | null> {
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  const { system, user } = buildPrompts(params);
  const ai = new GoogleGenAI({ apiKey: params.apiKey });
  const combined = `${system}\n\n${user}\n\nRéponds uniquement avec le JSON, sans markdown ni texte avant ou après.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: combined,
      config: {
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    });
    const raw = response.text ?? '';
    return parseGeneratedArticle(raw, params.title, params.category);
  } catch (e) {
    console.error('[generateFrenchArticle] Gemini', e);
    return null;
  }
}

async function generateWithOpenAI(params: {
  title: string;
  category: string;
  publishDateIso: string;
  apiKey: string;
}): Promise<GeneratedArticle | null> {
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const { system, user } = buildPrompts(params);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!response.ok) {
    console.error('[generateFrenchArticle] OpenAI', response.status, await response.text());
    return null;
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content ?? '';
  return parseGeneratedArticle(raw, params.title, params.category);
}

export async function generateFrenchArticle(params: {
  title: string;
  category: string;
  publishDateIso: string;
}): Promise<GeneratedArticle> {
  const geminiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (geminiKey) {
    const fromGemini = await generateWithGemini({ ...params, apiKey: geminiKey });
    if (fromGemini) return fromGemini;
  }

  if (openaiKey) {
    const fromOpenai = await generateWithOpenAI({ ...params, apiKey: openaiKey });
    if (fromOpenai) return fromOpenai;
  }

  return fallbackContent(params.title, params.category);
}
