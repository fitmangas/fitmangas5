import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AvatarWithRibbon } from '@/components/ui/AvatarWithRibbon';
import { gradeLabel } from '@/lib/gamification';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

function formatTier(t: string | null): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ');
}

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error || !profile) notFound();

  const [{ data: subs }, { data: enrollments }] = await Promise.all([
    admin.from('subscriptions').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    admin
      .from('enrollments')
      .select('id, status, course_id, purchased_at, courses(title, starts_at, ends_at, course_format)')
      .eq('user_id', id)
      .order('purchased_at', { ascending: false }),
  ]);

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.id.slice(0, 8);

  const p = profile as {
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    id: string;
    customer_tier?: string | null;
    avatar_url?: string | null;
    gamification_grade?: string | null;
    gamification_points?: number | null;
    birth_date?: string | null;
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/admin" className="text-neutral-600 underline">
            ← Dashboard
          </Link>
        </div>

        <header className="rounded-lg border border-neutral-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Fiche client</p>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <AvatarWithRibbon
              avatarUrl={p.avatar_url}
              displayName={displayName}
              grade={p.gamification_grade}
              sizePx={80}
              showPoints
              points={p.gamification_points ?? 0}
            />
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="text-2xl font-semibold text-neutral-900">{displayName}</h1>
              <p className="mt-2 text-sm text-neutral-600">
                Tier profil : <strong>{formatTier(p.customer_tier ?? null)}</strong> · Rôle :{' '}
                <strong>{p.role ?? 'member'}</strong> · Grade :{' '}
                <strong>{gradeLabel(p.gamification_grade)}</strong>
                {p.gamification_points != null ? ` (${p.gamification_points} pts)` : ''}
              </p>
              {p.birth_date ? (
                <p className="mt-1 text-xs text-neutral-500">
                  Naissance : {new Date(p.birth_date).toLocaleDateString('fr-FR')}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-neutral-500">ID : {p.id}</p>
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">Abonnements / offres</h2>
          {!subs?.length ? (
            <p className="mt-3 text-sm text-neutral-500">Aucun abonnement en base.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {subs.map((s) => (
                <li key={s.id} className="rounded border border-neutral-100 px-3 py-2">
                  <span className="font-medium">{formatTier(s.tier)}</span> · {s.status} ·{' '}
                  {(s.price_cents ?? 0) / 100} € / {s.interval ?? 'month'}
                  {s.ends_at ? ` · fin ${new Date(s.ends_at).toLocaleDateString('fr-FR')}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
            Historique de présence / inscriptions
          </h2>
          {!enrollments?.length ? (
            <p className="mt-3 text-sm text-neutral-500">Aucune inscription.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                    <th className="py-2 pr-4">Séance</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => {
                    const raw = e.courses as
                      | { title: string; starts_at: string }
                      | { title: string; starts_at: string }[]
                      | null;
                    const c = Array.isArray(raw) ? raw[0] : raw;
                    return (
                      <tr key={e.id} className="border-b border-neutral-100">
                        <td className="py-2 pr-4">{c?.title ?? '—'}</td>
                        <td className="py-2 pr-4 text-neutral-600">
                          {c?.starts_at ? new Date(c.starts_at).toLocaleString('fr-FR') : '—'}
                        </td>
                        <td className="py-2">{e.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
