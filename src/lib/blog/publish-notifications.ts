import type { SupabaseClient } from '@supabase/supabase-js';
import { dispatch } from '@/lib/notifications/dispatcher';

/**
 * File le nouvel article dans le digest hebdo de chaque member.
 * Pas d’in-app ni d’email immédiat (évite 1 notif × N articles × N members).
 */
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
      return { notifiedUserIds };
    }

    const rows = members ?? [];
    if (rows.length === 0) break;

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
        // Contenu non urgent → digest lundi uniquement (pas de doublon in-app + email).
        channel_hints: ['digest'],
        idempotency_key: `blog.article_published:${params.articleId}:${member.id}`,
      });
      // Toujours exclure le member de la newsletter externe, même si digest désactivé.
      if (result.ok) notifiedUserIds.push(member.id);
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return { notifiedUserIds };
}
