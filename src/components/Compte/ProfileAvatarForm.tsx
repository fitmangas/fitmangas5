'use client';

import Image from 'next/image';
import { useFormStatus } from 'react-dom';

import { updateAvatarAction } from '@/app/compte/actions';

function SubmitLabel() {
  const { pending } = useFormStatus();
  return pending ? 'Envoi…' : 'Mettre à jour la photo';
}

export function ProfileAvatarForm({ avatarUrl }: { avatarUrl: string | null | undefined }) {
  const url = avatarUrl?.trim();

  return (
    <div className="rounded-[28px] border border-brand-ink/[0.06] bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
      <h2 className="font-serif text-xl italic text-brand-ink">Photo de profil</h2>
      <p className="mt-2 text-sm text-brand-ink/50">JPG, PNG ou WebP — max 4 Mo.</p>
      <div className="mt-6 flex flex-wrap items-end gap-6">
        {url ? (
          <span className="relative h-24 w-24 overflow-hidden rounded-full border border-brand-ink/[0.08] bg-brand-beige">
            <Image src={url} alt="" fill className="object-cover" sizes="96px" />
          </span>
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-brand-ink/15 bg-brand-beige/40 text-sm text-brand-ink/40">
            Aucune
          </span>
        )}
        <form action={updateAvatarAction} encType="multipart/form-data" className="flex flex-col gap-3">
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="max-w-full text-sm text-brand-ink/70 file:mr-4 file:rounded-full file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:text-[11px] file:font-bold file:uppercase file:tracking-wider file:text-white"
          />
          <button
            type="submit"
            className="inline-flex w-fit min-h-[44px] items-center justify-center rounded-full bg-brand-accent px-6 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white hover:opacity-93"
          >
            <SubmitLabel />
          </button>
        </form>
      </div>
    </div>
  );
}
