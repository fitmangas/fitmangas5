/** UUID coach pour upserts webhook / défaut — `VIMEO_DEFAULT_COACH_ID` dans `.env`. */
export function parseDefaultCoachIdFromEnv(): string | null {
  const raw = process.env.VIMEO_DEFAULT_COACH_ID?.trim();
  if (!raw) return null;
  if (!/^[0-9a-f-]{36}$/i.test(raw)) {
    console.warn('[vimeo] VIMEO_DEFAULT_COACH_ID ignoré (UUID invalide).');
    return null;
  }
  return raw;
}
