import raw from './catalogue.json';

export type Localized = { fr: string; es: string };

export type CatalogProgram = {
  slug: string;
  status: string;
  level: number;
  track: string;
  goals: string[];
  intensity?: number;
  impact?: string;
  live_style?: string;
  title: Localized;
  promise: Localized;
  for_who?: Localized;
  not_for?: Localized;
  benefits: Array<{ fr: string; es: string; icon?: string }>;
  equipment: Localized[];
  weeks: number;
  sessions_per_week: number;
  minutes_range: string;
  cover_suggestion: string;
  next_slug?: string | null;
  tests?: unknown[];
  weeks_detail?: Array<{
    week: number;
    focus: Localized;
    cues?: Localized[];
    steps?: Array<{
      kind: string;
      order?: number;
      video_title?: string;
      minutes?: number;
      objective?: Localized;
      segment?: { start_s?: number; end_s?: number; to_validate?: boolean };
    }>;
  }>;
};

const data = raw as { programs: CatalogProgram[] };

export const CATALOG_PROGRAMS: CatalogProgram[] = data.programs;

export function coverUrl(p: CatalogProgram): string {
  const file = p.cover_suggestion.split('/').pop() ?? 'alejandra-tapis.jpg';
  return `/programmes/${file}`;
}

export function programBySlug(slug: string): CatalogProgram | undefined {
  return CATALOG_PROGRAMS.find((p) => p.slug === slug);
}

export const GOAL_FILTERS = [
  { id: 'all', fr: 'Tous', es: 'Todos' },
  { id: 'tonifier', fr: 'Tonifier', es: 'Tonificar' },
  { id: 'dos', fr: 'Dos & posture', es: 'Espalda y postura' },
  { id: 'cardio', fr: 'Cardio', es: 'Cardio' },
  { id: 'souplesse', fr: 'Souplesse', es: 'Flexibilidad' },
  { id: 'peu', fr: 'Peu de temps', es: 'Poco tiempo' },
] as const;

export function matchesGoal(p: CatalogProgram, goal: string): boolean {
  if (goal === 'all' || !goal) return true;
  if (goal === 'peu') return p.slug === 'routine-express-20' || (p.minutes_range ?? '').startsWith('20');
  return p.goals.includes(goal);
}

export const LEVEL_SECTIONS = [
  { level: 1, kickerFr: 'Débutante', titleFr: 'Je démarre', titleEs: 'Empiezo', descFr: 'Tu débutes ou tu reprends : des séances de 20 à 40 minutes et des bases solides.' },
  { level: 2, kickerFr: 'Intermédiaire', titleFr: 'Je progresse', titleEs: 'Progreso', descFr: 'Tu as les bases : on ajoute du rythme, des accessoires, plus d’exigence.' },
  { level: 3, kickerFr: 'Avancée', titleFr: 'Je me dépasse', titleEs: 'Me supero', descFr: 'Tu veux du défi : plus long, plus intense, toujours corrigée en live.' },
  { level: 0, kickerFr: 'Tous niveaux', titleFr: 'Bien-être', titleEs: 'Bienestar', descFr: 'Souplesse et récupération, pour respirer entre deux cycles plus intenses.' },
] as const;

export const LEVEL_LABEL: Record<number, { fr: string; es: string }> = {
  0: { fr: 'Tous niveaux', es: 'Todos los niveles' },
  1: { fr: 'Débutante', es: 'Principiante' },
  2: { fr: 'Intermédiaire', es: 'Intermedio' },
  3: { fr: 'Avancée', es: 'Avanzado' },
};

export const GOAL_TAG: Record<string, string> = {
  debuter: 'Débuter en douceur',
  tonifier: 'Tonifier',
  dos: 'Dos & posture',
  cardio: 'Cardio',
  souplesse: 'Souplesse',
};
