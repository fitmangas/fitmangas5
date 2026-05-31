import type { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

/** Confirme l’e-mail côté Auth si l’utilisateur vient de payer et n’est pas encore confirmé. */
export async function confirmUserEmailIfNeeded(admin: AdminClient, userId: string): Promise<void> {
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    console.error('[confirmUserEmailIfNeeded] getUserById', error);
    return;
  }
  if (data.user.email_confirmed_at) return;

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (updateError) {
    console.error('[confirmUserEmailIfNeeded] updateUserById', updateError);
  }
}
