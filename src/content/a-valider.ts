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
} as const;

export const A_VALIDER_LOT5 = {
  faq: {
    fr: [
      { q: 'Je n’ai jamais fait de Pilates, c’est pour moi ?', a: 'Oui. Alejandra adapte chaque exercice pendant le live, et le programme « Les Fondations » t’apprend les bases en 3 semaines.' },
      { q: 'Comment Alejandra peut me corriger à travers un écran ?', a: 'Ta caméra est allumée : elle te voit en direct, t’appelle par ton prénom et te montre le bon placement.' },
      { q: 'Je suis gênée d’être filmée.', a: 'Tu choisis ton cadrage, de côté ou en plan large : l’important, c’est qu’Alejandra voie ta posture pour te corriger. [Caméra / enregistrement : à confirmer après vérif. lot 1.]' },
      { q: 'Je n’ai pas le temps.', a: 'Les lives durent 45 à 60 minutes à heure fixe, et les programmes proposent des séances de 20 minutes.' },
      { q: 'De quel matériel ai-je besoin ?', a: 'Un tapis suffit. Les accessoires (petit ballon, bande) sont indiqués avant chaque cours.' },
      { q: 'Comment j’annule ?', a: 'En ligne, en 3 clics, depuis ton espace. Pendant l’essai, tu ne paies rien.' },
    ],
    es: [
      { q: 'Nunca he hecho Pilates, ¿es para mí?', a: 'Sí. Alejandra adapta cada ejercicio en el live, y el programa « Las bases » te enseña en 3 semanas.' },
      { q: '¿Cómo puede corregirme a través de una pantalla?', a: 'Tu cámara está encendida: te ve en directo, te llama por tu nombre y te muestra el gesto.' },
      { q: 'Me da vergüenza que me filmen.', a: 'Tú eliges el encuadre. Lo importante es que Alejandra vea tu postura. [Cámara / grabación: por confirmar.]' },
      { q: 'No tengo tiempo.', a: 'Los lives duran 45 a 60 minutos a hora fija, y los programas proponen sesiones de 20 minutos.' },
      { q: '¿Qué material necesito?', a: 'Un tapete basta. Los accesorios se indican antes de cada clase.' },
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
    { title: 'Pilates Mat', level: 'Tous niveaux', body: 'Au sol, sur le tapis : le centre, la respiration, la posture.', image: '/Photo%20Alejandra%20exercice%20avec%20anneau.JPG' },
    { title: 'Pilates Accessoires', level: 'Tous niveaux', body: 'Petit ballon, bande, cercle : plus de précision et de tonus.', image: '/Photo%20Alejandra%20exercice%20sur%20la%20plage.JPG' },
    { title: 'Barre / Pilates Flow', level: 'Tous niveaux', body: 'Entre danse et Pilates, debout puis au sol : jambes et fessiers.', image: '/Photo%20Alejandra%20pose%20pour%20photographe.JPG' },
    { title: 'Fit-Dance', level: 'Dynamique', body: 'Du cardio en dansant, sans impact pour les articulations.', image: '/landing/offer-v-coll.jpg' },
    { title: 'Stretching & Yoga Flow', level: 'Doux', body: 'Souplesse et récupération, pour relâcher le dos et les hanches.', image: '/landing/hero.jpg' },
    { title: 'Boot Camp', level: 'Intense', body: 'Renforcement et cardio par intervalles, pour celles qui veulent transpirer.', image: '/landing/offer-v-ind.jpg' },
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
