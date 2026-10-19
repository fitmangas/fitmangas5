/** Textes CROISSANCE_V2 (croissance-messages.md). Appliqués seulement si le drapeau est on. */

import { lines } from '@/lib/acquisition/copy-bilingual';

export const KW_PRICE =
  "prix|tarif|c'est combien|c’est combien|combien ça coûte|combien ca coute|combien coûte|combien coute|combien par mois|cuánto cuesta|cuanto cuesta|precio|costo|plus d'info|plus d’info|des infos|más info|mas info|price_info|prix / info";

export const KW_HORAIRES =
  "horaire|créneau|creneau|c'est quand|c’est quand|quand sont|quand ont lieu|quand est-ce|schedule|horario|qué días|quels jours|que dias";

export const KW_SOUPLE =
  'pas souple|peu souple|pas très souple|pas tres souple|pas assez souple|manque de souplesse|débutant|debutant|jamais fait|trop raide|no soy flexible|poco flexible|nada flexible|principiante';

export const KW_OPTOUT =
  "stop|désabonne-moi|desabonne-moi|me désabonner|me desabonner|désinscris-moi|desinscris-moi|me désinscrire|me desinscrire|unsubscribe|ne m'écris plus|ne m’écris plus|arrête de m'écrire|arrête de m’écrire|arrete de m'ecrire|arrête les messages|arrete les messages|no me escribas|no más mensajes|no mas mensajes|ya basta|basta ya";

export const KW_GROUP =
  'price_group|visio groupe|visio en groupe|cours en groupe|tarif groupe|prix groupe|visio grupal|clase grupal|clases grupales|clases en grupo|visio colectivo|clase colectiva|clases colectivas';

export const KW_SOLO =
  'price_solo|individuel|individual|cours particulier|clase particular|clases particulares|1:1|juste toi et moi|juste toi & moi|solo tú y yo|solo tu y yo';

export const KW_POSTPARTUM =
  'postpartum|post-partum|périnée|perinee|après bébé|apres bebe|despues del parto|después del parto|suelo pélvico|suelo pelvico';

/** Identifiants des 43 règles — ne jamais en retirer. */
export const CATALOG_IDS = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-00000000000f',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000007',
  '00000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000009',
  '00000000-0000-4000-8000-00000000000a',
  '00000000-0000-4000-8000-00000000000b',
  '00000000-0000-4000-8000-00000000000c',
  '00000000-0000-4000-8000-00000000000d',
  '00000000-0000-4000-8000-00000000000e',
  '00000000-0000-4000-8000-000000000010',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
  '00000000-0000-4000-8000-000000000013',
  '00000000-0000-4000-8000-000000000014',
  '00000000-0000-4000-8000-000000000015',
  '00000000-0000-4000-8000-000000000016',
  '00000000-0000-4000-8000-000000000017',
  '00000000-0000-4000-8000-000000000029',
  '00000000-0000-4000-8000-000000000018',
  '00000000-0000-4000-8000-000000000019',
  '00000000-0000-4000-8000-00000000001a',
  '00000000-0000-4000-8000-00000000001b',
  '00000000-0000-4000-8000-00000000001c',
  '00000000-0000-4000-8000-00000000001d',
  '00000000-0000-4000-8000-00000000001e',
  '00000000-0000-4000-8000-00000000001f',
  '00000000-0000-4000-8000-000000000020',
  '00000000-0000-4000-8000-000000000021',
  '00000000-0000-4000-8000-00000000002a',
  '00000000-0000-4000-8000-000000000022',
  '00000000-0000-4000-8000-000000000023',
  '00000000-0000-4000-8000-000000000024',
  '00000000-0000-4000-8000-000000000025',
  '00000000-0000-4000-8000-000000000026',
  '00000000-0000-4000-8000-000000000027',
  '00000000-0000-4000-8000-000000000028',
  '00000000-0000-4000-8000-00000000002b',
] as const;

export const POSTPARTUM_WORKFLOW_ID = '00000000-0000-4000-8000-00000000000a';
export const NANTES_WORKFLOW_ID = '00000000-0000-4000-8000-000000000007';
export const STORY_WORKFLOW_ID = '00000000-0000-4000-8000-000000000008';

export const KW_BY_ID: Record<string, string> = {
  '00000000-0000-4000-8000-000000000003': KW_PRICE,
  '00000000-0000-4000-8000-00000000000f': KW_PRICE,
  '00000000-0000-4000-8000-000000000012': KW_PRICE,
  '00000000-0000-4000-8000-000000000016': KW_PRICE,
  '00000000-0000-4000-8000-000000000005': KW_SOUPLE,
  '00000000-0000-4000-8000-00000000001a': KW_SOUPLE,
  '00000000-0000-4000-8000-00000000001c': KW_SOUPLE,
  '00000000-0000-4000-8000-000000000006':
    "humaine|vraie personne|parler à alejandra|parler avec alejandra|parler à quelqu'un|parler à quelqu’un|te parler|réserver|inscription|hablar con alejandra|hablar contigo|hablar con alguien|persona real",
  '00000000-0000-4000-8000-000000000007': 'nantes|présentiel|presentiel|sur place',
  '00000000-0000-4000-8000-000000000009':
    'bonjour|hello|hola|salut|hey|coucou|buenas|bonsoir|comment ça va|comment ca va|comment vas',
  '00000000-0000-4000-8000-00000000000a': KW_POSTPARTUM,
  '00000000-0000-4000-8000-00000000000b':
    'matériel|materiel|tapis|équipement|equipement|qué equipo|que equipo|necesito equipo|sin equipo|pas de mat|no tengo mat|no tengo tapete',
  '00000000-0000-4000-8000-00000000000c': KW_HORAIRES,
  '00000000-0000-4000-8000-00000000001d': KW_HORAIRES,
  '00000000-0000-4000-8000-00000000001e': KW_HORAIRES,
  '00000000-0000-4000-8000-00000000000d':
    "lien ?|lien?|lien stp|lien svp|lien please|je veux le lien|envoie le lien|envoie-moi le lien|envoie moi le lien|m'envoyer le lien|m’envoyer le lien|link|el link|el enlace|en dm|par dm|en mp|par mp|mensaje privado|por privado|mándame|mandame",
  '00000000-0000-4000-8000-00000000000e':
    'honte|caméra|camera|cámara|regard des autres|juger|vergüenza|verguenza|miedo|timide',
  '00000000-0000-4000-8000-000000000010': KW_OPTOUT,
  '00000000-0000-4000-8000-000000000018': KW_OPTOUT,
  '00000000-0000-4000-8000-00000000001f': 'lien gratuit|ressource',
  '00000000-0000-4000-8000-000000000020':
    "follow_claim|je m'abonne|je m’abonne|je viens de m'abonner|je viens de m’abonner|je me suis abonnée|je te suis maintenant|ya te sigo|te acabo de seguir",
  '00000000-0000-4000-8000-000000000021': "follow_done|c'est bon ✅|c’est bon ✅|cest bon ✅",
  '00000000-0000-4000-8000-000000000023': KW_GROUP,
  '00000000-0000-4000-8000-000000000025': KW_GROUP,
  '00000000-0000-4000-8000-000000000027': KW_GROUP,
  '00000000-0000-4000-8000-000000000024': KW_SOLO,
  '00000000-0000-4000-8000-000000000026': KW_SOLO,
  '00000000-0000-4000-8000-000000000028': KW_SOLO,
  '00000000-0000-4000-8000-00000000002b':
    'quiz|test de profil|test personalidad|profil discipline|conocimiento de si|conocimiento de sí|connaissance de soi|hub quiz',
};

export function commonA(locale: 'fr' | 'es'): string {
  return locale === 'es'
    ? lines(
        'Gracias por tu mensaje, soy Alejandra 💛',
        'Mis clases en grupo son en línea: te veo y te corrijo en vivo.',
        'Tu prueba de 7 días gratis está justo aquí abajo.',
      )
    : lines(
        'Merci pour ton message, c’est Alejandra 💛',
        'Mes cours en groupe sont en visio : je te vois et je te corrige en direct.',
        'Ton essai 7 jours gratuits est juste en dessous.',
      );
}

export function commonB(locale: 'fr' | 'es'): string {
  return locale === 'es'
    ? lines(
        'Aquí tienes tu acceso 💛',
        'Mis clases en grupo son en línea: te veo y te corrijo en vivo.',
        'Tu prueba de 7 días gratis está justo aquí abajo.',
      )
    : lines(
        'Voici ton accès 💛',
        'Mes cours en groupe sont en visio : je te vois et je te corrige en direct.',
        'Ton essai 7 jours gratuits est juste en dessous.',
      );
}

export function commonC(locale: 'fr' | 'es'): string {
  return locale === 'es'
    ? lines(
        'Hola, soy Alejandra 💛',
        'Doy clases de Pilates y Barre en línea: te veo y te corrijo en vivo.',
        'Dime qué te interesa: la prueba de 7 días gratis, los precios o los horarios.',
      )
    : lines(
        'Bonjour, c’est Alejandra 💛',
        'Je donne des cours de Pilates et de Barre en visio : je te vois et je te corrige en direct.',
        'Dis-moi ce qui t’intéresse : l’essai 7 jours gratuits, les prix ou les horaires.',
      );
}

export function commonD(locale: 'fr' | 'es'): string {
  return locale === 'es'
    ? lines(
        'Te entiendo 💛',
        'Mis clases en grupo tienen horario fijo: solo te conectas y yo te veo y te corrijo en vivo.',
        'Pruébalo con una clase real: tus 7 días gratis están justo aquí abajo.',
      )
    : lines(
        'Je comprends 💛',
        'Mes cours en groupe ont lieu à horaires fixes : tu n’as qu’à venir, je te vois et je te corrige en direct.',
        'Teste un vrai créneau avec l’essai 7 jours gratuits, juste en dessous.',
      );
}

export function commonE(locale: 'fr' | 'es'): string {
  return locale === 'es'
    ? lines(
        'No necesitas ser flexible para empezar 💛',
        'En línea, adapto los ejercicios y te corrijo en vivo.',
        'Tu prueba de 7 días gratis está justo aquí abajo.',
      )
    : lines(
        'Pas besoin d’être souple pour commencer 💛',
        'En visio, j’adapte les exercices et je te corrige en direct.',
        'Ton essai 7 jours gratuits est juste en dessous.',
      );
}

export function commonF(locale: 'fr' | 'es'): string {
  return locale === 'es' ? lines('Entendido 💛', 'Ya no te escribo.') : lines('C’est noté 💛', 'Je ne t’écris plus.');
}

export function storyWarmNoTrial(locale: 'fr' | 'es'): string {
  return locale === 'es'
    ? lines('Gracias por responder a mi historia 💛', 'Me hace muy feliz leerte. Te escribo personalmente.')
    : lines('Merci pour ta réponse à ma story 💛', 'Ça me fait vraiment plaisir. Je te réponds personnellement.');
}

export function nantesPersonal(locale: 'fr' | 'es'): string {
  return locale === 'es'
    ? lines('Gracias por tu mensaje 💛', 'Para las clases en Nantes, te respondo personalmente por aquí.')
    : lines('Merci pour ton message 💛', 'Pour les cours à Nantes, je te réponds personnellement ici.');
}

export function visioHoraires(locale: 'fr' | 'es'): { confirm: string; trialLine: string } {
  if (locale === 'es') {
    return {
      confirm: 'Yo misma te mando por aquí los horarios de las clases en grupo 💛',
      trialLine: 'Y si quieres empezar ya, la prueba de 7 días gratis está justo aquí abajo.',
    };
  }
  return {
    confirm: 'Je t’envoie moi-même les horaires des cours en groupe, ici 💛',
    trialLine: 'Et si tu veux commencer sans attendre, l’essai 7 jours gratuits est juste en dessous.',
  };
}

export const UNIQUE_BODY_BY_ID: Record<string, { fr: string; es: string; appendTrialLink: boolean }> = {
  '00000000-0000-4000-8000-000000000001': {
    appendTrialLink: true,
    fr: lines(
      'Merci pour ton commentaire 💛',
      'Ici, tu n’es pas seule devant une vidéo : en visio, je te vois et je te corrige en direct.',
      'Ton essai 7 jours gratuits est juste en dessous.',
    ),
    es: lines(
      'Gracias por tu comentario 💛',
      'Aquí no estás sola frente a un video: en línea, te veo y te corrijo en vivo.',
      'Tu prueba de 7 días gratis está justo aquí abajo.',
    ),
  },
  '00000000-0000-4000-8000-000000000006': {
    appendTrialLink: true,
    fr: lines(
      'Bien reçu 💛 Je te réponds personnellement dès que je suis disponible.',
      'En attendant, ton essai 7 jours gratuits est juste en dessous.',
    ),
    es: lines(
      'Recibido 💛 Te respondo personalmente en cuanto esté disponible.',
      'Mientras tanto, tu prueba de 7 días gratis está justo aquí abajo.',
    ),
  },
  '00000000-0000-4000-8000-000000000008': {
    appendTrialLink: true,
    fr: lines(
      'Merci pour ta réponse à ma story 💛',
      'Si tu as envie d’essayer mes cours en visio, l’essai 7 jours est gratuit.',
      'Tout est juste en dessous.',
    ),
    es: lines(
      'Gracias por responder a mi historia 💛',
      'Si te dan ganas de probar mis clases en línea, la prueba de 7 días es gratis.',
      'Todo está justo aquí abajo.',
    ),
  },
  '00000000-0000-4000-8000-00000000000a': {
    appendTrialLink: false,
    fr: lines(
      'Merci pour ton commentaire 💛',
      'Je préfère te répondre personnellement : je reviens vers toi ici, en privé.',
    ),
    es: lines(
      'Gracias por tu comentario 💛',
      'Prefiero responderte personalmente: yo misma te escribo por aquí, en privado.',
    ),
  },
  '00000000-0000-4000-8000-00000000000b': {
    appendTrialLink: true,
    fr: lines(
      'Un tapis suffit pour commencer 💛',
      'Pas besoin d’équipement : ce qui compte, c’est le cours avec moi et ma correction en direct.',
      'Ton essai 7 jours gratuits est juste en dessous.',
    ),
    es: lines(
      'Con un tapete es suficiente para empezar 💛',
      'No necesitas equipo: lo importante es la clase conmigo y mi corrección en vivo.',
      'Tu prueba de 7 días gratis está justo aquí abajo.',
    ),
  },
  '00000000-0000-4000-8000-00000000000d': {
    appendTrialLink: true,
    fr: lines(
      'Je t’envoie ça en privé 💛',
      'Mes cours en groupe sont en visio : je te vois et je te corrige en direct.',
      'Ton essai 7 jours gratuits est juste en dessous.',
    ),
    es: lines(
      'Te lo mando por privado 💛',
      'Mis clases en grupo son en línea: te veo y te corrijo en vivo.',
      'Tu prueba de 7 días gratis está justo aquí abajo.',
    ),
  },
  '00000000-0000-4000-8000-00000000000e': {
    appendTrialLink: true,
    fr: lines(
      'Pas besoin d’être à l’aise dès le premier cours 💛',
      'Je te vois pour te corriger, pas pour te juger.',
      'Ton essai 7 jours gratuits est juste en dessous.',
    ),
    es: lines(
      'No tienes que sentirte cómoda desde la primera clase 💛',
      'Te veo para corregirte, no para juzgarte.',
      'Tu prueba de 7 días gratis está justo aquí abajo.',
    ),
  },
  '00000000-0000-4000-8000-00000000001f': {
    appendTrialLink: true,
    fr: lines(
      'Merci pour ton commentaire 💛',
      'Je t’envoie le lien de l’essai 7 jours gratuits ici, que tu me suives ou non.',
      'Et si tu veux me suivre, abonne-toi puis clique sur le bouton.',
    ),
    es: lines(
      'Gracias por tu comentario 💛',
      'Te mando aquí el enlace de la prueba de 7 días gratis, me sigas o no.',
      'Y si quieres seguirme, dale seguir a mi cuenta y toca el botón.',
    ),
  },
  '00000000-0000-4000-8000-00000000002b': {
    appendTrialLink: false,
    fr: lines(
      'Voici mes quiz de profil 💛',
      'Quelques questions pour comprendre ce qui t’aide à tenir dans ta pratique.',
      'Choisis le tien ici : https://fitmangas.com/quiz',
    ),
    es: lines(
      'Aquí tienes mis tests de perfil 💛',
      'Unas preguntas para entender qué te ayuda a mantener tu práctica.',
      'Elige el tuyo aquí: https://fitmangas.com/es/quiz',
    ),
  },
};

export const SHARED_BODY_KIND: Record<string, 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'price' | 'solo'> = {
  '00000000-0000-4000-8000-000000000011': 'A',
  '00000000-0000-4000-8000-000000000015': 'A',
  '00000000-0000-4000-8000-00000000002a': 'B',
  '00000000-0000-4000-8000-000000000009': 'C',
  '00000000-0000-4000-8000-000000000014': 'C',
  '00000000-0000-4000-8000-000000000029': 'C',
  '00000000-0000-4000-8000-000000000004': 'D',
  '00000000-0000-4000-8000-000000000019': 'D',
  '00000000-0000-4000-8000-00000000001b': 'D',
  '00000000-0000-4000-8000-000000000005': 'E',
  '00000000-0000-4000-8000-00000000001a': 'E',
  '00000000-0000-4000-8000-00000000001c': 'E',
  '00000000-0000-4000-8000-000000000010': 'F',
  '00000000-0000-4000-8000-000000000018': 'F',
  '00000000-0000-4000-8000-000000000003': 'price',
  '00000000-0000-4000-8000-00000000000f': 'price',
  '00000000-0000-4000-8000-000000000012': 'price',
  '00000000-0000-4000-8000-000000000016': 'price',
  '00000000-0000-4000-8000-000000000022': 'price',
  '00000000-0000-4000-8000-000000000023': 'price',
  '00000000-0000-4000-8000-000000000025': 'price',
  '00000000-0000-4000-8000-000000000027': 'price',
  '00000000-0000-4000-8000-000000000024': 'solo',
  '00000000-0000-4000-8000-000000000026': 'solo',
  '00000000-0000-4000-8000-000000000028': 'solo',
};

export function isStoryEmojiOrEmotional(text: string | undefined): boolean {
  const raw = (text ?? '').trim();
  if (!raw) return true;
  const withoutEmoji = raw
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\p{Emoji_Presentation}/gu, '')
    .replace(/[\u200d\ufe0f]/g, '')
    .trim();
  if (!withoutEmoji) return true;
  if (raw.length > 48) return false;
  return /j['’]?adore|trop bien|magnifique|belle story|love|me encanta|hermosa|gracias|merci|😍|❤️|❤|🙏|😭|🔥/.test(
    raw.toLowerCase(),
  );
}
