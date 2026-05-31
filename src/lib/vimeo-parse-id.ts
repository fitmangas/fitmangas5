/**
 * Extrait l'identifiant numérique Vimeo depuis une URL ou un ID brut.
 */
export function parseVimeoVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] ?? null;
}
