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
            className={`relative flex cursor-pointer items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              selected
                ? 'border-luxury-violet/50 bg-luxury-violet/15 text-luxury-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'
                : 'border-white/50 bg-white/35 text-luxury-muted hover:border-white/70 hover:bg-white/50'
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
