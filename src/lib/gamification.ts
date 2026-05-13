export type GamificationGrade = 'debutant' | 'confirme' | 'expert';

type GamificationStats = {
  points?: number | null;
  liveVisits?: number | null;
  replaySeconds?: number | null;
  onsitePresences?: number | null;
};

export function gradeLabel(grade: string | null | undefined, lang: 'fr' | 'en' | 'es' = 'fr'): string {
  const labels =
    lang === 'es'
      ? { debutant: 'Principiante', confirme: 'Confirmada', expert: 'Experta' }
      : lang === 'en'
        ? { debutant: 'Beginner', confirme: 'Confirmed', expert: 'Expert' }
        : { debutant: 'Débutant', confirme: 'Confirmée', expert: 'Experte' };
  switch (grade) {
    case 'debutant':
      return labels.debutant;
    case 'confirme':
      return labels.confirme;
    case 'expert':
      return labels.expert;
    default:
      return labels.debutant;
  }
}

export function gradeRibbonClass(grade: string | null | undefined): string {
  switch (grade) {
    case 'expert':
      return 'bg-gradient-to-r from-blue-700/65 to-blue-900/60 text-white ring-blue-200/45 backdrop-blur-md';
    case 'confirme':
      return 'bg-gradient-to-r from-sky-400/60 to-blue-500/55 text-[#0f172a] ring-sky-100/55 backdrop-blur-md';
    default:
      return 'bg-gradient-to-r from-amber-200/75 to-yellow-300/65 text-[#1f2937] ring-amber-100/70 backdrop-blur-md';
  }
}

export function computeGamificationScore(stats: GamificationStats): number {
  const points = Math.max(0, stats.points ?? 0);
  const live = Math.max(0, stats.liveVisits ?? 0) * 12;
  const replayHours = Math.floor(Math.max(0, stats.replaySeconds ?? 0) / 3600) * 4;
  const onsite = Math.max(0, stats.onsitePresences ?? 0) * 10;
  return points + live + replayHours + onsite;
}

export function computeGamificationGrade(stats: GamificationStats): GamificationGrade {
  const score = computeGamificationScore(stats);
  if (score >= 500) return 'expert';
  if (score >= 180) return 'confirme';
  return 'debutant';
}
