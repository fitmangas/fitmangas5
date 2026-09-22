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
 * Grille aérée (réf. hub épuré) — seule la hauteur photo est légèrement
 * limitée pour garder « Je commence » au 1er viewport, sans tout écraser.
 */
export function SelfTestCardGrid({ locale, cards, compact = false, vertical = false }: Props) {
  // Avant : aspect 3/4 min 240/300 → trop haut. Légère baisse seulement (réf. inspiration).
  const imgClass = vertical
    ? 'h-[144px] w-full sm:h-[160px]'
    : compact
      ? 'h-[120px] sm:h-[140px] w-full'
      : 'h-[220px] sm:h-[240px] w-full';

  return (
    <section
      className={`mx-auto max-w-5xl px-5 ${compact ? 'pb-4 pt-2' : 'pb-5 pt-3 sm:pb-7 sm:pt-5'}`}
      data-testid="self-test-card-grid"
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">
        {locale === 'es' ? 'Elige un test' : 'Choisis un test'}
      </p>
      <ul
        className={`mt-5 grid gap-5 sm:mt-6 sm:grid-cols-2 sm:gap-7 ${
          vertical ? 'mx-auto max-w-[44rem]' : ''
        }`}
      >
        {cards.map((card) => (
          <li key={card.slug}>
            <article
              data-testid={`grid-card-${card.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-white/70 bg-[#FFFAF5] shadow-[0_14px_40px_rgba(60,40,30,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(196,93,62,0.18)]"
            >
              <div className={`relative ${imgClass}`}>
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover object-[center_8%] transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 360px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/95">
                  {card.meta}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-5">
                <h3 className="font-serif text-[1.25rem] italic leading-snug text-brand-ink sm:text-[1.35rem]">
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-brand-ink/60">
                  {card.description}
                </p>
                {card.sourceLine ? (
                  <p className="mt-1.5 text-[10px] tracking-wide text-brand-ink/35">{card.sourceLine}</p>
                ) : null}
                <Link
                  href={card.href}
                  data-testid={`grid-cta-${card.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#c45d3e] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
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
