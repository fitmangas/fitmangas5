import type { SupabaseClient } from '@supabase/supabase-js';

export type ClientLang = 'fr' | 'en' | 'es';

export function isClientLang(value: unknown): value is ClientLang {
  return value === 'fr' || value === 'en' || value === 'es';
}

export async function getClientLang(supabase: SupabaseClient, userId: string): Promise<ClientLang> {
  const { data } = await supabase
    .from('profiles')
    .select('preferred_locale, preferred_blog_language')
    .eq('id', userId)
    .maybeSingle();

  const loc = data?.preferred_locale;
  if (loc === 'fr' || loc === 'es') {
    return loc;
  }

  if (isClientLang(data?.preferred_blog_language)) {
    return data.preferred_blog_language;
  }

  return 'fr';
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
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function resolveFirstName(profileFirstName: unknown, userMetadata?: unknown, email?: string | null): string | null {
  const fromProfile = normalizeFirstName(profileFirstName);
  if (fromProfile) return fromProfile;

  const meta = (userMetadata ?? {}) as {
    first_name?: unknown;
    given_name?: unknown;
    name?: unknown;
    full_name?: unknown;
  };
  const fromMetadata =
    normalizeFirstName(meta.first_name) ??
    normalizeFirstName(meta.given_name) ??
    normalizeFirstName(meta.name) ??
    normalizeFirstName(meta.full_name);
  if (fromMetadata) return fromMetadata;

  if (email?.trim().toLowerCase() === 'cliente.demo@fitmangas.com') return 'Margaux';
  return null;
}

export function formatCompteGreeting(lang: ClientLang, firstName: string | null): string {
  if (firstName) {
    const hello = lang === 'es' ? 'Hola' : lang === 'en' ? 'Hello' : 'Bonjour';
    return `${hello} ${firstName}`;
  }
  if (lang === 'es') return '¡Hola!';
  if (lang === 'en') return 'Hello!';
  return 'Bonjour !';
}

export const compteNavLabels: Record<
  ClientLang,
  {
    dashboard: string;
    planning: string;
    blog: string;
    videos: string;
    shop: string;
    profile: string;
    preferences: string;
    referral: string;
    notifications: string;
  }
> = {
  fr: {
    dashboard: 'Tableau de bord',
    planning: 'Planning',
    blog: 'Blog',
    videos: 'Vidéos',
    shop: 'Boutique',
    profile: 'Profil',
    preferences: 'Préférences',
    referral: 'Parrainage',
    notifications: 'Notifications',
  },
  en: {
    dashboard: 'Dashboard',
    planning: 'Schedule',
    blog: 'Blog',
    videos: 'Videos',
    shop: 'Shop',
    profile: 'Profile',
    preferences: 'Preferences',
    referral: 'Referrals',
    notifications: 'Notifications',
  },
  es: {
    dashboard: 'Panel',
    planning: 'Planificación',
    blog: 'Blog',
    videos: 'Videos',
    shop: 'Tienda',
    profile: 'Perfil',
    preferences: 'Preferencias',
    referral: 'Referidos',
    notifications: 'Notificaciones',
  },
};
