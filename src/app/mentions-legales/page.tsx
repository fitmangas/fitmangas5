import Link from 'next/link';

export const metadata = {
  title: 'Mentions légales — FitMangas',
  description: 'Mentions légales FitMangas : éditeur, hébergeur, contact et informations légales.',
  openGraph: {
    title: 'Mentions légales — FitMangas',
    description: 'Mentions légales FitMangas : éditeur, hébergeur, contact et informations légales.',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentions légales — FitMangas',
    description: 'Mentions légales FitMangas : éditeur, hébergeur, contact et informations légales.',
    images: ['/og-default.jpg'],
  },
};

export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-luxury-ink">
      <Link href="/" className="text-sm text-luxury-muted underline underline-offset-4">
        Retour accueil
      </Link>
      <h1 className="mt-8 text-4xl font-serif italic">Mentions légales</h1>
      <p className="mt-4 text-sm text-luxury-muted">Dernière mise à jour : 14 septembre 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-luxury-muted">
        <h2 className="pt-2 text-base font-semibold text-luxury-ink">Éditeur du site</h2>
        <p>
          Le site fitmangas.com est édité par Alejandra Mangas, entreprise individuelle (raison sociale : Mangas
          Alejandra EI), immatriculée sous le SIREN 947964508, dont le siège est situé 17 Passage Leroy, 44300 Nantes,
          France.
        </p>
        <p>
          Directrice de la publication : Alejandra Mangas.
          <br />
          Contact :{' '}
          <a className="underline underline-offset-2" href="mailto:info@casamangas.fr">
            info@casamangas.fr
          </a>
        </p>

        <h2 className="pt-4 text-base font-semibold text-luxury-ink">Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
          <a className="underline underline-offset-2" href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>
          .
        </p>

        <h2 className="pt-4 text-base font-semibold text-luxury-ink">Propriété intellectuelle</h2>
        <p>
          Les contenus du site (textes, vidéos, images, marques, programmes) sont protégés. Toute reproduction ou
          utilisation non autorisée est interdite.
        </p>

        <h2 className="pt-4 text-base font-semibold text-luxury-ink">Documents associés</h2>
        <p>
          <Link href="/privacy" className="underline underline-offset-2">
            Politique de confidentialité
          </Link>
          {' · '}
          <Link href="/terms" className="underline underline-offset-2">
            Conditions générales
          </Link>
        </p>
      </section>
    </main>
  );
}
