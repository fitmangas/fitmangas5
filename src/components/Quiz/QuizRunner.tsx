'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { QuizLandingChrome } from '@/components/Quiz/QuizLandingChrome';
import { QUIZ_HERO_BY_SLUG, QUIZ_TESTIMONIALS } from '@/lib/quiz/media';
import type { QuizDefinition, QuizLocale } from '@/lib/quiz/types';
import { scoreQuiz } from '@/lib/quiz/types';

type Props = {
  quiz: QuizDefinition;
  locale: QuizLocale;
};

type Phase = 'intro' | 'questions' | 'result';

function trialUrl(locale: QuizLocale, slug: string) {
  const path = locale === 'es' ? '/es' : '';
  const params = new URLSearchParams({
    offer: 'v-coll',
    utm_source: 'quiz',
    utm_medium: 'web',
    utm_campaign: slug,
  });
  return `${path}/?${params.toString()}`;
}

export function QuizRunner({ quiz, locale }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const total = quiz.questions.length;
  const question = quiz.questions[step];
  const hubHref = locale === 'es' ? '/es/quiz' : '/quiz';
  const hero = QUIZ_HERO_BY_SLUG[quiz.slug] ?? QUIZ_HERO_BY_SLUG['profil-discipline']!;

  const live = useMemo(() => scoreQuiz(quiz, answers), [quiz, answers]);
  const maxPts = Math.max(1, ...Object.values(live.totals));

  const result = useMemo(() => {
    if (phase !== 'result') return null;
    return quiz.results.find((r) => r.id === live.resultId) ?? quiz.results[0]!;
  }, [phase, quiz, live.resultId]);

  function pick(optionId: string) {
    if (!question) return;
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    if (step + 1 >= total) {
      setPhase('result');
    } else {
      setStep(step + 1);
    }
  }

  async function shareResult() {
    if (!result) return;
    const text = result.shareLine[locale];
    const url = typeof window !== 'undefined' ? window.location.href : `https://fitmangas.com/quiz/${quiz.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: quiz.title[locale], text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
    } catch {
      /* cancel */
    }
  }

  const sticky =
    phase === 'intro'
      ? {
          href: '#start',
          label: locale === 'es' ? 'Empezar el test →' : 'Commencer le test →',
        }
      : phase === 'result'
        ? {
            href: trialUrl(locale, quiz.slug),
            label: quiz.cta[locale],
          }
        : undefined;

  return (
    <QuizLandingChrome locale={locale} stickyCta={sticky} hideSticky={phase === 'questions'}>
      {phase === 'intro' ? (
        <section className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-2">
          <div className="relative min-h-[42vh] lg:min-h-[78vh]">
            <Image src={hero} alt="" fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/35 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#080808]/40 lg:to-[#080808]" />
          </div>
          <div className="flex flex-col justify-center px-5 py-12 sm:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: quiz.accent }}>
              {quiz.eyebrow[locale]} · {quiz.durationHint[locale]}
            </p>
            <h1
              className="mt-4 text-[2.2rem] leading-[1.05] tracking-tight text-white sm:text-[2.75rem]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
            >
              {quiz.title[locale]}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-white/60">{quiz.description[locale]}</p>

            <ul className="mt-8 space-y-3">
              {(locale === 'es'
                ? [
                    'Escenarios concretos — no un test genérico',
                    'Puntuación real entre 4 perfiles',
                    'Caída clara hacia el marco FitMangas',
                  ]
                : [
                    'Scénarios concrets — pas un test générique',
                    'Score réel entre 4 profils',
                    'Chute claire vers le cadre FitMangas',
                  ]
              ).map((line) => (
                <li key={line} className="flex items-start gap-3 text-[14px] text-white/80">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold text-[#080808]"
                    style={{ background: quiz.accent }}
                  >
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            <button
              id="start"
              type="button"
              onClick={() => setPhase('questions')}
              className="mt-10 inline-flex w-full items-center justify-center rounded-md px-6 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_28px_rgba(196,93,62,0.35)] transition hover:brightness-110 sm:w-auto"
              style={{ background: quiz.accent }}
            >
              {locale === 'es' ? 'Empezar el test →' : 'Commencer le test →'}
            </button>
            <Link href={hubHref} className="mt-4 text-center text-[12px] text-white/40 hover:text-white/70 sm:text-left">
              ← {locale === 'es' ? 'Todos los perfiles' : 'Tous les profils'}
            </Link>
          </div>
        </section>
      ) : null}

      {phase === 'questions' && question ? (
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_280px] sm:px-6 sm:py-12">
          <div>
            <div className="mb-6 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: quiz.accent }}>
                {quiz.eyebrow[locale]}
              </p>
              <p className="text-[12px] tabular-nums text-white/45">
                {step + 1} / {total}
              </p>
            </div>
            <div className="mb-8 h-[3px] overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(step / total) * 100}%`, background: quiz.accent }}
              />
            </div>

            <h2
              className="text-[1.55rem] leading-[1.15] tracking-tight text-white sm:text-[1.9rem]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
            >
              {question.prompt[locale]}
            </h2>

            <div className="mt-8 grid gap-3">
              {question.options.map((opt, i) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => pick(opt.id)}
                  className="group flex w-full items-start gap-4 rounded-2xl border border-white/12 bg-[#121212] px-4 py-4 text-left transition duration-200 hover:border-[#C45D3E]/55 hover:bg-[#171717] hover:shadow-[0_0_24px_rgba(196,93,62,0.12)] active:scale-[0.995] sm:px-5 sm:py-5"
                >
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[12px] font-bold text-[#080808]"
                    style={{ background: quiz.accent }}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-[15px] leading-snug text-white/90 sm:text-[16px]">{opt.label[locale]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Score live — preuve que ce n'est pas un quiz jetable */}
          <aside className="hidden rounded-2xl border border-white/10 bg-[#121212] p-5 lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              {locale === 'es' ? 'Perfil en construcción' : 'Profil en construction'}
            </p>
            <div className="mt-5 space-y-4">
              {quiz.results.map((r) => {
                const pts = live.totals[r.id] ?? 0;
                const pct = Math.round((pts / maxPts) * 100);
                return (
                  <div key={r.id}>
                    <div className="mb-1.5 flex justify-between gap-2 text-[11px]">
                      <span className="truncate text-white/70">{r.title[locale]}</span>
                      <span className="tabular-nums text-white/40">{pts}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: quiz.accent }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-6 text-[12px] leading-relaxed text-white/40">
              {locale === 'es'
                ? 'Cada respuesta mueve el score. Al final, un perfil — no un sticker.'
                : 'Chaque réponse déplace le score. À la fin, un profil — pas un sticker.'}
            </p>
          </aside>
        </section>
      ) : null}

      {phase === 'result' && result ? (
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                {locale === 'es' ? 'Tu perfil' : 'Ton profil'}
              </p>
              <h1
                className="mt-3 text-[2.4rem] leading-[1.05] tracking-tight text-white sm:text-[3rem]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
              >
                {result.title[locale]}
              </h1>
              <p
                className="mt-4 inline-block rounded-md px-3 py-1.5 text-[14px] font-semibold text-[#080808]"
                style={{ background: quiz.accent }}
              >
                {result.tagline[locale]}
              </p>

              <div className="mt-8 space-y-4 border-l-2 pl-5" style={{ borderColor: quiz.accent }}>
                {result.body[locale].map((p) => (
                  <p key={p} className="text-[15px] leading-relaxed text-white/75">
                    {p}
                  </p>
                ))}
              </div>

              <div
                className="mt-8 rounded-2xl border border-white/10 p-5"
                style={{ background: `linear-gradient(135deg, ${quiz.accent}28, transparent 65%)` }}
              >
                <p className="text-[15px] leading-relaxed text-white">{result.bridge[locale]}</p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={trialUrl(locale, quiz.slug)}
                  className="inline-flex items-center justify-center rounded-md px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_28px_rgba(196,93,62,0.35)] transition hover:brightness-110"
                  style={{ background: quiz.accent }}
                >
                  {quiz.cta[locale]}
                </a>
                <button
                  type="button"
                  onClick={shareResult}
                  className="rounded-md border border-white/15 bg-white/5 px-5 py-3.5 text-[13px] font-semibold text-white/85 transition hover:bg-white/10"
                >
                  {locale === 'es' ? 'Compartir mi perfil' : 'Partager mon profil'}
                </button>
                <Link
                  href={hubHref}
                  className="rounded-md px-5 py-3.5 text-[13px] font-semibold text-white/50 transition hover:text-white/80"
                >
                  {locale === 'es' ? 'Otro test' : 'Autre test'}
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  {locale === 'es' ? 'Desglose del score' : 'Détail du score'}
                </p>
                <div className="mt-5 space-y-4">
                  {quiz.results
                    .slice()
                    .sort((a, b) => (live.totals[b.id] ?? 0) - (live.totals[a.id] ?? 0))
                    .map((r) => {
                      const pts = live.totals[r.id] ?? 0;
                      const pct = Math.round((pts / Math.max(1, ...Object.values(live.totals))) * 100);
                      const winner = r.id === result.id;
                      return (
                        <div key={r.id} className={winner ? 'opacity-100' : 'opacity-55'}>
                          <div className="mb-1.5 flex justify-between gap-2 text-[12px]">
                            <span className={`truncate ${winner ? 'font-semibold text-white' : 'text-white/70'}`}>
                              {r.title[locale]}
                            </span>
                            <span className="tabular-nums text-white/45">{pts} pts</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: winner ? quiz.accent : 'rgba(255,255,255,0.25)' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/10">
                <div className="relative aspect-[4/5]">
                  <Image src={hero} alt="" fill className="object-cover" sizes="400px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <p className="absolute bottom-4 left-4 right-4 text-[12px] text-white/70">
                    {locale === 'es'
                      ? 'Prueba 7 días: cita fija + corrección en directo.'
                      : 'Essai 7 jours : rendez-vous fixe + correction en direct.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 border-t border-white/10 pt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
              {locale === 'es' ? 'Ellas ya no están solas' : 'Elles ne sont plus seules'}
            </p>
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUIZ_TESTIMONIALS.slice(0, 5).map((item) => (
                <article
                  key={item.id}
                  className="w-[180px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#121212]"
                >
                  <div className="relative aspect-[4/5]">
                    <Image src={item.posterSrc} alt={item.name} fill className="object-cover" sizes="180px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                    <div className="absolute bottom-0 p-2.5">
                      <p className="text-[13px] font-semibold text-white">
                        {item.name} {item.flag}
                      </p>
                      <p className="text-[10px] text-white/55">
                        {locale === 'es' ? item.professionEs : item.professionFr}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </QuizLandingChrome>
  );
}
