'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

import { QUIZ_TESTIMONIALS } from '@/lib/quiz/media';
import type { QuizLocale } from '@/lib/quiz/types';

type Props = {
  locale: QuizLocale;
  title: string;
  subtitle?: string;
};

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
    /* autoplay hors interaction */
  }
}

/** Carousel 3D témoignages vidéo — même logique que la landing, sans marquee / vide. */
export function QuizVideoProof({ locale, title, subtitle }: Props) {
  const items = QUIZ_TESTIMONIALS;
  const total = items.length;
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => setActive((prev) => (prev + dir + total) % total),
    [total],
  );
  const goTo = useCallback((index: number) => setActive(((index % total) + total) % total), [total]);

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
    const io = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.1,
      rootMargin: '60px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    items.forEach((item, index) => {
      const video = videoRefs.current.get(item.id);
      if (!video) return;
      const offset = Math.abs(relativeOffset(index, active, total));
      video.muted = muted;
      video.defaultMuted = muted;
      if (index === active && isInView) {
        if (video.readyState >= 2) void tryPlay(video);
        else {
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
  }, [active, muted, isInView, total, items]);

  const current = items[active]!;

  return (
    <section ref={sectionRef} className="quiz-no-print relative py-6 sm:py-8">
      <div className="mb-4 px-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink/40">{title}</p>
        {subtitle ? <p className="mt-2 text-[13px] text-brand-ink/50">{subtitle}</p> : null}
        <div className="mt-3 flex justify-center -space-x-3" aria-hidden>
          {items.slice(0, 5).map((item, i) => (
            <div
              key={item.id}
              className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md"
              style={{ zIndex: 5 - i }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.posterSrc} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative mx-auto max-w-4xl select-none"
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
        <div className="relative mx-auto h-[min(42vh,360px)] w-full md:h-[400px]" style={{ perspective: '1400px' }}>
          {items.map((item, index) => {
            const offset = relativeOffset(index, active, total);
            const abs = Math.abs(offset);
            if (abs > 2) return null;

            const isActive = offset === 0;
            const rotateY = offset * -18;
            const translateX = offset * (isMobile ? 58 : 70);
            const scale = isActive ? 1 : abs === 1 ? 0.82 : 0.68;
            const opacity = isActive ? 1 : abs === 1 ? 0.55 : 0.28;
            const shouldLoad = abs <= 1;

            return (
              <figure
                key={item.id}
                className="absolute left-1/2 top-1/2 w-[min(62vw,230px)] origin-center md:w-[250px]"
                style={{
                  zIndex: 30 - abs,
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
                  <figcaption className="absolute inset-x-0 bottom-0 z-10 p-4 text-left text-white">
                    <p className="text-[15px] font-bold tracking-tight">
                      {item.name} <span aria-hidden>{item.flag}</span>
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75">
                      {locale === 'es' ? item.professionEs : item.professionFr}
                    </p>
                  </figcaption>
                  {!isActive ? (
                    <button
                      type="button"
                      className="absolute inset-0 z-20 cursor-pointer bg-transparent"
                      onClick={() => goTo(index)}
                      aria-label={
                        locale === 'es'
                          ? `Ver testimonio de ${item.name}`
                          : `Voir le témoignage de ${item.name}`
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-md"
                      aria-label={muted ? (locale === 'es' ? 'Activar sonido' : 'Activer le son') : locale === 'es' ? 'Silenciar' : 'Couper le son'}
                      aria-pressed={!muted}
                    >
                      {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
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
          className="absolute left-1 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-ink/10 bg-white/95 text-brand-ink shadow-md md:inline-flex"
          aria-label={locale === 'es' ? 'Anterior' : 'Précédent'}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-1 top-1/2 z-40 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-ink/10 bg-white/95 text-brand-ink shadow-md md:inline-flex"
          aria-label={locale === 'es' ? 'Siguiente' : 'Suivant'}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.name}
            aria-current={index === active}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? 'w-7 bg-[#c45d3e]' : 'w-1.5 bg-brand-ink/20 hover:bg-brand-ink/40'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={current.id + locale}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28 }}
          className="mx-auto mt-4 max-w-xl px-5 text-center font-serif text-sm italic leading-relaxed text-brand-ink/65"
        >
          {locale === 'es' ? current.seoBlurbEs : current.seoBlurbFr}
        </motion.p>
      </AnimatePresence>
    </section>
  );
}
