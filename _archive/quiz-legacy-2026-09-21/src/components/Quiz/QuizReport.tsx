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
import { buildDisciplineReportPdf, downloadBlob } from '@/lib/quiz/build-report-pdf';
import { QuizShareModal } from '@/components/Quiz/QuizShareModal';
import type { DiscLetter } from '@/lib/quiz/disc-palette';
import { DISC_LETTER_COLOR, DISC_LETTER_LABEL, readMix } from '@/lib/quiz/disc-palette';
import { QUIZ_CARD_BY_SLUG, QUIZ_SECTION_IMAGES } from '@/lib/quiz/media';
import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

type Props = {
  quiz: QuizDefinition;
  result: QuizResult;
  score: QuizScore;
  locale: QuizLocale;
  trialHref: string;
  hubHref: string;
  /** Affiché dans le lecteur de chapitres (sticky relatif au panneau). */
  embeddedInChapter?: boolean;
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
    pdfBusy: 'Préparation du PDF…',
    share: 'Partager l’image',
    other: 'Autre évaluation',
    human: 'Elles aussi ont un profil — et un rendez-vous',
    humanSub: 'Vidéos d’adhérentes.',
    discNote: 'Quatre profils FitMangas (D · E · A · M) — pas un test officiel Everything DiSC®.',
    env: 'Quand le cadre te convient, ce style te porte. Quand il est flou ou seule, il se retourne — souvent là que tu lâches.',
    not100: 'Tu n’es pas 100 % d’une seule couleur.',
    pdfError: 'Impossible de créer le PDF. Réessaie.',
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
    pdfBusy: 'Preparando el PDF…',
    share: 'Compartir imagen',
    other: 'Otra evaluación',
    human: 'Ellas también tienen un perfil — y una cita',
    humanSub: 'Vídeos de alumnas.',
    discNote: 'Cuatro perfiles FitMangas (D · E · A · M) — no es un test oficial Everything DiSC®.',
    env: 'Cuando el marco te conviene, este estilo te sostiene. Cuando es vago o sola, se vuelve en contra.',
    not100: 'No eres 100 % de un solo color.',
    pdfError: 'No se pudo crear el PDF. Inténtalo de nuevo.',
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

/** Points empilés — pour les sections « tu fais / tu sens » concrètes. */
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

/** Texte fluide — pour expliquer le profil sans menu 01 / 02 / 03. */
function ProseBlock({ items }: { items: string[] }) {
  return (
    <div className="space-y-4">
      {items.map((p) => (
        <p key={p.slice(0, 48)} className="text-[15px] leading-[1.8] text-brand-ink/75">
          {p}
        </p>
      ))}
    </div>
  );
}

function SectionBanner({
  src,
  alt,
  title,
  accent,
  objectPosition = '50% 20%',
}: {
  src: string;
  alt: string;
  title: string;
  accent: string;
  objectPosition?: string;
}) {
  return (
    <div className="glass-card relative mb-6 h-44 overflow-hidden rounded-[28px] border border-white/50 bg-white/70 transition duration-200 hover:-translate-y-0.5 sm:h-52">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition duration-500 hover:scale-[1.03]"
        style={{ objectPosition }}
        sizes="(max-width:768px) 100vw, 900px"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
      <p
        className="absolute bottom-4 left-5 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
        style={{ textShadow: `0 2px 12px ${accent}` }}
      >
        {title}
      </p>
    </div>
  );
}

function cleanProfileTitle(title: string) {
  return title.replace(/^Profil\s+/i, '').replace(/^Perfil\s+/i, '');
}

export function QuizReport({ quiz, result, score, locale, trialHref, hubHref, embeddedInChapter }: Props) {
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const heroTitle = result.styleName?.[locale] ?? cleanProfileTitle(result.title[locale]);
  const colorLabel = letter ? DISC_LETTER_LABEL[locale][letter].short : cleanProfileTitle(result.title[locale]);

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
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.12, 0.35] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  async function savePdf() {
    if (pdfBusy) return;
    setActionError(null);
    setPdfBusy(true);
    try {
      const blob = await buildDisciplineReportPdf({ quiz, result, score, locale });
      const slug = (result.styleName?.[locale] ?? result.title[locale])
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      downloadBlob(blob, `fitmangas-profil-${slug || 'discipline'}.pdf`);
    } catch {
      setActionError(t.pdfError);
    } finally {
      setPdfBusy(false);
    }
  }

  async function share() {
    setActionError(null);
    setShareOpen(true);
  }

  const imgAlt = (key: keyof typeof QUIZ_SECTION_IMAGES) =>
    locale === 'es' ? QUIZ_SECTION_IMAGES[key].altEs : QUIZ_SECTION_IMAGES[key].altFr;

  return (
    <article className={`quiz-report mx-auto max-w-3xl px-5 py-10 sm:max-w-4xl sm:py-14${embeddedInChapter ? ' quiz-report--chapter pb-8' : ''}`}>
      <nav className={`quiz-no-print sticky z-40 mb-8 ${embeddedInChapter ? 'top-0' : 'top-[52px]'}`}>
        <ul className="glass-card mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-1 rounded-full border border-white/60 bg-white/75 px-2 py-2 backdrop-blur-xl">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setActiveNav(item.id)}
                className={`inline-flex whitespace-nowrap rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                  activeNav === item.id
                    ? 'bg-[#c45d3e] text-white shadow-[0_8px_18px_rgba(196,93,62,0.28)]'
                    : 'text-brand-ink/45 hover:bg-brand-ink/[0.05] hover:text-brand-ink/70'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Hero — un seul nom, pas de doublon */}
      <header className="glass-card group relative overflow-hidden rounded-[32px] border border-white/55 bg-white/80 transition duration-200 hover:-translate-y-0.5">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative p-6 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40">{t.report}</p>
            <div className="mt-5 flex items-center gap-4">
              {letter ? (
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-[18px] text-[1.6rem] font-bold text-white"
                  style={{ background: accent, boxShadow: `0 14px 28px -12px ${accent}` }}
                >
                  {letter}
                </span>
              ) : null}
              <div>
                <p className="text-[12px] font-medium text-brand-ink/45">
                  {locale === 'es' ? 'Color' : 'Couleur'} {colorLabel} · {primaryPct}%
                </p>
                <h1 className="font-serif text-[2rem] italic leading-[1.05] tracking-tight text-brand-ink sm:text-[2.35rem]">
                  {heroTitle}
                </h1>
              </div>
            </div>
            <p className="mt-4 text-[16px] leading-snug text-brand-ink/70">{result.tagline[locale]}</p>
            {plain ? <p className="mt-2 text-[13px] text-brand-ink/45">{plain}</p> : null}

            {mixReading ? (
              <p className="mt-5 text-[13px] leading-relaxed text-brand-ink/60">
                <span className="font-semibold text-brand-ink">{mixReading.headline[locale]}</span>
                {' — '}
                {mixReading.detail[locale]}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                style={{ background: accent }}
              >
                {locale === 'es' ? '1.ª' : '1re'} {primaryPct}%
              </span>
              {secondary ? (
                <span className="rounded-full border border-brand-ink/10 bg-brand-beige/70 px-3 py-1.5 text-[10px] font-medium text-brand-ink/55">
                  {t.secondary} · {secondary.styleName?.[locale] ?? cleanProfileTitle(secondary.title[locale])} (
                  {secondaryPct}%)
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-[12px] font-medium text-[#c45d3e]">{t.not100}</p>
          </div>
          {card ? (
            <div className="relative hidden min-h-[300px] lg:block">
              <Image src={card.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="420px" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/80" />
            </div>
          ) : null}
        </div>
      </header>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-brand-ink/40">{t.discNote}</p>

      {/* MIX — 2 graphiques utiles, puis le reste sur la page */}
      <section id="mix" className="scroll-mt-28 mt-10 space-y-8">
        {slices.length >= 4 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="glass-card rounded-[28px] border border-white/55 bg-white/80 p-4 transition duration-200 hover:-translate-y-0.5">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.wheel}</p>
              <DiscWheel slices={slices} size={220} />
            </div>
            <div className="glass-card rounded-[28px] border border-white/55 bg-white/80 p-4 transition duration-200 hover:-translate-y-0.5">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.radar}</p>
              <DiscRadar slices={slices} size={240} />
            </div>
          </div>
        ) : null}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/40">{t.mix}</p>
          <div className="mt-4">
            <MixBars slices={slices} />
          </div>
        </div>

        {quiz.discLike && slices.length >= 4 ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e]">{t.axes}</p>
            <p className="mt-1 text-[12px] text-brand-ink/45">{t.axesHint}</p>
            <div className="mt-3">
              <MixAxesMap slices={slices} locale={locale} size={280} />
            </div>
          </div>
        ) : null}

        {quiz.discLike ? (
          <p className="font-serif text-[1.2rem] italic leading-snug text-brand-ink/65">{t.env}</p>
        ) : null}
      </section>

      {/* PORTRAIT — sur la page */}
      <section id="portrait" className="scroll-mt-28 mt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.portrait}</p>
        <blockquote
          className="mt-4 border-l-4 pl-5 font-serif text-[1.3rem] italic leading-snug text-brand-ink sm:text-[1.45rem]"
          style={{ borderColor: accent }}
        >
          {report.portrait[locale][0]}
        </blockquote>
        <div className="mt-6 space-y-4">
          {report.portrait[locale].slice(1).map((p) => (
            <p key={p.slice(0, 40)} className="text-[15px] leading-[1.8] text-brand-ink/75">
              {p}
            </p>
          ))}
        </div>

        <div className="mt-10">
          <SectionBanner
            src={QUIZ_SECTION_IMAGES.how.src}
            alt={imgAlt('how')}
            title={t.how}
            accent={accent}
            objectPosition={QUIZ_SECTION_IMAGES.how.objectPosition}
          />
          <NumberedList items={report.howYouWork[locale]} accent={accent} />
        </div>
      </section>

      {/* FORCES (texte) puis LIMITES (liste) */}
      <section id="forces" className="scroll-mt-28 mt-14 space-y-12">
        <div>
          <SectionBanner
            src={QUIZ_SECTION_IMAGES.forces.src}
            alt={imgAlt('forces')}
            title={t.strengths}
            accent="#6B8F71"
            objectPosition={QUIZ_SECTION_IMAGES.forces.objectPosition}
          />
          <ProseBlock items={report.strengths[locale]} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B7C8D]">{t.limits}</p>
          <div className="mt-3">
            <NumberedList items={report.limits[locale]} accent="#5B7C8D" />
          </div>
        </div>
      </section>

      {/* STRESS (texte) · peurs (liste) · besoins (texte) */}
      <section id="stress" className="scroll-mt-28 mt-14 space-y-10">
        <div>
          <SectionBanner
            src={QUIZ_SECTION_IMAGES.stress.src}
            alt={imgAlt('stress')}
            title={t.stress}
            accent="#C45D3E"
            objectPosition={QUIZ_SECTION_IMAGES.stress.objectPosition}
          />
          <ProseBlock items={report.underStress[locale]} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A227]">{t.fears}</p>
          <div className="mt-3">
            <NumberedList items={report.fears[locale]} accent="#C9A227" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
            {t.needs}
          </p>
          <div className="mt-3">
            <ProseBlock items={report.needs[locale]} />
          </div>
        </div>
      </section>

      {/* PARLER — liste pour « comment », texte pour « à éviter » */}
      <section id="parler" className="scroll-mt-28 mt-14 space-y-10">
        <SectionBanner
          src={QUIZ_SECTION_IMAGES.parler.src}
          alt={imgAlt('parler')}
          title={locale === 'es' ? 'Comunicación' : 'Communication'}
          accent="#6B8F71"
          objectPosition={QUIZ_SECTION_IMAGES.parler.objectPosition}
        />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6B8F71]">{t.talk}</p>
          <div className="mt-3">
            <NumberedList items={report.howToTalk[locale]} accent="#6B8F71" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.notalk}</p>
          <div className="mt-3">
            <ProseBlock items={report.howNotToTalk[locale]} />
          </div>
        </div>
      </section>

      <section className="mt-14">
        <SectionBanner
          src={QUIZ_SECTION_IMAGES.develop.src}
          alt={imgAlt('develop')}
          title={t.develop}
          accent="#5B7C8D"
          objectPosition={QUIZ_SECTION_IMAGES.develop.objectPosition}
        />
        <ProseBlock items={report.develop[locale]} />
      </section>

      {/* SUITE courte + témoignages + CTA — sans photo gym en trop */}
      <section id="suite" className="scroll-mt-28 mt-14">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c45d3e]">{t.bridge}</p>
        <p className="mt-4 max-w-2xl text-[16px] leading-[1.7] text-brand-ink/80">{result.bridge[locale]}</p>
      </section>

      <div className="mt-12 border-t border-brand-ink/[0.06] pt-10">
        <QuizVideoProof locale={locale} title={t.human} subtitle={t.humanSub} />
      </div>

      <div className="quiz-no-print mt-10 flex flex-col items-center gap-3 pb-16">
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void savePdf()}
            disabled={pdfBusy}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 border-brand-ink/15 bg-white/80 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(28,24,20,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#c45d3e] hover:text-[#c45d3e] hover:shadow-[0_14px_32px_rgba(28,24,20,0.12)] disabled:opacity-50"
          >
            {pdfBusy ? t.pdfBusy : t.pdf}
          </button>
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full border-2 border-brand-ink/15 bg-white/80 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(28,24,20,0.06)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#c45d3e] hover:text-[#c45d3e] hover:shadow-[0_14px_32px_rgba(28,24,20,0.12)]"
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
        {actionError ? (
          <p className="text-center text-[13px] text-[#c45d3e]" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>

      <QuizShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        quiz={quiz}
        result={result}
        score={score}
        locale={locale}
        shareText={result.shareLine[locale]}
      />
    </article>
  );
}
