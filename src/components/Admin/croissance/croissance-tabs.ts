export const CROISSANCE_TABS = [
  { id: 'overview', label: 'Vue d’ensemble', acquisitionOnly: true },
  { id: 'conversations', label: 'Conversations', acquisitionOnly: true },
  { id: 'workflows', label: 'Workflows', acquisitionOnly: true },
  { id: 'publications', label: 'Publications', acquisitionOnly: false },
  { id: 'seo', label: 'SEO', acquisitionOnly: false },
] as const;

export type CroissanceTabId = (typeof CROISSANCE_TABS)[number]['id'];

const TAB_IDS = new Set<string>(CROISSANCE_TABS.map((t) => t.id));

export function isCroissanceTabId(value: string | undefined): value is CroissanceTabId {
  return Boolean(value && TAB_IDS.has(value));
}

export function resolveCroissanceTab(
  raw: string | undefined,
  acquisitionEnabled: boolean,
): CroissanceTabId {
  if (raw === 'publications' || raw === 'seo') return raw;
  if (acquisitionEnabled && (raw === 'overview' || raw === 'conversations' || raw === 'workflows')) {
    return raw;
  }
  return acquisitionEnabled ? 'overview' : 'publications';
}
