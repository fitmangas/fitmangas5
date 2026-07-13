'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown, Download, ExternalLink } from 'lucide-react';

import {
  downloadIcsFile,
  openGoogleCalendar,
  validateCalendarEvent,
  type CalendarEventInput,
} from '@/lib/calendar-add-event';

type Lang = 'fr' | 'en' | 'es';

type Props = {
  event: CalendarEventInput;
  lang?: Lang;
  className?: string;
};

function copy(lang: Lang) {
  if (lang === 'en') {
    return {
      trigger: 'Add to my calendar',
      ics: 'Download (.ics)',
      google: 'Google Calendar',
      missing: 'Unable to add this course to the calendar for now.',
      close: 'Close',
    };
  }
  if (lang === 'es') {
    return {
      trigger: 'Añadir a mi calendario',
      ics: 'Descargar (.ics)',
      google: 'Google Calendar',
      missing: 'No se puede añadir este curso al calendario por el momento.',
      close: 'Cerrar',
    };
  }
  return {
    trigger: 'Ajouter à mon calendrier',
    ics: 'Télécharger (.ics)',
    google: 'Google Agenda',
    missing: 'Impossible d’ajouter ce cours au calendrier pour le moment.',
    close: 'Fermer',
  };
}

export function AddToCalendarMenu({ event, lang = 'fr', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const t = copy(lang);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
    };
  }, [open]);

  function ensureValid(): boolean {
    const validated = validateCalendarEvent(event);
    if (!validated.ok) {
      console.error('[AddToCalendarMenu]', validated.reason, event);
      setError(t.missing);
      setOpen(false);
      return false;
    }
    setError(null);
    return true;
  }

  function handleDownloadIcs() {
    if (!ensureValid()) return;
    try {
      downloadIcsFile(event);
      setOpen(false);
    } catch (e) {
      console.error('[AddToCalendarMenu] ics', e);
      setError(t.missing);
      setOpen(false);
    }
  }

  function handleGoogle() {
    if (!ensureValid()) return;
    try {
      openGoogleCalendar(event);
      setOpen(false);
    } catch (e) {
      console.error('[AddToCalendarMenu] google', e);
      setError(t.missing);
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen((prev) => !prev);
        }}
        className="btn-luxury-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] tracking-[0.12em]"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
      >
        <CalendarPlus size={14} aria-hidden />
        {t.trigger}
        <ChevronDown size={12} className={`transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-0 top-full z-30 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-brand-ink/10 bg-white shadow-[0_14px_30px_rgba(0,0,0,0.1)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadIcs}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink/75 transition hover:bg-brand-sand/25 hover:text-brand-ink"
          >
            <Download size={14} aria-hidden />
            {t.ics}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleGoogle}
            className="flex w-full items-center gap-2 border-t border-brand-ink/[0.06] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-ink/75 transition hover:bg-brand-sand/25 hover:text-brand-ink"
          >
            <ExternalLink size={14} aria-hidden />
            {t.google}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
