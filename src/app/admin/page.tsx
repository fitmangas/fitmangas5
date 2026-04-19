import Link from 'next/link';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/auth/admin';
import { getAdminKpis } from '@/lib/admin/kpis';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  last_checkout_course_id: string | null;
  updated_at: string | null;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=auth');
  }

  const adminCheck = await checkIsAdmin(supabase, user);
  if (!adminCheck.isAdmin) {
    redirect('/login?error=forbidden');
  }

  const adminDb = createAdminClient();

  const [{ count: totalClients }, { data: latestProfiles }, { count: totalReplaysReady }, kpis] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id, first_name, last_name, role, last_checkout_course_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10),
    adminDb.from('video_recordings').select('*', { count: 'exact', head: true }).eq('is_ready', true),
    getAdminKpis(),
  ]);

  const mrrLabel =
    kpis.mrrEur != null
      ? `${kpis.mrrEur.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
      : '—';
  const mrrHint =
    kpis.mrrSource === 'stripe'
      ? 'Stripe'
      : kpis.mrrSource === 'db'
        ? 'Base (fallback)'
        : 'Non disponible';
  const occupancyLabel =
    kpis.occupancyPercent != null ? `${kpis.occupancyPercent.toLocaleString('fr-FR')}%` : '—';

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-beige via-brand-beige to-brand-sand/25 px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-5xl space-y-8 md:space-y-10">
        <header className="rounded-[28px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.05)] md:p-8">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Administration</p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-serif text-3xl italic tracking-tight text-brand-ink">Dashboard FitMangas</h1>
              <p className="mt-2 text-sm text-brand-ink/60">
                Connecté en admin avec <span className="font-medium text-brand-ink">{user.email}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full border border-brand-ink/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-ink/70 transition hover:bg-brand-sand/30"
              >
                Retour site
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-brand-accent px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition hover:opacity-90"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[24px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-ink/38">Revenu mensuel (MRR)</p>
            <p className="mt-4 font-serif text-4xl italic tracking-tight text-brand-ink">{mrrLabel}</p>
            <p className="mt-3 text-xs leading-relaxed text-brand-ink/48">Source : {mrrHint}</p>
          </article>
          <article className="rounded-[24px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-ink/38">Taux d&apos;occupation</p>
            <p className="mt-4 font-serif text-4xl italic tracking-tight text-brand-ink">{occupancyLabel}</p>
            <p className="mt-3 text-xs leading-relaxed text-brand-ink/48">
              Moyenne réservations / places max · cours collectifs terminés
            </p>
          </article>
          <article className="rounded-[24px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-ink/38">Engagement replay</p>
            <p className="mt-4 font-serif text-4xl italic tracking-tight text-brand-ink">
              {kpis.totalReplayViews.toLocaleString('fr-FR')}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-brand-ink/48">Cumul des vues enregistrées sur les replays</p>
          </article>
        </section>

        <section className="rounded-[28px] border border-brand-accent/15 bg-gradient-to-br from-white to-brand-sand/15 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Présentation client</p>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-serif text-xl italic text-brand-ink md:text-2xl">Lancer le mode Démo (Vue Client)</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink/58">
                Simule un compte élève avec abonnement visio collectif actif : calendrier, réservations, replays et
                navigation dans l’espace personnel — sans créer de compte test.
              </p>
            </div>
            <a
              href="/api/demo-mode/enable"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-accent px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-[0_10px_32px_rgba(0,0,0,0.14)] transition hover:opacity-95 md:min-w-[280px]"
            >
              Lancer le mode Démo (Vue Client)
            </a>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[24px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-ink/38">Clients</p>
            <p className="mt-4 font-serif text-4xl italic tracking-tight text-brand-ink">{totalClients ?? 0}</p>
            <p className="mt-3 text-xs leading-relaxed text-brand-ink/48">Profils enregistrés</p>
          </article>
          <Link
            href="/admin/courses"
            className="group rounded-[24px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition hover:border-brand-accent/22 hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)]"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-ink/38">Cours</p>
            <p className="mt-4 font-serif text-xl italic tracking-tight text-brand-ink group-hover:text-brand-accent">
              Gérer les séances
            </p>
            <p className="mt-3 text-xs leading-relaxed text-brand-ink/48">Création, publication, capacités</p>
          </Link>
          <div className="flex flex-col rounded-[24px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-brand-ink/38">Statistiques Vimeo</p>
            <p className="mt-4 font-serif text-4xl italic tracking-tight text-brand-ink">{totalReplaysReady ?? 0}</p>
            <p className="mt-3 text-xs leading-relaxed text-brand-ink/48">Replays prêts à la lecture</p>
            <Link
              href="/admin/courses"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-brand-ink/[0.08] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/70 transition hover:border-brand-accent/30 hover:bg-brand-beige/40 hover:text-brand-ink"
            >
              Gérer mes vidéos
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] border border-brand-ink/[0.05] bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] md:p-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-ink/50">Derniers clients</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-brand-ink/[0.06] text-[10px] uppercase tracking-widest text-brand-ink/45">
                  <th className="px-2 py-3">Nom</th>
                  <th className="px-2 py-3">Rôle</th>
                  <th className="px-2 py-3">Dernière offre</th>
                  <th className="px-2 py-3">Mise à jour</th>
                </tr>
              </thead>
              <tbody className="text-sm text-brand-ink/80">
                {(latestProfiles as ProfileRow[] | null)?.map((profile) => (
                  <tr key={profile.id} className="border-b border-brand-ink/[0.04]">
                    <td className="px-2 py-3">
                      <Link
                        href={`/admin/clients/${profile.id}`}
                        className="font-medium text-brand-accent underline-offset-4 hover:underline"
                      >
                        {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-2 py-3">{profile.role || 'member'}</td>
                    <td className="px-2 py-3">{profile.last_checkout_course_id || '—'}</td>
                    <td className="px-2 py-3">
                      {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
                {!latestProfiles?.length ? (
                  <tr>
                    <td className="px-2 py-4 text-brand-ink/45" colSpan={4}>
                      Aucun profil trouvé pour l’instant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
