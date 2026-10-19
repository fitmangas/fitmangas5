export type NotifV2Item = {
  id: string;
  category: 'live' | 'programme' | 'content' | 'cancel' | 'account' | 'community' | 'blog';
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  action_url?: string | null;
  action_label?: string | null;
  thumbs?: string[];
};

export const DEMO_NOTIF_ITEMS: NotifV2Item[] = [
  {
    id: '1',
    category: 'live',
    title: 'Dans 1 heure : Barre/Pilates Flow',
    body: 'Le lien est déjà ouvert. Installe ton tapis, on commence à 18:30.',
    created_at: new Date().toISOString(),
    read_at: null,
    action_url: '/compte/planning',
    action_label: 'Rejoindre le live',
  },
  {
    id: '2',
    category: 'content',
    title: '1 replay et 1 nouvelle vidéo',
    body: 'Replay de Pilates Mat et Pilates Mat avec Rouleau.',
    created_at: new Date(Date.now() - 3600_000).toISOString(),
    read_at: null,
    action_url: '/compte/replays',
    action_label: 'Voir mes vidéos',
    thumbs: ['/email/hero-digest.jpg', '/email/hero-veille.jpg'],
  },
  {
    id: '3',
    category: 'cancel',
    title: 'Live de jeudi annulé',
    body: 'Le live est annulé. Prochain live : samedi 10:30.',
    created_at: new Date(Date.now() - 86400_000).toISOString(),
    read_at: new Date().toISOString(),
    action_url: '/compte/planning',
    action_label: 'Voir le planning',
  },
];
