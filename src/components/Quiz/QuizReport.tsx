'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import {
  BulletCards,
  DiscRadar,
  DiscWheel,
  MixAxesMap,
  MixBars,
  QuoteBlock,
  ReportCard,
} from '@/components/Quiz/QuizVisuals';
import type { DiscLetter } from '@/lib/quiz/disc-palette';
import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, readMix } from '@/lib/quiz/disc-palette';
import { QUIZ_CARD_BY_SLUG } from '@/lib/quiz/media';
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
    report: 'Ton rapport',
    secondary: '2e couleur',
    mix: 'Répartition',
    wheel: 'Part de chaque couleur',
    radar: 'Forme de ton mix',
    axes: 'Où tu te places',
    axesHint: 'Le point = ton mix (pas une seule case). Inspiration pédagogique — pas un test certifié.',
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
    humanSub: 'Vidéos d’adhérentes. Pas des photos figées.',
    discNote:
      'Lecture simple de ton comportement sport / agenda. Quatre profils FitMangas (D Directe · E Enthousiaste · A Assidue · M Méthodique). Ce n’est PAS un test Everything DiSC® / Wiley.',
    env: 'Quand le cadre te convient, ce style te porte. Quand il est flou ou seule, il se retourne — souvent là que tu lâches.',
    not100: 'Tu n’es pas 100 % d’une seule couleur. Les % ci-dessous sont ton mix.',
    nav: {
      mix: 'Mix',
      portrait: 'Portrait',
      forces: 'Forces',
      stress: 'Stress',
      parler: 'Parler',
      suite: 'Suite',
    },
  },
  es: {
    report: 'Tu informe',
    secondary: '2.ª color',
    mix: 'Reparto',
    wheel: 'Parte de cada color',
    radar: 'Forma de tu mix',
    axes: 'Dónde te sitúas',
    axesHint: 'El punto = tu mix (no una sola casilla). Lectura pedagógica — no un test certificado.',
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
    humanSub: 'Vídeos de alumnas. No fotos estáticas.',
    discNote:
      'Lectura simple de tu comportamiento deporte / agenda. Cuatro perfiles FitMangas (D Directa · E Entusiasta · A Constante · M Metódica). NO es un test Everything DiSC® / Wiley.',
    env: 'Cuando el marco te conviene, este estilo te sostiene. Cuando es vago o sola, se vuelve en contra — a menudo ahí sueltas.',
    not100: 'No eres 100 % de un solo color. Los % de abajo son tu mix.',
    nav: {
      mix: 'Mix',
      portrait: 'Retrato',
      forces: 'Fuerzas',
      stress: 'Estrés',
      parler: 'Hablar',
      suite: 'Sigue',
    },
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
  const secondaryLetter = (secondary?.letter as DiscLetter | undefined) ?? null;
  const primaryPct = score.percents[result.id] ?? 0;
  const secondaryPct = secondary ? score.percents[secondary.id] ?? 0 : 0;
  const card = QUIZ_CARD_BY_SLUG[quiz.slug];
  const [activeNav, setActiveNav] = useState('mix');

  const mixReading =
    letter != null
      ? readMix(letter, primaryPct, secondaryLetter, secondaryPct)
      : null;

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

  const navItems = [
    { id: 'mix', label: t.nav.mix },
    { id: 'portrait', label: t.nav.portrait },
    { id: 'forces', label: t.nav.forces },
    { id: 'stress', label: t.nav.stress },
    { id: 'parler', label: t.nav.parler },
    { id: 'suite', label: t.nav.suite },
  ] as const;

  useEffect(() => {
    const ids = navItems.map((n) => n.id);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveNav(visible.target.id);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.4] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

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
      {/* Nav compartiments */}
      <nav className="quiz-no-print sticky top-[52px] z-40 -mx-5 mb-6 border-b border-brand-ink/[0.05] bg-[#f6f3ed]/92 px-3 py-2 backdrop-blur-md sm:mx-0 sm:rounded-full sm:border sm:border-brand-ink/[0.06] sm:bg-white/90 sm:px-2 sm:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <ul className="flex gap-1 overflow-x-auto pb-0.5 sm:justify-center">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setActiveNav(item.id)}
                className={`inline-flex whitespace-nowrap rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  activeNav === item.id
                    ? 'bg-[#c45d3e] text-white shadow-[0_8px_18px_rgba(196,93,62,0.28)]'
                    : 'text-brand-ink/45 hover:bg-brand-ink/[0.04] hover:text-brand-ink/70'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Hero — mix, pas une case unique */}
      <div className="relative grid overflow-hidden rounded-[32px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] lg:grid-cols-[1.15fr_0.85fr]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${accent}, transparent 45%), radial-gradient(circle at 80% 80%, ${accent}, transparent 40%)`,
          }}
        />
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

          {mixReading ? (
            <div className="mt-5 rounded-2xl border border-brand-ink/[0.06] bg-brand-beige/50 px-4 py-3">
              <p className="text-[13px] font-semibold text-brand-ink">{mixReading.headline[locale]}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-brand-ink/55">{mixReading.detail[locale]}</p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
              style={{ background: accent }}
            >
              {locale === 'es' ? '1.ª' : '1re'} {primaryPct}%
            </span>
            {secondary ? (
              <span className="rounded-full border border-brand-ink/10 bg-white px-3 py-1.5 text-[10px] font-medium text-brand-ink/55">
                {t.secondary} · {(secondary.styleName?.[locale] ?? secondary.title[locale]).replace(/^Profil\s+/i, '')} (
                {secondaryPct}%)
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-[12px] font-medium text-[#c45d3e]">{t.not100}</p>
        </div>
        {card ? (
          <div className="relative hidden min-h-[300px] lg:block">
            <div className="absolute inset-6 overflow-hidden rounded-[28px] border border-white/80 shadow-[0_24px_50px_rgba(48,35,28,0.2)]">
              <video
                className="h-full w-full object-cover"
                poster={card.poster}
                src={card.video}
                muted
                playsInline
                loop
                autoPlay
                preload="metadata"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/92 px-4 py-3 backdrop-blur-sm">
                <p className="text-[13px] font-semibold text-brand-ink">{card.name}</p>
                <p className="text-[11px] text-brand-ink/50">
                  {locale === 'es' ? card.professionEs : card.professionFr}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {quiz.discLike ? (
        <p className="mt-4 rounded-2xl border border-brand-ink/[0.05] bg-white/70 px-4 py-3 text-[12px] leading-relaxed text-brand-ink/45">
          {t.discNote}
        </p>
      ) : null}

      {/* —— MIX (graphiques) —— */}
      <section id="mix" className="scroll-mt-28 mt-8">
        {slices.length >= 4 ? (
          <div className="grid gap-4 lg:grid-cols-2">
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

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/40">{t.mix}</p>
            <div className="mt-4">
              <MixBars slices={slices} />
            </div>
          </div>
          {quiz.discLike && slices.length >= 4 ? (
            <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-6">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.axes}</p>
              <p className="mt-2 text-center text-[11px] leading-snug text-brand-ink/45">{t.axesHint}</p>
              <div className="mt-2">
                <MixAxesMap slices={slices} locale={locale} size={260} />
              </div>
            </div>
          ) : null}
        </div>

        {quiz.discLike ? <p className="mt-5 text-[14px] leading-relaxed text-brand-ink/60">{t.env}</p> : null}
      </section>

      {/* —— PORTRAIT (prose) —— */}
      <section id="portrait" className="scroll-mt-28 mt-10 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.portrait}</p>
        <QuoteBlock text={portraitLead} accent={accent} />
        {portraitRest.length ? (
          <div className="relative overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-2xl"
              style={{ background: accent }}
            />
            {portraitRest.map((p) => (
              <p key={p.slice(0, 40)} className="relative mb-4 text-[15px] leading-[1.75] text-brand-ink/80 last:mb-0">
                {p}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-2">
          <ReportCard title={t.how} accent={accent}>
            <BulletCards items={report.howYouWork[locale]} accent={accent} />
          </ReportCard>
        </div>
      </section>

      {/* —— FORCES —— */}
      <section id="forces" className="scroll-mt-28 mt-8 grid gap-4 sm:grid-cols-2">
        <ReportCard title={t.strengths} accent="#6B8F71">
          <BulletCards items={report.strengths[locale]} accent="#6B8F71" />
        </ReportCard>
        <ReportCard title={t.limits} accent="#5B7C8D">
          <BulletCards items={report.limits[locale]} accent="#5B7C8D" />
        </ReportCard>
      </section>

      {/* Bandeau vidéo humain */}
      <div className="mt-10 overflow-hidden rounded-[32px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
        <QuizVideoProof locale={locale} title={t.human} subtitle={t.humanSub} />
      </div>

      {/* —— STRESS —— */}
      <section id="stress" className="scroll-mt-28 mt-10 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.stress}</p>
        <QuoteBlock text={report.underStress[locale][0] ?? ''} accent="#C45D3E" />
        {report.underStress[locale].length > 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {report.underStress[locale].slice(1).map((line, i) => (
              <div
                key={line}
                className="rounded-[24px] border border-brand-ink/[0.06] bg-white p-5 shadow-[0_8px_22px_rgba(0,0,0,0.05)]"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c45d3e]">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <p className="mt-2 text-[14px] leading-relaxed text-brand-ink/80">{line}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <ReportCard title={t.fears} accent="#C9A227">
            <BulletCards items={report.fears[locale]} accent="#C9A227" />
          </ReportCard>
          <ReportCard title={t.needs} accent={accent}>
            <BulletCards items={report.needs[locale]} accent={accent} />
          </ReportCard>
        </div>
      </section>

      {/* —— PARLER —— */}
      <section id="parler" className="scroll-mt-28 mt-8 grid gap-4 lg:grid-cols-2">
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
      </section>

      <div className="mt-4">
        <ReportCard title={t.develop} accent="#5B7C8D">
          <BulletCards items={report.develop[locale]} accent="#5B7C8D" />
        </ReportCard>
      </div>

      {/* —— SUITE —— */}
      <section
        id="suite"
        className="scroll-mt-28 mt-8 grid overflow-hidden rounded-[32px] border border-brand-ink/[0.06] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:grid-cols-[1fr_220px]"
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.bridge}</h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-brand-ink/80">{result.bridge[locale]}</p>
        </div>
        {card ? (
          <div className="relative hidden min-h-[180px] sm:block">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              poster={card.poster}
              src={card.video}
              muted
              playsInline
              loop
              autoPlay
              preload="metadata"
            />
          </div>
        ) : null}
      </section>

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
