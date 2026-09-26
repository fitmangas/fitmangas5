const GRAPH = 'https://graph.facebook.com/v21.0';

export type PageGraphResult =
  | { ok: true; json: unknown }
  | { ok: false; error: string; code?: number };

export async function pageGraphGet(
  path: string,
  token: string,
  params: Record<string, string>,
): Promise<PageGraphResult> {
  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('access_token', token);
  try {
    const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
    const json = (await res.json()) as {
      error?: { message?: string; code?: number; error_subcode?: number };
    };
    if (!res.ok) {
      return {
        ok: false,
        error: json.error?.message ?? `Meta HTTP ${res.status}`,
        code: json.error?.code,
      };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur réseau Meta' };
  }
}

/** Exécute `worker` sur `items` avec au plus `limit` appels simultanés. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}
