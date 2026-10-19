import { describe, expect, it } from 'vitest';

import { generateGiftCode, isGiftCodeFormat, normalizeGiftCode } from './code';

describe('gift code', () => {
  it('FM-XXXX-XXXX sans 0/O/1/I', () => {
    for (let i = 0; i < 20; i += 1) {
      const code = generateGiftCode();
      expect(isGiftCodeFormat(code)).toBe(true);
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it('normalise les espaces', () => {
    expect(normalizeGiftCode(' fm-7k2q-9xw4 ')).toBe('FM-7K2Q-9XW4');
  });
});
