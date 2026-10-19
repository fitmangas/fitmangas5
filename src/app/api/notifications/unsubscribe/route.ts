import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/notifications/v2/unsubscribe';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  const parsed = verifyUnsubscribeToken(token);
  if (!parsed) {
    return NextResponse.json({ error: 'Lien invalide.' }, { status: 400 });
  }
  const admin = createAdminClient();
  await admin.from('profiles').update({ marketing_email_opt_in: false }).eq('id', parsed.userId);
  await admin.from('notification_preferences').update({ content_email_enabled: false }).eq('user_id', parsed.userId);
  return new NextResponse(
    `<!doctype html><html lang="fr"><body style="font-family:Georgia,serif;padding:48px;background:#F5F0EB;color:#2D2D2D;"><p>C’est noté : tu ne recevras plus les emails non transactionnels.</p></body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}
