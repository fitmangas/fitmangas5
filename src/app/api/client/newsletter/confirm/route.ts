import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get('token') ?? '').trim();
  if (!token) return NextResponse.redirect(new URL('/blog?newsletter=token-manquant', url.origin));

  const admin = createAdminClient();
  const { data: tokenRow } = await admin
    .from('newsletter_confirmation_tokens')
    .select('id, subscription_id, expires_at, used_at')
    .eq('token', token)
    .maybeSingle();

  if (!tokenRow) return NextResponse.redirect(new URL('/blog?newsletter=token-invalide', url.origin));
  if (tokenRow.used_at) return NextResponse.redirect(new URL('/blog?newsletter=deja-confirme', url.origin));
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(new URL('/blog?newsletter=token-expire', url.origin));
  }

  const now = new Date().toISOString();
  await admin.from('newsletter_subscriptions').update({ confirmed: true, confirmed_at: now }).eq('id', tokenRow.subscription_id);
  await admin.from('newsletter_confirmation_tokens').update({ used_at: now }).eq('id', tokenRow.id);

  return NextResponse.redirect(new URL('/blog?newsletter=confirme', url.origin));
}
