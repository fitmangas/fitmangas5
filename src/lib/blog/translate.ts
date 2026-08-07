export async function translateText(text: string, target: 'en' | 'es'): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !text.trim()) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const targetLabel = target === 'es' ? 'espagnol (Espagne / Amérique latine, naturel)' : 'anglais';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
    }),
  });

  if (!res.ok) {
    console.error('[translate]', res.status, await res.text());
    return null;
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const out = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  return typeof out === 'string' ? out : null;
}
