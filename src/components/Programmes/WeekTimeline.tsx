import Link from 'next/link';
import { Radio } from 'lucide-react';

export type TimelineStep = {
  id: string;
  kind: 'video' | 'live';
  title: string;
  minutes?: number;
  href?: string;
  done?: boolean;
};

export function WeekTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-[#E8DCCB] bg-white px-3 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-50 text-[12px] font-semibold text-luxury-orange">
            {s.kind === 'live' ? <Radio size={14} /> : i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium text-luxury-ink">{s.title}</p>
            {s.minutes ? <p className="text-[11.5px] text-luxury-muted">{s.minutes} min</p> : null}
          </div>
          {s.href ? (
            <Link href={s.href} className="text-[12px] font-semibold text-luxury-orange">
              {s.done ? 'Revoir' : 'Ouvrir'}
            </Link>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
