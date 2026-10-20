import { describe, expect, it } from 'vitest';

import {
  forgotPasswordHref,
  loginErrorMessage,
  normalizeEmailInput,
  passwordFormErrorMessage,
  passwordUpdateErrorCode,
  validateNewPassword,
} from './password-shared';

describe('mot de passe — règles partagées', () => {
  it('nettoie et valide l’e-mail', () => {
    expect(normalizeEmailInput('  Jenny@Exemple.FR ')).toBe('jenny@exemple.fr');
    expect(normalizeEmailInput('pas-un-email')).toBeNull();
    expect(normalizeEmailInput(42)).toBeNull();
  });

  it('exige 8 caractères et deux saisies identiques', () => {
    expect(validateNewPassword('court', 'court')).toBe('too_short');
    expect(validateNewPassword('assez-long-1', 'assez-long-2')).toBe('mismatch');
    expect(validateNewPassword('assez-long-1', 'assez-long-1')).toBeNull();
  });

  it('traduit les erreurs Supabase de changement de mot de passe', () => {
    expect(passwordUpdateErrorCode({ code: 'same_password' })).toBe('same_password');
    expect(passwordUpdateErrorCode({ message: 'New password should be different from the old password.' })).toBe(
      'same_password',
    );
    expect(passwordUpdateErrorCode({ code: 'weak_password', message: 'Password is known to be weak' })).toBe('weak_password');
    expect(passwordUpdateErrorCode({ message: 'Auth session missing!' })).toBe('no_session');
    expect(passwordUpdateErrorCode({ message: 'boom' })).toBe('unknown');
  });

  it('remplace le message anglais de connexion par un message clair FR/ES', () => {
    expect(loginErrorMessage('Invalid login credentials', 'fr')).toMatch(/Mot de passe oublié/);
    expect(loginErrorMessage('Invalid login credentials', 'es')).toMatch(/Olvidaste/);
    expect(loginErrorMessage('Email not confirmed', 'fr')).toMatch(/pas encore confirmée/);
    expect(loginErrorMessage(undefined, 'fr')).toBe('Connexion impossible pour le moment.');
  });

  it('donne le lien « mot de passe oublié » dans la bonne langue', () => {
    expect(forgotPasswordHref('fr')).toBe('/mot-de-passe-oublie');
    expect(forgotPasswordHref('ES')).toBe('/mot-de-passe-oublie?lang=es');
    expect(passwordFormErrorMessage('link_invalid', 'es')).toMatch(/enlace/);
  });
});
