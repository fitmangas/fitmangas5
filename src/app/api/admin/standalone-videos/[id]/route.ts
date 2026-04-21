import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { notifyStandaloneVideoPublished } from '@/lib/standalone-vimeo-notify';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Body = { action?: 'publish' | 'reject' };

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const action = body.action;
  if (action !== 'publish' && action !== 'reject') {
    return NextResponse.json({ error: 'action attendue : publish | reject.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: row, error: fetchErr } = await admin
    .from('standalone_vimeo_videos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: fetchErr?.message ?? 'Vidéo introuvable.' }, { status: 404 });
  }

  if (row.validation_status !== 'pending') {
    return NextResponse.json({ error: 'Cette vidéo n’est plus en attente.' }, { status: 409 });
  }

  const nextStatus = action === 'publish' ? 'published' : 'rejected';
  const published_at = action === 'publish' ? new Date().toISOString() : null;

  const { error: updateErr } = await admin
    .from('standalone_vimeo_videos')
    .update({
      validation_status: nextStatus,
      published_at,
    })
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  if (action === 'publish') {
    await notifyStandaloneVideoPublished(row);
  }

  return NextResponse.json({ ok: true, validation_status: nextStatus });
}
