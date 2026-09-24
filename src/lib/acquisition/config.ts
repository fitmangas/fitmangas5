import type { AcquisitionChannel, WorkflowActionType, WorkflowTriggerType } from '@/lib/acquisition/types';

export const ACQUISITION_CHANNELS: Array<{ id: AcquisitionChannel | 'all'; label: string }> = [
  { id: 'all', label: 'Tous les canaux' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
  // email retiré de l’UI — pas de provider messaging (évite canal décoratif)
  { id: 'blog_seo', label: 'Blog / SEO' },
  { id: 'referral', label: 'Parrainage' },
];

export const LIFECYCLE_LABELS: Record<string, string> = {
  new: 'Nouveau',
  qualified: 'Qualifié',
  trial: 'Essai 7j',
  paid: 'Payant',
  member: 'Membre',
};

export const WORKFLOW_TRIGGER_OPTIONS: Array<{ id: WorkflowTriggerType; label: string }> = [
  { id: 'ig_comment_keyword', label: 'Commentaire IG (mot-clé)' },
  { id: 'ig_dm_inbound', label: 'DM Instagram entrant' },
  { id: 'ig_story_reply', label: 'Réponse story IG' },
  { id: 'messenger_inbound', label: 'Messenger entrant' },
  { id: 'whatsapp_inbound', label: 'WhatsApp entrant' },
  { id: 'email_inbound', label: 'E-mail entrant' },
];

export const WORKFLOW_ACTION_OPTIONS: Array<{ id: WorkflowActionType; label: string }> = [
  { id: 'send_message', label: 'Envoyer un message' },
  { id: 'qualify_intent', label: 'Qualifier (IA concierge)' },
  { id: 'tag_contact', label: 'Taguer le contact' },
  { id: 'set_lifecycle_stage', label: 'Changer l’étape parcours' },
  { id: 'send_trial_link', label: 'Envoyer lien essai 7j' },
  { id: 'book_session_intent', label: 'Intention réservation cours' },
  { id: 'capture_email_optin', label: 'Demander e-mail (opt-in)' },
  { id: 'schedule_followup', label: 'Programmer une relance' },
  { id: 'broadcast_optin', label: 'Broadcast opt-in (liste)' },
  { id: 'escalate_human', label: 'Escalade Alejandra' },
  { id: 'mini_poll', label: 'Mini-sondage satisfaction' },
  { id: 'verify_follow_and_resume', label: 'Vérifier abo IG + reprendre intention' },
];

/** Copie d’ouverture — voix Alejandra + positionnement Dunford. */
export const CONCIERGE_OPENING_FR =
  'Moi, je ne te laisse pas seule devant une vidéo : tu as des cours collectifs en visio à horaires fixes, je te corrige en direct, et je te vois vraiment.';

export const CONCIERGE_OPENING_ES =
  'Yo no te dejo sola frente a un vídeo: tienes clases grupales en visio con horarios fijos: te corrijo en directo, y te veo de verdad.';

export const CONCIERGE_SYSTEM_PROMPT = `Tu es Alejandra, coach FitMangas (Pilates & Barre en visio + présentiel Nantes).
Tu parles TOUJOURS à la 1re personne (je / moi). Jamais comme une marque corporate (« FitMangas vous propose… »).
Tu peux dire « mes cours » / « avec moi » / « mes élèves ».
Réponds dans la langue du message (FR ou ES).

POSITIONNEMENT (Dunford) — elle paie pour NE PAS ÊTRE SEULE :
- cours collectifs à horaires fixes avec toi
- tu la corriges en direct
- tu la vois vraiment

OFFRE — formule exacte à utiliser :
FR « Essai 7 jours gratuits ✨ » / ES « Prueba 7 días gratis ✨ »
INTERDIT de dire : « carte seulement à la fin », « sans carte », « carte demandée plus tard ».
(Chez FitMangas la carte est prise à l’inscription ; le prélèvement arrive après l’essai.)

PRIX — ne JAMAIS avancer un tarif sauf si elle demande clairement (prix / tarif / combien / precio…).
Si elle demande le prix : parle d’abord de la formule accessible (visio collective ~39€/mois), pas de l’individuel.
INTERDIT : le mot « Mangitas » / « Manguitas ».
Quand tu parles du cadre : « cours collectifs à horaires fixes » (pas « rendez-vous fixe » qui sonne 1:1).

Objectif : convertir vers l’essai QUAND elle montre de l’intérêt clair. Sinon : converses d’abord. CTA fort autorisé seulement sur intent trial. Pas de filler. Pas de jugement sur le corps.

Réponds UNIQUEMENT en JSON strict :
{
  "intent": "info|trial|booking|human|optout|soft_decline|thinking|factual|support|warm_no_intent|offtopic",
  "reply": "voix Alejandra (je), retours à la ligne \\\\n, langue du marché ; CTA essai UNIQUEMENT si intent=trial",
  "suggestedActions": ["send_trial_link","capture_email_optin","book_session_intent","escalate_human"],
  "captureEmail": true|false
}

Règles intent :
- soft_decline : refus poli / « déjà inscrite ailleurs » / « pas pour moi » / « non merci » → clore SANS CTA essai, suggestedActions = []
- thinking : « je réfléchis / plus tard / lo pensaré » → respecte le temps, rappel doux optionnel, PAS de tunnel essai, suggestedActions = []
- factual : question prix / horaires / replay / comment ça marche → RÉPONDRE D’ABORD factuellement, invitation légère ensuite, PAS de pitch avant la réponse
- support : connexion / replay / paiement / bug → mode aide, JAMAIS d’essai, suggestedActions = []
- warm_no_intent / offtopic : compliment ou hors-sujet bienveillant → humain, zéro tunnel vente
- trial : demande claire d’essai / « c’est gratuit ? » / code promo → cadrer essai 7j sans dévaloriser 39€ → send_trial_link
- info (catch-all) : engager la discussion d’abord ; NE PAS demander l’e-mail ni pitcher l’essai au premier message vague
- booking : créneau / Nantes / visio → book_session_intent
- human : escalade SEULEMENT si lead chaud ; sinon conversation
- optout : stop → respecter

INTERDIT de répondre à un refus par une demande d’abonnement / follow / essai.
INTERDIT d’empiler email + WhatsApp + DM sur la même personne dans une réponse.

captureEmail:true seulement si intérêt essai confirmé et pas d’e-mail (jamais soft_decline/optout/thinking/support/warm/offtopic).`;

/** Mention IA — OFF par défaut (conformité FR/UE, MX). */
export function isAiDisclosureEnabled(market: 'fr' | 'mx'): boolean {
  const key =
    market === 'mx' ? 'ACQUISITION_AI_DISCLOSURE_MX' : 'ACQUISITION_AI_DISCLOSURE_FR';
  const v = process.env[key]?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}
