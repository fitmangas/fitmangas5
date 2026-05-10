export type NotificationRuntimeSettings = {
  emailDailyCap: number;
  inAppUnreadDailyCap: number;
  quietHoursStart: number;
  quietHoursEnd: number;
};

export const DEFAULT_NOTIFICATION_RUNTIME_SETTINGS: NotificationRuntimeSettings = {
  emailDailyCap: 2,
  inAppUnreadDailyCap: 5,
  quietHoursStart: 21,
  quietHoursEnd: 8,
};

function parsePositiveInt(value: string | undefined, fallback: number) {
  const n = value ? Number.parseInt(value, 10) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseHour(value: string | undefined, fallback: number) {
  const n = value ? Number.parseInt(value, 10) : fallback;
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : fallback;
}

export function getNotificationRuntimeSettings(): NotificationRuntimeSettings {
  return {
    emailDailyCap: parsePositiveInt(
      process.env.NOTIFICATION_EMAIL_DAILY_CAP,
      DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.emailDailyCap,
    ),
    inAppUnreadDailyCap: parsePositiveInt(
      process.env.NOTIFICATION_INAPP_UNREAD_DAILY_CAP,
      DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.inAppUnreadDailyCap,
    ),
    quietHoursStart: parseHour(
      process.env.NOTIFICATION_QUIET_HOURS_START,
      DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.quietHoursStart,
    ),
    quietHoursEnd: parseHour(
      process.env.NOTIFICATION_QUIET_HOURS_END,
      DEFAULT_NOTIFICATION_RUNTIME_SETTINGS.quietHoursEnd,
    ),
  };
}
