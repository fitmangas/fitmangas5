import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité — FitMangas',
  description: 'Politique de confidentialité FitMangas : données personnelles, cookies et droits RGPD.',
  openGraph: {
    title: 'Politique de confidentialité — FitMangas',
    description: 'Politique de confidentialité FitMangas : données personnelles, cookies et droits RGPD.',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de confidentialité — FitMangas',
    description: 'Politique de confidentialité FitMangas : données personnelles, cookies et droits RGPD.',
    images: ['/og-default.jpg'],
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-luxury-ink">
      <Link href="/" className="text-sm text-luxury-muted underline underline-offset-4">
        Retour accueil
      </Link>
      <h1 className="mt-8 text-4xl font-serif italic">Politique de confidentialité</h1>
      <p className="mt-4 text-sm text-luxury-muted">Dernière mise à jour : 14 septembre 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-luxury-muted">
        <p>
          FitMangas est exploité par Alejandra Mangas, entreprise individuelle (raison sociale : Mangas Alejandra EI),
          immatriculée sous le SIREN 947964508, dont le siège est situé 17 Passage Leroy, 44300 Nantes, France.
        </p>
        <p>
          Nous collectons les données nécessaires à la création de compte, à la gestion des abonnements, aux réservations,
          aux communications de service et à l’accès aux contenus : identité, email, préférences de langue, fuseau horaire,
          historique d’achat, progression, favoris et données techniques de sécurité.
        </p>
        <p>
          Les paiements sont traités par Stripe. FitMangas ne stocke pas les numéros de carte bancaire. Les commandes boutique
          peuvent être transmises aux prestataires nécessaires à leur exécution, notamment Printful.
        </p>
        <p>
          Les données sont conservées pendant la durée nécessaire au service, puis archivées selon les obligations légales
          applicables. Vous pouvez demander l’accès, la rectification, l’effacement ou la limitation de vos données en écrivant
          à info@casamangas.fr.
        </p>

        <h2 className="pt-2 text-base font-semibold text-luxury-ink">Cookies</h2>
        <p>
          Des cookies strictement nécessaires peuvent être utilisés pour l’authentification, la sécurité et le fonctionnement
          technique du service (par exemple session de connexion ou code de parrainage).
        </p>
        <p>
          Avec ton accord explicite (bandeau cookies), nous pouvons aussi déposer des cookies / traceurs de mesure d’audience
          et marketing : Google Analytics 4 et le pixel Meta. Tu peux refuser ces cookies : le site reste utilisable. Tu peux
          changer d’avis en effaçant les données du site dans ton navigateur, ce qui réaffichera le bandeau.
        </p>
        <p>Les données ne sont pas revendues.</p>
        <p>
          Voir aussi les{' '}
          <Link href="/mentions-legales" className="underline underline-offset-2">
            mentions légales
          </Link>{' '}
          et les{' '}
          <Link href="/terms" className="underline underline-offset-2">
            conditions générales
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
