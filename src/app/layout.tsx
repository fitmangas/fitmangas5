import type { Metadata } from 'next';
import Script from 'next/script';

import { FloatingWhatsApp } from '@/components/Support/FloatingWhatsApp';
import { getMarketingSettings } from '@/lib/admin/marketing-settings';

import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://fitmangas.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'FitMangas — Cours de Pilates & Barre en visio avec Alejandra',
    template: '%s | FitMangas',
  },
  description: 'Cours de Pilates et Barre en visio avec Alejandra : live, replay, progression et coaching premium.',
  openGraph: {
    siteName: 'FitMangas',
    type: 'website',
    images: ['/client-contact-photo.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getMarketingSettings();
  const gaId = settings.google_analytics_id?.startsWith('G-') ? settings.google_analytics_id : null;
  const metaPixelId = settings.meta_pixel_id;

  return (
    <html lang="fr">
      <body className="relative min-h-screen">
        <div className="relative min-h-screen">
          {children}
          <FloatingWhatsApp />
        </div>
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
      </body>
    </html>
  );
}
