export type AdminProgramListItem = {
  id: string;
  slug: string;
  titleFr: string;
  status: 'draft' | 'published' | 'archived';
  levelLabel: string;
  weeks: number;
  sessions: number;
  coverUrl: string;
};

export type AdminVideoOption = {
  id: string;
  title: string;
  durationLabel: string;
  category: string;
  thumb: string;
  usedIn: number;
  embedUrl?: string | null;
};

export const DEMO_ADMIN_PROGRAMS: AdminProgramListItem[] = [
  { id: 'p1', slug: 'les-fondations', titleFr: 'Les Fondations du Pilates', status: 'published', levelLabel: 'Débutante', weeks: 3, sessions: 9, coverUrl: '/programmes/alejandra-tapis.jpg' },
  { id: 'p2', slug: 'barre-en-douceur', titleFr: 'Barre en douceur', status: 'published', levelLabel: 'Débutante', weeks: 3, sessions: 9, coverUrl: '/programmes/barre-douce.jpg' },
  { id: 'p3', slug: 'dos-posture-anti-bureau', titleFr: 'Dos & posture : anti-bureau', status: 'published', levelLabel: 'Débutante', weeks: 3, sessions: 9, coverUrl: '/programmes/pm-pont-exterieur.jpg' },
  { id: 'p4', slug: 'routine-express-20', titleFr: 'Routine express 20 min', status: 'published', levelLabel: 'Débutante', weeks: 2, sessions: 8, coverUrl: '/programmes/alejandra-mug.jpg' },
  { id: 'p5', slug: 'centre-solide', titleFr: 'Centre solide', status: 'published', levelLabel: 'Intermédiaire', weeks: 4, sessions: 12, coverUrl: '/programmes/pm-centre-ballon.jpg' },
  { id: 'p6', slug: 'barre-sculpt', titleFr: 'Barre Sculpt', status: 'published', levelLabel: 'Intermédiaire', weeks: 4, sessions: 12, coverUrl: '/programmes/barre-cercle.jpg' },
  { id: 'p7', slug: 'fessiers-jambes', titleFr: 'Fessiers & jambes', status: 'draft', levelLabel: 'Intermédiaire', weeks: 4, sessions: 12, coverUrl: '/programmes/barre-arabesque.jpg' },
  { id: 'p8', slug: 'cardio-plaisir', titleFr: 'Cardio plaisir', status: 'published', levelLabel: 'Intermédiaire', weeks: 4, sessions: 12, coverUrl: '/programmes/dance-studio.jpg' },
  { id: 'p9', slug: 'pilates-challenge', titleFr: 'Pilates Challenge', status: 'published', levelLabel: 'Avancée', weeks: 4, sessions: 16, coverUrl: '/programmes/pm-rouleau.jpg' },
  { id: 'p10', slug: 'barre-intense', titleFr: 'Barre Intense', status: 'draft', levelLabel: 'Avancée', weeks: 4, sessions: 16, coverUrl: '/programmes/barre-exterieur.jpg' },
  { id: 'p11', slug: 'boot-camp-hiit', titleFr: 'Boot Camp HIIT', status: 'draft', levelLabel: 'Avancée', weeks: 4, sessions: 12, coverUrl: '/programmes/hiit-bande.jpg' },
  { id: 'p12', slug: 'souplesse-recuperation', titleFr: 'Souplesse & récupération', status: 'published', levelLabel: 'Tous niveaux', weeks: 3, sessions: 9, coverUrl: '/programmes/pm-plage.jpg' },
];

export const DEMO_ADMIN_VIDEOS: AdminVideoOption[] = [
  { id: 'v1', title: 'Pilates Mat Débutant : Les Fondations (60 Min)', durationLabel: '61:11', category: 'PILATES MAT', thumb: '/programmes/alejandra-tapis.jpg', usedIn: 1 },
  { id: 'v2', title: 'Pilates Mat 3', durationLabel: '16:50', category: 'PILATES MAT', thumb: '/programmes/alejandra-tapis.jpg', usedIn: 2 },
  { id: 'v3', title: 'Pilates Mat 2', durationLabel: '30:53', category: 'PILATES MAT', thumb: '/programmes/alejandra-tapis.jpg', usedIn: 1 },
  { id: 'v4', title: 'Stretching Flow Dynamique (20 min)', durationLabel: '19:32', category: 'STRETCHING', thumb: '/programmes/alejandra-tapis.jpg', usedIn: 0 },
];

export const DEMO_ADMIN_STATS = {
  active: 14,
  activeHint: '+3 cette semaine',
  completed: 6,
  completedHint: 'certificats envoyés',
  finishRate: '43 %',
  finishHint: 'moyenne du catalogue : 38 %',
  dropStep: 'Séance 4',
  dropHint: 'Pilates Mat 2 · ressenti « Difficile » 41 %',
};
