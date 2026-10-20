'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';

import { requestPasswordResetAction } from '@/app/mot-de-passe-oublie/actions';
import { passwordFormErrorMessage } from '@/lib/auth/password-shared';

type Props = { lang: 'fr' | 'es'; linkError?: boolean };

const COPY = {
  fr: {
    eyebrow: 'Compte client',
    title: 'Mot de passe oublié',
    intro: 'Indique l’e-mail de ton compte : tu reçois un lien pour choisir un nouveau mot de passe.',
    email: 'E-mail',
    submit: 'Recevoir le lien',
    sentTitle: 'Regarde tes e-mails',
    sent: 'Si un compte existe avec cette adresse, tu vas recevoir un e-mail dans quelques minutes. Pense à regarder dans les spams.',
    retry: 'Renvoyer avec une autre adresse',
    linkError: 'Ce lien n’est plus valable (déjà utilisé ou expiré). Demande un nouveau lien ci-dessous.',
    back: 'Retour à la connexion',
  },
  es: {
    eyebrow: 'Cuenta cliente',
    title: '¿Olvidaste tu contraseña?',
    intro: 'Indica el correo de tu cuenta: recibirás un enlace para elegir una contraseña nueva.',
    email: 'Correo',
    submit: 'Recibir el enlace',
    sentTitle: 'Revisa tu correo',
    sent: 'Si existe una cuenta con este correo, recibirás un mensaje en unos minutos. Revisa también la carpeta de spam.',
    retry: 'Probar con otro correo',
    linkError: 'Este enlace ya no es válido (ya usado o caducado). Pide un enlace nuevo aquí abajo.',
    back: 'Volver a la conexión',
  },
} as const;

export function ForgotPasswordForm({ lang, linkError = false }: Props) {
  const t = COPY[lang];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await requestPasswordResetAction({ email, locale: lang });
      if (result.ok) setSent(true);
      else setError(passwordFormErrorMessage(result.error, lang));
    } catch {
      setError(passwordFormErrorMessage('unknown', lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[32px] border border-brand-ink/[0.08] bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] sm:p-10">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">{t.eyebrow}</p>
      <h1 className="mb-3 font-serif text-3xl italic text-brand-ink">{sent ? t.sentTitle : t.title}</h1>

      {sent ? (
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-brand-ink/70" role="status">
            {t.sent}
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:underline"
          >
            {t.retry}
          </button>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-brand-ink/55">{t.intro}</p>
          {linkError ? (
            <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">{t.linkError}</p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="fm-label text-brand-ink/45">
              {t.email}
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm outline-none ring-brand-accent/30 transition focus:ring-2"
              />
            </label>
            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {t.submit}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 text-center">
        <Link href="/connexion" className="text-[10px] uppercase tracking-widest text-brand-ink/40 hover:text-brand-accent">
          {t.back}
        </Link>
      </div>
    </div>
  );
}
