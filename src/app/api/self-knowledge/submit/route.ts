import { NextResponse } from 'next/server';
import { z } from 'zod';

import { generateSelfTestAnalysis } from '@/lib/self-knowledge/analyze';
import { getSelfTest, scoreSelfTest, validateAnswers, SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';
import { savePublicSelfTestResult } from '@/lib/self-knowledge/store';
import type { SelfTestAnswers } from '@/lib/self-knowledge/types';

const bodySchema = z.object({
  slug: z.enum(['big-five', 'attachement']),
  locale: z.enum(['fr', 'es']),
  firstName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(120),
  consent: z.literal(true),
  answers: z.record(z.string(), z.number().int().min(1).max(7)),
  source: z
    .object({
      utm_source: z.string().max(80).optional(),
      utm_medium: z.string().max(80).optional(),
      utm_campaign: z.string().max(80).optional(),
    })
    .optional()
    .default({}),
});

export async function POST(request: Request) {
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

  if (!SELF_TEST_SLUGS.includes(parsed.data.slug)) {
    return NextResponse.json({ error: 'Test inconnu.' }, { status: 400 });
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

  const saved = await savePublicSelfTestResult({
    slug: parsed.data.slug,
    locale: parsed.data.locale,
    email: parsed.data.email,
    firstName: parsed.data.firstName,
    answers,
    scores,
    analysis,
    consent: true,
    source: parsed.data.source,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({
    ok: true,
    resultId: saved.resultId,
    contactId: saved.contactId,
    scores,
    analysis,
  });
}
