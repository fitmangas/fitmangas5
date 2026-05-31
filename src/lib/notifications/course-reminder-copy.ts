type ReminderKind = 'visio_j1' | 'visio_h1' | 'presential_j1' | 'presential_h2' | 'visio_missed' | 'presential_missed';

export function courseReminderCopy(
  locale: 'fr' | 'es',
  kind: ReminderKind,
  courseTitle: string,
  courseTime: string,
): { title: string; body: string } {
  if (locale === 'es') {
    switch (kind) {
      case 'visio_j1':
        return {
          title: `Recordatorio: ${courseTitle} mañana a las ${courseTime}`,
          body: 'Tu clase online está prevista mañana.',
        };
      case 'visio_h1':
        return { title: 'Tu clase empieza en 1 h', body: 'Únete a la videollamada.' };
      case 'presential_j1':
        return {
          title: `Recordatorio: sesión mañana a las ${courseTime}`,
          body: 'Dirección: 17 Passage Leroy, 44300 Nantes.',
        };
      case 'presential_h2':
        return { title: 'Tu sesión empieza en 2 h', body: '¡Buen viaje!' };
      case 'visio_missed':
        return {
          title: 'Has faltado a la clase',
          body: 'Aquí tienes el replay en cuanto esté disponible.',
        };
      case 'presential_missed':
        return {
          title: 'Has faltado a tu sesión',
          body: 'Esperamos verte muy pronto.',
        };
    }
  }

  switch (kind) {
    case 'visio_j1':
      return {
        title: `Rappel : ${courseTitle} demain à ${courseTime}`,
        body: 'Votre cours visio est prévu demain.',
      };
    case 'visio_h1':
      return { title: 'Votre cours commence dans 1h', body: 'Rejoindre le cours.' };
    case 'presential_j1':
      return {
        title: `Rappel : séance demain à ${courseTime}`,
        body: 'Adresse : 17 Passage Leroy, 44300 Nantes.',
      };
    case 'presential_h2':
      return { title: 'Votre séance commence dans 2h', body: 'Bon trajet !' };
    case 'visio_missed':
      return {
        title: 'Vous avez manqué le cours',
        body: 'Voici le replay dès qu’il est disponible.',
      };
    case 'presential_missed':
      return {
        title: 'Vous avez manqué votre séance',
        body: 'Nous espérons vous revoir très vite.',
      };
  }
}
