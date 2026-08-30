/** Module Acquisition — désactivé par défaut en prod. */
export function isAcquisitionModuleEnabled(): boolean {
  const v = process.env.ACQUISITION_MODULE_ENABLED?.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

export function getMessagingMode(): 'sandbox' | 'live' {
  const v = process.env.MESSAGING_MODE?.trim().toLowerCase();
  return v === 'live' ? 'live' : 'sandbox';
}

export function isMessagingSandbox(): boolean {
  return getMessagingMode() !== 'live';
}
