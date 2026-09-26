'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Compass,
  Flame,
  Gauge,
  Lightbulb,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import type { ActionPlanItem } from '@/lib/acquisition/ads/action-plan';
import type { AdsAlert } from '@/lib/acquisition/ads/alerts';
import type { AdCampaign, AdCreative, AdsPerformanceSummary } from '@/lib/acquisition/ads/config';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import type { SituationBrief } from '@/lib/acquisition/ads/situation-brief';
import {
  CREATIVE_STATUSES,
  CREATIVE_STATUS_LABELS,
  KILL_SPEND_CENTS,
  buildCreativePipeline,
  computeNextAction,
  matchCampaignInsight,
  type CampaignTemperature,
  type CreativeStatus,
  type PipelineItem,
} from '@/lib/acquisition/ads/stats-compute';
import {
  ADS_BEGINNER_GUIDE,
  ADS_CHANNEL_CARDS,
  ADS_FUNNEL_STEPS,
  STRATEGY_CAMPAIGN_BLUEPRINTS,
} from '@/lib/acquisition/ads/strategy-content';
import type { AdsSubTab, AdsUiLang } from '@/lib/acquisition/ads/ads-glossary';
import { AdsCard, AdsJourney, AdsTermHint, Collapsible, adsTone, eur, num, pct } from './ads-ui';

type Props = {
  intelligence: IntelligenceBundle;
  performance: AdsPerformanceSummary;
  campaigns: AdCampaign[];
  displayCreatives: AdCreative[];
  actionPlan: ActionPlanItem[];
  situationBrief: SituationBrief | null;
  creativeStatuses: Record<string, CreativeStatus>;
  pending: boolean;
  run: (action: () => Promise<ActionResult>, onOk?: (r: ActionResult & { ok: true }) => void) => void;
  onFullSync: () => Promise<ActionResult>;
  onCreateColdDraft: () => Promise<ActionResult>;
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
  onError: (msg: string) => void;
  lang?: AdsUiLang;
  onGoTo?: (sub: AdsSubTab) => void;
};

const TEMP: Record<CampaignTemperature, { accent: string; soft: string; label: string; fatigue: number; fatigueLabel: string }> = {
  froid: { accent: '#3B6EA8', soft: 'rgba(59,110,168,0.09)', label: 'Froid', fatigue: 4, fatigueLabel: 'usure > 3–4' },
  warm: { accent: '#C98A1E', soft: 'rgba(201,138,30,0.10)', label: 'Tiède', fatigue: 7, fatigueLabel: 'usure > 5–7' },
  hot: { accent: acq.terracotta, soft: 'rgba(196,93,62,0.10)', label: 'Chaude', fatigue: 7, fatigueLabel: 'usure > 5–7' },
};

const BLUEPRINT_TEMP: Record<string, CampaignTemperature> = {
  cold_quiz: 'froid',
  warm_retarget: 'warm',
  hot_trial: 'hot',
};

const STATUS_STYLE: Record<CreativeStatus, { bg: string; color: string; dot: string }> = {
  a_creer: { bg: acq.warmBeige, color: acq.ink, dot: '#B9A89A' },
  brouillon: { bg: 'rgba(245,158,11,0.14)', color: '#92400e', dot: '#F59E0B' },
  en_test: { bg: 'rgba(59,110,168,0.12)', color: '#1e3a8a', dot: '#3B6EA8' },
  gagnante: { bg: adsTone.goodSoft, color: adsTone.good, dot: adsTone.good },
  a_couper: { bg: adsTone.badSoft, color: adsTone.bad, dot: adsTone.bad },
};

function CampaignStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    draft: { label: 'Brouillon local', bg: 'rgba(120,113,108,0.14)', color: acq.muted },
    paused: { label: 'En pause · 0 €', bg: 'rgba(245,158,11,0.16)', color: '#b45309' },
    active: { label: 'Allumée · dépense', bg: 'rgba(34,197,94,0.14)', color: '#15803d' },
    archived: { label: 'Archivée', bg: 'rgba(120,113,108,0.1)', color: acq.mutedLight },
  };
  const m = map[status] ?? map.draft!;
  return (
    <span className="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function Gauge2({ label, value, max, threshold, display, warnLabel }: { label: string; value: number | null; max: number; threshold: number; display: string; warnLabel: string }) {
  const ratio = value == null ? 0 : Math.min(1, value / max);
  const over = value != null && value >= threshold;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="font-semibold" style={{ color: acq.muted }}>
          {label}
        </span>
        <span className="tabular-nums font-semibold" style={{ color: over ? adsTone.bad : acq.ink }}>
          {display}
        </span>
      </div>
      <div className="relative mt-1 h-2 rounded-full" style={{ backgroundColor: acq.warmBeige }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(value == null ? 0 : 3, ratio * 100)}%`, backgroundColor: over ? adsTone.bad : acq.terracotta }} />
        <span className="absolute top-[-3px] h-[14px] w-[2px] rounded" style={{ left: `${(threshold / max) * 100}%`, backgroundColor: acq.ink, opacity: 0.45 }} title={warnLabel} />
      </div>
      <p className="mt-0.5 text-[10px]" style={{ color: acq.mutedLight }}>
        {warnLabel}
      </p>
    </div>
  );
}

function budgetAlerts(campaigns: AdCampaign[], intelligence: IntelligenceBundle): AdsAlert[] {
  const out: AdsAlert[] = [];
  const active = campaigns.filter((c) => c.status === 'active');
  const activeBudget = active.reduce((s, c) => s + (c.dailyBudgetCents ?? 0), 0);
  const lastDay = intelligence.trends[intelligence.trends.length - 1];
  if (active.length && lastDay && activeBudget > 0 && lastDay.spendCents > activeBudget * 1.25) {
    out.push({
      id: 'budget-over',
      severity: 'warning',
      kind: 'data',
      title: 'Dépense du jour au-dessus du budget prévu',
      detail: `${eur(lastDay.spendCents)} dépensés le ${lastDay.metricDate} pour ${eur(activeBudget)}/j prévus (Meta peut dépasser de 25 % un jour donné).`,
      entityId: null,
      entityName: null,
    });
  }
  if (active.length && intelligence.adsTotals.spendCents === 0) {
    out.push({
      id: 'budget-no-delivery',
      severity: 'warning',
      kind: 'data',
      title: 'Campagne active mais 0 € dépensé',
      detail: 'Vérifie le moyen de paiement Meta et la validation de la pub (revue Meta 24 h max).',
      entityId: null,
      entityName: null,
    });
  }
  if (!active.length) {
    out.push({
      id: 'budget-none',
      severity: 'info',
      kind: 'data',
      title: 'Budget engagé : 0 €/jour',
      detail: 'Aucune campagne active. Toute activation passe par la double confirmation ci-dessous.',
      entityId: null,
      entityName: null,
    });
  } else {
    out.push({
      id: 'budget-live',
      severity: 'info',
      kind: 'data',
      title: `Budget engagé : ${eur(activeBudget)}/jour`,
      detail: `${active.length} campagne(s) active(s) · ≈ ${eur(activeBudget * 30)} sur 30 jours si rien ne change.`,
      entityId: null,
      entityName: null,
    });
  }
  return out;
}

export function AdsExecutionPanel({
  intelligence,
  performance,
  campaigns,
  displayCreatives,
  actionPlan,
  situationBrief,
  creativeStatuses,
  pending,
  run,
  onFullSync,
  onCreateColdDraft,
  onRefreshCreative,
  onReloadCoach,
  onRegenerateBrief,
  onSetCreativeStatus,
  onActivate,
  onError,
  lang = 'fr',
  onGoTo,
}: Props) {
  const [brief, setBrief] = useState<SituationBrief | null>(situationBrief);
  const [statuses, setStatuses] = useState<Record<string, CreativeStatus>>(creativeStatuses);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const insights = intelligence.campaigns;
  const pipeline = useMemo(
    () => buildCreativePipeline({ plan: actionPlan, campaigns, insights, alerts: intelligence.alerts, manualStatuses: statuses }),
    [actionPlan, campaigns, insights, intelligence.alerts, statuses],
  );
  const next = computeNextAction({
    lastSyncAt: intelligence.lastSyncAt,
    alerts: intelligence.alerts,
    campaigns,
    pipeline,
    totalSpendCents: intelligence.adsTotals.spendCents,
  });
  const liveAlerts = [
    ...intelligence.alerts.filter((a) => a.kind !== 'data'),
    ...budgetAlerts(campaigns, intelligence),
    ...intelligence.alerts.filter((a) => a.kind === 'data'),
  ];
  const activateTarget = campaigns.find((c) => c.id === activateId) ?? null;

  function openActivation(c: AdCampaign) {
    setActivateId(c.id);
    setConfirm1(false);
    setConfirm2(false);
    setBudgetInput(c.dailyBudgetCents != null ? (c.dailyBudgetCents / 100).toFixed(2) : '');
  }

  function runNext() {
    switch (next.cta) {
      case 'sync':
        return run(onFullSync);
      case 'create_cold_draft':
        return run(onCreateColdDraft);
      case 'refresh':
        return run(() => onRefreshCreative({ entityName: next.entityName }));
      case 'plan':
        return run(onReloadCoach);
      case 'activate': {
        const c = campaigns.find((x) => x.id === next.campaignId);
        if (c) openActivation(c);
        document.getElementById('ads-exec-campaigns')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      case 'produce':
        document.getElementById('ads-exec-pipeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      default:
        return;
    }
  }

  const nextCtaLabel: Record<typeof next.cta, string | null> = {
    sync: 'Synchroniser maintenant',
    create_cold_draft: 'Créer le brouillon en pause',
    refresh: 'Préparer une créative de remplacement',
    plan: 'Régénérer le plan',
    activate: 'Ouvrir la double confirmation',
    produce: 'Voir la créative à produire',
    wait: null,
  };

  function setStatus(item: PipelineItem, status: CreativeStatus | 'auto') {
    const value = status === 'auto' ? null : status;
    run(
      () => onSetCreativeStatus({ itemId: item.id, status: value }),
      (r) => {
        const data = r.data as { statuses?: Record<string, CreativeStatus> } | undefined;
        if (data?.statuses) setStatuses(data.statuses);
      },
    );
  }

  const counts = CREATIVE_STATUSES.map((s) => ({ s, n: pipeline.filter((p) => p.status === s).length }));

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-tab-execution">
      {/* ── 1. Lecture de situation ───────────────────────── */}
      <AdsCard
        tone="ink"
        eyebrow={lang === 'es' ? 'Paso 4 · Tablero' : 'Étape 4 · Tableau de bord'}
        title={lang === 'es' ? 'Dónde estás, qué dice el mercado, qué cuenta' : 'Où tu en es, ce que dit le marché, ce qui compte'}
        subtitle={
          brief
            ? `${brief.source === 'ai' ? (lang === 'es' ? `Redactado por ${brief.provider}` : `Rédigé par ${brief.provider}`) : lang === 'es' ? 'Lectura automática' : 'Lecture automatique'} · ${lang === 'es' ? 'acotado a tus documentos + cifras' : 'borné à tes documents + tes chiffres'} · ${new Intl.DateTimeFormat(lang === 'es' ? 'es-MX' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(brief.updatedAt))}`
            : lang === 'es'
              ? 'Aún no hay lectura — lanza una sincro.'
              : 'Pas encore de lecture — lance une synchro.'
        }
        right={
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(onRegenerateBrief, (r) => {
                const d = r.data as { brief?: SituationBrief } | undefined;
                if (d?.brief) setBrief(d.brief);
              })
            }
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
            style={{ backgroundColor: 'rgba(255,250,245,0.1)', color: '#FFFAF5' }}
            data-testid="ads-exec-brief-regen"
          >
            <RefreshCw size={13} /> Relire
          </button>
        }
        testId="ads-exec-brief"
      >
        {onGoTo ? (
          <div className="mb-4">
            <AdsJourney current="execution" lang={lang} onGo={onGoTo} />
          </div>
        ) : null}
        {brief ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {(
                [
                  { k: 'Où tu en es', v: brief.whereYouAre, icon: <Compass size={15} /> },
                  { k: 'Ce que dit le marché', v: brief.marketSays, icon: <Lightbulb size={15} /> },
                  { k: 'Priorité', v: brief.priority, icon: <Target size={15} /> },
                ] as const
              ).map((b, i) => (
                <div
                  key={b.k}
                  className="rounded-[1.25rem] p-4"
                  style={{ backgroundColor: i === 2 ? 'rgba(196,93,62,0.22)' : 'rgba(255,250,245,0.06)', border: `1px solid ${i === 2 ? 'rgba(196,93,62,0.5)' : 'rgba(255,250,245,0.08)'}` }}
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: i === 2 ? '#F2B8A4' : 'rgba(255,250,245,0.55)' }}>
                    {b.icon}
                    {b.k}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: '#FFFAF5' }}>
                    {b.v}
                  </p>
                </div>
              ))}
            </div>
            {brief.note ? (
              <p className="mt-3 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#FCD34D' }} data-testid="ads-exec-brief-note">
                {brief.note}
              </p>
            ) : null}
          </>
        ) : null}
      </AdsCard>

      {/* ── 5. Prochaine action (mise en avant) ───────────── */}
      <section
        className="relative overflow-hidden rounded-[1.75rem] border-2 p-5 sm:p-6"
        style={{ borderColor: acq.terracotta, background: 'linear-gradient(135deg,#FFFFFF 0%,#FFF1EA 100%)', boxShadow: acq.shadowCard }}
        data-testid="ads-exec-next-action"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl" style={{ backgroundColor: acq.terracotta }} aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
              Prochaine action · une seule
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold leading-snug sm:text-2xl" style={{ color: acq.ink }}>
              {next.title}
            </h3>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed" style={{ color: acq.muted }}>
              {next.why}
            </p>
          </div>
          {nextCtaLabel[next.cta] ? (
            <button
              type="button"
              disabled={pending}
              onClick={runNext}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: acq.terracotta, boxShadow: '0 12px 28px rgba(196,93,62,0.35)' }}
              data-testid="ads-exec-next-cta"
            >
              {nextCtaLabel[next.cta]} <ArrowRight size={16} />
            </button>
          ) : null}
        </div>
      </section>

      {/* ── 4. Alertes live ───────────────────────────────── */}
      <AdsCard
        eyebrow="Alertes live"
        title={lang === 'es' ? 'Desgaste · cortar · presupuesto' : 'Usure · couper · budget'}
        subtitle={
          lang === 'es'
            ? 'Frecuencia frío > 3–4, reimpacto > 5–7 · cortar a las 48–72 h o 50–100 € sin resultado.'
            : 'Fréquence froid > 3–4, reciblage > 5–7 · couper après 48–72 h ou 50–100 € sans résultat.'
        }
        icon={<Gauge size={18} />}
        testId="ads-execution-alerts"
      >
        <ul className="grid gap-2 md:grid-cols-2">
          {liveAlerts.slice(0, 8).map((a) => {
            const tone =
              a.severity === 'critical'
                ? { b: 'rgba(185,28,28,0.35)', bg: adsTone.badSoft, c: adsTone.bad }
                : a.severity === 'warning'
                  ? { b: 'rgba(245,158,11,0.4)', bg: adsTone.warnSoft, c: adsTone.warn }
                  : { b: acq.warmBeigeDeep, bg: '#fff', c: acq.ink };
            return (
              <li key={a.id} className="rounded-2xl border px-3.5 py-3" style={{ borderColor: tone.b, backgroundColor: tone.bg }} data-testid={`ads-alert-${a.id}`}>
                <p className="flex items-start gap-2 text-sm font-semibold" style={{ color: tone.c }}>
                  {a.severity === 'info' ? <Sparkles size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                  {a.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: acq.muted }}>
                  {a.detail}
                </p>
                {a.kind === 'fatigue' || a.kind === 'kill' ? (
                  <button type="button" className="mt-2 text-xs font-semibold underline" style={{ color: acq.terracotta }} onClick={() => run(() => onRefreshCreative({ entityName: a.entityName }))}>
                    {lang === 'es' ? 'Preparar un anuncio de recambio (0 €)' : 'Préparer un film de remplacement (0 €)'}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </AdsCard>

      {/* ── 2. Campagnes froid / warm / hot ──────────────── */}
      <div id="ads-exec-campaigns">
        <AdsCard
          eyebrow="Campagnes · données réelles 30 j"
          title={lang === 'es' ? 'Frío → Tibio → Caliente' : 'Froid → Tiède → Chaude'}
          subtitle={
            lang === 'es'
              ? 'Cada tarjeta cruza la campaña, su borrador Meta y las cifras. Activar = doble confirmación humana.'
              : 'Chaque carte croise la campagne, son brouillon Meta et les chiffres. Activation = double confirmation humaine.'
          }
          icon={<Megaphone size={18} />}
          testId="ads-campaign-cards"
        >
          <p className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]" style={{ color: acq.muted }}>
            <AdsTermHint term="cpl" lang={lang} />
            <AdsTermHint term="ctr" lang={lang} />
            <AdsTermHint term="paused" lang={lang} />
            <AdsTermHint term="retarget" lang={lang} />
          </p>
          <div className="grid gap-4 lg:grid-cols-3">
            {STRATEGY_CAMPAIGN_BLUEPRINTS.map((bp) => {
              const temp = BLUEPRINT_TEMP[bp.id] ?? 'froid';
              const vibe = TEMP[temp];
              const crm = campaigns.find((c) => c.objective === bp.id && c.metaCampaignId) ?? campaigns.find((c) => c.objective === bp.id);
              const ins = crm ? matchCampaignInsight(crm, insights) : null;
              const spend = ins?.spendCents ?? 0;
              return (
                <article
                  key={bp.id}
                  data-testid={`ads-blueprint-${bp.id}`}
                  className="flex flex-col overflow-hidden rounded-[1.5rem] border bg-white"
                  style={{ borderColor: acq.warmBeigeDeep, background: `linear-gradient(170deg, ${vibe.soft} 0%, #fff 42%)` }}
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: vibe.accent }} />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: vibe.accent }}>
                          {vibe.label}
                        </p>
                        <h4 className="mt-1 font-serif text-lg font-semibold leading-snug" style={{ color: acq.ink }}>
                          {(lang === 'es' ? bp.labelEs : bp.labelFr).replace(/^(Froid|Warm|Hot|Frío|Tibio|Caliente)\s*[—–-]\s*/i, '')}
                        </h4>
                      </div>
                      <CampaignStatusPill status={crm?.status ?? 'draft'} />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                      {bp.why}
                    </p>

                    <dl className="mt-4 grid grid-cols-2 gap-2">
                      {[
                        ['Dépense', eur(spend)],
                        ['Leads', num(ins?.leads ?? 0)],
                        ['CPL', eur(ins?.cplCents ?? null)],
                        ['CTR', pct(ins?.ctr ?? null, 2)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl px-3 py-2" style={{ backgroundColor: acq.cream }}>
                          <dt className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: acq.muted }}>
                            {k}
                          </dt>
                          <dd className="font-serif text-lg font-semibold tabular-nums" style={{ color: acq.ink }}>
                            {v}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-4 space-y-3">
                      <Gauge2
                        label="Fréquence"
                        value={ins?.frequency ?? null}
                        max={temp === 'froid' ? 6 : 9}
                        threshold={temp === 'froid' ? 3.5 : 5.5}
                        display={ins?.frequency != null ? ins.frequency.toFixed(2) : '—'}
                        warnLabel={vibe.fatigueLabel}
                      />
                      <Gauge2
                        label="Dépense sans lead"
                        value={ins && ins.leads === 0 ? spend / 100 : 0}
                        max={100}
                        threshold={KILL_SPEND_CENTS / 100}
                        display={ins && ins.leads === 0 ? eur(spend) : '0 €'}
                        warnLabel="kill dès 50–100 € sans lead"
                      />
                    </div>

                    <div className="mt-auto pt-5">
                      <p className="font-serif text-2xl font-semibold" style={{ color: vibe.accent }}>
                        {crm?.dailyBudgetCents != null ? (crm.dailyBudgetCents / 100).toFixed(0) : bp.suggestedDailyBudgetEur} €
                        <span className="ml-1 font-sans text-sm" style={{ color: acq.muted }}>
                          / jour prévu
                        </span>
                      </p>
                      {crm && crm.metaCampaignId && (crm.status === 'draft' || crm.status === 'paused') ? (
                        <button
                          type="button"
                          className="mt-3 w-full rounded-full px-4 py-2.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: acq.ink }}
                          onClick={() => openActivation(crm)}
                          data-testid={`ads-activate-open-${bp.id}`}
                        >
                          Activer (double confirmation)…
                        </button>
                      ) : null}
                      <p className="mt-2 text-[11px]" style={{ color: acq.mutedLight }}>
                        {crm?.metaCampaignId
                          ? `Meta ${crm.metaCampaignId}`
                          : crm
                            ? 'Brouillon local — à pousser sur Meta avant toute activation'
                            : 'Pas encore de brouillon'}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {activateTarget ? (
            <div className="mt-5 rounded-[1.25rem] border-2 p-4 sm:p-5" style={{ borderColor: acq.terracotta, backgroundColor: 'rgba(196,93,62,0.06)' }} data-testid="ads-activate-guard">
              <p className="flex items-center gap-2 text-sm font-bold" style={{ color: acq.ink }}>
                <AlertTriangle size={16} style={{ color: acq.terracotta }} />
                Double confirmation — budget réel
              </p>
              <p className="mt-2 text-sm" style={{ color: acq.muted }}>
                Activer <strong>{activateTarget.name}</strong> à{' '}
                <strong>{activateTarget.dailyBudgetCents != null ? `${(activateTarget.dailyBudgetCents / 100).toFixed(2)} €` : '—'}</strong>/j
                {activateTarget.dailyBudgetCents != null ? ` (≈ ${eur(activateTarget.dailyBudgetCents * 30)} sur 30 j)` : ''}.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={confirm1} onChange={(e) => setConfirm1(e.target.checked)} data-testid="ads-activate-confirm1" />
                Je confirme avoir lu le budget.
              </label>
              <label className="mt-2 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={confirm2} onChange={(e) => setConfirm2(e.target.checked)} data-testid="ads-activate-confirm2" />
                Je confirme une 2ᵉ fois (pas de dépense auto).
              </label>
              <label className="mt-3 block text-xs font-semibold" style={{ color: acq.muted }}>
                Resaisis le budget (€)
                <input
                  type="text"
                  inputMode="decimal"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: acq.warmBeigeDeep }}
                  data-testid="ads-activate-budget"
                />
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
                      onError('Budget invalide.');
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
        </AdsCard>
      </div>

      {/* ── 3. Créatives à produire ───────────────────────── */}
      <div id="ads-exec-pipeline">
        <AdsCard
          eyebrow="Créatives · depuis le Plan d’action"
          title="Du tournage au verdict"
          subtitle="Statut auto pour les campagnes (chiffres Meta + critères de kill) ; statut manuel pour les créatives du plan. Gagnante = ≥ 3 leads à ≤ 12 € le lead."
          icon={<Flame size={18} />}
          testId="ads-exec-pipeline"
        >
          <div className="flex flex-wrap gap-2" data-testid="ads-exec-pipeline-counts">
            {counts.map(({ s, n }) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: STATUS_STYLE[s].bg, color: STATUS_STYLE[s].color }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_STYLE[s].dot }} />
                {CREATIVE_STATUS_LABELS[s]} · {n}
              </span>
            ))}
          </div>
          <ul className="mt-4 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {pipeline.map((p) => (
              <li key={p.id} className="flex flex-col rounded-[1.25rem] border bg-white p-4" style={{ borderColor: acq.warmBeigeDeep }} data-testid={`ads-exec-creative-${p.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: acq.mutedLight }}>
                    {p.kind === 'plan' ? 'Plan d’action' : 'Campagne'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: STATUS_STYLE[p.status].bg, color: STATUS_STYLE[p.status].color }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_STYLE[p.status].dot }} />
                    {CREATIVE_STATUS_LABELS[p.status]}
                  </span>
                </div>
                <p className="mt-2 font-serif text-base font-semibold leading-snug" style={{ color: acq.ink }}>
                  {p.title}
                </p>
                <p className="mt-1 text-xs" style={{ color: acq.muted }}>
                  {p.detail}
                </p>
                {p.kind === 'campaign' ? (
                  <p className="mt-2 text-xs tabular-nums" style={{ color: acq.ink }}>
                    {eur(p.spendCents)} · {num(p.leads)} lead(s) · CPL {eur(p.cplCents)} · fréq. {p.frequency != null ? p.frequency.toFixed(2) : '—'}
                  </p>
                ) : null}
                <label className="mt-auto flex items-center gap-2 pt-3 text-[11px] font-semibold" style={{ color: acq.muted }}>
                  Statut
                  <select
                    className="flex-1 rounded-full border bg-white px-2.5 py-1 text-xs"
                    style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}
                    value={p.statusSource === 'manuel' ? p.status : 'auto'}
                    disabled={pending}
                    onChange={(e) => setStatus(p, e.target.value as CreativeStatus | 'auto')}
                    data-testid={`ads-exec-creative-status-${p.id}`}
                  >
                    <option value="auto">{p.statusSource === 'auto' ? `Auto · ${CREATIVE_STATUS_LABELS[p.status]}` : 'Revenir en auto'}</option>
                    {CREATIVE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {CREATIVE_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
          {pipeline.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: acq.muted }}>
              Aucun élément — régénère le Plan d’action.
            </p>
          ) : null}
        </AdsCard>
      </div>

      {/* ── Détails secondaires (repliés) ───────────────── */}
      <div className="grid gap-3" data-testid="ads-exec-secondary">
        <Collapsible title="KPIs CRM (argent)" meta="Dépense, leads, CPL, CAC, coût par essai" testId="ads-metrics-section">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6" data-testid="ads-metrics-grid">
            {[
              { label: 'Dépense', value: eur(performance.spendCents) },
              { label: 'Leads', value: num(performance.leads) },
              { label: 'CPL', value: eur(performance.cplCents) },
              { label: 'CAC', value: eur(performance.cacCents) },
              { label: 'Impressions', value: num(performance.impressions) },
              { label: 'Coût essai', value: eur(performance.costPerTrialCents) },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border p-3" style={{ borderColor: acq.warmBeigeDeep }}>
                <p className="text-[10px] font-semibold uppercase" style={{ color: acq.muted }}>
                  {k.label}
                </p>
                <p className="mt-1 font-serif text-lg font-semibold" style={{ color: acq.ink }}>
                  {performance.connected ? k.value : '—'}
                </p>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Funnel FitMangas" meta="Pub → quiz → nurture → essai 7 j → 39 €" testId="ads-funnel-visual">
          <ol className="flex flex-col gap-2.5 md:flex-row">
            {ADS_FUNNEL_STEPS.map((s) => (
              <li key={s.step} className="flex-1 rounded-2xl border p-3" style={{ borderColor: acq.warmBeigeDeep, backgroundColor: acq.cream }}>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: acq.terracotta }}>
                  {s.step}
                </span>
                <p className="mt-2 text-sm font-semibold" style={{ color: acq.ink }}>
                  {s.title}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: acq.muted }}>
                  {s.detail}
                </p>
              </li>
            ))}
          </ol>
        </Collapsible>

        <Collapsible title="Bibliothèque de créatives UGC" meta={`${displayCreatives.length} angle(s) prêts`} testId="ads-creatives-gallery">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayCreatives.map((c) => (
              <article key={c.id} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: acq.warmBeigeDeep }}>
                {c.mediaPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.mediaPath.startsWith('/') ? c.mediaPath : `/${c.mediaPath}`} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                ) : null}
                <div className="p-3">
                  <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                    {c.title}
                  </p>
                  <p className="mt-1 line-clamp-3 text-xs" style={{ color: acq.muted }}>
                    {c.copyFr}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Guide débutant" meta="Les bases avant d’activer" testId="ads-beginner-guide">
          <ol className="space-y-3">
            {ADS_BEGINNER_GUIDE.map((g, i) => (
              <li key={g.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: acq.ink }}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                    {g.title.replace(/^\d+\.\s*/, '')}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: acq.muted }}>
                    {g.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Collapsible>

        <Collapsible title="Autres canaux" meta="Un canal bien avant d’éparpiller" testId="ads-channels">
          <div className="grid gap-2.5 md:grid-cols-2">
            {ADS_CHANNEL_CARDS.map((ch) => (
              <div key={ch.id} data-testid={`ads-channel-${ch.id}`} className="rounded-2xl border p-3" style={{ borderColor: ch.phase === 1 ? 'rgba(196,93,62,0.35)' : acq.warmBeigeDeep }}>
                <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: acq.ink }}>
                  <BookOpen size={13} style={{ color: acq.terracotta }} />
                  {ch.name}
                  <span className="text-[10px] font-semibold" style={{ color: acq.muted }}>
                    · phase {ch.phase}
                  </span>
                </p>
                <p className="mt-1 text-xs" style={{ color: acq.muted }}>
                  {ch.relevance}
                </p>
              </div>
            ))}
          </div>
        </Collapsible>
      </div>
    </div>
  );
}