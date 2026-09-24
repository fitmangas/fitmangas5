'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import type { CoachAdvice } from '@/lib/acquisition/ads/coach';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';

type Props = {
  intelligence: IntelligenceBundle;
  coachAdvice: CoachAdvice[];
  coachNote: string | null;
  onFullSync: () => Promise<ActionResult>;
  onBoostOrganic: (params: { igMediaId: string; captionHint?: string }) => Promise<ActionResult>;
  onRefreshCreative: (params: { entityName?: string | null }) => Promise<ActionResult>;
  onCreateColdDraft: () => Promise<ActionResult>;
  onReloadCoach: () => Promise<ActionResult>;
};

const META_BILLING =
  'https://business.facebook.com/billing_hub/payment_settings?business_id=1015050482234942&asset_id=1070085439154384';

function eur(cents: number | null | undefined): string {
  if (cents == null) return '0 €';
  return `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function num(n: number | null | undefined): string {
  if (n == null) return '0';
  return n.toLocaleString('fr-FR');
}

function formatSync(iso: string | null): string {
  if (!iso) return 'jamais';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Card({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <section
      data-testid={testId}
      className="overflow-hidden rounded-[1.75rem] border bg-white/90 backdrop-blur-sm"
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

function Head({
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

function MiniBars({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-28 items-end gap-1.5" data-testid="ads-trend-bars">
      {values.map((v, i) => (
        <div key={`${labels[i]}-${i}`} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max(4, (v / max) * 100)}%`,
              background: `linear-gradient(180deg, ${acq.terracotta} 0%, #E8A090 100%)`,
              minHeight: 4,
            }}
            title={`${labels[i]}: ${v}`}
          />
          <span className="hidden text-[9px] sm:block" style={{ color: acq.mutedLight }}>
            {labels[i]?.slice(5) ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; spendCents: number; impressions: number; clicks: number; leads: number; ctr: number | null }>;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: acq.warmBeigeDeep, backgroundColor: acq.cream }}>
      <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: acq.terracotta }}>
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm" style={{ color: acq.muted }}>
          0 — aucune donnée (sync OK ou trop tôt).
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-xs">
            <thead>
              <tr style={{ color: acq.muted }}>
                <th className="pb-2 font-medium">Clé</th>
                <th className="pb-2 font-medium">Spend</th>
                <th className="pb-2 font-medium">Imp.</th>
                <th className="pb-2 font-medium">Clics</th>
                <th className="pb-2 font-medium">Leads</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((r) => (
                <tr key={r.key} className="border-t" style={{ borderColor: 'rgba(232,223,212,0.8)' }}>
                  <td className="py-2 font-medium" style={{ color: acq.ink }}>
                    {r.key}
                  </td>
                  <td className="py-2">{eur(r.spendCents)}</td>
                  <td className="py-2">{num(r.impressions)}</td>
                  <td className="py-2">{num(r.clicks)}</td>
                  <td className="py-2">{num(r.leads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdsIntelligenceHub({
  intelligence,
  coachAdvice,
  coachNote,
  onFullSync,
  onBoostOrganic,
  onRefreshCreative,
  onCreateColdDraft,
  onReloadCoach,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState(coachAdvice);

  function run(action: () => Promise<ActionResult>) {
    setFlash(null);
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        setFlash(r.detail);
        if (r.data && typeof r.data === 'object' && 'advice' in (r.data as object)) {
          setAdvice((r.data as { advice: CoachAdvice[] }).advice);
        }
      } else setError(r.error);
    });
  }

  function runCoachAction(a: CoachAdvice) {
    if (!a.action) return;
    switch (a.action.type) {
      case 'sync_now':
        run(onFullSync);
        break;
      case 'create_cold_draft':
        run(onCreateColdDraft);
        break;
      case 'boost_organic':
        run(() =>
          onBoostOrganic({
            igMediaId: a.action && a.action.type === 'boost_organic' ? a.action.igMediaId : '',
            captionHint: a.action && a.action.type === 'boost_organic' ? a.action.captionHint : '',
          }),
        );
        break;
      case 'refresh_creative':
        run(() =>
          onRefreshCreative({
            entityName: a.action && a.action.type === 'refresh_creative' ? a.action.entityName : null,
          }),
        );
        break;
      case 'add_payment':
        window.open(META_BILLING, '_blank', 'noopener,noreferrer');
        setFlash('Facturation Meta ouverte — ajoute la carte côté Meta uniquement.');
        break;
      case 'add_ig_insights_scope':
        setFlash(
          'Dans Meta Business : scopes instagram_manage_insights sur le token Page / System User lié à @fit.mangas, puis Sync.',
        );
        break;
      default:
        break;
    }
  }

  const trendSpend = useMemo(
    () => intelligence.trends.map((t) => t.spendCents / 100),
    [intelligence.trends],
  );
  const trendLabels = useMemo(
    () => intelligence.trends.map((t) => t.metricDate),
    [intelligence.trends],
  );

  const followersDelta = useMemo(() => {
    const hist = intelligence.organicAccountHistory;
    if (hist.length < 2) return null;
    const a = hist[0]?.followersCount;
    const b = hist[1]?.followersCount;
    if (a == null || b == null) return null;
    return a - b;
  }, [intelligence.organicAccountHistory]);

  return (
    <div className="space-y-6 sm:space-y-8" data-testid="ads-intelligence-hub">
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

      {/* Sync + capabilities */}
      <Card testId="ads-sync-status">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.terracotta }}>
              Centre d&apos;intelligence
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold sm:text-2xl" style={{ color: acq.ink }}>
              Données connectées
            </h2>
            <p className="mt-1 text-sm" style={{ color: acq.muted }}>
              Dernière synchro : <strong style={{ color: acq.ink }}>{formatSync(intelligence.lastSyncAt)}</strong>
              {intelligence.lastSyncOk === false ? ' · partielle' : intelligence.lastSyncOk ? ' · OK' : ''}
              {' · '}
              cron auto 04:40 Paris
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(onFullSync)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: acq.terracotta }}
          >
            <RefreshCw size={14} className={pending ? 'animate-spin' : ''} />
            Sync maintenant
          </button>
        </div>
        <div className="grid gap-2 border-t px-4 py-4 sm:grid-cols-2 lg:grid-cols-3 sm:px-6" style={{ borderColor: acq.warmBeigeDeep }}>
          {(intelligence.capabilities.length
            ? intelligence.capabilities
            : [
                {
                  id: 'pending',
                  label: 'Lance une sync pour sonder les permissions',
                  accessible: false,
                  missingPermission: null,
                  note: 'Pas encore de run enregistré.',
                },
              ]
          ).map((c) => (
            <div
              key={c.id}
              className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
              style={{ borderColor: acq.warmBeigeDeep, backgroundColor: '#fff' }}
            >
              {c.accessible ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: '#15803d' }} />
              ) : (
                <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: '#b45309' }} />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold" style={{ color: acq.ink }}>
                  {c.accessible ? 'OUI' : 'NON'} · {c.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: acq.muted }}>
                  {c.accessible ? c.note : c.missingPermission ? `Manquant : ${c.missingPermission}` : c.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Coach */}
      <Card testId="ads-coach-panel">
        <Head
          eyebrow="Coach expert"
          title="Conseils du jour"
          subtitle={coachNote ?? 'Borné à docs/ADS_EXPERTISE.md + tes métriques réelles. Jamais de faux chiffres.'}
          icon={<Lightbulb size={22} style={{ color: acq.terracotta }} />}
        />
        <div className="space-y-3 px-4 py-5 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(onReloadCoach)}
              className="text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-50"
              style={{ color: acq.terracotta }}
            >
              Régénérer les conseils
            </button>
          </div>
          {advice.length === 0 ? (
            <p className="text-sm" style={{ color: acq.muted }}>
              Aucun conseil — sync d&apos;abord.
            </p>
          ) : (
            advice.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border p-4 transition hover:-translate-y-0.5"
                style={{ borderColor: acq.warmBeigeDeep, backgroundColor: '#fff', boxShadow: '0 6px 18px rgba(35,32,29,0.04)' }}
                data-testid={`ads-coach-${a.id}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor:
                        a.dataStatus === 'ok'
                          ? 'rgba(34,197,94,0.12)'
                          : a.dataStatus === 'missing_permission'
                            ? 'rgba(245,158,11,0.16)'
                            : 'rgba(120,113,108,0.12)',
                      color:
                        a.dataStatus === 'ok'
                          ? '#15803d'
                          : a.dataStatus === 'missing_permission'
                            ? '#b45309'
                            : acq.muted,
                    }}
                  >
                    {a.dataStatus === 'too_early'
                      ? 'Trop tôt'
                      : a.dataStatus === 'missing_permission'
                        ? 'Permission'
                        : 'Données OK'}
                  </span>
                  <span className="text-[10px] uppercase" style={{ color: acq.mutedLight }}>
                    {a.source === 'ai' ? 'IA bornée' : 'Règles corpus'}
                  </span>
                </div>
                <h3 className="mt-2 font-serif text-base font-semibold" style={{ color: acq.ink }}>
                  {a.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: acq.muted }}>
                  {a.body}
                </p>
                {a.action ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runCoachAction(a)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: acq.active }}
                  >
                    <Sparkles size={12} />
                    {a.action.label}
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </Card>

      {/* Organique */}
      <Card testId="ads-organic-section">
        <Head
          eyebrow="Organique"
          title="Quoi booster"
          subtitle="Score = engagement réel. Badge « à booster » sur les gagnantes. Transformer en pub = brouillon PAUSED."
          icon={<Zap size={22} style={{ color: acq.terracotta }} />}
        />
        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          {[
            {
              label: 'Abonnés',
              value: num(intelligence.organicAccount?.followersCount),
              hint: followersDelta != null ? `${followersDelta >= 0 ? '+' : ''}${followersDelta} vs veille` : 'croissance après 2 syncs',
            },
            {
              label: 'Vues profil',
              value: intelligence.organicAccount?.insightsAvailable
                ? num(intelligence.organicAccount.profileViews)
                : '—',
              hint: intelligence.organicAccount?.missingPermission
                ? `Scope : ${intelligence.organicAccount.missingPermission}`
                : 'jour',
            },
            {
              label: 'Portée compte',
              value: intelligence.organicAccount?.insightsAvailable
                ? num(intelligence.organicAccount.reach)
                : '0',
              hint: intelligence.organicAccount?.insightsAvailable ? 'jour' : 'zéros honnêtes sans scope',
            },
            {
              label: 'Clics lien bio',
              value: intelligence.organicAccount?.insightsAvailable
                ? num(intelligence.organicAccount.websiteClicks)
                : '0',
              hint: 'website_clicks',
            },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border bg-white p-4" style={{ borderColor: acq.warmBeigeDeep }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: acq.muted }}>
                {k.label}
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold" style={{ color: acq.ink }}>
                {k.value}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: acq.mutedLight }}>
                {k.hint}
              </p>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto px-4 pb-5 sm:px-6">
          {intelligence.organicMedia.length === 0 ? (
            <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm" style={{ borderColor: acq.warmBeigeDeep, color: acq.muted }}>
              Aucun média syncé — lance Sync (liste IG via Page token).
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm" data-testid="ads-organic-table">
              <thead>
                <tr style={{ color: acq.muted }}>
                  <th className="pb-2 font-medium">Publication</th>
                  <th className="pb-2 font-medium">Score</th>
                  <th className="pb-2 font-medium">Likes</th>
                  <th className="pb-2 font-medium">Com.</th>
                  <th className="pb-2 font-medium">Reach</th>
                  <th className="pb-2 font-medium">Saves</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {intelligence.organicMedia.slice(0, 12).map((m) => (
                  <tr key={m.igMediaId} className="border-t" style={{ borderColor: 'rgba(232,223,212,0.85)' }}>
                    <td className="max-w-[220px] py-3">
                      <div className="flex items-center gap-2">
                        {m.boostBadge ? (
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: acq.terracotta }}
                          >
                            À booster
                          </span>
                        ) : null}
                        <span className="truncate" style={{ color: acq.ink }}>
                          {(m.caption ?? m.mediaProductType ?? m.mediaType ?? m.igMediaId).slice(0, 60)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 font-semibold" style={{ color: acq.terracotta }}>
                      {m.score.toFixed(0)}
                    </td>
                    <td className="py-3">{num(m.likeCount)}</td>
                    <td className="py-3">{num(m.commentsCount)}</td>
                    <td className="py-3">{m.reach != null ? num(m.reach) : '0'}</td>
                    <td className="py-3">{m.saved != null ? num(m.saved) : '0'}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(() =>
                            onBoostOrganic({
                              igMediaId: m.igMediaId,
                              captionHint: m.caption ?? undefined,
                            }),
                          )
                        }
                        className="rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-50"
                        style={{ backgroundColor: acq.warmBeige, color: acq.ink }}
                      >
                        Transformer en pub
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Alertes */}
      <Card testId="ads-alerts">
        <Head
          eyebrow="Garde-fous"
          title="Fatigue & kill"
          subtitle="Fréquence froid >3–4 / retarget >5–7 · kill 48–72 h ou 50–100 €."
          icon={<Activity size={22} style={{ color: acq.terracotta }} />}
        />
        <ul className="space-y-2 px-4 py-5 sm:px-6">
          {intelligence.alerts.map((al) => (
            <li
              key={al.id}
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor:
                  al.severity === 'critical'
                    ? 'rgba(220,38,38,0.25)'
                    : al.severity === 'warning'
                      ? 'rgba(245,158,11,0.3)'
                      : acq.warmBeigeDeep,
                backgroundColor:
                  al.severity === 'critical'
                    ? 'rgba(220,38,38,0.05)'
                    : al.severity === 'warning'
                      ? 'rgba(245,158,11,0.06)'
                      : acq.cream,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                {al.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: acq.muted }}>
                {al.detail}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Températures + tendances */}
      <Card testId="ads-analytics-tables">
        <Head
          eyebrow="Ads"
          title="Analyse complète"
          subtitle="Campagnes · températures · tendances · breakdowns. Zéros si vide."
          icon={<BarChart3 size={22} style={{ color: acq.terracotta }} />}
        />
        <div className="space-y-6 px-4 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {intelligence.temperatureCompare.map((t) => (
              <div key={t.temperature} className="rounded-2xl border p-4" style={{ borderColor: acq.warmBeigeDeep }}>
                <p className="text-[10px] font-bold uppercase" style={{ color: acq.terracotta }}>
                  {t.label}
                </p>
                <p className="mt-2 font-serif text-xl font-semibold" style={{ color: acq.ink }}>
                  {eur(t.spendCents)}
                </p>
                <p className="mt-1 text-xs" style={{ color: acq.muted }}>
                  {num(t.leads)} leads · CPL {t.cplCents != null ? eur(t.cplCents) : '—'} · CTR{' '}
                  {t.ctr != null ? `${t.ctr.toFixed(2)} %` : '0'}
                </p>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp size={16} style={{ color: acq.terracotta }} />
              <p className="text-sm font-semibold" style={{ color: acq.ink }}>
                Tendance spend (€)
              </p>
            </div>
            {trendSpend.length === 0 ? (
              <p className="text-sm" style={{ color: acq.muted }}>
                0 — pas encore de série temporelle.
              </p>
            ) : (
              <MiniBars values={trendSpend} labels={trendLabels} />
            )}
          </div>

          <div className="overflow-x-auto">
            <p className="mb-2 text-[11px] font-bold uppercase" style={{ color: acq.terracotta }}>
              Par campagne
            </p>
            {intelligence.campaigns.length === 0 ? (
              <p className="text-sm" style={{ color: acq.muted }}>
                0 campagne dans les snapshots — sync ou crée un brouillon PAUSED.
              </p>
            ) : (
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr style={{ color: acq.muted }}>
                    <th className="pb-2">Campagne</th>
                    <th className="pb-2">Spend</th>
                    <th className="pb-2">Imp.</th>
                    <th className="pb-2">Clics</th>
                    <th className="pb-2">Leads</th>
                    <th className="pb-2">CPL</th>
                    <th className="pb-2">Fréq.</th>
                  </tr>
                </thead>
                <tbody>
                  {intelligence.campaigns.map((c) => (
                    <tr key={c.entityId} className="border-t" style={{ borderColor: 'rgba(232,223,212,0.8)' }}>
                      <td className="py-2 font-medium" style={{ color: acq.ink }}>
                        {c.entityName ?? c.entityId}
                      </td>
                      <td className="py-2">{eur(c.spendCents)}</td>
                      <td className="py-2">{num(c.impressions)}</td>
                      <td className="py-2">{num(c.clicks ?? 0)}</td>
                      <td className="py-2">{num(c.leads)}</td>
                      <td className="py-2">{c.cplCents != null ? eur(c.cplCents) : '—'}</td>
                      <td className="py-2">{c.frequency != null ? c.frequency.toFixed(2) : '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <BreakdownTable title="Démographie · âge" rows={intelligence.breakdowns.age} />
            <BreakdownTable title="Démographie · genre" rows={intelligence.breakdowns.gender} />
            <BreakdownTable title="Placement · plateforme" rows={intelligence.breakdowns.publisher_platform} />
            <BreakdownTable title="Pays" rows={intelligence.breakdowns.country} />
            <BreakdownTable title="Heure (fuseau annonceur)" rows={intelligence.breakdowns.hour} />
            <div className="rounded-2xl border p-4" style={{ borderColor: acq.warmBeigeDeep, backgroundColor: acq.cream }}>
              <p className="text-[11px] font-bold uppercase" style={{ color: acq.terracotta }}>
                Créative / audience
              </p>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: acq.muted }}>
                Niveau adset/ad syncé en base (<code>ad_insights_daily</code>). Tant que spend = 0, les tableaux
                créative/audience restent à 0 — pas de faux ROAS. Après diffusion : filtre level=ad dans la prochaine itération UI.
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: acq.mutedLight }}>
                <Users size={12} /> Advantage+ : la créative est le ciblage (corpus).
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
