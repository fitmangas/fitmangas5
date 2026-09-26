'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Globe2,
  Lock,
  Plus,
  RefreshCw,
  Zap,
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
import { eur, num } from '@/components/Admin/croissance/ads/ads-ui';

export type AdsSubTab = 'marche' | 'stats' | 'plan' | 'execution';

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

const SUB_TABS: Array<{ id: AdsSubTab; label: string; hint: string; icon: ReactNode }> = [
  { id: 'marche', label: 'Marché', hint: 'Ce que veulent les femmes', icon: <Globe2 size={15} /> },
  { id: 'stats', label: 'Mes stats', hint: 'Compte, audience, contenus, pub', icon: <BarChart3 size={15} /> },
  { id: 'plan', label: 'Plan d’action', hint: 'Quoi créer, quoi tester', icon: <ClipboardList size={15} /> },
  { id: 'execution', label: 'Exécution', hint: 'Cockpit & prochaine action', icon: <Zap size={15} /> },
];

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
  onBoostOrganic,
  onRefreshCreative,
  onReloadCoach,
  onRegenerateBrief,
  onSetCreativeStatus,
  onActivate,
}: Props) {
  const [subTab, setSubTab] = useState<AdsSubTab>(initialSubTab);
  const [capsOpen, setCapsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const missingCaps = intelligence.capabilities.filter((c) => !c.accessible);
  const hasCapAlert = missingCaps.length > 0 || intelligence.capabilities.length === 0;
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

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

      {/* Hero */}
      <section
        data-testid="ads-connection-banner"
        className="relative overflow-hidden rounded-[1.75rem] border"
        style={{ borderColor: 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard, background: 'linear-gradient(160deg,#FFFFFF 0%,#FFFAF5 60%,#FBEDE5 100%)' }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl" style={{ background: acq.terracotta }} aria-hidden />
        <div className="relative flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
              Pilotage publicité
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: acq.ink }}>
              ADS / Publicité
            </h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: acq.muted }}>
              Aucune dépense sans double confirmation humaine.
            </p>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'rgba(196,93,62,0.22)', backgroundColor: acq.terracottaSoft }}>
              {connection.connected ? (
                <CheckCircle2 className="mt-0.5 shrink-0" size={18} style={{ color: '#15803d' }} />
              ) : (
                <Lock className="mt-0.5 shrink-0" size={18} style={{ color: acq.terracotta }} />
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                  {connection.connected ? 'Meta Ads connecté (lecture + brouillons PAUSED)' : 'En attente connexion Meta Ads'}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: acq.muted }}>
                  {connection.message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Abonnés', num(intelligence.organicAccount?.followersCount ?? null)],
                ['Dépense 30 j', eur(intelligence.adsTotals.spendCents)],
                ['Campagnes actives', String(activeCampaigns)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border bg-white/80 px-3 py-2.5" style={{ borderColor: acq.warmBeigeDeep }}>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: acq.muted }}>
                    {k}
                  </dt>
                  <dd className="mt-0.5 font-serif text-lg font-semibold tabular-nums" style={{ color: acq.ink }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(onFullSync)}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: acq.terracotta }}
                data-testid="ads-sync-intelligence"
              >
                <RefreshCw size={13} className={pending ? 'animate-spin' : ''} /> Sync intelligence
              </button>
              <button type="button" disabled={pending || !schemaReady} onClick={() => run(onCreateDrafts)} className="rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: acq.active }}>
                Créer 3 brouillons
              </button>
              <button type="button" disabled={pending} onClick={() => run(onSyncInsights)} className="rounded-full border bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
                Sync CRM
              </button>
              <button type="button" disabled={pending || !schemaReady} onClick={() => run(onSeedCreatives)} className="rounded-full border bg-white px-4 py-2.5 text-xs font-semibold disabled:opacity-50" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
                Seed créatives
              </button>
            </div>
          </div>
        </div>
        {!schemaReady ? (
          <p className="relative flex items-center gap-2 px-5 pb-5 text-sm sm:px-8" style={{ color: '#b91c1c' }}>
            <AlertTriangle size={16} /> Tables Ads absentes — migration additive requise.
          </p>
        ) : null}
      </section>

      {/* Capabilities (repliées) */}
      <section data-testid="ads-sync-status" className="overflow-hidden rounded-[1.5rem] border bg-white" style={{ borderColor: hasCapAlert ? 'rgba(185,28,28,0.3)' : 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard }}>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left sm:px-6"
          onClick={() => setCapsOpen((o) => !o)}
          aria-expanded={capsOpen}
          data-testid="ads-caps-toggle"
        >
          <div className="flex min-w-0 items-center gap-3">
            {hasCapAlert ? (
              <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white" data-testid="ads-caps-alert">
                {missingCaps.length || '!'}
              </span>
            ) : (
              <CheckCircle2 className="shrink-0" size={20} style={{ color: '#15803d' }} />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: acq.ink }}>
                Données connectées
                {hasCapAlert ? (
                  <span className="ml-2 text-xs font-semibold text-red-700">· {missingCaps.length} source(s) non accessible(s)</span>
                ) : null}
              </p>
              <p className="text-xs" style={{ color: acq.muted }}>
                Dernière synchro : {formatSync(intelligence.lastSyncAt)} · auto chaque jour 04:40 (Paris) · conseils régénérés à chaque synchro
              </p>
            </div>
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }} aria-hidden>
            {capsOpen ? <ChevronDown size={16} className="rotate-180" /> : <Plus size={16} />}
          </span>
        </button>
        {capsOpen ? (
          <div className="grid gap-2 border-t px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-caps-panel">
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
        ) : null}
      </section>

      {/* Sous-navigation */}
      <nav
        className="sticky top-2 z-20 grid grid-cols-2 gap-1.5 rounded-[1.5rem] border bg-white/90 p-1.5 backdrop-blur sm:grid-cols-4"
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
              onClick={() => setSubTab(t.id)}
              className="flex items-center gap-2.5 rounded-[1.1rem] px-3 py-2.5 text-left transition"
              style={{ backgroundColor: active ? acq.ink : 'transparent', color: active ? '#fff' : acq.ink }}
            >
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: active ? acq.terracotta : acq.warmBeige, color: active ? '#fff' : acq.terracotta }}
              >
                {t.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{t.label}</span>
                <span className="hidden truncate text-[10px] leading-tight sm:block" style={{ color: active ? 'rgba(255,255,255,0.65)' : acq.muted }}>
                  {t.hint}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {subTab === 'marche' ? <AdsMarchePanel intelligence={intelligence} /> : null}
      {subTab === 'stats' ? <AdsStatsPanel intelligence={intelligence} performance={performance} /> : null}
      {subTab === 'plan' ? (
        <AdsPlanPanel
          plan={actionPlan}
          planNote={planNote}
          coachAdvice={coachAdvice}
          coachNote={coachNote}
          onReload={onReloadCoach}
          onCreateColdDraft={onCreateColdDraft}
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
