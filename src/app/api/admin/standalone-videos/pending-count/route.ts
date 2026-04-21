import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/lib/auth/assert-admin-api';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from('standalone_vimeo_videos')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'pending');

    if (error) {
      return NextResponse.json({ pending: 0, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ pending: count ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur serveur.';
    return NextResponse.json({ pending: 0, error: msg }, { status: 500 });
  }
}
