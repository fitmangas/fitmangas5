import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { resolveCode } from '@/lib/gifts/resolve-code';
import { GENERIC_ERROR_FR } from '@/lib/http/public-error';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { clientIpFromHeaders } from '@/lib/security/public-form-guard';

/**
 * Champ « J'ai un code » de la modale d'essai : cadeau → page d'activation, sinon promo, sinon parrainage.
 * Pour un code cadeau, seule la nature du code est renvoyée (pas de prénom ni d'identifiant de carte).
 */
export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 400 });
  }
  const limit = await checkRateLimit('gift_lookup', clientIpFromHeaders(request.headers));
  if (!limit.ok) return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 429 });
  try {
    const admin = createAdminClient();
    const resolved = await resolveCode(admin, body.code ?? '');
    if (resolved.kind === 'gift') return NextResponse.json({ resolved: { kind: 'gift', code: resolved.code } });
    return NextResponse.json({ resolved });
  } catch (e) {
    console.error('[gifts] resolve-code', e);
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 503 });
  }
}
