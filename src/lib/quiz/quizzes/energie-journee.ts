import type { QuizDefinition } from '@/lib/quiz/types';

export const quizEnergieJournee: QuizDefinition = {
  slug: 'energie-journee',
  order: 2,
  accent: '#E8B86D',
  eyebrow: { fr: 'Énergie · 7 questions', es: 'Energía · 7 preguntas' },
  title: {
    fr: 'Ton style d’énergie dans la journée',
    es: 'Tu estilo de energía en el día',
  },
  description: {
    fr: 'Matin, après-midi, crash 15h… Ce n’est pas de la motivation. C’est une carte de ton carburant — pour poser un créneau qui tient.',
    es: 'Mañana, tarde, bajón a las 15h… No es motivación. Es un mapa de tu combustible — para fijar un horario que sostenga.',
  },
  durationHint: { fr: '~2 min', es: '~2 min' },
  cta: { fr: 'Essai 7 jours gratuits ✨', es: 'Prueba 7 días gratis ✨' },
  questions: [
    {
      id: 'q1',
      prompt: {
        fr: 'Sans alarme, ton corps voudrait se lever…',
        es: 'Sin alarma, tu cuerpo querría levantarse…',
      },
      options: [
        { id: 'a', label: { fr: 'Tôt — tu as déjà de l’élan.', es: 'Temprano — ya tienes impulso.' }, scores: { matin: 2 } },
        { id: 'b', label: { fr: 'Milieu de matinée, sans stress.', es: 'Media mañana, sin estrés.' }, scores: { plateau: 2 } },
        { id: 'c', label: { fr: 'Le plus tard possible.', es: 'Lo más tarde posible.' }, scores: { soir: 2 } },
        { id: 'd', label: { fr: 'Ça change chaque jour selon le stress.', es: 'Cambia cada día según el estrés.' }, scores: { crash: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: {
        fr: 'Ton meilleur créneau mental pour un effort…',
        es: 'Tu mejor franja mental para un esfuerzo…',
      },
      options: [
        { id: 'a', label: { fr: 'Avant 10h.', es: 'Antes de las 10h.' }, scores: { matin: 2 } },
        { id: 'b', label: { fr: '11h–14h.', es: '11h–14h.' }, scores: { plateau: 2 } },
        { id: 'c', label: { fr: 'Après 18h.', es: 'Después de las 18h.' }, scores: { soir: 2 } },
        { id: 'd', label: { fr: 'Je ne sais plus : le 15h me détruit.', es: 'Ya no sé: las 15h me destrozan.' }, scores: { crash: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: {
        fr: 'Vers 15h, tu es plutôt…',
        es: 'Hacia las 15h, eres más bien…',
      },
      options: [
        { id: 'a', label: { fr: 'Encore claire — tu peux enchaîner.', es: 'Todavía clara — puedes seguir.' }, scores: { matin: 1, plateau: 1 } },
        { id: 'b', label: { fr: 'Stable, sans pic.', es: 'Estable, sin pico.' }, scores: { plateau: 2 } },
        { id: 'c', label: { fr: 'En train de te réveiller vraiment.', es: 'Empezando a despertar de verdad.' }, scores: { soir: 2 } },
        { id: 'd', label: { fr: 'En mode « écran + café + culpabilité ».', es: 'Modo « pantalla + café + culpa ».' }, scores: { crash: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: {
        fr: 'Quand tu rates ton créneau habituel…',
        es: 'Cuando fallas tu horario habitual…',
      },
      options: [
        { id: 'a', label: { fr: 'Tu le décale au matin suivant.', es: 'Lo mueves a la mañana siguiente.' }, scores: { matin: 2 } },
        { id: 'b', label: { fr: 'Tu trouves une fenêtre dans la journée.', es: 'Encuentras una ventana en el día.' }, scores: { plateau: 2 } },
        { id: 'c', label: { fr: 'Tu te dis « ce soir » — et souvent non.', es: 'Dices « esta noche » — y a menudo no.' }, scores: { soir: 1, crash: 1 } },
        { id: 'd', label: { fr: 'Tu abandonnes la semaine.', es: 'Abandonas la semana.' }, scores: { crash: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: {
        fr: 'Le café / thé, pour toi…',
        es: 'El café / té, para ti…',
      },
      options: [
        { id: 'a', label: { fr: 'Rituel du matin, puis ça roule.', es: 'Ritual de mañana, y sigue.' }, scores: { matin: 2 } },
        { id: 'b', label: { fr: 'Dose régulière pour rester linéaire.', es: 'Dosis regular para mantenerte lineal.' }, scores: { plateau: 2 } },
        { id: 'c', label: { fr: 'Surtout l’après-midi / soir pour tenir.', es: 'Sobre todo tarde / noche para aguantar.' }, scores: { soir: 2 } },
        { id: 'd', label: { fr: 'Béquille anti-crash — sinon tu tombes.', es: 'Muletas anti-bajón — si no, caes.' }, scores: { crash: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: {
        fr: 'Un rendez-vous fixe avec une coach, ça t’aiderait surtout à…',
        es: 'Una cita fija con una coach te ayudaría sobre todo a…',
      },
      options: [
        { id: 'a', label: { fr: 'Protéger ton créneau du matin.', es: 'Proteger tu franja de mañana.' }, scores: { matin: 2 } },
        { id: 'b', label: { fr: 'Ancrer un rythme sans te demander d’être une machine.', es: 'Anclar un ritmo sin pedirte ser una máquina.' }, scores: { plateau: 2 } },
        { id: 'c', label: { fr: 'Te sortir du « ce soir peut-être ».', es: 'Sacarte del « esta noche quizá ».' }, scores: { soir: 2 } },
        { id: 'd', label: { fr: 'Te tenir quand le 15h te vide.', es: 'Sostenerte cuando las 15h te vacían.' }, scores: { crash: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: {
        fr: 'Ce que tu te racontes sur ta « motivation »…',
        es: 'Lo que te cuentas sobre tu « motivación »…',
      },
      options: [
        { id: 'a', label: { fr: 'J’en ai le matin — moins le soir.', es: 'La tengo por la mañana — menos por la noche.' }, scores: { matin: 2 } },
        { id: 'b', label: { fr: 'Elle est stable si mon agenda l’est.', es: 'Es estable si mi agenda lo es.' }, scores: { plateau: 2 } },
        { id: 'c', label: { fr: 'Elle arrive tard — trop tard souvent.', es: 'Llega tarde — a menudo demasiado.' }, scores: { soir: 2 } },
        { id: 'd', label: { fr: 'Elle disparaît avec le crash.', es: 'Desaparece con el bajón.' }, scores: { crash: 2 } },
      ],
    },
  ],
  results: [
    {
      id: 'matin',
      title: { fr: 'Énergie Matinale', es: 'Energía Matutina' },
      tagline: { fr: 'Ton carburant est tôt — protége-le comme un rendez-vous.', es: 'Tu combustible es temprano — protégelo como una cita.' },
      body: {
        fr: [
          'Tu n’as pas un problème de volonté le soir : tu as déjà dépensé ton meilleur carburant.',
          'Les programmes « quand tu peux » te font perdre ce qui marche vraiment chez toi.',
        ],
        es: [
          'No tienes un problema de voluntad por la noche: ya gastaste tu mejor combustible.',
          'Los programas « cuando puedas » te hacen perder lo que de verdad te funciona.',
        ],
      },
      bridge: {
        fr: 'Un créneau fixe le matin (visio), c’est un ancrage — pas de la motivation magique.',
        es: 'Un horario fijo por la mañana (visio) es un ancla — no motivación mágica.',
      },
      shareLine: { fr: 'Mon style d’énergie : Matinale.', es: 'Mi estilo de energía: Matutina.' },
    },
    {
      id: 'plateau',
      title: { fr: 'Énergie Plateau', es: 'Energía Meseta' },
      tagline: { fr: 'Tu tiens sur la régularité — pas sur les pics.', es: 'Te sostienes en la regularidad — no en los picos.' },
      body: {
        fr: [
          'Tu n’as pas besoin d’un « boom » motivationnel. Tu as besoin d’un rythme qui ne te trahit pas.',
          'Seule, tu glisses facilement vers le flou. Avec un cadre, tu es solide.',
        ],
        es: [
          'No necesitas un « boom » motivacional. Necesitas un ritmo que no te traicione.',
          'Sola, te deslizas hacia lo vago. Con un marco, eres sólida.',
        ],
      },
      bridge: {
        fr: 'Le rendez-vous fixe avec correction en direct, c’est ton type d’ancrage.',
        es: 'La cita fija con corrección en directo es tu tipo de ancla.',
      },
      shareLine: { fr: 'Mon style d’énergie : Plateau.', es: 'Mi estilo de energía: Meseta.' },
    },
    {
      id: 'soir',
      title: { fr: 'Énergie Tardive', es: 'Energía Tardía' },
      tagline: { fr: 'Tu t’allumes plus tard — le matin n’est pas ton champ de bataille.', es: 'Te enciendes más tarde — la mañana no es tu campo de batalla.' },
      body: {
        fr: [
          'Te forcer à 7h te fait échouer avant même de commencer.',
          'Le piège : « ce soir » sans rendez-vous devient « jamais ».',
        ],
        es: [
          'Forzarte a las 7h te hace fallar antes de empezar.',
          'La trampa: « esta noche » sin cita se vuelve « nunca ».',
        ],
      },
      bridge: {
        fr: 'Un créneau soir / fin d’après-midi en visio te respecte — et te sort du flou.',
        es: 'Un horario de tarde/noche en visio te respeta — y te saca de lo vago.',
      },
      shareLine: { fr: 'Mon style d’énergie : Tardive.', es: 'Mi estilo de energía: Tardía.' },
    },
    {
      id: 'crash',
      title: { fr: 'Énergie Crash 15h', es: 'Energía Bajón 15h' },
      tagline: { fr: 'Ce n’est pas de la paresse — c’est un système nerveux qui bascule.', es: 'No es pereza — es un sistema nervioso que se vuelca.' },
      body: {
        fr: [
          'Tu te juges sur ta « motivation » alors que tu es en mode survie après le milieu de journée.',
          'Seule, tu choisis souvent l’écran. Avec un rendez-vous, tu choisis le corps.',
        ],
        es: [
          'Te juzgas por tu « motivación » cuando estás en modo supervivencia a media tarde.',
          'Sola, eliges la pantalla. Con una cita, eliges el cuerpo.',
        ],
      },
      bridge: {
        fr: 'Un créneau fixe (et une coach qui te voit) contourne le crash — sans te demander d’être une autre.',
        es: 'Un horario fijo (y una coach que te ve) esquiva el bajón — sin pedirte ser otra.',
      },
      shareLine: { fr: 'Mon style d’énergie : Crash 15h.', es: 'Mi estilo de energía: Bajón 15h.' },
    },
  ],
};
