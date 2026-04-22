import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { CompteDashboardSection } from '@/components/Compte/CompteDashboardSection';
import { MyReplaysSection } from '@/components/Replay/MyReplaysSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { createClient } from '@/lib/supabase/server';

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/?compte=connexion-requise');
  }

  const params = await searchParams;
  const checkoutOk = params.checkout === 'success';

  return (
    <div className="mx-auto max-w-[1280px] space-y-8 px-5 pb-16 md:space-y-10 md:px-8">
      <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <GlassCard className="p-6 md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Espace client</p>
          <h1 className="mt-2.5 text-3xl font-semibold tracking-tight text-luxury-ink md:text-[2.05rem]">Bienvenue</h1>
          <p className="mt-2 text-sm leading-relaxed text-luxury-muted">
            Retrouve en un coup d&apos;oeil ton planning, ta progression mensuelle et tes accès.
          </p>
          {checkoutOk ? (
            <p className="mt-5 rounded-2xl border border-emerald-300/60 bg-emerald-50/90 px-5 py-3.5 text-sm font-medium leading-relaxed text-emerald-950">
              Paiement enregistré. Tu recevras la confirmation par e-mail (reçu Stripe). Ton accès au calendrier est mis à jour.
            </p>
          ) : null}
        </GlassCard>

        <GlassCard className="flex flex-col justify-between p-6 md:p-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Compte</p>
            <p className="mt-3 text-sm leading-relaxed text-luxury-muted">
              Connecté en tant que <span className="font-semibold text-luxury-ink">{user.email}</span>
            </p>
          </div>
          <div className="mt-6 grid gap-3 border-t border-white/50 pt-6">
            <Link href="/" className="btn-luxury-primary flex min-h-[48px] items-center justify-center text-center">
              Retour au site
            </Link>
            <Link href="/compte/profil" className="btn-luxury-ghost flex min-h-[48px] items-center justify-center text-center">
              Mon profil
            </Link>
            <form action="/auth/signout" method="post" className="min-w-0">
              <button type="submit" className="btn-luxury-ghost flex min-h-[48px] w-full items-center justify-center px-8 py-3.5">
                Se déconnecter
              </button>
            </form>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Tableau de bord</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">Ton suivi en direct</h2>
        </div>
        <CompteDashboardSection userId={user.id} />
      </section>

      <section id="planning" className="scroll-mt-24 space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Planning</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">Tes prochaines séances</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-luxury-muted">
            Les deux prochaines semaines — réserve ou rejoins ton cours en direct.
          </p>
        </div>
        <SmartCalendar />
      </section>

      <section id="replays" className="scroll-mt-24 space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">Bibliothèque</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.7rem]">Tes contenus à la demande</h2>
        </div>
        <MyReplaysSection userId={user.id} />
      </section>
    </div>
  );
}
