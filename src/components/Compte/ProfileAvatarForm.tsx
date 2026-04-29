'use client';

import Image from 'next/image';
import { useFormStatus } from 'react-dom';

import { updateAvatarAction } from '@/app/compte/actions';
import { GlassCard } from '@/components/ui/GlassCard';

function SubmitLabel() {
  const { pending } = useFormStatus();
  return pending ? 'Envoi…' : 'Mettre à jour la photo';
}

export function ProfileAvatarForm({
  avatarUrl,
  embedded = false,
}: {
  avatarUrl: string | null | undefined;
  embedded?: boolean;
}) {
  const url = avatarUrl?.trim() || '/client-contact-photo.png';
  const content = (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-luxury-ink">Photo de profil</h2>
      <p className="mt-2 text-sm text-luxury-muted">JPG, PNG ou WebP — max 4 Mo.</p>
      <div className="mt-6 flex flex-wrap items-start gap-6">
        <span className="relative h-24 w-24 overflow-hidden rounded-full border border-white/45 bg-white/30 shadow-inner">
          <Image src={url} alt="" fill className="object-cover" sizes="96px" />
        </span>
        <form action={updateAvatarAction} encType="multipart/form-data" className="flex min-w-[240px] flex-col gap-3">
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="max-w-full text-sm text-luxury-muted file:mr-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-luxury-orange file:to-luxury-orange-deep file:px-4 file:py-2 file:text-[11px] file:font-semibold file:uppercase file:tracking-wider file:text-white"
          />
          <button type="submit" className="btn-luxury-primary inline-flex min-h-[44px] min-w-[220px] items-center justify-center px-6 py-2">
            <SubmitLabel />
          </button>
        </form>
      </div>
    </div>
  );

  if (embedded) return <div className="p-0">{content}</div>;
  return <GlassCard className="p-8">{content}</GlassCard>;
}
