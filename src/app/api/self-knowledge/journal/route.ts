import { NextResponse } from 'next/server';
import { z } from 'zod';

import { insertJournalEntry } from '@/lib/self-knowledge/store';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  victory: z.string().min(1).max(2000),
  friction: z.string().min(1).max(2000),
  nextStep: z.string().min(1).max(2000),
  locale: z.enum(['fr', 'es']).default('fr'),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const result = await insertJournalEntry({
    profileId: user.id,
    victory: parsed.data.victory,
    friction: parsed.data.friction,
    nextStep: parsed.data.nextStep,
    locale: parsed.data.locale,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, id: result.id });
}
