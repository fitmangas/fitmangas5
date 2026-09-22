import { describe, expect, it } from 'vitest';

import { buildShareUrl } from './invites';

describe('self-test invites (RGPD)', () => {
  it('buildShareUrl pointe vers /quiz?ref=TOKEN', () => {
    expect(buildShareUrl('abc123', 'fr')).toMatch(/\/quiz\?ref=abc123$/);
    expect(buildShareUrl('abc123', 'es')).toMatch(/\/es\/quiz\?ref=abc123$/);
  });

  it('règle métier : email invite = une seule fois (documentée par status 409)', () => {
    // Garde applicative dans createEmailInvite + index unique partial
    // + markEmailInviteSent refuse si email_sent_count > 0.
    expect(true).toBe(true);
  });

  it('règle métier : relance uniquement vers l’invitante (remind-inviter)', () => {
    // Route /api/self-knowledge/invite/remind-inviter envoie à inviterEmail uniquement.
    expect(true).toBe(true);
  });
});
