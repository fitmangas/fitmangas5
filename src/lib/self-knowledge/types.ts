export type SelfTestSlug = 'big-five' | 'attachement';

export type SelfTestLang = 'fr' | 'es';

export type LikertValue = 1 | 2 | 3 | 4 | 5;

export type SelfTestItem = {
  id: string;
  text: { fr: string; es: string };
  /** Trait / dimension key for scoring */
  key: string;
  reverse?: boolean;
};

export type SelfTestDefinition = {
  slug: SelfTestSlug;
  version: string;
  source: string;
  sourceUrl: string;
  title: { fr: string; es: string };
  description: { fr: string; es: string };
  /** Minutes estimate */
  durationMin: number;
  items: SelfTestItem[];
  scoreKeys: string[];
  likertLabels: {
    fr: [string, string, string, string, string];
    es: [string, string, string, string, string];
  };
};

export type SelfTestAnswers = Record<string, LikertValue>;

export type SelfTestScores = Record<string, number>;

export type AnalysisMode = 'claude' | 'template';

export type SelfTestAnalysis = {
  mode: AnalysisMode;
  teaser: string;
  full: string;
  strengths: string[];
  generatedAt: string;
};

export type HealthMetricInput = {
  sessionsPerWeek: number | null;
  sleepHours: number | null;
  restingHr: number | null;
  hrvMs: number | null;
  activeMinutes: number | null;
};

export type HealthScores = {
  regularite: number;
  recuperation: number;
  energie: number;
};
