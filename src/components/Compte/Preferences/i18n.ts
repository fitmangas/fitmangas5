export type PreferencesLang = 'fr' | 'es';

export const preferencesLabels: Record<
  PreferencesLang,
  {
    pageTitle: string;
    pageSubtitle: string;
    notificationsTitle: string;
    categoryCourses: string;
    categoryContent: string;
    categoryShop: string;
    categoryCommunity: string;
    inApp: string;
    email: string;
    essentialsTitle: string;
    essentialsBody: string;
    silenceTitle: string;
    silenceLabel: string;
    silenceBody: string;
    digestTitle: string;
    digestOff: string;
    digestDaily: string;
    digestWeekly: string;
    languageTimezoneTitle: string;
    languageLabel: string;
    languageFr: string;
    languageEs: string;
    timezoneLabel: string;
    timezoneEdit: string;
    timezoneSave: string;
    timezoneCancel: string;
    marketingTitle: string;
    marketingLabel: string;
    marketingBody: string;
    saveSuccess: string;
    saveError: string;
  }
> = {
  fr: {
    pageTitle: 'Mes préférences',
    pageSubtitle: 'Gérez comment et quand FitMangas vous contacte.',
    notificationsTitle: 'Notifications par catégorie',
    categoryCourses: 'Cours',
    categoryContent: 'Contenu (blog, replays)',
    categoryShop: 'Boutique',
    categoryCommunity: 'Communauté',
    inApp: 'In-app',
    email: 'Email',
    essentialsTitle: 'Notifications essentielles',
    essentialsBody:
      'Paiement, sécurité, urgences. Ces messages sont indispensables et ne peuvent pas être désactivés.',
    silenceTitle: 'Mode silence',
    silenceLabel: 'Activer le mode silence',
    silenceBody:
      'Aucune notification non-urgente entre 21h et 8h dans votre fuseau horaire.',
    digestTitle: 'Fréquence des récapitulatifs',
    digestOff: 'Désactivé',
    digestDaily: 'Quotidien',
    digestWeekly: 'Hebdomadaire',
    languageTimezoneTitle: 'Langue et fuseau',
    languageLabel: "Langue d'affichage",
    languageFr: 'Français',
    languageEs: 'Español',
    timezoneLabel: 'Fuseau horaire actuel',
    timezoneEdit: 'Modifier',
    timezoneSave: 'Enregistrer',
    timezoneCancel: 'Annuler',
    marketingTitle: 'Emails marketing',
    marketingLabel: 'Newsletters et offres FitMangas',
    marketingBody:
      'Indépendant des notifications transactionnelles ci-dessus.',
    saveSuccess: '✓ Sauvegardé',
    saveError: 'Erreur — réessayer',
  },
  es: {
    pageTitle: 'Mis preferencias',
    pageSubtitle: 'Gestiona cómo y cuándo FitMangas te contacta.',
    notificationsTitle: 'Notificaciones por categoría',
    categoryCourses: 'Cursos',
    categoryContent: 'Contenido (blog, replays)',
    categoryShop: 'Tienda',
    categoryCommunity: 'Comunidad',
    inApp: 'In-app',
    email: 'Correo',
    essentialsTitle: 'Notificaciones esenciales',
    essentialsBody:
      'Pago, seguridad, urgencias. Estos mensajes son imprescindibles y no se pueden desactivar.',
    silenceTitle: 'Modo silencio',
    silenceLabel: 'Activar el modo silencio',
    silenceBody:
      'Ninguna notificación no urgente entre las 21h y las 8h en tu zona horaria.',
    digestTitle: 'Frecuencia de resúmenes',
    digestOff: 'Desactivado',
    digestDaily: 'Diario',
    digestWeekly: 'Semanal',
    languageTimezoneTitle: 'Idioma y zona horaria',
    languageLabel: 'Idioma de la interfaz',
    languageFr: 'Francés',
    languageEs: 'Español',
    timezoneLabel: 'Zona horaria actual',
    timezoneEdit: 'Modificar',
    timezoneSave: 'Guardar',
    timezoneCancel: 'Cancelar',
    marketingTitle: 'Emails de marketing',
    marketingLabel: 'Boletines y ofertas FitMangas',
    marketingBody:
      'Independiente de las notificaciones transaccionales anteriores.',
    saveSuccess: '✓ Guardado',
    saveError: 'Error — inténtalo de nuevo',
  },
};
