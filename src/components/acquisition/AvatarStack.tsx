'use client';

import { AvatarBadge } from './AvatarBadge';

export type AvatarPerson = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

type AvatarStackProps = {
  people: AvatarPerson[];
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
};

export function AvatarStack({ people, max = 5, size = 'sm', className = '' }: AvatarStackProps) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  if (!visible.length) return null;

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((p, i) => (
        <span key={p.id} className={i > 0 ? '-ml-2.5' : ''} style={{ zIndex: visible.length - i }}>
          <AvatarBadge name={p.name} imageUrl={p.imageUrl} size={size} ring />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className="-ml-2.5 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white"
          style={{ backgroundColor: '#E8DFD4', color: '#57534E' }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
