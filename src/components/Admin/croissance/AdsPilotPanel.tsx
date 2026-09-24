'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Lock,
  Megaphone,
  Sparkles,
  Target,
} from 'lucide-react';

import { Card, CardHeader } from '@/components/acquisition/Card';
import { acq } from '@/components/acquisition/tokens';
import type { AdCampaign, AdCreative, AdsConnectionState, AdsPerformanceSummary } from '@/lib/acquisition/ads/config';
import {
  ADS_BEGINNER_GUIDE,
  ADS_CHANNEL_CARDS,
  ADS_COPY_ANGLES,
  ADS_FUNNEL_STEPS,
  STRATEGY_CAMPAIGN_BLUEPRINTS,
} from '@/lib/acquisition/ads/strategy-content';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';

type Props = {
  connection: AdsConnectionState;
  performance: AdsPerformanceSummary;
  campaigns: AdCampaign[];
  creatives: AdCreative[];
  schemaReady: boolean;
  onCreateDrafts: () => Promise<ActionResult>;
  onSyncInsights: () => Promise<ActionResult>;
  onSeedCreatives: () => Promise<ActionResult>;
  onActivate: (params: {
    campaignId: string;
    confirmStep1: boolean;
    confirmStep2: boolean;
    budgetCentsExact: number;
  }) => Promise<ActionResult>;
};

function formatEurFromCents(cents: number | null): string {
  if (cents == null) return '—';
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function StatusPill({ status }: { status: 'ready' | 'prepared' | 'off' | string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    ready: { label: 'Actif-ready', bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
    prepared: { label: 'Phase 2 · préparé', bg: 'rgba(245,158,11,0.14)', color: '#b45309' },
    off: { label: 'Off', bg: 'rgba(120,113,108,0.12)', color: acq.muted },
    draft: { label: 'Brouillon', bg: 'rgba(120,113,108,0.12)', color: acq.muted },
    active: { label: 'Active', bg: 'rgba(34,197,94,0.12)', color: '#15803d' },
    paused: { label: 'En pause', bg: 'rgba(245,158,11,0.14)', color: '#b45309' },
  };
  const m = map[status] ?? map.off!;
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

export function AdsPilotPanel({
  connection,
  performance,
  campaigns,
  creatives,
  schemaReady,
  onCreateDrafts,
  onSyncInsights,
  onSeedCreatives,
  onActivate,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activateId, setActivateId] = useState<string | null>(null);
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

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
    <div className="space-y-6" data-testid="ads-pilot-panel">
      {(flash || error) && (
        <div
          className="rounded-2xl px-4 py-3 text-sm"
          style={{
            backgroundColor: error ? 'rgba(220,38,38,0.08)' : 'rgba(34,197,94,0.1)',
            color: error ? '#b91c1c' : '#15803d',
          }}
          role="status"
        >
          {error ?? flash}
        </div>
      )}

      {/* Connexion / honnêteté */}
      <Card>
        <CardHeader
          eyebrow="Pilotage publicité"
          title="ADS / Publicité"
          subtitle="Centre stratégique — pas un bouton « boost 10 € ». Meta d’abord ; les autres canaux en phase 2."
        />
        <div
          className="flex flex-col gap-3 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'rgba(196,93,62,0.25)', backgroundColor: acq.terracottaSoft }}
          data-testid="ads-connection-banner"
        >
          <div className="flex items-start gap-3">
            {connection.connected ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} style={{ color: '#15803d' }} />
            ) : (
              <Lock className="mt-0.5 shrink-0" size={20} style={{ color: acq.terracotta }} />
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                {connection.connected ? 'Meta Ads connecté' : 'En attente connexion Meta Ads'}
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
              <p className="mt-2 text-xs" style={{ color: acq.muted }}>
                Setup pas-à-pas → <code className="rounded bg-white/80 px-1">docs/ADS-SETUP.md</code>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || !schemaReady}
              onClick={() => run(onSeedCreatives)}
              className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#fff', color: acq.ink, boxShadow: acq.shadowCard }}
            >
              Seed créatives
            </button>
            <button
              type="button"
              disabled={pending || !schemaReady}
              onClick={() => run(onCreateDrafts)}
              className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: acq.active }}
            >
              Créer 3 brouillons stratégie
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(onSyncInsights)}
              className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-50"
              style={{ backgroundColor: acq.warmBeige, color: acq.ink }}
            >
              Sync insights
            </button>
          </div>
        </div>
        {!schemaReady ? (
          <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: '#b91c1c' }}>
            <AlertTriangle size={16} /> Tables Ads absentes — migration additive requise.
          </p>
        ) : null}
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader
          eyebrow="Suivi"
          title="Performance (reliée au dashboard)"
          subtitle="CPL, CAC, dépense, leads — uniquement si Meta Ads est connecté et syncé. Sinon : état vide honnête."
        />
        {!performance.connected ? (
          <div
            className="rounded-2xl border border-dashed px-4 py-8 text-center"
            style={{ borderColor: acq.warmBeigeDeep, color: acq.muted }}
            data-testid="ads-metrics-waiting"
          >
            <p className="text-sm font-medium">En attente connexion Meta Ads</p>
            <p className="mt-1 text-xs">{performance.waitingMessage}</p>
            <p className="mt-3 text-xs">Aucun chiffre inventé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" data-testid="ads-metrics-grid">
            {[
              { label: 'Dépense 30 j', value: formatEurFromCents(performance.spendCents) },
              { label: 'Leads', value: performance.leads?.toLocaleString('fr-FR') ?? '—' },
              { label: 'Impressions', value: performance.impressions?.toLocaleString('fr-FR') ?? '—' },
              { label: 'CPL', value: formatEurFromCents(performance.cplCents) },
              { label: 'Coût / essai', value: formatEurFromCents(performance.costPerTrialCents) },
              { label: 'CAC', value: formatEurFromCents(performance.cacCents) },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl p-4" style={{ backgroundColor: acq.warmBeige }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: acq.muted }}>
                  {k.label}
                </p>
                <p className="mt-1 text-lg font-bold" style={{ color: acq.ink }}>
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        )}
        {performance.waitingMessage && performance.connected ? (
          <p className="mt-3 text-xs" style={{ color: acq.muted }}>
            {performance.waitingMessage}
          </p>
        ) : null}
      </Card>

      {/* Guide débutant */}
      <Card>
        <CardHeader
          eyebrow="Pédagogie"
          title="Guide pas-à-pas (débutant ads)"
          subtitle="Tirée de docs/STRATEGIE_CROISSANCE.md — aimant quiz, funnel froid/warm/hot, copy bénéfice, compliance."
          action={<BookOpen size={20} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <ol className="space-y-4">
          {ADS_BEGINNER_GUIDE.map((g, i) => (
            <li key={g.title} className="flex gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: acq.terracotta }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                  {g.title.replace(/^\d+\.\s*/, '')}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed" style={{ color: acq.muted }}>
                  {g.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {ADS_FUNNEL_STEPS.map((s) => (
            <div key={s.step} className="rounded-2xl p-3" style={{ backgroundColor: acq.zoneInner }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: acq.terracotta }}>
                Étape {s.step}
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: acq.ink }}>
                {s.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: acq.muted }}>
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* 3 campagnes */}
      <Card>
        <CardHeader
          eyebrow="Recommandation"
          title="3 campagnes pré-remplies"
          subtitle="Parcours Ad → quiz → e-mail → nurture → essai → 39 €. Budgets test indicatifs — activation manuelle uniquement."
          action={<Target size={20} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {STRATEGY_CAMPAIGN_BLUEPRINTS.map((bp) => (
            <div
              key={bp.id}
              className="rounded-2xl border p-4"
              style={{ borderColor: acq.warmBeigeDeep, backgroundColor: '#fff' }}
              data-testid={`ads-blueprint-${bp.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold" style={{ color: acq.ink }}>
                  {bp.labelFr}
                </p>
                <StatusPill status="draft" />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: acq.muted }}>
                {bp.labelEs}
              </p>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: acq.muted }}>
                <strong style={{ color: acq.ink }}>Audience :</strong> {bp.audience}
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                <strong style={{ color: acq.ink }}>Offre :</strong> {bp.offer}
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                {bp.why}
              </p>
              <p className="mt-3 text-sm font-semibold" style={{ color: acq.terracotta }}>
                ~{bp.suggestedDailyBudgetEur} € / jour (test)
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Campagnes CRM + activation */}
      <Card>
        <CardHeader
          eyebrow="Garde-fou budget"
          title="Campagnes (CRM)"
          subtitle="Création = brouillon uniquement. Activer = double confirmation + budget quotidien saisi exactement."
        />
        {campaigns.length === 0 ? (
          <p className="text-sm" style={{ color: acq.muted }}>
            Aucune campagne en base. Clique « Créer 3 brouillons stratégie ».
          </p>
        ) : (
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: acq.warmBeigeDeep }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                      {c.name}
                    </p>
                    <StatusPill status={c.status} />
                  </div>
                  <p className="mt-1 text-xs" style={{ color: acq.muted }}>
                    {c.objective} · budget{' '}
                    {c.dailyBudgetCents != null ? `${(c.dailyBudgetCents / 100).toFixed(2)} €/j` : '—'}
                    {c.metaCampaignId ? ` · Meta ${c.metaCampaignId}` : ' · local only'}
                  </p>
                </div>
                {c.status === 'draft' || c.status === 'paused' ? (
                  <button
                    type="button"
                    className="rounded-full px-4 py-2 text-xs font-semibold text-white"
                    style={{ backgroundColor: acq.terracotta }}
                    onClick={() => {
                      setActivateId(c.id);
                      setConfirm1(false);
                      setConfirm2(false);
                      setBudgetInput(c.dailyBudgetCents != null ? (c.dailyBudgetCents / 100).toFixed(2) : '');
                      setError(null);
                    }}
                  >
                    Activer (confirm. humaine)…
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {activateTarget ? (
          <div
            className="mt-4 rounded-2xl border-2 p-4"
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
                placeholder="ex. 15.00"
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
      </Card>

      {/* Créatives */}
      <Card>
        <CardHeader
          eyebrow="Bibliothèque"
          title="Créatives UGC / Reels"
          subtitle="Base = vraies images bibliothèque (coaching visio, portraits, mat). Angles copy bénéfice FR/ES prêts. Reels CM = à importer comme média pub."
          action={<Sparkles size={20} style={{ color: acq.terracotta }} aria-hidden />}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayCreatives.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: acq.warmBeigeDeep }}
            >
              {c.mediaPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.mediaPath.startsWith('/') ? c.mediaPath : `/${c.mediaPath}`}
                  alt=""
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 items-center justify-center" style={{ backgroundColor: acq.warmBeige }}>
                  <Megaphone size={28} style={{ color: acq.muted }} />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                  {c.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                  <span className="font-semibold text-[10px] uppercase tracking-wider">FR</span> — {c.copyFr}
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: acq.muted }}>
                  <span className="font-semibold text-[10px] uppercase tracking-wider">ES</span> — {c.copyEs}
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
      </Card>

      {/* Multi-canal */}
      <Card>
        <CardHeader
          eyebrow="Multi-canal"
          title="Canaux — un bien avant d’éparpiller"
          subtitle="Meta mis en avant. TikTok / Pinterest / Google = phase 2, clairement « recommandé quand Meta est rentabilisé »."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {ADS_CHANNEL_CARDS.map((ch) => (
            <div
              key={ch.id}
              className="rounded-2xl border p-4"
              style={{
                borderColor: ch.phase === 1 ? 'rgba(196,93,62,0.35)' : acq.warmBeigeDeep,
                backgroundColor: ch.phase === 1 ? 'rgba(196,93,62,0.04)' : '#fff',
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
      </Card>
    </div>
  );
}
