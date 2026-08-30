/** Tokens FitMangas × esthétique Stratus — module Acquisition uniquement. */
export const acq = {
  cream: '#FFFAF5',
  terracotta: '#C45D3E',
  ink: '#23201D',
  active: '#1A1A1A',
  warmBeige: '#F3EBE3',
  warmBeigeDeep: '#E8DFD4',
  zoneInner: '#EBE4DC',
  zoneShell: '#FFFFFF',
  muted: '#78716C',
  mutedLight: '#A8A29E',
  terracottaSoft: 'rgba(196, 93, 62, 0.14)',
  shadowCard: '0 28px 72px rgba(35, 32, 29, 0.07), 0 10px 28px rgba(35, 32, 29, 0.04)',
  shadowShell: '0 36px 88px rgba(35, 32, 29, 0.1), 0 12px 32px rgba(35, 32, 29, 0.05)',
  shadowFloat: '0 32px 80px rgba(35, 32, 29, 0.1)',
  pageGradient: 'linear-gradient(180deg, #FFFAF5 0%, #F8F0E8 42%, #F0E8DF 100%)',
} as const;

export function initialsFromLabel(label: string): string {
  const clean = label.replace(/^@/, '').trim();
  if (!clean) return '?';
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}
