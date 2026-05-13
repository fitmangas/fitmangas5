import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité — FitMangas',
  description: 'Politique de confidentialité FitMangas.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-luxury-ink">
      <Link href="/" className="text-sm text-luxury-muted underline underline-offset-4">
        Retour accueil
      </Link>
      <h1 className="mt-8 text-4xl font-serif italic">Politique de confidentialité</h1>
      <p className="mt-4 text-sm text-luxury-muted">Dernière mise à jour : 13 mai 2026</p>

      <section className="mt-8 space-y-4 text-sm leading-7 text-luxury-muted">
        <p>
          FitMangas est exploité par Mangas Alejandra EI, entreprise individuelle immatriculée sous le SIREN 947964508,
          dont le siège est situé 17 Passage Leroy, 44300 Nantes, France.
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
        <p>
          Des cookies strictement nécessaires peuvent être utilisés pour l’authentification, la sécurité et la mesure technique
          du fonctionnement du service. Les données ne sont pas revendues.
        </p>
      </section>
    </main>
  );
}
