export const COURSE_SKILL_LEVELS = ['all_levels', 'beginner', 'intermediate', 'advanced'] as const;

export type CourseSkillLevel = (typeof COURSE_SKILL_LEVELS)[number];

export function isCourseSkillLevel(value: unknown): value is CourseSkillLevel {
  return typeof value === 'string' && (COURSE_SKILL_LEVELS as readonly string[]).includes(value);
}

export function normalizeCourseSkillLevel(value: unknown): CourseSkillLevel {
  return isCourseSkillLevel(value) ? value : 'all_levels';
}

const LABELS_FR: Record<CourseSkillLevel, string> = {
  all_levels: 'Tous niveaux',
  beginner: 'Débutant',
  intermediate: 'Confirmé',
  advanced: 'Expert',
};

const LABELS_ES: Record<CourseSkillLevel, string> = {
  all_levels: 'Todos los niveles',
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Experto',
};

const LABELS_EN: Record<CourseSkillLevel, string> = {
  all_levels: 'All levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function courseSkillLevelLabel(level: CourseSkillLevel, lang: 'fr' | 'es' | 'en' = 'fr'): string {
  if (lang === 'es') return LABELS_ES[level];
  if (lang === 'en') return LABELS_EN[level];
  return LABELS_FR[level];
}

/** Niveaux affichés comme filtres (hors « tous niveaux » implicite). */
export const FILTERABLE_SKILL_LEVELS: CourseSkillLevel[] = ['beginner', 'intermediate', 'advanced'];
