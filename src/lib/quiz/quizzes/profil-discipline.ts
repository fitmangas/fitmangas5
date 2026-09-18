import type { QuizDefinition } from '@/lib/quiz/types';

/** DISC-like sport : 4 profils de discipline (pas licence DISC). */
export const quizProfilDiscipline: QuizDefinition = {
  slug: 'profil-discipline',
  order: 1,
  accent: '#C45D3E',
  eyebrow: { fr: 'Profil DISC-like · 8 scénarios', es: 'Perfil DISC-like · 8 escenarios' },
  title: {
    fr: 'Ton profil de discipline',
    es: 'Tu perfil de disciplina',
  },
  description: {
    fr: 'Comme un DISC, mais pour ton corps et ton agenda. Tu découvres comment tu t’engages — et le moment exact où tu abandonnes quand personne ne regarde. Puis : rendez-vous fixe, pas une autre vidéo.',
    es: 'Como un DISC, pero para tu cuerpo y tu agenda. Descubres cómo te comprometes — y el momento exacto en que sueltas cuando nadie mira. Luego: cita fija, no otro vídeo.',
  },
  durationHint: { fr: '~3 min', es: '~3 min' },
  cta: { fr: 'Essai 7 jours gratuits ✨', es: 'Prueba 7 días gratis ✨' },
  questions: [
    {
      id: 'q1',
      prompt: {
        fr: 'Tu bloques un créneau sport dans ton agenda. Deux jours plus tard…',
        es: 'Bloqueas un hueco deporte en tu agenda. Dos días después…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: 'Tu le défends comme un RDV client : personne ne touche.',
            es: 'Lo defiendes como una cita de trabajo: nadie lo toca.',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: 'Tu le gardes… sauf si quelqu’un a vraiment besoin de toi.',
            es: 'Lo mantienes… salvo si alguien te necesita de verdad.',
          },
          scores: { jaune: 2 },
        },
        {
          id: 'c',
          label: {
            fr: 'Tu le déplaces « juste cette fois » — ça devient une habitude.',
            es: 'Lo mueves « solo esta vez » — y se vuelve hábito.',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: 'Tu as déjà tout recalculé : charge, sommeil, charge mentale.',
            es: 'Ya lo recalculaste todo: carga, sueño, carga mental.',
          },
          scores: { bleu: 2 },
        },
      ],
    },
    {
      id: 'q2',
      prompt: {
        fr: 'Ce qui te fait vraiment démarrer une séance, c’est…',
        es: 'Lo que de verdad te hace empezar una sesión es…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: 'Un objectif clair et un chrono : tu entres, tu exécutes.',
            es: 'Un objetivo claro y un chrono: entras y ejecutas.',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: 'L’idée de te sentir mieux après — et un peu de plaisir.',
            es: 'La idea de sentirte mejor después — y un poco de placer.',
          },
          scores: { jaune: 2 },
        },
        {
          id: 'c',
          label: {
            fr: 'Savoir que quelqu’un t’attend ou te verra.',
            es: 'Saber que alguien te espera o te verá.',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: 'Un plan logique : durée, ordre, pourquoi chaque chose.',
            es: 'Un plan lógico: duración, orden, por qué cada cosa.',
          },
          scores: { bleu: 2 },
        },
      ],
    },
    {
      id: 'q3',
      prompt: {
        fr: 'Tu rates une semaine entière. Ton premier réflexe…',
        es: 'Fallaste una semana entera. Tu primer reflejo…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: 'Tu te remets une barre plus haute pour « rattraper ».',
            es: 'Te pones el listón más alto para « recuperar ».',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: 'Tu te racontes une histoire légère — puis tu remets à plus tard.',
            es: 'Te cuentas una historia ligera — y lo dejas para luego.',
          },
          scores: { jaune: 1, vert: 1 },
        },
        {
          id: 'c',
          label: {
            fr: 'Tu te sens coupable… et tu évites d’en parler.',
            es: 'Te sientes culpable… y evitas hablarlo.',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: 'Tu analyses pourquoi le système a cassé.',
            es: 'Analizas por qué se rompió el sistema.',
          },
          scores: { bleu: 2 },
        },
      ],
    },
    {
      id: 'q4',
      prompt: {
        fr: 'Dans un cours en groupe, tu es plutôt…',
        es: 'En una clase grupal, eres más bien…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: 'Focalisée sur ta perf, tu veux la correction utile.',
            es: 'Enfocada en tu rendimiento, quieres la corrección útil.',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: 'Branchée sur l’ambiance et l’énergie de la salle.',
            es: 'Enganchada al ambiente y a la energía de la sala.',
          },
          scores: { jaune: 2 },
        },
        {
          id: 'c',
          label: {
            fr: 'Attentive à ne déranger personne — et à être « comme il faut ».',
            es: 'Atenta a no molestar — y a « hacerlo bien ».',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: 'Tu observes la consigne avant de bouger vraiment.',
            es: 'Observas la consigna antes de moverte de verdad.',
          },
          scores: { bleu: 2 },
        },
      ],
    },
    {
      id: 'q5',
      prompt: {
        fr: 'Ce qui te fait abandonner un programme en ligne…',
        es: 'Lo que te hace abandonar un programa online…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: 'Trop lent : tu veux des résultats visibles vite.',
            es: 'Demasiado lento: quieres resultados visibles ya.',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: 'Trop monotone : tu t’ennuies et tu zappes.',
            es: 'Demasiado monótono: te aburres y saltas.',
          },
          scores: { jaune: 2 },
        },
        {
          id: 'c',
          label: {
            fr: 'Trop seule : personne ne remarque si tu disparais.',
            es: 'Demasiado sola: nadie nota si desapareces.',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: 'Trop flou : tu ne sais pas si tu « fais juste ».',
            es: 'Demasiado vago: no sabes si lo haces « bien ».',
          },
          scores: { bleu: 2 },
        },
      ],
    },
    {
      id: 'q6',
      prompt: {
        fr: 'On te propose un essai 7 jours avec une coach en visio. Tu penses d’abord…',
        es: 'Te proponen una prueba de 7 días con una coach en visio. Piensas primero…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: '« Est-ce que ça va m’amener quelque part concrètement ? »',
            es: '« ¿Esto me lleva a algo concreto? »',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: '« Est-ce que ça va être agréable / vivant ? »',
            es: '« ¿Va a ser agradable / vivo? »',
          },
          scores: { jaune: 2 },
        },
        {
          id: 'c',
          label: {
            fr: '« Est-ce qu’elle va me voir vraiment — sans me juger ? »',
            es: '« ¿Me va a ver de verdad — sin juzgarme? »',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: '« Comment ça marche exactement : horaires, format, engagement ? »',
            es: '« ¿Cómo funciona exactamente: horarios, formato, compromiso? »',
          },
          scores: { bleu: 2 },
        },
      ],
    },
    {
      id: 'q7',
      prompt: {
        fr: 'Ta plus grande peur avec le sport…',
        es: 'Tu mayor miedo con el deporte…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: 'Perdre du temps sans progresser.',
            es: 'Perder tiempo sin progresar.',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: 'Que ça devienne une corvée sans joie.',
            es: 'Que se vuelva una obligación sin alegría.',
          },
          scores: { jaune: 2 },
        },
        {
          id: 'c',
          label: {
            fr: 'Être seule à nouveau — et tout faire tomber.',
            es: 'Volver a estar sola — y dejarlo todo.',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: 'Mal faire et me blesser / me tromper.',
            es: 'Hacerlo mal y lesionarme / equivocarme.',
          },
          scores: { bleu: 2 },
        },
      ],
    },
    {
      id: 'q8',
      prompt: {
        fr: 'Ce dont tu as le plus besoin pour tenir 3 mois…',
        es: 'Lo que más necesitas para sostener 3 meses…',
      },
      options: [
        {
          id: 'a',
          label: {
            fr: 'Des jalons clairs et une exigence bienveillante.',
            es: 'Hitos claros y una exigencia amable.',
          },
          scores: { rouge: 2 },
        },
        {
          id: 'b',
          label: {
            fr: 'De la variété et une énergie qui te tire vers le haut.',
            es: 'Variedad y una energía que te impulse.',
          },
          scores: { jaune: 2 },
        },
        {
          id: 'c',
          label: {
            fr: 'Un rendez-vous humain : être attendue.',
            es: 'Una cita humana: que te esperen.',
          },
          scores: { vert: 2 },
        },
        {
          id: 'd',
          label: {
            fr: 'Une méthode stable + des corrections précises.',
            es: 'Un método estable + correcciones precisas.',
          },
          scores: { bleu: 2 },
        },
      ],
    },
  ],
  results: [
    {
      id: 'rouge',
      title: { fr: 'Profil Directe', es: 'Perfil Directa' },
      tagline: {
        fr: 'Tu avances fort — jusqu’à ce que le système te paraisse trop mou.',
        es: 'Avanzas fuerte — hasta que el sistema te parece demasiado flojo.',
      },
      body: {
        fr: [
          'Tu abandonnes quand il n’y a plus de sens de progression. Pas par paresse : par frustration.',
          'Seule devant une vidéo, tu finis souvent par accélérer, sauter, ou jeter l’éponge si le feedback manque.',
          'Ce dont tu as besoin : un cadre qui te challenge sans te laisser seule à juger si « c’est assez ».',
        ],
        es: [
          'Abandonas cuando ya no hay sensación de progreso. No por pereza: por frustración.',
          'Sola frente a un vídeo, aceleras, saltas o tiras la toalla si falta feedback.',
          'Lo que necesitas: un marco que te rete sin dejarte sola juzgando si « es suficiente ».',
        ],
      },
      bridge: {
        fr: 'Un rendez-vous fixe avec correction en direct, ce n’est pas du « plus doux ». C’est du feedback utile — exactement ce qui te fait tenir.',
        es: 'Una cita fija con corrección en directo no es « más suave ». Es feedback útil — justo lo que te hace sostener.',
      },
      shareLine: {
        fr: 'Mon profil de discipline : Directe — j’abandonne quand je n’avance plus.',
        es: 'Mi perfil de disciplina: Directa — abandono cuando ya no avanzo.',
      },
    },
    {
      id: 'jaune',
      title: { fr: 'Profil Envolée', es: 'Perfil Impulso' },
      tagline: {
        fr: 'Tu démarres avec du feu — tu lâches quand ça devient gris.',
        es: 'Empiezas con fuego — sueltas cuando se vuelve gris.',
      },
      body: {
        fr: [
          'Tu as besoin de sens vivant, d’énergie, parfois de lien. La routine froide t’éteint.',
          'Seule, tu commences souvent bien… puis tu te disperses vers autre chose « plus stimulant ».',
          'Ce n’est pas de l’inconstance : c’est un cerveau qui cherche du carburant émotionnel.',
        ],
        es: [
          'Necesitas sentido vivo, energía, a veces vínculo. La rutina fría te apaga.',
          'Sola, empiezas bien… y te dispersas hacia algo « más estimulante ».',
          'No es inconstancia: es un cerebro que busca combustible emocional.',
        ],
      },
      bridge: {
        fr: 'Le créneau avec une coach qui te voit, ça remet du vivant dans la régularité — sans te demander de devenir une machine.',
        es: 'El horario con una coach que te ve pone vida en la constancia — sin pedirte que seas una máquina.',
      },
      shareLine: {
        fr: 'Mon profil de discipline : Envolée — je lâche quand ça devient gris.',
        es: 'Mi perfil de disciplina: Impulso — suelto cuando se vuelve gris.',
      },
    },
    {
      id: 'vert',
      title: { fr: 'Profil Ancrée', es: 'Perfil Anclada' },
      tagline: {
        fr: 'Tu tiens par le lien — tu disparais quand tu es seule trop longtemps.',
        es: 'Te sostienes por el vínculo — desapareces cuando estás sola demasiado tiempo.',
      },
      body: {
        fr: [
          'Ton vrai frein n’est presque jamais le mouvement. C’est de le porter sans être vue.',
          'Tu te juges vite, tu te compares, tu évites — puis tu te dis que tu « n’as pas de volonté ».',
          'Faux. Tu as besoin d’un cadre relationnel : quelqu’un qui attend ton rendez-vous.',
        ],
        es: [
          'Tu freno casi nunca es el movimiento. Es llevarlo sin ser vista.',
          'Te juzgas rápido, te comparas, evitas — y te dices que « no tienes voluntad ».',
          'Falso. Necesitas un marco relacional: alguien que espera tu cita.',
        ],
      },
      bridge: {
        fr: 'FitMangas, ce n’est pas « plus de vidéos ». C’est être attendue, corrigée, vue — pour ne plus abandonner seule.',
        es: 'FitMangas no es « más vídeos ». Es ser esperada, corregida, vista — para no abandonar sola.',
      },
      shareLine: {
        fr: 'Mon profil de discipline : Ancrée — je disparais quand je suis seule trop longtemps.',
        es: 'Mi perfil de disciplina: Anclada — desaparezco cuando estoy sola demasiado tiempo.',
      },
    },
    {
      id: 'bleu',
      title: { fr: 'Profil Méthode', es: 'Perfil Método' },
      tagline: {
        fr: 'Tu tiens si c’est clair — tu bloquees si tu doutes de la qualité.',
        es: 'Te sostienes si está claro — te bloqueas si dudas de la calidad.',
      },
      body: {
        fr: [
          'Tu as besoin de comprendre. Une vidéo floue ou un « fais comme tu sens » te fait décrocher.',
          'Seule, tu peux tourner en boucle sur la technique… et ne jamais démarrer vraiment.',
          'Ce dont tu as besoin : une méthode stable + une correction qui te dit « oui, comme ça ».',
        ],
        es: [
          'Necesitas entender. Un vídeo vago o un « haz como sientas » te desconecta.',
          'Sola, puedes dar vueltas a la técnica… y nunca empezar de verdad.',
          'Lo que necesitas: un método estable + una corrección que diga « sí, así ».',
        ],
      },
      bridge: {
        fr: 'La correction en direct en visio, c’est exactement ton levier : moins de doute, plus de continuité.',
        es: 'La corrección en directo en visio es tu palanca: menos duda, más continuidad.',
      },
      shareLine: {
        fr: 'Mon profil de discipline : Méthode — je bloque si je doute de la qualité.',
        es: 'Mi perfil de disciplina: Método — me bloqueo si dudo de la calidad.',
      },
    },
  ],
};
