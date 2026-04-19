import { NextResponse } from 'next/server';

import { DEMO_CLIENT_COOKIE } from '@/lib/demo-client-mode';

/** Quitte le mode démo et renvoie au dashboard admin. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(`${origin}/admin`, 303);
  res.cookies.set(DEMO_CLIENT_COOKIE, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
