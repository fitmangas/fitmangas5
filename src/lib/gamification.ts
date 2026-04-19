export type GamificationGrade = 'debutant' | 'confirme' | 'expert';

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
