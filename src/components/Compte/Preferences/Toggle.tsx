'use client';

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
  id: string;
};

/** Interrupteur style iOS — luxe emerald actif */
export function Toggle({ checked, onChange, disabled, label, description, id }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl px-1 py-1 transition-all duration-200">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-semibold tracking-tight text-luxury-ink">
          {label}
        </label>
        {description ? <p className="mt-1 text-xs leading-relaxed text-luxury-muted/85">{description}</p> : null}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-8 w-[52px] shrink-0 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury-violet focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? 'border-luxury-emerald/40 bg-luxury-emerald/90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35),0_6px_14px_rgba(16,185,129,0.18)]'
            : 'border-white/65 bg-white/55 shadow-inner'
        }`}
      >
        <span
          className={`pointer-events-none absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.2)] ring-1 ring-black/5 transition-transform duration-200 ${
            checked ? 'translate-x-[22px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
