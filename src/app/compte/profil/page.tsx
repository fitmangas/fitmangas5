import Link from 'next/link';
import Stripe from 'stripe';

import { BillingPortalButton } from '@/components/Compte/BillingPortalButton';
import { ProfileAvatarForm } from '@/components/Compte/ProfileAvatarForm';
import { ProfileBirthDateForm } from '@/components/Compte/ProfileBirthDateForm';
import { GlassCard } from '@/components/ui/GlassCard';
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
        <Link
          href="/compte"
          className="text-sm font-semibold text-luxury-orange underline-offset-4 transition hover:underline"
        >
          ← Espace client
        </Link>
      </div>

      <GlassCard className="p-8 md:p-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-luxury-soft">Mon profil</p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-luxury-ink">
          Paramètres du compte
        </h1>
        <p className="mt-4 text-sm text-luxury-muted">
          E-mail : <span className="font-medium text-luxury-ink">{user.email}</span>
        </p>
        <p className="mt-2 text-sm text-luxury-muted">
          Offre affichée : <span className="font-medium text-luxury-ink">{formatTier(p?.customer_tier ?? null)}</span>
        </p>
        <p className="mt-3 text-sm text-luxury-muted">
          Grade : <span className="font-medium text-luxury-ink">{gradeLabel(p?.gamification_grade)}</span>
          {p?.gamification_points != null ? (
            <span className="text-luxury-soft"> · {p.gamification_points} pts</span>
          ) : null}
        </p>
      </GlassCard>

      <ProfileAvatarForm avatarUrl={p?.avatar_url} />

      <ProfileBirthDateForm defaultIsoDate={p?.birth_date ?? null} />

      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Parcours & progression</h2>
        <ul className="mt-4 space-y-2 text-sm text-luxury-muted">
          <li>
            Présences studio (pointage) :{' '}
            <strong className="text-luxury-ink">{p?.onsite_presence_count ?? 0}</strong>
          </li>
          <li>
            Temps replay cumulé :{' '}
            <strong className="text-luxury-ink">{Math.round((p?.total_replay_watch_seconds ?? 0) / 60)} min</strong>
          </li>
          <li>
            Participations live (jours distincts) :{' '}
            <strong className="text-luxury-ink">{p?.live_visit_count ?? 0}</strong>
          </li>
        </ul>
      </GlassCard>

      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Abonnement & facturation</h2>
        <p className="mt-3 text-sm leading-relaxed text-luxury-muted">
          Modifie ton moyen de paiement, consulte les renouvellements et résilie depuis le portail sécurisé Stripe.
        </p>
        <div className="mt-6">
          <BillingPortalButton disabled={!customerId} />
        </div>
      </GlassCard>

      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Abonnements enregistrés</h2>
        {!subs?.length ? (
          <p className="mt-4 text-sm text-luxury-soft">Aucune ligne en base pour l’instant.</p>
        ) : (
          <ul className="mt-6 space-y-3 text-sm">
            {subs.map((s) => (
              <li key={s.id} className="rounded-xl border border-white/35 bg-white/25 px-4 py-3 backdrop-blur-sm">
                <span className="font-medium text-luxury-ink">{formatTier(s.tier)}</span> · {s.status} ·{' '}
                {(s.price_cents ?? 0) / 100} € / {s.interval ?? 'month'}
                {s.ends_at ? ` · fin ${new Date(s.ends_at).toLocaleDateString('fr-FR')}` : ''}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Factures Stripe</h2>
        {!customerId ? (
          <p className="mt-4 text-sm text-luxury-soft">Disponibles après association à un client Stripe.</p>
        ) : invoices.length === 0 ? (
          <p className="mt-4 text-sm text-luxury-soft">Aucune facture récente.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/35 text-[10px] uppercase tracking-widest text-luxury-soft">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">N°</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3">PDF</th>
                </tr>
              </thead>
              <tbody className="text-luxury-muted">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/20">
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
                          className="font-semibold text-luxury-orange underline-offset-4 hover:underline"
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
      </GlassCard>
    </div>
  );
}
