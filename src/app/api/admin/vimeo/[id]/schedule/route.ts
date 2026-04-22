import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { setScheduledPublication } from '@/lib/vimeo-scheduling-service';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Body = { scheduled_at?: string | null };

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

  const scheduled_at =
    body.scheduled_at === undefined ? undefined : body.scheduled_at === null ? null : String(body.scheduled_at);

  if (scheduled_at === undefined) {
    return NextResponse.json({ error: 'scheduled_at requis (ISO ou null).' }, { status: 400 });
  }

  const admin = createAdminClient();
  const res = await setScheduledPublication(admin, id, scheduled_at);

  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({
    ok: true,
    validation_status: scheduled_at === null ? ('pending' as const) : ('scheduled' as const),
  });
}
