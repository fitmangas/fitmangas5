import Link from 'next/link';

export const metadata = {
  title: 'Conditions générales — FitMangas',
  description: 'Conditions générales de vente et d’utilisation FitMangas.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-luxury-ink">
      <Link href="/" className="text-sm text-luxury-muted underline underline-offset-4">
        Retour accueil
      </Link>
      <h1 className="mt-8 text-4xl font-serif italic">Conditions générales</h1>
      <p className="mt-4 text-sm text-luxury-muted">Dernière mise à jour : 13 mai 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-luxury-muted">
        <p>
          Le site FitMangas est édité par Mangas Alejandra EI, SIREN 947964508, 17 Passage Leroy, 44300 Nantes, France.
          Contact : info@casamangas.fr.
        </p>
        <p>
          Les offres Visio collectif et Visio individuel sont des abonnements mensuels donnant accès aux contenus et services
          indiqués lors de la souscription. Les séances Nantes sont vendues à l’unité selon les disponibilités affichées.
        </p>
        <p>
          Le paiement est sécurisé via Stripe. L’accès aux services est activé après confirmation du paiement. En cas d’échec
          de paiement ou d’annulation d’abonnement, l’accès peut être suspendu ou prendre fin selon les règles Stripe et les
          informations affichées dans l’espace client.
        </p>
        <p>
          Les contenus vidéo, textes, visuels et programmes FitMangas sont réservés à un usage personnel. Toute reproduction,
          partage de compte, diffusion ou exploitation commerciale sans autorisation écrite est interdite.
        </p>
        <p>
          Les cours de Pilates et de barre ne remplacent pas un avis médical. Chaque cliente reste responsable de vérifier que
          la pratique est compatible avec son état de santé et d’adapter les exercices si nécessaire.
        </p>
      </section>
    </main>
  );
}
