import { NextResponse } from 'next/server';

import { isGiftsEnabled, stripeGiftWritesAllowed } from '@/lib/gifts/flag';
import { normalizeGiftCode } from '@/lib/gifts/code';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardPublicFormRequest } from '@/lib/security/public-form-guard';
import { GENERIC_ERROR_FR } from '@/lib/http/public-error';
import { hasVisioClientAccess } from '@/lib/access-control';

export async function POST(request: Request) {
  if (!isGiftsEnabled()) return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 404 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 400 });
  }
  const guard = await guardPublicFormRequest(request, 'gift_activation', typeof body.turnstileToken === 'string' ? body.turnstileToken : null);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const code = normalizeGiftCode(String(body.code ?? ''));
  const phone = String(body.phone ?? '').trim();
  if (!phone) return NextResponse.json({ error: 'Le téléphone est obligatoire.' }, { status: 400 });

  const admin = createAdminClient();
  try {
    const { data } = await admin.from('gift_cards').select('*').eq('code', code).maybeSingle();
    if (!data) return NextResponse.json({ error: 'Code inconnu.' }, { status: 404 });
    if (data.status === 'refunded') return NextResponse.json({ error: 'Cette carte a été remboursée.' }, { status: 409 });
    if (data.status === 'expired' || (data.expires_at && new Date(String(data.expires_at)).getTime() < Date.now())) {
      return NextResponse.json({ error: 'Cette carte a expiré.' }, { status: 409 });
    }
    if (data.status === 'activated') return NextResponse.json({ error: 'Cette carte a déjà été utilisée.' }, { status: 409 });
    if (!stripeGiftWritesAllowed()) {
      return NextResponse.json({ error: 'Activation réelle après GO (Stripe test / production).' }, { status: 503 });
    }
    const email = String(body.email ?? '').trim().toLowerCase();
    const { data: users } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
    const userId = users?.id ? String(users.id) : null;
    let mode: 'new_trial' | 'existing_no_access' | 'balance_credit' | 'trial_extension' = 'new_trial';
    if (userId) {
      const visio = await hasVisioClientAccess(userId);
      const { data: sub } = await admin.from('subscriptions').select('status').eq('user_id', userId).maybeSingle();
      if (sub?.status === 'trialing') mode = 'trial_extension';
      else if (visio) mode = 'balance_credit';
      else mode = 'existing_no_access';
    }
    const ends = new Date();
    ends.setUTCMonth(ends.getUTCMonth() + Number(data.months));
    await admin
      .from('gift_cards')
      .update({
        status: 'activated',
        activated_at: new Date().toISOString(),
        activated_by: userId,
        activation_mode: mode,
        access_ends_at: ends.toISOString(),
      })
      .eq('id', data.id);
    return NextResponse.json({ ok: true, mode });
  } catch (e) {
    console.error('[gifts] activate', e);
    return NextResponse.json({ error: GENERIC_ERROR_FR }, { status: 503 });
  }
}
