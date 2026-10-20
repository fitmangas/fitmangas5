/**
 * Import des 12 programmes en base (tables du lot 3). Lecture seule par défaut.
 *
 *   set -a && source .env.local; set +a
 *   npx tsx scripts/import-programmes.ts                         # contrôle : correspondance des vidéos, rien n'est écrit
 *   FM_IMPORT_APPLY=1 npx tsx scripts/import-programmes.ts --apply   # crée les programmes absents, en brouillon
 *
 * Options d'environnement :
 *   FM_SEGMENTS_VALIDATED=1  les extraits « à vérifier » sont validés (segment_to_validate = false).
 *
 * Source : src/lib/programmes/catalogue.json (le même catalogue que le site).
 * Refuse d'écrire si une vidéo est introuvable ou ambiguë (un programme avec une étape sans vidéo serait cassé).
 * Ne modifie jamais un programme qui existe déjà (même slug) : il est ignoré.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { matchPublishedTitles } from '../src/lib/programmes/normalize-title';

type L10n = { fr: string; es: string };
type CatalogStep = {
  order?: number;
  kind?: string;
  video_title?: string;
  minutes?: number | null;
  live_style?: string | null;
  objective?: L10n | null;
  objective_long?: L10n | null;
  segment?: {
    start_s?: number | null;
    end_s?: number | null;
    to_validate?: boolean;
  } | null;
};
type CatalogProgram = {
  slug: string;
  level?: number;
  track?: string;
  goals?: string[];
  intensity?: number | null;
  impact?: string | null;
  live_style?: string | null;
  title: L10n;
  promise?: L10n | null;
  for_who?: L10n | null;
  not_for?: L10n | null;
  coach_note?: (L10n & { todo?: string }) | null;
  benefits?: unknown[];
  equipment?: unknown[];
  tests?: unknown[];
  weeks?: number;
  sessions_per_week?: number;
  minutes_range?: string | null;
  cover_suggestion?: string | null;
  next_slug?: string | null;
  weeks_detail?: Array<{
    week: number;
    focus?: L10n;
    cues?: L10n[];
    steps?: CatalogStep[];
  }>;
};
type Catalog = { programs: CatalogProgram[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;
type VideoRef = { id: string; title: string | null };

const apply = process.argv.includes('--apply');
const segmentsValidated = process.env.FM_SEGMENTS_VALIDATED === '1';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'src/lib/programmes/catalogue.json');

const l10n = (v: unknown): L10n | null => {
  if (!v || typeof v !== 'object') return null;
  const o = v as { fr?: unknown; es?: unknown };
  const fr = typeof o.fr === 'string' ? o.fr : '';
  const es = typeof o.es === 'string' ? o.es : '';
  return fr || es ? { fr, es: es || fr } : null;
};

function coverUrl(p: CatalogProgram): string {
  const file = (p.cover_suggestion ?? '').split('/').pop() || 'alejandra-tapis.jpg';
  return file.startsWith('http') || file.startsWith('/') ? file : `/programmes/${file}`;
}

function resolveVideo(step: CatalogStep, videos: VideoRef[]): string | null {
  if (!step.video_title) return null;
  const m = matchPublishedTitles(step.video_title, videos);
  return m.status === 'exact' ? m.ids[0] : null;
}

async function main() {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as Catalog;
  const wanted = new Set<string>();
  let stepCount = 0;
  let segmentCount = 0;
  for (const p of catalog.programs) {
    for (const w of p.weeks_detail ?? []) {
      for (const s of w.steps ?? []) {
        stepCount += 1;
        if (s.segment) segmentCount += 1;
        if (s.kind !== 'live' && s.video_title) wanted.add(s.video_title);
      }
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase non configuré (charger .env.local).');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await db
    .from('standalone_vimeo_videos')
    .select('id, title, validation_status')
    .eq('validation_status', 'published');
  if (error) throw new Error(error.message);
  const videos: VideoRef[] = (rows ?? []).map((v) => ({
    id: String(v.id),
    title: (v.title as string | null) ?? null,
  }));

  const missing: string[] = [];
  const ambiguous: Array<{ title: string; ids: string[] }> = [];
  let exact = 0;
  for (const title of wanted) {
    const m = matchPublishedTitles(title, videos);
    if (m.status === 'exact') exact += 1;
    else if (m.status === 'missing') missing.push(title);
    else ambiguous.push({ title, ids: m.ids });
  }

  const { data: existingRows } = await db.from('programs').select('slug');
  const existing = new Set((existingRows ?? []).map((r) => String(r.slug)));
  const toCreate = catalog.programs.filter((p) => !existing.has(p.slug)).map((p) => p.slug);

  const report = [
    `# Import programmes — ${apply ? 'APPLY' : 'contrôle (rien écrit)'}`,
    '',
    `Date : ${new Date().toISOString()}`,
    `Catalogue : src/lib/programmes/catalogue.json — ${catalog.programs.length} programmes, ${stepCount} étapes (dont ${segmentCount} extraits)`,
    `Vidéos demandées : ${wanted.size} — trouvées : ${exact} — introuvables : ${missing.length} — ambiguës : ${ambiguous.length}`,
    `Déjà en base (ignorés) : ${existing.size ? [...existing].join(', ') : '(aucun)'}`,
    `À créer : ${toCreate.length ? toCreate.join(', ') : '(aucun)'}`,
    `Extraits validés (FM_SEGMENTS_VALIDATED=1) : ${segmentsValidated ? 'oui' : 'non'}`,
    '',
    '## Introuvables',
    ...(missing.length ? missing.map((t) => `- ${t}`) : ['- (aucun)']),
    '',
    '## Ambiguës',
    ...(ambiguous.length ? ambiguous.map((a) => `- ${a.title} → ${a.ids.join(', ')}`) : ['- (aucune)']),
  ].join('\n');

  const outDir = join(root, 'docs/maquettes/chantier-octobre-2026/rapports');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, apply ? 'import-programmes-apply.md' : 'import-programmes-dry-run.md'), report, 'utf8');
  console.log(report);

  if (!apply) return;
  if (process.env.FM_IMPORT_APPLY !== '1') {
    console.error('Refus : --apply exige FM_IMPORT_APPLY=1 (GO écrit de Kevin). Rien n’a été créé.');
    process.exit(2);
  }
  if (missing.length || ambiguous.length) {
    console.error(
      'Refus : au moins une vidéo est introuvable ou ambiguë. Corriger le titre dans le catalogue puis relancer. Rien n’a été créé.',
    );
    process.exit(3);
  }
  await createPrograms(db, catalog, videos, existing);
}

async function createPrograms(db: Db, catalog: Catalog, videos: VideoRef[], existing: Set<string>) {
  let created = 0;
  for (const [index, p] of catalog.programs.entries()) {
    if (existing.has(p.slug)) continue;
    const coach = l10n(p.coach_note) ?? { fr: '', es: '' };
    const { data: program, error } = await db
      .from('programs')
      .insert({
        slug: p.slug,
        status: 'draft',
        level: p.level ?? 1,
        track: p.track ?? 'pilates',
        goals: p.goals ?? [],
        intensity: p.intensity ?? null,
        impact: p.impact ?? null,
        live_style: p.live_style ?? null,
        title: l10n(p.title) ?? { fr: p.slug, es: p.slug },
        promise: l10n(p.promise),
        for_who: l10n(p.for_who),
        not_for: l10n(p.not_for),
        coach_note: { fr: coach.fr, es: coach.es },
        benefits: p.benefits ?? [],
        equipment: p.equipment ?? [],
        tests: p.tests ?? [],
        weeks: p.weeks ?? (p.weeks_detail ?? []).length,
        sessions_per_week: p.sessions_per_week ?? 0,
        minutes_range: p.minutes_range ?? null,
        cover_url: coverUrl(p),
        sort_order: index,
      })
      .select('id')
      .single();
    if (error || !program) throw new Error(`programme ${p.slug} : ${error?.message ?? 'insertion impossible'}`);
    const programId = String(program.id);

    try {
      for (const w of p.weeks_detail ?? []) {
        const { error: weekError } = await db.from('program_weeks').insert({
          program_id: programId,
          week: w.week,
          focus: l10n(w.focus) ?? { fr: '', es: '' },
          cues: (w.cues ?? []).map((c) => l10n(c)).filter(Boolean),
        });
        if (weekError) throw new Error(`programme ${p.slug} semaine ${w.week} : ${weekError.message}`);

        const steps = (w.steps ?? []).map((s, i) => {
          const isLive = s.kind === 'live';
          return {
            program_id: programId,
            week: w.week,
            position: s.order ?? i + 1,
            kind: isLive ? 'live' : 'video',
            video_id: isLive ? null : resolveVideo(s, videos),
            start_s: s.segment?.start_s ?? null,
            end_s: s.segment?.end_s ?? null,
            segment_to_validate: segmentsValidated ? false : Boolean(s.segment?.to_validate),
            minutes: s.minutes ?? null,
            objective: l10n(s.objective),
            objective_long: l10n(s.objective_long),
            live_style: isLive ? (s.live_style ?? p.live_style ?? null) : null,
          };
        });
        if (steps.length) {
          const { error: stepError } = await db.from('program_steps').insert(steps);
          if (stepError) throw new Error(`programme ${p.slug} semaine ${w.week} (étapes) : ${stepError.message}`);
        }
      }
    } catch (e) {
      // Annule le brouillon créé à l'instant par ce script (semaines et étapes suivent en cascade).
      await db.from('programs').delete().eq('id', programId).eq('status', 'draft');
      throw e;
    }
    created += 1;
  }

  const { data: all } = await db.from('programs').select('id, slug, next_program_id');
  const slugToId = new Map((all ?? []).map((r) => [String(r.slug), String(r.id)]));
  for (const p of catalog.programs) {
    const next = p.next_slug ? slugToId.get(p.next_slug) : null;
    const id = slugToId.get(p.slug);
    if (id && next)
      await db.from('programs').update({ next_program_id: next }).eq('id', id).is('next_program_id', null);
  }
  console.log(`APPLY : ${created} programme(s) créé(s) en brouillon (existants ignorés).`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
