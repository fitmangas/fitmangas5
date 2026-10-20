'use server';

import { headers } from 'next/headers';

import { passwordUpdateErrorCode, validateNewPassword, type PasswordFormError } from '@/lib/auth/password-shared';
import { clientIpFromHeaders } from '@/lib/security/public-form-guard';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createClient } from '@/lib/supabase/server';

export type ChangePasswordResult = { ok: true } | { ok: false; error: PasswordFormError };

/** Changement depuis l'espace cliente : le mot de passe actuel est vérifié avant tout changement. */
export async function changePasswordAction(input: {
  current: string;
  password: string;
  confirm: string;
}): Promise<ChangePasswordResult> {
  const invalid = validateNewPassword(input?.password, input?.confirm);
  if (invalid) return { ok: false, error: invalid };
  if (typeof input?.current !== 'string' || input.current.length === 0) return { ok: false, error: 'current_invalid' };

  const limit = await checkRateLimit('password_change', clientIpFromHeaders(await headers()));
  if (!limit.ok) return { ok: false, error: 'rate_limited' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: 'no_session' };

  const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: input.current });
  if (signInError) return { ok: false, error: 'current_invalid' };

  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) return { ok: false, error: passwordUpdateErrorCode(error) };
  return { ok: true };
}
