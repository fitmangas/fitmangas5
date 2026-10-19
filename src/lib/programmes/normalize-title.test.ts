import { describe, expect, it } from 'vitest';

import { matchPublishedTitles, nextEnrollmentStatuses, normalizeVideoTitle } from './normalize-title';

describe('titres programmes', () => {
  it('normalise NFC et espaces', () => {
    expect(normalizeVideoTitle('  Pilates  Mat  ')).toBe('pilates mat');
  });

  it('exact / manquant / ambigu', () => {
    const cat = [
      { id: '1', title: 'Pilates Mat' },
      { id: '2', title: 'Barre Sculpt' },
      { id: '3', title: 'Pilates Mat' },
    ];
    expect(matchPublishedTitles('Pilates  Mat', [{ id: '1', title: 'Pilates Mat' }]).status).toBe('exact');
    expect(matchPublishedTitles('Inconnu', cat).status).toBe('missing');
    expect(matchPublishedTitles('Pilates Mat', cat).status).toBe('ambiguous');
  });

  it('un seul actif : pause puis nouveau', () => {
    expect(nextEnrollmentStatuses('e1', true)).toEqual({ pauseId: 'e1', createNew: true });
    expect(nextEnrollmentStatuses(null, true)).toEqual({ pauseId: null, createNew: true });
  });
});
