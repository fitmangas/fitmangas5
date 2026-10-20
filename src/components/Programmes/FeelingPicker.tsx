'use client';

const OPTIONS = [
  { id: 'easy' as const, fr: 'Facile' },
  { id: 'right' as const, fr: 'Juste bien' },
  { id: 'hard' as const, fr: 'Difficile' },
];

export function FeelingPicker({
  value,
  onChange,
}: {
  value?: 'easy' | 'right' | 'hard' | null;
  onChange?: (v: 'easy' | 'right' | 'hard') => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2.5">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange?.(o.id)}
          className={`rounded-2xl border px-3 py-3 text-[13px] font-semibold ${
            value === o.id ? 'border-luxury-orange bg-terracotta-50 text-luxury-ink' : 'border-[#D9C9B4] bg-white text-luxury-muted'
          }`}
        >
          {o.fr}
        </button>
      ))}
    </div>
  );
}
