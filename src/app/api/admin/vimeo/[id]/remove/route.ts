import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';
import { removeStandaloneVideoFromClient } from '@/lib/vimeo-validation-service';

export const dynamic = 'force-dynamic';

export async function PATCH(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const res = await removeStandaloneVideoFromClient(admin, id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: res.status });
  }

  return NextResponse.json({ ok: true, validation_status: 'rejected' as const });
}
