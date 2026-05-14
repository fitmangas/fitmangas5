import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const REF_COOKIE = 'fitmangas_ref';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
