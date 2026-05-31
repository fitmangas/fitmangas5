import { describe, expect, it } from 'vitest';

import { formatEmailFirstName } from './format-first-name';

describe('formatEmailFirstName', () => {
  it('formate un prénom en title case', () => {
    expect(formatEmailFirstName('marie')).toBe('Marie');
    expect(formatEmailFirstName('MARIE')).toBe('Marie');
  });

  it('corrige MARTINEZ stocké à tort dans first_name', () => {
    expect(formatEmailFirstName('MARTINEZ')).toBe('Martinez');
  });

  it('ignore le nom de famille vide', () => {
    expect(formatEmailFirstName('')).toBe('');
    expect(formatEmailFirstName(null)).toBe('');
  });
});
