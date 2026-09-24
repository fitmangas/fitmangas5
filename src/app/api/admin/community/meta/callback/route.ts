import { NextResponse } from 'next/server';

import { exchangeMetaCodeForConnection } from '@/lib/admin/meta-social';
import { saveMetaSocialConnection } from '@/lib/admin/social-comms';
import { requireAdmin } from '@/lib/auth/require-admin';

/**
 * Échange le code Meta AVANT requireAdmin : le code OAuth est one-shot.
 * Sans session admin, on perdait le code (redirect /login) et le token
 * n’était jamais enregistré — cas typique d’un navigateur agent sans cookie.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/admin/croissance?tab=publications&meta=error', request.url));
  }
  if (!code) {
    return NextResponse.redirect(new URL('/admin/croissance?tab=publications&meta=missing_code', request.url));
  }

  let ok = false;
  try {
    const connection = await exchangeMetaCodeForConnection(code);
    await saveMetaSocialConnection(connection);
    ok = true;
  } catch {
    ok = false;
  }

  let isAdmin = false;
  try {
    await requireAdmin();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  const meta = ok ? 'connected' : 'failed';
  if (!isAdmin) {
    return NextResponse.redirect(new URL(`/login?meta=${meta}`, request.url));
  }
  return NextResponse.redirect(new URL(`/admin/croissance?tab=publications&meta=${meta}`, request.url));
}
