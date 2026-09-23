import { describe, expect, it } from 'vitest';

import {
  isContactFollowVerified,
  isExistingPayingMember,
  shouldAskFollowGate,
  shouldEnforceFollowGate,
} from '@/lib/acquisition/engine/follow-gate';
import {
  isRealInfoOrTrialRequest,
  isSoftDeclineText,
} from '@/lib/acquisition/engine/soft-decline';
import type { AcqContact } from '@/lib/acquisition/types';

describe('soft-decline (cas Léa)', () => {
  it('détecte refus poli déjà inscrite ailleurs', () => {
    const lea =
      'Hello ! Merci beaucoup pour ton message 😇 mais je suis déjà inscrite à une salle de sport qui me correspond vraiment bien :) Belle soirée à toi ! ✨';
    expect(isSoftDeclineText(lea)).toBe(true);
    expect(isRealInfoOrTrialRequest(lea)).toBe(false);
  });

  it('détecte non merci / pas pour moi', () => {
    expect(isSoftDeclineText('Non merci, pas pour moi')).toBe(true);
    expect(isSoftDeclineText('no gracias')).toBe(true);
  });

  it('ne confond pas une vraie demande prix', () => {
    expect(isSoftDeclineText('c’est combien le mois ?')).toBe(false);
    expect(isRealInfoOrTrialRequest('c’est combien le mois ?')).toBe(true);
  });
});

describe('follow-gate intention', () => {
  const contact = { tags: [], lifecycleStage: 'new' } as AcqContact;

  it('enforce seulement sur Instagram', () => {
    expect(shouldEnforceFollowGate('ig_dm_inbound')).toBe(true);
    expect(shouldEnforceFollowGate('whatsapp_inbound')).toBe(false);
  });

  it('NE part PAS sur un refus Léa', () => {
    const lea =
      'Hello ! Merci beaucoup pour ton message mais je suis déjà inscrite à une salle de sport qui me correspond vraiment bien :) Belle soirée à toi !';
    expect(
      shouldAskFollowGate({
        triggerType: 'ig_dm_inbound',
        inboundText: lea,
        contact,
      }),
    ).toBe(false);
  });

  it('part sur une vraie demande essai', () => {
    expect(
      shouldAskFollowGate({
        triggerType: 'ig_dm_inbound',
        inboundText: 'Je veux l’essai 7 jours svp',
        contact,
      }),
    ).toBe(true);
  });

  it('ne part pas sur un simple bonjour', () => {
    expect(
      shouldAskFollowGate({
        triggerType: 'ig_dm_inbound',
        inboundText: 'Bonjour !',
        contact,
      }),
    ).toBe(false);
  });

  it('détecte membre payante', () => {
    expect(isExistingPayingMember({ lifecycleStage: 'member' } as AcqContact)).toBe(true);
    expect(isExistingPayingMember({ lifecycleStage: 'paid' } as AcqContact)).toBe(true);
    expect(isExistingPayingMember({ lifecycleStage: 'new' } as AcqContact)).toBe(false);
    expect(isContactFollowVerified({ tags: ['follow_gate_passed'] } as AcqContact)).toBe(true);
  });
});
