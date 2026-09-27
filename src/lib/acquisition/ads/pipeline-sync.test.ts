import { describe, expect, it } from 'vitest';

import { shouldAdvanceCreativeStatus } from './pipeline-sync';

describe('pipeline-sync', () => {
  it('avance À créer → Brouillon → Publiée organique → En test', () => {
    expect(shouldAdvanceCreativeStatus(undefined, 'brouillon')).toBe(true);
    expect(shouldAdvanceCreativeStatus('a_creer', 'brouillon')).toBe(true);
    expect(shouldAdvanceCreativeStatus('brouillon', 'publiee_organique')).toBe(true);
    expect(shouldAdvanceCreativeStatus('publiee_organique', 'en_test')).toBe(true);
  });

  it('ne redescend pas et ne touche pas gagnante / à couper', () => {
    expect(shouldAdvanceCreativeStatus('en_test', 'publiee_organique')).toBe(false);
    expect(shouldAdvanceCreativeStatus('en_test', 'brouillon')).toBe(false);
    expect(shouldAdvanceCreativeStatus('gagnante', 'en_test')).toBe(false);
    expect(shouldAdvanceCreativeStatus('a_couper', 'brouillon')).toBe(false);
  });
});
