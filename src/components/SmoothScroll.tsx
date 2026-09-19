'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { ensureGsapPlugins, markAnimReady, prefersReducedMotion, gsap, ScrollTrigger } from '@/lib/anim';

type LenisLike = {
  raf: (time: number) => void;
  on: (event: string, handler: () => void) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    __fitmangasLenis?: LenisLike | null;
  }
}

/** Retire les verrous DOM que Lenis (surtout stop()) laisse sur html/body. */
function clearLenisDomLocks() {
  const html = document.documentElement;
  const body = document.body;
  html.style.removeProperty('overflow');
  html.style.removeProperty('height');
  html.style.removeProperty('touch-action');
  body.style.removeProperty('overflow');
  body.style.removeProperty('height');
  body.style.removeProperty('touch-action');
  html.classList.remove(
    'lenis',
    'lenis-smooth',
    'lenis-stopped',
    'lenis-scrolling',
    'lenis-smooth-touch',
  );
}

/**
 * Smooth-scroll Lenis — DÉTRUIT (pas stoppé) sur /quiz.
 * lenis.stop() met overflow:clip + preventDefault sur la molette → Safari desktop mort.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const isQuizRoute = pathname.includes('/quiz');

  useEffect(() => {
    markAnimReady();

    if (isQuizRoute) {
      document.documentElement.dataset.quizNativeScroll = '1';
      window.__fitmangasLenis?.destroy();
      window.__fitmangasLenis = null;
      clearLenisDomLocks();
      return () => {
        delete document.documentElement.dataset.quizNativeScroll;
        clearLenisDomLocks();
      };
    }

    delete document.documentElement.dataset.quizNativeScroll;

    if (prefersReducedMotion()) {
      clearLenisDomLocks();
      return;
    }

    let cancelled = false;
    let lenis: LenisLike | null = null;
    let tickerFn: ((time: number) => void) | null = null;

    void (async () => {
      ensureGsapPlugins();
      const { default: Lenis } = await import('lenis');
      if (cancelled) return;
      // Navigation concurrente vers /quiz pendant l’import dynamique.
      if (document.documentElement.dataset.quizNativeScroll === '1') return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new (Lenis as any)({ lerp: 0.085, smoothWheel: true }) as LenisLike;
      lenis = instance;
      window.__fitmangasLenis = instance;

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
      if (window.__fitmangasLenis === lenis) window.__fitmangasLenis = null;
      lenis?.destroy();
      lenis = null;
      clearLenisDomLocks();
    };
  }, [isQuizRoute]);

  return <>{children}</>;
}
