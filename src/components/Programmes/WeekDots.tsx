const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function WeekDots({
  chosen = [1, 3, 5],
  done = [1],
  today = 3,
}: {
  chosen?: number[];
  done?: number[];
  today?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {DAYS.map((d, i) => {
        const n = i + 1;
        const isDone = done.includes(n);
        const isToday = today === n;
        const isChosen = chosen.includes(n);
        const cls = isDone
          ? 'bg-success text-white'
          : isToday
            ? 'bg-luxury-orange text-white shadow-[0_6px_14px_rgba(196,93,62,0.35)]'
            : isChosen
              ? 'border-[1.5px] border-dashed border-luxury-orange/60 text-luxury-orange'
              : 'text-luxury-soft';
        return (
          <span key={`${d}-${i}`} className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ${cls}`}>
            {isDone ? '✓' : d}
          </span>
        );
      })}
    </div>
  );
}
