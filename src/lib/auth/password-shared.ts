/**
 * Mot de passe : règles et textes partagés (navigateur + serveur, sans dépendance serveur).
 * Mot de passe oublié → /mot-de-passe-oublie ; lien reçu par email → /auth/reinitialiser → /nouveau-mot-de-passe.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const FORGOT_PASSWORD_PATH = '/mot-de-passe-oublie';
export const NEW_PASSWORD_PATH = '/nouveau-mot-de-passe';

export type AuthLang = 'fr' | 'es' | 'en';

export type PasswordFormError =
  | 'email_invalid'
  | 'too_short'
  | 'mismatch'
  | 'same_password'
  | 'weak_password'
  | 'link_invalid'
  | 'current_invalid'
  | 'rate_limited'
  | 'no_session'
  | 'unknown';

export function forgotPasswordHref(lang: AuthLang | 'FR' | 'ES' = 'fr'): string {
  return String(lang).toLowerCase() === 'es' ? `${FORGOT_PASSWORD_PATH}?lang=es` : FORGOT_PASSWORD_PATH;
}

/** Adresse e-mail nettoyée (minuscules, sans espaces) ou null si invalide. */
export function normalizeEmailInput(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

/** Contrôle avant tout appel serveur : longueur et confirmation. */
export function validateNewPassword(password: unknown, confirm: unknown): PasswordFormError | null {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) return 'too_short';
  if (password !== confirm) return 'mismatch';
  return null;
}

/** Erreur Supabase de `updateUser({ password })` → code affichable. */
export function passwordUpdateErrorCode(error: { message?: string | null; code?: string | null } | null | undefined): PasswordFormError {
  const code = (error?.code ?? '').toLowerCase();
  const msg = (error?.message ?? '').toLowerCase();
  if (code === 'same_password' || msg.includes('different from the old password')) return 'same_password';
  if (code === 'weak_password' || msg.includes('weak') || msg.includes('pwned') || msg.includes('at least')) return 'weak_password';
  if (code === 'reauthentication_needed' || msg.includes('reauthenticat')) return 'link_invalid';
  if (code === 'session_not_found' || msg.includes('session missing') || msg.includes('not logged in')) return 'no_session';
  if (code === 'over_request_rate_limit' || msg.includes('rate limit') || msg.includes('too many')) return 'rate_limited';
  return 'unknown';
}

const FORM_ERRORS: Record<AuthLang, Record<PasswordFormError, string>> = {
  fr: {
    email_invalid: 'Indique une adresse e-mail valide.',
    too_short: `Ton mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    mismatch: 'Les deux mots de passe ne sont pas identiques.',
    same_password: 'Choisis un mot de passe différent de l’ancien.',
    weak_password: 'Ce mot de passe est trop facile à deviner. Choisis-en un plus long ou plus original.',
    link_invalid: 'Ce lien n’est plus valable (déjà utilisé ou expiré). Demande un nouveau lien.',
    current_invalid: 'Ton mot de passe actuel est incorrect.',
    rate_limited: 'Trop de tentatives. Réessaie dans une heure.',
    no_session: 'Ta session a expiré. Reconnecte-toi.',
    unknown: 'Impossible de changer le mot de passe pour le moment. Réessaie ou écris-nous.',
  },
  es: {
    email_invalid: 'Indica un correo válido.',
    too_short: `Tu contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    mismatch: 'Las dos contraseñas no coinciden.',
    same_password: 'Elige una contraseña diferente de la anterior.',
    weak_password: 'Esta contraseña es demasiado fácil de adivinar. Elige una más larga u original.',
    link_invalid: 'Este enlace ya no es válido (ya usado o caducado). Pide un enlace nuevo.',
    current_invalid: 'Tu contraseña actual es incorrecta.',
    rate_limited: 'Demasiados intentos. Vuelve a intentarlo en una hora.',
    no_session: 'Tu sesión ha caducado. Vuelve a conectarte.',
    unknown: 'No se pudo cambiar la contraseña por ahora. Inténtalo de nuevo o escríbenos.',
  },
  en: {
    email_invalid: 'Enter a valid email address.',
    too_short: `Your password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    mismatch: 'The two passwords do not match.',
    same_password: 'Choose a password different from the old one.',
    weak_password: 'This password is too easy to guess. Choose a longer or more original one.',
    link_invalid: 'This link is no longer valid (already used or expired). Request a new link.',
    current_invalid: 'Your current password is incorrect.',
    rate_limited: 'Too many attempts. Try again in an hour.',
    no_session: 'Your session has expired. Please sign in again.',
    unknown: 'The password could not be changed right now. Try again or contact us.',
  },
};

export function passwordFormErrorMessage(error: PasswordFormError, lang: AuthLang = 'fr'): string {
  return (FORM_ERRORS[lang] ?? FORM_ERRORS.fr)[error];
}

/** Message de connexion lisible à la place du texte anglais renvoyé par Supabase. */
export function loginErrorMessage(rawMessage: string | null | undefined, lang: AuthLang = 'fr'): string {
  const msg = (rawMessage ?? '').toLowerCase();
  const es = lang === 'es';
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return es
      ? 'Correo o contraseña incorrectos. ¿La olvidaste? Usa « ¿Olvidaste tu contraseña? ».'
      : 'E-mail ou mot de passe incorrect. Oublié ? Utilise « Mot de passe oublié ? ».';
  }
  if (msg.includes('email not confirmed')) {
    return es
      ? 'Tu correo todavía no está confirmado. Abre el correo de confirmación o escríbenos.'
      : 'Ton adresse e-mail n’est pas encore confirmée. Ouvre l’e-mail de confirmation ou écris-nous.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return es ? 'Demasiados intentos. Espera unos minutos.' : 'Trop de tentatives. Patiente quelques minutes.';
  }
  return es ? 'No se puede conectar por el momento.' : 'Connexion impossible pour le moment.';
}
