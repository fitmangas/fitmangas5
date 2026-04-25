import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNewsletterConfirmationToken, sendNewsletterConfirmationEmail } from '@/lib/blog/newsletter-double-optin';

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

    const { data: row, error } = await admin
      .from('newsletter_subscriptions')
      .upsert(
      {
        email,
        coach_id: coachId,
        subscribed_from_article_id: articleId,
        confirmed: false,
        confirmed_at: null,
        unsubscribed: false,
      },
      { onConflict: 'email,coach_id' },
      )
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[newsletter]', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!row?.id) {
      return NextResponse.json({ error: 'Impossible de créer l’inscription.' }, { status: 500 });
    }

    const token = await createNewsletterConfirmationToken(row.id);
    const emailResult = await sendNewsletterConfirmationEmail(email, token);

    return NextResponse.json({
      ok: true,
      pendingConfirmation: true,
      emailSent: emailResult.sent,
      confirmUrl: emailResult.sent ? undefined : emailResult.confirmUrl,
    });
  } catch (e) {
    console.error('[newsletter]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
