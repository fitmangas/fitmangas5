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
