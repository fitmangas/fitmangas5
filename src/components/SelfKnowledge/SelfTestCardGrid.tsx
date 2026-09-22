'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { SelfTestLang } from '@/lib/self-knowledge/types';
import type { DepthCard } from '@/components/SelfKnowledge/SelfTestDepthCarousel';

type Props = {
  locale: SelfTestLang;
  cards: DepthCard[];
};

/** Grille côte à côte — toutes les cartes entièrement visibles (hub 2 tests). */
export function SelfTestCardGrid({ locale, cards }: Props) {
  return (
    <section
      className="mx-auto max-w-5xl px-5 py-10"
      data-testid="self-test-card-grid"
    >
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">
        {locale === 'es' ? 'Elige un test' : 'Choisis un test'}
      </p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.slug}>
            <article
              data-testid={`grid-card-${card.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[#FFFAF5] shadow-[0_18px_48px_rgba(60,40,30,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(196,93,62,0.18)]"
            >
              <div className="relative h-[220px] w-full sm:h-[240px]">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 480px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/50 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95">
                  {card.meta}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="font-serif text-[1.35rem] italic leading-snug text-brand-ink">
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-brand-ink/55">
                  {card.description}
                </p>
                <Link
                  href={card.href}
                  data-testid={`grid-cta-${card.slug}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#c45d3e] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_12px_28px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
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
