import { NextResponse } from 'next/server';

import { canUseAdminViewSwitch } from '@/lib/auth/admin';
import { DEMO_CLIENT_COOKIE } from '@/lib/demo-client-mode';
import { createClient } from '@/lib/supabase/server';

/** Active le mode démo vue client et renvoie vers l’espace élève (/compte). */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await canUseAdminViewSwitch(supabase, user)).canSwitch) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(`${origin}/compte`, 303);
  res.cookies.set(DEMO_CLIENT_COOKIE, '1', {
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
