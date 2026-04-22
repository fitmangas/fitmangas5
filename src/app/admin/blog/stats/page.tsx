import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminBlogStatsPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { count: publishedCount } = await admin
    .from('blog_articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  const { data: rows } = await admin.from('blog_articles').select(
    'view_count, average_rating, rating_count, average_scroll_percentage',
  );

  let totalViews = 0;
  let weightedRating = 0;
  let ratingWeights = 0;
  let scrollSum = 0;
  let scrollN = 0;

  for (const r of rows ?? []) {
    totalViews += r.view_count ?? 0;
    if (r.average_rating != null && (r.rating_count ?? 0) > 0) {
      weightedRating += Number(r.average_rating) * (r.rating_count ?? 0);
      ratingWeights += r.rating_count ?? 0;
    }
    if ((r.average_scroll_percentage ?? 0) > 0) {
      scrollSum += r.average_scroll_percentage ?? 0;
      scrollN += 1;
    }
  }

  const avgRating = ratingWeights > 0 ? Math.round((weightedRating / ratingWeights) * 100) / 100 : null;
  const avgScroll = scrollN > 0 ? Math.round(scrollSum / scrollN) : null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: trending } = await admin
    .from('blog_articles')
    .select('id, title_fr, slug_fr, view_count, average_rating, published_at')
    .eq('status', 'published')
    .gte('published_at', weekAgo.toISOString())
    .order('view_count', { ascending: false })
    .limit(5);

  const { count: newsletterCount } = await admin
    .from('newsletter_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('unsubscribed', false);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Analytics</p>
      <h1 className="hero-signature-title mt-2 text-3xl">Blog — statistiques</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Articles publiés" value={String(publishedCount ?? 0)} />
        <Kpi label="Vues cumulées" value={String(totalViews)} />
        <Kpi label="Note moyenne" value={avgRating != null ? `${avgRating} / 5` : '—'} />
        <Kpi label="Scroll moyen" value={avgScroll != null ? `${avgScroll} %` : '—'} />
        <Kpi label="Newsletter" value={String(newsletterCount ?? 0)} />
      </div>

      <section className="mt-14">
        <h2 className="text-lg font-semibold text-luxury-ink">Tendance (7 jours)</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/40 bg-white/40">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/50 bg-white/50 text-[10px] uppercase tracking-[0.14em] text-luxury-muted">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Vues</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {(trending ?? []).map((a) => (
                <tr key={a.id} className="border-b border-white/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/articles/${a.id}/stats`} className="font-medium text-orange-800 underline-offset-2 hover:underline">
                      {a.title_fr}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{a.view_count}</td>
                  <td className="px-4 py-3">{a.average_rating != null ? Number(a.average_rating).toFixed(1) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(trending ?? []).length === 0 ? (
            <p className="px-4 py-6 text-sm text-luxury-muted">Pas encore de données sur 7 jours.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl border border-white/40 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-luxury-ink">{value}</p>
    </div>
  );
}
