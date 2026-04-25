import Link from 'next/link';
import { ValidationActions } from '@/components/Admin/blog/ValidationActions';
import { ValidationPreviewModal } from '@/components/Admin/blog/ValidationPreviewModal';
import { formatMonthYear } from '@/lib/blog/month';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

function isWeakDraftContent(content: string | null, description: string | null): boolean {
  const c = (content ?? '').trim();
  const d = (description ?? '').trim();
  if (!c) return true;
  if (c.includes('Paragraphe intro article') || c.includes('Paragraphe développement')) return true;
  if (!c.includes('<h2') && c.length < 600) return true;
  if (d.includes('Description courte pour l’article')) return true;
  return false;
}

export default async function AdminBlogValidationPage() {
  await requireAdmin();

  const admin = createAdminClient();
  const month_year = formatMonthYear(new Date());

  const { data: validations, error } = await admin
    .from('admin_article_validations')
    .select(
      `
      id,
      status,
      month_year,
      notes,
      validated_at,
      blog_articles (
        id,
        title_fr,
        description_fr,
        content_fr,
        slug_fr,
        status,
        scheduled_publication_at,
        coach_notes,
        featured_image_url,
        blog_categories ( label_fr )
      )
    `,
    )
    .eq('month_year', month_year)
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-red-700">
        Erreur chargement : {error.message}. As-tu appliqué la migration <code>015_blog_system.sql</code> ?
      </div>
    );
  }

  const rows = validations ?? [];
  const pending = rows.filter((r) => r.status === 'pending');

  const titles = Array.from(
    new Set(
      rows
        .map((row) => (row.blog_articles as { title_fr?: string } | null)?.title_fr?.trim())
        .filter((v): v is string => Boolean(v)),
    ),
  );

  const richerByTitle = new Map<
    string,
    {
      description_fr: string | null;
      content_fr: string | null;
      featured_image_url: string | null;
      blog_categories: { label_fr: string } | null;
    }
  >();

  if (titles.length > 0) {
    const { data: titleCandidates } = await admin
      .from('blog_articles')
      .select(
        `
        title_fr,
        description_fr,
        content_fr,
        featured_image_url,
        scheduled_publication_at,
        blog_categories ( label_fr )
      `,
      )
      .in('title_fr', titles)
      .order('scheduled_publication_at', { ascending: false });

    for (const candidate of titleCandidates ?? []) {
      const title = candidate.title_fr?.trim();
      if (!title || richerByTitle.has(title)) continue;
      const looksGood = !isWeakDraftContent(candidate.content_fr, candidate.description_fr);
      if (!looksGood) continue;
      const category = Array.isArray(candidate.blog_categories)
        ? (candidate.blog_categories[0] as { label_fr?: string } | undefined)
        : (candidate.blog_categories as { label_fr?: string } | null);
      richerByTitle.set(title, {
        description_fr: candidate.description_fr,
        content_fr: candidate.content_fr,
        featured_image_url: candidate.featured_image_url,
        blog_categories: category?.label_fr ? { label_fr: category.label_fr } : null,
      });
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Validation</p>
      <h1 className="hero-signature-title mt-2 text-3xl">Articles du mois</h1>
      <p className="mt-2 text-sm text-luxury-muted">
        {month_year} · {pending.length} en attente sur {rows.length} ligne(s) de batch.
      </p>

      <div className="mt-10 space-y-6">
        {rows.map((row) => {
          const article = row.blog_articles as unknown as {
            id: string;
            title_fr: string;
            description_fr: string | null;
            content_fr: string;
            slug_fr: string;
            status: string;
            scheduled_publication_at: string;
            coach_notes: string | null;
            featured_image_url: string | null;
            blog_categories: { label_fr: string } | null;
          } | null;

          if (!article) return null;

          const useRicher = isWeakDraftContent(article.content_fr, article.description_fr);
          const richer = useRicher ? richerByTitle.get(article.title_fr) : null;
          const displayArticle = richer
            ? {
                ...article,
                description_fr: richer.description_fr ?? article.description_fr,
                content_fr: richer.content_fr ?? article.content_fr,
                featured_image_url: richer.featured_image_url ?? article.featured_image_url,
                blog_categories: richer.blog_categories ?? article.blog_categories,
              }
            : article;

          const scheduled = new Date(displayArticle.scheduled_publication_at).toLocaleString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <section key={row.id} className="glass-card rounded-2xl border border-white/40 p-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-white/30 md:w-48">
                  {displayArticle.featured_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={displayArticle.featured_image_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">
                    {displayArticle.blog_categories?.label_fr ?? 'Catégorie'}
                  </span>
                  <h2 className="mt-1 text-xl font-semibold text-luxury-ink">{displayArticle.title_fr}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-luxury-muted">{displayArticle.description_fr}</p>
                  <p className="mt-3 text-xs text-luxury-muted">
                    Publication prévue : {scheduled} · Statut article :{' '}
                    <span className="font-semibold">{displayArticle.status}</span> · Validation :{' '}
                    <span className="font-semibold">{row.status}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <ValidationPreviewModal
                      title={displayArticle.title_fr}
                      description={displayArticle.description_fr}
                      content={displayArticle.content_fr}
                      categoryLabel={displayArticle.blog_categories?.label_fr ?? 'Catégorie'}
                    />
                    <Link
                      href={`/admin/blog/articles/${article.id}/stats`}
                      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luxury-muted underline underline-offset-2"
                    >
                      Stats
                    </Link>
                  </div>
                  {row.status === 'pending' ? (
                    <ValidationActions validationId={row.id} articleTitle={article.title_fr} />
                  ) : null}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-luxury-muted">
          Aucune ligne de validation pour ce mois. Lance le script seed ou crée des entrées{' '}
          <code className="rounded bg-white/50 px-1">admin_article_validations</code>.
        </p>
      ) : null}

      <div className="mt-10 flex justify-center">
        <Link
          href="/admin/blog/calendar"
          className="rounded-full border border-luxury-soft/40 bg-white/70 px-5 py-2 text-sm font-semibold text-luxury-ink transition hover:bg-white"
        >
          Voir le calendrier des prochains articles
        </Link>
      </div>
    </main>
  );
}
