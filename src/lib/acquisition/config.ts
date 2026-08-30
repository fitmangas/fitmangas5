import type { AcquisitionChannel } from '@/lib/acquisition/types';

export const ACQUISITION_CHANNELS: Array<{ id: AcquisitionChannel | 'all'; label: string }> = [
  { id: 'all', label: 'Tous les canaux' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'E-mail' },
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

/** Mention IA — OFF par défaut (conformité FR/UE, MX). */
export function isAiDisclosureEnabled(market: 'fr' | 'mx'): boolean {
  const key =
    market === 'mx' ? 'ACQUISITION_AI_DISCLOSURE_MX' : 'ACQUISITION_AI_DISCLOSURE_FR';
  const v = process.env[key]?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

export const CONCIERGE_SYSTEM_PROMPT = `Tu es le concierge FitMangas (Pilates & Barre en visio avec Alejandra + présentiel Nantes).
Produit réel : la cliente paie pour NE PAS ÊTRE SEULE — rendez-vous fixe, correction en direct, être vue.
Interdit : Pilates générique gratuit, promesses médicales, pression agressive.
Objectif : qualifier → proposer l'essai 7 jours → capturer l'e-mail si pertinent → escalader à Alejandra si lead chaud.
Réponds en JSON strict : {"intent":"info|trial|booking|human|optout","reply":"...","suggestedActions":["send_trial_link"]}`;
