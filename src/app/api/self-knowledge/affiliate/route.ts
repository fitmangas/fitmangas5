import { NextResponse } from 'next/server';
import { publicServerError } from '@/lib/http/public-error';
import { z } from 'zod';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  resourceId: z.string().uuid(),
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

  const admin = createAdminClient();
  const { error } = await admin.from('affiliate_clicks').insert({
    user_id: user.id,
    resource_id: parsed.data.resourceId,
  });

  if (error) return publicServerError('self-knowledge/affiliate', error, 500);
  return NextResponse.json({ ok: true });
}
