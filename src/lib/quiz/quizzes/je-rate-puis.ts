import type { QuizDefinition } from '@/lib/quiz/types';

export const quizJeRatePuis: QuizDefinition = {
  slug: 'je-rate-puis',
  order: 5,
  accent: '#C45D3E',
  eyebrow: { fr: 'Archétype · 7 questions', es: 'Arquetipo · 7 preguntas' },
  title: {
    fr: 'Que fais-tu juste après avoir raté ?',
    es: '¿Qué haces justo después de fallar?',
  },
  description: {
    fr: 'Culpabilité, disparition, surcompensation… Ce que tu fais après en dit plus que l’échec.',
    es: 'Culpa, desaparición, sobrecompensación… Lo que haces después dice más que el fallo.',
  },
  durationHint: { fr: '~2 min', es: '~2 min' },
  cta: { fr: 'Tester le cadre 7 jours', es: 'Probar el marco 7 días' },
  questions: [
    {
      id: 'q1',
      prompt: {
        fr: 'Tu rates un créneau. Dans les 10 minutes…',
        es: 'Fallaste un horario. En los 10 minutos…',
      },
      options: [
        { id: 'a', label: { fr: 'Tu te parles mal.', es: 'Te hablas mal.' }, scores: { culpa: 2 } },
        { id: 'b', label: { fr: 'Tu ranges le sujet.', es: 'Guardas el tema.' }, scores: { disparition: 2 } },
        { id: 'c', label: { fr: 'Tu te promets une double séance demain.', es: 'Te prometes una sesión doble mañana.' }, scores: { surcomp: 2 } },
        { id: 'd', label: { fr: 'Tu observes — sans t’acharner.', es: 'Observas — sin ensañarte.' }, scores: { cadre: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: {
        fr: 'Le lendemain d’un « raté »…',
        es: 'Al día siguiente de un « fallo »…',
      },
      options: [
        { id: 'a', label: { fr: 'La culpabilité est encore là.', es: 'La culpa sigue ahí.' }, scores: { culpa: 2 } },
        { id: 'b', label: { fr: 'Tu as déjà oublié — ou fait semblant.', es: 'Ya lo olvidaste — o fingiste.' }, scores: { disparition: 2 } },
        { id: 'c', label: { fr: 'Tu surcharges pour « rattraper ».', es: 'Sobrecargas para « recuperar ».' }, scores: { surcomp: 2 } },
        { id: 'd', label: { fr: 'Tu reprends le créneau normal.', es: 'Retomas el horario normal.' }, scores: { cadre: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: {
        fr: 'Si quelqu’un te demande « tu t’y tiens ? »…',
        es: 'Si alguien te pregunta « ¿lo mantienes? »…',
      },
      options: [
        { id: 'a', label: { fr: 'Tu minimises — ou tu t’excuses.', es: 'Minimizas — o te disculpas.' }, scores: { culpa: 2 } },
        { id: 'b', label: { fr: 'Tu changes de sujet.', es: 'Cambias de tema.' }, scores: { disparition: 2 } },
        { id: 'c', label: { fr: 'Tu listes tout ce que tu as « compensé ».', es: 'Listas todo lo que « compensaste ».' }, scores: { surcomp: 2 } },
        { id: 'd', label: { fr: 'Tu dis la vérité sans te démolir.', es: 'Dices la verdad sin demolerte.' }, scores: { cadre: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: {
        fr: 'Les semaines « parfaites » suivies de semaines vides…',
        es: 'Las semanas « perfectas » seguidas de semanas vacías…',
      },
      options: [
        { id: 'a', label: { fr: 'Te confirment que tu es « nulle ».', es: 'Te confirman que eres « inútil ».' }, scores: { culpa: 2 } },
        { id: 'b', label: { fr: 'Arrivent sans que tu comprennes pourquoi.', es: 'Llegan sin que entiendas por qué.' }, scores: { disparition: 2 } },
        { id: 'c', label: { fr: 'Suivent souvent une phase où tu as trop forcé.', es: 'Suelen seguir a una fase en la que forzaste de más.' }, scores: { surcomp: 2 } },
        { id: 'd', label: { fr: 'Te montrent que tu as besoin d’un cadre externe.', es: 'Te muestran que necesitas un marco externo.' }, scores: { cadre: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: {
        fr: 'Ce qui te ferait vraiment du bien après un raté…',
        es: 'Lo que de verdad te haría bien después de fallar…',
      },
      options: [
        { id: 'a', label: { fr: 'Ne pas être jugée — même par toi.', es: 'No ser juzgada — ni por ti.' }, scores: { culpa: 2 } },
        { id: 'b', label: { fr: 'Un rappel doux, pas un silence.', es: 'Un recordatorio suave, no silencio.' }, scores: { disparition: 2 } },
        { id: 'c', label: { fr: 'Une reprise simple — pas un marathon.', es: 'Una retomada simple — no un maratón.' }, scores: { surcomp: 2 } },
        { id: 'd', label: { fr: 'Le prochain rendez-vous déjà posé.', es: 'La próxima cita ya fijada.' }, scores: { cadre: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: {
        fr: 'Les vidéos en libre-service, après un échec…',
        es: 'Los vídeos a demanda, después de un fallo…',
      },
      options: [
        { id: 'a', label: { fr: 'Augmentent la honte (« encore raté »).', es: 'Aumentan la vergüenza (« otra vez fallé »).' }, scores: { culpa: 2 } },
        { id: 'b', label: { fr: 'Disparaissent de ta tête.', es: 'Desaparecen de tu cabeza.' }, scores: { disparition: 2 } },
        { id: 'c', label: { fr: 'Te poussent à enchaîner trop fort.', es: 'Te empujan a encadenar demasiado.' }, scores: { surcomp: 2 } },
        { id: 'd', label: { fr: 'Ne suffisent pas : il manque le rendez-vous.', es: 'No bastan: falta la cita.' }, scores: { cadre: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: {
        fr: 'Un essai 7 jours avec une coach, pour toi, ce serait…',
        es: 'Una prueba de 7 días con una coach, para ti, sería…',
      },
      options: [
        { id: 'a', label: { fr: 'Un espace pour reprendre sans te juger.', es: 'Un espacio para retomar sin juzgarte.' }, scores: { culpa: 2 } },
        { id: 'b', label: { fr: 'Une raison de ne pas disparaître.', es: 'Una razón para no desaparecer.' }, scores: { disparition: 2 } },
        { id: 'c', label: { fr: 'Un frein à la surcompensation.', es: 'Un freno a la sobrecompensación.' }, scores: { surcomp: 2 } },
        { id: 'd', label: { fr: 'Un test de cadre — pas une punition.', es: 'Una prueba de marco — no un castigo.' }, scores: { cadre: 2 } },
      ],
    },
  ],
  results: [
    {
      id: 'culpa',
      title: { fr: 'Archétype Culpabilité', es: 'Arquetipo Culpa' },
      tagline: { fr: 'Tu rates — puis tu te punis.', es: 'Fallas — y luego te castigas.' },
      body: {
        fr: [
          'Le problème n’est pas le créneau manqué. C’est la voix qui suit.',
          'Cette voix te pousse souvent à abandonner encore plus.',
        ],
        es: [
          'El problema no es el horario perdido. Es la voz que sigue.',
          'Esa voz a menudo te empuja a abandonar aún más.',
        ],
      },
      bridge: {
        fr: 'Un cadre bienveillant (être vue, corrigée) coupe la punition. Essaye 7 jours sans te juger.',
        es: 'Un marco amable (ser vista, corregida) corta el castigo. Prueba 7 días sin juzgarte.',
      },
      shareLine: { fr: 'Mon archétype : Je rate puis je me punis.', es: 'Mi arquetipo: Fallo y luego me castigo.' },
    },
    {
      id: 'disparition',
      title: { fr: 'Archétype Disparition', es: 'Arquetipo Desaparición' },
      tagline: { fr: 'Tu rates — puis tu effaces le sujet.', es: 'Fallas — y luego borras el tema.' },
      body: {
        fr: [
          'Ce n’est pas de l’indifférence. C’est une protection.',
          'Sans rendez-vous externe, le silence gagne.',
        ],
        es: [
          'No es indiferencia. Es protección.',
          'Sin cita externa, gana el silencio.',
        ],
      },
      bridge: {
        fr: 'Quelqu’un qui t’attend chaque semaine, ça empêche la disparition — sans te harceler.',
        es: 'Alguien que te espera cada semana evita la desaparición — sin acosarte.',
      },
      shareLine: { fr: 'Mon archétype : Je rate puis je disparais.', es: 'Mi arquetipo: Fallo y luego desaparezco.' },
    },
    {
      id: 'surcomp',
      title: { fr: 'Archétype Surcompensation', es: 'Arquetipo Sobrecompensación' },
      tagline: { fr: 'Tu rates — puis tu forces trop.', es: 'Fallas — y luego fuerzas de más.' },
      body: {
        fr: [
          'Le yo-yo « rien / trop » te fatigue et te fait re-lâcher.',
          'Tu n’as pas besoin de plus d’intensité. Tu as besoin de continuité.',
        ],
        es: [
          'El yo-yo « nada / demasiado » te cansa y te hace soltar otra vez.',
          'No necesitas más intensidad. Necesitas continuidad.',
        ],
      },
      bridge: {
        fr: 'Un créneau fixe calme la surcompensation. Tu viens — point. Pas de marathon de rattrapage.',
        es: 'Un horario fijo calma la sobrecompensación. Vienes — punto. Sin maratón de recuperación.',
      },
      shareLine: { fr: 'Mon archétype : Je rate puis je force trop.', es: 'Mi arquetipo: Fallo y luego fuerzo de más.' },
    },
    {
      id: 'cadre',
      title: { fr: 'Archétype Cadre', es: 'Arquetipo Marco' },
      tagline: { fr: 'Tu rates — et tu sens que le solo ne suffit plus.', es: 'Fallas — y sientes que lo solo ya no basta.' },
      body: {
        fr: [
          'Tu as déjà la lucidité. Ce qui manque, c’est le contenant.',
          'Les vidéos seules ne remplacent pas un rendez-vous.',
        ],
        es: [
          'Ya tienes lucidez. Lo que falta es el contenedor.',
          'Los vídeos solos no reemplazan una cita.',
        ],
      },
      bridge: {
        fr: 'L’essai 7 jours, c’est tester un cadre — pas te prouver quelque chose.',
        es: 'La prueba 7 días es probar un marco — no demostrarte algo.',
      },
      shareLine: { fr: 'Mon archétype : Je rate puis je cherche un cadre.', es: 'Mi arquetipo: Fallo y luego busco un marco.' },
    },
  ],
};
