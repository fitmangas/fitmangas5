import { Resend } from 'resend';

/**
 * Point d’envoi unique des emails (Resend).
 * Garde anti-envoi : hors production (VERCEL_ENV !== 'production') et tant que
 * EMAIL_SAFE_MODE ≠ « off », l’email part vers ADMIN_ALERT_EMAIL (sujet préfixé)
 * ou, sans adresse d’alerte, il est seulement journalisé.
 */

export type EmailSafeDecision =
  | { mode: 'send' }
  | { mode: 'redirect'; to: string }
  | { mode: 'log' };

type EnvLike = Record<string, string | undefined>;

export function resolveEmailSafeMode(env: EnvLike = process.env): EmailSafeDecision {
  if (env.VERCEL_ENV === 'production') return { mode: 'send' };
  const flag = (env.EMAIL_SAFE_MODE ?? '').trim().toLowerCase();
  if (flag === 'off') return { mode: 'send' };
  const admin = env.ADMIN_ALERT_EMAIL?.trim();
  if (admin) return { mode: 'redirect', to: admin };
  return { mode: 'log' };
}

/** Push : hors production, jamais envoyé tant que le mode sûr est actif. */
export function isPushSafeModeBlocking(env: EnvLike = process.env): boolean {
  return resolveEmailSafeMode(env).mode !== 'send';
}

export type EmailAttachment = { filename: string; content: Buffer | string; contentType?: string };

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  attachments?: EmailAttachment[];
  text?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null; safeMode: EmailSafeDecision['mode'] }
  | { ok: false; error: string; safeMode: EmailSafeDecision['mode'] };

function toList(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to]).map((t) => t.trim()).filter(Boolean);
}

export function applySafeMode(
  input: SendEmailInput,
  decision: EmailSafeDecision,
): SendEmailInput | null {
  if (decision.mode === 'send') return input;
  if (decision.mode === 'log') return null;
  const original = toList(input.to).join(', ');
  return {
    ...input,
    to: decision.to,
    subject: `[SAFE → ${original}] ${input.subject}`,
  };
}

let resendClient: Resend | null = null;
function getResend(apiKey: string): Resend {
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const decision = resolveEmailSafeMode();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (input.from ?? process.env.NEWSLETTER_FROM_EMAIL)?.trim();
  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY ou NEWSLETTER_FROM_EMAIL manquant — email non envoyé.');
    return { ok: false, error: 'email_config_missing', safeMode: decision.mode };
  }
  if (toList(input.to).length === 0) {
    return { ok: false, error: 'email_recipient_missing', safeMode: decision.mode };
  }

  const effective = applySafeMode(input, decision);
  if (!effective) {
    console.info('[email:safe-mode] journalisé sans envoi', {
      to: toList(input.to).length,
      subject: input.subject,
    });
    return { ok: true, id: null, safeMode: decision.mode };
  }

  try {
    const { data, error } = await getResend(apiKey).emails.send({
      from,
      to: toList(effective.to),
      subject: effective.subject,
      html: effective.html,
      ...(effective.text ? { text: effective.text } : {}),
      ...(effective.replyTo ? { replyTo: effective.replyTo } : {}),
      ...(effective.headers ? { headers: effective.headers } : {}),
      ...(effective.attachments ? { attachments: effective.attachments } : {}),
    });
    if (error) return { ok: false, error: error.message || 'resend_error', safeMode: decision.mode };
    return { ok: true, id: data?.id ?? null, safeMode: decision.mode };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'resend_error',
      safeMode: decision.mode,
    };
  }
}

/**
 * Envoi groupé (Resend batch, 100 max par appel). Le résultat est indexé comme l’entrée :
 * l’appelant n’écrit l’anti-doublon que pour les lignes ok.
 */
export async function sendEmailBatch(inputs: SendEmailInput[]): Promise<SendEmailResult[]> {
  const decision = resolveEmailSafeMode();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const defaultFrom = process.env.NEWSLETTER_FROM_EMAIL?.trim();
  if (!apiKey || !defaultFrom) {
    return inputs.map(() => ({ ok: false as const, error: 'email_config_missing', safeMode: decision.mode }));
  }
  const results: SendEmailResult[] = [];
  for (let i = 0; i < inputs.length; i += 100) {
    const chunk = inputs.slice(i, i + 100);
    const effective = chunk.map((input) => applySafeMode(input, decision));
    if (decision.mode === 'log') {
      console.info('[email:safe-mode] lot journalisé sans envoi', { count: chunk.length });
      results.push(...chunk.map(() => ({ ok: true as const, id: null, safeMode: decision.mode })));
      continue;
    }
    try {
      const payload = effective.map((e) => ({
        from: (e!.from ?? defaultFrom).trim(),
        to: toList(e!.to),
        subject: e!.subject,
        html: e!.html,
        ...(e!.headers ? { headers: e!.headers } : {}),
        ...(e!.replyTo ? { replyTo: e!.replyTo } : {}),
      }));
      const { data, error } = await getResend(apiKey).batch.send(payload);
      if (error) {
        results.push(...chunk.map(() => ({ ok: false as const, error: error.message || 'resend_batch_error', safeMode: decision.mode })));
        continue;
      }
      const ids = (data as { data?: { id: string }[] } | null)?.data ?? [];
      results.push(...chunk.map((_, idx) => ({ ok: true as const, id: ids[idx]?.id ?? null, safeMode: decision.mode })));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'resend_batch_error';
      results.push(...chunk.map(() => ({ ok: false as const, error: msg, safeMode: decision.mode })));
    }
  }
  return results;
}
