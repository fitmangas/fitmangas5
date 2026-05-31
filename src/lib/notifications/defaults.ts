import type { NotificationPreferencesRow } from './types';

/** Mirrors DB defaults (migration 20260521120000_notification_defaults_on_by_default.sql). */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferencesRow, 'user_id'> = {
  courses_inapp_enabled: true,
  courses_email_enabled: true,
  courses_push_enabled: true,
  content_inapp_enabled: true,
  content_email_enabled: true,
  content_push_enabled: true,
  shop_inapp_enabled: true,
  shop_email_enabled: true,
  shop_push_enabled: true,
  community_inapp_enabled: true,
  community_email_enabled: true,
  community_push_enabled: true,
  silence_mode_enabled: false,
  digest_frequency: 'weekly',
};

/** Default profil marketing (colonne profiles.marketing_email_opt_in). */
export const DEFAULT_MARKETING_EMAIL_OPT_IN = true;

export function mergePrefs(row: Partial<NotificationPreferencesRow> | null): Omit<
  NotificationPreferencesRow,
  'user_id'
> {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...row,
    digest_frequency:
      row?.digest_frequency === 'daily' || row?.digest_frequency === 'weekly' || row?.digest_frequency === 'off'
        ? row.digest_frequency
        : DEFAULT_NOTIFICATION_PREFERENCES.digest_frequency,
  };
}
