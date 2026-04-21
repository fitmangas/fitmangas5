/** Extrait le premier identifiant numérique Vimeo présent dans le corps du webhook. */
export function extractVimeoNumericIdFromWebhookPayload(payload: unknown): string | null {
  if (payload === null || payload === undefined) return null;

  const scan = (v: unknown): string | null => {
    if (typeof v === 'string') {
      const m = v.match(/\/videos\/(\d+)/);
      return m?.[1] ?? null;
    }
    if (typeof v === 'number' && Number.isFinite(v)) {
      return String(Math.floor(v));
    }
    if (typeof v !== 'object') return null;

    const o = v as Record<string, unknown>;
    const direct =
      typeof o.uri === 'string'
        ? o.uri.match(/\/videos\/(\d+)/)?.[1]
        : typeof o.link === 'string'
          ? o.link.match(/\/videos\/(\d+)/)?.[1]
          : undefined;
    if (direct) return direct;

    for (const key of Object.keys(o)) {
      const nested = scan(o[key]);
      if (nested) return nested;
    }
    return null;
  };

  const fromScan = scan(payload);
  if (fromScan) return fromScan;

  try {
    const m = JSON.stringify(payload).match(/\/videos\/(\d+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}
