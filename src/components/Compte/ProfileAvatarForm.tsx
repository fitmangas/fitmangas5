'use client';

import Image from 'next/image';
import { useFormStatus } from 'react-dom';

import { updateAvatarAction } from '@/app/compte/actions';
import { GlassCard } from '@/components/ui/GlassCard';

function SubmitLabel() {
  const { pending } = useFormStatus();
  return pending ? 'Envoi…' : 'Mettre à jour la photo';
}

export function ProfileAvatarForm({ avatarUrl }: { avatarUrl: string | null | undefined }) {
  const url = avatarUrl?.trim();

  return (
    <GlassCard className="p-8">
      <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Photo de profil</h2>
      <p className="mt-2 text-sm text-luxury-muted">JPG, PNG ou WebP — max 4 Mo.</p>
      <div className="mt-6 flex flex-wrap items-end gap-6">
        {url ? (
          <span className="relative h-24 w-24 overflow-hidden rounded-full border border-white/45 bg-white/30 shadow-inner">
            <Image src={url} alt="" fill className="object-cover" sizes="96px" />
          </span>
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-white/45 bg-white/20 text-sm text-luxury-soft">
            Aucune
          </span>
        )}
        <form action={updateAvatarAction} encType="multipart/form-data" className="flex flex-col gap-3">
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="max-w-full text-sm text-luxury-muted file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-luxury-orange file:to-luxury-orange-deep file:px-4 file:py-2 file:text-[11px] file:font-semibold file:uppercase file:tracking-wider file:text-white"
          />
          <button type="submit" className="btn-luxury-primary w-fit min-h-[44px] px-6 py-2">
            <SubmitLabel />
          </button>
        </form>
      </div>
    </GlassCard>
  );
}
