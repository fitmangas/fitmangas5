import { CalendarDays, CircleCheck, Clock, Radio } from 'lucide-react';

export function CompletionStats({
  sessions,
  hours,
  lives,
  days,
  hideLives,
}: {
  sessions: string;
  hours: string;
  lives: string;
  days: string;
  hideLives?: boolean;
}) {
  const items = [
    { icon: CircleCheck, value: sessions, label: 'séances' },
    { icon: Clock, value: hours, label: "d'entraînement" },
    ...(hideLives ? [] : [{ icon: Radio, value: lives, label: 'lives avec Alejandra' }]),
    { icon: CalendarDays, value: days, label: 'jours' },
  ];
  return (
    <div className="relative mx-auto mt-9 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl bg-white/85 px-4 py-4 shadow-[0_8px_22px_rgba(31,27,22,0.08)]">
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-terracotta-50 text-luxury-orange">
            <it.icon size={16} />
          </span>
          <p className="mt-2 text-[24px] font-semibold tabular-nums text-luxury-ink">{it.value}</p>
          <p className="text-[12px] text-luxury-muted">{it.label}</p>
        </div>
      ))}
    </div>
  );
}
