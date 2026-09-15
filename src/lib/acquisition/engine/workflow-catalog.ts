import type { AcqWorkflow } from '@/lib/acquisition/types';

/**
 * Catalogue workflows Acquisition.
 *
 * Copie = Dunford (rendez-vous / correction / être vue) + Hormozi
 * (valeur claire + inversion du risque 7j) + mécanique ManyChat
 * (mot-clé commentaire → DM privé).
 *
 * 1 bulle par workflow. Lien essai via appendTrialLink.
 */
export const WORKFLOW_CATALOG: AcqWorkflow[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Commentaire IG « ESSAI » → DM privé + lien',
    enabled: true,
    triggerType: 'ig_comment_keyword',
    triggerConfig: { keyword: 'essai|prueba|trial|7 jours|7 dias' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Merci pour ton « ESSAI » 💛',
            '',
            'Tu viens de demander exactement ce qu’on propose :',
            'un rendez-vous fixe en visio,',
            'Alejandra qui te corrige en direct,',
            'et le fait d’être vraiment vue — pas seule devant une vidéo.',
            '',
            '7 jours gratuits pour tester.',
            'La carte n’est demandée qu’à la fin — seulement si tu continues.',
            '',
            'Je t’ouvre l’accès ici :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'commentaire_essai' } },
      { type: 'set_lifecycle_stage', config: { stage: 'trial' } },
      { type: 'schedule_followup', config: { delayHours: 24, actionType: 'send_trial_link' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Nouveau DM → concierge (qualifier + répondre)',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: {},
    conditions: {},
    actions: [
      { type: 'qualify_intent' },
      { type: 'tag_contact', config: { tag: 'dm_entrant' } },
      { type: 'schedule_followup', config: { delayHours: 48, actionType: 'send_trial_link' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Commentaire « INFO » / « PRIX » → positionnement + essai',
    enabled: true,
    triggerType: 'ig_comment_keyword',
    triggerConfig: { keyword: 'info|prix|tarif|combien|cuesta|precio|costo' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Tu as raison de demander 💛',
            '',
            'Tu ne paies pas « du Pilates YouTube ».',
            'Tu paies un créneau déjà posé dans ta semaine,',
            'la correction en direct,',
            'et le fait d’être accompagnée.',
            '',
            'Le plus simple pour juger : 7 jours gratuits.',
            'Carte seulement à la fin — si tu continues.',
            '',
            'Voici le lien :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'commentaire_prix' } },
      { type: 'set_lifecycle_stage', config: { stage: 'qualified' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Objection « pas le temps » (DM) → ancrage rendez-vous',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'temps|busy|occup|horaire|pas le temps|no tengo tiempo|agenda' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Justement 💛',
            '',
            'Le produit n’est pas « trouver 1h toute seule ».',
            'C’est un rendez-vous déjà posé —',
            'tu viens, Alejandra te voit, tu n’as pas à t’auto-motiver.',
            '',
            'Teste 7 jours gratuits sur un vrai créneau.',
            'Carte seulement à la fin si tu restes.',
            '',
            'Lien :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'objection_temps' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Objection « je ne suis pas souple » (DM)',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'souple|débutante|debutante|jamais fait|trop raide|flexible|principiante' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Tu n’as pas besoin d’être souple pour commencer 💛',
            '',
            'La plupart des Mangitas arrivent exactement comme toi.',
            'En visio, Alejandra adapte et corrige en direct —',
            'tu n’es pas jugée, tu es accompagnée.',
            '',
            '7 jours gratuits pour voir par toi-même.',
            'Carte seulement à la fin si tu continues.',
            '',
            'Je t’ouvre l’essai ici :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'objection_souplesse' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Lead chaud (qualified/trial) → escalade Alejandra',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'alejandra|humaine|parler à|coach|réserver|inscription|hablar con' },
    conditions: { lifecycle_in: ['qualified', 'trial', 'paid'] },
    actions: [
      { type: 'escalate_human' },
      {
        type: 'send_message',
        config: {
          body: [
            'Je te passe Alejandra 💛',
            '',
            'Elle te répond dès qu’elle est dispo.',
            'En attendant, tu peux déjà regarder les créneaux via l’essai :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    name: 'DM « Nantes / présentiel » → intention booking',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'nantes|présentiel|presentiel|sur place|studio' },
    conditions: {},
    actions: [
      { type: 'book_session_intent', config: { courseType: 'nantes_presentiel' } },
      { type: 'tag_contact', config: { tag: 'interet_nantes' } },
      { type: 'set_lifecycle_stage', config: { stage: 'qualified' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000008',
    name: 'Réponse story IG → accueil + essai',
    enabled: true,
    triggerType: 'ig_story_reply',
    triggerConfig: {},
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Merci pour ta réponse à la story 💛',
            '',
            'FitMangas, ce n’est pas du solo YouTube :',
            'rendez-vous fixe + correction en direct + être vue.',
            '',
            'Tu veux tester 7 jours gratuits ?',
            'Carte seulement à la fin si tu continues.',
            '',
            'Lien :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'story_reply' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000009',
    name: 'Salut / Bonjour / Hola (DM) → accueil + essai',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'bonjour|hello|hola|salut|hey|coucou|buenas|bonsoir' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Bonjour 💛 Contente de te lire.',
            '',
            'Tu cherches un vrai suivi —',
            'pas encore une vidéo à faire seule devant ton écran ?',
            '',
            'Chez FitMangas :',
            '• un rendez-vous fixe en visio',
            '• Alejandra qui te corrige en direct',
            '• le fait d’être vue (tu n’es plus seule)',
            '',
            'Essai 7 jours gratuits.',
            'La carte n’est demandée qu’à la fin — seulement si tu continues.',
            '',
            'Je t’ouvre l’accès ici :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'dm_salutation' } },
      { type: 'set_lifecycle_stage', config: { stage: 'qualified' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-00000000000a',
    name: 'Commentaire post-partum / périnée → DM privé',
    enabled: true,
    triggerType: 'ig_comment_keyword',
    triggerConfig: { keyword: 'postpartum|post-partum|périnée|perinee|après bébé|despues del parto|suelo pélvico' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Merci pour ton message 💛',
            '',
            'Beaucoup de Mangitas sont passées par là.',
            'En visio, Alejandra adapte et te corrige en direct —',
            'tu n’es pas seule à gérer ça.',
            '',
            '7 jours gratuits pour tester sans pression.',
            'Carte seulement à la fin si tu restes.',
            '',
            'Lien :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'commentaire_postpartum' } },
      { type: 'set_lifecycle_stage', config: { stage: 'qualified' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-00000000000b',
    name: 'Objection matériel / chez soi (DM)',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'matériel|materiel|tapis|équipement|equipo|no tengo|pas de mat' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Un tapis suffit pour commencer 💛',
            '',
            'Pas besoin d’un studio à la maison.',
            'L’important : le rendez-vous fixe + la correction en direct.',
            '',
            '7 jours gratuits pour voir si ça te convient.',
            'Carte seulement à la fin si tu continues.',
            '',
            'Lien :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'objection_materiel' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-00000000000c',
    name: 'DM « horaires / créneaux » → booking visio',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'horaire|créneau|creneau|quand|schedule|horario|qué días|quels jours' },
    conditions: {},
    actions: [
      { type: 'book_session_intent', config: { courseType: 'visio_collectif' } },
      { type: 'tag_contact', config: { tag: 'demande_horaires' } },
      { type: 'set_lifecycle_stage', config: { stage: 'qualified' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-00000000000d',
    name: 'Commentaire « lien / DM » → private reply essai',
    enabled: true,
    triggerType: 'ig_comment_keyword',
    triggerConfig: { keyword: 'lien|link|dm|mp|mensaje|envoie|manda' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Je t’envoie ça en privé 💛',
            '',
            'FitMangas = rendez-vous fixe + correction en direct.',
            'Tu n’es plus seule devant ton tapis.',
            '',
            'Essai 7 jours gratuits — carte seulement à la fin si tu continues.',
            '',
            'Lien :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'commentaire_lien' } },
    ],
  },
  {
    id: '00000000-0000-4000-8000-00000000000e',
    name: 'DM « honte / caméra » → rassurer + essai',
    enabled: true,
    triggerType: 'ig_dm_inbound',
    triggerConfig: { keyword: 'honte|caméra|camera|regard|juger|vergüenza|miedo|timide' },
    conditions: {},
    actions: [
      {
        type: 'send_message',
        config: {
          body: [
            'Tu n’es pas obligée d’être « à l’aise » dès le jour 1 💛',
            '',
            'Alejandra te voit pour te corriger — pas pour te juger.',
            'Beaucoup de Mangitas ont démarré exactement comme toi.',
            '',
            '7 jours gratuits pour tester en douceur.',
            'Carte seulement à la fin si tu restes.',
            '',
            'Lien :',
          ].join('\n'),
          appendTrialLink: true,
        },
      },
      { type: 'tag_contact', config: { tag: 'objection_honte' } },
    ],
  },
];

export const WORKFLOW_CATALOG_COUNT = WORKFLOW_CATALOG.length;

/** Mot-clé composé (a|b|c) → true si le texte matche l’une des parties. */
export function textMatchesKeyword(text: string | undefined, keywordRaw: unknown): boolean {
  if (!text) return false;
  const kw = typeof keywordRaw === 'string' ? keywordRaw.trim().toLowerCase() : '';
  if (!kw) return true;
  const hay = text.toLowerCase();
  const parts = kw.split('|').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return true;
  return parts.some((p) => hay.includes(p));
}
