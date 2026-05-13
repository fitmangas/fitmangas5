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

  return NextResponse.json({ ok: true, is_hidden: body.hidden });
}
