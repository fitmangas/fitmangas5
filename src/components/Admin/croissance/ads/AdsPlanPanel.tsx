'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import type { ActionPlanItem } from '@/lib/acquisition/ads/action-plan';
import type { CoachAdvice } from '@/lib/acquisition/ads/coach';

type Props = {
  plan: ActionPlanItem[];
  planNote: string | null;
  coachAdvice: CoachAdvice[];
  coachNote: string | null;
  onReload: () => Promise<ActionResult>;
  onCreateColdDraft: () => Promise<ActionResult>;
  onBoostOrganic: (params: { igMediaId: string; captionHint?: string }) => Promise<ActionResult>;
  onFullSync: () => Promise<ActionResult>;
};

const TYPE_LABEL: Record<ActionPlanItem['creativeType'], string> = {
  talking_head: 'Talking-head 15–30 s',
  ugc_temoignage: 'UGC témoignage',
  image_forte: 'Image forte',
  carousel: 'Carrousel',
  autre: 'Structure / autre',
};

export function AdsPlanPanel({
  plan: initialPlan,
  planNote: initialPlanNote,
  coachAdvice: initialAdvice,
  coachNote,
  onReload,
  onCreateColdDraft,
  onBoostOrganic,
  onFullSync,
}: Props) {
  const [plan, setPlan] = useState(initialPlan);
  const [planNote, setPlanNote] = useState(initialPlanNote);
  const [advice, setAdvice] = useState(initialAdvice);
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const r = await action();
      setFlash(r.ok ? r.detail : r.error);
      if (r.ok && r.data && typeof r.data === 'object') {
        const d = r.data as { plan?: ActionPlanItem[]; planNote?: string; advice?: CoachAdvice[] };
        if (d.plan) setPlan(d.plan);
        if (d.planNote != null) setPlanNote(d.planNote);
        if (d.advice) setAdvice(d.advice);
      }
    });
  }

  function runItemAction(item: ActionPlanItem) {
    if (!item.action) return;
    if (item.action.type === 'create_cold_draft') run(onCreateColdDraft);
    else if (item.action.type === 'boost_organic')
      run(() =>
        onBoostOrganic({
          igMediaId: item.action && item.action.type === 'boost_organic' ? item.action.igMediaId : '',
          captionHint: item.action && item.action.type === 'boost_organic' ? item.action.captionHint : '',
        }),
      );
    else if (item.action.type === 'sync_now') run(onFullSync);
  }

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-tab-plan">
      {flash ? (
        <p className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#15803d' }} role="status">
          {flash}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: acq.terracotta }}>
            Cœur expert
          </p>
          <h2 className="font-serif text-2xl font-semibold" style={{ color: acq.ink }}>
            Plan d&apos;action — hypothèses à tester
          </h2>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: acq.muted }}>
            Borné à <code className="text-xs">ADS_EXPERTISE</code> + <code className="text-xs">MARCHE_FEMMES</code> + tes syncs.
            La pub = test itératif. Chaque reco → brouillon PAUSED (0 €). Jamais de dépense sans double confirm.
          </p>
          {planNote ? (
            <p className="mt-1 text-xs" style={{ color: acq.mutedLight }}>
              {planNote}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(onReload)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: acq.terracotta }}
          data-testid="ads-plan-regen"
        >
          <RefreshCw size={14} className={pending ? 'animate-spin' : ''} />
          Régénérer
        </button>
      </div>

      <ol className="space-y-3">
        {plan.map((item) => (
          <li
            key={item.id}
            data-testid={`ads-plan-item-${item.id}`}
            className="rounded-[1.5rem] border bg-white p-5 transition hover:-translate-y-0.5"
            style={{ borderColor: acq.warmBeigeDeep, boxShadow: acq.shadowCard }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: acq.terracotta }}
              >
                {item.priority}
              </span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: acq.terracottaSoft, color: acq.terracotta }}>
                {TYPE_LABEL[item.creativeType]}
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: acq.warmBeigeDeep, color: acq.muted }}>
                {item.framework} · {item.market}
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold text-amber-800" style={{ borderColor: 'rgba(180,83,9,0.3)', background: 'rgba(245,158,11,0.12)' }}>
                Hypothèse
              </span>
            </div>
            <h3 className="mt-3 font-serif text-lg font-semibold" style={{ color: acq.ink }}>
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: acq.muted }}>
              {item.hypothesis}
            </p>
            <p className="mt-2 text-xs italic" style={{ color: acq.mutedLight }}>
              {item.honesty} · Budget : {item.budgetHint}
            </p>
            {item.action ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => runItemAction(item)}
                className="mt-3 rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: acq.active }}
              >
                {item.action.label}
              </button>
            ) : null}
          </li>
        ))}
      </ol>

      {plan.length === 0 ? (
        <p className="text-sm" style={{ color: acq.muted }}>
          Plan vide — Sync puis Régénérer.
        </p>
      ) : null}

      <section className="rounded-[1.5rem] border p-5" style={{ borderColor: acq.warmBeigeDeep }} data-testid="ads-plan-coach-mirror">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} style={{ color: acq.terracotta }} />
          <h3 className="font-serif text-lg font-semibold" style={{ color: acq.ink }}>
            Conseils du jour (auto sync + dédup)
          </h3>
        </div>
        {coachNote ? (
          <p className="mt-1 text-xs" style={{ color: acq.muted }}>
            {coachNote}
          </p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {advice.slice(0, 5).map((a) => (
            <li key={a.id} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink }}>
              <strong>{a.title}</strong> — {a.body.slice(0, 160)}
              {a.body.length > 160 ? '…' : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
