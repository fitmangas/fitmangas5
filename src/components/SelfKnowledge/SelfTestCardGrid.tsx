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

/** Grille côte à côte — toutes les cartes entièrement visibles. */
export function SelfTestCardGrid({ locale, cards, compact = false, vertical = false }: Props) {
  // Vertical = photo au-dessus du texte ; hauteur plafonnée pour tenir hero+cartes+avatars au 1er écran
  const imgClass = vertical
    ? compact
      ? 'h-[168px] sm:h-[200px] w-full'
      : 'aspect-[4/5] max-h-[320px] w-full'
    : compact
      ? 'h-[120px] sm:h-[140px] w-full'
      : 'h-[220px] sm:h-[240px] w-full';

  return (
    <section
      className={`mx-auto max-w-5xl px-5 ${compact ? 'pb-3 pt-1' : 'py-10'}`}
      data-testid="self-test-card-grid"
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">
        {locale === 'es' ? 'Elige un test' : 'Choisis un test'}
      </p>
      <ul
        className={`mt-3 grid gap-4 sm:grid-cols-2 ${vertical ? 'max-w-3xl mx-auto sm:gap-5' : 'sm:gap-5'}`}
      >
        {cards.map((card) => (
          <li key={card.slug}>
            <article
              data-testid={`grid-card-${card.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-white/70 bg-[#FFFAF5] shadow-[0_14px_40px_rgba(60,40,30,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(196,93,62,0.18)]"
            >
              <div className={`relative ${imgClass}`}>
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover object-[center_8%] transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 420px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/95">
                  {card.meta}
                </span>
              </div>
              <div className={`flex flex-1 flex-col ${compact ? 'p-3.5 sm:p-4' : 'p-5 sm:p-6'}`}>
                <h3
                  className={`font-serif italic leading-snug text-brand-ink ${
                    compact ? 'text-[1.1rem]' : 'text-[1.35rem]'
                  }`}
                >
                  {card.title}
                </h3>
                <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-brand-ink/60">
                  {card.description}
                </p>
                {card.sourceLine ? (
                  <p className="mt-1 text-[10px] tracking-wide text-brand-ink/35">{card.sourceLine}</p>
                ) : null}
                <Link
                  href={card.href}
                  data-testid={`grid-cta-${card.slug}`}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[#c45d3e] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
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
