import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clapperboard, Euro, Eye, Percent, Users, Video } from 'lucide-react';
import { checkIsAdmin } from '@/lib/auth/admin';
import { getAdminKpis } from '@/lib/admin/kpis';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { GlassCard } from '@/components/ui/GlassCard';

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
    <div className="mx-auto max-w-5xl space-y-8 md:space-y-10">
      <GlassCard className="p-6 md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-luxury-soft">Administration</p>
        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-luxury-ink md:text-3xl">Dashboard Fit Mangas</h1>
            <p className="mt-2 text-sm text-luxury-muted">
              Connecté avec <span className="font-medium text-luxury-ink">{user.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="btn-luxury-ghost">
              Retour site
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-luxury-primary">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </GlassCard>

      <section className="grid gap-5 md:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">MRR</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{mrrLabel}</p>
              <p className="mt-2 text-xs text-luxury-muted">Source : {mrrHint}</p>
            </div>
            <span className="kpi-icon-wrap bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-500/25">
              <Euro size={20} aria-hidden />
            </span>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Occupation</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{occupancyLabel}</p>
              <p className="mt-2 text-xs text-luxury-muted">Collectifs terminés · résa / places max</p>
            </div>
            <span className="kpi-icon-wrap bg-gradient-to-br from-rose-400 to-pink-600 text-white shadow-lg shadow-rose-500/25">
              <Percent size={20} aria-hidden />
            </span>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Replay</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">
                {kpis.totalReplayViews.toLocaleString('fr-FR')}
              </p>
              <p className="mt-2 text-xs text-luxury-muted">Vues cumulées</p>
            </div>
            <span className="kpi-icon-wrap bg-gradient-to-br from-violet-400 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
              <Eye size={20} aria-hidden />
            </span>
          </div>
        </GlassCard>
      </section>

      <GlassCard className="p-6 md:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Démo client</p>
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold tracking-tight text-luxury-ink md:text-xl">Mode démo (vue élève)</h2>
            <p className="mt-2 text-sm leading-relaxed text-luxury-muted">
              Simule un compte élève avec abonnement visio collectif : calendrier, réservations, replays — sans compte test.
            </p>
          </div>
          <a href="/api/demo-mode/enable" className="btn-luxury-primary shrink-0 md:min-w-[260px]">
            Lancer la démo
          </a>
        </div>
      </GlassCard>

      <section className="grid gap-5 md:grid-cols-3">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Clients</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-luxury-ink">{totalClients ?? 0}</p>
              <p className="mt-2 text-xs text-luxury-muted">Profils</p>
            </div>
            <span className="kpi-icon-wrap bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/25">
              <Users size={20} aria-hidden />
            </span>
          </div>
        </GlassCard>
        <Link href="/admin/courses" className="group block">
          <GlassCard className="h-full p-6 transition-all duration-300 hover:border-orange-300/60 hover:shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Cours</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-luxury-ink group-hover:text-orange-600">
                  Gérer les séances
                </p>
                <p className="mt-2 text-xs text-luxury-muted">Création, publication, capacités</p>
              </div>
              <span className="kpi-icon-wrap bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                <Clapperboard size={20} aria-hidden />
              </span>
            </div>
          </GlassCard>
        </Link>
        <GlassCard className="flex flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Vimeo</p>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-luxury-ink">{totalReplaysReady ?? 0}</p>
              <p className="mt-2 text-xs text-luxury-muted">Replays prêts</p>
            </div>
            <span className="kpi-icon-wrap bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Video size={20} aria-hidden />
            </span>
          </div>
          <Link
            href="/admin/courses"
            className="btn-luxury-ghost mt-6 w-full text-center text-[10px] tracking-[0.18em]"
          >
            Vidéos
          </Link>
        </GlassCard>
      </section>

      <GlassCard className="p-6 md:p-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-luxury-soft">Derniers clients</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-luxury-ink/10 text-[10px] uppercase tracking-wider text-luxury-soft">
                <th className="px-2 py-3">Nom</th>
                <th className="px-2 py-3">Rôle</th>
                <th className="px-2 py-3">Dernière offre</th>
                <th className="px-2 py-3">Mise à jour</th>
              </tr>
            </thead>
            <tbody className="text-sm text-luxury-ink/85">
              {(latestProfiles as ProfileRow[] | null)?.map((profile) => (
                <tr key={profile.id} className="border-b border-white/20">
                  <td className="px-2 py-3">
                    <Link
                      href={`/admin/clients/${profile.id}`}
                      className="font-medium text-orange-600 underline-offset-4 hover:underline"
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
                  <td className="px-2 py-4 text-luxury-muted" colSpan={4}>
                    Aucun profil trouvé pour l’instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
