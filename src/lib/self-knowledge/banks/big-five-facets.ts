/**
 * Banque narrative facettes IPIP-NEO-120 (4–20 par facette).
 *
 * Inspirée des descriptions publiques IPIP-NEO de John A. Johnson
 * (Johnson, 2014, https://ipip.ori.org/30facetneo-pi-ritems.htm) —
 * réécrite voix FitMangas. Pas de diagnostic clinique.
 *
 * Seuils facette : low ≤ 9 · mid ≤ 14 · high ≥ 15
 */

import type { BilingualText, Level, TraitLevelContent, TraitBank } from './big-five-traits';

export type FacetId =
  | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6'
  | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6'
  | 'O1' | 'O2' | 'O3' | 'O4' | 'O5' | 'O6'
  | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export const FACET_IDS: FacetId[] = [
  'N1', 'N2', 'N3', 'N4', 'N5', 'N6',
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6',
  'O1', 'O2', 'O3', 'O4', 'O5', 'O6',
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6',
];

export function bandFromFacetScore(score: number): Level {
  if (score <= 9) return 'low';
  if (score <= 14) return 'mid';
  return 'high';
}

export const FACET_LABELS: Record<FacetId, BilingualText> = {
  N1: { fr: 'Anxiété', es: 'Ansiedad' },
  N2: { fr: 'Colère / Irritabilité', es: 'Ira / Irritabilidad' },
  N3: { fr: 'Humeur basse', es: 'Estado de ánimo bajo' },
  N4: { fr: 'Pudeur sociale', es: 'Timidez social' },
  N5: { fr: 'Impulsivité', es: 'Impulsividad' },
  N6: { fr: 'Vulnérabilité au stress', es: 'Vulnerabilidad al estrés' },
  E1: { fr: 'Chaleur / Amabilité', es: 'Calidez / Amabilidad' },
  E2: { fr: 'Grégarité', es: 'Gregarismo' },
  E3: { fr: 'Assertivité', es: 'Asertividad' },
  E4: { fr: 'Niveau d’activité', es: 'Nivel de actividad' },
  E5: { fr: 'Recherche de sensations', es: 'Búsqueda de sensaciones' },
  E6: { fr: 'Joie / Enthousiasme', es: 'Alegría / Entusiasmo' },
  O1: { fr: 'Imagination', es: 'Imaginación' },
  O2: { fr: 'Intérêt artistique', es: 'Interés artístico' },
  O3: { fr: 'Émotivité', es: 'Emotividad' },
  O4: { fr: 'Aventure / Nouveauté', es: 'Aventura / Novedad' },
  O5: { fr: 'Intellect / Curiosité', es: 'Intelecto / Curiosidad' },
  O6: { fr: 'Ouverture aux valeurs', es: 'Apertura a valores' },
  A1: { fr: 'Confiance', es: 'Confianza' },
  A2: { fr: 'Franchise / Moralité', es: 'Franqueza / Moralidad' },
  A3: { fr: 'Altruisme', es: 'Altruismo' },
  A4: { fr: 'Coopération', es: 'Cooperación' },
  A5: { fr: 'Modestie', es: 'Modestia' },
  A6: { fr: 'Sympathie / Empathie', es: 'Simpatía / Empatía' },
  C1: { fr: 'Efficacité personnelle', es: 'Eficacia personal' },
  C2: { fr: 'Ordre', es: 'Orden' },
  C3: { fr: 'Sens du devoir', es: 'Sentido del deber' },
  C4: { fr: 'Ambition / Réussite', es: 'Ambición / Logro' },
  C5: { fr: 'Autodiscipline', es: 'Autodisciplina' },
  C6: { fr: 'Prudence / Réflexion', es: 'Prudencia / Reflexión' },
};

const lvl = (
  narrative: BilingualText,
  force: BilingualText,
  limit: BilingualText
): TraitLevelContent => ({ narrative, force, limit });

const facet = (
  low: TraitLevelContent,
  mid: TraitLevelContent,
  high: TraitLevelContent
): TraitBank => ({ low, mid, high });

export const BIG_FIVE_FACET_BANK: Record<FacetId, TraitBank> = {
  N1: facet(
    lvl(
      { fr: 'Tu t’inquiètes peu avant le cours — tu arrives disponible pour bouger.', es: 'Te preocupas poco antes de la clase — llegas disponible para moverte.' },
      { fr: 'Tu ne laisses pas l’inquiétude décider à ta place.', es: 'No dejas que la preocupación decida por ti.' },
      { fr: 'Tu peux minimiser un signal de stress réel.', es: 'Puedes minimizar una señal real de estrés.' }
    ),
    lvl(
      { fr: 'Parfois l’anticipation te serre ; en mouvement, ça retombe souvent.', es: 'A veces la anticipación te aprieta; en movimiento, suele bajar.' },
      { fr: 'Tu reconnais le stress sans t’y noyer.', es: 'Reconoces el estrés sin ahogarte.' },
      { fr: 'Les pensées peuvent voler la place au corps.', es: 'Los pensamientos pueden robarle sitio al cuerpo.' }
    ),
    lvl(
      { fr: 'Tu rumines avant le cours : « et si je n’y arrive pas ? » — le live rassure quand la coach te voit.', es: 'Rumiar antes de la clase: « ¿y si no puedo? » — el live tranquiliza cuando la coach te ve.' },
      { fr: 'Tu es vigilante — tu n’ignores pas ton ressenti.', es: 'Eres vigilante — no ignoras tu sensación.' },
      { fr: 'Sans cadre rassurant, tu repousses la séance « pour un meilleur jour ».', es: 'Sin marco tranquilizador, pospones la sesión « para un mejor día ».' }
    )
  ),

  N2: facet(
    lvl(
      { fr: 'Tu t’énerves rarement en cours — tu accueilles les corrections sans les prendre personnellement.', es: 'Casi nunca te enfadas en clase — acoges las correcciones sin tomártelas a pecho.' },
      { fr: 'Tu gardes une distance saine avec les agacements.', es: 'Mantienes distancia sana con las molestias.' },
      { fr: 'Tu peux éviter de signaler une gêne par peur de « faire du drama ».', es: 'Puedes evitar señalar una molestia por miedo a « montar un drama ».' }
    ),
    lvl(
      { fr: 'Tu peux être irritée si tu es fatiguée ou pressée — ça passe en général.', es: 'Puedes estar irritada si estás cansada o con prisa — suele pasar.' },
      { fr: 'Tu canalises l’irritation en ajustement.', es: 'Canalizas la irritación en ajuste.' },
      { fr: 'Les jours difficiles, tu lâches parfois plus tôt.', es: 'Los días difíciles, a veces sueltas antes.' }
    ),
    lvl(
      { fr: 'La frustration monte vite si quelque chose bloque — respirer avant de réagir t’aide.', es: 'La frustración sube rápido si algo bloquea — respirar antes de reaccionar te ayuda.' },
      { fr: 'Tu exprimes ce qui ne va pas — tu ne le gardes pas dans le corps.', es: 'Expresas lo que no va — no lo guardas en el cuerpo.' },
      { fr: 'Tu risques de confondre correction technique et reproche personnel.', es: 'Riesgas confundir corrección técnica y reproche personal.' }
    )
  ),

  N3: facet(
    lvl(
      { fr: 'Ton humeur ne te freine pas souvent — tu bouges même les jours moyens.', es: 'Tu ánimo no te frena a menudo — te mueves incluso en días regulares.' },
      { fr: 'Tu ne conditionnes pas tout ton bien-être à une séance.', es: 'No condicionas todo tu bienestar a una sesión.' },
      { fr: 'Tu peux sous-estimer une vraie fatigue émotionnelle.', es: 'Puedes subestimar un cansancio emocional real.' }
    ),
    lvl(
      { fr: 'Certains jours tu es moins levée ; le collectif peut te remonter ou te peser.', es: 'Algunos días estás más baja; el colectivo puede levantarte o pesarte.' },
      { fr: 'Tu acceptes les fluctuations sans t’y identifier.', es: 'Aceptas las fluctuaciones sin identificarte con ellas.' },
      { fr: 'Tu peux annuler par habitude les jours gris.', es: 'Puedes cancelar por hábito los días grises.' }
    ),
    lvl(
      { fr: 'Les phases de moral bas rendent la pratique solo presque impossible.', es: 'Las fases de ánimo bajo hacen la práctica en solitario casi imposible.' },
      { fr: 'Tu sais que le mouvement aide parfois à redescendre.', es: 'Sabes que el movimiento a veces ayuda a bajar.' },
      { fr: 'Attendre d’aller « mieux » pour reprendre crée un cercle sans mouvement.', es: 'Esperar a estar « mejor » para retomar crea un círculo sin movimiento.' }
    )
  ),

  N4: facet(
    lvl(
      { fr: 'Tu te sens à l’aise devant la caméra — être vue ne te gêne pas.', es: 'Te sientes cómoda delante de la cámara — ser vista no te incomoda.' },
      { fr: 'Tu profites des corrections visibles.', es: 'Aprovechas las correcciones visibles.' },
      { fr: 'Tu peux te comparer aux autres au lieu d’écouter ton corps.', es: 'Puedes compararte con las demás en lugar de escuchar tu cuerpo.' }
    ),
    lvl(
      { fr: 'Tu hésites parfois à ouvrir la caméra, surtout au début.', es: 'A veces dudas en abrir la cámara, sobre todo al principio.' },
      { fr: 'Tu progresses même caméra fermée si le lien audio suffit.', es: 'Progresas incluso con cámara cerrada si el audio basta.' },
      { fr: 'Tu peux rester invisible et manquer des corrections clés.', es: 'Puedes quedarte invisible y perder correcciones clave.' }
    ),
    lvl(
      { fr: 'Tu crains le regard des autres — la visio en petit groupe peut être plus douce.', es: 'Temes la mirada de las demás — la visio en grupo pequeño puede ser más suave.' },
      { fr: 'Tu sens quand la pudeur te protège — et quand elle te retient.', es: 'Sientes cuándo la timidez te protege — y cuándo te frena.' },
      { fr: 'La honte silencieuse peut te faire décrocher sans l’expliquer.', es: 'La vergüenza silenciosa puede hacerte abandonar sin explicarlo.' }
    )
  ),

  N5: facet(
    lvl(
      { fr: 'Tu ne te laisses pas emporter — tu termines ce que tu commences en cours.', es: 'No te dejas llevar — terminas lo que empiezas en clase.' },
      { fr: 'Tu profites du cours sans excès.', es: 'Disfrutas la clase sin excesos.' },
      { fr: 'Tu peux manquer de spontanéité bénéfique.', es: 'Puedes faltar espontaneidad beneficiosa.' }
    ),
    lvl(
      { fr: 'Parfois tu accélères ou zappes une partie — tu reviens à la structure.', es: 'A veces aceleras o saltas una parte — vuelves a la estructura.' },
      { fr: 'Tu alternes intensité et récupération.', es: 'Alternas intensidad y recuperación.' },
      { fr: 'L’excitation du nouveau peut masquer la fatigue.', es: 'La emoción de lo nuevo puede enmascarar el cansancio.' }
    ),
    lvl(
      { fr: 'Tu veux tout tester vite — ralentir est ton vrai travail en Pilates.', es: 'Quieres probarlo todo rápido — frenar es tu trabajo real en Pilates.' },
      { fr: 'Tu apprends à savourer la lenteur.', es: 'Aprendes a saborear la lentitud.' },
      { fr: 'Tu risques de confondre agitation et progression.', es: 'Riesgas confundir agitación y progreso.' }
    )
  ),

  N6: facet(
    lvl(
      { fr: 'Tu encaisse bien une séance exigeante — tu rebondis sans drama.', es: 'Aguantas bien una sesión exigente — rebotas sin drama.' },
      { fr: 'Tu distingues un coup de mou d’un vrai surmenage.', es: 'Distingues un bajón de un agotamiento real.' },
      { fr: 'Tu peux pousser alors que le corps demande une pause.', es: 'Puedes empujar cuando el cuerpo pide pausa.' }
    ),
    lvl(
      { fr: 'Une séance dure te marque un peu ; avec du sommeil tu reviens.', es: 'Una sesión dura te marca un poco; con sueño vuelves.' },
      { fr: 'Tu adaptes l’intensité sans culpabiliser.', es: 'Adaptas la intensidad sin culparte.' },
      { fr: 'Les semaines denses érodent ta motivation insensiblement.', es: 'Las semanas densas erosionan tu motivación sin que notes.' }
    ),
    lvl(
      { fr: 'Quand ça s’accumule, tu peux te sentir dépassée rapidement.', es: 'Cuando se acumula, puedes sentirte sobrepasada rápido.' },
      { fr: 'Tu demandes des modifications — lucidité, pas faiblesse.', es: 'Pides modificaciones — lucidez, no debilidad.' },
      { fr: 'Sous pression, tu peux tout arrêter d’un coup au lieu de réduire.', es: 'Bajo presión, puedes parar todo de golpe en lugar de reducir.' }
    )
  ),

  E1: facet(
    lvl(
      { fr: 'Tu es plutôt réservée en arrivant — tu observes avant de te mêler au groupe.', es: 'Eres más bien reservada al llegar — observas antes de mezclarte.' },
      { fr: 'Tu profites du collectif sans te forcer à être « sympa ».', es: 'Disfrutas el colectivo sin forzarte a ser « simpática ».' },
      { fr: 'Tu peux sembler distante alors que tu es simplement en observation.', es: 'Puedes parecer distante cuando solo estás observando.' }
    ),
    lvl(
      { fr: 'Tu es accueillante sans être expansive — tu trouves ta place progressivement.', es: 'Eres acogedora sin ser expansiva — encuentras tu lugar poco a poco.' },
      { fr: 'Tu t’ouvres quand tu te sens en sécurité.', es: 'Te abres cuando te sientes segura.' },
      { fr: 'Les jours sans groupe, la motivation baisse un peu.', es: 'Los días sin grupo, la motivación baja un poco.' }
    ),
    lvl(
      { fr: 'Tu crées vite du lien : sourires, échanges — tu fais sentir les autres à l’aise.', es: 'Creas vínculo rápido: sonrisas, intercambios — haces sentir cómodas a las demás.' },
      { fr: 'Ta chaleur rend le cours plus humain pour tout le monde.', es: 'Tu calidez hace la clase más humana para todas.' },
      { fr: 'Tu peux t’éparpiller socialement et oublier ton alignement.', es: 'Puedes dispersarte socialmente y olvidar tu alineación.' }
    )
  ),

  E2: facet(
    lvl(
      { fr: 'Tu préfères les petits groupes — la visio FitMangas te convient bien.', es: 'Prefieres grupos pequeños — la visio FitMangas te va bien.' },
      { fr: 'Tu choisis la taille de lien qui te recharge.', es: 'Eliges el tamaño de vínculo que te recarga.' },
      { fr: 'Tu peux t’ennuyer en solo sans t’en rendre compte.', es: 'Puedes aburrirte en solitario sin darte cuenta.' }
    ),
    lvl(
      { fr: 'Tu aimes le collectif modéré : ni solo, ni foule.', es: 'Te gusta el colectivo moderado: ni sola, ni multitud.' },
      { fr: 'Tu alternes présence et retrait selon les semaines.', es: 'Alternas presencia y retiro según las semanas.' },
      { fr: 'Tu attends parfois le groupe pour te connecter.', es: 'A veces esperas al grupo para conectarte.' }
    ),
    lvl(
      { fr: 'Tu t’épanouis quand il y a du monde et de l’énergie autour.', es: 'Te desenvuelves cuando hay gente y energía alrededor.' },
      { fr: 'Tu apportes de la vie au créneau.', es: 'Aportas vida al horario.' },
      { fr: 'Tu surbooking social peut cannibaliser ta séance.', es: 'Tu sobreagenda social puede cannibalizar tu sesión.' }
    )
  ),

  E3: facet(
    lvl(
      { fr: 'Tu laisses la coach guider — tu n’as pas besoin de prendre la lead.', es: 'Dejas que la coach guíe — no necesitas tomar la iniciativa.' },
      { fr: 'Tu écoutes avant d’agir.', es: 'Escuchas antes de actuar.' },
      { fr: 'Tu peux garder une gêne pour toi au lieu de demander une modification.', es: 'Puedes guardar una molestia en lugar de pedir una modificación.' }
    ),
    lvl(
      { fr: 'Tu parles quand tu as une question ; sinon tu suis le flow.', es: 'Hablas cuando tienes una pregunta; si no, sigues el flujo.' },
      { fr: 'Tu équilibres écoute et prise de parole.', es: 'Equilibras escucha y palabra.' },
      { fr: 'Tu hésites entre discret et effacé.', es: 'Dudas entre discreta y borrada.' }
    ),
    lvl(
      { fr: 'Tu n’hésites pas à demander une modification ou signaler ce que tu ressens.', es: 'No dudas en pedir una modificación o señalar lo que sientes.' },
      { fr: 'Ta voix aide la coach à t’accompagner précisément.', es: 'Tu voz ayuda a la coach a acompañarte con precisión.' },
      { fr: 'Tu peux dominer l’attention au détriment de l’écoute corporelle.', es: 'Puedes dominar la atención en detrimento de la escucha corporal.' }
    )
  ),

  E4: facet(
    lvl(
      { fr: 'Tu avances à ton tempo — pas besoin d’un cours hyper rythmé.', es: 'Avanzas a tu tempo — no necesitas una clase muy ritmada.' },
      { fr: 'Tu respectes les phases lentes.', es: 'Respetas las fases lentas.' },
      { fr: 'Tu peux manquer d’élan certains jours.', es: 'Puedes faltar impulso algunos días.' }
    ),
    lvl(
      { fr: 'Tu aimes bouger régulièrement sans te presser.', es: 'Te gusta moverte con regularidad sin presionarte.' },
      { fr: 'Tu adaptes l’intensité à ta journée.', es: 'Adaptas la intensidad a tu día.' },
      { fr: 'Tu enchaînes parfois trop d’activités autour du cours.', es: 'A veces encadenas demasiadas actividades alrededor de la clase.' }
    ),
    lvl(
      { fr: 'Tu as de l’énergie à dépenser — un cours dynamique te fait du bien.', es: 'Tienes energía que gastar — una clase dinámica te sienta bien.' },
      { fr: 'Tu profites du mouvement comme carburant.', es: 'Disfrutas el movimiento como combustible.' },
      { fr: 'Tu peux t’impatienter dans les phases lentes.', es: 'Puedes impacientarte en fases lentas.' }
    )
  ),

  E5: facet(
    lvl(
      { fr: 'Tu préfères la stabilité aux défis spectaculaires.', es: 'Prefieres estabilidad a retos espectaculares.' },
      { fr: 'Tu progresses en profondeur plutôt qu’en sensation forte.', es: 'Progresas en profundidad más que en sensación fuerte.' },
      { fr: 'La routine peut te lasser si rien ne change.', es: 'La rutina puede hastiarte si nada cambia.' }
    ),
    lvl(
      { fr: 'Tu aimes un peu de nouveauté sans basculer dans l’extrême.', es: 'Te gusta un poco de novedad sin ir al extremo.' },
      { fr: 'Tu doses la nouveauté.', es: 'Dosificas la novedad.' },
      { fr: 'Tu cherches parfois le « wow » au lieu du travail utile.', es: 'A veces buscas el « wow » en lugar del trabajo útil.' }
    ),
    lvl(
      { fr: 'Tu aimes tester de nouvelles sensations — Barre, enchaînements plus vifs.', es: 'Te gusta probar sensaciones nuevas — Barre, secuencias más vivas.' },
      { fr: 'Tu gardes l’ennui loin de ta pratique.', es: 'Mantienes el aburrimiento lejos de tu práctica.' },
      { fr: 'Tu peux sauter de format en format sans ancrage.', es: 'Puedes saltar de formato en formato sin anclaje.' }
    )
  ),

  E6: facet(
    lvl(
      { fr: 'Ton engagement est plus intérieur qu’expressif — tu n’as pas besoin de rayonner.', es: 'Tu compromiso es más interior que expresivo — no necesitas irradiar.' },
      { fr: 'Ta présence est calme et fiable.', es: 'Tu presencia es calmada y fiable.' },
      { fr: 'Les autres peuvent croire que « ça ne te fait rien ».', es: 'Las demás pueden creer que « no te importa ».' }
    ),
    lvl(
      { fr: 'Tu partages parfois un sourire ou un enthousiasme après la séance.', es: 'A veces compartes una sonrisa o entusiasmo tras la sesión.' },
      { fr: 'Tu célèbres les petites victoires sans en faire un show.', es: 'Celebras pequeñas victorias sin convertirlo en show.' },
      { fr: 'Tu dépends un peu de l’humeur du jour pour te connecter.', es: 'Dependes un poco del ánimo del día para conectarte.' }
    ),
    lvl(
      { fr: 'Tu rayonnes facilement — ton énergie positive est contagieuse en visio.', es: 'Irradias con facilidad — tu energía positiva es contagiosa en visio.' },
      { fr: 'Tu rappelles au groupe pourquoi bouger fait du bien.', es: 'Recuerdas al grupo por qué moverse hace bien.' },
      { fr: 'Les jours sans élan, tu peux croire que « ça ne sert à rien ».', es: 'Los días sin impulso, puedes creer que « no sirve de nada ».' }
    )
  ),

  O1: facet(
    lvl(
      { fr: 'Tu restes concrète : sensation immédiate plutôt que visualisation.', es: 'Te mantienes concreta: sensación inmediata más que visualización.' },
      { fr: 'Tu ancrages l’imaginaire dans le corps quand tu l’utilises.', es: 'Anclas lo imaginario en el cuerpo cuando lo usas.' },
      { fr: 'Tu peux manquer de nuances intérieures dans le geste.', es: 'Puedes faltar matices interiores en el gesto.' }
    ),
    lvl(
      { fr: 'Tu imagines parfois le mouvement avant de le faire.', es: 'A veces imaginas el movimiento antes de hacerlo.' },
      { fr: 'Tu alternes technique et ressenti.', es: 'Alternas técnica y sensación.' },
      { fr: 'Tu peux rester dans ta tête au lieu de sentir le sol.', es: 'Puedes quedarte en tu cabeza en lugar de sentir el suelo.' }
    ),
    lvl(
      { fr: 'Tu te projettes facilement — images et intentions de la coach t’aident.', es: 'Te proyectas con facilidad — imágenes e intenciones de la coach te ayudan.' },
      { fr: 'Tu enrichis ta pratique de nuances intérieures.', es: 'Enriqueces tu práctica de matices interiores.' },
      { fr: 'L’abstraction peut retarder l’action.', es: 'La abstracción puede retrasar la acción.' }
    )
  ),

  O2: facet(
    lvl(
      { fr: 'L’esthétique compte moins que l’efficacité pour ton corps.', es: 'La estética importa menos que la eficacia para tu cuerpo.' },
      { fr: 'Tu te concentres sur le ressenti, pas le tableau.', es: 'Te concentras en la sensación, no en el cuadro.' },
      { fr: 'Tu peux négliger le plaisir du beau geste.', es: 'Puedes descuidar el placer del gesto bello.' }
    ),
    lvl(
      { fr: 'Tu apprécies une belle séquence sans en faire une condition.', es: 'Aprecias una bella secuencia sin hacerlo condición.' },
      { fr: 'Tu trouves du plaisir dans le détail.', es: 'Encuentras placer en el detalle.' },
      { fr: 'Tu compares parfois ton image à un idéal esthétique.', es: 'A veces comparas tu imagen con un ideal estético.' }
    ),
    lvl(
      { fr: 'Tu es sensible à la fluidité et à la musicalité — la beauté du geste te motive.', es: 'Eres sensible a la fluidez y musicalidad — la belleza del gesto te motiva.' },
      { fr: 'Tu crées du lien entre forme et ressenti.', es: 'Creas vínculo entre forma y sensación.' },
      { fr: 'Tu peux privilégier l’apparence sur l’alignement réel.', es: 'Puedes privilegiar la apariencia sobre la alineación real.' }
    )
  ),

  O3: facet(
    lvl(
      { fr: 'Tu te concentres sur la technique plus que sur l’émotion en cours.', es: 'Te concentras en la técnica más que en la emoción en clase.' },
      { fr: 'Tu gardes une distance utile quand ça monte.', es: 'Mantienes distancia útil cuando sube.' },
      { fr: 'Tu peux ignorer des signaux émotionnels importants.', es: 'Puedes ignorar señales emocionales importantes.' }
    ),
    lvl(
      { fr: 'Tu ressens parfois fort ce qui se passe en toi pendant l’effort.', es: 'A veces sientes fuerte lo que pasa en ti durante el esfuerzo.' },
      { fr: 'Tu utilises l’émotion comme information corporelle.', es: 'Usas la emoción como información corporal.' },
      { fr: 'Tu confonds parfois intensité émotionnelle et progression.', es: 'A veces confundes intensidad emocional y progreso.' }
    ),
    lvl(
      { fr: 'Tu es très réceptive — le mouvement peut te toucher profondément.', es: 'Eres muy receptiva — el movimiento puede tocarte hondo.' },
      { fr: 'Tu humanises ta pratique — ce n’est pas qu’une mécanique.', es: 'Humanizas tu práctica — no es solo mecánica.' },
      { fr: 'Une séance peut te laisser vidée sans temps d’intégration.', es: 'Una sesión puede dejarte vacía sin tiempo de integración.' }
    )
  ),

  O4: facet(
    lvl(
      { fr: 'Tu tiens aux habitudes — le même créneau te rassure.', es: 'Te aferras a hábitos — el mismo horario te tranquiliza.' },
      { fr: 'Tu ancrages la régularité.', es: 'Anclas la regularidad.' },
      { fr: 'Tu peux rester trop longtemps dans une routine usée.', es: 'Puedes quedarte demasiado tiempo en una rutina gastada.' }
    ),
    lvl(
      { fr: 'Tu changes si on te montre l’intérêt — pas pour le changement seul.', es: 'Cambias si te muestran el interés — no por el cambio solo.' },
      { fr: 'Tu testes puis tu ancre.', es: 'Pruebas y luego anclas.' },
      { fr: 'Tu temporises face à trop d’options.', es: 'Temporizas ante demasiadas opciones.' }
    ),
    lvl(
      { fr: 'Tu aimes varier — nouveaux cours, nouvelles approches ; la routine t’étouffe.', es: 'Te gusta variar — cursos nuevos, enfoques distintos; la rutina te ahoga.' },
      { fr: 'Tu gardes la pratique vivante.', es: 'Mantienes la práctica viva.' },
      { fr: 'Tu peux quitter avant que les bénéfices s’installent.', es: 'Puedes irte antes de que se instalen los beneficios.' }
    )
  ),

  O5: facet(
    lvl(
      { fr: 'Tu veux des explications simples — pas un cours théorique.', es: 'Quieres explicaciones simples — no una clase teórica.' },
      { fr: 'Tu appliques vite ce qui est concret.', es: 'Aplicas rápido lo que es concreto.' },
      { fr: 'Tu peux rejeter une nuance utile parce qu’elle semble « compliquée ».', es: 'Puedes rechazar un matiz útil porque parece « complicado ».' }
    ),
    lvl(
      { fr: 'Tu aimes comprendre pourquoi un exercice — ça renforce ta motivation.', es: 'Te gusta entender por qué un ejercicio — refuerza tu motivación.' },
      { fr: 'Tu relis les bases quand tu bloques.', es: 'Repasas lo básico cuando te bloqueas.' },
      { fr: 'Trop d’info peut parfois paralyser ton corps.', es: 'Demasiada info a veces paraliza tu cuerpo.' }
    ),
    lvl(
      { fr: 'Tu es curieuse du « comment » et du « pourquoi » — tu questionnes, tu creuses.', es: 'Eres curiosa del « cómo » y « porqué » — preguntas, profundizas.' },
      { fr: 'Ta curiosité accélère ta progression.', es: 'Tu curiosidad acelera tu progreso.' },
      { fr: 'Tu attends d’ « avoir tout compris » pour bouger.', es: 'Esperas a « entenderlo todo » para moverte.' }
    )
  ),

  O6: facet(
    lvl(
      { fr: 'Tu restes pragmatique — ce que ton corps ressent prime sur le discours.', es: 'Te mantienes pragmática — lo que siente tu cuerpo prima sobre el discurso.' },
      { fr: 'Tu choisis ce qui te convient sans dogme.', es: 'Eliges lo que te conviene sin dogma.' },
      { fr: 'Tu peux fermer la porte à des approches qui t’aideraient.', es: 'Puedes cerrar la puerta a enfoques que te ayudarían.' }
    ),
    lvl(
      { fr: 'Tu es ouverte aux idées nouvelles si elles servent ton bien-être.', es: 'Estás abierta a ideas nuevas si sirven a tu bienestar.' },
      { fr: 'Tu fais ta propre synthèse.', es: 'Haces tu propia síntesis.' },
      { fr: 'Tu hésites entre plusieurs « bonnes » façons de faire.', es: 'Dudas entre varias « buenas » formas de hacer.' }
    ),
    lvl(
      { fr: 'Tu questionnes les normes — tu cherches une pratique alignée avec tes valeurs.', es: 'Cuestionas las normas — buscas una práctica alineada con tus valores.' },
      { fr: 'Tu respectes les différences dans le groupe.', es: 'Respetas las diferencias en el grupo.' },
      { fr: 'Le débat idéologique peut distraire du mouvement.', es: 'El debate ideológico puede distraer del movimiento.' }
    )
  ),

  A1: facet(
    lvl(
      { fr: 'Tu te méfies au début — la confiance se construit avec le temps.', es: 'Desconfías al principio — la confianza se construye con el tiempo.' },
      { fr: 'Tu protèges ton espace tout en participant.', es: 'Proteges tu espacio mientras participas.' },
      { fr: 'Tu peux rester en alerte alors que le cadre est sûr.', es: 'Puedes permanecer en alerta aunque el marco sea seguro.' }
    ),
    lvl(
      { fr: 'Tu fais confiance progressivement à la coach et au groupe.', es: 'Confías progresivamente en la coach y el grupo.' },
      { fr: 'Tu ajustes la confiance au contexte.', es: 'Ajustas la confianza al contexto.' },
      { fr: 'Un incident peut te faire douter plus longtemps que nécessaire.', es: 'Un incident puede hacerte dudar más tiempo del necesario.' }
    ),
    lvl(
      { fr: 'Tu fais facilement confiance — tu t’ouvres vite en visio.', es: 'Confías con facilidad — te abres pronto en visio.' },
      { fr: 'Tu crées un climat sûr pour toi et les autres.', es: 'Creas un clima seguro para ti y las demás.' },
      { fr: 'Tu peux rester trop longtemps dans une dynamique qui ne te convient pas.', es: 'Puedes quedarte demasiado tiempo en una dinámica que no te conviene.' }
    )
  ),

  A2: facet(
    lvl(
      { fr: 'Tu es directe — tu dis ce que tu penses, parfois sans filtre.', es: 'Eres directa — dices lo que piensas, a veces sin filtro.' },
      { fr: 'Ta parole a du poids parce qu’elle est claire.', es: 'Tu palabra tiene peso porque es clara.' },
      { fr: 'Tu peux heurter sans le vouloir en cours.', es: 'Puedes herir sin querer en clase.' }
    ),
    lvl(
      { fr: 'Tu es honnête tout en restant respectueuse.', es: 'Eres honesta manteniendo el respeto.' },
      { fr: 'Tu exprimes un désaccord sans casser le lien.', es: 'Expresas desacuerdo sin romper el vínculo.' },
      { fr: 'Tu peux éviter un feedback utile pour « garder la paix ».', es: 'Puedes evitar un feedback útil para « mantener la paz ».' }
    ),
    lvl(
      { fr: 'Tu tiens à l’intégrité — tu fais ce que tu dis, envers toi et le groupe.', es: 'Te importa la integridad — haces lo que dices, contigo y el grupo.' },
      { fr: 'Tu navigues entre franchise et diplomatie.', es: 'Navegas entre franqueza y diplomacia.' },
      { fr: 'Tu peux te rigidifier sur « comment ça devrait être ».', es: 'Puedes rigidizarte en « cómo debería ser ».' }
    )
  ),

  A3: facet(
    lvl(
      { fr: 'Tu viens surtout pour toi — pas besoin de « sauver » qui que ce soit.', es: 'Vienes sobre todo por ti — no necesitas « salvar » a nadie.' },
      { fr: 'Tu protèges ton temps de pratique.', es: 'Proteges tu tiempo de práctica.' },
      { fr: 'Tu peux sembler distante alors que tu es juste focalisée.', es: 'Puedes parecer distante cuando solo estás focalizada.' }
    ),
    lvl(
      { fr: 'Tu aides parfois une autre participante si on te le demande.', es: 'Ayudas a veces a otra participante si te lo piden.' },
      { fr: 'Tu partages sans te sacrifier.', es: 'Compartes sin sacrificarte.' },
      { fr: 'Tu minimises tes propres besoins de correction.', es: 'Minimizas tus propias necesidades de corrección.' }
    ),
    lvl(
      { fr: 'Tu es naturellement attentive aux autres — tu encourages, tu relances.', es: 'Eres naturalmente atenta a las demás — animas, relanzas.' },
      { fr: 'Tu renforces la cohésion du groupe.', es: 'Refuerzas la cohesión del grupo.' },
      { fr: 'Tu oublies ta séance en t’occupant des autres.', es: 'Olvidas tu sesión ocupándote de las demás.' }
    )
  ),

  A4: facet(
    lvl(
      { fr: 'Tu défends ton espace — tu n’as pas peur de prendre une place différente.', es: 'Defiendes tu espacio — no temes tomar un lugar distinto.' },
      { fr: 'Tu négocies avec le collectif sans te perdre.', es: 'Negocias con el colectivo sin perderte.' },
      { fr: 'Tu peux te sentir « en marge » même dans le groupe.', es: 'Puedes sentirte « al margen » incluso en el grupo.' }
    ),
    lvl(
      { fr: 'Tu coopères en cours tout en gardant ton rythme.', es: 'Cooperas en clase manteniendo tu ritmo.' },
      { fr: 'Tu respectes le tempo commun quand c’est utile.', es: 'Respetas el tempo común cuando es útil.' },
      { fr: 'Tu te tais sur une gêne pour ne pas déranger.', es: 'Te callas sobre una molestia para no molestar.' }
    ),
    lvl(
      { fr: 'Tu aimes l’harmonie du groupe — tu évites les frictions inutiles.', es: 'Te gusta la armonía del grupo — evitas fricciones innecesarias.' },
      { fr: 'Tu fais avancer le groupe par ta coopération.', es: 'Haces avanzar al grupo con tu cooperación.' },
      { fr: 'Tu suis le groupe même quand ton corps dit stop.', es: 'Sigues al grupo aunque tu cuerpo diga stop.' }
    )
  ),

  A5: facet(
    lvl(
      { fr: 'Tu assumes tes progrès — tu n’as pas peur de dire quand ça va mieux.', es: 'Asumes tus progresos — no temes decir cuando va mejor.' },
      { fr: 'Tu reconnais tes efforts sans te comparer.', es: 'Reconoces tus esfuerzos sin compararte.' },
      { fr: 'Tu peux en faire un peu trop côté assurance.', es: 'Puedes excederte en seguridad.' }
    ),
    lvl(
      { fr: 'Tu restes modeste sur tes avancées — ni fausse humilité ni vantardise.', es: 'Permaneces modesta en tus avances — ni falsa humildad ni jactancia.' },
      { fr: 'Tu accueilles un retour positif avec gratitude.', es: 'Acoges un feedback positivo con gratitud.' },
      { fr: 'Tu te caches parfois derrière les autres pour ne pas être vue.', es: 'A veces te escondes detrás de las demás para no ser vista.' }
    ),
    lvl(
      { fr: 'Tu doutes de tes progrès — tu as du mal à recevoir les compliments.', es: 'Dudas de tus progresos — te cuesta recibir elogios.' },
      { fr: 'Tu inspires sans écraser les autres.', es: 'Inspiras sin aplastar a las demás.' },
      { fr: 'Tu minimises systématiquement ce que tu fais bien.', es: 'Minimizas sistemáticamente lo que haces bien.' }
    )
  ),

  A6: facet(
    lvl(
      { fr: 'Tu restes focalisée sur ta pratique — l’empathie n’est pas ton moteur principal ici.', es: 'Te mantienes focalizada en tu práctica — la empatía no es tu motor principal aquí.' },
      { fr: 'Tu es présente aux autres sans te disperser.', es: 'Estás presente a las demás sin dispersarte.' },
      { fr: 'Tu peux manquer de chaleur perçue en visio.', es: 'Puedes faltar calidez percibida en visio.' }
    ),
    lvl(
      { fr: 'Tu ressens ce que vivent les autres sans t’y fondre.', es: 'Sientes lo que viven las demás sin fundirte.' },
      { fr: 'Tu accueilles les émotions du groupe avec recul.', es: 'Acoges las emociones del grupo con distancia.' },
      { fr: 'Tu absorbes parfois le stress des autres.', es: 'Absorbes a veces el estrés de las demás.' }
    ),
    lvl(
      { fr: 'Tu es très empathique — l’ambiance du groupe te touche autant que ton effort.', es: 'Eres muy empática — el ambiente del grupo te toca tanto como tu esfuerzo.' },
      { fr: 'Tu crées un filet humain autour du cours.', es: 'Creas una red humana alrededor de la clase.' },
      { fr: 'Tu finis la séance épuisée émotionnellement.', es: 'Terminas la sesión agotada emocionalmente.' }
    )
  ),

  C1: facet(
    lvl(
      { fr: 'Tu doutes parfois de « bien faire » — la correction en direct te rassure.', es: 'A veces dudas de « hacerlo bien » — la corrección en directo te tranquiliza.' },
      { fr: 'Tu demandes de l’aide quand il faut.', es: 'Pides ayuda cuando hace falta.' },
      { fr: 'Tu peux abandonner avant d’avoir vraiment testé.', es: 'Puedes abandonar antes de haber probado de verdad.' }
    ),
    lvl(
      { fr: 'Tu te sens globalement capable — tu appliques les consignes sans te saboter.', es: 'Te sientes globalmente capaz — aplicas consignas sin sabotearte.' },
      { fr: 'Tu transformes l’erreur en information.', es: 'Transformas el error en información.' },
      { fr: 'Tu peux te mettre la pression au lieu de la coach.', es: 'Puedes presionarte en lugar de dejar que la coach guíe.' }
    ),
    lvl(
      { fr: 'Tu as confiance en ta capacité à apprendre — tu progresses vite quand on te guide.', es: 'Confías en tu capacidad de aprender — progresas rápido cuando te guían.' },
      { fr: 'Tu construis ta compétence séance après séance.', es: 'Construyes tu competencia sesión tras sesión.' },
      { fr: 'Tu peux en faire trop parce que tu « sais que tu peux ».', es: 'Puedes excederte porque « sabes que puedes ».' }
    )
  ),

  C2: facet(
    lvl(
      { fr: 'L’ordre matériel n’est pas ta priorité — tu bouges même si tout n’est pas parfait.', es: 'El orden material no es tu prioridad — te mueves aunque no todo esté perfecto.' },
      { fr: 'Tu simplifies quand la vie déborde.', es: 'Simplificas cuando la vida desborda.' },
      { fr: 'Le désordre chez toi peut devenir une excuse pour sauter le cours.', es: 'El desorden en casa puede volverse excusa para saltar la clase.' }
    ),
    lvl(
      { fr: 'Tu aimes un minimum de structure — créneau, tapis, tenue.', es: 'Te gusta un mínimo de estructura — horario, mat, ropa.' },
      { fr: 'Tu crées juste assez d’ordre pour tenir.', es: 'Creas justo el orden suficiente para sostener.' },
      { fr: 'Tu perds du temps à préparer au lieu de te connecter.', es: 'Pierdes tiempo preparando en lugar de conectarte.' }
    ),
    lvl(
      { fr: 'Tu fonctionnes mieux avec un rituel clair : même heure, même espace.', es: 'Funcionas mejor con un ritual claro: misma hora, mismo espacio.' },
      { fr: 'Ton cadre léger soutient ta régularité.', es: 'Tu marco ligero sostiene tu regularidad.' },
      { fr: 'Tu peux annuler si le rituel est perturbé.', es: 'Puedes cancelar si el ritual se altera.' }
    )
  ),

  C3: facet(
    lvl(
      { fr: 'Tu te permets de flexibiliser — parfois tu déplaces sans culpabiliser.', es: 'Te permites flexibilizar — a veces cambias sin culparte.' },
      { fr: 'Tu réalignes plutôt que d’abandonner.', es: 'Reajustas en lugar de abandonar.' },
      { fr: 'Trop de flexibilité affaiblit la régularité.', es: 'Demasiada flexibilidad debilita la regularidad.' }
    ),
    lvl(
      { fr: 'Tu tiens en général ce que tu planifies — tu honores le créneau.', es: 'Cumples en general lo que planificas — honras el horario.' },
      { fr: 'Tu fais confiance à ta parole.', es: 'Confías en tu palabra.' },
      { fr: 'Tu peux te sentir coupable après une absence.', es: 'Puedes sentirte culpable tras una ausencia.' }
    ),
    lvl(
      { fr: 'Quand tu t’engages, tu es là — lâcher sans prévenir te pèse.', es: 'Cuando te comprometes, estás — soltar sin avisar te pesa.' },
      { fr: 'Tu montres l’exemple de régularité.', es: 'Das ejemplo de regularidad.' },
      { fr: 'Tu continues un créneau qui ne te convient plus par « principe ».', es: 'Continúas un horario que ya no te conviene por « principio ».' }
    )
  ),

  C4: facet(
    lvl(
      { fr: 'Tu n’as pas besoin de performance — tu viens pour te sentir mieux.', es: 'No necesitas rendimiento — vienes para sentirte mejor.' },
      { fr: 'Tu célèbres les petits gains.', es: 'Celebras pequeños logros.' },
      { fr: 'Tu peux manquer d’objectifs qui te tirent vers l’avant.', es: 'Puedes faltar objetivos que te impulsen.' }
    ),
    lvl(
      { fr: 'Tu aimes sentir que tu progresses — objectifs modestes, palpables.', es: 'Te gusta sentir que progresas — objetivos modestos, palpables.' },
      { fr: 'Tu avances sans te comparer aux autres.', es: 'Avanzas sin compararte con las demás.' },
      { fr: 'Tu te décourages si la progression n’est pas visible vite.', es: 'Te desanimas si el progreso no se ve pronto.' }
    ),
    lvl(
      { fr: 'Tu es orientée résultats — tu suis tes progrès et tu veux franchir des étapes.', es: 'Estás orientada a resultados — sigues tus progresos y quieres superar etapas.' },
      { fr: 'Ta motivation est durable quand tu vois avancer.', es: 'Tu motivación es durable cuando ves avance.' },
      { fr: 'Tu pousses au-delà du signal douleur.', es: 'Empujas más allá de la señal de dolor.' }
    )
  ),

  C5: facet(
    lvl(
      { fr: 'La discipline solo te coûte — tu comptes sur le créneau collectif.', es: 'La disciplina en solitario te cuesta — cuentas con el horario colectivo.' },
      { fr: 'Tu reviens vite après une coupure.', es: 'Vuelves rápido tras una pausa.' },
      { fr: 'Sans cadre extérieur, tu décroches facilement.', es: 'Sin marco exterior, abandonas fácilmente.' }
    ),
    lvl(
      { fr: 'Tu te prépares en général — parfois tu improvises, mais tu reviens.', es: 'Te preparas en general — a veces improvisas, pero vuelves.' },
      { fr: 'Tu construis la discipline par petites doses.', es: 'Construyes disciplina a pequeñas dosis.' },
      { fr: 'Les semaines chargées font vaciller ta routine.', es: 'Las semanas cargadas hacen vacilar tu rutina.' }
    ),
    lvl(
      { fr: 'Tu es prévoyante — tu protèges ton créneau comme non négociable.', es: 'Eres previsora — proteges tu horario como no negociable.' },
      { fr: 'Tu fais de la régularité un réflexe.', es: 'Haces de la regularidad un reflejo.' },
      { fr: 'Tu peux te surcharger parce que « tu tiens ».', es: 'Puedes sobrecargarte porque « aguantas ».' }
    )
  ),

  C6: facet(
    lvl(
      { fr: 'Tu te lances vite — parfois avant d’avoir bien écouté la consigne.', es: 'Te lanzas rápido — a veces antes de escuchar bien la consigna.' },
      { fr: 'Tu bouges sans te paralyser.', es: 'Te mueves sin paralizarte.' },
      { fr: 'Tu peux te blesser en voulant aller trop vite.', es: 'Puedes lesionarte queriendo ir demasiado rápido.' }
    ),
    lvl(
      { fr: 'Tu réfléchis un instant avant d’enchaîner.', es: 'Piensas un instante antes de encadenar.' },
      { fr: 'Tu combines réflexion et mouvement.', es: 'Combinas reflexión y movimiento.' },
      { fr: 'Tu sur-analyses parfois au lieu de ressentir.', es: 'A veces sobreanalizas en lugar de sentir.' }
    ),
    lvl(
      { fr: 'Tu prends le temps de comprendre — tu préfères bien faire une fois que vite mal.', es: 'Te tomas tiempo para entender — prefieres hacer bien una vez que rápido mal.' },
      { fr: 'Tu limites les blessures évitables.', es: 'Limitas lesiones evitables.' },
      { fr: 'Tu peux procrastiner la connexion « pour être prête ».', es: 'Puedes procrastinar la conexión « para estar lista ».' }
    )
  ),
};
