import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Authentification des webhooks Printful (`/api/webhooks/printful`).
 *
 * L'API Printful v1 (celle du site : `/orders`, `/store/products`) ne signe pas ses webhooks :
 * le secret `PRINTFUL_WEBHOOK_SECRET` est alors passé dans l'URL enregistrée chez Printful
 * (`https://fitmangas.com/api/webhooks/printful?token=…`).
 * Une signature HMAC-SHA256 du corps reste acceptée (en-têtes v2 et anciens noms), clé brute ou hexadécimale.
 */

const SIGNATURE_HEADERS = ['x-pf-webhook-signature', 'x-pf-signature', 'x-printful-signature'] as const;

function sameText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function printfulTokenMatches(requestUrl: string, secret: string): boolean {
  let token: string | null = null;
  try {
    token = new URL(requestUrl).searchParams.get('token');
  } catch {
    return false;
  }
  const value = token?.trim();
  return Boolean(value) && sameText(value as string, secret);
}

export function printfulSignatureHeader(headers: Headers): string {
  for (const name of SIGNATURE_HEADERS) {
    const value = headers.get(name)?.trim();
    if (value) return value;
  }
  return '';
}

export function verifyPrintfulSignature(body: string, signature: string, secret: string): boolean {
  const normalized = signature.replace(/^sha256=/i, '').trim();
  if (!normalized) return false;
  const keys: Array<string | Buffer> = [secret];
  if (/^[0-9a-f]+$/i.test(secret) && secret.length % 2 === 0) keys.push(Buffer.from(secret, 'hex'));
  return keys.some((key) => {
    const hex = createHmac('sha256', key).update(body, 'utf8').digest('hex');
    const base64 = createHmac('sha256', key).update(body, 'utf8').digest('base64');
    return sameText(normalized.toLowerCase(), hex) || sameText(normalized, base64);
  });
}

export type PrintfulWebhookAuth =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * En production, un secret est obligatoire (sinon n'importe qui pourrait simuler une commande).
 * Hors production sans secret : accepté (développement local).
 */
export function authorizePrintfulWebhook(input: {
  url: string;
  headers: Headers;
  body: string;
  secret: string | undefined;
  production: boolean;
}): PrintfulWebhookAuth {
  const secret = input.secret?.trim();
  if (!secret) {
    return input.production
      ? { ok: false, status: 503, error: 'Webhook non configuré.' }
      : { ok: true };
  }
  if (printfulTokenMatches(input.url, secret)) return { ok: true };
  const signature = printfulSignatureHeader(input.headers);
  if (signature && verifyPrintfulSignature(input.body, signature, secret)) return { ok: true };
  return {
    ok: false,
    status: 401,
    error: signature ? 'Signature Printful invalide.' : 'Signature Printful manquante.',
  };
}
