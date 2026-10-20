'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, History, RotateCcw, Target, Timer } from 'lucide-react';

import { ProgramLevelPill } from './program-ui';
import { A_VALIDER_LOT3 } from '@/content/a-valider';
import { LEVEL_TEST_COOKIE, recommendProgramSlug, type LevelGoal, type LevelTime, type LevelXp } from '@/lib/programmes/level-test';
import type { CatalogCard } from '@/lib/programmes/catalog-view';

type Lang = 'fr' | 'es';
type Card = CatalogCard & { published: boolean };

const Q1: Array<{ id: LevelGoal; fr: string; es: string }> = [
  { id: 'douceur', fr: 'Me (re)mettre au sport en douceur', es: 'Empezar o retomar con calma' },
  { id: 'tonifier', fr: 'Tonifier et sculpter', es: 'Tonificar y esculpir' },
  { id: 'dos', fr: 'Soulager mon dos, ma posture', es: 'Aliviar mi espalda y mi postura' },
  { id: 'cardio', fr: 'Faire du cardio en m’amusant', es: 'Hacer cardio divirtiéndome' },
  { id: 'souplesse', fr: 'Gagner en souplesse', es: 'Ganar flexibilidad' },
];
const Q2: Array<{ id: LevelXp; fr: string; es: string }> = [
  { id: 'lt6', fr: 'Jamais, ou moins de 6 mois', es: 'Nunca, o menos de 6 meses' },
  { id: '6to24', fr: 'Régulière depuis 6 mois à 2 ans', es: 'Con regularidad, de 6 meses a 2 años' },
  { id: 'gt24', fr: 'Plus de 2 ans', es: 'Más de 2 años' },
];
const Q3: Array<{ id: LevelTime; fr: string; es: string }> = [
  { id: '20', fr: '20 minutes', es: '20 minutos' },
  { id: '30', fr: '30 à 45 minutes', es: 'De 30 a 45 minutos' },
  { id: '60', fr: '1 heure', es: '1 hora' },
];

const C = {
  fr: {
    kicker: 'Test de niveau · 2 minutes',
    title: 'Quel programme est fait pour toi ?',
    intro: (n: number) => `3 questions, et on te dit par où commencer parmi les ${n} programmes d’Alejandra. Gratuit, sans compte, sans email.`,
    points: ['Ton objectif', 'Ton expérience', 'Le temps que tu as'],
    questionOf: (i: number) => `Question ${i} sur 3`,
    questions: ['Ton objectif ?', 'Ton expérience du Pilates ?', 'Combien de temps par séance ?'],
    back: 'Retour',
    next: 'Suivant',
    result: 'Voir mon résultat',
    previous: (a: string) => `Réponse précédente : « ${a} »`,
    yourAnswers: 'Tes réponses',
    redo: 'Refaire le test',
    after: 'Après la 3e question',
    resultKicker: 'Ton résultat',
    rhythm: (m: string, p: number) => `Des séances de ${m}, ${p} fois par semaine`,
    trial: 'Commencer mon essai gratuit',
    trialNote: '0 € aujourd’hui · 7 jours gratuits · le programme sera prêt dans ton espace.',
    weeks: (n: number) => `${n} semaines`,
    sessionsLives: (s: number, l: number) => `${s} séances + ${l} lives`,
  },
  es: {
    kicker: 'Test de nivel · 2 minutos',
    title: '¿Qué programa está hecho para ti?',
    intro: (n: number) => `3 preguntas, y te decimos por dónde empezar entre los ${n} programas de Alejandra. Gratis, sin cuenta, sin email.`,
    points: ['Tu objetivo', 'Tu experiencia', 'El tiempo que tienes'],
    questionOf: (i: number) => `Pregunta ${i} de 3`,
    questions: ['¿Tu objetivo?', '¿Tu experiencia con el Pilates?', '¿Cuánto tiempo por sesión?'],
    back: 'Volver',
    next: 'Siguiente',
    result: 'Ver mi resultado',
    previous: (a: string) => `Respuesta anterior: « ${a} »`,
    yourAnswers: 'Tus respuestas',
    redo: 'Repetir el test',
    after: 'Después de la 3.ª pregunta',
    resultKicker: 'Tu resultado',
    rhythm: (m: string, p: number) => `Sesiones de ${m}, ${p} veces por semana`,
    trial: 'Empezar mi prueba gratis',
    trialNote: '0 € hoy · 7 días gratis · el programa estará listo en tu espacio.',
    weeks: (n: number) => `${n} semanas`,
    sessionsLives: (s: number, l: number) => `${s} sesiones + ${l} lives`,
  },
} as const;

const ICONS = [Target, History, Timer];

export function LevelTestClient({
  lang = 'fr',
  programs,
  member = false,
}: {
  lang?: Lang;
  programs: Card[];
  /** Cliente connectée avec un accès visio : on l'envoie vers le programme plutôt que vers l'essai. */
  member?: boolean;
}) {
  const t = C[lang];
  const v = A_VALIDER_LOT3.levelTest;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<[LevelGoal | null, LevelXp | null, LevelTime | null]>([null, null, null]);
  const resultRef = useRef<HTMLElement | null>(null);
  const done = step >= 3 && answers.every(Boolean);

  const rec = useMemo(() => (done ? recommendProgramSlug(answers[0] as LevelGoal, answers[1] as LevelXp, answers[2] as LevelTime) : null), [done, answers]);
  const card = rec ? programs.find((p) => p.slug === rec.slug) ?? null : null;

  useEffect(() => {
    if (!rec) return;
    try {
      document.cookie = `${LEVEL_TEST_COOKIE}=${encodeURIComponent(rec.slug)};path=/;max-age=${60 * 60 * 24 * 30};samesite=lax`;
    } catch {
      /* cookie refusé : le résultat reste affiché */
    }
    try {
      window.gtag?.('event', 'level_test_complete', { program: rec.slug });
    } catch {
      /* mesure indisponible */
    }
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [rec]);

  const lists = [Q1, Q2, Q3] as const;
  const current = Math.min(step, 2);
  const options = lists[current];
  const selected = answers[current];
  const labelOf = (i: number) => {
    const id = answers[i];
    const o = (lists[i] as ReadonlyArray<{ id: string; fr: string; es: string }>).find((x) => x.id === id);
    return o ? o[lang] : '';
  };

  function pick(id: string) {
    setAnswers((a) => {
      const next = [...a] as typeof a;
      next[current] = id as never;
      return next;
    });
  }

  return (
    <>
      <section className="grid items-start gap-8 pb-10 pt-10 md:grid-cols-[0.95fr_1.05fr] md:gap-14 md:pt-16">
        <div className="md:pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-luxury-orange">{t.kicker}</p>
          <h1 className="fm-display mt-3 text-[2.4rem] leading-[1.04] text-brand-ink md:text-[3.6rem]">{t.title}</h1>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-brand-ink/65">{t.intro(programs.filter((p) => p.published).length || programs.length)}</p>
          <ul className="mt-6 space-y-2.5 text-[14px] text-brand-ink/75">
            {t.points.map((p, i) => {
              const Icon = ICONS[i];
              return (
                <li key={p} className="flex items-center gap-3">
                  <Icon size={17} className="text-luxury-orange" aria-hidden />
                  {p}
                </li>
              );
            })}
          </ul>
        </div>

        {done ? (
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(29,26,23,0.35)] md:p-8">
            <p className="text-[12px] font-semibold text-brand-ink/50">{t.yourAnswers}</p>
            <ul className="mt-4 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl border border-brand-ink/10 px-4 py-3 text-[14.5px] text-brand-ink">
                  <Check size={17} strokeWidth={2.6} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  <span>
                    <span className="block text-[12px] text-brand-ink/50">{t.questions[i]}</span>
                    {labelOf(i)}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setAnswers([null, null, null]);
                setStep(0);
              }}
              className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-brand-ink/60 hover:text-brand-ink"
            >
              <RotateCcw size={14} aria-hidden />
              {t.redo}
            </button>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(29,26,23,0.35)] md:p-8">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-brand-ink/50">{t.questionOf(current + 1)}</p>
              <div className="flex gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`h-1.5 w-8 rounded-full ${i <= current ? 'bg-luxury-orange' : 'bg-brand-ink/10'}`} />
                ))}
              </div>
            </div>
            <p className="mt-5 text-[1.35rem] font-semibold leading-snug text-brand-ink" id="level-q">
              {t.questions[current]}
            </p>
            <div className="mt-5 space-y-2.5" role="radiogroup" aria-labelledby="level-q">
              {options.map((o) => {
                const on = selected === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => pick(o.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] transition ${
                      on ? 'border-brand-ink bg-brand-ink font-semibold text-white' : 'border-brand-ink/10 text-brand-ink hover:border-brand-ink/30'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? 'border-white' : 'border-brand-ink/25'}`} aria-hidden>
                      {on ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                    </span>
                    {o[lang]}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between">
              {current > 0 ? (
                <button type="button" onClick={() => setStep(current - 1)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-ink/55 hover:text-brand-ink">
                  <ArrowLeft size={14} aria-hidden />
                  {t.back}
                </button>
              ) : (
                <span />
              )}
              <button type="button" disabled={!selected} onClick={() => setStep(current + 1)} className="btn-luxury-primary !px-6 disabled:opacity-40">
                {current === 2 ? t.result : t.next}
              </button>
            </div>
            {current > 0 ? <p className="mt-4 text-[12px] text-brand-ink/45">{t.previous(labelOf(current - 1))}</p> : null}
          </div>
        )}
      </section>

      {done && card && rec ? (
        <>
          <div className="flex items-center gap-4 py-4">
            <span className="h-px flex-1 bg-brand-ink/10" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-ink/40">{t.after}</span>
            <span className="h-px flex-1 bg-brand-ink/10" />
          </div>
          <section
            ref={resultRef}
            className="mb-16 grid scroll-mt-24 items-center gap-8 rounded-[2.2rem] bg-white p-6 shadow-[0_24px_60px_-28px_rgba(29,26,23,0.35)] md:grid-cols-[1fr_1fr] md:p-10"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-luxury-orange">{t.resultKicker}</p>
              <h2 className="fm-display mt-3 text-[2.1rem] leading-[1.05] text-brand-ink md:text-[2.8rem]">{card.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-brand-ink/65">{card.promise}</p>
              <ul className="mt-5 space-y-2 text-[14px] text-brand-ink/75">
                <li className="flex items-start gap-2.5">
                  <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  {v.goalReason[answers[0] as LevelGoal][lang]}
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  {v.xpReason[answers[1] as LevelXp][lang]}
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  {t.rhythm(card.minutesRange, card.perWeek)}
                </li>
              </ul>
              {rec.partialHint ? <p className="mt-4 rounded-2xl bg-terracotta-50 px-4 py-3 text-[13px] leading-relaxed text-brand-ink/75">{v.partialHint[lang]}</p> : null}
              <div className="mt-7 flex flex-wrap gap-3">
                {member ? (
                  <>
                    {card.published ? (
                      <Link href={`/compte/programmes/${card.slug}?demarrer=1`} className="btn-luxury-primary">
                        {v.memberStart[lang]}
                      </Link>
                    ) : null}
                    <Link href="/compte/programmes" className="btn-luxury-ghost">
                      {v.memberAll[lang]}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/?offer=v-coll" className="btn-luxury-primary">
                      {t.trial}
                    </Link>
                    <Link href="/#tarifs" className="btn-luxury-ghost">
                      {v.visitorOffers[lang]}
                    </Link>
                  </>
                )}
              </div>
              {!member ? <p className="mt-3 text-[12.5px] text-brand-ink/50">{t.trialNote}</p> : null}
            </div>
            <div className="relative overflow-hidden rounded-[1.8rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.coverUrl} alt="" className="aspect-[4/3.6] w-full object-cover" />
              <div className="absolute left-4 top-4">
                <ProgramLevelPill level={card.level} lang={lang} />
              </div>
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur">{t.weeks(card.weeks)}</span>
                <span className="rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur">{t.sessionsLives(card.sessions, card.weeks)}</span>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
