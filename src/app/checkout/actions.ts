'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { dispatch } from '@/lib/notifications/dispatcher';

export async function logVisioLockCheckoutInitiated(source = 'visio_lock_overlay') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { logged: false as const };

  await dispatch(createAdminClient(), {
    event_type: 'subscription.checkout_initiated',
    user_id: user.id,
    payload: {
      title: 'Checkout initié',
      body: 'Accès v-coll depuis overlay premium.',
      source,
      target_offer: 'v-coll',
    },
    idempotency_key: `subscription.checkout_initiated:${user.id}:${source}:${Date.now()}`,
  });
  return { logged: true as const };
}
