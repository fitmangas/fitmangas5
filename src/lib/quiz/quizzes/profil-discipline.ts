import { opt, q } from '@/lib/quiz/build';
import { lines, type QuizDefinition } from '@/lib/quiz/types';

import { DISC_DISCIPLINE_RESULTS } from '@/lib/quiz/quizzes/profil-discipline-reports';

const D = { rouge: 2 };
const E = { jaune: 2 };
const A = { vert: 2 };
const M = { bleu: 2 };

/** Options mélangées à chaque question — A n’est jamais toujours « Directe ». */
export const quizProfilDiscipline: QuizDefinition = {
  slug: 'profil-discipline',
  order: 1,
  accent: '#C45D3E',
  discLike: true,
  eyebrow: { fr: 'Évaluation · 12 situations', es: 'Evaluación · 12 situaciones' },
  title: {
    fr: 'Quel est ton profil de discipline ?',
    es: '¿Cuál es tu perfil de disciplina?',
  },
  description: {
    fr: '12 situations sport / agenda. Rapport : graphiques, texte et PDF.',
    es: '12 situaciones deporte / agenda. Informe: gráficos, texto y PDF.',
  },
  durationHint: { fr: '~6 min', es: '~6 min' },
  briefing: lines(
    [
      'Des situations concrètes. Choisis celle qui te ressemble le plus.',
      'Il n’y a pas de bonne réponse.',
      'Les scores restent cachés jusqu’au rapport.',
    ],
    [
      'Situaciones concretas. Elige la que más se te parece.',
      'No hay respuesta correcta.',
      'Las puntuaciones se ocultan hasta el informe.',
    ],
  ),
  cta: { fr: 'Tester le cadre 7 jours', es: 'Probar el marco 7 días' },
  questions: [
    q(
      'q1',
      'Un imprévu casse le créneau que tu avais prévu. Ton premier réflexe…',
      'Un imprevisto rompe el horario que tenías. Tu primer reflejo…',
      [
        opt('a', 'Tu improvises autre chose « pour garder l’élan » — souvent plus léger.', 'Improvisas otra cosa « para no perder el impulso » — a menudo más ligera.', E),
        opt('b', 'Tu le recales tout de suite, même plus tôt. Le créneau ne se discute pas.', 'Lo recolocas ya, aunque sea más temprano. El horario no se discute.', D),
        opt('c', 'Tu recalcules charge, sommeil, logique — tu ne bouges que si ça reste cohérent.', 'Recalculas carga, sueño, lógica — solo te mueves si sigue siendo coherente.', M),
        opt('d', 'Tu cèdes : « cette fois ça va ». Tu n’aimes pas te battre contre l’agenda des autres.', 'Cedes: « esta vez da igual ». No te gusta pelear contra la agenda de los demás.', A),
      ],
    ),
    q(
      'q2',
      'Dans un cours, la coach change la consigne en cours de route. Toi…',
      'En una clase, la coach cambia la consigna a mitad. Tú…',
      [
        opt('a', 'Tu te tends : tu avais enfin compris. Tu as besoin qu’on t’accompagne.', 'Te tensas: por fin habías entendido. Necesitas que te acompañen.', A),
        opt('b', 'Tu veux savoir pourquoi on change. Sans raison, tu décroches.', 'Quieres saber por qué se cambia. Sin razón, te desconectas.', M),
        opt('c', 'Tu suis l’énergie. Le changement te va s’il reste vivant.', 'Sigues la energía. El cambio te va si sigue vivo.', E),
        opt('d', 'Tu t’adaptes vite si le nouveau but est clair. Sinon tu t’impatientes.', 'Te adaptas rápido si el nuevo objetivo es claro. Si no, te impacientas.', D),
      ],
    ),
    q(
      'q3',
      'On te corrige devant le groupe (même en visio). Ce que tu ressens…',
      'Te corrigen delante del grupo (aunque sea en visio). Lo que sientes…',
      [
        opt('a', 'OK si c’est utile et court. Tu n’as pas besoin qu’on adoucisse.', 'OK si es útil y corto. No necesitas que lo endulcen.', D),
        opt('b', 'Tu écoutes le détail technique. Le regard des autres te pèse moins que l’imprécision.', 'Escuchas el detalle técnico. La mirada de las demás pesa menos que la imprecisión.', M),
        opt('c', 'Ça va si le ton reste humain. Un rire, un lien, tu encaisses.', 'Va si el tono sigue humano. Una risa, un vínculo, lo asumes.', E),
        opt('d', 'Tu rougis. Tu as peur d’avoir dérangé. Tu aimerais que ce soit plus discret.', 'Te sonrojas. Temes haber molestado. Preferirías que fuera más discreto.', A),
      ],
    ),
    q(
      'q4',
      'On te demande de choisir : aller plus vite, ou mieux faire. Toi…',
      'Te piden elegir: ir más rápido, o hacerlo mejor. Tú…',
      [
        opt('a', 'Ce qui garde le plaisir. Si ça devient une corvée, tu sors.', 'Lo que conserve el gusto. Si se vuelve una obligación, sales.', E),
        opt('b', 'Ce qui ne casse pas le groupe ni le rythme habituel.', 'Lo que no rompa el grupo ni el ritmo habitual.', A),
        opt('c', 'Le résultat d’abord. Tu accélères, tu ajusteras après.', 'El resultado primero. Aceleras, ajustarás después.', D),
        opt('d', 'Mieux faire. Vitesse sans qualité, ça ne compte pas.', 'Hacerlo mejor. Velocidad sin calidad no cuenta.', M),
      ],
    ),
    q(
      'q5',
      'Ce qui te fait vraiment démarrer une séance, ce n’est pas « la motivation ». C’est…',
      'Lo que de verdad te hace empezar una sesión no es « la motivación ». Es…',
      [
        opt('a', 'Un plan clair : durée, ordre, pourquoi chaque chose.', 'Un plan claro: duración, orden, por qué cada cosa.', M),
        opt('b', 'Un objectif net et un chrono. Tu entres, tu exécutes.', 'Un objetivo nítido y un tiempo. Entras y ejecutas.', D),
        opt('c', 'Savoir que quelqu’un t’attend. Le lien fait le premier pas.', 'Saber que alguien te espera. El vínculo da el primer paso.', A),
        opt('d', 'Une étincelle : musique, groupe, envie de te sentir vivante.', 'Una chispa: música, grupo, ganas de sentirte viva.', E),
      ],
    ),
    q(
      'q6',
      'Ce qui t’irrite le plus dans un programme en ligne…',
      'Lo que más te irrita de un programa online…',
      [
        opt('a', 'Trop seule : personne ne remarque si tu disparais.', 'Demasiado sola: nadie nota si desapareces.', A),
        opt('b', 'Trop monotone : tu t’ennuies et tu zappes.', 'Demasiado monótono: te aburres y saltas.', E),
        opt('c', 'Trop flou : tu ne sais pas si tu « fais juste ».', 'Demasiado vago: no sabes si lo haces « bien ».', M),
        opt('d', 'Trop lent, trop mou : tu ne vois pas le progrès.', 'Demasiado lento, demasiado flojo: no ves el progreso.', D),
      ],
    ),
    q(
      'q7',
      'Tu rates une semaine entière. Premier réflexe…',
      'Fallaste una semana entera. Primer reflejo…',
      [
        opt('a', 'Tu analyses pourquoi le système a cassé, avant de reprendre.', 'Analizas por qué se rompió el sistema, antes de retomar.', M),
        opt('b', 'Tu te remets une barre plus haute pour « rattraper ».', 'Te pones el listón más alto para « recuperar ».', D),
        opt('c', 'Tu te sens coupable… et tu évites d’en parler.', 'Te sientes culpable… y evitas hablarlo.', A),
        opt('d', 'Tu te racontes une histoire légère — puis tu remets à plus tard.', 'Te cuentas una historia ligera — y lo dejas para luego.', E),
      ],
    ),
    q(
      'q8',
      'Sous pression (deadline, maison, tête pleine), ton corps…',
      'Bajo presión (deadline, casa, cabeza llena), tu cuerpo…',
      [
        opt('a', 'Cherche de l’air : bouger pour se changer les idées, pas pour « performer ».', 'Busca aire: moverse para cambiar de tema, no para « rendir ».', E),
        opt('b', 'Veut du connu. Un rituel doux, pas une nouveauté.', 'Quiere lo conocido. Un ritual suave, no una novedad.', A),
        opt('c', 'Veut un effort net, vite fait, pour clore le sujet.', 'Quiere un esfuerzo nítido, rápido, para cerrar el tema.', D),
        opt('d', 'Veut réduire les variables. Moins, mais juste. Ou rien si c’est sale.', 'Quiere reducir variables. Menos, pero bien. O nada si sale chapucero.', M),
      ],
    ),
    q(
      'q9',
      'Une partenaire de cours est en retard / brouillonne. Toi…',
      'Una compañera de clase llega tarde / desordenada. Tú…',
      [
        opt('a', 'Tu notes que le cadre n’est pas tenu. Ça te fait douter du sérieux.', 'Notas que el marco no se sostiene. Te hace dudar del rigor.', M),
        opt('b', 'Tu t’adaptes pour ne pas créer de tension.', 'Te adaptas para no crear tensión.', A),
        opt('c', 'Tu compenses avec de l’ambiance. Tu dédramatises.', 'Compensas con ambiente. Quitas hierro.', E),
        opt('d', 'Ça t’agace. Tu es là pour avancer, pas pour attendre.', 'Te fastidia. Estás para avanzar, no para esperar.', D),
      ],
    ),
    q(
      'q10',
      'Pour tenir 3 mois, ce dont tu as vraiment besoin…',
      'Para sostener 3 meses, lo que de verdad necesitas…',
      [
        opt('a', 'De la variété et une énergie qui te tire — pas une liste grise.', 'Variedad y una energía que te tire — no una lista gris.', E),
        opt('b', 'Une méthode stable + des corrections qui lèvent le doute.', 'Un método estable + correcciones que quiten la duda.', M),
        opt('c', 'Des jalons clairs et une exigence qui ne ramollit pas.', 'Hitos claros y una exigencia que no se ablande.', D),
        opt('d', 'Un rendez-vous humain : être attendue, semaine après semaine.', 'Una cita humana: que te esperen, semana tras semana.', A),
      ],
    ),
    q(
      'q11',
      'Comment tu décides de t’inscrire à un cadre (cours, essai, studio)…',
      'Cómo decides apuntarte a un marco (clase, prueba, estudio)…',
      [
        opt('a', 'Lentement. Tu as besoin de sentir que tu seras bien traitée.', 'Despacio. Necesitas sentir que te van a tratar bien.', A),
        opt('b', 'Vite, si ça a l’air de mener quelque part. Tu n’aimes pas ruminer.', 'Rápido, si parece llevar a algún sitio. No te gusta rumiar.', D),
        opt('c', 'Après avoir lu comment ça marche : horaires, règles, sérieux.', 'Después de leer cómo funciona: horarios, reglas, rigor.', M),
        opt('d', 'Si ça te parle, si les gens ont l’air vivants. Le feeling d’abord.', 'Si te habla, si la gente se ve viva. El feeling primero.', E),
      ],
    ),
    q(
      'q12',
      'Ta plus grande peur, concrètement, avec « me remettre au sport »…',
      'Tu mayor miedo, en concreto, con « volver al deporte »…',
      [
        opt('a', 'Mal faire, me tromper, me blesser faute de critères.', 'Hacerlo mal, equivocarme, lesionarme por falta de criterios.', M),
        opt('b', 'Que ça devienne une corvée sans joie.', 'Que se vuelva una obligación sin alegría.', E),
        opt('c', 'Être seule à nouveau — et tout faire tomber.', 'Volver a estar sola — y dejarlo todo.', A),
        opt('d', 'Perdre du temps sans progresser.', 'Perder tiempo sin progresar.', D),
      ],
    ),
  ],
  results: DISC_DISCIPLINE_RESULTS,
};
