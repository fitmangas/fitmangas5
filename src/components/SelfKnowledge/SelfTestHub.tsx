'use client';

import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import { FacesCloud } from '@/components/SelfKnowledge/FacesCloud';
import { SelfTestCardGrid } from '@/components/SelfKnowledge/SelfTestCardGrid';
import { SelfTestShell } from '@/components/SelfKnowledge/SelfTestShell';
import { getSelfTest, SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';
import type { SelfTestLang } from '@/lib/self-knowledge/types';

type Props = { locale: SelfTestLang };

/** Portraits coach 4×5 — visage en haut via object-position */
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

const BENEFIT_COPY: Record<string, { fr: string; es: string; sourceFr: string; sourceEs: string }> = {
  'big-five': {
    fr: 'Découvre comment tu fonctionnes vraiment : ton énergie, ton rapport aux autres, ta façon de tenir dans la durée.',
    es: 'Descubre cómo funcionas de verdad: tu energía, tu relación con las demás, tu forma de sostener a largo plazo.',
    sourceFr: 'Test de référence · items IPIP',
    sourceEs: 'Test de referencia · ítems IPIP',
  },
  attachement: {
    fr: 'Comprends ta façon de créer du lien : ce qui te rassure, ce qui te freine, comment tu t’attaches.',
    es: 'Comprende tu forma de crear vínculo: lo que te tranquiliza, lo que te frena, cómo te apegas.',
    sourceFr: 'Test de référence · items ECR-S',
    sourceEs: 'Test de referencia · ítems ECR-S',
  },
};

const COPY = {
  fr: {
    eyebrow: 'Connaissance de soi',
    title: 'Mieux te connaître pour tenir ta pratique.',
    lead: 'Un portrait clair de comment tu fonctionnes — pour ne plus lâcher seule.',
    stats: [
      { value: '600 000+', label: 'personnes ayant validé le test' },
      { value: '~8 min', label: 'pour te découvrir' },
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
    stats: [
      { value: '600 000+', label: 'personas que validaron el test' },
      { value: '~8 min', label: 'para descubrirte' },
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
    const benefit = BENEFIT_COPY[slug]!;
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
      description: locale === 'es' ? benefit.es : benefit.fr,
      sourceLine: locale === 'es' ? benefit.sourceEs : benefit.sourceFr,
      image: img.image,
      imageAlt: locale === 'es' ? img.altEs : img.altFr,
      cta: t.start,
    };
  });

  return (
    <SelfTestShell locale={locale}>
      <FacesCloud compact>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{t.eyebrow}</p>
        <h1 className="mt-2 font-serif text-[1.75rem] italic leading-[1.12] tracking-tight text-brand-ink sm:text-[2.2rem]">
          {t.title}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-snug text-brand-ink/60">{t.lead}</p>

        <dl
          className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-4"
          data-testid="hub-credibility-stats"
        >
          {t.stats.map((s) => (
            <div key={s.value} className="text-center">
              <dt className="font-serif text-[1.25rem] italic leading-none text-[#c45d3e] sm:text-[1.5rem]">
                {s.value}
              </dt>
              <dd className="mt-1.5 text-[10px] leading-snug text-brand-ink/50">{s.label}</dd>
            </div>
          ))}
        </dl>
      </FacesCloud>

      <SelfTestCardGrid locale={locale} cards={cards} compact vertical />

      {/* Premier écran : titre + vignettes rondes ; carrousel vidéo uniquement au scroll */}
      <div data-testid="hub-proof-avatars" className="pt-0">
        <QuizVideoProof locale={locale} title={t.proof} subtitle={t.proofSub} variant="avatars" />
      </div>
      <div className="mt-8 min-h-[50vh] pb-16 sm:mt-12" data-testid="hub-video-proof">
        <QuizVideoProof locale={locale} title={t.proof} variant="carousel" />
      </div>
    </SelfTestShell>
  );
}
