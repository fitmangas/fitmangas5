'use client';

import Link from 'next/link';

import { SelfTestShell } from '@/components/SelfKnowledge/SelfTestShell';
import { SELF_TEST_SLUGS, getSelfTest } from '@/lib/self-knowledge/scoring';
import type { SelfTestLang } from '@/lib/self-knowledge/types';

type Props = { locale: SelfTestLang };

const COPY = {
  fr: {
    eyebrow: 'Tests validés · lecture claire',
    title: 'Mieux te connaître pour tenir ta pratique.',
    lead: 'Deux questionnaires publics (Big Five et attachement). À la fin : un aperçu de tes forces et un lien vers l’essai gratuit si tu veux ne plus t’entraîner seule.',
    start: 'Commencer',
    questions: 'questions',
    min: 'min',
    source: 'Source',
  },
  es: {
    eyebrow: 'Tests validados · lectura clara',
    title: 'Conocerte mejor para sostener tu práctica.',
    lead: 'Dos cuestionarios públicos (Big Five y apego). Al final: un vistazo a tus fortalezas y un enlace a la prueba gratuita si quieres dejar de entrenar sola.',
    start: 'Empezar',
    questions: 'preguntas',
    min: 'min',
    source: 'Fuente',
  },
} as const;

const terracottaCta =
  'inline-flex items-center justify-center rounded-full border-2 border-[#c45d3e] bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c45d3e] shadow-[0_8px_20px_rgba(196,93,62,0.14)] transition group-hover:bg-[#c45d3e] group-hover:text-white group-hover:shadow-[0_12px_26px_rgba(196,93,62,0.28)]';

export function SelfTestHub({ locale }: Props) {
  const t = COPY[locale];
  const testBase = locale === 'es' ? '/es/quiz' : '/quiz';

  return (
    <SelfTestShell locale={locale}>
      <section className="mx-auto max-w-5xl px-5 pb-6 pt-12 sm:pt-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.eyebrow}</p>
        <h1 className="mt-4 max-w-3xl font-serif text-[2.1rem] italic leading-[1.12] tracking-tight text-brand-ink sm:text-[2.65rem]">
          {t.title}
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-brand-ink/60">{t.lead}</p>
      </section>

      <ol className="mx-auto max-w-5xl space-y-5 px-5 pb-20">
        {SELF_TEST_SLUGS.map((slug, i) => {
          const test = getSelfTest(slug);
          if (!test) return null;
          return (
            <li key={slug}>
              <Link
                href={`${testBase}/${slug}`}
                className="group block overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white/80 p-6 shadow-[0_10px_28px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(196,93,62,0.14)] sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] text-[11px] font-bold text-white shadow-lg">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-serif text-[1.35rem] italic leading-snug tracking-tight text-brand-ink sm:text-[1.5rem]">
                      {test.title[locale]}
                    </span>
                    <span className="mt-1 block text-[12px] text-brand-ink/40">
                      {test.items.length} {t.questions} · ~{test.durationMin} {t.min}
                    </span>
                    <span className="mt-2 block text-[14px] leading-relaxed text-brand-ink/60">
                      {test.description[locale]}
                    </span>
                    <span className="mt-2 block text-[11px] text-brand-ink/45">
                      {t.source} :{' '}
                      <a
                        href={test.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {test.source}
                      </a>
                    </span>
                    <span className={`${terracottaCta} mt-4`}>{t.start} →</span>
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </SelfTestShell>
  );
}
