/**
 * Prénom pour les e-mails : uniquement first_name, format « Marie » (pas le nom de famille).
 */
export function formatEmailFirstName(firstName: string | null | undefined): string {
  if (typeof firstName !== 'string') return '';
  const trimmed = firstName.trim();
  if (!trimmed) return '';
  const token = trimmed.split(/\s+/)[0]?.trim();
  if (!token) return '';
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}
