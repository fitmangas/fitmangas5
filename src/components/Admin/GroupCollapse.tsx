'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'vimeo-admin-folder-open';

function readMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, boolean>)
      : {};
  } catch {
    return {};
  }
}

function writeKey(groupKey: string, open: boolean) {
  try {
    const map = readMap();
    map[groupKey] = open;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

type Props = {
  /** Clé stable pour le stockage (ex: nom du dossier normalisé). */
  groupKey: string;
  title: string;
  count: number;
  children: React.ReactNode;
};

/** Groupe repliable ; défaut ouvert ; persistance localStorage. */
export function GroupCollapse({ groupKey, title, count, children }: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const map = readMap();
    if (typeof map[groupKey] === 'boolean') {
      setOpen(map[groupKey]);
    } else {
      setOpen(true);
    }
  }, [groupKey]);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      writeKey(groupKey, next);
      return next;
    });
  }

  return (
    <div className="border-b border-white/20 pb-2">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 pb-2 text-left transition hover:text-luxury-orange"
      >
        {open ? (
          <ChevronDown size={18} className="shrink-0 text-luxury-muted" aria-hidden />
        ) : (
          <ChevronRight size={18} className="shrink-0 text-luxury-muted" aria-hidden />
        )}
        <h3 className="flex-1 text-sm font-semibold uppercase tracking-[0.12em] text-luxury-ink">
          {title}
          <span className="ml-2 text-xs font-normal normal-case tracking-normal text-luxury-muted">
            ({count})
          </span>
        </h3>
      </button>
      {open ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}
