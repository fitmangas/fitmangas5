/**
 * Contenu actionnable issu de docs/MARCHE_FEMMES.md + docs/MARCHE_EXTERNE.md (UI onglet Marché).
 * Ne remplace pas les MD — les MD restent la source éditoriale avec sources datées.
 */

export type MarcheMarketBlock = {
  id: 'fr' | 'mx';
  label: string;
  codes: string[];
  anglesPriority: string[];
  anglesSecondary: string[];
  avoid: string[];
};

export const MARCHE_WANTS = [
  {
    id: 'constance',
    emoji: '🗓️',
    title: { fr: 'Constance douce', es: 'Constancia suave' },
    detail: {
      fr: 'Un rituel à horaires fixes — pas une « motivation » qui punit.',
      es: 'Un ritual a horas fijas — no una « motivación » que castiga.',
    },
  },
  {
    id: 'non-jugement',
    emoji: '🫶',
    title: { fr: 'Non-jugement', es: 'Sin juicio' },
    detail: {
      fr: 'Un espace sûr : on critique l’industrie, jamais le corps.',
      es: 'Un espacio seguro: se critica a la industria, nunca el cuerpo.',
    },
  },
  {
    id: 'être-vue',
    emoji: '👁️',
    title: { fr: 'Être vue', es: 'Ser vista' },
    detail: {
      fr: 'Correction en direct + une coach qui te regarde (pas YouTube anonyme).',
      es: 'Corrección en directo + una coach que te mira (no YouTube anónimo).',
    },
  },
  {
    id: 'mind-body',
    emoji: '🧘',
    title: { fr: 'Corps et tête', es: 'Cuerpo y cabeza' },
    detail: {
      fr: 'Dos, stress, énergie, sommeil — pas seulement « les abdos ».',
      es: 'Espalda, estrés, energía, sueño — no solo « abdomen ».',
    },
  },
  {
    id: 'pour-la-vie',
    emoji: '🌱',
    title: { fr: 'Pour la vie, pas pour le look', es: 'Para la vida, no para el look' },
    detail: {
      fr: 'Tenir dans le temps, bouger à 45 ans et plus — pas une transformation en 6 semaines.',
      es: 'Aguantar en el tiempo, moverse a los 45 y más — no una transformación en 6 semanas.',
    },
  },
  {
    id: 'at-home',
    emoji: '🏠',
    title: { fr: 'Chez soi, sans contrainte', es: 'En casa, sin lío' },
    detail: {
      fr: 'Visio depuis chez soi, matériel minimal.',
      es: 'Clase en vídeo desde casa, material mínimo.',
    },
  },
] as const;

export const MARCHE_TRENDS = [
  {
    emoji: '📈',
    title: {
      fr: 'Pilates & barre demandés (chez soi + studio)',
      es: 'Pilates y barra en demanda (en casa + estudio)',
    },
    implication: {
      fr: 'Tu peux accrocher avec « Pilates » — la promesse de la pub, c’est la communauté + le live.',
      es: 'Puedes enganchar con « Pilates » — la promesa del anuncio es la comunidad + el directo.',
    },
  },
  {
    emoji: '🔥',
    title: {
      fr: 'Périménopause, post-partum, 45+ : ça monte',
      es: 'Perimenopausia, posparto, +45: va al alza',
    },
    implication: {
      fr: 'Angles pour se faire découvrir : dos à 15h, énergie, sommeil, 45 ans et plus — sans jugement.',
      es: 'Ángulos para que te descubran: espalda a las 15h, energía, sueño, +45 — sin juicio.',
    },
  },
  {
    emoji: '😮‍💨',
    title: {
      fr: 'Elles en ont assez du fitness « transformation »',
      es: 'Están hartas del fitness « transformación »',
    },
    implication: {
      fr: 'Bouton anti-risque : essai 7 jours. Phrases simples, pas de slogans.',
      es: 'Botón sin riesgo: prueba 7 días. Frases simples, sin eslóganes.',
    },
  },
  {
    emoji: '📱',
    title: {
      fr: 'Vidéo naturelle courte > pub trop léchée',
      es: 'Vídeo natural corto > anuncio demasiado pulido',
    },
    implication: {
      fr: '15–30 secondes, elle parle à la caméra, sous-titres. Téléphone > studio.',
      es: '15–30 segundos, habla a cámara, subtítulos. Móvil > estudio.',
    },
  },
] as const;

export const MARCHE_POSITIONING = {
  tooNiche: {
    fr: '« Studio Pilates & Barre en ligne pour expertes » → trop peu de monde, elles s’excluent toutes seules.',
    es: '« Estudio de Pilates y Barra online para expertas » → muy poca gente, se excluyen solas.',
  },
  wideMessage: {
    fr: '« Tu as déjà essayé seule et tu as lâché ? Rejoins des cours collectifs à horaires fixes, avec une coach qui te corrige en direct. »',
    es: '« ¿Ya lo intentaste sola y lo dejaste? Únete a clases colectivas a horas fijas, con una coach que te corrige en directo. »',
  },
  rule: {
    fr: 'Pilates / Barre = le véhicule. Le produit réel = ne pas être seule + correction + être vue.',
    es: 'Pilates / Barra = el vehículo. El producto real = no estar sola + corrección + ser vista.',
  },
};

export const MARCHE_MARKETS: MarcheMarketBlock[] = [
  {
    id: 'fr',
    label: 'France (primaire)',
    codes: [
      'Direct, honnête, anti-Bullshit ; méfiance « miracle ».',
      'Prix 39 € groupe affirmé ; essai 7 j + carte = acquis.',
      'FR d’abord ; tutoiement OK ; jamais « Mangitas ».',
      'Douleurs concrètes : dos bureau, post-partum, 45+, stress, sommeil.',
    ],
    anglesPriority: [
      'Dos / 15h / bureau',
      'Essai 7 j sans pression',
      'Correction en direct (vs replay seul)',
      '« Envoie ça à une copine »',
      'Quiz → lead soft',
    ],
    anglesSecondary: ['Pilates technique pur', 'Présentiel Nantes (tiède / local)'],
    avoid: ['Miracle minceur', 'Jugement corps / âge / poids'],
  },
  {
    id: 'mx',
    label: 'Mexique (secondaire)',
    codes: [
      'Relationnel, chaleur, communauté ; WhatsApp fort.',
      'ES naturel — pas de calques FR littéraux.',
      'Ne pas coller 39 € FR sans contexte local.',
      'Coach accessible ; IG / WhatsApp prioritaires.',
    ],
    anglesPriority: [
      'Comunidad + no estás sola',
      'Corrección en vivo',
      'En casa, cuando te conviene',
      'Prueba / essai expliqué clairement',
      'Quiz ES si funnel prêt',
    ],
    anglesSecondary: ['Facebook encore utile en reciblage'],
    avoid: ['Ton corporate froid FR', '« Bajar de peso » comme promesse centrale'],
  },
];

export const MARCHE_PUB_CONCLUSION = [
  {
    fr: 'Promesse large : solitude / constance / être vue — le Pilates n’est que le véhicule.',
    es: 'Promesa amplia: soledad / constancia / ser vista — el Pilates solo es el vehículo.',
  },
  {
    fr: 'Films : 15–30 s naturelles, accroche 3 s, structure Problème-Agitation-Solution ou Accroche-Preuve.',
    es: 'Vídeos: 15–30 s naturales, gancho 3 s, estructura Problema-Agitación-Solución o Gancho-Prueba.',
  },
  {
    fr: 'Bouton : essai 7 jours ou quiz — sans risque.',
    es: 'Botón: prueba 7 días o quiz — sin riesgo.',
  },
  {
    fr: 'France d’abord en volume ; Mexique = films en espagnol, pas une copie mot à mot du français.',
    es: 'Francia primero en volumen; México = vídeos en español, no una copia literal del francés.',
  },
  {
    fr: 'Croiser qui te suit vraiment (âge, genre, pays) et qui tu pourrais toucher en pub.',
    es: 'Cruzar quién te sigue de verdad (edad, género, país) y a quién podrías llegar con anuncios.',
  },
] as const;

export const DOC_SOURCES_NOTE = {
  fr: 'Chiffres et sources datées 2024–2026 (Marché femmes + Marché externe + Expertise pub).',
  es: 'Cifras y fuentes fechadas 2024–2026 (Mercado mujeres + Mercado externo + Pericia anuncios).',
};

/** Benchmarks externes — docs/MARCHE_EXTERNE.md. Ordres de grandeur, jamais un recensement. */
export const MARCHE_EXTERNE = {
  honesty: {
    fr: 'Repères de marché (ordres de grandeur). Les cabinets ne mesurent pas le même périmètre. Ce n’est pas « combien de Françaises paieront FitMangas ».',
    es: 'Referencias de mercado (órdenes de magnitud). Los informes no miden lo mismo. No es « cuántas mexicanas o francesas pagarán FitMangas ».',
  },
  world: {
    title: { fr: 'Monde', es: 'Mundo' },
    figure: { fr: '~44 Md$', es: '~44 mil M$' },
    caption: {
      fr: 'Fitness virtuel : ~34 Md$ en 2025, ~28 %/an → autour de 44 Md$ en 2026 (projection). Autre étude : ~36 Md$ online en 2026.',
      es: 'Fitness virtual: ~34 mil M$ en 2025, ~28 %/año → alrededor de 44 mil M$ en 2026 (proyección). Otro informe: ~36 mil M$ online en 2026.',
    },
  },
  fr: {
    title: { fr: 'France', es: 'Francia' },
    figure: { fr: '~33 %/an', es: '~33 %/año' },
    caption: {
      fr: 'Parmi les plus fortes croissances des pays riches (online fitness ~33–34 %/an). Le digital wellness accélère encore — pas un marché plat.',
      es: 'De los crecimientos más fuertes entre países ricos (online fitness ~33–34 %/año). El wellness digital sigue acelerando.',
    },
  },
  mx: {
    title: { fr: 'Mexique / LatAm', es: 'México / LatAm' },
    figure: { fr: '~22 %/an', es: '~22 %/año' },
    caption: {
      fr: 'Apps fitness & santé LatAm : ~3,8 Md$ en 2025, ~22 %/an. Plus jeune, plus mobile. WhatsApp + Instagram.',
      es: 'Apps de fitness y salud LatAm: ~3,8 mil M$ en 2025, ~22 %/año. Más joven, más móvil. WhatsApp + Instagram.',
    },
  },
  buyer: [
    {
      emoji: '👩',
      title: { fr: 'Femme, souvent majoritaire', es: 'Mujer, a menudo mayoría' },
      detail: {
        fr: 'Autour de la moitié des utilisatrices d’apps — souvent plus. Repère MX : ~56 % de femmes parmi les passionnées fitness. Pas 55 % exact partout.',
        es: 'Alrededor de la mitad de las usuarias de apps — a menudo más. México: ~56 % mujeres entre entusiastas fitness. No es un 55 % exacto en todos lados.',
      },
    },
    {
      emoji: '🏙️',
      title: { fr: '25–40 ans, urbaine', es: '25–40 años, urbana' },
      detail: {
        fr: 'Cœur d’âge 25–40 ; pic d’usage apps santé chez les 35–44. Revenus moyens-supérieurs, smartphone — assez pour un abo, pas un luxe inaccessible.',
        es: 'Núcleo 25–40; pico de uso de apps de salud en 35–44. Ingresos medios-altos, móvil — suficiente para una suscripción.',
      },
    },
    {
      emoji: '💛',
      title: { fr: 'Holistique + communauté + suivi', es: 'Holístico + comunidad + seguimiento' },
      detail: {
        fr: 'Elle cherche à tenir, être vue, pas un exo YouTube anonyme. Séances souvent 20–30 min (format cours visio / maison).',
        es: 'Quiere sostenerse y ser vista, no un ejercicio anónimo de YouTube. Sesiones a menudo 20–30 min (clase en vídeo / casa).',
      },
    },
  ],
  opportunity: {
    title: { fr: 'Où est le potentiel', es: 'Dónde está el potencial' },
    aligned: {
      fr: 'Collectif, être vue, corps + tête : c’est exactement ce que le marché en ligne paie — YouTube ne le donne pas.',
      es: 'Colectivo, ser vista, cuerpo + cabeza: es justo lo que el mercado online paga — YouTube no lo da.',
    },
    beyond: {
      fr: 'Le gisement n’est pas « les fans de Pilates ». C’est celles qui ont déjà lâché seules (dos 15h, post-partum, 45+, stress). Tes 2 300 abonnées ≠ le marché.',
      es: 'El filón no son « las fans de Pilates ». Son las que ya lo dejaron solas (espalda a las 15h, posparto, +45, estrés). Tus seguidoras ≠ el mercado.',
    },
  },
} as const;
