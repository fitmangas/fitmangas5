'use client';

import { useEffect, useState } from 'react';

import { LevelTestClient } from './LevelTestClient';
import { PublicSiteHeader } from '@/components/Marketing/PublicSiteHeader';
import { PublicSiteFooter } from '@/components/Marketing/PublicSiteFooter';
import type { CatalogCard } from '@/lib/programmes/catalog-view';

type Card = CatalogCard & { published: boolean };

/** D08 — page publique /test-niveau : en-tête du site, test en 3 questions, résultat, pied de page. */
export function LevelTestPage({
  initialLang,
  programs,
  member,
}: {
  initialLang: 'fr' | 'es';
  programs: { fr: Card[]; es: Card[] };
  member: boolean;
}) {
  const [lang, setLang] = useState<'fr' | 'es'>(initialLang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f4f1]">
      <PublicSiteHeader lang={lang === 'es' ? 'ES' : 'FR'} onToggleLang={(l) => setLang(l === 'ES' ? 'es' : 'fr')} activeHref="/test-niveau" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 md:px-8">
        <LevelTestClient key={lang} lang={lang} programs={programs[lang]} member={member} />
      </main>
      <PublicSiteFooter lang={lang} />
    </div>
  );
}
