/** Boutons toolbar Jitsi — modérateur (micro + gestion participants). */
export const JITSI_MODERATOR_TOOLBAR_BUTTONS = [
  'microphone',
  'camera',
  'desktop',
  'fullscreen',
  'participants-pane',
  'chat',
  'raisehand',
  'tileview',
  'settings',
  'hangup',
] as const;

/** Boutons toolbar Jitsi — client (sans micro : modération audio côté modérateur). */
export const JITSI_PARTICIPANT_TOOLBAR_BUTTONS = [
  'camera',
  'chat',
  'raisehand',
  'fullscreen',
  'tileview',
  'settings',
  'hangup',
] as const;

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
    /** Micro local coupé à l’entrée. */
    startWithAudioMuted: true,
    startWithVideoMuted: false,
    /** Tous les participants après le 1er (modérateur) rejoignent muets au niveau salle. */
    startAudioMuted: 1,
  };
}

export function buildJitsiInterfaceConfigOverwrite(isModerator: boolean): Record<string, unknown> {
  const common = {
    MOBILE_APP_PROMO: false,
    TOOLBAR_BUTTONS: isModerator
      ? [...JITSI_MODERATOR_TOOLBAR_BUTTONS]
      : [...JITSI_PARTICIPANT_TOOLBAR_BUTTONS],
  };
  if (!isModerator) return common;
  return {
    ...common,
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
  };
}
