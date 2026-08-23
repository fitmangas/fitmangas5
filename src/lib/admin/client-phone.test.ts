import { describe, expect, it } from 'vitest';

import { phoneFromAuthUser } from './client-phone';

describe('phoneFromAuthUser', () => {
  it('lit le téléphone Auth OTP', () => {
    expect(phoneFromAuthUser({ phone: '0612345678', user_metadata: {} } as never)).toBe('0612345678');
  });

  it('lit le téléphone dans user_metadata', () => {
    expect(phoneFromAuthUser({ phone: '', user_metadata: { phone: '06 12 34 56 78' } } as never)).toBe(
      '06 12 34 56 78',
    );
  });

  it('retourne null si absent', () => {
    expect(phoneFromAuthUser({ phone: '', user_metadata: {} } as never)).toBeNull();
  });
});
