'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Lock,
  Plus,
  RefreshCw,
} from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { AdCampaign, AdCreative, AdsConnectionState, AdsPerformanceSummary } from '@/lib/acquisition/ads/config';
import type { CoachAdvice } from '@/lib/acquisition/ads/coach';
import type { ActionPlanItem } from '@/lib/acquisition/ads/action-plan';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import type { SituationBrief } from '@/lib/acquisition/ads/situation-brief';
import type { CreativeStatus } from '@/lib/acquisition/ads/stats-compute';
import { ADS_COPY_ANGLES } from '@/lib/acquisition/ads/strategy-content';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import { AdsMarchePanel } from '@/components/Admin/croissance/ads/AdsMarchePanel';
import { AdsStatsPanel } from '@/components/Admin/croissance/ads/AdsStatsPanel';
import { AdsPlanPanel } from '@/components/Admin/croissance/ads/AdsPlanPanel';
import { AdsExecutionPanel } from '@/components/Admin/croissance/ads/AdsExecutionPanel';
import { AdsLangSwitch, AdsTermHint, eur, num, useAdsUiLang } from '@/components/Admin/croissance/ads/ads-ui';
import { type AdsSubTab } from '@/lib/acquisition/ads/ads-glossary';
import { buildCreativePipeline, computeNextAction } from '@/lib/acquisition/ads/stats-compute';

export type { AdsSubTab };

type Props = {
  connection: AdsConnectionState;
  performance: AdsPerformanceSummary;
  campaigns: AdCampaign[];
  creatives: AdCreative[];
  schemaReady: boolean;
  intelligence: IntelligenceBundle;
  coachAdvice: CoachAdvice[];
  coachNote: string | null;
  actionPlan: ActionPlanItem[];
  planNote: string | null;
  situationBrief: SituationBrief | null;
  creativeStatuses: Record<string, CreativeStatus>;
  initialSubTab?: AdsSubTab;
  onCreateDrafts: () => Promise<ActionResult>;
  onSyncInsights: () => Promise<ActionResult>;
  onFullSync: () => Promise<ActionResult>;
  onSeedCreatives: () => Promise<ActionResult>;
  onCreateColdDraft: () => Promise<ActionResult>;
  onCreateCmDraft: (params: { planItemId: string }) => Promise<ActionResult>;
  onBoostOrganic: (params: { igMediaId: string; captionHint?: string }) => Promise<ActionResult>;
  onRefreshCreative: (params: { entityName?: string | null }) => Promise<ActionResult>;
  onReloadCoach: () => Promise<ActionResult>;
  onRegenerateBrief: () => Promise<ActionResult>;
  onSetCreativeStatus: (params: { itemId: string; status: string | null }) => Promise<ActionResult>;
  onActivate: (params: {
    campaignId: string;
    confirmStep1: boolean;
    confirmStep2: boolean;
    budgetCentsExact: number;
  }) => Promise<ActionResult>;
};

const SUB_TABS: Array<{
  id: AdsSubTab;
  emoji: string;
  label: { fr: string; es: string };
}> = [
  { id: 'marche', emoji: '🌍', label: { fr: 'Marché', es: 'Mercado' } },
  { id: 'stats', emoji: '📊', label: { fr: 'Mes stats', es: 'Mis cifras' } },
  { id: 'plan', emoji: '📋', label: { fr: 'Plan d’action', es: 'Plan de acción' } },
  { id: 'execution', emoji: '⚡', label: { fr: 'Exécution', es: 'Ejecución' } },
];

function persistSub(sub: AdsSubTab) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('tab', 'ads');
  url.searchParams.set('sub', sub);
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

function formatSync(iso: string | null): string {
  if (!iso) return 'jamais';
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdsPilotPanel({
  connection,
  performance,
  campaigns,
  creatives,
  schemaReady,
  intelligence,
  coachAdvice,
  coachNote,
  actionPlan,
  planNote,
  situationBrief,
  creativeStatuses,
  initialSubTab = 'plan',
  onCreateDrafts,
  onSyncInsights,
  onFullSync,
  onSeedCreatives,
  onCreateColdDraft,
  onCreateCmDraft,
  onBoostOrganic,
  onRefreshCreative,
  onReloadCoach,
  onRegenerateBrief,
  onSetCreativeStatus,
  onActivate,
}: Props) {
  const [subTab, setSubTab] = useState<AdsSubTab>(initialSubTab);
  const [lang, setLang] = useAdsUiLang();
  const [moreOpen, setMoreOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function goTo(next: AdsSubTab) {
    setSubTab(next);
    persistSub(next);
  }

  const missingCaps = intelligence.capabilities.filter((c) => !c.accessible);
  const hasCapAlert = missingCaps.length > 0 || intelligence.capabilities.length === 0;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  const nextAction = useMemo(
    () =>
      computeNextAction({
        lastSyncAt: intelligence.lastSyncAt,
        alerts: intelligence.alerts,
        campaigns,
        pipeline: buildCreativePipeline({
          plan: actionPlan,
          campaigns,
          insights: intelligence.campaigns,
          alerts: intelligence.alerts,
          manualStatuses: creativeStatuses,
        }),
        totalSpendCents: intelligence.adsTotals.spendCents,
      }),
    [intelligence, campaigns, actionPlan, creativeStatuses],
  );

  const displayCreatives = useMemo<AdCreative[]>(() => {
    if (creatives.length > 0) return creatives;
    return ADS_COPY_ANGLES.map((a, i) => ({
      id: `local-${i}`,
      channel: 'meta' as const,
      title: a.angle,
      angle: a.id,
      copyFr: a.copyFr,
      copyEs: a.copyEs,
      mediaPath: a.mediaHint,
      mediaKind: 'image' as const,
      campaignObjective: a.objective,
      complianceNotes: 'complianceNotes' in a ? ((a as { complianceNotes?: string }).complianceNotes ?? null) : null,
    }));
  }, [creatives]);

  function run(action: () => Promise<ActionResult>, onOk?: (r: ActionResult & { ok: true }) => void) {
    setFlash(null);
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        setFlash(r.detail);
        onOk?.(r);
      } else setError(r.error);
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-pilot-panel" style={{ background: acq.pageGradient }}>
      {(flash || error) && (
        <div
          className="rounded-2xl px-4 py-3 text-sm shadow-sm"
          style={{ backgroundColor: error ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.1)', color: error ? '#b91c1c' : '#15803d' }}
          role="status"
        >
          {error ?? flash}
        </div>
      )}

      <section
        data-testid="ads-connection-banner"
        className="overflow-hidden rounded-[1.35rem] border bg-white"
        style={{ borderColor: hasCapAlert ? 'rgba(185,28,28,0.28)' : 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard }}
      >
        <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: acq.ink }}>
              {lang === 'es' ? 'Publicidad' : 'Publicité'}
            </h1>
            <AdsLangSwitch lang={lang} onChange={setLang} />
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                backgroundColor: connection.connected ? 'rgba(21,128,61,0.10)' : acq.terracottaSoft,
                color: connection.connected ? '#15803d' : acq.terracotta,
              }}
            >
              {connection.connected ? <CheckCircle2 size={13} /> : <Lock size={13} />}
              {connection.connected ? (
                <>
                  <AdsTermHint term="meta" lang={lang}>
                    Meta
                  </AdsTermHint>
                  {' · '}
                  {lang === 'es' ? 'lectura' : 'lecture'}
                </>
              ) : lang === 'es' ? (
                'Meta no conectado'
              ) : (
                'Meta non connecté'
              )}
            </span>
            {hasCapAlert ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white" data-testid="ads-caps-alert">
                {missingCaps.length || '!'}
              </span>
            ) : null}
            <span className="text-[11px]" style={{ color: acq.muted }} data-testid="ads-sync-status">
              {formatSync(intelligence.lastSyncAt)}
            </span>
          </div>
          <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {[
              [lang === 'es' ? 'Seguidoras' : 'Abonnées', num(intelligence.organicAccount?.followersCount ?? null)],
              [lang === 'es' ? 'Gasto 30 d' : 'Dépense 30 j', eur(intelligence.adsTotals.spendCents)],
              [lang === 'es' ? 'Activas' : 'Actives', String(activeCampaigns)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-1.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: acq.muted }}>
                  {k}
                </dt>
                <dd className="font-serif text-base font-semibold tabular-nums" style={{ color: acq.ink }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(onFullSync)}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: acq.terracotta }}
              data-testid="ads-sync-intelligence"
            >
              <RefreshCw size={13} className={pending ? 'animate-spin' : ''} />
              {lang === 'es' ? 'Sincronizar' : 'Synchroniser'}
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              aria-expanded={moreOpen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
              style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}
              data-testid="ads-caps-toggle"
            >
              {moreOpen ? <ChevronDown size={16} className="rotate-180" /> : <Plus size={16} />}
            </button>
          </div>
        </div>
        {moreOpen ? (
          <div className="space-y-3 border-t px-4 py-4 sm:px-5" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-caps-panel">
            <p className="text-xs leading-relaxed" style={{ color: acq.muted }}>
              {lang === 'es' ? 'Última sincro' : 'Dernière synchro'} : {formatSync(intelligence.lastSyncAt)}
              {' · '}
              {connection.message}{' '}
              {lang === 'es' ? 'Ningún gasto sin doble confirmación humana.' : 'Aucune dépense sans double confirmation humaine.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending || !schemaReady} onClick={() => run(onCreateDrafts)} className="rounded-full px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: acq.active }}>
                {lang === 'es' ? 'Crear 3 borradores' : 'Créer 3 brouillons'}
              </button>
              <button type="button" disabled={pending} onClick={() => run(onSyncInsights)} className="rounded-full border bg-white px-3.5 py-2 text-xs font-semibold disabled:opacity-50" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
                {lang === 'es' ? 'Actualizar fichas' : 'Actualiser les fiches'} <AdsTermHint term="crm" lang={lang} />
              </button>
              <button type="button" disabled={pending || !schemaReady} onClick={() => run(onSeedCreatives)} className="rounded-full border bg-white px-3.5 py-2 text-xs font-semibold disabled:opacity-50" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
                {lang === 'es' ? 'Preparar modelos' : 'Préparer les modèles'}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(intelligence.capabilities.length
                ? intelligence.capabilities
                : [{ id: 'pending', label: 'Lance une sync pour sonder', accessible: false, missingPermission: null, note: 'Pas encore de run.' }]
              ).map((c) => (
                <div key={c.id} className="flex items-start gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: c.accessible ? acq.warmBeigeDeep : 'rgba(185,28,28,0.35)', backgroundColor: c.accessible ? '#fff' : 'rgba(254,226,226,0.5)' }}>
                  {c.accessible ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#15803d' }} /> : <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-700" />}
                  <div>
                    <p className="text-xs font-semibold" style={{ color: acq.ink }}>
                      {c.accessible ? 'OUI' : 'NON'} · {c.label}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: acq.muted }}>
                      {c.accessible ? c.note : c.missingPermission ? `Manquant : ${c.missingPermission}` : c.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {!schemaReady ? (
          <p className="flex items-center gap-2 px-4 pb-3 text-sm sm:px-5" style={{ color: '#b91c1c' }}>
            <AlertTriangle size={16} /> Tables Ads absentes — migration additive requise.
          </p>
        ) : null}
      </section>

      <nav
        className="sticky top-2 z-20 grid grid-cols-4 gap-1 rounded-2xl border bg-white/90 p-1 backdrop-blur"
        style={{ borderColor: 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard }}
        data-testid="ads-subnav"
        aria-label="Sous-catégories Ads"
      >
        {SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`ads-subnav-${t.id}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => goTo(t.id)}
              className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center sm:justify-start sm:px-3"
              style={{ backgroundColor: active ? acq.ink : 'transparent', color: active ? '#fff' : acq.ink }}
            >
              <span aria-hidden className="text-sm">
                {t.emoji}
              </span>
              <span className="text-xs font-semibold sm:text-sm">{t.label[lang]}</span>
            </button>
          );
        })}
      </nav>

      {subTab === 'marche' ? (
        <AdsMarchePanel intelligence={intelligence} plan={actionPlan} lang={lang} onGoTo={goTo} />
      ) : null}
      {subTab === 'stats' ? (
        <AdsStatsPanel intelligence={intelligence} performance={performance} lang={lang} onGoTo={goTo} />
      ) : null}
      {subTab === 'plan' ? (
        <AdsPlanPanel
          plan={actionPlan}
          planNote={planNote}
          coachAdvice={coachAdvice}
          coachNote={coachNote}
          intelligence={intelligence}
          nextAction={nextAction}
          lang={lang}
          onGoTo={goTo}
          onReload={onReloadCoach}
          onCreateColdDraft={onCreateColdDraft}
          onCreateCmDraft={onCreateCmDraft}
          onBoostOrganic={onBoostOrganic}
          onFullSync={onFullSync}
        />
      ) : null}
      {subTab === 'execution' ? (
        <AdsExecutionPanel
          intelligence={intelligence}
          performance={performance}
          campaigns={campaigns}
          displayCreatives={displayCreatives}
          actionPlan={actionPlan}
          situationBrief={situationBrief}
          creativeStatuses={creativeStatuses}
          pending={pending}
          lang={lang}
          onGoTo={goTo}
          run={run}
          onFullSync={onFullSync}
          onCreateColdDraft={onCreateColdDraft}
          onRefreshCreative={onRefreshCreative}
          onReloadCoach={onReloadCoach}
          onRegenerateBrief={onRegenerateBrief}
          onSetCreativeStatus={onSetCreativeStatus}
          onActivate={onActivate}
          onError={setError}
        />
      ) : null}
    </div>
  );
}
