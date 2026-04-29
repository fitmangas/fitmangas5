export type GamificationGrade = 'debutant' | 'confirme' | 'expert';

type GamificationStats = {
  points?: number | null;
  liveVisits?: number | null;
  replaySeconds?: number | null;
  onsitePresences?: number | null;
};

export function gradeLabel(grade: string | null | undefined): string {
  switch (grade) {
    case 'debutant':
      return 'Débutant';
    case 'confirme':
      return 'Confirmé';
    case 'expert':
      return 'Expert';
    default:
      return 'Débutant';
  }
}

export function gradeRibbonClass(grade: string | null | undefined): string {
  switch (grade) {
    case 'expert':
      return 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white ring-violet-300/50';
    case 'confirme':
      return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-amber-200/60';
    default:
      return 'bg-gradient-to-r from-neutral-400 to-neutral-600 text-white ring-neutral-300/40';
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
