/**
 * Helpers purs pour le lecteur de chapitres (style avis de valeur).
 * Une étape = un écran ; le total se recalcule si des étapes conditionnelles sortent.
 */

export type ChapterStepConfig<T = unknown> = {
  id: string;
  shortLabel: string;
  label: string;
  /** Masquer chrome (ouverture plein écran). */
  hideChrome?: boolean;
  /** Exclure dynamiquement (ex. résultat pas encore soumis). */
  include?: boolean;
  data?: T;
};

export function resolveChapterSteps<T>(steps: ChapterStepConfig<T>[]): ChapterStepConfig<T>[] {
  return steps.filter((s) => s.include !== false);
}

export function clampChapterIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(index, total - 1));
}

export function chapterCounter(index: number, total: number): { current: number; total: number } {
  const safeTotal = Math.max(0, total);
  if (safeTotal === 0) return { current: 0, total: 0 };
  return { current: clampChapterIndex(index, safeTotal) + 1, total: safeTotal };
}

export function canGoPrev(index: number): boolean {
  return index > 0;
}

export function canGoNext(index: number, total: number, stepAllowsNext = true): boolean {
  if (!stepAllowsNext) return false;
  return index < total - 1;
}
