import type { LifecycleStage } from '@/lib/acquisition/types';

/** Incréments score lead (plafonné 0–100 côté repository). */
export const LEAD_SCORE_DELTA = {
  inbound_message: 5,
  qualified: 15,
  trial_link_sent: 10,
  email_captured: 20,
  booking_intent: 25,
  objection_handled: 8,
  comment_engagement: 10,
  trial_stage: 35,
  paid_stage: 50,
  member_stage: 60,
} as const;

export function scoreForLifecycle(stage: LifecycleStage): number {
  switch (stage) {
    case 'qualified':
      return LEAD_SCORE_DELTA.qualified;
    case 'trial':
      return LEAD_SCORE_DELTA.trial_stage;
    case 'paid':
      return LEAD_SCORE_DELTA.paid_stage;
    case 'member':
      return LEAD_SCORE_DELTA.member_stage;
    default:
      return 0;
  }
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/** Extrait le premier e-mail valide d’un message DM. */
export function extractEmailFromText(text: string | undefined | null): string | null {
  if (!text) return null;
  const m = text.match(EMAIL_RE);
  if (!m?.[0]) return null;
  const email = m[0].trim().toLowerCase();
  if (email.length > 120) return null;
  return email;
}

export function clampLeadScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Seuil KPI « leads chauds » (vue d’ensemble + liste Conversations). */
export const HOT_LEAD_SCORE_MIN = 40;

const INTERNAL_HANDLES = new Set([
  '@kevpicard_',
  '@alexispicard_',
  '@fit.mangas',
  '@fitmangas',
  'fit.mangas',
]);

/** Démo / @meta_ / comptes équipe — pas à relancer manuellement. */
export function isHotLeadNoiseHandle(handle: string | null | undefined): boolean {
  const h = (handle ?? '').trim().toLowerCase();
  if (!h) return false;
  if (
    h.includes('demo') ||
    h.includes('sandbox') ||
    h.startsWith('@meta_') ||
    h === 'test' ||
    h.startsWith('test ') ||
    /@meta_t\d|@meta_final|@meta_test|test_sig/.test(h)
  ) {
    return true;
  }
  return INTERNAL_HANDLES.has(h) || INTERNAL_HANDLES.has(h.startsWith('@') ? h : `@${h}`);
}
