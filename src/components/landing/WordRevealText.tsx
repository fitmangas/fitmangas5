'use client';

import { useMemo } from 'react';

/** Mots à accentuer en terracotta (FR/ES). */
const ACCENT = new Set([
  'seules',
  'seule',
  'vraie',
  'vrai',
  'fitmangas',
  'solas',
  'sola',
  'verdad',
]);

/**
 * Splitte le texte éditorial en spans (mot à mot) au montage client.
 * Le texte source reste identique — seul le wrapping change pour le scrub GSAP.
 */
export function WordRevealText({ text, className }: { text: string; className?: string }) {
  const words = useMemo(() => text.split(/(\s+)/).filter((w) => w.length > 0), [text]);

  return (
    <p className={className} data-word-reveal>
      {words.map((token, i) => {
        if (/^\s+$/.test(token)) {
          return <span key={`s-${i}`}>{token}</span>;
        }
        const clean = token.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
        const accent = ACCENT.has(clean);
        return (
          <span key={`w-${i}`} data-word data-word-accent={accent ? '1' : undefined}>
            {token}
          </span>
        );
      })}
    </p>
  );
}
