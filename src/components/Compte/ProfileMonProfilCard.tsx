'use client';

import Image from 'next/image';
import { useFormStatus } from 'react-dom';

import { updateAvatarAction, updateBirthDateAction } from '@/app/compte/actions';
import { GlassCard } from '@/components/ui/GlassCard';

function AvatarSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="text-[10px] font-semibold uppercase tracking-wider text-luxury-orange hover:underline disabled:opacity-50">
      {pending ? '…' : 'Changer'}
    </button>
  );
}

function BirthSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-luxury-ghost min-h-[36px] px-4 py-1.5 text-[10px] tracking-[0.12em] disabled:opacity-50"
      disabled={pending}
    >
      {pending ? '…' : 'OK'}
    </button>
  );
}

type Props = {
  avatarUrl: string | null | undefined;
  birthDate: string | null;
  email: string | null | undefined;
  title: string;
  birthLabel: string;
  emailLabel: string;
};

export function ProfileMonProfilCard({ avatarUrl, birthDate, email, title, birthLabel, emailLabel }: Props) {
  const url = avatarUrl?.trim() || '/client-contact-photo.png';
  const defaultInput = birthDate ? birthDate.slice(0, 10) : '';

  return (
    <GlassCard id="profil" className="scroll-mt-28 p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{title}</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <span className="relative h-16 w-16 overflow-hidden rounded-full border border-white/50 bg-white/40 shadow-sm">
            <Image src={url} alt="" fill className="object-cover" sizes="64px" />
          </span>
          <form action={updateAvatarAction} encType="multipart/form-data" className="flex flex-col gap-1">
            <input
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="max-w-[180px] text-[10px] text-luxury-muted file:mr-2 file:rounded-full file:border-0 file:bg-luxury-orange/90 file:px-2 file:py-1 file:text-[9px] file:font-semibold file:text-white"
            />
            <AvatarSubmit />
          </form>
        </div>

        <div className="min-w-0 flex-1 space-y-3 border-t border-white/40 pt-3 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
          <p className="truncate text-sm text-luxury-muted">
            <span className="font-semibold text-luxury-ink">{emailLabel}</span>{' '}
            <span className="text-luxury-ink">{email ?? '—'}</span>
          </p>
          <form action={updateBirthDateAction} className="flex flex-wrap items-end gap-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-luxury-soft">
              {birthLabel}
              <input
                name="birth_date"
                type="date"
                defaultValue={defaultInput}
                className="mt-1 block w-full min-w-[140px] rounded-xl border border-white/45 bg-white/40 px-2.5 py-1.5 text-sm text-luxury-ink"
              />
            </label>
            <BirthSubmit />
          </form>
        </div>
      </div>
    </GlassCard>
  );
}
