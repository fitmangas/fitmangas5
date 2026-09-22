import { NextResponse } from 'next/server';
import { z } from 'zod';

import { assembleAttachmentReport, assembleBigFiveReport } from '@/lib/self-knowledge/assemble-report';
import { getSelfTest, scoreSelfTest, validateAnswers } from '@/lib/self-knowledge/scoring';
import type { SelfTestAnswers } from '@/lib/self-knowledge/types';

const bodySchema = z.object({
  slug: z.enum(['big-five', 'attachement']),
  locale: z.enum(['fr', 'es']).default('fr'),
  format: z.enum(['ipip-50', 'ipip-120']).optional(),
  answers: z.record(z.string(), z.number().int().min(1).max(7)),
});

/** Uniquement pour Playwright / captures locales. */
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_UX_CAPTURE !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const format =
    parsed.data.slug === 'big-five' ? parsed.data.format ?? 'ipip-50' : undefined;
  const def = getSelfTest(parsed.data.slug, format);
  if (!def) return NextResponse.json({ error: 'Test inconnu' }, { status: 400 });

  const answers = parsed.data.answers as SelfTestAnswers;
  const validation = validateAnswers(def, answers);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const scores = scoreSelfTest(def, answers);
  const analysis =
    parsed.data.slug === 'attachement'
      ? assembleAttachmentReport(scores, parsed.data.locale)
      : assembleBigFiveReport(scores, parsed.data.locale, format ?? 'ipip-50');

  return NextResponse.json({
    ok: true,
    resultId: 'ux-capture',
    contactId: 'ux-capture',
    scores,
    analysis,
  });
}
