'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import {
  DiscRadar,
  DiscWheel,
  MixAxesMap,
  MixBars,
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
    axesHint: 'Le point = ton mix. Pas une case fermée.',
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
    humanSub: 'Vidéos d’adhérentes.',
    discNote:
      'Quatre profils FitMangas (D · E · A · M). Ce n’est PAS un test Everything DiSC® / Wiley.',
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
    axesHint: 'El punto = tu mix. No una casilla cerrada.',
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
    humanSub: 'Vídeos de alumnas.',
    discNote:
      'Cuatro perfiles FitMangas (D · E · A · M). NO es un test Everything DiSC® / Wiley.',
    env: 'Cuando el marco te conviene, este estilo te sostiene. Cuando es vago o sola, se vuelve en contra.',
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

function NumberedList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((line, i) => (
        <li key={`${i}-${line.slice(0, 24)}`} className="flex gap-3">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-[14px] leading-relaxed text-brand-ink/80">{line}</span>
        </li>
      ))}
    </ul>
  );
}

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
    letter != null ? readMix(letter, primaryPct, secondaryLetter, secondaryPct) : null;

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
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.12, 0.35] },
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

  const navLinkClass = (id: string) =>
    `inline-flex items-center justify-center rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
      activeNav === id
        ? 'bg-[#c45d3e] text-white shadow-[0_8px_18px_rgba(196,93,62,0.28)]'
        : 'text-brand-ink/45 hover:bg-brand-ink/[0.05] hover:text-brand-ink/70'
    }`;

  return (
    <>
      {/* Rail fixe desktop — type LMDM, couleurs FitMangas */}
      <nav
        className="quiz-no-print quiz-side-nav fixed left-3 top-1/2 z-[60] hidden -translate-y-1/2 flex-col gap-1 rounded-full border border-brand-ink/[0.08] bg-white/95 p-2 shadow-[0_12px_40px_rgba(48,35,28,0.12)] backdrop-blur-md xl:flex"
        aria-label={locale === 'es' ? 'Secciones' : 'Sections'}
      >
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => setActiveNav(item.id)}
            title={item.label}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-[9px] font-bold uppercase tracking-wider transition ${
              activeNav === item.id
                ? 'bg-[#c45d3e] text-white'
                : 'text-brand-ink/40 hover:bg-brand-beige hover:text-brand-ink/70'
            }`}
          >
            {item.label.slice(0, 3)}
          </a>
        ))}
      </nav>

      <article className="quiz-report mx-auto max-w-5xl px-5 py-10 sm:py-14 xl:pl-8">
        {/* Barre sticky mobile / tablette — suit le scroll */}
        <nav className="quiz-no-print sticky top-[52px] z-40 mb-6 rounded-full border border-brand-ink/[0.06] bg-white/95 px-2 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md xl:hidden">
          <ul className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setActiveNav(item.id)}
                  className={navLinkClass(item.id)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Hero */}
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
              <div className="mt-5 border-l-4 pl-4" style={{ borderColor: accent }}>
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
                <span className="rounded-full border border-brand-ink/10 bg-brand-beige/60 px-3 py-1.5 text-[10px] font-medium text-brand-ink/55">
                  {t.secondary} · {(secondary.styleName?.[locale] ?? secondary.title[locale]).replace(/^Profil\s+/i, '')} (
                  {secondaryPct}%)
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-[12px] font-medium text-[#c45d3e]">{t.not100}</p>
          </div>
          {card ? (
            <div className="relative hidden min-h-[280px] lg:block">
              <Image src={card.image} alt="" fill className="object-cover" sizes="380px" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/5 to-white" />
            </div>
          ) : null}
        </div>

        {quiz.discLike ? (
          <p className="mt-5 text-[12px] leading-relaxed text-brand-ink/40">{t.discNote}</p>
        ) : null}

        {/* MIX */}
        <section id="mix" className="scroll-mt-28 mt-10">
          {slices.length >= 4 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.wheel}</p>
                <div className="mt-3 rounded-[28px] bg-white/70 p-4">
                  <DiscWheel slices={slices} size={240} />
                </div>
              </div>
              <div>
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.radar}</p>
                <div className="mt-3 rounded-[28px] bg-white/70 p-4">
                  <DiscRadar slices={slices} size={260} />
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/40">{t.mix}</p>
              <div className="mt-4">
                <MixBars slices={slices} />
              </div>
            </div>
            {quiz.discLike && slices.length >= 4 ? (
              <div>
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.axes}</p>
                <p className="mt-2 text-center text-[11px] text-brand-ink/45">{t.axesHint}</p>
                <MixAxesMap slices={slices} locale={locale} size={260} />
              </div>
            ) : null}
          </div>

          {quiz.discLike ? (
            <p className="mt-8 max-w-2xl font-serif text-[1.15rem] italic leading-snug text-brand-ink/65">{t.env}</p>
          ) : null}
        </section>

        {/* PORTRAIT — un seul bloc, pas 3 encadrés */}
        <section id="portrait" className="scroll-mt-28 mt-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.portrait}</p>
          <blockquote
            className="mt-4 border-l-4 pl-5 font-serif text-[1.35rem] italic leading-snug text-brand-ink sm:text-[1.5rem]"
            style={{ borderColor: accent }}
          >
            {report.portrait[locale][0]}
          </blockquote>
          <div className="mt-6 max-w-3xl space-y-4">
            {report.portrait[locale].slice(1).map((p) => (
              <p key={p.slice(0, 40)} className="text-[15px] leading-[1.8] text-brand-ink/75">
                {p}
              </p>
            ))}
          </div>
          <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.how}</p>
          <div className="mt-4">
            <NumberedList items={report.howYouWork[locale]} accent={accent} />
          </div>
        </section>

        {/* FORCES */}
        <section id="forces" className="scroll-mt-28 mt-14 grid gap-10 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B8F71]">{t.strengths}</p>
            <div className="mt-4">
              <NumberedList items={report.strengths[locale]} accent="#6B8F71" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B7C8D]">{t.limits}</p>
            <div className="mt-4">
              <NumberedList items={report.limits[locale]} accent="#5B7C8D" />
            </div>
          </div>
        </section>

        <div className="mt-14">
          <QuizVideoProof locale={locale} title={t.human} subtitle={t.humanSub} />
        </div>

        {/* STRESS — 01…N harmonisés */}
        <section id="stress" className="scroll-mt-28 mt-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.stress}</p>
          <div className="mt-5">
            <NumberedList items={report.underStress[locale]} accent="#C45D3E" />
          </div>
          <div className="mt-10 grid gap-10 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">{t.fears}</p>
              <div className="mt-4">
                <NumberedList items={report.fears[locale]} accent="#C9A227" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
                {t.needs}
              </p>
              <div className="mt-4">
                <NumberedList items={report.needs[locale]} accent={accent} />
              </div>
            </div>
          </div>
        </section>

        {/* PARLER */}
        <section id="parler" className="scroll-mt-28 mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B8F71]">{t.talk}</p>
            <ul className="mt-4 space-y-3">
              {report.howToTalk[locale].map((line) => (
                <li key={line} className="border-l-2 border-[#6B8F71]/50 pl-3 text-[14px] leading-relaxed text-brand-ink/80">
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.notalk}</p>
            <ul className="mt-4 space-y-3">
              {report.howNotToTalk[locale].map((line) => (
                <li key={line} className="border-l-2 border-[#c45d3e]/50 pl-3 text-[14px] leading-relaxed text-brand-ink/80">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="mt-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B7C8D]">{t.develop}</p>
          <div className="mt-4">
            <NumberedList items={report.develop[locale]} accent="#5B7C8D" />
          </div>
        </div>

        {/* SUITE */}
        <section id="suite" className="scroll-mt-28 mt-14 grid items-center gap-6 sm:grid-cols-[1fr_200px]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.bridge}</p>
            <p className="mt-4 text-[15px] leading-[1.75] text-brand-ink/80">{result.bridge[locale]}</p>
          </div>
          {card ? (
            <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[24px] sm:block">
              <Image src={card.image} alt="" fill className="object-cover" sizes="200px" />
            </div>
          ) : null}
        </section>

        <div className="quiz-no-print mt-10 flex flex-wrap gap-3 pb-16">
          <button
            type="button"
            onClick={savePdf}
            className="inline-flex items-center justify-center rounded-full border-2 border-brand-ink/15 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 transition hover:border-[#c45d3e] hover:text-[#c45d3e]"
          >
            {t.pdf}
          </button>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center justify-center rounded-full border-2 border-brand-ink/15 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 transition hover:border-[#c45d3e] hover:text-[#c45d3e]"
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
    </>
  );
}
