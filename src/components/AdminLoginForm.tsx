'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogIn } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  initialError?: string;
};

export function AdminLoginForm({ initialError }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? '');

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

      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Connexion impossible pour le moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card mx-auto max-w-md p-8 sm:p-10">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-luxury-orange">Admin</p>
      <h1 className="mb-3 text-3xl font-semibold tracking-tight text-luxury-ink">Connexion privée</h1>
      <p className="mb-6 text-sm text-luxury-muted">
        Connecte-toi avec ton email administrateur pour accéder au tableau de bord.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/45 bg-white/35 px-4 py-3 text-sm text-luxury-ink outline-none backdrop-blur-sm ring-luxury-orange/25 transition focus:ring-2"
          />
        </label>
        <label className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-luxury-soft">
          Mot de passe
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/45 bg-white/35 px-4 py-3 text-sm text-luxury-ink outline-none backdrop-blur-sm ring-luxury-orange/25 transition focus:ring-2"
          />
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-xs text-red-800 backdrop-blur-sm">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="btn-luxury-primary flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Se connecter
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-[10px] uppercase tracking-[0.14em] text-luxury-soft transition hover:text-luxury-orange">
          Retour au site
        </Link>
      </div>
    </div>
  );
}
