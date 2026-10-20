import { Check } from 'lucide-react';

import type { WeekDot } from '@/lib/programmes/view-models';

/** Les 7 jours de la semaine : séance faite (vert), du jour (orange), prévue (pointillés), manquée (gris). */
export function WeekDots({ days, dark = false }: { days: WeekDot[]; dark?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {days.map((d) => {
        const cls =
          d.status === 'done'
            ? 'bg-success text-white'
            : d.status === 'today'
              ? 'bg-luxury-orange text-white shadow-[0_6px_14px_rgba(196,93,62,0.35)]'
              : d.status === 'planned'
                ? 'border-[1.5px] border-dashed border-luxury-orange/60 text-luxury-orange'
                : d.status === 'missed'
                  ? dark
                    ? 'bg-white/10 text-white/45'
                    : 'bg-black/[0.06] text-luxury-soft'
                  : dark
                    ? 'text-white/35'
                    : 'text-luxury-soft';
        return (
          <span key={d.key} className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${cls}`}>
            {d.status === 'done' ? <Check size={14} strokeWidth={3} aria-hidden /> : d.letter}
          </span>
        );
      })}
    </div>
  );
}
