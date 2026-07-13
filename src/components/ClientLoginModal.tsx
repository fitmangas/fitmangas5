'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, LogIn, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { updateDetectedTimezoneOnLogin } from '@/app/auth/detected-preferences/actions';
import { resolvePostLoginRedirectAction } from '@/app/auth/post-login/actions';
import { detectBrowserTimeZone } from '@/lib/locale-timezone-detection';
import { createClient } from '@/lib/supabase/client';
import type { Language } from '@/types';

type Props = {
  open: boolean;
  onClose: () => void;
  lang?: Language;
  /** Message affiché quand la redirection impose la connexion (ex. espace membre). */
  loginRequiredMessage?: string;
};

export function ClientLoginModal({ open, onClose, lang = 'FR', loginRequiredMessage }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t =
    lang === 'ES'
      ? {
          close: 'Cerrar',
          eyebrow: 'Cuenta cliente',
          title: 'Conectarse',
          intro: 'Accede a tu espacio cliente, tu planificación y tus replays.',
          password: 'Contraseña',
          fallbackError: 'No se puede conectar por el momento.',
          submit: 'Conectarse',
        }
      : {
          close: 'Fermer',
          eyebrow: 'Compte client',
          title: 'Se connecter',
          intro: 'Accède à ton espace client, ton planning et tes replays.',
          password: 'Mot de passe',
          fallbackError: 'Connexion impossible pour le moment.',
          submit: 'Se connecter',
        };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      await updateDetectedTimezoneOnLogin(detectBrowserTimeZone());
      onClose();
      const { path } = await resolvePostLoginRedirectAction();
      router.replace(path);
      router.refresh();
    } catch {
      setError(t.fallbackError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-ink/40 p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
          data-overlay-dismiss
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[28px] border border-brand-ink/[0.06] bg-white shadow-2xl sm:max-h-none sm:max-w-md sm:rounded-[32px]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-login-title"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full p-2 text-brand-ink/40 transition hover:bg-brand-sand/40 hover:text-brand-ink sm:right-4 sm:top-4"
              aria-label={t.close}
            >
              <X size={18} />
            </button>

            <div className="border-b border-brand-ink/[0.06] px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.35em] text-brand-accent">{t.eyebrow}</p>
              <h2 id="client-login-title" className="font-serif text-xl italic tracking-tight text-brand-ink sm:text-2xl">
                {t.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-brand-ink/55">
                {loginRequiredMessage ?? t.intro}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 px-5 py-6 sm:space-y-4 sm:px-8 sm:py-8">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                E-mail
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-2.5 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2 sm:py-3"
                />
              </label>

              <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                {t.password}
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-2.5 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2 sm:py-3"
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent py-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-lg transition hover:opacity-95 disabled:opacity-60 sm:py-4"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={16} />}
                {t.submit}
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
