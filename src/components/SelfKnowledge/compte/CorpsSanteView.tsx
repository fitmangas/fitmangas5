'use client';

import { useMemo, useState } from 'react';

import { TrendLineChart } from '@/components/Charts/TrendLineChart';
import { HealthConsentGate } from '@/components/SelfKnowledge/compte/HealthConsentGate';
import { HealthMetricsForm } from '@/components/SelfKnowledge/compte/HealthMetricsForm';
import { HubEmptyState, HubSectionHero } from '@/components/SelfKnowledge/compte/HubVisuals';
import type { ClientLang } from '@/lib/compte/i18n';
import { WEARABLES_V2_ENABLED } from '@/lib/self-knowledge/wearables';
import type { HealthEntryRow } from '@/lib/self-knowledge/store';

import '@/components/SelfKnowledge/compte/hub-member.css';

type Props = {
  lang: ClientLang;
  initialConsentId: string | null;
  entries: HealthEntryRow[];
  stravaConnected: boolean;
  fitbitConnected: boolean;
};

export function CorpsSanteView({
  lang,
  initialConsentId,
  entries,
  stravaConnected,
  fitbitConnected,
}: Props) {
  const [consentId, setConsentId] = useState<string | null>(initialConsentId);
  const locale = lang === 'es' ? 'es' : 'fr';

  const t =
    locale === 'es'
      ? {
          eyebrow: 'Mi cuerpo',
          title: 'Bienestar indicativo',
          lead: 'No médico — tú frente a tus propias tendencias.',
          curve: 'Tendencia de tus scores',
          connect: 'Conectar wearables',
          strava: 'Conectar Strava',
          fitbit: 'Conectar Fitbit',
          connected: 'Conectado',
          off: 'Integración lista — aún no activada (faltan claves API).',
          apple: 'Apple Salud requiere la app iOS FitMangas (HealthKit). No disponible en el navegador.',
          emptyTitle: 'Nota tu primer sentir para ver tus tendencias',
          emptyLead: 'Sueño, FC, minutos activos — scores orientativos, sin juicio.',
          emptyCta: 'Empezar a anotar',
        }
      : {
          eyebrow: 'Mon corps',
          title: 'Bien-être indicatif',
          lead: 'Non médical — toi face à tes propres tendances.',
          curve: 'Tendance de tes scores',
          connect: 'Connecter wearables',
          strava: 'Connecter Strava',
          fitbit: 'Connecter Fitbit',
          connected: 'Connecté',
          off: 'Intégration prête — pas encore activée (clés API manquantes).',
          apple: 'Apple Santé nécessite l’app iOS FitMangas (HealthKit). Indisponible depuis le navigateur.',
          emptyTitle: 'Note ton premier ressenti pour voir tes tendances',
          emptyLead: 'Sommeil, FC, minutes actives — scores indicatifs, sans jugement.',
          emptyCta: 'Commencer à noter',
        };

  const chartData = useMemo(
    () =>
      entries.map((e) => {
        const s = e.scores as { regularite?: number; recuperation?: number; energie?: number };
        const d = new Date(e.created_at);
        return {
          label: `${d.getDate()}/${d.getMonth() + 1}`,
          regularite: s.regularite ?? null,
          recuperation: s.recuperation ?? null,
          energie: s.energie ?? null,
        };
      }),
    [entries],
  );

  return (
    <div className="mt-2 space-y-8">
      <HubSectionHero eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      {!consentId ? (
        <div className="space-y-4">
          <HubEmptyState
            title={t.emptyTitle}
            lead={t.emptyLead}
            ctaLabel={t.emptyCta}
            ctaHref="#health-consent"
            testId="corps-empty"
            preview="curve"
          />
          <div id="health-consent">
            <HealthConsentGate lang={lang} onConsented={setConsentId} />
          </div>
        </div>
      ) : (
        <>
          {entries.length === 0 ? (
            <HubEmptyState
              title={t.emptyTitle}
              lead={t.emptyLead}
              ctaLabel={t.emptyCta}
              ctaHref="#health-form"
              testId="corps-empty-form"
              preview="pastilles"
            />
          ) : (
            <div className="hub-reveal hub-elevate rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.curve}</h2>
              <div className="mt-4">
                <TrendLineChart
                  data={chartData}
                  series={[
                    {
                      key: 'regularite',
                      label: locale === 'es' ? 'Regularidad' : 'Régularité',
                      color: '#C45D3E',
                    },
                    {
                      key: 'recuperation',
                      label: locale === 'es' ? 'Recuperación' : 'Récupération',
                      color: '#8B5E4B',
                    },
                    {
                      key: 'energie',
                      label: locale === 'es' ? 'Energía' : 'Énergie',
                      color: '#A67C52',
                    },
                  ]}
                  yDomain={[0, 100]}
                  height={240}
                />
              </div>
            </div>
          )}

          <div id="health-form">
            <HealthMetricsForm lang={lang} consentId={consentId} />
          </div>

          <div className="rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{t.connect}</h2>
            {!WEARABLES_V2_ENABLED ? (
              <p className="mt-3 text-sm text-brand-ink/55">{t.off}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={WEARABLES_V2_ENABLED ? '/api/self-knowledge/wearables/strava/authorize' : '#'}
                aria-disabled={!WEARABLES_V2_ENABLED}
                className={`rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  WEARABLES_V2_ENABLED
                    ? 'bg-[#c45d3e] text-white'
                    : 'pointer-events-none bg-brand-ink/10 text-brand-ink/40'
                }`}
                data-testid="connect-strava"
              >
                {stravaConnected ? t.connected : t.strava}
              </a>
              <a
                href={WEARABLES_V2_ENABLED ? '/api/self-knowledge/wearables/fitbit/authorize' : '#'}
                aria-disabled={!WEARABLES_V2_ENABLED}
                className={`rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  WEARABLES_V2_ENABLED
                    ? 'border border-[#c45d3e] text-[#c45d3e]'
                    : 'pointer-events-none bg-brand-ink/10 text-brand-ink/40'
                }`}
                data-testid="connect-fitbit"
              >
                {fitbitConnected ? t.connected : t.fitbit}
              </a>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-brand-ink/45">{t.apple}</p>
          </div>
        </>
      )}
    </div>
  );
}
