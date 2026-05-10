export type DispatchChannelHint = 'in_app' | 'email' | 'push' | 'digest';

export type DispatchInput = {
  event_type: string;
  user_id: string | null;
  payload: Record<string, unknown>;
  channel_hints?: DispatchChannelHint[];
  idempotency_key?: string;
};

export type DispatchResult =
  | { ok: true; skipped: 'duplicate'; duplicate_of_log_id?: string }
  | { ok: true; skipped: 'silence_mode'; notification_log_ids: string[] }
  | {
      ok: true;
      anonymous?: boolean;
      notification_log_ids: string[];
      delivered?: {
        email?: boolean;
        in_app?: boolean;
        push?: boolean;
        digest?: boolean;
      };
    };

export type NotificationCategory = 'account' | 'courses' | 'content' | 'shop' | 'community';

export type NotificationPreferencesRow = {
  user_id: string;
  courses_inapp_enabled: boolean;
  courses_email_enabled: boolean;
  courses_push_enabled: boolean;
  content_inapp_enabled: boolean;
  content_email_enabled: boolean;
  content_push_enabled: boolean;
  shop_inapp_enabled: boolean;
  shop_email_enabled: boolean;
  shop_push_enabled: boolean;
  community_inapp_enabled: boolean;
  community_email_enabled: boolean;
  community_push_enabled: boolean;
  silence_mode_enabled: boolean;
  digest_frequency: 'off' | 'daily' | 'weekly';
};

export type DispatcherDeps = {
  /** Lot 8 replaces with Resend. */
  sendEmailPlaceholder?: (args: {
    toProfileId: string;
    event_type: string;
    payload: Record<string, unknown>;
    locale: string;
  }) => Promise<void>;
  sendPushNotification?: (args: {
    userId: string;
    title: string;
    body?: string | null;
    url?: string;
  }) => Promise<{ sent: number }>;
};
