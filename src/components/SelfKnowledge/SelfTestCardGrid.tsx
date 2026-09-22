'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { SelfTestLang } from '@/lib/self-knowledge/types';
import type { DepthCard } from '@/components/SelfKnowledge/SelfTestDepthCarousel';

type Props = {
  locale: SelfTestLang;
  cards: DepthCard[];
  compact?: boolean;
  /** Cartes portrait verticales (photo haute + texte dessous) */
  vertical?: boolean;
};

/** Grille côte à côte — cartes verticales élancées (style V1), jamais superposées. */
export function SelfTestCardGrid({ locale, cards, compact = false, vertical = false }: Props) {
  const imgClass = vertical
    ? compact
      ? 'aspect-[3/4] max-h-[240px] w-full sm:max-h-[260px]'
      : 'aspect-[4/5] max-h-[360px] w-full'
    : compact
      ? 'h-[120px] sm:h-[140px] w-full'
      : 'h-[220px] sm:h-[240px] w-full';

  return (
    <section
      className={`mx-auto max-w-5xl px-5 ${compact ? 'pb-2 pt-0.5' : 'py-10'}`}
      data-testid="self-test-card-grid"
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">
        {locale === 'es' ? 'Elige un test' : 'Choisis un test'}
      </p>
      <ul
        className={`mt-2.5 grid gap-3 sm:grid-cols-2 ${
          vertical ? 'mx-auto max-w-[40rem] sm:gap-4' : 'sm:gap-5'
        }`}
      >
        {cards.map((card) => (
          <li key={card.slug}>
            <article
              data-testid={`grid-card-${card.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-white/70 bg-[#FFFAF5] shadow-[0_14px_40px_rgba(60,40,30,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(196,93,62,0.18)]"
            >
              <div className={`relative ${imgClass}`}>
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover object-[center_8%] transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 320px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/95 sm:text-[10px]">
                  {card.meta}
                </span>
              </div>
              <div className={`flex flex-1 flex-col ${compact ? 'p-3 sm:p-3.5' : 'p-5 sm:p-6'}`}>
                <h3
                  className={`font-serif italic leading-snug text-brand-ink ${
                    compact ? 'text-[1.05rem] sm:text-[1.15rem]' : 'text-[1.35rem]'
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`mt-1 flex-1 leading-snug text-brand-ink/60 ${
                    compact ? 'text-[11px] sm:text-[12px]' : 'text-[13px] leading-relaxed'
                  }`}
                >
                  {card.description}
                </p>
                {card.sourceLine ? (
                  <p className="mt-1 text-[9px] tracking-wide text-brand-ink/35 sm:text-[10px]">
                    {card.sourceLine}
                  </p>
                ) : null}
                <Link
                  href={card.href}
                  data-testid={`grid-cta-${card.slug}`}
                  className="mt-2.5 inline-flex w-full items-center justify-center rounded-full bg-[#c45d3e] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338] sm:py-2.5 sm:text-[11px]"
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
