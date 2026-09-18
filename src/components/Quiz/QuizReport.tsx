'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  BulletCards,
  DiscRadar,
  DiscWheel,
  MixBars,
  ReportCard,
} from '@/components/Quiz/QuizVisuals';
import type { DiscLetter } from '@/lib/quiz/disc-palette';
import { DISC_LETTER_COLOR } from '@/lib/quiz/disc-palette';
import { QUIZ_HERO_BY_SLUG, QUIZ_PROOF_IMAGES } from '@/lib/quiz/media';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

type Props = {
  quiz: QuizDefinition;
  result: QuizResult;
  score: QuizScore;
  locale: QuizLocale;
  trialHref: string;
  hubHref: string;
};

const LABELS = {
  fr: {
    report: 'Compte-rendu',
    secondary: 'Style secondaire',
    mix: 'Répartition',
    wheel: 'Roue des 4 couleurs',
    radar: 'Radar de ton mix',
    portrait: 'Ce que ça veut dire',
    how: 'Comment tu fonctionnes',
    strengths: 'Tes forces',
    limits: 'Tes limites — sans te juger',
    stress: 'Sous stress',
    fears: 'Tes peurs (utiles à connaître)',
    needs: 'Ce dont tu as besoin pour tenir',
    talk: 'Comment te parler',
    notalk: 'Ce qu’il ne faut pas te dire',
    develop: 'Axes de développement',
    bridge: 'Et maintenant',
    pdf: 'Enregistrer en PDF',
    share: 'Partager',
    other: 'Autre évaluation',
    discNote:
      'Lecture comportementale inspirée du modèle DISC (Dominant / Influent / Stable / Conforme), adaptée au sport et à ton agenda. Ce n’est PAS un test Everything DiSC® / Wiley certifié, ni leurs questions officielles, ni un diagnostic. Inspiration libre : 4 couleurs, 4 profils FitMangas.',
    env:
      'En environnement favorable, ce style est une ressource. En environnement défavorable (flou, solitude, pression mal placée), il se retourne — c’est souvent là que tu abandonnes.',
  },
  es: {
    report: 'Informe',
    secondary: 'Estilo secundario',
    mix: 'Reparto',
    wheel: 'Rueda de 4 colores',
    radar: 'Radar de tu mix',
    portrait: 'Qué significa',
    how: 'Cómo funcionas',
    strengths: 'Tus fuerzas',
    limits: 'Tus límites — sin juzgarte',
    stress: 'Bajo estrés',
    fears: 'Tus miedos (útil conocerlos)',
    needs: 'Lo que necesitas para sostenerte',
    talk: 'Cómo hablarte',
    notalk: 'Lo que no hay que decirte',
    develop: 'Ejes de desarrollo',
    bridge: 'Y ahora',
    pdf: 'Guardar en PDF',
    share: 'Compartir',
    other: 'Otra evaluación',
    discNote:
      'Lectura de comportamiento inspirada en el modelo DISC (Dominante / Influyente / Estable / Cumplidor), adaptada al deporte y a tu agenda. NO es un test Everything DiSC® / Wiley certificado, ni sus preguntas oficiales, ni un diagnóstico. Inspiración libre: 4 colores, 4 perfiles FitMangas.',
    env:
      'En un entorno favorable, este estilo es un recurso. En uno desfavorable (vaguedad, soledad, presión mal puesta), se vuelve en contra — a menudo ahí abandonas.',
  },
} as const;

export function QuizReport({ quiz, result, score, locale, trialHref, hubHref }: Props) {
  const t = LABELS[locale];
  const report = result.report;
  if (!report) return null;

  const letter = (result.letter as DiscLetter | undefined) ?? undefined;
  const accent = (letter && DISC_LETTER_COLOR[letter]) || quiz.accent;
  const secondary = score.secondaryId ? quiz.results.find((r) => r.id === score.secondaryId) : null;
  const primaryPct = score.percents[result.id] ?? 0;
  const hero = QUIZ_HERO_BY_SLUG[quiz.slug] ?? QUIZ_PROOF_IMAGES[0];

  const slices = score.ranked
    .map((row) => {
      const profile = quiz.results.find((r) => r.id === row.id);
      if (!profile?.letter) return null;
      return {
        letter: profile.letter as DiscLetter,
        percent: row.percent,
        label: profile.title[locale],
        winner: row.id === result.id,
      };
    })
    .filter(Boolean) as { letter: DiscLetter; percent: number; label: string; winner?: boolean }[];

  function savePdf() {
    window.print();
  }

  async function share() {
    const text = result.shareLine[locale];
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: result.title[locale], text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
    } catch {
      /* cancel */
    }
  }

  return (
    <article className="quiz-report mx-auto max-w-5xl px-5 py-10 sm:py-14">
      {/* Hero rapport */}
      <div className="relative overflow-hidden rounded-3xl border border-[#2C241E]/10 bg-white/80 shadow-[0_32px_70px_-40px_rgba(44,36,30,0.65)] backdrop-blur-sm">
        <div className="absolute inset-y-0 right-0 hidden w-[38%] sm:block">
          <Image src={hero} alt="" fill className="object-cover" sizes="320px" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#FFFAF5]/20 to-[#FFFAF5]" />
        </div>
        <div
          className="absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
          style={{ background: accent }}
        />
        <div className="relative max-w-xl p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C241E]/40">
            {t.report} · {quiz.title[locale]}
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            {letter ? (
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-[1.75rem] font-semibold text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)]"
                style={{ background: accent, boxShadow: `0 18px 40px -14px ${accent}` }}
              >
                {letter}
              </span>
            ) : null}
            <div>
              {result.styleName ? (
                <p className="text-[13px] font-medium text-[#2C241E]/55">{result.styleName[locale]}</p>
              ) : null}
              <h1
                className="text-[2.15rem] leading-[1.08] tracking-tight text-[#2C241E] sm:text-[2.6rem]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
              >
                {result.title[locale]}
              </h1>
            </div>
          </div>
          <p className="mt-4 text-[17px] leading-snug text-[#2C241E]/75">{result.tagline[locale]}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
              style={{ background: accent }}
            >
              {locale === 'es' ? 'Principal' : 'Principal'} {primaryPct}%
            </span>
            {secondary ? (
              <span className="rounded-full border border-[#2C241E]/12 bg-[#FFFAF5] px-3 py-1 text-[11px] font-medium text-[#2C241E]/55">
                {t.secondary} · {secondary.styleName?.[locale] ?? secondary.title[locale]} (
                {score.percents[secondary.id]}%)
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {quiz.discLike ? (
        <p className="mt-5 rounded-xl border border-[#2C241E]/08 bg-[#2C241E]/[0.03] px-4 py-3 text-[12px] leading-relaxed text-[#2C241E]/50">
          {t.discNote}
        </p>
      ) : null}

      {/* Graphiques — le cœur manquant */}
      {slices.length >= 4 ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#2C241E]/10 bg-white/80 p-5 shadow-[0_22px_50px_-32px_rgba(44,36,30,0.55)] backdrop-blur-sm sm:p-6">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">
              {t.wheel}
            </p>
            <div className="mt-4">
              <DiscWheel slices={slices} size={240} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#2C241E]/10 bg-white/80 p-5 shadow-[0_22px_50px_-32px_rgba(44,36,30,0.55)] backdrop-blur-sm sm:p-6">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">
              {t.radar}
            </p>
            <div className="mt-4">
              <DiscRadar slices={slices} size={260} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-[#2C241E]/10 bg-white/80 p-5 shadow-[0_22px_50px_-32px_rgba(44,36,30,0.55)] backdrop-blur-sm sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2C241E]/40">{t.mix}</p>
        <div className="mt-4">
          <MixBars
            slices={
              slices.length
                ? slices
                : score.ranked.map((row) => {
                    const profile = quiz.results.find((r) => r.id === row.id)!;
                    return {
                      letter: (profile.letter as DiscLetter) || 'D',
                      percent: row.percent,
                      label: profile.title[locale],
                      winner: row.id === result.id,
                    };
                  })
            }
          />
        </div>
      </div>

      {quiz.discLike ? <p className="mt-6 text-[14px] leading-relaxed text-[#2C241E]/65">{t.env}</p> : null}

      <div className="mt-8 space-y-4">
        <ReportCard title={t.portrait} accent={accent} icon={letter || '·'}>
          {report.portrait[locale].map((p) => (
            <p key={p.slice(0, 48)} className="text-[15px] leading-[1.7] text-[#2C241E]/85">
              {p}
            </p>
          ))}
        </ReportCard>

        <ReportCard title={t.how} accent={accent}>
          <BulletCards items={report.howYouWork[locale]} accent={accent} />
        </ReportCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <ReportCard title={t.strengths} accent="#6B8F71">
            <BulletCards items={report.strengths[locale]} accent="#6B8F71" />
          </ReportCard>
          <ReportCard title={t.limits} accent="#5B7C8D">
            <BulletCards items={report.limits[locale]} accent="#5B7C8D" />
          </ReportCard>
        </div>

        <ReportCard title={t.stress} accent="#C45D3E">
          <BulletCards items={report.underStress[locale]} accent="#C45D3E" />
        </ReportCard>

        <ReportCard title={t.fears} accent="#C9A227">
          <BulletCards items={report.fears[locale]} accent="#C9A227" />
        </ReportCard>

        <ReportCard title={t.needs} accent={accent}>
          <BulletCards items={report.needs[locale]} accent={accent} />
        </ReportCard>

        <div className="grid gap-4 sm:grid-cols-2">
          <ReportCard title={t.talk} accent="#6B8F71">
            <BulletCards items={report.howToTalk[locale]} accent="#6B8F71" />
          </ReportCard>
          <ReportCard title={t.notalk} accent="#C45D3E">
            <BulletCards items={report.howNotToTalk[locale]} accent="#C45D3E" />
          </ReportCard>
        </div>

        <ReportCard title={t.develop} accent="#5B7C8D">
          <BulletCards items={report.develop[locale]} accent="#5B7C8D" />
        </ReportCard>

        <ReportCard title={t.bridge} accent={accent}>
          <p className="text-[15px] leading-[1.7] text-[#2C241E]/85">{result.bridge[locale]}</p>
        </ReportCard>
      </div>

      <div className="quiz-no-print mt-8 flex flex-wrap gap-3 pb-16">
        <button
          type="button"
          onClick={savePdf}
          className="inline-flex items-center justify-center rounded-xl border border-[#2C241E]/15 bg-white/90 px-5 py-3 text-[13px] font-semibold text-[#2C241E] shadow-sm transition hover:border-[#C45D3E]/40"
        >
          {t.pdf}
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center justify-center rounded-xl border border-[#2C241E]/15 bg-white/90 px-5 py-3 text-[13px] font-semibold text-[#2C241E] shadow-sm transition hover:border-[#C45D3E]/40"
        >
          {t.share}
        </button>
        <a
          href={trialHref}
          className="inline-flex items-center justify-center rounded-xl bg-[#C45D3E] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_16px_36px_-14px_#C45D3E] transition hover:brightness-110"
        >
          {quiz.cta[locale]}
        </a>
        <Link href={hubHref} className="inline-flex items-center px-2 py-3 text-[13px] text-[#2C241E]/50 hover:text-[#C45D3E]">
          {t.other}
        </Link>
      </div>
    </article>
  );
}
