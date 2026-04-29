import Image from 'next/image';

import { gradeLabel, gradeRibbonClass, type GamificationGrade } from '@/lib/gamification';

type Props = {
  avatarUrl: string | null | undefined;
  displayName: string;
  grade?: string | null;
  sizePx?: number;
  showPoints?: boolean;
  points?: number | null;
};

export function AvatarWithRibbon({
  avatarUrl,
  displayName,
  grade,
  sizePx = 44,
  showPoints = false,
  points,
}: Props) {
  const g = (grade ?? 'debutant') as GamificationGrade | string;
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="relative inline-flex shrink-0" style={{ width: sizePx, height: sizePx }}>
      {avatarUrl ? (
        <span
          className="relative block overflow-hidden rounded-full border border-brand-ink/[0.08] bg-brand-beige"
          style={{ width: sizePx, height: sizePx }}
        >
          <Image src={avatarUrl} alt="" fill className="object-cover" sizes={`${sizePx}px`} />
        </span>
      ) : (
        <span
          className="flex items-center justify-center rounded-full border border-brand-ink/[0.08] bg-brand-sand/40 font-semibold text-brand-ink/70"
          style={{ width: sizePx, height: sizePx, fontSize: Math.max(12, sizePx * 0.35) }}
        >
          {initial}
        </span>
      )}
      <span
        className={`premium-badge absolute -bottom-1 left-1/2 z-10 max-w-[calc(100%+8px)] -translate-x-1/2 truncate rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider shadow-sm ring-1 ring-inset ${gradeRibbonClass(g)}`}
        title={gradeLabel(g)}
      >
        {gradeLabel(g)}
      </span>
      {showPoints && points != null ? (
        <span className="absolute -right-1 -top-1 rounded-full bg-brand-ink px-1 py-0.5 text-[8px] font-bold tabular-nums text-white shadow">
          {points}
        </span>
      ) : null}
    </div>
  );
}
