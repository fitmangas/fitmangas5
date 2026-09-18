import { opt, q } from '@/lib/quiz/build';
import { lines, t, type QuizDefinition } from '@/lib/quiz/types';

import { DISC_DISCIPLINE_RESULTS } from '@/lib/quiz/quizzes/profil-discipline-reports';

const D = { rouge: 2 };
const I = { jaune: 2 };
const S = { vert: 2 };
const C = { bleu: 2 };

/** Évaluation comportementale type DISC (sport / agenda) — pas un sticker, pas une licence DISC. */
export const quizProfilDiscipline: QuizDefinition = {
  slug: 'profil-discipline',
  order: 1,
  accent: '#C45D3E',
  discLike: true,
  eyebrow: { fr: 'Évaluation · 12 situations', es: 'Evaluación · 12 situaciones' },
  title: {
    fr: 'Ton profil de discipline',
    es: 'Tu perfil de disciplina',
  },
  description: {
    fr: 'Inspiré du DISC : quatre couleurs de comportement — pas un test de personnalité, pas un horoscope fitness. Tu réponds à des situations. À la fin : un rapport (forces, stress, peurs, comment te parler) + PDF.',
    es: 'Inspirado en DISC: cuatro colores de comportamiento — no un test de personalidad, no un horóscopo fitness. Respondes a situaciones. Al final: un informe (fuerzas, estrés, miedos, cómo hablarte) + PDF.',
  },
  durationHint: { fr: '~6 min', es: '~6 min' },
  briefing: lines(
    [
      'Ce n’est pas un test de personnalité. C’est une lecture de ton comportement quand il s’agit de bouger, de tenir un créneau, de te faire corriger.',
      'Il n’y a pas de bonne réponse. Choisis celle qui te ressemble le plus — même si tu n’aimes pas te le dire.',
      'Les scores restent cachés jusqu’au rapport. On ne te colle pas une étiquette en cours de route.',
    ],
    [
      'No es un test de personalidad. Es una lectura de tu comportamiento cuando se trata de moverte, sostener un horario, dejarte corregir.',
      'No hay respuesta correcta. Elige la que más se te parece — aunque no te guste decírtelo.',
      'Las puntuaciones se ocultan hasta el informe. No te pegamos una etiqueta a mitad de camino.',
    ],
  ),
  cta: { fr: 'Tester le cadre 7 jours', es: 'Probar el marco 7 días' },
  questions: [
    q(
      'q1',
      'Un imprévu casse le créneau que tu avais posé. Ton premier mouvement…',
      'Un imprevisto rompe el horario que habías fijado. Tu primer movimiento…',
      [
        opt('a', 'Tu le recales tout de suite, même plus tôt. Le créneau ne se discute pas.', 'Lo recolocas ya, aunque sea más temprano. El horario no se discute.', D),
        opt('b', 'Tu improvises autre chose « pour garder l’élan » — souvent plus léger.', 'Improvisas otra cosa « para no perder el impulso » — a menudo más ligera.', I),
        opt('c', 'Tu cèdes : « cette fois ça va ». Tu n’aimes pas te battre contre l’agenda des autres.', 'Cedes: « esta vez da igual ». No te gusta pelear contra la agenda de los demás.', S),
        opt('d', 'Tu recalcules charge, sommeil, logique — tu ne bouges que si ça reste cohérent.', 'Recalculas carga, sueño, lógica — solo te mueves si sigue siendo coherente.', C),
      ],
    ),
    q(
      'q2',
      'Dans un cours, la coach change la consigne en cours de route. Toi…',
      'En una clase, la coach cambia la consigna a mitad. Tú…',
      [
        opt('a', 'Tu t’adaptes vite si le nouveau but est clair. Sinon tu t’impatientes.', 'Te adaptas rápido si el nuevo objetivo es claro. Si no, te impacientas.', D),
        opt('b', 'Tu suis l’énergie. Le changement te va s’il reste vivant.', 'Sigues la energía. El cambio te va si sigue vivo.', I),
        opt('c', 'Tu te tends : tu avais enfin compris. Tu as besoin qu’on t’accompagne.', 'Te tensas: por fin habías entendido. Necesitas que te acompañen.', S),
        opt('d', 'Tu veux savoir pourquoi on change. Sans raison, tu décroches.', 'Quieres saber por qué se cambia. Sin razón, te desconectas.', C),
      ],
    ),
    q(
      'q3',
      'On te corrige devant le groupe (même en visio). Ton système…',
      'Te corrigen delante del grupo (aunque sea en visio). Tu sistema…',
      [
        opt('a', 'OK si c’est utile et court. Tu n’as pas besoin qu’on adoucisse.', 'OK si es útil y corto. No necesitas que lo endulcen.', D),
        opt('b', 'Ça va si le ton reste humain. Un rire, un lien, tu encaisses.', 'Va si el tono sigue humano. Una risa, un vínculo, lo asumes.', I),
        opt('c', 'Tu rougis. Tu as peur d’avoir dérangé. Tu aimerais que ce soit plus discret.', 'Te sonrojas. Temes haber molestado. Preferirías que fuera más discreto.', S),
        opt('d', 'Tu écoutes le détail technique. Le regard des autres te pèse moins que l’imprécision.', 'Escuchas el detalle técnico. La mirada de las demás pesa menos que la imprecisión.', C),
      ],
    ),
    q(
      'q4',
      'On te demande de choisir : aller plus vite, ou mieux faire. Toi…',
      'Te piden elegir: ir más rápido, o hacerlo mejor. Tú…',
      [
        opt('a', 'Le résultat d’abord. Tu accélères, tu ajusteras après.', 'El resultado primero. Aceleras, ajustarás después.', D),
        opt('b', 'Ce qui garde le plaisir. Si ça devient une corvée, tu sors.', 'Lo que conserve el gusto. Si se vuelve una obligación, sales.', I),
        opt('c', 'Ce qui ne casse pas le groupe ni le rythme habituel.', 'Lo que no rompa el grupo ni el ritmo habitual.', S),
        opt('d', 'Mieux faire. Vitesse sans qualité, ça ne compte pas.', 'Hacerlo mejor. Velocidad sin calidad no cuenta.', C),
      ],
    ),
    q(
      'q5',
      'Ce qui te fait vraiment démarrer une séance, ce n’est pas « la motivation ». C’est…',
      'Lo que de verdad te hace empezar una sesión no es « la motivación ». Es…',
      [
        opt('a', 'Un objectif net et un chrono. Tu entres, tu exécutes.', 'Un objetivo nítido y un chrono. Entras y ejecutas.', D),
        opt('b', 'Une étincelle : musique, groupe, envie de te sentir vivante.', 'Una chispa: música, grupo, ganas de sentirte viva.', I),
        opt('c', 'Savoir que quelqu’un t’attend. Le lien fait le premier pas.', 'Saber que alguien te espera. El vínculo da el primer paso.', S),
        opt('d', 'Un plan logique : durée, ordre, pourquoi chaque chose.', 'Un plan lógico: duración, orden, por qué cada cosa.', C),
      ],
    ),
    q(
      'q6',
      'Ce qui t’irrite le plus dans un programme en ligne…',
      'Lo que más te irrita de un programa online…',
      [
        opt('a', 'Trop lent, trop mou : tu ne vois pas le progrès.', 'Demasiado lento, demasiado flojo: no ves el progreso.', D),
        opt('b', 'Trop monotone : tu t’ennuies et tu zappes.', 'Demasiado monótono: te aburres y saltas.', I),
        opt('c', 'Trop seule : personne ne remarque si tu disparais.', 'Demasiado sola: nadie nota si desapareces.', S),
        opt('d', 'Trop flou : tu ne sais pas si tu « fais juste ».', 'Demasiado vago: no sabes si lo haces « bien ».', C),
      ],
    ),
    q(
      'q7',
      'Tu rates une semaine entière. Premier réflexe…',
      'Fallaste una semana entera. Primer reflejo…',
      [
        opt('a', 'Tu te remets une barre plus haute pour « rattraper ».', 'Te pones el listón más alto para « recuperar ».', D),
        opt('b', 'Tu te racontes une histoire légère — puis tu remets à plus tard.', 'Te cuentas una historia ligera — y lo dejas para luego.', I),
        opt('c', 'Tu te sens coupable… et tu évites d’en parler.', 'Te sientes culpable… y evitas hablarlo.', S),
        opt('d', 'Tu analyses pourquoi le système a cassé, avant de reprendre.', 'Analizas por qué se rompió el sistema, antes de retomar.', C),
      ],
    ),
    q(
      'q8',
      'Sous pression (deadline, maison, tête pleine), ton corps…',
      'Bajo presión (deadline, casa, cabeza llena), tu cuerpo…',
      [
        opt('a', 'Veut un effort net, vite fait, pour clore le sujet.', 'Quiere un esfuerzo nítido, rápido, para cerrar el tema.', D),
        opt('b', 'Cherche de l’air : bouger pour se changer les idées, pas pour « performer ».', 'Busca aire: moverse para cambiar de tema, no para « rendir ».', I),
        opt('c', 'Veut du connu. Un rituel doux, pas une nouveauté.', 'Quiere lo conocido. Un ritual suave, no una novedad.', S),
        opt('d', 'Veut réduire les variables. Moins, mais juste. Ou rien si c’est sale.', 'Quiere reducir variables. Menos, pero bien. O nada si sale chapucero.', C),
      ],
    ),
    q(
      'q9',
      'Une partenaire de cours est en retard / brouillonne. Toi…',
      'Una compañera de clase llega tarde / desordenada. Tú…',
      [
        opt('a', 'Ça t’agace. Tu es là pour avancer, pas pour attendre.', 'Te fastidia. Estás para avanzar, no para esperar.', D),
        opt('b', 'Tu compenses avec de l’ambiance. Tu dédramatises.', 'Compensas con ambiente. Quitas hierro.', I),
        opt('c', 'Tu t’adaptes pour ne pas créer de tension.', 'Te adaptas para no crear tensión.', S),
        opt('d', 'Tu notes que le cadre n’est pas tenu. Ça te fait douter du sérieux.', 'Notas que el marco no se sostiene. Te hace dudar del rigor.', C),
      ],
    ),
    q(
      'q10',
      'Pour tenir 3 mois, ce dont tu as vraiment besoin…',
      'Para sostener 3 meses, lo que de verdad necesitas…',
      [
        opt('a', 'Des jalons clairs et une exigence qui ne ramollit pas.', 'Hitos claros y una exigencia que no se ablande.', D),
        opt('b', 'De la variété et une énergie qui te tire — pas une liste grise.', 'Variedad y una energía que te tire — no una lista gris.', I),
        opt('c', 'Un rendez-vous humain : être attendue, semaine après semaine.', 'Una cita humana: que te esperen, semana tras semana.', S),
        opt('d', 'Une méthode stable + des corrections qui lèvent le doute.', 'Un método estable + correcciones que quiten la duda.', C),
      ],
    ),
    q(
      'q11',
      'Comment tu prends la décision de t’inscrire à un cadre (cours, essai, studio)…',
      'Cómo decides apuntarte a un marco (clase, prueba, estudio)…',
      [
        opt('a', 'Vite, si ça a l’air de mener quelque part. Tu n’aimes pas ruminer.', 'Rápido, si parece llevar a algún sitio. No te gusta rumiar.', D),
        opt('b', 'Si ça te parle, si les gens ont l’air vivants. Le feeling d’abord.', 'Si te habla, si la gente se ve viva. El feeling primero.', I),
        opt('c', 'Lentement. Tu as besoin de sentir que tu seras bien traitée.', 'Despacio. Necesitas sentir que te van a tratar bien.', S),
        opt('d', 'Après avoir lu comment ça marche : horaires, règles, sérieux.', 'Después de leer cómo funciona: horarios, reglas, rigor.', C),
      ],
    ),
    q(
      'q12',
      'Ta plus grande peur, concrètement, avec « me remettre au sport »…',
      'Tu mayor miedo, en concreto, con « volver al deporte »…',
      [
        opt('a', 'Perdre du temps sans progresser.', 'Perder tiempo sin progresar.', D),
        opt('b', 'Que ça devienne une corvée sans joie.', 'Que se vuelva una obligación sin alegría.', I),
        opt('c', 'Être seule à nouveau — et tout faire tomber.', 'Volver a estar sola — y dejarlo todo.', S),
        opt('d', 'Mal faire, me tromper, me blesser faute de critères.', 'Hacerlo mal, equivocarme, lesionarme por falta de criterios.', C),
      ],
    ),
  ],
  results: DISC_DISCIPLINE_RESULTS,
};
