import { lines, t, type QuizResult } from '@/lib/quiz/types';

const discReport = (
  partial: Omit<QuizResult, 'report'> & { report: QuizResult['report'] },
): QuizResult => partial;

/** Comptes-rendus inspirés de la structure DISC (forces, stress, peurs, communication) — pas une licence DISC. */
export const DISC_DISCIPLINE_RESULTS: QuizResult[] = [
  discReport({
    id: 'rouge',
    letter: 'D',
    styleName: t('La Décideuse', 'La Decidida'),
    title: t('Profil Directe', 'Perfil Directa'),
    tagline: t(
      'Tu avances pour un résultat. Tu lâches quand ça n’avance plus.',
      'Avanzas por un resultado. Sueltas cuando ya no avanza.',
    ),
    body: lines(
      [
        'Tu t’engages fort, vite, avec une exigence claire.',
        'Tu abandonnes rarement par « manque de volonté » : tu abandonnes quand le système te semble inefficace.',
      ],
      [
        'Te comprometes fuerte, rápido, con una exigencia clara.',
        'Rara vez abandonas por « falta de voluntad »: abandonas cuando el sistema te parece ineficaz.',
      ],
    ),
    report: {
      portrait: lines(
        [
          'Ton style naturel, dans le sport comme dans l’agenda, est d’aller vers le résultat. Tu aimes savoir où ça mène, combien de temps ça prend, et si ça vaut le coup. Une consigne floue t’irrite plus qu’une consigne exigeante.',
          'Tu n’as pas besoin qu’on te « motive ». Tu as besoin qu’on ne te fasse pas perdre ton temps. Quand le cadre est mou — « fais comme tu sens », « quand tu peux » — tu accélères, tu sautes des étapes, ou tu sors. Ce n’est pas de la paresse. C’est de la frustration de pilote sans tableau de bord.',
          'Seule devant une vidéo, tu deviens souvent ton propre juge : assez dur, assez vite, assez utile ? Sans feedback, tu triches vers le haut (trop) ou tu jettes l’éponge. Le point de bascule n’est pas l’effort. C’est l’absence de progression lisible.',
          'Avec les autres, tu es directe. Tu préfères une correction nette à un compliment vague. On peut te trouver « trop » : trop vite, trop cash, trop impatiente. En environnement favorable (objectif clair, quelqu’un qui assume l’exigence), tu es une alliée redoutable. En environnement défavorable (flou, lenteur, consensus mou), tu t’impatientes et tu pars.',
        ],
        [
          'Tu estilo natural, en el deporte y en la agenda, es ir al resultado. Quieres saber a dónde lleva, cuánto tarda, y si vale la pena. Una consigna vaga te irrita más que una exigente.',
          'No necesitas que te « motiven ». Necesitas que no te hagan perder el tiempo. Cuando el marco es flojo — « haz como sientas », « cuando puedas » — aceleras, saltas pasos, o sales. No es pereza. Es frustración de piloto sin tablero.',
          'Sola frente a un vídeo, a menudo te vuelves tu propia juez: ¿suficiente, bastante rápido, útil? Sin feedback, haces trampa hacia arriba (de más) o tiras la toalla. El punto de quiebre no es el esfuerzo. Es la falta de progreso legible.',
          'Con los demás eres directa. Prefieres una corrección nítida a un cumplido vago. Pueden encontrarte « demasiado »: demasiado rápida, demasiado clara, demasiado impaciente. En un entorno favorable (objetivo claro, alguien que asume la exigencia), eres una aliada formidable. En uno desfavorable (vaguedad, lentitud, consenso flojo), te impacientas y te vas.',
        ],
      ),
      howYouWork: lines(
        [
          'Tu décides vite. Tu aimes un plan court plutôt qu’un discours long.',
          'Tu tiens si tu vois un avant / après — même petit.',
          'Tu n’aimes pas dépendre : tu veux garder la main sur ton créneau.',
          'Tu respectes l’autorité qui a une compétence, pas le titre.',
        ],
        [
          'Decides rápido. Prefieres un plan corto a un discurso largo.',
          'Te sostienes si ves un antes / después — aunque sea pequeño.',
          'No te gusta depender: quieres la mano sobre tu horario.',
          'Respetas la autoridad con competencia, no el título.',
        ],
      ),
      strengths: lines(
        [
          'Capacité à démarrer sans attendre d’être « prête ».',
          'Goût du défi : tu montes d’un cran quand ça résiste.',
          'Clarté : tu dis ce qui ne marche pas.',
          'Protection du créneau comme un rendez-vous de travail.',
          'Peu de temps perdu en doutes inutiles une fois la décision prise.',
        ],
        [
          'Capacidad de empezar sin esperar a estar « lista ».',
          'Gusto por el reto: subes un punto cuando algo resiste.',
          'Claridad: dices lo que no funciona.',
          'Proteges el horario como una cita de trabajo.',
          'Poco tiempo perdido en dudas inútiles una vez decidido.',
        ],
      ),
      limits: lines(
        [
          'Impatience : tu peux juger trop vite qu’un cadre est « trop lent ».',
          'Tu minimises le besoin d’être vue — jusqu’à ce que tu abandonnes, seule.',
          'Sous l’ennui, tu forces ou tu zappes, au lieu d’ajuster.',
          'Tu peux confondre vitesse et progrès.',
        ],
        [
          'Impaciencia: puedes juzgar demasiado pronto que un marco es « lento ».',
          'Minimizas la necesidad de ser vista — hasta que abandonas, sola.',
          'Con el aburrimiento, fuerzas o saltas, en vez de ajustar.',
          'Puedes confundir velocidad y progreso.',
        ],
      ),
      underStress: lines(
        [
          'Tu durcis le ton — avec toi d’abord. « Allez, on arrête de niaiser. »',
          'Tu veux reprendre le contrôle : nouveau plan, nouvelle barre, parfois trop haute.',
          'Tu coupes ce qui te semble inefficace, y compris un programme encore utile.',
          'Le risque : brûler la continuité pour « rattraper ».',
        ],
        [
          'Endureces el tono — primero contigo. « Vamos, se acabó lo suave. »',
          'Quieres retomar el control: plan nuevo, listón más alto, a veces demasiado.',
          'Cortas lo que te parece ineficaz, incluso un programa todavía útil.',
          'El riesgo: quemar la continuidad para « recuperar ».',
        ],
      ),
      fears: lines(
        [
          'Perdre du temps sans résultat.',
          'Être dirigée par quelqu’un de mou ou d’incompétent.',
          'Dépendre d’un système qui ne te fait pas avancer.',
          'Passer pour quelqu’un qui « n’y arrive pas » — toi, surtout.',
        ],
        [
          'Perder tiempo sin resultado.',
          'Que te dirija alguien flojo o incompetente.',
          'Depender de un sistema que no te hace avanzar.',
          'Parecer alguien que « no llega » — sobre todo a ti misma.',
        ],
      ),
      needs: lines(
        [
          'Un objectif lisible et un rythme d’exigences réel — pas du fluff.',
          'Du feedback utile : « ça, oui / ça, non » plutôt que « bravo ».',
          'De l’autonomie dans un cadre, pas un carcan ni un flou.',
          'Quelqu’un qui tient la barre avec toi, sans te ralentir pour te rassurer.',
        ],
        [
          'Un objetivo legible y un ritmo de exigencia real — no relleno.',
          'Feedback útil: « esto sí / esto no » más que « bravo ».',
          'Autonomía dentro de un marco, ni cárcel ni vaguedad.',
          'Alguien que sostenga el listón contigo, sin frenarte para tranquilizarte.',
        ],
      ),
      howToTalk: lines(
        [
          'Va droit au but. Dis le résultat, puis le comment.',
          'Assume une exigence : elle te respecte plus qu’une voix sucrée.',
          'Donne une correction précise, une à la fois.',
          'Montre le progrès (même petit) — c’est ton carburant.',
        ],
        [
          'Ve al grano. Di el resultado, luego el cómo.',
          'Asume una exigencia: te respeta más que una voz dulce.',
          'Da una corrección precisa, una cada vez.',
          'Muestra el progreso (aunque sea pequeño) — es tu combustible.',
        ],
      ),
      howNotToTalk: lines(
        [
          'Évite les longs préambules et le « on verra bien ».',
          'Ne tourne pas autour : elle sent l’évitement tout de suite.',
          'Ne la infantilise pas (« tout doux », « à ton rythme » sans contenu).',
          'Ne promets pas de magie. Elle teste la compétence.',
        ],
        [
          'Evita preámbulos largos y el « ya veremos ».',
          'No des rodeos: percibe la evitación al instante.',
          'No la infantilices (« suave », « a tu ritmo » sin contenido).',
          'No prometas magia. Ella prueba la competencia.',
        ],
      ),
      develop: lines(
        [
          'Apprendre à rester quand le progrès est lent mais réel — sans tout casser pour « plus fort ».',
          'Accepter qu’être vue n’est pas une faiblesse : c’est un capteur de qualité.',
          'Laisser un cadre durer assez longtemps pour qu’il compte, avant de le juger inefficace.',
        ],
        [
          'Aprender a quedarte cuando el progreso es lento pero real — sin romperlo todo por « más fuerte ».',
          'Aceptar que ser vista no es debilidad: es un sensor de calidad.',
          'Dejar que un marco dure lo suficiente para que cuente, antes de juzgarlo ineficaz.',
        ],
      ),
    },
    bridge: t(
      'Un rendez-vous fixe avec correction en direct, ce n’est pas « plus doux ». C’est du feedback utile — le capteur qui te manque seule. L’essai 7 jours te permet de tester ça, pas de te prouver que tu es disciplinée.',
      'Una cita fija con corrección en directo no es « más suave ». Es feedback útil — el sensor que te falta sola. La prueba 7 días es para testear eso, no para demostrarte que eres disciplinada.',
    ),
    shareLine: t(
      'Mon profil de discipline : Directe (D) — La Décideuse.',
      'Mi perfil de disciplina: Directa (D) — La Decidida.',
    ),
  }),
  discReport({
    id: 'jaune',
    letter: 'E',
    styleName: t('L’Enthousiaste', 'La Entusiasta'),
    title: t('Profil Enthousiaste', 'Perfil Entusiasta'),
    tagline: t(
      'Tu démarres avec du feu. Tu lâches quand ça devient gris.',
      'Empiezas con fuego. Sueltas cuando se vuelve gris.',
    ),
    body: lines(
      [
        'Tu t’engages par l’élan, le sens, parfois le lien.',
        'La routine froide t’éteint — ce n’est pas de l’inconstance, c’est un besoin de vivant.',
      ],
      [
        'Te comprometes por el impulso, el sentido, a veces el vínculo.',
        'La rutina fría te apaga — no es inconstancia, es necesidad de vida.',
      ],
    ),
    report: {
      portrait: lines(
        [
          'Ton style naturel, c’est l’élan. Tu te lances quand ça a du sens, de l’énergie, une histoire. Un nouveau cadre t’allume. Une consigne vivante te fait bouger plus sûrement qu’un tableau Excel d’habitudes.',
          'On te croit parfois « trop » : trop parlante, trop d’idées, trop de départs. En réalité tu as un cerveau qui cherche du carburant émotionnel. Quand il n’y en a plus — salle vide, vidéo muette, semaine identique — tu ne « manques pas de discipline ». Tu manques d’oxygène.',
          'Seule, tu commences souvent très bien. Puis tu te disperses vers autre chose de plus stimulant, ou tu remets « à un moment plus inspiré ». Le piège, ce n’est pas le premier jour. C’est le treizième, quand plus personne ne voit que tu es encore là.',
          'Avec les autres, tu apportes de la chaleur. Tu as besoin d’être reconnue — pas flattée niaisement, vue. En environnement favorable (groupe vivant, coach présente, variété dans un cadre), tu tiens. En environnement défavorable (isolement, monotone, silence), tu t’évapores sans drame — et tu te racontes que tu « n’es pas du genre régulière ».',
        ],
        [
          'Tu estilo natural es el impulso. Te lanzas cuando hay sentido, energía, una historia. Un marco nuevo te enciende. Una consigna viva te mueve más que una tabla de hábitos.',
          'A veces te creen « demasiado »: demasiado habladora, demasiadas ideas, demasiados arranques. En realidad tu cerebro busca combustible emocional. Cuando se acaba — sala vacía, vídeo mudo, semana idéntica — no « te falta disciplina ». Te falta oxígeno.',
          'Sola, empiezas muy bien. Luego te dispersas hacia algo más estimulante, o lo dejas « para un momento más inspirado ». La trampa no es el primer día. Es el decimotercero, cuando ya nadie ve que sigues ahí.',
          'Con los demás aportas calor. Necesitas ser reconocida — no adulada, vista. En un entorno favorable (grupo vivo, coach presente, variedad dentro de un marco), te sostienes. En uno desfavorable (aislamiento, monotonía, silencio), te evaporas sin drama — y te cuentas que « no eres de las constantes ».',
        ],
      ),
      howYouWork: lines(
        [
          'Tu t’orientes à l’énergie de la pièce, pas seulement à l’horloge.',
          'Tu tiens mieux quand il y a du lien — même léger.',
          'Tu aimes comprendre le « pourquoi » d’un mouvement, pas seulement le « fais ça ».',
          'Tu rebondis vite après un creux… si quelque chose te rallume.',
        ],
        [
          'Te orientas por la energía de la sala, no solo por el reloj.',
          'Te sostienes mejor cuando hay vínculo — aunque sea ligero.',
          'Te gusta entender el « por qué » de un movimiento, no solo el « haz esto ».',
          'Rebotas rápido después de un bajón… si algo te vuelve a encender.',
        ],
      ),
      strengths: lines(
        [
          'Capacité à démarrer, à entraîner les autres, à rendre un cadre vivant.',
          'Souplesse : tu t’adaptes, tu improvises, tu ne te fige pas.',
          'Lecture des ambiances : tu sens quand ça coince chez toi et chez les autres.',
          'Optimisme utile — tu trouves une porte quand d’autres voient un mur.',
          'Le plaisir n’est pas un luxe chez toi : c’est un levier de continuité.',
        ],
        [
          'Capacidad de arrancar, de contagiar, de hacer vivo un marco.',
          'Flexibilidad: te adaptas, improvisas, no te rigidizas.',
          'Lectura de ambientes: sientes cuando algo se traba en ti y en las demás.',
          'Optimismo útil — encuentras una puerta cuando otras ven un muro.',
          'El gusto no es un lujo: es una palanca de continuidad.',
        ],
      ),
      limits: lines(
        [
          'Tu sous-estimes le besoin de structure : « ça ira, j’ai l’élan ».',
          'Tu peux promettre trop — à toi d’abord.',
          'L’ennui te fait zapper un cadre encore bon.',
          'Sans public (même d’une personne), tu disparais plus vite que tu ne le crois.',
        ],
        [
          'Subestimas la estructura: « ya irá, tengo impulso ».',
          'Puedes prometer de más — primero a ti.',
          'El aburrimiento te hace saltar un marco todavía bueno.',
          'Sin público (aunque sea de una persona), desapareces más rápido de lo que crees.',
        ],
      ),
      underStress: lines(
        [
          'Tu parles plus, tu expliques, tu cherches de l’air.',
          'Tu changes de plan pour retrouver une étincelle — parfois trop souvent.',
          'Tu minimises le creux (« ça va aller ») jusqu’à ce qu’il soit trop tard.',
          'Le risque : collectionner les départs, jamais les 8 semaines.',
        ],
        [
          'Hablas más, explicas, buscas aire.',
          'Cambias de plan para recuperar una chispa — a veces demasiado.',
          'Minimizas el bajón (« ya pasará ») hasta que es tarde.',
          'El riesgo: coleccionar arranques, nunca las 8 semanas.',
        ],
      ),
      fears: lines(
        [
          'Que ça devienne une corvée sans joie.',
          'Être invisible — faire l’effort dans le vide.',
          'Être « coincée » dans une méthode froide.',
          'Décevoir l’élan que tu as toi-même créé.',
        ],
        [
          'Que se vuelva una obligación sin alegría.',
          'Ser invisible — hacer el esfuerzo en el vacío.',
          'Quedarte « atrapada » en un método frío.',
          'Defraudar el impulso que tú misma creaste.',
        ],
      ),
      needs: lines(
        [
          'Un cadre vivant : quelqu’un là, une voix, une correction, pas un PDF.',
          'De la variété à l’intérieur d’une constance — pas l’inverse.',
          'Être vue. Un regard suffit. Le silence tue plus que la difficulté.',
          'Un rendez-vous qui te tire, pas une liste de tâches.',
        ],
        [
          'Un marco vivo: alguien ahí, una voz, una corrección, no un PDF.',
          'Variedad dentro de una constancia — no al revés.',
          'Ser vista. Una mirada basta. El silencio mata más que la dificultad.',
          'Una cita que te tire, no una lista de tareas.',
        ],
      ),
      howToTalk: lines(
        [
          'Parle avec chaleur. Relie le geste à un sens, pas seulement à une consigne.',
          'Reconnais l’effort vivant — pas seulement le résultat chiffré.',
          'Invite, n’enferme pas. Laisse de l’air dans le cadre.',
          'Rends le rendez-vous humain : un prénom, un regard, une phrase vraie.',
        ],
        [
          'Habla con calor. Une el gesto a un sentido, no solo a una consigna.',
          'Reconoce el esfuerzo vivo — no solo el resultado numérico.',
          'Invita, no encierras. Deja aire en el marco.',
          'Haz humana la cita: un nombre, una mirada, una frase verdadera.',
        ],
      ),
      howNotToTalk: lines(
        [
          'N’en fais pas un règlement militaire sans vie.',
          'Ne la réduis pas à « elle n’est pas constante » — tu rates le moteur.',
          'Évite le froid, le silence, le « débrouille-toi avec la vidéo ».',
          'Ne surcharge pas de règles le premier jour : tu éteins l’élan.',
        ],
        [
          'No lo conviertas en un reglamento militar sin vida.',
          'No la reduzcas a « no es constante » — te pierdes el motor.',
          'Evita el frío, el silencio, el « apáñatelas con el vídeo ».',
          'No sobrecargues de reglas el primer día: apagas el impulso.',
        ],
      ),
      develop: lines(
        [
          'Garder l’élan… et lui donner un contenant qui dure (créneau, visio, quelqu’un).',
          'Rester une semaine de plus quand c’est « moins fun » — c’est là que ça compte.',
          'Distinguer ennui et vrai mauvais cadre, pour ne plus tout jeter.',
        ],
        [
          'Conservar el impulso… y darle un contenedor que dure (horario, visio, alguien).',
          'Quedarte una semana más cuando es « menos divertido » — ahí cuenta.',
          'Distinguir aburrimiento y marco de verdad malo, para no tirarlo todo.',
        ],
      ),
    },
    bridge: t(
      'Le créneau avec une coach qui te voit remet du vivant dans la régularité — sans te demander de devenir une machine. L’essai 7 jours, c’est tester ce carburant-là.',
      'El horario con una coach que te ve pone vida en la constancia — sin pedirte que seas una máquina. La prueba 7 días es testear ese combustible.',
    ),
    shareLine: t(
      'Mon profil de discipline : Enthousiaste (E) — L’Enthousiaste.',
      'Mi perfil de disciplina: Entusiasta (E) — La Entusiasta.',
    ),
  }),
  discReport({
    id: 'vert',
    letter: 'A',
    styleName: t('La Fidèle', 'La Fiel'),
    title: t('Profil Assidue', 'Perfil Constante'),
    tagline: t(
      'Tu tiens par le lien. Tu disparais quand tu es seule trop longtemps.',
      'Te sostienes por el vínculo. Desapareces cuando estás sola demasiado tiempo.',
    ),
    body: lines(
      [
        'Tu t’engages pour durer, pas pour briller.',
        'Ton vrai frein n’est presque jamais le mouvement : c’est de le porter sans être vue.',
      ],
      [
        'Te comprometes para durar, no para brillar.',
        'Tu freno casi nunca es el movimiento: es llevarlo sin ser vista.',
      ],
    ),
    report: {
      portrait: lines(
        [
          'Ton style naturel, c’est la constance relationnelle. Tu aimes un cadre prévisible, une voix connue, un rythme qui ne te trahit pas. Tu n’as pas besoin d’un spectacle. Tu as besoin de savoir que quelqu’un sera là mardi, comme la semaine dernière.',
          'On te sous-estime souvent : trop discrète, trop « gentille », trop accommodante. En réalité tu as une loyauté puissante — envers un cours, une coach, un groupe — dès que tu te sens en sécurité. Ce n’est pas de la mollesse. C’est un système qui avance quand le sol est stable.',
          'Seule, tu te juges vite. Tu compares. Tu évites. Puis tu te dis que tu « n’as pas de volonté ». Faux. Tu as une volonté qui s’allume dans le lien et s’éteint dans l’isolement. Le tapis vide n’est pas un outil. C’est une pièce sans personne, et ton système le lit comme un abandon.',
          'Avec les autres, tu cherches l’harmonie. Tu n’aimes pas le conflit, ni qu’on te mette en avant sans prévenir. En environnement favorable (accueil, régularité, correction sans humiliation), tu es d’une fiabilité rare. En environnement défavorable (pression, jugement, solitude), tu disparais pour te protéger — souvent sans expliquer.',
        ],
        [
          'Tu estilo natural es la constancia relacional. Te gusta un marco predecible, una voz conocida, un ritmo que no te traicione. No necesitas un espectáculo. Necesitas saber que alguien estará el martes, como la semana pasada.',
          'A menudo te subestiman: demasiado discreta, demasiado « amable », demasiado acomodaticia. En realidad tienes una lealtad potente — a una clase, una coach, un grupo — en cuanto te sientes segura. No es blandura. Es un sistema que avanza cuando el suelo es estable.',
          'Sola, te juzgas rápido. Te comparas. Evitas. Luego te dices que « no tienes voluntad ». Falso. Tienes una voluntad que se enciende en el vínculo y se apaga en el aislamiento. El tapete vacío no es una herramienta. Es una habitación sin nadie, y tu sistema lo lee como un abandono.',
          'Con los demás buscas armonía. No te gusta el conflicto ni que te pongan delante sin avisar. En un entorno favorable (acogida, regularidad, corrección sin humillación), eres de una fiabilidad rara. En uno desfavorable (presión, juicio, soledad), desapareces para protegerte — a menudo sin explicar.',
        ],
      ),
      howYouWork: lines(
        [
          'Tu préfères un rythme stable à des pics d’intensité.',
          'Tu tiens si tu es attendue — le rendez-vous est le contrat.',
          'Tu as besoin de temps pour faire confiance, puis tu restes.',
          'Tu n’aimes pas qu’on change les règles sans prévenir.',
        ],
        [
          'Prefieres un ritmo estable a picos de intensidad.',
          'Te sostienes si te esperan — la cita es el contrato.',
          'Necesitas tiempo para confiar, y luego te quedas.',
          'No te gusta que cambien las reglas sin avisar.',
        ],
      ),
      strengths: lines(
        [
          'Fidélité : une fois engagée pour de vrai, tu ne zappes pas pour le fun.',
          'Écoute : tu reçois une correction et tu l’intègres.',
          'Patience avec le processus — tu n’as pas besoin de tout tout de suite.',
          'Soutien aux autres : tu fais tenir un groupe.',
          'Sens du rythme : tu sais ce qu’est une habitude, pas un exploit.',
        ],
        [
          'Fidelidad: una vez comprometida de verdad, no saltas por diversión.',
          'Escucha: recibes una corrección y la integras.',
          'Paciencia con el proceso — no necesitas todo ya.',
          'Sostén a las demás: haces que un grupo aguante.',
          'Sentido del ritmo: sabes lo que es un hábito, no una hazaña.',
        ],
      ),
      limits: lines(
        [
          'Tu dis trop rarement non : tu déplaces ton créneau « pour les autres ».',
          'Tu évites le conflit jusqu’à disparaitre plutôt que de demander.',
          'Tu peux rester trop longtemps dans un cadre qui ne te convient plus.',
          'Seule, tu interprètes le silence comme une preuve que tu ne comptes pas.',
        ],
        [
          'Dices que no demasiado poco: mueves tu horario « por las demás ».',
          'Evitas el conflicto hasta desaparecer en vez de pedir.',
          'Puedes quedarte demasiado en un marco que ya no te sirve.',
          'Sola, interpretas el silencio como prueba de que no cuentas.',
        ],
      ),
      underStress: lines(
        [
          'Tu t’effaces. Tu dis que ça va. Tu ranges le sujet.',
          'Tu te charges de culpabilité plutôt que de demander un ajustement.',
          'Tu cherches l’harmonie… en te sacrifiant.',
          'Le risque : un abandon silencieux, lu de l’extérieur comme de l’indifférence.',
        ],
        [
          'Te borras. Dices que estás bien. Guardas el tema.',
          'Cargas culpa en vez de pedir un ajuste.',
          'Buscas armonía… sacrificándote.',
          'El riesgo: un abandono silencioso, leído desde fuera como indiferencia.',
        ],
      ),
      fears: lines(
        [
          'Être seule à nouveau — et tout faire tomber.',
          'Le conflit, le jugement, « déranger ».',
          'Un changement brutal de cadre.',
          'Décevoir quelqu’un à qui tu t’es liée.',
        ],
        [
          'Volver a estar sola — y dejarlo caer todo.',
          'El conflicto, el juicio, « molestar ».',
          'Un cambio brusco de marco.',
          'Defraudar a alguien con quien te vinculaste.',
        ],
      ),
      needs: lines(
        [
          'Un rendez-vous humain : être attendue, pas surveillée.',
          'De la prévisibilité : mêmes jours, même voix, même lieu (même en visio).',
          'Une correction douce et claire — jamais une humiliation.',
          'Le droit de rater sans que le lien se casse.',
        ],
        [
          'Una cita humana: que te esperen, no que te vigilen.',
          'Previsibilidad: mismos días, misma voz, mismo lugar (aunque sea visio).',
          'Una corrección suave y clara — nunca una humillación.',
          'El derecho a fallar sin que se rompa el vínculo.',
        ],
      ),
      howToTalk: lines(
        [
          'Parle calmement. Pose le cadre, puis rassure sur le lien.',
          'Montre que tu l’attends — concrètement, pas en slogan.',
          'Corrige sans théâtraliser. Une phrase nette suffit.',
          'Donne du temps. La confiance se construit en semaines, pas en une séance.',
        ],
        [
          'Habla con calma. Pon el marco, luego tranquiliza el vínculo.',
          'Muestra que la esperas — en concreto, no en eslogan.',
          'Corrige sin teatralizar. Una frase nítida basta.',
          'Da tiempo. La confianza se construye en semanas, no en una sesión.',
        ],
      ),
      howNotToTalk: lines(
        [
          'Ne la mets pas en compétition, ni en lumière forcée.',
          'N’utilise pas la pression ni le « si tu ne viens pas, tant pis ».',
          'Évite les changements de dernière minute sans explication.',
          'Ne la traite pas de « trop sensible » : tu casses le contrat.',
        ],
        [
          'No la pongas en competición ni en un foco forzado.',
          'No uses presión ni el « si no vienes, da igual ».',
          'Evita cambios de última hora sin explicación.',
          'No la trates de « demasiado sensible »: rompes el contrato.',
        ],
      ),
      develop: lines(
        [
          'Oser demander (un créneau, une correction, de l’aide) avant de disparaitre.',
          'Protéger ton rendez-vous comme tu protèges celui des autres.',
          'Comprendre que le lien n’est pas une faiblesse : c’est ton levier — à condition qu’il soit réel.',
        ],
        [
          'Atreverte a pedir (un horario, una corrección, ayuda) antes de desaparecer.',
          'Proteger tu cita como proteges la de las demás.',
          'Entender que el vínculo no es debilidad: es tu palanca — si es real.',
        ],
      ),
    },
    bridge: t(
      'FitMangas n’est pas « plus de vidéos ». C’est être attendue, corrigée, vue — pour ne plus abandonner seule. L’essai 7 jours te fait tester ce lien, pas ta volonté.',
      'FitMangas no es « más vídeos ». Es ser esperada, corregida, vista — para no abandonar sola. La prueba 7 días testea ese vínculo, no tu voluntad.',
    ),
    shareLine: t(
      'Mon profil de discipline : Assidue (A) — La Fidèle.',
      'Mi perfil de disciplina: Constante (A) — La Fiel.',
    ),
  }),
  discReport({
    id: 'bleu',
    letter: 'M',
    styleName: t('La Précise', 'La Precisa'),
    title: t('Profil Méthodique', 'Perfil Metódica'),
    tagline: t(
      'Tu tiens si c’est clair. Tu bloques si tu doutes de la qualité.',
      'Te sostienes si está claro. Te bloqueas si dudas de la calidad.',
    ),
    body: lines(
      [
        'Tu t’engages quand tu comprends le système.',
        'Une vidéo floue ou un « fais comme tu sens » te fait décrocher — par exigence, pas par caprice.',
      ],
      [
        'Te comprometes cuando entiendes el sistema.',
        'Un vídeo vago o un « haz como sientas » te desconecta — por exigencia, no por capricho.',
      ],
    ),
    report: {
      portrait: lines(
        [
          'Ton style naturel, c’est la qualité. Tu veux comprendre avant d’exécuter. Un bon cadre, pour toi, a des règles, un ordre, une raison. Tu n’es pas lente : tu es précise. Tu détestes approximatif, bricolage, « on verra en route ».',
          'On te prend parfois pour quelqu’un qui « trop réfléchit ». En réalité tu as un système d’alarme anti-erreur. Mal faire, te blesser, suivre une méthode douteuse — ça te coûte plus que de ne pas commencer. Le blocage n’est pas un manque d’élan. C’est un refus de mal faire.',
          'Seule, tu peux tourner en boucle sur la technique : revoir la vidéo, douter de ton placement, ne jamais démarrer vraiment. Ou tu t’inventes un protocole trop parfait pour être tenu. Le point de bascule, c’est l’ambiguïté. Sans quelqu’un qui dit « oui, comme ça », tu restes dans le couloir.',
          'Avec les autres, tu observes d’abord. Tu poses des questions. Tu n’aimes pas l’improvisation spectaculaire. En environnement favorable (méthode stable, corrections précises, temps pour intégrer), tu es d’une régularité chirurgicale. En environnement défavorable (flou, pression, « fais-toi confiance » sans critères), tu te retires pour ne pas cautionner le désordre.',
        ],
        [
          'Tu estilo natural es la calidad. Quieres entender antes de ejecutar. Un buen marco, para ti, tiene reglas, un orden, una razón. No eres lenta: eres precisa. Detestas lo aproximado, el apaño, el « ya veremos ».',
          'A veces te toman por alguien que « piensa demasiado ». En realidad tienes una alarma anti-error. Hacerlo mal, lesionarte, seguir un método dudoso — te cuesta más que no empezar. El bloqueo no es falta de impulso. Es negarte a hacerlo mal.',
          'Sola, puedes dar vueltas a la técnica: revisas el vídeo, dudas de tu colocación, nunca empiezas de verdad. O te inventas un protocolo demasiado perfecto para sostenerlo. El punto de quiebre es la ambigüedad. Sin alguien que diga « sí, así », te quedas en el pasillo.',
          'Con los demás observas primero. Haces preguntas. No te gusta la improvisación espectacular. En un entorno favorable (método estable, correcciones precisas, tiempo para integrar), eres de una regularidad quirúrgica. En uno desfavorable (vaguedad, presión, « confía » sin criterios), te retiras para no avalar el desorden.',
        ],
      ),
      howYouWork: lines(
        [
          'Tu prépares. Tu aimes savoir la durée, l’ordre, le pourquoi.',
          'Tu tiens si les critères sont clairs : « juste » a un sens.',
          'Tu n’aimes pas être précipitée ni corrigée de façon vague.',
          'Tu respectes une expertise démontrée, pas une promesse marketing.',
        ],
        [
          'Preparas. Te gusta saber duración, orden, el porqué.',
          'Te sostienes si los criterios están claros: « bien » tiene sentido.',
          'No te gusta que te precipiten ni una corrección vaga.',
          'Respetas una pericia demostrada, no una promesa de marketing.',
        ],
      ),
      strengths: lines(
        [
          'Rigueur : tu ne bricoles pas un geste au hasard.',
          'Capacité d’analyse : tu vois ce qui casse dans un système.',
          'Qualité de l’exécution une fois le « comment » posé.',
          'Peu de relâchement sale : tu aimes bien faire.',
          'Questions utiles — tu fais monter le niveau d’un cours.',
        ],
        [
          'Rigor: no improvisas un gesto al azar.',
          'Capacidad de análisis: ves lo que rompe un sistema.',
          'Calidad de ejecución una vez claro el « cómo ».',
          'Poco descuido: te gusta hacerlo bien.',
          'Preguntas útiles — subes el nivel de una clase.',
        ],
      ),
      limits: lines(
        [
          'La paralysie par analyse : trop de conditions avant de commencer.',
          'Tu peux attendre « le bon programme » indéfiniment.',
          'Tu es dure avec toi sur la moindre imprécision.',
          'Sans feedback, tu doutes — et le doute arrête le corps.',
        ],
        [
          'Parálisis por análisis: demasiadas condiciones antes de empezar.',
          'Puedes esperar « el programa bueno » indefinidamente.',
          'Eres dura contigo ante la menor imprecisión.',
          'Sin feedback, dudas — y la duda para el cuerpo.',
        ],
      ),
      underStress: lines(
        [
          'Tu te retires dans la tête. Tu analyses. Tu contrôles encore plus.',
          'Tu cherches la faille du cadre — parfois pour ne pas t’exposer.',
          'Tu peux devenir froide, distante, « trop dans les détails ».',
          'Le risque : ne plus bouger tant que ce n’est pas parfait.',
        ],
        [
          'Te retiras a la cabeza. Analizas. Controlas aún más.',
          'Buscas la falla del marco — a veces para no exponerte.',
          'Puedes volverte fría, distante, « demasiado en los detalles ».',
          'El riesgo: no moverte hasta que sea perfecto.',
        ],
      ),
      fears: lines(
        [
          'Mal faire, te blesser, cautionner une méthode médiocre.',
          'L’ambiguïté : ne pas savoir si c’est « juste ».',
          'Être jugée sur une erreur visible.',
          'Un cadre qui change tout le temps, sans logique.',
        ],
        [
          'Hacerlo mal, lesionarte, avalar un método mediocre.',
          'La ambigüedad: no saber si está « bien ».',
          'Que te juzguen por un error visible.',
          'Un marco que cambia todo el rato, sin lógica.',
        ],
      ),
      needs: lines(
        [
          'Une méthode stable + des critères (placement, respiration, tempo).',
          'Une correction qui dit « oui, comme ça » — pas « fais-toi confiance ».',
          'Du temps pour intégrer, sans spectacle.',
          'Un cadre prévisible : horaires, format, règles du jeu.',
        ],
        [
          'Un método estable + criterios (colocación, respiración, tempo).',
          'Una corrección que diga « sí, así » — no « confía en ti ».',
          'Tiempo para integrar, sin espectáculo.',
          'Un marco predecible: horarios, formato, reglas del juego.',
        ],
      ),
      howToTalk: lines(
        [
          'Sois précise. Explique le pourquoi en une ou deux phrases, pas un roman.',
          'Donne une consigne mesurable : où est le bassin, que fait le souffle.',
          'Laisse-la observer, puis agir. Ne la précipite pas.',
          'Reconnais la qualité de son attention — c’est son honneur.',
        ],
        [
          'Sé precisa. Explica el porqué en una o dos frases, no un relato.',
          'Da una consigna medible: dónde está la pelvis, qué hace el aire.',
          'Déjala observar, luego actuar. No la precipites.',
          'Reconoce la calidad de su atención — es su honor.',
        ],
      ),
      howNotToTalk: lines(
        [
          'Évite le « fais comme tu sens » sans critère.',
          'Ne la bouscule pas : « allez, on n’est pas là pour réfléchir ».',
          'Ne vends pas du vague. Elle teste la cohérence.',
          'Ne ridiculise pas ses questions : tu perds sa confiance tout de suite.',
        ],
        [
          'Evita el « haz como sientas » sin criterio.',
          'No la empujes: « vamos, no estamos para pensar ».',
          'No vendas vaguedad. Ella prueba la coherencia.',
          'No ridiculices sus preguntas: pierdes su confianza al instante.',
        ],
      ),
      develop: lines(
        [
          'Commencer imparfaitement avec un filet (une coach) plutôt que d’attendre le protocole idéal.',
          'Traiter la correction comme une donnée, pas comme un verdict sur toi.',
          'Accepter qu’un cadre bon à 80 % tenu vaut mieux qu’un cadre parfait jamais commencé.',
        ],
        [
          'Empezar imperfecta con una red (una coach) en vez de esperar el protocolo ideal.',
          'Tratar la corrección como un dato, no como un veredicto sobre ti.',
          'Aceptar que un marco bueno al 80 % sostenido vale más que uno perfecto nunca empezado.',
        ],
      ),
    },
    bridge: t(
      'La correction en direct en visio, c’est exactement ton levier : moins de doute, plus de continuité. L’essai 7 jours te permet de tester la méthode — pas de « te lancer au feeling ».',
      'La corrección en directo en visio es tu palanca: menos duda, más continuidad. La prueba 7 días te deja testear el método — no « lanzarte al feeling ».',
    ),
    shareLine: t(
      'Mon profil de discipline : Méthodique (M) — La Précise.',
      'Mi perfil de disciplina: Metódica (M) — La Precisa.',
    ),
  }),
];
