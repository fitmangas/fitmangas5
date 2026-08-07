'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

import { trackPurchase, trackTrialStarted } from '@/lib/analytics/ga4-client';

type Props = {
  gaId: string | null;
  metaPixelId: string | null;
  /** ID Stripe session (déduplication). */
  sessionId?: string | null;
  courseId?: string | null;
  currency?: string;
  /** true = essai Visio démarré (€0). */
  isTrial?: boolean;
  /** Montant réellement payé (présentiel / abo sans trial). 0 pour trial. */
  value: number;
};

/**
 * Conversion post-checkout sur /compte.
 * - trial → trial_started (pas purchase)
 * - paiement réel → purchase
 * Une seule fois par session Stripe (sessionStorage).
 */
export function CheckoutPurchaseTracker({
  gaId,
  metaPixelId,
  sessionId,
  courseId,
  currency = 'EUR',
  isTrial = false,
  value,
}: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const transactionId = sessionId?.trim() || `${courseId ?? 'checkout'}:${isTrial ? 'trial' : value}:${currency}`;

    const fire = () => {
      if (fired.current) return;
      fired.current = true;

      if (gaId) {
        if (isTrial) {
          trackTrialStarted({
            courseId: courseId || 'v-coll',
            transactionId,
            currency,
          });
        } else if (value > 0) {
          trackPurchase({
            courseId,
            transactionId,
            value,
            currency,
          });
        } else {
          console.warn('[ga4] checkout success sans trial ni montant — aucun événement purchase');
        }
      }

      if (metaPixelId && typeof window.fbq === 'function') {
        try {
          if (isTrial) {
            window.fbq('track', 'StartTrial', { value: 0, currency, predicted_ltv: value || 39 });
          } else if (value > 0) {
            window.fbq('track', 'Purchase', { value, currency });
          }
        } catch (e) {
          console.error('[meta-pixel] track failed', e);
        }
      }
    };

    const t = window.setTimeout(fire, 500);
    return () => window.clearTimeout(t);
  }, [gaId, metaPixelId, sessionId, courseId, currency, isTrial, value]);

  if (!gaId && !metaPixelId) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-checkout-conversion" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      ) : null}
      {metaPixelId ? (
        <Script id="meta-pixel-checkout-conversion" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
          `}
        </Script>
      ) : null}
    </>
  );
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
