import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminBlogNewsletterPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: subs, count } = await admin
    .from('newsletter_subscriptions')
    .select('id, email, subscribed_at, confirmed, subscribed_from_article_id', { count: 'exact' })
    .eq('unsubscribed', false)
    .order('subscribed_at', { ascending: false })
    .limit(100);

  const { count: pendingCount } = await admin
    .from('newsletter_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('confirmed', false)
    .eq('unsubscribed', false);

  const { data: publicationEvents } = await admin
    .from('blog_publication_events')
    .select('id, article_id, published_at, newsletter_targeted, newsletter_sent, newsletter_provider')
    .order('published_at', { ascending: false })
    .limit(8);

  const { data: cronLogs } = await admin
    .from('blog_cron_logs')
    .select('id, cron_name, status, message, created_at')
    .order('created_at', { ascending: false })
    .limit(12);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Newsletter</p>
          <h1 className="hero-signature-title mt-2 text-3xl">Abonnés</h1>
          <p className="mt-2 text-sm text-luxury-muted">
            Total confirmés : {count ?? 0} · En attente de confirmation : {pendingCount ?? 0}
          </p>
        </div>
        <Link
          href="/api/admin/blog/newsletter?format=csv"
          className="btn-luxury-primary inline-flex items-center justify-center px-6 py-3 text-[11px] tracking-[0.14em]"
        >
          Export CSV
        </Link>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-white/40 bg-white/40">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/50 bg-white/50 text-[10px] uppercase tracking-[0.14em] text-luxury-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Article</th>
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).map((s) => (
              <tr key={s.id} className="border-b border-white/30">
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{new Date(s.subscribed_at).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      s.confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {s.confirmed ? 'confirmé' : 'en attente'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-luxury-muted">{s.subscribed_from_article_id ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-2xl border border-white/40 bg-white/40 p-5">
        <h2 className="text-lg font-semibold text-luxury-ink">Dernières diffusions publication</h2>
        <div className="mt-4 space-y-2">
          {(publicationEvents ?? []).map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm">
              <span className="font-mono text-xs text-luxury-muted">{e.article_id}</span>
              <span className="text-luxury-muted">{new Date(e.published_at).toLocaleString('fr-FR')}</span>
              <span className="text-luxury-ink">
                {e.newsletter_sent}/{e.newsletter_targeted} envoyé(s) · {e.newsletter_provider ?? 'n/a'}
              </span>
            </div>
          ))}
          {(publicationEvents ?? []).length === 0 ? <p className="text-sm text-luxury-muted">Aucun envoi publication pour le moment.</p> : null}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/40 bg-white/40 p-5">
        <h2 className="text-lg font-semibold text-luxury-ink">Logs automation (cron)</h2>
        <div className="mt-4 space-y-2">
          {(cronLogs ?? []).map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm">
              <span className="font-mono text-xs text-luxury-muted">{log.cron_name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  log.status === 'ok' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {log.status}
              </span>
              <span className="text-luxury-muted">{new Date(log.created_at).toLocaleString('fr-FR')}</span>
              <span className="text-luxury-ink">{log.message ?? '—'}</span>
            </div>
          ))}
          {(cronLogs ?? []).length === 0 ? <p className="text-sm text-luxury-muted">Aucun log cron pour le moment.</p> : null}
        </div>
      </div>
    </main>
  );
}
