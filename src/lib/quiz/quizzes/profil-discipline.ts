import { opt, q } from '@/lib/quiz/build';
import { lines, type QuizDefinition } from '@/lib/quiz/types';

import { DISC_DISCIPLINE_RESULTS } from '@/lib/quiz/quizzes/profil-discipline-reports';

const D = { rouge: 2 };
const E = { jaune: 2 };
const A = { vert: 2 };
const M = { bleu: 2 };
/** q13 tranche : poids ×2 pour qu’un rattrapage depuis −2 ne crée plus d’égalité 31/31. */
const D13 = { rouge: 4 };
const E13 = { jaune: 4 };
const A13 = { vert: 4 };
const M13 = { bleu: 4 };

/** Options mélangées à chaque question — A n’est jamais toujours « Directe ». */
export const quizProfilDiscipline: QuizDefinition = {
  slug: 'profil-discipline',
  order: 1,
  accent: '#C45D3E',
  discLike: true,
  eyebrow: { fr: 'Évaluation · 13 situations', es: 'Evaluación · 13 situaciones' },
  title: {
    fr: 'Quel est ton profil de discipline\u00A0?',
    es: '¿Cuál es tu perfil de disciplina?',
  },
  description: {
    fr: '13 situations sport / agenda. Rapport : graphiques, texte et PDF.',
    es: '13 situaciones deporte / agenda. Informe: gráficos, texto y PDF.',
  },
  durationHint: { fr: '~7 min', es: '~7 min' },
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
      'Un imprévu t’oblige à annuler le créneau que tu avais prévu. Que fais-tu\u00A0?',
      'Un imprevisto te obliga a cancelar el horario que tenías. ¿Qué haces\u00A0?',
      [
        opt('a', 'Tu improvises autre chose, plus léger, pour bouger quand même.', 'Improvisas otra cosa, más ligera, para moverte igual.', E),
        opt('b', 'Tu le remets tout de suite, même plus tôt. Le créneau reste.', 'Lo recolocas ya, aunque sea más temprano. El horario se mantiene.', D),
        opt('c', 'Tu regardes si tu peux vraiment le décaler (fatigue, sommeil). Sinon tu attends.', 'Miras si de verdad puedes moverlo (cansancio, sueño). Si no, esperas.', M),
        opt('d', 'Tu laisses tomber pour cette fois. Tu n’as pas envie de te battre avec l’agenda.', 'Lo dejas pasar esta vez. No quieres pelearte con la agenda.', A),
      ],
    ),
    q(
      'q2',
      'En cours, la coach change l’exercice en plein milieu. Toi\u00A0?',
      'En clase, la coach cambia el ejercicio a mitad. ¿Tú\u00A0?',
      [
        opt('a', 'Tu te sens perdue : tu venais juste de comprendre. Tu as besoin d’aide.', 'Te sientes perdida: justo lo habías entendido. Necesitas ayuda.', A),
        opt('b', 'Tu veux savoir pourquoi. Sans explication, tu décroches.', 'Quieres saber por qué. Sin explicación, te desconectas.', M),
        opt('c', 'Tu suis. Le changement te va s’il reste vivant.', 'Sigues. El cambio te va si sigue vivo.', E),
        opt('d', 'Tu t’adaptes vite si le but est clair. Sinon tu t’impatientes.', 'Te adaptas rápido si el objetivo es claro. Si no, te impacientas.', D),
      ],
    ),
    q(
      'q3',
      'On te corrige devant le groupe (même en visio). Tu ressens\u00A0?',
      'Te corrigen delante del grupo (aunque sea en visio). ¿Qué sientes\u00A0?',
      [
        opt('a', 'OK si c’est utile et court. Pas besoin d’adoucir.', 'OK si es útil y corto. No hace falta endulzarlo.', D),
        opt('b', 'Tu écoutes le détail. Tu te soucies plus de bien faire que du regard des autres.', 'Escuchas el detalle. Te importa más hacerlo bien que la mirada de las demás.', M),
        opt('c', 'Ça passe si le ton reste chaleureux. Un sourire, et tu encaisses.', 'Pasa si el tono es cálido. Una sonrisa y lo asumes.', E),
        opt('d', 'Tu rougis. Tu as peur d’avoir dérangé. Tu aurais préféré en privé.', 'Te sonrojas. Temes haber molestado. Preferías que fuera en privado.', A),
      ],
    ),
    q(
      'q4',
      'On te demande : plus vite, ou mieux fait\u00A0?',
      'Te piden: ¿más rápido, o mejor hecho\u00A0?',
      [
        opt('a', 'Ce qui reste agréable. Si ça devient une corvée, tu arrêtes.', 'Lo que siga siendo agradable. Si se vuelve una obligación, paras.', E),
        opt('b', 'Ce qui ne dérange personne et garde le rythme du groupe.', 'Lo que no moleste a nadie y mantenga el ritmo del grupo.', A),
        opt('c', 'Le résultat d’abord. Tu vas vite, tu corriges après.', 'El resultado primero. Vas rápido, corriges después.', D),
        opt('d', 'Mieux fait. Aller vite sans qualité, ça ne compte pas.', 'Mejor hecho. Ir rápido sin calidad no cuenta.', M),
      ],
    ),
    q(
      'q5',
      'Ce qui te fait vraiment démarrer une séance, ce n’est pas « la motivation ». C’est\u00A0:',
      'Lo que de verdad te hace empezar una sesión no es « la motivación ». Es:',
      [
        opt('a', 'Un plan clair : combien de temps, dans quel ordre, pourquoi.', 'Un plan claro: cuánto tiempo, en qué orden, por qué.', M),
        opt('b', 'Un objectif net et une durée. Tu entres et tu fais.', 'Un objetivo claro y un tiempo. Entras y haces.', D),
        opt('c', 'Savoir que quelqu’un t’attend. Ça te fait lever.', 'Saber que alguien te espera. Eso te hace levantarte.', A),
        opt('d', 'Une envie : musique, groupe, te sentir vivante.', 'Una gana: música, grupo, sentirte viva.', E),
      ],
    ),
    q(
      'q6',
      'Ce qui t’irrite le plus dans un programme en ligne\u00A0?',
      '¿Lo que más te irrita de un programa online\u00A0?',
      [
        opt('a', 'Être seule : personne ne remarque si tu disparais.', 'Estar sola: nadie nota si desapareces.', A),
        opt('b', 'L’ennui : c’est toujours pareil, tu zappes.', 'El aburrimiento: siempre igual, saltas.', E),
        opt('c', 'Le flou : tu ne sais pas si tu fais correctement.', 'Lo vago: no sabes si lo haces bien.', M),
        opt('d', 'La lenteur : tu ne vois pas de progrès.', 'La lentitud: no ves progreso.', D),
      ],
    ),
    q(
      'q7',
      'Tu rates une semaine entière. Premier réflexe\u00A0?',
      'Fallaste una semana entera. ¿Primer reflejo\u00A0?',
      [
        opt('a', 'Tu cherches pourquoi ça a loupé, avant de reprendre.', 'Buscas por qué falló, antes de retomar.', M),
        opt('b', 'Tu te fixes une barre plus haute pour « rattraper ».', 'Te pones el listón más alto para « recuperar ».', D),
        opt('c', 'Tu te sens coupable… et tu n’en parles à personne.', 'Te sientes culpable… y no se lo cuentas a nadie.', A),
        opt('d', 'Tu te dis que ce n’est pas grave — et tu remets à plus tard.', 'Te dices que no pasa nada — y lo dejas para luego.', E),
      ],
    ),
    q(
      'q8',
      'Sous pression (travail, maison, tête pleine), ton corps veut\u00A0:',
      'Bajo presión (trabajo, casa, cabeza llena), tu cuerpo quiere:',
      [
        opt('a', 'Bouger pour se vider la tête — pas pour « performer ».', 'Moverse para vaciar la cabeza — no para « rendir ».', E),
        opt('b', 'Du connu. Un rituel simple, pas quelque chose de nouveau.', 'Lo conocido. Un ritual simple, nada nuevo.', A),
        opt('c', 'Un effort court et net, pour en finir.', 'Un esfuerzo corto y claro, para terminar.', D),
        opt('d', 'Moins, mais bien fait. Ou rien si c’est bâclé.', 'Menos, pero bien hecho. O nada si sale chapucero.', M),
      ],
    ),
    q(
      'q9',
      'Une partenaire de cours arrive en retard / est désorganisée. Toi\u00A0?',
      'Una compañera llega tarde / desordenada. ¿Tú\u00A0?',
      [
        opt('a', 'Tu te dis que le cadre n’est pas tenu. Ça te fait douter.', 'Piensas que el marco no se sostiene. Te hace dudar.', M),
        opt('b', 'Tu t’adaptes pour éviter la tension.', 'Te adaptas para evitar tensión.', A),
        opt('c', 'Tu détends l’ambiance. Tu ne dramatises pas.', 'Quitas hierro. No dramatizas.', E),
        opt('d', 'Ça t’agace. Tu es là pour avancer, pas pour attendre.', 'Te fastidia. Estás para avanzar, no para esperar.', D),
      ],
    ),
    q(
      'q10',
      'Pour tenir 3 mois, tu as vraiment besoin de\u00A0:',
      'Para sostener 3 meses, de verdad necesitas:',
      [
        opt('a', 'De la variété et une énergie qui te tire — pas une liste ennuyeuse.', 'Variedad y una energía que te tire — no una lista aburrida.', E),
        opt('b', 'Une méthode stable et des corrections qui lèvent le doute.', 'Un método estable y correcciones que quiten la duda.', M),
        opt('c', 'Des objectifs clairs et une exigence qui ne baisse pas.', 'Objetivos claros y una exigencia que no baje.', D),
        opt('d', 'Quelqu’un qui t’attend, semaine après semaine.', 'Alguien que te espera, semana tras semana.', A),
      ],
    ),
    q(
      'q11',
      'Comment tu décides de t’inscrire (cours, essai, studio)\u00A0?',
      '¿Cómo decides apuntarte (clase, prueba, estudio)\u00A0?',
      [
        opt('a', 'Lentement. Tu as besoin de sentir que tu seras bien traitée.', 'Despacio. Necesitas sentir que te van a tratar bien.', A),
        opt('b', 'Vite, si ça a l’air d’avancer. Tu n’aimes pas tourner en rond.', 'Rápido, si parece que avanza. No te gusta dar vueltas.', D),
        opt('c', 'Après avoir lu comment ça marche : horaires, règles, sérieux.', 'Después de leer cómo funciona: horarios, reglas, rigor.', M),
        opt('d', 'Si ça te parle et si les gens ont l’air vivants. Le feeling d’abord.', 'Si te habla y la gente se ve viva. El feeling primero.', E),
      ],
    ),
    q(
      'q12',
      'Ta plus grande peur avec « me remettre au sport »\u00A0?',
      '¿Tu mayor miedo con « volver al deporte »\u00A0?',
      [
        opt('a', 'Mal faire, me tromper, me blesser faute de repères.', 'Hacerlo mal, equivocarme, lesionarme por falta de criterios.', M),
        opt('b', 'Que ça devienne une corvée sans plaisir.', 'Que se vuelva una obligación sin gusto.', E),
        opt('c', 'Être seule à nouveau — et tout lâcher.', 'Volver a estar sola — y dejarlo todo.', A),
        opt('d', 'Perdre du temps sans progresser.', 'Perder tiempo sin progresar.', D),
      ],
    ),
    q(
      'q13',
      'Dernière : pour tenir 8 semaines, tu ne gardes qu’UNE chose. Laquelle\u00A0?',
      'Última: para aguantar 8 semanas, solo te quedas con UNA cosa. ¿Cuál\u00A0?',
      [
        opt('a', 'Un objectif mesurable et une date. Le reste suit.', 'Un objetivo medible y una fecha. El resto viene.', D13),
        opt('b', 'De l’élan et du lien — une énergie qui me tire.', 'Impulso y vínculo — una energía que me tire.', E13),
        opt('c', 'Quelqu’un qui m’attend, un rendez-vous fixe.', 'Alguien que me espera, una cita fija.', A13),
        opt('d', 'Une méthode claire, des critères, pas d’à-peu-près.', 'Un método claro, criterios, nada a medias.', M13),
      ],
    ),
  ],
  results: DISC_DISCIPLINE_RESULTS,
};
