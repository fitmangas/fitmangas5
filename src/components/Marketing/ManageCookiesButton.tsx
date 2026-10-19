'use client';

import { resetCookieConsent } from '@/lib/cookies/consent';

export function ManageCookiesButton({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => resetCookieConsent()} className={className}>
      {label}
    </button>
  );
}
