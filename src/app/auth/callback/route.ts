import { NextResponse } from 'next/server';
import { attachReferralForNewUser } from '@/lib/referrals/attach';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function readRefCookieFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'fitmangas_ref' && rest.length) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        return rest.join('=');
      }
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next')?.startsWith('/') ? searchParams.get('next')! : '/compte';
  const ref = readRefCookieFromHeader(request.headers.get('cookie'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (ref) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          const admin = createAdminClient();
          await attachReferralForNewUser(admin, ref, user.id, user.email);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth=error`);
}
