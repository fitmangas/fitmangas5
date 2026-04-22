import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { approveStandaloneVideo, rejectStandaloneVideo } from '@/lib/vimeo-validation-service';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Body = {
  action?: 'approve' | 'reject';
  rejection_reason?: string | null;
};

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
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action attendue : approve | reject.' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === 'approve') {
    const res = await approveStandaloneVideo(admin, id);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.json({ ok: true, validation_status: 'published' as const });
  }

  const res = await rejectStandaloneVideo(admin, id, body.rejection_reason ?? null);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }
  return NextResponse.json({ ok: true, validation_status: 'rejected' as const });
}
