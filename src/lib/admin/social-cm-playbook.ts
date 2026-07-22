import type { SocialNetwork, SocialPostFormat } from '@/lib/admin/social-comms';

export const SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT = `Editorial lifestyle photograph, 4:5 portrait format. A Pilates instructor's hands and forearm entering the frame from the left edge, gently adjusting the shoulder alignment of a woman lying on a cream Pilates mat. The student is in profile, eyes closed, serene relaxed expression, natural skin texture, mid-30s. Close-medium framing showing head and shoulders. Background: warm off-white textured plaster wall, softly blurred, shallow depth of field (50mm f/2 look). Soft natural side light from a window, gentle shadows, no flash. Single color accent: a terracotta clay-colored towel or top, everything else in cream, warm beige and natural skin tones. Muted desaturated palette, subtle film grain, premium wellness editorial style, not stock photography. Large negative space in the upper third of the frame. No text, no logo, no watermark.`;

/** Type média produit — le format dicte le média. */
export type SocialMediaKind = 'video_brief' | 'photo' | 'carousel';

export type CaptionBand = {
  min: number;
  idealMin: number;
  idealMax: number;
  max: number;
  hint: string;
};

/** Légendes par format (données 2025–2026, pas une longueur unique). */
export const CAPTION_BY_FORMAT: Record<SocialPostFormat, CaptionBand> = {
  reel: {
    min: 40,
    idealMin: 70,
    idealMax: 150,
    max: 220,
    hint: 'Reel : légende courte (hook + CTA). Le message est dans la vidéo (titre + sous-titres).',
  },
  feed: {
    min: 80,
    idealMin: 100,
    idealMax: 180,
    max: 280,
    hint: 'Feed photo marque : légende courte ; l’image réelle porte. Pour un post éducatif long, préfère un carousel.',
  },
  carousel: {
    min: 150,
    idealMin: 200,
    idealMax: 900,
    max: 1500,
    hint: 'Carousel éducatif : légende plus longue OK (hook dans les 125 premiers car. + valeur + CTA save).',
  },
  story: {
    min: 0,
    idealMin: 0,
    idealMax: 40,
    max: 80,
    hint: 'Story : texte minimal.',
  },
  text: {
    min: 80,
    idealMin: 180,
    idealMax: 280,
    max: 350,
    hint: 'WhatsApp texte : court, chaleureux, 1 CTA.',
  },
};

export function mediaKindForSlot(network: SocialNetwork, format: SocialPostFormat): SocialMediaKind {
  if (format === 'reel' || network === 'tiktok') return 'video_brief';
  if (format === 'carousel') return 'carousel';
  return 'photo';
}

type NetworkGuideline = {
  label: string;
  captionMax: number;
  captionIdeal: number;
  hashtagMax: number;
  hashtagIdeal: number;
  bestHours: number[];
  bestDays: string[];
  formats: SocialPostFormat[];
  weeklyTarget: string;
  tips: string[];
};

export const SOCIAL_CM_GUIDELINES: Record<SocialNetwork, NetworkGuideline> = {
  instagram: {
    label: 'Instagram',
    captionMax: 2200,
    captionIdeal: 120,
    hashtagMax: 5,
    hashtagIdeal: 4,
    bestHours: [7, 8, 11, 12, 17, 18, 19],
    bestDays: ['mardi', 'mercredi', 'jeudi', 'vendredi'],
    formats: ['reel', 'carousel', 'feed'],
    weeklyTarget: '3–5 Reels (vidéo) + 1–2 carousels + 1–2 Feed photo. ~60 % vidéo / 25 % carousel / 15 % photo.',
    tips: [
      'Reels = vidéo 9:16 + gros titre 0–2 s + sous-titres brûlés (pas une photo Unsplash).',
      'Carousels pour l’éducation Pilates (saves).',
      'Feed photo = bibliothèque réelle en priorité (authenticité Alejandra).',
    ],
  },
  facebook: {
    label: 'Facebook',
    captionMax: 500,
    captionIdeal: 80,
    hashtagMax: 2,
    hashtagIdeal: 1,
    bestHours: [9, 10, 13, 14, 18],
    bestDays: ['mercredi', 'jeudi', 'vendredi'],
    formats: ['feed', 'reel'],
    weeklyTarget: '2–4 posts/semaine : texte court (40–80 car. idéalement), recyclage Reel avec légende réécrite.',
    tips: [
      'Prioriser commentaires / questions ouvertes.',
      'Image réelle > stock. Moins de hashtags.',
    ],
  },
  whatsapp: {
    label: 'WhatsApp',
    captionMax: 350,
    captionIdeal: 220,
    hashtagMax: 0,
    hashtagIdeal: 0,
    bestHours: [8, 12, 17, 19],
    bestDays: ['lundi', 'mercredi', 'vendredi'],
    formats: ['feed'],
    weeklyTarget: '2–3 messages/semaine avec photo réelle FitMangas (pas Unsplash).',
    tips: ['0 hashtag, 1 CTA clair.', 'Photo bibliothèque Alejandra / cours.'],
  },
  tiktok: {
    label: 'TikTok',
    captionMax: 150,
    captionIdeal: 90,
    hashtagMax: 4,
    hashtagIdeal: 3,
    bestHours: [9, 12, 17, 19, 21],
    bestDays: ['mardi', 'jeudi', 'samedi'],
    formats: ['reel'],
    weeklyTarget: '3–5 vidéos courtes/semaine (même logique Reels : titre + sous-titres).',
    tips: ['Hook immédiat.', 'Sous-titres intégrés.'],
  },
};

export const CM_STRATEGY_NOTES = [
  'Prioriser la vidéo (Reels) pour croître — jamais une image Unsplash déguisée en Reel.',
  'Carousels pour l’éducation Pilates (saves). Photos réelles pour Feed marque et WhatsApp.',
  'IA editorial (Gemini → Pollinations) quand la bibliothèque est saturée ; Unsplash = dernier recours Feed uniquement.',
  'Légendes adaptées au format (Reel court / Feed court / Carousel plus long). Facebook = court + communauté.',
  'Format viral Reel : méthode Claude Code + HyperFrames local (dérush Whisper/ffmpeg, motion, sous-titres 2–3 mots) — kit reel-monteur-fitmangas/ — puis import MP4 dans FitMangas.',
];

export function analyzeCaptionForPost(
  caption: string,
  network: SocialNetwork,
  format: SocialPostFormat,
  hashtagCount = 0,
) {
  const g = SOCIAL_CM_GUIDELINES[network];
  const band =
    network === 'facebook'
      ? { min: 30, idealMin: 40, idealMax: 120, max: 300, hint: 'Facebook : viser 40–80 car. pour l’engagement.' }
      : network === 'whatsapp'
        ? CAPTION_BY_FORMAT.text
        : CAPTION_BY_FORMAT[format] ?? CAPTION_BY_FORMAT.feed;

  const len = caption.trim().length;
  const warnings: string[] = [];
  if (len > band.max) warnings.push(`Trop longue (${len}/${band.max}). ${band.hint}`);
  else if (len < band.min) warnings.push(`Trop courte (${len}). ${band.hint}`);
  else if (len < band.idealMin || len > band.idealMax) {
    warnings.push(`Hors zone idéale ${band.idealMin}–${band.idealMax} car. ${band.hint}`);
  }
  if (hashtagCount > g.hashtagMax) warnings.push(`Trop de hashtags (${hashtagCount}/${g.hashtagMax}).`);
  return {
    length: len,
    max: band.max,
    ideal: Math.round((band.idealMin + band.idealMax) / 2),
    idealMin: band.idealMin,
    idealMax: band.idealMax,
    warnings,
    ok: warnings.length === 0,
    hint: band.hint,
  };
}

/** @deprecated préfère analyzeCaptionForPost */
export function analyzeCaptionForNetwork(caption: string, network: SocialNetwork, hashtagCount = 0) {
  return analyzeCaptionForPost(caption, network, network === 'whatsapp' ? 'text' : 'feed', hashtagCount);
}

export function formatBestHours(network: SocialNetwork): string {
  return SOCIAL_CM_GUIDELINES[network].bestHours.map((h) => `${String(h).padStart(2, '0')}h`).join(', ');
}

export function suggestedPlannedAt(network: SocialNetwork, dayOffset: number, slotIndex = 0): string {
  const g = SOCIAL_CM_GUIDELINES[network];
  const hour = g.bestHours[slotIndex % g.bestHours.length] ?? 10;
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export function startOfMonth(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function monthGridDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const start = new Date(first);
  const dow = start.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  start.setDate(start.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export const REEL_HOOK_STYLE = {
  font: 'Inter, system-ui, sans-serif',
  color: '#FFFFFF',
  outline: '#000000',
  accent: '#C45D3E',
  placement: 'upper_third' as const,
};

export const ACTION_BUTTON_HELP = {
  copy: 'Copie la légende + CTA + hashtags.',
  save: 'Enregistre la légende.',
  ready: 'Validé en interne.',
  schedule: 'Programme Meta / file IG / rappel WhatsApp.',
  publish: 'Publication immédiate IG/FB.',
  publishedManual: 'Déjà publié à la main.',
  delete: 'Retire du plan.',
};
