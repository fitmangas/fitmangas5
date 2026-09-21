import { NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/lib/api-auth';
import { saveHealthConsent } from '@/lib/self-knowledge/store';

export async function POST() {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  const consent = await saveHealthConsent(auth.user.id);
  if (!consent) {
    return NextResponse.json({ error: 'Impossible d’enregistrer le consentement.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, consentId: consent.id });
}
