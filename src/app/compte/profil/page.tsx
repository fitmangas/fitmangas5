import Link from 'next/link';
import Stripe from 'stripe';

import { BillingPortalButton } from '@/components/Compte/BillingPortalButton';
import { ProfileAvatarForm } from '@/components/Compte/ProfileAvatarForm';
import { ProfileBirthDateForm } from '@/components/Compte/ProfileBirthDateForm';
import { gradeLabel } from '@/lib/gamification';
import { createClient } from '@/lib/supabase/server';

function formatTier(t: string | null): string {
  if (!t) return '—';
  return t.replace(/_/g, ' ');
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, tier, status, ends_at, price_cents, interval')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const customerId = profile?.stripe_customer_id?.trim() ?? null;

  type InvoiceRow = {
    id: string;
    number: string | null;
    status: string | null;
    created: number;
    hosted_invoice_url: string | null;
    amount_paid: number;
    currency: string;
  };

  let invoices: InvoiceRow[] = [];

  if (stripeKey && customerId) {
    try {
      const stripe = new Stripe(stripeKey);
      const list = await stripe.invoices.list({ customer: customerId, limit: 24 });
      invoices = list.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        created: inv.created,
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
      }));
    } catch {
      invoices = [];
    }
  }

  const p = profile as {
    avatar_url?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    customer_tier?: string | null;
    birth_date?: string | null;
    gamification_grade?: string | null;
    gamification_points?: number | null;
    onsite_presence_count?: number | null;
    total_replay_watch_seconds?: number | null;
    live_visit_count?: number | null;
  } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-5 pb-16 md:px-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/compte" className="text-sm font-semibold text-brand-accent underline-offset-4 hover:underline">
          ← Espace client
        </Link>
      </div>

      <header className="rounded-[28px] border border-brand-ink/[0.05] bg-white p-8 shadow-[0_16px_56px_rgba(0,0,0,0.05)] md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.38em] text-brand-accent">Mon profil</p>
        <h1 className="mt-3 font-serif text-[2rem] italic leading-tight text-brand-ink">Paramètres du compte</h1>
        <p className="mt-4 text-sm text-brand-ink/55">
          E-mail : <span className="font-medium text-brand-ink">{user.email}</span>
        </p>
        <p className="mt-2 text-sm text-brand-ink/55">
          Offre affichée : <span className="font-medium text-brand-ink">{formatTier(p?.customer_tier ?? null)}</span>
        </p>
        <p className="mt-3 text-sm text-brand-ink/55">
          Grade : <span className="font-medium text-brand-ink">{gradeLabel(p?.gamification_grade)}</span>
          {p?.gamification_points != null ? (
            <span className="text-brand-ink/45"> · {p.gamification_points} pts</span>
          ) : null}
        </p>
      </header>

      <ProfileAvatarForm avatarUrl={p?.avatar_url} />

      <ProfileBirthDateForm defaultIsoDate={p?.birth_date ?? null} />

      <section className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
        <h2 className="font-serif text-xl italic text-brand-ink">Parcours & progression</h2>
        <ul className="mt-4 space-y-2 text-sm text-brand-ink/70">
          <li>
            Présences studio (pointage) :{' '}
            <strong className="text-brand-ink">{p?.onsite_presence_count ?? 0}</strong>
          </li>
          <li>
            Temps replay cumulé :{' '}
            <strong className="text-brand-ink">
              {Math.round((p?.total_replay_watch_seconds ?? 0) / 60)} min
            </strong>
          </li>
          <li>
            Participations live (jours distincts) :{' '}
            <strong className="text-brand-ink">{p?.live_visit_count ?? 0}</strong>
          </li>
        </ul>
      </section>

      <section className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
        <h2 className="font-serif text-xl italic text-brand-ink">Abonnement & facturation</h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-ink/55">
          Modifie ton moyen de paiement, consulte les renouvellements et résilie depuis le portail sécurisé Stripe.
        </p>
        <div className="mt-6">
          <BillingPortalButton disabled={!customerId} />
        </div>
      </section>

      <section className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
        <h2 className="font-serif text-xl italic text-brand-ink">Abonnements enregistrés</h2>
        {!subs?.length ? (
          <p className="mt-4 text-sm text-brand-ink/45">Aucune ligne en base pour l’instant.</p>
        ) : (
          <ul className="mt-6 space-y-3 text-sm">
            {subs.map((s) => (
              <li key={s.id} className="rounded-xl border border-brand-ink/[0.06] px-4 py-3">
                <span className="font-medium text-brand-ink">{formatTier(s.tier)}</span> · {s.status} ·{' '}
                {(s.price_cents ?? 0) / 100} € / {s.interval ?? 'month'}
                {s.ends_at ? ` · fin ${new Date(s.ends_at).toLocaleDateString('fr-FR')}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
        <h2 className="font-serif text-xl italic text-brand-ink">Factures Stripe</h2>
        {!customerId ? (
          <p className="mt-4 text-sm text-brand-ink/45">Disponibles après association à un client Stripe.</p>
        ) : invoices.length === 0 ? (
          <p className="mt-4 text-sm text-brand-ink/45">Aucune facture récente.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-ink/[0.08] text-[10px] uppercase tracking-widest text-brand-ink/45">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">N°</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3">PDF</th>
                </tr>
              </thead>
              <tbody className="text-brand-ink/85">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-brand-ink/[0.04]">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {new Date(inv.created * 1000).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 pr-4">{inv.number ?? '—'}</td>
                    <td className="py-3 pr-4">{inv.status ?? '—'}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      {(inv.amount_paid / 100).toLocaleString('fr-FR', { style: 'currency', currency: inv.currency || 'eur' })}
                    </td>
                    <td className="py-3">
                      {inv.hosted_invoice_url ? (
                        <a
                          href={inv.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-brand-accent underline-offset-4 hover:underline"
                        >
                          Ouvrir
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
