import { quizCarteStress } from '@/lib/quiz/quizzes/carte-stress';
import { quizEnergieJournee } from '@/lib/quiz/quizzes/energie-journee';
import { quizJeRatePuis } from '@/lib/quiz/quizzes/je-rate-puis';
import { quizProfilDiscipline } from '@/lib/quiz/quizzes/profil-discipline';
import { quizSeuleFaceAuTapis } from '@/lib/quiz/quizzes/seule-face-au-tapis';
import type { QuizDefinition } from '@/lib/quiz/types';

export const QUIZ_CATALOG: QuizDefinition[] = [
  quizProfilDiscipline,
  quizEnergieJournee,
  quizSeuleFaceAuTapis,
  quizCarteStress,
  quizJeRatePuis,
].sort((a, b) => a.order - b.order);

export function getQuizBySlug(slug: string): QuizDefinition | undefined {
  return QUIZ_CATALOG.find((q) => q.slug === slug);
}

export const QUIZ_SLUGS = QUIZ_CATALOG.map((q) => q.slug);
