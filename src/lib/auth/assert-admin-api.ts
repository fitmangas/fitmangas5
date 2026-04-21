import { NextResponse } from 'next/server';

import { checkIsAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';

export async function requireAdminApi(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }) };
  }

  const adminCheck = await checkIsAdmin(supabase, user);
  if (!adminCheck.isAdmin) {
    return { ok: false, response: NextResponse.json({ error: 'Accès refusé.' }, { status: 403 }) };
  }

  return { ok: true, userId: user.id };
}
