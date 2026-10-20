'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';

import { submitNewPasswordAction } from '@/app/nouveau-mot-de-passe/actions';
import {
  PASSWORD_MIN_LENGTH,
  forgotPasswordHref,
  passwordFormErrorMessage,
  validateNewPassword,
} from '@/lib/auth/password-shared';

type Props = { lang: 'fr' | 'es'; canSubmit: boolean };

const COPY = {
  fr: {
    eyebrow: 'Compte client',
    title: 'Nouveau mot de passe',
    intro: `Choisis un mot de passe d’au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    password: 'Nouveau mot de passe',
    confirm: 'Confirme le mot de passe',
    show: 'Afficher',
    hide: 'Masquer',
    submit: 'Enregistrer',
    done: 'C’est fait : ton mot de passe est changé. Tu es connectée.',
    expired: 'Ce lien n’est plus valable (déjà utilisé ou expiré).',
    newLink: 'Recevoir un nouveau lien',
    back: 'Retour à la connexion',
  },
  es: {
    eyebrow: 'Cuenta cliente',
    title: 'Nueva contraseña',
    intro: `Elige una contraseña de al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    password: 'Nueva contraseña',
    confirm: 'Confirma la contraseña',
    show: 'Mostrar',
    hide: 'Ocultar',
    submit: 'Guardar',
    done: 'Listo: tu contraseña ha cambiado. Ya estás conectada.',
    expired: 'Este enlace ya no es válido (ya usado o caducado).',
    newLink: 'Recibir un enlace nuevo',
    back: 'Volver a la conexión',
  },
} as const;

const INPUT =
  'mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm outline-none ring-brand-accent/30 transition focus:ring-2';

export function NewPasswordForm({ lang, canSubmit }: Props) {
  const t = COPY[lang];
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(!canSubmit);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      setError(passwordFormErrorMessage(invalid, lang));
      return;
    }
    setLoading(true);
    try {
      const result = await submitNewPasswordAction({ password, confirm });
      if (result.ok) {
        setDone(true);
        window.setTimeout(() => {
          router.replace(result.redirectTo);
          router.refresh();
        }, 1500);
        return;
      }
      if (result.error === 'link_invalid') setExpired(true);
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
      <h1 className="mb-3 font-serif text-3xl italic text-brand-ink">{t.title}</h1>

      {done ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {t.done}
        </p>
      ) : expired ? (
        <div className="space-y-5">
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t.expired}</p>
          <Link
            href={forgotPasswordHref(lang)}
            className="flex w-full items-center justify-center rounded-full bg-brand-accent py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-lg hover:opacity-95"
          >
            {t.newLink}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-brand-ink/55">{t.intro}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="fm-label text-brand-ink/45">
              {t.password}
              <input
                type={visible ? 'text' : 'password'}
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={INPUT}
              />
            </label>
            <label className="fm-label text-brand-ink/45">
              {t.confirm}
              <input
                type={visible ? 'text' : 'password'}
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={INPUT}
              />
            </label>
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/45 hover:text-brand-accent"
            >
              {visible ? t.hide : t.show}
            </button>
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
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
