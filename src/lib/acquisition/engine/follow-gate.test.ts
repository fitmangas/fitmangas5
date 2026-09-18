import { describe, expect, it } from 'vitest';

import {
  inferPendingIntent,
  isContactFollowVerified,
  isFollowGateBypassText,
  shouldEnforceFollowGate,
} from '@/lib/acquisition/engine/follow-gate';
import {
  getAttachmentQuizQuestions,
  scoreAttachmentAnswers,
} from '@/lib/quiz/attachment-discipline';
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

  it('bypass clics gate', () => {
    expect(isFollowGateBypassText('FOLLOW_CLAIM Je m’abonne')).toBe(true);
    expect(isFollowGateBypassText("C'est bon ✅ FOLLOW_DONE")).toBe(true);
    expect(isFollowGateBypassText('prix')).toBe(false);
  });

  it('infère pending intent', () => {
    expect(inferPendingIntent('c’est combien')).toBe('price');
    expect(inferPendingIntent('ESSAI')).toBe('trial');
    expect(inferPendingIntent('horaires')).toBe('schedule');
    expect(inferPendingIntent('Bonjour')).toBe('greeting');
  });
});

describe('attachment quiz scoring', () => {
  it('classe anxious si réponses anxieuses', () => {
    const qs = getAttachmentQuizQuestions('fr');
    const answers: Record<string, string> = {};
    for (const q of qs) answers[q.id] = 'a';
    expect(scoreAttachmentAnswers(qs, answers)).toBe('anxious');
  });

  it('classe avoidant si réponses b', () => {
    const qs = getAttachmentQuizQuestions('fr');
    const answers: Record<string, string> = {};
    for (const q of qs) answers[q.id] = 'b';
    expect(scoreAttachmentAnswers(qs, answers)).toBe('avoidant');
  });
});
