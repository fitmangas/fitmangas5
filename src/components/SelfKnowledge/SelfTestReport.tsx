'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';

import { OceanRadar, buildOceanSlices } from '@/components/SelfKnowledge/OceanRadar';
import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import { ATTACHMENT_LABELS } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_LABELS } from '@/lib/self-knowledge/ipip50';
import { OCEAN_TRAIT_SHORT } from '@/lib/self-knowledge/ocean-palette';
import type {
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
  showFull: boolean;
};

const LABELS = {
  fr: {
    report: 'Ton résultat',
    radar: 'Forme de ton profil',
    bars: 'Tes dimensions',
    who: 'Qui tu es',
    how: 'Comment tu fonctionnes',
    strengths: 'Tes forces',
    limits: 'Tes limites — sans te juger',
    combinations: 'Combinaisons repérées',
    facets: 'Facettes détaillées',
    lockedTitle: 'Analyse complète réservée aux membres',
    lockedCta: 'Récupère ton analyse complète',
    save: 'Enregistrer',
    hub: 'Autre test',
    trial: 'Essai gratuit 7 jours',
    human: 'Elles aussi ont un profil — et un rendez-vous',
    humanSub: 'Vidéos d’adhérentes.',
    notDiagnosis: 'Indicatif — pas un diagnostic. Les scores évoluent avec le temps.',
    modeClaude: 'Analyse IA',
    modeTemplate: 'Analyse modèle',
  },
  es: {
    report: 'Tu resultado',
    radar: 'Forma de tu perfil',
    bars: 'Tus dimensiones',
    who: 'Quién eres',
    how: 'Cómo funcionas',
    strengths: 'Tus fuerzas',
    limits: 'Tus límites — sin juzgarte',
    combinations: 'Combinaciones detectadas',
    facets: 'Facetas detalladas',
    lockedTitle: 'Análisis completo reservado a socias',
    lockedCta: 'Recupera tu análisis completo',
    save: 'Guardar',
    hub: 'Otro test',
    trial: 'Prueba gratis 7 días',
    human: 'Ellas también tienen un perfil — y una cita',
    humanSub: 'Vídeos de alumnas.',
    notDiagnosis: 'Orientativo — no es un diagnóstico. Las puntuaciones evolucionan.',
    modeClaude: 'Análisis IA',
    modeTemplate: 'Análisis plantilla',
  },
} as const;

const terracottaCta =
  'inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_12px_26px_rgba(196,93,62,0.28)] transition hover:brightness-110';

function NumberedList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="flex flex-col">
      {items.map((line, i) => (
        <li
          key={`${i}-${line.slice(0, 24)}`}
          className="flex gap-3 border-b border-brand-ink/[0.06] py-3.5 last:border-b-0"
        >
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-[15px] leading-relaxed text-brand-ink/80">{line}</span>
        </li>
      ))}
    </ul>
  );
}

function ProseBlock({ text }: { text: string }) {
  return (
    <p className="text-[15px] leading-[1.8] text-brand-ink/75 whitespace-pre-line">{text}</p>
  );
}

function AttachmentBars({
  scores,
  locale,
}: {
  scores: SelfTestScores;
  locale: SelfTestLang;
}) {
  const dims = ['anxiety', 'avoidance'] as const;
  const colors = { anxiety: '#C45D3E', avoidance: '#5B7C8D' };

  return (
    <div className="space-y-4">
      {dims.map((key) => {
        const raw = scores[key] ?? 4;
        const pct = Math.round(((raw - 1) / 6) * 100);
        const label = ATTACHMENT_LABELS[key]?.[locale] ?? key;
        return (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[14px] font-medium text-brand-ink/70">{label}</span>
              <span className="tabular-nums text-[13px] font-semibold text-brand-ink/40">
                {raw}/7
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-brand-ink/[0.06]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(pct, 4)}%`,
                  background: `linear-gradient(90deg, ${colors[key]}, ${colors[key]}cc)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function downloadTextFile(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LockedSection({
  locale,
  trialHref,
  children,
}: {
  locale: SelfTestLang;
  trialHref: string;
  children: ReactNode;
}) {
  const t = LABELS[locale];
  return (
    <div className="relative mt-14 overflow-hidden rounded-[28px]">
      <div className="pointer-events-none select-none blur-[6px] opacity-40">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/75 px-6 py-10 backdrop-blur-sm">
        <Lock className="h-8 w-8 text-[#c45d3e]/70" aria-hidden />
        <p className="max-w-sm text-center text-[14px] font-medium text-brand-ink/70">{t.lockedTitle}</p>
        <Link href={trialHref} className={terracottaCta}>
          {t.lockedCta} →
        </Link>
      </div>
    </div>
  );
}

export function SelfTestReport({
  locale,
  test,
  scores,
  analysis,
  trialHref,
  hubHref,
  showFull,
}: Props) {
  const t = LABELS[locale];
  const portrait = analysis.portrait;
  const sections = analysis.sections;
  const accent = '#C45D3E';

  const traitLabel = (key: string) => {
    if (test.slug === 'big-five') {
      return OCEAN_TRAIT_SHORT[key as keyof typeof OCEAN_TRAIT_SHORT]?.[locale] ?? key;
    }
    return ATTACHMENT_LABELS[key]?.[locale] ?? key;
  };

  const oceanSlices =
    test.slug === 'big-five'
      ? buildOceanSlices(test.scoreKeys, scores, (key) =>
          BIG_FIVE_LABELS[key]?.short[locale] ?? traitLabel(key),
        )
      : [];

  const heroName = portrait?.name ?? test.title[locale];
  const heroTagline = portrait?.tagline ?? analysis.teaser.slice(0, 160);

  const modeLabel =
    analysis.mode === 'claude' ? t.modeClaude : t.modeTemplate;

  function handleSave() {
    const slug = heroName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    downloadTextFile(analysis.full, `fitmangas-${test.slug}-${slug || 'resultat'}.txt`);
  }

  const strengthsPreview = analysis.strengths.slice(0, 2);

  const fullSections = sections ? (
    <>
      <section id="portrait" className="scroll-mt-28 mt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.who}</p>
        <blockquote
          className="mt-4 border-l-4 pl-5 font-serif text-[1.25rem] italic leading-snug text-brand-ink sm:text-[1.4rem]"
          style={{ borderColor: accent }}
        >
          {sections.whoYouAre.slice(0, 280)}
          {sections.whoYouAre.length > 280 ? '…' : ''}
        </blockquote>
        {sections.whoYouAre.length > 280 ? (
          <div className="mt-6">
            <ProseBlock text={sections.whoYouAre.slice(280)} />
          </div>
        ) : null}
      </section>

      <section id="how" className="scroll-mt-28 mt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B7C8D]">{t.how}</p>
        <div className="mt-4">
          <ProseBlock text={sections.howYouWork} />
        </div>
        {sections.combinations.length > 0 ? (
          <div className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/40">
              {t.combinations}
            </p>
            <ul className="mt-3 space-y-2">
              {sections.combinations.map((c) => (
                <li
                  key={c.slice(0, 40)}
                  className="rounded-2xl border border-brand-ink/[0.06] bg-brand-beige/40 px-4 py-3 text-[14px] leading-relaxed text-brand-ink/80"
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section id="forces" className="scroll-mt-28 mt-14 space-y-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B8F71]">{t.strengths}</p>
          <div className="mt-4">
            <NumberedList items={sections.forces} accent="#6B8F71" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B7C8D]">{t.limits}</p>
          <div className="mt-4">
            <NumberedList items={sections.limits} accent="#5B7C8D" />
          </div>
        </div>
      </section>

      {sections.facets?.length ? (
        <section id="facets" className="scroll-mt-28 mt-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">{t.facets}</p>
          <div className="mt-4 space-y-3">
            {sections.facets.map((facet) => (
              <details
                key={facet.id}
                className="glass-card rounded-[20px] border border-white/55 bg-white/80 px-5 py-4"
              >
                <summary className="cursor-pointer text-[13px] font-semibold text-brand-ink/75">
                  {facet.label}{' '}
                  <span className="text-[11px] font-normal text-brand-ink/40">({facet.score}/20)</span>
                </summary>
                <div className="mt-3 space-y-3 border-t border-brand-ink/[0.06] pt-3">
                  <p className="text-[14px] leading-relaxed text-brand-ink/70">{facet.narrative}</p>
                  <p className="text-[13px] text-[#6B8F71]">
                    <span className="font-semibold">{locale === 'es' ? 'Fortaleza' : 'Force'} : </span>
                    {facet.force}
                  </p>
                  <p className="text-[13px] text-[#5B7C8D]">
                    <span className="font-semibold">{locale === 'es' ? 'Límite' : 'Limite'} : </span>
                    {facet.limit}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </>
  ) : (
    <section className="mt-10">
      <ProseBlock text={showFull ? analysis.full : analysis.teaser} />
    </section>
  );

  return (
    <article className="self-test-report mx-auto max-w-3xl px-5 py-10 sm:max-w-4xl sm:py-14">
      <header className="glass-card relative overflow-hidden rounded-[32px] border border-white/55 bg-white/80 transition duration-200 hover:-translate-y-0.5">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">{t.report}</p>
            {analysis.sourceBadge ? (
              <span className="text-[10px] text-brand-ink/35">· {analysis.sourceBadge}</span>
            ) : null}
            <span className="text-[10px] text-brand-ink/30">· {modeLabel}</span>
          </div>
          <h1 className="mt-5 font-serif text-[2rem] italic leading-[1.05] tracking-tight text-brand-ink sm:text-[2.5rem]">
            {heroName}
          </h1>
          <p className="mt-4 text-[16px] leading-snug text-brand-ink/70">{heroTagline}</p>
          {portrait?.disclaimer ? (
            <p className="mt-3 text-[11px] leading-relaxed text-brand-ink/40">{portrait.disclaimer}</p>
          ) : (
            <p className="mt-3 text-[11px] leading-relaxed text-brand-ink/40">{t.notDiagnosis}</p>
          )}
          {strengthsPreview.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {strengthsPreview.map((s) => (
                <span
                  key={s.slice(0, 32)}
                  className="rounded-full border border-[#6B8F71]/25 bg-[#6B8F71]/8 px-3 py-1.5 text-[11px] text-brand-ink/65"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <section id="scores" className="scroll-mt-28 mt-10 space-y-6">
        {test.slug === 'big-five' && oceanSlices.length >= 5 ? (
          <div className="glass-card rounded-[28px] border border-white/55 bg-white/80 p-4 transition duration-200 hover:-translate-y-0.5">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">
              {t.radar}
            </p>
            <OceanRadar slices={oceanSlices} size={260} />
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {oceanSlices.map((s) => (
                <span key={s.key} className="text-[10px] text-brand-ink/45">
                  <span className="font-bold" style={{ color: s.color }}>
                    {s.label}
                  </span>{' '}
                  {Math.round(s.value * 100)}%
                </span>
              ))}
            </div>
          </div>
        ) : test.slug === 'attachement' ? (
          <div className="glass-card rounded-[28px] border border-white/55 bg-white/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.bars}</p>
            <div className="mt-4">
              <AttachmentBars scores={scores} locale={locale} />
            </div>
          </div>
        ) : null}
      </section>

      {!showFull && sections ? (
        <>
          <section className="mt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.who}</p>
            <p className="mt-4 text-[15px] leading-[1.75] text-brand-ink/75">
              {firstSentences(sections.whoYouAre, 2)}
            </p>
          </section>
          <LockedSection locale={locale} trialHref={trialHref}>
            {fullSections}
          </LockedSection>
        </>
      ) : (
        fullSections
      )}

      <div className="mt-12 border-t border-brand-ink/[0.06] pt-10">
        <QuizVideoProof locale={locale} title={t.human} subtitle={t.humanSub} />
      </div>

      <div className="self-test-no-print mt-10 flex flex-col items-center gap-3 pb-16">
        <div className="flex flex-wrap justify-center gap-3">
          {showFull ? (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 border-brand-ink/15 bg-white/80 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(28,24,20,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#c45d3e] hover:text-[#c45d3e]"
            >
              {t.save}
            </button>
          ) : null}
          <Link href={trialHref} className={terracottaCta}>
            {t.trial}
          </Link>
          <Link
            href={hubHref}
            className="inline-flex items-center px-2 py-3 text-[13px] text-brand-ink/45 hover:text-[#c45d3e]"
          >
            {t.hub}
          </Link>
        </div>
      </div>
    </article>
  );
}

function firstSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?…]+[.!?…]+/g);
  if (!sentences?.length) return text.slice(0, 280).trim();
  return sentences.slice(0, count).join(' ').trim();
}
