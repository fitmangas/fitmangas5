import Link from 'next/link';

export const metadata = {
  title: 'Conditions générales — FitMangas',
  description: 'Conditions générales FitMangas : abonnements, essai gratuit 7 jours, paiements et accès aux cours.',
  openGraph: {
    title: 'Conditions générales — FitMangas',
    description: 'Conditions générales FitMangas : abonnements, essai gratuit 7 jours, paiements et accès aux cours.',
    images: ['/og-default.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conditions générales — FitMangas',
    description: 'Conditions générales FitMangas : abonnements, essai gratuit 7 jours, paiements et accès aux cours.',
    images: ['/og-default.jpg'],
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-luxury-ink">
      <Link href="/" className="text-sm text-luxury-muted underline underline-offset-4">
        Retour accueil
      </Link>
      <h1 className="mt-8 text-4xl font-serif italic">Conditions générales</h1>
      <p className="mt-4 text-sm text-luxury-muted">Dernière mise à jour : 14 septembre 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-luxury-muted">
        <p>
          Le site FitMangas est édité par Alejandra Mangas (raison sociale : Mangas Alejandra EI), SIREN 947964508,
          17 Passage Leroy, 44300 Nantes, France. Contact : info@casamangas.fr.
        </p>
        <p>
          Les offres Visio collectif et Visio individuel sont des abonnements mensuels donnant accès aux contenus et services
          indiqués lors de la souscription. Les séances Nantes sont vendues à l’unité selon les disponibilités affichées.
        </p>

        <h2 className="pt-2 text-base font-semibold text-luxury-ink">Essai gratuit 7 jours</h2>
        <p>
          Les abonnements Visio proposés avec la mention « 7 jours gratuits » démarrent par un essai de 7 jours. Une carte
          bancaire est demandée à l’inscription pour activer l’essai. Pendant ces 7 jours, tu as accès au service selon
          l’offre choisie. Tu peux annuler l’abonnement depuis ton espace client (ou le portail Stripe) avant la fin de
          l’essai : dans ce cas, aucun prélèvement d’abonnement n’est lancé à l’issue des 7 jours. Si l’essai n’est pas
          annulé à temps, l’abonnement mensuel payant démarre automatiquement selon le tarif affiché au moment de
          l’inscription.
        </p>

        <p>
          Le paiement est sécurisé via Stripe. L’accès aux services est activé après confirmation de l’inscription / du
          paiement. En cas d’échec de paiement ou d’annulation d’abonnement, l’accès peut être suspendu ou prendre fin selon
          les règles Stripe et les informations affichées dans l’espace client.
        </p>
        <p>
          Les contenus vidéo, textes, visuels et programmes FitMangas sont réservés à un usage personnel. Toute reproduction,
          partage de compte, diffusion ou exploitation commerciale sans autorisation écrite est interdite.
        </p>
        <p>
          Les cours de Pilates et de barre ne remplacent pas un avis médical. Chaque cliente reste responsable de vérifier que
          la pratique est compatible avec son état de santé et d’adapter les exercices si nécessaire.
        </p>
        <p>
          Voir aussi les{' '}
          <Link href="/mentions-legales" className="underline underline-offset-2">
            mentions légales
          </Link>{' '}
          et la{' '}
          <Link href="/privacy" className="underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
