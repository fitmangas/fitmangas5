export function parsePromoCodeFromBody(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  if ('promoCode' in body && typeof (body as { promoCode: unknown }).promoCode === 'string') {
    const trimmed = (body as { promoCode: string }).promoCode.trim();
    return trimmed || null;
  }
  return null;
}
