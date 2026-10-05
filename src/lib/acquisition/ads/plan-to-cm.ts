/**
 * Lien Plan d’action Ads → brouillon Programmation & Publication.
 * Ne remplace pas le CM : produit un post « manuel » pré-rempli.
 */

import { CAROUSEL_SLIDE_COUNT, FACE_CAM_SHOT_LIST, FACE_CAM_SHOT_LIST_ES } from '@/lib/admin/social-cm-playbook';
import { createSocialPostId, type SocialPost, type SocialPostFormat } from '@/lib/admin/social-comms';
import type { ActionPlanItem } from './action-plan';

export const ADS_PLAN_SOURCE_PREFIX = 'ads-plan:';

export function adsPlanSourceRef(planItemId: string): string {
  return `${ADS_PLAN_SOURCE_PREFIX}${planItemId.trim()}`;
}

export function planItemIdFromSourceRef(sourceRef: string | null | undefined): string | null {
  if (!sourceRef || !sourceRef.startsWith(ADS_PLAN_SOURCE_PREFIX)) return null;
  const id = sourceRef.slice(ADS_PLAN_SOURCE_PREFIX.length).trim();
  return id || null;
}

export function overlayFromPlanTitle(title: string): string {
  const t = title.replace(/\s+/g, ' ').trim();
  if (!t) return 'UN GESTE CONCRET';
  return t.slice(0, 72);
}

export function cmFormatFromPlanItem(item: Pick<ActionPlanItem, 'creativeType'>): SocialPostFormat {
  return item.creativeType === 'carousel' ? 'carousel' : 'reel';
}

export function contentFamilyFromPlanItem(
  item: Pick<ActionPlanItem, 'creativeType'>,
): SocialPost['contentFamily'] {
  if (item.creativeType === 'talking_head') return 'confiance';
  if (item.creativeType === 'ugc_temoignage') return 'portee';
  if (item.creativeType === 'carousel') return 'portee';
  return 'conversion';
}

export function buildReelBriefFromPlan(item: ActionPlanItem, locale: 'fr' | 'es' = 'fr'): {
  reelScript: string;
  shotList: string;
} {
  const theme = item.title.trim() || (locale === 'es' ? 'Tema Pilates' : 'Sujet Pilates');
  const angle = (item.hypothesis || '').trim();
  const evidence = (item.evidence || '').trim();
  const framework = item.framework || '';

  if (locale === 'es') {
    return {
      reelScript: [
        `TEMA (Plan Ads): ${theme}`,
        angle ? `ÁNGULO: ${angle}` : null,
        framework ? `MARCO: ${framework}` : null,
        evidence ? `PRUEBA: ${evidence}` : null,
        '',
        'IDEAS:',
        `1) Gancho ligado a: ${theme}`,
        `2) ${angle || 'Un error frecuente + la sensación / gesto clave — face cam, no plano ejercicio'}`,
        '3) Invitación suave FitMangas / prueba 7 días — fitmangas.com',
        '',
        'BRIEF (decir con naturalidad, no leer palabra por palabra):',
        `« ${theme} »`,
        angle ? `« ${angle.slice(0, 180)} »` : null,
        '« Si quieres profundizar con suavidad, únete a una clase — prueba 7 días en fitmangas.com. »',
      ]
        .filter((line): line is string => line != null)
        .join('\n'),
      shotList: FACE_CAM_SHOT_LIST_ES,
    };
  }

  return {
    reelScript: [
      `THÈME (Plan Ads) : ${theme}`,
      angle ? `ANGLE : ${angle}` : null,
      framework ? `CADRE : ${framework}` : null,
      evidence ? `PREUVE : ${evidence}` : null,
      '',
      'IDÉES:',
      `1) Accroche liée à : ${theme}`,
      `2) ${angle || 'Une erreur fréquente + la sensation / geste clé — face cam, pas plan exercice'}`,
      '3) Invitation douce FitMangas / essai 7 jours — fitmangas.com',
      '',
      'BRIEF (à dire naturellement, pas à lire mot à mot):',
      `« ${theme} »`,
      angle ? `« ${angle.slice(0, 180)} »` : null,
      '« Si tu veux creuser en douceur, rejoins une classe — essai 7 jours sur fitmangas.com. »',
    ]
      .filter((line): line is string => line != null)
      .join('\n'),
    shotList: FACE_CAM_SHOT_LIST,
  };
}

/** Post CM identique à « Nouveau post manuel », pré-rempli depuis une inspiration Plan. */
export function buildCmDraftFromPlanItem(item: ActionPlanItem, nowIso: string): SocialPost {
  const format = cmFormatFromPlanItem(item);
  const isReel = format === 'reel';
  const isCarousel = format === 'carousel';
  const overlay = overlayFromPlanTitle(item.title);
  const brief = buildReelBriefFromPlan(item, 'fr');
  const why = [
    'Inspiration Plan Ads — à compléter comme un post manuel.',
    item.hypothesis ? `Angle : ${item.hypothesis}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    id: createSocialPostId(),
    network: 'instagram',
    format,
    locale: 'fr',
    title: item.title.trim().slice(0, 120) || 'Inspiration Plan Ads',
    caption: '',
    hashtags: [],
    cta: 'Essai gratuit 7 jours',
    imageHint: item.hypothesis?.slice(0, 240) || '',
    imagePath: null,
    imageSource: isReel ? 'none' : 'library',
    aiImagePrompt: '',
    imageFeedback: '',
    overlayText: overlay,
    useOverlay: format === 'feed' || isCarousel,
    hookTitle: overlay,
    reelScript: brief.reelScript,
    shotList: brief.shotList,
    rawVideoPath: null,
    editedVideoPath: null,
    coverImagePath: null,
    videoStatus: isReel ? 'brief' : null,
    carouselPaths: isCarousel ? Array.from({ length: CAROUSEL_SLIDE_COUNT }, () => '') : [],
    carouselSlideTitles: isCarousel ? Array.from({ length: CAROUSEL_SLIDE_COUNT }, () => '') : [],
    plannedAt: null,
    status: 'idea',
    sourceType: 'manual',
    sourceRef: adsPlanSourceRef(item.id),
    whyItWorks: why.slice(0, 500),
    metaExternalId: null,
    pillarId: null,
    contentFamily: contentFamilyFromPlanItem(item),
    alsoPublishFacebook: true,
    alsoPublishTikTok: isReel,
    alsoPublishYouTube: isReel,
    adaptedFromId: null,
    facebookExternalId: null,
    tiktokExternalId: null,
    youtubeExternalId: null,
    generationStatus: 'done',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export type PlanCmLink = {
  postId: string;
  status: string;
  title?: string;
};

export function indexPlanCmLinks(posts: Array<Pick<SocialPost, 'id' | 'status' | 'title' | 'sourceRef'>>): Record<string, PlanCmLink> {
  const out: Record<string, PlanCmLink> = {};
  for (const post of posts) {
    const planId = planItemIdFromSourceRef(post.sourceRef);
    if (!planId) continue;
    out[planId] = { postId: post.id, status: post.status, title: post.title };
  }
  return out;
}
