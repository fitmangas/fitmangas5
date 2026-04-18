import Link from 'next/link';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/auth/admin';
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

  const [{ count: totalClients }, { data: latestProfiles }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id, first_name, last_name, role, last_checkout_course_id, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="min-h-screen bg-brand-beige px-6 py-10 md:py-14">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:p-8">
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

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-brand-ink/[0.05] bg-white p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-ink/40">Clients</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">{totalClients ?? 0}</p>
            <p className="mt-2 text-xs text-brand-ink/50">Profils enregistrés dans Supabase</p>
          </article>
          <Link
            href="/admin/courses"
            className="group rounded-[24px] border border-brand-ink/[0.05] bg-white p-5 transition hover:border-brand-accent/25 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-ink/40">Cours</p>
            <p className="mt-3 text-xl font-semibold tracking-tight text-brand-ink group-hover:text-brand-accent">
              Gérer les séances
            </p>
            <p className="mt-2 text-xs text-brand-ink/50">Création, publication, capacités et calendrier client</p>
          </Link>
          <article className="rounded-[24px] border border-brand-ink/[0.05] bg-white p-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-ink/40">Vimeo</p>
            <p className="mt-3 text-xl font-semibold tracking-tight text-brand-ink">Intégration à venir</p>
            <p className="mt-2 text-xs text-brand-ink/50">Replays, live links et publication conditionnelle</p>
          </article>
        </section>

        <section className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
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
                      {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—'}
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
