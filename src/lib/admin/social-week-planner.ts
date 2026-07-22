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
  feedIntent?: 'brand' | 'edu';
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
 * IG ≈ 5 Reels + 1–2 carousels + 1–2 Feed photo (~60/25/15)
 * FB court + communauté ; WhatsApp photos réelles
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

  if (networks.includes('facebook')) {
    slots.push({
      network: 'facebook',
      format: 'reel',
      mediaKind: 'video_brief',
      dayOffset: 1,
      slotIndex: slotIndex++,
    });
    for (const day of [3, 5]) {
      slots.push({
        network: 'facebook',
        format: 'feed',
        mediaKind: 'photo',
        dayOffset: day,
        slotIndex: slotIndex++,
        feedIntent: 'brand',
      });
    }
  }

  if (networks.includes('whatsapp')) {
    for (const day of [0, 2, 4]) {
      slots.push({
        network: 'whatsapp',
        format: 'feed',
        mediaKind: 'photo',
        dayOffset: day,
        slotIndex: slotIndex++,
        feedIntent: 'brand',
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
      acc[slot.network] = acc[slot.network] ?? { total: 0, reels: 0, feed: 0, carousel: 0 };
      acc[slot.network].total += 1;
      if (slot.format === 'reel') acc[slot.network].reels += 1;
      if (slot.format === 'feed') acc[slot.network].feed += 1;
      if (slot.format === 'carousel') acc[slot.network].carousel += 1;
      return acc;
    },
    {} as Record<SocialNetwork, { total: number; reels: number; feed: number; carousel: number }>,
  );

  return Object.entries(byNetwork)
    .map(([network, stats]) => {
      const label = SOCIAL_CM_GUIDELINES[network as SocialNetwork].label;
      const parts = [`${stats.total}`];
      if (stats.reels) parts.push(`${stats.reels} Reels`);
      if (stats.carousel) parts.push(`${stats.carousel} carousel`);
      if (stats.feed) parts.push(`${stats.feed} feed`);
      return `${label}: ${parts.join(', ')}`;
    })
    .join(' · ');
}

export function resolveGenerationNetworks(filter: SocialNetwork | 'all'): SocialNetwork[] {
  if (filter === 'all') return ['instagram', 'whatsapp', 'facebook'];
  return [filter];
}
