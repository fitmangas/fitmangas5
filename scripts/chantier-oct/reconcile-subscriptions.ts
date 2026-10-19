/**
 * Rapport de réconciliation des abonnements — LECTURE SEULE.
 * profiles.subscription_status ↔ ligne `subscriptions` ↔ statut Stripe (si clé live disponible).
 * Identifiants tronqués à 8 caractères. Aucune écriture, ni en base ni chez Stripe.
 *
 *   set -a && source .env.local; set +a; npx tsx scripts/chantier-oct/reconcile-subscriptions.ts
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const short = (v: string | null | undefined) => (v ? `${v.slice(0, 8)}…` : '—');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase non configuré');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const [{ data: profiles, error: pErr }, { data: subs, error: sErr }] = await Promise.all([
    db.from('profiles').select('id, role, subscription_status, stripe_customer_id, customer_tier'),
    db.from('subscriptions').select('user_id, tier, status, stripe_subscription_id, ends_at, auto_renews'),
  ]);
  if (pErr || sErr) throw new Error(pErr?.message || sErr?.message);

  const stripeKey = process.env.STRIPE_SECRET_KEY ?? '';
  const stripeLive = stripeKey.startsWith('sk_live_') || stripeKey.startsWith('rk_live_');
  const stripe = stripeLive ? new Stripe(stripeKey) : null;

  const rows: string[] = [];
  rows.push('| Profil | Rôle | profiles.subscription_status | customer_tier | subscriptions (tier/statut) | Stripe | Écart |');
  rows.push('|---|---|---|---|---|---|---|');

  for (const p of profiles ?? []) {
    const own = (subs ?? []).filter((s) => s.user_id === p.id);
    const subTxt = own.length ? own.map((s) => `${s.tier}/${s.status}`).join(', ') : 'aucune';
    let stripeTxt = stripeLive ? '—' : 'non lu (clé test)';
    const stripeStatuses: string[] = [];
    if (stripe) {
      for (const s of own) {
        if (!s.stripe_subscription_id) continue;
        try {
          const live = await stripe.subscriptions.retrieve(s.stripe_subscription_id);
          stripeStatuses.push(live.status + (live.cancel_at_period_end ? ' (fin de période)' : ''));
        } catch {
          stripeStatuses.push('introuvable');
        }
      }
      stripeTxt = stripeStatuses.join(', ') || 'aucun id';
    }
    const activeDb = own.some((s) => s.status === 'active' || s.status === 'trialing');
    const profileActive = p.subscription_status === 'active' || p.subscription_status === 'trialing';
    const gaps: string[] = [];
    if (activeDb !== profileActive) gaps.push('profil ≠ subscriptions');
    if (activeDb && !p.customer_tier) gaps.push('tier vide');
    if (!activeDb && p.customer_tier) gaps.push('tier sans abonnement actif');
    if (stripe && own.length && stripeStatuses.some((st) => st === 'introuvable')) gaps.push('id Stripe introuvable');
    rows.push(
      `| ${short(p.id)} | ${p.role ?? '—'} | ${p.subscription_status ?? 'NULL'} | ${p.customer_tier ?? '—'} | ${subTxt} | ${stripeTxt} | ${gaps.join(' ; ') || 'OK'} |`,
    );
  }

  const orphans = (subs ?? []).filter((s) => !(profiles ?? []).some((p) => p.id === s.user_id));
  console.log(rows.join('\n'));
  console.log(`\nProfils : ${profiles?.length ?? 0} · lignes subscriptions : ${subs?.length ?? 0} · orphelines : ${orphans.length}`);
  console.log(`Stripe : ${stripeLive ? 'clé live — statuts lus' : 'clé de test — statuts Stripe non lus'}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
