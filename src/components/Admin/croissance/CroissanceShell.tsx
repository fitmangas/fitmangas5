'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Megaphone, MessageCircle, Rocket, Target, Workflow } from 'lucide-react';
import type { ReactNode } from 'react';

import { acq } from '@/components/acquisition/tokens';

import { CROISSANCE_TABS, type CroissanceTabId } from './croissance-tabs';

const TAB_ICONS = {
  overview: BarChart3,
  conversations: MessageCircle,
  workflows: Workflow,
  publications: Megaphone,
  seo: Rocket,
} as const;

type Props = {
  activeTab: CroissanceTabId;
  showAcquisition: boolean;
  children: ReactNode;
};

export function CroissanceShell({ activeTab, showAcquisition, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const visibleTabs = CROISSANCE_TABS.filter((t) => showAcquisition || !t.acquisitionOnly);

  function navigateTab(tabId: CroissanceTabId) {
    const q = new URLSearchParams(searchParams.toString());
    q.set('tab', tabId);
    if (tabId !== 'conversations') q.delete('conversation');
    if (tabId !== 'overview') q.delete('channel');
    router.push(`/admin/croissance?${q.toString()}`);
  }

  return (
    <div
      className="relative min-h-screen px-4 pb-28 pt-4 sm:px-8 sm:pt-6"
      style={{ background: acq.pageGradient }}
    >
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: acq.terracotta }}
            >
              Admin · Croissance
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: acq.ink }}>
              Croissance
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: acq.muted }}>
              Parcours cliente, publications réseaux et pilotage SEO — un seul espace.
            </p>
          </div>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.75)', boxShadow: acq.shadowCard }}
          >
            <Target size={24} strokeWidth={2} style={{ color: acq.terracotta }} aria-hidden />
          </div>
        </header>

        <nav
          className="mb-8 inline-flex max-w-full flex-wrap gap-1 rounded-full p-1.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.75)', boxShadow: acq.shadowCard }}
          aria-label="Onglets Croissance"
        >
          {visibleTabs.map(({ id, label }) => {
            const Icon = TAB_ICONS[id];
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateTab(id)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition sm:px-5"
                style={
                  active
                    ? { backgroundColor: acq.active, color: '#FFFFFF' }
                    : { color: acq.muted }
                }
              >
                <Icon size={16} strokeWidth={2} aria-hidden />
                {label}
              </button>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
