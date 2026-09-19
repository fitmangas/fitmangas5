import { describe, expect, it } from 'vitest';

import {
  canGoNext,
  canGoPrev,
  chapterCounter,
  clampChapterIndex,
  resolveChapterSteps,
} from '@/lib/quiz/chapter-steps';

describe('resolveChapterSteps', () => {
  it('exclut les étapes conditionnelles et recalcule le total', () => {
    const steps = resolveChapterSteps([
      { id: 'a', shortLabel: 'A', label: 'Début' },
      { id: 'b', shortLabel: 'B', label: 'Q1', include: true },
      { id: 'c', shortLabel: 'C', label: 'Rapport', include: false },
    ]);
    expect(steps.map((s) => s.id)).toEqual(['a', 'b']);
    expect(chapterCounter(1, steps.length)).toEqual({ current: 2, total: 2 });
  });

  it('réintègre le résultat quand include repasse à true', () => {
    const withResult = resolveChapterSteps([
      { id: 'a', shortLabel: 'A', label: 'Début' },
      { id: 'r', shortLabel: 'R', label: 'Rapport', include: true },
    ]);
    expect(withResult).toHaveLength(2);
    expect(canGoNext(0, withResult.length)).toBe(true);
    expect(canGoNext(1, withResult.length)).toBe(false);
  });
});

describe('clampChapterIndex', () => {
  it('ne sort jamais des bornes', () => {
    expect(clampChapterIndex(-1, 5)).toBe(0);
    expect(clampChapterIndex(9, 5)).toBe(4);
    expect(clampChapterIndex(2, 0)).toBe(0);
  });
});

describe('navigation bornes', () => {
  it('désactive précédent en première, suivant en dernière', () => {
    expect(canGoPrev(0)).toBe(false);
    expect(canGoPrev(1)).toBe(true);
    expect(canGoNext(3, 5)).toBe(true);
    expect(canGoNext(4, 5)).toBe(false);
    expect(canGoNext(3, 5, false)).toBe(false);
  });
});
