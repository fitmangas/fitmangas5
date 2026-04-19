/**
 * Identifie les clients inactifs (logique hybride) via RPC Postgres.
 * Usage : SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
 * Option : INACTIVITY_DAYS_THRESHOLD (défaut 21)
 *
 * Ne envoie pas encore les e-mails : affiche JSON + modèles pour branchement ultérieur.
 */
import { createClient } from '@supabase/supabase-js';

import { buildWeMissYouEmail } from '../../src/lib/email/weMissYou';

function mustGetEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function main() {
  const url = mustGetEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY');
  const days = parseInt(process.env.INACTIVITY_DAYS_THRESHOLD ?? '21', 10);

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data, error } = await supabase.rpc('report_we_miss_you_candidates', { p_days: days });

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const rows = (data ?? []) as Array<{
    user_id: string;
    email: string;
    segment: string;
    message_key: string;
    last_activity_at: string | null;
  }>;

  console.log(JSON.stringify({ days, count: rows.length, rows }, null, 2));

  for (const row of rows.slice(0, 5)) {
    const { data: prof } = await supabase.from('profiles').select('first_name').eq('id', row.user_id).maybeSingle();
    const variant = row.message_key === 'tapis' ? 'tapis' : 'studio';
    const preview = buildWeMissYouEmail({ firstName: prof?.first_name ?? null, variant });
    console.log('\n--- Exemple mail ---\n', preview.subject, '\n', preview.text.slice(0, 200), '…');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
