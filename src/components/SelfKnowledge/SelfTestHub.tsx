'use client';

import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import { FacesCloud } from '@/components/SelfKnowledge/FacesCloud';
import { SelfTestCardGrid } from '@/components/SelfKnowledge/SelfTestCardGrid';
import { SelfTestShell } from '@/components/SelfKnowledge/SelfTestShell';
import { getSelfTest, SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';
import type { SelfTestLang } from '@/lib/self-knowledge/types';

type Props = { locale: SelfTestLang };

/** Portraits coach Alejandra (visage/buste) — library/portraits */
export const COACH_CARD_IMAGES: Record<string, { image: string; altFr: string; altEs: string }> = {
  'big-five': {
    image: '/library/portraits/portrait-05-4x5.webp',
    altFr: 'Alejandra — portrait coach Big Five',
    altEs: 'Alejandra — retrato coach Big Five',
  },
  attachement: {
    image: '/library/portraits/portrait-01-4x5.webp',
    altFr: 'Alejandra — portrait coach attachement',
    altEs: 'Alejandra — retrato coach apego',
  },
};

const COPY = {
  fr: {
    eyebrow: 'Connaissance de soi',
    title: 'Mieux te connaître pour tenir ta pratique.',
    lead: 'Un portrait clair de comment tu fonctionnes — pour ne plus lâcher seule.',
    credibility:
      'Test de référence — validé sur plus de 600 000 personnes, corrélation 0,94 avec le NEO-PI-R (étalon scientifique). Items IPIP, domaine public.',
    stats: [
      { value: '600 000+', label: 'personnes ayant validé le test' },
      { value: '0,94', label: 'corrélation avec l’étalon scientifique (NEO-PI-R)' },
      { value: '~8 min', label: 'pour te découvrir (2 tests · 5 dimensions)' },
    ],
    proof: 'Elles aussi se sont découvertes — puis se sont tenues',
    proofSub: 'Vidéos réelles d’adhérentes. Glisse pour voir.',
    start: 'Je commence',
    questions: 'questions',
    min: 'min',
  },
  es: {
    eyebrow: 'Conocimiento de una misma',
    title: 'Conocerte mejor para sostener tu práctica.',
    lead: 'Un retrato claro de cómo funcionas — para no soltar sola.',
    credibility:
      'Test de referencia — validado en más de 600 000 personas, correlación 0,94 con el NEO-PI-R (patrón científico). Ítems IPIP, dominio público.',
    stats: [
      { value: '600 000+', label: 'personas que validaron el test' },
      { value: '0,94', label: 'correlación con el patrón científico (NEO-PI-R)' },
      { value: '~8 min', label: 'para descubrirte (2 tests · 5 dimensiones)' },
    ],
    proof: 'Ellas también se descubrieron — y se sostuvieron',
    proofSub: 'Vídeos reales de alumnas. Desliza para ver.',
    start: 'Empiezo',
    questions: 'preguntas',
    min: 'min',
  },
} as const;

export function SelfTestHub({ locale }: Props) {
  const t = COPY[locale];
  const testBase = locale === 'es' ? '/es/quiz' : '/quiz';

  const cards = SELF_TEST_SLUGS.map((slug) => {
    const test = getSelfTest(slug)!;
    const img = COACH_CARD_IMAGES[slug]!;
    const meta =
      slug === 'big-five'
        ? locale === 'es'
          ? `50 o 120 ${t.questions} · ~8–20 ${t.min}`
          : `50 ou 120 ${t.questions} · ~8–20 ${t.min}`
        : `${test.items.length} ${t.questions} · ~${test.durationMin} ${t.min}`;
    return {
      slug,
      href: `${testBase}/${slug}`,
      title: test.title[locale],
      meta,
      description: test.description[locale],
      image: img.image,
      imageAlt: locale === 'es' ? img.altEs : img.altFr,
      cta: t.start,
    };
  });

  return (
    <SelfTestShell locale={locale}>
      <FacesCloud>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.eyebrow}</p>
        <h1 className="mt-4 font-serif text-[2.15rem] italic leading-[1.12] tracking-tight text-brand-ink sm:text-[2.75rem]">
          {t.title}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-brand-ink/60">{t.lead}</p>

        <dl
          className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3 sm:gap-6"
          data-testid="hub-credibility-stats"
        >
          {t.stats.map((s) => (
            <div key={s.value} className="text-center">
              <dt className="font-serif text-[1.35rem] italic leading-none text-[#c45d3e] sm:text-[1.65rem]">
                {s.value}
              </dt>
              <dd className="mt-2 text-[10px] leading-snug text-brand-ink/50 sm:text-[11px]">{s.label}</dd>
            </div>
          ))}
        </dl>

        <p className="mx-auto mt-6 max-w-lg text-[12px] leading-relaxed text-brand-ink/45">{t.credibility}</p>
      </FacesCloud>

      <SelfTestCardGrid locale={locale} cards={cards} />

      <div className="pb-16" data-testid="hub-video-proof">
        <QuizVideoProof locale={locale} title={t.proof} subtitle={t.proofSub} />
      </div>
    </SelfTestShell>
  );
}
