'use client';

import { Calendar, Plus, Upload } from 'lucide-react';

import { acq } from './tokens';

/** Boutons d’action coin Stratus (+ upload calendrier). */
export function JourneyActionCluster() {
  const items = [
    { Icon: Plus, label: 'Ajouter' },
    { Icon: Upload, label: 'Exporter' },
    { Icon: Calendar, label: 'Calendrier' },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map(({ Icon, label }) => (
        <button
          key={label}
          type="button"
          title={label}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:opacity-80"
          style={{ backgroundColor: acq.cream, color: acq.ink, boxShadow: acq.shadowCard }}
        >
          <Icon size={16} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
