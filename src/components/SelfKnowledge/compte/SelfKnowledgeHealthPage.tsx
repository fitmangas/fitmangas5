'use client';

import { useState } from 'react';

import { HealthConsentGate } from '@/components/SelfKnowledge/compte/HealthConsentGate';
import { HealthMetricsForm } from '@/components/SelfKnowledge/compte/HealthMetricsForm';
import { CompteDashboardBackLink } from '@/components/Compte/CompteDashboardBackLink';
import type { ClientLang } from '@/lib/compte/i18n';

type Props = {
  lang: ClientLang;
  initialConsentId: string | null;
};

export function SelfKnowledgeHealthPage({ lang, initialConsentId }: Props) {
  const [consentId, setConsentId] = useState<string | null>(initialConsentId);

  const t =
    lang === 'es'
      ? { title: 'Bienestar indicativo', dashboard: 'Panel' }
      : lang === 'en'
        ? { title: 'Indicative wellness', dashboard: 'Dashboard' }
        : { title: 'Bien-être indicatif', dashboard: 'Dashboard' };

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <CompteDashboardBackLink label={t.dashboard} className="mb-4" />
      <header>
        <h1 className="hero-signature-title text-4xl md:text-5xl">{t.title}</h1>
      </header>
      <div className="mt-8 space-y-6">
        {!consentId ? (
          <HealthConsentGate lang={lang} onConsented={setConsentId} />
        ) : (
          <HealthMetricsForm lang={lang} consentId={consentId} />
        )}
      </div>
    </main>
  );
}
