export type SelfTestSlug = 'big-five' | 'attachement';

export type SelfTestLang = 'fr' | 'es';

export type BigFiveFormat = 'ipip-50' | 'ipip-120';

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
  /** IPIP-50 par défaut pour big-five */
  format?: BigFiveFormat;
  /** Facettes IPIP-120 (N1…C6) */
  facetKeys?: string[];
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

export type SelfTestPortrait = {
  name: string;
  tagline: string;
  disclaimer: string;
};

export type SelfTestFacetSection = {
  id: string;
  label: string;
  score: number;
  band: 'low' | 'mid' | 'high';
  narrative: string;
  force: string;
  limit: string;
};

export type SelfTestSections = {
  whoYouAre: string;
  howYouWork: string;
  forces: string[];
  limits: string[];
  combinations: string[];
  facets?: SelfTestFacetSection[];
};

export type SelfTestAnalysis = {
  mode: AnalysisMode;
  teaser: string;
  full: string;
  strengths: string[];
  generatedAt: string;
  portrait?: SelfTestPortrait;
  sections?: SelfTestSections;
  /** Badge discret court (ex. « Banque FitMangas ») */
  sourceBadge?: string;
  instrumentVersion?: string;
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
