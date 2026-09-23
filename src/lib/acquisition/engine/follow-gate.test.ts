import { describe, expect, it } from 'vitest';

import {
  inferPendingIntent,
  isContactFollowVerified,
  isFollowGateBypassText,
  shouldAskFollowGate,
  shouldEnforceFollowGate,
} from '@/lib/acquisition/engine/follow-gate';
import type { AcqContact } from '@/lib/acquisition/types';

describe('follow-gate', () => {
  it('enforce seulement sur Instagram', () => {
    expect(shouldEnforceFollowGate('ig_dm_inbound')).toBe(true);
    expect(shouldEnforceFollowGate('ig_comment_keyword')).toBe(true);
    expect(shouldEnforceFollowGate('messenger_inbound')).toBe(false);
    expect(shouldEnforceFollowGate('whatsapp_inbound')).toBe(false);
  });

  it('détecte abonnée via tags', () => {
    const c = { tags: ['follow_verified'] } as AcqContact;
    expect(isContactFollowVerified(c)).toBe(true);
    expect(isContactFollowVerified({ tags: [] } as unknown as AcqContact)).toBe(false);
  });

  it('bypass clics gate + soft-no', () => {
    expect(isFollowGateBypassText('FOLLOW_CLAIM Je m’abonne')).toBe(true);
    expect(isFollowGateBypassText("C'est bon ✅ FOLLOW_DONE")).toBe(true);
    expect(isFollowGateBypassText('non merci déjà inscrite ailleurs')).toBe(true);
    expect(isFollowGateBypassText('prix')).toBe(false);
  });

  it('shouldAskFollowGate exige un vrai intérêt', () => {
    const c = { tags: [], lifecycleStage: 'new' } as AcqContact;
    expect(shouldAskFollowGate({ triggerType: 'ig_dm_inbound', inboundText: 'essai gratuit', contact: c })).toBe(
      true,
    );
    expect(shouldAskFollowGate({ triggerType: 'ig_dm_inbound', inboundText: 'salut', contact: c })).toBe(false);
  });

  it('infère pending intent', () => {
    expect(inferPendingIntent('c’est combien')).toBe('price');
    expect(inferPendingIntent('ESSAI')).toBe('trial');
    expect(inferPendingIntent('horaires')).toBe('schedule');
    expect(inferPendingIntent('Bonjour')).toBe('greeting');
  });
});
