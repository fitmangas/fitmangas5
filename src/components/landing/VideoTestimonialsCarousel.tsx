'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import type { Language } from '@/types';
import {
  VIDEO_TESTIMONIALS,
  featuredTestimonialIndex,
  type VideoTestimonial,
} from '@/lib/landing/video-testimonials';

type Props = {
  lang: Language;
  label: string;
  title: string;
  positiveReviews: string;
  ctaLabel: string;
  onCta: () => void;
};

function profession(t: VideoTestimonial, lang: Language) {
  return lang === 'ES' ? t.professionEs : t.professionFr;
}

function seoBlurb(t: VideoTestimonial, lang: Language) {
  return lang === 'ES' ? t.seoBlurbEs : t.seoBlurbFr;
}

function relativeOffset(index: number, active: number, total: number) {
  let diff = index - active;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

async function tryPlay(video: HTMLVideoElement) {
  try {
    video.playsInline = true;
    await video.play();
  } catch {
    /* autoplay peut échouer hors interaction — on réessaie au canplay */
  }
}

export function VideoTestimonialsCarousel({
  lang,
  label,
  title,
  positiveReviews,
  ctaLabel,
  onCta,
}: Props) {
  const total = VIDEO_TESTIMONIALS.length;
  const [active, setActive] = useState(() => featuredTestimonialIndex(lang));
  const [muted, setMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => {
      setActive((prev) => (prev + dir + total) % total);
    },
    [total],
  );

  const goTo = useCallback(
    (index: number) => {
      setActive(((index % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    setActive(featuredTestimonialIndex(lang));
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '80px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    VIDEO_TESTIMONIALS.forEach((item, index) => {
      const video = videoRefs.current.get(item.id);
      if (!video) return;
      const offset = Math.abs(relativeOffset(index, active, total));
      video.muted = muted;
      video.defaultMuted = muted;

      if (index === active && isInView) {
        if (video.readyState >= 2) {
          void tryPlay(video);
        } else {
          const onReady = () => {
            void tryPlay(video);
            video.removeEventListener('canplay', onReady);
          };
          video.addEventListener('canplay', onReady);
          video.load();
        }
      } else {
        video.pause();
        if (offset > 1 && video.currentTime > 0.15) {
          try {
            video.currentTime = 0;
          } catch {
            /* ignore */
          }
        }
      }
    });
  }, [active, muted, isInView, total]);

  const current = VIDEO_TESTIMONIALS[active];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang === 'ES' ? 'Testimonios en vídeo FitMangas' : 'Témoignages vidéo FitMangas',
    itemListElement: VIDEO_TESTIMONIALS.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoObject',
        name: `${item.name} — ${profession(item, lang)} | FitMangas`,
        description: seoBlurb(item, lang),
        thumbnailUrl: `https://fitmangas.com${item.posterSrc}`,
        contentUrl: `https://fitmangas.com${item.videoSrc}`,
        uploadDate: '2026-09-14',
        inLanguage: item.countryCode === 'FR' ? 'fr' : 'es',
      },
    })),
  };

  return (
    <section ref={sectionRef} className="mb-32" aria-labelledby="testimonials-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-10 text-center md:mb-12">
        <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.4em] text-brand-accent">
          {label}
        </span>
        <h2
          id="testimonials-heading"
          className="mb-8 font-serif text-4xl font-normal italic tracking-tight md:mb-10"
        >
          {title}
        </h2>

        <div className="mb-5 flex justify-center -space-x-4 overflow-x-clip px-2" aria-hidden>
          {VIDEO_TESTIMONIALS.slice(0, 5).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="relative h-14 w-14 overflow-hidden rounded-full border-[3px] border-white shadow-md md:h-16 md:w-16"
              style={{ zIndex: 10 - i }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.posterSrc} alt="" className="h-full w-full object-cover" />
            </motion.div>
          ))}
        </div>
        <div className="mb-2 flex flex-col items-center gap-1">
          <div className="flex gap-0.5 text-brand-accent" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-[11px] leading-none">
                ★
              </span>
            ))}
          </div>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-brand-ink/30">
            {positiveReviews}
          </span>
        </div>
      </div>

      <div
        className="relative mx-auto max-w-5xl select-none"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) < 48) return;
          go(dx < 0 ? 1 : -1);
        }}
      >
        <div
          className="relative mx-auto h-[min(62vh,520px)] w-full md:h-[560px]"
          style={{ perspective: '1400px' }}
        >
          {VIDEO_TESTIMONIALS.map((item, index) => {
            const offset = relativeOffset(index, active, total);
            const abs = Math.abs(offset);
            if (abs > 2) return null;

            const isActive = offset === 0;
            const rotateY = offset * -18;
            const translateX = offset * (isMobile ? 58 : 72);
            const scale = isActive ? 1 : abs === 1 ? 0.82 : 0.68;
            const opacity = isActive ? 1 : abs === 1 ? 0.55 : 0.28;
            const zIndex = 30 - abs;
            const shouldLoad = abs <= 1;

            return (
              <figure
                key={item.id}
                className="absolute left-1/2 top-1/2 w-[min(72vw,280px)] origin-center md:w-[300px]"
                style={{
                  zIndex,
                  transform: `translate(-50%, -50%) translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                  opacity,
                  transition: 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease',
                  filter: isActive ? 'none' : 'brightness(0.72) saturate(0.9)',
                }}
              >
                <div
                  className="relative w-full overflow-hidden rounded-[28px] border border-white/70 bg-brand-ink shadow-[0_24px_60px_rgba(48,35,28,0.22)]"
                  style={{ aspectRatio: '3 / 4' }}
                >
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current.set(item.id, el);
                      else videoRefs.current.delete(item.id);
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                    poster={item.posterSrc}
                    playsInline
                    loop
                    muted={muted}
                    autoPlay={isActive}
                    preload={shouldLoad ? 'auto' : 'none'}
                    src={shouldLoad ? item.videoSrc : undefined}
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/15" />

                  <figcaption className="absolute inset-x-0 bottom-0 z-10 p-5 text-left text-white">
                    <p className="font-sans text-lg font-bold tracking-tight md:text-xl">
                      {item.name}{' '}
                      <span className="text-[1.05em]" aria-hidden>
                        {item.flag}
                      </span>
                      <span className="sr-only">
                        {item.countryCode === 'FR' ? ', France' : ', España'}
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                      {profession(item, lang)}
                    </p>
                  </figcaption>

                  {!isActive ? (
                    <button
                      type="button"
                      className="absolute inset-0 z-20 cursor-pointer bg-transparent"
                      onClick={() => goTo(index)}
                      aria-label={
                        lang === 'ES'
                          ? `Ver testimonio de ${item.name}, ${profession(item, lang)}`
                          : `Voir le témoignage de ${item.name}, ${profession(item, lang)}`
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md transition hover:bg-black/60"
                      aria-label={
                        muted
                          ? lang === 'ES'
                            ? 'Activar sonido (se mantiene en todos los vídeos)'
                            : 'Activer le son (conservé pour toutes les vidéos)'
                          : lang === 'ES'
                            ? 'Silenciar'
                            : 'Couper le son'
                      }
                      aria-pressed={!muted}
                    >
                      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>
                  )}
                </div>
              </figure>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-0 top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brand-ink/10 bg-white/90 text-brand-ink shadow-md transition hover:border-brand-accent/40 hover:text-brand-accent md:inline-flex"
          aria-label={lang === 'ES' ? 'Anterior' : 'Précédent'}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-0 top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brand-ink/10 bg-white/90 text-brand-ink shadow-md transition hover:border-brand-accent/40 hover:text-brand-accent md:inline-flex"
          aria-label={lang === 'ES' ? 'Siguiente' : 'Suivant'}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label={title}>
        {VIDEO_TESTIMONIALS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-label={item.name}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? 'w-7 bg-brand-accent' : 'w-1.5 bg-brand-ink/20 hover:bg-brand-ink/40'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={current.id + lang}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28 }}
          className="mx-auto mt-8 max-w-2xl px-4 text-center font-serif text-base italic leading-relaxed text-brand-ink/70 md:text-lg"
        >
          {seoBlurb(current, lang)}
        </motion.p>
      </AnimatePresence>

      <div className="mt-8 flex justify-center px-4">
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center justify-center rounded-full border-2 border-[#F8C890] bg-white/80 px-9 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] text-brand-ink shadow-[0_8px_20px_rgba(248,200,144,0.14)] transition hover:bg-[#F8C890]/88 hover:text-white hover:shadow-[0_12px_26px_rgba(248,200,144,0.28)]"
        >
          {ctaLabel}
        </button>
      </div>

      <ul className="sr-only">
        {VIDEO_TESTIMONIALS.map((item) => (
          <li key={`seo-${item.id}`}>
            {item.name} {item.flag} — {profession(item, lang)}. {seoBlurb(item, lang)}
          </li>
        ))}
      </ul>
    </section>
  );
}
