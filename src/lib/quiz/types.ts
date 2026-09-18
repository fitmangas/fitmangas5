export type QuizLocale = 'fr' | 'es';

export type QuizOption = {
  id: string;
  label: Record<QuizLocale, string>;
  /** Scores par profil (clés = result ids) */
  scores: Record<string, number>;
};

export type QuizQuestion = {
  id: string;
  prompt: Record<QuizLocale, string>;
  options: QuizOption[];
};

export type QuizResult = {
  id: string;
  title: Record<QuizLocale, string>;
  tagline: Record<QuizLocale, string>;
  body: Record<QuizLocale, string[]>;
  bridge: Record<QuizLocale, string>;
  shareLine: Record<QuizLocale, string>;
};

export type QuizDefinition = {
  slug: string;
  /** Ordre sur le hub */
  order: number;
  accent: string;
  eyebrow: Record<QuizLocale, string>;
  title: Record<QuizLocale, string>;
  description: Record<QuizLocale, string>;
  durationHint: Record<QuizLocale, string>;
  questions: QuizQuestion[];
  results: QuizResult[];
  cta: Record<QuizLocale, string>;
};

export function scoreQuiz(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): { resultId: string; totals: Record<string, number> } {
  const totals: Record<string, number> = {};
  for (const r of quiz.results) totals[r.id] = 0;

  for (const q of quiz.questions) {
    const optId = answers[q.id];
    const opt = q.options.find((o) => o.id === optId);
    if (!opt) continue;
    for (const [profile, pts] of Object.entries(opt.scores)) {
      totals[profile] = (totals[profile] ?? 0) + pts;
    }
  }

  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  return { resultId: ranked[0]?.[0] ?? quiz.results[0]!.id, totals };
}
