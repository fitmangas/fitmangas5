import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Upload Reel : brute (`raw`) ou MP4 déjà monté sur le Mac (`edited`). */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: 'Non autorisé.' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const postId = String(form.get('postId') || '').trim();
  const kind = String(form.get('kind') || 'raw').trim() === 'edited' ? 'edited' : 'raw';
  if (!postId || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file et postId requis.' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 80 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: 'Vidéo trop lourde (max 80 Mo).' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const path = `social/reels/${postId}-${kind}-${Date.now()}.${ext}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from('avatars').upload(path, bytes, {
    contentType: file.type || 'video/mp4',
    upsert: true,
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const { data } = admin.storage.from('avatars').getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, kind });
}
