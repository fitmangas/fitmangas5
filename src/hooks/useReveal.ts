'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { ensureGsapPlugins, prefersReducedMotion, gsap, ScrollTrigger } from '@/lib/anim';

/**
 * Révélation [data-reveal] dans un conteneur.
 * Visible tant qu’à l’écran ; hide instantané seulement hors écran total.
 * Sans .anim-ready / reduced-motion → aucun hide.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    ensureGsapPlugins();

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!targets.length) return;

    const show = (els: HTMLElement[]) => {
      gsap.to(els, {
        y: 0,
        opacity: 1,
        duration: 0.75,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: 'auto',
      });
    };

    const hide = (els: HTMLElement[]) => {
      // Instantané : élément hors viewport → OK pour SEO (pas visible)
      gsap.set(els, { y: 46, opacity: 0 });
    };

    // État initial seulement si anim-ready (CSS + JS)
    if (document.documentElement.classList.contains('anim-ready')) {
      gsap.set(targets, { y: 46, opacity: 0 });
    }

    const triggers: ScrollTrigger[] = [];

    targets.forEach((el) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 86%',
        end: 'bottom 2%',
        onEnter: () => show([el]),
        onEnterBack: () => show([el]),
        onLeave: () => hide([el]),
        onLeaveBack: () => hide([el]),
      });
      triggers.push(st);

      // Déjà dans le viewport au montage → montrer tout de suite
      if (st.isActive) show([el]);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return ref;
}
