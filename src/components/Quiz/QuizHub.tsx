'use client';

import Image from 'next/image';
import Link from 'next/link';

import { DiscColorStrip } from '@/components/Quiz/QuizVisuals';
import { QuizShell } from '@/components/Quiz/QuizShell';
import { QUIZ_CATALOG } from '@/lib/quiz/catalog';
import { QUIZ_HERO_BY_SLUG, QUIZ_PROOF_IMAGES } from '@/lib/quiz/media';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = { locale: QuizLocale };

const COPY = {
  fr: {
    eyebrow: '5 évaluations · un rapport graphique, pas un sticker',
    title: 'Comprendre comment tu tiens — ou pourquoi tu lâches.',
    lead: 'Situations concrètes, puis un compte-rendu visuel : roue des 4 couleurs, radar, forces, stress, comment te parler. Inspiration libre du modèle DISC (pas un test Wiley certifié) — appliquée à ton agenda et à ton corps.',
    start: 'Commencer',
    questions: 'situations',
    stripTitle: 'Les 4 couleurs du rapport',
    stripLead: 'Directe · Envolée · Ancrée · Méthode — chacune a sa teinte. Ton mix apparaît à la fin.',
    proof: 'Cours & coach réels FitMangas',
  },
  es: {
    eyebrow: '5 evaluaciones · un informe gráfico, no una etiqueta',
    title: 'Entender cómo te sostienes — o por qué sueltas.',
    lead: 'Situaciones concretas, luego un informe visual: rueda de 4 colores, radar, fuerzas, estrés, cómo hablarte. Inspiración libre del modelo DISC (no es un test Wiley certificado) — aplicada a tu agenda y a tu cuerpo.',
    start: 'Empezar',
    questions: 'situaciones',
    stripTitle: 'Los 4 colores del informe',
    stripLead: 'Directa · Volada · Anclada · Método — cada una tiene su tono. Tu mix aparece al final.',
    proof: 'Clases y coach reales FitMangas',
  },
} as const;

export function QuizHub({ locale }: Props) {
  const t = COPY[locale];
  const quizBase = locale === 'es' ? '/es/quiz' : '/quiz';
  const marquee = [...QUIZ_PROOF_IMAGES.slice(0, 6), ...QUIZ_PROOF_IMAGES.slice(0, 6)];

  return (
    <QuizShell locale={locale}>
      <section className="mx-auto max-w-5xl px-5 pb-8 pt-12 sm:pt-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C45D3E]">{t.eyebrow}</p>
        <h1
          className="mt-4 max-w-3xl text-[2.1rem] leading-[1.12] tracking-tight text-[#2C241E] sm:text-[2.65rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
        >
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#2C241E]/65">{t.lead}</p>
      </section>

      {/* Marquee preuve — densité monteur-ia, photos biblio */}
      <div className="quiz-no-print relative mb-10 overflow-hidden border-y border-[#2C241E]/10 bg-[#2C241E]/[0.03] py-4">
        <p className="mb-3 px-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2C241E]/40">
          {t.proof}
        </p>
        <div className="flex w-max animate-[quizMarquee_42s_linear_infinite] gap-3 px-3">
          {marquee.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-[#2C241E]/10 shadow-[0_18px_40px_-28px_rgba(44,36,30,0.7)] sm:h-36 sm:w-28"
            >
              <Image src={src} alt="" fill className="object-cover" sizes="112px" />
            </div>
          ))}
        </div>
        <style>{`
          @keyframes quizMarquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      <section className="mx-auto max-w-5xl px-5 pb-8">
        <div className="rounded-2xl border border-[#2C241E]/10 bg-white/70 p-5 shadow-[0_28px_60px_-36px_rgba(44,36,30,0.55)] backdrop-blur-sm sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C45D3E]">{t.stripTitle}</p>
          <p className="mt-2 text-[14px] text-[#2C241E]/55">{t.stripLead}</p>
          <div className="mt-5">
            <DiscColorStrip locale={locale} />
          </div>
        </div>
      </section>

      <ol className="mx-auto max-w-5xl space-y-4 px-5 pb-20">
        {QUIZ_CATALOG.map((quiz, i) => {
          const hero = QUIZ_HERO_BY_SLUG[quiz.slug] ?? QUIZ_PROOF_IMAGES[0];
          return (
            <li key={quiz.slug}>
              <Link
                href={`${quizBase}/${quiz.slug}`}
                className="group grid overflow-hidden rounded-2xl border border-[#2C241E]/10 bg-white/80 shadow-[0_22px_50px_-32px_rgba(44,36,30,0.55)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[#C45D3E]/35 hover:shadow-[0_28px_60px_-28px_rgba(196,93,62,0.35)] sm:grid-cols-[140px_1fr]"
              >
                <div className="relative hidden h-full min-h-[140px] sm:block">
                  <Image src={hero} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="140px" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FFFAF5]/30" />
                </div>
                <div className="flex items-start gap-5 p-5 sm:p-6">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C45D3E] text-[12px] font-bold text-white shadow-[0_12px_28px_-12px_#C45D3E]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span
                        className="text-[1.35rem] tracking-tight text-[#2C241E]"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
                      >
                        {quiz.title[locale]}
                      </span>
                      <span className="text-[12px] text-[#2C241E]/40">
                        {quiz.questions.length} {t.questions} · {quiz.durationHint[locale]}
                      </span>
                    </span>
                    <span className="mt-2 block text-[14px] leading-relaxed text-[#2C241E]/60">
                      {quiz.description[locale]}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#C45D3E]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C45D3E] transition group-hover:bg-[#C45D3E] group-hover:text-white">
                      {t.start} →
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </QuizShell>
  );
}
