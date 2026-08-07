/**
 * 1) Rééchelonne les dates programmées passées (validated en retard) sans dépasser 3/semaine.
 * 2) Raccourcit title_fr > 59 car. sur les non-publiés uniquement.
 *
 *   npx tsx scripts/fix-unpublished-blog-schedule-titles.ts
 *   npx tsx scripts/fix-unpublished-blog-schedule-titles.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

/** Prochains créneaux UTC (lun/mer/ven 12:00) sous plafond maxPerWeek. */
function buildAvailableSlots(params: {
  from: Date;
  existingDates: Date[];
  need: number;
  maxPerWeek: number;
}): Date[] {
  const counts = new Map<string, number>();
  for (const d of params.existingDates) {
    const key = isoWeekKey(d);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const slots: Date[] = [];
  const cursor = startOfUtcDay(params.from);
  // avancer jusqu'à un jour utile
  let guard = 0;
  while (slots.length < params.need && guard < 800) {
    guard += 1;
    const dow = cursor.getUTCDay(); // 0 dim … 6 sam
    const isSlotDay = dow === 1 || dow === 3 || dow === 5; // lun mer ven
    if (isSlotDay) {
      const key = isoWeekKey(cursor);
      const n = counts.get(key) ?? 0;
      if (n < params.maxPerWeek) {
        // éviter collision exacte avec une date déjà prise (même jour)
        const dayKey = cursor.toISOString().slice(0, 10);
        const clash = params.existingDates.some((d) => d.toISOString().slice(0, 10) === dayKey);
        if (!clash) {
          const slot = new Date(cursor);
          slots.push(slot);
          counts.set(key, n + 1);
          params.existingDates.push(slot);
        }
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return slots;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env manquant');

  const { enforceBlogSeoTitle, BLOG_SEO_TITLE_MAX } = await import('../src/lib/blog/blog-seo-limits');
  const { withSpanishInvalidationIfContentFrChanged, deleteSpanishTranslationRow } = await import(
    '../src/lib/blog/translate-article-es'
  );

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('blog_articles')
    .select(
      'id, title_fr, slug_fr, status, scheduled_publication_at, description_fr, content_fr, meta_description_fr, seo_keywords',
    )
    .neq('status', 'published')
    .order('scheduled_publication_at', { ascending: true });
  if (error) throw error;

  const rows = (data ?? []).filter((r) => r.status !== 'published');
  const now = new Date();

  // --- A. Analyse densité ---
  const byWeek = new Map<string, number>();
  for (const r of rows) {
    const key = isoWeekKey(new Date(r.scheduled_publication_at));
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }
  const weekStats = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const maxPerWeek = Math.max(...weekStats.map(([, n]) => n), 0);
  const past = rows.filter((r) => new Date(r.scheduled_publication_at).getTime() < now.getTime());
  const future = rows.filter((r) => new Date(r.scheduled_publication_at).getTime() >= now.getTime());

  console.log('=== PLANNING ===');
  console.log(`Total non-publiés: ${rows.length}`);
  console.log(`Période: ${rows[0]?.scheduled_publication_at} → ${rows[rows.length - 1]?.scheduled_publication_at}`);
  console.log(`Max/semaine: ${maxPerWeek} · moy: ${(rows.length / weekStats.length).toFixed(2)}`);
  console.log(`Semaines >3: ${weekStats.filter(([, n]) => n > 3).length}`);
  console.log(`Dates passées (retard): ${past.length}`);
  console.log(`Futures: ${future.length}`);

  const scheduleChanges: Array<{
    id: string;
    title: string;
    before: string;
    after: string;
    reason: string;
  }> = [];

  // Densité globale OK (≤3). Seul risque = rattrapage des dates passées validated.
  if (past.length > 0) {
    const existingFutureDates = future.map((r) => new Date(r.scheduled_publication_at));
    const slots = buildAvailableSlots({
      from: now,
      existingDates: [...existingFutureDates],
      need: past.length,
      maxPerWeek: 3,
    });
    if (slots.length < past.length) {
      throw new Error(`Pas assez de créneaux libres (${slots.length}/${past.length})`);
    }
    for (let i = 0; i < past.length; i += 1) {
      const row = past[i];
      const after = slots[i].toISOString();
      scheduleChanges.push({
        id: row.id,
        title: row.title_fr,
        before: row.scheduled_publication_at,
        after,
        reason: 'date passée → réinjectée hors masse (max 3/sem.)',
      });
    }
  }

  // --- B. Titres ---
  const titleChanges: Array<{
    id: string;
    before: string;
    after: string;
    beforeLen: number;
    afterLen: number;
  }> = [];

  for (const row of rows) {
    const before = row.title_fr ?? '';
    if (before.length <= BLOG_SEO_TITLE_MAX) continue;
    let after = enforceBlogSeoTitle(before);
    if (after.length > BLOG_SEO_TITLE_MAX) {
      after = after.slice(0, BLOG_SEO_TITLE_MAX).replace(/[\s,;:.–—-]+$/g, '').trim();
    }
    if (!after || after === before) continue;
    titleChanges.push({
      id: row.id,
      before,
      after,
      beforeLen: before.length,
      afterLen: after.length,
    });
  }

  console.log(`\n=== TITRES À CORRIGER: ${titleChanges.length} ===`);
  for (const t of titleChanges.slice(0, 8)) {
    console.log(`${t.beforeLen}→${t.afterLen} | ${t.before}`);
    console.log(`         → ${t.after}`);
  }
  if (titleChanges.length > 8) console.log(`… +${titleChanges.length - 8} autres`);

  console.log(`\n=== RÉÉCHÉLONNEMENT: ${scheduleChanges.length} ===`);
  for (const s of scheduleChanges) {
    console.log(`${s.before} → ${s.after} · ${s.title.slice(0, 50)}`);
  }

  if (dryRun) {
    console.log('\n[dry-run] aucune écriture DB');
    return;
  }

  // Appliquer schedule
  for (const s of scheduleChanges) {
    const { error: upErr } = await sb
      .from('blog_articles')
      .update({ scheduled_publication_at: s.after, updated_at: new Date().toISOString() })
      .eq('id', s.id)
      .neq('status', 'published');
    if (upErr) throw upErr;
  }

  // Appliquer titres + invalidation ES
  for (const t of titleChanges) {
    const row = rows.find((r) => r.id === t.id);
    if (!row) continue;
    const previous = {
      title_fr: row.title_fr,
      description_fr: row.description_fr,
      content_fr: row.content_fr,
      meta_description_fr: row.meta_description_fr,
      seo_keywords: row.seo_keywords,
    };
    const payload = withSpanishInvalidationIfContentFrChanged({
      previous,
      payload: {
        title_fr: t.after,
        updated_at: new Date().toISOString(),
      },
    });
    const { error: upErr } = await sb
      .from('blog_articles')
      .update(payload)
      .eq('id', t.id)
      .neq('status', 'published');
    if (upErr) throw upErr;
    if (payload.title_es === null && payload.content_es === null) {
      await deleteSpanishTranslationRow(sb, t.id);
    }
  }

  // Vérif densités après
  const { data: afterRows } = await sb
    .from('blog_articles')
    .select('id, title_fr, scheduled_publication_at, status')
    .neq('status', 'published')
    .order('scheduled_publication_at', { ascending: true });
  const byWeekAfter = new Map<string, number>();
  for (const r of afterRows ?? []) {
    const key = isoWeekKey(new Date(r.scheduled_publication_at));
    byWeekAfter.set(key, (byWeekAfter.get(key) ?? 0) + 1);
  }
  const maxAfter = Math.max(...[...byWeekAfter.values()], 0);
  const stillLong = (afterRows ?? []).filter((r) => (r.title_fr ?? '').length > BLOG_SEO_TITLE_MAX);
  const stillPast = (afterRows ?? []).filter((r) => new Date(r.scheduled_publication_at).getTime() < Date.now());

  console.log('\n=== APRÈS ===');
  console.log(`Max/semaine: ${maxAfter}`);
  console.log(`Titres encore >59: ${stillLong.length}`);
  console.log(`Dates encore passées: ${stillPast.length}`);

  const report = {
    at: new Date().toISOString(),
    dryRun,
    planningBefore: {
      maxPerWeek,
      weeks: weekStats,
      pastCount: past.length,
      first: rows[0]?.scheduled_publication_at,
      last: rows[rows.length - 1]?.scheduled_publication_at,
    },
    scheduleChanges,
    titleChanges,
    planningAfter: { maxPerWeek: maxAfter, stillLong: stillLong.length, stillPast: stillPast.length },
  };
  mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
  const reportPath = resolve(process.cwd(), 'data/blog-fix-schedule-titles-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
