'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { OceanRadar, buildOceanSlices } from '@/components/SelfKnowledge/OceanRadar';
import {
  MiniOceanRadar,
  TraitSparkline,
} from '@/components/SelfKnowledge/compte/HubMiniViz';
import { HubEmptyState, HubSectionHero } from '@/components/SelfKnowledge/compte/HubVisuals';
import { ATTACHMENT_LABELS } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_LABELS } from '@/lib/self-knowledge/ipip50';
import { bandFromTraitScore, type BigFiveTraitKey } from '@/lib/self-knowledge/banks/big-five-traits';
import { TRAIT_BAND_PHRASE } from '@/lib/self-knowledge/banks/practice-impact';
import type { SelfTestResultRow } from '@/lib/self-knowledge/store';
import type { ClientLang } from '@/lib/compte/i18n';
import { getSelfTest } from '@/lib/self-knowledge/scoring';
import type { SelfTestSlug } from '@/lib/self-knowledge/types';

import '@/components/SelfKnowledge/compte/hub-member.css';

type Props = {
  lang: ClientLang;
  history: SelfTestResultRow[];
};

function formatLabel(version: string | null | undefined, locale: 'fr' | 'es'): string {
  const v = version ?? '';
  if (v.includes('120')) return 'IPIP-120';
  if (v.includes('50') || v.includes('ipip')) return 'IPIP-50';
  if (v.includes('ecr')) return 'ECR-S';
  return locale === 'es' ? 'Formato' : 'Format';
}

function dominantBigFive(scores: Record<string, number>): BigFiveTraitKey {
  const keys: BigFiveTraitKey[] = ['E', 'A', 'C', 'ES', 'O'];
  let best: BigFiveTraitKey = 'C';
  let max = -1;
  for (const k of keys) {
    const v = scores[k] ?? 0;
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

function traitSeries(
  history: SelfTestResultRow[],
  trait: BigFiveTraitKey,
  untilId: string,
): number[] {
  const same = history
    .filter(
      (r) =>
        r.test_slug === 'big-five' &&
        (r.test_version ?? '') ===
          (history.find((h) => h.id === untilId)?.test_version ?? ''),
    )
    .slice()
    .reverse();
  const out: number[] = [];
  for (const r of same) {
    out.push((r.scores as Record<string, number>)[trait] ?? 0);
    if (r.id === untilId) break;
  }
  return out;
}

const CARD_IMG: Record<string, string> = {
  'big-five': '/library/portraits/portrait-05-4x5.webp',
  attachement: '/library/portraits/portrait-01-4x5.webp',
};

export function SelfKnowledgeTestsPanel({ lang, history }: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const [slugFilter, setSlugFilter] = useState<SelfTestSlug | 'all'>('all');
  const [idA, setIdA] = useState<string>('');
  const [idB, setIdB] = useState<string>('');

  const bigFiveRows = useMemo(
    () => history.filter((r) => r.test_slug === 'big-five'),
    [history],
  );

  useEffect(() => {
    if (bigFiveRows.length >= 2 && !idA && !idB) {
      setIdA(bigFiveRows[0]!.id);
      setIdB(bigFiveRows[1]!.id);
    }
  }, [bigFiveRows, idA, idB]);

  const t =
    locale === 'es'
      ? {
          eyebrow: 'Mis tests',
          title: 'Tu retrato, en el tiempo',
          lead: 'Haz, rehace y compárate contigo misma — nunca con las demás.',
          available: 'Elige un test',
          history: 'Historial',
          compare: 'Comparar dos pasaciones',
          pickA: 'Más reciente',
          pickB: 'Anterior',
          sameFormat: 'Mismo formato obligatorio.',
          mismatch: 'Formatos distintos — elige el mismo instrumento.',
          emptyTitle: 'Haz tu primer test — tu retrato aparecerá aquí',
          emptyLead: 'Big Five o apego: unos minutos para verte con claridad.',
          emptyCta: 'Empezar el Big Five',
          start: 'Empezar',
          retake: 'Repetir',
          radarNow: 'Ahora',
          radarThen: 'Antes',
          rapid: 'Rápido',
          deep: 'En profundidad',
          openReport: 'Ver el informe',
          rising: 'en alza',
          falling: 'en baja',
          steady: 'estable',
        }
      : {
          eyebrow: 'Mes tests',
          title: 'Ton portrait, dans le temps',
          lead: 'Passe, refais et compare-toi à toi-même — jamais aux autres.',
          available: 'Choisis un test',
          history: 'Historique',
          compare: 'Comparer deux passations',
          pickA: 'Plus récente',
          pickB: 'Antérieure',
          sameFormat: 'Même format obligatoire.',
          mismatch: 'Formats différents — choisis le même instrument.',
          emptyTitle: 'Fais ton premier test — ton portrait apparaîtra ici',
          emptyLead: 'Big Five ou attachement : quelques minutes pour te voir clairement.',
          emptyCta: 'Commencer le Big Five',
          start: 'Commencer',
          retake: 'Refaire',
          radarNow: 'Maintenant',
          radarThen: 'Avant',
          rapid: 'Rapide',
          deep: 'Approfondie',
          openReport: 'Voir le rapport',
          rising: 'en hausse',
          falling: 'en baisse',
          steady: 'stable',
        };

  const filtered = useMemo(() => {
    return slugFilter === 'all' ? history : history.filter((r) => r.test_slug === slugFilter);
  }, [history, slugFilter]);

  const rowA = history.find((r) => r.id === idA);
  const rowB = history.find((r) => r.id === idB);
  const canCompare =
    rowA &&
    rowB &&
    rowA.test_slug === rowB.test_slug &&
    (rowA.test_version ?? '') === (rowB.test_version ?? '') &&
    rowA.test_slug === 'big-five';

  const labelFor = (key: string) => {
    if (key === 'ES') return locale === 'es' ? 'Estabilidad' : 'Stabilité';
    return BIG_FIVE_LABELS[key]?.short[locale] ?? key;
  };

  const slicesA =
    canCompare && rowA
      ? buildOceanSlices(Object.keys(rowA.scores), rowA.scores as Record<string, number>, labelFor)
      : [];
  const slicesB =
    canCompare && rowB
      ? buildOceanSlices(Object.keys(rowB.scores), rowB.scores as Record<string, number>, labelFor)
      : [];

  const dateFmt = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="mt-2 space-y-10">
      <HubSectionHero eyebrow={t.eyebrow} title={t.title} lead={t.lead} />

      <section className="hub-reveal">
        <h2 className="font-serif text-2xl italic text-brand-ink">{t.available}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(['big-five', 'attachement'] as const).map((slug) => {
            const test = getSelfTest(slug);
            if (!test) return null;
            return (
              <article
                key={slug}
                className="hub-elevate group overflow-hidden rounded-[26px] border border-white/70 bg-[#FFFAF5] shadow-[0_16px_42px_rgba(60,40,30,0.11)]"
              >
                <div className="relative h-[120px] w-full sm:h-[140px]">
                  <Image
                    src={CARD_IMG[slug]!}
                    alt=""
                    fill
                    className="object-cover object-[center_12%] opacity-90 transition duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width:640px) 100vw, 320px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg italic text-brand-ink">{test.title[locale]}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-brand-ink/60">{test.description[locale]}</p>
                  {slug === 'big-five' ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/compte/connaissance-de-soi/tests/big-five?format=ipip-50"
                        className="rounded-full bg-[#c45d3e] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(196,93,62,0.28)]"
                      >
                        {t.rapid} · IPIP-50
                      </Link>
                      <Link
                        href="/compte/connaissance-de-soi/tests/big-five?format=ipip-120"
                        className="rounded-full border border-[#c45d3e]/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]"
                      >
                        {t.deep} · 120
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/compte/connaissance-de-soi/tests/attachement"
                      className="mt-4 inline-flex rounded-full bg-[#c45d3e] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(196,93,62,0.28)]"
                    >
                      {t.start}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="hub-reveal">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-2xl italic text-brand-ink">{t.history}</h2>
          <div className="flex gap-1">
            {(['all', 'big-five', 'attachement'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlugFilter(s)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  slugFilter === s ? 'bg-[#c45d3e] text-white' : 'bg-white/80 text-brand-ink/50'
                }`}
              >
                {s === 'all' ? (locale === 'es' ? 'Todos' : 'Tous') : s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-4">
            <HubEmptyState
              title={t.emptyTitle}
              lead={t.emptyLead}
              ctaLabel={t.emptyCta}
              ctaHref="/compte/connaissance-de-soi/tests/big-five?format=ipip-50"
              testId="tests-empty"
              preview="radar"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3" data-testid="tests-history-list">
            {filtered.map((row) => {
              const test = getSelfTest(
                row.test_slug,
                row.test_slug === 'big-five'
                  ? (row.test_version ?? '').includes('120')
                    ? 'ipip-120'
                    : 'ipip-50'
                  : undefined,
              );
              const scores = row.scores as Record<string, number>;
              const isBf = row.test_slug === 'big-five';
              const dom = isBf ? dominantBigFive(scores) : null;
              const band = dom ? bandFromTraitScore(scores[dom] ?? 0) : null;
              const bandLabel =
                dom && band ? TRAIT_BAND_PHRASE[dom][band][locale] : null;
              const series = dom ? traitSeries(history, dom, row.id) : [];
              const rising =
                series.length >= 2
                  ? series[series.length - 1]! > series[series.length - 2]!
                    ? true
                    : series[series.length - 1]! < series[series.length - 2]!
                      ? false
                      : null
                  : null;
              const trendLabel =
                rising === true ? t.rising : rising === false ? t.falling : t.steady;

              return (
                <Link
                  key={row.id}
                  href={`/compte/connaissance-de-soi/tests/resultat/${row.id}`}
                  className="hub-elevate block rounded-[22px] border border-white/70 bg-[#FFFAF5] p-4 shadow-[0_12px_32px_rgba(60,40,30,0.09)] md:p-5"
                  data-testid="test-history-card"
                >
                  <div className="flex gap-3 sm:gap-4">
                    {isBf ? (
                      <MiniOceanRadar scores={scores} size={80} />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#e5d0c4] bg-white/80 font-serif text-xl italic text-[#c45d3e]">
                        ◈
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-brand-ink">
                          {test?.title[locale] ?? row.test_slug}
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]">
                            {formatLabel(row.test_version, locale)}
                          </span>
                        </p>
                        <span className="text-[11px] text-brand-ink/45">
                          {dateFmt.format(new Date(row.created_at))}
                        </span>
                      </div>
                      {bandLabel ? (
                        <p className="mt-1.5 text-sm text-brand-ink/70">
                          <span className="font-serif italic">{bandLabel}</span>
                          {series.length >= 2 ? (
                            <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#c45d3e]">
                              · {trendLabel}
                            </span>
                          ) : null}
                        </p>
                      ) : row.analysis_teaser ? (
                        <p className="mt-1.5 line-clamp-2 text-sm text-brand-ink/60">{row.analysis_teaser}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {series.length >= 2 ? <TraitSparkline values={series} rising={rising} /> : null}
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]">
                          {t.openReport} →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {history.filter((r) => r.test_slug === 'big-five').length >= 2 ? (
        <section data-testid="test-compare">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-ink/45">{t.compare}</h2>
          <p className="mt-2 text-sm text-brand-ink/55">{t.sameFormat}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-brand-ink/55">
              {t.pickA}
              <select
                className="mt-1 w-full rounded-xl border border-brand-ink/10 bg-white/90 px-3 py-2 text-sm text-brand-ink"
                value={idA}
                onChange={(e) => setIdA(e.target.value)}
                data-testid="compare-a"
              >
                <option value="">—</option>
                {history
                  .filter((r) => r.test_slug === 'big-five')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {dateFmt.format(new Date(r.created_at))} · {formatLabel(r.test_version, locale)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs text-brand-ink/55">
              {t.pickB}
              <select
                className="mt-1 w-full rounded-xl border border-brand-ink/10 bg-white/90 px-3 py-2 text-sm text-brand-ink"
                value={idB}
                onChange={(e) => setIdB(e.target.value)}
                data-testid="compare-b"
              >
                <option value="">—</option>
                {history
                  .filter((r) => r.test_slug === 'big-five')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {dateFmt.format(new Date(r.created_at))} · {formatLabel(r.test_version, locale)}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {idA && idB && !canCompare ? (
            <p className="mt-3 text-sm text-[#c45d3e]">{t.mismatch}</p>
          ) : null}
          {canCompare && slicesA.length >= 3 ? (
            <div className="mt-5 rounded-[26px] border border-white/70 bg-[#FFFAF5] p-4 shadow-[0_14px_40px_rgba(60,40,30,0.1)] md:p-6">
              <OceanRadar
                slices={slicesA}
                compareSlices={slicesB}
                compareLabel={`${t.radarThen} · ${t.radarNow}`}
                size={280}
              />
              <div className="mt-3 flex justify-center gap-4 text-[11px] text-brand-ink/55">
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#c45d3e]" />
                  {t.radarNow}
                </span>
                <span>
                  <span className="mr-1 inline-block h-0.5 w-4 bg-[#958780] align-middle" />
                  {t.radarThen}
                </span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
