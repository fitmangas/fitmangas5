import { quizCarteStress } from '@/lib/quiz/quizzes/carte-stress';
import { quizEnergieJournee } from '@/lib/quiz/quizzes/energie-journee';
import { quizJeRatePuis } from '@/lib/quiz/quizzes/je-rate-puis';
import { quizProfilDiscipline } from '@/lib/quiz/quizzes/profil-discipline';
import { quizSeuleFaceAuTapis } from '@/lib/quiz/quizzes/seule-face-au-tapis';
import { EXTRA_REPORTS } from '@/lib/quiz/reports/extra';
import type { QuizDefinition } from '@/lib/quiz/types';

function attachReports(quiz: QuizDefinition): QuizDefinition {
  return {
    ...quiz,
    results: quiz.results.map((r) => {
      const report = r.report ?? EXTRA_REPORTS[quiz.slug]?.[r.id];
      if (!report) {
        throw new Error(`Quiz report manquant : ${quiz.slug}/${r.id}`);
      }
      return { ...r, report };
    }),
  };
}

export const QUIZ_CATALOG: QuizDefinition[] = [
  quizProfilDiscipline,
  quizEnergieJournee,
  quizSeuleFaceAuTapis,
  quizCarteStress,
  quizJeRatePuis,
]
  .map(attachReports)
  .sort((a, b) => a.order - b.order);

export function getQuizBySlug(slug: string): QuizDefinition | undefined {
  return QUIZ_CATALOG.find((q) => q.slug === slug);
}

export const QUIZ_SLUGS = QUIZ_CATALOG.map((q) => q.slug);
