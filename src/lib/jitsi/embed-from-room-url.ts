/**
 * Dérive domaine + nom de salle depuis l’URL enregistrée en base.
 * `NEXT_PUBLIC_JITSI_DOMAIN` (ex. live.fitmangas.com) force l’hôte d’embed tout en gardant le chemin comme nom de salle.
 */
export function resolveJitsiEmbedFromRoomUrl(roomUrl: string): {
  domain: string;
  roomName: string;
  scriptOrigin: string;
} {
  const u = new URL(roomUrl.trim());
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new Error('URL de salle invalide.');
  }
  const rawPath = u.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!rawPath) {
    throw new Error('Nom de salle manquant dans l’URL.');
  }
  const roomName = decodeURIComponent(rawPath);
  const envRaw = typeof process.env.NEXT_PUBLIC_JITSI_DOMAIN === 'string' ? process.env.NEXT_PUBLIC_JITSI_DOMAIN.trim() : '';
  const envDomain = envRaw
    ? envRaw.replace(/^https?:\/\//, '').split('/')[0]?.toLowerCase() ?? ''
    : '';
  const domain = envDomain || u.hostname.toLowerCase();
  const scriptOrigin = `${u.protocol}//${domain}`;
  return { domain, roomName, scriptOrigin };
}
