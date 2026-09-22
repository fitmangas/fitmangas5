import { NextResponse } from 'next/server';
import { z } from 'zod';

import { buildShareUrl, createShareInvite } from '@/lib/self-knowledge/invites';

const bodySchema = z.object({
  inviterEmail: z.string().trim().email().max(120),
  inviterFirstName: z.string().trim().max(60).optional().nullable(),
  inviterResultId: z.string().uuid().optional().nullable(),
  locale: z.enum(['fr', 'es']).optional().default('fr'),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
      { status: 400 },
    );
  }

  const created = await createShareInvite({
    inviterEmail: parsed.data.inviterEmail,
    inviterFirstName: parsed.data.inviterFirstName,
    inviterResultId: parsed.data.inviterResultId,
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status });
  }

  const shareUrl = buildShareUrl(created.invite.share_token, parsed.data.locale);

  return NextResponse.json({
    ok: true,
    inviteId: created.invite.id,
    shareToken: created.invite.share_token,
    shareUrl,
  });
}
