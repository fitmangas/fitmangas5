export type SelfTestSlug = 'big-five' | 'attachement';

export type SelfTestLang = 'fr' | 'es';

/** Likert : IPIP-50 = 1–5 ; ECR-S officiel = 1–7 */
export type LikertValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SelfTestItem = {
  id: string;
  text: { fr: string; es: string };
  /** Texte officiel EN (référence de vérité) */
  en?: string;
  /** Trait / dimension key for scoring */
  key: string;
  /** true = −keyed officiel → invertLikert avant agrégation */
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
  /** 5 = IPIP ; 7 = ECR-S officiel */
  likertMax: 5 | 7;
  likertLabels: {
    fr: string[];
    es: string[];
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
