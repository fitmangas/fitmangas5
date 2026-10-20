import { NextResponse } from 'next/server';

import { FORGOT_PASSWORD_PATH, NEW_PASSWORD_PATH } from '@/lib/auth/password-shared';
import { isPlausibleTokenHash, RESET_TOKEN_COOKIE, RESET_TOKEN_MAX_AGE_S } from '@/lib/auth/password-reset';

/**
 * Lien de l'e-mail « mot de passe oublié ». Ne consomme pas le jeton (un antivirus qui ouvre le lien
 * ne le grille pas) : il le range dans un cookie httpOnly et redirige vers une adresse sans jeton.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const es = searchParams.get('lang') === 'es';

  if (!isPlausibleTokenHash(tokenHash)) {
    return NextResponse.redirect(`${origin}${FORGOT_PASSWORD_PATH}?erreur=lien${es ? '&lang=es' : ''}`);
  }

  const response = NextResponse.redirect(`${origin}${NEW_PASSWORD_PATH}${es ? '?lang=es' : ''}`);
  response.cookies.set(RESET_TOKEN_COOKIE, tokenHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: RESET_TOKEN_MAX_AGE_S,
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
