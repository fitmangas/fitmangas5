'use client';

import { Loader2, Plus } from 'lucide-react';

import { acq } from './tokens';

type JourneyActionClusterProps = {
  /** Masqué sur les panneaux lecture seule (évite boutons morts). */
  variant?: 'hidden' | 'create-thread' | 'send-message';
  onPrimary?: () => void;
  disabled?: boolean;
  busy?: boolean;
  label?: string;
};

/** Bouton + contextuel Stratus — inbox (créer fil) ou détail (envoyer). */
export function JourneyActionCluster({
  variant = 'hidden',
  onPrimary,
  disabled = false,
  busy = false,
  label,
}: JourneyActionClusterProps) {
  if (variant === 'hidden') return null;

  const title =
    label ??
    (variant === 'create-thread' ? 'Créer un fil sandbox' : 'Envoyer le message');

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled || busy || !onPrimary}
      onClick={onPrimary}
      className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      style={{ backgroundColor: acq.cream, color: acq.ink, boxShadow: acq.shadowCard }}
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={2} />}
    </button>
  );
}
