import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
import { CompteDashboardSection } from '@/components/Compte/CompteDashboardSection';
import { MyReplaysSection } from '@/components/Replay/MyReplaysSection';
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
    <div className="space-y-12 px-5 pb-16 md:space-y-14 md:px-8">
      <header className="rounded-[32px] border border-brand-ink/[0.05] bg-white p-8 shadow-[0_16px_56px_rgba(0,0,0,0.05)] md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-brand-accent">Espace client</p>
        <h1 className="mt-3 font-serif text-[2rem] italic leading-tight tracking-tight text-brand-ink md:text-[2.35rem]">
          Bienvenue
        </h1>
        {checkoutOk && (
          <p className="mt-6 rounded-2xl border border-brand-accent/15 bg-brand-sand/25 px-5 py-3.5 text-sm leading-relaxed text-brand-ink/75">
            Paiement enregistré. Tu recevras la confirmation par e-mail (reçu Stripe). Ton accès au calendrier est mis à jour.
          </p>
        )}
        <p className="mt-6 text-sm leading-relaxed text-brand-ink/55">
          Connecté en tant que{' '}
          <span className="font-medium text-brand-ink">{user.email}</span>
        </p>
        <div className="mt-10 grid gap-4 border-t border-brand-ink/[0.06] pt-10 sm:grid-cols-2">
          <form action="/auth/signout" method="post" className="min-w-0">
            <button
              type="submit"
              className="flex w-full min-h-[52px] items-center justify-center rounded-full border-2 border-brand-ink/[0.12] bg-brand-beige/35 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-ink/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:border-brand-ink/[0.18] hover:bg-brand-beige/55"
            >
              Se déconnecter
            </button>
          </form>
          <Link
            href="/"
            className="flex min-h-[52px] items-center justify-center rounded-full bg-brand-accent px-8 py-4 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_36px_rgba(0,0,0,0.14)] transition hover:opacity-93"
          >
            Retour au site
          </Link>
        </div>
      </header>

      <CompteDashboardSection userId={user.id} />

      <section className="space-y-6">
        <div className="px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Planning</p>
          <h2 className="mt-2 font-serif text-2xl italic tracking-tight text-brand-ink md:text-[1.75rem]">
            Tes prochaines séances
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-ink/50">
            Les deux prochaines semaines — réserve ou rejoins ton cours en direct.
          </p>
        </div>
        <SmartCalendar />
      </section>

      <MyReplaysSection userId={user.id} />
    </div>
  );
}
