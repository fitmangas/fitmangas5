import type { SupabaseClient } from '@supabase/supabase-js';

import { assertContentSafeToPublish } from '@/lib/blog/blog-content-guards';
import { sendPublicationNewsletter } from '@/lib/blog/newsletter-double-optin';
import { notifyMembersNewBlogArticle } from '@/lib/blog/publish-notifications';

type PublishDueResult = {
  publishedIds: string[];
  skippedIds: string[];
  notificationsSent: number;
  newsletterTargeted: number;
  newsletterSent: number;
};

async function loadPublishedContentsForGuard(
  client: SupabaseClient,
): Promise<Array<{ id: string; contentHtml: string }>> {
  const { data } = await client
    .from('blog_articles')
    .select('id, content_fr')
    .eq('status', 'published');
  return (data ?? []).map((row) => ({
    id: row.id as string,
    contentHtml: (row.content_fr as string) ?? '',
  }));
}

export async function publishDueBlogArticles(
  client: SupabaseClient,
  params: { articleIds?: string[]; now?: Date; includeDraft?: boolean } = {},
): Promise<PublishDueResult> {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();

  let query = client
    .from('blog_articles')
    .select('id, title_fr, slug_fr, content_fr, description_fr')
    .lte('scheduled_publication_at', nowIso);

  query = params.includeDraft ? query.in('status', ['draft', 'validated']) : query.eq('status', 'validated');

  if (params.articleIds && params.articleIds.length > 0) {
    query = query.in('id', params.articleIds);
  }

  const { data, error } = await query;
  if (error) throw error;

  const existingContents = await loadPublishedContentsForGuard(client);
  const publishedIds: string[] = [];
  const skippedIds: string[] = [];
  let notificationsSent = 0;
  let newsletterTargeted = 0;
  let newsletterSent = 0;

  for (const row of (data ?? []) as {
    id: string;
    title_fr: string;
    slug_fr: string;
    content_fr: string | null;
    description_fr: string | null;
  }[]) {
    const guard = assertContentSafeToPublish({
      contentHtml: row.content_fr ?? '',
      description: row.description_fr,
      existingContents,
      excludeArticleId: row.id,
    });
    if (!guard.allowed) {
      console.warn(`[publishDue] skip ${row.id}: ${guard.reason}`);
      skippedIds.push(row.id);
      continue;
    }

    const { error: updateError } = await client
      .from('blog_articles')
      .update({ status: 'published', published_at: nowIso, updated_at: nowIso })
      .eq('id', row.id)
      .in('status', params.includeDraft ? ['draft', 'validated'] : ['validated']);

    if (updateError) throw updateError;

    publishedIds.push(row.id);
    existingContents.push({ id: row.id, contentHtml: row.content_fr ?? '' });

    const memberNotifications = await notifyMembersNewBlogArticle(client, {
      articleId: row.id,
      title: row.title_fr,
      slugFr: row.slug_fr,
    });
    notificationsSent += 1;

    const newsletter = await sendPublicationNewsletter({
      articleId: row.id,
      title: row.title_fr,
      slugFr: row.slug_fr,
      excludeUserIds: memberNotifications?.notifiedUserIds ?? [],
    });
    newsletterTargeted += newsletter.targeted;
    newsletterSent += newsletter.sent;
  }

  return { publishedIds, skippedIds, notificationsSent, newsletterTargeted, newsletterSent };
}

export async function reconcileValidatedBlogArticles(
  client: SupabaseClient,
  params: { monthYear: string; now?: Date },
) {
  const now = params.now ?? new Date();
  const nowIso = now.toISOString();

  const { data, error } = await client
    .from('admin_article_validations')
    .select('article_id, blog_articles(id,status,scheduled_publication_at)')
    .eq('month_year', params.monthYear)
    .eq('status', 'validated');

  if (error) throw error;

  const dueArticleIds: string[] = [];
  const futureArticleIds: string[] = [];

  for (const row of data ?? []) {
    const article = Array.isArray(row.blog_articles) ? row.blog_articles[0] : row.blog_articles;
    const articleId = row.article_id ?? article?.id;
    if (!articleId || article?.status === 'published') continue;

    const scheduledAt = article?.scheduled_publication_at;
    if (scheduledAt && new Date(scheduledAt).getTime() <= now.getTime()) {
      dueArticleIds.push(articleId);
    } else {
      futureArticleIds.push(articleId);
    }
  }

  if (futureArticleIds.length > 0) {
    const { error: futureError } = await client
      .from('blog_articles')
      .update({ status: 'validated', updated_at: nowIso })
      .in('id', futureArticleIds)
      .neq('status', 'published');

    if (futureError) throw futureError;
  }

  const published =
    dueArticleIds.length > 0
      ? await publishDueBlogArticles(client, { articleIds: dueArticleIds, now, includeDraft: true })
      : {
          publishedIds: [],
          skippedIds: [],
          notificationsSent: 0,
          newsletterTargeted: 0,
          newsletterSent: 0,
        };

  return {
    futureValidated: futureArticleIds.length,
    published: published.publishedIds.length,
    publishedIds: published.publishedIds,
    skippedIds: published.skippedIds,
  };
}
