'use client';

import type { NotificationPreferencesRow } from '@/lib/notifications/types';

type Digest = NotificationPreferencesRow['digest_frequency'];

type Option = { value: Digest; label: string };

type Props = {
  name: string;
  value: Digest;
  onChange: (value: Digest) => void;
  options: Option[];
};

/** Radios custom — pastilles luxury */
export function RadioGroup({ name, value, onChange, options }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`relative flex cursor-pointer items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
              selected
                ? 'border-luxury-violet/45 bg-white/80 text-luxury-ink shadow-[0_6px_16px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.65)]'
                : 'border-white/55 bg-white/35 text-luxury-muted shadow-sm hover:border-white/80 hover:bg-white/60 hover:text-luxury-ink'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
