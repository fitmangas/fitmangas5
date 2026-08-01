import { createAdminClient } from '@/lib/supabase/admin';

import type { SocialLocale, SocialPostFormat } from '@/lib/admin/social-comms';
import type { WeeklyPillarId } from '@/lib/admin/social-pillars';

export const SOCIAL_HOOKS_BANK_KEY = 'social_hooks_bank';

export type HookBankEntry = {
  text: string;
  pillarId: WeeklyPillarId | string;
  format: SocialPostFormat | string;
  locale: SocialLocale;
  date: string;
  score: number | null;
};

export type HooksBankStore = {
  version: 1;
  entries: HookBankEntry[];
};

function emptyBank(): HooksBankStore {
  return { version: 1, entries: [] };
}

export function normalizeHookText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9àâäéèêëïîôùûüçñ?\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Distance de Levenshtein bornée (early-exit si > max). */
export function levenshteinLight(a: string, b: string, max = 12): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let rowMin = curr[0]!;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
      if (curr[j]! < rowMin) rowMin = curr[j]!;
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j]!;
  }
  return prev[b.length]!;
}

export function isHookTooSimilar(candidate: string, existing: string[], threshold = 8): boolean {
  const norm = normalizeHookText(candidate);
  if (!norm || norm.length < 6) return false;
  for (const other of existing) {
    const o = normalizeHookText(other);
    if (!o) continue;
    if (norm === o) return true;
    if (norm.includes(o) || o.includes(norm)) return true;
    if (levenshteinLight(norm, o, threshold) <= threshold) return true;
  }
  return false;
}

export async function loadHooksBank(): Promise<HooksBankStore> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admin_settings')
      .select('value')
      .eq('key', SOCIAL_HOOKS_BANK_KEY)
      .maybeSingle();
    if (error || !data?.value) return emptyBank();
    const parsed = JSON.parse(String(data.value)) as HooksBankStore;
    if (!parsed || !Array.isArray(parsed.entries)) return emptyBank();
    return { version: 1, entries: parsed.entries.slice(0, 200) };
  } catch {
    return emptyBank();
  }
}

export async function saveHooksBank(store: HooksBankStore): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from('admin_settings').upsert(
    {
      key: SOCIAL_HOOKS_BANK_KEY,
      value: JSON.stringify({ version: 1, entries: store.entries.slice(0, 200) }),
    },
    { onConflict: 'key' },
  );
  if (error) throw new Error(error.message);
}

/** Top 10 scorés, sinon les 10 plus récents. */
export function topHooksForFewShot(bank: HooksBankStore, locale?: SocialLocale, limit = 10): HookBankEntry[] {
  const pool = locale ? bank.entries.filter((e) => e.locale === locale) : bank.entries;
  const scored = pool.filter((e) => typeof e.score === 'number');
  if (scored.length >= 3) {
    return [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, limit);
  }
  return [...pool].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

export async function recordHooks(entries: HookBankEntry[]): Promise<HooksBankStore> {
  const bank = await loadHooksBank();
  const existingTexts = bank.entries.map((e) => e.text);
  const accepted: HookBankEntry[] = [];
  for (const entry of entries) {
    if (!entry.text?.trim()) continue;
    if (isHookTooSimilar(entry.text, [...existingTexts, ...accepted.map((a) => a.text)])) continue;
    accepted.push({
      ...entry,
      text: entry.text.trim().slice(0, 120),
      date: entry.date || new Date().toISOString(),
      score: entry.score ?? null,
    });
  }
  if (!accepted.length) return bank;
  const next = { version: 1 as const, entries: [...accepted, ...bank.entries].slice(0, 200) };
  await saveHooksBank(next);
  return next;
}
