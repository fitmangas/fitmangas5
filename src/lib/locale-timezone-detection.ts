export type DetectedLocale = 'fr' | 'es';

export function localeFromNavigatorLanguage(language: string | undefined | null): DetectedLocale {
  const normalized = language?.trim().toLowerCase() ?? '';
  if (normalized.startsWith('es')) return 'es';
  return 'fr';
}

export function detectBrowserLocale(): DetectedLocale {
  if (typeof navigator === 'undefined') return 'fr';
  return localeFromNavigatorLanguage(navigator.language);
}

export function detectBrowserTimeZone(): string {
  if (typeof Intl === 'undefined') return 'Europe/Paris';
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
}

export function localeLabel(locale: DetectedLocale, displayLang: DetectedLocale): string {
  if (locale === 'es') return displayLang === 'es' ? 'Español' : 'Espagnol';
  return displayLang === 'es' ? 'Francés' : 'Français';
}
