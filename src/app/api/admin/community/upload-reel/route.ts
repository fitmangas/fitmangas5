import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** Plafond MP4 Reel (H.264 1080×1920) — le fichier ne passe PAS par Vercel (limite 4,5 Mo). */
const REEL_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;
const REEL_COVER_MAX_BYTES = 12 * 1024 * 1024;

type SignBody = {
  postId?: string;
  kind?: string;
  fileName?: string;
  contentType?: string;
  byteSize?: number;
};

/**
 * Étape 1 : URL signée Supabase Storage.
 * Le navigateur envoie ensuite le MP4 en PUT direct vers Storage (zéro ré-encodage,
 * hors limite body Vercel 4,5 Mo qui faisait planter « Un imprévu est survenu »).
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: 'Non autorisé.' }, { status: 401 });
  }

  let body: SignBody;
  try {
    body = (await request.json()) as SignBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Ancien flux FormData refusé. Recharge la page CM : l’import passe par une URL signée (MP4 > 4,5 Mo).',
      },
      { status: 400 },
    );
  }

  const postId = String(body.postId || '').trim();
  const kindRaw = String(body.kind || 'raw').trim();
  const isCover = kindRaw === 'cover';
  const kind = kindRaw === 'edited' ? 'edited' : isCover ? 'cover' : 'raw';
  const fileName = String(body.fileName || (isCover ? 'cover.png' : 'reel.mp4')).trim() || (isCover ? 'cover.png' : 'reel.mp4');
  const contentType = String(body.contentType || (isCover ? 'image/png' : 'video/mp4')).trim() ||
    (isCover ? 'image/png' : 'video/mp4');
  const byteSize = Number(body.byteSize);
  const maxBytes = isCover ? REEL_COVER_MAX_BYTES : REEL_UPLOAD_MAX_BYTES;

  if (!postId) {
    return NextResponse.json({ ok: false, error: 'postId requis.' }, { status: 400 });
  }
  if (!Number.isFinite(byteSize) || byteSize <= 0) {
    return NextResponse.json({ ok: false, error: 'byteSize invalide.' }, { status: 400 });
  }
  if (byteSize > maxBytes) {
    return NextResponse.json(
      {
        ok: false,
        error: `${isCover ? 'Image' : 'Vidéo'} trop lourde (${Math.round(byteSize / (1024 * 1024))} Mo). Max ${maxBytes / (1024 * 1024)} Mo.`,
      },
      { status: 400 },
    );
  }

  const ext = (fileName.split('.').pop() || (isCover ? 'png' : 'mp4')).toLowerCase().replace(/[^a-z0-9]/g, '') ||
    (isCover ? 'png' : 'mp4');
  if (isCover) {
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      return NextResponse.json(
        { ok: false, error: `Extension miniature non supportée (.${ext}). PNG ou JPEG.` },
        { status: 400 },
      );
    }
  } else if (!['mp4', 'mov', 'webm', 'm4v'].includes(ext)) {
    return NextResponse.json(
      { ok: false, error: `Extension non supportée (.${ext}). Utilise un MP4.` },
      { status: 400 },
    );
  }

  const path = isCover
    ? `social/reel-covers/${postId}-${Date.now()}.${ext}`
    : `social/reels/${postId}-${kind}-${Date.now()}.${ext}`;
  const admin = createAdminClient();

  // Best-effort : remonter la limite bucket si elle bloque les Reels (~50 Mo par défaut).
  // Pas une migration SQL — config Storage via API service role.
  try {
    await admin.storage.updateBucket('avatars', {
      public: true,
      fileSizeLimit: REEL_UPLOAD_MAX_BYTES,
    });
  } catch {
    // Ignore : l’upload signé peut quand même marcher si la limite projet est déjà OK.
  }

  const { data, error } = await admin.storage.from('avatars').createSignedUploadUrl(path, {
    upsert: true,
  });
  if (error || !data?.signedUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Impossible de créer l’URL d’upload Supabase.',
      },
      { status: 500 },
    );
  }

  const { data: pub } = admin.storage.from('avatars').getPublicUrl(path);

  return NextResponse.json({
    ok: true,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
    contentType,
    maxBytes,
  });
}
