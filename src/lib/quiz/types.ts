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
  /** Lettre profil FitMangas : D / E / A / M */
  letter?: 'D' | 'E' | 'A' | 'M';
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

  /** Égalité : la question la plus récente à un seul profil tranche (q13 en dernier). */
  function tieRank(id: string): number {
    for (let i = quiz.questions.length - 1; i >= 0; i--) {
      const q = quiz.questions[i]!;
      const opt = q.options.find((o) => o.id === answers[q.id]);
      if (!opt) continue;
      const scored = Object.entries(opt.scores)
        .filter(([, pts]) => pts > 0)
        .map(([pid]) => pid);
      if (scored.length === 1 && scored[0] === id) return i;
    }
    return -1;
  }

  // Pourcentages exacts puis arrondi « largest remainder » → somme = 100.
  // En cas de fraction égale, on favorise le profil qui gagne le tie-break (q13).
  const raw = Object.entries(totals).map(([id, pts]) => {
    const exact = (pts / sum) * 100;
    return { id, pts, exact, floor: Math.floor(exact), frac: exact - Math.floor(exact) };
  });
  let leftover = 100 - raw.reduce((a, r) => a + r.floor, 0);
  const byFrac = [...raw].sort((a, b) => {
    if (b.frac !== a.frac) return b.frac - a.frac;
    if (b.pts !== a.pts) return b.pts - a.pts;
    return tieRank(b.id) - tieRank(a.id);
  });
  const bump = new Set<string>();
  for (const row of byFrac) {
    if (leftover <= 0) break;
    bump.add(row.id);
    leftover -= 1;
  }

  const ranked = raw
    .map((r) => ({ id: r.id, pts: r.pts, percent: r.floor + (bump.has(r.id) ? 1 : 0) }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.percent !== a.percent) return b.percent - a.percent;
      return tieRank(b.id) - tieRank(a.id);
    });

  // Filet : n°1 et n°2 ne partagent jamais le même % affiché.
  if (ranked.length >= 2 && ranked[0]!.percent === ranked[1]!.percent && ranked[1]!.percent > 0) {
    ranked[0] = { ...ranked[0]!, percent: ranked[0]!.percent + 1 };
    ranked[1] = { ...ranked[1]!, percent: ranked[1]!.percent - 1 };
  }

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
