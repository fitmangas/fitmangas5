/** Config Jitsi External API — mobile web entre directement dans le navigateur (pas de promo app native). */
export function buildJitsiConfigOverwrite(isModerator: boolean): Record<string, unknown> {
  const common = {
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    defaultLanguage: 'fr',
  };
  if (isModerator) {
    return {
      ...common,
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      disableModeratorIndicator: false,
      fileRecordingsEnabled: true,
      hiddenDomain: 'recorder.meet.jitsi',
    };
  }
  return {
    ...common,
    startWithAudioMuted: true,
    startWithVideoMuted: false,
  };
}

export function buildJitsiInterfaceConfigOverwrite(isModerator: boolean): Record<string, unknown> {
  const common = {
    MOBILE_APP_PROMO: false,
  };
  if (!isModerator) return common;
  return {
    ...common,
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
  };
}
