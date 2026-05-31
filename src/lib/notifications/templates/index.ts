import * as onboardingDay0 from './onboarding-day0';
import * as onboardingDay1 from './onboarding-day1';
import * as onboardingDay3 from './onboarding-day3';
import * as onboardingDay7 from './onboarding-day7';
import * as subscriptionCancelled from './subscription-cancelled';
import * as subscriptionPaymentFailed from './subscription-payment-failed';
import * as subscriptionRenewed from './subscription-renewed';
import * as subscriptionWinBack from './subscription-win-back';
import * as coursePresentialCancelled from './course-presential-cancelled';
import * as coursePresentialMissed from './course-presential-missed';
import * as coursePresentialPurchased from './course-presential-purchased';
import * as coursePresentialReminderH2 from './course-presential-reminder-h2';
import * as coursePresentialReminderJ1 from './course-presential-reminder-j1';
import * as courseVisioCancelled from './course-visio-cancelled';
import * as courseVisioMissed from './course-visio-missed';
import * as courseVisioReminderH1 from './course-visio-reminder-h1';
import * as courseVisioReminderJ1 from './course-visio-reminder-j1';
import * as courseVisioReplayReady from './course-visio-replay-ready';
import * as blogArticlePublished from './blog-article-published';
import * as boutiqueOrderPaid from './boutique-order-paid';
import * as boutiqueOrderShipped from './boutique-order-shipped';
import * as birthday from './birthday';
import * as digest from './digest';
import * as weMissYou30d from './we-miss-you-30d';
import * as weMissYou60d from './we-miss-you-60d';
import * as supportTicketConfirmation from './support-ticket-confirmation';
import * as referralRewardUnlocked from './referral-reward-unlocked';
import * as checkoutAbandoned from './checkout-abandoned';
import * as presentialPurchasePending from './presential-purchase-pending';
import type { NotificationEmailTemplate, TemplateLocale } from './types';

export const TEMPLATE_REGISTRY = {
  'onboarding.day0': onboardingDay0,
  'onboarding.day1': onboardingDay1,
  'onboarding.day3': onboardingDay3,
  'onboarding.day7': onboardingDay7,
  'subscription.activated': onboardingDay0,
  'subscription.payment_failed': subscriptionPaymentFailed,
  'subscription.cancelled': subscriptionCancelled,
  'subscription.renewed': subscriptionRenewed,
  'subscription.win_back_J+30': subscriptionWinBack,
  'course.visio.reminder_J-1': courseVisioReminderJ1,
  'course.visio.reminder_H-1': courseVisioReminderH1,
  'course.visio.cancelled': courseVisioCancelled,
  'course.visio.replay_ready': courseVisioReplayReady,
  'course.visio.missed': courseVisioMissed,
  'course.presential.purchased': coursePresentialPurchased,
  'course.presential.reminder_J-1': coursePresentialReminderJ1,
  'course.presential.reminder_H-2': coursePresentialReminderH2,
  'course.presential.cancelled_by_coach': coursePresentialCancelled,
  'course.presential.missed': coursePresentialMissed,
  'blog.article_published': blogArticlePublished,
  'boutique.order_paid': boutiqueOrderPaid,
  'boutique.order_shipped': boutiqueOrderShipped,
  'community.birthday': birthday,
  'community.we_miss_you_30d': weMissYou30d,
  'community.we_miss_you_60d': weMissYou60d,
  'digest.summary': digest,
  'account.support_ticket_received': supportTicketConfirmation,
  'referral.reward_unlocked': referralRewardUnlocked,
  'subscription.checkout_abandoned': checkoutAbandoned,
  'course.presential.purchase_pending': presentialPurchasePending,
} satisfies Record<string, NotificationEmailTemplate>;

export function getEmailTemplate(eventType: string): NotificationEmailTemplate | null {
  return TEMPLATE_REGISTRY[eventType as keyof typeof TEMPLATE_REGISTRY] ?? null;
}

export function renderTemplate(template: NotificationEmailTemplate, locale: TemplateLocale, data: Record<string, unknown>) {
  const normalizedData = data as Record<string, string | number | boolean | null | undefined>;
  return locale === 'es'
    ? { subject: template.subject_es, html: template.html_es(normalizedData) }
    : { subject: template.subject_fr, html: template.html_fr(normalizedData) };
}
