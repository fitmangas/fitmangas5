import { opt, q } from '@/lib/quiz/build';
import type { QuizDefinition } from '@/lib/quiz/types';

export const quizEnergieJournee: QuizDefinition = {
  slug: 'energie-journee',
  order: 2,
  accent: '#C9A227',
  eyebrow: { fr: 'Évaluation · 8 situations', es: 'Evaluación · 8 situaciones' },
  title: {
    fr: 'Ton style d’énergie dans la journée',
    es: 'Tu estilo de energía en el día',
  },
  description: {
    fr: 'Pas « tu te lèves tôt donc profil 1 ». Une carte de carburant : où tu décides encore, où tu négocies, où le système nerveux coupe. Rapport + PDF à la fin.',
    es: 'No es « te levantas temprano luego perfil 1 ». Un mapa de combustible: dónde aún decides, dónde negocias, dónde el sistema nervioso corta. Informe + PDF al final.',
  },
  durationHint: { fr: '~4 min', es: '~4 min' },
  cta: { fr: 'Tester le cadre 7 jours', es: 'Probar el marco 7 días' },
  questions: [
    q(
      'q1',
      'On te demande de poser un créneau qui tiendra 8 semaines. Ton vrai critère…',
      'Te piden fijar un horario que aguante 8 semanas. Tu criterio de verdad…',
      [
        opt('a', 'Le poser tôt, avant que la journée (et les autres) te prennent.', 'Ponerlo temprano, antes de que el día (y los demás) te tomen.', { matin: 2 }),
        opt('b', 'Le même créneau, milieu de journée, sans pic ni héroïsme.', 'El mismo horario, a media jornada, sin pico ni heroicidad.', { plateau: 2 }),
        opt('c', 'Après le travail — c’est là que tu as encore de l’air.', 'Después del trabajo — ahí aún tienes aire.', { soir: 2 }),
        opt('d', 'Éviter le trou de fin d’après-midi. C’est là que tout bascule.', 'Evitar el hueco de final de tarde. Ahí se vuelca todo.', { crash: 2 }),
      ],
    ),
    q(
      'q2',
      'On te propose un cours à 7h. Toi…',
      'Te proponen una clase a las 7h. Tú…',
      [
        opt('a', 'Oui — c’est même le seul créneau que tu défendrais.', 'Sí — incluso es el único horario que defenderías.', { matin: 2 }),
        opt('b', 'Possible, mais tu tiens mieux un peu plus tard, sans te punir.', 'Posible, pero te sostienes mejor un poco más tarde, sin castigarte.', { plateau: 2 }),
        opt('c', 'Tu dis oui par honte… et tu rates. Ce n’est pas ton horloge.', 'Dices que sí por vergüenza… y fallas. No es tu reloj.', { soir: 2 }),
        opt('d', 'Tu tiens un jour, puis le crash de la veille te rattrape.', 'Aguantas un día, y el bajón de la víspera te alcanza.', { crash: 2 }),
      ],
    ),
    q(
      'q3',
      'Fin d’après-midi, une amie te dit « on bouge maintenant ? ». Ton corps…',
      'Final de tarde, una amiga dice « ¿nos movemos ahora? ». Tu cuerpo…',
      [
        opt('a', 'A déjà donné. Tu aurais dit oui ce matin.', 'Ya dio. Hubieras dicho que sí por la mañana.', { matin: 2 }),
        opt('b', 'Peut suivre si c’est le créneau habituel — pas un à-coup.', 'Puede seguir si es el horario de siempre — no un tirón.', { plateau: 2 }),
        opt('c', 'Commence à s’allumer. C’est souvent là que tu es enfin disponible.', 'Empieza a encenderse. A menudo ahí por fin estás disponible.', { soir: 2 }),
        opt('d', 'Veut l’écran. Tu te juges. Tu ne bouges pas.', 'Quiere la pantalla. Te juzgas. No te mueves.', { crash: 2 }),
      ],
    ),
    q(
      'q4',
      'Quand tu rates le créneau prévu, tu fais quoi — vraiment…',
      'Cuando fallas el horario previsto, qué haces — de verdad…',
      [
        opt('a', 'Tu le recales au matin suivant. Pas le soir : le soir tu n’as plus le même cerveau.', 'Lo recolocas a la mañana siguiente. No de noche: de noche ya no tienes el mismo cerebro.', { matin: 2 }),
        opt('b', 'Tu trouves une fenêtre dans la journée, sans tout décaler.', 'Encuentras una ventana en el día, sin moverlo todo.', { plateau: 2 }),
        opt('c', 'Tu te dis « ce soir » — et souvent ça devient demain.', 'Dices « esta noche » — y a menudo se vuelve mañana.', { soir: 2 }),
        opt('d', 'Tu lis ça comme une preuve. La semaine part avec.', 'Lo lees como una prueba. La semana se va con ello.', { crash: 2 }),
      ],
    ),
    q(
      'q5',
      'Ce que tu appelles « je n’ai pas d’énergie », c’est surtout…',
      'Lo que llamas « no tengo energía », sobre todo es…',
      [
        opt('a', 'Que la fenêtre du matin est passée. Le reste est déjà négocié.', 'Que pasó la ventana de la mañana. El resto ya está negociado.', { matin: 2 }),
        opt('b', 'Que le rythme a cassé. Sans rails, tu glisses.', 'Que se rompió el ritmo. Sin rieles, te deslizas.', { plateau: 2 }),
        opt('c', 'Qu’on te demande d’être du matin. Le soir, l’énergie est là — sans rendez-vous, elle se perd.', 'Que te pidan ser mañanera. De noche la energía está — sin cita, se pierde.', { soir: 2 }),
        opt('d', 'Un trou prévisible. Tu le prends pour un défaut de caractère.', 'Un hueco previsible. Lo tomas por un defecto de carácter.', { crash: 2 }),
      ],
    ),
    q(
      'q6',
      'Pour tenir, le café / l’écran en milieu d’après-midi…',
      'Para aguantar, el café / la pantalla a media tarde…',
      [
        opt('a', 'Peu décisif. Ton sujet, c’est d’avoir déjà bougé.', 'Poco decisivo. Tu tema es haber movido ya.', { matin: 2 }),
        opt('b', 'Une dose pour rester linéaire — pas un sauvetage.', 'Una dosis para seguir lineal — no un salvavidas.', { plateau: 2 }),
        opt('c', 'Un pont vers le soir, où tu t’allumes vraiment.', 'Un puente hacia la noche, donde de verdad te enciendes.', { soir: 2 }),
        opt('d', 'Une béquille. Sans filet humain, tu tombes dans le trou.', 'Una muleta. Sin red humana, caes en el hueco.', { crash: 2 }),
      ],
    ),
    q(
      'q7',
      'Ce que tu te racontes sur ta « motivation »…',
      'Lo que te cuentas sobre tu « motivación »…',
      [
        opt('a', 'J’en ai le matin. Le soir, ce n’est pas de la volonté qui manque : c’est le carburant.', 'La tengo por la mañana. De noche no falta voluntad: falta combustible.', { matin: 2 }),
        opt('b', 'Elle est stable si l’agenda l’est. Pas un feu d’artifice.', 'Es estable si la agenda lo es. No un fuego artificial.', { plateau: 2 }),
        opt('c', 'Elle arrive tard. On m’a appris à la honte.', 'Llega tarde. Me enseñaron a avergonzarme.', { soir: 2 }),
        opt('d', 'Elle disparaît avec le crash. Je me punis — ça n’aide pas.', 'Desaparece con el bajón. Me castigo — no ayuda.', { crash: 2 }),
      ],
    ),
    q(
      'q8',
      'Un rendez-vous fixe avec une coach, ça t’aiderait surtout à…',
      'Una cita fija con una coach te ayudaría sobre todo a…',
      [
        opt('a', 'Protéger la fenêtre du matin — comme un client, pas comme une envie.', 'Proteger la ventana de la mañana — como a un cliente, no como unas ganas.', { matin: 2 }),
        opt('b', 'Poser des rails. Sans à-coups, tu tiens.', 'Poner rieles. Sin tirones, te sostienes.', { plateau: 2 }),
        opt('c', 'Sortir du « ce soir peut-être ». Un vrai soir, tenu.', 'Salir del « esta noche quizá ». Una noche de verdad, cumplida.', { soir: 2 }),
        opt('d', 'Te tenir au bord du trou — sans te demander d’être une autre.', 'Sostenerte al borde del hueco — sin pedirte ser otra.', { crash: 2 }),
      ],
    ),
  ],
  results: [
    {
      id: 'matin',
      title: { fr: 'Énergie Matinale', es: 'Energía Matutina' },
      tagline: { fr: 'Ton carburant est tôt — protège-le comme un rendez-vous.', es: 'Tu combustible es temprano — protégelo como una cita.' },
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
