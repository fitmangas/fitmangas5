export type ReplayCourseTypeKey =
  | 'pilates-mat'
  | 'barre'
  | 'yoga-flow'
  | 'postural'
  | 'renfo-core'
  | 'flow'
  | 'other';

export type ReplayCourseTypeOption = { value: ReplayCourseTypeKey; label: string };

export const REPLAY_COURSE_TYPE_OPTIONS: ReplayCourseTypeOption[] = [
  { value: 'pilates-mat', label: 'Pilates Mat' },
  { value: 'barre', label: 'Barre' },
  { value: 'yoga-flow', label: 'Yoga Flow' },
  { value: 'postural', label: 'Postural' },
  { value: 'renfo-core', label: 'Renfo Core' },
  { value: 'flow', label: 'Flow' },
];

export function replayCourseTypeLabel(key: ReplayCourseTypeKey, lang: 'fr' | 'es' | 'en' = 'fr'): string {
  const found = REPLAY_COURSE_TYPE_OPTIONS.find((o) => o.value === key);
  if (found) return found.label;
  if (lang === 'es') return 'Otro';
  if (lang === 'en') return 'Other';
  return 'Autre';
}

/** Déduit le type de cours depuis le titre ou le slug (filtres replays). */
export function inferReplayCourseType(title: string, slug?: string | null): ReplayCourseTypeKey {
  const hay = `${title} ${slug ?? ''}`.toLowerCase();
  if (hay.includes('barre')) return 'barre';
  if (hay.includes('yoga')) return 'yoga-flow';
  if (hay.includes('postural')) return 'postural';
  if (hay.includes('renfo') || hay.includes('core')) return 'renfo-core';
  if (hay.includes('flow') && !hay.includes('yoga')) return 'flow';
  if (hay.includes('pilates') || hay.includes('mat')) return 'pilates-mat';

  const exact = REPLAY_COURSE_TYPE_OPTIONS.find(
    (opt) => opt.label.trim().toLowerCase() === title.trim().toLowerCase(),
  );
  if (exact) return exact.value;

  return 'other';
}

export function isReplayCourseTypeKey(value: string): value is ReplayCourseTypeKey {
  return (
    value === 'pilates-mat' ||
    value === 'barre' ||
    value === 'yoga-flow' ||
    value === 'postural' ||
    value === 'renfo-core' ||
    value === 'flow' ||
    value === 'other'
  );
}
