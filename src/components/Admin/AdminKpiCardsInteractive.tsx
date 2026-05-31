'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Euro, FileText, HeartPulse, Users, X } from 'lucide-react';

import type { AdminKpiDrilldowns, AdminKpis } from '@/lib/admin/kpis';
import { MEMBER_HEALTH_LABELS } from '@/lib/admin/health-labels';
import { GlassCard } from '@/components/ui/GlassCard';

function fmtEur(v: number): string {
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

type ModalKey = 'revenue' | null;
const CLIENTS_HREF = '/admin/clients';

export function AdminKpiCardsInteractive({
  stripeMonthEur,
  kpis,
  drilldowns,
  pendingBlogValidationCount,
}: {
  stripeMonthEur: number | null;
  kpis: AdminKpis;
  drilldowns: AdminKpiDrilldowns;
  pendingBlogValidationCount: number;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalKey>(null);

  return (
    <>
      <section className="relative z-10 grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard kpi className="p-5 md:p-6">
          <button type="button" onClick={() => setModal('revenue')} className="flex w-full flex-col text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft leading-snug">
                  Revenus Stripe
                  <br />
                  (mois en cours)
                </p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--orange shrink-0">
                <Euro size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">
              {stripeMonthEur != null ? fmtEur(stripeMonthEur) : '—'}
            </p>
          </button>
        </GlassCard>

        <GlassCard kpi className="p-5 md:p-6">
          <button type="button" onClick={() => router.push('/admin/blog/validation')} className="flex w-full flex-col text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Blog</p>
              </div>
              <span className="relative kpi-icon-wrap kpi-icon-wrap--violet shrink-0">
                <FileText size={20} aria-hidden strokeWidth={2} />
                {pendingBlogValidationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-bold leading-none text-white shadow-[0_4px_10px_rgba(255,59,48,0.45)] ring-2 ring-white">
                    {pendingBlogValidationCount > 99 ? '99+' : pendingBlogValidationCount}
                  </span>
                ) : null}
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{pendingBlogValidationCount}</p>
            <p className="mt-2 text-xs text-luxury-muted">Validation(s) mensuelle(s) en attente</p>
          </button>
        </GlassCard>

        <GlassCard kpi className="p-5 md:p-6">
          <button type="button" onClick={() => router.push('/admin/boutique')} className="flex w-full flex-col text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Boutique</p>
              </div>
              <span className="kpi-icon-wrap kpi-icon-wrap--blue shrink-0">
                <Users size={20} aria-hidden strokeWidth={2} />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-luxury-ink">{drilldowns.boutiqueItemsSold}</p>
            <p className="mt-2 text-xs text-luxury-muted">Articles vendus (ce mois)</p>
            <div className="mt-4 flex justify-center">
              <span className="inline-flex min-h-[46px] w-full max-w-full items-center justify-center rounded-full border border-white/85 bg-white/60 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-luxury-ink shadow-[0_2px_12px_rgba(29,29,31,0.08)] sm:min-w-[240px] sm:w-auto">
                Boutique
              </span>
            </div>
          </button>
        </GlassCard>

        <GlassCard kpi className="p-5 md:p-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(CLIENTS_HREF)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(CLIENTS_HREF);
              }
            }}
            className="cursor-pointer"
            aria-label="Ouvrir la vue complète Santé"
          >
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Santé</p>
                </div>
                <span className="kpi-icon-wrap kpi-icon-wrap--green shrink-0">
                  <HeartPulse size={20} aria-hidden strokeWidth={2} />
                </span>
              </div>
              <div className="mt-3 space-y-2">
                  <Link
                    href={CLIENTS_HREF}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                    <span className="font-medium">
                      {kpis.health.healthy +
                        kpis.health.fragile +
                        kpis.health.atRisk +
                        kpis.health.newMembers +
                        kpis.health.watch}
                    </span>
                    <span className="text-luxury-muted">Total abonnées</span>
                  </Link>
                  <Link
                    href="/admin/clients?health=new"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span className="font-medium">{kpis.health.newMembers}</span>
                    <span className="text-luxury-muted">{MEMBER_HEALTH_LABELS.new}</span>
                  </Link>
                  <Link
                    href="/admin/clients?health=watch"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                    title="Inscrite 7–14 j, pas encore de cours ni replay"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <span className="font-medium">{kpis.health.watch}</span>
                    <span className="text-luxury-muted">{MEMBER_HEALTH_LABELS.watch}</span>
                  </Link>
                  <Link
                    href="/admin/clients?health=green"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="font-medium">{kpis.health.healthy}</span>
                    <span className="text-luxury-muted">{MEMBER_HEALTH_LABELS.green}</span>
                  </Link>
                  <Link
                    href="/admin/clients?health=orange"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                    title="Dernière activité entre 4 et 14 jours"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="font-medium">{kpis.health.fragile}</span>
                    <span className="text-luxury-muted">{MEMBER_HEALTH_LABELS.orange}</span>
                  </Link>
                  <Link
                    href="/admin/clients?health=red"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-sm text-luxury-ink hover:underline"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="font-medium">{kpis.health.atRisk}</span>
                    <span className="text-luxury-muted">{MEMBER_HEALTH_LABELS.red}</span>
                  </Link>
              </div>
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
                  Détail revenus Stripe
                </h2>
                <p className="mt-1.5 text-xs text-luxury-muted">
                  Ventilation des revenus Stripe + boutique
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
                          <span className="rounded-full border border-[#C9A96E]/50 bg-[#C9A96E]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#8B6B2E]">
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
                            className="h-full rounded-full bg-gradient-to-r from-[#C45D3E] to-[#b35338]"
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

            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
