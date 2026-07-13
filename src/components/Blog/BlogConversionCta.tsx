'use client';

import Link from 'next/link';

export function BlogConversionCta({ className = '' }: { className?: string }) {
  return (
    <section className={`rounded-[1.75rem] border border-orange-200/60 bg-orange-50/70 p-6 text-center shadow-sm ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-700">Rejoins FitMangas</p>
      <h2 className="mt-3 text-2xl font-semibold text-luxury-ink">Pilates, barre et replays depuis chez toi</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-luxury-muted">
        Continue ta progression avec les cours Visio, les replays et l’espace membre FitMangas.
      </p>
      <Link href="/?offer=v-coll" className="btn-luxury-primary mt-5 inline-flex px-6 py-2.5 text-[11px] tracking-[0.14em]">
        Découvrir l’offre Visio
      </Link>
    </section>
  );
}
