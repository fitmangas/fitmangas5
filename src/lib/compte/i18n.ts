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

export function fallbackFirstName(email: string | null | undefined): string {
  const raw = (email ?? '').split('@')[0]?.trim();
  if (!raw) return 'Client';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
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
