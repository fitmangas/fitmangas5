/**
 * À VALIDER — textes nouveaux sans maquette (SPEC §0, règle 5).
 * Tous les textes écrits pendant le chantier d’octobre 2026 qui ne viennent pas mot pour mot
 * d’une maquette sont regroupés ici, par lot, pour relecture par Kevin et Alejandra.
 * Ne pas disperser de texte nouveau dans le code : l’importer depuis ce fichier.
 */

export const A_VALIDER_LOT1 = {
  cookies: {
    manage: { fr: 'Gérer mes cookies', es: 'Gestionar mis cookies' },
  },
  errors: {
    generic: { fr: 'Une erreur est survenue. Réessaie dans un instant.', es: 'Ocurrió un error. Inténtalo de nuevo en un momento.' },
    pdf: { fr: 'La génération du PDF a échoué. Réessaie dans un instant.', es: 'No se pudo generar el PDF. Inténtalo de nuevo en un momento.' },
    payment: {
      fr: 'Le paiement est momentanément indisponible. Réessaie dans un instant.',
      es: 'El pago no está disponible por ahora. Inténtalo de nuevo en un momento.',
    },
    reminder: { fr: 'Envoi du rappel impossible pour le moment.', es: 'No se pudo enviar el recordatorio por ahora.' },
  },
  antiBot: {
    turnstile: {
      fr: 'Vérification anti-robot échouée. Recharge la page et réessaie.',
      es: 'La verificación anti-robot falló. Recarga la página e inténtalo de nuevo.',
    },
    limited: { fr: 'Trop de tentatives. Réessaie dans un moment.', es: 'Demasiados intentos. Inténtalo de nuevo en un rato.' },
  },
} as const;

export const A_VALIDER_LOT2 = {
  liveJoinHint: {
    fr: 'Le lien est déjà ouvert, connecte-toi 10 minutes avant.',
    es: 'El enlace ya está abierto, conéctate 10 minutos antes.',
  },
  liveEveSubject: {
    fr: (time: string, title: string) => `Demain ${time} : ${title} avec Alejandra`,
    es: (time: string, title: string) => `Mañana ${time}: ${title} con Alejandra`,
  },
  liveEvePreview: {
    fr: 'Ton tapis, une bouteille d’eau, et c’est parti.',
    es: 'Tu tapete, una botella de agua, y listo.',
  },
  liveOneHourSubject: {
    fr: (title: string) => `Dans 1 heure : ${title}`,
    es: (title: string) => `En 1 hora: ${title}`,
  },
  liveOneHourSoonSubject: {
    fr: (mins: number, title: string) => `Dans ${mins} min : ${title}`,
    es: (mins: number, title: string) => `En ${mins} min: ${title}`,
  },
  liveCancelledSubject: {
    fr: (when: string) => `Le live de ${when} est annulé`,
    es: (when: string) => `El live de ${when} está cancelado`,
  },
  liveCancelledLastMinute: {
    fr: 'Annulation de dernière minute',
    es: 'Cancelación de último minuto',
  },
  liveScheduleChanged: {
    fr: 'L’horaire du live a changé',
    es: 'El horario del live cambió',
  },
  replayMissingAdmin: {
    fr: (title: string) => `Replay manquant : ${title}`,
    es: (title: string) => `Replay faltante: ${title}`,
  },
  cronLag: {
    fr: (job: string) => `Tâche planifiée en retard : ${job}`,
    es: (job: string) => `Tarea programada retrasada: ${job}`,
  },
  repeatWeekly: {
    fr: 'Répéter chaque semaine jusqu’au',
    es: 'Repetir cada semana hasta el',
  },
  liveStyleHint: {
    fr: 'Style : Pilates, Barre, Fit-Dance, Boot Camp, Stretching, Booty — le type de cours ci-dessus sert de style.',
    es: 'Estilo: Pilates, Barre, Fit-Dance, Boot Camp, Stretching, Booty — el tipo de curso de arriba sirve de estilo.',
  },
} as const;

export const A_VALIDER_LOT3 = {
  flagOff: {
    fr: 'Les programmes guidés ne sont pas encore ouverts.',
    es: 'Los programas guiados aún no están abiertos.',
  },
  visioRequired: {
    fr: 'Les programmes sont réservés aux abonnées visio.',
    es: 'Los programas están reservados a las abonadas de visio.',
  },
  notOwner: {
    fr: 'Cette inscription ne t’appartient pas.',
    es: 'Esta inscripción no te pertenece.',
  },
  tablesMissing: {
    fr: 'Tables programmes non créées (migration Lot 3 en attente de GO).',
    es: 'Tablas de programas no creadas (migración Lote 3 pendiente de GO).',
  },
  importApplyRefuse: {
    fr: 'L’import réel (--apply) est réservé à Kevin après GO écrit.',
    es: 'La importación real (--apply) está reservada a Kevin después del GO escrito.',
  },
  pickDay: {
    fr: 'Choisis au moins un jour.',
    es: 'Elige al menos un día.',
  },
  badTime: {
    fr: 'Indique une heure au format 18:30.',
    es: 'Indica una hora con el formato 18:30.',
  },
  /** D08 — test de niveau : raisons affichées avec le résultat et textes des clientes déjà abonnées. */
  levelTest: {
    goalReason: {
      douceur: { fr: 'Parce que tu veux te (re)mettre au sport en douceur', es: 'Porque quieres empezar o retomar el deporte con calma' },
      tonifier: { fr: 'Parce que tu veux tonifier et sculpter', es: 'Porque quieres tonificar y esculpir' },
      dos: { fr: 'Parce que tu veux soulager ton dos et ta posture', es: 'Porque quieres aliviar tu espalda y tu postura' },
      cardio: { fr: 'Parce que tu veux faire du cardio en t’amusant', es: 'Porque quieres hacer cardio divirtiéndote' },
      souplesse: { fr: 'Parce que tu veux gagner en souplesse', es: 'Porque quieres ganar flexibilidad' },
    },
    xpReason: {
      lt6: { fr: 'Parce que tu débutes : on pose les bases d’abord', es: 'Porque empiezas: primero ponemos las bases' },
      '6to24': { fr: 'Parce que tu as déjà les bases : on monte d’un cran', es: 'Porque ya tienes las bases: subimos un nivel' },
      gt24: { fr: 'Parce que tu pratiques depuis longtemps : place au défi', es: 'Porque practicas desde hace tiempo: llegó el reto' },
    },
    partialHint: {
      fr: 'Tu as 20 minutes ? Fais une partie de la séance : c’est déjà très bien, et tu reprends la suite la fois d’après.',
      es: '¿Tienes 20 minutos? Haz una parte de la sesión: ya está muy bien, y sigues la próxima vez.',
    },
    memberStart: { fr: 'Démarrer ce programme', es: 'Empezar este programa' },
    memberAll: { fr: 'Voir tous les programmes', es: 'Ver todos los programas' },
    visitorOffers: { fr: 'Voir les offres', es: 'Ver las ofertas' },
  },
  /** Relance douce (aucune séance depuis 4 jours, au plus une fois par semaine) : notification et email. */
  nudge: {
    subject: { fr: 'On t’attend, sans pression', es: 'Te esperamos, sin presión' },
    headline: { fr: 'On reprend en douceur ?', es: '¿Retomamos con calma?' },
    body: {
      fr: 'Quelques jours sans séance, ça arrive à tout le monde. Ta prochaine séance t’attend là où tu l’as laissée : quelques minutes suffisent pour reprendre le fil.',
      es: 'Unos días sin sesión le pasan a todo el mundo. Tu próxima sesión te espera donde la dejaste: unos minutos bastan para retomar.',
    },
    button: { fr: 'Reprendre ma séance', es: 'Retomar mi sesión' },
    pause: {
      fr: 'Besoin d’une vraie pause ? Mets ton programme en pause dans « Mes réglages » : tu le reprendras quand tu veux.',
      es: '¿Necesitas una pausa de verdad? Pon tu programa en pausa en « Mis ajustes »: lo retomarás cuando quieras.',
    },
    inApp: { fr: 'On reprend en douceur ? Ta prochaine séance t’attend.', es: '¿Retomamos con calma? Tu próxima sesión te espera.' },
  },
  /** B01 — carte conseil du niveau « Je me dépasse » (citation d'exemple de la maquette : à valider ou réécrire par Alejandra). */
  catalogAdvice: {
    before: { fr: 'Termine un programme ', es: 'Termina un programa ' },
    highlight: { fr: 'Je progresse', es: 'Progreso' },
    after: { fr: ' avant de te lancer ici. Ton dos te dira merci.', es: ' antes de lanzarte aquí. Tu espalda te lo agradecerá.' },
    note: { fr: 'Rien n’est bloqué : c’est un conseil, pas une règle.', es: 'Nada está bloqueado: es un consejo, no una regla.' },
  },
} as const;

export const A_VALIDER_LOT5 = {
  /**
   * FAQ de l'accueil (D05) — textes à faire valider par Alejandra.
   * `aProgrammes` : variante utilisée seulement quand les programmes sont en ligne (drapeau allumé).
   * `aVerifier` : note interne (jamais affichée) — rien n'est promis sur l'image avant la vérification
   * Jitsi / enregistrement (SPEC §7.12).
   */
  faq: {
    fr: [
      {
        q: 'Je n’ai jamais fait de Pilates, c’est pour moi ?',
        a: 'Oui. Alejandra adapte chaque exercice pendant le live et te montre les bases pas à pas. Les replays te permettent de revoir les mouvements à ton rythme.',
        aProgrammes: 'Oui. Alejandra adapte chaque exercice pendant le live, et le programme « Les Fondations du Pilates » t’apprend les bases en 3 semaines.',
      },
      { q: 'Comment Alejandra peut me corriger à travers un écran ?', a: 'Ta caméra est allumée : elle te voit en direct, t’appelle par ton prénom et te montre le bon placement.' },
      {
        q: 'Je suis gênée d’être filmée.',
        a: 'Tu choisis ton cadrage, de côté ou en plan large : l’important, c’est qu’Alejandra voie ta posture pour te corriger.',
        aVerifier: 'Caméra / enregistrement : à confirmer après la vérification du lot 1 (les élèves se voient-elles entre elles ? l’enregistrement des replays les filme-t-il ?).',
      },
      {
        q: 'Je n’ai pas le temps.',
        a: 'Les lives durent 45 à 60 minutes à heure fixe. Tu en rates un ? Le replay t’attend, et tu le fais quand tu peux.',
        aProgrammes: 'Les lives durent 45 à 60 minutes à heure fixe, et les programmes proposent aussi des séances courtes, dès 20 minutes.',
      },
      { q: 'De quel matériel ai-je besoin ?', a: 'Un tapis suffit. Les accessoires (petit ballon, bande) sont indiqués avant chaque cours.' },
      { q: 'Comment j’annule ?', a: 'En ligne, en 3 clics, depuis ton espace. Pendant l’essai, tu ne paies rien.' },
    ],
    es: [
      {
        q: 'Nunca he hecho Pilates, ¿es para mí?',
        a: 'Sí. Alejandra adapta cada ejercicio en el live y te enseña las bases paso a paso. Con los replays repasas los movimientos a tu ritmo.',
        aProgrammes: 'Sí. Alejandra adapta cada ejercicio en el live, y el programa « Los Fundamentos del Pilates » te enseña las bases en 3 semanas.',
      },
      { q: '¿Cómo puede corregirme a través de una pantalla?', a: 'Tu cámara está encendida: te ve en directo, te llama por tu nombre y te muestra el gesto.' },
      {
        q: 'Me da vergüenza que me filmen.',
        a: 'Tú eliges el encuadre, de lado o en plano amplio: lo importante es que Alejandra vea tu postura para corregirte.',
        aVerifier: 'Cámara / grabación: por confirmar tras la verificación del lote 1.',
      },
      {
        q: 'No tengo tiempo.',
        a: 'Los lives duran de 45 a 60 minutos a hora fija. ¿Te perdiste uno? El replay te espera y lo haces cuando puedas.',
        aProgrammes: 'Los lives duran de 45 a 60 minutos a hora fija, y los programas proponen también sesiones cortas, desde 20 minutos.',
      },
      { q: '¿Qué material necesito?', a: 'Un tapete basta. Los accesorios (pelota pequeña, banda) se indican antes de cada clase.' },
      { q: '¿Cómo cancelo?', a: 'En línea, en 3 clics, desde tu espacio. Durante la prueba no pagas nada.' },
    ],
  },
  liveAdvice: {
    fr: 'Pose ton téléphone ou ton ordinateur à 2–3 mètres, à hauteur de hanches : je te vois en entier et je peux te corriger.',
    es: 'Pon el teléfono o el ordenador a 2–3 metros, a la altura de las caderas: te veo entera y puedo corregirte.',
  },
  followupWa: {
    payment_failed: { fr: 'Bonjour, c’est Alejandra. Ton paiement FitMangas n’est pas passé. Tu peux me dire si tu as besoin d’un coup de main ?', es: 'Hola, soy Alejandra. Tu pago de FitMangas no pasó. ¿Te ayudo?' },
    trial_ending: { fr: 'Bonjour, c’est Alejandra. Ton essai se termine bientôt. Tu as une question avant de décider ?', es: 'Hola, soy Alejandra. Tu prueba termina pronto. ¿Tienes alguna pregunta?' },
    incomplete: { fr: 'Bonjour, c’est Alejandra. Tu as commencé ton inscription FitMangas. Tu veux que je t’aide à la terminer ?', es: 'Hola, soy Alejandra. Empezaste tu inscripción. ¿Te ayudo a terminarla?' },
    inactive: { fr: 'Bonjour, c’est Alejandra. Ça fait un moment que je ne t’ai pas vue en live. Tout va bien ?', es: 'Hola, soy Alejandra. Hace tiempo que no te veo en vivo. ¿Todo bien?' },
    cancelled: { fr: 'Bonjour, c’est Alejandra. Tu as quitté FitMangas récemment. Si tu veux en parler, je suis là.', es: 'Hola, soy Alejandra. Dejaste FitMangas hace poco. Si quieres hablar, aquí estoy.' },
  },
  followupMailSubject: {
    fr: 'FitMangas — un mot d’Alejandra',
    es: 'FitMangas — un mensaje de Alejandra',
  },
  courseStyles: [
    { title: 'Pilates Mat', level: 'Tous niveaux', body: 'Au sol, sur le tapis : le centre, la respiration, la posture.', image: '/cours/style-pilates-mat.jpg' },
    { title: 'Pilates Accessoires', level: 'Tous niveaux', body: 'Petit ballon, bande, cercle : plus de précision et de tonus.', image: '/cours/style-pilates-accessoires.jpg' },
    { title: 'Barre / Pilates Flow', level: 'Tous niveaux', body: 'Entre danse et Pilates, debout puis au sol : jambes et fessiers.', image: '/cours/style-barre-flow.jpg' },
    { title: 'Fit-Dance', level: 'Dynamique', body: 'Du cardio en dansant, sans impact pour les articulations.', image: '/cours/style-fit-dance.jpg' },
    { title: 'Stretching & Yoga Flow', level: 'Doux', body: 'Souplesse et récupération, pour relâcher le dos et les hanches.', image: '/cours/style-stretching.jpg' },
    { title: 'Boot Camp', level: 'Intense', body: 'Renforcement et cardio par intervalles, pour celles qui veulent transpirer.', image: '/cours/style-boot-camp.jpg' },
  ],
  liveRundown: {
    kicker: 'Comment se passe un live',
    title: 'Elle te voit, elle te corrige',
    intro: 'Depuis chez toi, sur ordinateur ou téléphone : Alejandra te voit et te corrige en direct, comme en studio.',
    steps: [
      { title: 'Tu ouvres le lien 10 min avant', body: 'Depuis ton espace, sur ordinateur ou téléphone.' },
      { title: 'Tu allumes ta caméra', body: 'Ton micro est coupé à l’entrée. Place ton écran à 2–3 m, à hauteur de hanches.' },
      { title: 'Alejandra te corrige en direct', body: 'Par ton prénom. Et si tu rates le live, le replay arrive dans ton espace.' },
    ],
  },
} as const;

export const A_VALIDER_LOT7 = {
  includeTests: { fr: 'Inclure les tests', es: 'Incluir las pruebas' },
  teamAccounts: { fr: 'Comptes de l’équipe (à ignorer dans les compteurs)', es: 'Cuentas del equipo (ignoradas en los contadores)' },
  showTests: { fr: 'Afficher les tests', es: 'Mostrar las pruebas' },
  testLabel: { fr: 'Test', es: 'Prueba' },
  teamLabel: { fr: 'Équipe', es: 'Equipo' },
  vendorLabel: { fr: 'Prestataire', es: 'Proveedor' },
  engineList: { fr: 'Liste', es: 'Lista' },
  engineDetail: { fr: 'Voir le détail', es: 'Ver detalle' },
  toFilm: { fr: 'À filmer', es: 'Por filmar' },
  duplicateCaption: {
    fr: 'Cette légende ressemble à plus de 80 % à un post des 60 derniers jours.',
    es: 'Este pie se parece en más del 80 % a una publicación de los últimos 60 días.',
  },
  scheduleAnyway: { fr: 'Programmer quand même', es: 'Programar de todos modos' },
  stuckSince: { fr: 'Bloqué depuis le', es: 'Bloqueado desde el' },
  retryPublish: { fr: 'Réessayer', es: 'Reintentar' },
  backToDraft: { fr: 'Remettre en brouillon', es: 'Volver a borrador' },
  unsourced160: { fr: '160 € en studio — à sourcer', es: '160 € en estudio — por confirmar' },
  beforeFirstEuro: { fr: 'Avant le premier euro', es: 'Antes del primer euro' },
  received: { fr: 'reçu', es: 'recibido' },
  notReceived: { fr: 'pas encore reçu', es: 'aún no recibido' },
  videoTestimonial: {
    fr: 'Témoignage vidéo d’une élève : ce que je ressens après 3 semaines',
    es: 'Testimonio en video de una alumna: lo que siento después de 3 semanas',
  },
  healthHooksPositive: [
    {
      was: 'À 15h ton dos te lâche ?',
      now: 'À 15h, un créneau de 45 min avec moi — je te vois et je te corrige.',
    },
    {
      was: 'Ton périnée n’est plus le même après bébé.',
      now: 'Après bébé, tu n’as pas à chercher seule : je te réponds personnellement.',
    },
    {
      was: 'La ménopause casse ta récupération.',
      now: 'Un cours à horaire fixe, pour tenir sans te juger.',
    },
  ],
  intents: {
    thinkingFr:
      'Bien sûr 💛\nPrends le temps qu’il te faut. Si tu veux, je t’écris un petit rappel d’ici demain — sinon dis-le-moi.',
    thinkingEs:
      'Por supuesto 💛\nTómate el tiempo que necesites. Si quieres, te escribo un recordatorio a más tardar mañana — si no, dímelo.',
    priceFr:
      'Avec plaisir 💛\nVisio en groupe : 39 €/mois pour 8 cours live (2 par semaine).\nReplays illimités et bibliothèque de vidéos inclus.\nEssai 7 jours gratuits : carte à l’inscription, prélèvement après l’essai.',
    priceEs:
      'Con gusto 💛\nClases en grupo en línea: 39 € al mes por 8 clases en vivo (2 por semana).\nIncluye replays ilimitados y biblioteca de videos.\nPrueba 7 días gratis: tarjeta al registrarte, cobro después de la prueba.',
    scheduleFr:
      'Les horaires des cours en groupe sont sur le planning 💛\nDis-moi ce qui t’arrange, ou démarre l’essai 7 jours gratuits pour choisir ton premier cours.',
    scheduleEs:
      'Los horarios de las clases en grupo están en el planning 💛\nDime qué te acomoda, o empieza la prueba de 7 días gratis y elige tu primera clase.',
    replayFr:
      'Si tu rates un live, le replay reste dans ton espace 💛\nEn live, je te vois et je te corrige.',
    replayEs:
      'Si te pierdes un live, el replay queda en tu espacio 💛\nEn vivo, te veo y te corrijo.',
    howFr:
      'Tu t’inscris, tu rejoins le live à l’heure, je te vois et je te corrige 💛\nSi tu rates, tu as le replay.',
    howEs:
      'Te inscribes, entras al live a la hora, te veo y te corrijo 💛\nSi faltas, tienes el replay.',
    trialFr:
      'Oui : essai 7 jours gratuits 💛\nCours en groupe en visio, je te vois et je te corrige. Le lien est juste en dessous.',
    trialEs:
      'Sí: prueba de 7 días gratis 💛\nClases en grupo en línea, te veo y te corrijo. El enlace está justo aquí abajo.',
    supportFr:
      'Je suis là pour t’aider 💛\nDis-moi ce que tu vois à l’écran. Pour le compte, le replay ou le paiement, tu peux aussi écrire via le support.',
    supportEs:
      'Estoy aquí para ayudarte 💛\nDime qué ves en pantalla. Para la cuenta, el replay o el pago, también puedes escribir por el soporte.',
    warmFr: 'Merci, vraiment 💛\nÇa me touche. Je suis là.',
    warmEs: 'Gracias, de verdad 💛\nMe alegra leerte. Aquí estoy.',
    offtopicFr: 'Merci 💛\nBelle journée à toi.',
    offtopicEs: 'Gracias 💛\nQue tengas un lindo día.',
    nudgeFr: 'Petit mot 💛\nJuste le rappel dont on avait parlé. Si tu préfères que je n’écrive plus, dis-le-moi.',
    nudgeEs: 'Un mensajito 💛\nSolo el recordatorio del que hablamos. Si prefieres que no te escriba más, dímelo.',
  },
  conciergeStyleBlock: `Style : tu écris comme Alejandra, à la première personne, en tutoyant (marché mx : espagnol du Mexique neutre, « tú »).
2 à 5 lignes courtes, 300 caractères maximum, une seule action, 0 ou 1 émoji (💛). Pas de flèches, pas de majuscules.
Faits autorisés, rien d’autre : Visio en groupe 39 €/mois = 8 cours live par mois (2 par semaine), replays illimités, bibliothèque de vidéos ; Visio individuelle 269 €/mois = 5 cours individuels + accès aux 8 cours en groupe ; essai 7 jours gratuits, carte demandée à l’inscription, prélèvement après l’essai ; je vois et je corrige en direct.
Aucune supposition ni aucun conseil de santé. Post-partum, périnée, douleur : réponds seulement que tu répondras personnellement.
Présentiel / Nantes : aucun cours réservable sur le site. Réponds « Je te réponds personnellement ici pour les cours à Nantes », sans lien.
Ne demande jamais de s’abonner au compte pour donner une info ou l’essai.`,
} as const;

export const A_VALIDER_LOT4 = {
  flagOff: {
    fr: 'Les cartes cadeaux ne sont pas encore ouvertes.',
    es: 'Las tarjetas regalo aún no están abiertas.',
  },
  stripeTestOnly: {
    fr: 'Paiement carte cadeau : Stripe test, ou production après GO.',
    es: 'Pago de tarjeta regalo: Stripe test, o producción después del GO.',
  },
} as const;
