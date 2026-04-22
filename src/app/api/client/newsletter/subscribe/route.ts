import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** Inscription newsletter — confirmation email : brancher Resend/Sendgrid plus tard. */
export async function POST(request: Request) {
  let body: { email?: string; articleId?: string | null; coachId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    let coachId = typeof body.coachId === 'string' ? body.coachId : null;
    if (!coachId) {
      const { data: coach } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
      coachId = coach?.id ?? null;
    }

    if (!coachId) {
      return NextResponse.json({ error: 'Coach introuvable.' }, { status: 503 });
    }

    const articleId =
      typeof body.articleId === 'string' && body.articleId.length > 0 ? body.articleId : null;

    const { error } = await admin.from('newsletter_subscriptions').upsert(
      {
        email,
        coach_id: coachId,
        subscribed_from_article_id: articleId,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        unsubscribed: false,
      },
      { onConflict: 'email,coach_id' },
    );

    if (error) {
      console.error('[newsletter]', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[newsletter]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
