import { describe, expect, it } from 'vitest';

import { signUnsubscribeToken, verifyUnsubscribeToken } from './unsubscribe';

const env = { CRON_SECRET: 'test-secret-lot2b', NEXT_PUBLIC_APP_URL: 'https://fitmangas.com' };

describe('unsubscribe signé sans connexion', () => {
  it('vérifie un jeton honnête', () => {
    const token = signUnsubscribeToken('user-1', env);
    expect(verifyUnsubscribeToken(token, env)?.userId).toBe('user-1');
  });

  it('refuse une signature altérée', () => {
    const token = signUnsubscribeToken('user-1', env);
    expect(verifyUnsubscribeToken(token.slice(0, -2) + 'xx', env)).toBeNull();
  });
});
