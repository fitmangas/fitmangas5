'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Square } from 'lucide-react';

type Props = {
  courseId: string;
  /** Appelé juste avant la fin Jitsi (stop recording + end conference). */
  onBeforeEnd?: () => void | Promise<void>;
  /** Redirection après succès (défaut : séances admin). */
  redirectTo?: string;
};

export function EndLiveControls({ courseId, onBeforeEnd, redirectTo = '/admin/courses' }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEndLive() {
    if (busy) return;
    const confirmed = window.confirm(
      'Terminer le live pour toutes les participantes ?\n\nL’enregistrement s’arrête et la salle se ferme.',
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      await onBeforeEnd?.();

      const res = await fetch('/api/live/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Impossible de terminer le live.');
      }

      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la fin du live.');
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-center">
      <button
        type="button"
        onClick={() => void handleEndLive()}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-800 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Square size={12} fill="currentColor" aria-hidden />
        {busy ? 'Fermeture…' : 'Fin du live'}
      </button>
      {error ? <p className="text-center text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
