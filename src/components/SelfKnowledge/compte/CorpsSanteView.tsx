'use client';

import { useMemo, useState } from 'react';

import { TrendLineChart } from '@/components/Charts/TrendLineChart';
import { HealthConsentGate } from '@/components/SelfKnowledge/compte/HealthConsentGate';
import { HealthMetricsForm } from '@/components/SelfKnowledge/compte/HealthMetricsForm';
import { GlassCard } from '@/components/ui/GlassCard';
import type { ClientLang } from '@/lib/compte/i18n';
import { WEARABLES_V2_ENABLED } from '@/lib/self-knowledge/wearables';
import type { HealthEntryRow } from '@/lib/self-knowledge/store';

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
          curve: 'Tendencia de tus scores',
          connect: 'Conectar wearables',
          strava: 'Conectar Strava',
          fitbit: 'Conectar Fitbit',
          connected: 'Conectado',
          off: 'Integración preparada — aún no activada (faltan claves API).',
          apple: 'Apple Salud requiere la app iOS FitMangas (HealthKit). No disponible en el navegador.',
          source: 'Fuente',
        }
      : {
          curve: 'Tendance de tes scores',
          connect: 'Connecter wearables',
          strava: 'Connecter Strava',
          fitbit: 'Connecter Fitbit',
          connected: 'Connecté',
          off: 'Intégration prête — pas encore activée (clés API manquantes).',
          apple: 'Apple Santé nécessite l’app iOS FitMangas (HealthKit). Indisponible depuis le navigateur.',
          source: 'Source',
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
    <div className="mt-8 space-y-6">
      {!consentId ? (
        <HealthConsentGate lang={lang} onConsented={setConsentId} />
      ) : (
        <>
          <GlassCard className="p-5 md:p-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c45d3e]">{t.curve}</h2>
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
                    color: '#958780',
                  },
                ]}
                yDomain={[0, 100]}
                height={240}
              />
            </div>
          </GlassCard>

          <HealthMetricsForm lang={lang} consentId={consentId} />

          <GlassCard className="p-5 md:p-6">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-luxury-soft">{t.connect}</h2>
            {!WEARABLES_V2_ENABLED ? (
              <p className="mt-3 text-sm text-luxury-muted">{t.off}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={WEARABLES_V2_ENABLED ? '/api/self-knowledge/wearables/strava/authorize' : '#'}
                aria-disabled={!WEARABLES_V2_ENABLED}
                className={`rounded-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
                  WEARABLES_V2_ENABLED
                    ? 'bg-[#c45d3e] text-white'
                    : 'pointer-events-none bg-luxury-ink/10 text-luxury-soft'
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
                    : 'pointer-events-none bg-luxury-ink/10 text-luxury-soft'
                }`}
                data-testid="connect-fitbit"
              >
                {fitbitConnected ? t.connected : t.fitbit}
              </a>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-luxury-soft">{t.apple}</p>
          </GlassCard>
        </>
      )}
    </div>
  );
}
