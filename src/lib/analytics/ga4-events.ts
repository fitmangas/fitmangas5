/** Noms d’événements GA4 FitMangas — conversions tunnel. */

export const GA4_EVENTS = {
  /** Clic CTA essai / On démarre (custom). */
  beginTrialClick: 'begin_trial_click',
  /** Redirection vers Stripe Checkout (recommandé GA4). */
  beginCheckout: 'begin_checkout',
  /** Essai Stripe démarré (custom) — €0 pendant trial. */
  trialStarted: 'trial_started',
  /** Achat payé immédiat (présentiel / abo sans trial) — recommandé GA4. */
  purchase: 'purchase',
  /** Première facture payée après trial / abo actif payant (custom). */
  subscriptionActive: 'subscription_active',
} as const;

export type Ga4EventName = (typeof GA4_EVENTS)[keyof typeof GA4_EVENTS];

export type Ga4EventParams = {
  transaction_id?: string;
  value?: number;
  currency?: string;
  course_id?: string;
  items?: Array<{ item_id: string; item_name?: string; price?: number; quantity?: number }>;
  /** debug / source */
  engagement_source?: string;
};
