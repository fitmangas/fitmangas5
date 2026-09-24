/**
 * Contenu stratégique Ads — tiré de docs/STRATEGIE_CROISSANCE.md
 * Pédagogie débutant Kevin.
 */

export type StrategyCampaignBlueprint = {
  id: 'cold_quiz' | 'warm_retarget' | 'hot_trial';
  labelFr: string;
  labelEs: string;
  temperature: 'froid' | 'chaud' | 'brûlant';
  audience: string;
  offer: string;
  objective: string;
  suggestedDailyBudgetEur: number;
  why: string;
};

export const ADS_FUNNEL_STEPS = [
  {
    step: 1,
    title: 'Ad (froid ou warm)',
    detail: 'Elle découvre FitMangas via une pub Meta (IG/FB). Offre à faible friction = quiz gratuit.',
  },
  {
    step: 2,
    title: 'Quiz gratuit',
    detail: 'Aimant unique : aucune salle ne peut le copier. Elle répond → on capture l’e-mail.',
  },
  {
    step: 3,
    title: 'Nurture e-mail',
    detail: 'On répare les fuites AVANT de scaler. 1 relance douce, pas d’empilement canaux.',
  },
  {
    step: 4,
    title: 'Essai 7 jours',
    detail: 'Elle vit un vrai cours avec Alejandra — correction en direct, pas une vidéo seule.',
  },
  {
    step: 5,
    title: '39 € / mois groupe',
    detail: 'Abonnement visio collectif. Promesse : être vue, ne plus lâcher seule.',
  },
] as const;

export const ADS_BEGINNER_GUIDE = [
  {
    title: '1. Réparer le seau avant de payer du trafic',
    body: 'Si le quiz, l’e-mail ou l’essai fuient, chaque euro pub est brûlé. On vérifie d’abord le parcours organique (Conversations + Workflows).',
  },
  {
    title: '2. Un seul canal bien : Meta',
    body: 'Meta (Instagram + Facebook) = canal n°1 lead gen fitness féminin. TikTok / Pinterest / Google = phase 2, quand Meta est rentable.',
  },
  {
    title: '3. Trois campagnes, pas trente',
    body: 'Froid = découverte quiz · Warm = retarget visiteuses/engageuses · Hot = retarget essai non terminé. On mesure CPL et coût/essai.',
  },
  {
    title: '4. Copy = bénéfice / émotion',
    body: 'Pas « 8 cours Pilates ». Oui : « tu n’es plus seule devant l’écran — je te vois, je te corrige ». Compliance santé : pas d’avant/après médicaux.',
  },
  {
    title: '5. Créatives = vraies vidéos',
    body: 'Reels et moments coaching réels > pub léchée. UGC et bibliothèque Alejandra (portraits, visio, mat).',
  },
  {
    title: '6. Budget test, puis scaler',
    body: '~15–30 €/jour pour apprendre. Seules les gagnantes scalent. AUCUNE activation auto : double confirmation du budget dans l’UI.',
  },
] as const;

export const STRATEGY_CAMPAIGN_BLUEPRINTS: StrategyCampaignBlueprint[] = [
  {
    id: 'cold_quiz',
    labelFr: 'Froid — Découverte quiz',
    labelEs: 'Frío — Descubrimiento quiz',
    temperature: 'froid',
    audience: 'Femmes 28–55 FR (puis ES), intérêts Pilates / bien-être / post-partum / bureau — jamais vues FitMangas.',
    offer: 'Quiz de personnalité gratuit → e-mail',
    objective: 'Leads / trafic vers /quiz',
    suggestedDailyBudgetEur: 15,
    why: 'Haut de funnel : aimant quiz. Mesure = CPL (coût par lead e-mail).',
  },
  {
    id: 'warm_retarget',
    labelFr: 'Warm — Retarget visiteuses',
    labelEs: 'Warm — Retarget visitantes',
    temperature: 'chaud',
    audience: 'A visité le site / quiz / IG (engageuses) sans s’inscrire à l’essai.',
    offer: 'Rappel quiz + essai 7j (bénéfice : ne plus être seule)',
    objective: 'Trafic / conversions soft',
    suggestedDailyBudgetEur: 10,
    why: 'Milieu de funnel : elle connaît déjà. Mesure = coût par démarrage essai.',
  },
  {
    id: 'hot_trial',
    labelFr: 'Hot — Essai non terminé',
    labelEs: 'Hot — Prueba incompleta',
    temperature: 'brûlant',
    audience: 'A commencé l’essai / checkout sans finaliser, ou a quitté le parcours paiement.',
    offer: 'Essai 7 jours — « viens vivre un vrai cours avec moi »',
    objective: 'Conversions essai / abonnement',
    suggestedDailyBudgetEur: 8,
    why: 'Bas de funnel d’abord (stratégie). Mesure = CAC (coût d’acquisition payante).',
  },
];

export type ChannelCard = {
  id: AdChannelLike;
  name: string;
  status: 'ready' | 'prepared' | 'off';
  phase: 1 | 2;
  relevance: string;
  toActivate: string;
  note?: string;
};

type AdChannelLike = 'meta' | 'tiktok' | 'pinterest' | 'google';

export const ADS_CHANNEL_CARDS: ChannelCard[] = [
  {
    id: 'meta',
    name: 'Meta Ads (Instagram + Facebook)',
    status: 'ready',
    phase: 1,
    relevance: 'Canal n°1 lead gen fitness féminin. Lead Ads + trafic quiz. Audience FR/ES native.',
    toActivate:
      'App Review Meta (ads_management, ads_read, business_management) + token + Ad Account + META_ADS_ENABLED=1. Voir docs/ADS-SETUP.md.',
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    status: 'prepared',
    phase: 2,
    relevance: 'Audience féminine jeune/wellness ; créatives natives verticales (Reels → Spark Ads).',
    toActivate: 'Compte Business TikTok Ads + pixel / Events API + créatives verticales dédiées.',
    note: 'Recommandé quand Meta est rentabilisé.',
  },
  {
    id: 'pinterest',
    name: 'Pinterest Ads',
    status: 'prepared',
    phase: 2,
    relevance: 'Audience féminine wellness / lifestyle — intention de recherche visuelle.',
    toActivate: 'Compte Pinterest Business + tag + catalogues créatives image.',
    note: 'Recommandé quand Meta est rentabilisé.',
  },
  {
    id: 'google',
    name: 'Google Ads (search de marque)',
    status: 'prepared',
    phase: 2,
    relevance: 'Secondaire : protéger « FitMangas » / « Alejandra Mangas » en search. Pas le premier levier.',
    toActivate: 'Compte Google Ads + conversion essai Stripe + mots-clés marque.',
    note: 'Recommandé quand Meta est rentabilisé.',
  },
];

/** Angles copy prêts à l’emploi (bénéfice / émotion) — compliance santé. */
export const ADS_COPY_ANGLES = [
  {
    id: 'not-alone',
    angle: 'Ne plus être seule',
    copyFr:
      'Tu as déjà essayé seule devant YouTube. Cette fois, je te vois en visio — je te corrige en direct. Quiz gratuit pour commencer 💛',
    copyEs:
      'Ya lo intentaste sola frente a YouTube. Esta vez te veo en visio — te corrijo en directo. Quiz gratis para empezar 💛',
    mediaHint: '/library/coaching-visio/coaching-visio-01.jpg',
    objective: 'cold_quiz' as const,
  },
  {
    id: 'quiz-magnet',
    angle: 'Aimant quiz',
    copyFr:
      'Pas un guide « comment démarrer le Pilates ». Un quiz pour comprendre comment tu tiens — ou pourquoi tu lâches. Gratuit →',
    copyEs:
      'No es una guía « cómo empezar Pilates ». Un quiz para entender cómo te mantienes — o por qué sueltas. Gratis →',
    mediaHint: '/library/portraits/portrait-03.jpg',
    objective: 'cold_quiz' as const,
  },
  {
    id: 'seen-corrected',
    angle: 'Être vue + corrigée',
    copyFr:
      'Ce n’est pas une vidéo de plus. C’est un cours en groupe à horaires fixes : je te corrige, tu n’as plus à t’auto-motiver.',
    copyEs:
      'No es un vídeo más. Es una clase grupal con horarios fijos: te corrijo, ya no tienes que motivarte sola.',
    mediaHint: '/library/pilates-mat/pilates-mat-07.jpg',
    objective: 'warm_retarget' as const,
  },
  {
    id: 'finish-trial',
    angle: 'Essai à terminer',
    copyFr:
      'Tu as commencé — il te reste à vivre un vrai cours avec moi. Essai 7 jours : on se retrouve en visio 💛',
    copyEs:
      'Empezaste — te falta vivir una clase real conmigo. Prueba 7 días: nos vemos en visio 💛',
    mediaHint: '/library/coaching-visio/coaching-visio-04.jpg',
    objective: 'hot_trial' as const,
  },
  {
    id: 'postpartum-energy',
    angle: 'Énergie / post-partum (bénéfice, pas médical)',
    copyFr:
      'Le corps a changé — tu n’as pas besoin d’être « souple » pour commencer. Un créneau fixe, une coach qui te voit. Quiz gratuit.',
    copyEs:
      'El cuerpo cambió — no necesitas ser « flexible » para empezar. Un horario fijo, una coach que te ve. Quiz gratis.',
    mediaHint: '/library/lifestyle-coulisses/lifestyle-01.jpg',
    objective: 'cold_quiz' as const,
    complianceNotes: 'Pas de promesse médicale / périnée « guéri » / avant-après.',
  },
] as const;
