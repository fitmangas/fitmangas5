export async function translateText(text: string, target: 'en' | 'es'): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !text.trim()) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const targetLabel = target === 'es' ? 'espagnol (Espagne / Amérique latine, naturel)' : 'anglais';
  const body = JSON.stringify({
    generationConfig: {
      temperature: 0.15,
      ...(model.includes('flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              `Traduis fidèlement ce texte français en ${targetLabel}.`,
              'Ne reformule pas le fond : même sens, mêmes faits, mêmes conseils.',
              'Préserve exactement les balises HTML, les listes, les attributs et les sauts de paragraphes.',
              'Accords au féminin quand le texte s’adresse à une lectrice (tú / te).',
              'Ne rajoute aucune explication. Réponds uniquement avec la traduction.',
              '',
              text,
            ].join('\n'),
          },
        ],
      },
    ],
  });

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.ok) {
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const out = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
      return typeof out === 'string' && out ? out : null;
    }

    const errBody = await res.text();
    const retryable = res.status === 429 || res.status === 503 || res.status >= 500;
    console.error(`[translate] ${res.status} (attempt ${attempt}/${maxAttempts})`, errBody.slice(0, 400));
    if (!retryable || attempt === maxAttempts) return null;
    const waitMs = Math.min(30_000, 1500 * 2 ** (attempt - 1));
    await new Promise((r) => setTimeout(r, waitMs));
  }

  return null;
}
