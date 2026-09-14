/** Consentement cookies analytics / marketing (GA4, Meta Pixel). */
export const COOKIE_CONSENT_KEY = 'fm_cookie_consent';
export const COOKIE_CONSENT_EVENT = 'fm-cookie-consent';

export type CookieConsentValue = 'accepted' | 'refused';

export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (raw === 'accepted' || raw === 'refused') return raw;
  } catch {
    /* private mode */
  }
  return null;
}

export function writeCookieConsent(value: CookieConsentValue) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent() === 'accepted';
}
