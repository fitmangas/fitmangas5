import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuthenticatedUser } from '@/lib/api-auth';
import { generateSelfTestAnalysis } from '@/lib/self-knowledge/analyze';
import { getSelfTest, scoreSelfTest, validateAnswers } from '@/lib/self-knowledge/scoring';
import { saveMemberSelfTestResult } from '@/lib/self-knowledge/store';
import { resolveFirstName } from '@/lib/compte/i18n';
import type { SelfTestAnswers } from '@/lib/self-knowledge/types';

const bodySchema = z.object({
  slug: z.enum(['big-five', 'attachement']),
  locale: z.enum(['fr', 'es']),
  answers: z.record(z.string(), z.number().int().min(1).max(7)),
});

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.response) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Données invalides.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = auth.user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'Email du compte requis.' }, { status: 400 });
  }

  const def = getSelfTest(parsed.data.slug);
  if (!def) {
    return NextResponse.json({ error: 'Test inconnu.' }, { status: 400 });
  }

  const answers = parsed.data.answers as SelfTestAnswers;
  const validation = validateAnswers(def, answers);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  let scores;
  try {
    scores = scoreSelfTest(def, answers);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Scoring impossible.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const analysis = await generateSelfTestAnalysis(def, scores, parsed.data.locale);

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('first_name')
    .eq('id', auth.user.id)
    .maybeSingle();

  const firstName = resolveFirstName(profile?.first_name, auth.user.user_metadata, email);

  const saved = await saveMemberSelfTestResult({
    slug: parsed.data.slug,
    locale: parsed.data.locale,
    profileId: auth.user.id,
    email,
    firstName,
    answers,
    scores,
    analysis,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({
    ok: true,
    resultId: saved.resultId,
    scores,
    analysis,
  });
}
