'use client';

/**
 * Compteur animé — démarre déjà proche de la cible (évite captures à 2/7).
 * Respecte prefers-reduced-motion.
 */
import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  durationMs?: number;
  className?: string;
  decimals?: number;
  suffix?: string;
};

export function AnimatedCounter({
  value,
  durationMs = 550,
  className,
  decimals = 0,
  suffix = '',
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const mounted = useRef(false);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!mounted.current) {
      mounted.current = true;
      if (reduced || process.env.NEXT_PUBLIC_UX_CAPTURE === '1') {
        setDisplay(value);
        fromRef.current = value;
        return;
      }
      /* Départ à ~70 % de la cible — pas depuis 0 (évite captures mid-anim) */
      fromRef.current = Math.round(value * 0.7);
      setDisplay(fromRef.current);
    }

    if (reduced || process.env.NEXT_PUBLIC_UX_CAPTURE === '1') {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  const text =
    decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return (
    <span className={className} aria-label={`${value}${suffix}`}>
      {text}
      {suffix}
    </span>
  );
}
