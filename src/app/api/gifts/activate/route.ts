import { NextResponse } from 'next/server';

import { isGiftsEnabled } from '@/lib/gifts/flag';
import { activateGiftForUser } from '@/lib/gifts/activation';
import { normalizeGiftCode } from '@/lib/gifts/code';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { guardPublicFormRequest } from '@/lib/security/public-form-guard';
import { A_VALIDER_LOT1 } from '@/content/a-valider';
import { phoneFromAuthUser } from '@/lib/admin/client-phone';

/**
 * C04 — active une carte cadeau sur le compte de la personne connectée ;
 * ou, juste après la création du compte quand la session n'existe pas encore (email à confirmer),
 * sur le compte créé il y a moins d'une heure dont l'identifiant et l'email correspondent.
 */
export async function POST(request: Request) {
  if (!isGiftsEnabled()) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const lang = body.locale === 'es' ? 'es' : 'fr';
  const guard = await guardPublicFormRequest(request, 'gift_activation', typeof body.turnstileToken === 'string' ? body.turnstileToken : null, lang);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const code = normalizeGiftCode(String(body.code ?? ''));
  const admin = createAdminClient();
  let userId: string | null = null;
  let email: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let phone: string | null = null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    userId = user.id;
    email = user.email?.toLowerCase() ?? null;
    phone = phoneFromAuthUser(user);
  } else if (typeof body.userId === 'string' && typeof body.email === 'string') {
    const { data, error } = await admin.auth.admin.getUserById(body.userId);
    const created = data?.user?.created_at ? new Date(data.user.created_at).getTime() : 0;
    const sameEmail = data?.user?.email?.toLowerCase() === body.email.trim().toLowerCase();
    if (error || !data?.user || !sameEmail || Date.now() - created > 60 * 60_000) {
      return NextResponse.json({ error: lang === 'es' ? 'Inicia sesión para activar tu regalo.' : 'Connecte-toi pour activer ton cadeau.' }, { status: 401 });
    }
    userId = data.user.id;
    email = data.user.email?.toLowerCase() ?? null;
    phone = phoneFromAuthUser(data.user);
  } else {
    return NextResponse.json({ error: lang === 'es' ? 'Inicia sesión para activar tu regalo.' : 'Connecte-toi pour activer ton cadeau.' }, { status: 401 });
  }

  try {
    const { data: profile } = await admin.from('profiles').select('first_name, last_name').eq('id', userId).maybeSingle();
    firstName = (profile?.first_name as string | null) ?? null;
    lastName = (profile?.last_name as string | null) ?? null;
  } catch {
    /* profil incomplet : Stripe reçoit seulement l'email */
  }

  try {
    const res = await activateGiftForUser(admin, { code, userId, email, firstName, lastName, phone });
    if (!res.ok) return NextResponse.json({ error: res.message[lang] }, { status: res.status });
    return NextResponse.json(res);
  } catch (e) {
    console.error('[gifts] activate', e);
    return NextResponse.json({ error: A_VALIDER_LOT1.errors.generic[lang] }, { status: 503 });
  }
}
