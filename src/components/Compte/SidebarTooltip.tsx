'use client';

import { useEffect, useId, useRef, useState, type FocusEvent, type ReactNode } from 'react';

/** Info-bulle D10 : 150 ms au survol / focus, Échap, role=tooltip. Desktop only. */
export function SidebarTooltip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    timer.current = setTimeout(() => setOpen(true), 150);
  }
  /** Au focus : seulement au clavier (pas quand une fenêtre rend le focus après un clic). */
  function showOnFocus(e: FocusEvent<HTMLSpanElement>) {
    let keyboard = true;
    try {
      keyboard = (e.target as HTMLElement).matches(':focus-visible');
    } catch {
      /* navigateur ancien : comportement d'origine */
    }
    if (keyboard) show();
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') hide();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <span className="relative hidden md:block" onMouseEnter={show} onMouseLeave={hide} onFocus={showOnFocus} onBlur={hide}>
      {children}
      {open ? (
        <span
          role="tooltip"
          id={id}
          className="pointer-events-none absolute left-full top-1/2 z-[120] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#2B2622] px-2.5 py-1.5 text-[13px] text-white shadow-lg"
        >
          <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-[#2B2622]" />
          {label}
        </span>
      ) : null}
    </span>
  );
}
