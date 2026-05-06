'use client';

import { useEffect, useMemo, useState } from 'react';

/** Liste IANA courante (extensible) */
export const IANA_TIMEZONE_OPTIONS = [
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Rome',
  'America/Mexico_City',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
] as const;

type Labels = {
  timezoneLabel: string;
  timezoneEdit: string;
  timezoneSave: string;
  timezoneCancel: string;
};

type Props = {
  currentTimezone: string;
  labels: Labels;
  onSave: (iana: string) => Promise<void>;
  /** Appelé avant onSave pour vider la file debouncée (prefs profil) */
  flushPending?: () => Promise<void>;
};

export function TimezoneSelector({ currentTimezone, labels, onSave, flushPending }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(currentTimezone);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(currentTimezone);
  }, [currentTimezone]);

  const zones = useMemo(() => {
    const set = new Set<string>([...IANA_TIMEZONE_OPTIONS]);
    set.add(currentTimezone);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [currentTimezone]);

  async function handleSave() {
    setSaving(true);
    try {
      if (flushPending) await flushPending();
      await onSave(draft);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(currentTimezone);
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-luxury-ink">{labels.timezoneLabel}</span>
        <span className="font-mono text-sm text-luxury-muted">{currentTimezone}</span>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm font-medium text-luxury-violet underline decoration-luxury-violet/30 underline-offset-2 transition hover:decoration-luxury-violet"
          >
            {labels.timezoneEdit}
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="rounded-xl border border-white/50 bg-white/35 p-4 shadow-inner">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-luxury-muted">
            IANA
          </label>
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mb-4 w-full max-w-md rounded-xl border border-white/60 bg-white/50 px-3 py-2.5 text-sm text-luxury-ink shadow-inner focus:border-luxury-violet/50 focus:outline-none focus:ring-2 focus:ring-luxury-violet/30"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="rounded-full bg-luxury-violet/90 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-luxury-violet disabled:opacity-50"
            >
              {labels.timezoneSave}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCancel}
              className="rounded-full border border-white/60 bg-white/40 px-4 py-2 text-sm font-medium text-luxury-ink hover:bg-white/60"
            >
              {labels.timezoneCancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
