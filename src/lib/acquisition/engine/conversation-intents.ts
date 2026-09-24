/**
 * Intentions conversationnelles Croissance — détection + réponses FR/ES.
 * Aligné docs/STRATEGIE_CROISSANCE.md (répondre avant de vendre, soft-no, pas d’empilement).
 */

export type ConversationIntent =
  | 'thinking'
  | 'factual_price'
  | 'factual_schedule'
  | 'factual_replay'
  | 'factual_how'
  | 'trial_offer'
  | 'support'
  | 'warm_no_intent'
  | 'offtopic'
  | null;

function norm(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** « Je réfléchis / plus tard » — ni oui ni non (≠ soft_decline). */
export function isThinkingText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  if (
    /je (vais )?reflect|je reflechis|je réfléchis|je vais y penser|je vais reflechir|a voir|à voir|on verra|je sais pas encore|je ne sais pas encore/.test(
      t,
    )
  ) {
    return true;
  }
  if (/lo pensare|lo pienso|lo vere|lo veré|ya vere|ya veré|despues te digo|después te digo|mas adelante|más adelante/.test(t)) {
    return true;
  }
  if (/pas maintenant|plus tard|maybe later|otro momento|not now|pas tout de suite|no ahora/.test(t)) {
    // « déjà inscrite » reste soft_decline (détecté avant)
    if (/deja|déjà|ailleurs|inscrit|no gracias|non merci/.test(t)) return false;
    return true;
  }
  return false;
}

export function isSupportRequestText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  return (
    /connexion|connecter|login|mot de passe|password|compte bloque|compte bloqué|ne (marche|fonctionne)|bug|erreur|probleme|problème|problema|no puedo entrar|no me deja/.test(
      t,
    ) ||
    /ou est le replay|où est le replay|donde esta el replay|dónde está el replay|je (trouve|vois) pas (le )?replay|no encuentro el replay/.test(
      t,
    ) ||
    /paiement|payment|cb |carte (bleue|bancaire)|stripe|prelevement|prélèvement|facture|factura|reembolso|remboursement/.test(
      t,
    ) ||
    /besoin d['']aide|necesito ayuda|aide support|help support|sos fitmangas/.test(t)
  );
}

export function isWarmNoIntentText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  // Compliment / chaleur sans question ni achat
  const warm =
    /j['’]?adore|j adore|trop bien|trop belle|bravo|merci pour|merci beaucoup|magnifique|inspire|inspirante|te sigo|je t['’]?aime|me encanta|que bonito|qué bonito|eres genial|gracias por todo|gracias por tus/.test(
      t,
    );
  if (!warm) return false;
  if (isSupportRequestText(text)) return false;
  if (/combien|prix|essai|prueba|horaire|inscri|lien|link|promo|code/.test(t)) return false;
  return true;
}

export function isOfftopicBenevolentText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  const ot =
    /felicit|félicit|anniversaire|happy birthday|buen viaje|bon voyage|bon courage|force a toi|force à toi|que te vaya bien|cuidado|prend soin|bisous|besos|💕|🎉|🎂/.test(
      t,
    );
  if (!ot) return false;
  if (isSupportRequestText(text) || isWarmNoIntentText(text)) return false;
  if (/essai|prueba|prix|combien|horaire|inscri/.test(t)) return false;
  return true;
}

export function isFactualPriceText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  return /combien|c['’]?est combien|prix|tarif|cuesta|precio|costo|39|euros?|€/.test(t);
}

export function isFactualScheduleText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  return /horaire|creneau|créneau|quels jours|que dias|qué días|quand (sont|avez)|schedule|horario|que hora|a quelle heure|à quelle heure/.test(
    t,
  );
}

export function isFactualReplayText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  if (isSupportRequestText(text)) return false;
  return /replay|enregistre|enregistré|rattrap|si je (rate|manque)|si falt|puedo ver despues|después|manque un cours|si je suis absente|si estoy ausente/.test(
    t,
  );
}

export function isFactualHowText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  return /comment (ca|ça) marche|comment ca se passe|comment ça se passe|c['’]?est quoi|como funciona|como es|qué es fitmangas|que es fitmangas|deroulement|déroulement/.test(
    t,
  );
}

export function isTrialOfferAskText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  const t = norm(text);
  return (
    /c['’]?est gratuit|es gratis|code promo|codigo promo|réduction|reduccion|descuento|un essai|offre|promotion|coupon/.test(
      t,
    ) || /essai (gratuit|7)|prueba (gratis|7)/.test(t)
  );
}

import { isSoftDeclineText } from './soft-decline';

/**
 * Classe l’intention (ordre = priorité).
 * soft_decline doit être testé à part (module soft-decline) — ici on renvoie null.
 */
export function classifyConversationIntent(
  text: string | undefined,
  opts?: { alreadySoftDecline?: boolean },
): ConversationIntent {
  if (!text?.trim()) return null;
  if (opts?.alreadySoftDecline || isSoftDeclineText(text)) return null;
  if (isSupportRequestText(text)) return 'support';
  if (isThinkingText(text)) return 'thinking';
  if (isTrialOfferAskText(text)) return 'trial_offer';
  if (isFactualPriceText(text)) return 'factual_price';
  if (isFactualScheduleText(text)) return 'factual_schedule';
  if (isFactualReplayText(text)) return 'factual_replay';
  if (isFactualHowText(text)) return 'factual_how';
  if (isWarmNoIntentText(text)) return 'warm_no_intent';
  if (isOfftopicBenevolentText(text)) return 'offtopic';
  return null;
}

export function replyForIntent(
  intent: Exclude<ConversationIntent, null>,
  market: 'fr' | 'mx',
): { body: string; tag: string; scheduleSoftNudge?: boolean; appendTrialLink?: boolean } {
  const es = market === 'mx';
  switch (intent) {
    case 'thinking':
      return {
        tag: 'thinking',
        scheduleSoftNudge: true,
        appendTrialLink: false,
        body: es
          ? [
              'Por supuesto 💛',
              '',
              'Tómate el tiempo que necesites — sin presión.',
              'Si quieres, dentro de unos días te escribo solo un recordatorio suave. Si prefieres que no, dímelo.',
            ].join('\n')
          : [
              'Bien sûr 💛',
              '',
              'Prends le temps qu’il te faut — aucune pression.',
              'Si tu veux, dans quelques jours je t’écris juste un petit rappel doux. Si tu préfères que non, dis-le-moi.',
            ].join('\n'),
      };
    case 'factual_price':
      return {
        tag: 'factual_price',
        appendTrialLink: false,
        body: es
          ? [
              'La fórmula principal: visio en grupo conmigo 💛',
              '',
              '39 € / mes — 8 clases en vivo (2 por semana), o sea ~4,90 € por clase.',
              'Hay también una opción individual (más cara) si la pides.',
              '',
              'Si quieres probar antes: Prueba 7 días gratis ✨ — solo si te apetece.',
            ].join('\n')
          : [
              'La formule principale : visio en groupe avec moi 💛',
              '',
              '39 € / mois — 8 cours live (2 par semaine), soit ~4,90 € par cours.',
              'Il existe aussi une option individuelle (plus chère) si tu la demandes.',
              '',
              'Si tu veux tester avant : Essai 7 jours gratuits ✨ — seulement si ça te dit.',
            ].join('\n'),
      };
    case 'factual_schedule':
      return {
        tag: 'factual_schedule',
        appendTrialLink: false,
        body: es
          ? [
              'Los horarios están en el planning de la plataforma (varias clases a la semana, horarios fijos) 💛',
              '',
              'En la prueba ves el calendario y eliges lo que te encaja.',
              '¿Quieres que te indique cómo ver el planning, o prefieres primero la prueba 7 días?',
            ].join('\n')
          : [
              'Les horaires sont sur le planning de la plateforme (plusieurs cours par semaine, créneaux fixes) 💛',
              '',
              'Pendant l’essai tu vois le calendrier et tu choisis ce qui te va.',
              'Tu veux que je t’indique comment voir le planning, ou tu préfères d’abord l’essai 7 jours ?',
            ].join('\n'),
      };
    case 'factual_replay':
      return {
        tag: 'factual_replay',
        appendTrialLink: false,
        body: es
          ? [
              'Sí: si te pierdes una clase en vivo, el replay queda disponible en tu espacio 💛',
              '',
              'Así no pierdes el hilo — y en vivo yo te corrijo de verdad.',
              '¿Quieres el enlace de la prueba 7 días para ver cómo está organizado?',
            ].join('\n')
          : [
              'Oui : si tu rates un cours en live, le replay reste dispo dans ton espace 💛',
              '',
              'Tu ne perds pas le fil — et en live, je te corrige vraiment.',
              'Tu veux le lien de l’essai 7 jours pour voir comment c’est organisé ?',
            ].join('\n'),
      };
    case 'factual_how':
      return {
        tag: 'factual_how',
        appendTrialLink: false,
        body: es
          ? [
              'Así funciona 💛',
              '',
              '1) Te inscribes (prueba 7 días si quieres).',
              '2) Entras al live a la hora del curso (ordenador o móvil).',
              '3) Yo te veo, corrijo en directo, y el grupo está ahí contigo.',
              '4) Si faltas, tienes el replay.',
              '',
              '¿Te queda alguna duda concreta?',
            ].join('\n')
          : [
              'Voici comment ça se passe 💛',
              '',
              '1) Tu t’inscris (essai 7 jours si tu veux).',
              '2) Tu rejoins le live à l’heure du cours (ordi ou téléphone).',
              '3) Je te vois, je corrige en direct, le groupe est là avec toi.',
              '4) Si tu rates, tu as le replay.',
              '',
              'Tu as une question précise ?',
            ].join('\n'),
      };
    case 'trial_offer':
      return {
        tag: 'trial_offer',
        appendTrialLink: true,
        body: es
          ? [
              'Sí: puedes empezar con una Prueba 7 días gratis ✨',
              '',
              'Es para vivir una clase real conmigo — después decides.',
              'El precio del grupo sigue siendo 39 €/mes: la prueba no “rebaja” el valor, te deja probar con calma.',
              '',
              'Aquí el enlace si te apetece →',
            ].join('\n')
          : [
              'Oui : tu peux commencer avec un Essai 7 jours gratuits ✨',
              '',
              'C’est pour vivre un vrai cours avec moi — ensuite tu décides.',
              'Le prix du groupe reste 39 €/mois : l’essai ne « démarque » pas, il te laisse tester tranquillement.',
              '',
              'Voici le lien si ça te dit →',
            ].join('\n'),
      };
    case 'support':
      return {
        tag: 'support_request',
        appendTrialLink: false,
        body: es
          ? [
              'Estoy aquí para ayudarte 💛',
              '',
              'Cuéntame exactamente qué ves en pantalla (o mándame una captura si puedes).',
              'Para cuenta / replay / pago: también puedes escribir a support desde tu espacio o a alejandra@fitmangas.com — te oriento.',
            ].join('\n')
          : [
              'Je suis là pour t’aider 💛',
              '',
              'Dis-moi exactement ce que tu vois à l’écran (ou envoie une capture si tu peux).',
              'Pour compte / replay / paiement : tu peux aussi écrire via le support dans ton espace ou alejandra@fitmangas.com — je t’oriente.',
            ].join('\n'),
      };
    case 'warm_no_intent':
      return {
        tag: 'warm_no_intent',
        appendTrialLink: false,
        body: es
          ? ['¡Gracias, de verdad 💛', '', 'Me alegra mucho leerte. Cuídate — aquí estoy.'].join('\n')
          : ['Merci, vraiment 💛', '', 'Ça me touche. Prends soin de toi — je suis là.'].join('\n'),
      };
    case 'offtopic':
      return {
        tag: 'offtopic_warm',
        appendTrialLink: false,
        body: es
          ? ['¡Gracias 💛', '', 'Un abrazo — que te vaya bonito.'].join('\n')
          : ['Merci 💛', '', 'Belle journée à toi — je t’embrasse.'].join('\n'),
      };
  }
}

/** Rappel doux optionnel (thinking) — une seule fois, pas un tunnel essai. */
export function thinkingNudgeBody(market: 'fr' | 'mx'): string {
  return market === 'mx'
    ? [
        'Hola de nuevo 💛',
        '',
        'Solo un recordatorio suave, como te dije.',
        'Si ya no te apetece, dímelo y no te escribo más.',
      ].join('\n')
    : [
        'Re-coucou 💛',
        '',
        'Juste le petit rappel doux dont on avait parlé.',
        'Si tu préfères que je n’écrive plus, dis-le-moi et j’arrête.',
      ].join('\n');
}
