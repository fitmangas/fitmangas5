import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const REF_COOKIE = 'fitmangas_ref';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  if (
    request.nextUrl.pathname === '/compte' &&
    request.nextUrl.searchParams.get('checkout') === 'success' &&
    request.nextUrl.searchParams.get('session_id') &&
    !user
  ) {
    const sid = request.nextUrl.searchParams.get('session_id');
    const url = new URL('/auth/checkout-success', request.url);
    if (sid) url.searchParams.set('session_id', sid);
    return NextResponse.redirect(url);
  }
  const ref = request.nextUrl.searchParams.get('ref');
  if (ref) {
    const cleaned = ref
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 48);
    if (cleaned.length >= 4) {
      response.cookies.set(REF_COOKIE, cleaned, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }
  }
  return response;
}

export const config = {
  matcher: [
    // Exclut le flux ICS : Apple le fetch sans session ; éviter Set-Cookie / session rewrite.
    '/((?!_next/static|_next/image|favicon.ico|api/calendar/feed|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
