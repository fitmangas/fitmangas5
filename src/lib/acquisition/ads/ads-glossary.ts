/**
 * Termes anglais inévitables (régie Meta / métier pub) + libellés FR/ES.
 * L’admin Ads n’a pas de locale site : un sélecteur local FR/ES bascule le chrome.
 */

export type AdsUiLang = 'fr' | 'es';

export type AdsSubTab = 'marche' | 'stats' | 'plan' | 'execution';

export type GlossaryEntry = {
  /** Forme courte affichée (souvent l’acronyme). */
  short: string;
  fr: string;
  es: string;
};

export const ADS_GLOSSARY = {
  cpl: {
    short: 'CPL',
    fr: 'Coût par lead : combien tu paies pour qu’une femme laisse ses coordonnées (quiz ou essai).',
    es: 'Coste por lead: lo que pagas para que una mujer deje sus datos (quiz o prueba).',
  },
  cac: {
    short: 'CAC',
    fr: 'Coût d’acquisition cliente : combien tu paies pour une vraie abonnée qui paie (pas juste un clic).',
    es: 'Coste de adquisición: lo que pagas por una alumna que realmente paga (no solo un clic).',
  },
  ctr: {
    short: 'CTR',
    fr: 'Taux de clic : parmi celles qui ont vu la pub, combien ont cliqué. Repère froid : autour de 1 % ou plus.',
    es: 'Porcentaje de clics: de las que vieron el anuncio, cuántas clicaron. Referencia en frío: alrededor del 1 % o más.',
  },
  cpm: {
    short: 'CPM',
    fr: 'Coût pour 1 000 affichages de la pub. Ça mesure le prix de la visibilité, pas les ventes.',
    es: 'Coste por 1 000 visualizaciones. Mide el precio de ser vista, no las ventas.',
  },
  roas: {
    short: 'ROAS',
    fr: 'Retour sur la dépense pub : euros encaissés ÷ euros dépensés. « Non mesurable » tant que 0 € a été dépensé.',
    es: 'Retorno del gasto publicitario: euros cobrados ÷ euros gastados. « No medible » mientras no hayas gastado.',
  },
  ugc: {
    short: 'UGC',
    fr: 'Pub filmée comme une vraie personne (téléphone, voix naturelle) — pas un clip studio lisse. C’est ce qui convertit le mieux en froid.',
    es: 'Anuncio filmado como una persona real (móvil, voz natural), no un vídeo de estudio. Es lo que mejor convierte en frío.',
  },
  pas: {
    short: 'PAS',
    fr: 'Structure de script : Problème → Agitation (pourquoi ça bloque) → Solution. Un seul message par pub.',
    es: 'Estructura del guion: Problema → Agitación (por qué se queda atascada) → Solución. Un solo mensaje por anuncio.',
  },
  hook: {
    short: 'Hook',
    fr: 'Accroche des 3 premières secondes. Si elle ne s’arrête pas, le reste de la pub ne compte pas.',
    es: 'Gancho de los 3 primeros segundos. Si no se detiene, el resto del anuncio no cuenta.',
  },
  cta: {
    short: 'CTA',
    fr: 'Appel à l’action : la phrase ou le bouton (« essai gratuit 7 jours »). Jamais « abonne-toi » en pub froide.',
    es: 'Llamada a la acción: la frase o el botón (« prueba gratis 7 días »). Nunca « suscríbete » en frío.',
  },
  paused: {
    short: 'PAUSED',
    fr: 'En pause chez Meta : la pub existe, le budget est prêt, mais 0 € part tant que tu n’actives pas (double confirmation).',
    es: 'En pausa en Meta: el anuncio existe, el presupuesto está listo, pero 0 € salen hasta que actives (doble confirmación).',
  },
  active: {
    short: 'ACTIVE',
    fr: 'Campagne allumée : de l’argent part chaque jour. Réservé à la double confirmation humaine.',
    es: 'Campaña encendida: el dinero sale cada día. Solo con doble confirmación humana.',
  },
  meta: {
    short: 'Meta',
    fr: 'Le nom de l’entreprise qui gère Facebook + Instagram + la régie pub. Tes pubs passent par Meta.',
    es: 'La empresa de Facebook + Instagram + la plataforma de anuncios. Tus anuncios pasan por Meta.',
  },
  pixel: {
    short: 'Pixel',
    fr: 'Petit code sur fitmangas.com qui dit à Meta « elle a commencé un essai » ou « elle a payé ». Sans ça, pas de vrai retour sur dépense.',
    es: 'Código en fitmangas.com que dice a Meta « empezó una prueba » o « pagó ». Sin eso, no hay retorno real.',
  },
  crm: {
    short: 'CRM',
    fr: 'Tes fiches clientes dans FitMangas (conversations, essais, paiements). Ce n’est pas Instagram.',
    es: 'Tus fichas de clientas en FitMangas (conversaciones, pruebas, pagos). No es Instagram.',
  },
  broad: {
    short: 'Broad',
    fr: 'Ciblage large (ex. femmes 30–55, France) sans empiler 15 centres d’intérêt. C’est la créative qui trie, pas le ciblage.',
    es: 'Segmentación amplia (ej. mujeres 30–55, un país) sin apilar 15 intereses. La creativa filtra, no el targeting.',
  },
  kill: {
    short: 'Kill',
    fr: 'Couper une pub : après 48–72 h ou 50–100 € (le premier atteint) s’il n’y a aucun lead et que presque personne ne clique.',
    es: 'Cortar un anuncio: a las 48–72 h o 50–100 € (lo que llegue antes) si no hay lead y casi nadie clica.',
  },
  fatigue: {
    short: 'Fatigue',
    fr: 'Usure : les mêmes personnes voient trop souvent la même pub (fréquence trop haute). Il faut une nouvelle version.',
    es: 'Desgaste: las mismas personas ven demasiado el mismo anuncio (frecuencia alta). Hay que hacer una versión nueva.',
  },
  retarget: {
    short: 'Retarget',
    fr: 'Reciblage : montrer une pub à celles qui sont déjà venues sur le site, le quiz ou Instagram — pas à des inconnues.',
    es: 'Reimpacto: mostrar un anuncio a quienes ya vinieron a la web, al quiz o a Instagram — no a desconocidas.',
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof ADS_GLOSSARY;

export const CREATIVE_TYPE_LABEL: Record<
  'talking_head' | 'ugc_temoignage' | 'image_forte' | 'carousel' | 'autre',
  { fr: string; es: string }
> = {
  talking_head: { fr: 'Elle parle à la caméra · 15–30 s', es: 'Habla a cámara · 15–30 s' },
  ugc_temoignage: { fr: 'Témoignage naturel (téléphone)', es: 'Testimonio natural (móvil)' },
  image_forte: { fr: 'Image forte', es: 'Imagen potente' },
  carousel: { fr: 'Carrousel (plusieurs images)', es: 'Carrusel (varias imágenes)' },
  autre: { fr: 'Organisation / structure', es: 'Organización / estructura' },
};

export const FRAMEWORK_LABEL: Record<
  'PAS' | 'Hook-Problème-Solution-Preuve' | 'signal_organique' | 'structure',
  { fr: string; es: string; term?: GlossaryKey }
> = {
  PAS: { fr: 'PAS', es: 'PAS', term: 'pas' },
  'Hook-Problème-Solution-Preuve': {
    fr: 'Accroche → Problème → Solution → Preuve',
    es: 'Gancho → Problema → Solución → Prueba',
  },
  signal_organique: {
    fr: 'Angle déjà vu sur Instagram',
    es: 'Ángulo que ya funcionó en Instagram',
  },
  structure: { fr: 'Organisation du compte pub', es: 'Organización de la cuenta' },
};

export const TEMP_LABEL = {
  froid: { fr: 'Froid', es: 'Frío' },
  warm: { fr: 'Tiède', es: 'Tibia' },
  hot: { fr: 'Chaude', es: 'Caliente' },
} as const;

export function glossaryText(key: GlossaryKey, lang: AdsUiLang): string {
  return ADS_GLOSSARY[key][lang];
}

export function pickLang(pair: { fr: string; es: string }, lang: AdsUiLang): string {
  return pair[lang];
}
