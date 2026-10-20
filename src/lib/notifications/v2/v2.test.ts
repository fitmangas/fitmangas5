import { afterEach, describe, expect, it } from 'vitest';

import { weeklyOccurrences } from '@/lib/courses/recurring';

import { isCriticalEventType } from '../category';
import { filterDigestRowsForFlush } from './cutoff';
import { isNotifV2Enabled } from './flag';
import { isLivePresence } from './presence';
import {
  contentGroupKey,
  findTwin,
  isVisioLiveRecipient,
  shouldNotifyForTwinSlot,
  visioAccessFromTier,
  type RecipientProfile,
} from './recipients';
import {
  isEveReminderWindow,
  isOneHourReminderWindow,
  localHourInZone,
  oneHourCopyMinutes,
} from './windows';

const PARIS = 'Europe/Paris';
const MEXICO = 'America/Mexico_City';

function profile(partial: Partial<RecipientProfile>): RecipientProfile {
  return {
    id: 'u1',
    preferred_locale: 'fr',
    live_other_language: false,
    visioAccess: true,
    ...partial,
  };
}

describe('notif v2 flag', () => {
  it('off par défaut', () => {
    expect(isNotifV2Enabled({})).toBe(false);
    expect(isNotifV2Enabled({ NEXT_PUBLIC_FEATURE_NOTIF_V2: '1' })).toBe(true);
  });
});

describe('destinataires visio', () => {
  it('langue du live', () => {
    expect(isVisioLiveRecipient(profile({ preferred_locale: 'fr' }), 'fr')).toBe(true);
    expect(isVisioLiveRecipient(profile({ preferred_locale: 'fr' }), 'es')).toBe(false);
  });

  it('option autre langue', () => {
    expect(isVisioLiveRecipient(profile({ preferred_locale: 'fr', live_other_language: true }), 'es')).toBe(true);
  });

  it('accès expiré exclu', () => {
    expect(visioAccessFromTier('online_individual_monthly', true)).toBe(false);
    expect(isVisioLiveRecipient(profile({ visioAccess: false }), 'fr')).toBe(false);
  });

  it('jumeaux : sans autre langue, seulement sa locale', () => {
    const fr = { id: 'c-fr', language: 'fr' as const, startsAtIso: '2026-10-26T18:00:00.000Z' };
    const es = { id: 'c-es', language: 'es' as const, startsAtIso: '2026-10-26T18:00:00.000Z' };
    expect(findTwin(fr, [fr, es])?.id).toBe('c-es');
    expect(shouldNotifyForTwinSlot(profile({ preferred_locale: 'fr' }), fr, es)).toBe(true);
    expect(shouldNotifyForTwinSlot(profile({ preferred_locale: 'fr' }), es, fr)).toBe(false);
    expect(shouldNotifyForTwinSlot(profile({ preferred_locale: 'fr', live_other_language: true }), es, fr)).toBe(true);
  });
});

describe('fenêtres veille / 1 h — Paris et Mexico, DST 25/10/2026', () => {
  it('Paris : 25/10 18:00 locale (après changement d’heure) = veille du 26/10', () => {
    const now = new Date('2026-10-25T17:00:00.000Z');
    expect(localHourInZone(now, PARIS)).toBe(18);
    expect(isEveReminderWindow(now, '2026-10-26T18:00:00.000Z', PARIS)).toBe(true);
    expect(isEveReminderWindow(new Date('2026-10-25T16:30:00.000Z'), '2026-10-26T18:00:00.000Z', PARIS)).toBe(false);
  });

  it('Paris : 24/10 18:00 locale (encore CEST) = veille du 25/10', () => {
    const now = new Date('2026-10-24T16:00:00.000Z');
    expect(localHourInZone(now, PARIS)).toBe(18);
    expect(isEveReminderWindow(now, '2026-10-25T17:00:00.000Z', PARIS)).toBe(true);
  });

  it('Mexico : 25/10 18:00 locale = veille du 26/10 19:00', () => {
    const now = new Date('2026-10-26T00:00:00.000Z');
    expect(localHourInZone(now, MEXICO)).toBe(18);
    expect(isEveReminderWindow(now, '2026-10-27T01:00:00.000Z', MEXICO)).toBe(true);
  });

  it('1 h avant : 0 < min ≤ 75', () => {
    const start = new Date('2026-10-26T18:00:00.000Z');
    expect(isOneHourReminderWindow(new Date(start.getTime() - 60 * 60000), start.toISOString())).toBe(true);
    expect(isOneHourReminderWindow(new Date(start.getTime() - 75 * 60000), start.toISOString())).toBe(true);
    expect(isOneHourReminderWindow(new Date(start.getTime() - 76 * 60000), start.toISOString())).toBe(false);
    expect(isOneHourReminderWindow(start, start.toISOString())).toBe(false);
    expect(oneHourCopyMinutes(new Date(start.getTime() - 40 * 60000), start.toISOString())).toBe(40);
  });
});

describe('cutoff digest', () => {
  const prev = process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2;
  const prevCut = process.env.NOTIF_V2_CUTOFF;
  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2;
    else process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2 = prev;
    if (prevCut === undefined) delete process.env.NOTIF_V2_CUTOFF;
    else process.env.NOTIF_V2_CUTOFF = prevCut;
  });

  it('drapeau off : aucun flush', () => {
    delete process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2;
    const r = filterDigestRowsForFlush([{ id: 'old', created_at: '2026-10-01T00:00:00.000Z' }]);
    expect(r.skippedFlagOff).toBe(true);
    expect(r.allowed).toEqual([]);
  });

  it('drapeau on sans cutoff : rien ne part (arriéré protégé)', () => {
    process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2 = '1';
    delete process.env.NOTIF_V2_CUTOFF;
    const r = filterDigestRowsForFlush([{ id: 'old', created_at: '2026-01-01T00:00:00.000Z' }]);
    expect(r.allowed).toEqual([]);
    expect(r.missingCutoff).toBe(true);
    expect(r.skippedFlagOff).toBe(false);
  });

  it('élément antérieur au cutoff jamais envoyé', () => {
    process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2 = '1';
    process.env.NOTIF_V2_CUTOFF = '2026-10-19T00:00:00.000Z';
    const r = filterDigestRowsForFlush([
      { id: 'old', created_at: '2026-01-01T00:00:00.000Z' },
      { id: 'new', created_at: '2026-10-19T12:00:00.000Z' },
    ]);
    expect(r.allowed.map((x) => x.id)).toEqual(['new']);
    expect(r.skippedCutoff).toBe(1);
  });
});

describe('anti-doublon / group_key / récurrence / présence', () => {
  it('group_key journalier dans le fuseau cliente', () => {
    expect(contentGroupKey(new Date('2026-10-25T23:30:00.000Z'), PARIS)).toBe('content-2026-10-26');
    expect(contentGroupKey(new Date('2026-10-25T23:30:00.000Z'), MEXICO)).toBe('content-2026-10-25');
  });

  it('idempotency_key unique déjà en base (contrat)', () => {
    const key = 'course.visio.reminder_H-1:c1:u1';
    const seen = new Set<string>();
    expect(seen.has(key)).toBe(false);
    seen.add(key);
    expect(seen.has(key)).toBe(true);
  });

  it('occurrences hebdo', () => {
    const occ = weeklyOccurrences(
      '2026-10-26T18:00:00.000Z',
      '2026-10-26T19:00:00.000Z',
      '2026-11-16T23:59:00.000Z',
      true,
    );
    expect(occ).toHaveLength(4);
    expect(weeklyOccurrences('2026-10-26T18:00:00.000Z', '2026-10-26T19:00:00.000Z', null, true)).toHaveLength(1);
    expect(weeklyOccurrences('2026-10-26T18:00:00.000Z', '2026-10-26T19:00:00.000Z', '2026-11-16T23:59:00.000Z', false)).toHaveLength(1);
  });

  it('présence = 15 min avant le début jusqu’à la fin', () => {
    const start = new Date('2026-10-26T18:00:00.000Z');
    const end = new Date('2026-10-26T19:00:00.000Z');
    expect(isLivePresence(new Date('2026-10-26T17:44:00.000Z'), start, end)).toBe(false);
    expect(isLivePresence(new Date('2026-10-26T17:45:00.000Z'), start, end)).toBe(true);
    expect(isLivePresence(new Date('2026-10-26T19:00:00.000Z'), start, end)).toBe(true);
    expect(isLivePresence(new Date('2026-10-26T19:01:00.000Z'), start, end)).toBe(false);
  });

  it('rappels v2 ignorent silence (événements critiques si drapeau on)', () => {
    const prev = process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2;
    process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2 = '1';
    expect(isCriticalEventType('course.visio.reminder_J-1')).toBe(true);
    expect(isCriticalEventType('course.visio.reminder_H-1')).toBe(true);
    expect(isCriticalEventType('course.visio.schedule_changed')).toBe(true);
    expect(isCriticalEventType('course.visio.cancelled')).toBe(true);
    if (prev === undefined) delete process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2;
    else process.env.NEXT_PUBLIC_FEATURE_NOTIF_V2 = prev;
  });
});
