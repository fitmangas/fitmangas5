'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  BulletCards,
  DiscRadar,
  DiscWheel,
  MixBars,
  QuoteBlock,
  ReportCard,
} from '@/components/Quiz/QuizVisuals';
import type { DiscLetter } from '@/lib/quiz/disc-palette';
import { DISC_LETTER_COLOR, DISC_LETTER_LABEL } from '@/lib/quiz/disc-palette';
import { QUIZ_CARD_BY_SLUG, QUIZ_TESTIMONIALS } from '@/lib/quiz/media';
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
    wheel: 'Roue des 4 profils',
    radar: 'Radar de ton mix',
    portrait: 'Qui tu es ici',
    how: 'Comment tu fonctionnes',
    strengths: 'Tes forces',
    limits: 'Tes limites — sans te juger',
    stress: 'Sous stress',
    fears: 'Tes peurs (utiles)',
    needs: 'Ce dont tu as besoin pour tenir',
    talk: 'Comment te parler',
    notalk: 'Ce qu’il ne faut pas te dire',
    develop: 'Axes de développement',
    bridge: 'Et maintenant',
    pdf: 'Enregistrer en PDF',
    share: 'Partager',
    other: 'Autre évaluation',
    human: 'Elles aussi ont un profil — et un rendez-vous',
    discNote:
      'Lecture simple de ton comportement sport / agenda. Quatre profils FitMangas (D Directe · E Enthousiaste · A Assidue · M Méthodique). Ce n’est PAS un test Everything DiSC® / Wiley.',
    env: 'Quand le cadre te convient, ce style te porte. Quand il est flou ou seul, il se retourne — souvent là que tu lâches.',
  },
  es: {
    report: 'Informe',
    secondary: 'Estilo secundario',
    mix: 'Reparto',
    wheel: 'Rueda de 4 perfiles',
    radar: 'Radar de tu mix',
    portrait: 'Quién eres aquí',
    how: 'Cómo funcionas',
    strengths: 'Tus fuerzas',
    limits: 'Tus límites — sin juzgarte',
    stress: 'Bajo estrés',
    fears: 'Tus miedos (útiles)',
    needs: 'Lo que necesitas para sostenerte',
    talk: 'Cómo hablarte',
    notalk: 'Lo que no hay que decirte',
    develop: 'Ejes de desarrollo',
    bridge: 'Y ahora',
    pdf: 'Guardar en PDF',
    share: 'Compartir',
    other: 'Otra evaluación',
    human: 'Ellas también tienen un perfil — y una cita',
    discNote:
      'Lectura simple de tu comportamiento deporte / agenda. Cuatro perfiles FitMangas (D Directa · E Entusiasta · A Constante · M Metódica). NO es un test Everything DiSC® / Wiley.',
    env: 'Cuando el marco te conviene, este estilo te sostiene. Cuando es vago o sola, se vuelve en contra — a menudo ahí sueltas.',
  },
} as const;

const terracottaCta =
  'inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_12px_26px_rgba(196,93,62,0.28)] transition hover:brightness-110';

export function QuizReport({ quiz, result, score, locale, trialHref, hubHref }: Props) {
  const t = LABELS[locale];
  const report = result.report;
  if (!report) return null;

  const letter = (result.letter as DiscLetter | undefined) ?? undefined;
  const accent = (letter && DISC_LETTER_COLOR[letter]) || quiz.accent;
  const plain = letter ? DISC_LETTER_LABEL[locale][letter].plain : '';
  const secondary = score.secondaryId ? quiz.results.find((r) => r.id === score.secondaryId) : null;
  const primaryPct = score.percents[result.id] ?? 0;
  const card = QUIZ_CARD_BY_SLUG[quiz.slug];
  const humans = QUIZ_TESTIMONIALS.slice(0, 4);

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

  const portraitLead = report.portrait[locale][0] ?? result.tagline[locale];
  const portraitRest = report.portrait[locale].slice(1);

  return (
    <article className="quiz-report mx-auto max-w-5xl px-5 py-10 sm:py-14">
      {/* Hero */}
      <div className="relative grid overflow-hidden rounded-[32px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative p-6 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">
            {t.report} · {quiz.title[locale]}
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            {letter ? (
              <span
                className="flex h-16 w-16 items-center justify-center rounded-[20px] text-[1.75rem] font-bold text-white"
                style={{ background: accent, boxShadow: `0 14px 28px -12px ${accent}` }}
              >
                {letter}
              </span>
            ) : null}
            <div>
              {result.styleName ? (
                <p className="text-[12px] font-medium text-brand-ink/50">{result.styleName[locale]}</p>
              ) : null}
              <h1 className="font-serif text-[2.1rem] italic leading-[1.08] tracking-tight text-brand-ink sm:text-[2.5rem]">
                {result.title[locale].replace(/^Profil\s+/i, '')}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-[16px] leading-snug text-brand-ink/70">{result.tagline[locale]}</p>
          {plain ? <p className="mt-2 text-[13px] text-brand-ink/45">{plain}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
              style={{ background: accent }}
            >
              {locale === 'es' ? 'Principal' : 'Principal'} {primaryPct}%
            </span>
            {secondary ? (
              <span className="rounded-full border border-brand-ink/10 bg-brand-beige/50 px-3 py-1.5 text-[10px] font-medium text-brand-ink/55">
                {t.secondary} · {(secondary.styleName?.[locale] ?? secondary.title[locale]).replace(/^Profil\s+/i, '')} (
                {score.percents[secondary.id]}%)
              </span>
            ) : null}
          </div>
        </div>
        {card ? (
          <div className="relative hidden min-h-[280px] lg:block">
            <Image src={card.poster} alt={card.name} fill className="object-cover" sizes="360px" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-white" />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 px-4 py-3 backdrop-blur-sm">
              <p className="text-[13px] font-semibold text-brand-ink">{card.name}</p>
              <p className="text-[11px] text-brand-ink/50">
                {locale === 'es' ? card.professionEs : card.professionFr}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {quiz.discLike ? (
        <p className="mt-4 rounded-2xl border border-brand-ink/[0.05] bg-white/70 px-4 py-3 text-[12px] leading-relaxed text-brand-ink/45">
          {t.discNote}
        </p>
      ) : null}

      {/* Graphiques en tête */}
      {slices.length >= 4 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.wheel}</p>
            <div className="mt-3">
              <DiscWheel slices={slices} size={240} />
            </div>
          </div>
          <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.radar}</p>
            <div className="mt-3">
              <DiscRadar slices={slices} size={260} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/40">{t.mix}</p>
        <div className="mt-4">
          <MixBars slices={slices} />
        </div>
      </div>

      {quiz.discLike ? <p className="mt-5 text-[14px] leading-relaxed text-brand-ink/60">{t.env}</p> : null}

      {/* Portrait = citation + prose (pas une liste) */}
      <div className="mt-8 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.portrait}</p>
        <QuoteBlock text={portraitLead} accent={accent} />
        {portraitRest.length ? (
          <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-8">
            {portraitRest.map((p) => (
              <p key={p.slice(0, 40)} className="mb-4 text-[15px] leading-[1.75] text-brand-ink/80 last:mb-0">
                {p}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {/* Liste numérotée — un format seulement */}
      <div className="mt-6">
        <ReportCard title={t.how} accent={accent}>
          <BulletCards items={report.howYouWork[locale]} accent={accent} />
        </ReportCard>
      </div>

      {/* Deux colonnes forces / limites */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReportCard title={t.strengths} accent="#6B8F71">
          <BulletCards items={report.strengths[locale]} accent="#6B8F71" />
        </ReportCard>
        <ReportCard title={t.limits} accent="#5B7C8D">
          <BulletCards items={report.limits[locale]} accent="#5B7C8D" />
        </ReportCard>
      </div>

      {/* Bandeau humain au milieu */}
      <div className="quiz-no-print mt-8 overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
        <div className="border-b border-brand-ink/[0.04] px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.human}</p>
        </div>
        <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
          {humans.map((h) => (
            <div key={h.id} className="relative aspect-[3/4] overflow-hidden border-r border-brand-ink/[0.04] last:border-r-0">
              <Image src={h.posterSrc} alt={h.name} fill className="object-cover" sizes="200px" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-10">
                <p className="text-[12px] font-semibold text-white">{h.name}</p>
                <p className="truncate text-[10px] text-white/70">
                  {locale === 'es' ? h.professionEs : h.professionFr}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stress = citation */}
      <div className="mt-6 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.stress}</p>
        <QuoteBlock text={report.underStress[locale][0] ?? ''} accent="#C45D3E" />
        {report.underStress[locale].length > 1 ? (
          <ReportCard title={t.stress} accent="#C45D3E">
            <BulletCards items={report.underStress[locale].slice(1)} accent="#C45D3E" />
          </ReportCard>
        ) : null}
      </div>

      {/* Peurs + besoins en colonnes */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ReportCard title={t.fears} accent="#C9A227">
          <BulletCards items={report.fears[locale]} accent="#C9A227" />
        </ReportCard>
        <ReportCard title={t.needs} accent={accent}>
          <BulletCards items={report.needs[locale]} accent={accent} />
        </ReportCard>
      </div>

      {/* Communication : prose vs liste */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B8F71]">{t.talk}</h2>
          <ul className="mt-4 space-y-3">
            {report.howToTalk[locale].map((line) => (
              <li key={line} className="border-l-2 border-[#6B8F71]/40 pl-3 text-[14px] leading-relaxed text-brand-ink/80">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.notalk}</h2>
          <ul className="mt-4 space-y-3">
            {report.howNotToTalk[locale].map((line) => (
              <li key={line} className="border-l-2 border-[#c45d3e]/40 pl-3 text-[14px] leading-relaxed text-brand-ink/80">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <ReportCard title={t.develop} accent="#5B7C8D">
          <BulletCards items={report.develop[locale]} accent="#5B7C8D" />
        </ReportCard>
      </div>

      {/* CTA final avec image cliente */}
      <div className="mt-6 grid overflow-hidden rounded-[32px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:grid-cols-[1fr_200px]">
        <div className="p-6 sm:p-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.bridge}</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-brand-ink/80">{result.bridge[locale]}</p>
        </div>
        {card ? (
          <div className="relative hidden min-h-[160px] sm:block">
            <Image src={card.poster} alt="" fill className="object-cover" sizes="200px" />
          </div>
        ) : null}
      </div>

      <div className="quiz-no-print mt-8 flex flex-wrap gap-3 pb-16">
        <button
          type="button"
          onClick={savePdf}
          className="inline-flex items-center justify-center rounded-full border-2 border-brand-ink/15 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition hover:border-[#c45d3e] hover:text-[#c45d3e]"
        >
          {t.pdf}
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center justify-center rounded-full border-2 border-brand-ink/15 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition hover:border-[#c45d3e] hover:text-[#c45d3e]"
        >
          {t.share}
        </button>
        <a href={trialHref} className={terracottaCta}>
          {quiz.cta[locale]}
        </a>
        <Link href={hubHref} className="inline-flex items-center px-2 py-3 text-[13px] text-brand-ink/45 hover:text-[#c45d3e]">
          {t.other}
        </Link>
      </div>
    </article>
  );
}
