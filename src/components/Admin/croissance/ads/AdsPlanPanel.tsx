'use client';

import { useState, useTransition } from 'react';
import { ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';

import { acq } from '@/components/acquisition/tokens';
import type { ActionResult } from '@/app/admin/croissance/ads-actions';
import type { ActionPlanItem } from '@/lib/acquisition/ads/action-plan';
import {
  CREATIVE_TYPE_LABEL,
  FRAMEWORK_LABEL,
  type AdsSubTab,
  type AdsUiLang,
  pickLang,
} from '@/lib/acquisition/ads/ads-glossary';
import type { CoachAdvice } from '@/lib/acquisition/ads/coach';
import { MARCHE_WANTS } from '@/lib/acquisition/ads/marche-content';
import type { IntelligenceBundle } from '@/lib/acquisition/ads/intelligence-repository';
import type { NextAction } from '@/lib/acquisition/ads/stats-compute';
import { AdsTermHint, Collapsible, CreativePipelineHelp } from './ads-ui';

type Props = {
  plan: ActionPlanItem[];
  planNote: string | null;
  coachAdvice: CoachAdvice[];
  coachNote: string | null;
  intelligence: IntelligenceBundle;
  nextAction: NextAction;
  lang: AdsUiLang;
  onGoTo: (sub: AdsSubTab) => void;
  onReload: () => Promise<ActionResult>;
  onCreateColdDraft: () => Promise<ActionResult>;
  onBoostOrganic: (params: { igMediaId: string; captionHint?: string }) => Promise<ActionResult>;
  onFullSync: () => Promise<ActionResult>;
};

const WANT_BY_ID = Object.fromEntries(MARCHE_WANTS.map((w) => [w.id, w]));

export function AdsPlanPanel({
  plan: initialPlan,
  planNote: initialPlanNote,
  coachAdvice: initialAdvice,
  coachNote,
  nextAction,
  lang,
  onGoTo,
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

  const want = (id?: string) => (id ? WANT_BY_ID[id] : undefined);

  return (
    <div className="space-y-5 sm:space-y-6" data-testid="ads-tab-plan">
      {flash ? (
        <p className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#15803d' }} role="status">
          {flash}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3 px-1" data-testid="ads-plan-hero">
        <div className="min-w-0">
          <h2 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: acq.ink }}>
            {lang === 'es' ? 'Hipótesis a probar' : 'Hypothèses à tester'}
          </h2>
          {planNote ? (
            <p className="mt-1 text-xs" style={{ color: acq.mutedLight }}>
              {planNote}
            </p>
          ) : (
            <p className="mt-1 text-sm" style={{ color: acq.muted }}>
              {lang === 'es' ? 'Nace del Mercado + tus cifras. Cada idea → borrador a 0 €.' : 'Né du Marché + tes chiffres. Chaque idée → brouillon à 0 €.'}
            </p>
          )}
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
          {lang === 'es' ? 'Regenerar' : 'Régénérer'}
        </button>
      </div>

      <Collapsible
        title={lang === 'es' ? '¿Cómo se sigue una creativa?' : 'Comment on suit une créative ?'}
        meta={lang === 'es' ? 'Los estados del tablero Ejecución' : 'Les statuts du tableau Exécution'}
        testId="ads-plan-pipeline-help"
      >
        <CreativePipelineHelp lang={lang} compact />
        <button
          type="button"
          onClick={() => onGoTo('execution')}
          className="mt-2 text-xs font-semibold underline"
          style={{ color: acq.terracotta }}
        >
          {lang === 'es' ? 'Abrir el seguimiento en Ejecución →' : 'Ouvrir le suivi dans Exécution →'}
        </button>
      </Collapsible>

      <section
        className="relative overflow-hidden rounded-[1.75rem] border-2 p-5 sm:p-6"
        style={{ borderColor: acq.terracotta, background: 'linear-gradient(135deg,#FFFFFF 0%,#FFF1EA 100%)', boxShadow: acq.shadowCard }}
        data-testid="ads-plan-next"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: acq.terracotta }}>
          {lang === 'es' ? 'Lo que pide la Ejecución ahora' : 'Ce que demande l’Exécution maintenant'}
        </p>
        <h3 className="mt-1 font-serif text-xl font-semibold" style={{ color: acq.ink }}>
          {nextAction.title}
        </h3>
        <p className="mt-1 text-sm" style={{ color: acq.muted }}>
          {nextAction.why}
        </p>
        <button
          type="button"
          onClick={() => onGoTo('execution')}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: acq.terracotta }}
        >
          {lang === 'es' ? 'Abrir el tablero de ejecución' : 'Ouvrir le tableau d’exécution'} <ArrowRight size={14} />
        </button>
      </section>

      <ol className="space-y-3">
        {plan.map((item) => {
          const w = want(item.wantId);
          const fw = FRAMEWORK_LABEL[item.framework];
          return (
            <li
              key={item.id}
              data-testid={`ads-plan-item-${item.id}`}
              className="relative overflow-hidden rounded-[1.5rem] border bg-white p-5 pl-6 transition hover:-translate-y-0.5 sm:p-6 sm:pl-7"
              style={{ borderColor: 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard, background: 'linear-gradient(165deg,#FFFFFF 0%,#FFFAF5 100%)' }}
            >
              <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: item.priority <= 2 ? acq.terracotta : '#E7AE98' }} aria-hidden />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {item.emoji ?? '📌'}
                </span>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: acq.terracotta }}
                >
                  {item.priority}
                </span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: acq.terracottaSoft, color: acq.terracotta }}>
                  {pickLang(CREATIVE_TYPE_LABEL[item.creativeType], lang)}
                </span>
                <span className="rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: acq.warmBeigeDeep, color: acq.muted }}>
                  {fw.term ? <AdsTermHint term={fw.term} lang={lang}>{pickLang(fw, lang)}</AdsTermHint> : pickLang(fw, lang)}
                  {' · '}
                  {item.market}
                </span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold text-amber-800" style={{ borderColor: 'rgba(180,83,9,0.3)', background: 'rgba(245,158,11,0.12)' }}>
                  {lang === 'es' ? 'Hipótesis' : 'Hypothèse'}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-xl font-semibold leading-snug" style={{ color: acq.ink }}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: acq.muted }}>
                {item.hypothesis}
              </p>
              {item.evidence ? (
                <p className="mt-2 rounded-xl px-3 py-2 text-xs" style={{ backgroundColor: acq.cream, color: acq.ink }} data-testid={`ads-plan-evidence-${item.id}`}>
                  <span className="font-semibold">{lang === 'es' ? 'Se apoya en : ' : 'S’appuie sur : '}</span>
                  {item.evidence}
                  <button type="button" onClick={() => onGoTo('stats')} className="ml-1 font-semibold underline" style={{ color: acq.terracotta }}>
                    {lang === 'es' ? 'cifras' : 'chiffres'}
                  </button>
                </p>
              ) : null}
              {w ? (
                <p className="mt-2 text-xs" style={{ color: acq.muted }}>
                  <button type="button" onClick={() => onGoTo('marche')} className="font-semibold underline" style={{ color: acq.terracotta }}>
                    {w.emoji} {pickLang(w.title, lang)}
                  </button>
                  {' — '}
                  {lang === 'es' ? 'ángulo Mercado' : 'angle Marché'}
                </p>
              ) : null}
              <p className="mt-2 text-xs italic" style={{ color: acq.mutedLight }}>
                {item.honesty} · {lang === 'es' ? 'Presupuesto' : 'Budget'} : {item.budgetHint}
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
          );
        })}
      </ol>

      {plan.length === 0 ? (
        <p className="text-sm" style={{ color: acq.muted }}>
          {lang === 'es' ? 'Plan vacío — Sincroniza y Regenera.' : 'Plan vide — Synchronise puis Régénère.'}
        </p>
      ) : null}

      <section className="rounded-[1.75rem] border bg-white p-5 sm:p-6" style={{ borderColor: 'rgba(232,223,212,0.9)', boxShadow: acq.shadowCard }} data-testid="ads-plan-coach-mirror">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} style={{ color: acq.terracotta }} />
          <h3 className="font-serif text-lg font-semibold" style={{ color: acq.ink }}>
            {lang === 'es' ? 'Por qué estas hipótesis (resumen)' : 'Pourquoi ces hypothèses (résumé)'}
          </h3>
        </div>
        {coachNote ? (
          <p className="mt-1 text-xs" style={{ color: acq.muted }}>
            {coachNote}
          </p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {advice.slice(0, 5).map((a) => (
            <li key={a.id} className="rounded-2xl border px-4 py-3 text-sm leading-relaxed" style={{ borderColor: acq.warmBeigeDeep, color: acq.ink, backgroundColor: acq.cream }}>
              <strong>{a.title}</strong> — {a.body.slice(0, 160)}
              {a.body.length > 160 ? '…' : ''}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
