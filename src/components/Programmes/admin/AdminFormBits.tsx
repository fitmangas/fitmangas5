'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AdminProgramResult } from '@/app/admin/programmes/actions';

export const FIELD =
  'mt-2 w-full rounded-2xl border border-[#D9C9B4] bg-white px-4 py-3 text-sm text-luxury-ink shadow-[inset_0_1px_3px_rgba(31,27,22,0.08)] focus:border-luxury-orange focus:outline-none focus:ring-2 focus:ring-luxury-orange/15';
export const CHIP_ON = 'bg-[#C9A96E]/35 text-[#2D2D2D] shadow-sm ring-1 ring-[#C9A96E]/50';
export const CHIP_OFF = 'border border-[#D9C9B4] bg-white text-luxury-muted';

export type SaveState = { kind: 'idle' | 'saving' | 'saved' | 'error'; at: number | null; message?: string };

/** Enregistrement automatique : un seul état partagé par l'éditeur (affiché sous le titre du programme). */
export function useSaver(preview: boolean, initialAt: number | null) {
  const [state, setState] = useState<SaveState>({ kind: initialAt ? 'saved' : 'idle', at: initialAt });
  const run = useCallback(
    async (fn: () => Promise<AdminProgramResult>): Promise<AdminProgramResult> => {
      if (preview) {
        setState({ kind: 'saved', at: Date.now() });
        return { ok: true };
      }
      setState((s) => ({ ...s, kind: 'saving' }));
      try {
        const res = await fn();
        setState(res.ok ? { kind: 'saved', at: Date.now() } : { kind: 'error', at: null, message: res.message });
        return res;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erreur d’enregistrement.';
        setState({ kind: 'error', at: null, message });
        return { ok: false, message };
      }
    },
    [preview],
  );
  return { state, run };
}

/** « il y a 2 min », recalculé toutes les 30 s. */
export function useRelativeTime(at: number | null): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!at) return '';
  const min = Math.max(0, Math.round((now - at) / 60_000));
  if (min < 1) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `le ${new Date(at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

/** Champ texte enregistré à la sortie du champ (s'il a changé). */
export function AutoField({
  label,
  value,
  onCommit,
  multiline = false,
  rows = 3,
  placeholder,
  className = '',
  inputClassName = '',
  hint,
}: {
  label?: string;
  value: string;
  onCommit: (next: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft.trim() !== value.trim()) onCommit(draft.trim());
  };
  return (
    <label className={`block text-[12px] font-medium text-luxury-muted ${className}`}>
      {label}
      {multiline ? (
        <textarea className={`${FIELD} ${inputClassName}`} rows={rows} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={commit} />
      ) : (
        <input
          className={`${FIELD} ${inputClassName}`}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
      )}
      {hint ? <span className="mt-1 block text-[11.5px] font-normal text-luxury-soft">{hint}</span> : null}
    </label>
  );
}
