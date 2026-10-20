/**
 * Import catalogue programmes. --dry-run par défaut (lecture seule).
 *   set -a && source .env.local; set +a; npx tsx scripts/import-programmes.ts
 *   npx tsx scripts/import-programmes.ts --apply   # Kevin seulement, après GO
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

import { matchPublishedTitles } from '../src/lib/programmes/normalize-title';

type Catalog = {
  programs: Array<{
    slug: string;
    title: { fr: string };
    next_slug?: string | null;
    weeks_detail?: Array<{
      steps?: Array<{ kind?: string; video_title?: string }>;
    }>;
  }>;
};

const apply = process.argv.includes('--apply');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'docs/maquettes/chantier-octobre-2026/programmes-catalogue.v1.json');

async function main() {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as Catalog;
  const wanted: string[] = [];
  for (const p of catalog.programs) {
    for (const w of p.weeks_detail ?? []) {
      for (const s of w.steps ?? []) {
        if (s.kind === 'video' && s.video_title) wanted.push(s.video_title);
      }
    }
  }
  const uniqueWanted = [...new Set(wanted)];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase non configuré');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: videos, error } = await db
    .from('standalone_vimeo_videos')
    .select('id, title, validation_status')
    .eq('validation_status', 'published');
  if (error) throw new Error(error.message);
  const catalogVideos = (videos ?? []).map((v) => ({ id: String(v.id), title: (v.title as string | null) ?? null }));

  const missing: string[] = [];
  const ambiguous: Array<{ title: string; ids: string[] }> = [];
  let exact = 0;
  for (const title of uniqueWanted) {
    const m = matchPublishedTitles(title, catalogVideos);
    if (m.status === 'exact') exact += 1;
    else if (m.status === 'missing') missing.push(title);
    else ambiguous.push({ title, ids: m.ids });
  }

  const report = [
    '# Import programmes — dry-run',
    '',
    `Date : ${new Date().toISOString()}`,
    `Mode : ${apply ? 'APPLY (refusé ici si dry-run forcé)' : 'dry-run'}`,
    `Programmes JSON : ${catalog.programs.length}`,
    `Titres uniques demandés : ${uniqueWanted.length}`,
    `Correspondances exactes : ${exact}`,
    `Introuvables : ${missing.length}`,
    `Ambigus : ${ambiguous.length}`,
    '',
    '## Introuvables',
    ...(missing.length ? missing.map((t) => `- ${t}`) : ['- (aucun)']),
    '',
    '## Ambigus',
    ...(ambiguous.length ? ambiguous.map((a) => `- ${a.title} → ${a.ids.join(', ')}`) : ['- (aucun)']),
    '',
    apply
      ? 'APPLY refusé : exiger FM_IMPORT_APPLY=1 après GO écrit de Kevin. Rien n’a été créé.'
      : 'Aucune écriture.',
  ].join('\n');

  const outDir = join(root, 'docs/maquettes/chantier-octobre-2026/rapports');
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'import-programmes-dry-run.md');
  writeFileSync(outFile, report, 'utf8');
  console.log(report);
  if (apply) {
    if (process.env.FM_IMPORT_APPLY !== '1') {
      console.error('Refus : --apply est réservé à Kevin après GO écrit (FM_IMPORT_APPLY=1). Rien n’a été créé.');
      process.exit(2);
    }
    await applyMissingDrafts(db, catalog, catalogVideos);
  }
}

async function applyMissingDrafts(
  db: ReturnType<typeof createClient>,
  catalog: Catalog,
  catalogVideos: Array<{ id: string; title: string | null }>,
) {
  const { data: existing } = await db.from('programs').select('slug');
  const have = new Set((existing ?? []).map((r) => String(r.slug)));
  const idBySlug = new Map<string, string>();
  for (const p of catalog.programs) {
    if (have.has(p.slug)) continue;
    const cover = `/programmes/${(p as { cover_suggestion?: string }).cover_suggestion?.split('/').pop() ?? ''}`.replace(/\/$/, '');
    const { data, error } = await db
      .from('programs')
      .insert({
        slug: p.slug,
        status: 'draft',
        level: (p as { level?: number }).level ?? 1,
        track: (p as { track?: string }).track ?? 'pilates',
        goals: (p as { goals?: string[] }).goals ?? [],
        title: (p as { title?: unknown }).title,
        promise: (p as { promise?: unknown }).promise ?? null,
        for_who: (p as { for_who?: unknown }).for_who ?? null,
        not_for: (p as { not_for?: unknown }).not_for ?? null,
        coach_note: (p as { coach_note?: unknown }).coach_note ?? null,
        benefits: (p as { benefits?: unknown }).benefits ?? [],
        equipment: (p as { equipment?: unknown }).equipment ?? [],
        tests: (p as { tests?: unknown }).tests ?? [],
        weeks: (p as { weeks?: number }).weeks ?? 0,
        sessions_per_week: (p as { sessions_per_week?: number }).sessions_per_week ?? 0,
        minutes_range: (p as { minutes_range?: string }).minutes_range ?? null,
        cover_url: cover,
        sort_order: catalog.programs.indexOf(p),
      })
      .select('id, slug')
      .single();
    if (error) throw new Error(error.message);
    if (data) idBySlug.set(String(data.slug), String(data.id));
    const programId = String(data?.id);
    for (const w of p.weeks_detail ?? []) {
      await db.from('program_weeks').insert({
        program_id: programId,
        week: (w as { week?: number }).week ?? 1,
        focus: (w as { focus?: unknown }).focus ?? {},
        cues: (w as { cues?: unknown }).cues ?? [],
      });
      let pos = 1;
      for (const s of w.steps ?? []) {
        const videoTitle = s.video_title;
        const match = videoTitle ? matchPublishedTitles(videoTitle, catalogVideos) : { status: 'missing' as const, ids: [] as string[] };
        const videoId = match.status === 'exact' ? match.ids[0] : null;
        await db.from('program_steps').insert({
          program_id: programId,
          week: (w as { week?: number }).week ?? 1,
          position: pos,
          kind: s.kind === 'live' ? 'live' : 'video',
          video_id: videoId,
          segment_to_validate: Boolean((s as { segment?: { to_validate?: boolean } }).segment?.to_validate),
        });
        pos += 1;
      }
    }
  }
  const { data: all } = await db.from('programs').select('id, slug, next_program_id');
  const slugToId = new Map((all ?? []).map((r) => [String(r.slug), String(r.id)]));
  for (const p of catalog.programs) {
    const next = p.next_slug ? slugToId.get(p.next_slug) : null;
    const id = slugToId.get(p.slug);
    if (id && next) await db.from('programs').update({ next_program_id: next }).eq('id', id).is('next_program_id', null);
  }
  console.log(`APPLY : slugs créés = ${idBySlug.size} (existants ignorés).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
