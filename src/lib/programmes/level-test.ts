/** Correspondance SPEC §4.7. */

export type LevelGoal = 'douceur' | 'tonifier' | 'dos' | 'cardio' | 'souplesse';
export type LevelXp = 'lt6' | '6to24' | 'gt24';
export type LevelTime = '20' | '30' | '60';

const TABLE: Record<LevelGoal, Record<LevelXp, string>> = {
  douceur: { lt6: 'les-fondations', '6to24': 'centre-solide', gt24: 'pilates-challenge' },
  tonifier: { lt6: 'barre-en-douceur', '6to24': 'barre-sculpt', gt24: 'barre-intense' },
  dos: { lt6: 'dos-posture-anti-bureau', '6to24': 'centre-solide', gt24: 'pilates-challenge' },
  cardio: { lt6: 'routine-express-20', '6to24': 'cardio-plaisir', gt24: 'boot-camp-hiit' },
  souplesse: { lt6: 'souplesse-recuperation', '6to24': 'souplesse-recuperation', gt24: 'souplesse-recuperation' },
};

export function recommendProgramSlug(goal: LevelGoal, xp: LevelXp, time: LevelTime): { slug: string; partialHint: boolean } {
  if (time === '20' && xp === 'lt6') return { slug: 'routine-express-20', partialHint: false };
  const slug = TABLE[goal][xp];
  if (time === '20' && xp !== 'lt6') return { slug, partialHint: true };
  return { slug, partialHint: false };
}

export const LEVEL_TEST_COOKIE = 'fm_level_test_slug';
