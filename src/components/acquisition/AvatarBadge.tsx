'use client';

import Image from 'next/image';

import { acq, initialsFromLabel } from './tokens';

type AvatarBadgeProps = {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  badge?: number;
  ring?: boolean;
  className?: string;
};

const sizes = {
  sm: { box: 32, text: 'text-[10px]', ring: 'ring-2' },
  md: { box: 40, text: 'text-xs', ring: 'ring-2' },
  lg: { box: 48, text: 'text-sm', ring: 'ring-[3px]' },
};

export function AvatarBadge({
  name,
  imageUrl,
  size = 'md',
  badge,
  ring = true,
  className = '',
}: AvatarBadgeProps) {
  const s = sizes[size];
  const initials = initialsFromLabel(name);

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`flex items-center justify-center overflow-hidden rounded-full ${s.text} font-bold ${ring ? `${s.ring} ring-white` : ''}`}
        style={{
          width: s.box,
          height: s.box,
          backgroundColor: imageUrl ? '#FFFFFF' : acq.cream,
          color: acq.terracotta,
          border: imageUrl ? 'none' : `1.5px solid ${acq.warmBeigeDeep}`,
        }}
        title={name}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={name} width={s.box} height={s.box} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      {badge != null && badge > 0 ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white"
          style={{ backgroundColor: acq.terracotta }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </span>
  );
}

/** Alejandra — pastille initiales (pas de photo biblio versionnée dans le repo). */
export function AlejandraAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <AvatarBadge name="Alejandra" size={size} />;
}
