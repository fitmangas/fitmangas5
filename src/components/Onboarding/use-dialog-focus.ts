'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/**
 * Fenêtre accessible : focus sur le bouton principal (`data-primary`) à l'ouverture et à chaque changement de `key`,
 * Tab / Maj+Tab restent dans la fenêtre, Échap appelle `onEscape`, et à la fermeture le focus revient
 * à l'élément qui avait ouvert la fenêtre (bouton « ? », etc.).
 */
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
  key?: unknown,
): void {
  // Déclaré avant l'effet qui donne le focus à la fenêtre : on mémorise d'abord qui l'avait.
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      const current = document.activeElement;
      // Seulement si le focus est resté dans la fenêtre ou retombé sur la page (pas si une autre fenêtre l'a pris).
      const focusLost = !current || current === document.body || Boolean(ref.current?.contains(current));
      if (!opener || opener === document.body || !document.contains(opener) || !focusLost) return;
      try {
        opener.focus({ preventScroll: true });
      } catch {
        /* rien */
      }
    };
  }, [active, ref]);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    const primary = root.querySelector<HTMLElement>('[data-primary]') ?? root.querySelector<HTMLElement>(FOCUSABLE);
    primary?.focus({ preventScroll: true });
  }, [active, ref, key]);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = ref.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !root.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !root.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, ref, onEscape]);
}
