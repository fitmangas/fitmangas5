'use client';

type Bucket = { section_bucket: number; scroll_hits: number; average_time_spent_seconds: number };

export function HeatmapPreview({ buckets, maxHits }: { buckets: Bucket[]; maxHits: number }) {
  const rows = Array.from({ length: 20 }, (_, i) => buckets.find((b) => b.section_bucket === i)?.scroll_hits ?? 0);

  return (
    <div className="mt-6 space-y-2">
      {rows.map((hits, i) => {
        const pct = maxHits > 0 ? hits / maxHits : 0;
        const hue = Math.round(220 - pct * 220);
        const bg = `hsl(${hue} 85% ${45 + pct * 15}%)`;
        const labelFrom = i * 5;
        const labelTo = (i + 1) * 5;
        return (
          <div key={i} className="flex items-center gap-3 text-[11px]">
            <span className="w-24 shrink-0 text-luxury-muted">
              {labelFrom}-{labelTo}%
            </span>
            <div className="h-8 flex-1 overflow-hidden rounded-lg bg-white/40">
              <div className="h-full rounded-lg transition-all" style={{ width: `${Math.max(4, pct * 100)}%`, backgroundColor: bg }} />
            </div>
            <span className="w-10 shrink-0 text-right text-luxury-muted">{hits}</span>
          </div>
        );
      })}
    </div>
  );
}
