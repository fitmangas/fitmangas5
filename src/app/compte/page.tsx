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
    <div className="mx-auto max-w-5xl space-y-12 px-5 pb-16 md:space-y-14 md:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        <GlassCard className="p-8 md:p-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-luxury-soft">Espace client</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-luxury-ink md:text-[2.05rem]">Bienvenue</h1>
          {checkoutOk ? (
            <p className="mt-6 rounded-2xl border border-emerald-300/60 bg-emerald-50/90 px-5 py-3.5 text-sm font-medium leading-relaxed text-emerald-950">
              Paiement enregistré. Tu recevras la confirmation par e-mail (reçu Stripe). Ton accès au calendrier est mis à jour.
            </p>
          ) : null}
        </GlassCard>

        <GlassCard className="flex flex-col justify-center p-8 md:p-9">
          <p className="text-sm leading-relaxed text-luxury-muted">
            Connecté en tant que <span className="font-semibold text-luxury-ink">{user.email}</span>
          </p>
          <div className="mt-8 grid gap-4 border-t border-white/50 pt-8">
            <form action="/auth/signout" method="post" className="min-w-0">
              <button type="submit" className="btn-luxury-ghost flex min-h-[52px] w-full items-center justify-center px-8 py-4">
                Se déconnecter
              </button>
            </form>
            <Link href="/" className="btn-luxury-primary flex min-h-[52px] items-center justify-center text-center">
              Retour au site
            </Link>
          </div>
        </GlassCard>
      </div>

      <CompteDashboardSection userId={user.id} />

      <section className="space-y-8">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">Planning</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-luxury-ink md:text-[1.65rem]">
            Tes prochaines séances
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-luxury-muted">
            Les deux prochaines semaines — réserve ou rejoins ton cours en direct.
          </p>
        </div>
        <SmartCalendar />
      </section>

      <MyReplaysSection userId={user.id} />
    </div>
  );
}
