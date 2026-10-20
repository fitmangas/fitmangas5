'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { changePasswordAction } from '@/app/compte/profil/password-actions';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  PASSWORD_MIN_LENGTH,
  forgotPasswordHref,
  passwordFormErrorMessage,
  validateNewPassword,
  type AuthLang,
} from '@/lib/auth/password-shared';

const COPY: Record<AuthLang, Record<string, string>> = {
  fr: {
    title: 'Mot de passe',
    intro: `Pour le changer, indique ton mot de passe actuel puis le nouveau (${PASSWORD_MIN_LENGTH} caractères minimum).`,
    current: 'Mot de passe actuel',
    next: 'Nouveau mot de passe',
    confirm: 'Confirme le nouveau',
    submit: 'Changer le mot de passe',
    done: 'Ton mot de passe est changé.',
    forgot: 'Mot de passe actuel oublié ?',
  },
  es: {
    title: 'Contraseña',
    intro: `Para cambiarla, indica tu contraseña actual y luego la nueva (mínimo ${PASSWORD_MIN_LENGTH} caracteres).`,
    current: 'Contraseña actual',
    next: 'Nueva contraseña',
    confirm: 'Confirma la nueva',
    submit: 'Cambiar la contraseña',
    done: 'Tu contraseña ha cambiado.',
    forgot: '¿Olvidaste tu contraseña actual?',
  },
  en: {
    title: 'Password',
    intro: `To change it, enter your current password, then the new one (at least ${PASSWORD_MIN_LENGTH} characters).`,
    current: 'Current password',
    next: 'New password',
    confirm: 'Confirm the new one',
    submit: 'Change password',
    done: 'Your password has been changed.',
    forgot: 'Forgot your current password?',
  },
};

const INPUT =
  'mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-luxury-ink outline-none ring-luxury-orange/30 transition focus:ring-2';

export function ProfilePasswordCard({ lang }: { lang: AuthLang }) {
  const t = COPY[lang] ?? COPY.fr;
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setDone(false);
    const invalid = validateNewPassword(password, confirm);
    if (invalid) {
      setError(passwordFormErrorMessage(invalid, lang));
      return;
    }
    setLoading(true);
    try {
      const result = await changePasswordAction({ current, password, confirm });
      if (result.ok) {
        setDone(true);
        setCurrent('');
        setPassword('');
        setConfirm('');
      } else {
        setError(passwordFormErrorMessage(result.error, lang));
      }
    } catch {
      setError(passwordFormErrorMessage('unknown', lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard id="mot-de-passe" className="scroll-mt-28 p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-luxury-soft">{t.title}</p>
      <p className="mt-2 text-sm text-luxury-muted">{t.intro}</p>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-luxury-soft">
          {t.current}
          <input
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-luxury-soft">
          {t.next}
          <input
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-luxury-soft">
          {t.confirm}
          <input
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={INPUT}
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 md:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-luxury-ghost inline-flex min-h-[36px] items-center gap-2 px-4 py-1.5 text-xs tracking-[0.12em] disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {t.submit}
          </button>
          <Link href={forgotPasswordHref(lang === 'es' ? 'es' : 'fr')} className="text-xs text-luxury-orange underline-offset-4 hover:underline">
            {t.forgot}
          </Link>
        </div>
        {error ? (
          <p className="text-xs text-rose-700 md:col-span-3" role="alert">
            {error}
          </p>
        ) : null}
        {done ? (
          <p className="text-xs text-emerald-700 md:col-span-3" role="status">
            {t.done}
          </p>
        ) : null}
      </form>
    </GlassCard>
  );
}
