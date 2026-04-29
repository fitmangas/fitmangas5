'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Euro, HeartPulse, Percent, Users, X } from 'lucide-react';

import type { AdminKpiDrilldowns, AdminKpis } from '@/lib/admin/kpis';
import { GlassCard } from '@/components/ui/GlassCard';

function fmtEur(v: number): string {
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%`;
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

type ModalKey = 'revenue' | 'churn' | 'active' | null;
const HEALTH_ALL_HREF = '/admin/clients?health=all';

export function AdminKpiCardsInteractive({
  stripeMonthEur,
  kpis,
  drilldowns,
}: {
  stripeMonthEur: number | null;
  kpis: AdminKpis;
  drilldowns: AdminKpiDrilldowns;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalKey>(null);

  return (
    <>
      <section className="relative z-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-5 md:p-6">
          <button type="button" onClick={() => setModal('revenue')} className="w-full min-h-[138px] text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft leading-snug">Revenus Stripe</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft leading-snug">
                  (mois en cours)
                </p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">
                  {stripeMonthEur != null ? fmtEur(stripeMonthEur) : '—'}
                </p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--orange shrink-0">
                <Euro size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
          </button>
        </GlassCard>

        <GlassCard className="p-5 md:p-6">
          <button type="button" onClick={() => setModal('churn')} className="w-full min-h-[138px] text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Churn 30j</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{fmtPct(kpis.churnRate30d)}</p>
                <p className="mt-2 text-xs text-luxury-muted">Résiliations / abonnés actifs</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--rose">
                <Percent size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
          </button>
        </GlassCard>

        <GlassCard className="p-5 md:p-6">
          <button type="button" onClick={() => setModal('active')} className="w-full min-h-[138px] text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Abonnés actifs</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{kpis.activeSubscribers}</p>
                <p className="mt-2 text-xs text-luxury-muted">Plans actifs + trialing</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--blue">
                <Users size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
          </button>
        </GlassCard>

        <GlassCard className="p-5 md:p-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(HEALTH_ALL_HREF)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(HEALTH_ALL_HREF);
              }
            }}
            className="cursor-pointer"
            aria-label="Ouvrir la vue complète Health"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Health</p>
                <div className="mt-3 space-y-2">
                  <Link
                    href="/admin/clients?health=green"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="font-medium">{kpis.health.healthy}</span>
                    <span className="text-luxury-muted">Actifs</span>
                  </Link>
                  <Link
                    href="/admin/clients?health=orange"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="font-medium">{kpis.health.fragile}</span>
                    <span className="text-luxury-muted">Fragiles</span>
                  </Link>
                  <Link
                    href="/admin/clients?health=red"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="font-medium">{kpis.health.atRisk}</span>
                    <span className="text-luxury-muted">À risque</span>
                  </Link>
                </div>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--green">
                <HeartPulse size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
          </div>
        </GlassCard>
      </section>

      {modal ? (
        <div
          className="kpi-modal-backdrop fixed inset-0 z-[500] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="kpi-modal-panel relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/95 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">
                  {modal === 'revenue' ? 'Détail revenus Stripe' : modal === 'churn' ? 'Détail churn 30 jours' : 'Détail abonnés actifs'}
                </h2>
                <p className="mt-1.5 text-xs text-luxury-muted">
                  {modal === 'revenue'
                    ? 'Ventilation des revenus Stripe + boutique'
                    : modal === 'churn'
                      ? 'Résiliations sur les 30 derniers jours'
                      : 'Abonnements en statut active ou trialing'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="shrink-0 rounded-full border border-black/10 bg-white p-2 text-luxury-ink transition hover:bg-black/5"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-5">
              {modal === 'revenue' ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-1">
                    <div className="rounded-2xl border border-white/70 bg-gradient-to-r from-white via-orange-50/55 to-white px-5 py-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-luxury-soft">Total mois en cours</p>
                      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-luxury-ink">{fmtEur(drilldowns.revenueGrandTotalEur)}</p>
                    </div>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {drilldowns.revenueByCourse.map((row) => (
                      <div
                        key={row.courseId}
                        className="rounded-2xl border border-white/75 bg-gradient-to-b from-white/90 to-white/70 px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold leading-tight text-luxury-ink">{row.courseLabel}</p>
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold text-orange-700">
                            {drilldowns.revenueGrandTotalEur > 0
                              ? `${((row.amountEur / drilldowns.revenueGrandTotalEur) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`
                              : '0%'}
                          </span>
                        </div>
                        <p className="mt-1 text-[15px] font-medium text-luxury-ink">
                          {fmtEur(row.amountEur)} · {row.chargeCount} paiement(s)
                        </p>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-orange-100/90">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                            style={{
                              width: `${
                                drilldowns.revenueGrandTotalEur > 0
                                  ? Math.max(4, Math.min(100, (row.amountEur / drilldowns.revenueGrandTotalEur) * 100))
                                  : 4
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="rounded-2xl border border-white/75 bg-gradient-to-b from-white/90 to-white/70 px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold leading-tight text-luxury-ink">Boutique Printful</p>
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold text-orange-700">
                          {drilldowns.revenueGrandTotalEur > 0
                            ? `${((drilldowns.boutiqueRevenueEur / drilldowns.revenueGrandTotalEur) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`
                            : '0%'}
                        </span>
                      </div>
                      <p className="mt-1 text-[15px] font-medium text-luxury-ink">
                        {fmtEur(drilldowns.boutiqueRevenueEur)} · {drilldowns.boutiqueOrderCount} commande(s)
                      </p>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-orange-100/90">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                          style={{
                            width: `${
                              drilldowns.revenueGrandTotalEur > 0
                                ? Math.max(4, Math.min(100, (drilldowns.boutiqueRevenueEur / drilldowns.revenueGrandTotalEur) * 100))
                                : 4
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    {drilldowns.revenueByCourse.length === 0 && drilldowns.boutiqueRevenueEur <= 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/60 bg-white/40 px-4 py-6 text-sm text-luxury-muted sm:col-span-2">
                        Aucune ligne détaillée disponible sur la période.
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {modal === 'churn' ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/60 bg-white/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-luxury-soft">Taux actuel</p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-luxury-ink">{fmtPct(kpis.churnRate30d)}</p>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {drilldowns.churnByTier.map((row) => (
                      <div
                        key={row.tier}
                        className="rounded-2xl border border-white/75 bg-gradient-to-b from-white/90 to-white/70 px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold leading-tight text-luxury-ink">{row.tier}</p>
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-semibold text-rose-700">
                            {drilldowns.churnUsers.length > 0
                              ? `${((row.count / drilldowns.churnUsers.length) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`
                              : '0%'}
                          </span>
                        </div>
                        <p className="text-[15px] font-medium text-luxury-ink">{row.count} résiliation(s)</p>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-rose-100/90">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500"
                            style={{
                              width: `${
                                drilldowns.churnUsers.length > 0
                                  ? Math.max(4, Math.min(100, (row.count / drilldowns.churnUsers.length) * 100))
                                  : 4
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {drilldowns.churnByTier.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/60 bg-white/40 px-4 py-6 text-sm text-luxury-muted sm:col-span-2">
                        Aucune résiliation détectée sur 30 jours.
                      </p>
                    ) : null}
                  </div>
                  {drilldowns.churnUsers.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-luxury-soft">Derniers profils concernés</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {drilldowns.churnUsers.slice(0, 20).map((u) => (
                          <div
                            key={`${u.userId}-${u.canceledAt}`}
                            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm shadow-[0_6px_16px_rgba(15,23,42,0.04)]"
                          >
                            <span className="font-semibold text-luxury-ink">{u.name}</span>
                            <span className="ml-2 text-luxury-muted">{u.tier}</span>
                            <span className="ml-2 text-luxury-muted">· {fmtDateShort(u.canceledAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {modal === 'active' ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-white/60 bg-white/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-luxury-soft">Total abonnés actifs</p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-luxury-ink">{kpis.activeSubscribers}</p>
                  </div>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {drilldowns.activeByTier.map((row) => (
                      <div
                        key={row.tier}
                        className="rounded-2xl border border-white/75 bg-gradient-to-b from-white/90 to-white/70 px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)]"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold leading-tight text-luxury-ink">{row.tier}</p>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            {kpis.activeSubscribers > 0
                              ? `${((row.count / kpis.activeSubscribers) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}%`
                              : '0%'}
                          </span>
                        </div>
                        <p className="text-[15px] font-medium text-luxury-ink">{row.count} abonné(s)</p>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100/90">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                            style={{
                              width: `${
                                kpis.activeSubscribers > 0
                                  ? Math.max(4, Math.min(100, (row.count / kpis.activeSubscribers) * 100))
                                  : 4
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {drilldowns.activeByTier.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-white/60 bg-white/40 px-4 py-6 text-sm text-luxury-muted sm:col-span-2">
                        Aucun abonnement actif/trialing.
                      </p>
                    ) : null}
                  </div>
                  {drilldowns.activeUsers.length > 0 ? (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-[0.14em] text-luxury-soft">Profils (aperçu)</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {drilldowns.activeUsers.slice(0, 30).map((u) => (
                          <div
                            key={`${u.userId}-${u.tier}-${u.status}`}
                            className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm shadow-[0_6px_16px_rgba(15,23,42,0.04)]"
                          >
                            <span className="font-semibold text-luxury-ink">{u.name}</span>
                            <span className="ml-2 text-luxury-muted">{u.tier}</span>
                            <span className="ml-2 text-luxury-muted">· {u.status}</span>
                            {u.endsAt ? <span className="ml-2 text-luxury-muted">· fin {fmtDateShort(u.endsAt)}</span> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
