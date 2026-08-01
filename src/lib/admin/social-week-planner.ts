import { fromZonedTime } from 'date-fns-tz';

import { mediaKindForSlot, SOCIAL_CM_GUIDELINES, type SocialMediaKind } from '@/lib/admin/social-cm-playbook';
import type { SocialNetwork, SocialPostFormat } from '@/lib/admin/social-comms';

const PARIS_TZ = 'Europe/Paris';

export type WeekSlot = {
  network: SocialNetwork;
  format: SocialPostFormat;
  mediaKind: SocialMediaKind;
  dayOffset: number;
  slotIndex: number;
  /** Feed photo marque vs éducatif (légende) */
  feedIntent?: 'brand' | 'edu' | 'blog_teaser' | 'thought_leadership';
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function plannedAtParis(network: SocialNetwork, dayOffset: number, slotIndex = 0): string {
  const g = SOCIAL_CM_GUIDELINES[network];
  const hour = g.bestHours[slotIndex % g.bestHours.length] ?? 10;
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + dayOffset);
  const local = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(hour)}:00:00`;
  return fromZonedTime(local, PARIS_TZ).toISOString();
}

/**
 * Plan CM objectif :
 * IG ≈ 5 Reels + 1 carousel + 1 Feed (~60/25/15) — Facebook = miroir IG (pas de slots FB)
 * WhatsApp = teasers articles communauté
 * LinkedIn = posts pro / thought leadership
 */
export function buildWeeklySlots(networks: SocialNetwork[]): WeekSlot[] {
  const slots: WeekSlot[] = [];
  let slotIndex = 0;

  if (networks.includes('instagram')) {
    for (const day of [0, 1, 2, 4, 5]) {
      slots.push({
        network: 'instagram',
        format: 'reel',
        mediaKind: 'video_brief',
        dayOffset: day,
        slotIndex: slotIndex++,
      });
    }
    slots.push({
      network: 'instagram',
      format: 'carousel',
      mediaKind: 'carousel',
      dayOffset: 3,
      slotIndex: slotIndex++,
      feedIntent: 'edu',
    });
    slots.push({
      network: 'instagram',
      format: 'feed',
      mediaKind: 'photo',
      dayOffset: 6,
      slotIndex: slotIndex++,
      feedIntent: 'brand',
    });
  }

  // Facebook n'a plus de slots dédiés : miroir Instagram (alsoPublishFacebook).

  if (networks.includes('whatsapp')) {
    for (const day of [0, 2, 4]) {
      slots.push({
        network: 'whatsapp',
        format: 'text',
        mediaKind: 'photo',
        dayOffset: day,
        slotIndex: slotIndex++,
        feedIntent: 'blog_teaser',
      });
    }
  }

  if (networks.includes('linkedin')) {
    for (const day of [1, 3, 5]) {
      slots.push({
        network: 'linkedin',
        format: 'feed',
        mediaKind: 'photo',
        dayOffset: day,
        slotIndex: slotIndex++,
        feedIntent: 'thought_leadership',
      });
    }
  }

  if (networks.includes('tiktok')) {
    for (const day of [1, 3, 5]) {
      slots.push({
        network: 'tiktok',
        format: 'reel',
        mediaKind: 'video_brief',
        dayOffset: day,
        slotIndex: slotIndex++,
      });
    }
  }

  return slots.map((slot) => ({
    ...slot,
    mediaKind: slot.mediaKind || mediaKindForSlot(slot.network, slot.format),
  }));
}

export function weekPlanSummary(networks: SocialNetwork[]): string {
  const slots = buildWeeklySlots(networks);
  const byNetwork = slots.reduce(
    (acc, slot) => {
      acc[slot.network] = acc[slot.network] ?? { total: 0, reels: 0, feed: 0, carousel: 0, text: 0 };
      acc[slot.network].total += 1;
      if (slot.format === 'reel') acc[slot.network].reels += 1;
      if (slot.format === 'feed') acc[slot.network].feed += 1;
      if (slot.format === 'carousel') acc[slot.network].carousel += 1;
      if (slot.format === 'text') acc[slot.network].text += 1;
      return acc;
    },
    {} as Record<SocialNetwork, { total: number; reels: number; feed: number; carousel: number; text: number }>,
  );

  const parts = Object.entries(byNetwork).map(([network, stats]) => {
    const label = SOCIAL_CM_GUIDELINES[network as SocialNetwork].label;
    const bits = [`${stats.total}`];
    if (stats.reels) bits.push(`${stats.reels} Reels`);
    if (stats.carousel) bits.push(`${stats.carousel} carousel`);
    if (stats.feed) bits.push(`${stats.feed} feed`);
    if (stats.text) bits.push(`${stats.text} msgs`);
    return `${label}: ${bits.join(', ')}`;
  });

  if (networks.includes('instagram') || networks.includes('facebook')) {
    parts.push('FB = miroir IG');
  }

  return parts.join(' · ');
}

export function resolveGenerationNetworks(filter: SocialNetwork): SocialNetwork[] {
  // Facebook = miroir Instagram : on génère les posts IG (alsoPublishFacebook).
  if (filter === 'facebook') return ['instagram'];
  return [filter];
}
