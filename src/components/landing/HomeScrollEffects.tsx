'use client';

import { useEffect, useRef } from 'react';

import { ensureGsapPlugins, markAnimReady, prefersReducedMotion, gsap, ScrollTrigger } from '@/lib/anim';

/**
 * Effets spécifiques home : hero intro, parallaxe, compteurs, filigrane Pilates,
 * révélation mot-à-mot, footer brand. Ne touche qu’à transform/opacity/filter.
 */
export function HomeScrollEffects() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (prefersReducedMotion()) return;
    ensureGsapPlugins();
    markAnimReady();

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

      // —— Hero image : flou→net + dézoom (opacity reste 1 pour LCP) ——
      const heroImg = document.querySelector<HTMLElement>('[data-hero-image]');
      if (heroImg) {
        gsap.fromTo(
          heroImg,
          { scale: 1.28, filter: 'blur(30px)' },
          {
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.4,
            ease: 'power2.out',
            clearProps: 'filter',
          },
        );

        mm.add('(min-width: 768px)', () => {
          gsap.to(heroImg, {
            yPercent: 22,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-hero]',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        });

        mm.add('(max-width: 767px)', () => {
          gsap.to(heroImg, {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-hero]',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        });
      }

      // —— Hero copy : montée en fondu (stagger) ——
      const heroCopy = document.querySelectorAll<HTMLElement>('[data-hero-copy]');
      if (heroCopy.length) {
        gsap.fromTo(
          heroCopy,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.1,
            delay: 0.15,
          },
        );
      }

      // —— Compteurs ——
      document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const raw = el.getAttribute('data-count-to');
        const target = raw ? Number(raw) : Number(el.textContent?.replace(/\s/g, '') || 0);
        if (!Number.isFinite(target) || target <= 0) return;

        const obj = { val: target };
        const format = (n: number) => Math.round(n).toLocaleString('fr-FR');

        const play = () => {
          obj.val = 0;
          el.textContent = format(0);
          gsap.to(obj, {
            val: target,
            duration: 1.6,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = format(obj.val);
            },
            overwrite: true,
          });
        };

        const st = ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: play,
        });
        if (st.isActive) play();
      });

      // —— Filigrane PILATES (parallaxe douce) ——
      document.querySelectorAll<HTMLElement>('[data-pilates-watermark]').forEach((el) => {
        const amp = isMobile() ? 8 : 18;
        gsap.to(el, {
          yPercent: amp,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('article') ?? el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      });

      // —— Citation témoignages : mot à mot (scrub) ——
      const wordRoot = document.querySelector<HTMLElement>('[data-word-reveal]');
      if (wordRoot) {
        const words = Array.from(wordRoot.querySelectorAll<HTMLElement>('[data-word]'));
        if (words.length) {
          gsap.set(words, { color: 'rgba(29,29,31,0.28)' });
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: wordRoot,
              start: 'top 80%',
              end: 'top 30%',
              scrub: true,
            },
          });
          words.forEach((w, i) => {
            const accent = w.dataset.wordAccent === '1';
            tl.to(
              w,
              { color: accent ? '#C45D3E' : '#1d1d1f', duration: 0.2, ease: 'none' },
              i * 0.05,
            );
          });
        }
      }

      // —— Bloc témoignages (conteneur seul, pas les cartes 3D) ——
      const testimonials = document.querySelector<HTMLElement>('[data-testimonials-block]');
      if (testimonials) {
        gsap.fromTo(
          testimonials,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: testimonials,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          },
        );
      }

      // —— Footer marque ——
      const brand = document.querySelector<HTMLElement>('[data-footer-brand]');
      if (brand) {
        gsap.fromTo(
          brand,
          { yPercent: 34, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: brand.closest('footer') ?? brand,
              start: 'top 90%',
              end: 'top 55%',
              scrub: true,
            },
          },
        );
      }
    });

    return () => {
      ctx.revert();
      mm.revert();
    };
  }, []);

  return null;
}
