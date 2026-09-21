import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuthenticatedUser } from '@/lib/api-auth';
import { saveHealthEntry } from '@/lib/self-knowledge/store';

const metricsSchema = z.object({
  sessionsPerWeek: z.number().min(0).max(14).nullable(),
  sleepHours: z.number().min(0).max(16).nullable(),
  restingHr: z.number().min(30).max(120).nullable(),
  hrvMs: z.number().min(5).max(200).nullable().optional(),
  activeMinutes: z.number().min(0).max(2000).nullable(),
});

const bodySchema = z.object({
  consentId: z.string().min(1),
  metrics: metricsSchema,
  note: z.string().max(300).nullable().optional(),
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

  const result = await saveHealthEntry({
    profileId: auth.user.id,
    consentId: parsed.data.consentId,
    metrics: {
      sessionsPerWeek: parsed.data.metrics.sessionsPerWeek,
      sleepHours: parsed.data.metrics.sleepHours,
      restingHr: parsed.data.metrics.restingHr,
      hrvMs: parsed.data.metrics.hrvMs ?? null,
      activeMinutes: parsed.data.metrics.activeMinutes,
    },
    note: parsed.data.note ?? null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, entryId: result.entryId, scores: result.scores });
}
