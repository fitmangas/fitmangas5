'use client';

import Link from 'next/link';

import { ATTACHMENT_LABELS } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_LABELS } from '@/lib/self-knowledge/ipip50';
import type {
  AnalysisMode,
  SelfTestAnalysis,
  SelfTestDefinition,
  SelfTestLang,
  SelfTestScores,
} from '@/lib/self-knowledge/types';

type Props = {
  locale: SelfTestLang;
  test: SelfTestDefinition;
  scores: SelfTestScores;
  analysis: SelfTestAnalysis;
  trialHref: string;
  hubHref: string;
  /** Membre connectée : affiche l’analyse complète */
  showFull?: boolean;
};

function formatScoreLabel(test: SelfTestDefinition, key: string, locale: SelfTestLang): string {
  if (test.slug === 'big-five') {
    return BIG_FIVE_LABELS[key]?.[locale] ?? key;
  }
  return ATTACHMENT_LABELS[key]?.[locale] ?? key;
}

function formatScoreValue(test: SelfTestDefinition, key: string, value: number): string {
  if (test.slug === 'big-five') return `${value}/50`;
  return `${value}/5`;
}

function modeBadge(mode: AnalysisMode, locale: SelfTestLang): string {
  if (mode === 'claude') return locale === 'es' ? 'Análisis IA' : 'Analyse IA';
  return locale === 'es' ? 'Análisis plantilla' : 'Analyse modèle';
}

export function SelfTestTeaser({
  locale,
  test,
  scores,
  analysis,
  trialHref,
  hubHref,
  showFull = false,
}: Props) {
  const t =
    locale === 'es'
      ? {
          eyebrow: 'Tu resultado',
          strengths: 'Fortalezas relativas',
          scores: 'Puntuaciones',
          cta: 'Probar 7 días gratis',
          hub: 'Ver todos los tests',
          fullTitle: 'Análisis completo',
          teaserTitle: 'Vista previa',
        }
      : {
          eyebrow: 'Ton résultat',
          strengths: 'Forces relatives',
          scores: 'Scores',
          cta: 'Essayer 7 jours gratuits',
          hub: 'Voir tous les tests',
          fullTitle: 'Analyse complète',
          teaserTitle: 'Aperçu',
        };

  const body = showFull ? analysis.full : analysis.teaser;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 pb-20">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.eyebrow}</p>
      <h2 className="mt-3 font-serif text-[1.85rem] italic leading-tight text-brand-ink">{test.title[locale]}</h2>

      <span className="mt-4 inline-flex rounded-full border border-[#c45d3e]/30 bg-[#c45d3e]/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c45d3e]">
        {modeBadge(analysis.mode, locale)}
      </span>

      <section className="mt-8 rounded-[24px] border border-brand-ink/[0.06] bg-white/85 p-6 shadow-sm">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ink/50">
          {showFull ? t.fullTitle : t.teaserTitle}
        </h3>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-brand-ink/75">{body}</p>
      </section>

      {analysis.strengths.length > 0 ? (
        <section className="mt-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ink/50">{t.strengths}</h3>
          <ul className="mt-3 space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="rounded-xl border border-[#c45d3e]/15 bg-white/70 px-4 py-3 text-[14px] text-brand-ink/70">
                {s}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-ink/50">{t.scores}</h3>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {test.scoreKeys.map((key) => (
            <div key={key} className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-2.5">
              <dt className="text-[13px] text-brand-ink/60">{formatScoreLabel(test, key, locale)}</dt>
              <dd className="text-[13px] font-semibold text-brand-ink">
                {formatScoreValue(test, key, scores[key] ?? 0)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {!showFull ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={trialHref}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#c45d3e] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
          >
            {t.cta} →
          </Link>
          <Link
            href={hubHref}
            className="inline-flex flex-1 items-center justify-center rounded-full border-2 border-[#c45d3e]/40 bg-white/80 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c45d3e] transition hover:bg-white"
          >
            {t.hub}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
