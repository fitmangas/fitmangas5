'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  videoTitle: string | null;
  defaultIso?: string | null;
  onClose: () => void;
  onConfirm: (isoUtc: string) => Promise<void>;
};

/** datetime-local → ISO UTC ; bloque les dates passées. */
export function ScheduleModal({ open, videoTitle, defaultIso, onClose, onConfirm }: Props) {
  const minLocal = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (defaultIso) {
      const d = new Date(defaultIso);
      if (!Number.isNaN(d.getTime())) {
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
        setValue(local.toISOString().slice(0, 16));
        return;
      }
    }
    setValue(minLocal);
  }, [open, defaultIso, minLocal]);

  if (!open) return null;

  async function submit() {
    setErr(null);
    const when = new Date(value);
    if (Number.isNaN(when.getTime())) {
      setErr('Date ou heure invalide.');
      return;
    }
    if (when.getTime() <= Date.now()) {
      setErr('Choisis une date dans le futur.');
      return;
    }
    setBusy(true);
    try {
      await onConfirm(when.toISOString());
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur.');
    } finally {
      setBusy(false);
    }
  }

  const preview =
    value && !Number.isNaN(new Date(value).getTime())
      ? new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(new Date(value))
      : null;

  return (
    <div className="fixed inset-0 z-[520] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/95 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">Programmer</p>
            <h3 className="mt-1 text-lg font-semibold text-luxury-ink">{videoTitle ?? 'Vidéo'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 p-2 hover:bg-black/5"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <label className="mt-6 block text-xs font-medium text-luxury-muted">
          Date et heure (fuseau local)
          <input
            type="datetime-local"
            min={minLocal}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-luxury-ink shadow-inner"
          />
        </label>

        {preview ? (
          <p className="mt-4 text-sm text-luxury-ink/85">
            Sera publiée le{' '}
            <strong className="text-luxury-ink">{preview}</strong>
          </p>
        ) : null}

        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/15 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-luxury-ink"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="rounded-full bg-[#ff7a00] px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_8px_22px_rgba(255,122,0,0.35)] disabled:opacity-50"
          >
            {busy ? '…' : 'Programmer'}
          </button>
        </div>
      </div>
    </div>
  );
}
