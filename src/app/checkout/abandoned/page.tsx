import Link from 'next/link';

export default function CheckoutAbandonedPage() {
  return (
    <main className="min-h-screen bg-luxury-cream px-6 py-16">
      <section className="mx-auto max-w-xl rounded-[32px] border border-white/60 bg-white/55 p-8 text-center shadow-[0_24px_80px_rgba(48,35,28,0.12)] backdrop-blur">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-luxury-violet">FitMangas</p>
        <h1 className="mt-4 font-serif text-3xl italic text-luxury-ink">Pas de souci, revenez quand vous voulez</h1>
        <p className="mt-4 text-sm leading-relaxed text-luxury-muted">
          No pasa nada, puedes volver cuando quieras. Votre place reste ouverte pour reprendre le Pilates à votre rythme.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/?offer=v-coll" className="rounded-full bg-luxury-violet px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white">
            Reprendre
          </Link>
          <Link href="/compte" className="rounded-full border border-luxury-violet/25 bg-white/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-luxury-ink">
            Retour
          </Link>
        </div>
      </section>
    </main>
  );
}
