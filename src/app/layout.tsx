import type { Metadata, Viewport } from 'next';
import { PublicMarketingScripts } from '@/components/Marketing/PublicMarketingScripts';
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    siteName: 'FitMangas',
    type: 'website',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Alejandra — coach FitMangas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-default.jpg'],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#C45D3E',
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
      <body className="relative min-h-screen overflow-x-clip">
        <div className="relative min-h-screen">
          {children}
          <FloatingWhatsApp />
        </div>
        <PublicMarketingScripts gaId={gaId} metaPixelId={metaPixelId ?? null} />
      </body>
    </html>
  );
}
