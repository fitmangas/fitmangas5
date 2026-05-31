import { NextResponse } from 'next/server';

import { dispatchWelcomeDay0 } from '@/lib/notifications/phase2';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Envoie l’email de bienvenue (onboarding.day0) une seule fois par utilisateur.
 * Auth session OU vérification userId + e-mail (même contrat que checkout/post-signup).
 */
export async function POST(request: Request) {
  const admin = createAdminClient();
  let userId: string | null = null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    userId = user.id;
  } else {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 });
    }
    const bodyUserId =
      typeof body === 'object' && body !== null && 'userId' in body && typeof (body as { userId: unknown }).userId === 'string'
        ? (body as { userId: string }).userId.trim()
        : '';
    const email =
      typeof body === 'object' && body !== null && 'email' in body && typeof (body as { email: unknown }).email === 'string'
        ? (body as { email: string }).email.trim().toLowerCase()
        : '';

    if (!bodyUserId || !email) {
      return NextResponse.json({ error: 'Authentification ou paramètres requis.' }, { status: 401 });
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(bodyUserId);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }

    const authEmail = userData.user.email?.trim().toLowerCase();
    if (!authEmail || authEmail !== email) {
      return NextResponse.json({ error: 'E-mail non associé à ce compte.' }, { status: 403 });
    }

    userId = bodyUserId;
  }

  try {
    const result = await dispatchWelcomeDay0(admin, userId);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[welcome-email]', e);
    return NextResponse.json({ error: 'Impossible d’envoyer l’email de bienvenue.' }, { status: 500 });
  }
}
