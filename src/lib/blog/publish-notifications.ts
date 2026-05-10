import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatch } from '@/lib/notifications/dispatcher';

/** Notifie tous les membres qu’un article blog est publié (batch). */
export async function notifyMembersNewBlogArticle(
  admin: SupabaseClient,
  params: { articleId: string; title: string; slugFr: string; excerpt?: string | null },
) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/$/, '');
  const link = appUrl ? `${appUrl}/blog/${params.slugFr}` : `/blog/${params.slugFr}`;
  const body = params.excerpt?.trim() || `« ${params.title} » — ${link}`;
  const notifiedUserIds: string[] = [];

  const pageSize = 500;
  let from = 0;
  for (;;) {
    const { data: members, error } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'member')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('[notifyMembersNewBlogArticle]', error.message);
      return;
    }

    const rows = members ?? [];
    if (rows.length === 0) break;

    // DEPRECATED: replaced by dispatcher in Phase 3.
    // Ancien chemin : insert direct dans user_notifications.
    for (const member of rows) {
      const result = await dispatch(admin, {
        event_type: 'blog.article_published',
        user_id: member.id,
        payload: {
          title: params.title,
          body,
          kind: 'blog_article',
          article_id: params.articleId,
          slug: params.slugFr,
          excerpt: body,
          articleUrl: link,
        },
        channel_hints: ['in_app', 'email'],
        idempotency_key: `blog.article_published:${params.articleId}:${member.id}`,
      });
      if (result.ok) notifiedUserIds.push(member.id);
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return { notifiedUserIds };
}
