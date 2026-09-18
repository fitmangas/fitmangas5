'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import type { QuizDefinition, QuizLocale, QuizResult, QuizScore } from '@/lib/quiz/types';

const LETTER_COLOR: Record<string, string> = {
  D: '#C45D3E',
  I: '#C9A227',
  S: '#6B8F71',
  C: '#5B7C8D',
};

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
      'Lecture comportementale inspirée du modèle DISC (Dominant / Influent / Stable / Conforme), appliquée à ton agenda et à ton corps. Ce n’est pas un test de personnalité certifié, ni un diagnostic. Les quatre couleurs existent en toi : celle-ci est la plus marquée dans tes réponses.',
    env:
      'En environnement favorable, ce style est une ressource. En environnement défavorable (flou, solitude, pression mal placée), il se retourne — c’est souvent là que tu abandonnes.',
  },
  es: {
    report: 'Informe',
    secondary: 'Estilo secundario',
    mix: 'Reparto',
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
      'Lectura de comportamiento inspirada en el modelo DISC (Dominante / Influyente / Estable / Cumplidor), aplicada a tu agenda y a tu cuerpo. No es un test de personalidad certificado ni un diagnóstico. Los cuatro colores existen en ti: este es el más marcado en tus respuestas.',
    env:
      'En un entorno favorable, este estilo es un recurso. En uno desfavorable (vaguedad, soledad, presión mal puesta), se vuelve en contra — a menudo ahí abandonas.',
  },
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-[#2C241E]/10 py-8">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-[#2C241E]/85">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C45D3E]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function QuizReport({ quiz, result, score, locale, trialHref, hubHref }: Props) {
  const t = LABELS[locale];
  const report = result.report;
  if (!report) return null;

  const letter = result.letter;
  const accent = (letter && LETTER_COLOR[letter]) || quiz.accent;
  const secondary = score.secondaryId ? quiz.results.find((r) => r.id === score.secondaryId) : null;
  const primaryPct = score.percents[result.id] ?? 0;

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
    <article className="quiz-report mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2C241E]/40">
        {t.report} · {quiz.title[locale]}
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        {letter ? (
          <span
            className="flex h-14 w-14 items-center justify-center rounded-md text-[1.6rem] font-semibold text-white"
            style={{ background: accent }}
          >
            {letter}
          </span>
        ) : (
          <span className="h-2 w-10 rounded-full" style={{ background: accent }} />
        )}
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

      {quiz.discLike ? (
        <p className="mt-6 text-[13px] leading-relaxed text-[#2C241E]/50">{t.discNote}</p>
      ) : null}

      <div className="mt-8 rounded-xl border border-[#2C241E]/10 bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2C241E]/40">{t.mix}</p>
        <div className="mt-4 space-y-3">
          {score.ranked.map((row) => {
            const profile = quiz.results.find((r) => r.id === row.id);
            if (!profile) return null;
            const color = (profile.letter && LETTER_COLOR[profile.letter]) || quiz.accent;
            const winner = row.id === result.id;
            return (
              <div key={row.id}>
                <div className="mb-1 flex justify-between gap-2 text-[12px]">
                  <span className={winner ? 'font-semibold text-[#2C241E]' : 'text-[#2C241E]/55'}>
                    {profile.letter ? `${profile.letter} · ` : ''}
                    {profile.title[locale]}
                  </span>
                  <span className="tabular-nums text-[#2C241E]/40">{row.percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#2C241E]/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(row.percent, 3)}%`, background: color, opacity: winner ? 1 : 0.45 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {secondary ? (
          <p className="mt-4 text-[13px] text-[#2C241E]/55">
            {t.secondary} : {secondary.styleName?.[locale] ?? secondary.title[locale]} (
            {score.percents[secondary.id]}%)
          </p>
        ) : null}
        <p className="mt-2 text-[12px] text-[#2C241E]/40">
          {locale === 'es' ? 'Estilo principal' : 'Style principal'} : {primaryPct}%
        </p>
      </div>

      {quiz.discLike ? <p className="mt-6 text-[14px] leading-relaxed text-[#2C241E]/65">{t.env}</p> : null}

      <Section title={t.portrait}>
        {report.portrait[locale].map((p) => (
          <p key={p.slice(0, 48)} className="text-[15px] leading-[1.7] text-[#2C241E]/85">
            {p}
          </p>
        ))}
      </Section>

      <Section title={t.how}>
        <Bullets items={report.howYouWork[locale]} />
      </Section>

      <div className="grid break-inside-avoid gap-0 sm:grid-cols-2 sm:gap-8">
        <Section title={t.strengths}>
          <Bullets items={report.strengths[locale]} />
        </Section>
        <Section title={t.limits}>
          <Bullets items={report.limits[locale]} />
        </Section>
      </div>

      <Section title={t.stress}>
        <Bullets items={report.underStress[locale]} />
      </Section>

      <Section title={t.fears}>
        <Bullets items={report.fears[locale]} />
      </Section>

      <Section title={t.needs}>
        <Bullets items={report.needs[locale]} />
      </Section>

      <div className="grid break-inside-avoid gap-0 sm:grid-cols-2 sm:gap-8">
        <Section title={t.talk}>
          <Bullets items={report.howToTalk[locale]} />
        </Section>
        <Section title={t.notalk}>
          <Bullets items={report.howNotToTalk[locale]} />
        </Section>
      </div>

      <Section title={t.develop}>
        <Bullets items={report.develop[locale]} />
      </Section>

      <section className="break-inside-avoid border-t border-[#2C241E]/10 py-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">{t.bridge}</h2>
        <p className="mt-4 text-[15px] leading-[1.7] text-[#2C241E]/85">{result.bridge[locale]}</p>
      </section>

      <div className="quiz-no-print mt-4 flex flex-wrap gap-3 pb-16">
        <button
          type="button"
          onClick={savePdf}
          className="inline-flex items-center justify-center rounded-md border border-[#2C241E]/15 bg-white px-5 py-3 text-[13px] font-semibold text-[#2C241E] transition hover:border-[#C45D3E]/40"
        >
          {t.pdf}
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center justify-center rounded-md border border-[#2C241E]/15 bg-white px-5 py-3 text-[13px] font-semibold text-[#2C241E] transition hover:border-[#C45D3E]/40"
        >
          {t.share}
        </button>
        <a
          href={trialHref}
          className="inline-flex items-center justify-center rounded-md bg-[#C45D3E] px-5 py-3 text-[13px] font-semibold text-white transition hover:brightness-110"
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
