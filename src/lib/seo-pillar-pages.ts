export type SeoPillarPage = {
  slug: 'pilates-en-ligne' | 'cours-pilates-visio' | 'pilates-debutant-maison';
  title: string;
  shortTitle: string;
  description: string;
  keywords: string[];
  audience: string;
  promise: string;
  intro: string;
  sections: Array<{ title: string; body: string; bullets: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const SEO_PILLAR_PAGES: SeoPillarPage[] = [
  {
    slug: 'pilates-en-ligne',
    title: 'Pilates en ligne : cours, méthode et progression à la maison',
    shortTitle: 'Pilates en ligne',
    description:
      'Découvre comment progresser en Pilates en ligne avec des cours en visio, des replays et une méthode douce pour la posture, le souffle et la régularité.',
    keywords: [
      'pilates en ligne',
      'cours pilates en ligne',
      'pilates maison',
      'pilates visio',
      'cours de pilates à distance',
    ],
    audience: 'Pour les femmes qui veulent pratiquer chez elles sans perdre la qualité d’un vrai cours guidé.',
    promise: 'Construire une routine régulière, claire et motivante, même avec un emploi du temps chargé.',
    intro:
      'Le Pilates en ligne fonctionne quand il combine trois éléments : une coach qui corrige l’intention du mouvement, un planning régulier et des replays pour rester constante. FitMangas organise cette pratique autour de cours en visio, d’une bibliothèque replay et d’une approche centrée sur le souffle, la posture et les abdos profonds.',
    sections: [
      {
        title: 'Pourquoi choisir le Pilates en ligne ?',
        body:
          'Le Pilates en ligne permet de garder un rendez-vous avec soi-même sans déplacement. La clé n’est pas de faire plus, mais de pratiquer mieux, avec des séances ciblées et faciles à intégrer dans la semaine.',
        bullets: [
          'Gagner du temps en supprimant les trajets.',
          'Pratiquer depuis chez soi avec un cadre calme.',
          'Revoir les séances en replay pour consolider les bases.',
          'Installer une routine durable plutôt qu’un effort ponctuel.',
        ],
      },
      {
        title: 'Ce qui fait progresser vraiment',
        body:
          'La progression vient de la répétition intelligente : respirer mieux, comprendre le placement, sentir les bons muscles et augmenter petit à petit la précision.',
        bullets: [
          'Des séances live pour garder l’engagement.',
          'Des replays pour refaire les passages difficiles.',
          'Des thèmes variés : posture, mobilité, centre, respiration, barre.',
          'Un rythme réaliste pour ne pas abandonner après deux semaines.',
        ],
      },
      {
        title: 'Pilates en ligne et accompagnement',
        body:
          'Un bon cours en ligne n’est pas une simple vidéo. Il doit donner une intention claire, expliquer les sensations recherchées et proposer des options pour adapter les mouvements.',
        bullets: [
          'Consignes précises et vocabulaire simple.',
          'Options pour débuter ou intensifier sans se blesser.',
          'Travail du souffle pendant l’effort.',
          'Lien direct avec les articles du blog pour comprendre la méthode.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Est-ce que le Pilates en ligne est efficace ?',
        answer:
          'Oui, si la pratique est régulière et bien guidée. Les meilleurs résultats viennent d’un rythme réaliste, de consignes précises et de replays pour répéter.',
      },
      {
        question: 'Faut-il beaucoup de matériel ?',
        answer:
          'Non. Un tapis suffit pour commencer. Selon les cours, de petits accessoires peuvent enrichir la séance, mais ils ne sont pas indispensables au départ.',
      },
      {
        question: 'Combien de séances faire par semaine ?',
        answer:
          'Deux à trois séances par semaine donnent une bonne base. Le plus important est la régularité plutôt que l’intensité excessive.',
      },
    ],
  },
  {
    slug: 'cours-pilates-visio',
    title: 'Cours de Pilates en visio : pratiquer en direct avec une coach',
    shortTitle: 'Pilates en visio',
    description:
      'Cours de Pilates en visio avec FitMangas : séances live, replays, conseils de placement et progression douce depuis la maison.',
    keywords: [
      'cours pilates visio',
      'pilates en direct',
      'cours pilates live',
      'pilates avec coach en ligne',
      'pilates collectif visio',
    ],
    audience: 'Pour celles qui veulent l’énergie d’un cours en direct sans aller en studio.',
    promise: 'Retrouver un cadre, une présence et une progression guidée depuis chez soi.',
    intro:
      'Un cours de Pilates en visio garde l’aspect rendez-vous du studio : une heure prévue, une coach présente, une intention de séance et un cadre motivant. C’est une solution idéale pour progresser à la maison sans pratiquer seule devant une vidéo isolée.',
    sections: [
      {
        title: 'La différence entre visio et vidéo seule',
        body:
          'La visio apporte une vraie dynamique : tu sais quand pratiquer, tu suis un rythme, et la séance est pensée comme un cours complet plutôt qu’un enchaînement d’exercices.',
        bullets: [
          'Un rendez-vous fixe qui aide à rester régulière.',
          'Une progression structurée d’une séance à l’autre.',
          'Des explications de placement pendant le cours.',
          'Une expérience plus vivante qu’un replay seul.',
        ],
      },
      {
        title: 'À qui s’adressent les cours en visio ?',
        body:
          'Les cours en visio conviennent aux personnes qui veulent pratiquer chez elles, gagner du temps, reprendre une routine ou compléter une activité existante.',
        bullets: [
          'Débutantes qui veulent comprendre les bases.',
          'Femmes actives qui manquent de temps pour le studio.',
          'Pratiquantes qui veulent un cadre régulier.',
          'Personnes qui aiment alterner live et replay.',
        ],
      },
      {
        title: 'Comment bien préparer une séance visio',
        body:
          'Pour profiter du cours, il suffit d’un espace calme, d’un tapis, d’une connexion stable et de quelques minutes pour se mettre mentalement dans la séance.',
        bullets: [
          'Installer le tapis avant le début du cours.',
          'Prévoir de l’eau et un espace dégagé.',
          'Couper les distractions pendant la séance.',
          'Noter les sensations importantes après le cours.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Est-ce qu’un cours en visio remplace un cours en studio ?',
        answer:
          'Il ne remplace pas tout, mais il apporte un cadre très efficace pour pratiquer régulièrement, surtout quand le déplacement est un frein.',
      },
      {
        question: 'Puis-je suivre si je débute ?',
        answer:
          'Oui, à condition de choisir un cours adapté et d’écouter les options proposées. La précision compte plus que la performance.',
      },
      {
        question: 'Et si je rate le direct ?',
        answer:
          'Les replays permettent de refaire la séance plus tard et de garder la régularité même avec un planning variable.',
      },
    ],
  },
  {
    slug: 'pilates-debutant-maison',
    title: 'Pilates débutant à la maison : bases, souffle et posture',
    shortTitle: 'Pilates débutant',
    description:
      'Guide Pilates débutant à la maison : comprendre les bases, respirer correctement, placer son corps et commencer avec des séances simples.',
    keywords: [
      'pilates débutant maison',
      'débuter pilates chez soi',
      'exercices pilates débutant',
      'respiration pilates débutant',
      'pilates posture débutant',
    ],
    audience: 'Pour commencer sans pression, avec des repères simples et une méthode progressive.',
    promise: 'Apprendre les bases avant de chercher l’intensité.',
    intro:
      'Débuter le Pilates à la maison demande surtout de comprendre les fondamentaux : respiration, placement du bassin, engagement du centre et qualité du mouvement. L’objectif n’est pas de tout réussir tout de suite, mais de construire une base solide.',
    sections: [
      {
        title: 'Les bases à comprendre avant de commencer',
        body:
          'Le Pilates repose sur la précision. Un mouvement lent, bien respiré et bien placé vaut mieux qu’une série rapide mal contrôlée.',
        bullets: [
          'Respirer sans bloquer les épaules.',
          'Sentir l’engagement doux des abdos profonds.',
          'Garder une nuque longue et une posture stable.',
          'Respecter son amplitude du jour.',
        ],
      },
      {
        title: 'Les erreurs fréquentes des débutantes',
        body:
          'La plupart des difficultés viennent d’un excès de tension : vouloir trop bien faire, aller trop vite ou chercher la brûlure au lieu de la précision.',
        bullets: [
          'Bloquer la respiration pendant l’effort.',
          'Forcer dans les lombaires.',
          'Confondre vitesse et efficacité.',
          'Choisir des exercices trop avancés trop tôt.',
        ],
      },
      {
        title: 'Une routine simple pour progresser',
        body:
          'Le bon départ consiste à répéter quelques mouvements accessibles, puis à ajouter de la complexité progressivement.',
        bullets: [
          'Commencer par 20 à 30 minutes.',
          'Faire deux séances par semaine pendant un mois.',
          'Revoir les mêmes bases en replay.',
          'Ajouter ensuite mobilité, équilibre et barre.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Peut-on débuter le Pilates seule à la maison ?',
        answer:
          'Oui, si les consignes sont claires et progressives. Un cours guidé aide à éviter les erreurs de placement.',
      },
      {
        question: 'Quels exercices choisir au début ?',
        answer:
          'Les exercices simples de respiration, bassin neutre, mobilité de colonne et engagement du centre sont les plus utiles pour démarrer.',
      },
      {
        question: 'Quand voit-on les progrès ?',
        answer:
          'Les premières sensations peuvent venir rapidement, mais les changements durables se construisent avec plusieurs semaines de régularité.',
      },
    ],
  },
];

export function getSeoPillarPage(slug: string): SeoPillarPage | undefined {
  return SEO_PILLAR_PAGES.find((page) => page.slug === slug);
}
