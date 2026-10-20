/**
 * Comparatif accès actuel vs ACCESS_V2 — LECTURE SEULE.
 * Identifiants tronqués. Aucune écriture.
 *
 *   set -a && source .env.local; set +a; npx tsx scripts/chantier-oct/compare-access-v2.ts
 */
import { createClient } from '@supabase/supabase-js';

import { computeVisioAccessV2, currentVisioFromTier, isDemoAccessUser } from '../../src/lib/access/access-v2';

const short = (v: string | null | undefined) => (v ? `${v.slice(0, 8)}…` : '—');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase non configuré');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const [{ data: profiles, error: pErr }, { data: subs, error: sErr }] = await Promise.all([
    // Tous les profils, archivés compris : un profil archivé qui a encore un accès gratuit le perdrait aussi.
    db.from('profiles').select('id, role, subscription_status, customer_tier, archived'),
    db.from('subscriptions').select('user_id, status, ends_at, stripe_subscription_id, tier'),
  ]);
  if (pErr || sErr) throw new Error(pErr?.message || sErr?.message);

  const rows: string[] = [];
  rows.push('| Profil | Rôle | Archivé | Accès actuel (tier) | Accès V2 | Écart |');
  rows.push('|---|---|---|---|---|---|');
  let diffs = 0;
  let diffsArchived = 0;

  for (const p of profiles ?? []) {
    if ((p.role ?? '') === 'admin') continue;
    const own = (subs ?? []).filter((s) => s.user_id === p.id);
    let current = currentVisioFromTier(p.customer_tier);
    try {
      const { data: tier } = await db.rpc('current_customer_tier', { target_user_id: p.id });
      current = currentVisioFromTier((tier as string | null) ?? p.customer_tier);
    } catch {
      /* colonne / RPC : on garde customer_tier */
    }
    const v2 = isDemoAccessUser(p.id) ? { visio: true, reason: 'compte démo' } : computeVisioAccessV2(own);
    const gap = current !== v2.visio;
    if (gap && p.archived) diffsArchived += 1;
    else if (gap) diffs += 1;
    rows.push(
      `| ${short(p.id)} | ${p.role ?? '—'} | ${p.archived ? 'oui' : 'non'} | ${current ? 'oui' : 'non'} | ${v2.visio ? 'oui' : 'non'} (${v2.reason}) | ${gap ? 'DIFFÉRENCE' : 'OK'} |`,
    );
  }

  console.log(rows.join('\n'));
  console.log(
    `\nÉcarts : ${diffs} (profils actifs) + ${diffsArchived} (profils archivés) = ${diffs + diffsArchived}. ACCESS_V2 ne doit pas être allumé tant que ce total n’est pas 0.`,
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
