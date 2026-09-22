'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { SelfTestLang } from '@/lib/self-knowledge/types';
import type { DepthCard } from '@/components/SelfKnowledge/SelfTestDepthCarousel';

type Props = {
  locale: SelfTestLang;
  cards: DepthCard[];
  compact?: boolean;
  /** Cartes portrait verticales (photo + texte dessous) */
  vertical?: boolean;
};

/**
 * Grille côte à côte — photos calibrées pour que les CTA
 * « Je commence » restent visibles au 1er viewport desktop (~900px).
 */
export function SelfTestCardGrid({ locale, cards, compact = false, vertical = false }: Props) {
  // Photos calibrées réf. dashboard : CTA visibles sans scroll (1280×900)
  const imgClass = vertical
    ? 'h-[96px] w-full sm:h-[112px]'
    : compact
      ? 'h-[100px] sm:h-[120px] w-full'
      : 'h-[180px] sm:h-[200px] w-full';

  return (
    <section
      className={`mx-auto max-w-5xl px-4 sm:px-5 ${compact ? 'pb-2 pt-0.5' : 'pb-3 pt-1 sm:pb-4 sm:pt-1.5'}`}
      data-testid="self-test-card-grid"
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">
        {locale === 'es' ? 'Elige un test' : 'Choisis un test'}
      </p>
      <ul
        className={`mt-2.5 grid gap-2.5 sm:mt-3 sm:grid-cols-2 sm:gap-4 ${
          vertical ? 'mx-auto max-w-[38rem]' : ''
        }`}
      >
        {cards.map((card) => (
          <li key={card.slug}>
            <article
              data-testid={`grid-card-${card.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/70 bg-[#FFFAF5] shadow-[0_10px_28px_rgba(60,40,30,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(196,93,62,0.14)]"
            >
              <div className={`relative ${imgClass}`}>
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover object-[center_8%] transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 300px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 via-transparent to-transparent" />
                <span className="absolute bottom-1.5 left-2.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-white/95 sm:text-[9.5px]">
                  {card.meta}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                <h3 className="font-serif text-[0.98rem] italic leading-snug text-brand-ink sm:text-[1.08rem]">
                  {card.title}
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-[11.5px] leading-snug text-brand-ink/60 sm:text-[12px]">
                  {card.description}
                </p>
                {card.sourceLine ? (
                  <p className="mt-0.5 text-[8.5px] tracking-wide text-brand-ink/35 sm:text-[9.5px]">
                    {card.sourceLine}
                  </p>
                ) : null}
                <Link
                  href={card.href}
                  data-testid={`grid-cta-${card.slug}`}
                  className="mt-2.5 inline-flex w-full items-center justify-center rounded-full bg-[#c45d3e] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_18px_rgba(196,93,62,0.24)] transition hover:bg-[#b35338] sm:py-2.5 sm:text-[11px]"
                >
                  {card.cta} →
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
