/**
 * Traduction automatique optionnelle (Google Cloud Translation v2 REST).
 * Nécessite GOOGLE_TRANSLATE_API_KEY dans l’environnement.
 */

export async function translateText(text: string, target: 'en' | 'es'): Promise<string | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key || !text.trim()) return null;

  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'fr',
      target,
      format: 'text',
    }),
  });

  if (!res.ok) {
    console.error('[translate]', res.status, await res.text());
    return null;
  }

  const json = (await res.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  const out = json.data?.translations?.[0]?.translatedText;
  return typeof out === 'string' ? out : null;
}
