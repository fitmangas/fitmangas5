import { describe, expect, it } from 'vitest';

import {
  buildJitsiConfigOverwrite,
  buildJitsiInterfaceConfigOverwrite,
  JITSI_MODERATOR_TOOLBAR_BUTTONS,
  JITSI_PARTICIPANT_TOOLBAR_BUTTONS,
} from '@/lib/jitsi/embed-config';

describe('jitsi embed-config', () => {
  it('désactive le deep-linking mobile pour participants et modérateurs', () => {
    expect(buildJitsiConfigOverwrite(false).disableDeepLinking).toBe(true);
    expect(buildJitsiConfigOverwrite(true).disableDeepLinking).toBe(true);
  });

  it('désactive la promo app native sur mobile', () => {
    expect(buildJitsiInterfaceConfigOverwrite(false).MOBILE_APP_PROMO).toBe(false);
    expect(buildJitsiInterfaceConfigOverwrite(true).MOBILE_APP_PROMO).toBe(false);
  });

  it('clients rejoignent micro coupé, modérateur non', () => {
    expect(buildJitsiConfigOverwrite(false).startWithAudioMuted).toBe(true);
    expect(buildJitsiConfigOverwrite(false).startAudioMuted).toBe(1);
    expect(buildJitsiConfigOverwrite(true).startWithAudioMuted).toBe(false);
  });

  it('modérateur limite le stage à 1 participant (replay coach-only)', () => {
    expect(buildJitsiConfigOverwrite(true).maxStageParticipants).toBe(1);
    expect(buildJitsiConfigOverwrite(false).maxStageParticipants).toBeUndefined();
  });

  it('toolbar inclut fullscreen ; clients sans bouton micro', () => {
    expect(JITSI_PARTICIPANT_TOOLBAR_BUTTONS).toContain('fullscreen');
    expect(JITSI_PARTICIPANT_TOOLBAR_BUTTONS).not.toContain('microphone');
    expect(JITSI_PARTICIPANT_TOOLBAR_BUTTONS).not.toContain('toggle-camera');
    expect(JITSI_MODERATOR_TOOLBAR_BUTTONS).toContain('fullscreen');
    expect(JITSI_MODERATOR_TOOLBAR_BUTTONS).toContain('microphone');
    expect(JITSI_MODERATOR_TOOLBAR_BUTTONS).toContain('toggle-camera');
    expect(JITSI_MODERATOR_TOOLBAR_BUTTONS).toContain('participants-pane');
  });
});
