import type { QuizDefinition } from '@/lib/quiz/types';

export const quizCarteStress: QuizDefinition = {
  slug: 'carte-stress',
  order: 4,
  accent: '#7A9EAE',
  eyebrow: { fr: 'Corps · 7 questions', es: 'Cuerpo · 7 preguntas' },
  title: {
    fr: 'Ta carte du stress dans le corps',
    es: 'Tu mapa del estrés en el cuerpo',
  },
  description: {
    fr: 'Où ça bloque vraiment : mâchoire, ventre, dos… Pas un diagnostic médical — une lecture sensible pour savoir ce dont ton système a besoin.',
    es: 'Dónde se bloquea de verdad: mandíbula, vientre, espalda… No es un diagnóstico médico — una lectura sensible de lo que necesita tu sistema.',
  },
  durationHint: { fr: '~2 min', es: '~2 min' },
  cta: { fr: 'Tester le cadre 7 jours', es: 'Probar el marco 7 días' },
  questions: [
    {
      id: 'q1',
      prompt: {
        fr: 'En fin de journée tendue, tu le sens surtout…',
        es: 'Al final de un día tenso, lo sientes sobre todo…',
      },
      options: [
        { id: 'a', label: { fr: 'Mâchoire / nuque / tempes.', es: 'Mandíbula / nuca / sienes.' }, scores: { machoires: 2 } },
        { id: 'b', label: { fr: 'Ventre / respiration courte.', es: 'Vientre / respiración corta.' }, scores: { ventre: 2 } },
        { id: 'c', label: { fr: 'Dos / lombaires / épaules lourdes.', es: 'Espalda / lumbares / hombros pesados.' }, scores: { dos: 2 } },
        { id: 'd', label: { fr: 'Partout — ou « nulle part », juste épuisée.', es: 'En todas partes — o « en ninguna », solo agotada.' }, scores: { diffuse: 2 } },
      ],
    },
    {
      id: 'q2',
      prompt: {
        fr: 'Quand tu es stressée, ton sommeil…',
        es: 'Cuando estás estresada, tu sueño…',
      },
      options: [
        { id: 'a', label: { fr: 'Grince des dents / réveils nuque.', es: 'Rechinas / despiertas con la nuca.' }, scores: { machoires: 2 } },
        { id: 'b', label: { fr: 'Réveils 3h / estomac noué.', es: 'Despiertas a las 3h / estómago anudado.' }, scores: { ventre: 2 } },
        { id: 'c', label: { fr: 'Tu te retournes, dos engourdi.', es: 'Te das vueltas, espalda entumecida.' }, scores: { dos: 2 } },
        { id: 'd', label: { fr: 'Tu dors « trop » ou presque plus.', es: 'Duermes « demasiado » o casi nada.' }, scores: { diffuse: 2 } },
      ],
    },
    {
      id: 'q3',
      prompt: {
        fr: 'Devant un écran toute la journée…',
        es: 'Delante de una pantalla todo el día…',
      },
      options: [
        { id: 'a', label: { fr: 'Tu serres sans t’en rendre compte.', es: 'Aprietas sin darte cuenta.' }, scores: { machoires: 2 } },
        { id: 'b', label: { fr: 'Tu retenues le souffle / tu te plies en avant.', es: 'Retienes el aire / te encorvas.' }, scores: { ventre: 2 } },
        { id: 'c', label: { fr: 'Les épaules montent vers les oreilles.', es: 'Los hombros suben a las orejas.' }, scores: { dos: 2 } },
        { id: 'd', label: { fr: 'Tu te figes — puis tu t’effondres le soir.', es: 'Te quedas rígida — y te derrumbas por la noche.' }, scores: { diffuse: 2 } },
      ],
    },
    {
      id: 'q4',
      prompt: {
        fr: 'Ce qui te fait du bien (quand tu y arrives)…',
        es: 'Lo que te sienta bien (cuando lo logras)…',
      },
      options: [
        { id: 'a', label: { fr: 'Relâcher le visage / mobiliser le cou.', es: 'Soltar la cara / movilizar el cuello.' }, scores: { machoires: 2 } },
        { id: 'b', label: { fr: 'Respirer bas / ouvrir le ventre.', es: 'Respirar bajo / abrir el vientre.' }, scores: { ventre: 2 } },
        { id: 'c', label: { fr: 'Allonger le dos / ouvrir la cage.', es: 'Alargar la espalda / abrir la caja.' }, scores: { dos: 2 } },
        { id: 'd', label: { fr: 'Juste être guidée — sans décider seule.', es: 'Solo que te guíen — sin decidir sola.' }, scores: { diffuse: 2 } },
      ],
    },
    {
      id: 'q5',
      prompt: {
        fr: 'Seule en vidéo, tu as tendance à…',
        es: 'Sola con un vídeo, tiendes a…',
      },
      options: [
        { id: 'a', label: { fr: 'Forcer le haut du corps sans le sentir.', es: 'Forzar la parte alta sin sentirlo.' }, scores: { machoires: 2 } },
        { id: 'b', label: { fr: 'Faire « trop d’abdos » / retenir.', es: 'Hacer « demasiados abs » / retener.' }, scores: { ventre: 2 } },
        { id: 'c', label: { fr: 'Compenser avec le dos.', es: 'Compensar con la espalda.' }, scores: { dos: 2 } },
        { id: 'd', label: { fr: 'Ne plus savoir ce qui est juste.', es: 'Ya no saber qué es correcto.' }, scores: { diffuse: 2 } },
      ],
    },
    {
      id: 'q6',
      prompt: {
        fr: 'Une correction en direct te servirait surtout à…',
        es: 'Una corrección en directo te serviría sobre todo para…',
      },
      options: [
        { id: 'a', label: { fr: 'Décoller la mâchoire / la nuque.', es: 'Soltar mandíbula / nuca.' }, scores: { machoires: 2 } },
        { id: 'b', label: { fr: 'Retrouver une respiration vraie.', es: 'Recuperar una respiración real.' }, scores: { ventre: 2 } },
        { id: 'c', label: { fr: 'Aligner sans forcer le dos.', es: 'Alinear sin forzar la espalda.' }, scores: { dos: 2 } },
        { id: 'd', label: { fr: 'Te sortir du flou « je ne sens plus rien ».', es: 'Sacarte del vacío « ya no siento nada ».' }, scores: { diffuse: 2 } },
      ],
    },
    {
      id: 'q7',
      prompt: {
        fr: 'Ce dont ton système a besoin maintenant…',
        es: 'Lo que tu sistema necesita ahora…',
      },
      options: [
        { id: 'a', label: { fr: 'Du relâchement guidé du haut.', es: 'Soltar la parte alta con guía.' }, scores: { machoires: 2 } },
        { id: 'b', label: { fr: 'Du centre qui respire — pas qui se contracte.', es: 'Un centro que respira — no que se contrae.' }, scores: { ventre: 2 } },
        { id: 'c', label: { fr: 'Du soutien / longueur, pas du « core » agressif.', es: 'Soporte / longitud, no un « core » agresivo.' }, scores: { dos: 2 } },
        { id: 'd', label: { fr: 'D’un rendez-vous où quelqu’un lit ton corps avec toi.', es: 'Una cita donde alguien lee tu cuerpo contigo.' }, scores: { diffuse: 2 } },
      ],
    },
  ],
  results: [
    {
      id: 'machoires',
      title: { fr: 'Carte : Mâchoire / Nuque', es: 'Mapa: Mandíbula / Nuca' },
      tagline: { fr: 'Ton stress monte vers le haut — tu serres ce que tu ne dis pas.', es: 'Tu estrés sube — aprietas lo que no dices.' },
      body: {
        fr: [
          'Ce n’est pas « juste une nuque ». C’est souvent de la charge mentale stockée en haut.',
          'Seule, tu peux forcer sans relâcher. Avec une correction, on te le fait sentir.',
        ],
        es: [
          'No es « solo la nuca ». A menudo es carga mental guardada arriba.',
          'Sola puedes forzar sin soltar. Con corrección, te lo hacen sentir.',
        ],
      },
      bridge: {
        fr: 'En visio, je te vois serrer — et on détend. C’est ça, la régulation réelle.',
        es: 'En visio te veo apretar — y soltamos. Esa es la regulación real.',
      },
      shareLine: { fr: 'Ma carte du stress : Mâchoire / Nuque.', es: 'Mi mapa del estrés: Mandíbula / Nuca.' },
    },
    {
      id: 'ventre',
      title: { fr: 'Carte : Ventre / Souffle', es: 'Mapa: Vientre / Respiración' },
      tagline: { fr: 'Ton stress se noue au centre — tu retiens pour tenir.', es: 'Tu estrés se anuda en el centro — retienes para aguantar.' },
      body: {
        fr: [
          'Beaucoup de femmes « tiennent » avec le ventre contracté. Ça fatigue plus que ça protège.',
          'Les vidéos d’abdos seules empirent souvent le pattern.',
        ],
        es: [
          'Muchas « aguantan » con el vientre contraído. Cansa más de lo que protege.',
          'Los vídeos de abs solos a menudo empeoran el patrón.',
        ],
      },
      bridge: {
        fr: 'Correction en direct = retrouver un centre qui respire. Pas un ventre qui combat.',
        es: 'Corrección en directo = un centro que respira. No un vientre que pelea.',
      },
      shareLine: { fr: 'Ma carte du stress : Ventre / Souffle.', es: 'Mi mapa del estrés: Vientre / Respiración.' },
    },
    {
      id: 'dos',
      title: { fr: 'Carte : Dos / Épaules', es: 'Mapa: Espalda / Hombros' },
      tagline: { fr: 'Ton stress porte le monde — littéralement.', es: 'Tu estrés carga el mundo — literalmente.' },
      body: {
        fr: [
          'Bureau, charge mentale, compensation… le dos devient le sac.',
          'Seule, tu « fais du renforcement » qui augmente parfois la tension.',
        ],
        es: [
          'Oficina, carga mental, compensación… la espalda se vuelve la mochila.',
          'Sola « haces refuerzo » que a veces aumenta la tensión.',
        ],
      },
      bridge: {
        fr: 'Je te vois en visio : on allonge, on ouvre, on arrête de forcer ce qui est déjà trop chargé.',
        es: 'Te veo en visio: alargamos, abrimos, dejamos de forzar lo que ya está cargado.',
      },
      shareLine: { fr: 'Ma carte du stress : Dos / Épaules.', es: 'Mi mapa del estrés: Espalda / Hombros.' },
    },
    {
      id: 'diffuse',
      title: { fr: 'Carte : Figée / Diffuse', es: 'Mapa: Rígida / Difusa' },
      tagline: { fr: 'Ton système bascule en mode survie — le corps devient flou.', es: 'Tu sistema entra en supervivencia — el cuerpo se vuelve borroso.' },
      body: {
        fr: [
          'Ce n’est pas de la paresse. C’est un système nerveux qui coupe le volume.',
          'Seule, tu peines à « sentir ». Avec quelqu’un qui te guide, le volume revient.',
        ],
        es: [
          'No es pereza. Es un sistema nervioso que baja el volumen.',
          'Sola te cuesta « sentir ». Con alguien que te guía, vuelve el volumen.',
        ],
      },
      bridge: {
        fr: 'Le rendez-vous fixe, c’est de la régulation relationnelle — plus fort qu’une vidéo motivante.',
        es: 'La cita fija es regulación relacional — más fuerte que un vídeo motivador.',
      },
      shareLine: { fr: 'Ma carte du stress : Figée / Diffuse.', es: 'Mi mapa del estrés: Rígida / Difusa.' },
    },
  ],
};
