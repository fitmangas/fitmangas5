import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { attachReferralForNewUser } from '@/lib/referrals/attach';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const REF_COOKIE = 'fitmangas_ref';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ ok: false, error: 'auth' }, { status: 401 });
  }

  const jar = await cookies();
  const ref = jar.get(REF_COOKIE)?.value;
  if (!ref) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const admin = createAdminClient();
  await attachReferralForNewUser(admin, ref, user.id, user.email);
  return NextResponse.json({ ok: true });
}
