import type { Metadata } from 'next';
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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
