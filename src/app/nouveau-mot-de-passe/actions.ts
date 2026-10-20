'use server';

import { cookies } from 'next/headers';

import { resolvePostLoginPath } from '@/lib/auth/post-login-redirect';
import {
  RESET_TOKEN_COOKIE,
  RESET_VERIFIED_COOKIE,
  RESET_VERIFIED_MAX_AGE_S,
} from '@/lib/auth/password-reset';
import { passwordUpdateErrorCode, validateNewPassword, type PasswordFormError } from '@/lib/auth/password-shared';
import { createClient } from '@/lib/supabase/server';

export type NewPasswordResult = { ok: true; redirectTo: string } | { ok: false; error: PasswordFormError };

/**
 * Valide le jeton du lien (une seule fois), puis enregistre le nouveau mot de passe.
 * Sans jeton ni récupération validée juste avant dans ce navigateur : refus (on n'accepte pas
 * de changer un mot de passe sans preuve, même avec une session ouverte).
 */
export async function submitNewPasswordAction(input: { password: string; confirm: string }): Promise<NewPasswordResult> {
  const invalid = validateNewPassword(input?.password, input?.confirm);
  if (invalid) return { ok: false, error: invalid };

  const cookieStore = await cookies();
  const tokenHash = cookieStore.get(RESET_TOKEN_COOKIE)?.value ?? null;
  const alreadyVerified = cookieStore.get(RESET_VERIFIED_COOKIE)?.value === '1';
  const supabase = await createClient();

  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
    cookieStore.delete(RESET_TOKEN_COOKIE);
    if (error) return { ok: false, error: 'link_invalid' };
    cookieStore.set(RESET_VERIFIED_COOKIE, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: RESET_VERIFIED_MAX_AGE_S,
    });
  } else if (!alreadyVerified) {
    return { ok: false, error: 'link_invalid' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'link_invalid' };

  const { error: updateError } = await supabase.auth.updateUser({ password: input.password });
  if (updateError) return { ok: false, error: passwordUpdateErrorCode(updateError) };

  cookieStore.delete(RESET_VERIFIED_COOKIE);
  return { ok: true, redirectTo: await resolvePostLoginPath(supabase, user) };
}
