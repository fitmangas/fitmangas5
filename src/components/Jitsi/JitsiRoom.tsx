'use client';

import { useMemo } from 'react';

type Props = {
  roomUrl: string;
  title?: string;
};

/**
 * Intégration live : iframe vers l’URL Jitsi enregistrée (meet.jit.si ou instance dédiée).
 * L’IFrame API externe peut remplacer ce bloc plus tard pour hostnames personnalisés.
 */
export function JitsiRoom({ roomUrl, title = 'Live' }: Props) {
  const safeSrc = useMemo(() => {
    try {
      const u = new URL(roomUrl);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
      return u.toString();
    } catch {
      return null;
    }
  }, [roomUrl]);

  if (!safeSrc) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-900">
        URL de salle invalide.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-brand-ink/[0.08] bg-brand-ink/[0.04] shadow-inner">
      <iframe
        title={title}
        src={safeSrc}
        className="h-[min(72vh,800px)] w-full min-h-[420px] flex-1 rounded-2xl bg-black"
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
