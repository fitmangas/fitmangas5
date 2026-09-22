'use client';

import { QuizVideoProof } from '@/components/Quiz/QuizVideoProof';
import { FacesCloud } from '@/components/SelfKnowledge/FacesCloud';
import { SelfTestDepthCarousel } from '@/components/SelfKnowledge/SelfTestDepthCarousel';
import { SelfTestShell } from '@/components/SelfKnowledge/SelfTestShell';
import { getSelfTest, SELF_TEST_SLUGS } from '@/lib/self-knowledge/scoring';
import type { SelfTestLang } from '@/lib/self-knowledge/types';

type Props = { locale: SelfTestLang };

const CARD_IMAGES: Record<string, { image: string; altFr: string; altEs: string }> = {
  'big-five': {
    image: '/library/portraits/portrait-01-4x5.webp',
    altFr: 'Portrait — découvrir ton profil Big Five',
    altEs: 'Retrato — descubrir tu perfil Big Five',
  },
  attachement: {
    image: '/library/lifestyle-coulisses/lifestyle-04-4x5.webp',
    altFr: 'Ambiance douce — test d’attachement',
    altEs: 'Ambiente suave — test de apego',
  },
};

const COPY = {
  fr: {
    eyebrow: 'Connaissance de soi',
    title: 'Mieux te connaître pour tenir ta pratique.',
    lead: 'Un portrait clair de comment tu fonctionnes — pour ne plus lâcher seule. Indicatif, jamais médical.',
    proof: 'Elles aussi se sont découvertes — puis se sont tenues',
    proofSub: 'Vidéos réelles d’adhérentes. Glisse pour voir.',
    start: 'Je commence',
    questions: 'questions',
    min: 'min',
  },
  es: {
    eyebrow: 'Conocimiento de una misma',
    title: 'Conocerte mejor para sostener tu práctica.',
    lead: 'Un retrato claro de cómo funcionas — para no soltar sola. Orientativo, nunca médico.',
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
    const img = CARD_IMAGES[slug]!;
    return {
      slug,
      href: `${testBase}/${slug}`,
      title: test.title[locale],
      meta: `${test.items.length} ${t.questions} · ~${test.durationMin} ${t.min}`,
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
      </FacesCloud>

      <SelfTestDepthCarousel locale={locale} cards={cards} />

      <div className="pb-16" data-testid="hub-video-proof">
        <QuizVideoProof locale={locale} title={t.proof} subtitle={t.proofSub} />
      </div>
    </SelfTestShell>
  );
}
