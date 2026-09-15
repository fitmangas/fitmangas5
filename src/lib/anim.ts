/**
 * Enregistrement GSAP ScrollTrigger + classe .anim-ready (SEO-safe).
 * Sans .anim-ready, aucun style ne cache le contenu → robots / no-JS voient tout.
 */
'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

export function ensureGsapPlugins(): typeof gsap {
  if (typeof window === 'undefined') return gsap;
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

/** À appeler une fois au montage client (SmoothScroll / HomeScrollEffects). */
export function markAnimReady(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.add('anim-ready');
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export { gsap, ScrollTrigger };
