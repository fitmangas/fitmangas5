/**
 * Phrases-clés, impact pratique Pilates/collectif, micro-recommandations.
 * Banque déterministe FR/ES — indépendante des items IPIP/ECR.
 */

import type { BilingualText, BigFiveTraitKey, Level } from './big-five-traits';
import type { SelfTestLang } from '../types';

/** Phrase courte à côté du % (ex. « plutôt réservée »). */
export const TRAIT_BAND_PHRASE: Record<BigFiveTraitKey, Record<Level, BilingualText>> = {
  E: {
    low: { fr: 'plutôt réservée', es: 'más bien reservada' },
    mid: { fr: 'équilibre solo / groupe', es: 'equilibrio sola / grupo' },
    high: { fr: 'portée par le collectif', es: 'impulsada por el colectivo' },
  },
  A: {
    low: { fr: 'directe et claire', es: 'directa y clara' },
    mid: { fr: 'coopérative sans te perdre', es: 'cooperativa sin perderte' },
    high: { fr: 'très à l’écoute', es: 'muy atenta a las demás' },
  },
  C: {
    low: { fr: 'besoin de souplesse', es: 'necesita flexibilidad' },
    mid: { fr: 'régulière avec souplesse', es: 'regular con flexibilidad' },
    high: { fr: 'cadré et fidèle', es: 'con marco y fiel' },
  },
  ES: {
    low: { fr: 'sensible au stress', es: 'sensible al estrés' },
    mid: { fr: 'stable au quotidien', es: 'estable en lo cotidiano' },
    high: { fr: 'calme sous pression', es: 'calmada bajo presión' },
  },
  O: {
    low: { fr: 'aime le connu', es: 'prefiere lo conocido' },
    mid: { fr: 'ouverte avec ancrage', es: 'abierta con anclaje' },
    high: { fr: 'curieuse et exploratrice', es: 'curiosa y exploradora' },
  },
};

export const ATTACHMENT_BAND_PHRASE = {
  anxiety: {
    low: { fr: 'peu d’inquiétude relationnelle', es: 'poca inquietud relacional' },
    mid: { fr: 'vigilance modérée', es: 'vigilancia moderada' },
    high: { fr: 'besoin de réassurance', es: 'necesidad de reaseguro' },
  },
  avoidance: {
    low: { fr: 'à l’aise dans le lien', es: 'cómoda en el vínculo' },
    mid: { fr: 'lien avec distance saine', es: 'vínculo con distancia sana' },
    high: { fr: 'garde une distance', es: 'mantiene distancia' },
  },
} as const;

/** Ce que ça change pour la pratique — par trait × bande. */
export const TRAIT_PRACTICE_IMPACT: Record<BigFiveTraitKey, Record<Level, BilingualText>> = {
  E: {
    low: {
      fr: 'Un cours collectif à horaires fixes te donne un rituel sans te forcer à « performer » socialement : tu es vue, sans être au centre.',
      es: 'Un curso colectivo a horarios fijos te da un ritual sin obligarte a « performar » socialmente: te ven, sin ponerte en el centro.',
    },
    mid: {
      fr: 'Tu tiens mieux quand tu peux doser le contact : la visio te laisse ouvrir la caméra les jours où tu as besoin du groupe.',
      es: 'Sostienes mejor cuando puedes dosificar el contacto: la visio te deja abrir la cámara los días en que necesitas al grupo.',
    },
    high: {
      fr: 'Le collectif te recharge : un créneau live régulier transforme ta motivation en rendez-vous, pas en effort solo.',
      es: 'El colectivo te recarga: un horario live regular convierte tu motivación en cita, no en esfuerzo en solitario.',
    },
  },
  A: {
    low: {
      fr: 'Tu progresses avec des consignes nettes : la correction en direct te convient mieux qu’une vidéo générique sans regard.',
      es: 'Progresas con consignas claras: la corrección en directo te va mejor que un vídeo genérico sin mirada.',
    },
    mid: {
      fr: 'Tu avances bien dans un cadre bienveillant mais exigeant — exactement le ton d’un cours collectif coaché.',
      es: 'Avanzas bien en un marco amable pero exigente — exactamente el tono de un curso colectivo con coach.',
    },
    high: {
      fr: 'Attention à ne pas « laisser ta place » : un créneau où on te voit t’aide à prendre aussi soin de toi.',
      es: 'Cuidado con « ceder tu sitio »: un horario donde te ven te ayuda a cuidarte también a ti.',
    },
  },
  C: {
    low: {
      fr: 'Sans date dans l’agenda, tu improvises — et tu lâches. Un horaire fixe remplace la volonté par le rendez-vous.',
      es: 'Sin fecha en la agenda, improvisas — y sueltas. Un horario fijo sustituye la voluntad por la cita.',
    },
    mid: {
      fr: 'Tu tiens quand le cadre est clair sans être rigide : 2–3 créneaux/semaine suffisent à ancrer la pratique.',
      es: 'Sostienes cuando el marco es claro sin ser rígido: 2–3 horarios/semana bastan para anclar la práctica.',
    },
    high: {
      fr: 'Tu honorés ce que tu as promis : un abonnement avec créneaux collectifs te donne un contrat avec toi-même.',
      es: 'Cumples lo que prometes: una suscripción con horarios colectivos te da un contrato contigo misma.',
    },
  },
  ES: {
    low: {
      fr: 'Le stress te fait décrocher si tu restes seule face au tapis. Être vue en live calme le système nerveux plus qu’une app.',
      es: 'El estrés te hace abandonar si te quedas sola frente al tapete. Ser vista en live calma el sistema nervioso más que una app.',
    },
    mid: {
      fr: 'Tu gères mieux les hauts et bas avec une routine prévisible : même heure, même coach, même groupe.',
      es: 'Gestionas mejor los altibajos con una rutina predecible: misma hora, misma coach, mismo grupo.',
    },
    high: {
      fr: 'Tu restes stable — le collectif te sert à progresser et à partager, pas seulement à te « tenir ».',
      es: 'Te mantienes estable — el colectivo te sirve para progresar y compartir, no solo para « aguantar ».',
    },
  },
  O: {
    low: {
      fr: 'Tu aimes les formats familiers : une progression claire de cours (mat / barre) te rassure plus que le « surprise workout ».',
      es: 'Te gustan los formatos familiares: una progresión clara de clases (mat / barra) te tranquiliza más que el « surprise workout ».',
    },
    mid: {
      fr: 'Tu apprécies varier un peu sans perdre le fil : alterner Pilates et barre dans le même cadre collectif te convient.',
      es: 'Aprecias variar un poco sin perder el hilo: alternar Pilates y barra en el mismo marco colectivo te conviene.',
    },
    high: {
      fr: 'Tu as besoin de nouveauté dans un cadre sûr : le live te donne des variations sous le regard d’une coach.',
      es: 'Necesitas novedad en un marco seguro: el live te da variaciones bajo la mirada de una coach.',
    },
  },
};

export const ATTACHMENT_PRACTICE_IMPACT = {
  'secure-ish': {
    fr: 'Tu crées du lien facilement : un groupe régulier te nourrit sans te saturer — garde le créneau comme un rendez-vous avec toi.',
    es: 'Creas vínculo con facilidad: un grupo regular te nutre sin saturarte — guarda el horario como una cita contigo.',
  },
  anxious: {
    fr: 'Tu as besoin d’être vue pour te rassurer : la correction en direct et le même créneau chaque semaine calment l’inquiétude mieux que YouTube.',
    es: 'Necesitas ser vista para tranquilizarte: la corrección en directo y el mismo horario cada semana calman la inquietud mejor que YouTube.',
  },
  avoidant: {
    fr: 'Tu gardes une distance : la visio te laisse participer sans te forcer à l’intimité physique d’une salle — tout en restant dans un collectif.',
    es: 'Mantienes distancia: la visio te deja participar sin forzar la intimidad física de una sala — y sigues en un colectivo.',
  },
  fearful: {
    fr: 'Tu veux du lien et tu le crains : un cadre prévisible (horaire fixe, coach connue) réduit le « tout ou rien » face au tapis.',
    es: 'Quieres vínculo y lo temes: un marco predecible (horario fijo, coach conocida) reduce el « todo o nada » frente al tapete.',
  },
} as const;

export type MicroRecoId =
  | 'collective-fixed'
  | 'camera-ok'
  | 'gentle-start'
  | 'seen-live'
  | 'variety-safe'
  | 'attachment-reassure'
  | 'attachment-distance'
  | 'balanced-polyvalent';

const MICRO_RECO_COPY: Record<MicroRecoId, BilingualText> = {
  'collective-fixed': {
    fr: 'Ton format idéal : cours collectif à horaires fixes — le rendez-vous remplace la motivation solo.',
    es: 'Tu formato ideal: curso colectivo a horarios fijos — la cita sustituye la motivación en solitario.',
  },
  'camera-ok': {
    fr: 'Ton format idéal : live avec caméra quand tu en as besoin — le groupe te porte sans t’obliger chaque jour.',
    es: 'Tu formato ideal: live con cámara cuando la necesitas — el grupo te impulsa sin obligarte cada día.',
  },
  'gentle-start': {
    fr: 'Ton format idéal : 2 créneaux/semaine d’abord, même horaire — ancre avant d’augmenter.',
    es: 'Tu formato ideal: 2 horarios/semana primero, misma hora — ancla antes de aumentar.',
  },
  'seen-live': {
    fr: 'Ton format idéal : correction en direct — être vue calme plus qu’une séance solo.',
    es: 'Tu formato ideal: corrección en directo — ser vista calma más que una sesión en solitario.',
  },
  'variety-safe': {
    fr: 'Ton format idéal : Pilates + barre dans le même cadre collectif — nouveauté sans perdre le fil.',
    es: 'Tu formato ideal: Pilates + barra en el mismo marco colectivo — novedad sin perder el hilo.',
  },
  'attachment-reassure': {
    fr: 'Ton format idéal : le même créneau et la même coach chaque semaine — la prévisibilité te sécurise.',
    es: 'Tu formato ideal: el mismo horario y la misma coach cada semana — la previsibilidad te asegura.',
  },
  'attachment-distance': {
    fr: 'Ton format idéal : visio collective — du lien sans saturation sociale.',
    es: 'Tu formato ideal: visio colectiva — vínculo sin saturación social.',
  },
  'balanced-polyvalent': {
    fr: 'Ton format idéal : cadre collectif stable — ta polyvalence s’exprime mieux avec un ancrage extérieur.',
    es: 'Tu formato ideal: marco colectivo estable — tu polivalencia se expresa mejor con un anclaje exterior.',
  },
};

export function pickBigFiveMicroReco(
  bands: Record<BigFiveTraitKey, Level>,
  balanced: boolean,
): MicroRecoId {
  if (balanced) return 'balanced-polyvalent';
  if (bands.ES === 'low') return 'seen-live';
  if (bands.C === 'low') return 'gentle-start';
  if (bands.C === 'high') return 'collective-fixed';
  if (bands.E === 'high') return 'camera-ok';
  if (bands.O === 'high') return 'variety-safe';
  return 'collective-fixed';
}

export function pickAttachmentMicroReco(styleId: string): MicroRecoId {
  if (styleId === 'anxious' || styleId === 'fearful') return 'attachment-reassure';
  if (styleId === 'avoidant') return 'attachment-distance';
  return 'collective-fixed';
}

export function microRecoText(id: MicroRecoId, lang: SelfTestLang): string {
  return MICRO_RECO_COPY[id][lang];
}

export function assemblePracticeImpactBlock(
  bands: Record<BigFiveTraitKey, Level>,
  lang: SelfTestLang,
  max = 3,
): string[] {
  const order: BigFiveTraitKey[] = ['C', 'ES', 'E', 'A', 'O'];
  const salient = order.filter((k) => bands[k] !== 'mid').slice(0, max);
  const keys = salient.length ? salient : (['C', 'E'] as BigFiveTraitKey[]);
  return keys.map((k) => TRAIT_PRACTICE_IMPACT[k][bands[k]][lang]);
}

export function bandWord(lang: SelfTestLang, band: Level): string {
  if (lang === 'es') {
    if (band === 'high') return 'elevado';
    if (band === 'low') return 'bajo';
    return 'moderado';
  }
  if (band === 'high') return 'élevé';
  if (band === 'low') return 'bas';
  return 'modéré';
}
