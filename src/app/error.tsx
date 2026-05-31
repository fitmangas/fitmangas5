'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <main className="luxury-shell relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="luxury-bg-orbs pointer-events-none" aria-hidden />
      <div className="relative z-10 max-w-md">
        <Image src="/logo.png" alt="FitMangas" width={72} height={72} className="mx-auto mb-6" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C45D3E]">Erreur</p>
        <h1 className="mt-3 font-serif text-3xl text-[#2D2D2D]">Un imprévu est survenu</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#6B6560]">
          Nos équipes sont informées. Tu peux réessayer dans un instant ou revenir à l’accueil.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center rounded-full bg-[#C45D3E] px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-md transition hover:bg-[#A84B30]"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center rounded-full border border-[rgba(201,169,110,0.55)] bg-white/70 px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2D2D2D] shadow-sm transition hover:bg-white"
          >
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
