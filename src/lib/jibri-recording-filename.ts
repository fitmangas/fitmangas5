import { parse } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import type { SupabaseClient } from '@supabase/supabase-js';

import { COACH_PUBLISH_TIMEZONE } from '@/lib/notifications/timezone';

/** fitmangas-{slug}-{YYYYMMDDHHMM}_{timestamp}.mp4 */
const JIBRI_FILENAME_RE =
  /^fitmangas-(.+)-(\d{12})_\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.mp4$/i;

const MATCH_WINDOW_MS = 10 * 60 * 1000;

export type ParsedJibriRecordingFileName = {
  slug: string;
  startsAtParis: Date;
  dateBlock: string;
};

export function slugifyCourseTitle(title: string): string {
  const s = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s;
}

/** Parse le bloc YYYYMMDDHHMM comme heure locale Europe/Paris. */
export function parseJibriParisStartAt(dateBlock: string): Date | null {
  if (!/^\d{12}$/.test(dateBlock)) return null;
  const wall = parse(
    `${dateBlock.slice(0, 4)}-${dateBlock.slice(4, 6)}-${dateBlock.slice(6, 8)} ${dateBlock.slice(8, 10)}:${dateBlock.slice(10, 12)}:00`,
    'yyyy-MM-dd HH:mm:ss',
    new Date(),
  );
  if (Number.isNaN(wall.getTime())) return null;
  return fromZonedTime(wall, COACH_PUBLISH_TIMEZONE);
}

/** Titre ou nom de fichier Jibri (replay live) — à exclure de la bibliothèque standalone Vimeo. */
export function isJibriRecordingFileNameOrTitle(name: string | null | undefined): boolean {
  const base = name?.trim().split(/[/\\]/).pop() ?? '';
  if (!base) return false;
  return JIBRI_FILENAME_RE.test(base);
}

export function parseJibriRecordingFileName(fileName: string): ParsedJibriRecordingFileName | null {
  const base = fileName.trim().split(/[/\\]/).pop() ?? '';
  const match = base.match(JIBRI_FILENAME_RE);
  if (!match?.[1] || !match[2]) return null;

  const slug = match[1].trim().toLowerCase();
  const dateBlock = match[2];
  const startsAtParis = parseJibriParisStartAt(dateBlock);
  if (!slug || !startsAtParis) return null;

  return { slug, startsAtParis, dateBlock };
}

export async function findCourseIdForJibriRecording(
  admin: SupabaseClient,
  parsed: ParsedJibriRecordingFileName,
): Promise<string | null> {
  const windowStart = new Date(parsed.startsAtParis.getTime() - MATCH_WINDOW_MS).toISOString();
  const windowEnd = new Date(parsed.startsAtParis.getTime() + MATCH_WINDOW_MS).toISOString();

  const { data: rows, error } = await admin
    .from('courses')
    .select('id, slug, title, starts_at')
    .eq('course_format', 'online')
    .gte('starts_at', windowStart)
    .lte('starts_at', windowEnd);

  if (error) throw error;
  return pickClosestJibriCourseMatch(rows ?? [], parsed)?.id ?? null;
}

export function courseMatchesJibriSlug(
  row: { slug?: string | null; title?: string | null },
  slugNorm: string,
): boolean {
  const courseSlug = String(row.slug ?? '').trim().toLowerCase();
  if (courseSlug === slugNorm) return true;
  return slugifyCourseTitle(String(row.title ?? '')) === slugNorm;
}

/** Si deux « Fit Dance » tombent dans ±10 min, on prend l’horaire le plus proche du fichier. */
export function pickClosestJibriCourseMatch<
  T extends { id: string; slug?: string | null; title?: string | null; starts_at?: string | null },
>(rows: T[], parsed: ParsedJibriRecordingFileName): T | null {
  const slugNorm = parsed.slug.toLowerCase();
  const hits = rows.filter((row) => courseMatchesJibriSlug(row, slugNorm));
  if (!hits.length) return null;
  const target = parsed.startsAtParis.getTime();
  return [...hits].sort((a, b) => {
    const da = Math.abs(new Date(a.starts_at ?? 0).getTime() - target);
    const db = Math.abs(new Date(b.starts_at ?? 0).getTime() - target);
    return da - db;
  })[0];
}
