import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ClientAdminActions } from '@/app/admin/clients/[id]/ClientAdminActions';
import { ADMIN_HEAD_TR } from '@/components/Admin/adminSurfaceClasses';
import { computeGamificationGrade, gradeLabel, gradeRibbonClass } from '@/lib/gamification';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

function formatTier(t: string | null): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ');
}

function formatSubscriptionType(t: string | null | undefined): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ');
}

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile, error } = await admin.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error || !profile) notFound();

  const [{ data: authUser }, { data: subs }, { data: enrollments }] = await Promise.all([
    admin.auth.admin.getUserById(id),
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
    subscription_status?: string | null;
    subscription_type?: string | null;
    stripe_customer_id?: string | null;
    avatar_url?: string | null;
    gamification_grade?: string | null;
    gamification_points?: number | null;
    birth_date?: string | null;
    created_at?: string | null;
    archived?: boolean | null;
    last_checkout_course_id?: string | null;
    onsite_presence_count?: number | null;
    total_replay_watch_seconds?: number | null;
    live_visit_count?: number | null;
  };

  const email = authUser.user?.email ?? null;
  const grade =
    p.gamification_grade ??
    computeGamificationGrade({
      points: p.gamification_points ?? 0,
      liveVisits: p.live_visit_count ?? 0,
      replaySeconds: p.total_replay_watch_seconds ?? 0,
      onsitePresences: p.onsite_presence_count ?? 0,
    });
  const hasSubscriptionRow = (subs?.length ?? 0) > 0;
  const hasProfileSubscription = Boolean(p.subscription_status || p.subscription_type);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/admin/clients" className="font-medium text-luxury-orange underline-offset-4 hover:underline">
            ← Clients
          </Link>
          <Link href="/admin" className="font-medium text-luxury-muted underline-offset-4 hover:underline">
            Dashboard
          </Link>
        </div>

        <header className="glass-card rounded-2xl p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-luxury-soft">Fiche client</p>
          {p.archived ? (
            <p className="mt-2 inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800">
              Archivé
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="shrink-0 pb-1">
              {p.avatar_url ? (
                <span className="relative block h-20 w-20 overflow-hidden rounded-full border border-brand-ink/[0.08] bg-brand-beige">
                  <Image src={p.avatar_url} alt="" fill className="object-cover" sizes="80px" />
                </span>
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-brand-ink/[0.08] bg-brand-sand/40 text-2xl font-semibold text-brand-ink/70">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-luxury-ink">{displayName}</h1>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${gradeRibbonClass(grade)}`}
                >
                  {gradeLabel(grade)}
                </span>
                {p.gamification_points != null ? (
                  <span className="text-xs tabular-nums text-luxury-muted">{p.gamification_points} pts</span>
                ) : null}
              </div>
              <p className="text-sm text-luxury-muted">
                Rôle : <strong className="text-luxury-ink">{p.role ?? 'member'}</strong>
                {p.customer_tier ? (
                  <>
                    {' '}
                    · Tier : <strong className="text-luxury-ink">{formatTier(p.customer_tier)}</strong>
                  </>
                ) : null}
              </p>
              {p.birth_date ? (
                <p className="text-xs text-luxury-soft">
                  Naissance : {new Date(p.birth_date).toLocaleDateString('fr-FR')}
                </p>
              ) : null}
              <p className="text-xs text-luxury-soft">ID : {p.id}</p>
            </div>
          </div>
          <ClientAdminActions profileId={p.id} archived={Boolean(p.archived)} />
        </header>

        <section className="glass-card rounded-2xl p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-luxury-soft">Coordonnées</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-luxury-muted">E-mail</dt>
              <dd className="mt-0.5 break-all font-medium text-luxury-ink">{email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-luxury-muted">Inscription</dt>
              <dd className="mt-0.5 font-medium text-luxury-ink">
                {p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-luxury-muted">Stripe customer</dt>
              <dd className="mt-0.5 font-mono text-xs text-luxury-ink">{p.stripe_customer_id ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-luxury-muted">Dernière offre checkout</dt>
              <dd className="mt-0.5 font-medium text-luxury-ink">{p.last_checkout_course_id ?? '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="glass-card rounded-2xl p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-luxury-soft">Abonnements / offres</h2>
          {hasProfileSubscription ? (
            <p className="mt-3 text-sm text-luxury-ink">
              Statut profil : <strong>{p.subscription_status ?? '—'}</strong> · Type :{' '}
              <strong>{formatSubscriptionType(p.subscription_type)}</strong>
            </p>
          ) : null}
          {!hasSubscriptionRow && !hasProfileSubscription ? (
            <p className="mt-3 text-sm text-luxury-muted">Aucun abonnement en base.</p>
          ) : null}
          {hasSubscriptionRow ? (
            <ul className="mt-4 space-y-3 text-sm">
              {subs!.map((s) => (
                <li key={s.id} className="rounded-xl border border-white/35 bg-white/25 px-3 py-2 backdrop-blur-sm">
                  <span className="font-medium">{formatTier(s.tier)}</span> · {s.status} · {(s.price_cents ?? 0) / 100}{' '}
                  € / {s.interval ?? 'month'}
                  {s.ends_at ? ` · fin ${new Date(s.ends_at).toLocaleDateString('fr-FR')}` : ''}
                  {s.stripe_subscription_id ? (
                    <span className="mt-1 block font-mono text-[10px] text-luxury-muted">{s.stripe_subscription_id}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="glass-card rounded-2xl p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-luxury-soft">
            Historique de présence / inscriptions
          </h2>
          {!enrollments?.length ? (
            <p className="mt-3 text-sm text-luxury-muted">Aucune inscription.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className={ADMIN_HEAD_TR}>
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
                      <tr key={e.id} className="border-b border-white/20">
                        <td className="py-2 pr-4">{c?.title ?? '—'}</td>
                        <td className="py-2 pr-4 text-luxury-muted">
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
