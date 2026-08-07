/**
 * 1) Repousse la dernière date encore passée (créneau du jour déjà écoulé).
 * 2) Repolit les titres tronqués qui finissent mal (mot coupé / conjonction orpheline).
 *
 *   npx tsx scripts/polish-unpublished-blog-titles.ts
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

/** Coupe au dernier espace ≤ max, puis retire conjonctions / prépositions orphelines. */
function polishTitle(raw: string, max: number): string {
  let t = raw.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return stripOrphans(t);

  // Coupe au dernier espace dans la limite
  let cut = t.slice(0, max + 1);
  const sp = cut.lastIndexOf(' ');
  if (sp > 20) cut = cut.slice(0, sp);
  else cut = t.slice(0, max);
  cut = cut.replace(/[\s,;:.–—-]+$/g, '').trim();
  return stripOrphans(cut);
}

const ORPHAN_TAIL =
  /\s+(et|ou|de|du|des|d'|la|le|les|un|une|en|avec|pour|sans|dès|sur|sous|par|au|aux|à|a|se|sa|son|ses|ta|ton|tes|qui|que|dont|même|plus|moins|très|bien|mal|tout|toute|tous|toutes|grâce|gagne|emploi|meilleure|meilleur|passer|corps|vite|réels|réel|efficace|efficaces|durables|durable)$/i;

function stripOrphans(t: string): string {
  let out = t;
  for (let i = 0; i < 6; i += 1) {
    let next = out.replace(ORPHAN_TAIL, '').trim();
    // fins incomplètes fréquentes après truncation
    next = next
      .replace(/\s+sans\s+se$/i, '')
      .replace(/\s+sans\s+y$/i, '')
      .replace(/\s+dès\s+\d+$/i, '')
      .replace(/\s+(en|de|avec|même\s+avec|même\s+en)\s+\d+$/i, '')
      .replace(/\s+à$/i, '')
      .trim();
    if (next === out || next.length < 20) break;
    out = next;
  }
  return out.replace(/[\s,;:.–—-]+$/g, '').trim();
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env manquant');

  const { BLOG_SEO_TITLE_MAX } = await import('../src/lib/blog/blog-seo-limits');
  const { withSpanishInvalidationIfContentFrChanged, deleteSpanishTranslationRow } = await import(
    '../src/lib/blog/translate-article-es'
  );

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from('blog_articles')
    .select(
      'id, title_fr, scheduled_publication_at, status, description_fr, content_fr, meta_description_fr, seo_keywords',
    )
    .neq('status', 'published')
    .order('scheduled_publication_at', { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const now = new Date();

  // --- Dates passées → demain+ créneaux libres lun/mer/ven ---
  const past = rows.filter((r) => new Date(r.scheduled_publication_at).getTime() < now.getTime());
  const future = rows.filter((r) => new Date(r.scheduled_publication_at).getTime() >= now.getTime());
  const scheduleFixes: Array<{ id: string; before: string; after: string; title: string }> = [];

  if (past.length > 0) {
    const counts = new Map<string, number>();
    const takenDays = new Set<string>();
    for (const r of future) {
      const d = new Date(r.scheduled_publication_at);
      counts.set(isoWeekKey(d), (counts.get(isoWeekKey(d)) ?? 0) + 1);
      takenDays.add(d.toISOString().slice(0, 10));
    }
    // démarrer à demain 12:00 UTC pour éviter « déjà passé aujourd’hui »
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 12, 0, 0));
    for (const row of past) {
      let placed: Date | null = null;
      let guard = 0;
      while (!placed && guard < 800) {
        guard += 1;
        const dow = cursor.getUTCDay();
        if (dow === 1 || dow === 3 || dow === 5) {
          const key = isoWeekKey(cursor);
          const day = cursor.toISOString().slice(0, 10);
          const n = counts.get(key) ?? 0;
          if (n < 3 && !takenDays.has(day)) {
            placed = new Date(cursor);
            counts.set(key, n + 1);
            takenDays.add(day);
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      if (!placed) throw new Error('Pas de créneau pour ' + row.id);
      scheduleFixes.push({
        id: row.id,
        before: row.scheduled_publication_at,
        after: placed.toISOString(),
        title: row.title_fr,
      });
    }
  }

  // --- Titres à repolir (trop longs OU fin orpheline) ---
  const titleFixes: Array<{ id: string; before: string; after: string; beforeLen: number; afterLen: number }> =
    [];

  for (const row of rows) {
    const before = (row.title_fr ?? '').trim();
    const needs =
      before.length > BLOG_SEO_TITLE_MAX ||
      ORPHAN_TAIL.test(before) ||
      /\s+dès\s+\d+$/i.test(before) ||
      /\s+sans\s+se$/i.test(before) ||
      /\s+(en|de|avec|même\s+avec|même\s+en)\s+\d+$/i.test(before) ||
      /\s+(pour|avec|sans|et|se|gagne|grâce|ta|à|emploi|meilleure|passer|corps)$/i.test(before);
    if (!needs) continue;

    // Si on a le titre original dans le report, repartir de l’original pour un meilleur cut
    let source = before;
    try {
      const report = JSON.parse(
        readFileSync(resolve(process.cwd(), 'data/blog-fix-schedule-titles-report.json'), 'utf8'),
      ) as { titleChanges?: Array<{ id: string; before: string }> };
      const orig = report.titleChanges?.find((t) => t.id === row.id)?.before;
      if (orig && orig.length >= before.length) source = orig;
    } catch {
      /* ignore */
    }

    let after = polishTitle(source, BLOG_SEO_TITLE_MAX);
    if (after.length > BLOG_SEO_TITLE_MAX) {
      after = polishTitle(after, BLOG_SEO_TITLE_MAX);
    }
    if (!after || after === before) continue;
    if (after.length > BLOG_SEO_TITLE_MAX) {
      after = after.slice(0, BLOG_SEO_TITLE_MAX).replace(/[\s,;:.–—-]+$/g, '').trim();
      after = stripOrphans(after);
    }
    titleFixes.push({
      id: row.id,
      before,
      after,
      beforeLen: before.length,
      afterLen: after.length,
    });
  }

  console.log(`Schedule fixes: ${scheduleFixes.length}`);
  for (const s of scheduleFixes) console.log(`  ${s.before} → ${s.after}`);
  console.log(`Title polishes: ${titleFixes.length}`);
  for (const t of titleFixes) {
    console.log(`${t.beforeLen}→${t.afterLen} | ${t.before}`);
    console.log(`         → ${t.after}`);
  }

  for (const s of scheduleFixes) {
    const { error: upErr } = await sb
      .from('blog_articles')
      .update({ scheduled_publication_at: s.after, updated_at: new Date().toISOString() })
      .eq('id', s.id)
      .neq('status', 'published');
    if (upErr) throw upErr;
  }

  for (const t of titleFixes) {
    const row = rows.find((r) => r.id === t.id);
    if (!row) continue;
    const payload = withSpanishInvalidationIfContentFrChanged({
      previous: {
        title_fr: row.title_fr,
        description_fr: row.description_fr,
        content_fr: row.content_fr,
        meta_description_fr: row.meta_description_fr,
        seo_keywords: row.seo_keywords,
      },
      payload: { title_fr: t.after, updated_at: new Date().toISOString() },
    });
    const { error: upErr } = await sb.from('blog_articles').update(payload).eq('id', t.id).neq('status', 'published');
    if (upErr) throw upErr;
    if (payload.title_es === null && payload.content_es === null) {
      await deleteSpanishTranslationRow(sb, t.id);
    }
  }

  const { data: afterRows } = await sb
    .from('blog_articles')
    .select('id, title_fr, scheduled_publication_at')
    .neq('status', 'published')
    .order('scheduled_publication_at', { ascending: true });

  const byWeek = new Map<string, number>();
  for (const r of afterRows ?? []) {
    byWeek.set(isoWeekKey(new Date(r.scheduled_publication_at)), (byWeek.get(isoWeekKey(new Date(r.scheduled_publication_at))) ?? 0) + 1);
  }
  const stillPast = (afterRows ?? []).filter((r) => new Date(r.scheduled_publication_at).getTime() < Date.now());
  const stillLong = (afterRows ?? []).filter((r) => (r.title_fr ?? '').length > BLOG_SEO_TITLE_MAX);
  const stillAwkward = (afterRows ?? []).filter(
    (r) => ORPHAN_TAIL.test((r.title_fr ?? '').trim()) || /\s+dès\s+\d+$/i.test(r.title_fr ?? ''),
  );

  console.log('\n=== VÉRIF ===');
  console.log(`Total: ${afterRows?.length}`);
  console.log(`Période: ${afterRows?.[0]?.scheduled_publication_at} → ${afterRows?.[afterRows.length - 1]?.scheduled_publication_at}`);
  console.log(`Max/sem: ${Math.max(...byWeek.values(), 0)}`);
  console.log(`Dates passées: ${stillPast.length}`);
  console.log(`Titres >59: ${stillLong.length}`);
  console.log(`Titres orphelins: ${stillAwkward.length}`);
  if (stillAwkward.length) stillAwkward.forEach((r) => console.log('  !', r.title_fr));

  const reportPath = resolve(process.cwd(), 'data/blog-polish-titles-report.json');
  mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        at: new Date().toISOString(),
        scheduleFixes,
        titleFixes,
        weeks: [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0])),
        stillPast: stillPast.length,
        stillLong: stillLong.length,
        stillAwkward: stillAwkward.map((r) => r.title_fr),
      },
      null,
      2,
    ),
  );
  console.log(`Report: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
