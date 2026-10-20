'use client';

import { useEffect } from 'react';

import { internalTrafficCookieValue } from '@/lib/analytics/internal-traffic';

/** Marque ce navigateur comme « trafic interne » pour GA4 (rien n'est affiché). */
export function InternalTrafficMarker() {
  useEffect(() => {
    try {
      document.cookie = internalTrafficCookieValue(window.location.protocol === 'https:');
    } catch {
      /* cookies bloqués : sans effet */
    }
  }, []);
  return null;
}
