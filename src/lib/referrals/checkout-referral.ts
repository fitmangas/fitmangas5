import { cookies } from 'next/headers';

import { REF_COOKIE, referralCodeFromCookieValue } from '@/lib/referrals/cookie';

export async function getReferralCodeForCheckout(): Promise<string | null> {
  const jar = await cookies();
  return referralCodeFromCookieValue(jar.get(REF_COOKIE)?.value);
}
