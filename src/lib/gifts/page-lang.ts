/** Langue de départ des pages publiques : `?lang=`, sinon le premier choix FR/ES du navigateur. */
export function giftPageLang(urlLang: string | undefined, acceptLanguage: string | null): { lang: 'fr' | 'es'; fromUrl: boolean } {
  if (urlLang === 'es' || urlLang === 'fr') return { lang: urlLang, fromUrl: true };
  const first = (acceptLanguage ?? '')
    .split(',')
    .map((part) => part.trim().split(';')[0]?.toLowerCase())
    .find((l) => l?.startsWith('fr') || l?.startsWith('es'));
  return { lang: first?.startsWith('es') ? 'es' : 'fr', fromUrl: false };
}
