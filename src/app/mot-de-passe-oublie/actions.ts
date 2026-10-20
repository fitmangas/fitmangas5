'use server';

import { headers } from 'next/headers';

import { sendPasswordResetEmail } from '@/lib/auth/password-reset';
import { normalizeEmailInput, type PasswordFormError } from '@/lib/auth/password-shared';
import { clientIpFromHeaders } from '@/lib/security/public-form-guard';
import { checkRateLimit } from '@/lib/security/rate-limit';

export type ForgotPasswordResult = { ok: true } | { ok: false; error: PasswordFormError };

/**
 * Envoie le lien « nouveau mot de passe ». Répond toujours `ok` pour une adresse bien formée,
 * que le compte existe ou non (on ne révèle pas qui est inscrite).
 */
export async function requestPasswordResetAction(input: { email: string; locale?: 'fr' | 'es' }): Promise<ForgotPasswordResult> {
  const email = normalizeEmailInput(input?.email);
  if (!email) return { ok: false, error: 'email_invalid' };

  const ip = clientIpFromHeaders(await headers());
  const byIp = await checkRateLimit('password_reset', ip);
  if (!byIp.ok) return { ok: false, error: 'rate_limited' };

  const byEmail = await checkRateLimit('password_reset_email', email);
  if (!byEmail.ok) return { ok: true };

  try {
    const result = await sendPasswordResetEmail({ email, locale: input?.locale === 'es' ? 'es' : 'fr' });
    if (!result.sent && result.reason !== 'no_account_or_error') {
      console.error('[mot-de-passe-oublie] envoi impossible', result.reason);
    }
  } catch (e) {
    console.error('[mot-de-passe-oublie] erreur', e instanceof Error ? e.message : e);
  }
  return { ok: true };
}
