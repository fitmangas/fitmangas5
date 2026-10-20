import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendEmail = vi.fn();
const generateLink = vi.fn();
const profileSingle = vi.fn();

vi.mock('@/lib/email/send', () => ({ sendEmail: (...args: unknown[]) => sendEmail(...args) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: { admin: { generateLink: (...args: unknown[]) => generateLink(...args) } },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => profileSingle() }) }) }),
  }),
}));

import { GET } from '@/app/auth/reinitialiser/route';

import {
  buildRecoveryUrl,
  isPlausibleTokenHash,
  passwordResetEmailContent,
  RESET_TOKEN_COOKIE,
  sendPasswordResetEmail,
} from './password-reset';

const TOKEN = 'a3f1c2d4e5b6a7980f1e2d3c4b5a69788f7e6d5c4b3a2918f7e6d5c4';

describe('mot de passe oublié — e-mail et lien', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://fitmangas.com');
    sendEmail.mockReset().mockResolvedValue({ ok: true, id: 'x', safeMode: 'send' });
    generateLink.mockReset();
    profileSingle.mockReset().mockResolvedValue({ data: { preferred_locale: 'es', first_name: 'Jenny' } });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('construit le lien vers /auth/reinitialiser (langue en paramètre)', () => {
    expect(buildRecoveryUrl('https://fitmangas.com', TOKEN, 'fr')).toBe(`https://fitmangas.com/auth/reinitialiser?token_hash=${TOKEN}`);
    expect(buildRecoveryUrl('https://fitmangas.com/', TOKEN, 'es')).toContain('&lang=es');
    expect(isPlausibleTokenHash(TOKEN)).toBe(true);
    expect(isPlausibleTokenHash('court')).toBe(false);
    expect(isPlausibleTokenHash('<script>alert(1)</script>xxxxxxxx')).toBe(false);
  });

  it('écrit un e-mail FR/ES avec le bouton et sans HTML injecté', () => {
    const fr = passwordResetEmailContent({ url: 'https://fitmangas.com/auth/reinitialiser?token_hash=abc', locale: 'fr', firstName: '<b>Jenny</b>' });
    expect(fr.subject).toBe('Choisis ton nouveau mot de passe FitMangas');
    expect(fr.html).toContain('Choisir mon mot de passe');
    expect(fr.html).toContain('&lt;b&gt;Jenny&lt;/b&gt;');
    expect(fr.text).toContain('https://fitmangas.com/auth/reinitialiser?token_hash=abc');
    const es = passwordResetEmailContent({ url: 'https://fitmangas.com/x', locale: 'es' });
    expect(es.subject).toBe('Elige tu nueva contraseña de FitMangas');
  });

  it('envoie l’e-mail dans la langue du profil', async () => {
    generateLink.mockResolvedValue({ data: { properties: { hashed_token: TOKEN }, user: { id: 'u1' } }, error: null });
    const result = await sendPasswordResetEmail({ email: 'jenny@exemple.fr', locale: 'fr' });
    expect(result).toEqual({ sent: true });
    expect(generateLink).toHaveBeenCalledWith({ type: 'recovery', email: 'jenny@exemple.fr' });
    const sent = sendEmail.mock.calls[0][0] as { to: string; subject: string; html: string };
    expect(sent.to).toBe('jenny@exemple.fr');
    expect(sent.subject).toMatch(/contraseña/);
    expect(sent.html).toContain(`token_hash=${TOKEN}`);
  });

  it('n’envoie rien si le compte n’existe pas', async () => {
    generateLink.mockResolvedValue({ data: null, error: { message: 'User not found' } });
    const result = await sendPasswordResetEmail({ email: 'inconnue@exemple.fr' });
    expect(result.sent).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('/auth/reinitialiser', () => {
  it('range le jeton dans un cookie httpOnly et redirige sans jeton dans l’adresse', async () => {
    const res = await GET(new Request(`https://fitmangas.com/auth/reinitialiser?token_hash=${TOKEN}&lang=es`));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://fitmangas.com/nouveau-mot-de-passe?lang=es');
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${RESET_TOKEN_COOKIE}=${TOKEN}`);
    expect(cookie.toLowerCase()).toContain('httponly');
  });

  it('renvoie vers « mot de passe oublié » si le lien est abîmé', async () => {
    const res = await GET(new Request('https://fitmangas.com/auth/reinitialiser?token_hash=%3Cx%3E'));
    expect(res.headers.get('location')).toBe('https://fitmangas.com/mot-de-passe-oublie?erreur=lien');
    expect(res.headers.get('set-cookie')).toBeNull();
  });
});
