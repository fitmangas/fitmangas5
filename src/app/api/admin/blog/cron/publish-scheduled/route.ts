import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { publishDueBlogArticles } from '@/lib/blog/publish-due';
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

  try {
    const admin = createAdminClient();
    const result = await publishDueBlogArticles(admin, { now, includeDraft: false });

    await admin.from('blog_cron_logs').insert({
      cron_name: 'blog_publish_scheduled',
      status: 'ok',
      message: `published=${result.publishedIds.length} skipped=${result.skippedIds.length}`,
      meta: {
        articleIds: result.publishedIds,
        skippedIds: result.skippedIds,
        notificationsSent: result.notificationsSent,
        newsletterTargeted: result.newsletterTargeted,
        newsletterSent: result.newsletterSent,
      },
    });

    return NextResponse.json({
      published: result.publishedIds.length,
      articleIds: result.publishedIds,
      skipped: result.skippedIds.length,
      skippedIds: result.skippedIds,
      notificationsSent: result.notificationsSent,
      newsletterTargeted: result.newsletterTargeted,
      newsletterSent: result.newsletterSent,
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
