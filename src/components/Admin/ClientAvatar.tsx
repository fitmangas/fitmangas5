import Image from 'next/image';

const FALLBACK = '/client-contact-photo.png';

type Props = {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
};

export function ClientAvatar({ avatarUrl, name = '', size = 36, className = '' }: Props) {
  const src = avatarUrl?.trim() || FALLBACK;
  const dim = `${size}px`;

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full border border-white/70 bg-white/60 shadow-[0_2px_8px_rgba(15,23,42,0.1)] ${className}`}
      style={{ width: dim, height: dim }}
    >
      <Image
        src={src}
        alt={name ? `Photo de ${name}` : ''}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        sizes={`${size}px`}
      />
    </span>
  );
}
