'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Lock,
  Megaphone,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { AdCampaign, AdCreative, AdsConnectionState, AdsPerformanceSummary } from '@/lib/acquisition/ads/config';
import type { CoachAdvice } from '@/lib/acquisition/ads/coach';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import {
  ADS_BEGINNER_GUIDE,
  ADS_CHANNEL_CARDS,
  ADS_COPY_ANGLES,
  ADS_FUNNEL_STEPS,
  STRATEGY_CAMPAIGN_BLUEPRINTS,
} from '@/lib/acquisition/ads/strategy-content';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import { AdsIntelligenceHub } from '@/components/Admin/croissance/AdsIntelligenceHub';

type Props = {
  connection: AdsConnectionState;
  performance: AdsPerformanceSummary;
  campaigns: AdCampaign[];
  creatives: AdCreative[];
  schemaReady: boolean;
  intelligence: IntelligenceBundle;
  coachAdvice: CoachAdvice[];
  coachNote: string | null;
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
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
      style={{ backgroundColor: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

function FloatingSection({
  children,
  className = '',
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className={`overflow-hidden rounded-[1.75rem] border bg-white/90 backdrop-blur-sm ${className}`}
      style={{
        borderColor: 'rgba(232,223,212,0.9)',
        boxShadow: acq.shadowCard,
        background: 'linear-gradient(165deg, #FFFFFF 0%, #FFFAF5 100%)',
      }}
    >
      {children}
    </section>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
  icon,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-5 py-5 sm:px-6" style={{ borderColor: acq.warmBeigeDeep }}>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.terracotta }}>
          {eyebrow}
        </p>
        <h2 className="mt-1 font-serif text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: acq.ink }}>
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: acq.muted }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {icon ? <div className="hidden shrink-0 sm:block">{icon}</div> : null}
    </div>
  );
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
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [openGuide, setOpenGuide] = useState<number | null>(0);

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

  const kpiCards = [
    { label: 'Dépense 30 j', value: formatEurFromCents(performance.spendCents), hint: '€ réels Meta' },
    { label: 'Leads', value: performance.leads?.toLocaleString('fr-FR') ?? '—', hint: 'e-mails / forms' },
    { label: 'Impressions', value: performance.impressions?.toLocaleString('fr-FR') ?? '—', hint: 'portée' },
    { label: 'CPL', value: formatEurFromCents(performance.cplCents), hint: 'coût / lead' },
    { label: 'Coût / essai', value: formatEurFromCents(performance.costPerTrialCents), hint: 'bas de funnel' },
    { label: 'CAC', value: formatEurFromCents(performance.cacCents), hint: 'payantes' },
  ];

  return (
    <div
      className="space-y-6 sm:space-y-8"
      data-testid="ads-pilot-panel"
      style={{ background: acq.pageGradient }}
    >
      {(flash || error) && (
        <div
          className="rounded-2xl px-4 py-3 text-sm shadow-sm"
          style={{
            backgroundColor: error ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.1)',
            color: error ? '#b91c1c' : '#15803d',
          }}
          role="status"
        >
          {error ?? flash}
        </div>
      )}

      {/* Hero connexion */}
      <FloatingSection testId="ads-connection-banner">
        <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{ background: acq.terracotta }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
                Pilotage publicité
              </p>
              <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: acq.ink }}>
                ADS / Publicité
              </h1>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: acq.muted }}>
                Centre stratégique — pas un bouton « boost 10 € ». Meta d’abord ; les autres canaux en phase 2.
              </p>
              <div
                className="mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3"
                style={{ borderColor: 'rgba(196,93,62,0.22)', backgroundColor: acq.terracottaSoft }}
              >
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
                  {!connection.connected && connection.blockers.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc text-xs" style={{ color: acq.muted }}>
                      {connection.blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending || !schemaReady}
                onClick={() => run(onSeedCreatives)}
                className="rounded-full px-4 py-2.5 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{ backgroundColor: '#fff', color: acq.ink, boxShadow: acq.shadowCard }}
              >
                Seed créatives
              </button>
              <button
                type="button"
                disabled={pending || !schemaReady}
                onClick={() => run(onCreateDrafts)}
                className="rounded-full px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{ backgroundColor: acq.active }}
              >
                Créer 3 brouillons
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(onFullSync)}
                className="rounded-full px-4 py-2.5 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{ backgroundColor: acq.warmBeige, color: acq.ink }}
              >
                Sync intelligence
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(onSyncInsights)}
                className="rounded-full px-4 py-2.5 text-xs font-semibold transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{ backgroundColor: '#fff', color: acq.ink, boxShadow: acq.shadowCard }}
              >
                Sync CRM (legacy)
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

      <AdsIntelligenceHub
        intelligence={intelligence}
        coachAdvice={coachAdvice}
        coachNote={coachNote}
        onFullSync={onFullSync}
        onBoostOrganic={onBoostOrganic}
        onRefreshCreative={onRefreshCreative}
        onCreateColdDraft={onCreateColdDraft}
        onReloadCoach={onReloadCoach}
      />

      {/* Funnel visuel */}
      <FloatingSection testId="ads-funnel-visual">
        <SectionHead
          eyebrow="Parcours"
          title="Funnel FitMangas"
          subtitle="Ad → quiz gratuit → e-mail → nurture → essai 7 j → 39 €. Aimant = quiz (aucune salle ne le copie)."
          icon={<Zap size={22} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <ol className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
            {ADS_FUNNEL_STEPS.map((s, idx) => (
              <li key={s.step} className="relative flex flex-1 flex-col md:min-w-0">
                <div
                  className="flex h-full flex-col rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg md:rounded-none md:border-y md:border-l-0 md:first:rounded-l-2xl md:first:border-l md:last:rounded-r-2xl"
                  style={{
                    borderColor: acq.warmBeigeDeep,
                    background:
                      idx === 0
                        ? 'linear-gradient(160deg, rgba(196,93,62,0.12), #FFFAF5)'
                        : idx === ADS_FUNNEL_STEPS.length - 1
                          ? 'linear-gradient(160deg, #FFFAF5, rgba(196,93,62,0.08))'
                          : acq.cream,
                  }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: acq.terracotta }}
                  >
                    {s.step}
                  </span>
                  <p className="mt-3 font-serif text-base font-semibold" style={{ color: acq.ink }}>
                    {s.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: acq.muted }}>
                    {s.detail}
                  </p>
                </div>
                {idx < ADS_FUNNEL_STEPS.length - 1 ? (
                  <span
                    className="pointer-events-none absolute -bottom-1 left-1/2 hidden h-3 w-3 -translate-x-1/2 rotate-45 md:left-auto md:right-[-6px] md:top-1/2 md:block md:-translate-y-1/2"
                    style={{ backgroundColor: acq.terracotta, opacity: 0.35 }}
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </FloatingSection>

      {/* KPIs */}
      <FloatingSection testId="ads-metrics-section">
        <SectionHead
          eyebrow="Suivi"
          title="Performance"
          subtitle="CPL, CAC, dépense, leads — chiffres réels uniquement. Jamais inventés."
          icon={<Target size={22} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {!performance.connected ? (
            <div
              className="relative overflow-hidden rounded-[1.5rem] border border-dashed px-5 py-10 text-center sm:px-8"
              style={{ borderColor: acq.warmBeigeDeep, backgroundColor: acq.cream }}
              data-testid="ads-metrics-waiting"
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: acq.terracottaSoft }}
              >
                <Lock size={24} style={{ color: acq.terracotta }} />
              </div>
              <p className="mt-4 font-serif text-lg font-semibold" style={{ color: acq.ink }}>
                En attente connexion Meta Ads
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed" style={{ color: acq.muted }}>
                {performance.waitingMessage ?? 'Aucun chiffre inventé. Sync insights dès que le flag + token sont prêts.'}
              </p>
              <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
                {kpiCards.map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border bg-white/70 px-3 py-4 opacity-60"
                    style={{ borderColor: acq.warmBeigeDeep }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: acq.muted }}>
                      {k.label}
                    </p>
                    <p className="mt-1 font-serif text-xl" style={{ color: acq.mutedLight }}>
                      —
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="ads-metrics-grid">
              {kpiCards.map((k) => (
                <div
                  key={k.label}
                  className="group rounded-[1.25rem] border bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ borderColor: acq.warmBeigeDeep, boxShadow: '0 8px 24px rgba(35,32,29,0.04)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: acq.muted }}>
                    {k.label}
                  </p>
                  <p className="mt-2 font-serif text-xl font-semibold sm:text-2xl" style={{ color: acq.ink }}>
                    {k.value}
                  </p>
                  <p className="mt-1 text-[10px]" style={{ color: acq.mutedLight }}>
                    {k.hint}
                  </p>
                </div>
              ))}
            </div>
          )}
          {performance.waitingMessage && performance.connected ? (
            <p className="mt-4 text-xs" style={{ color: acq.muted }}>
              {performance.waitingMessage}
            </p>
          ) : null}
        </div>
      </FloatingSection>

      {/* 3 campagnes visuelles */}
      <FloatingSection testId="ads-campaign-cards">
        <SectionHead
          eyebrow="Recommandation"
          title="3 campagnes"
          subtitle="Froid / Warm / Hot — budgets test. Activation = double confirmation humaine (jamais auto)."
          icon={<Megaphone size={22} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <div className="grid gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-3">
          {STRATEGY_CAMPAIGN_BLUEPRINTS.map((bp) => {
            const vibe = TEMP_STYLES[bp.temperature] ?? TEMP_STYLES.froid!;
            const crm = campaigns.find((c) => c.objective === bp.id);
            const status = crm?.status ?? 'draft';
            return (
              <article
                key={bp.id}
                data-testid={`ads-blueprint-${bp.id}`}
                className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  borderColor: 'rgba(232,223,212,0.95)',
                  boxShadow: acq.shadowCard,
                  background: `linear-gradient(165deg, ${vibe.soft} 0%, #FFFFFF 48%)`,
                }}
              >
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
                  <p className="mt-3 text-xs leading-relaxed" style={{ color: acq.muted }}>
                    <strong style={{ color: acq.ink }}>Rôle :</strong> {bp.why}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                    <strong style={{ color: acq.ink }}>Audience :</strong> {bp.audience}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                    <strong style={{ color: acq.ink }}>Offre :</strong> {bp.offer}
                  </p>
                  <div className="mt-auto pt-5">
                    <p className="font-serif text-2xl font-semibold" style={{ color: vibe.accent }}>
                      {bp.suggestedDailyBudgetEur} €
                      <span className="ml-1 text-sm font-sans font-medium" style={{ color: acq.muted }}>
                        / jour
                      </span>
                    </p>
                    {crm && (crm.status === 'draft' || crm.status === 'paused') ? (
                      <button
                        type="button"
                        className="mt-3 w-full rounded-full px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-95"
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
                        {crm?.metaCampaignId ? `Meta ${crm.metaCampaignId}` : 'Brouillon local — crée / sync pour lier Meta'}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {campaigns.length > 0 ? (
          <div className="border-t px-4 py-4 sm:px-6" style={{ borderColor: acq.warmBeigeDeep }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: acq.muted }}>
              CRM · {campaigns.length} campagne(s)
            </p>
            <ul className="mt-3 space-y-2">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-1 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: acq.warmBeigeDeep, backgroundColor: '#fff' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                      {c.name}
                    </p>
                    <p className="text-xs" style={{ color: acq.muted }}>
                      {c.objective} ·{' '}
                      {c.dailyBudgetCents != null ? `${(c.dailyBudgetCents / 100).toFixed(2)} €/j` : '—'}
                      {c.metaCampaignId ? ` · Meta ${c.metaCampaignId}` : ' · local'}
                    </p>
                  </div>
                  <StatusPill status={c.status} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {activateTarget ? (
          <div
            className="mx-4 mb-5 rounded-[1.25rem] border-2 p-4 sm:mx-6"
            style={{ borderColor: acq.terracotta, backgroundColor: 'rgba(196,93,62,0.06)' }}
            data-testid="ads-activate-guard"
          >
            <p className="flex items-center gap-2 text-sm font-bold" style={{ color: acq.ink }}>
              <AlertTriangle size={16} style={{ color: acq.terracotta }} />
              Double confirmation — budget réel
            </p>
            <p className="mt-2 text-sm" style={{ color: acq.muted }}>
              Tu vas activer <strong>{activateTarget.name}</strong> avec un budget quotidien de{' '}
              <strong>
                {activateTarget.dailyBudgetCents != null
                  ? `${(activateTarget.dailyBudgetCents / 100).toFixed(2)} €`
                  : '—'}
              </strong>
              . Cette action engage de l’argent sur Meta.
            </p>
            <label className="mt-3 flex items-start gap-2 text-sm" style={{ color: acq.ink }}>
              <input type="checkbox" checked={confirm1} onChange={(e) => setConfirm1(e.target.checked)} />
              Je confirme avoir lu le budget quotidien ci-dessus.
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm" style={{ color: acq.ink }}>
              <input type="checkbox" checked={confirm2} onChange={(e) => setConfirm2(e.target.checked)} />
              Je confirme une 2ᵉ fois : activer et payer ce budget (pas de dépense auto par le code).
            </label>
            <label className="mt-3 block text-xs font-semibold" style={{ color: acq.muted }}>
              Resaisis le budget quotidien exact (€)
              <input
                type="text"
                inputMode="decimal"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}
                placeholder="ex. 8.00"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
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
              <button
                type="button"
                className="rounded-full px-4 py-2 text-xs font-semibold"
                style={{ backgroundColor: '#fff', color: acq.muted }}
                onClick={() => setActivateId(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : null}
      </FloatingSection>

      {/* Guide accordéon */}
      <FloatingSection testId="ads-beginner-guide">
        <SectionHead
          eyebrow="Pédagogie"
          title="Guide débutant"
          subtitle="Tirée de docs/STRATEGIE_CROISSANCE.md — clic pour ouvrir chaque étape."
          icon={<BookOpen size={22} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <div className="divide-y px-2 sm:px-3" style={{ borderColor: acq.warmBeigeDeep }}>
          {ADS_BEGINNER_GUIDE.map((g, i) => {
            const open = openGuide === i;
            return (
              <div key={g.title} className="px-3">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 py-4 text-left transition"
                  onClick={() => setOpenGuide(open ? null : i)}
                  aria-expanded={open}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: open ? acq.terracotta : acq.active }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 font-serif text-base font-semibold sm:text-lg" style={{ color: acq.ink }}>
                    {g.title.replace(/^\d+\.\s*/, '')}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition duration-300 ${open ? 'rotate-180' : ''}`}
                    style={{ color: acq.muted }}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="pl-11 text-sm leading-relaxed" style={{ color: acq.muted }}>
                      {g.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </FloatingSection>

      {/* Créatives galerie */}
      <FloatingSection testId="ads-creatives-gallery">
        <SectionHead
          eyebrow="Bibliothèque"
          title="Créatives UGC"
          subtitle="Vraies images biblio + angles bénéfice FR/ES. Hover pour la profondeur."
          icon={<Sparkles size={22} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <div className="grid gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 sm:py-6 lg:grid-cols-3">
          {displayCreatives.map((c) => (
            <article
              key={c.id}
              className="group overflow-hidden rounded-[1.35rem] border bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              style={{ borderColor: acq.warmBeigeDeep, boxShadow: '0 10px 28px rgba(35,32,29,0.04)' }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {c.mediaPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.mediaPath.startsWith('/') ? c.mediaPath : `/${c.mediaPath}`}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center" style={{ backgroundColor: acq.warmBeige }}>
                    <Megaphone size={28} style={{ color: acq.muted }} />
                  </div>
                )}
                <div
                  className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent opacity-80"
                  aria-hidden
                />
              </div>
              <div className="p-4">
                <p className="font-serif text-base font-semibold" style={{ color: acq.ink }}>
                  {c.title}
                </p>
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed" style={{ color: acq.muted }}>
                  <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: acq.terracotta }}>
                    FR
                  </span>{' '}
                  {c.copyFr}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                  <span className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: acq.terracotta }}>
                    ES
                  </span>{' '}
                  {c.copyEs}
                </p>
                {c.complianceNotes ? (
                  <p className="mt-2 text-[11px]" style={{ color: '#b45309' }}>
                    Compliance : {c.complianceNotes}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </FloatingSection>

      {/* Multi-canal */}
      <FloatingSection>
        <SectionHead
          eyebrow="Multi-canal"
          title="Un canal bien avant d’éparpiller"
          subtitle="Meta phase 1. TikTok / Pinterest / Google = phase 2."
        />
        <div className="grid gap-4 px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-2">
          {ADS_CHANNEL_CARDS.map((ch) => (
            <div
              key={ch.id}
              className="rounded-[1.35rem] border p-4 transition hover:-translate-y-0.5"
              style={{
                borderColor: ch.phase === 1 ? 'rgba(196,93,62,0.35)' : acq.warmBeigeDeep,
                backgroundColor: ch.phase === 1 ? 'rgba(196,93,62,0.04)' : '#fff',
                boxShadow: ch.phase === 1 ? acq.shadowCard : undefined,
              }}
              data-testid={`ads-channel-${ch.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold" style={{ color: acq.ink }}>
                  {ch.name}
                </p>
                <StatusPill status={ch.status} />
              </div>
              {ch.phase === 2 ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium" style={{ color: '#b45309' }}>
                  <CircleDashed size={12} /> Recommandé quand Meta est rentabilisé
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                {ch.relevance}
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.ink }}>
                <strong>Pour activer :</strong> {ch.toActivate}
              </p>
            </div>
          ))}
        </div>
      </FloatingSection>
    </div>
  );
}
