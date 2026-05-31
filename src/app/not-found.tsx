import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="luxury-shell relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="luxury-bg-orbs pointer-events-none" aria-hidden />
      <div className="relative z-10 max-w-md">
        <Image src="/logo.png" alt="FitMangas" width={72} height={72} className="mx-auto mb-6" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C45D3E]">404</p>
        <h1 className="mt-3 font-serif text-3xl text-[#2D2D2D]">Page introuvable</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#6B6560]">
          Cette page n’existe pas ou n’est plus disponible. Retourne à l’accueil pour continuer ton parcours Pilates.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[rgba(201,169,110,0.55)] bg-white/70 px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2D2D2D] shadow-sm transition hover:bg-white"
        >
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
