import type { SupabaseClient } from '@supabase/supabase-js';

/** Notifie tous les membres qu’un article blog est publié (batch). */
export async function notifyMembersNewBlogArticle(
  admin: SupabaseClient,
  params: { articleId: string; title: string; slugFr: string },
) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/$/, '');
  const link = appUrl ? `${appUrl}/blog/${params.slugFr}` : `/blog/${params.slugFr}`;
  const body = `« ${params.title} » — ${link}`;

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

    const insertRows = rows.map((m) => ({
      user_id: m.id,
      kind: 'blog_article',
      title: 'Nouvel article Pilates',
      body,
    }));

    const { error: insErr } = await admin.from('user_notifications').insert(insertRows);
    if (insErr) {
      console.error('[notifyMembersNewBlogArticle] insert', insErr.message);
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }
}
