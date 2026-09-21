/**
 * Banque narrative Big Five — IPIP-50 (10–50 par facteur).
 *
 * Inspirée des descriptions publiques IPIP-NEO de John A. Johnson
 * (https://ipip.ori.org/, Johnson 2014) — réécrites voix FitMangas :
 * chaleureux, direct, accords féminins FR/ES, orienté corps & régularité
 * de pratique. Pas de diagnostic clinique.
 *
 * Seuils : low ≤ 24 · mid ≤ 37 · high ≥ 38
 */

export type BigFiveTraitKey = 'E' | 'A' | 'C' | 'ES' | 'O';
export type Level = 'low' | 'mid' | 'high';

export type BilingualText = { fr: string; es: string };

export type TraitLevelContent = {
  narrative: BilingualText;
  force: BilingualText;
  limit: BilingualText;
};

export type TraitBank = Record<Level, TraitLevelContent>;

export type CombinationInsight = {
  id: string;
  when: Partial<Record<BigFiveTraitKey, Level>>;
  text: BilingualText;
};

/** Somme IPIP-50 par facteur (10–50) */
export function bandFromTraitScore(score: number): Level {
  if (score <= 24) return 'low';
  if (score <= 37) return 'mid';
  return 'high';
}

export const BIG_FIVE_TRAIT_BANK: Record<BigFiveTraitKey, TraitBank> = {
  E: {
    low: {
      narrative: {
        fr: 'Tu te recharges surtout dans le calme et tu préfères les petits cercles aux grandes foules. En cours, tu n’as pas besoin d’être au centre : observer, respirer et sentir ton corps te suffit souvent. Ce n’est pas de la timidité — c’est une façon d’être qui respecte ton rythme intérieur.',
        es: 'Te recargas sobre todo en la calma y prefieres los círculos pequeños a las multitudes. En clase, no necesitas estar en el centro: observar, respirar y sentir tu cuerpo suele bastarte. No es timidez — es una forma de ser que respeta tu ritmo interior.',
      },
      force: {
        fr: 'Tu écoutes ton corps sans te comparer aux autres — une vraie force en Pilates.',
        es: 'Escuchas tu cuerpo sin compararte con las demás — una fortaleza real en Pilates.',
      },
      limit: {
        fr: 'La solitude dans l’effort peut te faire lâcher si personne ne te voit avancer.',
        es: 'La soledad en el esfuerzo puede hacerte soltar si nadie te ve avanzar.',
      },
    },
    mid: {
      narrative: {
        fr: 'Tu aimes le contact humain sans en avoir besoin en permanence. Parfois tu prends la parole, parfois tu restes en retrait — et les deux te conviennent. En visio, tu peux alterner caméra ouverte et moments plus discrets selon ton énergie du jour.',
        es: 'Te gusta el contacto humano sin necesitarlo siempre. A veces hablas, a veces te quedas en segundo plano — y ambas te van bien. En visio, puedes alternar cámara abierta y momentos más discretos según tu energía del día.',
      },
      force: {
        fr: 'Tu t’adaptes au groupe sans te perdre — idéal pour un cours collectif mixte.',
        es: 'Te adaptas al grupo sin perderte — ideal para un curso colectivo mixto.',
      },
      limit: {
        fr: 'Sans cadre extérieur, tu peux hésiter entre solo et collectif et finir par ne rien choisir.',
        es: 'Sin marco exterior, puedes dudar entre solo y colectivo y acabar sin elegir nada.',
      },
    },
    high: {
      narrative: {
        fr: 'Tu prends de l’énergie dans le lien et tu aimes sentir la présence des autres autour de toi. En cours, la dynamique du groupe te porte : un sourire, un échange, le fait d’être vue te motive. Tu exprimes facilement ce que tu ressens dans ton corps.',
        es: 'Ganas energía en el vínculo y te gusta sentir la presencia de las demás a tu alrededor. En clase, la dinámica del grupo te impulsa: una sonrisa, un intercambio, el hecho de ser vista te motiva. Expresas con facilidad lo que sientes en tu cuerpo.',
      },
      force: {
        fr: 'Tu fais vivre le collectif — ta présence encourage les autres sans que tu t’en rendes compte.',
        es: 'Das vida al colectivo — tu presencia anima a las demás sin que te des cuenta.',
      },
      limit: {
        fr: 'Sans interaction, la pratique solo peut te sembler fade et tu risques de décrocher.',
        es: 'Sin interacción, la práctica en solitario puede parecerte plana y corres el riesgo de abandonar.',
      },
    },
  },

  A: {
    low: {
      narrative: {
        fr: 'Tu vas droit au but et tu n’as pas peur de dire ce qui ne te convient pas. En cours, tu préfères qu’on te corrige clairement plutôt que de rester dans la complaisance. Tu te protèges quand il le faut — y compris face à des promesses trop belles.',
        es: 'Vas directo al grano y no temes decir lo que no te convence. En clase, prefieres que te corrijan con claridad antes que quedarte en la complacencia. Te proteges cuando hace falta — también frente a promesas demasiado bonitas.',
      },
      force: {
        fr: 'Tu poses des limites saines — personne ne décide à ta place de ce que ton corps accepte.',
        es: 'Pones límites sanos — nadie decide por ti lo que tu cuerpo acepta.',
      },
      limit: {
        fr: 'Tu peux te fermer au soutien du groupe si tu le perçois comme une pression.',
        es: 'Puedes cerrarte al apoyo del grupo si lo percibes como presión.',
      },
    },
    mid: {
      narrative: {
        fr: 'Tu sais coopérer sans te faire effacer. Tu peux accueillir l’avis de la coach tout en gardant ton ressenti. Dans un cours collectif, tu participes sans te sentir obligée de plaire à tout le monde.',
        es: 'Sabes cooperar sin desaparecer. Puedes acoger la opinión de la coach sin perder tu sensación. En un curso colectivo, participas sin sentirte obligada a agradar a todas.',
      },
      force: {
        fr: 'Tu équilibres écoute et affirmation — tu progresses sans te trahir.',
        es: 'Equilibras escucha y afirmación — progresas sin traicionarte.',
      },
      limit: {
        fr: 'Dans les périodes de fatigue, tu peux te contenter de « faire semblant » d’aller bien.',
        es: 'En periodos de cansancio, puedes contentarte con « fingir » que estás bien.',
      },
    },
    high: {
      narrative: {
        fr: 'Tu accueilles facilement les autres et tu cherches l’harmonie autour de toi. En cours, tu es sensible à l’ambiance du groupe et tu apprécies qu’on prenne soin de chacune. Tu donnes naturellement de l’attention — parfois au détriment de la tienne.',
        es: 'Acoges con facilidad a las demás y buscas armonía a tu alrededor. En clase, eres sensible al ambiente del grupo y valoras que cuiden a cada una. Das atención con naturalidad — a veces en detrimento de la tuya.',
      },
      force: {
        fr: 'Tu crées un climat de confiance — le collectif devient un vrai soutien.',
        es: 'Creas un clima de confianza — el colectivo se convierte en un apoyo real.',
      },
      limit: {
        fr: 'Tu peux repousser tes propres besoins pour ne déranger personne.',
        es: 'Puedes posponer tus propias necesidades para no molestar a nadie.',
      },
    },
  },

  C: {
    low: {
      narrative: {
        fr: 'Tu fonctionnes plutôt au feeling qu’au planning rigide. Les listes et les horaires stricts te pèsent vite — tu préfères la souplesse. Pour tenir une pratique régulière, tu as besoin qu’on t’attende plutôt que de tout organiser seule.',
        es: 'Funcionas más por sensación que por planificación rígida. Las listas y los horarios estrictos te pesan pronto — prefieres la flexibilidad. Para sostener una práctica regular, necesitas que te esperen más que organizarlo todo sola.',
      },
      force: {
        fr: 'Tu t’adaptes aux imprévus sans culpabiliser — ton corps apprécie cette souplesse.',
        es: 'Te adaptas a los imprevistos sin culparte — tu cuerpo aprecia esa flexibilidad.',
      },
      limit: {
        fr: 'Sans cadre extérieur, la régularité devient le premier truc que tu sacrifies.',
        es: 'Sin marco exterior, la regularidad es lo primero que sacrificas.',
      },
    },
    mid: {
      narrative: {
        fr: 'Tu sais te structurer quand c’est utile, sans devenir esclave d’un emploi du temps. Tu tiens plusieurs semaines de pratique si le contexte t’aide, puis tu ajustes. C’est un équilibre honnête entre discipline et vie réelle.',
        es: 'Sabes estructurarte cuando hace falta, sin ser esclava de un horario. Sostienes varias semanas de práctica si el contexto te ayuda, luego ajustas. Es un equilibrio honesto entre disciplina y vida real.',
      },
      force: {
        fr: 'Tu construis des habitudes réalistes — pas parfaites, mais tenables.',
        es: 'Construyes hábitos realistas — no perfectos, pero sostenibles.',
      },
      limit: {
        fr: 'Les semaines chargées peuvent faire vaciller ta routine sans filet.',
        es: 'Las semanas cargadas pueden hacer vacilar tu rutina sin red de apoyo.',
      },
    },
    high: {
      narrative: {
        fr: 'Tu aimes savoir où tu vas : horaires clairs, engagements tenus, progression visible. Les cours collectifs à horaires fixes te conviennent — tu y mets ton énergie dès que le cadre est posé. Tu fais ce que tu dis, y compris pour ton corps.',
        es: 'Te gusta saber adónde vas: horarios claros, compromisos cumplidos, progreso visible. Los cursos colectivos a horarios fijos te van bien — pones tu energía en cuanto el marco está puesto. Haces lo que dices, también con tu cuerpo.',
      },
      force: {
        fr: 'Ta régularité est un moteur — une fois lancée, tu tiens longtemps.',
        es: 'Tu regularidad es un motor — una vez en marcha, aguantas mucho tiempo.',
      },
      limit: {
        fr: 'Tu peux te juger durement quand tu rates un cours, au lieu de reprendre simplement.',
        es: 'Puedes juzgarte con dureza cuando faltas a una clase, en lugar de retomar con calma.',
      },
    },
  },

  ES: {
    low: {
      narrative: {
        fr: 'Ton corps réagit vite au stress, à la fatigue ou aux changements. Une mauvaise nuit, une semaine dense — et tu le sens tout de suite dans ta pratique. Ce n’est pas un défaut : c’est un signal qu’il faut parfois ralentir, respirer, être accompagnée.',
        es: 'Tu cuerpo reacciona rápido al estrés, al cansancio o a los cambios. Una mala noche, una semana densa — y lo notas enseguida en tu práctica. No es un defecto: es una señal de que a veces hay que frenar, respirar, ir acompañada.',
      },
      force: {
        fr: 'Tu ressens finement ce qui se passe en toi — tu ne ignores pas les signaux du corps.',
        es: 'Sientes con finura lo que pasa en ti — no ignoras las señales del cuerpo.',
      },
      limit: {
        fr: 'Sous pression, tu peux abandonner avant d’avoir testé une solution simple (respiration, modification).',
        es: 'Bajo presión, puedes abandonar antes de probar una solución simple (respiración, modificación).',
      },
    },
    mid: {
      narrative: {
        fr: 'Tu gères la plupart des tensions du quotidien sans te laisser submerger. Parfois une journée difficile se lit dans ta séance, parfois le mouvement t’aide à redescendre. Tu connais tes déclencheurs sans être leur otage.',
        es: 'Gestionas la mayoría de las tensiones del día a día sin dejarte arrastrar. A veces un día difícil se nota en tu sesión, a veces el movimiento te ayuda a bajar. Conoces tus detonantes sin ser su rehén.',
      },
      force: {
        fr: 'Tu rebondis en général après un coup de mou — tu sais reprendre.',
        es: 'Rebotes en general tras un bajón — sabes retomar.',
      },
      limit: {
        fr: 'Les périodes prolongées de stress peuvent éroder ta motivation sans que tu t’en rendes compte tout de suite.',
        es: 'Los periodos prolongados de estrés pueden erosionar tu motivación sin que te des cuenta de inmediato.',
      },
    },
    high: {
      narrative: {
        fr: 'Tu restes relativement stable face aux aléas — tu ne paniques pas pour un cours manqué ou une semaine off. Le mouvement te fait du bien sans te surcharger émotionnellement. Tu abordes la pratique avec calme, pas avec anxiété.',
        es: 'Permaneces relativamente estable ante los imprevistos — no entras en pánico por una clase perdida o una semana off. El movimiento te hace bien sin sobrecargarte emocionalmente. Abordas la práctica con calma, no con ansiedad.',
      },
      force: {
        fr: 'Ta sérénité est une base solide pour progresser sans te cramer.',
        es: 'Tu serenidad es una base sólida para progresar sin quemarte.',
      },
      limit: {
        fr: 'Tu peux minimiser un vrai signal de fatigue parce que « ça va » en surface.',
        es: 'Puedes minimizar una señal real de fatiga porque « estás bien » en la superficie.',
      },
    },
  },

  O: {
    low: {
      narrative: {
        fr: 'Tu préfères ce qui est concret, éprouvé, facile à intégrer dans ta vie. Les nouveautés pour le plaisir de la nouveauté te fatiguent. En Pilates, tu apprécies qu’on te montre clairement quoi faire et pourquoi — pas des concepts flous.',
        es: 'Prefieres lo concreto, lo probado, lo fácil de integrar en tu vida. Las novedades por novedad te cansans. En Pilates, valoras que te muestren con claridad qué hacer y por qué — no conceptos difusos.',
      },
      force: {
        fr: 'Tu ancrages la pratique dans le réel — pas de chimère, du corps ici et maintenant.',
        es: 'Anclas la práctica en lo real — sin quimera, el cuerpo aquí y ahora.',
      },
      limit: {
        fr: 'Tu peux rester longtemps dans la même routine alors qu’un petit changement te redonnerait de l’envie.',
        es: 'Puedes quedarte mucho tiempo en la misma rutina cuando un pequeño cambio te devolvería las ganas.',
      },
    },
    mid: {
      narrative: {
        fr: 'Tu es curieuse sans chercher le changement permanent. Tu testes une variante de cours, un nouvel exercice, puis tu reviens à ce qui te fait du bien. Tu ouvres la porte à la nouveauté quand elle a du sens pour ton corps.',
        es: 'Eres curiosa sin buscar el cambio permanente. Pruebas una variante de curso, un ejercicio nuevo, luego vuelves a lo que te sienta bien. Abres la puerta a lo nuevo cuando tiene sentido para tu cuerpo.',
      },
      force: {
        fr: 'Tu combines stabilité et exploration — tu ne t’ennuies pas, tu ne te disperses pas.',
        es: 'Combinas estabilidad y exploración — no te aburres, no te dispersas.',
      },
      limit: {
        fr: 'Face à trop d’options, tu peux temporiser au lieu de choisir un prochain pas.',
        es: 'Ante demasiadas opciones, puedes temporizar en lugar de elegir un siguiente paso.',
      },
    },
    high: {
      narrative: {
        fr: 'Tu aimes découvrir, imaginer, sortir des sentiers battus. Un nouveau cours, une approche différente du mouvement — ça t’attire. Tu fais des liens entre ce que tu ressens dans ton corps et ce que tu vis ailleurs dans ta vie.',
        es: 'Te gusta descubrir, imaginar, salir de lo habitual. Un curso nuevo, un enfoque distinto del movimiento — te atrae. Conectas lo que sientes en tu cuerpo con lo que vives en otras partes de tu vida.',
      },
      force: {
        fr: 'Ta curiosité nourrit ta pratique — tu restes engagée parce que ça continue d’évoluer.',
        es: 'Tu curiosidad alimenta tu práctica — sigues implicada porque sigue evolucionando.',
      },
      limit: {
        fr: 'Tu peux enchaîner les nouveautés sans laisser le temps à une progression de s’installer.',
        es: 'Puedes encadenar novedades sin dejar tiempo a que se instale un progreso.',
      },
    },
  },
};

export const COMBINATION_INSIGHTS: CombinationInsight[] = [
  {
    id: 'regular-structure',
    when: { C: 'high', ES: 'high' },
    text: {
      fr: 'Conscience élevée + stabilité émotionnelle : tu es faite pour les cours collectifs à horaires fixes. Le cadre te libère — tu n’as pas à te motiver seule chaque semaine. C’est ton combo le plus fiable pour tenir dans la durée.',
      es: 'Responsabilidad alta + estabilidad emocional: estás hecha para los cursos colectivos a horarios fijos. El marco te libera — no tienes que motivarte sola cada semana. Es tu combo más fiable para sostener a largo plazo.',
    },
  },
  {
    id: 'explore-connect',
    when: { E: 'high', O: 'high' },
    text: {
      fr: 'Extraversion et ouverture hautes : tu as besoin que le cours bouge et qu’il y ait du lien. Varie les formats (Pilates, Barre), teste les créneaux — tant qu’il y a du mouvement et des visages, tu restes.',
      es: 'Extraversión y apertura altas: necesitas que la clase se mueva y que haya vínculo. Varía formatos (Pilates, Barre), prueba horarios — mientras haya movimiento y caras, te quedas.',
    },
  },
  {
    id: 'faithful-engaged',
    when: { A: 'high', C: 'high' },
    text: {
      fr: 'Agréabilité et conscience élevées : tu tiens parole — envers les autres et envers toi. Un abonnement avec des cours collectifs à horaires fixes te correspond : tu honores le créneau comme un rendez-vous avec ton corps.',
      es: 'Amabilidad y responsabilidad altas: cumples tu palabra — con las demás y contigo. Una suscripción con cursos colectivos a horarios fijos te encaja: honras el horario como una cita con tu cuerpo.',
    },
  },
  {
    id: 'tenace-pressure',
    when: { ES: 'low', C: 'high' },
    text: {
      fr: 'Stabilité émotionnelle basse mais conscience haute : tu veux tenir, mais le stress te rattrape. La correction en direct et le fait d’être vue en cours live t’aident à ne pas porter tout seule — c’est exactement ce que le gratuit ne donne pas.',
      es: 'Estabilidad emocional baja pero responsabilidad alta: quieres sostener, pero el estrés te alcanza. La corrección en directo y ser vista en curso live te ayudan a no cargar sola — es lo que lo gratuito no da.',
    },
  },
  {
    id: 'quiet-depth',
    when: { E: 'low', O: 'high' },
    text: {
      fr: 'Extraversion basse, ouverture haute : tu préfères un petit groupe en visio où tu peux aller en profondeur sans performance sociale. La qualité du regard de la coach compte plus que l’effervescence du groupe.',
      es: 'Extraversión baja, apertura alta: prefieres un grupo pequeño en visio donde puedas profundizar sin performance social. La calidad de la mirada de la coach importa más que la efervescencia del grupo.',
    },
  },
  {
    id: 'warm-stable',
    when: { A: 'high', ES: 'high' },
    text: {
      fr: 'Agréabilité et stabilité émotionnelle élevées : tu apportes douceur et calme au collectif. Attention à ne pas toujours mettre les autres avant ta séance — ton créneau mérite la même bienveillance que tu donnes.',
      es: 'Amabilidad y estabilidad emocional altas: aportas suavidad y calma al colectivo. Cuidado con poner siempre a las demás antes de tu sesión — tu horario merece la misma benevolencia que das.',
    },
  },
  {
    id: 'needs-frame',
    when: { C: 'low', E: 'mid' },
    text: {
      fr: 'Conscience basse avec extraversion moyenne : tu aimes le collectif mais tu oublies le créneau sans rappel extérieur. Les cours à horaires fixes + être attendue en visio remplacent la willpower — ce n’est pas de la faiblesse, c’est un levier.',
      es: 'Responsabilidad baja con extraversión media: te gusta el colectivo pero olvidas el horario sin recordatorio exterior. Cursos a horarios fijos + que te esperen en visio sustituyen la fuerza de voluntad — no es debilidad, es una palanca.',
    },
  },
  {
    id: 'sensitive-reactive',
    when: { ES: 'low', A: 'high' },
    text: {
      fr: 'Stabilité émotionnelle basse et agréabilité haute : tu ressens fort et tu t’adaptes aux autres — parfois trop. Un cadre bienveillant, prévisible, avec la même coach, te permet de te concentrer sur ton corps sans te surveiller socialement.',
      es: 'Estabilidad emocional baja y amabilidad alta: sientes fuerte y te adaptas a las demás — a veces demasiado. Un marco benevolente, previsible, con la misma coach, te permite concentrarte en tu cuerpo sin vigilarte socialmente.',
    },
  },
];

/** Retourne les insights dont toutes les conditions `when` matchent les bandes fournies. */
export function matchingCombinationInsights(
  bands: Partial<Record<BigFiveTraitKey, Level>>
): CombinationInsight[] {
  return COMBINATION_INSIGHTS.filter((insight) =>
    Object.entries(insight.when).every(
      ([key, level]) => bands[key as BigFiveTraitKey] === level
    )
  );
}
