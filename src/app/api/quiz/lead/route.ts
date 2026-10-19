import { NextResponse } from 'next/server';
import { guardPublicFormRequest, localeFromBody, turnstileTokenFromBody } from '@/lib/security/public-form-guard';

import { quizLeadBodySchema, saveQuizLead } from '@/lib/quiz/lead';

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const guard = await guardPublicFormRequest(request, 'quiz_lead', turnstileTokenFromBody(json), localeFromBody(json));
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const parsed = quizLeadBodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (parsed.data.consent !== true) {
    return NextResponse.json(
      { error: 'Le consentement est obligatoire pour recevoir ton rapport.' },
      { status: 400 },
    );
  }

  const result = await saveQuizLead(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    leadId: result.leadId,
    contactId: result.contactId,
  });
}
