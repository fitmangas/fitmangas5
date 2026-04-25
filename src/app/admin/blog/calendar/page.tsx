import Link from 'next/link';
import { CalendarDraftStatusModal } from '@/components/Admin/blog/CalendarDraftStatusModal';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

type ArticleRow = {
  id: string;
  title_fr: string;
  slug_fr: string;
  scheduled_publication_at: string;
  status: string;
  description_fr: string | null;
  content_fr: string | null;
  blog_categories: Array<{ label_fr: string }> | null;
};

type MonthBucket = {
  rows: ArticleRow[];
  dedupedCount: number;
};

function monthKey(dateIso: string): string {
  const d = new Date(dateIso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDate(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function articleKey(row: ArticleRow): string {
  const byIndex = /article pilates\s+(\d+)/i.exec(row.title_fr)?.[1];
  if (byIndex) return `idx-${byIndex}`;
  return row.slug_fr;
}

export default async function AdminBlogCalendarPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from('blog_articles')
    .select(
      `
      id,
      title_fr,
      slug_fr,
      scheduled_publication_at,
      status,
      description_fr,
      content_fr,
      blog_categories ( label_fr )
    `,
    )
    .gte('scheduled_publication_at', nowIso)
    .in('status', ['draft', 'validated'])
    .order('scheduled_publication_at', { ascending: true })
    .limit(300);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-red-700">Erreur chargement calendrier: {error.message}</p>
      </main>
    );
  }

  const rows = (data ?? []) as unknown as ArticleRow[];
  const byMonth = new Map<string, MonthBucket>();
  for (const row of rows) {
    const key = monthKey(row.scheduled_publication_at);
    const bucket = byMonth.get(key) ?? { rows: [], dedupedCount: 0 };
    const currentKeys = new Set(bucket.rows.map(articleKey));
    const k = articleKey(row);
    if (currentKeys.has(k)) {
      bucket.dedupedCount += 1;
      byMonth.set(key, bucket);
      continue;
    }
    bucket.rows.push(row);
    byMonth.set(key, bucket);
  }
  const monthEntries = Array.from(byMonth.entries());

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Blog</p>
          <h1 className="hero-signature-title mt-2 text-3xl">Calendrier des prochains articles</h1>
          <p className="mt-2 text-sm text-luxury-muted">
            Vue des publications planifiées avec objectif de 8 validations par mois.
          </p>
        </div>
        <Link
          href="/admin/blog/validation"
          className="rounded-full border border-luxury-soft/40 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-luxury-ink transition hover:bg-white"
        >
          Retour validation
        </Link>
      </div>

      {monthEntries.length === 0 ? (
        <p className="mt-10 text-sm text-luxury-muted">Aucun article planifié à partir d’aujourd’hui.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {monthEntries.map(([month, bucket]) => {
            const articles = bucket.rows.slice(0, 8);
            const overflowCount = Math.max(0, bucket.rows.length - articles.length);
            return (
            <section key={month} className="glass-card rounded-2xl border border-white/40 p-6">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-xl font-semibold text-luxury-ink">{month}</h2>
                <p className="text-sm text-luxury-muted">
                  {articles.length} article(s) planifié(s) affiché(s) · objectif mensuel: 8
                </p>
              </div>
              {bucket.dedupedCount > 0 || overflowCount > 0 ? (
                <p className="mt-2 text-xs text-luxury-muted">
                  Nettoyage auto calendrier: {bucket.dedupedCount} doublon(s) masqué(s)
                  {overflowCount > 0 ? ` · ${overflowCount} article(s) supplémentaire(s) hors quota mensuel` : ''}.
                </p>
              ) : null}

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-left text-xs uppercase tracking-[0.14em] text-luxury-muted">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Catégorie</th>
                      <th className="py-2 pr-4">Titre</th>
                      <th className="py-2 pr-4">Statut</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => (
                      <tr key={article.id} className="border-b border-black/5 align-top text-luxury-ink">
                        <td className="py-3 pr-4">{formatDate(article.scheduled_publication_at)}</td>
                        <td className="py-3 pr-4">{article.blog_categories?.[0]?.label_fr ?? 'Catégorie'}</td>
                        <td className="py-3 pr-4 font-medium">{article.title_fr}</td>
                        <td className="py-3 pr-4">
                          {article.status === 'draft' ? (
                            <CalendarDraftStatusModal
                              title={article.title_fr}
                              description={article.description_fr}
                              content={article.content_fr}
                              categoryLabel={article.blog_categories?.[0]?.label_fr ?? 'Catégorie'}
                            />
                          ) : (
                            article.status
                          )}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/admin/blog/articles/${article.id}/stats`}
                            className="text-xs font-semibold uppercase tracking-[0.12em] text-luxury-muted underline underline-offset-2"
                          >
                            Stats
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
          })}
        </div>
      )}
    </main>
  );
}
