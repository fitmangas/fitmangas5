import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  let body: { hidden?: unknown };
  try {
    body = (await request.json()) as { hidden?: unknown };
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  if (typeof body.hidden !== 'boolean') {
    return NextResponse.json({ error: 'hidden doit être un booléen.' }, { status: 400 });
  }

  const hiddenAt = body.hidden ? new Date().toISOString() : null;
  const admin = createAdminClient();

  const { data: row, error: fetchError } = await admin
    .from('standalone_vimeo_videos')
    .select('id, vimeo_video_id')
    .eq('id', id)
    .eq('validation_status', 'published')
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'Vidéo introuvable ou non publiée.' }, { status: 404 });
  }

  const { error } = await admin
    .from('standalone_vimeo_videos')
    .update({
      is_hidden: body.hidden,
      hidden_at: hiddenAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('validation_status', 'published');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  /**
   * Sans colonne is_hidden sur video_recordings : un masquage « Replay du live »
   * côté bibliothèque Vimeo doit aussi retirer le même ID des replays cours client.
   * Convention : is_ready=false (validation_status reste approved) = masqué temporairement.
   */
  const vimeoId = typeof row.vimeo_video_id === 'string' ? row.vimeo_video_id.trim() : '';
  if (vimeoId) {
    if (body.hidden) {
      await admin
        .from('video_recordings')
        .update({ is_ready: false })
        .eq('vimeo_video_id', vimeoId)
        .eq('validation_status', 'approved');
    } else {
      await admin
        .from('video_recordings')
        .update({ is_ready: true })
        .eq('vimeo_video_id', vimeoId)
        .eq('validation_status', 'approved');
    }
  }

  return NextResponse.json({ ok: true, is_hidden: body.hidden });
}
