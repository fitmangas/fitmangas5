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

/** Positions relatives autour du titre — nuage organique */
const LAYOUT: Array<{
  id: string;
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
  opacity?: number;
}> = [
  { id: 'elena', top: '2%', left: '6%', size: 72, delay: '0s' },
  { id: 'maria', top: '8%', right: '8%', size: 64, delay: '0.4s' },
  { id: 'karla', top: '38%', left: '0%', size: 56, delay: '0.8s', opacity: 0.92 },
  { id: 'sandrine', top: '42%', right: '2%', size: 60, delay: '1.1s' },
  { id: 'alicia', top: '68%', left: '10%', size: 48, delay: '0.2s', opacity: 0.85 },
  { id: 'olivia', top: '72%', right: '12%', size: 52, delay: '1.4s', opacity: 0.88 },
  { id: 'teresa', top: '18%', left: '22%', size: 40, delay: '0.6s', opacity: 0.75 },
  { id: 'elena', top: '22%', right: '24%', size: 36, delay: '1.6s', opacity: 0.7 },
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
      className={`relative mx-auto max-w-4xl px-5 pt-10 sm:pt-14 ${className}`}
      data-testid="faces-cloud-hero"
    >
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {LAYOUT.map((slot, i) => {
          const face = byId[slot.id] ?? FACES[i % FACES.length]!;
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
                width: slot.size,
                height: slot.size,
                animationDelay: slot.delay,
                opacity: ready ? (slot.opacity ?? 1) : 0,
                transitionDelay: `${i * 70}ms`,
              }}
            >
              <Image
                src={face.src}
                alt=""
                width={slot.size * 2}
                height={slot.size * 2}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-2 pb-6 pt-16 text-center sm:pt-20">
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
