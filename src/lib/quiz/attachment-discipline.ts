import { getPublicTrialSignupUrl } from '@/lib/acquisition/trial-url';

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant';

export type QuizLocale = 'fr' | 'es';

export type QuizOption = {
  id: string;
  label: string;
  scores: Partial<Record<AttachmentStyle, number>>;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
};

export type QuizResultCopy = {
  title: string;
  subtitle: string;
  body: string[];
  bridge: string;
  cta: string;
};

const QUESTIONS_FR: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Quand tu rates un cours prévu avec toi-même…',
    options: [
      {
        id: 'a',
        label: 'Tu te juges fort, puis tu te promets de « rattraper » demain.',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Tu ranges le tapis et tu repousses « à plus tard » sans trop y penser.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Tu notes ce qui s’est passé et tu replanifies un créneau réaliste.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q2',
    prompt: 'Face au tapis, seule à la maison, tu te sens surtout…',
    options: [
      {
        id: 'a',
        label: 'Pressée de bien faire — sinon tu as l’impression d’avoir « raté ».',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Vite saturée : tu commences, puis tu décroches.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Capable de tenir si le créneau est clair et tenu.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q3',
    prompt: 'Quand personne ne te voit pratiquer…',
    options: [
      {
        id: 'a',
        label: 'Tu as besoin de te prouver que tu « tiens le coup ».',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Tu te dis que ce n’est « pas grave » — et les semaines passent.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Tu avances mieux si quelqu’un attend ton rendez-vous.',
        scores: { secure: 1, anxious: 1 },
      },
    ],
  },
  {
    id: 'q4',
    prompt: 'Un jour difficile (fatigue, stress)…',
    options: [
      {
        id: 'a',
        label: 'Tu forces quand même, ou tu culpabilises de ne pas forcer.',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Tu disparais du sujet « sport » jusqu’à te sentir mieux.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Tu adaptes (plus court) plutôt que tout abandonner.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q5',
    prompt: 'Ce qui t’aide vraiment à tenir dans le temps…',
    options: [
      {
        id: 'a',
        label: 'Savoir que quelqu’un remarque si tu n’es pas là.',
        scores: { anxious: 1, secure: 1 },
      },
      {
        id: 'b',
        label: 'Ne pas te sentir jugée — sinon tu te retires.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Un cadre fixe + une correction bienveillante en direct.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q6',
    prompt: 'Si tu imagines un essai 7 jours avec une coach en visio…',
    options: [
      {
        id: 'a',
        label: 'Tu as peur de « ne pas être à la hauteur » — et en même temps tu en as besoin.',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Tu hésites à t’engager : trop de liens = trop de pression.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Tu vois surtout un rendez-vous qui t’empêche d’être seule face au tapis.',
        scores: { secure: 2 },
      },
    ],
  },
];

const QUESTIONS_ES: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Cuando fallas una clase que habías planeado sola…',
    options: [
      {
        id: 'a',
        label: 'Te juzgas mucho y prometes « recuperarlo » mañana.',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Guardas el tapete y lo dejas « para más tarde » sin pensarlo mucho.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Anotas qué pasó y replanificas un horario realista.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q2',
    prompt: 'Frente al tapete, sola en casa, te sientes sobre todo…',
    options: [
      {
        id: 'a',
        label: 'Con prisa por hacerlo bien — si no, sientes que « fallaste ».',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Rápido saturada: empiezas y te desconectas.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Capaz de sostenerlo si el horario es claro.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q3',
    prompt: 'Cuando nadie te ve practicar…',
    options: [
      {
        id: 'a',
        label: 'Necesitas demostrarte que « aguantas ».',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Te dices que « no pasa nada » — y pasan las semanas.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Avanzas mejor si alguien espera tu cita.',
        scores: { secure: 1, anxious: 1 },
      },
    ],
  },
  {
    id: 'q4',
    prompt: 'Un día difícil (cansancio, estrés)…',
    options: [
      {
        id: 'a',
        label: 'Fuerzas igual, o te culpas por no forzar.',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Desapareces del tema « deporte » hasta sentirte mejor.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Adaptas (más corto) en vez de abandonar todo.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q5',
    prompt: 'Lo que de verdad te ayuda a mantenerte…',
    options: [
      {
        id: 'a',
        label: 'Saber que alguien nota si no estás.',
        scores: { anxious: 1, secure: 1 },
      },
      {
        id: 'b',
        label: 'No sentirte juzgada — si no, te retiras.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Un marco fijo + corrección amable en directo.',
        scores: { secure: 2 },
      },
    ],
  },
  {
    id: 'q6',
    prompt: 'Si imaginas una prueba de 7 días con una coach en visio…',
    options: [
      {
        id: 'a',
        label: 'Temes « no estar a la altura » — y a la vez lo necesitas.',
        scores: { anxious: 2 },
      },
      {
        id: 'b',
        label: 'Dudas en comprometerte: demasiado vínculo = demasiada presión.',
        scores: { avoidant: 2 },
      },
      {
        id: 'c',
        label: 'Ves sobre todo una cita que evita estar sola frente al tapete.',
        scores: { secure: 2 },
      },
    ],
  },
];

const RESULTS_FR: Record<AttachmentStyle, QuizResultCopy> = {
  anxious: {
    title: 'Style anxieux face à la discipline',
    subtitle: 'Tu te mets la pression — surtout quand tu es seule.',
    body: [
      'Tu n’as pas un problème de volonté. Tu as un système qui s’alarme dès que tu « rates ».',
      'Seule devant le tapis, tu transformes souvent la pratique en preuve : être à la hauteur, ne pas décevoir, rattraper.',
      'Ce dont tu as besoin : un rendez-vous fixe où quelqu’un te voit — sans te juger — et te corrige en direct.',
    ],
    bridge:
      'Avec moi en visio, tu n’es plus seule à te motiver. Tu viens, je te vois, on avance.',
    cta: 'Essai 7 jours gratuits ✨',
  },
  avoidant: {
    title: 'Style évitant face à la discipline',
    subtitle: 'Quand ça pèse, tu te retires — pour te protéger.',
    body: [
      'Tu n’es pas « paresseuse ». Tu te protèges en prenant de la distance dès que le cadre devient trop chargé.',
      'Seule, tu commences… puis tu disparais. Pas par manque d’envie : pour ne pas te sentir coincée ou jugée.',
      'Ce dont tu as besoin : un lien léger mais régulier — quelqu’un qui t’attend sans te harceler.',
    ],
    bridge:
      'Le rendez-vous fixe avec moi, c’est exactement ça : tu viens, je te corrige, tu n’as plus à tout porter seule.',
    cta: 'Essai 7 jours gratuits ✨',
  },
  secure: {
    title: 'Style plutôt sécure — avec un besoin de cadre',
    subtitle: 'Tu tiens mieux quand le lien est clair.',
    body: [
      'Tu sais déjà adapter et replanifier. Ce qui te freine le plus, ce n’est pas l’exo — c’est de le faire seule trop longtemps.',
      'Un cadre relationnel (rendez-vous + correction) te permet de rester régulière sans te vider.',
      'FitMangas, ce n’est pas « plus de vidéos » : c’est être vue, corrigée, attendue.',
    ],
    bridge:
      'Teste 7 jours avec moi en visio : un vrai créneau, ma correction en direct, et tu n’es plus seule.',
    cta: 'Essai 7 jours gratuits ✨',
  },
};

const RESULTS_ES: Record<AttachmentStyle, QuizResultCopy> = {
  anxious: {
    title: 'Estilo ansioso frente a la disciplina',
    subtitle: 'Te pones presión — sobre todo cuando estás sola.',
    body: [
      'No tienes un problema de voluntad. Tu sistema se alarma en cuanto « fallas ».',
      'Sola frente al tapete, la práctica se vuelve prueba: estar a la altura, no defraudar, recuperar.',
      'Lo que necesitas: una cita fija donde alguien te ve — sin juzgarte — y te corrige en directo.',
    ],
    bridge:
      'Conmigo en visio ya no te motivas sola. Vienes, te veo, avanzamos.',
    cta: 'Prueba 7 días gratis ✨',
  },
  avoidant: {
    title: 'Estilo evitativo frente a la disciplina',
    subtitle: 'Cuando pesa, te retiras — para protegerte.',
    body: [
      'No eres « perezosa ». Te proteges tomando distancia cuando el marco se vuelve pesado.',
      'Sola, empiezas… y desapareces. No por falta de ganas: para no sentirte atrapada o juzgada.',
      'Lo que necesitas: un vínculo ligero pero regular — alguien que te espera sin acosarte.',
    ],
    bridge:
      'La cita fija conmigo es eso: vienes, te corrijo, ya no lo cargas todo sola.',
    cta: 'Prueba 7 días gratis ✨',
  },
  secure: {
    title: 'Estilo más seguro — con necesidad de marco',
    subtitle: 'Sostienes mejor cuando el vínculo es claro.',
    body: [
      'Ya sabes adaptar y replanificar. Lo que más te frena no es el ejercicio — es hacerlo sola demasiado tiempo.',
      'Un marco relacional (cita + corrección) te mantiene constante sin vaciarte.',
      'FitMangas no es « más vídeos »: es ser vista, corregida, esperada.',
    ],
    bridge:
      'Prueba 7 días conmigo en visio: un horario real, corrección en directo, y ya no estás sola.',
    cta: 'Prueba 7 días gratis ✨',
  },
};

export function getAttachmentQuizQuestions(locale: QuizLocale): QuizQuestion[] {
  return locale === 'es' ? QUESTIONS_ES : QUESTIONS_FR;
}

export function getAttachmentQuizResult(
  style: AttachmentStyle,
  locale: QuizLocale,
): QuizResultCopy {
  return (locale === 'es' ? RESULTS_ES : RESULTS_FR)[style];
}

export function scoreAttachmentAnswers(
  questions: QuizQuestion[],
  answers: Record<string, string>,
): AttachmentStyle {
  const totals: Record<AttachmentStyle, number> = {
    secure: 0,
    anxious: 0,
    avoidant: 0,
  };
  for (const q of questions) {
    const optId = answers[q.id];
    const opt = q.options.find((o) => o.id === optId);
    if (!opt) continue;
    for (const [k, v] of Object.entries(opt.scores)) {
      const key = k as AttachmentStyle;
      totals[key] += v ?? 0;
    }
  }
  const ranked = (Object.entries(totals) as Array<[AttachmentStyle, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  return ranked[0]?.[0] ?? 'secure';
}

export function getAttachmentQuizTrialUrl(locale: QuizLocale): string {
  return getPublicTrialSignupUrl({
    courseId: 'v-coll',
    locale,
    utmSource: 'quiz',
    utmCampaign: 'attachment_discipline',
  });
}

export const QUIZ_META = {
  fr: {
    title: 'Ton style d’attachement à la discipline',
    description:
      'Découvre comment tu te traites seule face au tapis — et pourquoi un rendez-vous fixe change tout. Essai 7 jours gratuits.',
    brand: 'FitMangas',
    start: 'Commencer',
    next: 'Suivant',
    back: 'Retour',
    progress: (n: number, total: number) => `Question ${n} / ${total}`,
    resultEyebrow: 'Ton résultat',
  },
  es: {
    title: 'Tu estilo de apego a la disciplina',
    description:
      'Descubre cómo te tratas sola frente al tapete — y por qué una cita fija lo cambia todo. Prueba 7 días gratis.',
    brand: 'FitMangas',
    start: 'Empezar',
    next: 'Siguiente',
    back: 'Volver',
    progress: (n: number, total: number) => `Pregunta ${n} / ${total}`,
    resultEyebrow: 'Tu resultado',
  },
} as const;
