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

/** Rapport type DISC : elle apprend quelque chose sur elle — pas un sticker. */
export type QuizReportSections = {
  /** Paragraphes de portrait (le cœur du compte-rendu) */
  portrait: Record<QuizLocale, string[]>;
  howYouWork: Record<QuizLocale, string[]>;
  strengths: Record<QuizLocale, string[]>;
  limits: Record<QuizLocale, string[]>;
  underStress: Record<QuizLocale, string[]>;
  fears: Record<QuizLocale, string[]>;
  needs: Record<QuizLocale, string[]>;
  howToTalk: Record<QuizLocale, string[]>;
  howNotToTalk: Record<QuizLocale, string[]>;
  develop: Record<QuizLocale, string[]>;
};

export type QuizResult = {
  id: string;
  /** Lettre DISC si applicable : D / I / S / C */
  letter?: 'D' | 'I' | 'S' | 'C';
  /** Nom de style (ex. « La Décideuse ») */
  styleName?: Record<QuizLocale, string>;
  title: Record<QuizLocale, string>;
  tagline: Record<QuizLocale, string>;
  /** Synopsis 2–3 lignes (hub, partage) */
  body: Record<QuizLocale, string[]>;
  /** Rapport long. Obligatoire après merge catalogue. */
  report?: QuizReportSections;
  /** Pont produit, court, en fin de rapport — pas le rapport lui-même */
  bridge: Record<QuizLocale, string>;
  shareLine: Record<QuizLocale, string>;
};

export type QuizDefinition = {
  slug: string;
  order: number;
  accent: string;
  /** Graphique 4 couleurs type DISC */
  discLike?: boolean;
  eyebrow: Record<QuizLocale, string>;
  title: Record<QuizLocale, string>;
  description: Record<QuizLocale, string>;
  durationHint: Record<QuizLocale, string>;
  /** Consignes avant de commencer (comportement ≠ personnalité) */
  briefing?: Record<QuizLocale, string[]>;
  questions: QuizQuestion[];
  results: QuizResult[];
  cta: Record<QuizLocale, string>;
};

export type QuizScore = {
  resultId: string;
  secondaryId: string | null;
  totals: Record<string, number>;
  percents: Record<string, number>;
  ranked: { id: string; pts: number; percent: number }[];
};

export function scoreQuiz(quiz: QuizDefinition, answers: Record<string, string>): QuizScore {
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

  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const ranked = Object.entries(totals)
    .map(([id, pts]) => ({ id, pts, percent: Math.round((pts / sum) * 100) }))
    .sort((a, b) => b.pts - a.pts);

  const percents: Record<string, number> = {};
  for (const row of ranked) percents[row.id] = row.percent;

  return {
    resultId: ranked[0]?.id ?? quiz.results[0]!.id,
    secondaryId: ranked[1] && ranked[1].pts > 0 ? ranked[1].id : null,
    totals,
    percents,
    ranked,
  };
}

export function t(fr: string, es: string): Record<QuizLocale, string> {
  return { fr, es };
}

export function lines(fr: string[], es: string[]): Record<QuizLocale, string[]> {
  return { fr, es };
}
