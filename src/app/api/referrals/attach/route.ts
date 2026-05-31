import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { attachReferralForNewUser } from '@/lib/referrals/attach';
import { REF_COOKIE, isValidReferralCode, normalizeReferralCode, referralCodeFromCookieValue } from '@/lib/referrals/cookie';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ ok: false, error: 'auth' }, { status: 401 });
  }

  const jar = await cookies();
  let ref = referralCodeFromCookieValue(jar.get(REF_COOKIE)?.value);

  try {
    const body = (await request.json()) as { code?: string };
    if (typeof body?.code === 'string' && body.code.trim()) {
      const manual = normalizeReferralCode(body.code);
      if (isValidReferralCode(manual)) {
        ref = manual;
        jar.set(REF_COOKIE, manual, {
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
    }
  } catch {
    // corps vide : cookie seul
  }

  if (!ref) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const admin = createAdminClient();
  await attachReferralForNewUser(admin, ref, user.id, user.email);
  return NextResponse.json({ ok: true });
}
