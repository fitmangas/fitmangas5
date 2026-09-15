/**
 * Détection marché Acquisition (FR primaire / MX secondaire).
 * Utilisé pour choisir bodyFr vs bodyEs et le concierge.
 */

const ES_STRONG =
  /\b(hola|buenas|prueba|precio|cuesta|cuánto|cuanto|días|dias|gracias|quiero|horario|vergüenza|verguenza|después|despues|principiante|mensajes?|enlace|manda|envía|envia|gratis|suscri|abono|clases?|cita|contigo|mí|mi)\b/i;

const FR_STRONG =
  /\b(bonjour|bonsoir|salut|coucou|essai|prix|tarif|combien|merci|je veux|créneau|creneau|horaire|souple|débutante|debutante|honte|caméra|camera|nantes|présentiel|presentiel)\b/i;

/** Heuristique texte → marché. ES gagne si signaux clairs ; sinon FR. */
export function detectAcquisitionMarket(text?: string | null): 'fr' | 'mx' {
  if (!text?.trim()) return 'fr';
  const t = text.trim();
  const es = ES_STRONG.test(t);
  const fr = FR_STRONG.test(t);
  if (es && !fr) return 'mx';
  if (fr && !es) return 'fr';
  if (es && fr) {
    // Mixte (« Hola, c’est combien ») → ES si ouverture ES, sinon FR
    if (/^\s*(hola|buenas|buenos)/i.test(t)) return 'mx';
    return 'fr';
  }
  // Accents typiquement ES sans ancre FR
  if (/[¿¡ñ]/u.test(t) || /á|é|í|ó|ú/i.test(t)) {
    if (!/[àâäèêëïîôùûüç]/i.test(t)) return 'mx';
  }
  return 'fr';
}

export function marketToLocale(market: 'fr' | 'mx'): 'fr' | 'es' {
  return market === 'mx' ? 'es' : 'fr';
}

/** Priorité d’un workflow mot-clé (plus haut = exécuté en premier). */
export function workflowKeywordPriority(triggerConfig: Record<string, unknown>): number {
  if (typeof triggerConfig.priority === 'number') return triggerConfig.priority;
  const kw = typeof triggerConfig.keyword === 'string' ? triggerConfig.keyword.toLowerCase() : '';
  if (!kw.trim()) return 0;
  if (/stop|désinscri|desinscri|unsubscribe|no más|no mas|basta|arrête|arrete/.test(kw)) return 200;
  if (/prix|tarif|combien|cuesta|precio|costo/.test(kw)) return 100;
  if (/essai|prueba|trial|7 jours|7 dias/.test(kw)) return 90;
  if (/lien|link|dm|mp|mensaje/.test(kw)) return 80;
  if (/nantes|présentiel|presentiel|souple|honte|matériel|materiel|temps|busy/.test(kw)) return 60;
  if (/bonjour|hello|hola|salut|hey|coucou|buenas|bonsoir/.test(kw)) return 10;
  return 50;
}
