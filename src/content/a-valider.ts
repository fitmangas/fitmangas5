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
