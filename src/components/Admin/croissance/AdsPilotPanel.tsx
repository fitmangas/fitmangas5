'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ClipboardList,
  Globe2,
  Lightbulb,
  Lock,
  Megaphone,
  Plus,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { AdCampaign, AdCreative, AdsConnectionState, AdsPerformanceSummary } from '@/lib/acquisition/ads/config';
import type { CoachAdvice } from '@/lib/acquisition/ads/coach';
import type { ActionPlanItem } from '@/lib/acquisition/ads/action-plan';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import {
  ADS_BEGINNER_GUIDE,
  ADS_CHANNEL_CARDS,
  ADS_COPY_ANGLES,
  ADS_FUNNEL_STEPS,
  STRATEGY_CAMPAIGN_BLUEPRINTS,
} from '@/lib/acquisition/ads/strategy-content';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import { AdsMarchePanel } from '@/components/Admin/croissance/ads/AdsMarchePanel';
import { AdsStatsPanel } from '@/components/Admin/croissance/ads/AdsStatsPanel';
import { AdsPlanPanel } from '@/components/Admin/croissance/ads/AdsPlanPanel';

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
  initialSubTab?: AdsSubTab;
  onCreateDrafts: () => Promise<ActionResult>;
  onSyncInsights: () => Promise<ActionResult>;
  onFullSync: () => Promise<ActionResult>;
  onSeedCreatives: () => Promise<ActionResult>;
  onCreateColdDraft: () => Promise<ActionResult>;
  onBoostOrganic: (params: { igMediaId: string; captionHint?: string }) => Promise<ActionResult>;
  onRefreshCreative: (params: { entityName?: string | null }) => Promise<ActionResult>;
  onReloadCoach: () => Promise<ActionResult>;
  onActivate: (params: {
    campaignId: string;
    confirmStep1: boolean;
    confirmStep2: boolean;
    budgetCentsExact: number;
  }) => Promise<ActionResult>;
};

const SUB_TABS: Array<{ id: AdsSubTab; label: string; icon: ReactNode }> = [
  { id: 'marche', label: 'Marché', icon: <Globe2 size={14} /> },
  { id: 'stats', label: 'Mes stats', icon: <BarChart3 size={14} /> },
  { id: 'plan', label: 'Plan d’action', icon: <ClipboardList size={14} /> },
  { id: 'execution', label: 'Exécution', icon: <Zap size={14} /> },
];

const TEMP_STYLES: Record<string, { accent: string; soft: string; label: string }> = {
  froid: { accent: '#3B82F6', soft: 'rgba(59,130,246,0.10)', label: 'Froid' },
  chaud: { accent: '#F59E0B', soft: 'rgba(245,158,11,0.12)', label: 'Warm' },
  brûlant: { accent: '#C45D3E', soft: 'rgba(196,93,62,0.12)', label: 'Hot' },
};

function formatEurFromCents(cents: number | null): string {
  if (cents == null) return '—';
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    ready: { label: 'Actif-ready', bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
    prepared: { label: 'Phase 2 · préparé', bg: 'rgba(245,158,11,0.14)', color: '#b45309' },
    off: { label: 'Off', bg: 'rgba(120,113,108,0.12)', color: acq.muted },
    draft: { label: 'Brouillon', bg: 'rgba(120,113,108,0.14)', color: acq.muted },
    active: { label: 'Active', bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
    paused: { label: 'PAUSED · 0 €', bg: 'rgba(245,158,11,0.16)', color: '#b45309' },
  };
  const m = map[status] ?? map.off!;
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide" style={{ backgroundColor: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function FloatingSection({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <section
      data-testid={testId}
      className="overflow-hidden rounded-[1.75rem] border bg-white/90 backdrop-blur-sm"
      style={{ borderColor: 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard, background: 'linear-gradient(165deg,#FFFFFF 0%,#FFFAF5 100%)' }}
    >
      {children}
    </section>
  );
}

function SectionHead({ eyebrow, title, subtitle, icon }: { eyebrow: string; title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-5 py-5 sm:px-6" style={{ borderColor: acq.warmBeigeDeep }}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.terracotta }}>
          {eyebrow}
        </p>
        <h2 className="mt-1 font-serif text-xl font-semibold sm:text-2xl" style={{ color: acq.ink }}>
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: acq.muted }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {icon}
    </div>
  );
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
  initialSubTab = 'plan',
  onCreateDrafts,
  onSyncInsights,
  onFullSync,
  onSeedCreatives,
  onCreateColdDraft,
  onBoostOrganic,
  onRefreshCreative,
  onReloadCoach,
  onActivate,
}: Props) {
  const [subTab, setSubTab] = useState<AdsSubTab>(initialSubTab);
  const [capsOpen, setCapsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [openGuide, setOpenGuide] = useState<number | null>(0);

  const missingCaps = intelligence.capabilities.filter((c) => !c.accessible);
  const hasCapAlert = missingCaps.length > 0 || intelligence.capabilities.length === 0;

  const displayCreatives = useMemo(() => {
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

  function run(action: () => Promise<ActionResult>) {
    setFlash(null);
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r.ok) setFlash(r.detail);
      else setError(r.error);
    });
  }

  const activateTarget = campaigns.find((c) => c.id === activateId) ?? null;

  return (
    <div className="space-y-6 sm:space-y-8" data-testid="ads-pilot-panel" style={{ background: acq.pageGradient }}>
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
      <FloatingSection testId="ads-connection-banner">
        <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: acq.terracotta }} aria-hidden />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
                Pilotage publicité
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: acq.ink }}>
                ADS / Publicité
              </h1>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: acq.muted }}>
                Marché · Stats · Plan d&apos;action · Exécution. Aucune dépense sans double confirmation.
              </p>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: 'rgba(196,93,62,0.22)', backgroundColor: acq.terracottaSoft }}>
                {connection.connected ? (
                  <CheckCircle2 className="mt-0.5 shrink-0" size={20} style={{ color: '#15803d' }} />
                ) : (
                  <Lock className="mt-0.5 shrink-0" size={20} style={{ color: acq.terracotta }} />
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                    {connection.connected ? 'Meta Ads connecté (lecture + brouillons)' : 'En attente connexion Meta Ads'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: acq.muted }}>
                    {connection.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending || !schemaReady} onClick={() => run(onSeedCreatives)} className="rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: '#fff', color: acq.ink, boxShadow: acq.shadowCard }}>
                Seed créatives
              </button>
              <button type="button" disabled={pending || !schemaReady} onClick={() => run(onCreateDrafts)} className="rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: acq.active }}>
                Créer 3 brouillons
              </button>
              <button type="button" disabled={pending} onClick={() => run(onFullSync)} className="rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: acq.warmBeige, color: acq.ink }}>
                Sync intelligence
              </button>
              <button type="button" disabled={pending} onClick={() => run(onSyncInsights)} className="rounded-full px-4 py-2.5 text-xs font-semibold disabled:opacity-50" style={{ backgroundColor: '#fff', color: acq.ink, boxShadow: acq.shadowCard }}>
                Sync CRM
              </button>
            </div>
          </div>
          {!schemaReady ? (
            <p className="relative mt-4 flex items-center gap-2 text-sm" style={{ color: '#b91c1c' }}>
              <AlertTriangle size={16} /> Tables Ads absentes — migration additive requise.
            </p>
          ) : null}
        </div>
      </FloatingSection>

      {/* Capabilities collapsed */}
      <FloatingSection testId="ads-sync-status">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
          onClick={() => setCapsOpen((o) => !o)}
          aria-expanded={capsOpen}
          data-testid="ads-caps-toggle"
        >
          <div className="flex min-w-0 items-start gap-3">
            {hasCapAlert ? (
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white" data-testid="ads-caps-alert">
                !
              </span>
            ) : (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} style={{ color: '#15803d' }} />
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.terracotta }}>
                Centre d&apos;intelligence
              </p>
              <p className="font-serif text-lg font-semibold" style={{ color: acq.ink }}>
                Données connectées
                {hasCapAlert ? <span className="ml-2 text-sm font-sans font-semibold text-red-700">· alerte source</span> : null}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: acq.muted }}>
                Dernière synchro : {formatSync(intelligence.lastSyncAt)} · cron 04:40 Paris
              </p>
            </div>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }} aria-hidden>
            {capsOpen ? <ChevronDown size={18} className="rotate-180" /> : <Plus size={18} />}
          </span>
        </button>
        {capsOpen ? (
          <div className="grid gap-2 border-t px-4 py-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-caps-panel">
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
      </FloatingSection>

      {/* Subnav */}
      <nav className="flex flex-wrap gap-2" data-testid="ads-subnav" aria-label="Sous-catégories Ads">
        {SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-testid={`ads-subnav-${t.id}`}
              onClick={() => setSubTab(t.id)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition"
              style={{
                backgroundColor: active ? acq.terracotta : '#fff',
                color: active ? '#fff' : acq.ink,
                boxShadow: acq.shadowCard,
              }}
            >
              {t.icon}
              {t.label}
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
        <div className="space-y-6 sm:space-y-8" data-testid="ads-tab-execution">
          {/* Alerts */}
          {intelligence.alerts.length > 0 ? (
            <FloatingSection testId="ads-execution-alerts">
              <SectionHead eyebrow="Live" title="Alertes fatigue / kill" icon={<AlertTriangle size={22} style={{ color: acq.terracotta }} />} />
              <ul className="space-y-2 px-4 py-4 sm:px-6">
                {intelligence.alerts.slice(0, 8).map((a) => (
                  <li key={a.id} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
                    <strong>{a.title}</strong> — {a.detail}
                    {(a.kind === 'fatigue' || a.kind === 'kill') && (
                      <button type="button" className="ml-2 text-xs font-semibold underline" style={{ color: acq.terracotta }} onClick={() => run(() => onRefreshCreative({ entityName: a.entityName }))}>
                        Refresh PAUSED
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </FloatingSection>
          ) : null}

          <FloatingSection testId="ads-funnel-visual">
            <SectionHead eyebrow="Parcours" title="Funnel FitMangas" subtitle="Ad → quiz → nurture → essai 7 j → 39 €." icon={<Zap size={22} style={{ color: acq.terracotta }} />} />
            <div className="px-4 py-5 sm:px-6">
              <ol className="flex flex-col gap-3 md:flex-row md:items-stretch">
                {ADS_FUNNEL_STEPS.map((s, idx) => (
                  <li key={s.step} className="flex flex-1 flex-col rounded-2xl border p-4" style={{ borderColor: acq.warmBeigeDeep, background: idx === 0 ? 'linear-gradient(160deg,rgba(196,93,62,0.12),#FFFAF5)' : acq.cream }}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: acq.terracotta }}>
                      {s.step}
                    </span>
                    <p className="mt-3 font-serif text-base font-semibold" style={{ color: acq.ink }}>
                      {s.title}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: acq.muted }}>
                      {s.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </FloatingSection>

          <FloatingSection testId="ads-campaign-cards">
            <SectionHead eyebrow="Campagnes" title="Froid / Warm / Hot" subtitle="Activation = double confirmation humaine." icon={<Megaphone size={22} style={{ color: acq.terracotta }} />} />
            <div className="grid gap-4 px-4 py-5 sm:px-6 lg:grid-cols-3">
              {STRATEGY_CAMPAIGN_BLUEPRINTS.map((bp) => {
                const vibe = TEMP_STYLES[bp.temperature] ?? TEMP_STYLES.froid!;
                const crm = campaigns.find((c) => c.objective === bp.id);
                const status = crm?.status ?? 'draft';
                return (
                  <article key={bp.id} data-testid={`ads-blueprint-${bp.id}`} className="flex flex-col overflow-hidden rounded-[1.5rem] border" style={{ borderColor: acq.warmBeigeDeep, background: `linear-gradient(165deg, ${vibe.soft} 0%, #fff 48%)` }}>
                    <div className="h-1.5 w-full" style={{ backgroundColor: vibe.accent }} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: vibe.accent }}>
                            {vibe.label}
                          </p>
                          <h3 className="mt-1 font-serif text-lg font-semibold" style={{ color: acq.ink }}>
                            {bp.labelFr.replace(/^(Froid|Warm|Hot)\s*[—–-]\s*/i, '')}
                          </h3>
                        </div>
                        <StatusPill status={status} />
                      </div>
                      <p className="mt-3 text-xs" style={{ color: acq.muted }}>
                        {bp.why}
                      </p>
                      <p className="mt-auto pt-5 font-serif text-2xl font-semibold" style={{ color: vibe.accent }}>
                        {bp.suggestedDailyBudgetEur} €<span className="ml-1 text-sm font-sans" style={{ color: acq.muted }}>/ jour</span>
                      </p>
                      {crm && (crm.status === 'draft' || crm.status === 'paused') ? (
                        <button
                          type="button"
                          className="mt-3 w-full rounded-full px-4 py-2.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: acq.terracotta }}
                          onClick={() => {
                            setActivateId(crm.id);
                            setConfirm1(false);
                            setConfirm2(false);
                            setBudgetInput(crm.dailyBudgetCents != null ? (crm.dailyBudgetCents / 100).toFixed(2) : '');
                            setError(null);
                          }}
                        >
                          Activer (confirm. humaine)…
                        </button>
                      ) : (
                        <p className="mt-3 text-[11px]" style={{ color: acq.mutedLight }}>
                          {crm?.metaCampaignId ? `Meta ${crm.metaCampaignId}` : 'Brouillon local'}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {activateTarget ? (
              <div className="mx-4 mb-5 rounded-[1.25rem] border-2 p-4 sm:mx-6" style={{ borderColor: acq.terracotta, backgroundColor: 'rgba(196,93,62,0.06)' }} data-testid="ads-activate-guard">
                <p className="flex items-center gap-2 text-sm font-bold" style={{ color: acq.ink }}>
                  <AlertTriangle size={16} style={{ color: acq.terracotta }} />
                  Double confirmation — budget réel
                </p>
                <p className="mt-2 text-sm" style={{ color: acq.muted }}>
                  Activer <strong>{activateTarget.name}</strong> à{' '}
                  <strong>{activateTarget.dailyBudgetCents != null ? `${(activateTarget.dailyBudgetCents / 100).toFixed(2)} €` : '—'}</strong>/j.
                </p>
                <label className="mt-3 flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={confirm1} onChange={(e) => setConfirm1(e.target.checked)} />
                  Je confirme avoir lu le budget.
                </label>
                <label className="mt-2 flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={confirm2} onChange={(e) => setConfirm2(e.target.checked)} />
                  Je confirme une 2ᵉ fois (pas de dépense auto).
                </label>
                <label className="mt-3 block text-xs font-semibold" style={{ color: acq.muted }}>
                  Resaisis le budget (€)
                  <input type="text" inputMode="decimal" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: acq.warmBeigeDeep }} />
                </label>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={pending || !confirm1 || !confirm2}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    style={{ backgroundColor: '#b91c1c' }}
                    onClick={() => {
                      const euros = Number(budgetInput.replace(',', '.'));
                      if (!Number.isFinite(euros)) {
                        setError('Budget invalide.');
                        return;
                      }
                      run(() =>
                        onActivate({
                          campaignId: activateTarget.id,
                          confirmStep1: confirm1,
                          confirmStep2: confirm2,
                          budgetCentsExact: Math.round(euros * 100),
                        }),
                      );
                      setActivateId(null);
                    }}
                  >
                    Activer maintenant
                  </button>
                  <button type="button" className="rounded-full px-4 py-2 text-xs font-semibold" onClick={() => setActivateId(null)}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : null}
          </FloatingSection>

          <FloatingSection testId="ads-metrics-section">
            <SectionHead eyebrow="Suivi" title="KPIs live" icon={<Target size={22} style={{ color: acq.terracotta }} />} />
            <div className="grid grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:grid-cols-6" data-testid="ads-metrics-grid">
              {[
                { label: 'Dépense', value: formatEurFromCents(performance.spendCents) },
                { label: 'Leads', value: performance.leads?.toLocaleString('fr-FR') ?? '—' },
                { label: 'CPL', value: formatEurFromCents(performance.cplCents) },
                { label: 'CAC', value: formatEurFromCents(performance.cacCents) },
                { label: 'Impressions', value: performance.impressions?.toLocaleString('fr-FR') ?? '—' },
                { label: 'Coût essai', value: formatEurFromCents(performance.costPerTrialCents) },
              ].map((k) => (
                <div key={k.label} className="rounded-[1.25rem] border bg-white p-4" style={{ borderColor: acq.warmBeigeDeep }}>
                  <p className="text-[10px] font-semibold uppercase" style={{ color: acq.muted }}>
                    {k.label}
                  </p>
                  <p className="mt-2 font-serif text-xl font-semibold" style={{ color: acq.ink }}>
                    {performance.connected ? k.value : '—'}
                  </p>
                </div>
              ))}
            </div>
          </FloatingSection>

          <FloatingSection testId="ads-beginner-guide">
            <SectionHead eyebrow="Pédagogie" title="Guide débutant" icon={<BookOpen size={22} style={{ color: acq.terracotta }} />} />
            <div className="divide-y px-3" style={{ borderColor: acq.warmBeigeDeep }}>
              {ADS_BEGINNER_GUIDE.map((g, i) => {
                const open = openGuide === i;
                return (
                  <div key={g.title}>
                    <button type="button" className="flex w-full items-center gap-3 py-4 text-left" onClick={() => setOpenGuide(open ? null : i)}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: open ? acq.terracotta : acq.active }}>
                        {i + 1}
                      </span>
                      <span className="flex-1 font-serif font-semibold" style={{ color: acq.ink }}>
                        {g.title.replace(/^\d+\.\s*/, '')}
                      </span>
                      <ChevronDown size={18} className={open ? 'rotate-180' : ''} style={{ color: acq.muted }} />
                    </button>
                    {open ? (
                      <p className="pb-4 pl-11 text-sm" style={{ color: acq.muted }}>
                        {g.body}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </FloatingSection>

          <FloatingSection testId="ads-creatives-gallery">
            <SectionHead eyebrow="Bibliothèque" title="Créatives UGC" icon={<Sparkles size={22} style={{ color: acq.terracotta }} />} />
            <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
              {displayCreatives.map((c) => (
                <article key={c.id} className="overflow-hidden rounded-[1.35rem] border bg-white" style={{ borderColor: acq.warmBeigeDeep }}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {c.mediaPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.mediaPath.startsWith('/') ? c.mediaPath : `/${c.mediaPath}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ backgroundColor: acq.warmBeige }}>
                        <Megaphone size={28} style={{ color: acq.muted }} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-serif font-semibold" style={{ color: acq.ink }}>
                      {c.title}
                    </p>
                    <p className="mt-2 line-clamp-3 text-xs" style={{ color: acq.muted }}>
                      {c.copyFr}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </FloatingSection>

          <FloatingSection>
            <SectionHead eyebrow="Multi-canal" title="Un canal bien avant d’éparpiller" icon={<Lightbulb size={22} style={{ color: acq.terracotta }} />} />
            <div className="grid gap-4 px-4 py-5 sm:px-6 md:grid-cols-2">
              {ADS_CHANNEL_CARDS.map((ch) => (
                <div key={ch.id} data-testid={`ads-channel-${ch.id}`} className="rounded-[1.35rem] border p-4" style={{ borderColor: ch.phase === 1 ? 'rgba(196,93,62,0.35)' : acq.warmBeigeDeep }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold" style={{ color: acq.ink }}>
                      {ch.name}
                    </p>
                    <StatusPill status={ch.status} />
                  </div>
                  {ch.phase === 2 ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: '#b45309' }}>
                      <CircleDashed size={12} /> Quand Meta est rentabilisé
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs" style={{ color: acq.muted }}>
                    {ch.relevance}
                  </p>
                </div>
              ))}
            </div>
          </FloatingSection>
        </div>
      ) : null}
    </div>
  );
}
