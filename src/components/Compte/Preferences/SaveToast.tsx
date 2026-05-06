'use client';

type Props = {
  visible: boolean;
  message: string;
};

/** Toast fixe haut-droite, fade via opacity + transition Tailwind */
export function SaveToast({ visible, message }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed right-4 top-4 z-[100] rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm font-medium text-luxury-ink shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
