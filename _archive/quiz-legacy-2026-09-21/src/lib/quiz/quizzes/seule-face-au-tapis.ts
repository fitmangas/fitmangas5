import type { QuizDefinition } from '@/lib/quiz/types';

export const quizSeuleFaceAuTapis: QuizDefinition = {
  slug: 'seule-face-au-tapis',
  order: 3,
  accent: '#8B9B7A',
  eyebrow: { fr: 'Mode relationnel · 7 questions', es: 'Modo relacional · 7 preguntas' },
  title: {
    fr: 'Comment tu te comportes seule face au tapis\u00A0?',
    es: '¿Cómo te comportas sola frente al tapete?',
  },
  description: {
    fr: 'Quand personne ne te voit : pourquoi tu tiens… ou tu disparais.',
    es: 'Cuando nadie te ve: por qué te sostienes… o desapareces.',
  },
  durationHint: { fr: '~2 min', es: '~2 min' },
  cta: { fr: 'Tester le cadre 7 jours', es: 'Probar el marco 7 días' },
  questions: [
    {
      id: 'q1',
      prompt: {
        fr: 'Tu déroules le tapis. Personne à la maison. Première pensée…',
        es: 'Desenrollas el tapete. Nadie en casa. Primer pensamiento…',
      },
      options: [
        { id: 'a', label: { fr: '« Allez, je le fais bien. »', es: '« Vamos, lo hago bien. »' }, scores: { securise: 2 } },
        { id: 'b', label: { fr: '« Il faut que je prouve que je tiens. »', es: '« Tengo que demostrar que aguanto. »' }, scores: { anxieux: 2 } },
        { id: 'c', label: { fr: '« Si ça pèse, j’abrège. »', es: '« Si pesa, lo acorto. »' }, scores: { evitant: 2 } },
        { id: 'd', label: { fr: 'Mélange : je veux et je fuis en même temps.', es: 'Mezcla: quiero y huyo a la vez.' }, scores: { desorganise: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: {
        fr: 'Tu rates deux séances d’affilée…',
        es: 'Fallaste dos sesiones seguidas…',
      },
      options: [
        { id: 'a', label: { fr: 'Tu replanifies sans drame.', es: 'Replanificas sin drama.' }, scores: { securise: 2 } },
        { id: 'b', label: { fr: 'Tu te juges fort, puis tu surcompenses.', es: 'Te juzgas mucho y luego sobrecompensas.' }, scores: { anxieux: 2 } },
        { id: 'c', label: { fr: 'Tu ranges le sujet mentalement.', es: 'Guardas el tema mentalmente.' }, scores: { evitant: 2 } },
        { id: 'd', label: { fr: 'Tu oscilles entre « je dois » et « j’arrête tout ».', es: 'Oscilas entre « debo » y « lo dejo todo ».' }, scores: { desorganise: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: {
        fr: 'Une coach te regarde en visio. Tu ressens…',
        es: 'Una coach te mira en visio. Sientes…',
      },
      options: [
        { id: 'a', label: { fr: 'Du soutien — ça t’aide à mieux faire.', es: 'Apoyo — te ayuda a hacerlo mejor.' }, scores: { securise: 2 } },
        { id: 'b', label: { fr: 'De la pression — tu veux être « à la hauteur ».', es: 'Presión — quieres estar « a la altura ».' }, scores: { anxieux: 2 } },
        { id: 'c', label: { fr: 'De l’exposition — tu préférerais être invisible.', es: 'Exposición — preferirías ser invisible.' }, scores: { evitant: 2 } },
        { id: 'd', label: { fr: 'Les deux : soulagement et peur.', es: 'Ambos: alivio y miedo.' }, scores: { desorganise: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: {
        fr: 'Quand tu es fatiguée…',
        es: 'Cuando estás cansada…',
      },
      options: [
        { id: 'a', label: { fr: 'Tu adaptes (plus court) plutôt que tout lâcher.', es: 'Adaptas (más corto) en vez de soltar todo.' }, scores: { securise: 2 } },
        { id: 'b', label: { fr: 'Tu forces quand même — ou tu culpabilises.', es: 'Fuerzas igual — o te culpas.' }, scores: { anxieux: 2 } },
        { id: 'c', label: { fr: 'Tu disparais du sujet jusqu’à te sentir mieux.', es: 'Desapareces del tema hasta sentirte mejor.' }, scores: { evitant: 2 } },
        { id: 'd', label: { fr: 'Tu ne sais plus ce qui est « raisonnable ».', es: 'Ya no sabes qué es « razonable ».' }, scores: { desorganise: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: {
        fr: 'Ce qui te fait vraiment tenir dans le temps…',
        es: 'Lo que de verdad te hace sostener en el tiempo…',
      },
      options: [
        { id: 'a', label: { fr: 'Un cadre clair + un peu de souplesse.', es: 'Un marco claro + un poco de flexibilidad.' }, scores: { securise: 2 } },
        { id: 'b', label: { fr: 'Savoir que quelqu’un remarque ton absence.', es: 'Saber que alguien nota tu ausencia.' }, scores: { anxieux: 2 } },
        { id: 'c', label: { fr: 'Ne pas te sentir jugée ni coincée.', es: 'No sentirte juzgada ni atrapada.' }, scores: { evitant: 2 } },
        { id: 'd', label: { fr: 'Un lien stable qui ne bascule pas trop fort.', es: 'Un vínculo estable que no se vuelque demasiado.' }, scores: { desorganise: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: {
        fr: 'Les vidéos YouTube « gratuites », pour toi…',
        es: 'Los vídeos de YouTube « gratis », para ti…',
      },
      options: [
        { id: 'a', label: { fr: 'Utiles en complément — pas suffisantes seules.', es: 'Útiles de refuerzo — no bastan solas.' }, scores: { securise: 2 } },
        { id: 'b', label: { fr: 'Une pression de plus si tu n’en fais pas.', es: 'Una presión más si no las haces.' }, scores: { anxieux: 2 } },
        { id: 'c', label: { fr: 'Faciles à abandonner sans que personne le sache.', es: 'Fáciles de abandonar sin que nadie lo sepa.' }, scores: { evitant: 2 } },
        { id: 'd', label: { fr: 'Tantôt salvatrice, tantôt trop.', es: 'A veces salvación, a veces demasiado.' }, scores: { desorganise: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: {
        fr: 'Ce que tu cherches vraiment (même si tu dis « du Pilates »)…',
        es: 'Lo que de verdad buscas (aunque digas « Pilates »)…',
      },
      options: [
        { id: 'a', label: { fr: 'Un cadre qui te respecte.', es: 'Un marco que te respete.' }, scores: { securise: 2 } },
        { id: 'b', label: { fr: 'Être vue et rassurée.', es: 'Ser vista y tranquilizada.' }, scores: { anxieux: 2 } },
        { id: 'c', label: { fr: 'Un lien léger — sans trop de pression.', es: 'Un vínculo ligero — sin demasiada presión.' }, scores: { evitant: 2 } },
        { id: 'd', label: { fr: 'Un endroit où tu n’as plus à gérer seule le bascule émotionnel.', es: 'Un lugar donde ya no gestionas sola el vaivén emocional.' }, scores: { desorganise: 2 } },
      ],
    },
  ],
  results: [
    {
      id: 'securise',
      title: { fr: 'Mode Sécure', es: 'Modo Seguro' },
      tagline: { fr: 'Tu tiens mieux avec un cadre clair — pas avec la solitude.', es: 'Te sostienes mejor con un marco claro — no con la soledad.' },
      body: {
        fr: [
          'Tu sais déjà adapter. Ce qui te freine, c’est de tout porter seule trop longtemps.',
          'Un rendez-vous humain te solidifie sans te dramatiser.',
        ],
        es: [
          'Ya sabes adaptar. Lo que te frena es cargar todo sola demasiado tiempo.',
          'Una cita humana te solidifica sin dramatizar.',
        ],
      },
      bridge: {
        fr: 'Essai 7 jours : tester un vrai créneau où tu es vue — pas une vidéo de plus.',
        es: 'Prueba 7 días: un horario real donde te ven — no otro vídeo.',
      },
      shareLine: { fr: 'Mon mode face au tapis : Sécure.', es: 'Mi modo frente al tapete: Seguro.' },
    },
    {
      id: 'anxieux',
      title: { fr: 'Mode Anxieux', es: 'Modo Ansioso' },
      tagline: { fr: 'Tu te mets la pression — surtout quand tu es seule.', es: 'Te pones presión — sobre todo cuando estás sola.' },
      body: {
        fr: [
          'Tu transformes souvent la pratique en preuve. Rate = jugement.',
          'Ce n’est pas un manque de volonté. C’est un système qui s’alarme.',
        ],
        es: [
          'A menudo conviertes la práctica en prueba. Fallar = juicio.',
          'No es falta de voluntad. Es un sistema que se alarma.',
        ],
      },
      bridge: {
        fr: 'Une coach qui te voit sans te juger, ça baisse l’alarme — et ça te fait tenir.',
        es: 'Una coach que te ve sin juzgarte baja la alarma — y te hace sostener.',
      },
      shareLine: { fr: 'Mon mode face au tapis : Anxieux.', es: 'Mi modo frente al tapete: Ansioso.' },
    },
    {
      id: 'evitant',
      title: { fr: 'Mode Évitant', es: 'Modo Evitativo' },
      tagline: { fr: 'Quand ça pèse, tu te retires — pour te protéger.', es: 'Cuando pesa, te retiras — para protegerte.' },
      body: {
        fr: [
          'Tu n’es pas « paresseuse ». Tu prends de la distance quand le cadre devient trop chargé.',
          'Seule, tu disparais facilement. Avec un lien léger mais régulier, tu reviens.',
        ],
        es: [
          'No eres « perezosa ». Tomas distancia cuando el marco se vuelve pesado.',
          'Sola, desapareces fácil. Con un vínculo ligero pero regular, vuelves.',
        ],
      },
      bridge: {
        fr: 'Le rendez-vous fixe, c’est un lien sans harcèlement — exactement ton dosage.',
        es: 'La cita fija es un vínculo sin acoso — justo tu dosis.',
      },
      shareLine: { fr: 'Mon mode face au tapis : Évitant.', es: 'Mi modo frente al tapete: Evitativo.' },
    },
    {
      id: 'desorganise',
      title: { fr: 'Mode Oscillant', es: 'Modo Oscilante' },
      tagline: { fr: 'Tu veux et tu fuis — le solo amplifie le bascule.', es: 'Quieres y huyes — lo solo amplifica el vaivén.' },
      body: {
        fr: [
          'Les semaines « tout » suivies de semaines « rien » ne sont pas un hasard.',
          'Tu as besoin d’un cadre stable qui ne te laisse pas seule avec le yo-yo.',
        ],
        es: [
          'Las semanas « todo » seguidas de « nada » no son casualidad.',
          'Necesitas un marco estable que no te deje sola con el yo-yo.',
        ],
      },
      bridge: {
        fr: 'Être vue chaque semaine, ça calme l’oscillation mieux qu’une énième promesse à toi-même.',
        es: 'Ser vista cada semana calma la oscilación mejor que otra promesa a ti misma.',
      },
      shareLine: { fr: 'Mon mode face au tapis : Oscillant.', es: 'Mi modo frente al tapete: Oscilante.' },
    },
  ],
};
