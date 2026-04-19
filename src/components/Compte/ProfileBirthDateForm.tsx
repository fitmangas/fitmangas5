'use client';

import { useFormStatus } from 'react-dom';

import { updateBirthDateAction } from '@/app/compte/actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full bg-brand-accent px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:opacity-93 disabled:opacity-50"
      disabled={pending}
    >
      {pending ? '…' : 'Enregistrer'}
    </button>
  );
}

export function ProfileBirthDateForm({ defaultIsoDate }: { defaultIsoDate: string | null }) {
  const defaultInput = defaultIsoDate ? defaultIsoDate.slice(0, 10) : '';

  return (
    <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <h2 className="font-serif text-xl italic text-brand-ink">Date de naissance</h2>
      <p className="mt-2 text-sm text-brand-ink/50">Pour ton anniversaire (jour et mois uniquement côté surprise).</p>
      <form action={updateBirthDateAction} className="mt-6 flex flex-wrap items-end gap-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-ink/45">
          Naissance
          <input
            name="birth_date"
            type="date"
            defaultValue={defaultInput}
            className="mt-2 block rounded-xl border border-brand-ink/[0.08] px-3 py-2 text-sm text-brand-ink"
          />
        </label>
        <Submit />
      </form>
    </div>
  );
}
