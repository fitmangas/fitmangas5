'use client';

import { useEffect } from 'react';

/** Aligne document.documentElement.lang sur la langue affichée (SPEC lot 5). */
export function HtmlLang({ lang }: { lang: 'fr' | 'es' | 'en' }) {
  useEffect(() => {
    document.documentElement.lang = lang === 'es' ? 'es' : lang === 'en' ? 'en' : 'fr';
  }, [lang]);
  return null;
}
