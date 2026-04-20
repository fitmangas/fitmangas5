import type { Metadata } from 'next';

import { DemoModeBanner } from '@/components/DemoModeBanner';
import { FloatingWhatsApp } from '@/components/Support/FloatingWhatsApp';

import './globals.css';

export const metadata: Metadata = {
  title: "L'Équilibre — Barre & Pilates",
  description: 'Barre et Pilates en visio et à Nantes — Fit Mangas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="relative min-h-screen">
        <div className="relative min-h-screen">
          <DemoModeBanner />
          {children}
          <FloatingWhatsApp />
        </div>
      </body>
    </html>
  );
}
