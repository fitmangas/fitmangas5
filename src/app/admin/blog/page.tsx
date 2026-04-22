import Link from 'next/link';
import { BarChart3, ClipboardCheck, Mail } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/require-admin';

export default async function AdminBlogHubPage() {
  await requireAdmin();

  const cards = [
    {
      href: '/admin/blog/validation',
      title: 'Validation mensuelle',
      desc: 'Valider les 8 articles du mois avant publication.',
      icon: ClipboardCheck,
    },
    {
      href: '/admin/blog/stats',
      title: 'Statistiques',
      desc: 'Vues, notes, engagement, tendances.',
      icon: BarChart3,
    },
    {
      href: '/admin/blog/newsletter',
      title: 'Newsletter',
      desc: 'Abonnés et export CSV.',
      icon: Mail,
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Admin</p>
      <h1 className="hero-signature-title mt-2 text-3xl">Blog Pilates</h1>
      <p className="mt-3 text-sm text-luxury-muted">Pilotage éditorial, publication et analytics.</p>

      <div className="mt-10 grid gap-4">
        {cards.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="glass-card flex items-start gap-4 rounded-2xl border border-white/40 p-6 transition hover:border-orange-200/80"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-700">
              <Icon size={22} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-luxury-ink">{title}</h2>
              <p className="mt-1 text-sm text-luxury-muted">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
