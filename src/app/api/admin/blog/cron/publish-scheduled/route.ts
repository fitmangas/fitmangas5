import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/blog/cron-secret';
import { notifyMembersNewBlogArticle } from '@/lib/blog/publish-notifications';
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

  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const { data: due, error } = await admin
      .from('blog_articles')
      .select('id, title_fr, slug_fr')
      .eq('status', 'validated')
      .lte('scheduled_publication_at', now);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const publishedIds: string[] = [];

    for (const row of due ?? []) {
      const { error: upErr } = await admin
        .from('blog_articles')
        .update({
          status: 'published',
          published_at: now,
          updated_at: now,
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
      }
    }

    return NextResponse.json({ published: publishedIds.length, articleIds: publishedIds });
  } catch (e) {
    console.error('[cron publish]', e);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
