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
    selfKnowledge: string;
    programmes: string;
    gifts: string;
    home: string;
    more: string;
    help: string;
    logout: string;
  }
> = {
  fr: {
    dashboard: 'Tableau de bord',
    home: 'Accueil',
    more: 'Plus',
    planning: 'Planning',
    programmes: 'Programmes',
    blog: 'Blog',
    videos: 'Vidéos',
    shop: 'Boutique',
    profile: 'Profil',
    preferences: 'Préférences',
    referral: 'Parrainage',
    notifications: 'Notifications',
    selfKnowledge: 'Connaissance de soi',
    gifts: 'Offrir',
    help: 'Aide',
    logout: 'Déconnexion',
  },
  en: {
    dashboard: 'Dashboard',
    home: 'Home',
    more: 'More',
    planning: 'Schedule',
    programmes: 'Programs',
    blog: 'Blog',
    videos: 'Videos',
    shop: 'Shop',
    profile: 'Profile',
    preferences: 'Preferences',
    referral: 'Referrals',
    notifications: 'Notifications',
    selfKnowledge: 'Self-knowledge',
    gifts: 'Gift',
    help: 'Help',
    logout: 'Log out',
  },
  es: {
    dashboard: 'Panel',
    home: 'Inicio',
    more: 'Más',
    planning: 'Planificación',
    programmes: 'Programas',
    blog: 'Blog',
    videos: 'Videos',
    shop: 'Tienda',
    profile: 'Perfil',
    preferences: 'Preferencias',
    referral: 'Referidos',
    notifications: 'Notificaciones',
    selfKnowledge: 'Autoconocimiento',
    gifts: 'Regalar',
    help: 'Ayuda',
    logout: 'Cerrar sesión',
  },
};

/** Libellé de la formule pour la feuille « Plus » (null = rien à afficher). */
export function comptePlanLabel(tier: string | null | undefined, lang: ClientLang): string | null {
  const labels: Record<ClientLang, Record<string, string>> = {
    fr: { online_group_monthly: 'Visio collectif · actif', online_individual_monthly: 'Visio individuel · actif', none: 'Sans abonnement actif' },
    es: { online_group_monthly: 'Visio grupal · activo', online_individual_monthly: 'Visio individual · activo', none: 'Sin suscripción activa' },
    en: { online_group_monthly: 'Group online · active', online_individual_monthly: 'Individual online · active', none: 'No active plan' },
  };
  if (!tier) return labels[lang].none;
  return labels[lang][tier] ?? null;
}
