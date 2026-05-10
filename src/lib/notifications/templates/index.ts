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
import * as coursePresentialReminderJ1 from './course-presential-reminder-j1';
import * as courseVisioCancelled from './course-visio-cancelled';
import * as courseVisioMissed from './course-visio-missed';
import * as courseVisioReminderJ1 from './course-visio-reminder-j1';
import * as courseVisioReplayReady from './course-visio-replay-ready';
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
  'course.visio.cancelled': courseVisioCancelled,
  'course.visio.replay_ready': courseVisioReplayReady,
  'course.visio.missed': courseVisioMissed,
  'course.presential.purchased': coursePresentialPurchased,
  'course.presential.reminder_J-1': coursePresentialReminderJ1,
  'course.presential.cancelled_by_coach': coursePresentialCancelled,
  'course.presential.missed': coursePresentialMissed,
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
