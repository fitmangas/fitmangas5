import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCode } from '@/lib/gifts/resolve-code';
import { GENERIC_ERROR_FR } from '@/lib/http/public-error';

export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 400 });
  }
  try {
    const admin = createAdminClient();
    const resolved = await resolveCode(admin, body.code ?? '');
    return NextResponse.json({ resolved });
  } catch (e) {
    console.error('[gifts] resolve-code', e);
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 503 });
  }
}
