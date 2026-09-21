import { NextResponse } from 'next/server';

import { completeYouTubeOAuthAction } from '@/app/admin/community/actions';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) {
    return NextResponse.redirect(new URL('/admin/croissance?tab=publications&youtube=error', request.url));
  }
  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/croissance?tab=publications&youtube=missing_code', request.url),
    );
  }

  const result = await completeYouTubeOAuthAction(code);
  if (!result.ok) {
    return NextResponse.redirect(new URL('/admin/croissance?tab=publications&youtube=failed', request.url));
  }
  return NextResponse.redirect(new URL('/admin/croissance?tab=publications&youtube=connected', request.url));
}
