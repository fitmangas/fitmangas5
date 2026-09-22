'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { SelfTestLang } from '@/lib/self-knowledge/types';

export type DepthCard = {
  slug: string;
  href: string;
  title: string;
  meta: string;
  description: string;
  /** Ligne discrète source (IPIP / ECR-S) */
  sourceLine?: string;
  image: string;
  imageAlt: string;
  cta: string;
};

type Props = {
  locale: SelfTestLang;
  cards: DepthCard[];
};

function relativeOffset(index: number, active: number, total: number) {
  let diff = index - active;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

export function SelfTestDepthCarousel({ locale, cards }: Props) {
  const total = cards.length;
  const [active, setActive] = useState(0);

  const go = useCallback(
    (dir: -1 | 1) => setActive((prev) => (prev + dir + total) % total),
    [total],
  );

  return (
    <section className="relative mx-auto max-w-5xl px-5 py-10" data-testid="self-test-depth-carousel">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">
        {locale === 'es' ? 'Elige un test' : 'Choisis un test'}
      </p>

      <div className="relative mt-8 flex h-[420px] items-center justify-center sm:h-[460px]">
        {cards.map((card, index) => {
          const offset = relativeOffset(index, active, total);
          const abs = Math.abs(offset);
          if (abs > 1) return null;
          const isCenter = offset === 0;
          const scale = isCenter ? 1 : 0.82;
          const x = offset * (isCenter ? 0 : 140);
          const z = isCenter ? 30 : 10 - abs;
          const opacity = isCenter ? 1 : 0.72;

          return (
            <article
              key={card.slug}
              data-testid={`depth-card-${card.slug}`}
              data-active={isCenter ? 'true' : 'false'}
              className="absolute w-[min(88vw,300px)] overflow-hidden rounded-[28px] border border-white/70 bg-[#FFFAF5] shadow-[0_24px_60px_rgba(60,40,30,0.16)] transition-all duration-500 ease-out sm:w-[320px]"
              style={{
                transform: `translateX(${x}px) scale(${scale})`,
                zIndex: z,
                opacity,
              }}
            >
              <div className="relative h-[200px] w-full sm:h-[220px]">
                <Image
                  src={card.image}
                  alt={card.imageAlt}
                  fill
                  className="object-cover"
                  sizes="320px"
                  priority={isCenter}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95">
                  {card.meta}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="font-serif text-[1.35rem] italic leading-snug text-brand-ink">{card.title}</h3>
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-brand-ink/55">
                  {card.description}
                </p>
                {isCenter ? (
                  <Link
                    href={card.href}
                    data-testid={`depth-cta-${card.slug}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#c45d3e] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_12px_28px_rgba(196,93,62,0.32)] transition hover:bg-[#b35338]"
                  >
                    {card.cta} →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#c45d3e]/35 bg-white/80 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c45d3e]"
                  >
                    {locale === 'es' ? 'Ver' : 'Voir'}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={locale === 'es' ? 'Anterior' : 'Précédent'}
          data-testid="carousel-prev"
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-ink/10 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition hover:border-[#c45d3e]/40"
        >
          <ChevronLeft className="h-5 w-5 text-brand-ink/70" />
        </button>
        <div className="flex gap-2">
          {cards.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              aria-label={c.title}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${
                i === active ? 'w-6 bg-[#c45d3e]' : 'w-2 bg-brand-ink/20'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={locale === 'es' ? 'Siguiente' : 'Suivant'}
          data-testid="carousel-next"
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-ink/10 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition hover:border-[#c45d3e]/40"
        >
          <ChevronRight className="h-5 w-5 text-brand-ink/70" />
        </button>
      </div>
    </section>
  );
}
