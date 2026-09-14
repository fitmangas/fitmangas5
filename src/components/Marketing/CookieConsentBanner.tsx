'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  COOKIE_CONSENT_EVENT,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentValue,
} from '@/lib/cookies/consent';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookieConsent() == null);
    const onChange = () => setVisible(readCookieConsent() == null);
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  if (!visible) return null;

  function choose(value: CookieConsentValue) {
    writeCookieConsent(value);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[80] p-4 md:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-[24px] border border-brand-ink/10 bg-white/95 p-5 shadow-[0_20px_60px_rgba(48,35,28,0.18)] backdrop-blur-md md:flex-row md:items-center md:gap-6 md:p-6">
        <div className="min-w-0 flex-1">
          <p id="cookie-consent-title" className="text-sm font-bold tracking-tight text-brand-ink">
            Cookies et mesure d’audience
          </p>
          <p id="cookie-consent-desc" className="mt-1.5 text-xs leading-relaxed text-brand-ink/60">
            Nous utilisons des cookies nécessaires au site, et — seulement si tu acceptes — Google Analytics et le
            pixel Meta pour comprendre le trafic et améliorer FitMangas.{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-brand-ink">
              Politique de confidentialité
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => choose('refused')}
            className="rounded-full border border-brand-ink/15 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-ink/70 transition hover:border-brand-ink/30 hover:text-brand-ink"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="rounded-full bg-[#c45d3e] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_20px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
