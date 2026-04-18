import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SmartCalendar } from '@/components/Calendar/SmartCalendar';
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
    <div className="min-h-screen bg-brand-beige px-6 py-10 md:py-14">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-[32px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">Espace client</p>
          <h1 className="mb-4 font-serif text-3xl italic tracking-tight text-brand-ink">Bienvenue</h1>
          {checkoutOk && (
            <p className="mb-6 rounded-2xl border border-brand-accent/20 bg-brand-sand/20 px-4 py-3 text-sm text-brand-ink/80">
              Paiement enregistré. Tu recevras la confirmation par e-mail (reçu Stripe). Ton accès au calendrier est mis à jour.
            </p>
          )}
          <p className="mb-8 text-sm text-brand-ink/60">
            Connecté en tant que <span className="font-medium text-brand-ink">{user.email}</span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full rounded-full border border-brand-ink/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-ink transition hover:bg-brand-sand/30 sm:w-auto"
              >
                Se déconnecter
              </button>
            </form>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition hover:opacity-90"
            >
              Retour au site
            </Link>
          </div>
        </div>
        <SmartCalendar />
      </div>
    </div>
  );
}
