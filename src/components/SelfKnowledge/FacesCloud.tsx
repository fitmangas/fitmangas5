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

/** Positions aérées autour du titre — éloignées du centre (style V1) */
const LAYOUT: Array<{
  id: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
  opacity?: number;
}> = [
  { id: 'elena', top: '2%', left: '3%', size: 84, delay: '0s' },
  { id: 'maria', top: '6%', right: '4%', size: 76, delay: '0.4s' },
  { id: 'karla', top: '48%', left: '1%', size: 66, delay: '0.8s', opacity: 0.92 },
  { id: 'sandrine', top: '52%', right: '2%', size: 70, delay: '1.1s' },
  { id: 'alicia', top: '88%', left: '10%', size: 56, delay: '0.2s', opacity: 0.85 },
  { id: 'olivia', top: '90%', right: '12%', size: 58, delay: '1.4s', opacity: 0.88 },
  { id: 'teresa', top: '22%', left: '16%', size: 46, delay: '0.6s', opacity: 0.72 },
  { id: 'elena', top: '26%', right: '18%', size: 42, delay: '1.6s', opacity: 0.68 },
];

type Props = {
  children: ReactNode;
  className?: string;
  /** @deprecated — hub utilise le layout aéré */
  compact?: boolean;
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
      className={`relative mx-auto max-w-5xl overflow-visible px-5 pt-8 sm:pt-11 ${className}`}
      data-testid="faces-cloud-hero"
    >
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {LAYOUT.map((slot, i) => {
          const face = byId[slot.id] ?? FACES[i % FACES.length]!;
          const size = slot.size;
          return (
            <div
              key={`${slot.id}-${i}`}
              className={`faces-cloud-orb absolute rounded-full border-2 border-white/90 shadow-[0_12px_32px_rgba(196,93,62,0.18)] transition-all duration-700 ease-out ${
                ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
              style={{
                top: slot.top,
                left: slot.left,
                right: slot.right,
                width: size,
                height: size,
                animationDelay: slot.delay,
                opacity: ready ? (slot.opacity ?? 1) : 0,
                transitionDelay: `${i * 70}ms`,
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

      <div className="relative z-10 mx-auto max-w-xl px-2 pb-6 pt-14 text-center sm:pb-8 sm:pt-16">
        {children}
      </div>

      <style>{`
        .faces-cloud-orb {
          animation: faces-float 5.5s ease-in-out infinite;
        }
        @keyframes faces-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .faces-cloud-orb { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
