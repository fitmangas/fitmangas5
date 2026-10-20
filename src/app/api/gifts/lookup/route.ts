import { NextResponse } from 'next/server';

import { isGiftsEnabled } from '@/lib/gifts/flag';
import { lookupGiftByCode, LOOKUP_MESSAGES } from '@/lib/gifts/activation';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { clientIpFromHeaders } from '@/lib/security/public-form-guard';
import { A_VALIDER_LOT1 } from '@/content/a-valider';

/** C04 — vérifie un code cadeau (sans le consommer) : durée, prénoms, message. Limité par IP. */
export async function POST(request: Request) {
  if (!isGiftsEnabled()) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  let body: { code?: unknown; locale?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const lang = body.locale === 'es' ? 'es' : 'fr';
  const limit = await checkRateLimit('gift_lookup', clientIpFromHeaders(request.headers));
  if (!limit.ok) return NextResponse.json({ error: A_VALIDER_LOT1.antiBot.limited[lang] }, { status: 429 });
  try {
    const res = await lookupGiftByCode(createAdminClient(), String(body.code ?? ''));
    if (!res.ok) return NextResponse.json({ error: LOOKUP_MESSAGES[res.reason][lang], reason: res.reason }, { status: res.reason === 'format' ? 400 : 404 });
    return NextResponse.json({
      ok: true,
      gift: { code: res.code, months: res.months, recipientName: res.recipientName, buyerName: res.buyerName, message: res.message, expiresAt: res.expiresAt, lang: res.lang },
    });
  } catch (e) {
    console.error('[gifts] lookup', e);
    return NextResponse.json({ error: A_VALIDER_LOT1.errors.generic[lang] }, { status: 503 });
  }
}
