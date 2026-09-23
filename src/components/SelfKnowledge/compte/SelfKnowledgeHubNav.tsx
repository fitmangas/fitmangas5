'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import type { ClientLang } from '@/lib/compte/i18n';

import '@/components/SelfKnowledge/compte/hub-member.css';

export type HubTabId = 'evolution' | 'progression' | 'tests' | 'corps' | 'developpement';

const TABS: Array<{
  id: HubTabId;
  href: string;
  fr: string;
  es: string;
  icon: string;
}> = [
  {
    id: 'evolution',
    href: '/compte/connaissance-de-soi',
    fr: 'Mon évolution',
    es: 'Mi evolución',
    icon: '◈',
  },
  {
    id: 'progression',
    href: '/compte/connaissance-de-soi/progression',
    fr: 'Ma progression',
    es: 'Mi progreso',
    icon: '↗',
  },
  {
    id: 'tests',
    href: '/compte/connaissance-de-soi/tests',
    fr: 'Mes tests',
    es: 'Mis tests',
    icon: '◎',
  },
  {
    id: 'corps',
    href: '/compte/connaissance-de-soi/corps',
    fr: 'Mon corps',
    es: 'Mi cuerpo',
    icon: '♡',
  },
  {
    id: 'developpement',
    href: '/compte/connaissance-de-soi/developpement',
    fr: 'Développement',
    es: 'Desarrollo',
    icon: '✎',
  },
];

type Props = {
  lang: ClientLang;
  active: HubTabId;
};

/** Barre d’onglets sticky — icône + label, actif terracotta. */
export function SelfKnowledgeHubNav({ lang, active }: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const barRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const el = bar.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active]);

  return (
    <nav
      className="hub-tab-bar sticky top-0 z-30 -mx-1 mb-2 mt-4 rounded-[22px] border border-white/80 bg-[#FFFAF5]/92 px-1.5 py-1.5 shadow-[0_10px_32px_rgba(60,40,30,0.08)] sm:mx-0"
      aria-label={locale === 'es' ? 'Secciones' : 'Sections'}
      data-testid="self-knowledge-hub-nav"
    >
      <div ref={barRef} className="relative flex gap-0.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span
          className="hub-tab-indicator pointer-events-none absolute bottom-0.5 top-0.5 rounded-[16px] bg-[#c45d3e] shadow-[0_8px_20px_rgba(196,93,62,0.28)]"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              data-tab={tab.id}
              data-testid={`hub-tab-${tab.id}`}
              className={`relative z-10 flex shrink-0 items-center gap-2 rounded-[16px] px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 sm:px-4 sm:text-[12px] ${
                isActive ? 'text-white' : 'text-luxury-muted hover:text-luxury-ink'
              }`}
            >
              <span className={`text-sm ${isActive ? 'opacity-95' : 'opacity-55'}`} aria-hidden>
                {tab.icon}
              </span>
              <span className="whitespace-nowrap">{locale === 'es' ? tab.es : tab.fr}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
