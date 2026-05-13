export async function translateText(text: string, target: 'en' | 'es'): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !text.trim()) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const targetLabel = target === 'es' ? 'espagnol' : 'anglais';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                `Traduis ce texte français en ${targetLabel}.`,
                'Préserve exactement les balises HTML/Markdown, les listes, les backticks et les sauts de paragraphes.',
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
