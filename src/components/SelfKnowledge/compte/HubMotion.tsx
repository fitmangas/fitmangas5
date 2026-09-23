'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  value: number;
  durationMs?: number;
  className?: string;
  decimals?: number;
  suffix?: string;
};

/** Compteur animé — respect prefers-reduced-motion. */
export function AnimatedCounter({
  value,
  durationMs = 900,
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
      if (reduced) {
        setDisplay(value);
        fromRef.current = value;
        return;
      }
      fromRef.current = 0;
    }

    if (reduced) {
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
