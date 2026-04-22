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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Newsletter</p>
          <h1 className="hero-signature-title mt-2 text-3xl">Abonnés</h1>
          <p className="mt-2 text-sm text-luxury-muted">Total : {count ?? 0}</p>
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
              <th className="px-4 py-3">Article</th>
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).map((s) => (
              <tr key={s.id} className="border-b border-white/30">
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{new Date(s.subscribed_at).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 font-mono text-xs text-luxury-muted">{s.subscribed_from_article_id ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
