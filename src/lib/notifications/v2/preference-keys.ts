/**
 * Préférences de notifications v2 (A09) : chaque case de l'écran correspond à une colonne.
 * Avant la migration du lot 2, les nouvelles colonnes n'existent pas : on lit et on écrit alors
 * la colonne historique équivalente (`fallback`), pour que l'écran fonctionne dans les deux cas.
 */

export type PrefTable = 'notification_preferences' | 'profiles';

export type PrefKeyDef = {
  table: PrefTable;
  column: string;
  fallback?: string;
  /** Valeur par défaut (SPEC §3.8) quand aucune colonne n'existe encore. */
  defaultValue: boolean;
};

export const PREF_KEYS = {
  live_eve_email: { table: 'notification_preferences', column: 'live_eve_email', fallback: 'courses_email_enabled', defaultValue: true },
  live_eve_inapp: { table: 'notification_preferences', column: 'live_eve_inapp', fallback: 'courses_inapp_enabled', defaultValue: true },
  live_eve_push: { table: 'notification_preferences', column: 'live_eve_push', fallback: 'courses_push_enabled', defaultValue: false },
  live_hour_email: { table: 'notification_preferences', column: 'live_hour_email', fallback: 'courses_email_enabled', defaultValue: true },
  live_hour_inapp: { table: 'notification_preferences', column: 'live_hour_inapp', fallback: 'courses_inapp_enabled', defaultValue: true },
  live_hour_push: { table: 'notification_preferences', column: 'live_hour_push', fallback: 'courses_push_enabled', defaultValue: false },
  live_other_language: { table: 'profiles', column: 'live_other_language', defaultValue: false },
  program_session_email: { table: 'notification_preferences', column: 'program_session_email', defaultValue: true },
  program_session_inapp: { table: 'notification_preferences', column: 'program_session_inapp', defaultValue: true },
  program_session_push: { table: 'notification_preferences', column: 'program_session_push', defaultValue: false },
  program_nudge_email: { table: 'notification_preferences', column: 'program_nudge_email', defaultValue: true },
  program_nudge_inapp: { table: 'notification_preferences', column: 'program_nudge_inapp', defaultValue: true },
  content_replay_email: { table: 'notification_preferences', column: 'content_replay_email', fallback: 'content_email_enabled', defaultValue: true },
  content_replay_inapp: { table: 'notification_preferences', column: 'content_replay_inapp', fallback: 'content_inapp_enabled', defaultValue: true },
  content_replay_push: { table: 'notification_preferences', column: 'content_replay_push', fallback: 'content_push_enabled', defaultValue: false },
  blog_email: { table: 'notification_preferences', column: 'blog_email', defaultValue: false },
  blog_inapp: { table: 'notification_preferences', column: 'blog_inapp', defaultValue: true },
  blog_push: { table: 'notification_preferences', column: 'blog_push', defaultValue: false },
  community_email: { table: 'notification_preferences', column: 'community_email_enabled', defaultValue: true },
  community_inapp: { table: 'notification_preferences', column: 'community_inapp_enabled', defaultValue: true },
  community_push: { table: 'notification_preferences', column: 'community_push_enabled', defaultValue: false },
  weekly_digest_email: { table: 'notification_preferences', column: 'weekly_digest_email', defaultValue: true },
  silence_mode: { table: 'notification_preferences', column: 'silence_mode_hours', fallback: 'silence_mode_enabled', defaultValue: true },
  marketing: { table: 'profiles', column: 'marketing_email_opt_in', defaultValue: false },
} as const satisfies Record<string, PrefKeyDef>;

export type PrefKey = keyof typeof PREF_KEYS;

export function isPrefKey(value: unknown): value is PrefKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PREF_KEYS, value);
}

/** Colonne réellement présente dans la ligne lue (nouvelle colonne, sinon repli, sinon aucune). */
export function resolvePrefColumn(key: PrefKey, row: Record<string, unknown> | null | undefined): string | null {
  const def: PrefKeyDef = PREF_KEYS[key];
  if (row && Object.prototype.hasOwnProperty.call(row, def.column)) return def.column;
  if (def.fallback && row && Object.prototype.hasOwnProperty.call(row, def.fallback)) return def.fallback;
  return null;
}

export function readPref(key: PrefKey, rows: { prefs: Record<string, unknown> | null; profile: Record<string, unknown> | null }): boolean {
  const def: PrefKeyDef = PREF_KEYS[key];
  const row = def.table === 'profiles' ? rows.profile : rows.prefs;
  const column = resolvePrefColumn(key, row);
  if (!column || !row) return def.defaultValue;
  const v = row[column];
  return typeof v === 'boolean' ? v : def.defaultValue;
}

/** Colonnes enregistrables pour l'écran (null = colonne absente : la case est affichée mais non modifiable). */
export function writableMap(rows: {
  prefs: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
}): Record<PrefKey, boolean> {
  const out = {} as Record<PrefKey, boolean>;
  for (const key of Object.keys(PREF_KEYS) as PrefKey[]) {
    const def: PrefKeyDef = PREF_KEYS[key];
    const row = def.table === 'profiles' ? rows.profile : rows.prefs;
    out[key] = resolvePrefColumn(key, row) !== null || (def.table === 'notification_preferences' && rows.prefs === null && Boolean(def.fallback));
  }
  return out;
}
