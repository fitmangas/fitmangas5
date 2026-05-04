import type { NotificationCategory, NotificationPreferencesRow } from './types';

type Prefs = Omit<NotificationPreferencesRow, 'user_id'>;

export function isInAppEnabledForCategory(prefs: Prefs, category: NotificationCategory): boolean {
  switch (category) {
    case 'account':
      return true;
    case 'courses':
      return prefs.courses_inapp_enabled;
    case 'content':
      return prefs.content_inapp_enabled;
    case 'shop':
      return prefs.shop_inapp_enabled;
    case 'community':
      return prefs.community_inapp_enabled;
    default:
      return true;
  }
}

export function isEmailEnabledForCategory(prefs: Prefs, category: NotificationCategory): boolean {
  switch (category) {
    case 'account':
      return true;
    case 'courses':
      return prefs.courses_email_enabled;
    case 'content':
      return prefs.content_email_enabled;
    case 'shop':
      return prefs.shop_email_enabled;
    case 'community':
      return prefs.community_email_enabled;
    default:
      return true;
  }
}
