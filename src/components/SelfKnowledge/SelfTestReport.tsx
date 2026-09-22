'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';

import { OceanRadar, buildOceanSlices } from '@/components/SelfKnowledge/OceanRadar';
import { SelfTestShareInvite } from '@/components/SelfKnowledge/SelfTestShareInvite';
import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import { ATTACHMENT_LABELS } from '@/lib/self-knowledge/ecr-short';
import { BIG_FIVE_LABELS } from '@/lib/self-knowledge/ipip50';
import { OCEAN_TRAIT_SHORT } from '@/lib/self-knowledge/ocean-palette';
import { buildSelfTestReportPdfFromElement, downloadBlob } from '@/lib/self-knowledge/build-self-test-pdf';
import type {
  SelfTestAnalysis,
  SelfTestDefinition,
  SelfTestFacetSection,
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
  firstName?: string | null;
  inviterEmail?: string | null;
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
    facets: 'Facettes',
    practice: 'Ce que ça change pour ta pratique',
    micro: 'Micro-recommandation',
    lockedTitle: 'Analyse complète réservée aux membres',
    lockedCta: 'Récupère ton analyse complète',
    pdf: 'Télécharger le PDF',
    hub: 'Autre test',
    trial: 'Essai gratuit 7 jours',
    human: 'Elles aussi ont un profil — et un créneau collectif',
    humanSub: 'Vidéos d’adhérentes.',
    modeClaude: 'Analyse IA',
    modeTemplate: 'Analyse modèle',
    navPortrait: 'Portrait',
    navProfil: 'Profil',
    navForces: 'Forces',
    navLimits: 'Limites',
    navFacets: 'Facettes',
    navPractice: 'Pratique',
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
    facets: 'Facetas',
    practice: 'Qué cambia para tu práctica',
    micro: 'Micro-recomendación',
    lockedTitle: 'Análisis completo reservado a socias',
    lockedCta: 'Recupera tu análisis completo',
    pdf: 'Descargar el PDF',
    hub: 'Otro test',
    trial: 'Prueba gratis 7 días',
    human: 'Ellas también tienen un perfil — y una cita',
    humanSub: 'Vídeos de alumnas.',
    modeClaude: 'Análisis IA',
    modeTemplate: 'Análisis plantilla',
    navPortrait: 'Retrato',
    navProfil: 'Perfil',
    navForces: 'Fuerzas',
    navLimits: 'Límites',
    navFacets: 'Facetas',
    navPractice: 'Práctica',
  },
} as const;

const PARENT_ORDER = ['E', 'A', 'C', 'ES', 'O'] as const;

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
  return <p className="text-[15px] leading-[1.8] text-brand-ink/75 whitespace-pre-line">{text}</p>;
}

function FacetBar({ band, bandLabel }: { band: 'low' | 'mid' | 'high'; bandLabel: string }) {
  const pct = band === 'high' ? 88 : band === 'low' ? 22 : 52;
  return (
    <div className="flex min-w-[7.5rem] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-ink/[0.08]">
        <div
          className="h-full rounded-full bg-[#c45d3e]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-brand-ink/45">
        {bandLabel}
      </span>
    </div>
  );
}

function FacetsByTrait({
  facets,
  locale,
}: {
  facets: SelfTestFacetSection[];
  locale: SelfTestLang;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, SelfTestFacetSection[]>();
    for (const f of facets) {
      const parent = f.parentTrait ?? f.id.charAt(0);
      const list = map.get(parent) ?? [];
      list.push(f);
      map.set(parent, list);
    }
    return PARENT_ORDER.filter((k) => map.has(k)).map((k) => ({
      key: k,
      label: BIG_FIVE_LABELS[k]?.[locale] ?? k,
      facets: map.get(k)!,
      openByDefault: map.get(k)!.some((f) => f.band === 'high' || f.band === 'low'),
    }));
  }, [facets, locale]);

  return (
    <div className="space-y-3" data-testid="facets-accordion">
      {grouped.map((group) => (
        <details
          key={group.key}
          open={group.openByDefault}
          className="rounded-[20px] border border-white/55 bg-white/85 px-4 py-3"
        >
          <summary className="cursor-pointer list-none text-[13px] font-semibold text-brand-ink/80">
            <span className="text-[#c45d3e]">{group.label}</span>
            <span className="ml-2 text-[11px] font-normal text-brand-ink/40">
              {group.facets.length} {locale === 'es' ? 'facetas' : 'facettes'}
            </span>
          </summary>
          <div className="mt-3 space-y-2 border-t border-brand-ink/[0.06] pt-3">
            {group.facets.map((facet) => {
              const salient = facet.band === 'high' || facet.band === 'low';
              return (
                <details
                  key={facet.id}
                  open={salient}
                  className="rounded-xl bg-[#FFFAF5]/80 px-3 py-2.5"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-[12.5px] font-medium text-brand-ink/75">
                    <span>{facet.label}</span>
                    <FacetBar band={facet.band} bandLabel={facet.bandLabel} />
                  </summary>
                  <div className="mt-2 space-y-2 border-t border-brand-ink/[0.05] pt-2">
                    <p className="text-[13px] leading-relaxed text-brand-ink/65">{facet.narrative}</p>
                    <p className="text-[12px] text-[#6B8F71]">
                      <span className="font-semibold">{locale === 'es' ? 'Fortaleza' : 'Force'} : </span>
                      {facet.force}
                    </p>
                    <p className="text-[12px] text-[#5B7C8D]">
                      <span className="font-semibold">{locale === 'es' ? 'Límite' : 'Limite'} : </span>
                      {facet.limit}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
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

function firstSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?…]+[.!?…]+/g);
  if (!sentences?.length) return text.slice(0, 280).trim();
  return sentences.slice(0, count).join(' ').trim();
}

export function SelfTestReport({
  locale,
  test,
  scores,
  analysis,
  trialHref,
  hubHref,
  showFull,
  firstName,
  inviterEmail,
}: Props) {
  const t = LABELS[locale];
  const portrait = analysis.portrait;
  const sections = analysis.sections
    ? {
        ...analysis.sections,
        forces:
          analysis.sections.forces.length > 0
            ? analysis.sections.forces
            : analysis.strengths.filter(Boolean).slice(0, 3),
      }
    : undefined;
  const accent = '#C45D3E';
  const [pdfBusy, setPdfBusy] = useState(false);

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
  const modeLabel = analysis.mode === 'claude' ? t.modeClaude : t.modeTemplate;

  const navItems = [
    { id: 'portrait', label: t.navPortrait },
    { id: 'scores', label: t.navProfil },
    { id: 'forces', label: t.navForces },
    { id: 'limits', label: t.navLimits },
    ...(sections?.facets?.length ? [{ id: 'facets', label: t.navFacets }] : []),
    ...(sections?.practiceImpact?.length ? [{ id: 'practice', label: t.navPractice }] : []),
  ];

  async function handlePdf() {
    if (pdfBusy || !sections || !showFull) return;
    setPdfBusy(true);
    try {
      const el = document.querySelector<HTMLElement>('[data-testid="self-test-report"]');
      if (!el) throw new Error('Rapport introuvable pour PDF');
      const blob = await buildSelfTestReportPdfFromElement(el, {
        footer:
          locale === 'es'
            ? `${analysis.instrumentVersion ?? test.slug} · fitmangas.com`
            : `${analysis.instrumentVersion ?? test.slug} · fitmangas.com`,
      });
      const slug = heroName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      downloadBlob(blob, `fitmangas-${test.slug}-${slug || 'resultat'}.pdf`);
    } finally {
      setPdfBusy(false);
    }
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

      <section id="forces" className="scroll-mt-28 mt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B8F71]">{t.strengths}</p>
        <div className="mt-4">
          <NumberedList items={sections.forces} accent="#6B8F71" />
        </div>
      </section>

      <section id="limits" className="scroll-mt-28 mt-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B7C8D]">{t.limits}</p>
        <div className="mt-4">
          <NumberedList items={sections.limits} accent="#5B7C8D" />
        </div>
      </section>

      {sections.practiceImpact?.length ? (
        <section id="practice" className="scroll-mt-28 mt-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.practice}</p>
          <ul className="mt-4 space-y-3">
            {sections.practiceImpact.map((p) => (
              <li
                key={p.slice(0, 40)}
                className="rounded-[20px] border border-[#c45d3e]/12 bg-[#FFFAF5] px-4 py-3.5 text-[14px] leading-relaxed text-brand-ink/75"
              >
                {p}
              </li>
            ))}
          </ul>
          {sections.microRecommendation ? (
            <p
              className="mt-5 rounded-full border border-[#c45d3e]/20 bg-white px-4 py-3 text-center text-[13px] font-medium text-[#c45d3e]"
              data-testid="micro-recommendation"
            >
              {sections.microRecommendation}
            </p>
          ) : null}
        </section>
      ) : null}

      {sections.facets?.length ? (
        <section id="facets" className="scroll-mt-28 mt-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">{t.facets}</p>
          <div className="mt-4">
            <FacetsByTrait facets={sections.facets} locale={locale} />
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
    <article
      className="self-test-report mx-auto max-w-3xl px-5 py-10 sm:max-w-4xl sm:py-14"
      data-testid="self-test-report"
      data-show-full={showFull ? 'true' : 'false'}
      data-slug={test.slug}
      data-format={test.format ?? (test.slug === 'attachement' ? 'ecr-s' : 'ipip-50')}
    >
      {/* En-tête logo visible à l’impression / PDF */}
      <div className="mb-6 hidden items-center gap-2 print:flex" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
        <span className="text-[13px] font-semibold tracking-wide text-brand-ink">FitMangas</span>
      </div>

      {showFull ? (
        <nav
          className="sticky top-[52px] z-30 mb-8 -mx-1 overflow-x-auto rounded-full border border-white/70 bg-white/90 px-2 py-2 shadow-[0_8px_24px_rgba(60,40,30,0.08)] backdrop-blur-md"
          data-testid="report-sticky-nav"
        >
          <ul className="flex min-w-max items-center gap-1 px-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-ink/50 transition hover:bg-[#FFFAF5] hover:text-[#c45d3e]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <header id="portrait-header" className="glass-card relative overflow-hidden rounded-[32px] border border-white/55 bg-white/80">
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
          ) : null}
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
          <div className="glass-card rounded-[28px] border border-white/55 bg-white/80 p-4">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">
              {t.radar}
            </p>
            <OceanRadar slices={oceanSlices} size={260} />
            <div className="mt-3 space-y-2 px-2" data-testid="score-phrases">
              {(sections?.scorePhrases ?? []).map((sp) => (
                <div key={sp.key} className="flex items-baseline justify-between gap-3 text-[12px]">
                  <span className="font-medium text-brand-ink/70">
                    {sp.label}{' '}
                    <span className="tabular-nums text-brand-ink/40">{sp.percent}%</span>
                  </span>
                  <span className="text-right text-brand-ink/50">— {sp.phrase}</span>
                </div>
              ))}
            </div>
          </div>
        ) : test.slug === 'attachement' ? (
          <div className="glass-card rounded-[28px] border border-white/55 bg-white/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.bars}</p>
            <div className="mt-4 space-y-4" data-testid="score-phrases">
              {(sections?.scorePhrases ?? []).map((sp) => (
                <div key={sp.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[14px] font-medium text-brand-ink/70">
                      {sp.label}{' '}
                      <span className="tabular-nums text-[12px] text-brand-ink/40">{sp.percent}%</span>
                    </span>
                    <span className="text-[12px] text-brand-ink/50">— {sp.phrase}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-brand-ink/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#c45d3e]"
                      style={{ width: `${Math.max(sp.percent, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
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

      <div className="self-test-no-print mt-10 flex flex-col items-center gap-5 pb-16" data-testid="report-actions">
        <div className="flex flex-wrap justify-center gap-3">
          {showFull ? (
            <button
              type="button"
              data-testid="download-pdf"
              onClick={() => void handlePdf()}
              disabled={pdfBusy}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 border-brand-ink/15 bg-white/80 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(28,24,20,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#c45d3e] hover:text-[#c45d3e] disabled:opacity-60"
            >
              {pdfBusy ? '…' : t.pdf}
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
        {showFull ? (
          <SelfTestShareInvite
            locale={locale}
            firstName={firstName ?? null}
            inviterEmail={inviterEmail ?? null}
          />
        ) : null}
      </div>
    </article>
  );
}
