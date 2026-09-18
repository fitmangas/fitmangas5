'use client';

import Image from 'next/image';
import Link from 'next/link';

import { QuizLandingChrome } from '@/components/Quiz/QuizLandingChrome';
import { QUIZ_CATALOG } from '@/lib/quiz/catalog';
import { QUIZ_PROOF_IMAGES, QUIZ_TESTIMONIALS } from '@/lib/quiz/media';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = { locale: QuizLocale };

const COPY = {
  fr: {
    eyebrow: 'Pas un guide Pilates · 5 profils',
    title: 'Découvre comment tu tiens — ou pourquoi tu lâches.',
    lead: 'Tu cliques pour apprendre quelque chose sur toi. Pas pour « démarrer le Pilates ». Un vrai miroir de discipline, d’énergie, d’attachement au cadre — puis le rendez-vous qui change la donne.',
    ctaSticky: 'Choisir mon profil →',
    proofLine:
      'Photos & cours réels FitMangas. Pas de stock. Pas de fausse coach IA présentée comme Alejandra.',
    problemEyebrow: 'Le vrai problème',
    problemTitle: 'Tu as déjà essayé seule. Ça n’a pas tenu.',
    problemBody: [
      'YouTube, apps, programmes PDF… le contenu ne manque pas.',
      'Ce qui manque : un rendez-vous fixe, la correction en direct, et le fait d’être vue.',
      'Ces profils ne te vendent pas un exo. Ils te disent où tu abandonnes — et quel cadre te tient vraiment.',
    ],
    howEyebrow: 'Comment ça marche',
    howTitle: '3 minutes. Un profil. Une chute claire.',
    steps: [
      { n: '01', t: 'Tu choisis un angle', d: 'Discipline, énergie, seule au tapis, stress, ou « je rate puis… ».' },
      { n: '02', t: 'Tu réponds sans te juger', d: 'Scénarios concrets. Un score réel. Pas un horoscope fitness.' },
      { n: '03', t: 'Tu reçois ton miroir', d: 'Puis l’essai 7 jours — pour tester le cadre, pas te punir.' },
    ],
    catalogEyebrow: 'Les 5 tests',
    catalogTitle: 'Choisis celui qui te tire.',
    start: 'Commencer',
    socialEyebrow: 'Elles l’ont vécu',
    socialTitle: 'Des Mangitas qui ne s’entraînent plus seules.',
    finalTitle: 'Arrête de choisir entre « encore une vidéo » et abandonner.',
    finalLead: 'Un profil pour comprendre. Un rendez-vous pour tenir.',
    finalCta: 'Essai 7 jours gratuits ✨',
  },
  es: {
    eyebrow: 'No es una guía de Pilates · 5 perfiles',
    title: 'Descubre cómo te mantienes — o por qué sueltas.',
    lead: 'Haces clic para aprender algo sobre ti. No para « empezar Pilates ». Un espejo real de disciplina, energía, apego al marco — y la cita que cambia el juego.',
    ctaSticky: 'Elegir mi perfil →',
    proofLine:
      'Fotos y clases reales FitMangas. Sin stock. Sin falsa coach IA presentada como Alejandra.',
    problemEyebrow: 'El verdadero problema',
    problemTitle: 'Ya lo intentaste sola. No se sostuvo.',
    problemBody: [
      'YouTube, apps, PDFs… no falta contenido.',
      'Lo que falta: una cita fija, corrección en directo, y ser vista.',
      'Estos perfiles no te venden un ejercicio. Te dicen dónde abandonas — y qué marco te sostiene de verdad.',
    ],
    howEyebrow: 'Cómo funciona',
    howTitle: '3 minutos. Un perfil. Una caída clara.',
    steps: [
      { n: '01', t: 'Eliges un ángulo', d: 'Disciplina, energía, sola al tapete, estrés, o « fallo y luego… ».' },
      { n: '02', t: 'Respondes sin juzgarte', d: 'Escenarios concretos. Puntuación real. No un horóscopo fitness.' },
      { n: '03', t: 'Recibes tu espejo', d: 'Luego la prueba 7 días — para probar el marco, no castigarte.' },
    ],
    catalogEyebrow: 'Los 5 tests',
    catalogTitle: 'Elige el que te atrae.',
    start: 'Empezar',
    socialEyebrow: 'Ellas lo vivieron',
    socialTitle: 'Mangitas que ya no entrenan solas.',
    finalTitle: 'Deja de elegir entre « otro vídeo » y abandonar.',
    finalLead: 'Un perfil para entender. Una cita para sostenerte.',
    finalCta: 'Prueba 7 días gratis ✨',
  },
} as const;

export function QuizHub({ locale }: Props) {
  const t = COPY[locale];
  const quizBase = locale === 'es' ? '/es/quiz' : '/quiz';
  const trialPath =
    locale === 'es'
      ? '/es/?offer=v-coll&utm_source=quiz&utm_medium=web&utm_campaign=hub'
      : '/?offer=v-coll&utm_source=quiz&utm_medium=web&utm_campaign=hub';
  const doubled = [...QUIZ_PROOF_IMAGES, ...QUIZ_PROOF_IMAGES];

  return (
    <QuizLandingChrome
      locale={locale}
      stickyCta={{ href: '#catalog', label: t.ctaSticky }}
    >
      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C45D3E]">
          {t.eyebrow}
        </p>
        <h1
          className="mx-auto mt-5 max-w-3xl text-center text-[2.35rem] leading-[1.05] tracking-tight text-white sm:text-[3.25rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 }}
        >
          {t.title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-[15px] leading-relaxed text-white/60 sm:text-[17px]">
          {t.lead}
        </p>
        <div className="mt-8 flex justify-center">
          <a
            href="#catalog"
            className="inline-flex items-center justify-center rounded-md bg-[#C45D3E] px-7 py-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_32px_rgba(196,93,62,0.4)] transition hover:brightness-110"
          >
            {t.ctaSticky}
          </a>
        </div>
      </section>

      {/* PREUVE — marquee type téléphones monteur-ia */}
      <section className="relative overflow-hidden border-y border-white/10 py-8">
        <div className="quiz-marquee-track flex w-max gap-4 px-4">
          {doubled.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative h-[280px] w-[168px] shrink-0 overflow-hidden rounded-[1.35rem] border border-white/15 bg-[#141414] shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:h-[320px] sm:w-[190px]"
            >
              <Image src={src} alt="" fill className="object-cover" sizes="190px" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                  FitMangas
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl px-4 text-center text-[13px] text-white/45">{t.proofLine}</p>
      </section>

      {/* PROBLÈME */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{t.problemEyebrow}</p>
        <h2
          className="mt-3 text-[1.85rem] leading-tight text-white sm:text-[2.25rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
        >
          {t.problemTitle}
        </h2>
        <div className="mt-6 space-y-4 border-l-2 border-[#C45D3E] pl-5">
          {t.problemBody.map((p) => (
            <p key={p} className="text-[15px] leading-relaxed text-white/70">
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ÉTAPES */}
      <section className="border-y border-white/10 bg-white/[0.02] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C45D3E]">
            {t.howEyebrow}
          </p>
          <h2 className="mt-3 text-center text-[1.65rem] font-semibold tracking-tight text-white sm:text-[2rem]">
            {t.howTitle}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {t.steps.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-white/10 bg-[#121212] p-5 transition hover:border-[#C45D3E]/40"
              >
                <span className="inline-block rounded bg-[#C45D3E] px-2 py-0.5 text-[11px] font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-[17px] font-semibold text-white">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATALOGUE */}
      <section id="catalog" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C45D3E]">{t.catalogEyebrow}</p>
        <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-white sm:text-[2.1rem]">
          {t.catalogTitle}
        </h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {QUIZ_CATALOG.map((quiz, index) => (
            <Link
              key={quiz.slug}
              href={`${quizBase}/${quiz.slug}`}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#121212] transition duration-300 hover:border-[#C45D3E]/50 hover:shadow-[0_0_40px_rgba(196,93,62,0.15)] ${
                index === 0 ? 'lg:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr]' : ''
              }`}
            >
              <div className="relative min-h-[200px] overflow-hidden lg:min-h-full">
                <Image
                  src={
                    quiz.slug === 'profil-discipline'
                      ? '/library/portraits/portrait-01-4x5.webp'
                      : quiz.slug === 'energie-journee'
                        ? '/library/renfo-core/renfo-core-02-4x5.webp'
                        : quiz.slug === 'seule-face-au-tapis'
                          ? '/library/lifestyle-coulisses/lifestyle-03-4x5.webp'
                          : quiz.slug === 'carte-stress'
                            ? '/library/pilates-mat/pilates-mat-08-4x5.webp'
                            : '/library/coaching-visio/coaching-visio-01-4x5.webp'
                  }
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent lg:bg-gradient-to-r" />
              </div>
              <div className="relative flex flex-col justify-end p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: quiz.accent }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                    {quiz.eyebrow[locale]} · {quiz.durationHint[locale]}
                  </span>
                </div>
                <h3
                  className="mt-3 text-[1.35rem] tracking-tight text-white sm:text-[1.55rem]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
                >
                  {quiz.title[locale]}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{quiz.description[locale]}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#C45D3E] transition group-hover:gap-3">
                  {t.start} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="border-t border-white/10 bg-white/[0.02] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">
            {t.socialEyebrow}
          </p>
          <h2 className="mt-3 text-center text-[1.65rem] font-semibold text-white">{t.socialTitle}</h2>
          <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUIZ_TESTIMONIALS.map((item) => (
              <article
                key={item.id}
                className="w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#121212]"
              >
                <div className="relative aspect-[4/5]">
                  <Image src={item.posterSrc} alt={item.name} fill className="object-cover" sizes="220px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[14px] font-semibold text-white">
                      {item.name} {item.flag}
                    </p>
                    <p className="text-[11px] text-white/60">
                      {locale === 'es' ? item.professionEs : item.professionFr}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2
          className="text-[1.85rem] leading-tight text-white sm:text-[2.35rem]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontWeight: 600 }}
        >
          {t.finalTitle}
        </h2>
        <p className="mt-4 text-[15px] text-white/55">{t.finalLead}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#catalog"
            className="inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-white/5 px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-white/10 sm:w-auto"
          >
            {t.ctaSticky}
          </a>
          <a
            href={trialPath}
            className="inline-flex w-full items-center justify-center rounded-md bg-[#C45D3E] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_28px_rgba(196,93,62,0.35)] transition hover:brightness-110 sm:w-auto"
          >
            {t.finalCta}
          </a>
        </div>
      </section>
    </QuizLandingChrome>
  );
}
