'use client';

import Link from 'next/link';
import { useState } from 'react';

import { SelfTestRunner } from '@/components/SelfKnowledge/SelfTestRunner';
import { GlassCard } from '@/components/ui/GlassCard';
import { getSelfTest } from '@/lib/self-knowledge/scoring';
import type { SelfTestResultRow } from '@/lib/self-knowledge/store';
import type { ClientLang } from '@/lib/compte/i18n';
import type { BigFiveFormat, SelfTestSlug } from '@/lib/self-knowledge/types';
import { ATTACHMENT_LABELS } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_LABELS } from '@/lib/self-knowledge/ipip50';

type Props = {
  lang: ClientLang;
  slug: SelfTestSlug;
  email: string;
  firstName: string | null;
  history: SelfTestResultRow[];
  initialFormat?: BigFiveFormat;
};

function formatDate(iso: string, lang: ClientLang): string {
  const loc = lang === 'es' ? 'es-ES' : lang === 'en' ? 'en-GB' : 'fr-FR';
  return new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SelfKnowledgeMemberTest({
  lang,
  slug,
  email,
  firstName,
  history,
  initialFormat,
}: Props) {
  const test = getSelfTest(slug);
  const locale = lang === 'es' ? 'es' : 'fr';
  const [mode, setMode] = useState<'history' | 'take'>('history');

  const t =
    lang === 'es'
      ? {
          history: 'Historial',
          take: 'Hacer el test de nuevo',
          back: 'Conocimiento de uno mismo',
          modeClaude: 'IA',
          modeTemplate: 'Plantilla',
          scores: 'Puntuaciones',
        }
      : lang === 'en'
        ? {
            history: 'History',
            take: 'Take test again',
            back: 'Self-knowledge',
            modeClaude: 'AI',
            modeTemplate: 'Template',
            scores: 'Scores',
          }
        : {
            history: 'Historique',
            take: 'Refaire le test',
            back: 'Connaissance de soi',
            modeClaude: 'IA',
            modeTemplate: 'Modèle',
            scores: 'Scores',
          };

  if (!test) return null;

  if (mode === 'take') {
    return (
      <SelfTestRunner
        test={test}
        locale={locale}
        mode="member"
        memberEmail={email}
        memberFirstName={firstName}
        initialFormat={slug === 'big-five' ? initialFormat : undefined}
      />
    );
  }

  const slugHistory = history.filter((r) => r.test_slug === slug);

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 pt-2 md:px-8 md:pt-6">
      <Link href="/compte/connaissance-de-soi" className="mb-4 inline-block text-sm text-luxury-muted underline underline-offset-4">
        ← {t.back}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="hero-signature-title text-3xl md:text-4xl">{test.title[locale]}</h1>
        <button
          type="button"
          onClick={() => setMode('take')}
          className="btn-luxury-primary px-5 py-2.5 text-[11px] tracking-[0.12em]"
        >
          {t.take}
        </button>
      </header>

      {slugHistory.length === 0 ? (
        <GlassCard className="mt-8 p-6">
          <p className="text-sm text-luxury-muted">
            {locale === 'es' ? 'Aún no has hecho este test.' : 'Tu n’as pas encore passé ce test.'}
          </p>
          <button type="button" onClick={() => setMode('take')} className="btn-luxury-primary mt-4 px-5 py-2.5 text-[11px]">
            {t.take}
          </button>
        </GlassCard>
      ) : (
        <div className="mt-8 space-y-4">
          {slugHistory.map((row) => (
            <GlassCard key={row.id} className="p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-soft">
                  {formatDate(row.created_at, lang)}
                </p>
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-orange-800">
                  {row.analysis_mode === 'claude' ? t.modeClaude : t.modeTemplate}
                </span>
              </div>
              {row.analysis_teaser ? (
                <p className="mt-3 text-sm leading-relaxed text-luxury-muted">{row.analysis_teaser}</p>
              ) : null}
              {row.analysis_full ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] text-luxury-muted">
                    {locale === 'es' ? 'Análisis completo' : 'Analyse complète'}
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-luxury-muted">{row.analysis_full}</p>
                </details>
              ) : null}
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-luxury-soft">{t.scores}</p>
              <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                {test.scoreKeys.map((key) => {
                  const val = (row.scores as Record<string, number>)?.[key] ?? 0;
                  const label =
                    slug === 'big-five'
                      ? BIG_FIVE_LABELS[key]?.[locale] ?? key
                      : ATTACHMENT_LABELS[key]?.[locale] ?? key;
                  const is120 = (row.test_version ?? '').includes('120');
                  const formatted =
                    slug === 'big-five'
                      ? `${val}/50${is120 ? ' · IPIP-120' : ' · IPIP-50'}`
                      : `${Number(val).toFixed(1)}/7`;
                  return (
                    <div key={key} className="flex justify-between rounded-xl bg-white/40 px-3 py-2 text-sm">
                      <dt className="text-luxury-muted">{label}</dt>
                      <dd className="font-semibold text-luxury-ink">{formatted}</dd>
                    </div>
                  );
                })}
              </dl>
            </GlassCard>
          ))}
        </div>
      )}
    </main>
  );
}

