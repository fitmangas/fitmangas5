export type SourceResult<T> =
  | { ok: true; data: T; warnings?: string[] }
  | { ok: false; provider: string; error: string };

export type Ga4AcquisitionMetrics = {
  sessions: number | null;
  trialClicks: number | null;
  beginCheckout: number | null;
};

export type GscAcquisitionMetrics = {
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
};

export type StripeAcquisitionMetrics = {
  activeTrials: number | null;
  activePaid: number | null;
  trialToPaidRate: number | null;
  mrrEur: number | null;
  referralConversions30d: number | null;
};

export type SupabaseAcquisitionMetrics = {
  newProfiles30d: number | null;
  trialingCount: number | null;
  paidCount: number | null;
  retention90d: number | null;
};

export type MetaPixelMetrics = {
  pixelConfigured: boolean;
  pixelId: string | null;
  note: string;
};
