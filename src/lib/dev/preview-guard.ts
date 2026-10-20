/**
 * Pages d’aperçu `/dev/apercu/*` : écrans connectés rendus avec des données fictives, pour les captures.
 * Jamais disponibles sur Vercel (preview ou prod) ; en local seulement avec DEV_PREVIEW=1.
 */
export function isDevPreviewEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.VERCEL_ENV || env.VERCEL) return false;
  return env.DEV_PREVIEW === '1';
}
