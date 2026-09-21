import type { QuizOption, QuizQuestion } from '@/lib/quiz/types';

export function opt(
  id: string,
  fr: string,
  es: string,
  scores: Record<string, number>,
): QuizOption {
  return { id, label: { fr, es }, scores };
}

export function q(id: string, fr: string, es: string, options: QuizOption[]): QuizQuestion {
  return { id, prompt: { fr, es }, options };
}
