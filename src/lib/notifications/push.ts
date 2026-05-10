import webpush from 'web-push';

import { createAdminClient } from '@/lib/supabase/admin';

const VAPID_SUBJECT = 'mailto:alejandra@fitmangas.com';

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body?: string | null;
  url?: string;
};

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) {
    throw new Error('Clés VAPID manquantes pour les notifications push.');
  }

  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
}

function toWebPushSubscription(row: PushSubscriptionRow) {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

function isGoneError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    (error as { statusCode?: unknown }).statusCode === 410
  );
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body?: string | null,
  url?: string,
): Promise<{ sent: number }> {
  configureVapid();

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const payload = JSON.stringify({
    title,
    body: body ?? '',
    url: url || '/',
  });

  let sent = 0;
  for (const sub of (subscriptions ?? []) as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(toWebPushSubscription(sub), payload);
      sent += 1;
    } catch (err) {
      if (isGoneError(err)) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        continue;
      }
      throw err;
    }
  }

  return { sent };
}
