/**
 * Formule de prompt image FitMangas — 10 composants (source de vérité §6).
 * Toujours assemblés ; cadrage PARTIEL = clé anatomie ; espace négatif haut = overlay carousel.
 */

export type ImagePromptTemplateId =
  | 'mains-ajustement'
  | 'profil-respiration'
  | 'detail-tapis'
  | 'barre-cadrage-serre'
  | 'renfo-gainage-partiel'
  | 'objet-nature-morte'
  | 'ambiance-studio-vide'
  | 'hanches-bassin'
  | 'dos-posture'
  | 'sommeil-recuperation';

export const IMAGE_PROMPT_TEMPLATE_IDS: ImagePromptTemplateId[] = [
  'mains-ajustement',
  'profil-respiration',
  'detail-tapis',
  'barre-cadrage-serre',
  'renfo-gainage-partiel',
  'objet-nature-morte',
  'ambiance-studio-vide',
  'hanches-bassin',
  'dos-posture',
  'sommeil-recuperation',
];

type TemplateParts = {
  framing: string;
  subject: string;
  decor: string;
};

const TEMPLATES: Record<ImagePromptTemplateId, TemplateParts> = {
  'mains-ajustement': {
    framing:
      'A Pilates instructor\'s hands and forearm entering the frame from the left edge, gently adjusting the shoulder alignment of a woman. Close-medium framing showing head and shoulders only — no full body.',
    subject:
      'The student is in profile, eyes closed, serene relaxed expression, natural skin texture, mid-30s woman.',
    decor: 'lying on a cream Pilates mat. Background: warm off-white textured plaster wall, softly blurred.',
  },
  'profil-respiration': {
    framing:
      'Close-medium profile portrait, head and shoulders only, chin slightly lifted. No full body, no legs in frame.',
    subject:
      'A woman mid-30s with eyes softly closed, calm inhale, natural skin texture, relaxed jaw.',
    decor: 'cream wall softly blurred, hint of a window frame on the left edge.',
  },
  'detail-tapis': {
    framing:
      'Extreme close-up of hands only resting on a cream Pilates mat, fingers relaxed. No face, no full body.',
    subject: 'Natural skin on hands and forearms, quiet presence, mid-30s woman implied.',
    decor: 'cream mat texture filling the lower frame, warm plaster wall soft bokeh above.',
  },
  'barre-cadrage-serre': {
    framing:
      'Tight crop of hands and forearms holding a wooden ballet barre, torso cropped out. No full body pose.',
    subject: 'A woman mid-30s, only hands/forearms visible, calm grip, natural skin.',
    decor: 'soft cream studio wall, shallow depth, barre wood as the only warm prop.',
  },
  'renfo-gainage-partiel': {
    framing:
      'Close crop of shoulders, upper back and one supporting forearm on a mat — partial body only, no full plank visible end-to-end.',
    subject: 'A woman mid-30s, focused calm expression if face enters frame, natural skin.',
    decor: 'cream mat, warm off-white wall softly blurred.',
  },
  'objet-nature-morte': {
    framing: 'Still-life editorial frame, no people. Negative space dominates the upper third.',
    subject: 'A rolled cream Pilates towel and a single terracotta clay-colored prop on a mat.',
    decor: 'warm plaster wall backdrop, soft shadows, quiet wellness studio.',
  },
  'ambiance-studio-vide': {
    framing: 'Empty wellness studio corner, wide enough for atmosphere but intimate — no people.',
    subject: 'Absence of people; the room is the subject.',
    decor: 'cream walls, soft daylight, a barre or mat edge barely visible, calm emptiness.',
  },
  'hanches-bassin': {
    framing:
      'Close crop of hips and lower torso in soft athleticwear on a cream mat — no full body, no face, no feet if they distort anatomy.',
    subject: 'A woman mid-30s, quiet alignment cue implied by posture of the pelvis only.',
    decor: 'cream mat, warm plaster wall soft blur.',
  },
  'dos-posture': {
    framing:
      'Close-medium crop of upper back and nape from a three-quarter rear angle — shoulders and neck only, no full body.',
    subject: 'A woman mid-30s, soft posture, natural skin, serene.',
    decor: 'cream wall, window side light, shallow depth of field.',
  },
  'sommeil-recuperation': {
    framing:
      'Close crop of a woman resting on her side, head and shoulder only on a cream surface — no full body sprawl.',
    subject: 'Mid-30s woman, eyes closed, peaceful recovery, natural skin texture.',
    decor: 'soft linen cream tones, warm wall blur, quiet bedroom/studio recovery mood.',
  },
};

export function pickImagePromptTemplate(seed = 0, hint = ''): ImagePromptTemplateId {
  const h = hint.toLowerCase();
  if (/sommeil|sleep|récup|recup/.test(h)) return 'sommeil-recuperation';
  if (/dos|back|posture/.test(h)) return 'dos-posture';
  if (/hanche|bassin|hip|pelvis/.test(h)) return 'hanches-bassin';
  if (/barre/.test(h)) return 'barre-cadrage-serre';
  if (/renfo|core|gainage|énergie|energie/.test(h)) return 'renfo-gainage-partiel';
  if (/objet|still|nature/.test(h)) return 'objet-nature-morte';
  if (/ambiance|studio vide|empty/.test(h)) return 'ambiance-studio-vide';
  if (/tapis|mat|main|hand/.test(h)) return 'detail-tapis';
  if (/respir|profil|breath/.test(h)) return 'profil-respiration';
  const ids = IMAGE_PROMPT_TEMPLATE_IDS;
  return ids[Math.abs(seed) % ids.length]!;
}

/**
 * Assemble TOUJOURS les 10 composants.
 */
export function buildEditorialImagePrompt(opts?: {
  templateId?: ImagePromptTemplateId;
  sceneHint?: string;
  seed?: number;
  forCarousel?: boolean;
}): string {
  const templateId =
    opts?.templateId ?? pickImagePromptTemplate(opts?.seed ?? 0, opts?.sceneHint ?? '');
  const t = TEMPLATES[templateId];
  const scene = opts?.sceneHint?.trim()
    ? `Scene cue (keep partial framing): ${opts.sceneHint.trim().slice(0, 220)}`
    : '';
  const negative = opts?.forCarousel
    ? 'Large negative space in the upper third of the frame (mandatory — text overlay will sit there).'
    : 'Large negative space in the upper third of the frame.';

  return [
    // 1 format
    'Editorial lifestyle photograph, 4:5 portrait format.',
    // 2 cadrage partiel
    t.framing,
    // 3 sujet
    t.subject,
    // 4 décor
    t.decor,
    // 5 objectif
    'Shallow depth of field (50mm f/2 look).',
    // 6 lumière
    'Soft natural side light from a window, gentle shadows, no flash.',
    // 7 accent couleur unique
    'Single color accent: a terracotta clay-colored towel or top, everything else in cream, warm beige and natural skin tones.',
    // 8 étalonnage
    'Muted desaturated palette, subtle film grain, premium wellness editorial style, not stock photography.',
    // 9 espace négatif
    negative,
    // 10 exclusions
    'No text, no logo, no watermark.',
    scene,
    `Template: ${templateId}.`,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Prompt de référence validé (gabarit mains-ajustement). */
export const SOCIAL_EDITORIAL_IMAGE_BASE_PROMPT = buildEditorialImagePrompt({
  templateId: 'mains-ajustement',
  forCarousel: true,
});
