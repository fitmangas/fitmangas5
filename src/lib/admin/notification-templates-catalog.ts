import { wrapResendEmail } from '@/lib/email/base-template';
import { getEmailTemplate, renderTemplate, TEMPLATE_REGISTRY } from '@/lib/notifications/templates';
import { categoryFromEventType } from '@/lib/notifications/category';
import type { NotifTypeKey } from '@/lib/admin/notification-observability-shared';

export type TemplatePreviewKind = 'email' | 'in_app' | 'newsletter';

export type NotifTemplateCatalogItem = {
  id: string;
  label: string;
  group: NotifTypeKey;
  kind: TemplatePreviewKind;
  /** event_type registry ou id newsletter */
  eventType?: string;
  description?: string;
  trackedInLog: boolean;
  missingReason?: string;
};

const SAMPLE: Record<string, string> = {
  firstName: 'Camille',
  courseTitle: 'Pilates doux — mardi 18h',
  courseUrl: 'https://fitmangas.com/compte/planning',
  replayUrl: 'https://fitmangas.com/compte/replays',
  articleTitle: 'Ton bassin après une journée assise',
  articleUrl: 'https://fitmangas.com/blog/exemple',
  orderId: 'CMD-DEMO',
  billingPortalUrl: 'https://fitmangas.com/compte/profil',
  resourcesUrl: 'https://fitmangas.com/compte/blog',
  confirmUrl: 'https://fitmangas.com/api/client/newsletter/confirm?token=demo',
};

const EMAIL_LABELS: Record<string, string> = {
  'onboarding.day0': 'Email de bienvenue (jour 0)',
  'onboarding.day1': 'Email onboarding jour 1',
  'onboarding.day3': 'Email onboarding jour 3',
  'onboarding.day7': 'Email onboarding jour 7',
  'subscription.activated': 'Email abonnement activé',
  'subscription.payment_failed': 'Email paiement échoué',
  'subscription.cancelled': 'Email abonnement annulé',
  'subscription.renewed': 'Email abonnement renouvelé',
  'subscription.win_back_J+30': 'Email win-back J+30',
  'subscription.checkout_abandoned': 'Email panier abandonné',
  'course.visio.reminder_J-1': 'Email rappel visio J-1',
  'course.visio.reminder_H-1': 'Email rappel visio H-1',
  'course.visio.cancelled': 'Email cours visio annulé',
  'course.visio.replay_ready': 'Email replay prêt',
  'course.visio.missed': 'Email cours visio manqué',
  'course.presential.purchased': 'Email présentiel acheté',
  'course.presential.reminder_J-1': 'Email rappel présentiel J-1',
  'course.presential.reminder_H-2': 'Email rappel présentiel H-2',
  'course.presential.cancelled_by_coach': 'Email présentiel annulé',
  'course.presential.missed': 'Email présentiel manqué',
  'course.presential.purchase_pending': 'Email présentiel en attente',
  'blog.article_published': 'Email nouvel article blog',
  'boutique.order_paid': 'Email commande payée',
  'boutique.order_shipped': 'Email commande expédiée',
  'community.birthday': 'Email anniversaire',
  'community.we_miss_you_30d': 'Email « on te manque » 30j',
  'community.we_miss_you_60d': 'Email « on te manque » 60j',
  'digest.summary': 'Email digest',
  'account.support_ticket_received': 'Email ticket support reçu',
  'referral.reward_unlocked': 'Email parrainage débloqué',
};

function groupForEvent(eventType: string): NotifTypeKey {
  const cat = categoryFromEventType(eventType);
  if (cat === 'courses') return 'email_courses';
  if (cat === 'content') return 'email_content';
  if (cat === 'shop') return 'email_shop';
  if (cat === 'community') return 'email_community';
  return 'email_transactional';
}

const IN_APP_SAMPLES: NotifTemplateCatalogItem[] = [
  {
    id: 'inapp.live_course',
    label: 'Notif in-app — live / cours',
    group: 'in_app',
    kind: 'in_app',
    description: 'Cloche cliente (kind live_course / planning_live)',
    trackedInLog: true,
  },
  {
    id: 'inapp.replay_ready',
    label: 'Notif in-app — nouveau replay',
    group: 'in_app',
    kind: 'in_app',
    description: 'Cloche cliente quand un replay est prêt',
    trackedInLog: true,
  },
  {
    id: 'inapp.blog',
    label: 'Notif in-app — nouvel article',
    group: 'in_app',
    kind: 'in_app',
    description: 'Cloche cliente blog',
    trackedInLog: true,
  },
  {
    id: 'inapp.generic',
    label: 'Notif in-app — générique',
    group: 'in_app',
    kind: 'in_app',
    description: 'Titre + corps tels qu’affichés dans /compte/notifications',
    trackedInLog: true,
  },
];

const NEWSLETTER_ITEMS: NotifTemplateCatalogItem[] = [
  {
    id: 'newsletter.confirm',
    label: 'Newsletter — confirmation d’inscription',
    group: 'email_newsletter',
    kind: 'newsletter',
    description: 'Resend direct, logué dans notification_log (newsletter.confirm)',
    trackedInLog: true,
  },
  {
    id: 'newsletter.article',
    label: 'Newsletter — nouvel article publié',
    group: 'email_newsletter',
    kind: 'newsletter',
    description: 'Resend direct, logué dans notification_log (newsletter.article_published)',
    trackedInLog: true,
  },
];

/** Catalogue complet des templates prévisualisables. */
export function listNotificationTemplateCatalog(): NotifTemplateCatalogItem[] {
  const emails: NotifTemplateCatalogItem[] = Object.keys(TEMPLATE_REGISTRY).map((eventType) => ({
    id: `email.${eventType}`,
    label: EMAIL_LABELS[eventType] || `Email · ${eventType}`,
    group: groupForEvent(eventType),
    kind: 'email' as const,
    eventType,
    trackedInLog: true,
  }));

  // Dédupliquer subscription.activated (= même rendu que onboarding.day0) en gardant les deux entrées
  // car ce sont deux event_type distincts en prod.
  return [...emails, ...IN_APP_SAMPLES, ...NEWSLETTER_ITEMS];
}

export type TemplatePreviewResult = {
  kind: TemplatePreviewKind | 'missing';
  subject?: string;
  html?: string;
  title?: string;
  body?: string;
  note?: string;
};

export function renderCatalogTemplatePreview(item: NotifTemplateCatalogItem): TemplatePreviewResult {
  if (item.kind === 'in_app') {
    const samples: Record<string, { title: string; body: string }> = {
      'inapp.live_course': {
        title: 'Ton cours commence bientôt',
        body: 'Pilates doux — mardi 18h. Rejoins le live depuis ton planning.',
      },
      'inapp.replay_ready': {
        title: 'Ton replay est prêt',
        body: 'La séance d’hier est disponible dans Mes replays.',
      },
      'inapp.blog': {
        title: 'Nouvel article sur le blog',
        body: 'Ton bassin après une journée assise — à lire dans ton espace.',
      },
      'inapp.generic': {
        title: 'FitMangas',
        body: 'Aperçu d’une notification in-app telle qu’affichée dans la cloche.',
      },
    };
    const s = samples[item.id] || samples['inapp.generic']!;
    return { kind: 'in_app', title: s.title, body: s.body };
  }

  if (item.kind === 'newsletter') {
    if (item.id === 'newsletter.confirm') {
      const inner = `<p style="margin:0 0 14px;color:#2D2D2D;">Confirme ton inscription en cliquant sur le bouton ci-dessous.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto 0;">
        <tr><td align="center" style="border-radius:8px;background-color:#C45D3E;">
          <a href="${SAMPLE.confirmUrl}" style="display:inline-block;padding:14px 32px;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">Confirmer mon inscription</a>
        </td></tr></table>`;
      return {
        kind: 'newsletter',
        subject: 'Confirme ton inscription newsletter FitMangas',
        html: wrapResendEmail({ innerHtml: inner, locale: 'fr', showPreferencesLink: false }),
        note: item.missingReason,
      };
    }
    const inner = `<p style="margin:0 0 14px;color:#2D2D2D;">Un nouvel article vient d'être publié :</p>
      <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#C45D3E;">${SAMPLE.articleTitle}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr><td align="center" style="border-radius:8px;background-color:#C45D3E;">
          <a href="${SAMPLE.articleUrl}" style="display:inline-block;padding:14px 32px;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">Lire l'article</a>
        </td></tr></table>`;
    return {
      kind: 'newsletter',
      subject: `Nouveau sur le blog : ${SAMPLE.articleTitle}`,
      html: wrapResendEmail({ innerHtml: inner, locale: 'fr', showPreferencesLink: true }),
      note: item.missingReason,
    };
  }

  if (!item.eventType) {
    return { kind: 'missing', note: 'Template sans event_type.' };
  }
  const template = getEmailTemplate(item.eventType);
  if (!template) {
    return { kind: 'missing', note: `Template introuvable pour « ${item.eventType} ».` };
  }
  const rendered = renderTemplate(template, 'fr', SAMPLE);
  // Enveloppe réelle Resend (logo + photo) comme la cliente
  const html = wrapResendEmail({
    innerHtml: rendered.html,
    locale: 'fr',
    showPreferencesLink: !template.critical,
  });
  return { kind: 'email', subject: rendered.subject, html };
}
