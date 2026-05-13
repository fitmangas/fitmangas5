'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BlogLang } from '@/types/blog';

const BLOG_LANGS = ['fr', 'es'] as const satisfies readonly BlogLang[];
const LABELS: Record<BlogLang, string> = { fr: 'Français', es: 'Español' };

type Props = {
  value: BlogLang;
  onChange: (lang: BlogLang) => void;
  className?: string;
};

export function BlogLanguageBar({ value, onChange, className = '' }: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-muted">Langue</span>
      {BLOG_LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
            value === code
              ? 'bg-luxury-ink text-white'
              : 'bg-white/50 text-luxury-muted hover:bg-white/80'
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}

export function useBlogLanguagePref(
  initial: BlogLang,
  canSyncProfile: boolean,
): [BlogLang, (l: BlogLang) => void] {
  const [lang, setLang] = useState<BlogLang>(initial);

  useEffect(() => {
    try {
      const v = localStorage.getItem('fitmangas_blog_lang');
      if (v === 'fr' || v === 'es') setLang(v);
      if (v === 'en') localStorage.setItem('fitmangas_blog_lang', 'fr');
    } catch {
      // ignore
    }
  }, []);

  const onChange = useCallback(
    (l: BlogLang) => {
      setLang(l);
      try {
        localStorage.setItem('fitmangas_blog_lang', l);
      } catch {
        // ignore
      }
      if (canSyncProfile) {
        void fetch('/api/client/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: l }),
        }).catch(() => {});
      }
    },
    [canSyncProfile],
  );

  return [lang, onChange];
}
