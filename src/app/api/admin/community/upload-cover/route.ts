import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 30;

const COVER_MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

type SignBody = {
  postId?: string;
  fileName?: string;
  contentType?: string;
  byteSize?: number;
};

/** URL signée pour uploader une miniature Reel (JPEG/PNG) hors limite body Vercel. */
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
    return NextResponse.json({ ok: false, error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const postId = String(body.postId || '').trim();
  const fileName = String(body.fileName || 'cover.png').trim() || 'cover.png';
  const contentType = String(body.contentType || 'image/png').trim() || 'image/png';
  const byteSize = Number(body.byteSize);

  if (!postId) {
    return NextResponse.json({ ok: false, error: 'postId requis.' }, { status: 400 });
  }
  if (!Number.isFinite(byteSize) || byteSize <= 0) {
    return NextResponse.json({ ok: false, error: 'byteSize invalide.' }, { status: 400 });
  }
  if (byteSize > COVER_MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `Image trop lourde (${Math.round(byteSize / 1024)} Ko). Max 8 Mo.` },
      { status: 400 },
    );
  }
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'Fichier image requis (JPEG ou PNG).' }, { status: 400 });
  }

  const ext = (fileName.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ ok: false, error: `Extension .${ext} non supportée. JPEG ou PNG.` }, { status: 400 });
  }

  const path = `social/covers/${postId}-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from('avatars').createSignedUploadUrl(path, { upsert: true });
  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Impossible de créer l’URL d’upload Supabase.' },
      { status: 500 },
    );
  }

  const { data: pub } = admin.storage.from('avatars').getPublicUrl(path);
  return NextResponse.json({
    ok: true,
    path,
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
    contentType,
    maxBytes: COVER_MAX_BYTES,
  });
}
