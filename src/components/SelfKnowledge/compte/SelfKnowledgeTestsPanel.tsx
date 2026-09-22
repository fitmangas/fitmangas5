'use client';

import { useMemo, useState } from 'react';

import { OceanRadar, buildOceanSlices } from '@/components/SelfKnowledge/OceanRadar';
import { GlassCard } from '@/components/ui/GlassCard';
import { ATTACHMENT_LABELS } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_LABELS } from '@/lib/self-knowledge/ipip50';
import type { SelfTestResultRow } from '@/lib/self-knowledge/store';
import type { ClientLang } from '@/lib/compte/i18n';
import { getSelfTest } from '@/lib/self-knowledge/scoring';
import type { SelfTestSlug } from '@/lib/self-knowledge/types';
import Link from 'next/link';

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

/** Score domaine Big Five = échelle 10–50 (IPIP-50 et domaines IPIP-120). */
function formatDomainScore(slug: string, val: number): string {
  if (slug === 'big-five') return `${val}/50`;
  return `${Number(val).toFixed(1)}/7`;
}

export function SelfKnowledgeTestsPanel({ lang, history }: Props) {
  const locale = lang === 'es' ? 'es' : 'fr';
  const [slugFilter, setSlugFilter] = useState<SelfTestSlug | 'all'>('all');
  const [idA, setIdA] = useState<string>('');
  const [idB, setIdB] = useState<string>('');

  const t =
    locale === 'es'
      ? {
          available: 'Tests disponibles',
          history: 'Historial',
          compare: 'Comparar dos pasaciones',
          pickA: 'Más reciente',
          pickB: 'Anterior',
          sameFormat: 'Mismo formato obligatorio (IPIP-50 vs IPIP-50, etc.).',
          mismatch: 'Formatos distintos — elige dos pasaciones del mismo instrumento.',
          empty: 'Aún no hay tests.',
          start: 'Empezar',
          retake: 'Repetir',
          radarNow: 'Ahora',
          radarThen: 'Antes (línea discontinua)',
        }
      : {
          available: 'Tests disponibles',
          history: 'Historique',
          compare: 'Comparer deux passations',
          pickA: 'Plus récente',
          pickB: 'Antérieure',
          sameFormat: 'Même format obligatoire (IPIP-50 vs IPIP-50, etc.).',
          mismatch: 'Formats différents — choisis deux passations du même instrument.',
          empty: 'Pas encore de tests.',
          start: 'Commencer',
          retake: 'Refaire',
          radarNow: 'Maintenant',
          radarThen: 'Avant (trait pointillé)',
        };

  const filtered = useMemo(() => {
    const rows = slugFilter === 'all' ? history : history.filter((r) => r.test_slug === slugFilter);
    return rows;
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
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.available}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <GlassCard className="p-5">
            <h3 className="font-serif text-lg italic text-luxury-ink">
              {getSelfTest('big-five')?.title[locale]}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/compte/connaissance-de-soi/tests/big-five?format=ipip-50"
                className="btn-luxury-primary px-4 py-2 text-[10px] tracking-[0.12em]"
              >
                IPIP-50 · {t.start}
              </Link>
              <Link
                href="/compte/connaissance-de-soi/tests/big-five?format=ipip-120"
                className="rounded-full border border-[#c45d3e]/35 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c45d3e]"
              >
                IPIP-120 · {t.start}
              </Link>
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <h3 className="font-serif text-lg italic text-luxury-ink">
              {getSelfTest('attachement')?.title[locale]}
            </h3>
            <Link
              href="/compte/connaissance-de-soi/tests/attachement"
              className="btn-luxury-primary mt-3 inline-flex px-4 py-2 text-[10px] tracking-[0.12em]"
            >
              {t.start}
            </Link>
          </GlassCard>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.history}</h2>
          <div className="flex gap-1">
            {(['all', 'big-five', 'attachement'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlugFilter(s)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                  slugFilter === s ? 'bg-[#c45d3e] text-white' : 'bg-white/70 text-luxury-muted'
                }`}
              >
                {s === 'all' ? (locale === 'es' ? 'Todos' : 'Tous') : s}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-luxury-muted">{t.empty}</p>
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
                <GlassCard key={row.id} className="p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-luxury-ink">
                      {test?.title[locale] ?? row.test_slug}
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c45d3e]">
                        {formatLabel(row.test_version, locale)}
                      </span>
                    </p>
                    <span className="text-[11px] text-luxury-soft">
                      {dateFmt.format(new Date(row.created_at))}
                    </span>
                  </div>
                  {row.analysis_teaser ? (
                    <p className="mt-2 line-clamp-2 text-sm text-luxury-muted">{row.analysis_teaser}</p>
                  ) : null}
                  <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {(test?.scoreKeys ?? Object.keys(row.scores)).map((key) => {
                      const val = (row.scores as Record<string, number>)[key] ?? 0;
                      const label =
                        row.test_slug === 'big-five'
                          ? BIG_FIVE_LABELS[key]?.[locale] ?? key
                          : ATTACHMENT_LABELS[key]?.[locale] ?? key;
                      return (
                        <div key={key} className="flex justify-between rounded-lg bg-white/50 px-2.5 py-1.5 text-xs">
                          <dt className="text-luxury-muted">{label}</dt>
                          <dd className="font-semibold text-luxury-ink">
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
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      {history.filter((r) => r.test_slug === 'big-five').length >= 2 ? (
        <section data-testid="test-compare">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-luxury-soft">{t.compare}</h2>
          <p className="mt-2 text-sm text-luxury-muted">{t.sameFormat}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-luxury-muted">
              {t.pickA}
              <select
                className="mt-1 w-full rounded-xl border border-luxury-ink/10 bg-white/80 px-3 py-2 text-sm text-luxury-ink"
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
            <label className="text-xs text-luxury-muted">
              {t.pickB}
              <select
                className="mt-1 w-full rounded-xl border border-luxury-ink/10 bg-white/80 px-3 py-2 text-sm text-luxury-ink"
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
            <GlassCard className="mt-5 p-4 md:p-6">
              <OceanRadar
                slices={slicesA}
                compareSlices={slicesB}
                compareLabel={`${t.radarThen} · ${t.radarNow}`}
                size={280}
              />
              <div className="mt-3 flex justify-center gap-4 text-[11px] text-luxury-muted">
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#c45d3e]" />
                  {t.radarNow}
                </span>
                <span>
                  <span className="mr-1 inline-block h-0.5 w-4 bg-[#958780] align-middle" />
                  {t.radarThen}
                </span>
              </div>
            </GlassCard>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
