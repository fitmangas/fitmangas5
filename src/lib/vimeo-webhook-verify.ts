import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Vimeo envoie le corps brut signé en HMAC-SHA256 avec le secret du webhook.
 * Header typique : `X-Vimeo-Signature` (hex ou préfixe `sha256=` selon versions).
 */
export function verifyVimeoWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader?.trim() || !secret.trim()) return false;

  const expectedHex = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');

  let received = signatureHeader.trim();
  const sha256Pref = /^sha256=/i.exec(received);
  if (sha256Pref) {
    received = received.slice(sha256Pref[0].length).trim();
  }

  try {
    const a = Buffer.from(expectedHex, 'hex');
    const b = Buffer.from(received, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
