import { describe, expect, it } from 'vitest';

import { isTestOrTeamContact } from './test-contacts';

describe('isTestOrTeamContact (lot 7, « Inclure les tests »)', () => {
  it('fils démo, labo et sandbox', () => {
    expect(isTestOrTeamContact({ handle: '@meta_test_01' })).toBe(true);
    expect(isTestOrTeamContact({ handle: '@demo_julie' })).toBe(true);
    expect(isTestOrTeamContact({ email: 'sandbox@fitmangas.com' })).toBe(true);
  });
  it('étiquettes test, équipe, prestataire (accents et majuscules indifférents)', () => {
    expect(isTestOrTeamContact({ handle: '@vraie.personne', tags: ['Équipe'] })).toBe(true);
    expect(isTestOrTeamContact({ handle: '@vraie.personne', tags: ['prestataire'] })).toBe(true);
    expect(isTestOrTeamContact({ handle: '@vraie.personne', tags: ['TEST'] })).toBe(true);
  });
  it('une vraie cliente reste comptée', () => {
    expect(isTestOrTeamContact({ handle: '@marie.pilates', email: 'marie@gmail.com', tags: ['prix', 'chaud'] })).toBe(false);
    expect(isTestOrTeamContact({})).toBe(false);
  });
});
