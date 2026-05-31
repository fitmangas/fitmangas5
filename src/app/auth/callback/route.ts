import { NextResponse } from 'next/server';
import { attachReferralForNewUser } from '@/lib/referrals/attach';
import { resolvePostLoginPath } from '@/lib/auth/post-login-redirect';
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
  const nextParam = searchParams.get('next');
  const next = nextParam?.startsWith('/') ? nextParam : '/compte';
  const ref = readRefCookieFromHeader(request.headers.get('cookie'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (ref && user?.email) {
        const admin = createAdminClient();
        await attachReferralForNewUser(admin, ref, user.id, user.email);
      }

      let destination = next;
      if (user) {
        const postLogin = await resolvePostLoginPath(supabase, user);
        if (postLogin === '/admin' && (next === '/compte' || !nextParam)) {
          destination = '/admin';
        }
      }

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/?auth=error`);
}
