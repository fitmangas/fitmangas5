import type { SupabaseClient } from '@supabase/supabase-js';

export type ClientLang = 'fr' | 'en' | 'es';

export function isClientLang(value: unknown): value is ClientLang {
  return value === 'fr' || value === 'en' || value === 'es';
}

export async function getClientLang(supabase: SupabaseClient, userId: string): Promise<ClientLang> {
  const { data } = await supabase
    .from('profiles')
    .select('preferred_blog_language')
    .eq('id', userId)
    .maybeSingle();

  return isClientLang(data?.preferred_blog_language) ? data.preferred_blog_language : 'fr';
}

export function localeFromClientLang(lang: ClientLang): string {
  if (lang === 'en') return 'en-US';
  if (lang === 'es') return 'es-ES';
  return 'fr-FR';
}

function normalizeFirstName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const token = trimmed.split(/\s+/)[0]?.trim();
  if (!token) return null;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

export function resolveFirstName(profileFirstName: unknown, userMetadata?: unknown): string {
  const fromProfile = normalizeFirstName(profileFirstName);
  if (fromProfile) return fromProfile;

  const meta = (userMetadata ?? {}) as {
    first_name?: unknown;
    given_name?: unknown;
    name?: unknown;
    full_name?: unknown;
  };
  return (
    normalizeFirstName(meta.first_name) ??
    normalizeFirstName(meta.given_name) ??
    normalizeFirstName(meta.name) ??
    normalizeFirstName(meta.full_name) ??
    'Alejandra'
  );
}

export const compteNavLabels: Record<ClientLang, { dashboard: string; planning: string; videos: string; shop: string; profile: string }> = {
  fr: {
    dashboard: 'Tableau de bord',
    planning: 'Planning',
    videos: 'Vidéos',
    shop: 'Boutique',
    profile: 'Profil',
  },
  en: {
    dashboard: 'Dashboard',
    planning: 'Schedule',
    videos: 'Videos',
    shop: 'Shop',
    profile: 'Profile',
  },
  es: {
    dashboard: 'Panel',
    planning: 'Planificación',
    videos: 'Videos',
    shop: 'Tienda',
    profile: 'Perfil',
  },
};
