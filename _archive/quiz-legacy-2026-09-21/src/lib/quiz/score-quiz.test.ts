import { describe, expect, it } from 'vitest';

import { quizProfilDiscipline } from '@/lib/quiz/quizzes/profil-discipline';
import { scoreQuiz } from '@/lib/quiz/types';

/** Construit des réponses : 12 questions à +2, puis q13. */
function answersFromPicks(picks: Record<string, string>) {
  return picks;
}

describe('scoreQuiz profil-discipline', () => {
  it('q13 à poids 4 : rattrapage depuis −2 ne crée plus d’égalité de points', () => {
    // Avant q13 : Assidue 8, Méthodique 6 (et le reste).
    // Ancien bug : +2 sur Méthodique → 8/8 → 31%/31%.
    const answers = answersFromPicks({
      q1: 'd', // A
      q2: 'a', // A
      q3: 'd', // A
      q4: 'b', // A
      q5: 'a', // M
      q6: 'c', // M
      q7: 'a', // M
      q8: 'c', // D
      q9: 'd', // D
      q10: 'c', // D
      q11: 'd', // E
      q12: 'b', // E
      q13: 'd', // M (+4) → M=10, A=8
    });

    const score = scoreQuiz(quizProfilDiscipline, answers);
    expect(score.totals.vert).toBe(8);
    expect(score.totals.bleu).toBe(10);
    expect(score.resultId).toBe('bleu');
    expect(score.percents.bleu).not.toBe(score.percents.vert);
    expect(score.percents.bleu).toBeGreaterThan(score.percents.vert!);
  });

  it('n°1 et n°2 n’affichent jamais le même pourcentage', () => {
    // Mix volontairement serré — le filet d’affichage doit séparer.
    const answers = answersFromPicks({
      q1: 'd', // A
      q2: 'a', // A
      q3: 'd', // A
      q4: 'd', // M
      q5: 'a', // M
      q6: 'c', // M
      q7: 'b', // D
      q8: 'c', // D
      q9: 'd', // D
      q10: 'a', // E
      q11: 'd', // E
      q12: 'b', // E
      q13: 'c', // A (+4)
    });

    const score = scoreQuiz(quizProfilDiscipline, answers);
    const top = score.ranked[0]!;
    const second = score.ranked[1]!;
    expect(top.percent).not.toBe(second.percent);
  });
});
