import { categoryFromEventType } from '@/lib/notifications/category';
import { getEmailTemplate, renderTemplate } from '@/lib/notifications/templates';
import type { NotificationCategory } from '@/lib/notifications/types';

export type NotifObservabilityPeriod = 'month' | 'all';

export type NotifTypeKey =
  | 'in_app'
  | 'email_courses'
  | 'email_content'
  | 'email_shop'
  | 'email_community'
  | 'email_newsletter'
  | 'email_transactional';

export type NotifTypeStat = {
  key: NotifTypeKey;
  label: string;
  count: number | null;
  lastSentAt: string | null;
  tracked: boolean;
  missingReason?: string;
  sampleEventType?: string | null;
  samplePayload?: Record<string, unknown> | null;
  sampleTitle?: string | null;
  sampleBody?: string | null;
};

export type NotifObservabilitySummary = {
  period: NotifObservabilityPeriod;
  periodLabel: string;
  totalTracked: number;
  types: NotifTypeStat[];
  gaps: string[];
};

export const NOTIF_TYPE_LABELS: Record<NotifTypeKey, string> = {
  in_app: 'Notification in-app',
  email_courses: 'Email cours',
  email_content: 'Email contenu (blog / replays)',
  email_shop: 'Email boutique',
  email_community: 'Email communauté',
  email_newsletter: 'Newsletter / offres',
  email_transactional: 'Emails transactionnels (paiement / sécurité)',
};

export function emailBucket(category: NotificationCategory, eventType: string): NotifTypeKey {
  if (eventType.startsWith('newsletter.')) return 'email_newsletter';
  if (category === 'courses') return 'email_courses';
  if (category === 'content') return 'email_content';
  if (category === 'shop') return 'email_shop';
  if (category === 'community') return 'email_community';
  if (
    eventType.startsWith('subscription.') ||
    eventType.startsWith('payment.') ||
    eventType.startsWith('billing.') ||
    eventType.startsWith('auth.') ||
    eventType.startsWith('account.')
  ) {
    return 'email_transactional';
  }
  return 'email_transactional';
}

export { categoryFromEventType };

const SAMPLE_PAYLOAD: Record<string, string> = {
  firstName: 'Camille',
  courseTitle: 'Pilates doux — mardi 18h',
  courseUrl: 'https://fitmangas.com/compte/planning',
  replayUrl: 'https://fitmangas.com/compte/replays',
  articleTitle: 'Ton bassin après une journée assise',
  articleUrl: 'https://fitmangas.com/blog/exemple',
  orderId: 'CMD-DEMO',
  billingPortalUrl: 'https://fitmangas.com/compte/profil',
  resourcesUrl: 'https://fitmangas.com/compte/blog',
};

export function previewNotificationForType(stat: NotifTypeStat): {
  kind: 'email' | 'in_app' | 'missing';
  subject?: string;
  html?: string;
  title?: string;
  body?: string;
  note?: string;
} {
  if (!stat.tracked) {
    return {
      kind: 'missing',
      note: stat.missingReason || 'Type non suivi dans les logs actuels.',
    };
  }

  if (stat.key === 'in_app') {
    return {
      kind: 'in_app',
      title: stat.sampleTitle || 'Notification FitMangas',
      body: stat.sampleBody || 'Aperçu : aucune notification récente à afficher pour cette période.',
      note: stat.count === 0 ? 'Aucun envoi in-app sur la période.' : undefined,
    };
  }

  const eventType = stat.sampleEventType;
  if (!eventType) {
    return {
      kind: 'missing',
      note: 'Aucun email de ce type sur la période — pas d’aperçu réel disponible.',
    };
  }

  const template = getEmailTemplate(eventType);
  if (!template) {
    return {
      kind: 'missing',
      note: `Template introuvable pour l’event « ${eventType} ». Payload logué uniquement.`,
    };
  }

  const data = { ...SAMPLE_PAYLOAD, ...(stat.samplePayload || {}) };
  const rendered = renderTemplate(template, 'fr', data as Record<string, unknown>);
  return {
    kind: 'email',
    subject: rendered.subject,
    html: rendered.html,
  };
}
