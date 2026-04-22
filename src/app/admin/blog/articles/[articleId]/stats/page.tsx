import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeatmapPreview } from '@/components/Admin/blog/HeatmapPreview';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminArticleStatsPage({ params }: { params: Promise<{ articleId: string }> }) {
  await requireAdmin();
  const { articleId } = await params;

  const admin = createAdminClient();
  const { data: article } = await admin
    .from('blog_articles')
    .select('id, title_fr, slug_fr, view_count, average_rating, rating_count, average_scroll_percentage, average_time_spent_seconds')
    .eq('id', articleId)
    .maybeSingle();

  if (!article) notFound();

  const { data: heatmap } = await admin
    .from('blog_heatmap_data')
    .select('section_bucket, scroll_hits, average_time_spent_seconds')
    .eq('article_id', articleId)
    .order('section_bucket', { ascending: true });

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (let star = 1; star <= 5; star++) {
    const { count } = await admin
      .from('blog_article_ratings')
      .select('*', { count: 'exact', head: true })
      .eq('article_id', articleId)
      .eq('rating', star);
    dist[star] = count ?? 0;
  }

  const maxHits = Math.max(1, ...(heatmap ?? []).map((h) => h.scroll_hits ?? 0));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/blog/stats" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted hover:text-luxury-ink">
        ← Stats globales
      </Link>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Article</p>
      <h1 className="hero-signature-title mt-2 text-3xl">{article.title_fr}</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Vues" value={String(article.view_count ?? 0)} />
        <Stat label="Note moyenne" value={article.average_rating != null ? `${Number(article.average_rating).toFixed(2)} / 5` : '—'} />
        <Stat label="Votes" value={String(article.rating_count ?? 0)} />
        <Stat label="Scroll moyen" value={`${article.average_scroll_percentage ?? 0} %`} />
        <Stat label="Temps moyen" value={`${article.average_time_spent_seconds ?? 0} s`} />
      </div>

      <section className="mt-14">
        <h2 className="text-lg font-semibold text-luxury-ink">Heatmap de scroll (par bandes de 5 %)</h2>
        <p className="mt-2 text-sm text-luxury-muted">
          Rouge = forte densité de passages ; bleu clair = faible. Les données s’enrichissent avec la lecture des clientes connectées.
        </p>
        <HeatmapPreview buckets={heatmap ?? []} maxHits={maxHits} />
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold text-luxury-ink">Répartition des notes</h2>
        <div className="mt-4 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="w-12 font-medium">{star} ★</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/50">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{
                    width: `${Math.min(100, ((dist[star] ?? 0) / Math.max(1, article.rating_count ?? 1)) * 100)}%`,
                  }}
                />
              </div>
              <span className="w-10 text-right text-luxury-muted">{dist[star]}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl border border-white/40 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{label}</p>
      <p className="mt-2 text-xl font-semibold text-luxury-ink">{value}</p>
    </div>
  );
}
