import { lines, type QuizReportSections } from '@/lib/quiz/types';

function R(p: QuizReportSections): QuizReportSections {
  return p;
}

/** Rapports longs pour les 4 autres évaluations — même contrat que le DISC : elle apprend. */
export const EXTRA_REPORTS: Record<string, Record<string, QuizReportSections>> = {
  'energie-journee': {
    matin: R({
      portrait: lines(
        [
          'Ton meilleur carburant arrive tôt. Ce n’est pas une morale (« les gens sérieux se lèvent à 6h »). C’est une carte : le matin, tu as encore de la clarté, de la décision, parfois même de l’élan. Le soir, tu n’es pas « faible ». Tu es déjà dépensée.',
          'Les programmes « quand tu peux » te trahissent. Ils te poussent à poser le créneau au moment où tu n’as plus rien — puis à te juger. Seule, tu négocies avec toi-même à 21h. Avec un rendez-vous le matin, tu n’as plus à négocier.',
        ],
        [
          'Tu mejor combustible llega temprano. No es una moral (« la gente seria se levanta a las 6h »). Es un mapa: por la mañana aún tienes claridad, decisión, a veces impulso. Por la noche no eres « débil ». Ya estás gastada.',
          'Los programas « cuando puedas » te traicionan. Te empujan a poner el horario cuando ya no te queda nada — y luego a juzgarte. Sola, negocias contigo a las 21h. Con una cita por la mañana, ya no negocias.',
        ],
      ),
      howYouWork: lines(
        ['Tu décides mieux avant que le jour ne se remplisse.', 'Tu tiens si le créneau est protégé comme un RDV, pas « si j’ai le temps ».', 'Le soir, tu as besoin de moins, pas de plus d’exigence.'],
        ['Decides mejor antes de que el día se llene.', 'Te sostienes si el horario está protegido como una cita, no « si tengo tiempo ».', 'Por la noche necesitas menos, no más exigencia.'],
      ),
      strengths: lines(
        ['Clarté matinale', 'Capacité à enclencher avant les demandes des autres', 'Peu besoin de « se motiver » si le créneau est tôt'],
        ['Claridad matutina', 'Capacidad de arrancar antes de las demandas ajenas', 'Poca necesidad de « motivarte » si el horario es temprano'],
      ),
      limits: lines(
        ['Te juger le soir comme si tu avais encore le même carburant', 'Accepter des créneaux tardifs « pour faire plaisir »', 'Croire que rater le matin = rater la semaine'],
        ['Juzgarte por la noche como si tuvieras el mismo combustible', 'Aceptar horarios tardíos « para caerle bien a alguien »', 'Creer que fallar la mañana = fallar la semana'],
      ),
      underStress: lines(
        ['Tu compresses : plus tôt, plus dur — parfois trop.', 'Ou tu lâches tout le soir en te disant que tu as « déjà perdu ».'],
        ['Comprimes: más temprano, más duro — a veces demasiado.', 'O sueltas toda la noche diciéndote que « ya perdiste ».'],
      ),
      fears: lines(
        ['Perdre la fenêtre du matin', 'Devenir dépendante d’un rythme que la maison casse'],
        ['Perder la ventana de la mañana', 'Volverte dependiente de un ritmo que la casa rompe'],
      ),
      needs: lines(
        ['Un créneau tôt, non négociable', 'Quelqu’un au rendez-vous — pas une alarme seule', 'La permission de ne pas « rattraper » le soir'],
        ['Un horario temprano, no negociable', 'Alguien en la cita — no una alarma sola', 'Permiso de no « recuperar » por la noche'],
      ),
      howToTalk: lines(
        ['Parle d’ancrage, pas de mérite.', 'Propose un horaire tôt et tiens-le.', 'Ne la pousse pas à performer à 20h pour « se rattraper ».'],
        ['Habla de anclaje, no de mérito.', 'Propón un horario temprano y cúmplelo.', 'No la empujes a rendir a las 20h para « recuperar ».'],
      ),
      howNotToTalk: lines(
        ['« Les vraies sportives s’entraînent le soir aussi. »', '« Tu n’as qu’à te motiver. »'],
        ['« Las deportistas de verdad también entrenan de noche. »', '« Solo tienes que motivarte. »'],
      ),
      develop: lines(
        ['Protéger le matin comme un client.', 'Arrêter de mesurer ta valeur sur les soirs ratés.'],
        ['Proteger la mañana como a un cliente.', 'Dejar de medir tu valor en las noches fallidas.'],
      ),
    }),
    plateau: R({
      portrait: lines(
        [
          'Tu n’as pas un pic. Tu as une ligne. Tu tiens si le rythme ne te trahit pas — ni trop tôt dans l’exploit, ni trop tard dans le flou. Les programmes « boom motivationnel » te fatiguent : tu n’es pas une fusée, tu es un train. Et un train a besoin d’horaires.',
          'Seule, tu glisses vers le « un peu plus tard », puis vers rien. Ce n’est pas de l’inconstance. C’est l’absence de rails. Avec un cadre régulier, tu es solide — souvent plus que les profils spectaculaires.',
        ],
        [
          'No tienes un pico. Tienes una línea. Te sostienes si el ritmo no te traiciona — ni demasiado pronto en la hazaña, ni demasiado tarde en lo vago. Los programas « boom motivacional » te cansan: no eres un cohete, eres un tren. Y un tren necesita horarios.',
          'Sola, te deslizas hacia « un poco más tarde », luego a nada. No es inconstancia. Es ausencia de rieles. Con un marco regular, eres sólida — a menudo más que los perfiles espectaculares.',
        ],
      ),
      howYouWork: lines(
        ['Tu aimes la dose, pas le drame.', 'Tu tiens sur la répétition.', 'Les à-coups (trop / rien) te cassent plus que la difficulté.'],
        ['Te gusta la dosis, no el drama.', 'Te sostienes en la repetición.', 'Los tirones (demasiado / nada) te rompen más que la dificultad.'],
      ),
      strengths: lines(
        ['Régularité naturelle dès que le cadre est posé', 'Peu de besoin de spectacle', 'Bonne lecture de ce qui est tenable'],
        ['Regularidad natural en cuanto hay marco', 'Poca necesidad de espectáculo', 'Buena lectura de lo sostenible'],
      ),
      limits: lines(
        ['Sans rails, tu disparais sans bruit', 'Tu peux rester trop longtemps dans un rythme « presque »'],
        ['Sin rieles, desapareces sin ruido', 'Puedes quedarte demasiado en un ritmo « casi »'],
      ),
      underStress: lines(
        ['Tu aplatis encore plus : moins d’amplitude, plus de survie.', 'Ou tu acceptes trop de décalages « exceptionnels ».'],
        ['Aún aplanas más: menos amplitud, más supervivencia.', 'O aceptas demasiados desvíos « excepcionales ».'],
      ),
      fears: lines(
        ['Un agenda qui casse la ligne', 'Qu’on te demande d’être une autre (plus « feu » ou plus « 5h du mat »)' ],
        ['Una agenda que rompa la línea', 'Que te pidan ser otra (más « fuego » o más « a las 5h »)' ],
      ),
      needs: lines(
        ['Un créneau répétitif, même jour, même heure', 'Peu de surprises', 'Une coach qui tient le rythme avec toi'],
        ['Un horario repetido, mismo día, misma hora', 'Pocas sorpresas', 'Una coach que sostenga el ritmo contigo'],
      ),
      howToTalk: lines(
        ['Parle de rythme, de rails, de tenable.', 'Ne vends pas l’exploit.'],
        ['Habla de ritmo, rieles, lo sostenible.', 'No vendas la hazaña.'],
      ),
      howNotToTalk: lines(
        ['« Il faut te dépasser. »', '« Change d’heure toutes les semaines. »'],
        ['« Tienes que superarte. »', '« Cambia de hora cada semana. »'],
      ),
      develop: lines(
        ['Traiter le créneau comme une infrastructure, pas une envie.', 'Dire non aux exceptions qui deviennent la règle.'],
        ['Tratar el horario como infraestructura, no como ganas.', 'Decir no a las excepciones que se vuelven regla.'],
      ),
    }),
    soir: R({
      portrait: lines(
        [
          'Tu t’allumes plus tard. Le matin n’est pas ton champ de bataille — et te forcer à 7h te fait échouer avant même de commencer. Ce n’est pas de la paresse. C’est une horloge. Beaucoup de programmes t’ont déjà fait te haïr là-dessus.',
          'Le piège, c’est « ce soir » sans rendez-vous. Sans quelqu’un au bout, le soir se remplit d’écran, de charge, de « demain ». Ton énergie tardive a besoin d’un contenant, pas d’une intention.',
        ],
        [
          'Te enciendes más tarde. La mañana no es tu campo de batalla — y forzarte a las 7h te hace fallar antes de empezar. No es pereza. Es un reloj. Muchos programas ya te hicieron odiarte por eso.',
          'La trampa es « esta noche » sin cita. Sin alguien al otro lado, la noche se llena de pantalla, de carga, de « mañana ». Tu energía tardía necesita un contenedor, no una intención.',
        ],
      ),
      howYouWork: lines(
        ['Tu as de la clarté quand d’autres sont déjà vides.', 'Tu tiens si le créneau est tardif ET tenu.', 'Le matin, tu as besoin de douceur, pas d’un test de caractère.'],
        ['Tienes claridad cuando otras ya están vacías.', 'Te sostienes si el horario es tardío Y se cumple.', 'Por la mañana necesitas suavidad, no un test de carácter.'],
      ),
      strengths: lines(
        ['Seconde vague réelle', 'Capacité à bouger après le travail si le cadre est là', 'Peu d’illusion sur le « je me lèverai plus tôt »'],
        ['Segunda ola real', 'Capacidad de moverte después del trabajo si hay marco', 'Poca ilusión sobre « me levantaré más temprano »'],
      ),
      limits: lines(
        ['« Ce soir » sans filet devient jamais', 'Culpabilité matinale inutile', 'Accepter des défis 6h pour « être sérieuse »'],
        ['« Esta noche » sin red se vuelve nunca', 'Culpa matutina inútil', 'Aceptar retos a las 6h para « ser seria »'],
      ),
      underStress: lines(
        ['Tu recules le créneau jusqu’à le perdre.', 'Tu te juges sur des matins qui n’étaient pas le contrat.'],
        ['Retrasas el horario hasta perderlo.', 'Te juzgas por mañanas que no eran el contrato.'],
      ),
      fears: lines(
        ['Qu’on te dise que tu n’es pas disciplinée parce que tu n’es pas du matin', 'Que le soir soit toujours « trop tard » pour un vrai cours'],
        ['Que te digan que no eres disciplinada porque no eres mañanera', 'Que la noche sea siempre « demasiado tarde » para una clase de verdad'],
      ),
      needs: lines(
        ['Un créneau fin d’après-midi / soir, réel, avec une présence', 'Ne plus se battre contre une horloge qui n’est pas la tienne'],
        ['Un horario de tarde/noche, real, con presencia', 'Dejar de pelear contra un reloj que no es el tuyo'],
      ),
      howToTalk: lines(
        ['Respecte son horloge.', 'Propose un vrai soir, pas un « on verra ».'],
        ['Respeta su reloj.', 'Propón una noche de verdad, no un « ya veremos ».'],
      ),
      howNotToTalk: lines(
        ['« Il suffit de se coucher plus tôt. »', '« Tout le monde peut le matin. »'],
        ['« Basta con acostarse más temprano. »', '« Todo el mundo puede por la mañana. »'],
      ),
      develop: lines(
        ['Arrêter de vouloir un profil matinal pour « mériter ».', 'Verrouiller le soir comme un rendez-vous, pas une option.'],
        ['Dejar de querer un perfil matutino para « merecer ».', 'Cerrar la noche como una cita, no como una opción.'],
      ),
    }),
    crash: R({
      portrait: lines(
        [
          'Vers le milieu / fin d’après-midi, ton système bascule. Ce n’est pas de la paresse. C’est un système nerveux qui coupe le volume : écran, sucre, canapé, culpabilité. Tu te juges sur ta « motivation » alors que tu es en mode survie.',
          'Seule, tu choisis souvent l’écran. Un rendez-vous à cet horaire-là — ou juste avant — contourne le crash. Ce n’est pas te transformer. C’est placer le cadre là où le trou s’ouvre.',
        ],
        [
          'Hacia media / final de tarde, tu sistema se vuelca. No es pereza. Es un sistema nervioso que baja el volumen: pantalla, azúcar, sofá, culpa. Te juzgas por tu « motivación » cuando estás en supervivencia.',
          'Sola, a menudo eliges la pantalla. Una cita a esa hora — o justo antes — esquiva el bajón. No es transformarte. Es poner el marco donde se abre el hueco.',
        ],
      ),
      howYouWork: lines(
        ['Tu as des fenêtres. Le crash en est une, prévisible.', 'Tu tiens si quelqu’un te sort du trou — pas si tu te sermones.', 'Le jugement (« je suis nulle ») empire le crash.'],
        ['Tienes ventanas. El bajón es una, previsible.', 'Te sostienes si alguien te saca del hueco — no si te sermoneas.', 'El juicio (« soy inútil ») empeora el bajón.'],
      ),
      strengths: lines(
        ['Lucidité sur le pattern dès qu’on le nomme', 'Capacité à tenir un créneau si le filet est là', 'Pas besoin d’un mythe de volonté infinie'],
        ['Lucidez sobre el patrón en cuanto se nombra', 'Capacidad de sostener un horario si hay red', 'No necesitas el mito de la voluntad infinita'],
      ),
      limits: lines(
        ['Te juger au lieu de cartographier', 'Laisser le 15h décider de la semaine', 'Compenser par trop (ou rien)'],
        ['Juzgarte en vez de mapear', 'Dejar que las 15h decidan la semana', 'Compensar con demasiado (o nada)'],
      ),
      underStress: lines(
        ['Le crash s’élargit : plus tôt, plus fort.', 'Tu disparais et tu reviens en te punissant.'],
        ['El bajón se ensancha: más temprano, más fuerte.', 'Desapareces y vuelves castigándote.'],
      ),
      fears: lines(
        ['Que « ça » soit ta vraie nature', 'Ne plus jamais retrouver d’élan dans la journée'],
        ['Que « eso » sea tu verdadera naturaleza', 'No volver a encontrar impulso en el día'],
      ),
      needs: lines(
        ['Un créneau qui anticipe le trou, pas qui le combat après', 'Être vue à ce moment-là', 'Un langage sans insulte (ni paresse, ni faiblesse)'],
        ['Un horario que anticipe el hueco, no que lo combata después', 'Ser vista en ese momento', 'Un lenguaje sin insulto (ni pereza ni debilidad)'],
      ),
      howToTalk: lines(
        ['Nomme le système nerveux, pas le caractère.', 'Propose un ancrage avant le crash.'],
        ['Nombra el sistema nervioso, no el carácter.', 'Propón un anclaje antes del bajón.'],
      ),
      howNotToTalk: lines(
        ['« Bouge un peu, tu te sentiras mieux » sans filet.', '« C’est dans ta tête. »'],
        ['« Muévete un poco, te sentirás mejor » sin red.', '« Está en tu cabeza. »'],
      ),
      develop: lines(
        ['Traiter le crash comme une donnée d’agenda, pas une honte.', 'Mettre le rendez-vous avant le trou.'],
        ['Tratar el bajón como un dato de agenda, no como vergüenza.', 'Poner la cita antes del hueco.'],
      ),
    }),
  },
  'seule-face-au-tapis': {
    securise: R({
      portrait: lines(
        [
          'Tu sais déjà adapter. Tu n’es pas en guerre contre toi. Ce qui te freine, c’est de tout porter seule trop longtemps : même un système sécure s’érode dans le silence. Un rendez-vous humain te solidifie sans te dramatiser.',
          'Tu n’as pas besoin qu’on te « répare ». Tu as besoin d’un cadre qui tient, pour ne pas avoir à être ta propre coach, ta propre juge et ta propre copine.',
        ],
        [
          'Ya sabes adaptar. No estás en guerra contigo. Lo que te frena es cargar todo sola demasiado tiempo: incluso un sistema seguro se erosiona en el silencio. Una cita humana te solidifica sin dramatizar.',
          'No necesitas que te « reparen ». Necesitas un marco que aguante, para no tener que ser tu propia coach, tu propia juez y tu propia amiga.',
        ],
      ),
      howYouWork: lines(
        ['Tu ajustes plutôt que de tout lâcher.', 'Tu tiens mieux avec clarté + un peu de souplesse.', 'Le solo prolongé te fatigue plus que la difficulté.'],
        ['Ajustas en vez de soltarlo todo.', 'Te sostienes mejor con claridad + un poco de flexibilidad.', 'Lo solo prolongado te cansa más que la dificultad.'],
      ),
      strengths: lines(
        ['Lucidité', 'Capacité d’adaptation', 'Peu de théâtre intérieur'],
        ['Lucidez', 'Capacidad de adaptación', 'Poco teatro interior'],
      ),
      limits: lines(
        ['Sous-estimer le besoin d’être vue', 'Tout porter « parce que je peux »'],
        ['Subestimar la necesidad de ser vista', 'Cargarlo todo « porque puedo »'],
      ),
      underStress: lines(
        ['Tu continues, un peu trop seule, jusqu’à la rupture sèche.'],
        ['Sigues, un poco demasiado sola, hasta el corte seco.'],
      ),
      fears: lines(
        ['Devenir dépendante', 'Perdre la simplicité que tu as construite'],
        ['Volverte dependiente', 'Perder la simpleza que construiste'],
      ),
      needs: lines(
        ['Un cadre clair', 'Un lien sans drame', 'Ne plus être la seule responsable de la continuité'],
        ['Un marco claro', 'Un vínculo sin drama', 'Dejar de ser la única responsable de la continuidad'],
      ),
      howToTalk: lines(
        ['Sobre, concret.', 'Propose un créneau, pas une transformation de personnalité.'],
        ['Sobria, concreta.', 'Propón un horario, no una transformación de personalidad.'],
      ),
      howNotToTalk: lines(
        ['« Tu n’as pas vraiment besoin d’aide. »'],
        ['« En realidad no necesitas ayuda. »'],
      ),
      develop: lines(
        ['Accepter le filet avant d’être à bout.'],
        ['Aceptar la red antes de estar al límite.'],
      ),
    }),
    anxieux: R({
      portrait: lines(
        [
          'Tu transformes souvent la pratique en preuve. Rate = jugement. Ce n’est pas un manque de volonté. C’est un système qui s’alarme : il faut être à la hauteur, visible, « bien ». Seule, l’alarme monte. Avec quelqu’un qui te voit sans te juger, elle baisse — et tu tiens.',
          'Le piège : surcompenser, puis craquer, puis te confirmer que tu es « trop ». Faux. Tu as besoin d’un regard stable, pas d’une barre plus haute.',
        ],
        [
          'A menudo conviertes la práctica en prueba. Fallar = juicio. No es falta de voluntad. Es un sistema que se alarma: hay que estar a la altura, visible, « bien ». Sola, la alarma sube. Con alguien que te ve sin juzgarte, baja — y te sostienes.',
          'La trampa: sobrecompensar, luego quebrarte, luego confirmarte que eres « demasiado ». Falso. Necesitas una mirada estable, no un listón más alto.',
        ],
      ),
      howYouWork: lines(
        ['Tu t’engages fort.', 'Tu lis les absences comme des verdicts.', 'Tu as besoin d’être rassurée concrètement, pas en slogan.'],
        ['Te comprometes fuerte.', 'Lees las ausencias como veredictos.', 'Necesitas que te tranquilicen en concreto, no en eslogan.'],
      ),
      strengths: lines(
        ['Implication réelle', 'Sens du détail relationnel', 'Capacité à progresser dès que le danger baisse'],
        ['Implicación real', 'Sentido del detalle relacional', 'Capacidad de progresar en cuanto baja el peligro'],
      ),
      limits: lines(
        ['Pression interne', 'Lecture catastrophique d’un raté', 'Besoin d’approbation qui épuise'],
        ['Presión interna', 'Lectura catastrófica de un fallo', 'Necesidad de aprobación que agota'],
      ),
      underStress: lines(
        ['Tu forces. Tu te parles mal. Tu as peur qu’on te voie « moins bien ».'],
        ['Fuerzas. Te hablas mal. Temes que te vean « peor ».'],
      ),
      fears: lines(
        ['Ne pas être à la hauteur', 'Être abandonnée si tu rates'],
        ['No estar a la altura', 'Que te abandonen si fallas'],
      ),
      needs: lines(
        ['Un regard sans verdict', 'Le droit de rater sans rompre le lien', 'Des consignes claires plutôt que « dépasse-toi »'],
        ['Una mirada sin veredicto', 'Derecho a fallar sin romper el vínculo', 'Consignas claras en vez de « supérate »'],
      ),
      howToTalk: lines(
        ['Calme, précis, prévisible.', 'Nomme ce qui est bien sans en faire une évaluation de ta personne.'],
        ['Calma, precisa, previsible.', 'Nombra lo que está bien sin evaluar a la persona.'],
      ),
      howNotToTalk: lines(
        ['« Tu te prends trop la tête. »', 'Le silence après une absence.'],
        ['« Te lo tomas demasiado. »', 'El silencio después de una ausencia.'],
      ),
      develop: lines(
        ['Séparer le geste du verdict sur toi.', 'Laisser quelqu’un tenir le cadre pendant que l’alarme baisse.'],
        ['Separar el gesto del veredicto sobre ti.', 'Dejar que alguien sostenga el marco mientras baja la alarma.'],
      ),
    }),
    evitant: R({
      portrait: lines(
        [
          'Quand ça pèse, tu te retires — pour te protéger. Tu n’es pas « paresseuse ». Tu prends de la distance quand le cadre devient trop chargé, trop exposé, trop demandant. Seule, tu disparais facilement : personne ne le sait, donc ça « va ». Sauf que ça ne va pas.',
          'Tu as besoin d’un lien léger mais régulier. Trop de pression et tu sors. Trop de silence et tu sors aussi. Le dosage, c’est un rendez-vous sans harcèlement.',
        ],
        [
          'Cuando pesa, te retiras — para protegerte. No eres « perezosa ». Tomas distancia cuando el marco se vuelve demasiado cargado, expuesto, demandante. Sola, desapareces fácil: nadie lo sabe, así que « está bien ». Salvo que no lo está.',
          'Necesitas un vínculo ligero pero regular. Demasiada presión y sales. Demasiado silencio y también sales. La dosis es una cita sin acoso.',
        ],
      ),
      howYouWork: lines(
        ['Tu as besoin d’air.', 'Tu tiens si on ne te coince pas.', 'Tu reviens si le lien reste ouvert après une absence.'],
        ['Necesitas aire.', 'Te sostienes si no te acorralan.', 'Vuelves si el vínculo sigue abierto después de una ausencia.'],
      ),
      strengths: lines(
        ['Autonomie', 'Lecture fine de la surcharge', 'Capacité à revenir sans théâtre si on t’ouvre la porte'],
        ['Autonomía', 'Lectura fina de la sobrecarga', 'Capacidad de volver sin teatro si te abren la puerta'],
      ),
      limits: lines(
        ['Disparition comme unique soupape', 'Reporter jusqu’à ce que le sujet meure'],
        ['Desaparición como única válvula', 'Posponer hasta que el tema muera'],
      ),
      underStress: lines(
        ['Tu ranges. Tu changes de sujet. Tu te rends indisponible.'],
        ['Guardas. Cambias de tema. Te vuelves indisponible.'],
      ),
      fears: lines(
        ['Être coincée', 'Être jugée', 'Qu’on fasse de toi un dossier'],
        ['Quedarte atrapada', 'Que te juzguen', 'Que te conviertan en un expediente'],
      ),
      needs: lines(
        ['Un cadre souple et tenu', 'Pas de traque', 'Une présence discrète qui empêche le silence total'],
        ['Un marco flexible y sostenido', 'Sin acoso', 'Una presencia discreta que impida el silencio total'],
      ),
      howToTalk: lines(
        ['Léger, concret, sans procès.', '« On t’attend mardi » suffit souvent.'],
        ['Ligera, concreta, sin juicio.', '« Te esperamos el martes » suele bastar.'],
      ),
      howNotToTalk: lines(
        ['« Il faut t’engager. »', 'Les relances culpabilisantes.'],
        ['« Tienes que comprometerte. »', 'Los recordatorios culpabilizadores.'],
      ),
      develop: lines(
        ['Revenir après une absence sans tout expliquer.', 'Accepter un filet qui n’étouffe pas.'],
        ['Volver después de una ausencia sin explicarlo todo.', 'Aceptar una red que no ahogue.'],
      ),
    }),
    desorganise: R({
      portrait: lines(
        [
          'Tu veux et tu fuis. Les semaines « tout » suivies des semaines « rien » ne sont pas un hasard : le solo amplifie le yo-yo. Un jour tu as besoin d’être tenue, le lendemain tu as besoin de disparaître. Ce n’est pas de la comédie. C’est un système sans contenant.',
          'Tu as besoin d’un cadre stable qui ne bascule pas avec toi. Ni trop de fusion, ni trop de vide. Être vue chaque semaine calme l’oscillation mieux qu’une énième promesse à toi-même.',
        ],
        [
          'Quieres y huyes. Las semanas « todo » seguidas de « nada » no son casualidad: lo solo amplifica el yo-yo. Un día necesitas que te sostengan, al siguiente necesitas desaparecer. No es comedia. Es un sistema sin contenedor.',
          'Necesitas un marco estable que no se vuelque contigo. Ni demasiada fusión ni demasiado vacío. Ser vista cada semana calma la oscilación mejor que otra promesa a ti misma.',
        ],
      ),
      howYouWork: lines(
        ['Tu oscilles.', 'Tu tiens si le cadre ne change pas de température toutes les 48h.', 'Tu as besoin qu’on ne te laisse pas seule avec le bascule.'],
        ['Oscilas.', 'Te sostienes si el marco no cambia de temperatura cada 48h.', 'Necesitas que no te dejen sola con el vaivén.'],
      ),
      strengths: lines(
        ['Intensité du désir de bien faire', 'Sensibilité', 'Capacité à t’attacher fort à un cadre dès qu’il est sûr'],
        ['Intensidad del deseo de hacerlo bien', 'Sensibilidad', 'Capacidad de apegarte fuerte a un marco en cuanto es seguro'],
      ),
      limits: lines(
        ['Yo-yo', 'Décisions contradictoires', 'Honter le creux'],
        ['Yo-yo', 'Decisiones contradictorias', 'Avergonzarte del bajón'],
      ),
      underStress: lines(
        ['Tout ou rien. Inscription / disparition. Discours dur puis silence.'],
        ['Todo o nada. Alta / desaparición. Discurso duro y luego silencio.'],
      ),
      fears: lines(
        ['Être « trop »', 'Être lâchée', 'Ne jamais trouver un rythme'],
        ['Ser « demasiado »', 'Que te suelten', 'No encontrar nunca un ritmo'],
      ),
      needs: lines(
        ['Un contenant prévisible', 'Quelqu’un qui ne panique pas quand tu oscilles', 'Des règles simples'],
        ['Un contenedor previsible', 'Alguien que no entre en pánico cuando oscilas', 'Reglas simples'],
      ),
      howToTalk: lines(
        ['Posé, répétitif, sans surplus émotionnel.', 'Le même rendez-vous. La même voix.'],
        ['Serena, repetida, sin exceso emocional.', 'La misma cita. La misma voz.'],
      ),
      howNotToTalk: lines(
        ['Entrer dans le yo-yo avec elle.', '« Décide-toi. »'],
        ['Entrar en el yo-yo con ella.', '« Decídete. »'],
      ),
      develop: lines(
        ['Laisser le cadre durer plus que l’humeur.', 'Ne plus gérer seule le bascule.'],
        ['Dejar que el marco dure más que el humor.', 'Dejar de gestionar sola el vaivén.'],
      ),
    }),
  },
  'carte-stress': {
    machoires: R({
      portrait: lines(
        [
          'Ton stress monte vers le haut : mâchoire, nuque, tempes. Ce n’est pas « juste une nuque ». C’est souvent de la charge mentale — ce que tu ne dis pas, ce que tu tiens, ce que tu serres. Seule, tu peux forcer encore (étirements agressifs, « je desserre ») sans relâcher vraiment.',
          'Une correction en direct te fait sentir le moment où tu serres. C’est ça, la régulation : un regard + une consigne, pas un diagnostic médical (ce test n’en est pas un).',
        ],
        [
          'Tu estrés sube: mandíbula, nuca, sienes. No es « solo la nuca ». A menudo es carga mental — lo que no dices, lo que aguantas, lo que aprietas. Sola puedes forzar más (estiramientos agresivos, « suelto ») sin soltar de verdad.',
          'Una corrección en directo te hace sentir el momento en que aprietas. Esa es la regulación: una mirada + una consigna, no un diagnóstico médico (este test no lo es).',
        ],
      ),
      howYouWork: lines(
        ['Tu « tiens » avec le haut du corps.', 'Tu as besoin de ralentir le rythme de la mâchoire autant que le geste.'],
        ['« Aguantas » con la parte alta.', 'Necesitas frenar el ritmo de la mandíbula tanto como el gesto.'],
      ),
      strengths: lines(
        ['Détermination', 'Capacité à encaisser', 'Attention aux détails'],
        ['Determinación', 'Capacidad de encajar', 'Atención al detalle'],
      ),
      limits: lines(
        ['Tension chronique haute', 'Forcer pour relâcher — le paradoxe'],
        ['Tensión crónica alta', 'Forzar para soltar — la paradoja'],
      ),
      underStress: lines(
        ['Tu serres plus. Tu parles moins. Tu dors moins bien.'],
        ['Aprietas más. Hablas menos. Duermes peor.'],
      ),
      fears: lines(
        ['Ne plus pouvoir « tenir »', 'Que le haut du corps lâche d’un coup'],
        ['Ya no poder « aguantar »', 'Que la parte alta ceda de golpe'],
      ),
      needs: lines(
        ['Un rythme plus lent', 'Quelqu’un qui voit le serre', 'Un travail qui n’ajoute pas de tension « pour fortifier »'],
        ['Un ritmo más lento', 'Alguien que vea el apriete', 'Un trabajo que no sume tensión « para fortalecer »'],
      ),
      howToTalk: lines(
        ['Doux sur le tempo, précis sur le placement.', 'Nomme le serre sans en faire un défaut.'],
        ['Suave en el tempo, precisa en la colocación.', 'Nombra el apriete sin convertirlo en un defecto.'],
      ),
      howNotToTalk: lines(
        ['« Relaxe-toi » sans montrer comment.', 'Encore plus d’intensité.'],
        ['« Relájate » sin mostrar cómo.', 'Aún más intensidad.'],
      ),
      develop: lines(
        ['Apprendre à desserrer avec un guide, pas contre toi.'],
        ['Aprender a soltar con una guía, no contra ti.'],
      ),
    }),
    ventre: R({
      portrait: lines(
        [
          'Ton stress se noue au centre : ventre, souffle court. Beaucoup de femmes « tiennent » avec le ventre contracté. Ça fatigue plus que ça protège. Les vidéos d’abdos seules empirent souvent le pattern : encore plus de retenue, encore moins d’air.',
          'Correction en direct = retrouver un centre qui respire. Pas un ventre qui combat. Ce n’est pas un diagnostic. C’est une carte de ce que tu fais déjà, toute la journée.',
        ],
        [
          'Tu estrés se anuda en el centro: vientre, aire corto. Muchas « aguantan » con el vientre contraído. Cansa más de lo que protege. Los vídeos de abs solos a menudo empeoran el patrón: más retención, menos aire.',
          'Corrección en directo = un centro que respira. No un vientre que pelea. No es un diagnóstico. Es un mapa de lo que ya haces, todo el día.',
        ],
      ),
      howYouWork: lines(
        ['Tu retiens pour tenir.', 'Tu as besoin qu’on te rende le souffle avant de te demander du « core ».'],
        ['Retienes para aguantar.', 'Necesitas que te devuelvan el aire antes de pedirte « core ».'],
      ),
      strengths: lines(
        ['Endurance mentale', 'Sens du devoir', 'Capacité à fonctionner sous charge'],
        ['Resistencia mental', 'Sentido del deber', 'Capacidad de funcionar bajo carga'],
      ),
      limits: lines(
        ['Respiration coupée', 'Confusion gainage / armure'],
        ['Respiración cortada', 'Confusión entre faja y armadura'],
      ),
      underStress: lines(
        ['Le nœud se resserre. Tu « tiens » encore plus. Tu dors avec l’estomac.'],
        ['El nudo se cierra. « Aguantas » aún más. Duermes con el estómago.'],
      ),
      fears: lines(
        ['Lâcher = tout s’effondre', 'Un ventre qui « ne tient pas »'],
        ['Soltar = que se venga abajo', 'Un vientre que « no aguanta »'],
      ),
      needs: lines(
        ['Du souffle guidé', 'Un langage sans guerre contre le ventre', 'Être vue pour ne plus forcer en silence'],
        ['Aire guiado', 'Un lenguaje sin guerra contra el vientre', 'Ser vista para dejar de forzar en silencio'],
      ),
      howToTalk: lines(
        ['Parle de souffle, de centre, de permission.', 'Pas de « rentre le ventre » mécanique.'],
        ['Habla de aire, centro, permiso.', 'Nada de « mete el vientre » mecánico.'],
      ),
      howNotToTalk: lines(
        ['La rhétorique « abdos pour être forte ».', 'Te faire honte de retenir.'],
        ['La retórica « abs para ser fuerte ».', 'Avergonzarte por retener.'],
      ),
      develop: lines(
        ['Distinguer se soutenir et s’armer.', 'Laisser quelqu’un te le faire sentir.'],
        ['Distinguir sostenerte y armarte.', 'Dejar que alguien te lo haga sentir.'],
      ),
    }),
    dos: R({
      portrait: lines(
        [
          'Ton stress porte le monde — littéralement : dos, lombaires, épaules. Bureau, charge mentale, compensation. Seule, tu « fais du renforcement » qui augmente parfois la tension : encore plus de sac sur un sac déjà plein.',
          'En visio, on te voit porter. On allonge, on ouvre, on arrête de forcer ce qui est déjà trop chargé. Encore une fois : pas un diagnostic médical. Une lecture de stratégie corporelle.',
        ],
        [
          'Tu estrés carga el mundo — literalmente: espalda, lumbares, hombros. Oficina, carga mental, compensación. Sola « haces refuerzo » que a veces aumenta la tensión: más mochila sobre una mochila llena.',
          'En visio te vemos cargar. Alargamos, abrimos, dejamos de forzar lo que ya está cargado. Otra vez: no es un diagnóstico médico. Es una lectura de estrategia corporal.',
        ],
      ),
      howYouWork: lines(
        ['Tu portes.', 'Tu as besoin qu’on décharge avant de « muscler ».'],
        ['Cargas.', 'Necesitas que te descarguen antes de « muscular ».'],
      ),
      strengths: lines(
        ['Endurance', 'Sens des responsabilités', 'Capacité à tenir une posture (parfois trop)'],
        ['Resistencia', 'Sentido de la responsabilidad', 'Capacidad de sostener una postura (a veces de más)'],
      ),
      limits: lines(
        ['Accumulation', 'Renfort qui ressemble à plus de charge'],
        ['Acumulación', 'Refuerzo que parece más carga'],
      ),
      underStress: lines(
        ['Les épaules montent. Le dos devient le dossier de tout ce qui n’est pas dit.'],
        ['Los hombros suben. La espalda se vuelve el archivo de lo no dicho.'],
      ),
      fears: lines(
        ['Le dos « lâche »', 'Devoir s’arrêter'],
        ['Que la espalda « ceda »', 'Tener que parar'],
      ),
      needs: lines(
        ['Décharger, allonger, ouvrir', 'Un œil sur la compensation', 'Un créneau qui n’ajoute pas une tâche à la liste'],
        ['Descargar, alargar, abrir', 'Un ojo en la compensación', 'Un horario que no sume otra tarea a la lista'],
      ),
      howToTalk: lines(
        ['Parle de déposer, pas de « encore plus fort ».', 'Vois la charge, pas le « mauvais dos ».'],
        ['Habla de depositar, no de « aún más fuerte ».', 'Ve la carga, no la « mala espalda ».'],
      ),
      howNotToTalk: lines(
        ['« Renforce tes lombaires » en premier réflexe.', 'Minimiser (« tout le monde a mal au dos »).'],
        ['« Refuerza lumbares » como primer reflejo.', 'Minimizar (« todo el mundo tiene dolor de espalda »).'],
      ),
      develop: lines(
        ['Arrêter de tout porter seule — y compris le tapis.'],
        ['Dejar de cargar todo sola — también el tapete.'],
      ),
    }),
    diffuse: R({
      portrait: lines(
        [
          'Ton système bascule en mode survie : le corps devient flou, figé, ou « nulle part ». Ce n’est pas de la paresse. C’est un système nerveux qui coupe le volume. Seule, tu peines à « sentir ». Avec quelqu’un qui te guide, le volume revient — lentement, sans te forcer à performer.',
          'Le rendez-vous fixe, ici, c’est de la régulation relationnelle. Plus fort qu’une vidéo motivante. Plus juste qu’un « bouge un peu ».',
        ],
        [
          'Tu sistema entra en supervivencia: el cuerpo se vuelve borroso, rígido, o « en ninguna parte ». No es pereza. Es un sistema nervioso que baja el volumen. Sola te cuesta « sentir ». Con alguien que te guía, vuelve el volumen — despacio, sin pedirte rendir.',
          'La cita fija, aquí, es regulación relacional. Más fuerte que un vídeo motivador. Más justa que un « muévete un poco ».',
        ],
      ),
      howYouWork: lines(
        ['Tu décroches du corps.', 'Tu as besoin d’un guide externe pour revenir, pas d’un défi.'],
        ['Te desconectas del cuerpo.', 'Necesitas una guía externa para volver, no un reto.'],
      ),
      strengths: lines(
        ['Sensibilité (même quand elle se coupe)', 'Capacité à revenir avec un filet', 'Honnêteté dès que le flou est nommé'],
        ['Sensibilidad (aunque se corte)', 'Capacidad de volver con una red', 'Honestidad en cuanto se nombra lo borroso'],
      ),
      limits: lines(
        ['Difficulté à initier seule', 'Jugement (« je ne sens plus rien »)'],
        ['Dificultad para iniciar sola', 'Juicio (« ya no siento nada »)'],
      ),
      underStress: lines(
        ['Le volume tombe. Tu dors trop ou plus. Tu disparais du sujet.'],
        ['Cae el volumen. Duermes demasiado o nada. Desapareces del tema.'],
      ),
      fears: lines(
        ['Rester coupée', 'Qu’on te force', 'Que ce soit « dans ta tête »'],
        ['Quedarte desconectada', 'Que te fuercen', 'Que « esté en tu cabeza »'],
      ),
      needs: lines(
        ['Un cadre très simple', 'Une voix', 'Zéro humiliation', 'Du temps'],
        ['Un marco muy simple', 'Una voz', 'Cero humillación', 'Tiempo'],
      ),
      howToTalk: lines(
        ['Lent, concret, une consigne à la fois.', 'Présence > performance.'],
        ['Lenta, concreta, una consigna cada vez.', 'Presencia > rendimiento.'],
      ),
      howNotToTalk: lines(
        ['« Réveille-toi. »', '« Tu n’es pas concentrée. »'],
        ['« Despierta. »', '« No estás concentrada. »'],
      ),
      develop: lines(
        ['Traiter le flou comme un signal, pas une identité.', 'Revenir par le lien, pas par la force.'],
        ['Tratar lo borroso como una señal, no como identidad.', 'Volver por el vínculo, no por la fuerza.'],
      ),
    }),
  },
  'je-rate-puis': {
    culpa: R({
      portrait: lines(
        [
          'Tu rates — puis tu te punis. Le problème n’est pas le créneau manqué. C’est la voix qui suit. Cette voix te pousse souvent à abandonner encore plus : si tu es déjà « nulle », autant tout lâcher. Un cadre bienveillant (être vue, corrigée) coupe la punition.',
          'Tu n’as pas besoin d’un discours motivationnel. Tu as besoin qu’un raté ne devienne pas un verdict.',
        ],
        [
          'Fallas — y luego te castigas. El problema no es el horario perdido. Es la voz que sigue. Esa voz a menudo te empuja a abandonar aún más: si ya eres « inútil », mejor soltarlo todo. Un marco amable (ser vista, corregida) corta el castigo.',
          'No necesitas un discurso motivacional. Necesitas que un fallo no se vuelva un veredicto.',
        ],
      ),
      howYouWork: lines(
        ['Tu t’engages, tu rates, tu t’accuses.', 'Tu tiens si le lien survit au raté.'],
        ['Te comprometes, fallas, te acusas.', 'Te sostienes si el vínculo sobrevive al fallo.'],
      ),
      strengths: lines(
        ['Exigence morale (détournée, mais réelle)', 'Capacité à te remettre dès que la voix baisse'],
        ['Exigencia moral (desviada, pero real)', 'Capacidad de retomar en cuanto baja la voz'],
      ),
      limits: lines(
        ['Auto-punition', 'Abandon secondaire (après la honte)'],
        ['Autocastigo', 'Abandono secundario (después de la vergüenza)'],
      ),
      underStress: lines(
        ['La voix s’amplifie. Tu disparais pour ne plus l’entendre — ou tu forces pour la faire taire.'],
        ['La voz se amplifica. Desapareces para no oírla — o fuerzas para silenciarla.'],
      ),
      fears: lines(
        ['Confirmer que tu es « comme ça »', 'Être vue dans le raté'],
        ['Confirmar que eres « así »', 'Que te vean en el fallo'],
      ),
      needs: lines(
        ['Un espace pour reprendre sans te juger', 'Quelqu’un qui ne dramatise pas l’absence'],
        ['Un espacio para retomar sin juzgarte', 'Alguien que no dramatice la ausencia'],
      ),
      howToTalk: lines(
        ['Factuel. « On se voit au prochain créneau. »', 'Zéro moraline.'],
        ['Factual. « Nos vemos en el próximo horario. »', 'Cero moraleja.'],
      ),
      howNotToTalk: lines(
        ['« Encore raté. »', 'Te faire expliquer pourquoi.'],
        ['« Otra vez fallaste. »', 'Hacerte explicar por qué.'],
      ),
      develop: lines(
        ['Laisser le raté durer 10 minutes, pas 10 jours.', 'Prêter le cadre à quelqu’un d’autre que la voix.'],
        ['Dejar que el fallo dure 10 minutos, no 10 días.', 'Prestar el marco a alguien que no sea la voz.'],
      ),
    }),
    disparition: R({
      portrait: lines(
        [
          'Tu rates — puis tu effaces le sujet. Ce n’est pas de l’indifférence. C’est une protection. Sans rendez-vous externe, le silence gagne. Quelqu’un qui t’attend chaque semaine empêche la disparition — sans te harceler.',
          'Tu as besoin d’un rappel doux, pas d’un silence qui ressemble à un abandon, ni d’une traque.',
        ],
        [
          'Fallas — y luego borras el tema. No es indiferencia. Es protección. Sin cita externa, gana el silencio. Alguien que te espera cada semana evita la desaparición — sin acosarte.',
          'Necesitas un recordatorio suave, no un silencio que parezca abandono, ni una caza.',
        ],
      ),
      howYouWork: lines(
        ['Tu ranges.', 'Tu reviens si la porte reste ouverte sans procès.'],
        ['Guardas.', 'Vuelves si la puerta sigue abierta sin juicio.'],
      ),
      strengths: lines(
        ['Autoprotection (utile, mal dosée)', 'Capacité à reprendre sans drame si on t’invite'],
        ['Autoprotección (útil, mal dosificada)', 'Capacidad de retomar sin drama si te invitan'],
      ),
      limits: lines(
        ['Le sujet meurt dans le silence', 'Personne n’est au courant, donc personne n’aide'],
        ['El tema muere en el silencio', 'Nadie se entera, así que nadie ayuda'],
      ),
      underStress: lines(
        ['Tu t’absentes plus longtemps. Tu changes de sujet. Tu « oublies ».'],
        ['Te ausentas más tiempo. Cambias de tema. « Olvidas ».'],
      ),
      fears: lines(
        ['Le conflit', 'Devoir rendre des comptes', 'La honte d’avoir disparu'],
        ['El conflicto', 'Tener que rendir cuentas', 'La vergüenza de haber desaparecido'],
      ),
      needs: lines(
        ['Une raison de ne pas disparaître', 'Un créneau qui existe sans toi… et t’attend'],
        ['Una razón para no desaparecer', 'Un horario que existe sin ti… y te espera'],
      ),
      howToTalk: lines(
        ['Léger. « Mardi on t’attend. »', 'Pas d’interrogatoire.'],
        ['Ligera. « El martes te esperamos. »', 'Sin interrogatorio.'],
      ),
      howNotToTalk: lines(
        ['« Tu t’en fiches. »', 'Les messages en rafale.'],
        ['« Te da igual. »', 'Los mensajes en ráfaga.'],
      ),
      develop: lines(
        ['Prévenir d’une absence plutôt que d’effacer.', 'Accepter d’être attendue.'],
        ['Avisar una ausencia en vez de borrar.', 'Aceptar que te esperen.'],
      ),
    }),
    surcomp: R({
      portrait: lines(
        [
          'Tu rates — puis tu forces trop. Le yo-yo « rien / trop » te fatigue et te fait re-lâcher. Tu n’as pas besoin de plus d’intensité. Tu as besoin de continuité. Un créneau fixe calme la surcompensation : tu viens — point. Pas de marathon de rattrapage.',
          'Ton exigence est une force. Sans contenant, elle te brûle.',
        ],
        [
          'Fallas — y luego fuerzas de más. El yo-yo « nada / demasiado » te cansa y te hace soltar otra vez. No necesitas más intensidad. Necesitas continuidad. Un horario fijo calma la sobrecompensación: vienes — punto. Sin maratón de recuperación.',
          'Tu exigencia es una fuerza. Sin contenedor, te quema.',
        ],
      ),
      howYouWork: lines(
        ['Tout ou beaucoup.', 'Tu tiens si quelqu’un bride le « rattrapage ».'],
        ['Todo o mucho.', 'Te sostienes si alguien frena el « recuperar ».'],
      ),
      strengths: lines(
        ['Élan de reprise', 'Exigence', 'Capacité à en faire beaucoup — à doser'],
        ['Impulso de retomada', 'Exigencia', 'Capacidad de hacer mucho — a dosificar'],
      ),
      limits: lines(
        ['Blessure / épuisement', 'Culpabilité si tu fais « juste le créneau »'],
        ['Lesión / agotamiento', 'Culpa si haces « solo el horario »'],
      ),
      underStress: lines(
        ['Double séance, nouveau programme, barre trop haute.'],
        ['Sesión doble, programa nuevo, listón demasiado alto.'],
      ),
      fears: lines(
        ['Rester en retard', 'Que le creux gagne', 'Ne pas « mériter » le cadre si tu ne forces pas'],
        ['Quedarte atrás', 'Que gane el hueco', 'No « merecer » el marco si no fuerzas'],
      ),
      needs: lines(
        ['Une reprise simple', 'Un frein externe bienveillant', 'Le droit à la dose'],
        ['Una retomada simple', 'Un freno externo amable', 'El derecho a la dosis'],
      ),
      howToTalk: lines(
        ['« On reprend le créneau normal. »', 'Félicite la continuité, pas l’excès.'],
        ['« Retomamos el horario normal. »', 'Felicita la continuidad, no el exceso.'],
      ),
      howNotToTalk: lines(
        ['« Allez, rattrape cette semaine. »', 'Admirer le yo-yo comme de la discipline.'],
        ['« Vamos, recupera esta semana. »', 'Admirar el yo-yo como disciplina.'],
      ),
      develop: lines(
        ['Tenir la dose. Laisser le filet dire non à la double séance.'],
        ['Sostener la dosis. Dejar que la red diga no a la sesión doble.'],
      ),
    }),
    cadre: R({
      portrait: lines(
        [
          'Tu rates — et tu sens que le solo ne suffit plus. Tu as déjà la lucidité. Ce qui manque, c’est le contenant. Les vidéos seules ne remplacent pas un rendez-vous. L’essai 7 jours, pour toi, ce n’est pas te prouver quelque chose. C’est tester un cadre.',
          'Tu n’as pas un problème de compréhension. Tu as un problème d’infrastructure.',
        ],
        [
          'Fallas — y sientes que lo solo ya no basta. Ya tienes lucidez. Lo que falta es el contenedor. Los vídeos solos no reemplazan una cita. La prueba 7 días, para ti, no es demostrarte algo. Es testear un marco.',
          'No tienes un problema de comprensión. Tienes un problema de infraestructura.',
        ],
      ),
      howYouWork: lines(
        ['Tu observes.', 'Tu reprends sans t’acharner — et tu vois que ça ne tient pas seule.'],
        ['Observas.', 'Retomas sin ensañarte — y ves que sola no se sostiene.'],
      ),
      strengths: lines(
        ['Lucidité', 'Peu de théâtre', 'Prête pour un vrai cadre'],
        ['Lucidez', 'Poco teatro', 'Lista para un marco de verdad'],
      ),
      limits: lines(
        ['Rester trop longtemps dans l’analyse', 'Attendre le cadre « parfait »'],
        ['Quedarte demasiado en el análisis', 'Esperar el marco « perfecto »'],
      ),
      underStress: lines(
        ['Tu redeviens solo « encore un peu ». Le contenant recule.'],
        ['Vuelves a lo solo « un poco más ». El contenedor se aleja.'],
      ),
      fears: lines(
        ['Te tromper de cadre', 'Dépendre', 'Que ce soit encore du contenu'],
        ['Equivocarte de marco', 'Depender', 'Que sea otra vez contenido'],
      ),
      needs: lines(
        ['Le prochain rendez-vous déjà posé', 'Tester, pas collectionner les méthodes'],
        ['La próxima cita ya fijada', 'Testear, no coleccionar métodos'],
      ),
      howToTalk: lines(
        ['Concret : jour, heure, ce qui se passe.', 'Pas de promesse magique.'],
        ['Concreto: día, hora, qué pasa.', 'Sin promesa mágica.'],
      ),
      howNotToTalk: lines(
        ['Encore une app, encore une vidéo.', '« Tu as juste à t’y mettre. »'],
        ['Otra app, otro vídeo.', '« Solo tienes que ponerte. »'],
      ),
      develop: lines(
        ['Passer de la lucidité à l’infrastructure. Tester 7 jours. Voir.'],
        ['Pasar de la lucidez a la infraestructura. Probar 7 días. Ver.'],
      ),
    }),
  },
};
