/**
 * Miniature / cover Reel : URL publique envoyable aux APIs.
 * TikTok Content Posting n’accepte PAS une image custom — seulement un timestamp.
 */

import { absolutePublicUrl } from '@/lib/admin/social-comms';

export const REEL_COVER_API_SUPPORT = {
  instagram: {
    ok: true as const,
    how: 'Paramètre cover_url sur POST /{ig-user-id}/media (media_type=REELS). JPEG/PNG public.',
  },
  facebook: {
    ok: true as const,
    how: 'Après video_reels, POST /{video-id}/thumbnails avec is_preferred=true + url publique.',
  },
  tiktok: {
    ok: false as const,
    how: 'API Content Posting : uniquement video_cover_timestamp_ms (image extraite de la vidéo). Pose la cover à la main dans TikTok.',
  },
};

const PUBLIC_PATH_RE = /^\/(library|storage)\//i;

/** URL que Meta peut télécharger. Chemins locaux HyperFrames (`exports/…`) = null. */
export function reelCoverPublicUrl(coverImagePath: string | null | undefined): string | null {
  const p = (coverImagePath || '').trim();
  if (!p) return null;
  if (p.startsWith('https://') || p.startsWith('http://')) return p;
  if (p.includes('/storage/v1/object/public/')) {
    return p.startsWith('http') ? p : absolutePublicUrl(p.startsWith('/') ? p : `/${p}`);
  }
  if (PUBLIC_PATH_RE.test(p) || p.startsWith('/library/')) return absolutePublicUrl(p);
  return null;
}

export function isLocalHyperFramesCoverPath(coverImagePath: string | null | undefined): boolean {
  const p = (coverImagePath || '').trim();
  if (!p) return false;
  if (reelCoverPublicUrl(p)) return false;
  return /(?:^|\/)exports\/|reel-.*_cover\.(png|jpe?g|webp)$/i.test(p);
}

export function normalizeCoverInput(raw: string): string | null {
  const p = raw.trim();
  return p ? p.slice(0, 800) : null;
}
