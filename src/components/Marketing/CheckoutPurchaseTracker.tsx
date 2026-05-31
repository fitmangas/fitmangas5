'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

type Props = {
  gaId: string | null;
  metaPixelId: string | null;
  value: number;
  currency?: string;
  courseId?: string | null;
};

const STORAGE_KEY = 'fitmangas_purchase_tracked';

export function CheckoutPurchaseTracker({ gaId, metaPixelId, value, currency = 'EUR', courseId }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || value <= 0) return;
    const dedupeKey = `${courseId ?? 'checkout'}:${value}:${currency}`;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === dedupeKey) return;
    } catch {
      // sessionStorage indisponible
    }

    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, dedupeKey);
      } catch {
        // ignore
      }

      if (gaId && typeof window.gtag === 'function') {
        window.gtag('event', 'purchase', {
          transaction_id: dedupeKey,
          value,
          currency,
          items: courseId ? [{ item_id: courseId, item_name: courseId }] : undefined,
        });
      }

      if (metaPixelId && typeof window.fbq === 'function') {
        window.fbq('track', 'Purchase', { value, currency });
      }
    };

    const t = window.setTimeout(fire, 400);
    return () => window.clearTimeout(t);
  }, [gaId, metaPixelId, value, currency, courseId]);

  if (!gaId && !metaPixelId) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-checkout-purchase" strategy="afterInteractive">
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
        <Script id="meta-pixel-checkout-purchase" strategy="afterInteractive">
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
