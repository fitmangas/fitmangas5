/**
 * Soft-no / refus poli — clore sans pitch, sans follow-gate, sans relance.
 * Aligné docs/STRATEGIE_CROISSANCE.md
 */

export const SOFT_DECLINE_TAG = 'soft_decline';

/** Refus poli, déjà ailleurs, pas pour moi — sans exiger le mot « stop ». */
export function isSoftDeclineText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (/non merci|no gracias|pas pour moi|no es para mi|no me interesa|pas interesse|pas intéress/.test(t)) {
    return true;
  }
  if (
    /deja inscrit|déjà inscrit|ya estoy inscrita|ya estoy apuntada|ya tengo|j['’]?ai deja|j['’]?ai déjà/.test(t)
  ) {
    return true;
  }
  if (
    /ailleurs|otra sala|otro gym|salle de sport|mon coach|mi entrenador|ca me va|ça me va|me conviene|me corresponde/.test(
      t,
    )
  ) {
    return true;
  }
  if (/pas maintenant|plus tard|maybe later|otro momento|je passe|je decliner|je décline/.test(t)) {
    return true;
  }
  // « Belle soirée » seul ≠ refus ; seulement si couplé à un mais / déjà
  if (
    /belle (soiree|soirée|journée|journee)|buena (noche|tarde)|bonne continuation/.test(t) &&
    /mais|pero|déjà|deja|ya |non |no /.test(t)
  ) {
    return true;
  }
  return false;
}

export function softDeclineReplyFr(): string {
  return [
    'Merci pour ta sincérité 💛',
    '',
    'Je te souhaite une belle continuation là où tu es.',
    'Si un jour tu as envie d’essayer les cours en visio avec moi, je serai là — sans pression.',
  ].join('\n');
}

export function softDeclineReplyEs(): string {
  return [
    'Gracias por tu sinceridad 💛',
    '',
    'Te deseo lo mejor donde estés.',
    'Si un día quieres probar las clases en visio conmigo, estaré aquí — sin presión.',
  ].join('\n');
}

export function memberWarmReplyFr(): string {
  return [
    'Contente que tu sois déjà avec moi 💛',
    '',
    'Dis-moi ce dont tu as besoin (horaire, replay, une question) — je te réponds ici.',
  ].join('\n');
}

export function memberWarmReplyEs(): string {
  return [
    '¡Qué bien que ya estés conmigo 💛',
    '',
    'Dime qué necesitas (horario, replay, una duda) — te respondo aquí.',
  ].join('\n');
}

/** Vrai signal d’intérêt (info / essai / prix / créneau) — seul cas où le follow-gate peut partir. */
export function isRealInfoOrTrialRequest(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  if (isSoftDeclineText(text)) return false;
  const t = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  return (
    /essai|prueba|trial|7 jours|7 dias|lien|link|ressource|obtenir|inscri/.test(t) ||
    /prix|tarif|combien|cuesta|precio|costo|info|price_/.test(t) ||
    /horaire|creneau|créneau|quand|schedule|horario|quels jours|que dias/.test(t) ||
    /nantes|presentiel|présentiel|visio|cours|clase|booking|reserv/.test(t) ||
    /comment (ca|ça) marche|como funciona|c['’]?est quoi|que es fitmangas/.test(t)
  );
}
