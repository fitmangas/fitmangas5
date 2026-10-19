export function SegmentBar({
  startS,
  endS,
  durationS,
  currentS,
}: {
  startS: number;
  endS: number;
  durationS: number;
  currentS: number;
}) {
  const dur = durationS || 1;
  const left = (startS / dur) * 100;
  const width = ((endS - startS) / dur) * 100;
  const pos = (currentS / dur) * 100;
  return (
    <div className="relative mt-2 h-2 rounded-full bg-white/20">
      <span className="absolute inset-y-0 rounded-full bg-[linear-gradient(90deg,#f3c58e,#e8967a,#c45d3e)]" style={{ left: `${left}%`, width: `${width}%` }} />
      <span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-luxury-orange shadow" style={{ left: `calc(${pos}% - 8px)` }} />
    </div>
  );
}
