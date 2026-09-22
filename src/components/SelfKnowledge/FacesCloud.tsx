'use client';

import Image from 'next/image';
import { useEffect, useState, type ReactNode } from 'react';

import { VIDEO_TESTIMONIALS } from '@/lib/landing/video-testimonials';

/** Adhérentes réelles (posters témoignages) — pas d’avatars stock. */
const FACES = VIDEO_TESTIMONIALS.filter((t) => t.id !== 'jose-luis').map((t) => ({
  id: t.id,
  name: t.name,
  src: t.posterSrc,
}));

/**
 * Nuage compact (réf. dashboard espace cliente) —
 * orbes petits pour laisser les CTA « Je commence » au 1er viewport.
 */
const LAYOUT: Array<{
  id: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
  opacity?: number;
  /** Masqué sous sm pour ne pas pousser le fold mobile */
  desktopOnly?: boolean;
}> = [
  { id: 'elena', top: '0%', left: '8%', size: 40, delay: '0s' },
  { id: 'maria', top: '2%', right: '9%', size: 36, delay: '0.4s' },
  { id: 'karla', top: '48%', left: '3%', size: 32, delay: '0.8s', opacity: 0.88 },
  { id: 'sandrine', top: '50%', right: '4%', size: 34, delay: '1.1s' },
  { id: 'alicia', top: '78%', left: '16%', size: 28, delay: '0.2s', opacity: 0.75, desktopOnly: true },
  { id: 'olivia', top: '80%', right: '18%', size: 30, delay: '1.4s', opacity: 0.78, desktopOnly: true },
];

type Props = {
  children: ReactNode;
  className?: string;
};

export function FacesCloud({ children, className = '' }: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  const byId = Object.fromEntries(FACES.map((f) => [f.id, f]));

  return (
    <div
      className={`relative mx-auto max-w-4xl overflow-visible px-4 pt-3 sm:px-5 sm:pt-5 ${className}`}
      data-testid="faces-cloud-hero"
    >
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {LAYOUT.map((slot, i) => {
          const face = byId[slot.id] ?? FACES[i % FACES.length]!;
          const size = slot.size;
          return (
            <div
              key={`${slot.id}-${i}`}
              className={`faces-cloud-orb absolute rounded-full border-2 border-white/90 shadow-[0_8px_18px_rgba(196,93,62,0.14)] transition-all duration-700 ease-out ${
                slot.desktopOnly ? 'hidden sm:block' : ''
              } ${ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
              style={{
                top: slot.top,
                left: slot.left,
                right: slot.right,
                width: size,
                height: size,
                animationDelay: slot.delay,
                opacity: ready ? (slot.opacity ?? 1) : 0,
                transitionDelay: `${i * 60}ms`,
              }}
            >
              <Image
                src={face.src}
                alt=""
                width={size * 2}
                height={size * 2}
                className="h-full w-full rounded-full object-cover object-[center_20%]"
              />
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-2 pb-1 pt-7 text-center sm:pb-2 sm:pt-9">
        {children}
      </div>

      <style>{`
        .faces-cloud-orb {
          animation: faces-float 5.5s ease-in-out infinite;
        }
        @keyframes faces-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .faces-cloud-orb { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
