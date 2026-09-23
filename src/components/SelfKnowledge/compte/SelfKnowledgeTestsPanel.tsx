'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { OceanRadar, buildOceanSlices } from '@/components/SelfKnowledge/OceanRadar';
import { HubEmptyState, HubSectionHero } from '@/components/SelfKnowledge/compte/HubVisuals';
import { ATTACHMENT_LABELS } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_LABELS } from '@/lib/self-knowledge/ipip50';
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

function formatDomainScore(slug: string, val: number): string {
  if (slug === 'big-five') return `${val}/50`;
  return `${Number(val).toFixed(1)}/7`;
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
          <div className="mt-4 space-y-3">
            {filtered.map((row) => {
              const test = getSelfTest(
                row.test_slug,
                row.test_slug === 'big-five'
                  ? (row.test_version ?? '').includes('120')
                    ? 'ipip-120'
                    : 'ipip-50'
                  : undefined,
              );
              return (
                <article
                  key={row.id}
                  className="rounded-[22px] border border-white/70 bg-[#FFFAF5] p-4 shadow-[0_12px_32px_rgba(60,40,30,0.09)] md:p-5"
                >
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
                  {row.analysis_teaser ? (
                    <p className="mt-2 line-clamp-2 text-sm text-brand-ink/60">{row.analysis_teaser}</p>
                  ) : null}
                  <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {(test?.scoreKeys ?? Object.keys(row.scores)).map((key) => {
                      const val = (row.scores as Record<string, number>)[key] ?? 0;
                      const label =
                        row.test_slug === 'big-five'
                          ? BIG_FIVE_LABELS[key]?.[locale] ?? key
                          : ATTACHMENT_LABELS[key]?.[locale] ?? key;
                      return (
                        <div
                          key={key}
                          className="flex justify-between rounded-xl bg-white/70 px-2.5 py-1.5 text-xs"
                        >
                          <dt className="text-brand-ink/55">{label}</dt>
                          <dd className="font-semibold text-brand-ink">
                            {formatDomainScore(row.test_slug, val)}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                  <Link
                    href={
                      row.test_slug === 'big-five'
                        ? `/compte/connaissance-de-soi/tests/big-five?format=${
                            (row.test_version ?? '').includes('120') ? 'ipip-120' : 'ipip-50'
                          }`
                        : `/compte/connaissance-de-soi/tests/${row.test_slug}`
                    }
                    className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]"
                  >
                    {t.retake} →
                  </Link>
                </article>
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
