/**
 * Liste les anniversaires du jour + prépare les e-mails.
 * Optionnel : appelle queue_birthday_notification_for_user pour la cloche in-app (1× / jour).
 *
 * SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
 */
import { createClient } from '@supabase/supabase-js';

import { buildBirthdayEmail } from '../../src/lib/email/birthday';

function mustGetEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

async function main() {
  const url = mustGetEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY');
  const queueNotif = process.env.BIRTHDAY_QUEUE_INAPP === '1';

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: users, error } = await supabase.rpc('report_birthday_today_users');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const list = (users ?? []) as Array<{ user_id: string; email: string; first_name: string }>;
  console.log(JSON.stringify({ count: list.length, users: list }, null, 2));

  for (const u of list) {
    const mail = buildBirthdayEmail({ firstName: u.first_name || null });
    console.log('\n→', u.email, mail.subject);

    if (queueNotif) {
      const { error: qErr } = await supabase.rpc('queue_birthday_notification_for_user', { p_user_id: u.user_id });
      if (qErr) console.warn('queue notif', u.user_id, qErr.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
