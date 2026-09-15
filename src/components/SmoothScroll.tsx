'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { ensureGsapPlugins, markAnimReady, prefersReducedMotion, gsap, ScrollTrigger } from '@/lib/anim';

type LenisLike = {
  raf: (time: number) => void;
  on: (event: string, handler: () => void) => void;
  destroy: () => void;
};

/**
 * Smooth-scroll Lenis branché sur le ticker GSAP.
 * Désactivé si prefers-reduced-motion.
 * Une seule instance au layout racine.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    markAnimReady();
    if (prefersReducedMotion()) return;

    let cancelled = false;
    let lenis: LenisLike | null = null;
    let tickerFn: ((time: number) => void) | null = null;

    void (async () => {
      ensureGsapPlugins();
      const { default: Lenis } = await import('lenis');
      if (cancelled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new (Lenis as any)({ lerp: 0.085, smoothWheel: true }) as LenisLike;
      lenis = instance;

      instance.on('scroll', () => {
        ScrollTrigger.update();
      });

      tickerFn = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);
    })();

    return () => {
      cancelled = true;
      if (tickerFn) gsap.ticker.remove(tickerFn);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  return <>{children}</>;
}
