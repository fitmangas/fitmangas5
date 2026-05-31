'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

function isPublicMarketingPath(pathname: string): boolean {
  if (pathname === '/') return true;
  if (pathname === '/privacy' || pathname === '/terms' || pathname === '/connexion') return true;
  if (pathname.startsWith('/blog')) return true;
  return false;
}

type Props = {
  gaId: string | null;
  metaPixelId: string | null;
};

export function PublicMarketingScripts({ gaId, metaPixelId }: Props) {
  const pathname = usePathname();
  if (!isPublicMarketingPath(pathname)) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
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
        <Script id="meta-pixel" strategy="afterInteractive">
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
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}
