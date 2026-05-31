import { describe, expect, it } from 'vitest';

import { buildJitsiConfigOverwrite, buildJitsiInterfaceConfigOverwrite } from '@/lib/jitsi/embed-config';

describe('jitsi embed-config', () => {
  it('désactive le deep-linking mobile pour participants et modérateurs', () => {
    expect(buildJitsiConfigOverwrite(false).disableDeepLinking).toBe(true);
    expect(buildJitsiConfigOverwrite(true).disableDeepLinking).toBe(true);
  });

  it('désactive la promo app native sur mobile', () => {
    expect(buildJitsiInterfaceConfigOverwrite(false).MOBILE_APP_PROMO).toBe(false);
    expect(buildJitsiInterfaceConfigOverwrite(true).MOBILE_APP_PROMO).toBe(false);
  });
});
