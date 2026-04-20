'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, LogIn, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ClientLoginModal({ open, onClose }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      onClose();
      router.replace('/compte');
      router.refresh();
    } catch {
      setError('Connexion impossible pour le moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-brand-ink/40 p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md rounded-t-[32px] border border-brand-ink/[0.06] bg-white shadow-2xl sm:rounded-[32px]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-login-title"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-brand-ink/40 transition hover:bg-brand-sand/40 hover:text-brand-ink"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="border-b border-brand-ink/[0.06] px-8 pb-6 pt-8">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.35em] text-brand-accent">Compte client</p>
              <h2 id="client-login-title" className="font-serif text-2xl italic tracking-tight text-brand-ink">
                Se connecter
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-brand-ink/55">
                Accède à ton espace client, ton planning et tes replays.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-8 py-8">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                E-mail
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                />
              </label>

              <label className="block text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">
                Mot de passe
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-brand-ink/[0.08] bg-brand-beige/40 px-4 py-3 text-sm text-brand-ink outline-none ring-brand-accent/30 transition focus:ring-2"
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={16} />}
                Se connecter
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
