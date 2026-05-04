import type { NotificationPreferencesRow } from './types';

/** Mirrors DB defaults from migration 20260430143000_phase1_comms_foundation.sql */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferencesRow, 'user_id'> = {
  courses_inapp_enabled: true,
  courses_email_enabled: true,
  courses_push_enabled: false,
  content_inapp_enabled: true,
  content_email_enabled: false,
  content_push_enabled: false,
  shop_inapp_enabled: true,
  shop_email_enabled: true,
  shop_push_enabled: false,
  community_inapp_enabled: true,
  community_email_enabled: true,
  community_push_enabled: false,
  silence_mode_enabled: false,
  digest_frequency: 'off',
};

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
