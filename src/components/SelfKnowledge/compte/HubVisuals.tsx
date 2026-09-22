import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

type EmptyProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  lead: string;
  ctaLabel: string;
  ctaHref: string;
  testId?: string;
};

/** État vide engageant — jamais un écran mort. */
export function HubEmptyState({ imageSrc, imageAlt, title, lead, ctaLabel, ctaHref, testId }: EmptyProps) {
  return (
    <div
      data-testid={testId ?? 'hub-empty-state'}
      className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[#FFFAF5] shadow-[0_18px_48px_rgba(60,40,30,0.12)]"
    >
      <div className="relative h-40 w-full sm:h-48">
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover object-[center_20%]" sizes="(max-width:640px) 100vw, 640px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/70 via-[#1a1410]/25 to-transparent" />
      </div>
      <div className="relative -mt-8 px-5 pb-6 pt-2 text-center sm:px-8">
        <div className="rounded-[22px] border border-white/80 bg-white/90 px-5 py-5 shadow-[0_12px_32px_rgba(60,40,30,0.1)] backdrop-blur-sm">
          <h3 className="font-serif text-xl italic leading-snug text-brand-ink sm:text-2xl">{title}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-ink/60">{lead}</p>
          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-[#c45d3e] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_10px_24px_rgba(196,93,62,0.28)] transition hover:bg-[#b35338]"
          >
            {ctaLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
}

type HeroProps = {
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
};

/** Hero immersif section hub — DA quiz publics. */
export function HubSectionHero({ imageSrc, imageAlt, eyebrow, title, lead, children }: HeroProps) {
  return (
    <header className="relative mt-6 overflow-hidden rounded-[28px] border border-white/70 shadow-[0_20px_50px_rgba(60,40,30,0.14)]">
      <div className="relative min-h-[200px] sm:min-h-[240px]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          className="object-cover object-[center_18%]"
          sizes="(max-width:768px) 100vw, 960px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1410]/78 via-[#1a1410]/45 to-[#1a1410]/25" />
        <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-end px-5 py-6 sm:min-h-[240px] sm:px-8 sm:py-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e8b4a0]">{eyebrow}</p>
          <h1 className="mt-2 max-w-lg font-serif text-[1.85rem] italic leading-[1.12] text-white sm:text-[2.35rem]">
            {title}
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-white/80 sm:text-sm">{lead}</p>
          {children}
        </div>
      </div>
    </header>
  );
}

type ChainProps = {
  streak: number;
  label: string;
  sub: string;
};

/** Chaîne de constance visuelle (maillons). */
export function ConsistencyChain({ streak, label, sub }: ChainProps) {
  const links = Math.min(Math.max(streak, 0), 12);
  const show = Math.max(links, 3);

  return (
    <div
      data-testid="consistency-chain"
      className="rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c45d3e]">{label}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
        {Array.from({ length: show }).map((_, i) => {
          const active = i < links;
          return (
            <span
              key={i}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition sm:h-9 sm:w-9 ${
                active
                  ? 'border-[#c45d3e] bg-[#c45d3e] text-white shadow-[0_6px_14px_rgba(196,93,62,0.35)]'
                  : 'border-[#e5d0c4] bg-white/80 text-[#c4b0a4]'
              }`}
              aria-hidden
            >
              {active ? '●' : '○'}
            </span>
          );
        })}
        {streak > 12 ? (
          <span className="ml-1 text-sm font-semibold text-[#c45d3e]">+{streak - 12}</span>
        ) : null}
      </div>
      <p className="mt-3 font-serif text-3xl italic text-brand-ink">{streak}</p>
      <p className="mt-1 text-sm text-brand-ink/55">{sub}</p>
    </div>
  );
}

type MilestoneProps = {
  items: Array<{ ok: boolean; label: string }>;
  title: string;
};

export function HubMilestones({ items, title }: MilestoneProps) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-[#FFFAF5] p-5 shadow-[0_14px_40px_rgba(60,40,30,0.1)] sm:p-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/45">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((m) => (
          <li
            key={m.label}
            className={`flex items-center gap-3 rounded-[18px] border px-4 py-3.5 transition ${
              m.ok
                ? 'border-[#c45d3e]/40 bg-gradient-to-r from-[#c45d3e]/12 to-[#FFFAF5] shadow-[0_8px_20px_rgba(196,93,62,0.12)]'
                : 'border-[#e8ddd4] bg-white/60'
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                m.ok ? 'bg-[#c45d3e] text-white shadow-md' : 'bg-[#f0e8e1] text-[#b5a59a]'
              }`}
            >
              {m.ok ? '✓' : '◇'}
            </span>
            <span className={`text-sm ${m.ok ? 'font-semibold text-brand-ink' : 'text-brand-ink/50'}`}>
              {m.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
