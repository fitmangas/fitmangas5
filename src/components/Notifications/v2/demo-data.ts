export type NotifV2Category = 'live' | 'programme' | 'content' | 'progress' | 'cancel' | 'account' | 'community' | 'blog';

export type NotifV2Period = 'today' | 'yesterday' | 'week' | 'earlier';

export type NotifV2Item = {
  id: string;
  category: NotifV2Category;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  /** Libellé horaire déjà formaté dans le fuseau de la cliente (« il y a 5 min », « 18:00 », « hier », « lun. », « 9 oct. »). */
  when?: string;
  /** Période calculée dans le fuseau de la cliente. */
  period?: NotifV2Period;
  action_url?: string | null;
  action_label?: string | null;
  /** Bouton plein (terracotta) au lieu du bouton fantôme : réservé aux actions immédiates (rejoindre un live). */
  action_primary?: boolean;
  thumbs?: string[];
  tag?: string | null;
};

export type NotifV2NextLive = {
  title: string;
  /** « Aujourd'hui · 18:30 – 19:25 » */
  whenLabel: string;
  /** « Début à 18:30 (dans 55 min) · le lien est déjà ouvert » — découpé pour mettre l'heure en gras. */
  startTime: string;
  inLabel: string | null;
  href: string;
} | null;

export type NotifV2ReceiveLine = {
  icon: 'radio' | 'route' | 'circle-play' | 'mail';
  label: string;
  detail: string;
};

const now = Date.now();
const minutes = (n: number) => new Date(now - n * 60_000).toISOString();
const days = (n: number) => new Date(now - n * 86_400_000).toISOString();

export const DEMO_NOTIF_ITEMS: NotifV2Item[] = [
  {
    id: '1',
    category: 'live',
    title: 'Dans 1 heure : Barre/Pilates Flow',
    body: 'Le lien est déjà ouvert. Installe ton tapis, on commence à 18:30.',
    created_at: minutes(5),
    read_at: null,
    when: 'il y a 5 min',
    period: 'today',
    action_url: '/compte/planning',
    action_label: 'Rejoindre le live',
    action_primary: true,
  },
  {
    id: '2',
    category: 'programme',
    title: 'Ta séance du jour : les bases au sol, partie 2',
    body: 'Les Fondations du Pilates · séance 5 sur 9 · 31 min',
    created_at: minutes(40),
    read_at: null,
    when: '18:00',
    period: 'today',
    action_url: '/compte/programmes',
    action_label: 'Commencer la séance',
  },
  {
    id: '3',
    category: 'content',
    title: '1 replay et 1 nouvelle vidéo',
    body: 'Replay de Pilates Mat (mar. 13 oct.) et Pilates Mat avec Rouleau.',
    created_at: minutes(530),
    read_at: null,
    when: '09:12',
    period: 'today',
    action_url: '/compte/replays',
    action_label: 'Voir mes vidéos',
    thumbs: ['/email/hero-digest.jpg', '/programmes/pm-rouleau.jpg'],
  },
  {
    id: '4',
    category: 'cancel',
    title: 'Live de jeudi annulé',
    body: 'Le live du jeu. 15 oct. à 18:30 est annulé. Prochain live : sam. 17 oct. à 10:30.',
    created_at: days(1),
    read_at: days(1),
    when: 'hier',
    period: 'week',
    action_url: '/compte/planning',
    action_label: 'Voir le planning',
  },
  {
    id: '5',
    category: 'blog',
    title: 'Nouvel article : Bien respirer pour mieux bouger',
    body: '4 min de lecture · conseils d’Alejandra',
    created_at: days(3),
    read_at: days(3),
    when: 'lun.',
    period: 'week',
  },
  {
    id: '6',
    category: 'progress',
    title: 'Séance 4 validée',
    body: 'Bravo ! Prochaine séance mercredi : les bases au sol, partie 2.',
    created_at: days(3),
    read_at: days(3),
    when: 'lun.',
    period: 'week',
  },
  {
    id: '7',
    category: 'community',
    title: 'Ta récompense de parrainage est débloquée',
    body: 'Léa s’est abonnée grâce à toi. Merci !',
    created_at: days(10),
    read_at: days(10),
    when: '9 oct.',
    period: 'earlier',
  },
  {
    id: '8',
    category: 'account',
    title: 'Paiement reçu',
    body: 'Abonnement Visio · 39,00 € · reçu disponible dans ton profil.',
    created_at: days(18),
    read_at: days(18),
    when: '1 oct.',
    period: 'earlier',
  },
];

export const DEMO_NEXT_LIVE: NotifV2NextLive = {
  title: 'Barre/Pilates Flow',
  whenLabel: 'Aujourd’hui · 18:30 – 19:25',
  startTime: '18:30',
  inLabel: 'dans 55 min',
  href: '/compte/planning',
};

export const DEMO_RECEIVE_LINES: NotifV2ReceiveLine[] = [
  { icon: 'radio', label: 'Rappels des lives', detail: 'veille + 1 h avant' },
  { icon: 'route', label: 'Séance du jour', detail: 'L · M · V à 18:00' },
  { icon: 'circle-play', label: 'Nouveautés vidéo', detail: '1×/jour max' },
  { icon: 'mail', label: 'Ta semaine', detail: 'dim. 18:00' },
];
