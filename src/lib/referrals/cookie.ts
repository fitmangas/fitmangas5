export const REF_COOKIE = 'fitmangas_ref';

export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 48);
}

export function isValidReferralCode(code: string): boolean {
  return normalizeReferralCode(code).length >= 4;
}

export function referralCodeFromCookieValue(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const code = normalizeReferralCode(raw);
  return isValidReferralCode(code) ? code : null;
}
