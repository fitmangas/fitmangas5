import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { sendPublicationNewsletter } from '@/lib/blog/newsletter-double-optin';
import { notifyMembersNewBlogArticle } from '@/lib/blog/publish-notifications';
import { COACH_PUBLISH_TIMEZONE, isWithinCoachMorningPublishWindow } from '@/lib/notifications/timezone';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  return handlePublish(request);
}

export async function POST(request: Request) {
  return handlePublish(request);
}

async function handlePublish(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const now = new Date();
  if (!isWithinCoachMorningPublishWindow(now, COACH_PUBLISH_TIMEZONE)) {
    return NextResponse.json({
      skipped: true,
      reason: 'outside_coach_publish_window',
      coachTimeZone: COACH_PUBLISH_TIMEZONE,
    });
  }

  try {
    const admin = createAdminClient();
    const nowIso = now.toISOString();

    const { data: due, error } = await admin
      .from('blog_articles')
      .select('id, title_fr, slug_fr')
      .eq('status', 'validated')
      .lte('scheduled_publication_at', nowIso);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const publishedIds: string[] = [];
    let notificationsSent = 0;
    let newsletterTargeted = 0;
    let newsletterSent = 0;

    for (const row of due ?? []) {
      const { error: upErr } = await admin
        .from('blog_articles')
        .update({
          status: 'published',
          published_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', row.id)
        .eq('status', 'validated');

      if (!upErr) {
        publishedIds.push(row.id);
        await notifyMembersNewBlogArticle(admin, {
          articleId: row.id,
          title: row.title_fr,
          slugFr: row.slug_fr,
        });
        notificationsSent += 1;

        const newsletter = await sendPublicationNewsletter({
          articleId: row.id,
          title: row.title_fr,
          slugFr: row.slug_fr,
        });
        newsletterTargeted += newsletter.targeted;
        newsletterSent += newsletter.sent;
      }
    }

    await admin.from('blog_cron_logs').insert({
      cron_name: 'blog_publish_scheduled',
      status: 'ok',
      message: `published=${publishedIds.length}`,
      meta: { articleIds: publishedIds, notificationsSent, newsletterTargeted, newsletterSent },
    });

    return NextResponse.json({
      published: publishedIds.length,
      articleIds: publishedIds,
      notificationsSent,
      newsletterTargeted,
      newsletterSent,
    });
  } catch (e) {
    console.error('[cron publish]', e);
    const admin = createAdminClient();
    await admin.from('blog_cron_logs').insert({
      cron_name: 'blog_publish_scheduled',
      status: 'error',
      message: e instanceof Error ? e.message : 'Erreur serveur',
    });
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
