'use client';

import { useFormStatus } from 'react-dom';

import { updateBirthDateAction } from '@/app/compte/actions';
import { GlassCard } from '@/components/ui/GlassCard';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-luxury-primary px-6 py-2 disabled:opacity-50"
      disabled={pending}
    >
      {pending ? '…' : 'Enregistrer'}
    </button>
  );
}

export function ProfileBirthDateForm({ defaultIsoDate }: { defaultIsoDate: string | null }) {
  const defaultInput = defaultIsoDate ? defaultIsoDate.slice(0, 10) : '';

  return (
    <GlassCard className="p-8">
      <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Date de naissance</h2>
      <p className="mt-2 text-sm text-luxury-muted">Pour ton anniversaire (jour et mois uniquement côté surprise).</p>
      <form action={updateBirthDateAction} className="mt-6 flex flex-wrap items-end gap-4">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-luxury-soft">
          Naissance
          <input
            name="birth_date"
            type="date"
            defaultValue={defaultInput}
            className="mt-2 block rounded-xl border border-white/45 bg-white/30 px-3 py-2 text-sm text-luxury-ink backdrop-blur-sm"
          />
        </label>
        <Submit />
      </form>
    </GlassCard>
  );
}

export function ProfileBirthDateFormEmbedded({ defaultIsoDate }: { defaultIsoDate: string | null }) {
  const defaultInput = defaultIsoDate ? defaultIsoDate.slice(0, 10) : '';

  return (
    <div className="p-0">
      <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Date de naissance</h2>
      <p className="mt-2 text-sm text-luxury-muted">Pour ton anniversaire (jour et mois uniquement côté surprise).</p>
      <form action={updateBirthDateAction} className="mt-6 flex flex-wrap items-end gap-4">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-luxury-soft">
          Naissance
          <input
            name="birth_date"
            type="date"
            defaultValue={defaultInput}
            className="mt-2 block rounded-xl border border-white/45 bg-white/30 px-3 py-2 text-sm text-luxury-ink backdrop-blur-sm"
          />
        </label>
        <Submit />
      </form>
    </div>
  );
}
