import Link from 'next/link';

import type { ClientLang } from '@/lib/compte/i18n';

export type HubTabId = 'evolution' | 'progression' | 'tests' | 'corps' | 'developpement';

const TABS: Array<{ id: HubTabId; href: string; fr: string; es: string }> = [
  { id: 'evolution', href: '/compte/connaissance-de-soi', fr: 'Mon évolution', es: 'Mi evolución' },
  {
    id: 'progression',
    href: '/compte/connaissance-de-soi/progression',
    fr: 'Ma progression',
    es: 'Mi progreso',
  },
  { id: 'tests', href: '/compte/connaissance-de-soi/tests', fr: 'Mes tests', es: 'Mis tests' },
  { id: 'corps', href: '/compte/connaissance-de-soi/corps', fr: 'Mon corps', es: 'Mi cuerpo' },
  {
    id: 'developpement',
    href: '/compte/connaissance-de-soi/developpement',
    fr: 'Développement',
    es: 'Desarrollo',
  },
];

type Props = {
  lang: ClientLang;
  active: HubTabId;
};

/** Onglets hub cerveau — DA cream / terracotta. */
export function SelfKnowledgeHubNav({ lang, active }: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';

  return (
    <nav
      className="mt-6 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={locale === 'es' ? 'Secciones' : 'Sections'}
      data-testid="self-knowledge-hub-nav"
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            data-testid={`hub-tab-${tab.id}`}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition sm:px-4 sm:text-[11px] ${
              isActive
                ? 'bg-[#c45d3e] text-white shadow-[0_8px_18px_rgba(196,93,62,0.28)]'
                : 'bg-white/70 text-luxury-muted hover:bg-white hover:text-luxury-ink'
            }`}
          >
            {locale === 'es' ? tab.es : tab.fr}
          </Link>
        );
      })}
    </nav>
  );
}
