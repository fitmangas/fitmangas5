/**
 * Banque narrative ECR-S — anxiété d’abandon & évitement de l’intimité.
 *
 * Échelle 1–7 (moyennes). Seuils : low ≤ 2,9 · mid ≤ 4,5 · high > 4,5
 * Inspirée de la littérature ECR (Brennan, Clark & Shaver ; Wei et al., 2007).
 * Réécrite voix FitMangas — pas de diagnostic clinique, pas de « Mangitas ».
 */

import type { BilingualText, Level, TraitBank } from './big-five-traits';

export type AttachmentDimension = 'anxiety' | 'avoidance';

/** Moyenne ECR-S (1–7) */
export function bandFromAttachmentMean(mean: number): Level {
  if (mean <= 2.9) return 'low';
  if (mean <= 4.5) return 'mid';
  return 'high';
}

export const ATTACHMENT_DIMENSION_BANK: Record<AttachmentDimension, TraitBank> = {
  anxiety: {
    low: {
      narrative: {
        fr: 'Tu ne crains pas vraiment qu’on t’oublie ou qu’on te juge si tu rates un cours. Tu peux te connecter sans te demander si tu es « assez bien » pour être là. Le lien avec la coach et le groupe te semble plutôt solide — pas parfait, mais rassurant.',
        es: 'No temes realmente que te olviden o que te juzguen si faltas a una clase. Puedes conectarte sin preguntarte si eres « suficiente » para estar ahí. El vínculo con la coach y el grupo te parece bastante sólido — no perfecto, pero tranquilizador.',
      },
      force: {
        fr: 'Tu profites du cours sans te surveiller en permanence.',
        es: 'Disfrutas la clase sin vigilarte constantemente.',
      },
      limit: {
        fr: 'Tu peux minimiser un vrai besoin de soutien parce que « ça va » en surface.',
        es: 'Puedes minimizar una necesidad real de apoyo porque « estás bien » en la superficie.',
      },
    },
    mid: {
      narrative: {
        fr: 'Parfois tu as besoin d’être rassurée — un message de la coach, un accueil chaleureux en début de séance. Ce n’est pas constant : certains jours tu es sereine, d’autres tu cherches des signes que tu comptes. C’est humain, surtout quand tu reprends une pratique.',
        es: 'A veces necesitas que te tranquilicen — un mensaje de la coach, una bienvenida cálida al inicio. No es constante: algunos días estás serena, otros buscas señales de que importas. Es humano, sobre todo cuando retomas una práctica.',
      },
      force: {
        fr: 'Tu es lucide sur tes besoins relationnels — tu peux les nommer.',
        es: 'Eres lúcida sobre tus necesidades relacionales — puedes nombrarlas.',
      },
      limit: {
        fr: 'Une absence de réponse rapide peut te faire douter de ta place dans le groupe.',
        es: 'Una ausencia de respuesta rápida puede hacerte dudar de tu lugar en el grupo.',
      },
    },
    high: {
      narrative: {
        fr: 'Tu as peur qu’on te laisse de côté si tu rates plusieurs cours, ou que l’on ne remarque pas quand tu galères. Tu as besoin de signes clairs : horaires fixes, même coach, présence régulière. Ce n’est pas de la « dépendance » — c’est un besoin de sécurité dans le lien.',
        es: 'Temes quedarte apartada si faltas a varias clases, o que no noten cuando te cuesta. Necesitas señales claras: horarios fijos, misma coach, presencia regular. No es « dependencia » — es necesidad de seguridad en el vínculo.',
      },
      force: {
        fr: 'Tu investis fort dans le lien — quand tu te sens en sécurité, tu tiens remarquablement.',
        es: 'Inviertes fuerte en el vínculo — cuando te sientes segura, sostienes de forma notable.',
      },
      limit: {
        fr: 'Tu peux interpréter un silence ou un changement d’horaire comme un rejet.',
        es: 'Puedes interpretar un silencio o un cambio de horario como un rechazo.',
      },
    },
  },

  avoidance: {
    low: {
      narrative: {
        fr: 'Tu peux te laisser accompagner — ouvrir la caméra, recevoir une correction, partager un ressenti. La proximité avec la coach ne te menace pas : tu gardes tes limites sans mur invisible. En visio, tu es présente, pas seulement « connectée en fond ».',
        es: 'Puedes dejarte acompañar — abrir la cámara, recibir una corrección, compartir una sensación. La cercanía con la coach no te amenaza: mantienes tus límites sin muro invisible. En visio, estás presente, no solo « conectada en segundo plano ».',
      },
      force: {
        fr: 'Tu profites de la correction en direct — c’est là que tu progresses le plus.',
        es: 'Aprovechas la corrección en directo — ahí es donde más progresas.',
      },
      limit: {
        fr: 'Tu peux t’ouvrir trop vite à des conseils sans vérifier ce que ton corps accepte.',
        es: 'Puedes abrirte demasiado pronto a consejos sin verificar lo que tu cuerpo acepta.',
      },
    },
    mid: {
      narrative: {
        fr: 'Tu alternes proximité et distance — parfois caméra ouverte, parfois plus en retrait. Tu as besoin de temps pour faire confiance, puis tu t’engages. C’est un rythme honnête : tu n’es ni toute fermée, ni toute exposée.',
        es: 'Alternas cercanía y distancia — a veces cámara abierta, a veces más retraída. Necesitas tiempo para confiar, luego te implicas. Es un ritmo honesto: no estás ni totalmente cerrada ni totalmente expuesta.',
      },
      force: {
        fr: 'Tu protèges ton espace tout en progressant — équilibre rare.',
        es: 'Proteges tu espacio mientras progresas — equilibrio poco común.',
      },
      limit: {
        fr: 'Tu peux envoyer des signaux mixtes : envie de lien, puis repli sans explication.',
        es: 'Puedes enviar señales mixtas: ganas de vínculo, luego repliegue sin explicación.',
      },
    },
    high: {
      narrative: {
        fr: 'Tu préfères garder de la distance — caméra off, peu de partage, tu gères seule dès que possible. Ce n’est pas de la froideur : c’est une façon de te protéger. La visio à petit groupe peut convenir : assez de lien pour être corrigée, assez de recul pour respirer.',
        es: 'Prefieres mantener distancia — cámara apagada, poco compartir, gestionas sola en cuanto puedes. No es frialdad: es forma de protegerte. La visio en grupo pequeño puede encajar: suficiente vínculo para ser corregida, suficiente retiro para respirar.',
      },
      force: {
        fr: 'Tu sais ce dont tu as besoin pour te sentir en sécurité — tu ne te laisses pas envahir.',
        es: 'Sabes lo que necesitas para sentirte segura — no te dejas invadir.',
      },
      limit: {
        fr: 'Tu peux refuser l’aide qui t’accélérerait — et rester seule dans l’effort plus longtemps.',
        es: 'Puedes rechazar la ayuda que te aceleraría — y quedarte sola en el esfuerzo más tiempo.',
      },
    },
  },
};

export type AttachmentStyleId = 'secure-ish' | 'anxious' | 'avoidant' | 'fearful';

export type AttachmentStylePortrait = {
  id: AttachmentStyleId;
  /** Conditions : toutes les clés listées doivent matcher */
  when: { anxiety: Level; avoidance: Level };
  portraitName: BilingualText;
  tagline: BilingualText;
  narrative: BilingualText;
};

/**
 * Styles combinés anxiété × évitement.
 * secure-ish = faible anxiété + faible évitement
 * anxious = anxiété haute + évitement bas/moyen
 * avoidant = anxiété basse/moyenne + évitement haut
 * fearful = anxiété haute + évitement haut
 */
export const ATTACHMENT_STYLE_PORTRAITS: AttachmentStylePortrait[] = [
  {
    id: 'secure-ish',
    when: { anxiety: 'low', avoidance: 'low' },
    portraitName: {
      fr: 'La Présente sereine',
      es: 'La Presente serena',
    },
    tagline: {
      fr: 'Tu te laisses accompagner sans te perdre — le collectif te nourrit.',
      es: 'Te dejas acompañar sin perderte — el colectivo te nutre.',
    },
    narrative: {
      fr: 'Tu arrives en cours relativement confiante dans le lien : tu n’as pas peur d’être vue, ni peur d’être oubliée. Les cours collectifs à horaires fixes te conviennent — tu y mets ton énergie sans te surveiller. Quand tu rates une séance, tu reviens sans drame. C’est une base solide pour tenir une pratique dans la durée.',
      es: 'Llegas a clase relativamente confiada en el vínculo: no temes ser vista, ni temes ser olvidada. Los cursos colectivos a horarios fijos te van bien — pones tu energía sin vigilarte. Cuando faltas a una sesión, vuelves sin drama. Es una base sólida para sostener una práctica a largo plazo.',
    },
  },
  {
    id: 'anxious',
    when: { anxiety: 'high', avoidance: 'low' },
    portraitName: {
      fr: 'La Investie vigilante',
      es: 'La Comprometida vigilante',
    },
    tagline: {
      fr: 'Tu as besoin de signes que tu comptes — le cadre fixe te rassure.',
      es: 'Necesitas señales de que importas — el marco fijo te tranquiliza.',
    },
    narrative: {
      fr: 'Tu t’investis fort dans le lien avec la coach et le groupe — tu es présente, ouverte, tu cherches le contact. Mais tu peux t’inquiéter si tu rates un cours ou si tu sens un distancement. Les horaires fixes, la même voix chaque semaine, la correction en direct : ce ne sont pas des détails pour toi, ce sont des preuves que tu n’es pas seule dans l’effort.',
      es: 'Te implicas fuerte en el vínculo con la coach y el grupo — estás presente, abierta, buscas contacto. Pero puedes preocuparte si faltas a una clase o si sientes distancia. Horarios fijos, la misma voz cada semana, corrección en directo: no son detalles para ti, son pruebas de que no estás sola en el esfuerzo.',
    },
  },
  {
    id: 'anxious',
    when: { anxiety: 'high', avoidance: 'mid' },
    portraitName: {
      fr: 'La Investie vigilante',
      es: 'La Comprometida vigilante',
    },
    tagline: {
      fr: 'Tu veux le lien, mais tu te protèges parfois — le cadre prévisible aide.',
      es: 'Quieres el vínculo, pero a veces te proteges — el marco predecible ayuda.',
    },
    narrative: {
      fr: 'Tu oscill entre envie de proximité et moments de repli. Tu as besoin qu’on te montre que ta place est stable — horaires fixes, présence régulière de la coach. Quand tu te sens en sécurité, tu progresses vite ; quand tu doutes, tu peux te déconnecter émotionnellement même si tu es là physiquement.',
      es: 'Oscilas entre ganas de cercanía y momentos de repliegue. Necesitas que te muestren que tu lugar es estable — horarios fijos, presencia regular de la coach. Cuando te sientes segura, progresas rápido; cuando dudas, puedes desconectarte emocionalmente aunque estés ahí físicamente.',
    },
  },
  {
    id: 'avoidant',
    when: { anxiety: 'low', avoidance: 'high' },
    portraitName: {
      fr: 'L’Autonome protégée',
      es: 'La Autónoma protegida',
    },
    tagline: {
      fr: 'Tu avances en gardant tes distances — la visio te laisse respirer.',
      es: 'Avanzas manteniendo distancia — la visio te deja respirar.',
    },
    narrative: {
      fr: 'Tu n’as pas peur d’être abandonnée, mais tu n’aimes pas te sentir envahie. Tu préfères gérer seule, caméra off, corrections sobres. Ce n’est pas un rejet du collectif : c’est ta façon de rester en sécurité. Un petit groupe en visio te permet d’être corrigée sans performance sociale — exactement le bon dosage.',
      es: 'No temes ser abandonada, pero no te gusta sentirte invadida. Prefieres gestionar sola, cámara apagada, correcciones sobrias. No es rechazo al colectivo: es tu forma de mantenerte segura. Un grupo pequeño en visio te permite ser corregida sin performance social — justo la dosis correcta.',
    },
  },
  {
    id: 'avoidant',
    when: { anxiety: 'mid', avoidance: 'high' },
    portraitName: {
      fr: 'L’Autonome protégée',
      es: 'La Autónoma protegida',
    },
    tagline: {
      fr: 'Tu tiens au lien, mais à ta façon — sans trop t’exposer.',
      es: 'Te importa el vínculo, pero a tu manera — sin exponerte demasiado.',
    },
    narrative: {
      fr: 'Tu fais partie du groupe, mais tu gardes une carapace. Tu peux t’inquiéter par moments, sans chercher le réconfort ouvertement. La régularité des cours collectifs à horaires fixes t’aide : pas besoin de renégocier chaque semaine, tu sais où tu vas. Tu progresses quand on respecte ton rythme d’ouverture.',
      es: 'Formas parte del grupo, pero mantienes una coraza. Puedes preocuparte a veces, sin buscar consuelo abiertamente. La regularidad de los cursos colectivos a horarios fijos te ayuda: no hace falta renegociar cada semana, sabes adónde vas. Progresas cuando respetan tu ritmo de apertura.',
    },
  },
  {
    id: 'fearful',
    when: { anxiety: 'high', avoidance: 'high' },
    portraitName: {
      fr: 'La Prudente entre deux eaux',
      es: 'La Prudente entre dos aguas',
    },
    tagline: {
      fr: 'Tu veux le lien et tu le crains — le cadre doux et fixe change la donne.',
      es: 'Quieres el vínculo y lo temes — el marco suave y fijo cambia las reglas.',
    },
    narrative: {
      fr: 'Tu ressens fort le besoin d’être accompagnée, et en même temps tu te protèges dès que ça se rapproche trop. Résultat : tu peux hésiter longtemps avant de te connecter, ou alterner phases d’engagement et de repli. Un cadre prévisible — mêmes horaires, même coach, petit groupe, pas de jugement — te permet d’avancer sans te forcer à choisir entre solitude et envahissement.',
      es: 'Sientes fuerte la necesidad de acompañamiento, y al mismo tiempo te proteges en cuanto se acerca demasiado. Resultado: puedes dudar mucho antes de conectarte, o alternar fases de compromiso y repliegue. Un marco predecible — mismos horarios, misma coach, grupo pequeño, sin juicio — te permite avanzar sin obligarte a elegir entre soledad e invasión.',
    },
  },
];

/** Trouve le portrait combiné exact (anxiété × évitement). */
export function findAttachmentStylePortrait(
  anxietyBand: Level,
  avoidanceBand: Level
): AttachmentStylePortrait | undefined {
  return ATTACHMENT_STYLE_PORTRAITS.find(
    (p) => p.when.anxiety === anxietyBand && p.when.avoidance === avoidanceBand
  );
}

/** Fallback si combinaison mid/mid non listée explicitement */
export function fallbackAttachmentStylePortrait(
  anxietyBand: Level,
  avoidanceBand: Level
): AttachmentStylePortrait {
  const exact = findAttachmentStylePortrait(anxietyBand, avoidanceBand);
  if (exact) return exact;

  const anxietyHigh = anxietyBand === 'high';
  const avoidanceHigh = avoidanceBand === 'high';

  if (anxietyHigh && avoidanceHigh) {
    return ATTACHMENT_STYLE_PORTRAITS.find((p) => p.id === 'fearful')!;
  }
  if (anxietyHigh) {
    return ATTACHMENT_STYLE_PORTRAITS.find(
      (p) => p.id === 'anxious' && p.when.avoidance === avoidanceBand
    ) ?? ATTACHMENT_STYLE_PORTRAITS.find((p) => p.id === 'anxious')!;
  }
  if (avoidanceHigh) {
    return ATTACHMENT_STYLE_PORTRAITS.find(
      (p) => p.id === 'avoidant' && p.when.anxiety === anxietyBand
    ) ?? ATTACHMENT_STYLE_PORTRAITS.find((p) => p.id === 'avoidant')!;
  }

  return {
    id: 'secure-ish',
    when: { anxiety: anxietyBand, avoidance: avoidanceBand },
    portraitName: {
      fr: 'Le profil équilibré',
      es: 'El perfil equilibrado',
    },
    tagline: {
      fr: 'Tu navigues entre proximité et autonomie — le collectif t’accompagne.',
      es: 'Navegas entre cercanía y autonomía — el colectivo te acompaña.',
    },
    narrative: {
      fr: 'Tes scores situent tes besoins relationnels dans une zone intermédiaire : ni anxiété marquée, ni évitement fort. Tu peux t’adapter au cadre du cours collectif à horaires fixes — tu y trouves un équilibre entre être vue et garder ton espace. C’est une base souple pour construire une pratique régulière.',
      es: 'Tus puntuaciones sitúan tus necesidades relacionales en una zona intermedia: ni ansiedad marcada, ni evitación fuerte. Puedes adaptarte al marco del curso colectivo a horarios fijos — encuentras equilibrio entre ser vista y guardar tu espacio. Es una base flexible para construir una práctica regular.',
    },
  };
}
