/**
 * Diagnostic visites live — LECTURE SEULE (SPEC §3.11).
 *   set -a && source .env.local; set +a; npx tsx scripts/chantier-oct/live-visits-diagnostic.ts
 */
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase non configuré');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const sinceDay = since.toISOString().slice(0, 10);

  const { count, error } = await db
    .from('live_course_daily_visits')
    .select('*', { count: 'exact', head: true })
    .gte('visit_date', sinceDay);
  if (error) throw new Error(error.message);

  const { data: sample, error: sErr } = await db
    .from('live_course_daily_visits')
    .select('course_id, visit_date, created_at')
    .gte('visit_date', sinceDay)
    .order('visit_date', { ascending: false })
    .limit(5);
  if (sErr) throw new Error(sErr.message);

  console.log(JSON.stringify({ n_30j: count ?? 0, sample_sans_user_id: sample ?? [] }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
